# Testing HANGAR

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

This is the developer-facing guide: which command to run when, what each one costs, and the small
number of traps that have already cost real time. The per-phase validation contract — the sampling
rates, the Nyquist argument behind them and the per-task verification map — lives in each phase's
`XX-VALIDATION.md` (`.planning/phases/03-vendor-the-domain/03-VALIDATION.md` for the vendored
simulator, `.planning/phases/02-walking-skeleton/02-VALIDATION.md` for the protocol and transport
work) and is not repeated here.

## How to run it

**Re-measured whole on 2026-09-10 at the Phase 11 gate (plan 11-16)**, on this machine (Windows 11,
Node v24.14.0), against a fresh `npm run build`, on the tree at `721e5fa` carrying the gate's own six
corrections (the ones its two commits describe), with **6.3–6.8 GB of 15.26 GB of memory free**
throughout. Wall times are the whole command including npm and process startup, each command run
alone in the order below; the parenthesised figure is the runner's own reported duration. Every
number here is **observed**, never predicted — the tree is shared between phases, so a row that was
guessed rather than run is worse than no row at all. The catalog under these numbers is
**twenty-nine configurations, twenty of them hand-authored Lua**; the figures they replace were
taken at thirty-six and twenty-seven on 2026-09-09 (Phase 10's gate, commit `305e425`), and before
that at sixteen and seven. The Phase 10 figure is kept in each row so the movement is visible.

> **AMENDMENT, plan 11-01, 2026-09-09. THE CATALOG IS NOW TWENTY-SEVEN CONFIGURATIONS, EIGHTEEN OF
> THEM HAND-AUTHORED LUA.** The user's bench report asked for nine to be removed — HOLD, KEYS, LEARN,
> SWITCH, ETCH, GRIDLOCK, LIFE, SLAM and TABLE — and 11-01 removed them. **Every measured row in this
> document was observed at thirty-six and is left exactly as it was observed**, because a measurement
> rewritten to match a later tree is no longer a measurement. Plan 11-16 re-measures the whole set
> against the phase's closing build and is the plan that moves these numbers. Where a count below
> describes what the catalog IS rather than what a run reported, it has been corrected in place and
> says so.

> **AMENDMENT, plan 11-16, 2026-09-10. THE CATALOG CLOSES PHASE 11 AT TWENTY-NINE CONFIGURATIONS,
> TWENTY OF THEM HAND-AUTHORED LUA.** Plan 11-15 added WHEELS and plan 11-14 added RADAR POINTS beside
> the RADAR preset, by the user's `new-entry` answer. The table below is the gate's re-measurement of
> every row, with the Phase 10 figure kept beside each; the per-file counts, the chains and every
> projection the phase's planner got wrong are in "Phase 11's suites, measured at the gate" below.

| Command                      | Covers                                                               | Measured                                                                                                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`              | `svelte-check` over the whole project                                | **582 files, 0 errors, 0 warnings**; 10 s wall, 6.67 GB free _(was 584 / 8 s: nine sources deleted, three specs and four sources created)_                                                                                      |
| `npm run lint`               | `prettier --check .` then `eslint .`                                 | exit 0; 38 s wall, 6.65 GB free _(was 16 s; one reading, unexplained, and it is a formatter over a tree with eighteen more SUMMARYs)_                                                                                           |
| `npm run build`              | `gen-og.mjs`, `vite build`, `postbuild.mjs`                          | exit 0; **28 s wall** at 6.72 GB free, of which `vite build` reports 1.18 s + 5.93 s; `gen-og.mjs` renders **29** images; the source archive is 1,649 KB _(was 10 s; see the cost table below — a single reading, not a trend)_ |
| `npm run test:quick`         | the `server` Vitest project — everything except the four sweeps      | **84 files, 869 passed + 1 todo (870)**; 37 s wall (35.08 s) at 6.83 GB free, and 37 s (36.48 s) again after the build _(was 81 / 828, 32 s)_                                                                                   |
| `npm run test:sweep`         | the `sweep` project: four files, and most of its cost is one of them | **4 files, 19 tests**; 114 s wall (111.85 s) at 6.80 GB free _(was 93 s at thirty-six entries; `BASE_SWEEP_WALL` is 11-01's 134 s at 3.0 GB free — see the cost table)_                                                         |
| `npm run test:unit -- --run` | both Vitest projects in one run                                      | **not re-run at this gate.** It is the sum of the two rows above, **88 files / 888 tests**, arithmetic rather than an observation                                                                                               |
| `npm run test:e2e`           | Playwright over the built site through `wrangler dev`, two projects  | **105 tests (86 chromium, 19 webkit-phone)** at `--workers 3`; 2.1 m runner time, 137 s wall including the cold start, 6.29 GB free at start _(was 103 / 1.8 m / 109 s)_                                                        |
| `npm run licenses`           | `gen-licenses.mjs` over the production dependency tree               | **not re-run at this gate**; no dependency was installed, removed or bumped in Phase 11. Phase 10's reading: exit 0; 12 s wall; five production dependencies, Inter and Grifter recorded, **no Quicksand anywhere**             |

**The counts reconcile across the three commands, and that is worth one line:** `test:quick` is 84
files / 869 tests, `test:sweep` is 4 / 19, so `test:unit` must be **88 / 888**. A combined run that
does not add up is a project-routing bug, not a rounding difference. **That sum is arithmetic, not an
observation, and it is marked as such** — Phase 9's row was measured and neither gate's since has been.

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

**Phase 13 hands this gate negative deltas, and plan 13-01 drove it backwards before any deletion
landed** (2026-09-11, on the clean tree at `eb79e3c`, quick `85 / 887 + 1 todo`). Three scratch
plants, each restored from a copy and sha256-identical either side, never through `git checkout`:
(a) one `it(...)` in `src/lib/browse/sort.spec.ts` fenced in a block comment with the file kept -
`check-counts.mjs 85 886` green (exit 0), `85 887` red (exit 1, `tests: observed 886, expected 887`);
(b) `src/lib/sim/demo.spec.ts` (two tests) moved out of the tree - `84 885` green (exit 0), `85 885`
red on the files line (`files: observed 84, expected 85`), `84 887` red on the tests line, `85 887` red
on both, and the two lines are different strings, which is the distinction a plan that deletes tests
and keeps the file (13-04) and a plan that deletes the file (13-07, 13-09, 13-10) both rest on; (c) the
todo read `1` in all three runs and is reported, never asserted. The script needed no change: it
compares two integers and rejects only a negative _expected_ total, which no plan produces, so the
research's Wave 0 gap named the wrong exposure and the real two are (a) and (c). **The tree's one todo
is `src/lib/fidelity/firmware-oracle.spec.ts:209`**, a file no Phase 13 plan touches; the whole of
`src/` was grepped for `it.todo` and `test.todo` and no other file carries one, so none of the files
this phase deletes can move the todo under a gate that does not watch it. This paragraph was appended
by 13-01 and nothing above or below it was reflowed; 12-12 and 13-20 each rewrite this document at
their own close and should treat it the same way.

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
leaving twenty-seven entries, eighteen of them hand-authored, and plans 11-15 and 11-14 added WHEELS
and RADAR POINTS, so Phase 11 closes at twenty-nine entries, twenty of them hand-authored** — see the
amendments at the top of this document for why the measured figures below still read thirty-six, and
"Phase 11's suites, measured at the gate" for the re-measurement. Every count and cost below was re-observed on **2026-09-07
at commit `36a1965`** by running each file on its own; the cost is that single-file run's reported
duration, which includes transform and import and is therefore dominated by startup for the cheap
ones.

| File                                   | Tests | Cost   | What it holds                                                                                                                                               |
| -------------------------------------- | ----- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/catalog/catalog.spec.ts`      | 10    | 0.58 s | the entry shape: unique ids, the preview kind derived from the source kind, knob ids and defaults that index their own value lists                          |
| `src/lib/catalog/listing.spec.ts`      | 5     | 0.65 s | the browse listing restated against `CATALOG` field by field, in both directions, and the quiet line every non-animated entry owes                          |
| `src/lib/catalog/front-door.spec.ts`   | 8     | 0.57 s | the eight-entry ring and the partition: the row plus the exclusion list is exactly `CATALOG`, and the failure names the missing id                          |
| `src/lib/catalog/frames.spec.ts`       | 5     | 1.25 s | the golden-frame fixture: every entry renders, every recorded hash still matches, and the fixture covers the catalog exactly                                |
| `src/lib/catalog/copy.spec.ts`         | 5     | 0.60 s | the Copywriting Contract over catalog copy, `KNOWN_TAGS` gated in both directions, and the census (plan 09-02)                                              |
| `src/lib/catalog/host-surface.spec.ts` | 4     | 0.69 s | the D-07 gate: every call site in every hand-authored entry classified against the surface `lua-host.ts` registers (plan 09-01)                             |
| `src/lib/catalog/audition.spec.ts`     | 4     | 0.63 s | the shape of `docs/HARDWARE-AUDITION.md`: its rows (thirty-two then; twenty-five since Phase 11), its numbering, its reasons and the install-order sentence |
| `src/lib/sim/lua-host.spec.ts`         | 9     | 0.47 s | the Grid API the VM is handed - `led`, timers, MIDI, the element table - and the globals a configuration may not reach                                      |
| `src/lib/sim/lua-smoke.spec.ts`        | 3     | 0.93 s | the end-to-end shape: every hand-authored entry boots a VM, runs a scripted gesture, and sends MIDI or HID                                                  |
| `src/lib/fidelity/lua-parity.spec.ts`  | 5     | 0.98 s | the nine shelf presets rendered twice - once by the vendored simulator, once by real Lua - and asserted equal                                               |
| `src/lib/sim/lazy.spec.ts`             | 3     | 0.30 s | the fast half of D-14: the catalog reaches no engine, `engine.ts` reaches the Lua wrapper only dynamically, one module names the VM                         |
| `src/lib/catalog/library.spec.ts`      | 3     | 0.62 s | the touch library (12-07): its canonical cost under the pinned minifier, its naming, and its own Lua past both class gates                                  |

**The catalog gate that is not in that table is not in the quick run.**
`src/lib/catalog/lua-entries.sweep.spec.ts` — the CONT-02 gate on every hand-authored entry:
canonical compressed form, both 908-character budgets across the whole knob cross-product, the
restricted Lua subset, and token separability — reports **6 tests in 4.54 s** run alone under
`--project sweep`, of which **3.89 s is test time** (2026-09-07, twice, 4.54 s and 4.37 s). It moved
there in plan 09-01 under D-08; see the note under the How-to-run table. **It costs 701 knob
combinations over twenty-seven entries — 1,402 measured events**, by `Σ(knob arities) + 2` per entry,
the two corners being the `+2` licensed by the separability identity the same file proves. (Plan
10-08's colour sample took that to 1,728 / 3,456; at the Phase 11 gate it is **1,331 combinations /
2,662 measurements over twenty entries** — see the cost table under "Phase 11's suites".)

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

| File                                            | Tests | Cost alone | Why it is a sweep                                                                                                                                                                                           |
| ----------------------------------------------- | ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/tune/reachability.sweep.spec.ts`       | 2     | 75.8 s     | it costs all 32,852 reachable knob states of the nine shelf cards, with no sampling                                                                                                                         |
| `src/vendor/botor/tests/pad-invariants.test.js` | 9     | 36.2 s     | 4,860 labelled states: 1,620 kind combinations times three brightness levels                                                                                                                                |
| `src/lib/share/stamp-roundtrip.sweep.spec.ts`   | 2     | 1.6 s      | it round-trips every one of those states through the encoder and back                                                                                                                                       |
| `src/lib/catalog/lua-entries.sweep.spec.ts`     | 6     | 4.5 s      | 701 knob combinations over twenty-seven hand-authored entries when measured, 1,331 over twenty at the Phase 11 gate, each `compressScript`-d and budget-checked on both events (joined in plan 09-01, D-08) |

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
anywhere — observed between that plan's two commits. **Three of the twenty-nine images** (tpad,
ghost and morph) carry no lit LED at all and are exempted by their own declared `restsBlack`, not by
a list. It was four of thirty-six until plan 11-01 removed ETCH, three of twenty-seven after it, three
of twenty-nine once plans 11-15 and 11-14 added two entries that do not rest black, and three of
thirty-four before ETCH arrived in plan 09-08.

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

SINCE PLAN 12-07 EVERY INSTALL WRITES THREE STRINGS, NOT TWO, AND THE THIRD DIFFERS BY ENTRY.
12-02 put element 255 event 0 on the wire and 12-03 put it in the install store; 12-07 filled it in:
a hand-authored entry lands HANGAR's touch library (`src/lib/catalog/library.ts`, 769 of 908) and a
preset lands the firmware's own page init, substituted from the empty string in one place,
`install.svelte.ts`'s `#pageInit`. Plan 12-12 rewrites every count in this document; 12-07 added the
row above and this paragraph.

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
`sim/demo.spec.ts` and `ui/font-assets.spec.ts` are written up in the tables above
(`tune/mix.spec.ts` was too, until 13-10 deleted it with MIX TWO under 13-CONTEXT D-12). `fidelity/vendored-diff.spec.ts`, `format-parity.spec.ts`, `licence-notices.spec.ts` and
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

## Phase 11's suites, measured at the gate

**Every count below was observed on 2026-09-10 at the Phase 11 gate (plan 11-16)**, on the tree at
`721e5fa` carrying the gate's own six corrections, from one `vitest run --project server` whose
per-file totals were read out of the runner's own JSON reporter rather than transcribed from a plan.
`.planning/phases/11-bench-corrections/11-VALIDATION.md` carried a _projected_ delta table, a
per-file table and a budget table from planning time; the tables here are the observations that
replace them, and every disagreement is named in "Where the planner was wrong" below rather than
corrected quietly. **Nothing in this section is hardware-verified**: no agent in Phase 11 connected
to a ZONA, wrote to one or deployed.

### The three files this phase created, and the fourth the gate does not count

| File                                  | Tests | What it holds                                                                                                                                                                                                           |
| ------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/catalog/decay-idiom.spec.ts` | **3** | the class-A gate: every decay pair in every hand-authored entry reaches phase 0, both idioms rescued verbatim from the deleted `life.ts` and `gridlock.ts` into its header, `KNOWN_VIOLATIONS` empty since 11-02        |
| `src/lib/catalog/touch-guard.spec.ts` | **3** | the class-B gate: every touch handler admits the coalesced fast tap (event code 9), with `DECLARED_EXCEPTIONS` holding `stage.ts` and `forge.ts` and their reasons                                                      |
| `src/lib/catalog/presets.spec.ts`     | **4** | HANGAR's ownership of the nine preset VALUES: every field of HANGAR's nine diffed against the vendored nine over the union of both objects' keys, refusing any difference not in `divergence.ts` with a reason and date |

`e2e/poll.ts` was created by 11-08.1 and is a fourth file with a `+0` term: it is a helper, not a
spec, and `e2e/` is in neither the vitest `server` project nor `svelte-check`'s reach. It carries one
phantom `grep -c "test("` hit in a comment that says exactly that, which is why the e2e source grep
is `cat e2e/*.e2e.ts | grep -c "test("` and not a glob over the directory.

**This phase deleted nine source files and the spec-file count still rose**, from 81 to 84.
`check-counts.mjs` counts test files; the nine deletions were entries, and `svelte-check` is where
the deletions show — 584 files became 582 (−9 entries, +3 specs, +4 sources: `presets.ts`,
`divergence.ts`, `wheels.ts`, `radar-points.ts`).

### The files this phase touched without creating

| File                                       | Tests            | Moved by                                                                                                                                                                                                                  |
| ------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/sim/lua-smoke.spec.ts`            | 3 → **25**       | **thirteen plans, +22**: 11-02 +2, 11-04 +1, 11-07 +4, 11-08 +2, 11-09 +2, 11-09.1 +2, 11-09.2 +1, 11-10 +1, 11-11 +1, 11-12 +1, 11-13 +2, 11-14 +1, 11-15 +2                                                             |
| `src/lib/sim/host.spec.ts`                 | 18 → **21**      | 11-08.1 — a lost 2D context noticed by event and by paint-time guard, recovered by both, both listeners removed at teardown                                                                                               |
| `src/lib/fidelity/vendored-diff.spec.ts`   | 14 → **15**      | 11-03 — `intendedDivergence` reconstructed through the manifest, still hashing to upstream                                                                                                                                |
| `src/lib/fidelity/preset-baseline.spec.ts` | 19 → **20**      | 11-03 — the `INTENDED_DIVERGENCE` table whose absence of a row keeps D-08's STOP-and-report intact                                                                                                                        |
| `src/lib/sim/lua-host.spec.ts`             | 9 → **10**       | 11-10 — `gmss`                                                                                                                                                                                                            |
| `src/lib/catalog/host-surface.spec.ts`     | 4 → **5**        | 11-10 — `gmss` on the registered surface                                                                                                                                                                                  |
| `src/lib/tune/knobs.preset.spec.ts`        | 6 → **7**        | 11-06 — NINE PADS' appended `count` knob, and the six-knob ceiling                                                                                                                                                        |
| `src/lib/share/stamp.spec.ts`              | 8 → **9**        | 11-09 — POMODORO's first four indices unmoved; the `older` expectation for `xn33333` moved into this file with its reason                                                                                                 |
| `src/lib/browse/facets.spec.ts`            | **4** unchanged  | 11-01 — three literals and two floors moved inside; `FOR_TERMS` 10 → 8                                                                                                                                                    |
| `src/lib/catalog/audition.spec.ts`         | **4** unchanged  | 11-01 (`ROW_COUNT` 32 → 23), 11-15 (24), 11-14 (25, and the name parser widened to two-word names)                                                                                                                        |
| `src/lib/catalog/frames.spec.ts`           | **5** unchanged  | the fixture regenerated by eight plans - 11-01, 11-02, 11-06, 11-08, 11-12, 11-13, 11-15 and 11-14 (`git log -- src/lib/catalog/frames.json`); the spec never moved                                                       |
| `src/lib/fidelity/golden-frames.spec.ts`   | **11** unchanged | nothing - `golden-frames.json` is byte-unmoved since Phase 3 (`5d37780`), because it samples with no touch input and 11-04 changed a touch response; `11-VALIDATION.md:313` says it was regenerated in 11-04 and is wrong |
| `src/lib/browse/filter.spec.ts`            | **6** unchanged  | 11-01, 11-15, 11-14 — census literals only (`entries` 28 → 29 in the last)                                                                                                                                                |
| `src/lib/tune/colour-picker.spec.ts`       | **6** unchanged  | 11-14 — the split `12 / 7 / 4 / 5` → `13 / 7 / 4 / 5`                                                                                                                                                                     |
| `src/lib/catalog/front-door.spec.ts`       | **8** unchanged  | 11-16 — one comment, the rule's live reason written where the Phase 8 reason stood                                                                                                                                        |

### The standing gates, re-read at the gate rather than assumed

`src/lib/fidelity/firmware-oracle.spec.ts` **7 + 1 todo**, **byte-unedited since Phase 3** through a
phase that was allowed to edit `pad-sim.ts` — its seventh test runs straight through the comet site
11-04 changed and is the mechanical proof the phase walk was not touched (D-02);
`src/lib/fidelity/lua-parity.spec.ts` **5**; `src/lib/fidelity/golden-frames.spec.ts` **11**;
`src/lib/protocol-pin.spec.ts` **5**; `src/lib/sim/paint.spec.ts` **5**;
`src/lib/catalog/frames.spec.ts` **5**; `src/lib/sim/lazy.spec.ts` **3**;
`src/lib/format-parity.spec.ts` **3**; `src/lib/licence-notices.spec.ts` **7**;
`src/lib/pad/ready.spec.ts` **6**. The vendored suites in the quick run: `tests/pad.test.js` **176**
and `tests/pad-sim.test.js` **96**, their counts unchanged while one and five expectations inside them
moved under the manifest's `intendedDivergence` rows; `tests/pad-invariants.test.js` **9** runs in
the sweep. `src/lib/fidelity/preset-baseline.json` is byte-unchanged since Phase 3.

### e2e

| File                       | Titles    | What it holds                                                                                                                                                      |
| -------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `e2e/browse-webkit.e2e.ts` | 3 → **4** | 11-08.1's one new title, `@webkit`-tagged, so it runs on both projects: a pad whose 2D backing store is dropped gets its picture back. **6 → 8 runs** for +1 title |

**The two e2e numbers are different numbers.** `cat e2e/*.e2e.ts | grep -c "test("` reads **86**
source titles; `npx playwright test --list` reads **105 tests in 13 files**, which is 86 run by
`chromium` plus 19 `@webkit` titles run a second time by `webkit-phone`. A tagged title counts once
in the grep and twice in the run, so 11-08.1's one title moved the grep 85 → 86 and the run 103 → 105. A gate that checked only the grep would accept a run total two short and call it a match.

**`grep -c "test("` is a sound proof of a ZERO e2e term and is not a sound proof of a non-zero one.**
`11-VALIDATION.md`'s sampling-rate instruction says suite-running plans prove their term that way; it
was written when every term was zero. A non-zero term is proved by the run total, and only by it.

### The phase total, written as a chain

**Nothing below is a transcribed total.** `BASE_FILES`, `BASE_TESTS` and `BASE_E2E` were measured by
plan 11-01 on a clean tree at commit `b29a00f` — **81 / 828 / 103** — and every plan since carried a
stated delta against `PREV_*`. The gate is the one plan that asserts against `BASE_*`, and the two
ends meet:

```
BASE_TESTS 828
  +3 (11-01: decay-idiom created with 3)                         831
  +5 (11-02: touch-guard created with 3, lua-smoke +2)           836
  +2 (11-03: vendored-diff 14 -> 15, preset-baseline 19 -> 20)   838
  +1 (11-04: lua-smoke +1)                                       839
  +4 (11-05: presets created with 4)                             843
  +1 (11-06: knobs.preset 6 -> 7)                                844
  +4 (11-07: lua-smoke +4)                                       848
  +2 (11-08: lua-smoke +2)                                       850
  +3 (11-08.1: host 18 -> 21)                                    853
  +3 (11-09: lua-smoke +2, stamp 8 -> 9)                         856
  +2 (11-09.1: lua-smoke +2)                                     858
  +1 (11-09.2: lua-smoke +1)                                     859
  +3 (11-10: host-surface +1, lua-host +1, lua-smoke +1)         862
  +1 (11-11: lua-smoke +1)                                       863
  +1 (11-12: lua-smoke +1)                                       864
  +2 (11-13: lua-smoke +2)                                       866
  +1 (11-14: lua-smoke +1 - T14, under the answer new-entry)     867
  +2 (11-15: lua-smoke +2)                                       869
  +0 (11-16: the gate writes no tests)                           869
```

**Nineteen terms, one per plan, and the count of terms is itself asserted: nineteen plans, nineteen
terms.** It drifted twice in Phase 10 after being fixed, which is why it is a number under test rather
than a description. Every term above was checked against its plan's own `check-counts` line — the
observed `PREV_TESTS` sequence in the SUMMARYs is 828, 831, 836, 838, 839, 843, 844, 848, 850, 853,
856, 858, 859, 862, 863, 864, 866, then **868 and 869** — because 11-15 executed before 11-14, whose
checkpoint was open, so the two last terms landed in the other order and the end is the same 869.
`3+5+2+1+4+1+4+2+3+3+2+1+3+1+1+2+1+2+0 = 41`, and the eighteen fixed terms sum to **40** with `T14` the
nineteenth at **+1**. Observed at the gate: **84 files, 869 tests + 1 todo**, which is `BASE_FILES + 3`
and `BASE_TESTS + 41`. Every term agrees with its plan's own line; the disagreements are all with
documents, and they are named below.

```
BASE_FILES 81
  +1 (11-01) +1 (11-02) +0 (11-03) +0 (11-04) +1 (11-05)
  +0 (11-06) +0 (11-07) +0 (11-08) +0 (11-08.1) +0 (11-09) +0 (11-09.1) +0 (11-09.2)
  +0 (11-10) +0 (11-11) +0 (11-12) +0 (11-13) +0 (11-14) +0 (11-15) +0 (11-16)
  = 84
```

Nineteen terms — sixteen written-out zeros and three ones.

```
BASE_E2E 103 (85 chromium titles + 18 @webkit titles run twice)
  +0 (11-01: nine routes and nine OG images stop being generated; the suite run, 103)
  +0 (11-02) +0 (11-03) +0 (11-04)
  +0 (11-05: the preset entries change hands; the suite run, 103)
  +0 (11-06) +0 (11-07) +0 (11-08)
  +2 (11-08.1: one @webkit title; the suite run, 105)
  +0 (11-09) +0 (11-09.1) +0 (11-09.2) +0 (11-10) +0 (11-11) +0 (11-12) +0 (11-13) +0 (11-14)
  +0 (11-15: a new route and a new OG image; the suite run, 105)
  +0 (11-16: the suite run, 105)
  = 105, and the source grep 85 -> 86
```

Nineteen terms — eighteen written-out zeros and 11-08.1's `+2`. **Five plans ran the suite**: 11-01,
11-05, 11-08.1, 11-15 and 11-16.

```
BASE_CATALOG 36
  -9 (11-01: hold, keys, learn, switch, etch, gridlock, life, slam, table)      27
  +0 (11-02) +0 (11-03) +0 (11-04) +0 (11-05) +0 (11-06) +0 (11-07) +0 (11-08)
  +0 (11-08.1) +0 (11-09) +0 (11-09.1) +0 (11-09.2) +0 (11-10) +0 (11-11)
  +0 (11-12) +0 (11-13)                                                         27
  +1 (11-14: T14 = +1, the user's answer was new-entry - RADAR POINTS)          28
  +1 (11-15: WHEELS)                                                            29
  +0 (11-16)                                                                    29
  = 29, split 9 preset + 20 hand-authored Lua
```

Nineteen terms, fifteen of them written-out zeros. **The applicable row of 11-14's branch table is
`new-entry`**: `T14 = +1`, catalog 29, split 9 + 20, `static/og/` 29 files, audition 25 rows, phase
test total `BASE_TESTS + 41`. Every downstream number in this section is read from that row.

`svelte-check` moved **584 → 582**, always 0 errors and 0 warnings, in the same nineteen terms: −8
(11-01), +1 (11-02), +0, +0, +2 (11-05), +1 (11-06), ten zeros, +1 (11-14), +1 (11-15), +0. The sweep
is `4 19` at both ends; what it enumerates fell and then grew back, and the wall clock says so below.

### The cost, observed against what was projected

| Thing                             | Projected / carried                                                      | **Observed 2026-09-10**                                                                                 | Verdict                                                                                                                                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:sweep` wall         | `BASE_SWEEP_WALL` **134 s** at 3,010 MB free (11-01, before the removal) | **114 s wall (111.85 s runner)** at 6,795 MB free                                                       | **fell 20 s, −14.9 %.** The removal reached the sweep, and 11-01 saw it first at 120 s (−10.4 %); 11-02 then read 112 s and 11-03 read 134 s on the same tree, so the spread between readings is the machine. The catalog under this reading is 29, not 27: two entries grew back and the lua-entries count is 13 % above 11-01's |
| `npm run build`                   | 10 s (Phase 10 gate); 12.08 s (Phase 9)                                  | **28 s wall**, `vite build` 1.18 s + 5.93 s, `gen-og.mjs` 29 images, archive 1,649 KB                   | **slower by 18 s on one reading and not explained.** The vite steps account for 7 s; the rest is `gen-og.mjs` booting the Lua VM for twenty entries and `postbuild.mjs` archiving `git archive HEAD`. A single reading is not a trend; the second run after the gate's commits is in `11-16-SUMMARY.md`                           |
| `npm run test:e2e -- --workers 3` | 103 titles / 1.8 m runner / 109 s wall (Phase 10 gate)                   | **105 titles / 2.1 m runner / 137 s wall**, 6,294 MB free at start                                      | +2 runs for +28 s; 11-08.1's three clean runs read 2.4–2.6 m, so this is the fast end of what the tree has shown                                                                                                                                                                                                                  |
| `static/og/`                      | `BASE_OG_BYTES` **213,919 B over 36 files** (11-01)                      | **172,699 B over 29 files** (5,955 B mean)                                                              | −41,220 B, −7 files, under the `new-entry` row. 11-01 read 161,754 / 27; 11-15 read 166,516 / 28; 11-14 added `radar-points.png` at exactly 6,183 B. Rebuilt from empty by `gen-og.mjs` at the gate and byte-identical to the committed set                                                                                       |
| `reachability.sweep.spec.ts`      | 19,502 + 24,576 = 44,078 (Phase 10 gate)                                 | **20,782 + 24,576 = 45,358 in 107.9 s**; over budget 0; Pass B colours excluded 0                       | +1,280 states, all of them NINE PADS' Pass A doubling for its appended `count` knob (11-06); nothing else in the compiler route moved                                                                                                                                                                                             |
| `stamp-roundtrip.sweep.spec.ts`   | compiler 44,078; Lua 234,784 (Phase 10 gate)                             | **45,358** and **51,888 + 135,168 = 187,056** (format w 51,486, format x 382)                           | Lua route −47,728 (−20.3 %): nine entries out, two in                                                                                                                                                                                                                                                                             |
| `lua-entries.sweep.spec.ts`       | 1,728 combinations / 3,456 measurements over 27 (Phase 10 gate)          | **1,331 / 2,662 over 20**, 27 literals per colour knob                                                  | −397 combinations; 11-01 read 1,176, 11-15 read 1,271, 11-14 read 1,331                                                                                                                                                                                                                                                           |
| the kind cross-product            | 1,296 combinations, worst 906 of 908                                     | **1,296 in 3.2 s, worst 906 of 908** at `none/none/trackpad/hi=false/grid=false`                        | exact, unmoved by the phase                                                                                                                                                                                                                                                                                                       |
| TUNE-05's margin                  | `ninepads` 640 of 908, 268 free; `tpad` 907 of 908                       | **640 / 268 and 907 / 1**, the dearest hand-authored margin now **WHEELS 895 / 13** then STRIP 875 / 33 | the preset figures exact; the hand-authored ceiling is new and both cards were authored against the picker corner from the start                                                                                                                                                                                                  |
| `build/source-<sha>.tar.gz`       | 1,468 KB (Phase 10 gate)                                                 | **1,649 KB** (1,689,051 B)                                                                              | +181 KB, this phase's eighteen SUMMARYs and three documents                                                                                                                                                                                                                                                                       |
| `svelte-check`                    | 584                                                                      | **582** in 10 s                                                                                         | the chain above                                                                                                                                                                                                                                                                                                                   |

### The budget table, replaced by an observation

`11-VALIDATION.md`'s "The 908-character budget, per request" table projected a free-at-worst figure
per entry before the phase spent anything. Every hand-authored entry was measured at the gate at four
corners with the arithmetic the 908 gate uses (`max(text.length, measureLua(text))` after
`padReady()`), and the table is replaced rather than corrected:

| Entry        | Setup at defaults | Setup at the RGB444 picker corner | free  | Timer at defaults | Timer at the picker corner | free | `11-VALIDATION.md` said free (Setup / Timer) |
| ------------ | ----------------- | --------------------------------- | ----- | ----------------- | -------------------------- | ---- | -------------------------------------------- |
| wheels       | 882               | **895**                           | 13    | 338               | 343                        | 565  | not in the table (11-15 authored it)         |
| strip        | 857               | **875**                           | 33    | 0                 | 0                          | 908  | 266 / 908                                    |
| console      | 821               | **844**                           | 64    | 0                 | 0                          | 908  | 121 / 908                                    |
| quadrant     | 835               | 838                               | 70    | 0                 | 0                          | 908  | not in the table                             |
| euclid       | 786               | 790                               | 118   | 226               | 230                        | 678  | 204 / 688                                    |
| chorus       | 768               | 771                               | 137   | 173               | 174                        | 734  | 177 / 734                                    |
| lumen        | 742               | 746                               | 162   | 0                 | 0                          | 908  | 302 / 908                                    |
| pomodoro     | 733               | 743                               | 165   | 647               | 659                        | 249  | not in the table                             |
| forge        | 716               | 725                               | 183   | 373               | 380                        | 528  | 189 / 532                                    |
| morph        | 706               | 710                               | 198   | 0                 | 0                          | 908  | 400 / 908                                    |
| stage        | 640               | 653                               | 255   | 136               | 136                        | 772  | 399 / 799                                    |
| lattice      | 623               | 626                               | 282   | 171               | 172                        | 736  | 291 / 736                                    |
| snake        | 581               | 585                               | 323   | 870               | **880**                    | 28   | 327 / **36**                                 |
| cull         | 564               | 565                               | 343   | 0                 | 0                          | 908  | not in the table                             |
| sonar        | 558               | 559                               | 349   | 279               | 282                        | 626  | 475 / 627                                    |
| shuttle      | 540               | 540                               | 368   | 538               | 542                        | 366  | 245 / 707                                    |
| arc          | 520               | 523                               | 385   | 273               | 275                        | 633  | 527 / 656                                    |
| steps        | 473               | 479                               | 429   | 251               | 253                        | 655  | 518 / 655                                    |
| ghost        | 475               | 478                               | 430   | 418               | 422                        | 486  | 601 / 573                                    |
| radar-points | 579               | 579                               | 329   | 279               | 281                        | 627  | not in the table (11-14 authored it)         |
| tpad         | 902               | **907** (compiler route)          | **1** | 146               | 146                        | 762  | 1 / 762 (corrected in place, from 6)         |

Two things the table shows that no row of the projection could. **The tightest card in the catalog
is no longer tpad's preset but a hand-authored one**: WHEELS at 895 of 908 on the Setup, 13 free,
then STRIP at 875, then CONSOLE at 844. And **the corner the projection quoted was the wrong corner
for eight entries** — the declared-palette corner, or the defaults, rather than the RGB444 picker
corner the sweep reads since plan 10-08 — every one of them optimistic: CONSOLE, FORGE and STEPS
(found by 11-07), POMODORO and STAGE (11-09), SHUTTLE (11-12), STRIP (11-13) and SNAKE (this gate,
872 → 880 on the Timer, 36 free → 28). The other twelve hand-authored headers are right: CULL and
QUADRANT by construction (no colour knob, so the corners coincide), EUCLID, CHORUS, LATTICE, SONAR,
ARC, MORPH, LUMEN, GHOST and RADAR POINTS by the accident of already declaring `255,255,255`, and
WHEELS because it was authored against the picker corner. **Every one of the twenty headers now
quotes the corner the gate reads**, and nothing gates that: `lua-entries.sweep.spec.ts` measures the
picker corner and does not compare it to the header's sentence. Carried in `deferred-items.md`.

### Where the planner was wrong, named rather than corrected

A validation document whose estimates are never checked teaches the next phase to estimate
carelessly, so every row `11-VALIDATION.md` — and the gate's own plan — got wrong is named here.

1. **`lua-smoke.spec.ts`'s per-file row was `+8` across five plans, then `+21` across twelve, and it is
   `+22` across thirteen.** The original row (`11-VALIDATION.md:255` as first written) named 11-02,
   11-07, 11-08, 11-09 and 11-15; the revised row named twelve and left out **11-10's `+1`**, which
   the same document's plan-level table carries in 11-10's own row. Observed **3 → 25**. The plan-level
   table and the phase total were right; the per-file reference row was the defect, twice.
2. **The phase total is `BASE_TESTS + 41`, and two documents said `+40`.** `11-VALIDATION.md`'s
   phase-total row reads "+40, or +39 under `fold-into-sonar`" while its own per-task row for
   11-16-02 reads `+41 (or +40)`; plan 11-16's task text and success criteria say `+40` / `+39`, while
   its `<interfaces>` chain says `+41` / `+40`. The eighteen fixed terms sum to 40 and `T14` is +1: the
   documents that said +40 folded `T14` into the fixed terms once and then counted it again as
   "or +39".
3. **The gate's own plan carried a fixed-term string that contradicts its own chain.**
   `11-16:140` reads `3+5+2+1+4+1+4+2+3+3+2+1+2+1+1+2+2+0 = 39` with 11-10 at `+2`, four lines under
   a chain that gives 11-10 `+3` and says "observed +3 at execution". `11-VALIDATION.md:287`'s string
   reads `3+3+3+1+2` across 11-09, 11-09.1, 11-09.2 and 11-10 where its table's rows read `3, 2, 1, 3`
   — the same sum, the wrong terms. A chain that only sums right is a chain nobody can check term by
   term, which is the whole reason it is written out.
4. **Suite-running plans: three, then four, and it is five.** Three was written in `11-16:141` as
   first drafted, `11-VALIDATION.md:238` and its `PREV_E2E` row; four is what 11-15's own verification
   line says, omitting 11-08.1 — the one plan that MOVED the baseline. Five: 11-01, 11-05, 11-08.1,
   11-15, 11-16. 11-15 reported the disagreement rather than reconciling it; this is the
   reconciliation.
5. **"Seventeen terms — sixteen written-out zeros and three ones" was arithmetically impossible**
   when the phase had seventeen plans, and became true by coincidence when 11-09.1 and 11-09.2 were
   inserted. Coincidences do not survive the next insertion; the sentence is asserted here at
   nineteen because it was counted, not because it happens to work.
6. **11-07's and 11-08's plan-level terms were `+2` and `+1` in the validation document as first
   written, and `+4` and `+2` in the plans.** Both plans grew when the phase was revised to answer
   FORGE's and LATTICE's notes and MORPH's second clause, and both plans' `check-counts` lines moved
   with them; the document was the stale side until it was revised to agree. Observed +4 and +2.
7. **11-14's branch table put the phase total at `BASE_TESTS + 33`**, because it was written before
   the two decimal plans existed and never counted them. 11-14 reported the disagreement and asserted
   no absolute; +41 is the number.
8. **Two plan defects, not document defects, and both were named by the plan that found them.**
   11-09's task 03 was declared `+0` while instructing _"if nothing does, add it"_ — two sentences that
   cannot both be true, resolved in favour of the test when STAGE's answer came back. 11-10 declared
   `+2` and its two tasks required three tests; observed `+3`.
9. **The budget projection quoted the wrong corner for eight entries** — the table above — and its
   SNAKE row, the one that carried a user's deferral, said 36 free on the Timer where the gate reads 28. The deferral was right either way, and it is more right at 28.
10. **`11-VALIDATION.md` said the sweep wall clock would fall, and it did — but its `BASE_OG_BYTES`
    row said "28 after" and `BASE_SWEEP_WALL`'s said "36 entries become 28".** Both were written before
    the user answered `new-entry`; the catalog is 29 and `static/og/` is 29 files.
11. **The gate's negative-check instruction was wrong in the same way 10-14's was.** "Raise one
    non-vacuity floor by one, expect red": `facets.spec.ts:110`'s floor is `> 20` against an observed
    `LISTING.length` of **29**, so raising it to 21 is **green** — eight silent raises of headroom. Red
    arrives only at `> 29`, with `the listing was actually read: expected 29 to be greater than 29`.
    Both arms were run, the file restored from a scratch copy and its sha256 identical before and after
    (`a4c54448…`). A floor nine below its observation would not notice eight entries disappearing —
    which is one fewer than this phase removed.
12. **`11-VALIDATION.md:313` says `golden-frames.json` was regenerated in 11-04.** It was not, and
    could not have been: `git log` shows the fixture byte-unmoved since Phase 3 (`5d37780`), because it
    samples every preset with no touch input and 11-04 changed a touch response. 11-04's own SUMMARY
    said so in advance; the document row was written before the plan ran and never re-read.

### The gate's second negative check, and the record it proves

One `intendedDivergence` row's `reason` in `upstream-manifest.json` was set to the empty string
(`tests/pad.test.js`'s one row). `vendored-diff.spec.ts` went red on **"every intended divergence is
justified"** naming the file and the field — `reason must be a sentence saying what behaviour changed
and why. Got: ""` — with 14 of 15 still green. Restored from a scratch copy, sha256 identical
(`8853783d…`). The record's own guarantee, verified at the gate rather than trusted from wave 3.

### The vendored diff, beside the manifest's rows

`git diff --stat 4131ff5 HEAD -- src/vendor/` (the 11-03 tip, which left the record empty, against
the gate) reads:

```
 src/vendor/botor/_pad.ts               | 70 ++++++++++++++++++++++++++--------
 src/vendor/botor/pad-sim.ts            | 29 ++++++++++----
 src/vendor/botor/tests/pad-sim.test.js | 19 +++++----
 src/vendor/botor/tests/pad.test.js     |  7 +++-
 4 files changed, 92 insertions(+), 33 deletions(-)
```

`upstream-manifest.json` carries **22** `intendedDivergence` rows, all plan 11-04, dated 2026-09-09:
`_pad.ts` **10**, `pad-sim.ts` **6**, `tests/pad.test.js` **1**, `tests/pad-sim.test.js` **5**,
`pad-sim-host.ts` **0**, `tests/pad-invariants.test.js` **0**. Four files with hunks, four files with
rows, and the two files with zero rows are the two the diff does not name. `git diff --quiet HEAD --
src/vendor/` exits 0 at the gate: no wave after 11-04 touched the tree, which makes this the
**sixteenth** consecutive wave with the manifest's source rows standing and the first to correct
their prose (four "free at its worst knob position" figures that were defaults figures — pinwheel,
radar, joystick, faders — now carry both numbers and the correction's date).

## Phase 12's suites, measured at the gate

**Every count below was observed on 2026-09-11 at the Phase 12 gate (plan 12-12)**, on the clean tree
at `fed9c17`, against a fresh production build, from three `vitest run --project server` runs whose
per-file totals were read out of the runner's JSON reporter, one sweep, and two full Playwright runs.
`.planning/phases/12-touch-framework/12-VALIDATION.md` carried a projected delta table, a per-file
table and a budget table from planning time; the tables here are the observations that replace them,
and every disagreement is named in "Where the planner was wrong" below rather than corrected quietly.
**Nothing in this section is hardware-verified**: no agent in Phase 12 connected to a ZONA, wrote to
one or deployed. The probe of 2026-09-10 was the user's, and every claim about touch in this phase is
subordinate to it.

**This section is appended, and nothing above it is reflowed.** Phase 13 ran six waves in the same
tree while Phase 12 was open (13-01 to 13-06, interleaved between 12-11 and 12-06), and its own gate
(13-20) appends beside this one. Where an earlier section of this document now states a stale count,
the correction is listed by line under "Corrections to earlier sections, by line" and the line itself
is left standing.

### The tree this gate measured is shared, and the offset is stated once

Phase 12's chains below run from 11-16's carried block in twelve terms and end at **85 files / 888
tests / 87 e2e titles / 106 runs / `svelte-check` 582**. The tree at `fed9c17` reads **88 / 903 (+1
todo) / 84 / 100 / 604**. The difference is Phase 13's, observed by name from each `13-0N-SUMMARY.md`
and reproduced from the runner's per-file JSON:

| Plan  | files  | tests   | e2e titles | e2e runs | `svelte-check` | Where                                                                                                                            |
| ----- | ------ | ------- | ---------- | -------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 13-01 | +1     | +2      | +1         | +2       | +2             | `src/lib/ui/radius.spec.ts` (2), `e2e/radius.e2e.ts` (one `@webkit` title)                                                       |
| 13-02 | +0     | +0      | +0         | +0       | +0             | documents only                                                                                                                   |
| 13-03 | +0     | +5      | +0         | +0       | +1             | `identity.spec.ts` 7 to 11, `font-assets.spec.ts` 5 to 6                                                                         |
| 13-04 | +0     | −8      | −4         | −8       | +1             | `aesthetic.spec.ts` 8 to 2, `instrument.spec.ts` 6 to 4; `e2e/aesthetic.e2e.ts` deleted (−5 / −10), one title re-homed (+1 / +2) |
| 13-05 | +1     | +6      | +0         | +0       | +9             | `src/lib/ui/shell.spec.ts` (6)                                                                                                   |
| 13-06 | +1     | +10     | +0         | +0       | +9             | `src/lib/store/local.spec.ts` (10)                                                                                               |
| sum   | **+3** | **+15** | **−3**     | **−6**   | **+22**        | 85 + 3 = 88; 888 + 15 = 903; 87 − 3 = 84; 106 − 6 = 100; 582 + 22 = 604 - every one matches the observation                      |

Catalog, OG images, audition rows and the sweep's `4 19` carry a Phase 13 offset of zero. 13-20
rebuilds Phase 13's own totals; this section states the offset and does not own it.

### The two files this phase created, and the one the gate does not count

| File                                  | Tests | What it holds                                                                                                                                                                                                                                                          |
| ------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/catalog/library.spec.ts`     | **3** | the touch library's three gates: the part sums against the shipped string and the uniform 770 join compressing to it; every same-id, cross-contact and Timer expiry path through `R`; both class gates (decay, touch-guard) run over the library string itself (12-07) |
| `src/lib/catalog/entries/trackpad.ts` | —     | not a spec: the hand-authored TRACKPAD entry (12-10), which `svelte-check` counts (+1) and `check-counts.mjs` does not                                                                                                                                                 |

`.planning/phases/12-touch-framework/deferred-items.md` is the third created file the validation
document named, and it is a document.

### The files this phase touched without creating

Observed from the green run's JSON; the `12-VALIDATION.md` per-file row beside each, and every row
agrees.

| File                                           | Tests            | Moved by                                                                                                                                                       | `12-VALIDATION.md` said |
| ---------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `src/lib/sim/lua-smoke.spec.ts`                | 25 → **29**      | 12-04 −3 (FORGE, LATTICE, SHUTTLE), 12-05 +1 (ARC), 12-07 +2, 12-08 +1, 12-09 +2 (CHORUS, MORPH), 12-10 +1 (TRACKPAD); 12-11 +0 (two titles extended in place) | 25 → 29, six plans      |
| `src/lib/tune/model.spec.ts`                   | 10 → **12**      | 12-01 +1 (the knob reaches the pair), 12-07 +1 (the library lands for a Lua entry)                                                                             | +2                      |
| `src/lib/protocol/constants.spec.ts`           | 7 → **8**        | 12-02                                                                                                                                                          | +1                      |
| `src/lib/protocol/descriptors.spec.ts`         | 12 → **13**      | 12-02                                                                                                                                                          | +1                      |
| `src/lib/transport/sequence.spec.ts`           | 11 → **12**      | 12-02 +1; 12-03 rewrote in place (+0), the adapters' absence asserted                                                                                          | +1, then +0             |
| `src/lib/transport/fixtures/synthetic.spec.ts` | 6 → **7**        | 12-02                                                                                                                                                          | +1                      |
| `src/lib/device/install.spec.ts`               | 21 → **23**      | 12-03                                                                                                                                                          | +2                      |
| `src/lib/device/snapshot.spec.ts`              | 7 → **8**        | 12-03                                                                                                                                                          | +1                      |
| `src/lib/tune/view.spec.ts`                    | 8 → **9**        | 12-05 (a two-valued integer knob is a word row)                                                                                                                | +1                      |
| `src/lib/sim/lua-host.spec.ts`                 | 10 → **11**      | 12-07 (`system` runs after the snapshot and on restart)                                                                                                        | +1                      |
| `src/lib/catalog/host-surface.spec.ts`         | 5 → **6**        | 12-07 (+1); 12-09 rewrote the shadow scan inside it (+0)                                                                                                       | +1                      |
| `src/lib/catalog/touch-guard.spec.ts`          | **3** unchanged  | 12-04 (`toBe(2)` → 1 inside), 12-08 (the delegation arm inside test 1), 12-10 (three declared rows, 1 → 4)                                                     | unchanged               |
| `src/lib/browse/facets.spec.ts`                | **4** unchanged  | 12-04 (three literals moved inside, not two: `:63`, `:65`, `:69`)                                                                                              | unchanged, "two"        |
| `src/lib/catalog/audition.spec.ts`             | **4** unchanged  | 12-04 (`ROW_COUNT` 25 → 22), 12-10 (23)                                                                                                                        | unchanged               |
| `src/lib/share/stamp.spec.ts`                  | **9** unchanged  | 12-04 (three literals: 18 → 15 twice, 16 → 13)                                                                                                                 | unchanged               |
| `src/lib/device/wire-pin.spec.ts`              | **4** unchanged  | 12-03 (the empty page init pinned), 12-07 (pinned to `TOUCH_LIBRARY` verbatim), 12-10 (eight carded presets)                                                   | —                       |
| `src/lib/device/install-copy.spec.ts`          | **6** unchanged  | 12-03 (`AMENDED_BY_THE_THIRD_SCRIPT`, seven rows)                                                                                                              | —                       |
| `src/lib/catalog/frames.spec.ts`               | **5** unchanged  | the fixture regenerated by 12-04, 12-05, 12-10 and 12-11; proved unmoved by 12-06, 12-07, 12-08 and 12-09                                                      | —                       |
| `src/lib/catalog/presets.spec.ts`              | **4** unchanged  | 12-05 (`PLAN_ID` widened to `1[12]-`); still nine against the vendored nine after 12-10                                                                        | —                       |
| `src/lib/catalog/catalog.spec.ts`              | **10** unchanged | 12-10 (`SHELF_NOT_CARDED = ["tpad"]`)                                                                                                                          | —                       |
| `src/lib/catalog/front-door.spec.ts`           | **8** unchanged  | 12-10 (one line, `tpad` → `trackpad`); handed to 13-07 as-is                                                                                                   | —                       |

The vendored suites in the quick run: `tests/pad.test.js` **176** and `tests/pad-sim.test.js` **96**,
unchanged; `tests/pad-invariants.test.js` **9** in the sweep, unchanged.

### The standing gates, re-read at the gate rather than assumed

`src/lib/fidelity/firmware-oracle.spec.ts` **7 + 1 todo**, green in all three quick runs and
**byte-unedited since `b3a554d` (Phase 3)** - `git diff --quiet b3a554d HEAD` exits 0 - through a
phase that put a third script on the wire and a library in the system element and touched neither
the compiler nor the simulator's phase walk; `src/lib/fidelity/preset-baseline.json` byte-unchanged
since `d85495a` (Phase 3). `lua-parity.spec.ts` **5**; `golden-frames.spec.ts` **11**
(`golden-frames.json` regenerated twice this phase, by 12-06 and 12-10, and byte-identical both
times - it samples the VENDORED shelf, whose `tpad` row it still carries); `preset-baseline.spec.ts`
**20**; `vendored-diff.spec.ts` **15**; `decay-idiom.spec.ts` **3**, `KNOWN_VIOLATIONS` still empty
and **blind to a `D(` call** (below); `protocol-pin.spec.ts` **5**; `format-parity.spec.ts` **3**;
`paint.spec.ts` **5**; `lazy.spec.ts` **3**; `licence-notices.spec.ts` **7**; `ready.spec.ts` **6**.

### e2e

| File                 | Titles      | What moved                                                                                                                                                                                  |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/install.e2e.ts` | 13 → **14** | 12-01's one chromium-only title: a rail turned on `/c/lumen/`, TRY clicked, the fake ZONA's RAM read. 12-03 then moved twenty-two numeric sites inside the file to three strings, +0 titles |
| `e2e/session.e2e.ts` | **14**      | 12-03: five sites, `3 * connects` fetches and `4 * connects` writes; +0 titles                                                                                                              |

Per file at the gate: `artifacts` 3, `browse-webkit` 4, `browse` 12, `catalog` 2, `fidelity` 2,
`first-experience` 11, `install` 14, `radius` 1 (13-01), `session` 14, `skeleton` 2, `smoke` 4,
`tuning-webkit` 5, `tuning` 10 - `cat e2e/*.e2e.ts | grep -c "test("` reads **84**, and
`e2e/poll.ts` still carries its one phantom hit in a comment. `npx playwright test --list` reads
**100 tests in 13 files** = 84 chromium + 16 `@webkit` titles run a second time by `webkit-phone`.
Phase 12's own e2e chain is 86 → 87 / 105 → 106 (one term, 12-01, chromium only); Phase 13's −3 / −6
takes the tree to 84 / 100.

**Six plans ran the full suite, not the five the validation document scheduled**: 12-01 (106),
12-03 (106, twice), 12-04 (106), 12-05 (106, not asked to), 12-10 (98 + 2, the two rerun green), and
this gate (below). 12-02 ran two files (33 passed) to prove its adapters, as scheduled.

### The gate's runs, with the memory beside each

The machine had **250 MB of 16 GB available** when the gate started - the user's desktop with a
browser, two editor sessions and a chat client open, no stale test runner - and between 121 and 573
MB at the start of each command. Every reading below is one reading; the transients are named, not
averaged away.

| Command                                   | Available at start | Result                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                           | 299 MB             | **604 files, 0 errors, 0 warnings**, 12 s                                                                                                                                                                                                                                                                                                                |
| `npm run lint`                            | 518 MB             | clean (prettier + eslint), 24 s                                                                                                                                                                                                                                                                                                                          |
| `npm run test:quick` (1)                  | 541 MB             | **1 failed, 902 passed, 1 todo** - `install.spec.ts` "the snapshot is taken at connect, in order, before ready": `timed out waiting for identification`                                                                                                                                                                                                  |
| `npm run test:quick` (2)                  | 366 MB             | **88 files / 903 passed / 1 todo**; `check-counts.mjs 88 903` matches                                                                                                                                                                                                                                                                                    |
| `npm run test:sweep`                      | 531 MB             | **4 files / 19 tests**, **100 s wall**; `check-counts.mjs 4 19` matches                                                                                                                                                                                                                                                                                  |
| `npm run build`                           | 121 MB             | clean, **19 s wall**; `gen-og.mjs` **26** images, **154,136 B**; `postbuild` archived the source                                                                                                                                                                                                                                                         |
| `npm run test:quick` (3, after the build) | 527 MB             | **3 failed, 900 passed, 1 todo** - `config-shape.spec.ts` "the built front door does not preload the protocol chunk" (`Test timed out in 5000ms`), and `install.spec.ts` "the snapshot is taken at connect, in order, before ready" and "a serial that is not answered degrades to a session-only snapshot", both `timed out waiting for identification` |
| the two red files alone                   | —                  | `install.spec.ts` + `config-shape.spec.ts`: **37 passed**                                                                                                                                                                                                                                                                                                |
| `npx playwright test --workers 3` (1)     | 573 MB             | **98 passed, 2 failed**, 2.8 m runner, 172 s wall - named below                                                                                                                                                                                                                                                                                          |
| `npx playwright test --workers 3` (2)     | 480 MB             | **100 passed**, 2.6 m runner, 159 s wall; `check-counts.mjs --playwright 100` matches                                                                                                                                                                                                                                                                    |
| the two red titles alone, `--workers 1`   | —                  | **3 passed** in 32.3 s (the `@webkit` title runs in both projects)                                                                                                                                                                                                                                                                                       |

**The quick suite's transient, named.** `install.spec.ts`'s `until()` advances a fake clock 4,000
steps of 5 ms - twenty virtual seconds - yielding to the macrotask queue between steps so the store's
real dynamic imports can progress; "identification" is `session.phase === "connected"`, which waits
on a real `import()` of the protocol module. Under this little memory that import did not resolve
inside 4,000 macrotask turns in two of three runs (once on one title, once on two), and on the third
it did. It reproduces nothing about the store - the same file passed 23 / 23 alone straight
afterwards - and it is almost certainly the `1 failed | 873 passed` 12-04 saw once at `603dcd7` and
could not name: same file, same wait, same shape. `config-shape.spec.ts`'s preload test is the one
12-10 saw time out once under `check`, `lint` and the quick run together; it reads `build/` and
crossed Vitest's 5,000 ms per-test timeout once in three runs here, after the build.

**`check-counts.mjs` on a red run.** A run that printed `Test Files  1 failed | 87 passed (88)` and
`Tests  1 failed | 902 passed` is reported by the script as _"no Vitest summary lines found on
stdin"_, because `FILES_PASSED` and `TESTS_PASSED` expect `passed` to follow the first number and a
red summary puts `failed` there. The exit code is 1 either way, so the gate holds; the message says
the wrong thing. And, as 12-04 recorded, the script has **no direction**: `874` after a deletion and
`877` after an addition are the same plain equality, so the guard against a silently shrinking suite
is the plan's declared term and nothing in this script.

**The e2e transients, named.** Run 1's two reds: `[chromium] e2e/session.e2e.ts:701` "a granted ZONA
is offered on load and one click connects it with no picker" - `onlyReads` polled thirty seconds for
`SERIALNUMBER/FETCH === connects` and read **2 where 1 was expected**, the fake ZONA having named
itself twice for one connect; and `[webkit-phone] e2e/tuning-webkit.e2e.ts:497` "a shared link lands
with the knobs restored, and install is present but disabled" - `consoleErrors` held two
`Failed to load resource: the server responded with a status of 500` lines, the Playwright-spawned
`wrangler dev` answering two requests with a 500 without dying. Run 2 was 100 / 100 and the two titles
rerun alone were green. **`session.e2e.ts:701` has now failed in two of the last four full runs
across two plans** - 12-10 saw it time out at 30 s in a `page.evaluate`; this gate saw it read a
doubled fetch - with a different message each time, in a file no Phase 12 plan after 12-03 touched.
It is logged as `D-12-12-a` in `deferred-items.md`. **Not seen at this gate**, of the transients
earlier plans named: the `webkit-phone` tail failing `page.goto: Could not connect to server`
(`D-11-08.1-b`); the spawned wrangler dying at ~28 s (13-06); `install.e2e.ts:2074`'s hydration
signature; `session.e2e.ts:851` (Expected 6 / Received 7); `install.e2e.ts:1817` (12-10's other
rerun); `browse-webkit.e2e.ts:564` (`D-11-16-a`).

### The phase total, written as a chain - twelve terms, every zero written out

**Nothing below is a transcribed total.** The carried block is 11-16's, measured on a clean tree at
`c5fd1cd`: **84 files / 869 tests / 86 e2e titles / 105 runs / `svelte-check` 582 / catalog 29 (9 + 20) / `static/og/` 29 files, 172,699 B / audition 25 / sweep `4 19`**. Every plan carried `PREV_*`
plus a delta; this gate is the one plan that asserts against the block, in PLAN order, with the wave
order beside it once: **`01 02 03 04 05 | 07 08 09 | 06 | 10 11 12`**. 12-06 sat at wave 9 because
its blocking checkpoint is read by 12-10 alone, and the move was allowed because its term is `+0` on
every chain, so the arithmetic is identical either way. (The order the plans actually EXECUTED in was
a third one - `01 02 03 04 05 07 08 09 11 | 13-01..13-06 | 06 10 12` - because 12-11 ran ahead of
12-06's open checkpoint on the same `+0` reasoning and Phase 13's six waves landed while it stood
open; every chain below is unmoved by that too.)

```
                 12-01 12-02 12-03 12-04 12-05 12-06 12-07 12-08 12-09 12-10 12-11 12-12
tests    869       +1    +4    +3    -3    +2    +0    +8    +1    +2    +1    +0    +0   = 888
files     84       +0    +0    +0    +0    +0    +0    +1    +0    +0    +0    +0    +0   = 85
e2e ttl   86       +1    +0    +0    +0    +0    +0    +0    +0    +0    +0    +0    +0   = 87
e2e runs 105       +1    +0    +0    +0    +0    +0    +0    +0    +0    +0    +0    +0   = 106
check    582       +0    +0    +0    -3    +0    +0    +2    +0    +0    +1    +0    +0   = 582
catalog   29       +0    +0    +0    -3    +0    +0    +0    +0    +0    +0    +0    +0   = 26, 8 + 18
og        29       +0    +0    +0    -3    +0    +0    +0    +0    +0    +0    +0    +0   = 26
audition  25       +0    +0    +0    -3    +0    +0    +0    +0    +0    +1    +0    +0   = 23
sweep    4 19       -     -     -     -     -     -     -     -     -     -     -     -   = 4 19
```

**Nine rows, twelve terms each, the count of terms asserted at twelve on every row and the twelve
column headers asserted to be the twelve plan numbers** - counted, not described, because
`12-VALIDATION.md:314` and `:338`, plan 12-12's `<interfaces>` and its task text all say twelve and a
sentence that only sums right is a sentence nobody can check term by term. `1+4+3−3+2+0+8+1+2+1+0+0 =
19`; `0×6+1+0×5 = 1`. The per-file table above rebuilds the 19 from the other end: `2+1+1+1+1+2+1+4+1+1+1
= 16` plus `library.spec.ts`'s 3 = **19**, and the two ends agree. The observed `PREV_TESTS` ladder in
the SUMMARYs is 870, 874, 877, 874, 876, 884, 885, 887, 887 (12-11, run ahead), then **902 and 903**
(12-06 at `+0` and 12-10 at `+1` on the observed baseline under Phase 13) - every term agrees with its
plan's own `check-counts` line, and no term disagrees with `12-VALIDATION.md`'s delta table. The
`svelte-check` row is provenance and is reported: −3 at 12-04 (three entries), +2 at 12-07
(`library.ts`, `library.spec.ts`), +1 at 12-10 (`trackpad.ts`), 582 at both ends, 604 with Phase 13.

**The catalog, OG and audition chains took neither of the two branches the validation document
drew.** It wrote `+1 / +1 / +1` at 12-10 under `beside` (27 / 27 / 23, split 9 + 18) and `+0 / +0 /
+0` under `replace` (26 / 26 / 22, split 8 + 18). The user's answer at 12-06 was neither - _"as is,
selectable tuning options under Trackpad"_ - and 12-10 folded the `tpad` preset into a hand-authored
TRACKPAD card: catalog **−1 preset carded + 1 Lua = +0 (26, split 8 + 18)**, OG **−1 + 1 = +0 (26,
`tpad.png` gone, `trackpad.png` 4,443 B at 4 of 81 lit)**, audition **+1 (23)** because the new card
earned a row the preset never had. So the `beside` branch was wrong on two chains and the `replace`
branch on one; the `tpad` preset is still declared on the shelf (nine in `presets.ts`, `presets.spec.ts`
untouched) and is no longer a card, which is what `catalog.spec.ts`'s `SHELF_NOT_CARDED` says.

### The cost, observed against what was projected

| Thing                             | Projected / carried                                                          | **Observed 2026-09-11**                                                                                                                                    | Verdict                                                                                                                                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:sweep` wall         | 114 s / 147 s at the 11-16 gate; 136 s (12-04), 115 s (12-05), 107 s (12-06) | **100 s** at 531 MB free                                                                                                                                   | the fastest the tree has shown, with three entries fewer and one new one; the spread across readings is still the machine                                                                                            |
| `npm run build`                   | 28 s / 13 s (11-16)                                                          | **19 s** at 121 MB free                                                                                                                                    | inside the earlier pair                                                                                                                                                                                              |
| `npx playwright test --workers 3` | 137 / 158 / 131 s (11-16); 106 runs                                          | **172 s** (98 + 2) and **159 s** (100 / 100); 100 runs                                                                                                     | six fewer runs and up to 40 s slower: Phase 13's build is bigger and the machine had a tenth of the memory                                                                                                           |
| `static/og/`                      | 172,699 B / 29 (11-16); 155,278 B / 26 (12-04)                               | **154,136 B / 26**, rebuilt from empty                                                                                                                     | −18,563 B / −3 files against 11-16: three images out (12-04), `ninepads.png` 6,512 → 5,270 (12-05, sixteen dots), `tpad.png` 4,192 out and `trackpad.png` 4,443 in (12-10), `lumen.png` re-rendered at 6,835 (12-11) |
| `reachability.sweep.spec.ts`      | 20,782 + 24,576 = 45,358 (11-16)                                             | **20,270 + 24,576 = 44,846 in 93.1 s**; laddered 8; over budget 0; Pass B colours excluded 0                                                               | −512 states: the `tpad` rack left the sweep (9 racks → 8, 12-10), so **`tpad`'s 907 of 908 is no longer observed by any sweep** - it is held only by `ladder.spec.ts` and `/dev/tune/` through `portedEntry`         |
| the dearest colour-bearing preset | `ninepads` 640 / 268 (11-16)                                                 | **637 / 271 as the sweep reports it; the true worst is still 640 / 268** (12-05's finding: the two-pass separability licence is false on this card at 4x4) | `colour-picker.spec.ts` pins the true figure; the sweep pins what it can produce, both green                                                                                                                         |
| `joystick` at its worst           | 551 / 357 (12-06)                                                            | **551 / 357** at `102,102,102`, Pass B dearest 549                                                                                                         | exact                                                                                                                                                                                                                |
| `stamp-roundtrip.sweep.spec.ts`   | 45,358 and 51,888 + 135,168 = 187,056 (11-16)                                | **44,846** and **42,418 + 114,688 = 157,106** (format w 42,018, format x 382)                                                                              | Lua route −29,950: three entries out and the compiler-driven racks 9 → 8; format x still CULL and QUADRANT                                                                                                           |
| `lua-entries.sweep.spec.ts`       | 1,331 / 2,662 over 20 (11-16)                                                | **1,140 / 2,280 over 18**; TRACKPAD's 37 (2 + 3 + 3 + 27 + 2)                                                                                              | −191 combinations                                                                                                                                                                                                    |
| the kind cross-product            | 1,296, worst 906 of 908                                                      | **1,296 in 2.6 s, worst 906 of 908** at `none/none/trackpad/hi=false/grid=false`                                                                           | exact, unmoved by two phases                                                                                                                                                                                         |
| `svelte-check`                    | 582 (11-16); 582 projected at the end of Phase 12                            | **604** in 12 s                                                                                                                                            | Phase 12's own chain ends at 582; the 22 are Phase 13's, named above                                                                                                                                                 |
| `moduleState` call sites          | twelve, then seventeen at `:215` (`12-VALIDATION.md`)                        | **eighteen**, the factory at `:238`                                                                                                                        | 12-01's title is the eighteenth (12-02, 12-03 both counted); the declaration moved from `:229` to `:238` under 12-11's comment lines                                                                                 |

### The picker-corner re-measurement, replacing the projection

Every hand-authored entry measured at the gate at three corners with the arithmetic the 908 gate
uses - `max(text.length, measureLua(text))` after `padReady()`, at the defaults, at the RGB444 picker
corner (every knob at its longest declared value with every colour knob at `255,255,255`, the corner
`lua-entries.sweep.spec.ts` gates) and at the all-shortest corner - with each entry header's quoted
picker figure checked against it. **Setup and Timer are separate 908 budgets and are listed
separately, because 12-08 moved four Timers and a single figure would hide it.**

| Entry                     | Setup: defaults | picker                 | free    | shortest | Timer: defaults | picker  | free | shortest | Header agrees                                     | What the phase did                                                     |
| ------------------------- | --------------- | ---------------------- | ------- | -------- | --------------- | ------- | ---- | -------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| trackpad                  | 903             | **903**                | **5**   | 903      | 488             | **490** | 418  | 483      | **no** - it read 488 / 486, corrected at the gate | 12-10: the preset folded into a card, the flash painted from the Timer |
| wheels                    | 882             | 895                    | 13      | 862      | 338             | 343     | 565  | 338      | yes                                               | untouched; re-read                                                     |
| strip                     | 857             | 875                    | 33      | 835      | 0               | 0       | 908  | 0        | yes                                               | untouched; re-read                                                     |
| quadrant                  | 835             | 838                    | 70      | 835      | 0               | 0       | 908  | 0        | yes                                               | not re-fitted; 874 / 34 costed and deferred (12-08)                    |
| chorus                    | 793             | 796                    | 112     | 786      | 29              | 29      | 879  | 29       | yes                                               | 12-09: 771 / 174 → 796 / 29, one chord through `Q R X`                 |
| console                   | 758             | 781                    | 127     | 735      | 0               | 0       | 908  | 0        | yes                                               | 12-05 +8 (844 → 852), 12-09 −71 (→ 781)                                |
| morph                     | 768             | 772                    | 136     | 762      | 0               | 0       | 908  | 0        | yes                                               | 12-09: 710 → 772 (+0 corners, +56 margin, +6 `Q`)                      |
| pomodoro                  | 733             | 743                    | 165     | 716      | 647             | 659     | 249  | 627      | yes                                               | untouched; re-read                                                     |
| lumen                     | 704             | 707                    | 201     | 692      | 0               | 0       | 908  | 0        | yes                                               | 12-11: 746 → 707 (re-cut +0, `Q` −20, `A` −19)                         |
| euclid                    | 696             | 700                    | 208     | 691      | 233             | 237     | 671  | 232      | yes                                               | 12-08: 790 / 230 → 700 / 237                                           |
| stage                     | 640             | 653                    | 255     | 630      | 136             | 136     | 772  | 136      | yes                                               | untouched; re-read                                                     |
| snake                     | 581             | 585                    | 323     | 573      | 870             | 880     | 28   | 854      | yes                                               | deferred by the user; untouched                                        |
| cull                      | 564             | 565                    | 343     | 564      | 0               | 0       | 908  | 0        | yes                                               | untouched; re-read                                                     |
| arc                       | 538             | 541                    | 367     | 528      | 273             | 275     | 633  | 272      | yes                                               | 12-05: 523 → 541 (+18, the stop gate)                                  |
| radar-points              | 489             | 489                    | 419     | 471      | 286             | 288     | 620  | 285      | yes                                               | 12-08: 579 / 281 → 489 / 288                                           |
| ghost                     | 475             | 478                    | 430     | 466      | 418             | 422     | 486  | 417      | yes                                               | untouched; re-read                                                     |
| sonar                     | 468             | 469                    | 439     | 455      | 286             | 289     | 619  | 286      | yes                                               | 12-08: 559 / 282 → 469 / 289                                           |
| steps                     | 388             | 394                    | 514     | 381      | 258             | 260     | 648  | 257      | yes                                               | 12-08: 479 / 253 → 394 / 260                                           |
| **the library**           | —               | **769**                | **139** | —        | —               | —       | —    | —        | yes (`library.ts`, `library.spec.ts`)             | 12-07: the string in the system element, `255/0`, written before both  |
| ninepads (preset)         | 550 / 158       | 637 as swept; 640 true | 268     | —        | —               | —       | —    | —        | `presets.ts` 550 ✓                                | 12-05: the default moved to 4x4; 556 is the TUNED figure (+6 marker)   |
| joystick (preset)         | 543 / 24        | 551                    | 357     | —        | —               | —       | —    | —        | `presets.ts` 543 ✓                                | 12-06: as-is, by the user; six options costed in its comment           |
| tpad (preset, shelf only) | 902 / 146       | 907 (11-16)            | 1       | —        | —               | —       | —    | —        | `presets.ts` 902 ✓                                | 12-10: off the catalog, on the shelf as the over-budget fixture        |

Every string measured is a fixed point of `compressScript`. **TRACKPAD's Setup at 903 of 908, 5 free
at every knob state, is now the tightest card in the catalog**, ahead of WHEELS at 895 and STRIP at
875; CONSOLE, the tightest before this phase at 844 / 64, sits at 781 / 127. **One header disagreed
and was corrected**: `trackpad.ts` read Timer 488 at the corner and 486 at the defaults from its first
commit, two short on both; the gate measured all eighteen (flash, reach, fade) states at
`255,255,255` and every `true` state is 489, every `false` state 490, so reach and fade move nothing.
The audition table's 486 is corrected the same way, and 12-10's SUMMARY, which carries the short
figures, is a record and is pointed at.

**The library's row**: `TOUCH_LIBRARY` is **769** characters raw, 769 under `compressScript`, 769
under `measureLua`, a fixed point, **139 free of 908**; the uniform seven-part join is 770 and
compresses to exactly the shipped string. Parts: header and tables 25, `W` 109, `E` 56, `Q` 282, `X`
74, `A` 150, `D` 68. **Six functions and one convention, every one with a caller, read from the
rendered entries at the gate**: `Q` is called by EUCLID, STEPS, RADAR POINTS, SONAR, CHORUS, CONSOLE,
MORPH and LUMEN (eight, in their Setups); `X` by EUCLID, STEPS, RADAR POINTS, SONAR and CHORUS (five,
in their Timers); `A` by LUMEN alone; `D` by TRACKPAD alone (in its Timer); `R` is defined by CHORUS
alone and called by the library's `E`; `W` is called by `Q` twice and `E` by `Q` and `X`, neither by
any entry directly, which is what a library-internal helper is. **No function shipped without a
caller.** `F`, which the 885 sketch carried with no caller, is not in the string. Four entries define
a local of their own under a library name - STRIP's `local function X(s)`, LUMEN's `local function
D(v)`, WHEELS' `local function D(s)`, STAGE's `local function R(z)` - and every one shadows the
library's name only inside its own event body; `host-surface.spec.ts` resolves locals for exactly
this reason (12-07). A card that wanted both LUMEN's hex helper and the library's decay would have to
rename one.

### The three-write install shape, as shipped

Since 12-03 every write HANGAR makes is three strings, in one order, from one function:
`writeAll` puts `CONFIG/EXECUTE` on the wire for **element 255 event 0** (the system element's
setup - the page init, which carries the library for a hand-authored entry and the firmware's
24-character default for a preset), then **element 0 event 6** (the touch element's Timer), then
**element 0 event 0** (its Setup), under the step ids `write-system`, `write-timer`, `write-setup`;
`fetchAll` fetches the same three under `fetch-system`, `fetch-setup`, `fetch-timer`, and the snapshot
holds three strings under `hangar.snapshot.v2` with a v1 record read as `system = default`, never
overwritten and never shadowed. The classifier reads three step ids and names which of the three
landed in write order; _"system did not land, Setup did"_ cannot occur with a sequential writer that
aborts on failure, and `install.spec.ts` asserts that over all three refusal cases. CLEAR writes three
firmware defaults, so a KEEP after a CLEAR leaves nothing of HANGAR's on the module (12-03, option A).
`fetchBoth` and `writeBoth` - the two-event adapters 12-02 kept for exactly one plan - are deleted, and
`sequence.spec.ts` asserts their absence by exports and by a comment-stripped source scan. **The row
at `:885` above that describes `sequence.spec.ts` as "`writeBoth` as the one writer" is Phase 10's
observation and is left standing as history**; the writer is `writeAll` since `15ee518`.

### Corrections to earlier sections, by line - listed, not reflowed

- `:45` (the "How to run it" table): `test:quick` **88 files, 903 passed + 1 todo** at this gate
  (Phase 12's chain 85 / 888 plus Phase 13's +3 / +15); `:52`'s arithmetic sum is therefore **92 /
  922**, still arithmetic and not an observation.
- `:598` (the sweep table's `lua-entries` row): **1,140 combinations over eighteen** at this gate.
- `:885` (`sequence.spec.ts`): **12** tests; `writeAll` is the one writer over three events since
  12-03; the row is Phase 10's and is left as history.
- `:1156` (`touch-guard.spec.ts`): `DECLARED_EXCEPTIONS` holds **`stage.ts` and TRACKPAD's three
  declared guards** (`e==3 or e>=5`, `e>4`, `e==4 or e>7`, each right because of the pass around it);
  `forge.ts` left with the entry at 12-04, and the count read 1 between 12-04 and 12-10. Still 3
  tests, with 12-08's delegation arm inside test 1.
- `:1173` (`lua-smoke.spec.ts`): **29** at this gate, the file's own header now saying so after two
  plans of reading twenty-three.
- The four-corner table at `:1328-1350`: nine rows moved this phase (the table above); `forge`,
  `lattice` and `shuttle` are gone (12-04); `tpad` is a shelf fixture and no longer a card (12-10);
  `trackpad` is the new row; the tightest card is TRACKPAD at 903 / 5.
- `:1322-1363`'s "every one of the twenty headers now quotes the corner the gate reads": eighteen
  headers at this gate, seventeen right and one corrected (TRACKPAD's Timer).
- `docs/SESSION-RUNBOOK.md:14` still reads 724 / 13 / 77 for the three suites (Phase 6's figures);
  the gate's are 903 / 19 / 84. That file states no fetch count (12-03's finding) and is under
  Phase 13's append-only band (13-02, 13-15, 13-17), so it is named here and not edited.

### Where the planner was wrong, named rather than corrected

Every row `12-VALIDATION.md`, the research, or a plan of this phase got wrong is named here, the way
11-16 did.

1. **The catalog, OG and audition chains took neither drawn branch.** `beside` (27 / 27 / 23, 9 + 18)
   was wrong on the first two; `replace` (26 / 26 / 22, 8 + 18) was wrong on the third, because the
   fold gave TRACKPAD an audition row. Observed 26 / 26 / **23**, split 8 + 18. Plan 12-12's own
   `<interfaces>` chain block, its task text and its verification block all carried the `beside`
   figures (27, `static/og/` 27, "27 as a chain with 9 + 18"), as did `12-VALIDATION.md`'s per-task
   row for 12-10-02 ("frames.json at 27, OG at 27"). 12-10's entry is `trackpad.ts`, not `glide.ts`,
   and its `lua-smoke` +1 is TRACKPAD's, not GLIDE's; the number of every term was right.
2. **The gate's own count literals were written for a tree without Phase 13.** `check-counts.mjs 85
888`, `--playwright 106`, `grep -c "test("` at 87 and `svelte-check` 582 are Phase 12's chain
   ends and are right as such; the tree carried Phase 13's +3 / +15 / −3 / −6 / +22 when the gate ran,
   so the gate was run at **88 903**, **100** and **84**, exactly as 12-06 and 12-10 found for their
   own literals (85 887, 87 106). `12-VALIDATION.md:314`'s "e2e titles 86 → 87, runs 105 → 106" is
   likewise Phase 12's chain and is right as a chain.
3. **`moduleState` was "twelve", then "seventeen at `:215`"; it is eighteen.** 12-01 added the
   eighteenth title before 12-02 counted, and the factory sits at `:229` after 12-01 and `:238` after
   12-11. `12-VALIDATION.md` said so itself - _"if it is not seventeen, that is this document's
   defect"_ - and it is.
4. **The planner's library figures.** The research costed `Q W A F D` at **643** with no expiry; the
   validation document's first shape with the probe's expiry rule and a per-contact light layer was
   **954**; with the light layer held once it was **885** under the minifier (884 raw), never run in
   a VM; the plan-check's revised sketch was **770 raw**; 12-07 measured the shipped string at **769**
   canonical, 139 free. The two defects the plan-check found in the 885 sketch are both measured:
   `Q`'s onset scan skipped the same contact id (`j~=i`), so a re-press by the same id after a lost
   lift returned **nil** - driven in wasmoon, `[40]` against the shipped `[40, 40]` - which is exactly
   the probe's Q6.5 case the sketch existed to catch; and `F` (123 characters) shipped with no caller
   and was dropped with `O` and `L` (−7 in the header). The fallback order (`A` then `D`, never `Q W E
X`) never fired.
5. **The research's savings were two characters optimistic per call, as `12-VALIDATION.md` R-5
   predicted.** Its four-argument `Q` costed EUCLID / STEPS / RADAR POINTS at 698 / 392 / 487; the
   five-argument shipped call measures **700 / 394 / 489** (12-08). Its CONSOLE with `s.q` kept was
   845; measured **847** (12-09; the shipped CONSOLE without `s.q` is 781).
6. **The research listed three sequencers and 12-08 measured four**: SONAR carried the same 126-
   character guard byte for byte (`12-VALIDATION.md` R-8 caught it at planning; the research's §3c
   table omitted it). The plan's own "SONAR is a strictly worse reading of Q2" was wrong the other
   way: all four toggle, and the net-state assertion is on all four.
7. **The research's MORPH call shape would have frozen the card**: `if not c then return end` after
   `Q` sends **4 messages against 16** on a four-sample in-cell wobble and costs **25 characters
   more** (797 against 772). Measured by 12-09's negative check, as R-4 asked.
8. **550 versus 556 for NINE PADS at 4x4 was not a transcription error and neither figure was
   wrong**: 550 is the SHIPPED card (marker `#z.pninepads`), 556 a TUNED one (`withChange` deletes
   `preset` and the marker becomes an eighteen-character field dump), +6 in both directions, measured
   at both grids (12-05). `presets.ts` carries 550 and `presets.spec.ts` test 4 re-measures it; this
   gate reads 550 / 158 off the shipped state again.
9. **12-06's plan table (as-is 532, trail 468) was never a corner figure and not the defaults figure
   either**: 551 / 488 at the corner, 543 / 479 at the defaults, and every look layer moves the Timer
   24 → 55, which the plan's table did not show.
10. **12-07's plan carried the research's nine-sample expectation** `0,0,0,0,1,1,1,1,1,2` (the `<9`
    window); the shipped `<11` window reads `0,0,0,0,0,0,1,1,1,1` in the VM. Its empty-tables list
    named `O`, which left with `F`; its host-order negative check is green as written and needed two
    arms to go red.
11. **12-08's plan put the boundary finger at cell 58** (`4 + 6*9`); `80*9//128 = 5`, so it is
    **49**, and the same paragraph's STEPS index (`c=4, r=5`) said so. Its guard was 125 / 44
    characters counted without the separating space; **126 / 45** with it, the delta 90 either way.
    "A duplicate guard is invisible to every gate" was false in both placements. QUADRANT **fits** at
    874 / 34 once `R` replaces its release branch; the plan expected it not to, and it was deferred
    anyway with three reasons.
12. **12-11's plan carried `PREV_TESTS 888`** - 12-10's `+1` before it had landed - and
    `static/og/` at 27; the tree read 887 and 26. `A` saves 19 at the corner, not 20, because `@CC`
    renders as three characters there and is named twice. 11-09.2's "eighty of eighty-one cells
    move" is **72** (row 0's nine cannot, by construction) and its "two literals" are **four**.
13. **12-10's SUMMARY calls TRACKPAD's test "the file's 23rd" and its term "22 + 1"**; the file had
    28 before it and 29 after. 12-10 added its one to 12-04's 22 and skipped the six between (12-05
    +1, 12-07 +2, 12-08 +1, 12-09 +2); it wrote the same TWENTY-THREE into `lua-smoke.spec.ts`'s
    header, corrected at this gate. Its declared term `+1` was right. And **its TRACKPAD Timer
    figures were two short from birth** (488 / 486 for 490 / 488), corrected in the header and the
    audition table above.
14. **12-05's SUMMARY and `deferred-items.md` item 2 say `facets.ts:15` "still claims `precise` is
    carried by six".** It does not: 12-04 rewrote that sentence - the file reads _"`precise` is at 7
    and has one to spare"_ and names the drift - so item 2 was closed before it was written. What
    WAS stale in that header is one word two lines later: the six carriers of `still` were listed
    as "JOYSTICK, FADERS, **TPAD**, MORPH, STRIP or LUMEN" after 12-10 had moved the tags to
    TRACKPAD; corrected at this gate, with every term recounted from `LISTING`: FOR modulation 7,
    show 5, sequencing 4, mixing 3, play 3, shortcuts 2, pointing 2 (seven, summing to 26); FEELS
    generative 12, expressive 10, readable 9, playable 8, precise 7, still 6 (six, summing to 52);
    thirteen terms, zero singletons.
15. **The gate's negative-check instruction named the wrong line and the wrong number**: "raise
    `facets.spec.ts:110`'s floor to `> 27`; expect red naming 27". The floor is at `:117`, it
    appears **twice** (in both health tests), and red names **26**: `the listing was actually read:
expected 26 to be greater than 27`, two tests. The raise-by-one arm (`> 21`) is **green**, as
    11-16 found at 29 against `> 20` - the same six silent raises of headroom.
16. **"e2e runs in FIVE plans"** (`12-VALIDATION.md`): six ran it - 12-05 ran the full suite without
    being asked to. Named here as 11-16 named its three-then-four-then-five.
17. **The audition cost table went stale twice more, and the second was written wrong by the wave
    that authored the entry**: ARC 520 for 538 (12-05 moved the header, not the table), TRACKPAD 486
    for 488. Twelve stale rows over three phases, every one smaller than the entry costs; the gate
    that would end the class (`audition.spec.ts` reading `renderLua`) is still not built.
18. **Two SUMMARYs' e2e zeros were declarations, and one was a proof**: 12-07 and 12-08 declared
    `+0` without running or grepping; 12-09 proved its zero with `git diff --stat` and `grep -c`.
    All three were `+0`, so nothing moved, and the difference is recorded because a declared zero is
    the shape 11-16 warned about.

### The two negative checks

1. **`facets.spec.ts:117`'s floor, both arms.** `> 20` raised to `> 21`: **green**, 4 passed, against
   `LISTING.length` 26. Raised to `> 27`: **red**, two tests, `the listing was actually read:
expected 26 to be greater than 27`. Both plants made by a counted `sed` replacement (2 sites, both
   tests), the file restored from a scratch copy and sha256-identical before and after
   (`d07a4562…`), `git diff --quiet` exit 0.
2. **One `intendedDivergence` row's `reason` emptied** (`tests/pad.test.js`'s one row, the
   occurrence counted at exactly one before the write). `vendored-diff.spec.ts` **red** on "every
   intended divergence is justified", naming the file and the field - `src/vendor/botor/tests/pad.test.js:
intended divergence "expect(lua).toContain(…": reason must be a sentence saying what behaviour
changed and why. Got: ""` - 14 of 15 green. Restored from a scratch copy, sha256 identical
   (`8853783d…`, the same hash 11-16 recorded), `git diff --quiet` exit 0.

### The decay gate is blind to a `D(` call, recorded

`decay-idiom.spec.ts` reads literal `glpfs` / `glt` pairs and resolves their arguments to integers;
a decay that runs through the library's `D(n,l,w)` is invisible to it. 12-07 recorded that for the
sketch and 12-10 **measured it on the shipped card**: TRACKPAD's `@T*(16-k*k)//16*6` replaced by the
literal `250` at its one code site left `decay-idiom.spec.ts` green (3 passed). What proves TRACKPAD's
decays land is `library.spec.ts` (every multiple of six from 6 to 252 lands on phase 0 through `D`,
and `w = 7` strands) plus `lua-smoke.spec.ts`'s TRACKPAD test reading every cell to phase 0 in the VM.
**The gate was not widened at 12-12.** The honest clause would be textual - a `D(` call whose `w`
argument is `<expr>*6` - because the evaluator refuses a `w` that depends on a loop variable, which
is exactly the shape TRACKPAD ships; that is more than one assertion and it is carried in
`deferred-items.md` section A rather than half-built here.

### The vendored diff, beside the manifest's rows

`git diff --stat 4131ff5 HEAD -- src/vendor/` at this gate reads exactly what it read at 11-16:

```
 src/vendor/botor/_pad.ts               | 70 ++++++++++++++++++++++++++--------
 src/vendor/botor/pad-sim.ts            | 29 ++++++++++----
 src/vendor/botor/tests/pad-sim.test.js | 19 +++++----
 src/vendor/botor/tests/pad.test.js     |  7 +++-
 4 files changed, 92 insertions(+), 33 deletions(-)
```

`upstream-manifest.json` carries **22** `intendedDivergence` rows, all plan 11-04: `_pad.ts` **10**,
`pad-sim.ts` **6**, `tests/pad.test.js` **1**, `tests/pad-sim.test.js` **5**, `pad-sim-host.ts` **0**,
`tests/pad-invariants.test.js` **0**. `git diff --quiet HEAD -- src/vendor/` exits 0: the sixteen
consecutive waves 11-16 counted are now sixteen plus Phase 12's twelve plus Phase 13's six in the
same tree, **thirty-four**, with no vendored byte moved. The library, the third write and every
re-fit are HANGAR's own files; `firmware-oracle.spec.ts` is byte-unedited since Phase 3 and green in
every run above.

## Phase 12.1's suites, measured at the gate

**Every count below was observed on 2026-09-12 at the Phase 12.1 gate (plan 12.1-09)**, on the tree
at `c305657` (clean apart from the user's three untracked root files), against a fresh production
build, from three `vitest run --project server` runs whose per-file totals were read out of the
runner's JSON reporter, one sweep, and the Playwright suite twice in five file chunks on fresh
detached servers. `.planning/phases/12.1-gradient-touch/12.1-VALIDATION.md` carried a projected
delta table, a per-file table and a nine-term chain from planning time, and a dated section
(2026-09-11, D-26) that made the chain eleven terms; the tables here are the observations that
replace them, and every disagreement is named in "Where the planner was wrong" below rather than
corrected quietly. **Nothing in this section is hardware-verified**: no agent in Phase 12.1 connected
to a ZONA, wrote to one or deployed. Probe C of 2026-09-11 was the user's, the sensor map the whole
phase runs on is a measurement of that one unit, and every claim about touch below is subordinate to
the twenty-eight audition rows and the eleven runbook rows that are still the user's.

**This section is appended, and nothing above it is reflowed.** Phase 13 ran six more waves in the
same tree while Phase 12.1 was open (13-08 to 13-13, interleaved between 12.1's eleven plans), and
its own gate (13-20) appends beside this one. Where an earlier section of this document now states a
stale count, the correction is listed by line under "Corrections to earlier sections, by line" and
the line itself is left standing.

### The tree this gate measured is shared, and the offset is stated once

Phase 12.1's chains below run from the block observed at `91ab755` in **eleven** terms and end at
**89 files / 926 tests / 78 e2e titles / 94 runs**. The tree at `c305657` reads **90 / 936 (+1 todo)
/ 80 / 96**. The difference is Phase 13's, observed by name from each `13-NN-SUMMARY.md` and
rebuilt from the runner's per-file JSON against a textual count of the same files at `91ab755`:

| Plan  | files  | tests                                    | e2e titles | e2e runs | Where                                                                                                                                 |
| ----- | ------ | ---------------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 13-08 | +0     | +3                                       | +0         | +0       | `src/lib/ui/browse-ui.spec.ts` 6 to 9                                                                                                 |
| 13-09 | −1     | **−9 by its parts, −11 as stated**       | +0         | +0       | `slots.spec.ts` deleted (−8), `front-door.spec.ts` 7 to 5, `aesthetic.spec.ts` 2 to 1, `tune-ui.spec.ts` 9 to 11                      |
| 13-10 | −1     | −1                                       | +0         | +0       | `mix.spec.ts` deleted (−2), `surprise.spec.ts` 5 to 6, `tune-ui.spec.ts` −2 +2                                                        |
| 13-11 | +0     | +3                                       | +0         | +0       | `device-ui.spec.ts` 13 to 16                                                                                                          |
| 13-13 | +2     | +8                                       | +1         | +1       | `src/lib/store/transfer.spec.ts` (4), `collections.spec.ts` (4); `e2e/library.e2e.ts` (one chromium title)                            |
| 13-12 | +1     | +6                                       | +1         | +1       | `src/lib/device/page-target.spec.ts` (4), `descriptors.spec.ts` 13 to 14, `device-ui.spec.ts` 16 to 17; `e2e/install.e2e.ts` 14 to 15 |
| sum   | **+1** | **+10 by the files, +8 by the SUMMARYs** | **+2**     | **+2**   | 89 + 1 = 90; 926 + 10 = 936; 78 + 2 = 80; 94 + 2 = 96                                                                                 |

**The two ends meet on every row, and the tests row meets only through a named document defect.**
Summing the six Phase 13 SUMMARYs' stated terms gives `+3 − 11 − 1 + 3 + 8 + 6 = +8`, and
`901 + 25 + 8 = 934`, two short of the observed 936. The per-file diff between `91ab755` and
`c305657` (every changed spec listed above and in the 12.1 table below; the four `it.each` files -
`golden-frames`, `preset-baseline`, `vendored-diff`, `format-parity` - unchanged at 11 / 20 / 15 / 3
either end) sums to `+35 = 25 + 10`, and 13-09's own COUNTS line lists its parts as `+2 −8 −1 −2 =
−9`. Its stated `−11` was measured as `910 → 899` against 12.1-01's close, and 12.1-01 had observed
**906** at its start where 13-08 had left **904** - two of 13-09's in-flight `tune-ui.spec.ts` tests
were already on disk uncommitted and inside 12.1-01's baseline, so 13-09's ladder figure counts them
once inside the 910 it started from and once more in its −11. The term is **−9**; the sentence in
`13-09-SUMMARY.md` that reads −11 is 13-20's to reconcile and is named here, not edited. Catalog,
OG images, audition rows, runbook rows (13-12's one row is inside the eleven) and the sweep's `4 19`
carry a Phase 13 offset of zero. `svelte-check` is provenance: 608 at `91ab755`, **627** at this gate,
the +19 being Phase 13's +17 (13-08 +4, 13-09 −4, 13-10 −1, 13-11 +4, 13-13 +11, 13-12 +3) plus
12.1-01's +2 (`calibration.ts`, `calibration.spec.ts`), which is 608 + 17 + 2 = 627 exactly. 13-20 rebuilds Phase 13's
own totals; this section states the offset and does not own it.

### The one file this phase created, and the two the gate does not count

| File                                  | Tests | What it holds                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/catalog/calibration.spec.ts` | **4** | the measured tables and their provenance (nine knots per axis, strictly increasing, the four corners within 2 of the product, `MEASURED` true, `runs: 1`, target 10 named as discarded); the rendered Lua literal `KX={1,13,29,46,64,85,100,120,126}KY={0,12,26,48,68,83,97,115,126}`; the forward map `sensorAt` at knots, midpoints and edges, hi-res x8; the TS twin of the Lua `U` integer, monotone and inverse at every LED (12.1-01) |
| `src/lib/catalog/calibration.ts`      | —     | not a spec: the one place the map lives, imports nothing, which `svelte-check` counts (+1 with its spec) and `check-counts.mjs` does not                                                                                                                                                                                                                                                                                                    |

`docs/CALIBRATION-PROBE.md` (the 483-character paste, re-measured canonical at 12.1-01) and
`.planning/phases/12.1-gradient-touch/deferred-items.md` (started by 12.1-08a, extended by 12.1-08b
and this gate) are the other two created files, and they are documents.

### The files this phase touched without creating

Observed from the green run's JSON; the `12.1-VALIDATION.md` per-file row beside each (its dated
D-26 section where it moved a row), and every row agrees.

| File                                                                                                    | Tests                         | Moved by                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `12.1-VALIDATION.md` said   |
| ------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `src/lib/sim/lua-smoke.spec.ts`                                                                         | 29 → **38**                   | 12.1-02 +3 (`G`'s cases on the measured knots, `E` and `X` clearing a block, `Q`'s band as a function of the table and the bench case), 12.1-03 +2 (the four sequencers at all 81 LED centres; ARC's stop through `N`), 12.1-04 +2 (the four tight Setups in their own colours; TRACKPAD's flash centre), 12.1-08a +1 (GHOST's key at LED (8,8) and not (7,7)), 12.1-08b +1 (`K` on the measured knots); the header count moved five times and reads THIRTY-EIGHT | 29 → 32 → 34 → 36 → 37 → 38 |
| `src/lib/catalog/library.spec.ts`                                                                       | 3 → **6**                     | 12.1-02 +2 (both slots' costs and fixed points; the split rule), 12.1-08b +1 (`K`'s stamps every one a multiple of 6 landing on 0; `N` in the map's slot; `G` identical through `Z` and `Y`)                                                                                                                                                                                                                                                                      | 3 → 5 → 6                   |
| `src/lib/sim/lua-host.spec.ts`                                                                          | 11 → **13**                   | 12.1-02 (the pair runs 255/6 as `self.tim` before 255/0 and again on restart; a host without `systemTimer` has no `G` and says so); 12.1-08b moved the two slots' name lists inside (+0)                                                                                                                                                                                                                                                                          | +2                          |
| `src/lib/sim/touch.spec.ts`                                                                             | 8 → **9**                     | 12.1-05 (the `y` axis and hi-res through the knots; the first test rewritten in place)                                                                                                                                                                                                                                                                                                                                                                            | +1                          |
| `src/lib/protocol/constants.spec.ts`                                                                    | 8 → **9**                     | 12.1-06 (the 255/6 default pinned against the package with no literal of it in `constants.ts`)                                                                                                                                                                                                                                                                                                                                                                    | +1                          |
| `src/lib/transport/sequence.spec.ts`                                                                    | 12 → **13**                   | 12.1-06 (`SLOTS` as the single source; 255/4 never; 255/6 once and first; twenty-four key orders; the fixture round trip for four)                                                                                                                                                                                                                                                                                                                                | +1                          |
| `src/lib/tune/model.spec.ts`                                                                            | 12 → **13**                   | 12.1-07 (+1: both halves for a Lua entry); 12.1-08b inverted two preset tests in place (+0)                                                                                                                                                                                                                                                                                                                                                                       | +1                          |
| `src/lib/device/install.spec.ts`                                                                        | 23 → **24**                   | 12.1-07 (CLEAR four defaults and PUT BACK four originals in `SLOTS` order, the classifier on the first and third write); 12.1-08 and 12.1-08b moved assertions inside (+0)                                                                                                                                                                                                                                                                                        | +1                          |
| `src/lib/device/snapshot.spec.ts`                                                                       | 8 → **9**                     | 12.1-07 (a v2 record read with the caller's default and `fromV2`, never overwritten; v3 round-trips four)                                                                                                                                                                                                                                                                                                                                                         | +1                          |
| `src/lib/fidelity/lua-parity.spec.ts`                                                                   | 5 → **6**                     | 12.1-08b (the eight HANGAR presets under a finger, the compiler's Lua beside the library in wasmoon against a live `PadSim`, 36,936 records)                                                                                                                                                                                                                                                                                                                      | +1 (D-26)                   |
| `src/lib/catalog/host-surface.spec.ts`                                                                  | **6** unchanged               | 12.1-02 (eighteen globals over both strings, `glp` / `glc` / `glim` admitted with their callers, `self:tim()` refused by the classifier), 12.1-08b (fifty sites, twenty-one names)                                                                                                                                                                                                                                                                                | unchanged                   |
| `src/lib/catalog/audition.spec.ts`                                                                      | **4** unchanged               | `ROW_COUNT` 23 → 24 (12.1-01) → 25 (12.1-03) → 26 (12.1-04) → 27 (12.1-08a) → 28 (12.1-08b)                                                                                                                                                                                                                                                                                                                                                                       | unchanged                   |
| `src/lib/device/wire-pin.spec.ts`                                                                       | **4** unchanged               | 12.1-07 (four frames, the first unasserted), 12.1-08 (both exports pinned to the wire), 12.1-08b (AURORA's two system frames pinned to the exports)                                                                                                                                                                                                                                                                                                               | unchanged                   |
| `src/lib/device/install-copy.spec.ts`                                                                   | **6** unchanged               | 12.1-08 (`AMENDED_BY_THE_FOURTH_SCRIPT`; the four names in write order over three partials)                                                                                                                                                                                                                                                                                                                                                                       | unchanged                   |
| `src/lib/device/page-target.spec.ts`                                                                    | **4** unchanged (13-12's)     | 12.1-07 (one key, `systemTimer: P.SYSTEM_DEFAULT_TIMER`)                                                                                                                                                                                                                                                                                                                                                                                                          | —                           |
| `src/lib/sim/demo.spec.ts`                                                                              | **2** unchanged               | 12.1-05 (`cellToCoord` against `KX` / `KY`; the import surface admits exactly one runtime specifier)                                                                                                                                                                                                                                                                                                                                                              | unchanged                   |
| `src/lib/sim/host.spec.ts`                                                                              | **21** unchanged              | 12.1-05 (three `cellToCoord` calls given their axis)                                                                                                                                                                                                                                                                                                                                                                                                              | —                           |
| `src/lib/catalog/presets.spec.ts`                                                                       | **4** unchanged               | 12.1-08b (plan-id regex widened by name; `trailMs === 420` and the field asserted on all nine inside the walk)                                                                                                                                                                                                                                                                                                                                                    | —                           |
| `src/lib/fidelity/vendored-diff.spec.ts`                                                                | **15** unchanged              | 12.1-08b (plan-id regex `^11-[0-9]{2}$\|^12\.1-08b$`)                                                                                                                                                                                                                                                                                                                                                                                                             | —                           |
| `src/lib/catalog/frames.spec.ts`                                                                        | **5** unchanged               | the fixture regenerated by 12.1-05 and 12.1-08a and byte-identical both times; proved unmoved by 12.1-03, 12.1-04 and 12.1-08b                                                                                                                                                                                                                                                                                                                                    | —                           |
| `src/lib/tune/ladder.spec.ts`, `surprise.spec.ts`, `knobs.preset.spec.ts`, `reachability.sweep.spec.ts` | 5 / 6 / 7 / (sweep) unchanged | 12.1-08b (DIAL's reserve 300 → 354 in three specs; the calibrated zone needle; the NINE PADS margin literal 271 → 260 with the reason)                                                                                                                                                                                                                                                                                                                            | —                           |

The vendored suites in the quick run: `tests/pad.test.js` **176** and `tests/pad-sim.test.js`
**96**, unchanged and unedited through the one phase that edited the two files they test;
`tests/pad-invariants.test.js` **9** in the sweep, unchanged.

### The standing gates, re-read at the gate rather than assumed

`src/lib/fidelity/firmware-oracle.spec.ts` **7 + 1 todo**, green in all three quick runs and
**byte-unedited since `b3a554d` (Phase 3)** - `git diff --quiet b3a554d HEAD` exits 0 - through a
phase that edited the vendored compiler and simulator for the first time since 11-04, under sixteen
declared rows, and left `ledTick` (`pad-sim.ts:893-900`) at the same sha256 `3640e585…` 12.1-08b
recorded either side of its edit. `src/lib/fidelity/preset-baseline.json` `187c31fc…`,
`golden-frames.json` `bf54f15c…` and `src/lib/catalog/frames.json` `9f9cd666…` byte-unchanged by
`sha256sum -c` against 12.1-08b's record (and 12.1-05's / 12.1-08a's for the third).
`lua-parity.spec.ts` **6**; `golden-frames.spec.ts` **11**; `preset-baseline.spec.ts` **20**;
`vendored-diff.spec.ts` **15** at 6 files / **38** rows; `decay-idiom.spec.ts` **3**,
`KNOWN_VIOLATIONS` still empty and **blind to a `D(` call and now to a `K(` call** (below);
`protocol-pin.spec.ts` **5**, `forbidden-instructions.spec.ts` **5**, green and byte-unchanged (255/6 is a
`CONFIG` class the eight-builder gate already admits, 12.1-06); `format-parity.spec.ts` **3**;
`paint.spec.ts` **5**; `lazy.spec.ts` **3**; `licence-notices.spec.ts` **7**; `ready.spec.ts` **6**;
`touch-guard.spec.ts` **3**; `host-surface.spec.ts` **6**.

### e2e

| File                  | Titles                       | What moved                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/install.e2e.ts`  | **15** (14 → 15 was 13-12's) | 12.1-08: every count of three inside the titles became four - `CONFIG/FETCH` 4 per connect, six frames per connect, four acknowledged writes per RAM leg in `SLOTS` order, the refetch round four, the partial six not seven, the unplug at the seventh frame decoding as 255/6, CLEAR four defaults; `MODULE_SYSTEM_TIMER` in the fixture; +0 titles |
| `e2e/session.e2e.ts`  | **14**                       | 12.1-08: `onlyReads` polls `4 * connects` in `SLOTS` order and the Setup fetch is the last config chunk; five comments; +0 titles                                                                                                                                                                                                                     |
| `e2e/fidelity.e2e.ts` | **2**                        | **this gate (Rule 1)**: the probe compiles the VENDORED shelf's DIAL and reports `shelf: "vendored"`, asserted instead of `stateDiverges(probed) === false`, which had been red since 12.1-08b's commit (below); +0 titles                                                                                                                            |

Per file at the gate: `artifacts` 3, `browse-webkit` 4, `browse` 12, `catalog` 2, `fidelity` 2,
`first-experience` 5, `install` 15, `library` 1, `radius` 1, `session` 14, `skeleton` 2, `smoke` 4,
`tuning-webkit` 5, `tuning` 10 - `cat e2e/*.e2e.ts | grep -c "test("` reads **80**.
`npx playwright test --list` reads **96 tests in 14 files** = 80 chromium + 16 `@webkit` titles run a
second time by `webkit-phone`. Phase 12.1's own e2e chain is 78 → 78 / 94 → 94 (eleven zeros,
written out); Phase 13's +2 / +2 (13-13's library title, 13-12's install title) takes the tree to
80 / 96.

**Two plans ran the suite, as the validation document scheduled**: 12.1-08 (96 twice, in chunks)
and this gate (below). Every other plan proved `+0 / +0` with `grep -c "test("`; 12.1-08b did so
and **did not run the suite**, and the red it left in `fidelity.e2e.ts` is the reason a declared
zero on titles is not a proof about the run.

### The gate's runs, with the memory beside each

The machine had **0.2 GB of 16 GB available** when the gate started (the user's desktop with a
browser, editor sessions and a chat client open; no stale runner, no stale `wrangler` - checked
before the first command) and between 0.17 and 1.49 GB at the start of each command. Every reading
below is one reading; the transients are named, not averaged away.

| Command                                                                   | Available at start                  | Result                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run build` (1)                                                       | 0.23 GB                             | clean, **33 s wall**; `gen-og.mjs` **26** images, **154,136 B**, every one sha256-identical to the render on disk before it (12.1-08b's), `ghost.png` 5,234 B; `postbuild` archived the source at `c305657` (2,024 KB)                                                                                                                                 |
| `npm run check`                                                           | 0.24 GB                             | **627 files, 0 errors, 0 warnings**, 14 s                                                                                                                                                                                                                                                                                                              |
| `npm run lint`                                                            | 0.63 GB                             | clean (prettier + eslint), 28 s                                                                                                                                                                                                                                                                                                                        |
| `npx vitest run --project server` (1, default workers)                    | 1.0 GB                              | **3 failed, 933 passed, 1 todo** - all three in `install.spec.ts`, all three `timed out waiting for identification`: "the snapshot is taken at connect, in order, before ready", "a serial that is not answered degrades to a session-only snapshot", "an empty fetched string is snapshot-failed, and everything stays disabled"; 39 s                |
| `… --maxWorkers=2 --reporter=json` (2)                                    | 0.26 GB                             | **90 files / 936 passed / 1 todo**; `check-counts.mjs 90 936` matches; 49 s; the per-file table above is this run's JSON                                                                                                                                                                                                                               |
| `… --maxWorkers=2` (3)                                                    | 0.41 GB                             | **90 / 936 / 1 todo**; `check-counts.mjs 90 936` matches; 45 s                                                                                                                                                                                                                                                                                         |
| `install.spec.ts` alone                                                   | 0.74 GB                             | **24 passed** in 5 s                                                                                                                                                                                                                                                                                                                                   |
| `npm run test:sweep`                                                      | 0.28 GB                             | **4 files / 19 tests**, **104 s wall**; `check-counts.mjs 4 19` matches                                                                                                                                                                                                                                                                                |
| `npm run build` (2, after the fidelity fix)                               | 0.47 GB                             | clean, 17 s; the same 26 images, byte-identical                                                                                                                                                                                                                                                                                                        |
| e2e run 1, chunk 1 (`install`, `session`)                                 | 0.25 GB                             | 34 runs: **33 passed, 1 red** - `[webkit-phone] install.e2e.ts:1902` "@webkit CLEAR sends on the click with no confirmation…": `CONFIG/EXECUTE` delta **6 for 4** (two writes retried under three workers; 12.1-08 saw the same title read 13 for 12 the same way); 1.6 m                                                                              |
| e2e run 1, chunk 2 (`browse`, `browse-webkit`)                            | 1.0 GB                              | **the spawned wrangler died mid-chunk** (the known empty `ERROR` block in its log; `net::ERR_CONNECTION_REFUSED` on four `page.goto`), 13 passed + 8 failed - **not the suite**; 1.4 m                                                                                                                                                                 |
| e2e run 1, chunk 3 (`tuning`, `tuning-webkit`)                            | 0.38 GB                             | 20 runs: **19 passed, 1 red** - `[chromium] tuning.e2e.ts:550` "COPY LINK confirms in its own state and copies the link": "the change went through the debounced recompile" read `false`; 1.2 m                                                                                                                                                        |
| e2e run 1, chunk 4 (`catalog`, `fidelity`, `first-experience`, `library`) | 0.78 GB                             | 10 runs: **9 passed, 1 red, and the red was REAL** - `[chromium] fidelity.e2e.ts:43` "the hidden probe compiles a shelf preset in a real browser against build/": `stateDiverges("dial")` true (named below); 16.7 s                                                                                                                                   |
| e2e run 1, chunk 5 (`artifacts`, `radius`, `skeleton`, `smoke`)           | 1.26 GB                             | **11 passed**, 19.1 s                                                                                                                                                                                                                                                                                                                                  |
| chunk 4 whole on the fixed build, attempt 1                               | 0.35 GB                             | wrangler died again (`ERROR`, `ERR_CONNECTION_REFUSED`), 10 failed - not counted                                                                                                                                                                                                                                                                       |
| chunk 4 whole on the fixed build, attempt 2                               | 0.59 GB                             | **10 passed**, 15.6 s                                                                                                                                                                                                                                                                                                                                  |
| chunk 2 whole, rerun                                                      | 0.17 GB                             | 21 runs: **19 passed, 2 red** - `[webkit-phone] browse-webkit.e2e.ts:357` "a still configuration stays lit after a sort" (`scrollIntoViewIfNeeded` at the 30 s test timeout) and `[webkit-phone] browse.e2e.ts:842` "@webkit reduced motion snaps a normal entry…" (one console error, `wasm streaming compile failed: TypeError: Load failed`); 1.2 m |
| the four red titles alone, `--workers 1`                                  | 0.95 GB                             | **7 passed** in 27.1 s (`install:1902`, `browse:842` and `browse-webkit:357` in both projects, `tuning:550` in chromium)                                                                                                                                                                                                                               |
| e2e run 2, five chunks on the fixed build                                 | 0.86 / 0.84 / 0.83 / 1.49 / 1.13 GB | **34 + 21 + 20 + 10 + 11 = 96 passed**, no red, no rerun, no `ProxyController` line; 1.5 m + 43 s + 49 s + 19 s + 26 s                                                                                                                                                                                                                                 |

`test-results/` removed after every Playwright run; nothing was committed while a suite ran
(`artifacts.e2e.ts` reads `HEAD`); every server stopped through PowerShell and answered `HTTP 000`
after its chunk (12.1-08's `e2e-chunks-1208.sh`, copied to this gate's scratch directory; `scripts/`
still has no chunk runner).

**The quick suite's transient, named as before.** `install.spec.ts`'s `until()` advances a fake
clock 4,000 steps of 5 ms yielding to the macrotask queue between steps; "identification" waits on
a real `import()` of the protocol module. Under default workers at this little memory the import
did not resolve in time on three titles in one run of three; `--maxWorkers=2` cleared it on both
following runs, exactly as 12.1-07, 12.1-08 and 12.1-08b found, and the file passed 24 / 24 alone.
`config-shape.spec.ts`'s preload timeout did not appear in any run.

**The e2e transients, named.** Three of the four titles red in run 1 or the rerun are the machine at
a fiftieth of its memory - a retried write counted twice, a debounced recompile that had not landed
when the assertion read it, a WebKit `scrollIntoViewIfNeeded` past 30 s, a WebKit streaming-compile
console error - and each was green alone at `--workers 1` and green in run 2 whole. The spawned
wrangler died twice mid-chunk (the 13-07 finding; the chunk method exists because of it), and both
dead chunks were rerun whole rather than read. **Not seen at this gate**: `session.e2e.ts`'s
"a granted ZONA is offered on load and one click connects it with no picker" (`D-12-12-a`), green in
both runs, as at 12.1-08 and 13-12; the `webkit-phone` tail's `Could not connect to server`;
`install.e2e.ts`'s hydration signature.

**The one real red, and what the gate did about it (Rule 1).** `e2e/fidelity.e2e.ts:43` asserted
`stateDiverges(probed) === false` for the preset the hidden `/dev/fidelity/` probe compiles (DIAL),
so that a catalog divergence could never read as a broken WASM build. Plan 12.1-08b put
`state.touchLibrary` - the measured knots - on all nine of HANGAR's presets, declared in
`divergence.ts` as it must be, so since commit `dbfb3e7` every HANGAR card diverges from BOTOR's
state and no preset the probe could compile through HANGAR's shelf shares a state with
`preset-baseline.json` (DIAL now compiles to 592 through HANGAR's shelf against the fixture's 646).
12.1-08b proved its e2e zero by `grep -c "test("` and did not run the suite, so the title has been
red on the tree since that commit. The gate's fix is the one the test's own message asks for, read
after 12.1-08b: the probe compiles **BOTOR's own DIAL state** (the vendored `PRESETS` array, which
11-05 kept exported for exactly the fidelity fixtures) through `$lib/pad`'s `compileState`, so the
FOUND-05 gate is still the one exercised, and reports `shelf: "vendored"`; the test asserts that
field instead of consulting `divergence.ts`, and its header says why, dated. `src/routes/dev/fidelity/+page.svelte`
+19 / −2, `e2e/fidelity.e2e.ts` +24 / −11, no title added, `grep -c "test("` still 2 and 80,
`config-shape.spec.ts`'s probe-route scan still green (the page names no sibling probe). Chunk 4 on
the rebuilt tree: 10 passed, twice (run 1's rerun and run 2). **Neither file is in the gate's file
list; the edit is a Rule 1 fix of a red the phase caused and never ran, and the term is still
`+0 / +0`.**

### The phase total, written as a chain - eleven terms, every zero written out

**Nothing below is a transcribed total.** The carried block is the one observed at `91ab755` on
2026-09-11 before any 12.1 plan: **88 files / 901 tests (+1 todo) / 78 e2e titles / 94 runs /
catalog 26 (8 + 18) / `static/og/` 26 files / audition 23 / runbook 8 (A-H) / the library 769 of 908
in 255/0 / the manifest 6 files, 22 rows / sweep `4 19`**. Every plan carried `PREV_*` plus a delta
against what it observed; this gate is the one plan that asserts against the block, in PLAN order
with the wave order beside it once: **`01 02 03 04 05 | 08a | 06 07 08 | 08b | 09`** (08a shares
wave 6 with 06; 08b is wave 9; the gate wave 10 - the two D-26 plans joined after Band 1 closed).
The order the plans actually EXECUTED in was `01 02 03 04 05 08a 06 07 08 08b 09` with 13-08..13-13
landing between them, and every chain below is unmoved by that.

```
                 01   02   03   04   05  08a   06   07   08  08b   09
tests    901     +4   +7   +2   +2   +1   +1   +2   +3   +0   +3   +0   = 926
files     88     +1   +0   +0   +0   +0   +0   +0   +0   +0   +0   +0   =  89
e2e ttl   78     +0   +0   +0   +0   +0   +0   +0   +0   +0   +0   +0   =  78
e2e runs  94     +0   +0   +0   +0   +0   +0   +0   +0   +0   +0   +0   =  94
catalog   26     +0   +0   +0   +0   +0   +0   +0   +0   +0   +0   +0   =  26, 8 + 18
og        26     +0   +0   +0   +0   +0   +0   +0   +0   +0   +0   +0   =  26 (re-rendered at 05, 08a; ghost.png moved twice)
audition  23     +1   +0   +1   +1   +0   +1   +0   +0   +0   +1   +0   =  28
runbook    8     +0   +0   +0   +0   +0   +0   +0   +0   +2   +0   +0   =  10 by 12.1 alone; 11 with 13-12's row I
manifest  22      -    -    -    -    -    -    -    -    -  +16    -   =  38 rows, 6 files
255/0    769      -  781    -    -    -    -    -    -    -  842    -   =  842 / 66
255/6      -      -  713  705    -    -    -    -    -    -  873    -   =  873 / 35  (713 -> 705 at 03: the code-9 fix)
sweep   4 19      -    -    -    -    -    -    -    -    -    -    -   =  4 19
```

**Twelve rows, eleven terms each, the count of terms asserted at eleven on every row and the eleven
column headers asserted to be the eleven plan numbers** - counted, not described. There are eleven
`12.1-*-PLAN.md` files; the chain block in `12.1-VALIDATION.md`'s dated D-26 section has eleven plan
columns; this block has eleven. Every statement of the form `<number> terms` / `<number> plans` /
`<number>-term` was grepped in `12.1-VALIDATION.md`, in plan 12.1-09 and in this section, and the
rule the plan's own amendment sets was applied: every such statement **below** a dated D-26 line
reads eleven (`12.1-VALIDATION.md:537, :573, :592, :711, :728`; `12.1-09-PLAN.md:393, :414, :433`;
this section), and every such statement **above** one reads nine and is superseded, listed here by
line and not corrected in place: `12.1-VALIDATION.md:80, :82 (twice), :102, :421, :422, :504`;
`12.1-09-PLAN.md:19, :31, :39, :43, :114, :147, :212, :252, :359, :371, :384`. (`12.1-09-PLAN.md:41`'s
"twelve-term" is 12-12's chain and right; `:141`'s and `12.1-VALIDATION.md:256`'s / `:276`'s
"13 plans" are Phase 13's plans and not a term count.) `4+7+2+2+1+1+2+3+0+3+0 = 25`;
`1 + 0 × 10 = 1`. The per-file table above rebuilds the 25 from the other end:
`9 + 3 + 2 + 1 + 1 + 1 + 1 + 1 + 1 + 1 = 21` moved inside existing files plus `calibration.spec.ts`'s
4 = **25**, and the two ends agree. **Every term checked against its plan's own count line**: the
observed `PREV_TESTS` ladder in the SUMMARYs is 906 → 910 (01), 899 → 906 (02), 905 → 907 (03),
907 → 909 (04), 912 → 913 (05), 927 → 928 (08a), 928 → 930 (06), 930 → 933 (07), 933 → 933 (08),
933 → 936 (08b), and every step is its plan's term on the baseline it observed. **No term disagrees
with `12.1-VALIDATION.md`'s delta table or its D-26 section.**

**The library row is the one row the projection got wrong twice, and both are named.** The
validation document's carry-forward block (`:74`) and its chain (`:98`) say `782 / 126 + 714 / 194`;
12.1-02 shipped **781 + 713** because those were `max(raw, compressed)` figures of a `W` and an `N`
written `return (` and the shipped strings are the minifier's fixed points, one character shorter
each; 12.1-03's code-9 fix took 255/6 to **705**; 12.1-08b's `Z`, `Y`, `K` and the move of `N` to
255/0 took the pair to **842 / 66 + 873 / 35**, which is what the D-26 section (`:588, :612`) says
and what this gate measured. The audition row's `+3` at `:72` is `+5` since D-26 (`:611`); the
manifest row exists only in the D-26 block; both are in the dated section and not defects.

### The 12.1 offset, stated once for 13-20

Read from this gate's chain and from the per-file JSON, so 13-20 reconciles Phase 13's own chain
from both ends exactly as 12-12 stated Phase 13's six-wave offset for Phase 12: **tests +25, files
+1, e2e +0 / +0, `svelte-check` +2 (`calibration.ts`, `calibration.spec.ts`), catalog +0, OG +0
(re-rendered at 12.1-05 and 12.1-08a, `ghost.png` 5,234 → 5,197 → 5,234 B, the other 25
byte-identical throughout), audition +5 (rows 24-28), runbook +2 (rows J and K, after 13-12's I),
the manifest +16 `intendedDivergence` rows on two vendored files (22 → 38; `_pad.ts` 10 → 18,
`pad-sim.ts` 6 → 14), the library 769 in one slot → 842 + 873 in two, the snapshot key
`hangar.snapshot.v2` → `v3`, and every count of three on the wire → four.** 12.1's plans observed
Phase 13's terms landing between theirs and every SUMMARY names which; the one place the two
phases' ladders disagree by two (13-09's stated −11 against its parts' −9) is named above and is
13-20's.

### The cost, observed against what was projected

| Thing                           | Projected / carried                                                                            | **Observed 2026-09-12**                                                                                                                     | Verdict                                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:sweep` wall       | 100 s (12-12); 175 s (12.1-02), 178 / 108 s (12.1-03), 106 / 126 s (12.1-04), 104 s (12.1-08a) | **104 s** at 0.28 GB free                                                                                                                   | the spread is the machine                                                                                                     |
| `npm run build`                 | 19 s (12-12); 12 / 18 s (12.1-05); 17 s (12.1-08b)                                             | **33 s** then **17 s**                                                                                                                      | the first at 0.23 GB free                                                                                                     |
| e2e, five chunks                | 96 twice at 12.1-08 (34 + 21 + 20 + 10 + 11)                                                   | **96** = 34 + 21 + 20 + 10 + 11 in run 2                                                                                                    | exact; two dead servers and four load reds in run 1, named above                                                              |
| `static/og/`                    | 154,136 B / 26 (12.1-08a)                                                                      | **154,136 B / 26**, every image byte-identical                                                                                              | `ghost.png` back at its 12-12 size since 12.1-08a                                                                             |
| `reachability.sweep.spec.ts`    | 44,846 (12-12); "44,078" (12.1-08b-SUMMARY)                                                    | **20,270 + 24,576 = 44,846 in 96.6 s**; laddered 8; over budget 0; Pass B colours excluded 0                                                | 12.1-08b's "44,078" is a transcription in its SUMMARY; the sweep printed 44,846 there too (its worst-position table is exact) |
| the presets' worst positions    | 375 / 422 / 368 / 404 / 501 / 648 / 529 / 653 (12.1-08b)                                       | **375 / 422 / 368 / 404 / 501 / 648 / 529 / 653**                                                                                           | exact; NINE PADS' true worst is still 651 / 257 (the 3x3 position the two-pass sweep reports at 648 / 260)                    |
| `stamp-roundtrip.sweep.spec.ts` | 44,846 and 157,106 (12-12)                                                                     | **44,846** vectors on the compiler route; the Lua route per entry unmoved (EUCLID 20,160 + 4,096 … GHOST 320 + 8,192, format w, payload 11) | no knob's value count moved in this phase (every re-fit was a needle on the literal), so no stamp moved                       |
| `lua-entries.sweep.spec.ts`     | 1,140 / 2,280 over 18 (12-12)                                                                  | **1,140 / 2,280 over 18**                                                                                                                   | exact                                                                                                                         |
| the kind cross-product          | 1,296, worst 906 at TRACKPAD                                                                   | **1,296 in 2.9 s, worst 906 of 908** at `none/none/trackpad/hi=false/grid=false`                                                            | exact, unmoved by three phases                                                                                                |
| `svelte-check`                  | 608 (`91ab755`); 627 (12.1-06 onward)                                                          | **627** in 14 s                                                                                                                             | 608 + 2 (12.1) + 17 (Phase 13)                                                                                                |
| the library                     | 782 / 714 (the plan); 781 / 713 → 781 / 705 (shipped); 842 / 873 (D-26)                        | **842 / 66 + 873 / 35**, both fixed points, `checkSyntax` true, the uniform joins (843 / 874) compressing to exactly the shipped strings    | as 12.1-08b shipped it                                                                                                        |

### The picker-corner re-measurement, replacing the projection

Every hand-authored entry measured at the gate at three corners with the arithmetic the 908 gate
uses - `max(text.length, measureLua(text))` after `padReady()`, at the defaults, at the RGB444
picker corner (every knob at its longest declared value with every colour knob at `255,255,255`,
the corner `lua-entries.sweep.spec.ts` gates) and at the all-shortest corner - with each entry
header's quoted picker figure checked against it. Setup and Timer are separate 908 budgets and are
listed separately. The eleven rows this phase re-fitted are in bold.

| Entry                     | Setup: defaults | picker              | free    | shortest | Timer: defaults | picker  | free   | shortest | Header agrees                         | What the phase did                                                                                                         |
| ------------------------- | --------------- | ------------------- | ------- | -------- | --------------- | ------- | ------ | -------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **trackpad**              | 903             | **903**             | **5**   | 903      | 508             | **510** | 398    | 503      | yes                                   | 12.1-04: both flash centres through the map, +20 in the Timer; the Setup sha256-identical                                  |
| wheels                    | 882             | 895                 | 13      | 862      | 338             | 343     | 565    | 338      | yes                                   | untouched; re-read                                                                                                         |
| strip                     | 857             | 875                 | 33      | 835      | 0               | 0       | 908    | 0        | yes                                   | untouched; re-read                                                                                                         |
| quadrant                  | 835             | 838                 | 70      | 835      | 0               | 0       | 908    | 0        | yes                                   | untouched; re-read                                                                                                         |
| **chorus**                | 819             | **822**             | **86**  | 812      | 29              | 29      | 879    | 29       | yes                                   | 12.1-04: `G` in white after `Q`, +26; the tightest re-fit                                                                  |
| **morph**                 | 810             | **814**             | **94**  | 798      | 0               | 0       | 908    | 0        | yes                                   | 12.1-04: `Q` and `G` in front of the end test, in `@TRAILC`, +42                                                           |
| **console**               | 784             | **807**             | **101** | 761      | 0               | 0       | 908    | 0        | yes                                   | 12.1-04: `G` in white, +26                                                                                                 |
| pomodoro                  | 733             | 743                 | 165     | 716      | 647             | 659     | 249    | 627      | yes                                   | untouched; re-read                                                                                                         |
| **lumen**                 | 730             | **733**             | **175** | 712      | 0               | 0       | 908    | 0        | yes                                   | 12.1-04: `G` in `@CURSORC`, +26; `A` byte-identical to 12-11                                                               |
| **euclid**                | 722             | **726**             | **182** | 717      | 233             | 237     | 671    | 232      | yes                                   | 12.1-03: `G` in white after `Q`, +26                                                                                       |
| stage                     | 640             | 653                 | 255     | 630      | 136             | 136     | 772    | 136      | yes                                   | untouched; re-read                                                                                                         |
| snake                     | 581             | 585                 | 323     | 573      | 870             | 880     | 28     | 854      | yes                                   | deferred by the user; untouched                                                                                            |
| cull                      | 564             | 565                 | 343     | 564      | 0               | 0       | 908    | 0        | yes                                   | untouched; re-read                                                                                                         |
| **radar-points**          | 592             | **592**             | **316** | 562      | 286             | 288     | 620    | 285      | yes                                   | 12.1-03: `R` defined, `G` in `@SWEEPC`, `R` after `G`, +103                                                                |
| **sonar**                 | 571             | **572**             | **336** | 546      | 286             | 289     | 619    | 286      | yes                                   | 12.1-03: as RADAR POINTS, +103                                                                                             |
| **arc**                   | 525             | **528**             | **380** | 515      | 273             | 275     | 633    | 272      | yes                                   | 12.1-03: the stop test `N(x,y)==40`, −13 - the one re-fit that got cheaper                                                 |
| **ghost**                 | 486             | **491**             | **417** | 473      | 405             | **409** | 499    | 404      | yes                                   | 12.1-08a: `N` at the key and the comet cell, `G` in `@RECC` after the id gate; +13 / −13                                   |
| **steps**                 | 414             | **420**             | **488** | 407      | 258             | 260     | 648    | 257      | yes                                   | 12.1-03: `G` in white after `Q`, +26                                                                                       |
| **the library, 255/0**    | —               | **842**             | **66**  | —        | —               | —       | —      | —        | yes (`library.ts`, `library.spec.ts`) | 12.1-02: `H T C P B L`, the map, `U W E Q X`, `self:tim()`; 12.1-08b: `N` moved in                                         |
| **the library, 255/6**    | —               | —                   | —       | —        | —               | **873** | **35** | —        | yes                                   | 12.1-02: `V G N A D`; 12.1-03: `G`'s code-9 end test (−8); 12.1-08b: `Z`, `Y`, `K`, `G` through `Z` and `Y`, `N` moved out |
| aurora (preset)           | 361 / 55        | —                   | 547     | —        | —               | —       | —      | —        | `presets.ts` 361                      | 12.1-08b: `K(x,y,1,252)` at the comet, 415 → 361                                                                           |
| pinwheel (preset)         | 413 / 55        | —                   | 495     | —        | —               | —       | —      | —        | `presets.ts` 413                      | 12.1-08b: `K(x,y,1,252,255-i*60,i*60,128)`, 477 → 413                                                                      |
| starfield (preset)        | 349 / 55        | —                   | 559     | —        | —               | —       | —      | —        | `presets.ts` 349                      | 12.1-08b: `K`, 403 → 349                                                                                                   |
| radar (preset)            | 391 / 55        | —                   | 517     | —        | —               | —       | —      | —        | `presets.ts` 391                      | 12.1-08b: `K`, 445 → 391                                                                                                   |
| joystick (preset)         | 491 / 24        | —                   | 417     | —        | —               | —       | —      | —        | `presets.ts` 491                      | 12.1-08b: the parked dot doused then `G(s,i,e,x,y,1,255,187,0)`, 543 → 491                                                 |
| ninepads (preset)         | 565 / 158       | 648 swept; 651 true | 343     | —        | —               | —       | —      | —        | `presets.ts` 565                      | 12.1-08b: `local n=N(x,y)` through the LED-side zone rule, 550 → 565 (+11 at 3x3)                                          |
| faders (preset)           | 525 / 24        | —                   | 383     | —        | —               | —       | —      | —        | `presets.ts` 525                      | 12.1-08b: `N(x,y)%9*4//9` at the rails, the level raw (D-14), 520 → 525                                                    |
| dial (preset)             | 592 / 55        | —                   | 316     | —        | —               | —       | —      | —        | `presets.ts` 592                      | 12.1-08b: `K`, 646 → 592; the angle raw                                                                                    |
| tpad (preset, shelf only) | 902 / 146       | 907 (11-16)         | 6       | —        | —               | —       | —      | —        | `presets.ts` 902                      | untouched; carries the field, reaches no site                                                                              |

Every hand-authored string and both library strings measured are fixed points of `compressScript`
and `checkSyntax` true at every corner (the compiler's emitted preset Lua is not a fixed point - the
marker's trailing space, as at every gate since Phase 3 - and is costed at its raw length, which is
what `presets.spec.ts` test 4 pins). **Every header agreed at this gate** - eighteen entries, eleven
of them re-fitted this phase, and every one's quoted picker figure is the figure measured; the two
library headers agree; the nine `presets.ts` declared costs agree. TRACKPAD's Setup at 903 / 5 is
still the tightest card, then WHEELS 895 / 13, STRIP 875 / 33, CHORUS 822 / 86; CHORUS, MORPH and
CONSOLE - the three cards 12.1-04 re-fitted under the 890 line - sit at 86 / 94 / 101 free.

**The library's two rows**: 255/0 is **842** raw, 842 under `compressScript`, 842 under
`measureLua`, a fixed point, **66 free**; the uniform nine-part join is 843 and compresses to exactly
the shipped string. Parts: header and tables 32, the map 65, `U` 126, `W` 86, `E` 88, `Q` 294, `X`
74, `N` 60, the call 10. 255/6 is **873 / 873 / 873**, a fixed point, **35 free**; the uniform
eight-part join is 874. Parts: marker 9, `V` 62, `G` 221, `Z` 111, `Y` 70, `K` 176, `A` 150, `D` 68.
`LIBRARY_GLOBALS` is twenty-one names derived from both strings: `A B C D E G H K KX KY L N P Q T U V
W X Y Z`. **Fourteen functions and one convention, every one with a caller, read from the rendered
entries and the compiler's emitted Lua at the gate**: `Q` is called by EUCLID, STEPS, RADAR POINTS,
SONAR, CHORUS, CONSOLE, MORPH and LUMEN (eight, in their Setups); `G` by those eight and GHOST (nine
Setups) and by the compiler for JOYSTICK's glow; `X` by EUCLID, STEPS, RADAR POINTS, SONAR and
CHORUS (five Timers); `N` by ARC (the stop test) and GHOST (the key in its Setup, the comet cell in
its Timer) and by the compiler for NINE PADS' zones and FOUR FADERS' rails; `K` by the compiler
alone - AURORA, STARFIELD, RADAR and DIAL (`K(x,y,1,252)`) and PINWHEEL
(`K(x,y,1,252,255-i*60,i*60,128)`), asserted at the gate on the emitted Setups and pinned by
`knobs.preset.spec.ts` and `wire-pin.spec.ts` test 1; `U` by TRACKPAD's Timer directly and by `Q`,
`Z` and `N` inside the library; `A` by LUMEN alone; `D` by TRACKPAD's Timer directly and by `K`;
`R` is defined by CHORUS, RADAR POINTS and SONAR and called by the library's `E`; `W` by `Q`, `E` by
`Q` and `X`, `V` by `G` and `E`, `Z` by `G` and `K`, `Y` by `G` and `K`, none of the five by any entry
directly, which is what a library-internal helper is. **No function shipped without a caller.**
Four entries still define a local under a library name - STRIP's `local function X(s)`, LUMEN's
and WHEELS' `local function D`, STAGE's `local function R(z)` - and one under a name that is the
library's since 12.1-08b, STAGE's `local function Z`; every one shadows only inside its own event
body, which is what `host-surface.spec.ts` resolves locals for (the harness's caller scan reports
them under those names and they are excluded above by reading the entry).

### The four-write install shape, as shipped

Since 12.1-06 every write HANGAR makes is four strings, in one order, from one list: `SLOTS` in
`sequence.ts` - **element 255 event 6** (the system element's Timer, the library's second half:
`V G Z Y K A D`) first, because a written body runs at once and 255/0's closing `self:tim()` needs
the method registered; then **element 255 event 0** (the system setup: the state, the measured
knots, `U W E Q X N` and the call); then **element 0 event 6** and **element 0 event 0**, under the
step ids `write-system-timer`, `write-system`, `write-timer`, `write-setup`. `fetchAll` iterates
the same list under `fetch-system-timer`, `fetch-system`, `fetch-timer`, `fetch-setup` - the fetch
order IS the write order since 12.1-06, where 12-03's read system, setup, timer - and the snapshot
holds four strings under `hangar.snapshot.v3` (12.1-07) with a v2 record read as `systemTimer =
default` under `fromV2` and a v1 record as both defaults under `fromV1`, never overwritten and never
shadowed. The classifier walks the landed prefix of `SLOTS` and publishes `landedSlots` /
`failedSlots` beside three closed word pairings that name all four in write order (12.1-07, 12.1-08);
"a later slot landed and an earlier one did not" cannot occur with a sequential writer that aborts
on failure, and `install.spec.ts` asserts it on the list over four refusal cases. `CLEAR` writes four
firmware defaults, the 255/6 one read from the package (`--[[@cb]]print("tick")`, 22 characters,
never typed in `constants.ts`); since 12.1-08b a preset lands the library's two halves like every
other card, so the store's `#pageInit` / `#pageTimer` substitution is `CLEAR`'s alone. The 255/4 slot
is still nobody's - 13-17's pending removal under D-19, one row in `SLOTS` when it lands. Rows J and
K of `docs/INSTALL-RUNBOOK.md` are where the four-write order and the page-load half of the
two-slot mechanism would be seen, and they are the user's.

### The fixtures, the vendored diff and the manifest's rows

`git diff --quiet HEAD -- src/vendor/` exits 0 at this gate, and **the run of consecutive waves with
no vendored byte moved ended at 12.1-08b** (thirty-four at 12-12, then 13-07..13-13, 12.1-01..08 and
08a beside them, then the one edit): `_pad.ts` and `pad-sim.ts` moved by **sixteen** declared
`intendedDivergence` rows, eight each, every one `plan: "12.1-08b"`, `dated: "2026-09-11"`, with
its reason, generated from `git diff -U2` with two context lines as the anchor and verified to occur
exactly once on both sides before the reason was attached. `upstream-manifest.json` carries **38**
rows on **6** files: `_pad.ts` 18 (10 + 8), `pad-sim.ts` 14 (6 + 8), `tests/pad.test.js` 1,
`tests/pad-sim.test.js` 5, `pad-sim-host.ts` 0, `tests/pad-invariants.test.js` 0; `vendored-diff.spec.ts`
(15) reconstructs both pristine sha256 through the rows and 11-04's deltas and is green in all
three quick runs; its plan-id regex admits `12.1-08b` by name. The phase walk is proved untouched by
the hash of its extract, not by assertion: `ledTick` at `pad-sim.ts:893-900` hashes to
`3640e585…`, the value 12.1-08b recorded before and after its edit. The three fidelity fixtures are
byte-unchanged by `sha256sum -c` (`preset-baseline.json` `187c31fc…`, `golden-frames.json`
`bf54f15c…`, `frames.json` `9f9cd666…`); `firmware-oracle.spec.ts` and `firmware-oracle.ts`
(`fe69dd51…`, `2a7865c3…`) and `src/vendor/botor/tests/` are unedited; `pad.test.js` 176 and
`pad-sim.test.js` 96 green. The vendored headers' `Modified for HANGAR:` lines were left at 11-04's
wording, which names the manifest as the authority (12.1-08b's question 2, carried in
`deferred-items.md`).

### Corrections to earlier sections, by line - listed, not reflowed

- `:45` (the "How to run it" table): `test:quick` **90 files, 936 passed + 1 todo** at this gate
  (Phase 12.1's chain 89 / 926 plus Phase 13's +1 / +10); `:52`'s arithmetic sum is therefore
  **94 / 955**, still arithmetic and not an observation.
- `:598` (the sweep table's `lua-entries` row): **1,140 combinations over eighteen**, unmoved since
  12-12; the eleven re-fits were needles on the literal and no knob's value count moved.
- `:885` (`sequence.spec.ts`): **13** tests; `writeAll` is the one writer over FOUR events since
  12.1-06, iterating `SLOTS`; the row is Phase 10's and is left as history.
- `:1172` (`lua-smoke.spec.ts`): **38** at this gate, the file's own header saying so.
- `:1512` (`sequence.spec.ts` in Phase 12's table): 12 → **13** (12.1-06).
- `:1495` (`library.spec.ts` at 3 with "the uniform 770 join"): **6** at this gate, over two
  strings.
- `:1508` (`lua-smoke.spec.ts` 25 → 29): 29 → **38** across five 12.1 plans.
- `:1539-1544` (the standing gates): `lua-parity.spec.ts` **6**; `vendored-diff.spec.ts` 15 at 6
  files / **38** rows; `decay-idiom.spec.ts` still 3, blind to `D(` **and to `K(`**.
- `:1553-1557` (Phase 12's e2e per file): `first-experience` **5** (13-07), `install` **15**
  (13-12), `library` **1** (13-13), fourteen files; **80 / 96** at this gate.
- `:1714` (the library's row at 769 / 139): two strings, **842 / 66 + 873 / 35**.
- `:1728-1742` ("six functions and one convention", `769`, the seven parts, `F` gone): fourteen
  functions across two strings, the parts above; the sentence about `F` still holds.
- `:1744-1760` ("The three-write install shape, as shipped"): FOUR since 12.1-06, the section above;
  `hangar.snapshot.v2` → `v3` since 12.1-07; "the classifier reads three step ids" → walks the
  landed prefix of `SLOTS`.
- `:1895-1906` (the decay gate blind to `D(`): now also blind to `K(`, which stamps through `D`
  from the library and from the compiler's emitted comet; recorded in "The gate holes" below.
- `:1920-1926` (the manifest at 22 rows, "thirty-four consecutive waves with no vendored byte
  moved"): **38** rows since 12.1-08b, and the run ended there, deliberately and under declared rows.
- `:2061` (13-08's appended paragraph, "Unit: 88 files / 904 tests"): 88 / 904 was 13-08's observed
  count on 2026-09-11 and is history; **90 / 936** at this gate.
- `docs/SESSION-RUNBOOK.md:14` still reads 724 / 13 / 77 for the three suites (Phase 6's figures);
  the gate's are 936 / 19 / 80. Named here as 12-12 named it, and not edited (Phase 13's
  append-only band).

### Where the planner was wrong, named rather than corrected

Every row `12.1-VALIDATION.md`, `12.1-RESEARCH.md`, `12.1-PLAN-CHECK.md`, a plan of this phase or
its brief got wrong is named here, the way 12-12 did, in the order the plan's own list asks for and
then as found.

1. **The check-counts literals in every plan assume `88 / 901` and were allowed to move.** 12.1-01's
   `89 905` ran at 89 910; 12.1-02's brief said 88 / 910 and the tree read 88 / 906; 12.1-03's said
   906 and the tree read 907; 12.1-05's said 909 and the tree read 912; 12.1-08a's said 89 / 921 and
   the tree read 90 / 927; this gate's `<observed files> <observed tests>` ran at **90 936**. Every
   one is Phase 13's concurrent terms, as the validation document said in advance.
2. **Plan 06's "expect errors here until plan 07" were four, not "exactly the four-key mismatch in
   `install.svelte.ts`, `wire-pin.spec.ts`, `model.ts`"**: `model.ts` had none (its `ConfigStrings`
   never reaches `ConfigSet` directly) and 13-12's `page-target.spec.ts` had one. 12.1-06 named
   it; 12.1-07 closed all four.
3. **The research's seven-value hold band (69..75, "the same width 12-07 measured")** is eight
   values (71..78) between LED 4 and 5, three (122..124) on the outer x segment and six (35..40)
   between LED 2 and 3 on the measured knots - a fraction of the pitch, not a width (D-18,
   `12.1-VALIDATION.md` R-2); 12.1-02's smoke test asserts the formula and printed those bands.
4. **The `(116, 15)` bench case** is a hypothesis-knot figure; the measured bench case is
   `(120, 12)` = `(KX[7], KY[1])`, cell 16 under `N` where the naive divisor reads **8** (the corner
   the user saw), not the research's 17.
5. **`wire-pin.spec.ts` and `tune/model.ts` "free now"** (research F.2) moved in Band 2 (12.1-07,
   12.1-08) and again at 12.1-08b, not in Band 1 (R-7).
6. **`docs/CALIBRATION-PROBE.md` and `docs/TOUCH-PROBE.md`** did not exist when the research named
   them; the first was written by 12.1-01, the second never existed and nothing in the tree needs it.
7. **"A reduced gradient with no expiry clear"** (the brief's no-branch) is research variant H at
   1,043, still 135 over; the honest one-slot branch is calibration without the gradient at 882, and
   12.1-01 recorded it as the branch not taken (D-03 answered `two-slots`).
8. **The snapshot key named `v3` in the research** was right by the rule ("the next version after
   whatever 13-12 leaves") and not by the name: 13-12 added no key, so 12.1-07 named `v3` after
   reading `13-12-SUMMARY.md`, as D-22 required.
9. **782 / 714 and the per-part 87 / 61 for `W` / `N`** (the research, the plan, `12.1-CONTEXT.md`
   D-03 and D-11, `12.1-VALIDATION.md:74, :98`): 781 / 713 shipped, one character under on each
   side - the minifier removes the `return (` space and the shipped string is the fixed point
   (12.1-02 deviation 1); then 705 after the code-9 fix (12.1-03 deviation 1); then 842 / 873
   (12.1-08b). The research's pre-coloured "683" is 682 canonical by the same character.
10. **The callback order `G(...)local m=Q(...)`** in the research, plan 02's test Setup, plan 03's
    `must_haves` artifact and plan 04's MORPH shape: `Q` first, then `G`, then `R`, then the entry's
    early return - `G` before `Q` is wiped by `Q`'s onset `E` on the press that drew it, measured in
    the VM by 12.1-02 and again by 12.1-04's negative check (a press lit nothing).
11. **`G`'s end test as "the blessed spelling `e~=1 and e~=4 and e<9`"** (the plan-check): that
    spelling is `Q`'s; `G` draws nothing on a code 9 (`e~=1 and e~=4`), found by the residue gate on
    EUCLID's cell 20 at phase 134 (12.1-03 deviation 1).
12. **"`frames.spec.ts` is red for the re-fitted entries until plan 05" and its `--exclude`
    command** (plans 03, 04, 05): green throughout - the fixture samples an untouched run with no
    finger and no re-fit has a floor - and a vitest project config's `exclude` overrides the CLI
    flag, so the exclusion had no effect when run once anyway. "The ten re-fits move (a coloured dark
    layer raises the resting bytes by the floor)" was wrong on both counts: `frames.json` came back
    byte-identical at 12.1-05, 12.1-08a and 12.1-08b.
13. **Plan 05's "GHOST and any demo-driven card whose gesture goes through `cellToCoord` moves"**:
    GHOST's OG moved (5,234 → 5,197) because it was the one demo card still on `x*9//128`; MORPH's
    and TRACKPAD's did not, for frame-level reasons. Plan 08a's "adds the layer-0 gradient to the
    demo frame": the OG is captured after the lift, so `G` adds nothing and the picture is the
    pre-12.1-05 one again (5,234 B).
14. **`Coverflow.svelte:519-520`** (D-21, R-8, plan 08's third file): 13-09 deleted the file; the
    second `mapAxis` site is the workspace route's `+page.svelte:447` (436 when 12.1-05 wrote its
    sentence; 13-11 and 12.1-07 added lines above it).
15. **The runbook rows lettered I and J in plan 08's first draft** collided with 13-12's row I; the
    plan-check caught it and the rows are **J and K**, read from `13-12-SUMMARY.md`. The runbook
    total is **eleven**, not the ten `12.1-VALIDATION.md:97` writes for 12.1 alone (its "11 with
    13-12's row" is right).
16. **Plan 08's needle table missed a count of three** (the CLEAR test's tail at 9, found by the
    first chunk run and moved to 12) **and said "the timer fetch is still the last chunk"** - the
    Setup fetch is, in `SLOTS` order (12.1-08 deviations 2, 3).
17. **Plan 08b's "JOYSTICK 543 → 492"** is 491 through the compiler (the harness read
    `max(raw, compressed)` over a space the joiner never writes); **its "the deltas are
    knob-independent"** holds for seven and not NINE PADS (+15 at 4x4, +11 at 3x3); **its
    "`reachability.sweep.spec.ts`: table moves, assertion unchanged"** moved one literal (271 → 260);
    **its "eslint still runs on them"** is not the tree's configuration; **its SUMMARY's "44,078
    states"** is 44,846 (the sweep's own print, here and there).
18. **Plan 08b did not run the e2e suite and left `fidelity.e2e.ts` red** from `dbfb3e7` (above,
    Rule 1 at this gate); `12.1-VALIDATION.md`'s D-26 section scheduled it "+0, `grep -c`", which
    proves a title count and not a run. Named as this gate's own hole in the validation plan.
19. **This gate's plan**: the negative check "move `ROW_COUNT` to 27 … red naming 26" is written for
    a tree at 26; the tree is at 28, so it was run as 28 → 29, red naming 28. "The manifest's 6
    `files` rows and 22 `intendedDivergence` rows unchanged" is 22 + 16 since 12.1-08b, as the
    plan's own amendment says. Task 02's "at most the eight re-aligned rows deleted" counts the
    criterion lines and not the coverage rows the same task says to extend: fifteen lines move
    (seven criteria, eight coverage rows). The amendments are dated **2026-09-12**, the day the gate
    ran, not the plan's 2026-09-11 (12-12's deviation 6, the same rule), so the plan's verify grep
    `"amended 2026-09-11 by plan 12.1-09"` reads 0 and the dated form reads 7. `docs/CALIBRATION-PROBE.md`
    in task 03's `<files>` is not edited by a checkpoint. The plan's chain block and every prose
    "nine" above its amendment are superseded, listed above.
20. **13-09's stated term −11 against its parts' −9** (above): the one place the two phases'
    ladders do not meet by two, caused by 12.1-01's baseline absorbing two of 13-09's uncommitted
    tests; 13-20's.
21. **`12.1-CONTEXT.md` D-11 and D-03 quote 255/6 at 714 / 683**, `12.1-02-SUMMARY.md` at 713, and
    the research at 683: planning records, pointed at and not edited; the tree is 873.
22. **12.1-08a's "the observed baseline 89 / 921"** was 90 / 927 with 13-12's +1 / +6 on disk, and
    its N1 negative check came back green until the 37th test gained a second-finger clause - a
    missing clause, recorded there and here.
23. **12.1-07's SUMMARY says `model.spec.ts` 13 → 14**; the file was **12 → 13** (12 at `91ab755`
    and at `98e3868`, its own start; 13 at `ab2ee64` and at this gate, by `git show` and by the
    runner's JSON). The term `+1` is right and the absolute figures are one high - the plan-check
    ("`model.spec` 12 -> 13") and `12.1-VALIDATION.md`'s per-file row (`+1`) had it right.

### The two negative checks

1. **`audition.spec.ts`'s `ROW_COUNT`, 28 → 29** in a scratch copy written over the tree (the plan
   said 27 → the tree is 28): **red**, one test, `checklist rows: expected 28 to be 29`, 3 passed.
   Restored from the scratch copy, sha256 `2b5c3781…` both sides, `git diff --quiet` exit 0.
2. **One `intendedDivergence` row's `reason` emptied** (`tests/pad.test.js`'s one row, the
   occurrence counted at exactly one before the write): `vendored-diff.spec.ts` **red** on "every
   intended divergence is justified", naming the file and the field -
   `src/vendor/botor/tests/pad.test.js: intended divergence "    expect(lua).toContain(…": reason
must be a sentence saying what behaviour changed and why. Got: ""` - 14 of 15 green. Restored,
   sha256 `dae35d39…` both sides - **not 12-12's `8853783d…`**, because 12.1-08b's sixteen rows are
   in the file since `dbfb3e7`; `git diff --quiet` exit 0.

A third, from task 02: the requirements script run against a scratch copy with one id misspelled
(`CAT-O4`) refuses on the occurrence count (`expected exactly one line, found 0`) and writes
nothing - the copy is byte-identical afterwards.

### The gate holes, recorded

- **`decay-idiom.spec.ts` is blind to a `D(` call and, since 12.1-08b, to a `K(` call.** `K` stamps
  each of its four cells through `D` with a start quantised to a multiple of 6, from the library
  (255/6) and from the compiler's emitted comet (AURORA, STARFIELD, RADAR, DIAL, PINWHEEL); the gate
  reads literal `glpfs` / `glt` pairs and sees neither. What proves the stamps land is
  `library.spec.ts` test 6 (121 stamps at 102 points, every one observed at 0 after sixty ticks),
  `lua-smoke.spec.ts` 38 and `lua-parity.spec.ts` 6. The honest clause is still textual and more
  than one assertion; carried in `deferred-items.md` section A, not half-built here.
- **The escaped-quote lesson (12.1-06 deviation 3).** A literal planted double-quoted in a
  TypeScript source arrives with escaped inner quotes, and both a `grep` for the raw text and a
  plain `includes()` read past it - a negative check came back green for a reason that was about
  the check. `constants.spec.ts` now strips backslashes before its `includes` and forbids the one
  non-Lua word of the body on its own. Any future source-scan assertion for a quoted literal must
  do the same or say why not.
- **A negative check that comes back green is a missing clause, not a pass** (12.1-08a's N1: `G`
  before the id gate reddened nothing until a second-finger clause existed; 12.1-05's old-fixture
  check was vacuous because the fixture had not moved and was replaced by a tripwire).
- **A declared e2e zero is a count of titles, not a run** (12.1-08b, above). The validation plan
  scheduled the suite in two plans of eleven; a plan that changes what a preset compiles to, or any
  state an e2e fixture compares against, must run the chunk that reads it.
- **The audition table's cost cells are still gated by nothing.** Eleven rows moved this phase and
  every one was carried by the plan that moved it; the gate re-measured all eighteen and found them
  right, which is the first time since the table existed that a gate found no stale row. The
  closing shape - `audition.spec.ts` reading `renderLua` - is still not built (12-12's note, carried).
- **`check-counts.mjs` has no direction and misreports a red run** (12-04, 12-12), unchanged.
- **The presets' emitted Lua is not a fixed point** of the minifier (the marker's trailing space)
  and is costed raw; `presets.spec.ts` pins the raw figure, and no gate asserts the compressed one.

## Phase 13's suites, measured at the gate

**Every count below was observed on 2026-09-12 at the Phase 13 gate (plan 13-20)**, on the tree at
`24e2790` (clean apart from the user's three untracked root files), against a fresh production
build, from five `vitest run --project server --maxWorkers=2` runs (three whole and green before
the gate's own string landings, one with the JSON reporter for the per-file table, one whole and
green after the landings), one sweep, and the Playwright suite twice in five file chunks on fresh
detached servers, plus a third pass over the two chunks whose strings the gate moved.
`.planning/phases/13-gui-overhaul/13-VALIDATION.md` carried a projected delta table, a per-file
table and a twenty-term chain from planning time, and two of its terms were corrected at the
plan-check; the tables here are the observations that replace them, and every disagreement is
named in "Where the planner was wrong" below rather than corrected quietly. **Nothing in this
section is hardware-verified**: no agent in Phase 13 connected to a ZONA, wrote to one or deployed.
The two probes of 2026-09-10 were the user's (cell 80, twice, through `/dev/install/` and Grid
Editor); every claim about the page switch, the rotary Knob and the Sandbox install below is
subordinate to runbook rows I, L, M and H, which are still the user's.

**This section is appended, and nothing above it is reflowed.** Phase 12.1 ran its nine plans in
the same tree while Phase 13 was open (Band 1 beside 13-08..13-13, Band 2 between 13-12 and
13-14, its gate before 13-14), and its gate (12.1-09) appended the section above this one with the
Phase 13 offset it saw; this section states the 12.1 offset once and both ends meet. Where an
earlier section of this document now states a stale count, the correction is listed by line under
"Corrections to earlier sections, by line" and the line itself is left standing.

### The tree this gate measured is shared, and the 12.1 offset is stated once

Phase 13's chains below run from **the block 12-12 left** - the carried block, `85 files / 888
tests (+1 todo) / 87 e2e titles / 106 runs / catalog 26 (8 + 18) / static/og/ 26 / audition 23 /
runbook 7 (A-G) / sweep 4 19` - in **twenty** terms and end at **93 / 936 / 83 / 99**. The tree at
`24e2790` reads **94 / 961 (+1 todo) / 83 / 99**. The difference is Phase 12.1's, read from
`12.1-09-SUMMARY.md`'s "The 12.1 offset, stated once for 13-20" and reproduced here from the
runner's per-file JSON against a textual count of the same files at `eb79e3c` (13-01's baseline
commit): **tests +25, files +1, e2e +0 / +0, audition +5, runbook +2, catalog +0, OG +0**, plus
**12-10's +1 test** (the TRACKPAD smoke test, which landed between 13-06 and 13-07 and is inside
12-12's 888). `888 + 48 + 25 = 961`; `85 + 8 + 1 = 94`; `87 − 4 + 0 = 83`; `106 − 7 + 0 = 99`;
`23 + 0 + 5 = 28`; `7 + 4 + 2 = 13`. **Both ends meet on every row.**

**13-01's offset, applied once.** 13-01 observed `85 / 887` against 12-VALIDATION's projected
`85 / 888` and recorded `−1`; that `−1` was 12-10's unlanded `+1`, which landed on 2026-09-11
between 13-06 (observed 902 at its close) and 13-07 (observed 903 at its start). 12-12's chain ends
at `85 / 888` and its tree at `fed9c17` read `88 / 903 = 888 + 15` with Phase 13's first six terms,
so 12-12's observed pair IS the projection's pair, and the offset 13-01 carried, and 13-02, 13-03
and 13-04 carried after it, closed itself the day 12-10 landed. It is applied here as the +1 in
the sentence above and nowhere else; 13-05 was the first plan whose carried literal matched the
tree, and its SUMMARY says why.

### The twenty-term chains, every zero written out

**The columns are waves, and wave order is not plan order** (13-13 at wave 12, 13-12 at wave 13,
as 13-VALIDATION.md's dated correction says). The order the plans EXECUTED in was a third one -
`01 02 03 04 05 06 | 12-06 12-10 12-12 | 07 08 | 12.1-01 | 09 | 12.1-02 12.1-03 | 10 | 12.1-04
12.1-05 | 11 13 | 12.1-08a | 12 | 12.1-06 12.1-07 12.1-08 12.1-08b 12.1-09 | 14 15 16 17 18 19 20`

- and every chain is unmoved by that, because every term is a delta on the baseline its plan
  observed.

```
wave            01  02  03  04  05  06  07  08  09  10  11  12  13  14  15  16  17  18  19  20
plan            01  02  03  04  05  06  07  08  09  10  11 [13][12] 14  15  16  17  18  19  20
tests    888    +2  +0  +5  -8  +6 +10  -2  +3  -9  -1  +3  +8  +6  +9  +7  +6  +3  +0  +0  +0  = 936
files     85    +1  +0  +0  +0  +1  +1  +0  +0  -1  -1  +0  +2  +1  +2  +1  +1  +0  +0  +0  +0  =  93
e2e ttl   87    +1  +0  +0  -4  +0  +0  -6  +0  +0  +0  +0  +1  +1  +0  +0  +2  +1  +0  +0  +0  =  83
e2e run  106    +2  +0  +0  -8  +0  +0  -6  +0  +0  +0  +0  +1  +1  +0  +0  +2  +1  +0  +0  +0  =  99
catalog   26    +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  =  26, 8 + 18
og        26    +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  =  26 (154,136 B)
audition  23    +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  =  23 by Phase 13; 28 with 12.1's five
runbook    7    +0  +1  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +1  +0  +1  +0  +1  +0  +0  +0  =  11 by Phase 13 (H, I, L, M); 13 with 12.1's J and K
allowlist 33    -1  +0  -1  -4  +0  +0  +0  -5 -16  -5  -2   -   -   -   -   -   -   -   -   -   =   0 declarations, 0 rows (16 rows to 0)
circles    6    +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  =   6 (D-15; the lines moved at 13-09)
sweep   4 19     -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   = 4 19
```

**Eleven rows, twenty terms each, the count of terms asserted at twenty on every row and the
twenty column headers asserted to be the twenty wave numbers with 13-13 at wave 12 and 13-12 at
wave 13** - counted, not described. There are twenty `13-*-PLAN.md` files (`ls | wc -l` 20);
the chain block in `13-VALIDATION.md` has twenty plan columns; this block has twenty. Every
statement of the form `<number> terms` / `<number>-term` / `<number> plans` was grepped in
`13-VALIDATION.md` and in `13-20-PLAN.md`: every term-count statement reads twenty
(`13-VALIDATION.md:84, :86` twice, `:500`, `:717`; `13-20-PLAN.md:19, :26, :141, :154-156, :160,
:311, :329, :348, :364, :368, :408, :534, :565`), every reconciliation statement reads twenty-seven
(`13-VALIDATION.md:489, :497, :500, :501`; `13-20-PLAN.md:183, :193, :196, :197, :350, :367`), and
`13-20-PLAN.md:41`'s "Nineteen plans" counts the plans before the gate, which is nineteen.
(`13-VALIDATION.md:659`'s "Twelve plans" is the build-required list, not a term count.) **The one
count both documents get wrong is not a term count: "twenty-seven names" (`13-VALIDATION.md:76,
:334, :452, :716`; `13-20-PLAN.md:231` "all twenty-seven")** - the catalog has been 26 = 8 + 18
since 12-10, as 12-12 and 12.1-09 record and as 13-19 named; twenty-six names, eighteen of them
moved.

`2+0+5−8+6+10−2+3−9−1+3+8+6+9+7+6+3+0+0+0 = 48`; `1+0+0+0+1+1+0+0−1−1+0+2+1+2+1+1+0+0+0+0 = 8`;
e2e titles `1+0+0−4+0+0−6+0+0+0+0+1+1+0+0+2+1+0+0+0 = −4`; runs `2+0+0−8+0+0−6+0+0+0+0+1+1+0+0+2+1+0+0+0 = −7`.
**Every term checked against its plan's own count line**: the observed `PREV_TESTS` ladder in the
SUMMARYs is 887 → 889 (01), 889 → 889 (02), 889 → 894 (03), 894 → 886 (04), 886 → 892 (05),
892 → 902 (06), 903 → 901 (07, with 12-10's +1 landed between), 901 → 904 (08), 904 → 899 (09,
through 12.1-01's +4, stated −11, −9 by its parts - below), 906 → 905 (10, 12.1-02's +7 between),
907 → 912 (11, 12.1-03's and 12.1-04's +4 between, 12.1-05's +1 during), 913 → 921 (13), 921 → 928
(12, 12.1-08a's +1 during), 936 → 945 (14, 12.1's Band 2 and gate between), 945 → 952 (15),
952 → 958 (16), 958 → 961 (17), 961 → 961 (18, 19, 20), and every step is its plan's term on the
baseline it observed.

**The one term whose SUMMARY states a different number is 13-09's, and 12.1-09 named it first.**
`13-09-SUMMARY.md` states `−1 / −11`, measured as `910 → 899` against 12.1-01's close; its own parts
are `+2 −8 −1 −2 = −9`; and 12.1-01 had observed **906** where 13-08 left **904** because two of
13-09's in-flight `tune-ui.spec.ts` tests were already on disk uncommitted, so its ladder counts
them once inside the 910 and once more in the −11. The term is **−9**, the sentence in 13-09's
SUMMARY is left standing and pointed at, and the chain's 936 needs it: `888 + 48 = 936` and
`936 + 25 = 961` only at −9.

**The four negative test terms and the two negative file terms are the first this project has
had, and 13-01 proved the count gate against a negative delta before any of them landed.** Its
three drives, quoted from `13-01-SUMMARY.md` with their exit codes: (a) one test fenced out with
the file kept - `check-counts.mjs 85 886` exit **0**, `85 887` exit **1** printing `tests: observed
886, expected 887`; (b) one two-test file moved out - `84 885` exit **0**, `85 885` exit **1**
(`files: observed 84, expected 85`), `84 887` exit **1** (`tests: observed 885, expected 887`),
`85 887` exit **1** printing both; (c) the todo unmoved at 1 across all three, owned by
`src/lib/fidelity/firmware-oracle.spec.ts:209`. The two red strings of (b) are different strings,
which is what lets a plan that deletes tests (13-04, −8 with the file kept) be told apart from a
plan that deletes files (13-07, 13-09, 13-10). **Ten negative terms landed**: tests −8 (13-04), −2
(13-07), −9 (13-09), −1 (13-10); files −1 (13-09), −1 (13-10); e2e titles −4 (13-04), −6 (13-07);
runs −8 (13-04), −6 (13-07) - the projection's ten, with two of the four test terms at a different
size (below). The todo is still 1 and still `firmware-oracle.spec.ts:209`.

**The e2e tagging arithmetic, as observed:**

```
titles 87 − 5 (aesthetic.e2e, all @webkit, 13-04) + 1 (radius, @webkit, 13-01) + 1 (reduced motion re-homed, @webkit, 13-04)
          − 7 (first-experience: the splash and coverflow titles, 13-07) + 1 (the intro, 13-07)
          + 1 (the page target, 13-12) + 1 (import validation, 13-13) + 2 (the Sandbox, 13-16) + 1 (the Sandbox install, 13-17) = 83
tagged 19 − 5 + 1 + 1 = 16        runs 83 + 16 = 99        npx playwright test --list: "Total: 99 tests in 15 files"
```

`grep -c "test("` over `e2e/*.e2e.ts` sums to 83 (artifacts 3, browse-webkit 4, browse 12, catalog
2, fidelity 2, first-experience 5, install 15, library 1, radius 1, sandbox 3, session 14, skeleton
2, smoke 4, tuning-webkit 5, tuning 10); sixteen titles carry `@webkit`.

### The per-file reconciliation, from the runner's JSON

`vitest run --project server --reporter=json` at `24e2790` (the fourth quick run, 94 / 961 / 1
todo) against a textual `it(` count of every spec at `eb79e3c` (13-01's baseline commit, 85 / 887),
calibrated file by file at HEAD: the four `it.each` files (`golden-frames` 11, `preset-baseline`
20, `vendored-diff` 15, `format-parity` 3) are the only ones where the textual count differs from
the runner's, they are unchanged either end, and their 40 expansions are exactly the difference
between the textual 847 and the observed 887. Every other changed file:

| File                                   | `eb79e3c` | HEAD | delta   | Whose                                                                    |
| -------------------------------------- | --------- | ---- | ------- | ------------------------------------------------------------------------ |
| `src/lib/ui/radius.spec.ts`            | -         | 2    | **+2**  | 13-01                                                                    |
| `src/lib/ui/identity.spec.ts`          | 7         | 11   | **+4**  | 13-03                                                                    |
| `src/lib/ui/font-assets.spec.ts`       | 5         | 6    | **+1**  | 13-03                                                                    |
| `src/lib/ui/aesthetic.spec.ts`         | 8         | 1    | **−7**  | 13-04 (−6) and 13-09 (−1, scan 4)                                        |
| `src/lib/ui/instrument.spec.ts`        | 6         | 4    | **−2**  | 13-04                                                                    |
| `src/lib/ui/shell.spec.ts`             | -         | 6    | **+6**  | 13-05                                                                    |
| `src/lib/store/local.spec.ts`          | -         | 10   | **+10** | 13-06 (the projection's 7)                                               |
| `src/lib/ui/glyph-field.spec.ts`       | 5         | -    | **−5**  | 13-07                                                                    |
| `src/lib/ui/intro.spec.ts`             | -         | 4    | **+4**  | 13-07                                                                    |
| `src/lib/catalog/front-door.spec.ts`   | 8         | 5    | **−3**  | 13-07 (−1, the adjacency property) and 13-09 (−2, the two window titles) |
| `src/lib/ui/browse-ui.spec.ts`         | 6         | 9    | **+3**  | 13-08                                                                    |
| `src/lib/ui/tune-ui.spec.ts`           | 9         | 11   | **+2**  | 13-09 (+2), 13-10 (−2 +2)                                                |
| `src/lib/tune/surprise.spec.ts`        | 5         | 6    | **+1**  | 13-10 (the scope test - the projection put it in `tune-ui`)              |
| `src/lib/coverflow/slots.spec.ts`      | 8         | -    | **−8**  | 13-09                                                                    |
| `src/lib/tune/mix.spec.ts`             | 2         | -    | **−2**  | 13-10                                                                    |
| `src/lib/ui/device-ui.spec.ts`         | 13        | 17   | **+4**  | 13-11 (+3), 13-12 (+1)                                                   |
| `src/lib/protocol/descriptors.spec.ts` | 13        | 14   | **+1**  | 13-12                                                                    |
| `src/lib/device/page-target.spec.ts`   | -         | 4    | **+4**  | 13-12                                                                    |
| `src/lib/store/transfer.spec.ts`       | -         | 4    | **+4**  | 13-13                                                                    |
| `src/lib/store/collections.spec.ts`    | -         | 4    | **+4**  | 13-13                                                                    |
| `src/lib/sandbox/geometry.spec.ts`     | -         | 4    | **+4**  | 13-14                                                                    |
| `src/lib/sandbox/emit.spec.ts`         | -         | 5    | **+5**  | 13-14                                                                    |
| `src/lib/sandbox/runtime.spec.ts`      | -         | 7    | **+7**  | 13-15                                                                    |
| `src/lib/ui/sandbox-ui.spec.ts`        | -         | 6    | **+6**  | 13-16                                                                    |
| `src/lib/device/install.spec.ts`       | 23        | 27   | +4      | **13-17 (+3)** and 12.1-07 (+1)                                          |
| `src/lib/catalog/calibration.spec.ts`  | -         | 4    | +4      | 12.1-01                                                                  |
| `src/lib/catalog/library.spec.ts`      | 3         | 6    | +3      | 12.1                                                                     |
| `src/lib/sim/lua-host.spec.ts`         | 11        | 13   | +2      | 12.1                                                                     |
| `src/lib/sim/lua-smoke.spec.ts`        | 28        | 38   | +10     | 12.1 (+9) and 12-10 (+1)                                                 |
| `src/lib/sim/touch.spec.ts`            | 8         | 9    | +1      | 12.1                                                                     |
| `src/lib/protocol/constants.spec.ts`   | 8         | 9    | +1      | 12.1                                                                     |
| `src/lib/transport/sequence.spec.ts`   | 12        | 13   | +1      | 12.1                                                                     |
| `src/lib/tune/model.spec.ts`           | 12        | 13   | +1      | 12.1                                                                     |
| `src/lib/device/snapshot.spec.ts`      | 8         | 9    | +1      | 12.1                                                                     |
| `src/lib/fidelity/lua-parity.spec.ts`  | 5         | 6    | +1      | 12.1                                                                     |
| sum                                    | 85 files  | 94   | **+74** | **Phase 13 +48 (25 files) + 12.1 +25 + 12-10 +1**; `887 + 74 = 961`      |

**The twenty-seven-term reconciliation, derived and not typed.** The projection's twenty-seven
terms (`13-VALIDATION.md:489`) come to `+47`. The observed rows in the same order, with the three
that differ in bold and the one row the table lacked appended:

```
radius +2 | identity +4 | font-assets +1 | aesthetic −7 | instrument −2 | shell +6 | local **+10**
glyph-field −5 | intro +4 | front-door **−3** | browse-ui +3 | tune-ui **+2 −2 +2** | slots −8 | mix −2
device-ui +3 +1 | descriptors +1 | page-target +4 | transfer +4 | collections +4
geometry +4 | emit +5 | runtime +7 | sandbox-ui +6 | install +3 | surprise **+1**

2+4+1−7−2+6+10−5+4−3+3+2−2+2−8−2+3+1+1+4+4+4+4+5+7+6+3+1 = 48   in TWENTY-EIGHT terms over twenty-six files
```

Twenty-eight because the projection's `tune-ui +2 −2 +3` was three terms for two plans and the third
of them landed in `surprise.spec.ts` as its own row (13-10 said so: "the plan allowed 'say which
file'"); as terms the row count is the projection's twenty-seven plus one, as files it is
twenty-six. The two ends agree at `+48`, which is one more than the projection's `+47` for the three
reasons named: `local.spec.ts` +10 for +7 (13-06, "Ten, not seven"), `front-door.spec.ts` −3 for −1
(13-09 deleted the two window titles 13-07 had kept and named for it), and the scope test's file.
The chain and the per-file table agree with each other and with the tree; **the per-file table in
13-VALIDATION.md is wrong on two rows and short by one**, and this is the plan that says which.

### The files this phase created, and the files the gate does not count

Ten spec files created (the count gate's +8 with `glyph-field`, `slots` and `mix` deleted):
`radius.spec.ts` 2, `shell.spec.ts` 6, `local.spec.ts` 10, `intro.spec.ts` 4, `page-target.spec.ts`
4, `transfer.spec.ts` 4, `collections.spec.ts` 4, `geometry.spec.ts` 4, `emit.spec.ts` 5,
`runtime.spec.ts` 7, `sandbox-ui.spec.ts` 6 - eleven files, 56 tests, less the three deleted files' 15. Not counted by `check-counts.mjs` and counted by `svelte-check`: `radius-allowlist.ts` (the one
declaration the three radius layers share), the six shell components and `layout.ts` and
`shell.svelte.ts`, the eight store modules, the four intro files, `labels.ts` and `rail.ts`, the
workspace route and its `inspector-copy.ts` and `Swatch.svelte`, `monitor.ts` and
`MidiMonitor.svelte`, `page-target.ts`, the My configs route with `LibraryTable`, `LibraryRow`,
`CollectionsPanel`, `transfer.ts`, `collections.ts`, the fourteen `src/lib/sandbox/` modules and
components, the Sandbox routes, `land.ts` and `SurfaceActions.svelte`. `svelte-check` reads **657
files, 0 errors, 0 warnings** in 28 s; it read 581 at 13-01's baseline and 627 at 12.1-09's gate.
It is provenance, not a chain: the plans' stated check terms sum to +70 (13-01 +2, 03 +1, 04 +1, 05
+9, 06 +9, 07 +4, 08 +4, 09 −4, 10 −1, 11 +1, 13 +11, 12 +3, 14 +7, 15 +2, 16 +19, 17 +2) and with
12.1's +2 and 12-10's +1 reach 654, three short of the observed 657; 13-11 observed 612 where 13-10
had left 609 and 12.1's plans had added 2, and the three files that make the difference were not
named by any SUMMARY. Reported, not asserted, as every gate before this one has said.

### The standing gates, re-read at the gate rather than assumed

`git diff --stat HEAD -- src/vendor/` is empty (`git diff --quiet` exit 0) and has been at every one
of the twenty plans: **no vendored byte moved in Phase 13**. `upstream-manifest.json` sha256
`dae35d39…`, the 12.1-08b figure, 6 files / 38 `intendedDivergence` rows (`_pad.ts` 18,
`pad-sim.ts` 14, `tests/pad.test.js` 1, `tests/pad-sim.test.js` 5, `pad-sim-host.ts` 0,
`tests/pad-invariants.test.js` 0); `vendored-diff.spec.ts` 15 green in all five runs.
`preset-baseline.json` `187c31fc…` (last commit `d85495a`), `golden-frames.json` `bf54f15c…`,
`frames.json` `9f9cd666…` - all three the hashes 12.1-09 recorded; 13-19's id re-case negative check
went red on twelve tests across five specs because they read these. `firmware-oracle.spec.ts` 7 + 1
todo, byte-unedited since `b3a554d`, green five times; `protocol-pin.spec.ts` 5 green and unedited since `85505e2` (07-01); `forbidden-instructions.spec.ts` 5
green and unedited by the gate - its last edit is 13-12's `53649bc`, which widened the list of
classes the page target may send (its deviation 1), the one edit any Phase 13 plan made to it. `lua-parity.spec.ts` 6,
`decay-idiom.spec.ts`, `touch-guard.spec.ts` 3, `e2e/catalog.e2e.ts` 2, `e2e/fidelity.e2e.ts` 2,
`e2e/artifacts.e2e.ts` 3, `e2e/skeleton.e2e.ts` 2 all green in every chunk that carried them.

### The three-layer radius gate, asserted EMPTY - this phase's proof of D-01

| Layer                       | Observed at the gate                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A, the source scan          | `radius layer A: 33 declarations in 68 files scanned; 0 above zero remaining in 0 allowlisted files (); 6 circles (D-15): src/lib/ui/ColourPicker.svelte:840, :867, :882, src/lib/ui/Knob.svelte:730, :785, :807; 27 exempt` - **`ALLOWLIST` is `[]`**, the six pairs set-equal to `CIRCLES` and to D-15 as 13-09 amended it                                  |
| B, the built-CSS scan       | `radius layer B: 35 radius declarations in 16 built stylesheets; 6 of them 50%; tolerated values from the allowlist: none` against the build of 08:44Z, newer than the newest source                                                                                                                                                                          |
| C, the computed-style sweep | `radius layer C: 12 routes, 2793 elements, 87 circles measured square; STRICT (the allowlist is empty)` in chromium and `2864 elements, 87 circles` in webkit-phone; `/playground/aurora/` 47 (knob:dot, knob:home, picker:home, picker:thumb, picker:tick), `/playground/arc/` 13 (knob:dot, knob:home, knob:thumb), `/sandbox/?new` 27 (the picker's three) |

The allowlist started at sixteen rows and thirty-three declarations on 2026-09-11 (13-01; the
planner's 43 counted two comment lines and its 41 held two `inherit`s) and reached zero at 13-11 the
same day: 13-03 −1 (the pill), 13-04 −4, 13-08 −5, 13-09 −16, 13-10 −5, 13-11 −2. Every row was
removed by the plan named on it, none was edited to a smaller number by anyone else, and
`app.css:442`'s `999px` pill was removed, not re-skinned. **The six circles' boxes, measured in
both engines on the served build** (a probe outside the suite, `getBoundingClientRect` on every
element computing `50%`):

| Circle (D-15, line at HEAD)         | chromium          | webkit-phone (iPhone 15) | Where                                     |
| ----------------------------------- | ----------------- | ------------------------ | ----------------------------------------- |
| `ColourPicker.svelte:840` the tick  | **2.00 × 2.00**   | **2.00 × 2.00**          | `/playground/aurora/`, 21 on the page     |
| `ColourPicker.svelte:867` the thumb | **12.00 × 12.00** | **12.00 × 12.00**        | `/playground/aurora/`, 3                  |
| `ColourPicker.svelte:882` the home  | **2.00 × 2.00**   | **2.00 × 2.00**          | `/playground/aurora/`, 3                  |
| `Knob.svelte:730` the dot           | **8.00 × 8.00**   | **8.00 × 8.00**          | `/playground/aurora/`, 24                 |
| `Knob.svelte:785` the slider thumb  | **12.00 × 12.00** | **12.00 × 12.00**        | `/playground/arc/`, 1 (the 16-value knob) |
| `Knob.svelte:807` the home mark     | **2.00 × 2.00**   | **2.00 × 2.00**          | `/playground/aurora/`, 8                  |

`|w − h| = 0.000` on every one, in both engines. The six lines were re-read at HEAD and each reads
`border-radius: 50%;`; `grep -rn border-radius src` finds no other value above zero outside a
comment. **A seventh `50%` anywhere is red** (13-01's negative checks proved the set-equality both
ways: a squared circle is red under layer A by its line, a `50%` on a 40 × 24 box is red under
layer C by its box).

**The gate's negative check, as the plan asked: one `border-radius: 2px` planted in
`src/lib/ui/shell/Footer.svelte:118`.** Layer A caught it first, in 85 ms, naming
`src/lib/ui/shell/Footer.svelte:118 border-radius: 2px`. Layer B was red at the same moment for a
different reason - `Footer.svelte was modified after build/_app/immutable/assets was written … the
build is stale and a scan of it proves nothing` - and, after a rebuild, red on the value itself:
`build/_app/immutable/assets/0.BJ6xdJgt.css: border-radius: 2px` with `tolerated today: nothing -
the allowlist is empty`. Layer C, against that build, was red in **both** engines, naming
`<footer.footer data-testid="shell-footer"> computes border-radius 2px | 2px | 2px | 2px and the
allowlist is empty: never a rounded corner (D-01)` on all twelve routes. The file was restored from
its copy (sha256 `d6cec79c…` either side, `git diff --quiet` exit 0), the build redone, A and B green
again. **A, then B by staleness, then B by value, then C; three layers, three different sentences,
and the order is the cost order.**

### e2e

Fifteen files, 83 titles, 99 runs. The suite cannot run in one process on this machine (13-07's
finding: wrangler 4.128.0 dies with an empty `ProxyController` error in any run over about 85 s,
however started); it ran in five file chunks on fresh detached servers stopped through PowerShell
(`e2e-chunks-1208.sh`'s shape, 12.1-08's copy), every chunk read through its own log, never through
`grep` or `head`, and every red rerun alone at `--workers 1`.

### The gate's runs, with the memory beside each

The machine had between **0.05 and 1.33 GB of 16 GB free** at the start of each command; the
figure beside each is what it had then.

| Run                                                                   | Free    | Result                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                       | 0.05 GB | **657 files, 0 errors, 0 warnings**, 28 s                                                                                                                                                                                                                                                   |
| `npm run lint`                                                        | 0.92 GB | clean (prettier and eslint), 56 s                                                                                                                                                                                                                                                           |
| quick 1 (`--maxWorkers=2`)                                            | 0.78 GB | **94 / 961 / 1 todo**, green, 50.7 s; `check-counts.mjs 94 961` matches                                                                                                                                                                                                                     |
| sweep                                                                 | 0.23 GB | **4 / 19** in 91.8 s (96 s wall); reachability 20,270 + 24,576 = **44,846** in 87.4 s, laddered 8, over budget 0; `lua-entries` 1,140 / 2,280 over 18; the kind cross-product 1,296 in 2.6 s, worst 906 of 908 at `none/none/trackpad/hi=false/grid=false`; `check-counts.mjs 4 19` matches |
| `npm run build`                                                       | 0.22 GB | 40 s; 26 OG images, **154,136 B**, byte-identical to 13-19's                                                                                                                                                                                                                                |
| quick 2 (after the build)                                             | 0.07 GB | **94 / 961 / 1 todo**, green, 45.0 s                                                                                                                                                                                                                                                        |
| quick 3                                                               | 0.47 GB | **94 / 961 / 1 todo**, green, 55.6 s                                                                                                                                                                                                                                                        |
| quick 4 (JSON reporter, for the per-file table)                       | 0.38 GB | **94 / 961 / 1 todo**, green, 51.8 s                                                                                                                                                                                                                                                        |
| `radius.spec.ts` alone, verbose                                       | -       | layers A and B green, the lines quoted above                                                                                                                                                                                                                                                |
| e2e run 1, c1 (install, session)                                      | 0.22 GB | 33 + 1: `[webkit-phone] install.e2e.ts:1977` CLEAR, `CONFIG/EXECUTE` **6 for 5** (a retried write counted; the title scripts a 200 ms acknowledgement delay under a 250 ms `executeMs` - a 50 ms margin the phone engine loses under load)                                                  |
| e2e run 1, c2 (browse, browse-webkit)                                 | 0.34 GB | 20 + 1: `[chromium] browse.e2e.ts:343` searching and tag chips - `write UNKNOWN` on the CDP pipe at `expectCount`, then `Test ended`                                                                                                                                                        |
| e2e run 1, c3 (tuning, tuning-webkit)                                 | 0.63 GB | **20 passed**                                                                                                                                                                                                                                                                               |
| e2e run 1, c4 (catalog, fidelity, first-experience, library, sandbox) | 0.41 GB | **13 passed**                                                                                                                                                                                                                                                                               |
| e2e run 1, c5 (artifacts, radius, skeleton, smoke)                    | 1.33 GB | **11 passed** - layer C green in both engines, the tallies quoted above                                                                                                                                                                                                                     |
| run 1's two reds alone, `--workers 1`                                 | 0.11 GB | `browse:343` **passed**; `install:1977` chromium passed, **webkit-phone failed again** (`CONFIG/EXECUTE` 16 for 15 at the end of the title); alone in its own project at 0.40 GB, **failed a third time** (6 for 5)                                                                         |
| e2e run 2, c1                                                         | 0.08 GB | 29 + 5: `install:1434` (7 for 5), `install:1977` in both projects (6 for 5), `session:851` (the module named itself twice per connect), `session:1009` (six config reads for five) - every one a retried write or read under load, the family 13-12, 13-17, 13-18 and 13-19 recorded        |
| e2e run 2, c2                                                         | 0.33 GB | **wrangler died at the start** (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), src\win\async.c`; the runner read "server did not come up"); 20 + 1 on the late server, not counted                                                                                                |
| e2e run 2, c2 rerun whole                                             | 0.34 GB | 19 + 2: `browse:299` (the sort select's value not `name` in 5 s), `browse:1404` (5 cards for 3 - 13-13's transient)                                                                                                                                                                         |
| e2e run 2, c3                                                         | 0.39 GB | **20 passed**                                                                                                                                                                                                                                                                               |
| e2e run 2, c4                                                         | 0.26 GB | **13 passed**                                                                                                                                                                                                                                                                               |
| e2e run 2, c5                                                         | 1.08 GB | **11 passed**                                                                                                                                                                                                                                                                               |
| run 2's seven reds alone, `--workers 1`                               | 0.30 GB | **7 passed, 1 failed**: `install:1434`, `install:1977` in both projects, `session:851`, `session:1009`, `browse:299`, `browse:569` green; `browse:1404` red (5 for 3); alone again at 0.49 GB **passed** (5.7 s)                                                                            |
| the gate's string landings, then `npm run build`                      | -       | 28 s                                                                                                                                                                                                                                                                                        |
| quick 5 (after the landings)                                          | 0.93 GB | **94 / 961 / 1 todo**, green, 49.6 s; `check-counts.mjs 94 961` matches                                                                                                                                                                                                                     |
| e2e run 3, c1 (the moved failure strings)                             | 0.22 GB | 32 + 2: `install:1434` (7 for 5), `[webkit-phone] install:1977` (`Still writing. Your ZONA is taking longer than usual.` where the reset caption was expected in 5 s); **all 16 session titles green**, the two re-pinned to seven steps among them                                         |
| e2e run 3, c4 (the moved `UNKNOWN_NOTICE`)                            | 0.54 GB | **13 passed**                                                                                                                                                                                                                                                                               |
| run 3's two reds alone, `--workers 1`                                 | 0.24 GB | **3 passed** (`install:1977` in both projects)                                                                                                                                                                                                                                              |
| the negative check's layer C, `--workers 1`                           | 0.57 GB | **red in both engines**, as intended (above)                                                                                                                                                                                                                                                |

Run 1: `34 + 21 + 20 + 13 + 11 = 99` runs, two reds, both green alone in the end. Run 2: `34 + 21 +
20 + 13 + 11 = 99` with one dead server rerun whole, seven reds, every one green alone. **No red
named a page target, a review, a switch, a count this phase wrote, a string 13-18 or 13-19 moved, or
a string this gate landed**; every one is a retried write or read under three workers at a
twentieth of the machine's memory, or a locator that did not settle in 5 s on a cold server. The
one title that was red five times before it was green - `install.e2e.ts:1977` on the phone engine -
is the CLEAR title whose scripted 200 ms acknowledgement delay sits 50 ms under `executeMs`; it is
carried in `deferred-items.md` as a harness margin, not a store defect, because every one of its
extra frames is the store's bounded retry doing what SAFE-09 says it does. `test-results/` removed
after every run; `git status --porcelain` clean of everything but the user's three root files
before each commit.

### The picker-corner re-measurement, replacing the projection

Every hand-authored entry at three corners (`max(text.length, measureLua(text))` after
`padReady()`; the picker corner is every knob at its longest declared value with every colour knob
at `255,255,255`, the corner `lua-entries.sweep.spec.ts` gates; the shortest corner every knob at
its shortest value with colours at `0,0,0`), every string a fixed point of `compressScript` and
`checkSyntax` true; measured by a scratch spec copied into `src/lib/catalog/` for one run and
deleted (12-12's shape; the tree clean after). **Every figure is identical to 12.1-09's table**,
and it should be: 13-19 moved the `name` field of eighteen entry files and nothing else
(`git diff 5c256c5 HEAD -- src/lib/catalog/entries/` is 18 insertions and 18 deletions, all on
`name:` lines); no Lua, no knob value list and no colour list moved in Phase 13. **Every header
agreed** - 12.1-09 found all eighteen right and nothing has changed since; the audition table's 24
Config cells were re-cased in place by 13-19 and its cost cells are 12.1-09's.

| Entry                  | Setup defaults / picker / free | Timer defaults / picker / free | Fixed point, syntax                                                 |
| ---------------------- | ------------------------------ | ------------------------------ | ------------------------------------------------------------------- |
| euclid                 | 722 / **726** / 182            | 233 / **237** / 671            | yes, yes                                                            |
| chorus                 | 819 / **822** / 86             | 29 / **29** / 879              | yes, yes                                                            |
| arc                    | 525 / **528** / 380            | 273 / **275** / 633            | yes, yes                                                            |
| ghost                  | 486 / **491** / 417            | 405 / **409** / 499            | yes, yes                                                            |
| morph                  | 810 / **814** / 94             | -                              | yes, yes                                                            |
| sonar                  | 571 / **572** / 336            | 286 / **289** / 619            | yes, yes                                                            |
| steps                  | 414 / **420** / 488            | 258 / **260** / 648            | yes, yes                                                            |
| console                | 784 / **807** / 101            | -                              | yes, yes                                                            |
| strip                  | 857 / **875** / 33             | -                              | yes, yes                                                            |
| lumen                  | 730 / **733** / 175            | -                              | yes, yes                                                            |
| stage                  | 640 / **653** / 255            | 136 / **136** / 772            | yes, yes                                                            |
| cull                   | 564 / **565** / 343            | -                              | yes, yes                                                            |
| snake                  | 581 / **585** / 323            | 870 / **880** / 28             | yes, yes                                                            |
| quadrant               | 835 / **838** / 70             | -                              | yes, yes                                                            |
| pomodoro               | 733 / **743** / 165            | 647 / **659** / 249            | yes, yes                                                            |
| wheels                 | 882 / **895** / 13             | 338 / **343** / 565            | yes, yes                                                            |
| radar-points           | 592 / **592** / 316            | 286 / **288** / 620            | yes, yes                                                            |
| trackpad               | 903 / **903** / 5              | 508 / **510** / 398            | yes, yes                                                            |
| **the library, 255/0** | **842 / 66**                   | -                              | fixed, syntax true; the nine-part uniform join 843 compresses to it |
| **the library, 255/6** | -                              | **873 / 35**                   | fixed, syntax true; the eight-part join 874 compresses to it        |

The shortest corner: euclid 717 / 232, chorus 812 / 29, arc 515 / 272, ghost 473 / 404, morph 798,
sonar 546 / 286, steps 407 / 257, console 761, strip 835, lumen 712, stage 630 / 136, cull 564,
snake 573 / 854, quadrant 835, pomodoro 716 / 627, wheels 862 / 338, radar-points 562 / 285,
trackpad 903 / 503. The eight presets and the shelf through `compileState` / `costOf` at their
defaults read their declared costs exactly: aurora 361 / 55, pinwheel 413 / 55, starfield 349 / 55,
radar 391 / 55, joystick 491 / 24, ninepads 565 / 158, faders 525 / 24, dial 592 / 55, tpad 902 /
146, every one with `touchLibrary` and `checkSyntax` true and none a fixed point (12.1-09's gate
hole, unchanged: the marker's trailing space). `LIBRARY_GLOBALS` 21; the callers as 12.1-09 listed
them, unmoved (`Q` eight Setups, `G` nine, `X` six, `N` ARC and GHOST, `D` LUMEN, WHEELS and
TRACKPAD, `A` LUMEN, `R` four, `U` TRACKPAD, `Z` STAGE; `W E V Y` library-internal; **`K` no entry**

- the compiler's emitted comet is its caller, as 12.1-08b recorded). The facets: FOR seven summing
  26, FEELS six summing 52; preset-backed 8, hand-authored 18.

### The Sandbox's five costs, and the PDF's page 3 on the wire

Printed by `emit.spec.ts` test 1 and `runtime.spec.ts` test 7 on this tree, every string canonical
on the first round (`rounds 0`), every colour at its dearest:

| Elements at the picker corner (three-digit controllers on channel 16) | Setup, two slots   | Setup, three slots | Room for                                      | The research's |
| --------------------------------------------------------------------- | ------------------ | ------------------ | --------------------------------------------- | -------------- |
| 1                                                                     | **345** (563 free) | 360                | 15 more (cap)                                 | -              |
| 4 (the PDF's page 3)                                                  | **460** (448 free) | 475                | 0 more (budget: a fourth 1 × 6 fader tips it) | 366 (+94)      |
| 8                                                                     | **588** (320 free) | 603                | 8 more (cap)                                  | 498 (+90)      |
| 12                                                                    | **748** (160 free) | 763                | 4 more (cap)                                  | 652 (+96)      |
| 16, the dearest                                                       | **882** (26 free)  | **897**            | 0 more (cap) - D-14 Q4's sixteen fits         | 811 (+71)      |
| 16 at cc 1..16 on channel 1                                           | 841                | 856                |                                               |                |

`M` alone 169 (the research's 165), `J` at four rows 155 (141), the paint 101, the pull-ins 10
(`self:tim()`) and 25 (with `ele[#ele]:map()`), the callback 15, the marker 9. Dead branches: four
vertical faders inline at 805 with the fader branch alone, 1,333 with all four (the research's
697 / 1,166); the split's data half for the same four 456.

**The runtime** (13-15, in a real Lua VM): 1,340 with every branch, **1,042 without the Knob**
(the research's 861, +181; 13-02's re-sketch 738 / 1,042); **the rotary's share 298** (D-08's
150-200, 98 above the top; 13-02's 304); the parts marker 9, arm 10, head 24, `R` 112, `O` 304,
fader-v 121, fader-h 121, button 133, xy 222, knob 297, sweep 10. Two slots, the Timer of 908
beside `gtt(0,100)` and `X(self,20)`: fifteen combinations fit (`v h vh b vb hb vhb x vx hx bx k vk
hk bk`, the largest `bk` 903) and sixteen are over (the smallest `vhx` 938, the largest `vhbxk`
1,370); **three slots, every combination fits**, the worst 1,370 across 1,816. **The PDF's page 3
on three slots, the five strings at the picker corner as `install.spec.ts` lands them**: 255/6
**873** (35 free), 255/0 **842** (66 free), 255/4 **706** (202 free: the head, `R`, `O`, `I[1]`,
`I[3]`), 0/6 **574** (334 free: `gtt(0,100)`, `I[4]`, `I[5]`, `X(self,20)`), 0/0 **466** (442 free:
`J`, `M`, the paint, both pull-ins, the callback). On two slots the same surface lands a Timer of
**1,248 (340 over)** and puts zero frames on the transport. One vertical fader on two slots: Timer
593, 315 free.

### The five-write install shape, as shipped

Since 13-17 every install - a Lua entry, a preset, a Sandbox surface - writes **five** strings
through the one writer in `SLOTS` order: 255/6 (the library's Timer half), 255/0 (the page init and
the library's first half), **255/4** (the utility: a Lua entry lands the firmware's page-next
default `gpl(gpn())` there, 19 characters; a surface lands its runtime's second slot), 0/6, 0/0;
the snapshot holds five under `hangar.snapshot.v4` with v3, v2 and v1 read and flagged; the
classifier names which of five landed in write order over four reachable partials; `PUT BACK`
restores 255/4 with the rest. 12-02's refusal to address 255/4 and 255/6 is gone under D-19
(`constants.ts`'s header says so, dated); `sequence.spec.ts` asserts the five frames under every
caller key order. **Whether the firmware runs a 255/4 body written by `CONFIG/EXECUTE` from the
touch Setup's `ele[#ele]:map()` is runbook row H's question, and whether a catalog entry should
write page-next there at all is batch row J.40, approved and owed** (a landing's empty utility
substituted by the snapshot's own). Nothing of this has reached a module.

### The cost, observed against what was projected

| Thing                                         | Projected / carried                                                       | **Observed 2026-09-12**                                                                                                                                 | Verdict                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| the phase's test total                        | 935 (13-VALIDATION, from 888 + 47); the research's forecast **890-930**   | **936** by the chain (888 + 48); 961 on the tree with 12.1                                                                                              | the projection one low (three terms); the research's forecast six under its own top                                                         |
| the file total                                | 93 (85 + 8); the research's **84-88**                                     | **93** by the chain; 94 with 12.1                                                                                                                       | exact; the research five under                                                                                                              |
| e2e                                           | 83 / 99                                                                   | **83 / 99**, `--list` says 99                                                                                                                           | exact                                                                                                                                       |
| `npm run test:sweep` wall                     | 100 s (12-12), 104 s (12.1-09), 98 s (13-19)                              | **96 s** wall, 91.8 s in Vitest                                                                                                                         | the spread is the machine                                                                                                                   |
| `npm run build`                               | 19 s (12-12), 33 / 17 s (12.1-09), 22.6 s (13-19)                         | **40 s** at 0.22 GB, then 28 s and 27 s                                                                                                                 | the first at a fiftieth of the memory                                                                                                       |
| `static/og/`                                  | 27 files (13-VALIDATION); 26 / 154,136 B (12.1-09, 13-19)                 | **26 / 154,136 B**, byte-identical                                                                                                                      | the projection's 27 is the catalog defect below                                                                                             |
| catalog                                       | 27 (13-VALIDATION); 26 = 8 + 18 (12-12, 12.1-09)                          | **26 = 8 + 18**                                                                                                                                         | document defect, named                                                                                                                      |
| audition rows                                 | 23 (13-VALIDATION)                                                        | **28** (23 + 12.1's five), 24 Config cells re-cased in place, all unanswered                                                                            | the projection predates 12.1                                                                                                                |
| the research's costs 1,067 / 1,166            | one element / four elements inline, all four branches, in the touch Setup | the shape shipped is the split, not the inline: one element **345**, four **460** in the Setup; the inline pair measured at four faders **805 / 1,333** | the research's inline figures were low by about 170 on the all-branches case; the split makes them moot                                     |
| the research's 861 (the runtime)              | four branches, the Knob undefined                                         | **1,042** without the Knob, 1,340 with                                                                                                                  | +181 without the Knob; +479 with                                                                                                            |
| the research's 366 / 811 (the data half)      | four / sixteen elements                                                   | **460 / 882**                                                                                                                                           | +94 / +71 (13-14: "the research was low by about 110 per row" at its first cut; 13-15's per-kind geometry took the sixteen from 922 to 882) |
| the research's 697 (four faders, dead-branch) | inline, the fader branch alone                                            | **805**                                                                                                                                                 | +108                                                                                                                                        |
| D-08's 150-200 (the rotary)                   | the decision's estimate                                                   | **298**                                                                                                                                                 | 98 above the top; 13-02's re-sketch said 304                                                                                                |
| the two-slot ceiling                          | 13-02: three kinds                                                        | **two kinds** (13-15's table)                                                                                                                           | a kind lower; moot under the three slots the user bought, and the re-ask did not fire                                                       |
| `PadSpinner.svelte`                           | the research: deletable                                                   | **three live consumers** (`CatalogCard`, `DeviceMark`, `TryOnDevice`), kept                                                                             | research defect (13-09)                                                                                                                     |
| the allowlist                                 | 43 declarations, fifteen files + `app.css` (the plan); Knob ten / seven   | 41 declarations (two comment lines), 33 to clear in sixteen files, Knob nine / five; **0 / 0 at the gate**                                              | 13-01's re-count; the end state as projected                                                                                                |
| the inspector floor                           | 380 holds the 402px grid (13-05's plan)                                   | needs 454 with the insets; the grid reflows to one column below 454 (D-21, 13-09)                                                                       | plan defect found by a test, decided by the user                                                                                            |

### Where the planner was wrong, named rather than corrected

**Plan defects** (a term that disagrees with its plan's line) and **document defects** (a term
that disagrees with 13-VALIDATION.md), in wave order:

1. **13-04, tests: projected −9, observed −8.** `aesthetic.spec.ts` went 8 → 2, not 8 → 1: scan 4's
   subject was `Coverflow.svelte`, which 13-04 did not touch, so the scan stayed and 13-09 deleted it
   by name. The projection's per-file row "8 → 1" was right about the end and wrong about the plan.
   13-04's own line says −8 and names the reason.
2. **13-06, tests: projected +7, observed +10.** `local.spec.ts` was created with ten (13-06 "Ten,
   not seven": the plan's task 2 said the file gains no test; tests 6-10 were its by necessity).
3. **13-07, tests: projected −1 at planning, −2 at the plan-check, observed −2.** Named because the
   correction has a source (`front-door.spec.ts` carries eight, not seven); the plan-check's number
   is the tree's.
4. **13-09, tests: projected +2 at planning, −6 at the plan-check, observed −9.** The plan-check
   found `slots.spec.ts` (−8) and missed the two deletions 13-04 and 13-07 had assigned to 13-09 by
   name - scan 4 (−1) and the two window titles (−2). **13-09's SUMMARY states −11**; the term is −9
   by its own parts (above).
5. **13-10, tests: projected −1, observed −1, by different parts.** The projection's `tune-ui −2
+3` was `tune-ui −2 +2, surprise +1`; the scope test landed where the plan allowed.
6. **The per-file table** (`13-VALIDATION.md:456-487`): `local.spec.ts` "7 (created)" is 10;
   `front-door.spec.ts` "8 → 7" is 8 → 5 over two plans; `tune-ui.spec.ts` "9 → 11 → 12" is 9 → 11
   → 11 with the twelfth in `surprise.spec.ts`, which the table lacks; `aesthetic.spec.ts` "8 → 1" is
   right as an end and two plans' work. The reconciliation string sums to 47 in twenty-seven terms
   and the tree says 48.
7. **The baseline block** (`:48-52`, `:74-78`): catalog 27 (9 + 18), OG 27, audition 23, runbook not
   carried - the tree at 13-01 read 26 (8 + 18) / 26 / 22 numbered rows (23 with row 23's arrival
   in the same day's 12-10) / 7; 12-12 and 12.1-09 record the fold that made it 26. "Twenty-seven
   names re-cased at 13-19" (`:76, :334, :452, :716`) is twenty-six, eighteen moved.
8. **"`85 / 888` is a projection"** (`:52`) - true when written; it became 12-12's observed pair
   when 12-10 landed, and the "offset" 13-01 to 13-04 carried was that one unlanded test.
9. **D-15's glosses** (`13-CONTEXT.md`): `:829` "the rail thumb", `:857` / `:872` "markers" - the
   source says tick, thumb, home (13-01); the pairs are the decision and were right, and moved to
   `:840 / :867 / :882` and `:730 / :785 / :807` at 13-09 with D-15 amended the same day.
10. **13-VALIDATION's "layer B is skipped with a named reason when no build exists"** (`:600`):
    13-01's plan said red unless a flag, and red is what shipped; a flagged skip is a real skip the
    count gate refuses.
11. **The research's costs** - every one above: 1,067 / 1,166 / 861 / 366 / 811 / 697 against
    345 / 460 / 1,042 / 460 / 882 / 805, the two-slot ceiling three kinds against two, D-08's 150-200
    against 298, `PadSpinner` deletable against three consumers, the test forecast 890-930 against
    936, the file forecast 84-88 against 93.
12. **13-VALIDATION's D-11 on PREV-04** put the row on 13-10 with no task touching it; corrected at
    the plan-check to 13-09; 13-16 carried it too. Three plans reached it and none ticked it; the
    gate does (`.planning/REQUIREMENTS.md`).
13. **The plan's "three `50%` boxes"** (`13-20-PLAN.md:334, :539`) beside its own "six" everywhere
    else - six, measured above.
14. **The plan's `check-counts.mjs 93 935`** (`:358`, `:533`) - the tree is 94 / 961 and the gate
    ran at that; 93 / 935 is the chain's end without 12.1 and with the projection's +47.
15. **The plan's "`npx playwright test --workers 3` at 99" as one run** - unreachable on this
    machine (13-07); 99 twice in chunks.
16. **The plan's "the Sandbox's deferred element kinds if 13-02 answered no", "anything 13-15's
    fallback order dropped", "whether that re-ask reversed D-08 or deferred the XY pad", "the
    six-or-one transfer lines if 13-18's answer was provisional"** - 13-02 answered `three-slots`
    (recorded, not asked), 13-15's re-ask did not fire and dropped nothing, D-23 was `approve` and
    the six lines stay six. Every conditional branch the plan wrote for closed on the other side.
17. **The plan's "runbook row H … only if 13-02's checkpoint asked for it"** - the mechanism was
    answered on 2026-09-10 (cell 80 through Grid Editor); row H is HANGAR's own route through its
    own writer and is conditional on 13-15 and 13-17, both landed; it is a bench row today.
18. **The plan's "the twelve dead internal links … 13-20 counts them once"** (D-20): thirteen
    `/c/<id>/` addresses were dead before the move (nine from 11-01, three from 12-04, `/c/tpad/`
    from 12-10) and every `/c/` and `/browse/` address is dead since 13-08 (twenty-six entries and
    the gallery); the site has never been public and no real link exists (SHARE-03's amendment).
19. **13-13's plan-time premise that the resume banner reads a Playground draft the workspace
    writes** - no route writes one (13-13 finding 1; 13-16 confirmed; J.19 assigned to the gate
    and owed below).
20. **13-02's checkpoint text** framed the third slot as open after D-18 and the probe had answered
    it; recorded, not asked.
21. **13-11's plan** asked for a disabled header control in S0a / S0b, focus-trapping dialogs, a
    second store trigger and a reset under Device actions; the first three contradicted shipped
    rules and were not built, the fourth is batch row I.6.5, approved and owed.
22. **13-12's plan** named the fake ZONA `fake-zona.ts` (it is `synthetic.ts`) and cited store
    lines that had moved; found by name.
23. **13-14's plan** computed the cell as `y*9//128*9 + x*9//128` and named `F(i,n,2)` for the
    finger light; the hand-off's `N(x,y)` and `G(...)` are what shipped (13-15).
24. **13-17's plan** said "three strings" and "`sequence.ts` is not edited"; five strings, and the
    row needed its key on two sets.
25. **13-19's plan** said twenty-seven names and 27 OG files; twenty-six and 26.

**Research defects that were not counts**: the coverflow "deletable at wave 3" (13-VALIDATION D-5:
two routes import it until wave 9); persistence "at wave 7" (D-6: the intro and the gallery read it,
so wave 6); `check-counts.mjs` "must be checked against a negative delta" (D-9: it already was
correct, and the two real exposures were the file count and the todo); the eight FOR terms (seven
since 12-04); the `ele[1]` spelling (`ele[#ele]` is what lit); `self:tim()` "eleven characters"
(ten) and `ele[1]:map()` "twelve" (`ele[#ele]:map()` fifteen).

### The batch rows the gate landed, and the ones it owes

D-23 approved every proposal in `13-18-BATCH.md`. 13-18 and 13-19 landed the device, session and
tune modules and handed nineteen rows here by number. **Landed at this gate** (strings, each held
by the spec that already pinned the old string): I.8.1 (`This browser can’t talk to hardware`),
I.8.2 (`isn’t a secure context`), I.8.3 (`pick your ZONA`), I.8.5 (`Your ZONA isn’t there any
more`, `can’t power the module`), I.8.6 and I.8.7 (`The port wouldn’t open`, `Unplug your ZONA`),
I.3.12 (`port-busy`'s second culprit - _"Grid Editor is the usual reason, and another HANGAR tab
can be holding it too"_ - with **`Close any other HANGAR tab` as the first of now SEVEN steps**;
`transport.spec.ts`, `session.spec.ts` and two `session.e2e.ts` titles re-pinned from six to seven,
and CONN-04 amended by name in `.planning/REQUIREMENTS.md`; the classifier's branch is unchanged
until the bench reproduces the raw message), F.4 (`There’s no configuration at this address. Pick
one from the list.`), G.31 and G.36 (`the most a page holds`), H.20 (`and a page holds at most
16`), H.21 (`doesn’t fit on the 9 × 9 surface`), and **J.1 - the favicon redrawn square in the
Bible's `#101210` and `#dcff71`** with `identity.spec.ts` test 11 re-pinned to the two hexes and
asserting no `rx` / `ry` (the tab's mark carried a corner the site never draws and the retired
accent; 13-03 and the gate notes flagged it). No test added or removed; the term is `+0 / +0`.
**Owed, recorded in `deferred-items.md` as approved-and-owed with the exact edit**: J.13 (the
install column), I.6.5 (the reset under Device actions with §16's confirmation, A-45 retired), E.14
(`36 configurations` unfiltered), E.15 (the two empty-view lines), G.34 (the unreachable two-slot
`overLine`), J.10 (`?feels=`), J.19 (the Playground draft), J.23 (the one-shot view handoff), J.25
(the sandbox thumbnail's static paint), J.30 (duplicate collection names), J.40 (the snapshot's
utility for a landing's empty 255/4).

### Corrections to earlier sections, by line - listed, not reflowed

Every count in the sections above this one that a Phase 13 plan moved, with where the current
figure is. None of these lines is edited.

- **"Phase 12.1's suites" → "The tree this gate measured"**: 13-09's `−11` is `−9` by its parts
  (this section, "The one term"); the six Phase 13 terms it lists are right, and 13-20 owns the
  totals.
- **Every `/c/<id>/` and `/browse/` address** in every section above the plan 13-08 note at the
  end of this document reads `/playground/<id>/` and `/playground/` (D-20, move-clean; the note
  says so and this line repeats it because the sections between are long).
- **"The install flow's test surface"** and the Phase 7, 10, 11, 12 and 12.1 sections' counts of
  three and four strings on the wire: **five** since 13-17 (255/6, 255/0, 255/4, 0/6, 0/0), the key
  `hangar.snapshot.v4`, and every write click count in `install-copy.ts` five.
- **Every `TRY ON DEVICE`, `KEEP ON DEVICE`, `PUT BACK`, `CLEAR`, `SURPRISE ME`, `RESET ALL`,
  `COPY LINK`, `LINK COPIED`, `CONNECT ZONA`, `PLAYING NOW`, `KEPT`, `FACTORY DEFAULT`** named
  in the sections above reads, since 13-18 and 13-19 under D-05 and D-23: `Apply to ZONA`, `Store on
ZONA`, `Put back`, `Reset active device page`, `Randomize`, `Reset settings`, `Share snapshot`,
  `Link copied`, `Connect ZONA`, and the state captions `Applied to Page N…`, `Stored on ZONA ·
Page N`, `Page N reset to its firmware default`. The facts they carried (RAM against flash, the
  snapshot, the firmware default, nothing without a click, the page's own scripts) are asserted in
  `install-copy.spec.ts` and `session-copy.spec.ts` against the batch read from disk. The test ids
  (`try-on-device`, `keep-on-device`, `put-back`, `clear`, `surprise-me`, `reset-all`) did not move.
- **Every uppercase entry name** (`EUCLID`, `RADAR POINTS`, …) reads in sentence case since 13-19
  (`Euclid`, `Radar points`); ids, fixtures, OG filenames and addresses did not move. The prose
  above is the record it is (13-19's question 5; about ninety lines).
- **"The device session's test surface"** and the Phase 6 sections' `CONNECT` control, the header
  identity line and the drawer: the control is the context bar's summary since 13-11, the S4
  identity moved into Device actions at 13-18, `DeviceDetails.svelte`'s drawer became a footer
  panel; `session-copy.ts` 49 exports, `install-copy.ts` 56.
- **The Phase 10 and 11 sections' aesthetic and instrument scans** (`aesthetic.spec.ts` 8,
  `instrument.spec.ts` 6, `e2e/aesthetic.e2e.ts` 5 / 10, the CRT layers, the halftone, the lattice,
  the pill, the SCREEN switch): 1, 4, deleted, and gone under D-09 and D-10 (13-04; the pill at
  13-03); `identity.spec.ts` 11 (was 7), eleven tokens against `#DCFF71` and no twelfth (13-03).
- **`glyph-field.spec.ts` 5, `slots.spec.ts` 8, `mix.spec.ts` 2, `first-experience.e2e.ts` 11
  titles, `Splash`, `Coverflow`, `FrontDoor`, `NamePlate`, `ChosenPanel`, `MixTwo`,
  `ScreenToggle`**: deleted (13-04, 13-07, 13-09, 13-10); `first-experience.e2e.ts` carries 5;
  `front-door.spec.ts` 5.
- **The Phase 6 / 7 / 10 sections' "the four-corner table"** for Phase 13 is the Sandbox's five
  costs above; the Lua entries' corners are 12.1-09's and unmoved.
- **The Phase 12 section's `CONN-04` "six steps"** and every "six steps" in this document: seven
  since this gate landed I.3.12.
- **The catalog "27" and "twenty-seven"** wherever the Phase 13 planning documents say it: 26.
- **`SESSION-RUNBOOK.md:14`'s suite counts** (Phase 6's 724 / 13 / 77): still unedited, still
  named (12-03, 12-12, 12.1-09); the tree is 961 / 19 / 83.

### The gate holes, recorded

- **The workspace's `▷ Play` reach of PREV-04 has no test.** `intro.spec.ts` 4 source-asserts the
  hero's three pointer handlers reaching `touchDown` / `touchMove` / `touchEnd` through `mapAxis`;
  `sandbox.e2e.ts` 2 drives a finger into the Sandbox's preview in Play; the workspace route's
  `ledPoint()` → `host.touchDown` (13-09, `data-testid="mode-play"`) is the same shape and nothing
  reads it. One e2e title would close it; carried in `deferred-items.md` A.
- **`check-counts.mjs` has no direction and misreports a red run** (12-04, 12-12, 12.1-09),
  unchanged; 13-01 proved it correct for a negative delta and named the two real exposures.
- **A declared e2e zero is a count of titles, not a run** (12.1-09): 13-14 and 13-15 declared
  `+0 / +0` and did not run the suite; both were right, and the rule stands.
- **The wrangler harness.** 4.128.0 dies mid-run under load (13-05 first, every plan since; one
  death at this gate, run 2's chunk 2 at start-up); `scripts/` still has no chunk runner (the one used lives
  in the scratchpad, 13-07 deviation 9); `playwright.config.ts` still spawns the server
  (13-05's question 6). A pin bump or an attach-not-spawn config is a quick task nobody has been
  given.
- **`install.e2e.ts:1977`'s 50 ms margin** on the phone engine (above): the title's scripted
  200 ms acknowledgement delay against `executeMs` 250 is a harness number that reads as a store
  fault under load.
- **The audition table's cost cells are still gated by nothing** (12-12, 12.1-09), and the runbook's
  rows are gated by nothing at all (`docs/INSTALL-RUNBOOK.md` has no spec); thirteen rows, five of
  them Phase 13's, every one unanswered.
- **`decay-idiom.spec.ts` is blind to `D(` and `K(`** (12.1-09), unchanged; the Sandbox's emitted
  strings pass it because they emit no decay (13-14 test 4 says so by name).
- **The Sandbox's cost gate is a server spec** (`emit.spec.ts` 1, `runtime.spec.ts` 7) and the
  sweep's `4 19` did not move by choice (13-14); a knob cross-product over surfaces does not exist
  and is not owed - a surface's cost is a handful of strings.
- **Nothing gates the eleven tokens' consumers across the tree** beyond `identity.spec.ts`'s
  literal census: a component that hard-codes a hex would be red (test 1), a component that uses
  the right token for the wrong job would not (13-03's test 5 is the boundary scan and names the
  one hole it cannot see, `TagChip.svelte:136`).
- **The fidelity probe on `/dev/fidelity/`** compiles BOTOR's DIAL through HANGAR's shelf since
  12.1-09 and reports `shelf: vendored`; it proves the WASM build, not a HANGAR preset's divergence
  (12.1-09's fix, carried).

## Phase 13.1's suites, measured at the gate

**Every count below was observed on 2026-09-12 at the Phase 13.1 gate (plan 13.1-08)**, on the tree
at `d21249e` (clean apart from the user's three untracked root files and `.claude/`), against a
fresh production build, from four `vitest run --project server --maxWorkers=2` runs (three whole
and green, one with the JSON reporter for the per-file table), one sweep, and the Playwright suite
twice in five file chunks on fresh detached servers stopped through PowerShell, every red rerun
alone at `--workers 1`. `.planning/phases/13.1-bench-corrections-four/13.1-VALIDATION.md` carried
an eight-term projection from planning time and the plan-check corrected two of its terms; the
observations here replace them and every disagreement is named under "Where this phase's planner
was wrong" rather than corrected quietly. **Nothing in this section is hardware-verified by an
agent**: no agent in Phase 13.1 connected to a ZONA, wrote to one or deployed. The bench's four
rows of 2026-09-12 (`BENCH-2026-09-12.txt`: I, L, H, M - "working properly", "working properly",
"works", "works") are the user's, are the first hardware-verified rows of Phases 12, 12.1 and 13,
and were run on the Phase 13 gate's tree BEFORE this phase's nine changes; they are recorded
verbatim in `docs/INSTALL-RUNBOOK.md` and nothing this phase shipped has been on a module.

**This section is appended, and nothing above it is reflowed.** Phase 13.1 ran its eight plans in
one SERIAL order - `02 -> 04 -> 01 -> 03 -> 05 -> 06 -> 07 -> 08` - alone in the tree (no other
phase was open), so there is no offset to state: the chain runs from 13-20's observed block and
its end is the tree. Where the Phase 13 section above now states a stale count, the correction is
listed by line under "Corrections to the Phase 13 section, by line" and the line itself is left
standing.

### The re-measured block against 13-20's carried block

| Name              | 13-20's block (carried) | Phase 13.1's chain (eight terms)   | **Observed at `d21249e`**                                                                                                                                                                                                                                                                                                                                    |
| ----------------- | ----------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| quick files       | 94                      | +0 x8 = **94**                     | **94**                                                                                                                                                                                                                                                                                                                                                       |
| quick tests       | 961 (+1 todo)           | +3 = **964**                       | **964 (+1 todo)** - three runs green at `--maxWorkers=2`, a fourth for the JSON; `check-counts.mjs 94 964` matches on every one                                                                                                                                                                                                                              |
| e2e titles / runs | 83 / 99                 | +2 / +1 = **85 / 100**             | **85 / 100**; `grep -hoE "^\s*test\(" e2e/*.e2e.ts` 85; `--list` `100 tests in 15 files`; two chunked runs at `32 + 21 + 21 + 15 + 11 = 100`                                                                                                                                                                                                                 |
| `svelte-check`    | 657                     | −1 −4 +1 +1 = **654** (provenance) | **654 files, 0 errors, 0 warnings**, 11 s                                                                                                                                                                                                                                                                                                                    |
| `npm run lint`    | clean                   | -                                  | clean (prettier and eslint), 26 s                                                                                                                                                                                                                                                                                                                            |
| sweep             | `4 19`                  | `4 19` (run once, at the gate)     | **`4 19`**, 102 s wall (99.4 s in Vitest); reachability 20,270 + 24,576 = **44,846** in 95.7 s, laddered 8, over budget 0; `lua-entries` 1,140 / 2,280; the kind cross-product 1,296 in 2.9 s, worst 906 of 908 at `none/none/trackpad/hi=false/grid=false`; `check-counts.mjs 4 19` matches. **No entry file, knob list or vendored file moved this phase** |
| build             | 40 s                    | -                                  | **14 s** at 1.88 GB free (`postbuild: d21249e…`, the source archive 2,233 KB); 26 OG images, **154,136 B**, byte-identical to 13-19's and 13-20's                                                                                                                                                                                                            |
| catalog           | 26 (8 + 18)             | +0 x8 = **26**                     | **26**, 8 preset-backed + 18 hand-authored, the ids unmoved                                                                                                                                                                                                                                                                                                  |
| `static/og/`      | 26                      | **26**                             | **26 / 154,136 B**                                                                                                                                                                                                                                                                                                                                           |
| audition rows     | 28                      | +0 = **28**                        | **28**, all unanswered (the table unchanged; one dated paragraph appended at this gate)                                                                                                                                                                                                                                                                      |
| runbook rows      | 13 (A-M)                | +0 = **13**                        | **13** (A-M); rows I, L, H, M ANSWERED by the user - pass - and recorded verbatim at this gate; a fourth-bench section of eleven rows and twenty-three questions appended                                                                                                                                                                                    |
| radius allowlist  | 0 rows                  | +0 = **0**                         | **0 rows**; layer A `34 declarations in 65 files scanned; 0 above zero remaining in 0 allowlisted files (); 28 exempt`                                                                                                                                                                                                                                       |
| the six circles   | 6 (D-15)                | +0 = **6**                         | **6**, at `ColourPicker.svelte:840, :867, :882` and `Knob.svelte:730, :785, :807` - **neither file edited across the whole phase** (below)                                                                                                                                                                                                                   |
| the manifest      | 6 / 38, `dae35d39…`     | +0                                 | **6 / 38**, `dae35d39…`; `src/vendor/` untouched                                                                                                                                                                                                                                                                                                             |

### The eight-term chain, every zero written out, in EXECUTION order

The columns are the phase's serial order (the plans' `wave` field, 1 to 8); each term is the plan's
OWN observed count line (its SUMMARY's "Observed after the commits"), never the projection. The
term count is asserted at eight on every row.

```
order            1     2     3     4     5     6     7     8
plan            02    04    01    03    05    06    07    08
tests    961    +0    +0    +1    +2    +0    -1    +1    +0   = 964   (8 terms)
files     94    +0    +0    +0    +0    +0    +0    +0    +0   =  94   (8 terms)
e2e ttl   83    +0    +0    +1    +1    +0    +0    +0    +0   =  85   (8 terms)
e2e run   99    +0    +0    +1    +1    +0    +0    -1    +0   = 100   (8 terms)
check    657    -1    +0    +0    +0    +0    -3    +1    +0   = 654   (8 terms; provenance, observed at each plan)
allowlist  0    +0    +0    +0    +0    +0    +0    +0    +0   =   0   (8 terms)
circles    6    +0    +0    +0    +0    +0    +0    +0    +0   =   6   (8 terms)
catalog   26    +0    +0    +0    +0    +0    +0    +0    +0   =  26   (8 terms)
sweep   4 19     -     -     -     -     -     -     -   4 19  = 4 19  (run once, at the gate)
```

The observed lines each term is read from, in order: 13.1-02 `94 / 961 (+1 todo) / 83 / 99 / check
656`; 13.1-04 `94 / 961 / 83 / 99 / 656`; 13.1-01 `94 / 962 / 84 / 100 / 656`; 13.1-03 `94 / 964 /
85 / 101 / 656`; 13.1-05 `94 / 964 / 85 / 101 / 656`; 13.1-06 `94 / 963 / 85 / 101 / 653`; 13.1-07
`94 / 964 / 85 / 100 / 654`; this gate `94 / 964 / 85 / 100 / 654`. Every plan re-measured its
carried pair before its first edit and found no difference; every `check-counts.mjs` call was
`<files> <carried±delta>` with the carried pair read from the previous SUMMARY.

**The terms, by task.** 01: `intro.spec.ts` 5 (+1) and the four-viewport intro title in
`first-experience.e2e.ts` (+1 / +1). 03: `sandbox-ui.spec.ts` 7 and 8 (+2) and the drag title in
`sandbox.e2e.ts` (+1 / +1). 05: `shell.spec.ts` 7 (+1) and `device-ui.spec.ts`'s shapeless-alike
test deleted (−1) = +0. 06: `device-ui.spec.ts`'s leaves test and reserved-cells test deleted (−2)
and the zone test added (+1) = −1; e2e +0 / +0 (the Sandbox loop title re-aimed, not deleted).
07: the MIDI field test in `tune-ui.spec.ts` (+1); the CC number title in `tuning.e2e.ts` (+1 /
+1) and the two `@webkit` install titles merged into one (−1 / −2) = e2e +0 / −1. 02, 04 and 08:
+0 on every row (02 inverted one title in place; 04 rewrote clauses in place).

**The check row's provenance, by component.** 02 deleted `DestinationReview.svelte` (−1); 06
deleted `TryOnDevice.svelte`, `InstallState.svelte`, `KeepOnDevice.svelte` and `PutBack.svelte`
(−4) and added `DestinationZone.svelte` (+1); 07 added `MidiField.svelte` (+1) and **did not
delete `BudgetMeter.svelte`** - the Sandbox mounts it twice under its own room line, which D-10
keeps by name (13.1-07 deviation 2). **Five components deleted, two added**, 657 − 1 − 3 + 1 = 654. The plan and the VALIDATION said six deleted and 653; see "Where this phase's planner was
wrong".

### The per-file reconciliation, from the runner's JSON

This gate's JSON run against 13-20's JSON (`24e2790`), the same reporter, the same 94 files:

| File                            | 13-20 | 13.1-08 | Term | Plan                                                                                           |
| ------------------------------- | ----- | ------- | ---- | ---------------------------------------------------------------------------------------------- |
| `src/lib/ui/device-ui.spec.ts`  | 17    | **15**  | −2   | 05 (−1, the shapeless-alike test), 06 (−2 deleted, +1 the zone test); 02 inverted one in place |
| `src/lib/ui/intro.spec.ts`      | 4     | **5**   | +1   | 01                                                                                             |
| `src/lib/ui/sandbox-ui.spec.ts` | 6     | **8**   | +2   | 03                                                                                             |
| `src/lib/ui/shell.spec.ts`      | 6     | **7**   | +1   | 05                                                                                             |
| `src/lib/ui/tune-ui.spec.ts`    | 11    | **12**  | +1   | 07 (04 rewrote clauses in place at +0)                                                         |
| every other file                | =     | =       | 0    |                                                                                                |

Sum **+3**, 961 → 964; no file added or removed. The chain's tests row and the per-file table agree
term for term.

### The components this phase deleted and added, by name

Deleted (five): `src/lib/ui/DestinationReview.svelte` (13.1-02, D-05), `src/lib/ui/TryOnDevice.svelte`,
`src/lib/ui/InstallState.svelte`, `src/lib/ui/KeepOnDevice.svelte`, `src/lib/ui/PutBack.svelte`
(13.1-06, D-06 and D-07). Added (two): `src/lib/ui/DestinationZone.svelte` (13.1-06),
`src/lib/ui/MidiField.svelte` (13.1-07). Kept against the plan's `git rm`: `src/lib/ui/BudgetMeter.svelte`
(13.1-07; the Sandbox's two mounts). Every deletion has its spec rows named in its plan's SUMMARY
(`instrument.spec.ts`'s PILLED / QUIET / index-form rows, `device-ui.spec.ts`'s `INSTALL_LEAVES`);
nothing is left mounted nowhere except one circle, below.

### The three-layer radius gate, asserted EMPTY - held through a phase that deleted five components and added two

| Layer                       | Observed at the gate                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A, the source scan          | `radius layer A: 34 declarations in 65 files scanned; 0 above zero remaining in 0 allowlisted files (); 6 circles (D-15): src/lib/ui/ColourPicker.svelte:840, :867, :882, src/lib/ui/Knob.svelte:730, :785, :807; 28 exempt` - **`ALLOWLIST` is `[]`** (`radius-allowlist.ts:183`, unedited). 68 files became 65 (five deleted, two added); 33 declarations became 34 (MidiField's two `border-radius: 0`, the popover's one zero gone) |
| B, the built-CSS scan       | `radius layer B: 36 radius declarations in 14 built stylesheets; 6 of them 50%; tolerated values from the allowlist: none` against the build of 17:36Z, newer than the newest source                                                                                                                                                                                                                                                    |
| C, the computed-style sweep | `radius layer C: 12 routes, 2683 elements, 79 circles measured square; STRICT (the allowlist is empty)` in chromium and `2733 elements, 79 circles` in webkit-phone (both chunked runs, `radius.e2e.ts:328`); `knob:thumb` named UNREACHABLE in the sweep's own list since 13.1-07 and asserted still unreachable                                                                                                                       |

**The six circles' boxes, measured in both engines on the served build** (13-20's probe, adapted for
the inline colour block - `colour-editor` where the popover's `open` was - and for a thumb that may
not be there):

| Circle (D-15, line at HEAD)         | chromium          | webkit-phone (iPhone 15) | Where                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------- | ----------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ColourPicker.svelte:840` the tick  | **2.00 × 2.00**   | **2.00 × 2.00**          | `/playground/aurora/`, 21 on the page (the inline block open on the first colour row)                                                                                                                                                                                                                                                                                                                                                                                                           |
| `ColourPicker.svelte:867` the thumb | **12.00 × 12.00** | **12.00 × 12.00**        | `/playground/aurora/`, 3                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `ColourPicker.svelte:882` the home  | **2.00 × 2.00**   | **2.00 × 2.00**          | `/playground/aurora/`, 3                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `Knob.svelte:730` the dot           | **8.00 × 8.00**   | **8.00 × 8.00**          | `/playground/aurora/`, 19 (was 24 at 13-20: aurora's MIDI knobs are typed fields now, not dot rails)                                                                                                                                                                                                                                                                                                                                                                                            |
| `Knob.svelte:785` the slider thumb  | **NOT MEASURED**  | **NOT MEASURED**         | **mounted on NO route since 13.1-07**: the sixteen-value channel and the twelve-value send lists became typed fields and no other list in the tree has nine or more values (13.1-07 measured every entry and `knobs.preset.ts`). Declared 12 × 12 in the source (`inline-size: 12px; block-size: 12px; border-radius: 50%`), the line unedited since 13-09, measured by no engine. `radius.e2e.ts`'s `UNREACHABLE_CIRCLES = ["knob:thumb"]` names it and goes red if a thumb reappears unlisted |
| `Knob.svelte:807` the home mark     | **2.00 × 2.00**   | **2.00 × 2.00**          | `/playground/aurora/`, 6 (was 8)                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

`|w − h| = 0.000` on every one measured, in both engines. **Whether the track rail's circle stays
declared is the user's question** (13.1-07 question 5; the fourth bench's question U): `Knob.svelte`
is untouchable in this phase and D-15 names six by file and line, so the gate leaves it declared
and says so. The six lines were re-read at HEAD and each reads `border-radius: 50%;`;
`grep -rn border-radius src` finds no other value above zero outside a comment; and a grep no
layer performs, `grep -rnE "\brx=|\bry=" src e2e static`, finds NOTHING - 13.1-03 added three
`<rect>` kinds to the Sandbox plate (the ground, the fader's groove and thumb, the button's chip)
and none carries an `rx` or `ry` (`sandbox-ui.spec.ts` 1 asserts it on the comment-stripped
source and a planted `rx="2"` was caught there); `src/lib/assets/favicon.svg` is square since J.1
and carries no `rx` either (its one `rx` is a comment naming the old value).

**The gate's negative check, in 13-20's order: one `border-radius: 2px` planted in
`src/lib/ui/shell/Footer.svelte:118`.** Layer A caught it first, in 61 ms of test time (the spec
file 3.6 s wall), naming `src/lib/ui/shell/Footer.svelte:118 border-radius: 2px`. Layer B was red
at the same moment for staleness - `Footer.svelte was modified after build/_app/immutable/assets
was written … the build is stale and a scan of it proves nothing` - and, after a rebuild, red on
the value itself: `build/_app/immutable/assets/0.kYHi9Znu.css: border-radius: 2px` with
`tolerated today: nothing - the allowlist is empty`. Layer C, against that build on a fresh server
at `--workers 1`, was red in **both** engines on all twelve routes, naming
`<footer.footer data-testid="shell-footer"> computes border-radius 2px | 2px | 2px | 2px and the
allowlist is empty: never a rounded corner (D-01)` on `/`, `/playground/`, `/playground/arc/`,
`/playground/aurora/`, `/sandbox/?new` and the seven `/dev/` pages. The file was restored from its
scratch copy (sha256 `d6cec79c…` either side, `git diff --quiet` exit 0), the build redone at
`d21249e`, A and B green again. **A, then B by staleness, then B by value, then C.**

### The two circle files and the vendored tree, unedited across the whole phase

`git diff --stat 24e2790 -- src/lib/ui/Knob.svelte src/lib/ui/ColourPicker.svelte src/vendor/` is
EMPTY at `d21249e` (and `git diff --stat 698e84f..HEAD` on the same paths is empty - 698e84f being
13-20's last commit). `src/lib/catalog/library.ts` and every entry file are unedited.
`firmware-oracle.spec.ts` (last edited `b3a554d`), `protocol-pin.spec.ts` (`cce3454`),
`forbidden-instructions.spec.ts` and `vendored-diff.spec.ts` (`dbfb3e7`) have zero commits since
`24e2790` and are green in every quick run (13.1-02's first whole run found
`forbidden-instructions.spec.ts` red on the plan's OWN new comment naming the page-change class -
the comment was reworded, the spec unedited). The manifest `dae35d39…` reads 6 files / 38
intended-divergence rows, unchanged.

### e2e

Fifteen files, 85 titles, 100 runs. The suite ran in five file chunks on fresh detached servers
stopped through PowerShell (`e2e-chunks-1308.sh`, 12.1-08's shape with a `start` / `stop` pair
added for the probe and the negative check), every chunk read through its own log, every red rerun
alone at `--workers 1`. `test-results/` removed after every run; no commit while a chunk ran.

### The gate's runs, with the memory beside each

The machine had between **0.73 and 2.34 GB of 16 GB free** at the start of each command - more
than 13-20's 0.05 to 1.33, and no server died.

| Run                                                                                                                    | Free    | Result                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| quick 1 (`--maxWorkers=2`)                                                                                             | 0.73 GB | **94 / 964 / 1 todo**, green, 42.5 s; `check-counts.mjs 94 964` matches                                                                                            |
| `npm run check`                                                                                                        | 1.26 GB | **654 files, 0 errors, 0 warnings**, 11 s                                                                                                                          |
| `npm run lint`                                                                                                         | 1.35 GB | clean, 26 s                                                                                                                                                        |
| `npm run build`                                                                                                        | 1.88 GB | 14 s; 26 OG images, **154,136 B**; `postbuild: d21249e…`                                                                                                           |
| quick 2 (after the build)                                                                                              | 1.75 GB | **94 / 964 / 1 todo**, green, 42.0 s                                                                                                                               |
| sweep                                                                                                                  | 1.67 GB | **4 / 19** in 99.4 s (102 s wall); 44,846 states, over budget 0; `check-counts.mjs 4 19` matches                                                                   |
| quick 3                                                                                                                | 1.30 GB | **94 / 964 / 1 todo**, green, 42.5 s                                                                                                                               |
| quick 4 (JSON reporter, for the per-file table)                                                                        | 1.57 GB | **94 / 964 / 1 todo**, green                                                                                                                                       |
| `radius.spec.ts` alone, verbose                                                                                        | -       | layers A and B green, the lines quoted above                                                                                                                       |
| the circle probe, both engines, fresh server                                                                           | -       | five kinds square to the hundredth; `knob:thumb` not measured (above)                                                                                              |
| the negative check: A and B stale, rebuild, A and B by value, C alone in both engines, restore, rebuild, A and B green | -       | as narrated above; `radius.e2e.ts:328` **2 failed** (one per engine), as intended                                                                                  |
| e2e run 1, c1 (install, session)                                                                                       | 1.74 GB | **32 passed** (1.2 m)                                                                                                                                              |
| e2e run 1, c2 (browse, browse-webkit)                                                                                  | 2.34 GB | 19 + 2: `[chromium] browse.e2e.ts:299` sorting (the name sort's DOM order, seven ids), `[chromium] browse.e2e.ts:1404` come back to the same view (26 cards for 3) |
| e2e run 1, c3 (tuning, tuning-webkit)                                                                                  | 2.22 GB | **21 passed** (24.4 s)                                                                                                                                             |
| e2e run 1, c4 (catalog, fidelity, first-experience, library, sandbox)                                                  | 2.05 GB | **15 passed** (19.1 s)                                                                                                                                             |
| e2e run 1, c5 (artifacts, radius, skeleton, smoke)                                                                     | 2.02 GB | **11 passed** (11.8 s) - layer C green in both engines, 79 circles                                                                                                 |
| run 1's two reds alone, `--workers 1`                                                                                  | 1.92 GB | `browse:299` **passed**; `browse:1404` **failed again** (5 cards for 3 - 13-20's record exactly)                                                                   |
| `browse:1404` alone again                                                                                              | 1.94 GB | **passed** (3.7 s) - on its second solo run, as at 13-20                                                                                                           |
| e2e run 2, c1                                                                                                          | 1.82 GB | **32 passed** (1.2 m)                                                                                                                                              |
| e2e run 2, c2                                                                                                          | 2.01 GB | 19 + 2: `browse:299` again, `browse:343` searching and tag chips (26 cards for 5) - 13.1-07's named pair under three workers                                       |
| e2e run 2, c3                                                                                                          | 2.03 GB | **21 passed** (24.7 s)                                                                                                                                             |
| e2e run 2, c4                                                                                                          | 2.23 GB | **15 passed** (18.9 s)                                                                                                                                             |
| e2e run 2, c5                                                                                                          | 2.15 GB | **11 passed** (11.6 s)                                                                                                                                             |
| run 2's two reds alone, `--workers 1`                                                                                  | 2.21 GB | `browse:299` **passed**; `browse:343` **failed again** (26 for 5)                                                                                                  |
| `browse:343` alone again                                                                                               | 2.25 GB | **passed** (2.9 s)                                                                                                                                                 |

Run 1: `32 + 21 + 21 + 15 + 11 = 100` runs, two reds. Run 2: `32 + 21 + 21 + 15 + 11 = 100`, two
reds. **Every red is in `browse.e2e.ts` and is the gesture-before-hydration family** 13-13, 13-20,
13.1-01 and 13.1-07 recorded: `:299` sorts, `:343` fills the search, `:1404` clicks a chip, each the
moment the prerendered cards are counted, and under three workers the gesture lands before the
grid can narrow. Three distinct titles, five reds, every one green alone, two of them on the second
solo attempt. **No red named a switch, a zone, a field, a Clear, a count this phase wrote or a
string it moved**; c1, c3, c4 and c5 - every install, session, tuning, sandbox, first-experience
and radius title - were green in both whole runs with no rerun. 13-20's other transients
(`install:1434`, `install:1977`, `session:851`, `session:1009`, `browse-webkit:357`) did not appear
in either run. One thing that is not a run: the executor invoked the chunk runner with a bogus
chunk name before the probe, which started the WHOLE suite on one server; it was killed after about
a minute with nothing read from it and `test-results/` removed - named here so the wrangler logs are
not misread.

### The intro, the app frame and the footer, measured at the gate (deferred-items A.1)

On the served build in chromium at 1280 × 720: `/` **720 / 720** (13.1-01's fit holds - the
document does not scroll); `/playground/` **791 / 720**, `/sandbox/?new` **791 / 720**,
`/my-configs/` **791 / 720**, `/playground/arc/` **1012 / 720**; the footer **121** on every page
against `FOOTER_H`'s 50; the app frame 535 (`100dvh − 76 − 59 − 50`). The 71px is the footer's
second 44px row (the GPLv3 licence line), which `FOOTER_H` does not know about; on the workspace
the rest is the centre column's content overflowing the frame's 535. **Not fixed at this gate**: the
fix is not one number in `layout.ts` - the footer's height is its content's, so a `FOOTER_H` of 121
would be a guess that it never wraps - but the flex shape 13.1-01 gave the intro, in
`+layout.svelte` alone; recorded in `13.1-bench-corrections-four/deferred-items.md` A.1 with the
exact edit.

### Where this phase's planner was wrong, named rather than corrected

**Document defects** (a term that disagrees with `13.1-VALIDATION.md` or `13.1-PLAN-CHECK.md`) and
**plan defects** (a term that disagrees with a plan's own line), in execution order:

1. **The check row's 07 term: projected +0, observed +1.** VALIDATION's provenance line writes "07
   deletes `BudgetMeter` (−1) and adds `MidiField` (+1)" and 13.1-CONTEXT D-11 e lists `BudgetMeter`
   among the deleted; 13.1-07 kept the file because the Sandbox mounts it twice under the room line
   D-10 keeps by name. The row ends at **654**, not VALIDATION's 653, and the gate plan's own
   `<interfaces>` ("657 −1 (02) −4 +1 (06) −1 +1 (07) = 653") and its task 1 ("the six deleted
   components … `BudgetMeter`") carry the same error: **five deleted, two added.**
2. **VALIDATION's first draft (I-01): 05 at +1 and 06 at −4, with `device-ui.spec.ts:1398` at 06,
   and the check row at 652.** Corrected at the plan-check to 05 +0 / 06 −1 / 653 by the plans' own
   task lists; the SUMMARYs observed 05 `+0`, 06 `−1` - and the check row is 654 by defect 1.
3. **The plan-check's count-literal table (section 3): 03's plan carried `94 963` and 05's `94 961`.**
   Under the serial order 03 observed **964** (962 + 2) and 05 **964** (+0); every executor used the
   carried form from the previous SUMMARY, as the check-counts header requires, and no literal a
   plan wrote was run. The checker named 05's as "wrong under every order" and 03's as 964 against
   963 under this order - both right; neither was run.
4. **VALIDATION's chunk script name.** "13-20's `e2e-chunks-1320.sh` shape … copy it to this
   session's scratchpad as `e2e-chunks-1308.sh`": every plan of the phase ran `e2e-chunks-1208.sh`
   or a per-plan copy of it (13.1-02 recorded that `-1308` did not exist); this gate made the
   `-1308` copy the plan names, from `-1208`.
5. **VALIDATION's line numbers**, stated at planning time and moved by the plans before them:
   `radius.e2e.ts:312 (now :354)` is `:328` at the gate; `tuning.e2e.ts` 875 / 943 were 917 / 985 at
   13.1-06's HEAD; `sandbox.e2e.ts`'s put-back clicks "at `:532` / `:584`" were `:666` / `:718`;
   `install.e2e.ts:1977` + `:2489` (the merge) were `:1990` + `:2506`. Named so nobody reads a
   VALIDATION line number as a tree line number.
6. **VALIDATION's re-aim list names "the header locks under a write, says where the copy is, and the
   announcer is untouched" as re-aimed at the zone (06)** - that test reads `DeviceDetails`,
   `DeviceSlot` and the announcer and never read the column; 13.1-06 left it unedited.
7. **VALIDATION's `instrument.spec.ts` line: "rows naming … `BudgetMeter.svelte` … removed with the
   files"** - `BudgetMeter.svelte`'s row stays (the file stays); `MONO_COUNT` is still five (13.1-07:
   the plan's "4, not 5" premise fails with the file kept).
8. **13.1-06's SUMMARY listed `install.e2e.ts:557` and `:982` among the 17 titles red by design**;
   13.1-07 found both were never red (probe titles clicking the probe's own `install-put-back-click`)
   and re-aimed fifteen. Named here because the gate's count of "17 red, 21 runs" from 06 is 15
   titles / 19 runs by 07's account.
9. **The gate plan's "the six boxes measured square by a probe outside the suite in both engines
   (2 / 12 / 2 / 8 / 12 / 2)"** - five of the six are measurable; the sixth (`Knob.svelte:785`)
   mounts on no route since 13.1-07 and the plan, written before 13.1-07 ran, did not know.
10. **The gate plan's list of 13-20's transients to expect** (`install:1434`, `install:1977`,
    `session:851`, `session:1009`, `browse:1404`, `browse-webkit:357`) - only `browse:1404` recurred;
    the other two reds were 13.1-07's pair (`browse:299`, `browse:343`), which the plan does not name.
11. **13.1-02's SUMMARY "sweep not run (`4 19` by declaration)" x7** - right by D-11 k, and this gate
    ran it once and it is `4 19`; named only so the seven declarations have their measurement.
12. **The gate plan's `<what-built>` lists ten decisions for "the nine changes"** (I-04) - nine bench
    lines, ten decisions, D-06 and D-07 being one line; the runbook section says so.

**What the planner got right that the gate checked**: the eight-term unit chain (+3 → 964), the
e2e chain (+2 / +1 → 85 / 100), the files row (+0 → 94), the allowlist and the circles (0 and 6,
the two files unedited), the catalog (26), the serial order and every plan's chunk assignment, and
the four-document rule for the copy specs (`13.1-COPY-NEW.md` read by two specs, pinned by name).

### Corrections to the Phase 13 section, by line - listed, not reflowed

- `docs/TESTING.md:2779` (the six circles' table above): "`Knob.svelte:785` the slider thumb …
  `/playground/arc/`, 1 (the 16-value knob)" - since 13.1-07 arc's sixteen-value channel knob is a
  typed field and the thumb mounts on no route; the line stands as the record of the tree at
  `24e2790`.
- The Phase 13 section's block (`94 / 961 (+1 todo) / 83 / 99 / 657`, its layer A "33 declarations
  in 68 files … 27 exempt", its layer C "87 circles") is the tree at `24e2790`; the tree at
  `d21249e` reads 94 / 964 / 85 / 100 / 654, 34 in 65 with 28 exempt, 79 circles - this section.
- The Phase 13 section's "The bench rows, as handed over" (rows I, L, H, M unanswered) is answered:
  the four rows passed on 2026-09-12 and are recorded in `docs/INSTALL-RUNBOOK.md`.
- The Phase 13 section's gate holes "the workspace's `▷ Play` reach of PREV-04 has no test" and
  "`install.e2e.ts:1977`'s 50 ms margin" stand; the second did not recur in this gate's four c1 runs.

### The standing gates, re-read at the gate rather than assumed

- `firmware-oracle.spec.ts`, `protocol-pin.spec.ts`, `forbidden-instructions.spec.ts` and
  `vendored-diff.spec.ts`: green in all four quick runs, zero commits since `24e2790`.
- `src/vendor/`, `library.ts`, every catalog entry, every knob value list: unedited (`git diff
--stat 24e2790` empty on each path); the sweep's subject did not move and the sweep says `4 19`.
- `install-copy.spec.ts` and `session-copy.spec.ts` read `13.1-COPY-NEW.md` as their fourth
  document and pin the seventeen 13.1-06 strings and the two snapshot lines by name; the ledger is
  closed at this gate with a "Where every row went" section and cannot be appended to silently.
- `.planning/ROADMAP.md` unedited (`git diff --quiet` exit 0); `CAT-04` still `[ ]`.

### The gate holes, recorded

- **`Knob.svelte:785` is a declared circle with no mount.** Layer A counts it; layer C cannot
  measure it; the sweep names it unreachable. A test that asserts D-15's six by file and line now
  asserts one line no route renders. The user's question (U in the runbook's fourth-bench section);
  the edit is `Knob.svelte`'s, untouchable this phase.
- **The app frame's 71px** (A.1): every app page scrolls at 1280 × 720 by the footer's second row;
  `sandbox.e2e.ts`'s drag title sets 900 tall to reach the bottom handle. Not fixed at this gate
  (above).
- **The forecast machinery has no caller** (TUNE-02's qualifier): `Knob.svelte` / `KnobRack.svelte`'s
  forecast props, `model.ts`'s `onforecast`, `tune/copy.ts`'s `forecastDelta` / `forecastExpansion`
  stand with nothing handing a forecast since 13.1-07. Retiring by name is a `Knob.svelte` edit.
- **The store's reason precedence** (A.2) and **the 768 edge** (A.3), seen at 13.1-05, unchanged.
- **A lost write's failure block has no screen after an unplug** (13.1-07's finding): the zone
  leaves with the session; the bar keeps the lost title. The user's question T.
- **The browse hydration race** (`browse:299`, `:343`, `:1404`) is the one family of red in this
  gate's two runs and in 13.1-01's and 13.1-07's; the titles gesture the moment the prerendered
  cards are counted. A `waitForFunction` on hydration in the three titles is a quick task nobody
  has been given.
- **The wrangler harness** (13-20's hole): no server died in this gate's fifteen chunk runs at
  1.7 to 2.3 GB free; 13.1-02 saw two deaths at 1.5 to 1.7 GB. The pin bump is still nobody's.
- **`check-counts.mjs` has no direction** (12-04 onward): unchanged; 13.1-06 and 13.1-07 each
  proved it against one negative before trusting a −1 or a +1.
- **The audition table's cost cells and the runbook's rows are gated by nothing**: unchanged; the
  runbook now has four answered rows and no spec reads them either.
- **Nothing this phase shipped has been on a module.** The four hardware-verified rows are the
  Phase 13 tree's; the switch on the select's change, the header's Clear, the zone and the fields
  are handed to the bench in the runbook.

### The app frame fits the screen - A.4 closed by a quick task after the gate (2026-09-12)

The quick task after the 13.1 gate did A.4's edit as it was written and measured it on the served
build in chromium at 1280 × 720, document `scrollHeight / clientHeight`, before and after, against
a fresh build each time (the build on disk was stale; `e798ea0` was rebuilt first): before `/`
**720 / 720**, `/playground/` **791 / 720**, `/sandbox/?new` **791 / 720**, `/my-configs/`
**791 / 720**, `/playground/arc/` **1012 / 720** - A.4's five to the pixel; after **720 / 720 on all
five**, the frame **464** (`720 − 76 − 59 − 121`, derived, never a calc), the footer's bottom
edge at 720. `src/routes/+layout.svelte`: `.site` is the 100dvh flex column under every variant
(the `.intro` qualifier gone from the root rule and from `.site .shell`'s flex 1; the old
`.site { display: contents }` with it), `.frame` is `flex: 1 1 0; min-block-size: 0` with the
calc on `FOOTER_H` deleted, and the stacked band's `.site.intro { display: contents }` reads
`.site`. **One line A.4 did not write and the tree needed**: `.frame { flex: none }` in the stacked
band beside the `block-size: auto` that stays - measured at 900 × 720 without it, the frame was
**0px tall** and `/playground/` a **8522px** document, because with the site root `display:
contents` the shell's column is content-height and Chrome sizes a flex-basis-0 child of a
content-height column at zero; `.centre.intro` has declared the same `flex: none` in the same band
since 13.1-01 for the same reason. After it the stacked and narrow bands flow as before (900 × 720:
`/playground/` 9356, `/sandbox/` 1855, `/my-configs/` 1166, `/playground/arc/` 2593, the frame
content-sized and the footer under it).

**The workspace's 221px was a second thing, diagnosed**: `TuningRegion.svelte:865`'s
`<p class="sr-only" data-testid="tuning-live">` - Tailwind's `sr-only` is `position: absolute` -
sat at its static position under the inspector's last section (top 1011, bottom 1012) with the
initial containing block as its containing block, so neither `shell-inspector-body`'s
`overflow: auto` nor `inspector-col`'s `overflow: hidden` clipped it and the document's scrollable
overflow reached 1012 = 791 + 221. The same shape as A.4 (content that belongs to a frame scroll
region), so fixed rather than recorded: `Inspector.svelte`'s `.body` is `position: relative` - a
containing block on the scroll container keeps the paragraph inside it. `TuningRegion.svelte` is
untouched. The same escape exists for the workspace's two `sr-only` mode radios (`mode-configure`,
`mode-play`, 1px boxes at their static position inside the centre, offsetParent BODY); they sit
inside the viewport and move nothing, so `.centre` was left without a `position` - noted, not a
change.

**Proof**: `e2e/browse.e2e.ts`'s new chromium title _the app frame fits the screen_ visits
`/playground/`, `/sandbox/?new`, `/my-configs/` and `/playground/arc/` at 1280 × 720 through a cold
arrival each, waits for the page (the cards, the plate, `my-configs`, the settled region), lets
fonts and two frames land, and asserts `scrollHeight <= clientHeight`, the footer's bottom at 720
and the frame above 300 tall; before the edit the first assertion reads 791 or 1012 against 720.
`e2e/sandbox.e2e.ts`'s drag title is back at the harness's 720 (it was 900 because the footer
overlaid the plate's bottom row; its comment says so). `intro.spec.ts` 5's two `.site.intro`
selectors read `.site`; `shell.spec.ts` 5 unchanged; `FOOTER_H` keeps its one reader
(`Footer.svelte`'s `min-block-size`). Counts as carried from the gate, then the delta: quick
**94 / 964 (+1 todo)** twice at `--maxWorkers=2` (`+0 / +0`); check **654 / 0 / 0** (`+0`); lint
clean; radius layer A allowlist **0** and six circles by file and line (`ColourPicker.svelte`
:840 :867 :882, `Knob.svelte` :730 :785 :807), layer B green against the fresh build, layer C
**79** circles square STRICT on 12 routes; e2e **86 titles / 101 runs** (`+1 / +1`) in the five
chunks on fresh detached servers (`e2e-chunks-1208.sh`, stopped through PowerShell): c1 32, c2 19
green + 3 red, c3 21, c4 15, c5 11. c2's three reds were the named transient and nothing else
(`browse:299`, `:343`, `:1404`, the hydration race under three workers, A.8): `:299` and `:1404`
green on the first solo run, `:343` red once more on that run with the transient's shape (5
expected, 26 - the grid never narrowed) and green on the second, as at the gate. Commits: the code
and the e2e together, then this paragraph with `deferred-items.md`'s dated closed line and STATE.
No device, no deploy; `src/vendor/`, `library.ts`, `Knob.svelte`, `ColourPicker.svelte` untouched.
CAT-04 stays `[ ]`; the phase stays gate landed / bench pending.

### The Sandbox header row - round 4b's item 3, closed by a quick task after the gate (2026-09-12)

Round 4b passed ten of ten and named one thing, with a screenshot: the Sandbox's header controls
"all over the place" - the `Edit` / `Play` switch with its mode line under it, `Save copy`
mid-right, `Export as a file` far right with its two-line explanation under it, four controls at
four heights. The quick task sorted them into PDF page 3's two rows and nothing else (commit
`775a2d4`, `src/routes/sandbox/[draftId]/+page.svelte` and `src/lib/ui/sandbox/SurfaceActions.svelte`;
no string changed, so no ledger row; no test re-aimed). **The name's row**: the name, `Rename` and
the switch centred on one another (`.title-row` and `.name-block` `align-items: center`), as the PDF
draws the switch's boxes at y 186-226 on the name at 207. **The helper lines out of the rows**: the
mode line is the sub-line's second line (a `.lines` block, gap 4, left) - visible because section 8
says "a persistent visible mode label", under the sub-line because the PDF draws none under the
switch; the export's explanation is the button's description alone (`sr-only`, still its
`aria-describedby`; `sandbox.e2e.ts` reads it by `toContainText`, which does not need paint). **One
toolbar row**: `Undo` `Redo` left, `Save copy` `Export as a file` right, four outlined 44px boxes
of one family, `SurfaceActions`'s `.share` `display: contents` so its button and its line are the
row's items directly. **Measured on the served build in chromium** (every box on a row equal top
and bottom to 0.0px; the criterion was 1px): 1280 x 720 - Rename and both segments **184.2-228.2**,
the name 186.4-226; the four boxes **303.7-347.7**; the plate from 363.7; document 720 / 720.
1440 x 900 - the same four numbers, the plate from 363.7, document 900 / 900. 1024 x 720 - the four
boxes **431.5-475.5** on one row (the compact band's `.tools .outlined` at 10px padding and 8px
gaps: 353 in the 372 column; at the wide band's 16 / 12 they are 413 and would not); the name folds
to two lines and the switch takes its own line right-aligned - the 40px name is 343 wide, IDENT-01's
scale, not this task's; document 720 / 720. Nothing on the plate at any width.

**The transient outcome lines were the real work.** `saved to My configs.` and `Exported as …` sit
in the row for four seconds each, and prose beside fixed boxes sets a row's minimum: on the first
cut, both showing at 1024 slid the centre 55px sideways (the row's min-content past the column,
`.centre`'s `overflow: auto` scrolling to the clicked button). Now both lines are `min-inline-size:
0; overflow-wrap: anywhere; text-align: end`, shrinking and folding beside their buttons, and the
row does not wrap above 480 of column (a container query on `.sandbox` - KnobRack's precedent,
Clear.svelte's number): one line beside its button at 1440 and 1920, two at 1280, the row still 44
and the boxes still level; both at once make the row 56 for those seconds (the export's line
three deep at 1440 and 1280). Under 480 (1024's 372) the right pair drops to a second line for
the four seconds rather than fold to a column of letters; both at once there fold five and six
deep - the rarest state at a width the bench does not use, recorded in `deferred-items.md` row 12
and not fixed. Two shapes were tried and measured out: the lines nested inside `.share` (the
export's line paid for its own button in the shrink - 75px wide and five lines at 1440 while the
saved line had 219) and equal `flex: 1 1 0` shares (the same arithmetic the other way - 4px wide
and 697 tall at 1024, and the document scrolled).

Counts as carried from the gate, then the delta: quick **94 / 964 (+1 todo)** twice at
`--maxWorkers=2` (`+0 / +0`), and twice more on the final tree after a comment edit; check
**654 / 0 / 0** (`+0`); lint clean; radius layer A allowlist **0** and the six circles by file and
line (`ColourPicker.svelte` :840 :867 :882, `Knob.svelte` :730 :785 :807), layer B green against
the fresh build (36 declarations in 14 built stylesheets, six at 50%, nothing tolerated); e2e
**86 titles / 101 runs** (`+0 / +0`); chunk c4 (`catalog`, `fidelity`, `first-experience`,
`library`, `sandbox`) **15 passed** twice on fresh detached servers (`e2e-chunks-1208.sh`, stopped
through PowerShell, HTTP 000 after each stop). One executor note: a `Stop-Process` whose filter
matched `wrangler.*dev --port 4173` killed the Bash shell that carried the pattern in its own
command line (exit 255, the server already down); the stop lives in a script file since, as the
chunk script's does. Commits: the code alone, then this paragraph with `deferred-items.md`'s row
12 and STATE. No device, no deploy; `src/vendor/`, `library.ts`, `Knob.svelte`,
`ColourPicker.svelte` untouched. CAT-04 stays `[ ]`; the phase stays gate landed / bench pending.

### Clear stores the defaults - round 4c, closed by a quick task after the gate (2026-09-12)

The user's word, `BENCH-2026-09-12.txt` Round 4c, after case (b) - the Editor's stored page came
back after a power-cycle: "clear should not be RAM only though!! it should be like Store but with
Clear!". `install.svelte.ts`'s `clearToDefault()` runs the five defaults through `writeAll` as it
did and then the same `#storeLeg` Store on ZONA runs - one `PAGESTORE/EXECUTE` under pagestoreMs,
the module's next heartbeat, the five-string re-fetch bounded to three rounds (D-12) - proved
against the five defaults; `cleared` is said only after the proof. The sequence, as shipped and
as `install.spec.ts` asserts it by class, by shape and by step id: **five `CONFIG/EXECUTE`** in
SLOTS order (255/6, 255/0, 255/4, 0/6, 0/0), **one `HEARTBEAT/EXECUTE`** (the restore), **one
`PAGESTORE/EXECUTE`**, **five `CONFIG/FETCH`** per proof round - twelve frames and twelve steps
per click, the put-back-after-a-keep shape. The store's three outcomes are classified as Store on
ZONA's are: `kept` lands `cleared` and sets `keptThisSession` (a probe put-back stores too,
Z-04); `mismatch` lands `kept-mismatch` - REUSED, not a sixteenth phase, because
`keptMismatchBlock`'s sentence (acknowledged, read back different, not called stored) is exactly
true of a clear's store and its second step names Clear as the retry, and a `cleared-mismatch`
would have cost a row in the union, both `device-clause.ts` switches, `UNCERTAIN_PHASES`,
`DestinationZone.svelte`'s switch and the anti-collapse test to render the same sentence;
`unconfirmed` (no acknowledgement inside the retry bound) lands `unconfirmed` with
`FIRMWARE_DEFAULT_NAME` (`The firmware default`) set as `name` so the zone's block reads what is
running rather than the route's entry, and `keepReason()` gains an eighth row - `unconfirmed`
after a clear reads `never-tried`, because `knobs-moved` would have been a lie (no knob moved) -
still the closed set of six. `steps` is not reset between the legs. One click, no confirmation
(13.1 D-04 stands); no new snapshot; `sequence.ts` and `descriptors.ts` untouched; the
whole-page reset class stays forbidden (the store's comment names it by number, not by name,
because `forbidden-instructions.spec.ts` scans comments too - a first draft that spelled it and
the two page classes was red there and reworded).

**The copy** (D-05's register, ledgered in `13.1-COPY-NEW.md` with the batch rows superseded):
`clearLine` `Returns Page 2 to its firmware default and stores it, so it stays after power-off.
Your browser draft stays as it is.` (was I.6.3's without the store clause; the clause is
`keepLineEnabled`'s own words); `clearingLabel` `Resetting and storing Page 2…` (I.4.20);
`clearedCaption` `Page 2 reset to its firmware default and stored` (I.4.16); `liveCleared` the
same as a sentence (I.7.5); `FIRMWARE_DEFAULT_NAME` new. `install-copy.spec.ts`'s closed
ledgered list seventeen -> twenty-two; the A-48 stem scan's twelve strings still twelve and none
says `clears`, `empt` or `remove`. The "after a clear a KEEP stores nothing" line
(`cfg_default_flag`, 12-03) is unchanged and true: it is what the clear's OWN store does on the
module now - the cfg file deleted rather than written - the same power-cycle-safe default by
another route. `WRITE_CLICKS` unchanged at four.

**The tests.** `install.spec.ts` (+2): the clear title rewritten - the four classes, the twelve
frames, the twelve steps, the re-fetch sent after the fed heartbeat, the fake's flash and system
flash holding the five defaults, `powerCycle(state)` on the fake bringing the defaults back (the
user's case (b) on the fake), the locks `[true, false, true, false]` over the two legs,
`keptThisSession` true, a second clear idempotent (two stores), an apply after it RAM only; a
mismatch fixture on the clear (the touch Setup re-fetch answers `print(9)` after the store) lands
`kept-mismatch` after three rounds with the title spoken; a dropped `PAGESTORE` acknowledgement
lands `unconfirmed` with the name, the reason and the RAM leg landed (and the fake's flash holds
the default - the fault drops the acknowledgement, not the store, which is SAFE-07 on this leg);
the partial clear asserts zero `PAGESTORE`; the SLOTS-order title reads the refetch ids off the
list and the put-back after a stored clear stores too, flash holding the original again. Negative:
HEAD's `install.svelte.ts` under the new spec **4 failed / 25 passed**; restored byte-identical
(sha256 `0be8ded9…`). `e2e/install.e2e.ts`: the Clear walk's title says the store; after the
click the label reads the two-verb busy label, then `beatUntilShows` paces heartbeats until the bar
reads the stored caption (**4 heartbeats on webkit-phone, 5 on chromium**, logged), and the wire at
the end reads **fifteen `CONFIG/EXECUTE` and ONE `PAGESTORE/EXECUTE`** where it read zero - read
as numbers, not deltas, so a clear that stopped at RAM again fails on the one. The three other e2e
files that read the header's Clear read it disabled and are unchanged.

**Runbook row N** appended (the letter after M): apply and STORE a configuration in Grid Editor,
connect HANGAR, `Clear`, unplug, replug without HANGAR, touch the pad, read the page in the
Editor - passes when the page is the firmware default after the power-cycle; the RAM-only readings
in "If something goes wrong" (`FACTORY DEFAULT`) and item 11 of the fourth-bench section named as
superseded, not edited. SAFE-02's qualifier is the gate's; CAT-04 stays `[ ]`.

Counts as carried from the round-4b quick task, then the delta: quick **94 / 966 (+1 todo)**
twice at `--maxWorkers=2` (`+0 / +2`; a first run before the rebuild was red on layer B's stale
build and on the forbidden-instruction scan's comment, both named above); check **654 / 0 / 0**
(`+0`); lint clean; e2e **86 titles / 101 runs** (`+0 / +0`); chunk c1 (`install`, `session`)
**32 passed** on a fresh detached server (`e2e-chunks-1208.sh`, stopped through PowerShell, HTTP
000 after), no rerun. Commits: the code, the specs, the e2e, the ledger and the runbook row
together (`61ba376`), then this paragraph with `deferred-items.md`'s row 13 and STATE. The
build on disk is stamped at the commit before the code commit (`a66b034`); `artifacts.e2e.ts`
needs a rebuild before c5. No device, no deploy - the flash write is the user's bench row;
`src/vendor/`, `library.ts`, `sequence.ts`, `descriptors.ts`, `forbidden-instructions.spec.ts`,
`Knob.svelte`, `ColourPicker.svelte` untouched. The phase stays gate landed / bench pending.

## Phase 13.2's suites, measured at the gate

**Every count below was observed on 2026-09-14 at the Phase 13.2 gate (plan 13.2-06)**, on the
tree at `4b1f6e7` (clean apart from the user's three untracked root files and `.claude/`), against
a fresh production build stamped at that commit, from four `vitest run --project server
--maxWorkers=2` runs (two with the JSON reporter, inside the two gate runs; two plain), one sweep at
the gate (and one inside plan 06's task 2 on the same tree), and the Playwright suite in five file
chunks on fresh detached `wrangler dev` servers on 4173 stopped through PowerShell, the one red
rerun alone on a fresh server and named. Phase 13.2 is a refactor-only phase on the user's word
("research and clean up your code to make it easily readable but without changing any functionality
or anything"), so the gate's one sentence is not a count but a comparison: `scripts/13.2-gate.sh
--after 06-phase --against 01 --check 655` measured the whole phase against the record plan 13.2-01
took at `21c5ff8` before the first edit, and every term a visitor, a module or a test can see is
where it was. **Nothing in this section is hardware-verified by an agent**: no agent in Phase 13.2
connected to a ZONA, wrote to one or deployed, and nothing this phase shipped changes what a module
would receive (the wire set and `--full` are byte-equal to the baseline on all 1,761 records).

**This section is appended, and nothing above it is reflowed.** Phase 13.2 ran its six plans in ONE
SERIAL order, `01 -> 02 -> 03 -> 04 -> 05 -> 06`, alone in the tree (Phases 12, 12.1, 13 and 13.1
stand at gate landed / bench pending beside it and no plan of theirs ran), so the chain runs from
the round-4c line (`13.1-quick`, `61ba376`) and its end is the tree. Where the Phase 13.1 section
above states a figure this phase's edits moved (a comment-line count, a header length), the line is
left standing: those figures were true of the tree they measured.

### The re-measured block against the round-4c line

| Name              | The round-4c line (carried) | Phase 13.2's chain (six terms) | **Observed at `4b1f6e7`**                                                                                                                                                                                                                                                                                                          |
| ----------------- | --------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| quick files       | 94                          | +0 x6 = **94**                 | **94**                                                                                                                                                                                                                                                                                                                             |
| quick tests       | 966 (+1 todo)               | +0 x6 = **966**                | **966 (+1 todo)**; `check-counts.mjs 94 966` matches on all four runs (the two gate runs with the JSON reporter, one inside task 2, one plain at the gate)                                                                                                                                                                         |
| e2e titles / runs | 86 / 101                    | +0 / +0 x6 = **86 / 101**      | **86 / 101**; `--list` 101 runs in the titles hash; one chunked run at `32 + 22 + 21 + 15 + 11 = 101` (c2's 22 = 21 in the chunk + `browse.e2e.ts:343` alone)                                                                                                                                                                      |
| `svelte-check`    | 654                         | +1 +0 +0 +0 +0 +0 = **655**    | **655 files, 0 errors, 0 warnings** on both gate runs; the +1 is `src/test-support/source.ts` (13.2-01), the phase's one added source file                                                                                                                                                                                         |
| `npm run lint`    | clean                       | -                              | clean (prettier and eslint) on both gate runs                                                                                                                                                                                                                                                                                      |
| sweep             | `4 19`                      | run at 01, 02, 03, 06          | **`4 19`** at the gate, 127 s wall; reachability Pass A 20,270 + Pass B 24,576 = **44,846** in 120.1 s, laddered 8, over budget 0; the kind cross-product 1,296 in 3.3 s, worst 906 of 908 at `none/none/trackpad/hi=false/grid=false`. **No entry file, knob list or vendored file moved this phase** (the wire set is the proof) |
| build             | 14 s                        | -                              | `postbuild: 4b1f6e7…`, the source archive 2,116 KB; 26 OG images, **154,136 B**, `2a9ccf80…`, byte-identical to 13.1-08's                                                                                                                                                                                                          |
| catalog           | 26 (8 + 18)                 | +0 x6 = **26**                 | **26**, 8 preset-backed + 18 hand-authored, the ids unmoved (the OG count and the wire's "18 Lua entries + 8 presets" line)                                                                                                                                                                                                        |
| radius allowlist  | 0 rows                      | +0 x6 = **0**                  | **0 rows**; layer A `34 declarations in 65 files scanned; 0 above zero remaining in 0 allowlisted files (); 6 circles (D-15); 28 exempt`                                                                                                                                                                                           |
| the six circles   | 6 (D-15)                    | +0 x6 = **6**                  | **6**, at `ColourPicker.svelte:840, :867, :882` and `Knob.svelte:730, :785, :807` - **neither file edited across the whole phase** (`git diff --stat 500e33c..HEAD -- src/lib/ui/Knob.svelte src/lib/ui/ColourPicker.svelte` prints nothing; 13.2-CONTEXT D-03)                                                                    |
| the manifest      | `dae35d39…`                 | +0                             | untouched; `src/vendor/` untouched (`git diff --stat 500e33c..HEAD -- src/vendor src/lib/fidelity/upstream-manifest.json` prints nothing)                                                                                                                                                                                          |

### The six-term chain, every zero written out, in EXECUTION order

The columns are the phase's serial order (the plans' `wave` field, 1 to 6); each term is the plan's
OWN observed count line (its SUMMARY's "Observed count line"), never the projection. The term count
is asserted at six on every row.

```
order            1     2     3     4     5     6
plan            01    02    03    04    05    06
files     94    +0    +0    +0    +0    +0    +0   =  94   (6 terms)
tests    966    +0    +0    +0    +0    +0    +0   = 966   (6 terms; +1 todo reported, never asserted)
e2e ttl   86    +0    +0    +0    +0    +0    +0   =  86   (6 terms)
e2e run  101    +0    +0    +0    +0    +0    +0   = 101   (6 terms)
check    654    +1    +0    +0    +0    +0    +0   = 655   (6 terms; the +1 is src/test-support/source.ts, 13.2-01 task 2)
allowlist  0    +0    +0    +0    +0    +0    +0   =   0   (6 terms)
circles    6    +0    +0    +0    +0    +0    +0   =   6   (6 terms)
catalog   26    +0    +0    +0    +0    +0    +0   =  26   (6 terms)
sweep   4 19   4 19  4 19  4 19    -     -   4 19  = 4 19  (run where 13.2-CONTEXT D-18 says: 01, 02, 03, 06; by declaration at 04 and 05)
```

The observed lines each term is read from, in order: 13.2-01 `94 / 966 (+1 todo) / 86 / 101 /
check 655 / sweep 4 19 / allowlist 0`; 13.2-02 the same; 13.2-03 the same; 13.2-04 `… / check 655 /
sweep by declaration / allowlist 0`; 13.2-05 the same; this gate `94 / 966 (+1 todo) / 86 / 101 /
check 655 / sweep 4 19 / allowlist 0`. No `it(` / `test(` / `describe(` title was added, deleted or
reworded anywhere in the phase: the sorted-titles hash (`TITLES b53f2d9c…`, 967 vitest titles
including the todo plus 101 Playwright runs) is equal on every one of the twelve gate records from
`01` to `06-phase`, and `diff gate/01.titles.txt gate/06-phase-after.titles.txt` is empty.

### Every hash, before and after: plan 01's `--before` at `21c5ff8` beside the gate's `--after 06-phase` at `4b1f6e7`

| Term                                           | `--before 01` (`21c5ff8`, 2026-09-13T11:41Z) | `--after 06-phase` (`4b1f6e7`, 2026-09-14) | State                                                                                                                                                                                                                        |
| ---------------------------------------------- | -------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the wire set (1,735 strings)                   | `a24b256f…`                                  | `a24b256f…`                                | **equal**; 1,761 records in the `--full` JSON, 0 moved                                                                                                                                                                       |
| the wire `--full`                              | `514cb2c7…`                                  | `514cb2c7…`                                | **equal**                                                                                                                                                                                                                    |
| the Sandbox set (154 strings, 11 fixtures)     | not recorded (01 predates `--sandbox`)       | `40b44316…`                                | **equal to 02's `--before`** (`40b44316…`), the first record that carries it, and to every record since                                                                                                                      |
| the literal census                             | `e6af80e0…` (2,721 / 6,342)                  | `6ac1cdf3…` (2,728 / 6,354)                | **the instrument moved, not the tree** - proved equal another way below; the `--after` reports `FAIL: the literal census` by construction (13.2-CONTEXT D-09: a `--before` record is never rewritten)                        |
| the copy exports (7 modules)                   | `10fad002…`                                  | `10fad002…`                                | **equal**                                                                                                                                                                                                                    |
| the data-testids (320)                         | `21fc9eb9…`                                  | `21fc9eb9…`                                | **equal**                                                                                                                                                                                                                    |
| `frames.json`                                  | `a581ef4c…`                                  | `a581ef4c…`                                | **equal** (`git hash-object`)                                                                                                                                                                                                |
| `golden-frames.json`                           | `3a1d71da…`                                  | `3a1d71da…`                                | **equal**                                                                                                                                                                                                                    |
| `preset-baseline.json`                         | `eca808d2…`                                  | `eca808d2…`                                | **equal**                                                                                                                                                                                                                    |
| `synthetic-zona.json`                          | `8b78c396…`                                  | `8b78c396…`                                | **equal** (`fixtures.spec.ts` regenerates it from `synthetic.ts` and compares; 06 demoted two of that file's exports and the bytes did not move)                                                                             |
| the OG images                                  | 26 files, 154,136 B, `2a9ccf80…`             | 26 files, 154,136 B, `2a9ccf80…`           | **equal**                                                                                                                                                                                                                    |
| the SCOPED built CSS (13.2-CONTEXT D-21)       | `e296d0af…`                                  | `e296d0af…`                                | **equal** on every one of the twelve records                                                                                                                                                                                 |
| the utilities layer                            | 45 classes, 5 named by markup                | 44 classes, 5 named by markup              | **shrink-only**: one class left, `row-0`, at 13.2-01 (its only source was a comment in `calibration.ts`); `block grid outline ring sr-only` intact; 0 appeared on any plan                                                   |
| the raw built CSS (recorded, expected to move) | `f89f1f4e…`                                  | `174411ee…`                                | **moved once, at 13.2-01, with `row-0`**; equal on every record from `01-after` to `06-phase` (the raw hash is a function of the utility set, D-21)                                                                          |
| the normalised built JS (recorded)             | `7f4e4d7a…`                                  | `07f50f2a…`                                | **moved on the four plans that drop `export`s or rename, equal on the two comments-only plans** (03 and 05 under `--js-equal`); 06's move is one chunk and is the seven `view.ts` demotions, proved by a counter-build below |
| the sorted test titles                         | `b53f2d9c…`                                  | `b53f2d9c…`                                | **equal**                                                                                                                                                                                                                    |
| `svelte-check`                                 | 654 / 0 / 0                                  | 655 / 0 / 0                                | **+1**, `src/test-support/source.ts`                                                                                                                                                                                         |
| the name-status of `src/` against `21c5ff8`    | -                                            | 234 M, 1 A, 0 D, 0 R                       | **the one A is `src/test-support/source.ts`**; the same four numbers against `500e33c` (the research commit); no `.svelte` renamed, nothing deleted                                                                          |
| the refused paths' `--stat`                    | -                                            | (empty)                                    | `src/vendor`, the manifest, `Knob.svelte`, `ColourPicker.svelte` untouched across the phase                                                                                                                                  |

**The census, proved another way.** The `--before 01` census was the instrument's number: until
13.2-05, `scripts/gate/hash-strings.mjs` removed `<style>…</style>` from a `.svelte` file BEFORE it
removed `<!-- -->`, and `PadSpinner.svelte:15`'s old header spelled `<style>` in prose, so the regex
matched from inside the header comment through the real `</style>` and the census never counted that
component's seven template literals (`Connecting`, `pad-spinner`, `spinner`, `walker`, the three
`still` classes) plus one `img` and four `true`. 13.2-05 fixed the stripper (`9bb9c06`, HTML
comments first) and the corrected census is `6ac1cdf3…` (2,728 distinct / 6,354 occurrences). The
`--before` records are not rewritten (D-09), so the phase gate reports the term as `FAIL` against
`01` by construction. The equality is proved instead on a `git worktree --detach` at `21c5ff8` (the
phase baseline, before any source edit) with the fixed `hash-strings.mjs` copied in
(`cc1ffb2a…`, the same bytes as HEAD's) and `node_modules` junctioned: the census at the baseline
is **`6ac1cdf3…`**, and its JSON record is equal to `gate/06-phase-after.strings.json` on `files`,
`literals`, `literalOccurrences`, `copyModules`, `testidCount`, `hashes`, `census`, `copyExports`
and `testids` - only `head` differs (`21c5ff8` vs `4b1f6e7`). The worktree was removed and pruned
the same minute; `node_modules` is intact. No literal, count, export or testid moved across the phase.

**The normalised JS on plan 06, by counter-build.** `--after 06 --against 06 --js-equal` (the plan's
own bracket, `681b1e8` to `4b1f6e7`) reported every term equal and the normalised JS moved
(`da40f09f…` -> `07f50f2a…`, one file of 71: the chunk holding `view.ts`'s word tables, `C#` and
`Magenta` inside it). Plan 06 demotes seven `view.ts` over-exports (`DOT_RAIL_MAX`,
`DIRECTION_WORDS`, `MODE_WORDS`, `BEND_WORDS`, `SPRING_WORDS`, `NOTE_NAMES`, `HUE_NAMES`) from
`export const` to `const`, and an unexported module-scope const is a name the minifier may mangle.
Proof that the move is exactly that: with the seven `export` keywords put back by `sed` on a scratch
copy of the tree's own file (the committed blob `4fc1a534…` recorded first), `npm run build` and the
gate's own normalisation pipeline give **`da40f09f…`** - the `--before 06` figure to the byte - and
the `export` keywords taken off again return the file to blob `4fc1a534…` with `git status` clean.
So the phase's JS moves are: 13.2-01 (six dead exports deleted, 28 demoted; `7f4e4d7a…` ->
`69ca1e25…`), 13.2-02's gate fix `b0c033c` (the normaliser learned kit's per-build
`__sveltekit_<hash>` global; `69ca1e25…` -> `e754d5f2…` on the same source, then `dacda4eb…` after
02's own edits), 13.2-04 (three private renames and one method merge; `dacda4eb…` -> `da40f09f…`),
13.2-06 (the seven demotions; `da40f09f…` -> `07f50f2a…`); 03 and 05 asserted equal.

### The per-file table for the whole phase, from `comment-lines.mjs --against gate/01.lines.json`

The audit's classes (13.2-RESEARCH A.0: a comment line starts with `//`, `*`, `/*` or `<!--` or
sits inside a block; the header is the leading comment run, blank lines after a comment included,
so a ten-line header measures 12 to 15 here with its copyright line, its `Decided at` line and the
fences). Every `.ts` and `.svelte` under `src/` outside `src/vendor/` and outside `*.spec.ts`,
every file whose numbers moved - 179 of 193 - and the totals; the fourteen that did not move are
`Knob.svelte` and `ColourPicker.svelte` (D-03) and twelve files that were already at the rule
(`catalog/index.ts`, `fidelity/firmware-oracle.ts`, `lib/index.ts`, `protocol/decode.ts`,
`protocol/index.ts`, `protocol/match.ts`, `protocol/write-guard.ts`, `protocol-pin.ts`,
`sim/schedule.ts`, `transport/index.ts`, `tune/idle.ts`, `routes/+layout.ts`);
`src/test-support/source.ts` is the one file added (13.2-01) and is not in the baseline record.
**The code lines: 29,525 at
`21c5ff8`, 29,538 at `4b1f6e7`** - the difference is 13.2-01's six deleted declarations (-5) and
13.2-04's `#systemStringOr` merge, which the classifier counts as +18 code lines for the one method
that replaced three (the wire byte-identical).

| file                                      | lines before | after | comment before | after | header before | after |
| ----------------------------------------- | -----------: | ----: | -------------: | ----: | ------------: | ----: |
| src/app.d.ts                              |           24 |    21 |             14 |    11 |             2 |     2 |
| src/lib/browse/facets.ts                  |          445 |   297 |            253 |   105 |            74 |    15 |
| src/lib/browse/filter.ts                  |          191 |   145 |            111 |    65 |            22 |    11 |
| src/lib/browse/grid.ts                    |          115 |   112 |             66 |    63 |            12 |     9 |
| src/lib/browse/labels.ts                  |           63 |    39 |             45 |    21 |            36 |    12 |
| src/lib/browse/query.ts                   |          228 |   141 |            159 |    72 |            54 |    12 |
| src/lib/browse/rail.ts                    |          108 |    95 |             39 |    26 |            25 |    12 |
| src/lib/browse/return.ts                  |          162 |   118 |            101 |    57 |            58 |    14 |
| src/lib/browse/sort.ts                    |          109 |    77 |             71 |    39 |            24 |    12 |
| src/lib/browse/typographic.ts             |           59 |    41 |             50 |    32 |            36 |    18 |
| src/lib/catalog/calibration.ts            |          203 |   122 |            133 |    52 |            95 |    14 |
| src/lib/catalog/divergence.ts             |          421 |   389 |            123 |    91 |            44 |    12 |
| src/lib/catalog/entries/arc.ts            |          397 |   183 |            293 |    79 |           264 |    65 |
| src/lib/catalog/entries/chorus.ts         |          330 |   192 |            217 |    79 |           158 |    62 |
| src/lib/catalog/entries/console.ts        |          385 |   146 |            313 |    74 |           276 |    59 |
| src/lib/catalog/entries/cull.ts           |          249 |   141 |            184 |    76 |           144 |    61 |
| src/lib/catalog/entries/euclid.ts         |          373 |   185 |            266 |    78 |           226 |    62 |
| src/lib/catalog/entries/ghost.ts          |          442 |   194 |            338 |    90 |           282 |    71 |
| src/lib/catalog/entries/lumen.ts          |          639 |   167 |            576 |   104 |           530 |    86 |
| src/lib/catalog/entries/morph.ts          |          535 |   185 |            440 |    90 |           376 |    69 |
| src/lib/catalog/entries/pomodoro.ts       |          356 |   161 |            281 |    86 |           215 |    66 |
| src/lib/catalog/entries/ported.ts         |          191 |   149 |             89 |    47 |            44 |    12 |
| src/lib/catalog/entries/quadrant.ts       |          261 |   144 |            191 |    74 |           128 |    55 |
| src/lib/catalog/entries/radar-points.ts   |          469 |   193 |            365 |    89 |           317 |    68 |
| src/lib/catalog/entries/snake.ts          |          285 |   159 |            210 |    84 |           167 |    67 |
| src/lib/catalog/entries/sonar.ts          |          417 |   186 |            313 |    82 |           278 |    65 |
| src/lib/catalog/entries/stage.ts          |          389 |   151 |            323 |    85 |           291 |    70 |
| src/lib/catalog/entries/steps.ts          |          384 |   165 |            300 |    81 |           252 |    64 |
| src/lib/catalog/entries/strip.ts          |          392 |   152 |            320 |    80 |           265 |    62 |
| src/lib/catalog/entries/trackpad.ts       |          312 |   142 |            246 |    76 |           225 |    58 |
| src/lib/catalog/entries/wheels.ts         |          508 |   185 |            424 |   101 |           354 |    76 |
| src/lib/catalog/front-door.ts             |          289 |   240 |            121 |    72 |            54 |    22 |
| src/lib/catalog/library.ts                |          709 |   401 |            603 |   295 |           479 |   188 |
| src/lib/catalog/listing.ts                |          515 |   477 |            179 |   141 |            33 |    12 |
| src/lib/catalog/presets.ts                |          442 |   393 |            240 |   191 |            62 |    13 |
| src/lib/catalog/touch-guard.ts            |          191 |   174 |             51 |    34 |            31 |    14 |
| src/lib/catalog/types.ts                  |          195 |   185 |             89 |    79 |            21 |    11 |
| src/lib/device/install-copy.ts            |          665 |   473 |            417 |   224 |           210 |    53 |
| src/lib/device/install.svelte.ts          |         1939 |  1462 |            988 |   498 |           225 |    31 |
| src/lib/device/page-target.ts             |          434 |   328 |            224 |   118 |            96 |    15 |
| src/lib/device/session-copy.ts            |          619 |   520 |            363 |   264 |            73 |    24 |
| src/lib/device/session.svelte.ts          |         1239 |   975 |            635 |   368 |           134 |    28 |
| src/lib/device/snapshot.ts                |          569 |   484 |            232 |   147 |           102 |    17 |
| src/lib/device/try-on.ts                  |          135 |   128 |             61 |    54 |            19 |    12 |
| src/lib/og/png.ts                         |          107 |    91 |             50 |    34 |            28 |    12 |
| src/lib/og/render.ts                      |          253 |   239 |            101 |    87 |            28 |    14 |
| src/lib/pad/index.ts                      |          130 |   122 |             42 |    34 |            19 |    11 |
| src/lib/pad/ready.ts                      |           40 |    32 |             23 |    15 |            18 |    10 |
| src/lib/protocol/constants.ts             |          289 |   251 |            204 |   166 |            49 |    13 |
| src/lib/protocol/descriptors.ts           |          447 |   423 |            213 |   189 |            37 |    13 |
| src/lib/protocol/framing.ts               |           55 |    50 |             21 |    16 |            15 |    10 |
| src/lib/protocol/usb.ts                   |           24 |    18 |             21 |    15 |            22 |    16 |
| src/lib/sandbox/colour-knob.ts            |           79 |    72 |             24 |    17 |            19 |    12 |
| src/lib/sandbox/copy.ts                   |          225 |   208 |             81 |    64 |            26 |    14 |
| src/lib/sandbox/cost.ts                   |          247 |   205 |             77 |    35 |            54 |    12 |
| src/lib/sandbox/draft.ts                  |           73 |    59 |             30 |    16 |            25 |    11 |
| src/lib/sandbox/editor.ts                 |          991 |   901 |            202 |   112 |           103 |    13 |
| src/lib/sandbox/emit.ts                   |          442 |   325 |            188 |    71 |           138 |    12 |
| src/lib/sandbox/geometry.ts               |          451 |   397 |            128 |    74 |            67 |    13 |
| src/lib/sandbox/history.ts                |          180 |   116 |             90 |    26 |            76 |    12 |
| src/lib/sandbox/land.ts                   |          180 |   121 |             90 |    31 |            72 |    13 |
| src/lib/sandbox/model.ts                  |          358 |   238 |            186 |    78 |           119 |    12 |
| src/lib/sandbox/preview.ts                |           81 |    60 |             42 |    21 |            34 |    13 |
| src/lib/sandbox/runtime.ts                |          393 |   217 |            238 |    62 |           202 |    12 |
| src/lib/share/stamp.ts                    |          517 |   425 |            222 |   130 |            94 |    13 |
| src/lib/share/url.ts                      |           57 |    45 |             46 |    34 |            31 |    19 |
| src/lib/sim/demo.ts                       |          392 |   211 |            255 |    74 |            66 |    13 |
| src/lib/sim/engine.ts                     |          138 |    87 |             80 |    29 |            40 |    12 |
| src/lib/sim/host.ts                       |          786 |   533 |            375 |   122 |           112 |    13 |
| src/lib/sim/lua-host.ts                   |         1059 |   785 |            477 |   203 |            22 |    12 |
| src/lib/sim/lua-pad-sim.ts                |          232 |   167 |            103 |    38 |            17 |     9 |
| src/lib/sim/monitor.ts                    |          257 |   184 |            129 |    56 |            54 |    13 |
| src/lib/sim/motion.svelte.ts              |          160 |    95 |             89 |    24 |            50 |    12 |
| src/lib/sim/paint.ts                      |           81 |    42 |             55 |    16 |            41 |    12 |
| src/lib/sim/ready.ts                      |           73 |    44 |             47 |    18 |            35 |    13 |
| src/lib/sim/touch.ts                      |          190 |   141 |             85 |    36 |            22 |     9 |
| src/lib/store/collections.ts              |          292 |   238 |            110 |    56 |            68 |    14 |
| src/lib/store/drafts.ts                   |          150 |   123 |             54 |    27 |            39 |    12 |
| src/lib/store/favorites.ts                |          119 |    95 |             49 |    25 |            36 |    12 |
| src/lib/store/intro.ts                    |           67 |    49 |             35 |    17 |            29 |    11 |
| src/lib/store/library.ts                  |          162 |   150 |             40 |    28 |            24 |    12 |
| src/lib/store/local.ts                    |          188 |   143 |             97 |    52 |            64 |    19 |
| src/lib/store/motion.ts                   |           48 |    37 |             25 |    14 |            22 |    11 |
| src/lib/store/recent.ts                   |           89 |    75 |             39 |    25 |            25 |    11 |
| src/lib/store/schema.ts                   |          326 |   263 |            142 |    79 |            78 |    15 |
| src/lib/store/transfer.ts                 |          505 |   413 |            189 |    97 |           114 |    13 |
| src/lib/transport/capture.ts              |          271 |   239 |             57 |    25 |            11 |    11 |
| src/lib/transport/fake.ts                 |          240 |   229 |             29 |    18 |            19 |     8 |
| src/lib/transport/fixtures/synthetic.ts   |          648 |   540 |            233 |   125 |            33 |    13 |
| src/lib/transport/ports.ts                |           62 |    40 |             41 |    19 |            20 |     9 |
| src/lib/transport/queue.ts                |          391 |   382 |             67 |    58 |            15 |     6 |
| src/lib/transport/sequence.ts             |          654 |   510 |            250 |   106 |            23 |    10 |
| src/lib/transport/transport.ts            |          201 |   168 |             64 |    31 |            10 |    10 |
| src/lib/transport/web-serial.ts           |          178 |   158 |             59 |    39 |            15 |     8 |
| src/lib/tune/copy.ts                      |          579 |   412 |            368 |   200 |           132 |    37 |
| src/lib/tune/inspector-copy.ts            |          251 |   224 |            117 |    90 |            27 |    16 |
| src/lib/tune/knobs.lua.ts                 |           57 |    44 |             42 |    29 |            23 |    10 |
| src/lib/tune/knobs.preset.ts              |          794 |   763 |            251 |   220 |            27 |    12 |
| src/lib/tune/model.ts                     |         1169 |   887 |            504 |   222 |            58 |    13 |
| src/lib/tune/state.ts                     |          133 |   121 |             71 |    59 |            24 |    12 |
| src/lib/tune/surprise.ts                  |          183 |   122 |            114 |    55 |            67 |    13 |
| src/lib/tune/view.ts                      |          863 |   639 |            403 |   179 |            43 |    18 |
| src/lib/ui/BrowseGrid.svelte              |          532 |   359 |            249 |    76 |            92 |    14 |
| src/lib/ui/BrowseLink.svelte              |          227 |   131 |            132 |    36 |            55 |    14 |
| src/lib/ui/BrowseToolbar.svelte           |          566 |   446 |            174 |    54 |            90 |    15 |
| src/lib/ui/BudgetMessage.svelte           |          223 |   149 |            106 |    32 |            66 |    14 |
| src/lib/ui/BudgetMeter.svelte             |          378 |   222 |            193 |    37 |            81 |    14 |
| src/lib/ui/CatalogCard.svelte             |          450 |   302 |            190 |    42 |           100 |    14 |
| src/lib/ui/Clear.svelte                   |          279 |   167 |            148 |    36 |            98 |    14 |
| src/lib/ui/CopyLink.svelte                |          258 |   168 |            119 |    29 |            62 |    14 |
| src/lib/ui/DestinationZone.svelte         |          576 |   444 |            176 |    44 |           117 |    14 |
| src/lib/ui/DeviceActions.svelte           |          121 |    80 |             57 |    16 |            50 |    13 |
| src/lib/ui/DeviceDetails.svelte           |          523 |   368 |            195 |    40 |           104 |    14 |
| src/lib/ui/DeviceMark.svelte              |           85 |    56 |             43 |    14 |            41 |    12 |
| src/lib/ui/DeviceNote.svelte              |          318 |   193 |            157 |    32 |            95 |    14 |
| src/lib/ui/DeviceSlot.svelte              |          392 |   273 |            157 |    38 |            91 |    14 |
| src/lib/ui/FacetRow.svelte                |          252 |   179 |            103 |    30 |            65 |    14 |
| src/lib/ui/FailureBlock.svelte            |          103 |    73 |             48 |    18 |            39 |    13 |
| src/lib/ui/FidelityLine.svelte            |          141 |   107 |             53 |    19 |            34 |    13 |
| src/lib/ui/KeepConfirm.svelte             |          320 |   230 |            116 |    26 |            76 |    14 |
| src/lib/ui/KnobRack.svelte                |          221 |   151 |            102 |    32 |            57 |    14 |
| src/lib/ui/MidiField.svelte               |          341 |   279 |             93 |    31 |            55 |    14 |
| src/lib/ui/MidiMonitor.svelte             |          381 |   324 |             80 |    23 |            57 |    13 |
| src/lib/ui/MotionControl.svelte           |          126 |   100 |             42 |    16 |            35 |    13 |
| src/lib/ui/PadCanvas.svelte               |           87 |    65 |             45 |    23 |            19 |    12 |
| src/lib/ui/PadFrame.svelte                |          191 |   100 |            118 |    27 |            57 |    14 |
| src/lib/ui/PadSpinner.svelte              |          240 |   200 |             60 |    20 |            42 |    14 |
| src/lib/ui/SessionAnnouncer.svelte        |           49 |    26 |             36 |    13 |            36 |    13 |
| src/lib/ui/StampNotice.svelte             |          102 |    65 |             56 |    19 |            40 |    13 |
| src/lib/ui/Swatch.svelte                  |          321 |   243 |            120 |    42 |            61 |    14 |
| src/lib/ui/TagChip.svelte                 |          150 |   107 |             63 |    20 |            53 |    14 |
| src/lib/ui/TuningRegion.svelte            |          972 |   694 |            390 |   112 |           152 |    15 |
| src/lib/ui/Wordmark.svelte                |           77 |    52 |             41 |    16 |            38 |    13 |
| src/lib/ui/device-drawer.svelte.ts        |           62 |    41 |             39 |    18 |            38 |    17 |
| src/lib/ui/fidelity-line.ts               |           46 |    19 |             43 |    16 |            44 |    17 |
| src/lib/ui/intro/HeroSurface.svelte       |          310 |   247 |             94 |    31 |            59 |    14 |
| src/lib/ui/intro/Intro.svelte             |          408 |   332 |            107 |    31 |            70 |    15 |
| src/lib/ui/intro/StartCard.svelte         |          144 |   121 |             41 |    18 |            31 |    13 |
| src/lib/ui/intro/card.ts                  |          111 |    87 |             64 |    40 |            36 |    12 |
| src/lib/ui/library/LibraryTable.svelte    |          516 |   483 |             74 |    41 |            44 |    14 |
| src/lib/ui/library/ResumeBanner.svelte    |          169 |   152 |             39 |    22 |            30 |    13 |
| src/lib/ui/library/words.ts               |           93 |    84 |             36 |    27 |            22 |    13 |
| src/lib/ui/radius-allowlist.ts            |          360 |   289 |            145 |    74 |            63 |    13 |
| src/lib/ui/sandbox/ElementList.svelte     |          179 |   167 |             29 |    17 |            25 |    13 |
| src/lib/ui/sandbox/Palette.svelte         |          181 |   169 |             30 |    18 |            25 |    13 |
| src/lib/ui/sandbox/RegionInspector.svelte |          592 |   555 |             65 |    28 |            48 |    15 |
| src/lib/ui/sandbox/SurfaceActions.svelte  |          123 |    93 |             48 |    18 |            38 |    13 |
| src/lib/ui/sandbox/SurfaceEditor.svelte   |         1046 |   916 |            206 |    76 |           103 |    15 |
| src/lib/ui/shell/ConnectionControl.svelte |           95 |    47 |             65 |    17 |            49 |    14 |
| src/lib/ui/shell/ContextBar.svelte        |          269 |   214 |             82 |    27 |            63 |    15 |
| src/lib/ui/shell/Footer.svelte            |          217 |   173 |             66 |    22 |            53 |    14 |
| src/lib/ui/shell/Header.svelte            |          175 |   128 |             70 |    23 |            45 |    14 |
| src/lib/ui/shell/Inspector.svelte         |          194 |   166 |             55 |    27 |            34 |    14 |
| src/lib/ui/shell/Nav.svelte               |          108 |    98 |             26 |    16 |            22 |    12 |
| src/lib/ui/shell/Rail.svelte              |          283 |   238 |             74 |    29 |            50 |    14 |
| src/lib/ui/shell/device-clause.ts         |          188 |   132 |             88 |    32 |            71 |    15 |
| src/lib/ui/shell/layout.ts                |          369 |   264 |            230 |   134 |            59 |    17 |
| src/lib/ui/shell/shell.svelte.ts          |          177 |   139 |            104 |    66 |            53 |    15 |
| src/routes/+layout.svelte                 |          432 |   320 |            171 |    59 |             0 |    11 |
| src/routes/+page.svelte                   |          131 |   104 |             49 |    22 |            35 |    13 |
| src/routes/+page.ts                       |           25 |    12 |             19 |     6 |            19 |     6 |
| src/routes/dev/catalog/+page.svelte       |           87 |    72 |             28 |    13 |            25 |    12 |
| src/routes/dev/fidelity/+page.svelte      |           91 |    50 |             59 |    18 |            19 |    10 |
| src/routes/dev/install/+page.svelte       |          423 |   328 |            145 |    50 |            69 |    15 |
| src/routes/dev/session/+page.svelte       |          209 |   137 |             99 |    27 |            69 |    14 |
| src/routes/dev/skeleton/+page.svelte      |          680 |   647 |             77 |    44 |            22 |    11 |
| src/routes/dev/tune/+page.svelte          |          243 |   147 |            136 |    40 |           100 |    15 |
| src/routes/dev/type/+page.svelte          |          158 |   103 |             70 |    15 |            70 |    15 |
| src/routes/my-configs/+page.svelte        |         1362 |  1274 |            177 |    89 |            82 |    15 |
| src/routes/my-configs/+page.ts            |           23 |    17 |             12 |     6 |            12 |     6 |
| src/routes/playground/+page.svelte        |          619 |   529 |            172 |    82 |            79 |    15 |
| src/routes/playground/+page.ts            |           32 |    19 |             21 |     8 |            21 |     8 |
| src/routes/playground/[id]/+page.svelte   |          985 |   840 |            272 |   127 |           120 |    15 |
| src/routes/playground/[id]/+page.ts       |           69 |    42 |             44 |    17 |            38 |    11 |
| src/routes/sandbox/+page.svelte           |          111 |   102 |             23 |    14 |            22 |    12 |
| src/routes/sandbox/+page.ts               |           27 |    20 |             14 |     7 |            14 |     7 |
| src/routes/sandbox/[draftId]/+page.svelte |         1178 |  1068 |            185 |    75 |            96 |    15 |
| src/routes/sandbox/[draftId]/+page.ts     |           51 |    25 |             37 |    11 |            37 |    11 |
| src/test-support/source.ts (new)          |            - |    30 |              - |    13 |             - |     4 |
| **totals (192 -> 193 files)**             |        60539 | 45774 |          27267 | 12490 |         14072 |  3830 |

179 file(s) moved

**The totals, against the research's audit.** 13.2-RESEARCH counted 193 files / 60,710 lines /
27,480 comment / 14,072 header; the gate's `--before 01` record at `21c5ff8` reads **192 files /
60,539 lines / 27,267 comment / 14,072 header** (the research included `src/app.css`, which
`comment-lines.mjs` does not walk - 13.2-01 SUMMARY), and the gate's `--after 06-phase` reads **193
files / 45,774 lines / 12,490 comment / 3,830 header**: 14,777 comment lines and 10,242 header lines
gone, the code lines +13 by the two code changes named above, the blank lines 3,747 -> 3,746. By
plan, the tree's comment lines: 27,267 -> 25,118 (01) -> 20,383 (02) -> 19,740 (03) -> 18,983 (04)
-> 15,624 (05) -> 12,490 (06); the headers 14,072 -> 12,241 -> 8,040 -> 7,602 -> 7,302 -> 5,114 ->
3,830. `node scripts/gate/comment-lines.mjs --todo` over every non-spec `.ts` and `.svelte` under
`src/` prints exactly `src/lib/ui/ColourPicker.svelte header 62`, `src/lib/ui/Knob.svelte header
83` (the two files D-03 excludes) and `src/lib/catalog/library.ts header 162` (its ten numbered
banners kept as a table of contents, 13.2-02, CODE-STYLE section 9) and nothing else. Over the
specs it still prints sixteen - `radius.spec.ts` (45; D-01's own record, the exception 05 named)
and `decay-idiom.spec.ts` (39; the four numbered sections the tests' messages cite, 13.2-02
D-20), `wire-pin.spec.ts` (46), `lua-parity.spec.ts` (26), `stamp.spec.ts` and `transfer.spec.ts`
(18), `query.spec.ts`, `ready.spec.ts` and `collections.spec.ts` (16), `snapshot.spec.ts` (15),
`listing.spec.ts` and `surprise.spec.ts` (14), `return.spec.ts` (13), `facets.spec.ts` (12),
`typographic.spec.ts` and `calibration.spec.ts` (11) - none of them on any plan's file list: the
phase's spec headers were the ones its plans named, and these sixteen are what it did not do,
stated rather than folded in.

**The spec headers, by plan** (the table above walks no `*.spec.ts`): 01 eight (the leaf tier's),
02 `library.spec.ts` and five catalog specs (`lua-entries.sweep`, `decay-idiom` to 52 by D-20, `host-surface`, `copy`, `audition`), 03 the four copy specs, 04 `install.spec.ts` (71 -> 10)
and `session.spec.ts`, 05 eleven ui specs plus `colour-picker.spec.ts` (every body byte-identical
after the copyright line, proved by a sha256 over the body per file), 06 `model.spec.ts` (20 -> 6),
`ladder.spec.ts` (26 -> 7), `reachability.sweep.spec.ts` (57 -> 10), `demo.spec.ts` (14 -> 5),
`host.spec.ts` (12 -> 5), `lua-host.spec.ts` (17 -> 6), `lua-smoke.spec.ts` (60 -> 10) and
`stamp-roundtrip.sweep.spec.ts` (43 -> 10); `view.spec.ts` and the other sim and transport specs
were already under the rule and were not touched.

### The docs created, and the one source file

`docs/CODE-STYLE.md` (the rule, written once by 13.2-01; its section 9 gained one dated line at each
of 02, 03, 04, 05 and this gate); the twenty files under `docs/entries/` (eighteen entries'
histories moved verbatim into a fenced block each by 13.2-02, plus `library.md` and
`sandbox-runtime.md`); the gate itself - `scripts/13.2-gate.sh` over `scripts/gate/` (`hash-wire.mjs`,
`hash-strings.mjs`, `ts-ext-register.mjs`, `ts-ext-hooks.mjs`, `comment-lines.mjs`, `css-terms.mjs`,
`e2e-chunks.sh`, and `sandbox-fixtures.mjs` from 13.2-02's `--sandbox` term) with its records under
`.planning/phases/13.2-readability/gate/` (`<tag>.*` and `<tag>-after.*` for `01` to `06`, plus
`06-phase-after.*`); and **one source file, `src/test-support/source.ts`** - the one `stripComments`
that 33 specs import (24 with the three-replace body, 9 with the two-replace body, proved equal over
every input the specs feed them before the swap; 13.2-01), the reason `svelte-check` reads 655.

### The spec bodies edited across the phase, by title, and the re-aims

Titles: none - the titles hash is equal on every record. Bodies, all of them named in advance by
13.2-VALIDATION "Spec bodies this phase may edit": **13.2-01** the 33 `stripComments` swaps (the
local `strip` / `stripComments` copy and its doc comment deleted, one import added, the call sites
unchanged in count: `install.spec.ts` 6, `install-copy.spec.ts` 4, `local.spec.ts` 4,
`session-copy.spec.ts` 3, `demo.spec.ts` 2, `model.spec.ts` 2, `identity.spec.ts` 2, one each in the
rest); **13.2-04** the eleven `keptThisSession` -> `storedThisSession` lines in `install.spec.ts`
(ten assertions and one comment) and the seven spec comments naming `#pageInit` / `#pageTimer` /
`#pageUtility` reworded to `#systemStringOr` (`install.spec.ts` two, `wire-pin.spec.ts` two,
`model.spec.ts` three; the plan's `install.spec.ts` line numbers were six high); **13.2-02, 03, 05
and 06: headers only**, every body byte-identical after the copyright line. **Re-aims: zero.** Every
spec needle that reads a comment as text was kept on ONE line where a spec pins the phrase
(`MIX_TWO 7, MIX_LINE 75, MIX_THIS / MIX_THAT 8 / 8` in 03; `THERE IS NO ADVANCED SECTION`, `Use
actual parameter names`, `NOT GENERAL UNDO`, `Not a history, not a stack, not a tree`, `D-14 Q4b`,
`src/vendor/`, `midiLog`, `history.ts` in 05; the raw `aria-live`, `writeLock` and `summary …
whenever it does not` counts in 05), and 06's route headers name no other probe's directory
(`config-shape.spec.ts`'s raw `dev/<probe>` scan over every file under `src/routes/`, grepped
before the commit: no mention outside its own directory).

### The refuse-list, proved (13.2-CONTEXT D-06; CODE-STYLE section 6)

`src/vendor/`, `src/lib/fidelity/upstream-manifest.json`, `Knob.svelte` and `ColourPicker.svelte`:
`git diff --stat 500e33c..HEAD` over the four prints nothing (`vendored-diff.spec.ts` green in every
quick run). Every Lua literal: the wire set and `--full` equal on all 1,761 records, the Sandbox set
equal from its first record. The four fixtures and the OG images: the hash-objects and the OG bytes
above. Every persisted key, every user-facing literal, every `data-testid`: the census (proved), the
copy exports and the testid hash. Every test title: the titles hash. Every `.svelte` filename: the
scoped CSS hash and the name-status (0 R, 0 D). No new spec file: `check-counts.mjs 94 966` on every
run. `CIRCLES`: the allowlist row above.

### The runs, with the free memory beside each, and every rerun named

| Run                                                                  | Free memory | Result                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--before 06` at `681b1e8`                                           | 3.38 GB     | recorded (every hash equal to `05-after`'s)                                                                                                                                                                                                      |
| task 2's own: check, lint, quick, sweep                              | -           | 655 / 0 / 0; clean; `94 / 966 (+1 todo)`; `4 19`                                                                                                                                                                                                 |
| `--after 06 --against 06 --check 655 --js-equal` at `4b1f6e7`        | 1.74 GB     | every term equal; `FAIL: the normalised JS` on the last term - the seven `view.ts` demotions, proved by the counter-build; quick `94 / 966`, JSON reporter                                                                                       |
| `--after 06-phase --against 01 --check 655` at `4b1f6e7`             | 1.16 GB     | `FAIL: the literal census` by construction (the instrument's baseline); every other term compared by hand from the two `.txt` records and equal, the JSON records equal field by field; quick `94 / 966`, JSON reporter                          |
| the counter-build (exports restored)                                 | -           | normalised JS `da40f09f…`; the file returned to blob `4fc1a534…`; the final build rebuilt at `4b1f6e7` and its normalised JS `07f50f2a…` equal to both gate runs'                                                                                |
| c1 (`install`, `session`)                                            | 2.13 GB     | **32 passed** (1.2 m); `install.e2e.ts:1957` (13.2-RESEARCH A.21) green on both engines                                                                                                                                                          |
| c2 (`browse`, `browse-webkit`)                                       | 2.30 GB     | 1 failed / 21 passed (32.7 s): `browse.e2e.ts:343` "searching and tag chips narrow the grid, and CLEAR FILTERS brings it back" - `toHaveCount(5)` received 26, the filtered grid counted before the filter hydrated                              |
| c2-alone-343                                                         | 2.38 GB     | **1 passed** (2.7 s), alone on a fresh server                                                                                                                                                                                                    |
| c3 (`tuning`, `tuning-webkit`)                                       | 2.37 GB     | **21 passed** (22.4 s)                                                                                                                                                                                                                           |
| c4 (`catalog`, `fidelity`, `first-experience`, `library`, `sandbox`) | 2.42 GB     | **15 passed** (16.9 s); `catalog.e2e.ts` proves a cold catalog load fetches no `glue.wasm`                                                                                                                                                       |
| c5 (`artifacts`, `radius`, `skeleton`, `smoke`)                      | 2.40 GB     | **11 passed** (11.8 s); layer C STRICT on the twelve routes in both engines                                                                                                                                                                      |
| the fourth quick run, plain                                          | 2.34 GB     | `94 / 966 (+1 todo)`                                                                                                                                                                                                                             |
| `radius.spec.ts` alone, verbose                                      | -           | layer A `34 declarations in 65 files scanned; 0 above zero remaining in 0 allowlisted files (); 6 circles (D-15); 28 exempt`; layer B `36 radius declarations in 14 built stylesheets; 6 of them 50%; tolerated values from the allowlist: none` |
| the sweep at the gate                                                | -           | `4 19`, 127 s wall; 44,846 states in 120.1 s, laddered 8, over budget 0; the kind cross-product 1,296, worst 906 of 908                                                                                                                          |

101 of 101 runs green in a chunk or alone; one rerun, named. Port 4173 answered `000` after every
stop; `test-results/` removed; the Playwright and wrangler logs in the session scratchpad, outside
the tree. The one red is the browse hydration race every plan of this phase has named
(`browse:299 / :343 / :1186 / :1404`, green alone on a fresh server; 13.1-08 and 13.2-05 saw the
same two titles red in a chunk at 2.3 and 3.78 GB free), and `BrowseGrid.svelte` and
`BrowseToolbar.svelte` compile identically to their pre-phase form (13.2-05's `svelte/compiler`
proof), so the shape is not this phase's. The user's dev server on 5173 was not touched.

### Where this phase's planner was wrong

Every figure 13.2-VALIDATION, 13.2-PLAN-CHECK or a PLAN stated that a SUMMARY observed differently,
stated here rather than corrected quietly:

- **"35 `strip` copies" (13.2-RESEARCH A.5, A.17): 33.** 24 with the three-replace body and 9 with
  the two-replace body; `radius-allowlist.ts`'s `blankComments` is a third function with different
  semantics and stayed (13.2-CONTEXT D-13; 01).
- **"10 dead exports deleted" (A.6, B.1): six.** `cellAt`, `isOnSurface`, `SURPRISE_BUDGET_MS`,
  `RAIL_FR`, `INTRO_STRIP_H`, `TYPE_SCALE`; four kept by name (D-10; 01).
- **"`store.keptThisSession` x3 asserted" (A.4): eleven lines** in `install.spec.ts`, ten of them
  assertions (D-12; 04), and the plan's line numbers for them six high.
- **The research's totals (193 / 60,710 / 27,480) included `src/app.css`**, which the gate's counter
  does not walk; the baseline is 192 / 60,539 / 27,267 (01).
- **"The SCOPED built-CSS hash is the baseline's (Vite strips `<style>` comments)"**: true of
  `<style>` comments and of `app.css`, false of a header comment that is the ONLY source of a
  utility carrying a top-level `@property --tw-*` rule (the gate hole below; 05 kept `ease-out`,
  `sepia` and `invert` in two headers rather than move the hash).
- **"The census is equal after every plan"**: equal in fact, but the recorded baseline was blind to
  one component's template (the instrument, above); 05's `--after` and this gate report the term as
  `FAIL` against the uncorrected records by construction.
- **"The normalised JS is equal on a comments-only plan"**: true only while the NUMBER of
  `<!-- -->` comment nodes between two template siblings is kept - Svelte emits one whitespace
  character per comment node into the built template literal (05 deviation 3; CODE-STYLE section 9).
- **The gate's `--after` runs the quick suite BEFORE its own build**, so `radius.spec.ts` layer B
  refuses a build older than the last source edit; 05's second `--after` read `quick exit 1` for
  that reason, and this plan built on the final tree before each `--after` (deferred-items row 3).
- **`bash scripts/gate/e2e-chunks.sh c3` does not run chunk c3** (02 deviation 3): a single argument
  is a chunk NAME plus its files; the whole set runs with no arguments.
- **`library.ts` "eleven numbered section headings": ten** (02); "sixteen by a strict regex,
  eighteen by a loose one": fourteen (02); the entries' plan expected classes to leave the
  utilities with the entries' prose: none left (02, 03 - `ordinal` stayed through
  `instrument.spec.ts:643` and `:663`).
- **Plan 06's `--after 06 … --js-equal`** (the orchestrator's line; the plan's own task 3 and
  13.2-CONTEXT D-09 say recorded, not asserted, on a plan that drops `export`s): the term moved by
  exactly the seven demotions, proved by the counter-build rather than explained away.
- **The `view.spec.ts` header** the plan lists among the four to cut was already at eight lines
  and is untouched; `schedule.ts`, `transport/index.ts` and `tune/idle.ts` likewise.
- **"the seven routes' headers … `dev/skeleton/+page.svelte`'s `open` at 142 lines is a dev probe"**:
  the tree's `open` is 142 lines and stays whole, as the plan said; the plan's "three routes over
  980 lines" are `my-configs` 1,361, `[draftId]` 1,177 and `[id]` 984 before, 1,274 / 1,068 / 840
  after.

### The gate holes, as observed (13.2-PLAN-CHECK H-1, H-4, H-5, H-6)

- **H-1, the Tailwind utilities layer is a function of the comment vocabulary.** `src/app.css:1` is
  `@import "tailwindcss" source(".")`, so every token in every file under `src/` - comments and
  specs included - that spells a utility emits a rule. The gate's CSS term is therefore the SCOPED
  hash (`css-terms.mjs`, the `@layer properties` and `@layer utilities` blocks removed
  brace-balanced) plus the utilities list with its markup-named subset asserted intact; the raw
  hash is recorded and moved once (`row-0`). **The scoped hash is still not fully independent of
  the vocabulary (13.2-05 deviation 2, deferred row 1):** Tailwind emits one top-level `@property
--tw-<name>` rule per utility family in use, OUTSIDE both layers, so a utility carrying one
  (`ease-out` -> `--tw-ease`; `sepia`, `invert`, `blur`, `ordinal`, `tabular-nums`, `ring-*`,
  `shadow`, `backdrop-filter`, `transform`, `border`, `outline`) whose only source is a comment
  moves the scoped hash when the comment goes. 05 kept the words where they were still a fact; 06
  cut no such sole source (the build after each of its tasks printed `44 -> 44, 0 disappeared, 0
appeared` and the raw hash `174411ee…` unmoved). The classes that left across the phase, by name:
  **`row-0`** (13.2-01, `calibration.ts:31`'s old comment). 45 -> 44 -> 44 -> 44 -> 44 -> 44 -> 44.
  The fix that removes the hole - `source(none)` plus `@source "./**/*.svelte"` and `@source
"./app.html"` in `app.css` - is a visible one-time CSS delta and is 13.2-CONTEXT question 7, not
  this phase's.
- **H-4, test titles.** Held by count (`check-counts.mjs`) before 13.2-01 and by the sorted-titles
  hash (`b53f2d9c…`, vitest JSON plus `playwright --list`) from 01's `--before` on, equal on every
  record.
- **H-5, the normalised built JS.** Recorded on every plan; asserted equal on 03 and 05; the four
  moves attributed above (01, 02's normaliser, 04, 06), the last by counter-build.
- **H-6, the census's blind spots.** The instrument's own defect (the `<style>` order) is fixed;
  what the census still does not see, by design, is rule-only ("the template untouched", proved on
  05 by `svelte/compiler` line for line and on the routes by the stripped-source equality and the
  gate's JS): backtick literals in markup (six, three of them user-facing in
  `RegionInspector.svelte`), text nodes that mix prose with `{expr}` (thirteen, e.g.
  `BrowseToolbar.svelte`'s `Showing {showing} of {total} configurations.`), and the four
  `data-testid={expr}` attributes. `PadUserCode` is uncovered and unused; the stamp codec is the
  sweep's (`stamp-roundtrip.sweep.spec.ts`, 44,078 + 234,784 round trips).
- **The `<!-- -->` node count** (05): a readability edit keeps the NUMBER of template comment nodes
  between two siblings; merging two moved the JS by one whitespace character in `nodes/0`.
- **The `dev/<probe>` scan** (`config-shape.spec.ts:304-320`, 13.2-PLAN-CHECK's note on 06): every
  file under `src/routes/` is scanned RAW for the seven probe directories, only a probe's own
  directory exempt; 06's route headers describe the siblings ("the install probe", "the fidelity
  probe") and spell none.
- **The rule-only refuse items**: "no route gains or loses an import" (the `from` shapes
  `config-shape.spec.ts` scans on the skeleton page `:251` and the front door `:267`, `:333` are
  code, stripped, and green), the seven `localStorage` guards kept in place (D-15; `intro.spec.ts`
  pins the front door's inline), `{#snippet clear()} <Clear /> {/snippet}` (`shell.spec.ts`), the
  Sandbox header's box arithmetic in `[draftId]/+page.svelte` (13.1 deferred row 12; the measured
  numbers kept in its `<style>` comments), `lazy.spec.ts`'s dynamic-import spelling in `engine.ts`,
  `ready.ts` the one module naming the VM package, `transport.ts` naming no engine, and no comment
  under `src/lib/**/*.ts` spelling an erase, clear or page class outside `descriptors.ts`
  (`forbidden-instructions.spec.ts` scans comments; 06 grepped before each commit).

### The requirement rows, the ROADMAP row and the checkpoint

**No requirement row moved and none was claimed**: every plan's `requirements` frontmatter is `[]`
(a refactor claims nothing), `requirements mark-complete` was not run, and `.planning/REQUIREMENTS.md`
and `.planning/ROADMAP.md` are unedited across the phase (`git diff --quiet` exits 0). **CAT-04
stays `[ ]` - the ninth decline in a row** (10-06, 10-07, 10-14, 11-16, 12-12, 12.1-09, 13-20,
13.1-08, and this gate): PROVED, the catalog is still a static set of TypeScript modules with no
backend, 26 = 8 + 18 at every one of the six plans, no entry string moved (the wire set); NOT
PROVED, its subject, the SHAPE of the data file, which no plan of this phase touched or claimed.

The ROADMAP row, for whoever updates it: **Phase 13.2 Readability - 6 plans, 6 of 6 landed, the
gate landed at `4b1f6e7` on 2026-09-14, the checkpoint (13.2-06 task 04, three files read by the
user) PENDING; not complete until the user answers; no requirement claimed.** The checkpoint asks
the user to name any three files under `src/` (the per-file table above is the menu; the largest
cuts - `install.svelte.ts` 490 comment lines gone, `entries/lumen.ts` 472, `entries/morph.ts` 350,
`entries/wheels.ts` 323, `library.ts` 308, `tune/model.ts` 282, `TuningRegion.svelte` 278,
`entries/radar-points.ts` 276, `sim/lua-host.ts` 274, `session.svelte.ts` 267, `sim/host.ts` 253 -
are the best sample), open each at HEAD beside `git show 500e33c:<path>`, and say whether the HEAD
form reads better and whether anything they relied on in the old comments is now missing (it is in
the plan SUMMARY that moved it, and in `docs/entries/` for an entry). Saying "approved" records the
phase as gate landed and reviewed; it ticks no requirement and edits no ROADMAP line. The six
questions 13.2-CONTEXT could not decide stand for the user: `placeInWords`, `DISCARD_LABEL`, the
`localStorage` guards, `ColourPicker.svelte:66`'s stale line, the public "keep" API, and
`buildTuner`'s helpers (plus the seventh, Tailwind's scanner reach).

## 2026-09-16 change 1 - Apply to ZONA goes; every Store clears first

Outside the GSD cycle, the user's word recorded verbatim in `BENCH-2026-09-16.txt` section 1: "we
dont need the apply to ZONA, only Store stays. also every Store should send a Clear before Storing."
Three commits: the store, the copy, the zone and the node specs (`58eb603`); the e2e re-aims
(`b43b0b0`); this section, the runbook's row O and label-map line, the record's Done paragraph and
the gate records.

**The frame sequence per Store click, as observed on the fake** (`install.spec.ts` "a Store returns
the page to its firmware default, writes the configuration, stores it, and kept is said after the
acknowledgement, a heartbeat and a matching re-fetch - eighteen frames, one click"): five
`CONFIG/EXECUTE` carrying the five firmware defaults verbatim in SLOTS order (255/6, 255/0, 255/4,
0/6, 0/0), one `HEARTBEAT/EXECUTE` (the RAM leg's restore, `sequence.ts`), five `CONFIG/EXECUTE`
carrying the configuration's five (the system slots substituted through `#systemStringOr`), one
`HEARTBEAT/EXECUTE` (the second leg's restore), one `PAGESTORE/EXECUTE`, five `CONFIG/FETCH` (the
D-12 proof, after the module's heartbeat) - **EIGHTEEN frames and eighteen steps**, not the
brief's seventeen: every RAM leg restores `page_change_enabled` in its `finally`, so a click of two
RAM legs carries two restore heartbeats. By class: 10 `CONFIG/EXECUTE`, 2 `HEARTBEAT/EXECUTE`,
1 `PAGESTORE/EXECUTE`, 5 `CONFIG/FETCH` (10 with the snapshot's). The header lock closes over each
of the three legs (`[true, false, true, false, true, false]`), a gap no browser poll sees. On the
shim (`e2e/install.e2e.ts`) the same click reads ten `CONFIG/EXECUTE` and one `PAGESTORE/EXECUTE`;
KEPT after 1-2 heartbeats on the real page, 4-5 through the Clear walk's held acknowledgements.

**The store.** `keepOnDevice(config, name)` takes the configuration directly; `armed` is Store's
readiness (a queue, a writable phase or `snapshot-failed` - the click re-reads first - the page
target at rest, a pair inside 908; `#storeRefusal` over `#tryRefusal`); `keepReason` is three rows

- `no-session`, `already-kept` (kept and the module holds the pair on screen, the old `armed`
  predicate as `#holdsConfig`), `incapable` - and reads `phase` first so a `$derived` over it tracks
  the queue's arrival (the first two c1 runs were red on that: `no-session` stuck in the probe's
  readout and the zone's line). The whole click is one action `keep` and one capture (`#ramLeg`'s
  `keepSteps`, the classifier's `from`). A RAM leg publishes `writing` before any await, so the zone's
  focus rule reads a disabled control in the click's flush (test 8 was red on an enabled one that
  disabled a tick later). `tryOnDevice` stays for the probe; `settled` stays in the union by name.

**The zone.** Target · Store on ZONA; `store-honesty` (the description: `HONESTY_INCAPABLE`,
`HONESTY_SNAPSHOTTING`, `keepLineEnabled(page)`, `NEEDS_ZONA`) and `store-refusal`; the confirmation
in Store's place hands the store the same config and name. Store is bordered as it was (nothing took
Apply's fill - question for the user). The bar's `writing` clause is `keepingLabel`.

**Counts, carried + delta.** Quick **94 / 966 (+1 todo)**, `+0 / +0` - every change a rewrite or a
retitle inside an existing title, no title added or deleted; check **655 / 0 / 0** (`+0`); lint
clean; e2e **86 titles / 101 runs** (`+0 / +0`). Chunks on fresh detached servers
(`scripts/gate/e2e-chunks.sh`, stopped through PowerShell, HTTP 000 after each): c1 **32 passed**
(third run; runs one and two red on the two fixes named above, both in the feat commit), c3 **21**,
c4 **15**, c5 **11**, c2 **22** on the fourth run at `--workers 1` - runs one to three red only on
`browse:299` / `browse:343`, the known hydration races (`git diff` on the browse files empty). Run
one of c1 also lost the wrangler dev server mid-chunk ("Error inside ProxyWorker: Network connection
lost", tests 5-18 `ERR_CONNECTION_REFUSED`) while the failing tests tore pages down; not seen again.

**Retitled tests, old -> new** (no test deleted; the count term is `+0`):

- `install-copy.spec.ts`: "the closed sets: six reasons, three more, thirteen utterances, and titles
  that end without a full stop" -> "the closed sets: three reasons, three more, …".
- `install.spec.ts`: "nothing is written without a click, and TRY ON DEVICE writes exactly five, the
  system timer first and the utility third, verbatim" -> "nothing is written without a click, armed
  means Store may write, and the probe's TRY ON DEVICE writes exactly five, …"; "kept is said after
  the store acknowledgement, a heartbeat, and a matching re-fetch" -> "a Store returns the page to its
  firmware default, writes the configuration, stores it, and kept is said after the acknowledgement,
  a heartbeat and a matching re-fetch - eighteen frames, one click"; "a store that never acknowledges
  is unconfirmed, and KEEP ON DEVICE stays live" -> "… and Store on ZONA stays live"; "one landed
  script is partial, and it names what landed" -> "… - on the probe's TRY and on a Store's second
  leg, whose classifier reads that leg alone"; "flash only what you have heard - the confirmation
  closes on a knob move and a session drop, …" -> "… the confirmation stays open on a change inside
  the budget, closes when the pair is withdrawn and on a session drop, …"; "a partial names which of
  the five landed, and the partial that cannot happen does not" -> "a partial names which of the five
  landed on a Store's second leg, …"; "over budget refuses before the wire: a surface over 908
  disables Apply, names the cause, and sends zero frames" -> "… disables Store, …".
- `device-ui.spec.ts`: "the destination zone: one component for both routes - Target, Apply described
  by the honesty line, Store or its confirmation in the same place, …; no Put back; …" -> "… Target,
  Store described by the honesty line or its confirmation in the same place, …; no Apply, no Put
  back; …".
- `e2e/install.e2e.ts`: "KEEP ON DEVICE is kept only after the read-back matches, and a mismatch is
  named" -> "KEEP ON DEVICE returns the page to its default, writes the pair, and is kept only after
  the read-back matches; a mismatch is named"; "the panel writes on a click, says PLAYING NOW, and
  locks the header while it writes" -> "the bar writes on a click - the page's default, the
  configuration, the store - says storing, and locks the header while it writes"; "after a store, a
  second store waits for another apply" -> "… waits for a change"; "the destination menu … Apply
  waits for the module's own report, …" -> "… Store waits for the module's own report, …".
- `e2e/sandbox.e2e.ts`: "the whole loop on a fake: … applied to the fake ZONA as five acknowledged
  writes with 255/4 among them, and the store refused" -> "… stored on the fake ZONA - the five
  defaults, five acknowledged writes with 255/4 among them, the store proved - after the
  confirmation was first refused".
- `e2e/tuning.e2e.ts`: "an over-budget configuration shows the refusal line and disables Apply" ->
  "… disables Store".

**The gate** (`bash scripts/13.2-gate.sh --before change-1` at `f304891`, `--after change-1
--against change-1 --check 655` at `b43b0b0`; `gate/change-1.txt` and `gate/change-1-after.txt`).
The script exits 1 at its first inequality - the census, by design of a behaviour change - so the
terms after it are compared here from the two records. **Equal:** the wire set
`a24b256f…`, the wire full `514cb2c7…`, the sandbox set `40b44316…` (the script's own
comparison); the fixtures' four hash-objects and the OG (26 files, 154136 B, `2a9ccf80…`); the
utilities 44 -> 44 with the five markup-named intact; check 655 / 0 / 0; lint; quick; build; the
name-status of `src/` 18 modified, 0 added, 0 deleted, 0 renamed; the refuse-list `--stat` empty.
**Moved, as a behaviour change moves them:** the literal census `6ac1cdf3…` -> `b807b2bf…`
(2728 -> 2713 distinct literals; the `-/+` lines in the after record name every one - the retired
strings and the four `KEEP_REASONS` keys out, the five new strings and `no reason` in, `try`
9 -> 2, `store` 8 -> 13, `keep` 2 -> 6), the copy exports `10fad002…` -> `1ad9d1df…` (five exports
left: `TRY_ON_LABEL`, `writingLabel`, `HONESTY_NO_SESSION`, `honestyReady`, `APPLY_LABEL`; none
joined), the `data-testid` set `21fc9eb9…` -> `2200a0d8…` (320 -> 319: `apply-to-zona`,
`apply-honesty`, `apply-refusal` out; `store-honesty`, `store-refusal` in), the titles
`b53f2d9c…` -> `3ad0c892…` (the retitles above, 967 vitest and 101 playwright either side), the
normalised JS `07f50f2a…` -> `e3350ea7…`. **And one term the brief asked to hold that a control's
departure cannot: the SCOPED CSS** `e296d0af…` -> `e8841c5f…`. Proved by compiling
`DestinationZone.svelte` at `f304891` and at HEAD with `svelte/compiler` under one filename: the
diff is exactly the two rules `.destination-apply` and `.destination-apply:disabled` gone, every
other selector and its scope hash unchanged; `KeepConfirm.svelte`'s compiled CSS is byte-identical.
The raw CSS moved with it (`174411ee…` -> `b542d9e3…`). Comment lines: 8 files moved, 12490 ->
12575 comment lines, 3830 -> 3847 header lines (`comment-lines.mjs --todo` prints nothing new).

**Outside `src/`:** `scripts/local/README.md`'s two install lines are one (Store's); the runbook's
row O and its dated label-map line; `.planning/ROADMAP.md`, `REQUIREMENTS.md` and `STATE.md`
untouched - SAFE-02 and SAFE-05's RAM-before-flash wording and PROJECT.md's "flash writes stay
separate from RAM auditions" are the next gate's to amend, named in the record. No device, no
deploy; `src/vendor/`, `library.ts`, `sequence.ts`, the Lua literals, the manifest, the fixtures,
the OG, `Knob.svelte`, `ColourPicker.svelte` untouched (the gate's `--stat`).

## 2026-09-16 change 2 - Store on ZONA stores on one click; the confirmation goes

Outside the GSD cycle, the user's word recorded verbatim in `BENCH-2026-09-16.txt` section 2: "no
opting when pressing ZONA, nothing opens down under storing, it just stores it with one click."
Three source commits, then this section: the store, the copy, the zone, the deleted component, the
route, the probe and the node specs (`8e211d0`); the e2e re-aims (`459deed`); the focus rule
re-aimed at the one click (`ad3f72e`, below); then this section, the runbook's dated label-map
line, the record's Done paragraph and the gate records `gate/change-2.*` / `gate/change-2-after.*`.

**The store.** `keepOnDevice(config, name)` runs from Store on ZONA's click. Its guard is
`if (!this.armed) return; if (this.keepReason(this.#capable()) !== undefined) return;` - the
refusal `openConfirm()` used to make, moved into the write itself, so a click while disarmed
(measuring, over 908, a leg or the snapshot in flight, the page target not at rest) or while the
record names a reason (`no-session`, `already-kept`, `incapable`) writes nothing and moves no
phase. `confirmOpen`, `openConfirm()` and `dismissConfirm()` are gone, with the three branches
that closed the confirmation (the detach, `observeConfig`'s disable-closes-it rule, `requestPage`'s
close-on-request - which now returns the target's answer straight). Nothing about the write moved:
the same three legs, one action `keep`, one capture, eighteen frames on the fake.

**The zone.** Target · Store on ZONA, a plain `<button type="button">` whose `onclick` is
`store()` -> `install.keepOnDevice(config, name)`; `KeepConfirm.svelte` is deleted and nothing
mounts it; `store-honesty` is still Store's sr-only description and reads `keepLineEnabled(page)`
while connected - `Returns Page N to its firmware default, then writes this and stores it, so it
stays after power-off.` - which already said the one click, so no new sentence was written;
`store-on-zona-line` and `store-refusal` as before. The `.confirm` rule and the `tick` import left
with the block. **The focus rule moved, not left.** The brief read 13.1-07's rule (focus after a
confirmation leaves) as moot, and its trigger is; but the first shim run of the rewritten test 8
logged `focus after the click sits on BODY` - Store disables in the click's flush and Chromium's
focus fixup drops a disabled button's focus on the body, which is exactly the keyboard regression
13.1-07 fixed under Rule 2. The rule is re-aimed at the click (`ad3f72e`): `store()` reads whether
Store held focus, calls the write, and - because the store publishes `writing` before its first
await - focuses the zone (`tabindex="-1"` back on the root) when the write started under focus.
Synchronous on purpose: a `$effect` over `writing` ran after the browser had moved focus and was
red on the shim. From `snapshot-failed` the click awaits the re-read first, so that path's focus
is not held - named, not fixed.

**Copy.** Retired by name in `install-copy.ts`'s ledger ("THE STORE CONFIRMATION'S STRINGS ARE
RETIRED BY NAME, 2026-09-16"): `NOT_NOW_LABEL` (`Not now`), `confirmCaption` (`Store this on ZONA
· Page N?`), `confirmReplaces` (the one string that named the touch element), `CONFIRM_WAY_BACK`
(`Clear still returns the page to its firmware default.`), `confirmRig` and its formatter
`moduleList` (SAFE-06's rig sentence, with no home once the confirmation left). `KEEP_LABEL` stays.
`WRITE_CLICKS` is unchanged at three - the affirmative was never a click in the list (verified:
`[KEEP_LABEL, CLEAR_LABEL, TARGET_CLICK]` before and after). No new sentence.

**Elsewhere in `src/`.** `/playground/[id]/+page.svelte`: the window `keydown` handler existed to
close the confirmation on Escape (and to do nothing mid-write); with nothing to close it did
nothing, so the handler and its `addEventListener` / `removeEventListener` pair are gone -
"Escape is ignored while writing" still holds (the e2e asserts it) because nothing listens.
`/dev/install/+page.svelte`: one `Keep on device` button (`install-keep` -> `keepOnDevice(pair(),
NAME)`); `install-keep-yes`, `install-keep-no` and the `confirm open` readout are gone; the probe
works. `device-clause.ts`: a comment that pointed at `KeepConfirm.svelte` for Z-01 names Z-01.
`instrument.spec.ts`: the two hand-list rows KeepConfirm carried (PILLED `secondary`, QUIET
`quiet-control`) and its name in the index-form walk leave, each with a dated line.

**Counts, carried + delta.** Quick **94 / 966 (+1 todo)**, `+0 / +0` - no vitest test deleted:
`device-ui.spec.ts` has no standalone KeepConfirm test to delete (the brief's "test 8" is the zone
test, the eighth `it` in the file, which held the confirmation's no-trap assertions - `role="group"`,
no dialog - and is retitled below with those assertions replaced by their absence); check **654 / 0
/ 0** (`-1`: `KeepConfirm.svelte`); lint clean; e2e **86 titles / 101 runs** (`+0 / +0` - test 8
replaced under a new title, one out and one in). Chunks on fresh detached servers
(`scripts/gate/e2e-chunks.sh`, stopped through PowerShell, HTTP 000 after each): c1 **32 passed**
(first run at `ad3f72e`; the file alone ran twice before that commit - red once on the `$effect`
form of the focus rule, green on the handler form), c2 **22** on the third run at `--workers 1`
(run one red on `browse:343`, run two on `browse:299` / `:343` / `:1186` / `:1404` - the known
hydration races plus one more of the same shape at `:1186`; `git diff 93ddc6b HEAD` over the browse
files and `src/lib/browse` is empty), c3 **21**, c4 **15**, c5 **11**.

**Retitled tests, old -> new** (no test deleted; the count term is `+0`):

- `install.spec.ts`: "on a rig the store is allowed, resolves once, and the confirmation names the
  others" -> "on a rig the store is allowed and resolves once"; "flash only what you have heard -
  the confirmation stays open on a change inside the budget, closes when the pair is withdrawn and
  on a session drop, a page change re-snapshots, …" -> "flash only what you have heard - Store stays
  armed on a change inside the budget, disarms when the pair is withdrawn and on a session drop, a
  refused click writes nothing, a page change re-snapshots, …". Every other confirm-then-affirm
  walk in the file (the `storedOn` helper, the eighteen-frames title, the three retry-bound titles,
  the partial titles, the surface-vs-entry title, the over-budget titles) is one call now under its
  old title; the two places that forced `confirmOpen = true` to reach the store's own refusal force
  `armed = true` alone.
- `install-copy.spec.ts`: "the formatters: moduleList, confirmRig, nothingLandedBlock and lostBlock"
  -> "the formatters: nothingLandedBlock and lostBlock". Test 2 gains the six retired names
  (`RETIRED_CONFIRMATION`, assembled) and the record's section-2 heading; the em-dash positive of
  test 5 becomes the negative (no typewriter `--`) because the one em dash was the confirmation's
  sentence; the label count is four; the Clear-strings scan is ten.
- `device-ui.spec.ts`: "the destination zone: one component for both routes - Target, Store
  described by the honesty line or its confirmation in the same place, …; no Apply, no Put back; a
  group that is not a dialog" -> "… Target, Store described by the honesty line and stored on one
  click with nothing opening in its place, …; no Apply, no Put back, no confirmation; nothing that
  is a dialog". `INSTALL_LEAVES` is one; the tells are two ("Setup and Timer" identified no
  sentence once `confirmReplaces` left).
- `e2e/install.e2e.ts`: "the flash confirmation replaces the control, names what it replaces, and
  moves focus deliberately" -> "Store on ZONA is one click: nothing opens in its place, the click is
  the whole write, and on a rig the click stores too" (the body is new: no dialog, nothing modal, no
  block, Tab from the select reaches Store, Enter is the write, the zone holds focus, 10
  `CONFIG/EXECUTE` and 1 `PAGESTORE/EXECUTE`; on the rig the click stores - 1 `PAGESTORE/EXECUTE`
  answered by three modules, resolved once - where it used to read the fourth sentence and refuse).
  "after a store, a second store waits for a change" keeps its title and loses the open-then-knob-
  back walk.
- `e2e/sandbox.e2e.ts`: "… stored on the fake ZONA - … - after the confirmation was first refused"
  -> "… stored on the fake ZONA on one click - … - with nothing opening first".

**The gate** (`bash scripts/13.2-gate.sh --before change-2` at `93ddc6b`, `--after change-2
--against change-2 --check 654` at `ad3f72e`; `gate/change-2.txt` and `gate/change-2-after.txt`).
The script exits 1 at its first inequality - the census, by design of a behaviour change - so the
terms after it are compared here from the two records. **Equal:** the wire set `a24b256f…`, the
wire full `514cb2c7…`, the sandbox set `40b44316…` (the script's own comparison); the fixtures'
four hash-objects and the OG (26 files, 154136 B, `2a9ccf80…`); the utilities 44 -> 44 with the
five markup-named intact; lint; quick 94 / 966; the build; the refuse-list `--stat` empty.
**Moved, as a behaviour change moves them:** check 655 -> 654 (the deleted component); the literal
census `b807b2bf…` -> `e27b7442…` (2713 -> 2690 distinct literals, 192 -> 191 files; out - `Store
this on ZONA · ${}?`, `This returns ${} to its firmware default, then writes this configuration — …
— and stores it, so it stays after power-off.`, `${} still returns the page to its firmware
default.`, `Your ${} is on the same cable. …`, `Your ${} are on the same cable. …`, `${} and ${}`,
`Not now` (2 -> 0), `Keep, yes`, `confirm open`, the ids `${}-caption` / `${}-replaces` /
`${}-way-back` / `${}-rig`, the classes `confirm`, `quiet-control`, `secondary pill`, `body quiet`
4 -> 2, the testids named below; counts moved - `button` 97 -> 93, `Escape` 10 -> 8, `keydown`
4 -> 2, `group` 7 -> 6, `module` 2 -> 1, `body` 14 -> 13, `caption` 6 -> 5, `actions` 6 -> 5,
`, ` 7 -> 6, `${} ${} ${}` 4 -> 3; nothing in), the copy exports `1ad9d1df…` -> `18e53279…`
(six left: `NOT_NOW_LABEL`, `confirmCaption`, `confirmReplaces`, `CONFIRM_WAY_BACK`, `confirmRig`,
`moduleList`; none joined), the `data-testid` set `2200a0d8…` -> `cebf17b5…` (319 -> 312:
`keep-confirm`, `keep-confirm-yes`, `keep-confirm-no`, `store-confirm`, `install-confirm`,
`install-keep-yes`, `install-keep-no` out; none in), the titles `3ad0c892…` -> `61c1f546…` (the
retitles above; 967 vitest and 101 playwright either side), the normalised JS `e3350ea7…` ->
`23e3bfa5…`, the name-status of `src/` 10 modified / 0 added / **1 deleted** (`KeepConfirm.svelte`,
by `git rm`) / 0 renamed. **And the SCOPED CSS** `e8841c5f…` -> `661eab32…`, as a `.svelte` file
leaving must move it: `KeepConfirm.svelte`'s whole stylesheet is gone, and `DestinationZone.svelte`
compiled at `93ddc6b` and at HEAD with `svelte/compiler` under one filename differs by exactly one
rule - `.confirm.svelte-6l3wua { min-inline-size: 0; }` gone - with the scope hash `svelte-6l3wua`
and every other selector unchanged (and one comment reworded, which Vite strips). The raw CSS moved
with it (`b542d9e3…` -> `fc20dd55…`). Comment lines: 7 files moved (one gone), 12575 -> 12531
comment lines, 3847 -> 3846 header lines; `comment-lines.mjs --todo` prints nothing new. One
gate-shape note: the first `--after` run's quick term read the build the tree had before this
change (the script runs the quick suite before it builds, and `radius.spec.ts` layer B refuses a
stale build by design), so the record was rerun on the fresh build and reads 94 / 966; the second
rerun is the one at `ad3f72e`.

**Outside `src/`:** the runbook's dated label-map line ("no confirmation on Store since
2026-09-16"); `.planning/ROADMAP.md`, `REQUIREMENTS.md` and `STATE.md` untouched - SAFE-05 ("the
only confirmation on the site", its sentence and its shape) and SAFE-06 (the confirmation naming the
other modules) are retired by the user's word and are the next gate's to amend, with SAFE-02 and
PROJECT.md's line from change 1; CAT-04 stays `[ ]`. No device, no deploy; `src/vendor/`,
`library.ts`, `sequence.ts`, the Lua literals, the manifest, the fixtures, the OG, `Knob.svelte`,
`ColourPicker.svelte` untouched (the gate's `--stat`).

## 2026-09-16 change 3 - the "Your ZONA didn't confirm the store" block goes; the read-back decides

Outside the GSD cycle, the user's word recorded verbatim in `BENCH-2026-09-16.txt` section 3, under
a screenshot of a Store that worked on the bench and showed the `unconfirmed` block: "remove this,
this is not a true bug report, it works fine." Three source commits, then this section: the store,
the copy, the zone, the clause, the probe's comment and the four node specs (`42892f8`); the e2e
re-aim (`15dcdff`); the clause's header back at ten lines (`1e78f4b`); then this section, the
runbook's dated label-map line, the record's Done paragraph and the gate records `gate/change-3.*` /
`gate/change-3-after.*`.

**What the firmware says about the acknowledgement** (`../grid-fw/common/src/c/grid_decode.c`,
read only). `grid_decode_pagestore_to_ui` (`:962-1000`) handles `PAGESTORE/EXECUTE` by starting the
bulk store with `grid_protocol_nvm_store_success_callback` as its completion callback (`:975-983`);
if a bulk operation is already in progress the frame is dropped with `return 1` and NO reply of any
kind - no ACK, no NACK (`:979-981`). The `PAGESTORE/ACKNOWLEDGE` is built and broadcast ONLY inside
that success callback (`:939-960`), i.e. once the NVM write has finished, with `LASTHEADER` echoing
the request id and the debug text `nvm store success`; the callback then starts a page reload
(`grid_ui_bulk_page_load`, `:958`) - itself a bulk operation, so a second `PAGESTORE/EXECUTE`
arriving during it is dropped silently, and a `CONFIG/FETCH` during it is NACKed
(`grid_ui_event_recall_configuration` returns "nvm busy", `grid_ui.c:466-469`, answered at
`grid_decode.c:1318-1333` with a NACK and then a REPORT). There is no failure callback that sends a
`PAGESTORE/NACKNOWLEDGE`. So the acknowledgement is conditional on the module being idle when the
frame arrives and on the write finishing inside HANGAR's 3000 ms bound, and it is matched by
request id per attempt - an ACK for attempt 1 that arrives after attempt 1's deadline matches
nothing (attempt 2 minted a new id), and attempts 2 and 3 arrive during the reload the store itself
started and are dropped. That is one full explanation of the screenshot with the store genuinely
in flash; it is not verified on hardware here (no device).

**The store.** `#storeLeg` no longer treats the request's outcome as the leg's: `q.request(storePage())`
runs to its bound as before (three attempts at `pagestoreMs` 3000, `retryBackoffMs` between - about
9.4 s when nothing answers) and its timeout - or a refusal firmware never sends - is caught and
falls through; only `AbortedError` (the link died) is rethrown and lands `lost`. Then the leg does
what it always did after an acknowledgement: `#nextHeartbeat()`, then up to `REFETCH_ROUNDS` (3)
rounds of `fetchAll`. A round whose fetch is unanswered or refused (a fetch during the reload is
NACKed) is caught and skipped for the next round; `refetchRounds` still counts it. **The sub-cases:**
(A) acknowledged, read-back matches - `kept` (unchanged); (B) acknowledged, every completed round
reads back different bytes - `kept-mismatch` (unchanged); (C) acknowledgement late or missing,
read-back matches - `kept` (was `unconfirmed`); (D) acknowledgement late or missing, every completed
round reads back different bytes - `kept-mismatch` (was `unconfirmed`); (E) acknowledged or not, no
round completed at all (every round's fetch unanswered or refused inside its bound) - `kept`, by the
user's word, the comment in `#storeLeg` naming this change and `grid_decode.c:939-960` / `:979-981`
(was `unconfirmed`). `StoreOutcome` is `"kept" | "mismatch" | false`. `clearToDefault()` runs the same
leg: (A)/(C)/(E) land `cleared` with `storedThisSession` set and no `name` (nothing of the visitor's
is on the module - `FIRMWARE_DEFAULT_NAME` had no other reader and left); (B)/(D) land
`kept-mismatch`. `keepOnDevice()`: (A)/(C)/(E) `kept`, (B)/(D) `kept-mismatch`. `putBack()` (the
probe's) keeps `restored-unconfirmed` for a read-back that never matches (its cause is `mismatch`
now - the leg has no timeout outcome to hand it) and `revertToStored()` (the discard) still lands it
on its own request's timeout or NACK, so the phase and its block stay by name.

**Phases.** `unconfirmed` LEFT the fifteen-phase union: nothing lands it - the keep's and the clear's
store legs land `kept` / `cleared` / `kept-mismatch`, the put-back's lands `restored` /
`restored-unconfirmed`. The union is fourteen, `WRITABLE_PHASES` is 13-12's list less one,
`UNCERTAIN_PHASES` is three, the zone's phase-to-builder mapping is six cases, the bar's clause and
tone lose their case. The anti-collapse test (`device-ui.spec.ts`) reads fourteen phases, six
failure-shaped, three uncertain bodies and three uncertain clauses pairwise distinct, and asserts
`unconfirmed` absent from the union - its comment names the retirement as the user's ("13-18 kept
six uncertain outcomes on purpose ... retired BY THE USER'S WORD ... a deliberate retirement of one,
not a collapse into a neighbour").

**Copy.** Retired by name in `install-copy.ts`'s ledger ("THE UNCONFIRMED STORE'S STRINGS ARE
RETIRED BY NAME, 2026-09-16"): `UNCONFIRMED_TITLE` (`Your ZONA didn’t confirm the store`),
`unconfirmedBlock` (its detail and its two steps; `stepOrClear` stays, shared), `FIRMWARE_DEFAULT_NAME`
(`The firmware default`). **One string rewritten** beyond the brief: `keptMismatchBlock.detail` said
`Your ZONA acknowledged the store, but reading Page N back gave something different.` - false in
sub-case (D), which this change creates - and reads `Reading Page N back after the store gave
something different. HANGAR won’t call that stored.` now, recorded verbatim in the bench file's
section 3 with the old form struck (the copy spec reads that file as a document and pins both).
Kept by name: `restoredUnconfirmedBlock`, `RESTORED_UNCONFIRMED_TITLE` (the probe's put-back and the
discard). `keptCaption`'s and `clearedCaption`'s comments no longer say "after the acknowledgement".

**Elsewhere in `src/`.** `DestinationZone.svelte`: the `unconfirmed` case and the `shownName`
derived (its one reader) leave; no `<style>` rule and no template comment node moves, so the scoped
CSS is byte-equal (below). `device-clause.ts`: the case in both switches, the import, the header at
ten lines (the first cut spent an eleventh on the date; `1e78f4b`). `/dev/install/+page.svelte`: the
`NAME` comment no longer names the unconfirmed sentence. `install.svelte.ts`: `#armSlow`'s comment no
longer says "only the timeout says failed".

**Counts, carried + delta.** Quick **94 / 966 (+1 todo)**, `+0 / +0` - no vitest test added or
deleted: the brief's two titles ("a late acknowledgement lands kept when the read-back matches";
"different bytes land kept-mismatch") are one retitled test and the second part of another (below),
because the acknowledged-and-different case already had "a read-back that never matches is
kept-mismatch after three rounds"; check **654 / 0 / 0** (`+0`); lint clean; e2e **86 titles / 101
runs** (`+0 / +0`, one title re-aimed under a new name). Chunks on fresh detached servers
(`scripts/gate/e2e-chunks.sh`, stopped through PowerShell, HTTP 000 after each; `install.e2e.ts`
alone ran first, 16 passed, the re-aimed title at 36 heartbeats per leg): c1 **32 passed** (first
run; `install.e2e.ts:1957`, A.21's CLEAR title, green on both engines at 4 and 5 heartbeats - this
change does not touch its CONFIG acknowledgements and it did not flake), c2 **22** = 21 in the chunk
at `--workers 1` on runs one and two (run one at `--workers 3` red on `browse:299` / `:343` /
`:1404`, runs two and three at `--workers 1` red on `:343` alone - the known hydration race,
`toHaveCount(5)` received 26; `git diff 227aba1 HEAD` over the browse files is empty) plus `:343`
**1 passed** alone on a fresh server (the resolution 13.2-06 recorded), c3 **21**, c4 **15**, c5 **11**
on its second run (the first run's one red was `artifacts.e2e.ts:63`, the source-archive stamp
against a HEAD that had moved under the two source commits made after the build - a harness fact,
not a change fact; green on the gate's fresh build at `1e78f4b`).

**Retitled tests, old -> new** (no test deleted; the count term is `+0`):

- `install.spec.ts`: "a store that never acknowledges is unconfirmed, and Store on ZONA stays live"
  -> "a late acknowledgement lands kept when the read-back matches" (the same dropped-ACK fault;
  `fedAt` defined, the store step `timeout 3` followed by the five `refetch-* ok`, `kept`, cause
  none, `already-kept`, the fake's flash read); "a clear whose store never acknowledges is
  unconfirmed with the firmware default named, Store on ZONA reads never-tried, and the RAM leg alone
  never stores" -> "a clear whose store never acknowledges is cleared once the read-back matches,
  different bytes land kept-mismatch, and a read-back that never answers is cleared by the user's
  word" (three parts: sub-case (C) `cleared`; sub-case (D) `kept-mismatch` after three rounds under
  the same dropped ACKs with the lying Setup read-back; sub-case (E) - every fetch after the store
  unanswered, three `refetch-system-timer timeout` rounds - `cleared`); "after a keep, PUT BACK
  stores too; when its store never confirms, it is restored-unconfirmed" -> "after a keep, PUT BACK
  stores too; when its read-back never matches, it is restored-unconfirmed" (part two drops the
  put-back's three ACKs AND lies on the read-back: `restored-unconfirmed`, cause `mismatch`, fifteen
  re-fetch steps); "no snapshot, no clear - and the fifteen-row enablement table" -> "... the
  fourteen-row enablement table"; "CLEAR writes five defaults and PUT BACK five originals in SLOTS
  order, the classifier reads the first, the third and the fourth write, and the phase list is
  13-12's" -> "... and the phase list is 13-12's less the store's unconfirmed" (the `WRITABLE_PHASES`
  pin loses its `"unconfirmed",` line; the union count is fourteen). `throughStore` feeds the
  heartbeat after a store step that is `ok` OR `timeout`. SAFE-07's classifier titles (the partial
  titles, the CONFIG legs) are untouched.
- `device-ui.spec.ts`: "fifteen phases are each accounted for, the four the spec has no row for are
  present by name, the four uncertain phases keep four distinct bodies and four distinct clauses,
  and the bar takes the draft and the device as two props" -> "fourteen phases ..., the three
  uncertain phases keep three distinct bodies and three distinct clauses, ...".
- `install-copy.spec.ts`: "the closed sets: three reasons, three more, thirteen utterances, and
  titles that end without a full stop" -> "... twelve utterances ..." (six failure builders, six
  titles). Test 2 gains `RETIRED_UNCONFIRMED` (three names, assembled), the record's section-3
  heading, the new detail pinned and the old struck form read; the ledgered-strings list loses
  `FIRMWARE_DEFAULT_NAME` and `unconfirmedBlock.steps[1]`; the recorded-strings list gains
  `keptMismatchBlock.detail`; the named-steps floor is ten in both places (the block's two named
  steps left); the unused `NAME` sample leaves.
- `e2e/install.e2e.ts`: "a store that never confirms, on both the keep and the put-back legs, is said
  out loud" -> "a store whose acknowledgement never comes is proved by the read-back: kept on the
  keep leg, restored on the put-back leg" (`beatUntil(..., "kept", 120)` paces about 9.4 s of
  heartbeats through the bound; 3 `PAGESTORE/EXECUTE`, 15 `CONFIG/EXECUTE`, 10 `CONFIG/FETCH`; the
  put-back lands `restored` with 1 + 3 and 20). The unused `NAME` and `UNCONFIRMED_SPOKEN` leave.

**The census diff, by string** (`hash-strings.mjs --diff`, `gate/change-3-after.txt`): out - `${} is
still running on ${} in memory. No confirmation of the store came back, so HANGAR can’t say whether
it survives power-off.`, `Click ${} to send the store again`, `The firmware default`, `Your ZONA
acknowledged the store, but reading ${} back gave something different. HANGAR won’t call that
stored.`, `Your ZONA didn’t confirm the store`, the key `unconfirmed` (10 -> 0); in - `Reading ${}
back after the store gave something different. HANGAR won’t call that stored.`; counts moved -
`kept` 23 -> 24, `mismatch` 9 -> 6, `timeout` 11 -> 8, `fetchAll` 1 -> 2. 2690 -> 2685 distinct
literals (6287 -> 6269 occurrences), 191 files either side; the testid set UNMOVED at 312
(`cebf17b5…`, no control left); the copy exports `18e53279…` -> `25468f7e…` (two left:
`unconfirmedBlock`, `FIRMWARE_DEFAULT_NAME`; `UNCONFIRMED_TITLE` was never exported; none joined).

**The gate** (`bash scripts/13.2-gate.sh --before change-3` at `227aba1`, `--after change-3
--against change-3 --check 654` at `1e78f4b` - rerun after the header commit, the first `--after`
at `15dcdff` reading the same hashes on every term but the comment-lines table; `gate/change-3.txt`
and `gate/change-3-after.txt`). The script exits 1 at its first inequality - the census, by design
of a behaviour change - so the terms after it are compared here from the two records. **Equal:** the
wire set `a24b256f…`, the wire full `514cb2c7…`, the sandbox set `40b44316…` (the script's own
comparison); the fixtures' four hash-objects and the OG (26 files, 154136 B, `2a9ccf80…`); the
`data-testid` set `cebf17b5…` (312); **the SCOPED CSS `661eab32…`** and the raw CSS `fc20dd55…` -
no component left and no rule moved; the utilities 44 -> 44 with the five markup-named intact; check
654; lint; quick 94 / 966; the build; the refuse-list `--stat` empty. **Moved, as a behaviour change
moves them:** the literal census `e27b7442…` -> `40660d18…` (above), the copy exports (above), the
titles `61c1f546…` -> `5b5a92bb…` (the retitles above; 967 vitest and 101 playwright either side),
the normalised JS `23e3bfa5…` -> `d315d6dc…`, the name-status of `src/` 8 modified / 0 added / 0
deleted / 0 renamed. Comment lines: 4 files moved, 12531 -> 12573 comment lines, 3846 -> 3863
header lines (the ledger entry in `install-copy.ts`, which sits after the copyright line as its own
section); `comment-lines.mjs --todo` prints nothing over the four.

**Outside `src/`:** the runbook's dated label-map line (the block gone; what a Store reports now,
sub-case by sub-case; the firmware lines); `.planning/ROADMAP.md`, `REQUIREMENTS.md` and `STATE.md`
untouched - **SAFE-07's "acknowledged before done" is retired for the store leg by the user's word
and is the next gate's to amend**, with SAFE-05 and SAFE-06 (change 2), SAFE-02 and PROJECT.md's line
(change 1); CAT-04 stays `[ ]`. No device, no deploy; `src/vendor/`, `library.ts`, `sequence.ts`,
`descriptors.ts`, the Lua literals, the manifest, the fixtures, the OG, `Knob.svelte`,
`ColourPicker.svelte`, `synthetic.ts` untouched (the gate's `--stat`; the fake's ACK-drop fault is
the test's `drop` fault over `PAGESTORE/ACKNOWLEDGE` and the shim's `dropAck`, reused as they were).

## 2026-09-17 change 4 - TRACKPAD COMET, the Trackpad's recipe with a comet under the finger

Outside the GSD cycle, the user's word recorded verbatim in `BENCH-2026-09-16.txt` section 4: "make
a variation of the Trackpad where everything stays the same but for the visuals/LED animations we use
a cometlike trail that follows your finger and fades". Three source commits, then this section: the
card and its counts (`3e7e780`), the VM proof (`7e24c78`), the stamp sweep's re-count (`f2f9a16`);
then this section, the record's Done paragraph and the gate record `gate/change-4-after.*`.

**The card.** `src/lib/catalog/entries/trackpad-comet.ts`, id `trackpad-comet`, name "Trackpad
comet" (provisional - the user's to set), tags `pointing` / `precise` / `still` (TRACKPAD's three),
`restsBlack` true, `addedAt` 2026-09-17, appended last to `CATALOG` (27 = 8 + 19). **The Setup is
TRACKPAD's string byte for byte** - `lua-smoke.spec.ts` compares the two with `toBe` - so it is 903
of 908 at every knob state with no knob token in it, 5 free, and `s.u,s.v=f,h` is carried unread.
**The Timer** (`gtt(0,20)` first, then the recipe's release and safety release and the trail colour
written once over layer 1): `k=s.q<26 and(@S or s.n<2)` decides whether contacts are drawn this
call; every block in the library's `B` whose contact is not drawn is cleared through `V`; then for
every contact in `s.p`, `G(s,i,1,x,y,0,@H)` draws the bilinear finger on layer 0 in the head colour
and `D(N(x,y),1,@T*6)` re-arms the nearest calibrated cell on layer 1 at the tail's start, with
`x,y=c[1]//8,c[2]//8` (the hi-res coordinate over eight is the raw sensor value the knot tables were
measured in). **Measured under the pinned `compressScript` after `initLuaFormatter()`, cost =
max(raw, compressed), all 96 knob states:** Timer 427 at the RGB444 picker corner (both colours
255,255,255, tail 42, scroll `false`), 424 at the defaults, every state a fixed point that passes
`checkSyntax`; the worst of the 96 is the corner. **Both Phase 11 gates:** the recipe's three guards
are TRACKPAD's, declared for this id in `touch-guard.spec.ts` (nothing on code 9); the recipe has no
`Q`, so the Q-then-G order does not arise. Shape character `9`, format `w` (the wild vector
`{colour:3, head:1, tail:2, scroll:1}` encodes `w9fa0fff21`; the defaults encode nothing).

**Why not `K` alone, as the brief proposed - measured first.** The first cut stamped the library's
`K` (the presets' comet) at every held contact from the Timer: 306 at the corner. In the VM a stamp
re-written every call at the cell's falling bilinear weight dims a cell the finger is leaving to its
last small start (6 or 12, gone in a tick or two), so a slow finger left almost no trail - the cells
behind the finger were re-stamped DOWN, never left to decay from their peak. The shipped shape is
GHOST's comet: the whole-cell re-arm through `D(N(x,y))` keeps a left cell at its last full start
and decays it from there at any speed, and the head's softness is `G`'s on the other layer (the
firmware's mix adds the layers, one layer capping at 254/512, so the head reads brighter than the
trail). The entry's header records the finding.

**The knobs (four, all in the Timer):** `colour` (Trail colour, `@C`, four swatches, the picker
reaches the lattice), `head` (Head colour, `@H`, the same four; the same lime by default, white the
classic comet), `tail` (Tail length, `@T`, 42 / 31 / 21 ticks - the literal is the tick count as
TRACKPAD's fade knob has it, `*6` in the Lua makes every start a multiple of six inside `D`'s
42-tick ceiling), `scroll` (Comet on scroll, `@S`, `true` / `false` - `true` draws every contact so
a two-finger scroll leaves two comets, `false` keeps the comet to the single-finger pointer as
TRACKPAD's flash is). Token prefix check: none of `@C @H @T @S` is a prefix of another. The `head`
knob the brief floated as "the stamp's peak" is impossible with `K` or `D` (the peak IS the tail
length, the rate is fixed at 250); it is the head's colour instead.

**The VM proof** (`lua-smoke.spec.ts`, the 39th test, eight stages printed by a green run):

```
the starts: 252 186 126
wire identical to TRACKPAD's over the script: 32 HID calls (gmms 25, gmbs 7)
landed at (200,511): head 28=15 29=47 37=47 38=143, trail cell 38 armed at 252
a rightward drag: head cell 40 at 246, behind it 38=162 39=198
lift: head cleared, black after 38 more ticks, every cell on phase 0
a still finger: head 40=67 41=71 49=55 50=59 and cell 41 held at 47 ticks, black once 25 quiet calls passed
tail 21: black after 16 ticks
scroll: notches -1 -1 -1 -1 -1 -1; true lights 8 cells (the two cells 47 49 among them, 6 head cells), false lights none
```

The Setup compared to TRACKPAD's; one gesture script (a drag, its lift, a tap, a fast tap, a
two-finger tap, a two-finger scroll) driven on both entries with the HID logs asserted equal call for
call; a landed finger drawn as `G`'s twin on layer 0 (the 12.1-02 arithmetic from KX / KY over the
raw pair) with its nearest cell (`N`'s twin) running within twelve of 252; a drag's trail rising
toward the head; the head cleared inside one Timer call of the lift and the trail black inside 42 +
2 ticks with every cell on 0 on both layers; a still finger held at 47 ticks and gone past the
recipe's idle window with the finger down; tail 21 black inside 23; the scroll knob's two states with
the notches equal either way. `host.errors` empty at every stage. The catalog-wide smoke, residue
and parity probes run over the new entry unchanged.

**The catalog, file by file:** `index.ts` (27 = 8 + 19); `listing.ts` (the row, `motion: "dark"`,
`quiet: DEMO_TOUCH_NOTE`, FOR `pointing`, FEELS `precise` / `still`); `front-door.ts` (excluded
for TRACKPAD's reason - a `lua` row would put the VM on the front page's first paint; the hero is
untouched); `demo.ts` (`TRACKPAD_COMET_PATH`, TRACKPAD's drag sample for sample with the id and the
gesture line changed; four paths); `demo.spec.ts` (four cards); `frames.json` regenerated under
`UPDATE_FRAMES=1` (exit 1 by design), `a581ef4c` -> `5166ff6c`, only the new block added - five
records, 0 bytes / `animating` true at every tick - and byte-identical on a second regeneration
under the final Timer; `static/og/trackpad-comet.png` rendered by the build, 4,506 bytes, sha256
`a79a6387…`, 5 of 81 lit at the end of the demo path (gitignored; the OG term 26 files / 154136 B
-> 27 / 158642 B, `2a9ccf80…` -> `f60a6363…`). **The counts that moved, each found by running the
suite as 12-10 did:** `touch-guard.spec.ts` 4 -> 7 rows (TRACKPAD's three declared once as
`TRACKPAD_ROWS` and mapped onto the second id, branch for branch, since the Setup is one string);
`colour-picker.spec.ts` `two` 6 -> 7 (13 / 7 / 3 / 4 over 27); `filter.spec.ts` entries 26 -> 27,
`pointing` 2 -> 3, `precise` 7 -> 8, `still` 6 -> 7 (`still` leaves its floor of six; `facets.ts`'s
recorded parentheticals moved with them, the FOR row left as it stood - `pointing` at three now ties
`mixing` and `play` and sits after `shortcuts` at two; a question below); `audition.spec.ts`
`ROW_COUNT` 28 -> 29 with row 29 appended to `docs/HARDWARE-AUDITION.md` (six clauses (a)-(f): the
head and the trail under a moving finger, both under a still one, the four gestures as row 23(c),
the tail and head knobs, the scroll knob, a lost lift fading inside the idle window) and the cost
row `903 / 424 / 4 / yes` appended to its table - prettier re-padded that table's twenty lines, no
row's text moved, the checklist table did not re-pad; `stamp-roundtrip.sweep.spec.ts` `exempted`
28 -> 30 (89 -> 93 hand-authored knobs, `guarded` 61 -> 63). `surprise.spec.ts`, `wire-pin.spec.ts`,
`reachability.sweep.spec.ts`, `catalog.spec.ts`, `frames.spec.ts` and `aesthetic.spec.ts` pin
nothing this change moves (their literals are the eight ported cards and floors) and were left as
they stood; `sort.spec.ts`'s `entries: 26` is a floor and holds.

**The runs.** Quick 94 / 967 (+0 files / +1 test) at `--maxWorkers=2` twice, green both times, plus
a third green run before the commits; check 655 (+1 file), 0 / 0; lint clean; the sweep `4 19`
green (`lua-entries` 1,140 -> 1,201 combinations / 2,402 measurements; the reachability sweep's
44,846 states, laddered 8, over budget 0, the kind cross-product 1,296, worst 906 of 908 - untouched
by a Lua card); the build; **the gate** `--after change-4 --against change-3-after --check 655` at
`f2f9a16` (`gate/change-4-after.txt`). No `--before change-4` was recorded: change 3's after-record
was taken at `1e78f4b`, and `git diff --stat 1e78f4b e57e126 -- src scripts` is empty, so the
before-record for this change IS that record, and the script accepted it by name. The script exits
1 at its first inequality - the wire, by design of a new card - so the terms after it are compared
here from the two records. **Equal:** the sandbox set `40b44316…`; the fixtures' three other
hash-objects; **the SCOPED CSS `661eab32…` and the raw CSS `fc20dd55…`** (no component touched); the
utilities 44 -> 44 with the five markup-named intact; the copy exports `25468f7e…`; the
`data-testid` set `cebf17b5…` (312); check 655; lint; the build; the refuse-list `--stat` empty.
**Moved, as a new card moves them:** the wire set `a24b256f…` -> `3f2531f7…` and full `514cb2c7…`
-> `df9345d9…` with **1,761 records byte-identical, 0 moved, 0 removed, 31 added** (the entry's
defaults, corner, fourteen single-knob positions, both events each, and the 96-state cross-product
hash; 1,735 -> 1,765 strings on the set line, 1,761 -> 1,792 records, `luaStates` 232,728 -> 232,824); `frames.json` `a581ef4c` ->
`5166ff6c` (above); the OG (above); the literal census `40660d18…` -> `b251cbba…` (2,685 -> 2,699
distinct literals, 191 -> 192 files; in - the Timer string, `./entries/trackpad-comet`,
`2026-09-17`, `@H`, `@S`, `Comet on scroll`, `Head colour`, `Tail length`, `Trackpad comet`,
`trackpad-comet`, the description, the exclusion reason, the gesture line, `tail`; counts up - the
Setup string 1 -> 2, `Trail colour` 1 -> 2, `pointing` 7 -> 9, `precise` 19 -> 21, `still` 23 ->
25, the four swatches, `42` / `31` / `21`, `@C` / `@T`, `colour`, `dark`, `false`, `head`, `lua`,
`mode`, `scroll`, `speed`, `true`); the titles `5b5a92bb…` -> `a0e65d2d…` (one added - the comet
test - and one retitled - the audition's "twenty-eight" -> "twenty-nine"; 967 -> 968 vitest titles
incl. todo, 101 playwright runs either side); the normalised JS `d315d6dc…` -> `b4a972a3…`; the
name-status of `src/` 13 modified / 1 added (`entries/trackpad-comet.ts`) / 0 deleted / 0 renamed.
Comment lines: 6 files moved, 12573 -> 12679 comment lines, 3863 -> 3930 header lines (the entry's
67, under `MECHANISM / WHAT IT SENDS / TRAPS`; `comment-lines.mjs --todo` prints nothing over the
seven). **The gate's own quick run read 966 passed / 1 failed:** `install.spec.ts` "the snapshot is
taken at connect, in order, before ready" timed out waiting for identification at 2.95 GB free
straight after the sweep - the known load flake on the install fake (12-10 recorded the same file
timing out on a machine that had just run the sweep); the two counted runs above are green, and
`check-counts` reported "no summary lines" for that one because a run with a failure prints a
different summary.

**The chunks** (`scripts/gate/e2e-chunks.sh`, fresh detached wrangler dev on 4173 per chunk, stopped
through PowerShell, HTTP 000 after each; the user's 5173 untouched): c4 **15 passed** (catalog,
fidelity, first-experience - the hero untouched - library, sandbox); c2 at the script's three
workers 18 passed / 4 failed (`browse:299` sort, `:343` search and chips, `:1263` keyboard, `:1404`
the round trip - the grid read before hydration, the count line right at 27), rerun at `--workers 1`
on a fresh server **22 passed**, the same split change 3 recorded (`:299` / `:343` / `:1404` red at
three workers, green at one) with `:1263` alongside this time. c1, c3 and c5 not run: no install,
tuning, artifact or radius file reads the catalog's length as a literal (`artifacts.e2e.ts:127` is a
floor of 26). e2e: 86 titles / 101 runs (+0 / +0).

**Outside `src/`:** `docs/HARDWARE-AUDITION.md` (row 29, the cost row, a dated paragraph after row
28's scope line - append-only, save the one table prettier re-padded); no `docs/entries/
trackpad-comet.md` (the entry has no history yet; the header carries the one finding); `.planning/
ROADMAP.md`, `REQUIREMENTS.md` and `STATE.md` untouched; CAT-04 stays `[ ]`. No device, no deploy;
`src/vendor/`, `library.ts` (the comet uses `G`, `D`, `N`, `V` and `B` as exported), `trackpad.ts`,
the manifest, the three other fixtures, `Knob.svelte`, `ColourPicker.svelte` untouched (the gate's
`--stat`).

**Questions for the user:** (a) the name - "Trackpad comet" and the id `trackpad-comet` are
provisional; (b) the head's colour as the fourth knob (the same lime by default) - keep, or drop to
three knobs with one colour; (c) the comet under a two-finger scroll defaults to ON (`true`) - say if
the scroll should be dark like TRACKPAD's flash; (d) `pointing` now carries three entries and sits
last in the FOR row after `shortcuts` at two - the row is "descending by carriers, ties keep their
order" by its own comment; moving it before `shortcuts` is one line in `facets.ts` and a toolbar
change, left for your word; (e) a still finger's comet goes dark after the recipe's 25 quiet Timer
calls (500 ms) in the VM, where a still finger sends nothing - on the module a resting finger
wobbles every sample (probe Q1) so it stays; row 29(b) asks.

## 2026-09-17 change 5 - a brightness setting, 1 to 255, on every card and every surface, reaching the ZONA

Outside the GSD cycle, the user's word recorded verbatim in `BENCH-2026-09-16.txt` section 5: "add
brightness setting to all playground mode and sandbox mode. lowest brightness 1 highest 255".
Research first, because the mechanism was not decided; then seven source commits, then this
section: the scaler and its gate (`df8d386`), the tuner and the engines (`5b52611`), the Sandbox
and the records (`dbd6b87`), the field and the routes (`6bcc627`), the two e2e titles (`e8fb3bc`),
audition row 30 (`b9ef5e8`), a fix for the gate's harness (`164df23`); then this section, the
record's Done paragraph and the gate records `gate/change-5.*` (before) and `gate/change-5-after.*`.

**The firmware has no brightness.** `../grid-fw/common/src/c/grid_protocol.h:236-287` is the whole
LED API the Lua sees: `glr glg glb` (the defaults), `glp` (phase), `glt` (timeout), `gln gld glx`
(a layer's min / mid / max colour), `glc` (led_color: a layer's colour, with the six-argument form
forcing min to 0, `grid_lua_api.c:1062-1102`), `glf` (rate), `gls` (shape), `glpfs`, `glag`.
`grid_led.c:408-463` (`grid_led_render_framebuffer_one`) maps each layer's phase through its shape
to an intensity, looks up `min_lookup / mid_lookup / max_lookup[intensity]`, sums `colour * alpha`
over the layers and divides by 512 - nothing scales the sum, and `struct grid_led_model`
(`grid_led.h:41-53`) has no intensity field. A grep of `grid_led.c grid_led.h grid_lua_api.c
grid_protocol.h` and the firmware's Lua for brightness / dimming finds nothing. So brightness is
applied to the colours HANGAR writes.

**Two mechanisms measured; (a) chosen.** _(b) a library global_: `LB=255` in 255/0's data line
costs 7 of its 66 free; scaling inside `G` (`glc(a,l,r*LB//255,g*LB//255,b*LB//255,1)`) is +24
characters and inside `K` another +24, 48 against 255/6's 35 free - `G` alone fits and `K` does
not - and neither reaches the `glc` calls the entries make themselves (TRACKPAD's Timer writes its
layer-1 colour with `glc(glag(0,n),1,@C,1)`, every Setup paints its own layers), nor the compiler's
output. _A wrapper of the firmware's own `glc` in 255/0_ (`O=glc glc=function(a,l,r,g,b,m)O(a,l,
r*128//255,...)end`) measures 75, 69 with `>>8`, 74 made safe against the page-load re-run that
would otherwise wrap the wrapper (`grid_decode.c` never clears `_G`) - all over 255/0's 66 free
before `gld / glx / gln` (the drift look) get theirs, and the PadSim preview would not follow it.
_(a) at landing_: `src/lib/catalog/brightness.ts`, pure string arithmetic, no import. `scaleLua`
rewrites every colour argument of every painter call in the emitted text - the firmware's four
(`glc gld glx gln`, positions 2-4), the library's `G` (6-8) and `K` (4-6, optional) - and every
declared palette table; a channel becomes `max(1, floor(v*b/255))` (0 stays 0, so a dim colour
never vanishes; at 1 a lit channel is 1), a linear form's coefficient (`255-j*85`, `f*80`,
`lo+d*x//8`) floors plainly, which is what keeps morph's fourth corner and the compiler's fifth
finger non-negative at every brightness (test 2 walks 1..255). The wire-side survey found what a
shape scan cannot see, declared per entry in `ENTRY_SITES` and asserted found: CULL's fifteen-
channel `C`, LUMEN's twenty-seven-channel `H`, QUADRANT's two `C` constructors (palettes); SNAKE's
`P(k,r,g,b)` and POMODORO's `I(p,q,w)` (local painters, their callers scaled, their bodies' bare
`r g b` / `p q w` allowed by name). The Sandbox scales its region rows in `emit.ts` (`regionRow`'s
three colour columns - the paint and the runtime's finger read `J`) and `cost.ts`'s picker corner
drops the field so the meter measures the bound. A preset compiles at the compiler's own `Full`
and its pair is scaled the same way, so one scanner covers every producer; its preview is
`engine.ts`'s `dimmed` - the PadSim's frame scaled byte for byte - which the wire agrees with to
one unit per channel (`lua-parity.spec.ts` title 7: the scaled compiled Lua in the VM beside the
library against the dimmed PadSim, eight presets, at rest and under a finger, worst byte
difference 1 over 11,664 bytes, the brightest byte 141 -> 70, 253 -> 127). A Lua entry and a
surface preview through a fresh VM on the scaled bytes: exact.

**Budget.** A scaled number never has more digits than its source, so no string grows - asserted
per channel in test 1 and on every sampled string in test 4 - and the sweep's picker corner at
255 stays the worst case. The two tightest entries at the RGB444 picker corner, measured under
the pinned `compressScript` after `initLuaFormatter()`, at 255 / 128 / 1: **Trackpad Setup 903 /
903 / 903** (no colour in the Setup) and Timer 510 / 510 / 504; **Chorus Setup 822 / 820 / 803**,
Timer 29; **Console Setup 788 / 788 / 759**, Timer 0. Every scaled string still passes
`checkSyntax` (test 4, 519 Lua states and 345 preset states at 128 and at 1).

**Coverage** (`brightness.spec.ts` test 3): every colour argument of every painter call is
classified on the 19 Lua entries at hash-wire's sampling (defaults, corner, every single-knob
position: 519 states, 7,119 arguments - literal 6,405, linear 72, bare 438, palette 204) and on
the 8 presets at theirs (345 states, 2,271 arguments); none is `other`, every declared palette is
found, no undeclared entry needs a declaration. Measured once over the whole Lua cross-product
(232,824 states, 2,570,136 arguments, 81 s): none unreachable either; the quick spec samples.

**Where the value lives.** `Surface.brightness?` and `PlaygroundRecord.brightness?` in
`store/schema.ts` on the 13-14 `orientation` precedent: an integer 1..255 or absent, absent
meaning 255, so every record written before today reads as it was; the validators refuse 0, 256,
1.5 and a string (a file edited past the range is unreadable, `transfer.spec.ts` 5); the export
file carries it; `withBrightness` (sandbox/model.ts) keeps 255 as the field's absence so a
surface at full reads, emits and hashes exactly as before. **The stamp does not carry it**: a
shared link lands at 255, `y` and `z` stay reserved. A Playground copy saved at a brightness
opens from My configs through `?from=<record id>` beside its stamp (the Sandbox's 13-17 shape) and
the workspace reads the field for that entry only; a copy at 255 keeps the address it had.

**The control.** `src/lib/ui/BrightnessField.svelte`, MidiField's shape over a free range: a text
input with a numeric keyboard, `parseBrightness` the door, a whole number outside 1..255 refused
inline with `Brightness is 1 to 255.` and anything else with `Type a whole number.`, the last good
value kept with the refused text under `aria-invalid` until a keystroke validates, section 7's
changed marker off 255, a per-field reset named `Reset Brightness`, 44px, square, the error ink
on the refused boundary and its sentence only (the carriers list in `tune-ui.spec.ts` gains it).
The workspace: under `Appearance`, beneath the swatch rack - the section is unconditional now, so
a card with no colour knob has it for the field alone; `TuneView.brightness` feeds it;
`tuner.setBrightness` withdraws the strings on the same tick as a knob move, drops the forecast
memo, repaints a preset now through the dimmed engine and rebuilds a Lua entry's VM at the
debounce; Reset settings puts it back with the knobs; Randomize draws knob indices only
(`surpriseIndices` over `knobs`), so it cannot reach it - structural, not a guard. The Sandbox:
under `Appearance` with or without a selection (no selection lists Appearance alone), the helper
`One brightness for the whole surface, every element included.` beneath, read-only in Play;
`editor.setBrightness` is a structural edit under one coalesce key (typed digits are one entry),
undone and redone, refused in Play. The strings are `inspector-copy.ts`'s: `BRIGHTNESS_LABEL`,
`BRIGHTNESS_RANGE`, `BRIGHTNESS_SURFACE_HELPER`; testids `brightness-field`, `-input`, `-reset`,
`-message`, `-changed`. `config-shape.spec.ts` permits `$lib/catalog/brightness` for a component
by exact path, on `brightness.spec.ts` test 5's proof that the module imports nothing.

**A preset still carries the compiler's own five-detent Brightness knob** (`knobs.preset.ts`,
D-01's three-knob floor for STARFIELD and FOUR FADERS, format `c` in the BOTOR stamp, sixty-four
`knob brightness=N` records in the wire set). The field composes with it - the knob scales the
compiler's coefficients (`briPct`), the field scales what lands - and at the knob's `Full` the
field is the only scaling. Retiring the knob would move the wire set, which this change holds
equal, so it stands; `tune-ui.spec.ts`'s new title names the two apart. A question below.

**The wire.** `hash-wire --full --sandbox` at the last source commit: **the set `3f2531f7…` and
the full `df9345d9…` byte-identical to the before-record's, the sandbox set `40b44316…` equal**

- 255 is the identity on every string HANGAR can put on a ZONA. Store lands the scaled strings
  and the read-back proof compares what was sent: unchanged logic, pressed in a browser
  (`install.e2e.ts`: EUCLID stored at 255 is the Setup as shipped; at 128 the fake's RAM holds
  `scaleLua`'s string byte for byte, the Timer too, the picture's brightest channel 135 -> 70; the
  reset lands the shipped bytes on a third store).

**Specs, each +1 unless said:** `brightness.spec.ts` (new, 5: the rules; the shapes; coverage;
the wire - identity, never longer, checkSyntax, the three corners; imports nothing); `model.spec.
ts` (14: EUCLID at 128 lands `scaleLua`'s pair with the library untouched and the meter equal to
`measureLua` of the landed Setup, the fresh VM's frame about half, a roll leaves it, 0 / 256 /
the same value emit nothing, Reset settings restores the shipped bytes; AURORA opened at 128 lands
its compiled Setup scaled, the meter its cost, the preview about half); `lua-parity.spec.ts` (7,
above); `emit.spec.ts` (6: the rows at 128 and at 1, `J` moved and nothing else, the landing's
scaled Setup beside a meter equal to the full corner); `transfer.spec.ts` (5, above);
`tune-ui.spec.ts` (13: the field's shape at 255, 128 and read-only, the door, the wiring, no Lua
entry with a brightness knob, a real tuner opened at 200 moved to 64 rolled and reset; the
component list 10 -> 11, the accent census gains the field at 0, the error-ink carriers gain it);
`sandbox-ui.spec.ts` (9: one coalesced entry per edit undone and redone, refused in Play, 255 the
field's absence; the inspector with and without a selection, read-only in Play);
`audition.spec.ts` (`ROW_COUNT` 29 -> 30, the title says thirty); `config-shape.spec.ts` (the
third permitted catalog path).

**The runs.** Quick **95 / 978** (+1 file / +11 tests) at `--maxWorkers=2`: green three times
(the two counted runs and the gate's own, which reads 978 passed / 1 todo and `check-counts`
exits 1 on its hard-coded 94 / 966 as change 4's did); check **658** (+3 files), 0 / 0; lint
clean; the sweep `4 19` green (`lua-entries` 1,201 combinations / 2,402 measurements; the
reachability sweep 44,846 states, laddered 8, over budget 0; the kind cross-product 1,296, worst
906 of 908 - none reads a brightness); the build. **The gate** `--before change-5` at `b5432db`
(`gate/change-5.txt`) and `--after change-5 --against change-5 --check 658` at `164df23`
(`gate/change-5-after.txt`); the script exits 1 at its first inequality - the literal census, by
design of a feature - so the later terms are compared here from the two records. **Equal, above
all: the wire set `3f2531f7…` and full `df9345d9…`** (1,765 strings; 1,792 records under
`--full`), the sandbox set `40b44316…` (154 strings); the four fixtures' hash-objects and the OG
(27 files, 158,642 B, `f60a6363…` - rendered at 255); the fixture paths clean after the build;
the utilities 44 -> 44 with the five markup-named intact; check 658; lint; the build; the
refuse-list `--stat` empty; `src/` 24 modified / 3 added (`catalog/brightness.ts`, `catalog/
brightness.spec.ts`, `ui/BrightnessField.svelte`) / 0 deleted / 0 renamed. **Moved, as a feature
moves them:** the SCOPED CSS `661eab32…` -> `7f88b4f4…` and the raw `fc20dd55…` -> `56d81122…`
(one component gained rules: BrightnessField.svelte's); the literal census `b251cbba…` ->
`e4f23375…` (2,699 -> 2,721 distinct, 193 -> 194 files: in - the two sentences, the five testids,
the coalesce key, the scanner's regex sources, `?from=${}`, the classification words; up -
`Brightness` 1 -> 2, `brightness` 1 -> 3, `number` 12 -> 16, `range` 4 -> 6, `palette` 2 -> 4
and the field vocabulary by one); the copy exports `25468f7e…` -> `7ec85d4a…` (three); the
`data-testid` set `cebf17b5…` -> `70dfe98a…` (312 -> 317); the titles `a0e65d2d…` ->
`82938fa6…` (968 -> 979 vitest titles incl. todo, 101 -> 103 playwright runs; one retitled -
the audition's "twenty-nine" -> "thirty"); the normalised JS `b4a972a3…` -> `870762eb…` (71 ->
72 files); comment lines 12,679 -> 12,837, header lines 3,930 -> 3,956 (`comment-lines.mjs
--todo` prints nothing over the twelve files with a header touched). The first `--after` run
came back with an empty wire term: `hash-wire.mjs` imports `engine.ts` from the tree under Node
24's strip-only TypeScript, which refuses a parameter property (`ERR_UNSUPPORTED_TYPESCRIPT_
SYNTAX`); `164df23` declares `DimmedEngine`'s two fields by hand, and the second run is the
record above.

**The chunks** (`scripts/gate/e2e-chunks.sh`, a fresh detached wrangler dev on 4173 per chunk,
stopped through PowerShell, HTTP 000 after each; the user's 5173 untouched): **c1 33 passed**
(install + session; +1, the EUCLID title, chromium), **c4 16 passed** (catalog, fidelity,
first-experience, library, sandbox; +1, the surface's field, chromium), **c3 21 passed** (tuning,
tuning-webkit; +0). No rerun needed. c2 and c5 not run: no browse, artifact, radius, skeleton or
smoke file reads the inspector. e2e: 86 -> 88 titles, 101 -> 103 runs.

**Outside `src/`:** `docs/HARDWARE-AUDITION.md` row 30 (append-only: 128 reads about half on the
module as in the browser; 1 barely lit, not off; 32 keeps every hue; the preset knob and the
field compose; 255 byte for byte the start) and the dated paragraph after row 29's; `e2e/install.
e2e.ts` and `e2e/sandbox.e2e.ts`; `.planning/ROADMAP.md`, `REQUIREMENTS.md` and `STATE.md`
untouched; CAT-04 stays `[ ]`. No device, no deploy, no push; `src/vendor/`, `library.ts`, every
entry's Lua literal (the five declarations live in `brightness.ts`, not in the entry files),
`sequence.ts`, the manifest, `Knob.svelte`, `ColourPicker.svelte` untouched (the gate's `--stat`
and the wire).

**Departures from the brief, stated:** the brief's picture of (a) - "every colour triplet in the
emitted Lua" - does not hold on six entries (CULL, LUMEN, QUADRANT read palette tables; SNAKE and
POMODORO paint through local functions; MORPH's corners are `255-j*@SPREAD`), so the scaler has a
linear-form rule and five per-entry declarations with a coverage gate, rather than a triplet
scan; the preset route is scaled on the compiler's OUTPUT (the brief said "the PadState colours
before compileState") because the compiler's per-finger hues, fader palettes and dim tracks are
coefficients inside `_pad.ts`, not state, and `src/vendor/` is untouched; a preset's preview is
the dimmed frame, not a scaled state, for the same reason - proved to one unit against the wire;
Reset settings resets the brightness too (the brief named the per-field reset only; the MIDI
fields' shape); a dimmed Playground copy opens through `?from=` (the brief said the copy carries
it and the stamp does not - without the read-back the field would be a stub); the quick spec
samples hash-wire's states rather than the whole Lua cross-product (232,824 states are 81 s, the
sweep's business); and the preset knob above.

**Questions for the user:** (a) THE PRESET KNOB: the eight preset cards show two brightness
controls now - the compiler's five-step `Brightness` rail under Behavior (15 / 30 / 50 / 75 /
100, in the stamp, rolled by Randomize) and the field under Appearance (1..255, not in the stamp,
never rolled) - and they multiply. Retire the knob (one 1..255 setting everywhere, as the ask
reads; the wire set moves by its sixty-four records, D-01's floor drops STARFIELD and FOUR FADERS to
two knobs, `c`-format links land at Full) or keep both. (b) Reset settings resets the brightness
with the knobs - say if it should leave it. (c) LUMEN's sysex (`gmss(240,125,...)`) reports the
cell's colour as the module lights it, so at 128 it reports the dimmed colour; say if the report
should stay the palette's. (d) The Sandbox's field sits under Appearance whether or not an element
is selected, with a helper saying it is the surface's; the alternative was a surface section
above the element list in the rail - say if you want it moved. (e) Changes 1 to 4's questions
still stand.

### 5b, the same day - the presets' own five-step brightness knob is retired

Change 5 shipped with a question: the eight preset cards showed TWO brightness controls, the
compiler's five-detent rail under Behavior (15 / 30 / 50 / 75 / 100 percent, in the BOTOR stamp,
rolled by Randomize) and the new 1..255 field under Appearance, and they multiplied. The user's
answer, recorded verbatim in `BENCH-2026-09-16.txt` section 5b: **"one"**. One source commit
(`cade81b`), then this subsection and the record's Done paragraph; the gate record is
`gate/change-5b-after.*`, taken against `gate/change-5-after.*`.

**Where the knob went, and where the pin lives.** `presetKnobs` (`src/lib/tune/knobs.preset.ts`)
no longer appends the universal knob; `BRIGHTNESS_KNOB_ID`, `brightnessKnob`,
`BRIGHTNESS_OPTIONS` and `stepForBrightnessIndex` leave by name under a dated `RETIRED BY NAME`
block (CODE-STYLE section 9's 13.2-03 rule), and the module's two now-dead vendored imports
(`BRIGHTNESS_TABLE`, `padLightsAnything`) go with them. **THE PIN IS IN `baseStateFor`**
(`src/lib/tune/state.ts`), which is the one door HANGAR opens a preset's `PadState` through -
`model.ts`'s `stateOf` and `resetAll`, `stamp.ts`'s `stateFor` and `decodeCompiler` all start
there - and it writes `BRIGHTNESS_TABLE[BRIGHTNESS_TABLE.length - 1].step` (Full), derived from
the vendored table rather than typed. Every one of the nine shelf cards already shipped at Full
(asserted), so the pin moves no byte of the wire; what it does is make the retired detent
unreachable rather than merely unoffered. `src/vendor/` is untouched: the compiler still HAS the
field and still scales its own coefficients by it - nothing there forbids a dim state, the value
is pinned on the way in.

**The racks after it, measured:** aurora 4 (colour, speed, direction, band), pinwheel 3, starfield
**2** (colour, edge), radar 3, joystick 4, ninepads 5 (grid last again, where 11-06 appended it),
faders **2** (send, channel), dial 4, tpad 3 (it never had the knob - a card that lights nothing
cannot hold a brightness, `_pad.ts:1486`).

**The wire, removals only.** `hash-wire` against change 5's after-record: the SET record 1,765 ->
1,701 strings - **64 removed, 0 added, 0 moved** - and every removed key is a
`P/<card>/knob brightness=N/{setup,timer}` (8 lit cards x the knob's 4 non-default positions x 2
events). Under `--full` the same 64 go and the 8 per-card cross-product keys are re-named by their
smaller state counts (`P/aurora/cross-product (6720 states)` -> `(1344 states)`, and so on;
126,920 -> 25,384 preset states in all), so `--full` reads 1,792 -> 1,728 with 1,720 records
byte-identical. The sandbox set `40b44316…` is unmoved, and no Lua entry's record moved at all.

**What an old share link does, and it is the codec's own rule.** The vendored writer emits format
`c` ONLY when brightness is not Full (`_pad.ts:2604-2623`), so:

- a pre-5b link whose brightness was Full (`a`, `b`, `d`, or the `p<presetId>` base-card row) is
  **byte-identical** to what HANGAR mints today and still lands `restored` - proved by minting the
  same vector both ways in `brightness.spec.ts` test 6;
- a pre-5b link whose brightness was moved (format `c`) lands **`unreadable`**, not `older`:
  `decodeCompiler` rebuilds from `baseStateFor` (Full now), re-encodes and compares, and a BOTOR
  stamp that fails that comparison is unreadable by construction - `older` is reachable only
  through the Lua formats' shape character (stamp.ts's header says so, and SHARE-03's fail-closed
  rule is what makes a wrong restore impossible). The workspace then shows `StampNotice`'s
  unreadable line and opens the card as it ships, at Full, which is the honest landing.

`stamp.ts`, `stamp.spec.ts` and `stamp-roundtrip.sweep.spec.ts`'s round trip are **untouched**;
`y` and `z` stay reserved. The proof lives in change 5's own spec, not in the codec's.

**TUNE-01's floor, exempted by the user's word and named for the next gate.** The three-to-six
floor was met on STARFIELD and FOUR FADERS by the retired knob; both now declare and keep two real
knobs. `knobs.preset.spec.ts`'s **"gives every shelf card three to six real knobs"** carries the
dated exemption - a two-id list (`starfield`, `faders`), so a third card falling to two is still
red - plus the positive half: no rack offers a knob with the id `brightness`, on any card.
REQUIREMENTS.md is untouched; the phase that next runs a gate amends TUNE-01 by this word, as
change 1's retirement of SAFE-02 / SAFE-05 is already waiting to be.

**The other specs, by title, none renamed.** `knobs.preset.spec.ts`: the kinds carve-out ("exposes
exactly the kinds BOTOR declares for each card, both directions") is unconditional again - it
existed only because `brightness` is not a member of the vendored `KnobKind` union; "defaults
every knob to the position the card actually ships at" asserts the pin instead of the knob's
default; the dark-card block keeps its detent no-op probe as the reason the field, not a knob, is
the shelf's brightness; NINE PADS' rack test reads five with `grid` last. `ladder.spec.ts`'s **"the
compiler never proposes degrading the control the hand is on"** moves its subject from `dial` to
`pinwheel` at a measured `{ setup: 600 }` (Setup 1013 of 908, 105 over, six steps - four `look`,
two `touch`; pinning the colour knob's `look` leaves two): the dial's ladder proposes `look` steps
only and the dial's `look` knob WAS the retired one, so on the dial the test's own precondition
was what would fail. `surprise.spec.ts`: the dial's rollable set is `mode` + `sensitivity` (the
roll no longer reaches a brightness on any card - the field is not a knob), and starfield's
held-knob collapse holds one knob rather than two. `tune-ui.spec.ts`: the coexistence note becomes
the retirement's proof, over every entry's rack through `stampKnobs`. `brightness.spec.ts` **+1
(6)**: the racks, the pin on all eight cards, and the two landings above.

**The two sweep floors, re-derived.** Pass A's cross-products lost a factor of five (20,270 ->
4,054; Pass B unchanged at 24,576, which is 4,096 per colour knob over six; the total 44,846 ->
28,630), so the 40,000 non-vacuity floors in `reachability.sweep.spec.ts` and
`stamp-roundtrip.sweep.spec.ts` would have gone red on a green tree. Both read **25,000** now,
with the arithmetic in the comment: above Pass B alone (24,576) and six times Pass A alone, so
either pass silently emptying is still red, and losing one colour knob (4,096) lands at 24,534,
under it. The real guard is unchanged either side of it - `costedA === expectedA` and
`costedB === expectedB`, both re-derived from the same knob tables the loops read.

**The runs.** Quick **95 / 979** (+0 files / +1 test - brightness.spec's sixth) at
`--maxWorkers=2`, green twice plus the gate's own; check **658**, 0 / 0; lint clean; the sweep
`4 19` green (`lua-entries` 1,201 combinations unmoved - no Lua entry has a brightness knob; the
reachability sweep 28,630 states, laddered 8, over budget 0; the kind cross-product 1,296, worst
906 of 908); the build. **The gate** `--after change-5b --against change-5-after --check 658` at
`4488eb6` (`gate/change-5b-after.txt`; HEAD carries the user's change-6 and change-7 records,
which touch no source). It exits 1 at the wire by design - a retirement removes records - so the
later terms are compared from the two records. **Equal:** the sandbox set `40b44316…`; the four
fixtures' hash-objects and the fixture paths clean after the build; the OG (27 files, 158,642 B,
`f60a6363…`); **the SCOPED CSS `7f88b4f4…` and the raw `56d81122…`** (no component moved); the
utilities 44 -> 44 with the five markup-named intact; **the copy exports `7ec85d4a…` and the
`data-testid` set `70dfe98a…` (317)** - the knob carried no visitor-facing string of its own
beyond its label; check 658; lint; the build; the refuse-list `--stat` empty; `src/` 9 modified /
0 added / 0 deleted / 0 renamed. **Moved:** the wire (above); the literal census `e4f23375…` ->
`e12326a3…` (2,721 distinct either side, 6,383 -> 6,379 occurrences; four counts down and nothing
added - `"Brightness"` 2 -> 1, `"brightness"` 3 -> 2, `"amount"` 29 -> 28, `"look"` 11 -> 10);
the titles `82938fa6…` -> `a2f9cfa8…` (979 -> 980 vitest titles incl. todo, 103 playwright runs
either side, none renamed); the normalised JS `870762eb…` -> `ae3b7779…` (72 files either side);
comment lines 12,837 -> 12,841 over 2 files, header lines 3,956 unmoved.

**The chunks** (fresh detached servers on 4173, stopped through PowerShell, HTTP 000 after each;
the user's 5173 untouched): **c3 21 passed** (tuning + tuning-webkit - the workspace's rack, RESET
ALL, SURPRISE ME and the stamp landings on AURORA, the card whose rack lost a knob), **c1 33
passed** (install + session - the rack's rails by index on AURORA and LUMEN), **c5 1 failed / 10
passed** then **11 passed** on a rerun named `c5-rerun-5b`: `artifacts.e2e.ts`'s "the static build
is complete" compares the build's `source-<sha>.tar.gz` against HEAD, and HEAD moved during the
run when the user recorded changes 6 and 7 (`e2e2b2e`, `4488eb6` - documentation only, no source);
a rebuild at the new HEAD and the rerun are green. c2 and c4 not run: no browse, catalog,
fidelity, first-experience, library or sandbox title reads a preset's rack length.

**Outside `src/`:** this subsection, the record's Done paragraph under section 5b, and the gate
record. `docs/HARDWARE-AUDITION.md` is unchanged - row 30(d) asked the bench whether the knob and
the field compose, and that question is answered by retirement rather than by an LED, so the row's
clause (d) stands as written with the answer in this section. `.planning/ROADMAP.md`,
`REQUIREMENTS.md` and `STATE.md` untouched; CAT-04 stays `[ ]`. No device, no deploy, no push.

**Questions for the user.** (a) Change 5's (b), (c) and (d) still stand (Reset settings resetting
the brightness; LUMEN's sysex reporting the dimmed colour; where the Sandbox's field sits).
(b) STARFIELD and FOUR FADERS now show two knobs each under Behavior beside the one field - if
either feels thin, the honest fix is a third REAL knob from that card's own compiler fields (the
faders' `layout`, starfield's `speed`), not a brightness. (c) TUNE-01's text still reads "three to
six"; the amendment is waiting for whichever phase next runs a gate.

## 2026-09-17 change 6 - ARC as an LFO: a six-wave shape knob and an offset fader on column 8

Outside the GSD cycle, the user's word recorded verbatim in `BENCH-2026-09-16.txt` section 6:
"ARC: this is basically an LFO config, we need an offset fader on the eight side of the module /
you should be able to pick the type of the wave: just like in Ableton.: sine, sotus up, down,
triangle, square, random / the offset fader should be able to manipulate all the time". "sotus
up" is read as "saw up" (the user may correct). Research first - three forms for the wave and two
for the contact rule, every one measured under the pinned `compressScript` after
`initLuaFormatter()` - then one source commit (`119f4b0`), then this section, the record's Done
paragraph and the gate records `gate/change-6.*` (before, at `98cb427`) and `gate/change-6-after.*`.

**The wave: three forms costed, the third built.** Each figure is the Timer at the RGB444 picker
corner (both colours 255,255,255, every other knob its longest literal), a fixed point passing
`checkSyntax`. _(i) the brief's chain_ - `@SHAPE` an integer 0..5 and one `and/or` chain over all
six waves in the Timer: **447** (461 free); every card carries all six. _(ii) the brief's
closures_ - six `function(p)return ... end` in a Setup table, indexed from the Timer: Setup
**1,191**, 283 OVER; does not fit. _(iii) chosen_ - the wave is the knob's LITERAL, an expression
over the phase `p` substituted for `v` (`local v,c=@SHAPE,...` - CHORUS's `@SCALE` idiom): Timer
**437** with the longest wave (the sine, 46 characters), 392 with `p`, 410 at the defaults. The
six, each landing in 0..255 and carrying no comparison so the depth scaling and the offset apply to
every one unchanged: Sine `128+(1-p//128*2)*(p%128*(128-p%128)*127//4096)` - a parabola per
half-wave, 128 / 255 / 128 / 1 at p 0 / 64 / 128 / 192; Saw up `p`; Saw down `255-p`; Triangle
`255-math.abs(p*2-255)` - byte for byte the retired `p<128 and p*2 or 510-p*2` at every p; Square
`255-p//128*255` - high for the first half; Random `s.n%256` over a sample-and-hold LCG,
`s.n=(s.n*75+74)%65537` advanced once per cycle on the wrap (`p<s.h`, never true while stopped),
seeded 1. **Two of the brief's spellings are outside D-08** (`lua-entries.sweep.spec.ts`'s
restricted subset admits `atan sqrt abs max min floor tointeger` and forbids `math.random` by
name): no `math.sin`, no `math.pi`, no `math.random` - hence the parabola and the LCG, both
integer, both the same on every VM. The literal is followed by a comma because a literal ending in
`)` and one ending in a name need different seams before `s:gms(` under the minifier.

**The fader and the two-contact rule.** Column 8 (cells 8, 17, ..., 80) leaves the swirl: its
layer 2 is painted black in the Setup (`glc(a,2,0,0,0,1)`, +17 - a Store lands on a live module
and the previous configuration may have lit the column; the firmware boots every layer black at
frequency 0, `grid_led.c:136-137`, but does not re-init on a CONFIG write). The fader's contact
stores `s.u=U(y,KY)` (0..512) on every sample; the Timer adds `63-s.u*127//512` to every CC (+63
at the top cell, 0 at the centre LED, -64 at the bottom - bipolar, Ableton's offset; held after the
lift) and repaints one marker cell `8+(s.u+32)//64*9` on layer 1 in @HEARTC when it moved. The
arithmetic and the two `glp` live in the TIMER: the first draft did them in the handler and
measured **953**, 45 over; moving them gave 823, and the role bookkeeping below settled at 806.
The contact rule, two forms: _(A) chosen_ - per-contact roles, `s.z` the fader's id and `s.w` the
swirl's, each set on its onset by the calibrated cell (`N(x,y)%9==8` the fader; otherwise
`s.w=s.w or i`), cleared by its own end code, released by a code 9 (`s.z=e<9 and i`): Setup
**806** at the corner (102 free), 803 at the defaults. Either order of landing; a fader that lifts
first does not drop the rate finger; a second fader finger takes over (the first is ignored until
it lands again); a second playing finger is ignored, its centre taps included; the stop tap toggles
only from the swirl's contact, so the stop finger stays the swirl's and a wobble after the tap goes
on tracking (12-05's gate, still asserted). _(B) rejected_ - "the other id" with a column test per
sample: 770, but the rate finger is ignored after the fader lifts first. A sixth knob is the
wave; a seventh (a fader colour) would pass TUNE-01's six, so the marker is the heart's colour on
the heart's layer. No library global moves; `library.ts` untouched.

**Budget.** Setup 528 -> **806** at the picker corner (380 -> 102 free), Timer 275 -> **437** (633
-> 471 free); 525 / 273 -> 803 / 410 at the defaults; every wave a fixed point, every state
`checkSyntax` true; both Phase 11 gates as before (nothing on code 9; `N` then `U` on the
calibrated map; no `D`). `brightness.ts`: no new declaration - the one new colour site,
`glc(a,2,0,0,0,1)`, is three literal zeros the scanner classes `literal` (0 stays 0), and test 3
finds none `other` over the six-knob cross-product's sampling.

**The VM proof** (`lua-smoke.spec.ts`, the 40th test, in the CONT-02 describe): every wave's `v`
over one cycle at the Setup rate read off layer 1's phase on cell 40 (Sine peaks at 255 on p=64;
Saw up is p; Saw down 255-p; Triangle the old formula at every p; Square flips at 128), the CC per
tick the entry's own formula over that v; Random held for a whole cycle and new on the wrap (six
cycles: 149, 241, 217, 156, 211, 243); column 8 black on layer 2 at rest and under the finger,
the marker at 44 then under the finger; the fader at the top +63, the bottom -64, the centre 0,
each on the next tick while running, held after the lift, moving the frozen CC while stopped
(64 -> 0 at the bottom); a tap on cell 44 never stops the card, the centre tap still does; fader 0

- rate 1 and rate 0 + fader 1; the fader lifting first with the rate finger kept; a second playing
  finger ignored, its centre tap included; two fader fingers, the later winning and the first staying
  ignored; a code-9 tap on the fader landing its height and releasing the id. Two older tests moved
  with the feature: the wobble test reads the swirl's 72 cells and keeps its stop finger down through
  the wobble (a MOVE from a lifted contact is nobody's under per-contact roles); `stamp.spec.ts`
  declares ARC's captured five-knob wild stamp `x54244f` as landing `unreadable` - the stamp's
  length rule for an added knob, beside POMODORO's `older` for a resized one; the fixture is not
  regenerated.

**Counts, carried + delta:** quick 95 / 979 -> **95 / 980** (+0 / +1), green twice at
`--maxWorkers=2`; check 658 -> **658** (+0), 0 / 0; lint clean; sweep `4 19` -> **`4 19`** green
(`lua-entries` 1,201 -> 1,212 combinations); e2e 88 titles / 103 runs -> **88 / 103**
(+0 / +0); audition rows 30 -> **31**; OG 27 files, 158,642 -> **158,745 B** (`arc.png` 6,786 ->
6,889, 70 of 81 lit; `static/og/` is built, not tracked); `frames.json` `5166ff6c` -> `79698b0d`,
ARC's block alone, byte-identical on a second regeneration. Specs moved: `lua-smoke` 39 -> 40,
`audition.spec` thirty-one, `stamp.spec` a second declared exception; `catalog.spec`,
`frames.spec`, `touch-guard`, `brightness.spec`, `copy.spec`, `view.spec`, `tune-ui.spec`,
`filter.spec` pin nothing this moves. `stamp-roundtrip.sweep`'s `exempted` stays 30 (no colour
knob added); `guarded` gains one.

**The gate's terms** (`--before change-6` at `98cb427`, `--after change-6 --against change-6
--check 658` at `119f4b0`): equal - the sandbox set `40b44316…`, the three other fixtures (`golden-frames`, `preset-baseline`, `synthetic-zona`), **the SCOPED CSS `7f88b4f4…`** (the raw CSS too), the utilities 44 -> 44 (0 appeared, 0 disappeared), the copy exports `7ec85d4a…`, the testids `70dfe98a…` (317), check 658, lint, the build (stamp `119f4b0`), the refuse-list `--stat` empty, no rename, no deletion; moved as a feature moves them - the wire set `63e93f57…` -> `97a42874…` and full `c1a61f4c…` -> `5e357a90…` in the tree at the run, with **1,618 records byte-identical, 108 moved, 2 removed, 24 added** by `hash-wire.mjs` per string - and 48 of those movers are MORPH's (36 moved, 1 removed, 11 added): the other executor's change 9 sat uncommitted in `morph.ts` when the gate read the tree. Against a CLEAN worktree at `119f4b0` (`git worktree add`, `hash-wire --full --sandbox`, dirty false): 1,728 -> 1,740 records, **1,655 byte-identical, 72 moved, 1 removed, 13 added, every one of them `E/arc/`** (the defaults, the corner, every single-knob position on both events, the six `shape=` pairs added, the cross-product key 6,000 -> 36,000 states), the full set `94189b0c…`, the sandbox set `40b44316…` equal - every non-ARC record byte-identical; the census `e12326a3…` -> `6b8c5116…` (2,721 -> 2,738 literals: ARC's two literals and its sentence replaced, the six wave expressions, the six words, `Wave shape`, `shape`, `@SHAPE`, `mode` 24 -> 26 - and MORPH's in-flight `@CENTRE` / `Centre` / `96` beside them); the titles `a2f9cfa8…` -> `1111bd8f…` (980 -> 981 vitest titles, one added, one retitled: "thirty" -> "thirty-one"; 103 playwright runs unmoved); the JS `ae3b7779…` -> `9aaab2bd…` (72 files); `frames.json` `5166ff6c` -> `79698b0d`; the OG 27 files, 158,642 -> 158,745 B, `f60a6363…` -> `a12c2393…`; `src/` 7 modified / 0 added / 0 deleted / 0 renamed. The script exits 1 at the wire by design; the later terms are compared from the two records.

**Chunks** (`scripts/gate/e2e-chunks.sh`, a fresh detached wrangler dev on 4173 per chunk, stopped
through PowerShell, HTTP 000 after each; the user's 5173 untouched): c3 **21 passed** (tuning, tuning-webkit; +0 - no e2e names ARC's select, the CC-field title walks ARC's cc knob as before); c2 **2 failed / 20 passed** at three workers (`browse:299`, `:343` - the grid read before hydration, the flake changes 3 and 4 recorded), then **22 passed** at `--workers 1` on a fresh server (rerun `c2-w1-change6`, the script's body with one flag changed, run from the scratchpad). c1, c4, c5 not run: no install, session, catalog, fidelity, first-experience, library, sandbox, artifact, radius, skeleton or smoke title reads ARC's knobs (library.e2e's stored ARC draft carries five indices, which `my-configs` lands on the first five by position). e2e 88 titles / 103 runs unmoved.

**Outside `src/`:** `docs/HARDWARE-AUDITION.md` row 31 and its dated paragraph, ARC's cost row
525 / 273 / 5 -> 803 / 410 / 6 (append-only otherwise); `docs/entries/arc.md` a dated section with
the two old literals verbatim and the forms costed; `.planning/ROADMAP.md`, `REQUIREMENTS.md` and
`STATE.md` untouched; CAT-04 stays `[ ]`. No device, no deploy, no push; `src/vendor/`,
`library.ts`, `sequence.ts`, the manifest, `Knob.svelte`, `ColourPicker.svelte`, every other
entry untouched (the gate's `--stat` and the wire's per-string diff).

**Departures from the brief, stated:** the wave is the knob's literal (an expression), not an
integer selecting a chain or a closure table - both brief forms were costed and the chain fits;
the literal form is 10 cheaper on the Timer at the corner and is the tree's existing idiom; no
`math.sin`, `math.pi` or `math.random` (D-08), so the sine is a parabola and the random an LCG;
the offset arithmetic and the marker are painted from the Timer, not the handler; the marker is
one cell in the heart's colour (a `@FADERC` would be a seventh knob); the swirl's light does not
follow the wave (not costed - the swirl is the rate's picture, the heart the value's); the wobble
test's gesture changed (above); ARC's older shared links land `unreadable` (the stamp's rule).

**Questions for the user:** (a) "sotus up" is read as saw up. (b) The offset is bipolar (-64..+63,
centre = no offset, Ableton's) - say if it should be 0..127 unipolar. (c) The fader's light is one
cell at the finger's height in the heart's colour; a level bar from the bottom, or a bar from the
centre, or its own colour knob (a seventh - past TUNE-01's six unless one goes) are the
alternatives. (d) Should the swirl's light follow the wave (a square swirl, a saw swirl) or stay the
rate's picture? (e) Square is high for the first half of the cycle; Random is an arithmetic
sequence, the same after every power cycle (D-08's rule) - say if either should be otherwise.
(f) A shared ARC link minted before today lands `unreadable` (the stamp's length rule for an added
knob); say if the stamp should learn to land a shorter vector at the defaults (a change to the
stamp code, not made here). (g) Changes 1 to 5b's questions still stand.

## 2026-09-18 change 9 - MORPH's centre value is a knob

Outside the GSD cycle, the user's word recorded verbatim in `BENCH-2026-09-16.txt` section 9:
"Morph: should be able to setup the value of the center." Asked what that sets, the user answered
**a** - a `Centre` knob holding the CC value each corner sends when the finger is dead centre, the
blend reshaping around it so a corner still reaches 127 under the finger and the others fall
toward 0. One source commit, no push, no device, no deploy: `54acb09` feat(catalog) - the entry,
the VM proof, the two specs that moved with it, audition row 32 and the entry's history; then this
paragraph with the record's Done paragraph and the gate records `gate/change-9.*` (before, on an
isolated worktree at `8d4364e`) and `gate/change-9-after.*`.

**What the knob shapes, and the clause of the brief it cannot honour.** The brief asked that "the
weights' sum" survive. A blend that puts an arbitrary value in the middle cannot sum to 127 - dead
centre all four weights are the same number, and four of the same number sum to four times it - so
the reading taken is the only one available: `w = {u*v//127, x*v//127, u*y//127, x*y//127}` is
UNTOUCHED and still sums to the full range, and the knob is a map applied to each weight on its way
out. Every other clause of the card survives by construction, because nothing else reads a weight
after that line: the corner tap, 11-08's per-corner send-on-change, the dead margin, the comet, the
single-contact rule.

**The form, three costed, under the pinned `compressScript` after `padReady()`.** Each figure is the
Setup at the RGB444 picker corner (`@TRAILC` at 255,255,255, every other knob its longest literal),
a fixed point passing `checkSyntax`. _(i) chosen_ - two linear segments, breakpoint 32:
`z=z<32 and z*@CENTRE//32 or @CENTRE+(z-32)*(127-@CENTRE)//95`, **+46** rendered characters, the
one insertion the whole change makes. _(ii) rejected, and it is half the price_ -
`z=glim(z*@CENTRE//32,0,127)`, **+23**, rejected by measurement twice over: it cannot express a
centre below 32 at all (at 16 a corner reaches only `min(127, 127*16//32)` = 63, so "127 under the
finger" fails at every position that makes the middle quieter, which is half the feature), and
above 32 it saturates early (at 64 the macro reads 127 from weight 64 onward, 65 distinct values;
at 96 from weight 43, 44 distinct). _(iii) rejected_ - the branchless
`z=@CENTRE*glim(z,0,32)//32+(127-@CENTRE)*glim(z-32,0,95)//95` is the same map at all 128 weights
and costs **+51**.

**Budget: Setup 814 -> 860** at the picker corner (94 -> **48 free**, 30 under the 890
`BUDGET_ERROR` line at `_pad.ts:3076-3078`), 810 -> **856** at the defaults, 853 at `Centre` 0.
**THE TIMER SLOT WAS NOT NEEDED** and is still the empty string with 908 free, so neither the
`self:tim()` pattern nor the system slots (the user's stated last resort, section 7 of the record)
were approached. `@CENTRE`'s longest offered literal is two characters, the same as the default's,
so the picker corner does not move with the knob.

**The knob.** `centre` / `Centre`, kind `amount` (the vendored `KnobKind` union has no curve or
response kind and D-12 forbids a HANGAR-local one), token `@CENTRE` **three times** in the Setup,
values `0, 16, 32, 64, 96`, **default index 2 - the 32, today's behaviour**. It is the SIXTH knob
and is APPENDED, the house rule (TUNE-01's Phase 11 gate qualifier: "every knob added or re-cut
kept its arity or appended, never inserted"); TUNE-01's three-to-six holds and `catalog.spec.ts`
asserts it. `view.ts` resolves it with no edit: not `colour`, not a `WORD_KIND`, five integers past
`INTEGER_WORD_ROW_MAX` (2), so `widgetFor` returns `rail`, `railSkin(5)` is `dots` and
`integerReadout` gives the right-aligned number with `literals` present. It sits under **Behavior**
and Randomize ROLLS it - `isMidiDestination({id:"centre",label:"Centre"})` is false, so
`surprise.spec.ts`'s excluded set is unmoved at `morph: ccBase, channel`.

**127 is not offered, and the rejection is arithmetic.** At 127 the second segment is
`127+(z-32)*0//95`: every weight at or above 32 reads 127, leaving **33 distinct values over the
whole travel against 128 at the default**, a 95-step plateau, each macro pinned full across the
quadrant nearest its corner. 96 is the highest position that keeps the card playable (64 distinct).
Both figures are asserted in `lua-smoke.spec.ts` so the rejection cannot rot. **A centre of 0 is
kept**: the middle is silent (every weight under 32 maps to 0 and `self.p` starts at zeros, so a
press dead centre sends nothing and the four blocks are black) and nothing is stranded, because a
corner the finger leaves still sends its single 0 on the way out - 11-08's reading, asserted by name
in the stroke test. The question is put to the user all the same.

**The brightness follows the value SENT.** `glp(...,1,z*2)` reads the shaped `z`, because `z` is
reassigned before both the send and the paint - the same decision 11-08 took when it left the paint
unconditional ("the picture is a READOUT and the wire is TRAFFIC"). Painting the raw weight would
leave a pad at `Centre` 0 showing four dim corners while sending nothing.

**The VM proof** (`lua-smoke.spec.ts`, the 41st test, in the CONT-02 describe; the map, the
breakpoint, the margin and `self.k` all read off the entry's own template rather than typed):
(1) the default map is the exact integer identity at every one of the 128 weights - not a sample;
(2) at every position `f(0) = 0`, `f(127) = 127`, `f(32)` is the knob's own value, and the map never
falls; (3) 127's 33 distinct values against 96's 64 and the default's 128; (4) dead centre in the
real Lua host at every position - silent at 0, then 15/15/15/16, 31/31/31/32, 62/62/62/64,
93/93/93/96, the three-and-one split being integer division's (the weights there are 31, 31, 31, 32)
and not this change's; (5) every one of the nine cells of every corner block painted at phase `2*z`
of the value it SENT; (6) a press on (0,0) and on (127,127) sending exactly one message, 127, on
that corner's controller at every position; (7) the corner tap still one message at every position,
with the unguarded count printed beside it (4 at every position except `Centre` 0, where the shaping
silences three and the claim is stated as vacuous rather than claimed as proof), values
77 / 83 / 90 / 102 / 114; (8) the centre-to-corner diagonal at every position compared message for
message against a stream computed from the raw weights through the map and 11-08's send-on-change -
39 / 88 / 120 / 116 / 110 messages. **AND THE PROOF THAT WAS ALREADY THERE:** the pinned
`DIAGONAL_MORPH` literal in the corner-tap test - a 120-message capture taken at plan 12-09 - is
UNMOVED, which is the identity at the default stated as a byte comparison against history.
`stamp.spec.ts` declares MORPH's captured five-knob wild stamp `x54343f` as landing `unreadable` -
the payload-length rule for an ADDED knob, beside ARC's (change 6) and POMODORO's `older` for a
RESIZED one (11-09); the fixture is not regenerated. `brightness.ts` gains no declaration: the one
new arithmetic form sits on a PHASE, which the scaler never touches, and the coverage gate finds
nothing unreachable over the widened cross-product (525 -> 530 states, 7,281 -> 7,326 colour
arguments, the `linear` class 72 -> 82 - MORPH's two corner-hue coefficients times five new states).

**Counts, carried + delta:** quick 95 files / 980 passed + 1 todo -> **95 / 981 + 1 todo**
(+0 / +1), green twice at `--maxWorkers=2` plus the gate's; check 658 -> **658** (+0), 0 / 0; lint
clean; sweep `4 19` -> **`4 19`** green (`lua-entries` 1,207 -> **1,212** combinations, 2,414 ->
2,424 measurements; the kind cross-product's worst 906 of 908 unmoved; `reachability` untouched -
MORPH is not a compiler-driven rack); e2e 88 titles / 103 runs -> **88 / 103** (+0 / +0); audition
rows 31 -> **32**; OG 27 files unmoved; `frames.json`, the golden frames and the preset baseline
byte-identical. Specs moved: `lua-smoke` 40 -> **41**; `audition.spec` **thirty-two** (one title
retitled, `ROW_COUNT` 31 -> 32 with its ledger line); `stamp.spec` a **third** declared exception.
`catalog.spec`, `frames.spec`, `touch-guard`, `decay-idiom`, `brightness.spec`, `surprise.spec`,
`knobs.lua.spec`, `tune-ui.spec`, `view.spec`, `copy.spec` and `transfer.spec` pin nothing this
moves and were run green. `stamp-roundtrip.sweep`'s `exempted` stays 30 (no colour knob added).

**The gate, run on an ISOLATED worktree and why.** A second executor's change 6 was in flight in the
same working tree when this change began, so `--before change-9` was recorded on a `git worktree` at
`8d4364e` - the commit this change applies to, before change 6 landed - with this change's three
files copied in and nothing else, precisely so the wire's per-string diff could be MORPH's alone.
(`git diff --name-status` is therefore vacuous in that record - the worktree is detached at the
before-record's own HEAD; `git status --short` there is exactly 3 modified, 0 added, 0 deleted,
0 renamed, and the gate's refuse-list `--stat` is empty.) Terms (`--before change-9` at `8d4364e`,
`--after change-9 --against change-9 --check 658`): **equal** - the sandbox set `40b44316…`, all
four fixtures (`frames.json` `5166ff6c`, `golden-frames` `3a1d71da`, `preset-baseline` `eca808d2`,
`synthetic-zona` `8b78c396`), the **OG (27 files, 158,642 B, `f60a6363…`)**, the **RAW CSS
`56d81122…` and the SCOPED CSS `7f88b4f4…`**, the utilities **44 -> 44 (0 appeared, 0
disappeared)** with all five markup-named classes intact, the copy exports `7ec85d4a…`, the testids
`70dfe98a…` (317), check 658 / 0 / 0, lint, the build, the refuse-list `--stat` empty, no rename, no
deletion, no addition; **moved as a feature moves them** - the wire set `63e93f57…` -> `b7d8a046…`
and full `c1a61f4c…` -> `be9d843c…` (1,701 -> 1,711 strings) with the per-string diff **36 moved, 1
removed, 11 added, every single one of them `E/morph/`** (the 36 are the defaults, the corner and
every existing single-knob position on the Setup; the 1 removed and 1 of the added are the
cross-product key renamed by its own count, 6,400 -> 32,000 states; the other 10 added are the five
`centre=` positions on both events); the census `e12326a3…` -> `7ef5b807…` (2,721 -> 2,724 distinct
literals, the diff exactly eight lines: MORPH's Setup out and in, `"16"` 8 -> 9, `"32"` 1 -> 2,
`"64"` 1 -> 2, `"amount"` 28 -> 29, `"centre"` 7 -> 8, and `"96"`, `"@CENTRE"`, `"Centre"` new);
the titles `a2f9cfa8…` -> `1b4a7a79…` (980 -> 981 vitest titles, one added, none renamed;
103 playwright runs unmoved); the normalised JS `ae3b7779…` -> `d3ac54f3…` (72 files). The script
exits 1 at the wire by design; every later term above is compared from the two records.

**And the same diff CHAINED onto change 6's record, at the real HEAD `4ebb3d2`.** `hash-wire
--full --sandbox` on a clean worktree at `4ebb3d2` against the tree with this change: the SET
**`792c5de4…` -> `97a42874…`** (1,713 -> 1,723 strings), the FULL **`94189b0c…` -> `5e357a90…`**
(1,740 -> 1,750 records: **1,703 byte-identical, 36 moved, 1 removed, 11 added, 0 of them outside
`/morph/`**), the sandbox set `40b44316…` equal; the census **`4f1be00e…` -> `6b8c5116…`** (2,735 ->
2,738), the copy exports and the testids equal, with the same eight-line diff. (Those two after-side
hashes are the ones change 6's own record already carries, because this change sat uncommitted in
`morph.ts` when that gate read the tree - change 6's section says so; the clean-HEAD hashes above are
the true pre-change-9 baseline.)

**Chunks** (`scripts/gate/e2e-chunks.sh`, a fresh detached wrangler dev on 4173, stopped through
PowerShell, HTTP 000 after it; the user's 5173 untouched): c3 **21 passed** (tuning,
tuning-webkit; +0 - no e2e title names MORPH's rack, and the CC-field walk is ARC's). c1, c2, c4,
c5 not run: no install, session, browse, catalog, fidelity, first-experience, library, sandbox,
artifact, radius, skeleton or smoke title reads MORPH's knobs (`library.e2e`'s stored drafts are
EUCLID's and ARC's). e2e 88 titles / 103 runs unmoved, `--list` in both gate records.

**A gate finding, out of this change's scope and stated rather than fixed.** `scripts/13.2-gate.sh`
carries `QUICK_FILES=94` and `QUICK_TESTS=966` from 13.2-01, and `check-counts.mjs` asserts them
EXACTLY, so the gate's own quick term has printed `quick exit 1` in every record since change 5
widened the suite (`change-5b-after.txt` line 41, `change-6.txt` line 28, both `change-9` records).
It has never blocked anything, because the script exits at the census or the wire first on any
feature plan. The suite itself is green - 95 / 981 + 1 todo, run twice here - and the constants are
a one-line edit for whichever plan next owns that script.

**Outside `src/`:** `docs/HARDWARE-AUDITION.md` row **32** with its dated paragraph, and MORPH's
cost row 810 / 0 / 5 -> **856 / 0 / 6** (append-only otherwise; nothing re-padded, the Config cell
being narrower than the column); `docs/entries/morph.md` a dated section with the old literal
verbatim, the three forms costed and the price of an older link. `.planning/ROADMAP.md`,
`REQUIREMENTS.md` and `STATE.md` untouched; CAT-04 stays `[ ]`. No device, no deploy, no push;
`src/vendor/`, `library.ts`, `sequence.ts`, the manifest, `Knob.svelte`, `ColourPicker.svelte`,
`listing.ts`, `brightness.ts`, `view.ts` and every other entry untouched (the gate's `--stat` and
the wire's per-string diff).

**Departures from the brief, stated.** (1) THE BRIEF'S STRONGEST ASKED-FOR PROOF IS NOT
ACHIEVABLE: "at the default the two MORPH records must be byte-identical to today's". The Timer
record is (both are `""`); the Setup record cannot be, because the knob's arithmetic lives in the
Setup string and `renderLua` substitutes a VALUE, not an expression, so a default that rendered
today's text would need the whole two-segment map to be the knob's literal - which would make the
inspector show "Position 3 of 5" instead of a number and put five Lua expressions in the literal
census. What is byte-identical at the default is the BEHAVIOUR: the pinned 120-message stroke,
`frames.json`, the golden frames and the OG image, and the identity proved over all 128 weights.
(2) The knob's top value is **96, not 127** (measured above). (3) The values are `0, 16, 32, 64, 96`

- the brief's set with 127 replaced by its own suggested floor alternative, 16 - and `0` is kept.
  (4) `stamp.spec.ts` and `audition.spec.ts` were edited, which the brief's file list did not name:
  the first declares the older-link landing by name (the suite is red without it), the second carries
  the row count. (5) The gate ran on an isolated worktree rather than in the working tree, for the
  reason above.

**Questions for the user.** (a) **THE 0 FLOOR, above all:** at `Centre` 0 the middle of the pad is
silent and its four corner blocks are black, each macro opening only as the finger moves into its
half. Nothing is stuck (a corner the finger leaves sends its single 0), and it turns the card into
four gated quadrant macros - but say if the floor should be 16 instead, or if 0 should go.
(b) `127` is not offered because it flattens every weight at or above 32 to 127 (33 distinct values
against 128); say if you want it anyway as a deliberate "everything full" position. (c) The five
positions are `0, 16, 32, 64, 96` - say if you would rather have an even ladder (0 / 32 / 64 / 96)
or a finer one; each extra position costs nothing on the wire and one stamp character of nothing.
(d) Dead centre three corners land `C//32` under the knob's value and the fourth lands on it exactly
(62 / 62 / 62 / 64 at 64), because the weights there are 31, 31, 31, 32; a breakpoint of 31 would put
all four on the value exactly and would cost the byte-identical default. Say if the exactness is
worth more than the unchanged default. (e) Every MORPH link shared before today lands **unreadable**
and the card opens at its defaults (the stamp's payload-length rule for an added knob) - the same
price ARC paid at change 6; say if the stamp should learn to land a short vector instead (a change to
the stamp code, not made here). (f) The corner blocks are painted at the value SENT rather than the
raw weight; say if you would rather the picture stayed the blend. (g) Changes 1 to 6's questions
still stand.

## 2026-09-18 change 7 - CHORUS: the lowest chord bottom-left, twelve chromatic roots, two octave pads, Smart inversion

Outside the GSD cycle, the user's word recorded verbatim in `BENCH-2026-09-16.txt` section 7:
"Chorus: remove the randomization adn lock options. left bottom corner should be the legmélyebb
hang. Keys options should have sharp keys. Key options should be from C to B including sharp keys.
Two of the keys on the module should always be octave up and octave down because we only need 7
keys. Also research smart inversion and put a toggle option for it." - with the answers of the
same day (CHORUS only; C3..B3; the layout the executor's, made legible by colour; +-2 octaves, lit
to show the shift; Smart approved; Setup first, then the Timer, then a system slot only if
nothing else fits). Research first - four forms costed under the pinned `compressScript` after
`initLuaFormatter()` - then one source commit (`7c13cc3`, on `b322fd4`), then this section, the
record's Done paragraph and the gate records `gate/change-7.*` (before, at `b322fd4`) and
`gate/change-7-after.*`.

**The layout, and the colours that make it legible.** The pad of cell n is `n%9//3+6-n//27*3`
(it was `n%9//3+n//9//3*3`, pad 0 at the top-left): z 0..2 the bottom row left to right, 3..5
the middle row, 6 the top-left, so the seven diatonic degrees rise from the bottom-left corner the
user named (I ii iii / IV V vi / vii), and z 7 and 8 - the top row's middle and right-hand pads -
are Octave down and Octave up, beside the vii pad, down on the left and up on the right. The chord
pads keep the blue / violet chessboard (`0,60,120` / `80,40,140`, literals); the octave pads are
green (`0,180,60`, a literal - a knob would be a seventh) at phase 40 with no shift, 140 at one
octave and 240 at two on the pad that took the shift, the other staying at 40. A press past +2 or
-2 is refused (`glim(s.o+z*2-15,-2,2)`), never clamped into a wrong shift; an octave pad sends
nothing; the sounding chord keeps its notes and its note-offs are the notes it sent (`R` reads
`s.n`, never the table). The bloom's spread is the literal 12, the retired knob's default.

**Smart inversion, the form built.** `for k=-@INV,@INV` (Off `0`, Smart `2`): voice j of
candidate k is `h[(j+k-1)%3+1]+((j+k-1)//3+s.o)*12` - k 0 root position, 1 and 2 the first and
second inversion above, -1 and -2 the same two an octave down (Lua's floored `//` and `%` put them
there), so each inversion is tried in the octave nearest the previous chord; d is the sum over the
three voices of |c[j] - s.n[j]|, the least wins, a tie goes to root position (`d<m or d==m and
k==0`). `self.n` starts as the I chord's table, so a first press of I is root position at distance
0 and any other first chord is voiced as if from I. The three-candidate form (root and the two
inversions above only) was measured (759 / 602) and rejected on the VM: from C E G (48 52 55) it
voiced V as root position (55 59 62, sum 21) because the closest G - B2 D3 G3 (47 50 55, sum 3), the
G held and the two other voices a step down - lives below the root. Cost of the five-candidate
form over the three: +20 on the Setup.

**Budget, the four forms.** Every figure at the RGB444 picker corner, a fixed point passing
`checkSyntax`: _(i) everything in the Setup_ - **1,243**, 335 over; _(ii) the handler defined
from the Timer's first call_ - rejected without a figure: the VM's hosts press before they tick
(`open()` never runs the Timer, and every generic probe in `lua-smoke.spec.ts` would press a nil
handler), and a module pressed inside the first period after a Store would drop the chord the same
way; a note-on tolerates no lag; _(iii) the split_ - the Setup keeps the table, the state, `R` and
the whole handler (octave shift, voicing, note-ons, `s.b=z`), the Timer at `gtt(0,20)` with
`X(self,100)` (one hundred calls at 20 ms where twenty at 100 ms were - the same two-second window)
paints the picture on its first call, the octave pads' phase when the shift moved, and the bloom
for `s.b`: **759 / 602** with three candidates; _(iv) chosen_ - the five-candidate voicing over
(iii): Setup 822 -> **779** (86 -> 129 free), Timer 29 -> **602** (879 -> 306 free); 777 / 601 at
the defaults. No system slot was needed. `brightness.ts` gains no declaration: the three colour
sites that moved into the Timer are literals the scanner classes as such; test 4's figures are
779 / 602 at 255, 779 / 599 at 128, 773 / 586 at 1 (the Setup loses six at 1: the library finger call's white).

**The VM proof** (`lua-smoke.spec.ts`, the 41st test of the CONT-02 describe): at every one of
the twelve keys the bottom-left pad sends the I chord in root position (48+k, 52+k, 55+k at the
velocity knob's value); at C3 the seven pads walk I ii iii IV V vi vii with the lowest note rising
pad by pad (48 50 52 53 55 57 59); the octave pads: +1 gives 60/64/67, +2 72/76/79, a third press
refused (nothing sent, the picture unmoved), four presses down from +2 land -2 (24/28/31), a fifth
refused, the up pad's layer-1 phase 40 / 140 / 240 and the down pad's the mirror, both pads green
and a chord pad not, the picture dark before the first Timer call and lit after it; an octave
press under a held chord sends nothing, the held chord's note-offs are the notes it sent, the next
chord is shifted; every note inside 0..127; Smart: I 48/52/55 -> V 47/50/55 (Off: 55/59/62) -> I
48/52/55 -> vi 48/52/57, the note-offs the voiced notes; the range under Smart at both ends (B3
two octaves up, C3 two down, an order that walks the inversions) observed 26..95, inside the
header's 16..109. Two things this proof caught before the tree did: the octave step was written
`z*4-30` (two per press) and is `z*2-15`; and one stage expected the previous chord's note-offs on
the next press where the probe had already lifted. The older one-chord test moved with the Timer:
its window is spelled for one hundred calls at 20 ms (the release on the hundred-and-first, tick 202) and its wobble runs two hundred calls (the same four seconds).

**Change 1 - Randomize and the locks leave the CHORUS card.** A new optional field on
`CatalogEntry`, `rollable?: boolean` (absent true), read into `TuneView.rollable` by `model.ts`;
`TuningRegion.svelte` draws neither Randomize nor its Undo nor the all-held reason when it is
false and passes `lock={rollable}` to both racks; `KnobRack.svelte` gains a `lock` prop (default
true) forwarded to `Knob.svelte`'s existing `lock` prop. CHORUS declares `rollable: false`. The
colour block's own lock is `ColourPicker.svelte`'s and stays - that file is on the untouched list.
Every `data-testid` stays in the source (the testids hash is equal); no copy string moved (the
copy exports hash is equal); no style rule moved (the scoped CSS is equal).

**The knobs, six.** `@KEY` Key: the twelve chromatic roots 48..59 (was eight chosen roots with C3
the fifth), C3 first and the default - twelve is past `WORD_ROW_MAX` 8, so the knob is a rail,
and `model.ts` now gives a `note` knob's rail the note's name as its readout ("C#3"; no other card
has a note rail - every other note knob is a word row - so the rule reaches CHORUS alone);
`@SCALE` as it was; **`@INV` Smart inversion**, kind `mode`, literals `0` / `2` worded Off / Smart
by `view.ts`'s `INVERSION_WORDS` (read under `mode` after the dial's and the wave's words), Off the
default, in `bloomSpeed`'s slot; `@BLOOMC`, `@VEL`, `@CH` as they were. **`@SPREAD` (`bloomSpeed`)
is retired** - the seventh knob had to go and the user named neither Scale nor the bloom; its
value is the literal 12. `stamp.spec.ts` declares both captured CHORUS records: the default vector
(`key: 4`, a `bloomSpeed`) is no longer the defaults and encodes to a stamp (the entry's own
defaults still carry none), and the wild `xm75443f` lands `unreadable` - position 4 at the replaced
knob's slot is outside its two values, and the range check runs before the shape character; the
fixture is not regenerated.

**Counts, carried + delta:** quick 95 / 981 -> **95 / 982** (+0 / +1; the brief's 95 / 980 was
before change 9's +1), green twice at `--maxWorkers=2` (once alone, once inside the gate); check
658 -> **658** (+0), 0 / 0; lint clean; sweep `4 19` green (`lua-entries` 1,212 -> **1,213**
combinations - CHORUS's knob total 44 -> 45); e2e 88 titles / 103 runs -> **88 / 103** (+0 / +0);
audition rows 32 -> **33** (the brief's 31 was before change 9's row 32); OG 27 files, 158,745 ->
**158,644 B** (`chorus.png` 6,508 -> 6,407 B, 81 of 81 lit at the OG tick; `static/og/` is built,
not tracked); `frames.json` `79698b0d` -> `c153c746`, CHORUS's block alone (198 lit bytes at every
sampled tick -> 0 at tick 0 and 189 at 37, 101, 500 and 1,009: the picture is the Timer's first
call at 20 ms), byte-identical on a second regeneration and unmoved by the octave-step fix. Specs
moved: `lua-smoke` 40 -> 41 and the one-chord test's window, `stamp.spec` two declared exceptions
for CHORUS, `audition.spec` thirty-three; `catalog.spec`, `frames.spec`, `listing.spec`,
`touch-guard`, `decay-idiom`, `brightness.spec`, `view.spec`, `model.spec`, `tune-ui.spec` pin
nothing this moves. `utilities` 44 -> 44.

**The gate's terms** (`--before change-7` at `b322fd4` in a clean worktree with its own `npm ci`
and a fresh build; `--after change-7 --against change-7 --check 658` at `7c13cc3`): equal - the
sandbox set `40b44316…`, the three other fixtures (`golden-frames` `3a1d71da`, `preset-baseline`
`eca808d2`, `synthetic-zona` `8b78c396`), **the SCOPED CSS `7f88b4f4…`** (the raw CSS `56d81122…`
too), the utilities 44 -> 44 (0 appeared, 0 disappeared; the five named by markup intact), the
copy exports `7ec85d4a…`, the testids `70dfe98a…` (317), check 658, lint, the build (stamp
`7c13cc3`), the refuse-list `--stat` empty, no rename, no deletion; moved as a feature moves them -
the wire set `97a42874…` -> `25aada35…` and full `5e357a90…` -> `14ef80ae…`, 1,723 -> 1,725 records,
**1,630 byte-identical, 82 moved, 11 removed, 13 added, every one of them `E/chorus/`** (the
defaults, the corner, every single-knob position on both events, the ten `bloomSpeed=` pairs gone,
the four `key=8..11` and two `inversion=` pairs added, the cross-product key 76,800 -> 46,080
states) - no other executor's work sat in the tree at either run; the census `6b8c5116…` ->
`290eeeee…` (2,738 -> 2,747 literals: CHORUS's two literals and its sentence replaced, `36 41 43
45` gone and `49 51 53 54 56 57 59` arrived as roots, `@SPREAD` / `Bloom spread` / `bloomSpeed` /
`speed` down, `@INV` / `Smart inversion` / `inversion` / `Off` / `Smart` in, `mode` 26 -> 27, `note`
28 -> 30); the titles `3f2be85d…` -> `b5de55e2…` (982 -> 983 vitest titles, one added, one retitled:
"thirty-two" -> "thirty-three"; 103 playwright runs unmoved); the JS `9aaab2bd…` -> `f57bbcf0…` (72
files); the OG `a12c2393…` -> `67a7beec…`; `src/` 11 modified / 0 added / 0 deleted / 0 renamed.
The script exits 1 at the wire by design; the later terms are compared from the two records.

**Chunks** (`scripts/gate/e2e-chunks.sh`, a fresh detached wrangler dev on 4173 on the build at
`7c13cc3`, stopped through PowerShell, HTTP 000 after; the user's 5173 untouched): c3 **21 passed**
(tuning, tuning-webkit; +0 - no e2e names CHORUS's knobs or the Randomize control on CHORUS; the
titles that read `surprise-me` and `undo-randomize` open other cards, where both are drawn as
before). c1, c2, c4, c5 not run: no install, session, browse, catalog, fidelity, first-experience,
library, sandbox, artifact, radius, skeleton or smoke title reads CHORUS's knobs or its picture.
e2e 88 titles / 103 runs unmoved.

**Outside `src/`:** `docs/HARDWARE-AUDITION.md` row 33 and its dated paragraph, CHORUS's cost row
819 / 29 / 6 -> 777 / 601 / 6 (append-only otherwise: the row's cells are cut under the table's
widest so prettier re-pads no other row); `docs/entries/chorus.md` a dated section with the two old
literals verbatim and the forms costed; `.planning/ROADMAP.md`, `REQUIREMENTS.md` and `STATE.md`
untouched; CAT-04 stays `[ ]`. No device, no deploy, no push; `src/vendor/`, `library.ts`,
`sequence.ts`, the manifest, `Knob.svelte`, `ColourPicker.svelte`, every other entry untouched
(the gate's `--stat` and the wire's per-string diff).

**Deviations, stated.** (1) Files beyond the brief's list moved for change 1 - `types.ts`,
`model.ts`, `view.ts` (a word list and a `TuneView` field), `TuningRegion.svelte`,
`KnobRack.svelte` - because "remove the Randomize and Lock options" is the inspector's, not the
entry's; the picker's lock stays (above). (2) The Timer runs at 20 ms, not 100 (the window's
argument moved 20 -> 100 to keep two seconds); the picture, the octave indicator and the bloom are
the Timer's, so tick 0 is dark and the bloom can be one call behind the press. (3) A `note` rail's
readout is the note's name (`model.ts`), so the Key rail reads "C#3" rather than "49". (4) The
one-chord test's window and wobble counts were re-spelled for the new period. (5) The card
sentence changed (D-05's register: "Seven chord pads, the lowest at the bottom-left, two octave
pads, and a warm bloom from the pad you hit."). (6) The before record was first taken at `4ebb3d2`
and discarded when change 9 landed at `b322fd4` before this change's commit; it was re-recorded at
`b322fd4` in a worktree given its own `npm ci` - a first attempt with a `node_modules` junction was
abandoned after `git worktree remove` followed the junction into the real `node_modules` and
deleted `node_modules/.bin` (and whatever it reached before "Filename too long" stopped it); the
tree's `node_modules` was restored with `npm ci` from the untouched lockfile, `package.json` and
`package-lock.json` unmoved, and the worktree's first record - whose quick term failed on the two
build-reading specs for want of a build - was rebuilt and re-recorded after `npm run build` there.
(7) MORPH's change 9 committed before this change's source commit, so `git commit --only` swept
nothing of another executor's; the shared specs carry both changes' hunks by ordinary sequence.

**Questions for the user:** (a) The layout: the seven chords from the bottom-left, the two octave
pads on the top row beside the vii pad (down left, up right). The alternatives are the two top
corners, or both octave pads on the bottom row's right; say if another reads better under a hand.
(b) The octave pads are green (`0,180,60`, a literal); a knob for it would be a seventh, unless
Scale goes. (c) Smart is the least sum of voice movement over five candidates (root, each inversion
above and below), ties to root; say if it should search only upward, prefer the bass moving least,
or keep a chord inside a range. (d) The bloom and the octave pads' brightening are painted from the
Timer, at most 20 ms behind the press; say if the bloom should be the handler's again at the cost
of the octave indicator moving elsewhere. (e) The Key knob is a twelve-detent rail whose readout is
the note's name; a twelve-option select would move `WORD_ROW_MAX`, which two specs pin by name.
(f) Bloom spread is retired to keep six knobs; say if Scale should have gone instead. (g) The
picker's lock on the Bloom colour block stays because `ColourPicker.svelte` is not touched; say if
it should go too. (h) Older shared CHORUS links land `older` or `unreadable` (the stamp's rules).
(i) Changes 1 to 6 and 9's questions still stand.

## 2026-09-18 change 8 - EUCLID becomes ORBIT: a fourth ring, a colour and a typed note per ring, the tempo rail reversed, MIDI clock sync

Outside the GSD cycle, the user's word recorded verbatim in `BENCH-2026-09-16.txt` section 8:
"Euclid: rename it to smth crfeative. Add one more ring the farest one from the center. Tempo
slider is in the wrong direction the bigger tempo should be on right side. each ring should have
their own color. It should be able to get sync from a software or daw, its in the Editor,
implement that for the sequencer profiles. its under function called MIDI rtm callback handler.
Remove base not and you should be able to select a note for each ring from C -2 to G 8 so full
range." - with the six answers of the same day (Orbit; TUNE-01's six lifted for this card; Sync
plus a Division knob; 36 38 42 46; names and numbers both; the sync on ORBIT alone, saved as a
sequencer piece). The firmware read first (the sources on this machine, `../grid-fw`), two forms
costed under the pinned `compressScript` after `initLuaFormatter()`, then one source commit
(`c504753`, on `fd5e1bf`), then this section, the record's Done paragraph and the gate records
`gate/change-8.*` (before, at `fd5e1bf`, in a clean worktree `../hangar-gate-8` with its own
`npm ci` and build - never a junction) and `gate/change-8-after.*`.

**The rename.** `git mv` for the entry (`euclid.ts` -> `orbit.ts`), its history (`euclid.md` ->
`orbit.md`) and the e2e fixture; id `orbit`, name Orbit, `/playground/orbit/`, `orbit.png`. The
old address is the fourteenth dead one, recorded where the previous thirteen are: `local.spec.ts`'s
`REMOVED` (twelve -> thirteen ids, `KNOWN` reads `orbit`, the drop counted 13) beside the nine of
11-01, the three of 12-04 and `tpad` of 12-10 (TESTING.md's 13.2-06 item 18 counts the
addresses). `stamp.spec.ts` reads the fixture's two captured EUCLID records under ORBIT through a
`RENAMED` map (the fixture untouched): the default vector encodes to a stamp now - `tempo: 3` was
110 ms and is 140 on the reversed list - and the entry's own defaults still carry none; the wild
`x` stamp lands `unreadable` (fourteen knobs, two wide fields). `docs/HARDWARE-AUDITION.md` rows 2,
3 and 25's Config cells re-cased Euclid -> Orbit in place (13-19's way), their prose append-only.

**The clock idiom, and its evidence.** `grid-fw/common/src/lua/decode.lua:42-44`: `pass_rtm =
function(el, x) if el.rtmrx_cb then el:rtmrx_cb({ x[1], x[2], x[3] }, x[4]) end end` - a header
triple and ONE byte, so the spelling is `self.rtmrx_cb=function(s,h,b)`, exactly what the Editor's
face (`grid-editor/.../FunctionStartFace.svelte:27`, "MIDI Real-Time RX callback handler (clock,
start, stop, etc.)") offers as `self.rtmrx_cb(self, header, rtm)`. `grid_usb_midi.c:200-210` puts the
raw byte on the wire, `grid_decode.c:388` gates the class on `rx_mode` and `:420` pushes the byte;
`init.lua:10-15` has MIDIRTM off by default (`grxm(2,0)`) and `l_grid_rx_mode` (`grid_lua_api.c:832`)
needs a NUMBER as its mode. The package's `rx_mode` usage line agrees ("2=MIDIRTM ... 0x02=handle
\_external"); `midi_rx_register` (`gmrr`) is the voice-message registration and not the clock's road.
The Setup: `s.k=0 s.q=0`, `s.rtmrx_cb=function(s,h,b)if b==250 then s.k=0 s.q=0 end if b==250 or
b==251 then s.r=1 elseif b==252 then s.r=nil elseif b==248 and s.r then local f=s.f if s.q%@DIV==0
and f then f(s)end s.q=s.q+1 end end` and `grxm(2,@SYNC and 3 or 0)`; the Timer: `local function
f(s) ... end s.f=f if @SYNC then return end f(s)`. The callback reaches the routine through a
field READ (`local f=s.f`) because host-surface.spec.ts refuses a field call; 254 (active sensing)
runs nothing because the run test is `b==250 or b==251`, never `b>249`. Saved as an idiom in
`docs/entries/orbit.md` with a pointer in `docs/entries/library.md`, not a library function:
255/0 has 66 free and 255/6 35, the callback is ~170 characters and the step routine is the
entry's own. STEPS, RADAR POINTS and SONAR untouched. The one caveat: the routine is published by
the Timer's first call, at most one `@TEMPO` period after the Setup, so a clock inside that period
is counted, not stepped (the pattern stays in phase; the first step's notes are lost).

**Budget, the two forms.** (i) Everything in the Setup with the step routine there and the Timer
calling it: **976, 68 over**. (ii) chosen - the step routine, the twelve-channel colour table and
the four-note table in the Timer (the head colours its cell as it lights it), the callback in the
Setup, and the ring walk as one rotation (`local a,b=d,t%(d*2)-d for j=1,t//(d*2)do a,b=-b,a end`,
the same cell order, 50 cheaper): **Setup 726 -> 846** (182 -> 62 free), **Timer 237 -> 404** (671 ->
504 free); 843 / 383 at the defaults. No system slot. `brightness.ts` gains `orbit: { palettes:
["c"] }`. The Sync literal is a boolean folded to `3` or `0` (numeric `0` / `3` is four cheaper but
`0` is CHORUS's inversion literal in the mode table).

**The knobs, fourteen** (TUNE-01's six lifted for this card by the user's word, answer 2; the next
gate amends the rule, REQUIREMENTS untouched; `catalog.spec` and `knobs.lua.spec` admit fourteen on
ORBIT by name): `@TEMPO` Tempo `70 90 110 140 180 240` (the brief's "today's values reversed in
order", 110 still the default - the right end is the slowest; a BPM readout is a question below),
`@PULSES` Pulses `3,5,7,11 2,3,5,7 5,9,13,17 3,8,11,19 4,8,12,16 7,11,17,23`, **`@R1C`..`@R4C`
Ring 1..4 colour** (one palette; cyan, spring green, violet, white at the defaults), `@TRAIL` as it
was, **`@SYNC` Sync** (kind `mode`, `false` / `true` worded Internal / External by `view.ts`'s
`SYNC_WORDS`; `previewIndex: 0`), **`@DIV` Division** (`12 6 3` worded 8th / 16th / 32nd by
`DIVISION_WORDS`; 16th the default), **`@N1`..`@N4` Ring 1..4 MIDI note** (kind `note`, 0..127,
36 38 42 46 at the defaults - kick, snare, closed hat, open hat), `@CH`. **`@RINGC` and `@NOTE` are
retired.** The ring notes are MIDI destinations by their label's word (surprise.ts's predicate),
so they sit under MIDI output as typed fields and are never rolled; `surprise.spec`'s four-id pin
admits `note1..4` and its excluded set reads thirty-three.

**The typed note field.** `view.ts`'s `noteNumber` is the other direction of `noteName`, in its
spelling (C4 = 60, so 0 is C-1 and 127 is G9; Live's C-2..G8 is the same 0..127 an octave lower in
name): `C#3`, `Db3` and `49` all read 49, `H3`, `128`, `G#9` and `-1` are refused. `MidiField.svelte`
takes a name or a number for a `note` knob, refuses with `NOTE_OFFERED` ("A note here is C-1 to G9,
or 0 to 127."), shows the name as its readout and offers the full keyboard (`inputmode="text"`);
the pinned lines `problem = offeredLine(knob.id, literals)`, `problem = TYPE_A_NUMBER` and the cc
field's `inputmode="numeric"` stay. The stamp carries the index: a WIDE knob (past
`STAMP_OPTION_CEILING` 32) rides two base-32 characters, high first, on `w` and `x` (`fieldChars`,
`WIDE_FIELD_CHARS`, `luaPayloadLength`; `STAMP_WIDE_CEILING` 1,024); every rack without one is
encoded byte for byte as before. ORBIT's `w` payload is 28 characters. `knobs.lua.spec` names the
four wide knobs; `stamp-roundtrip.sweep` holds them in Pass A (39,720 vectors) and walks them in a
new Pass C (513); `hash-wire.mjs` samples a cross-product past a million states at every knob's
first / default / last (ORBIT's full product is 10^17; 629,856 hashed), every other entry as before.

**The preview.** `LuaKnob.previewIndex?` (types.ts) and `previewIndices` in `lua-pad-sim.ts`,
applied in `createLuaPadSim` alone: the browser renders Sync at Internal whatever the knob says
(no MIDI clock reaches a preview), while the wire, the meters and the stamp carry the choice;
`model.ts` names the held knobs in `TuneView.previewHeld` and `TuningRegion.svelte` shows
`PREVIEW_INTERNAL_CLOCK` under Behavior (`data-testid="preview-held"`). `lua-host.ts` gains
`rtm(byte)`, test-facing and synchronous - the call `decode.lua` makes - so the VM proof drives the
callback the way a DAW would and reads the routing gate off `rxMode`.

**The VM proof** (`lua-smoke.spec.ts`, the 42nd test of the CONT-02 describe): Internal asks
`grxm(2,0)`; the first Timer call sends an off then an on per ring on 36 38 42 46, channel 0; over
96 steps (1,056 ticks) the note-ons per ring are 36 / 30 / 28 / 33 - the pulses times the cycles,
so the outer ring proves its 32 steps by count - and the outer ring's pulses fall on steps 0 3 6
... 30; every ring cell carries its ring's colour on layer 2 after one cycle; External asks
`grxm(2,3)`, the Timer sends nothing and moves no step over three periods, clocks before Start do
nothing, the first clock after Start is step 0, the seventh is step 1 (the 16th), 200 Timer ticks
move nothing, Stop halts through twelve clocks and active sensing, Continue goes on from clock 7
and the count's twelfth clock is step 3, Start resets to 0; an 8th steps at clocks 13 and 25 after
Start and a 32nd at 4 and 7 when the first clock arrived before the Timer published the routine
(counted, not stepped); the words, `previewIndices` and the note field. The swipe test's
eligible set reads four rings (row 4's two outer cells toggle now); the gradient test's outer-ring
tap reads the third ring, and the naive divisor lands on the fourth (the wrong ring, where it used
to be no ring).

**Counts, carried + delta:** quick 95 / 982 + 1 todo -> **95 / 983 + 1 todo** (+0 / +1), green
twice at `--maxWorkers=2` (once alone, once inside the gate); check 658 -> **658** (+0), 0 / 0;
lint clean; sweep `4 19` green (`lua-entries` 1,213 -> **1,804** combinations; the Lua roundtrip
Pass A 39,720, Pass B 135,168, Pass C 513); e2e 88 titles / 103 runs -> **88 / 103** (+0 / +0; one
install title reads ORBIT); audition rows 33 -> **34**; OG 27 files, 158,644 -> **159,169 B**
(`euclid.png` 6,029 gone, `orbit.png` 6,554, 34 of 81 lit; built, not tracked); `frames.json`
`c153c746` -> `ccb860ca`, ORBIT's block alone (EUCLID's 30 / 45 / 50 / 51 / 45 lit bytes at ticks
0 / 37 / 101 / 500 / 1,009 -> ORBIT's 52 / 74 / 82 / 81 / 74), byte-identical on a second
regeneration; `utilities` 44 -> **44**; catalog 27 -> **27**. Specs moved: `lua-smoke` 41 -> 42 and
three retitled, `stamp.spec` (the rename map, the length rule), `knobs.lua.spec` (one retitled),
`stamp-roundtrip.sweep` (Pass C, `exempted` 30 -> 33, `wide` 4), `surprise.spec` (one retitled),
`local.spec`, `audition.spec` (one retitled), `colour-picker.spec` (12 / 7 / 4 / 4: ORBIT's four
colour knobs count with the three-colour entries), `catalog.spec`, `view.spec`, `model.spec`,
`state.spec`, `url.spec`, `copy.spec`, `filter.spec`, `collections.spec`, `transfer.spec`,
`config-shape.spec`, `wire-pin.spec`; `install.e2e`'s picture check is a ratio band 0.42..0.58
(the first c1 run read 221 -> 118, 8 off half: ORBIT's white outer head over an orange marker sums
two layers and the brightest channel moves with the head's phase at the sample).

**The gate's terms** (`--before change-8` at `fd5e1bf` in the clean worktree; `--after change-8
--against change-8 --check 658` at `c504753`, dirty 1 - the gate script's constants, below):
equal - the sandbox set `40b44316…`, the three other fixtures (`golden-frames` `3a1d71da`,
`preset-baseline` `eca808d2`, `synthetic-zona` `8b78c396`), **the SCOPED CSS `7f88b4f4…`** (the raw
CSS `56d81122…` too), the utilities 44 -> 44 (0 appeared, 0 disappeared; the five named by markup
intact), check 658, lint, the build (stamp `c504753`), the refuse-list `--stat` empty; moved as a
feature moves them - the wire set `25aada35…` -> `75d0c1eb…` and full `14ef80ae…` -> `5c2e7227…`,
1,752 -> 2,802 records, **1,657 byte-identical, 0 moved, 95 removed - every one `E/euclid/` - and
1,145 added - every one `E/orbit/`**, the cross-product key `E/euclid/cross-product (100800
states)` -> `E/orbit/cross-product (629856 states)` (the sampled product); the census `290eeeee…`
-> `991aab0d…` (2,747 -> 2,783 literals: EUCLID's two strings, its sentence and its pulse triples
gone, ORBIT's strings, the quadruples, `false` / `true`, `Internal` / `External`, `8th` / `16th` /
`32nd`, the ring labels and the two copy lines in); the copy exports `7ec85d4a…` -> `071be34f…`
(`NOTE_OFFERED`, `PREVIEW_INTERNAL_CLOCK`); the testids `70dfe98a…` -> `74e0cfd6…` (317 -> 318:
`preview-held`); `frames.json` (above); the OG `67a7beec…` -> `9becd682…`; the titles `b5de55e2…`
-> `39b22413…` (983 -> 984 vitest titles: one added, six retitled by the rename or a count;
103 playwright runs, one retitled); the JS `f57bbcf0…` -> `062043aa…` (72 files); `src/` 34
modified / 1 added / 1 deleted / 0 renamed (git reads the entry as a delete and an add: most of
its text moved). The script exits 1 at the wire by design; the later terms are compared from the
two records. `scripts/13.2-gate.sh`'s `QUICK_FILES=94` / `QUICK_TESTS=966` had been stale since
change 5 (the gate's quick term printed `quick exit 1` in every record since, the before-record
of this change included); they read **95 / 983** now - the figures this change's runs prove -
and the header comment with them, the only edit to that script, landed in the docs commit.

**Chunks** (`scripts/gate/e2e-chunks.sh`, a fresh detached wrangler dev on 4173 per chunk on the
build at `c504753`, stopped through PowerShell, HTTP 000 after each; the user's 5173 untouched):
c1 **1 failed / 32 passed** at three workers (the install title, the ±6 tolerance above), then
**33 passed** (rerun `c1-rerun`) after the band; c2 **2 failed / 20 passed** at three workers
(`browse:299`, `:343` - the grid read before hydration, the flake changes 3, 4 and 6 recorded),
then **22 passed** at `--workers 1` on a fresh server (rerun `c2-w1-change8`, the script's body
with one flag and its `cd` changed, run from the scratchpad); c3 **21 passed**; c4 **16 passed**
(catalog, fidelity, first-experience, library - the ORBIT fixture import, sandbox); c5 **11 passed**
(artifacts - `orbit.png` served, radius, skeleton, smoke). Every chunk run: the rename reaches
install, browse, first-experience, library and the artifacts.

**Outside `src/`:** `docs/HARDWARE-AUDITION.md` row 34 and its dated paragraph, rows 2 / 3 / 25's
cells, the cost row `euclid 722 / 233 / 6` -> `orbit 843 / 383 / 14`; `docs/entries/orbit.md` (the
old header and both old strings verbatim, the forms costed, the clock idiom with its evidence,
what moved); `docs/entries/library.md` a dated pointer (its section 5 still says EUCLID where it
means ORBIT: `library.ts` is on the untouched list and the doc mirrors it); `e2e/fixtures/library/
orbit-copy.hangar.json` a real export through `transfer.ts` (fourteen knobs). `.planning/ROADMAP.md`,
`REQUIREMENTS.md` and `STATE.md` untouched; CAT-04 stays `[ ]`. No device, no deploy, no push;
`src/vendor/`, `library.ts`, `sequence.ts`, the manifest, `Knob.svelte`, `ColourPicker.svelte`,
`pad-sim.ts`, `firmware-oracle.spec.ts`, every other entry untouched (the gate's `--stat` and the
wire's per-string diff).

**Deviations, stated.** (1) Files beyond the brief's list moved for the typed field, the preview
and the stamp - `types.ts`, `lua-pad-sim.ts`, `model.ts`, `view.ts`, `inspector-copy.ts`,
`MidiField.svelte`, `TuningRegion.svelte`, `stamp.ts`, `knobs.lua.ts`, `lua-host.ts`,
`hash-wire.mjs` - because a 128-option knob overflows one stamp character, a name needs a parser,
and the browser has no clock. (2) The copy exports and the testids moved beyond the rename: two
copy lines (`NOTE_OFFERED`, `PREVIEW_INTERNAL_CLOCK`) and one testid (`preview-held`), each what
"says so" costs. (3) `hash-wire.mjs` samples ORBIT's product (above): the full product is 10^17
and cannot be hashed; every other entry's record is byte-identical. (4) The note range is spelled
C-1..G9 (`noteName`'s C4 = 60), not the brief's C-2..G8 - the same 0..127; the field must
round-trip its own readout (CHORUS's Key reads "C3" for 48 by the same rule). (5) The Tempo list
is reversed as the brief spelled it, so the right end reads 240 and is the slowest step. (6) The
picture check in `install.e2e` is a ratio band (above). (7) The colour-picker split re-recorded:
ORBIT's four colour knobs land in the three-or-more bucket. (8) `library.md`'s stale EUCLID names
in its section 5 are left, mirroring the untouched `library.ts`. (9) The card sentence changed
(D-05's register: "Four Euclidean rings, a colour and a note each, on their tempo or your DAW’s
clock; tap a step to change it."). (10) The clock arrives at the callback within the Timer's first
period unpublished (above).

**Questions for the user.** (a) Tempo: the list reads 70..240 ms left to right as the brief spelled
the reversal, so the bigger number is on the right and it is the SLOWER step; a BPM readout
(`gtt(0,15000//@BPM)`, +7 on each event, the same six periods to a millisecond: 214 167 136 107 83 62) would put the bigger number and the faster tempo on the right together - say which. (b) The
note field spells 0..127 as C-1..G9 (the readout's rule); Live writes the same range C-2..G8 - say
if the readout should move to Live's spelling everywhere (CHORUS's Key would read "C2"). (c) Under
External the rings wait for Start (or Continue); clock alone runs nothing - say if clock alone
should run them. (d) The routine the clock steps through is published by the Timer's first call,
so a clock inside the first `@TEMPO` period after a Store is counted and not stepped. (e) The
browser preview holds Sync at Internal and says so; say if you would rather the preview stood
still under External. (f) Ring 4's default colour is white; the OG and the card show it over the
orange markers. (g) The pulse sets for four rings are the executor's (`3,5,7,11` the default).
(h) Every EUCLID link shared before today lands `unreadable` and the card opens at its defaults.
(i) TUNE-01's six-knob rule needs its amendment at the next gate. (j) Changes 1 to 7 and 9's
questions still stand.

## 2026-09-18 change 8b - ORBIT's Tempo rail reads BPM, ascending

The coordinator's follow-up to change 8's question (a): "bigger tempo on the right side" means
FASTER on the right, and a bigger millisecond period is the opposite. One source commit
(`3d91f2b`, on `a86acdc`), then this section, a dated 8b paragraph under section 8's Done and
the gate records `gate/change-8b.*` (before, at `a86acdc`, in a clean worktree
`../hangar-gate-8b` with its own `npm ci` and build) and `gate/change-8b-after.*`.

**The form built.** `@TEMPO` (a period in ms) is `@BPM` and both events read
`gtt(0,15000//@BPM)` - a 16th at that tempo. **The knob's id stays `tempo`** (label "Tempo (BPM)"):
the stamp, the e2e fixture's rack and every spec that names the knob read the id, so renaming it
would have moved the fixture and a dozen specs for nothing; only the token moved, which costs the
plumbing nothing. **The ladder: `60 90 110 136 160 200`**, ascending - 250 166 136 110 93 75 ms a
step - **136 the default**, because `15000//136` is exactly the 110 ms step EUCLID and change 8
had, so `frames.json` is unmoved (regenerated, byte-identical, `ccb860ca`) and so is the OG. A
"clean" 60 / 80 / 100 / 120 / 140 / 170 would have put the default at 140 (107 ms) and moved the
rest frame; 136 is the honest anchor and the five around it are musical tempos. `view.ts` has no
unit path for a readout, so the readout is the bare number and the label carries the unit.

**Costs at the RGB444 picker corner** (pinned `compressScript` after `initLuaFormatter()`):
Setup 846 -> **853** (62 -> 55 free; 850 at the defaults), Timer 404 -> **411** (504 -> 497 free;
390 at the defaults) - the +7 per event the form was costed at under change 8. No system slot.

**Specs.** `lua-smoke`'s ORBIT proof asserts the ladder and derives its period from the knob
(`15000//136` = 110 ms, 11 ticks); `stamp.spec`: the captured EUCLID default vector (`tempo: 3`)
is the defaults again under ORBIT - index 3 is the 110 ms step once more - so its branch asserts
the plain `undefined`. No title moved.

**Counts, carried + delta:** quick 95 / 983 + 1 todo -> **95 / 983 + 1 todo**, green twice at
`--maxWorkers=2` (once alone, once inside the gate); check **658**; lint clean; sweep `4 19`
green (`lua-entries` 1,804); e2e **88 / 103**; audition rows **34**; OG 27 files, 159,169 B
unmoved; `frames.json` unmoved; utilities **44**; catalog **27**.

**The gate's terms** (`--before change-8b` at `a86acdc`; `--after change-8b --against change-8b
--check 658` at `3d91f2b`): equal - the sandbox set `40b44316…`, all four fixtures, the OG
`9becd682…`, the SCOPED CSS `7f88b4f4…`, the utilities 44 -> 44 (0 appeared, 0 disappeared), the
copy exports `071be34f…`, the testids `74e0cfd6…` (318), the titles `39b22413…` (984 vitest, 103
playwright - none moved), check 658, lint, the build (stamp `3d91f2b`), the refuse-list `--stat`
empty, no rename, no addition, no deletion; moved as a feature moves it - **the wire set
`75d0c1eb…` -> `7cda3c4b…` and full `5c2e7227…` -> `bcf8063c…`, 2,802 records: 1,657
byte-identical, 1,145 moved, every one of them `E/orbit/`, 0 removed, 0 added, 0 outside**; the
census `991aab0d…` -> `8995adf5…` (ORBIT's two strings, `@TEMPO` -> `@BPM`, `Tempo` -> `Tempo
(BPM)`, the six values); the JS `062043aa…` -> `a354133c…`; `src/` 3 modified. The script exits 1
at the wire by design.

**Chunks** (a fresh detached wrangler dev on 4173 on the build at `3d91f2b`, stopped through
PowerShell, HTTP 000 after; the user's 5173 untouched): c3 **21 passed** (tuning, tuning-webkit).
c1 not run: no title reads the tempo (the install title reads ORBIT's knobs by token, and the
token substitution is generic).

**Outside `src/`:** `docs/HARDWARE-AUDITION.md` row 34's clause (f) re-worded (the row is this
change's own, appended today), a dated "Row 34 (amended 2026-09-18, change 8b)" paragraph, the
cost row 843 / 383 -> 850 / 390; `docs/entries/orbit.md` a change 8b section. No device, no
deploy, no push; `library.ts`, every other entry, the untouched list as before.

**Deviations, stated.** The token is renamed and the id is not (above). The ladder is not the
coordinator's example (60 80 100 120 140 170 / 140) because 140 BPM is 107 ms and would move the
rest frame; 136 keeps it. Question (a) of change 8 is answered by this change; (b)-(j) still stand.

## 2026-09-18 change 10A - the Sandbox's editor: the selector, hotkeys, a body drag, a delete icon, a Blank, and no number about the budget

Part A of `BENCH-2026-09-16.txt` section 10 (answers 1a, 2, 3b, 4 and 12; part B - the MIDI
options, the modes, the animations, the budget - is the next executor's). Two source commits (`e2947fc`
feat(sandbox) - the model, the emitter, the schema, the copy, the four components, the route, six
specs and two e2e files; `e14fd6e` chore(gate) - the blank fixture by name and the gate script's
quick constant), no push, no device, no deploy; then this section, the Done paragraph "10A" under
section 10, a dated paragraph in `docs/INSTALL-RUNBOOK.md`, a section in
`docs/entries/sandbox-runtime.md`, and the gate records `gate/change-10a.*` (before, at `51e8ff7`,
on a clean worktree `../hangar-gate-10a` with its own `npm ci` and build; removed after the records
were copied) and `gate/change-10a-after.*` (at `e14fd6e`).

**What moved in the suites.** `sandbox-ui.spec.ts` 9 -> 11 titles: 1 re-worded (the empty state's
line is not the Bible's verbatim any more, and the five palette rows show their key), 2 rewritten
(the selector, the sticky arming, the hotkey map, the route's listener guards, the plate's
pointer-move and pointer-down scans, the keyboard route), 3 (+ the delete icon), 4 (five rows
disabled; the MIDI fields read-only; a nudge refused in Play), 5 rewritten around the three MIDI
fields and the plate's routes, 6 (the move is three arrow presses under `nudge:<id>`, the resize two
Shift-presses under `grow:<id>`; the cap by sixteen blanks from one arming, the seventeenth click
refused with the numberless line), 7 and 8 (`cancel()` between armings; blanks where an area was),
10 new (`moveSelectedTo` one entry, refused on overlap / off-plate, no-op on the same cell, silent in
Play; the arrows' coalescing until `commitField`; the icon's 20 / 44 squares and the plate's wiring;
the panel without the block, the select or a meter; no digit in the three refusals, no `908` in
`copy.ts` or the route), 11 new (the blank: `L`, 1 x 1, `cc: 0`, the next fader still on controller
1, moved / resized / refused at 0 wide, no MIDI section, the list row, the palette row's key, the
plate's mark with no chip, sixteen of them reach the cap, and `isStoredRecord` on a four-kind
record, a blank record and an unknown kind). `emit.spec.ts` 6 -> 7: the blank's form (its row, the
negated cells, the fallback once, the runtime untouched, a blankless surface byte-identical), its
cost (+72 on page 3 with a 2 x 2 and a 1 x 1: two rows of 27, two commas, the fallback 11 and one
minus sign per covered cell), and the VM (the rest frame lit, a press and a move on the blank leave
the frame and the MIDI log untouched, the fader beside it sends and moves the frame).
`geometry.spec.ts` test 4 reads `GEOMETRY_COPY.cap` as a string and asserts no digit;
`install.spec.ts`'s over-budget title reads `TOO_FULL_TO_STORE` (no digit) beside the landing's
numbers; `tune-ui.spec.ts`'s meter assertion is re-aimed to ZERO mounts on the Sandbox route and no
`908` on it (`BudgetMeter.svelte` stays on `TUNING_COMPONENTS`, unmounted). `e2e/sandbox.e2e.ts` 5 ->
6 titles: the first re-worded (the palette arms and stays armed, the controller field's refusal,
`B` on the plate, `V`, a click on empty clearing, `f` in the name field arming nothing, no meter
and no `908` on the page), the drag title reads the units chip instead of the fields and presses
`V` before dragging, the fourth new (the selector's walk: `F`, a click, `V`, the body drag to (4, 3),
`L` and a blank with no MIDI fields, a refused drag onto the blank with section 16's line, Left /
Shift+Right / Shift+Up, the delete icon, one Undo, the Delete key); `e2e/radius.e2e.ts` reads
`field-cc` and `surface-delete` where it read `field-w`.

**Counts, carried + delta:** quick 95 / 983 + 1 todo -> **95 / 986 + 1 todo** (+0 / +3), green
twice at `--maxWorkers=2` (`quick-A`, `quick-B`) plus the gate's; check 658 -> **658**, 0 / 0; lint
clean; sweep `4 19` green (`lua-entries` 1,804 combinations); e2e 88 titles / 103 runs -> **89 /
104** (+1 / +1); utilities **44** -> **44** (0 appeared, 0 disappeared); catalog **27**, no entry
touched; testids 318 -> **316** (source-level values: `geometry-grid`, `kind-problem`,
`surface-meters`, `meter-line` gone; `surface-delete`, `orientation-problem` new; `field-col` /
`field-row` / `field-w` / `field-h` were one `field-{field}` template, still there for the MIDI
fields; `palette-blank` is the `palette-{kind}` template); OG 27 files, 159,169 B unmoved;
`frames.json`, the golden frames, the preset baseline and the synthetic ZONA byte-identical.

**The gate's terms** (`--before change-10a` at `51e8ff7`; `--after change-10a --against
change-10a --check 658` at `e14fd6e`): equal - the wire set `7cda3c4b…` and full `bcf8063c…` (every catalog string byte-identical:
no entry touched), all four fixtures by hash-object, the OG 27 files / 159,169 B `9becd682…`, the
utilities 44 -> 44 (0 appeared, 0 disappeared), check 658, lint, quick exit 0 (986 + 1 todo, the
constant moved with it), the build (stamp `e14fd6e`), the refuse-list `--stat` empty, `src/` 18
modified / 0 added / 0 deleted / 0 renamed; moved as a feature moves them - **the sandbox set
`40b44316…` -> `5fcc2955…`: 154 -> 168 records, 154 byte-identical, 0 moved, 0 removed, 14
added, every one of them `S/emit/page3-blanks/`** (the new fixture's landed five, its emitted
three under two and three slots, and at the corner); the census `8995adf5…` -> `522c873a…`
(2,784 -> 2,779 literals: the thirteen retired copy strings, `area` 7 -> 0, `retype` and `started`
2 -> 0, the `$lib/sandbox/cost` specifier 2 -> 0, the `-type` / `-kind-problem` ids; added `Blank`,
`blank` 0 -> 11, the three numberless refusals, the two blank throws, `delete-hit` / `delete-box` /
`delete-glyph`, `escape`, `backspace`, `-orientation-problem`); the copy exports `071be34f…` ->
`27be101c…`; the testids `74e0cfd6…` -> `017609a1…` (318 -> 316); the SCOPED CSS `7f88b4f4…` ->
`e7045f06…` (the Sandbox's own rules: `.plate` cursor default, `.plate.armed`, `.region.selected
.body`, `.delete-hit` / `.delete-box` / `.delete-glyph` in SurfaceEditor; `.side` -> `.key` and
`.row[aria-pressed="true"] .key` in Palette; `.value` added and `.meter` gone in RegionInspector;
`.meters`, `.meter-line`, `.meter-line.over` gone from the route) and the raw CSS `56d81122…` ->
`8c4ed778…`; the titles `39b22413…` -> `fa250c25…` (984 -> 987 vitest: two added, one retitled
in emit and three retitled in sandbox-ui; 103 -> 104 playwright: one added, one retitled); the JS
`a354133c…` -> `e131c040…` (72 -> 71 files: the route's own `cost` chunk went with the meter).
The script exits 1 at the sandbox set by design; the later terms are compared from the two
records. The first `--after` at `e2947fc` (before the fixture) recorded the same wire, census,
copy-export, testid, CSS and JS hashes and `quick exit 1` on the stale 983 (its JSON: 986 passed,
0 failed); it was overwritten by the re-take.

**Chunks** (fresh detached wrangler dev on 4173 on the build at `e2947fc`, stopped through
PowerShell, HTTP 000 after each; the user's 5173 untouched): c4 **17 passed** (catalog, fidelity,
first-experience, library, sandbox - the six Sandbox titles among them); c5 **11 passed**
(artifacts, radius - its one title walks the Sandbox route to the knob's panel and the delete icon

- skeleton, smoke); c2 **3 failed / 19 passed** at three workers (`browse:299`, `:343` - the grid
  read before hydration, the flake changes 3, 4 and 6 recorded - and `:1186`, the same shape, "locator
  resolved to 27 elements"; the title that names a Sandbox surface, `:1672`, passed), then **22
  passed** at `--workers 1` on a fresh server (rerun `c2-w1-change10a`, the script's body with one
  flag changed, run from the scratchpad). c1 and c3 not run: no install, session, tuning or
  tuning-webkit title reads the Sandbox.

**Outside `src/`:** `docs/INSTALL-RUNBOOK.md` gains a dated read-through paragraph (the Sandbox rows
under the selector, the hotkeys, no position block, no meter, the Blank; the moved test ids);
`docs/entries/sandbox-runtime.md` a section on the blank's four candidate forms, the one kept and
its cost; `scripts/gate/sandbox-fixtures.mjs` the `emit/page3-blanks` fixture; `scripts/13.2-gate.sh`
`QUICK_TESTS` 983 -> 986. No device, no deploy, no push; `src/vendor/`, `library.ts`, every entry,
`sequence.ts`, the manifest, `Knob.svelte`, `ColourPicker.svelte`, `pad-sim.ts`,
`firmware-oracle.spec.ts` untouched; no `border-radius` anywhere (the radius gate's layers A and B
green on the fresh build).

**Deviations, stated.** The Bible's section 8 empty-state sentence is re-worded (area selection
went with answer 1a); `tune-ui.spec.ts` and `tune/copy.ts` were edited though the brief's file list
did not name them (the first pinned the Sandbox's two meter mounts, the second's ledger line named
the room line); `BudgetMeter.svelte` is unmounted and kept (its by-name deletion is a question);
the route no longer calls `costOf` (still pinned by `emit.spec.ts`); the first `--after` record
(at `e2947fc`, before the fixture) was overwritten by the re-take at `e14fd6e` - `--after` records
are not baselines; the gate's quick term at `e2947fc` printed `quick exit 1` on the stale constant
(the JSON: 986 passed, 0 failed), which is why the constant moved in `e14fd6e`.

## 2026-09-18 change 10B - the Sandbox's behaviour: min and max, relative and spring faders, CC or note buttons with radio groups, relative knobs, the pictures on the module, the trimmed library and five slots

Part B of `BENCH-2026-09-16.txt` section 10 (answers 5 to 12 and the readings). Five source commits
(`e8b3d07` feat(sandbox) - the schema's optional fields and the model's readers; `4685f38`
feat(sandbox) - the runtime, the emitter, `library-trim.ts`, five slots, the cost model and the
landing, `runtime.spec.ts` / `emit.spec.ts` / `install.spec.ts`, the wire harness; `3381d5a`
feat(sandbox) - the editor, the copy, the inspector, the plate, the route, `sandbox-ui.spec.ts`;
`4e37b99` chore(sandbox) - four headers back at the ten-line rule; `f4c0216` test(sandbox) - the
e2e walk and the gate's quick constant), no push, no device, no deploy; then this section, the Done
paragraph "10B" under section 10, a dated paragraph in `docs/INSTALL-RUNBOOK.md`, a section in
`docs/entries/sandbox-runtime.md`, and the gate records `gate/change-10b.*` (before, at `654ee60`,
on a clean worktree `../hangar-gate-10b` with its own `npm ci`; removed after the records were
copied) and `gate/change-10b-after.*` (at `f4c0216`).

**What moved in the suites.** `runtime.spec.ts` 7 -> 14 titles, every new one in the VM on the
TRIMMED halves under five slots: 3 retitled (the box, not the frame), 6 rewritten (every slot count
and every fixture through the gates; the runtime defines `S F I R O Q D K` - none a trimmed
global, `Q D K` among the names the trim frees - and calls `E N U X`, never `G`), 7 rewritten (the
parts; every combination of kinds under two, three and five slots - two carry none, three one kind
alone, five every one; page 3 under all three; the pins), 8 new (min and max on every kind, the
inversion, the XY pad's one pair, the button's off and on), 9 new (Relative at Half and Full: the
touch sends nothing, 13 and 38 then 26 and 77 for the same two moves, held across touches,
clamped at 0 once; the XY pad per axis), 10 new (Spring: 127 then 64 on the lift and the bar at
three rows; Relative with the spring at 100: 121, 100, 121, 100), 11 new (a note output's 144 /
128 at C4, the toggle's second press, the radio group across three buttons with One's off before
Two's on), 12 new (the three encodings up and down, the detents crossed in one sample, the cap
22 by construction, a scaled two's-complement knob sending 1 all the same), 13 new (the pictures
on layer 2 per kind and mode, layer 1's 48 untouched, the held bar and the sector), 14 new (the
trim: 842 -> 460 and 873 -> 9, the twelve trimmed globals, every fixture pressed, moved and lifted
on every region with no error). `emit.spec.ts` 7 -> 8: 1 rewritten (two, three and five slots;
the dearest sixteen at 892; the cap floor from twelve 15 and from empty 11 with the option-laden
representative), 2 rewritten (the dead-branch pair through the split, 1,867 / 3,394 / 1,527; the
inline contingency retired), 3 (the box, the tail, a knob's centre 64, 83 and the even-width
midpoint), 4 and 5 (every slot count; `OWN_NAMES` `J M`; no capital call in the data half), 6
(the five-slot halves carry no colour), 7 (on the trimmed halves), 8 new (the tail's trimming, the
flag word, the price per option, the pack, the landing's five strings the trimmed halves and
canonical, three slots' first refusal the Timer). `install.spec.ts`'s landing reads the trimmed
halves (`startsWith(TRIMMED_LIBRARY)`, never the full library) and every one of the five canonical.
`sandbox-ui.spec.ts` 11 -> 12: 5 pins the seven typed fields, 12 new (six option entries on a
fader undone and redone, the refusals `VALUE_RANGE` / `NOTE_RANGE` with the model untouched, a
knob's mode refused on a fader, a group off its range refused, Play locking every setter and
select; the panel's fields per kind, `field-toggle` never `field-latch`, the note field reading
`C4`, Min and Max gone under a relative knob with the helper that says so, no Behavior on a
blank; `copy.ts` never spelling Latch; the route's five wires; a record with every field reads and
`sideways` / 9 / 128 / `fast` are refused whole). `e2e/sandbox.e2e.ts` 6 -> 7 titles: the loop on
the fake asserts 255/6 and 255/0 open with the trimmed library and 255/4 with the runtime's head;
the seventh new (the options walk: F, Relative, Full, Spring, 200 refused and 100 typed, Min 127 /
Max 0; B, Toggle, Note, `H3` refused and `C#3` typed, Group 3; K, Relative (2's comp.) taking Min
and Max away, one Undo bringing Min back; the draft recovered on a reload with every field).

**Counts, carried + delta:** quick 95 / 986 + 1 todo -> **95 / 995 + 1 todo** (+0 / +9: `runtime`
7 -> 14, `emit` 7 -> 8, `sandbox-ui` 11 -> 12), green at `--maxWorkers=2` (`quick-A` 45.1 s,
`quick-B` 54.2 s); check 658 -> **659** (+1: `library-trim.ts`), 0 / 0; lint clean; sweep
`4 19` green (`lua-entries` 1,804 combinations, worst 906 of 908); e2e 89 titles / 104 runs ->
**90 / 105** (+1 / +1: the options walk); utilities **44** -> **44** (0 appeared, 0 disappeared -
`absolute`, `relative`, `inline`, `hidden` and `fixed` were among the 44 already); catalog **27**,
no entry touched; testids 316 -> **319** (`field-latch` gone; `field-toggle`, `field-mode`,
`field-speed`, `field-spring`, `field-output`, `field-group` new; `field-spring-value`,
`field-note`, `field-min` and `field-max` are the `field-{FIELD_IDS[field]}` template); OG 27
files, 159,169 B unmoved; `frames.json`, the golden frames, the preset baseline and the synthetic
ZONA byte-identical.

**The gate's terms** (`--before change-10b` at `654ee60` on the worktree; `--after change-10b
--against change-10b --check 659` at `f4c0216`): equal - **every catalog string byte-identical
(zero `E/` or `P/` movers in the wire's per-string diff; the system halves' catalog records
unmoved - only the Sandbox landing trims them)**, all four fixtures by hash-object, the OG 27 files
/ 159,169 B `9becd682…`, the utilities 44 -> 44, lint, the refuse-list `--stat` empty, the build
(stamp `f4c0216`), `src/` 17 modified / 1 added (`library-trim.ts`) / 0 deleted / 0 renamed;
check 658 -> 659 (the one file); moved as a feature moves them - the wire set `7cda3c4b…` ->
`d312d08b…` and full `bcf8063c…` -> `3f1d5374…` (13 records moved, every one `S/page3/…` - the
Sandbox's page 3 in the base set: its landed five, its emitted and corner strings, its two-slot
pair); **the sandbox set `5fcc2955…` -> `03d5482c…`: 168 -> 361 records, 30 byte-identical
(`emitted-2-slots/mapmode`, the empty string, on twelve fixtures; `landed/timer` and
`emitted-at-corner/timer` on the nine without a knob - a Timer of the arm and the sweep alone),
138 moved (every other record of the twelve fixtures), 0 removed, 193 added (the five-slot
`system` / `systemTimer` / `setup` / `timer` / `mapmode` of the twelve, and the seven new
fixtures' nineteen each: `runtime/scaled`, `relative-half`, `relative-full`, `spring`, `notes`,
`knobs`, `emit/page3-options`)**; the census `522c873a…` -> `e38e23d9…` (2,779 -> 2,835 literals,
194 -> 195 files: the five branch texts and the release replaced, `G(s,i,e,x,y,2,...)` 1 -> 0,
`Latch` and its helper 1 -> 0, `field-latch` 1 -> 0; the thirty new copy strings, `absolute` 3 ->
14, `relative` 1 -> 2 as a word and the five mode literals, `min` / `max` / `spring` / `note` /
`group` / `output` as fields, `System` and `System timer` 2 -> 4); the copy exports `27be101c…`
-> `fe2f7209…` (LATCH and LATCH_HELPER retired by name; thirty added); the testids `017609a1…` ->
`23525109…` (316 -> 319); the SCOPED CSS `e7045f06…` -> `5aa7323e…` (RegionInspector's one new
rule, `.helper + .grid, .check + .grid`) and the raw CSS `8c4ed778…` -> `e6d0ee3b…`; the titles
`fa250c25…` -> `25fb536f…` (987 -> 996 vitest incl. todo: nine added, six retitled; 104 -> 105
playwright); the JS `e131c040…` -> `f1caea60…` (71 files). **The quick term:** **The gate's quick term** printed `check-counts: no Vitest summary lines found on stdin` / `quick exit 1` in BOTH records (the pipe inside the script; the JSON beside each: 985 passed / 1 failed before, 994 / 1 after - the one `radius.spec.ts` layer B, which reads the built CSS and the script builds AFTER the quick term); the same pipeline run by hand on the built tree at `f4c0216` read `observed 95 files, 995 tests passed, 1 todo` and `matches the expected counts`, exit 0, and the raw suite was green twice more (`quick-A`, `quick-B`).
The script exits 1 at the wire by design; the later terms are compared from the two records.

**Chunks** (fresh detached wrangler dev on 4173, stopped through PowerShell, HTTP 000 after each;
the user's 5173 untouched): c4 **18 passed** (catalog, fidelity, first-experience, library,
sandbox - the seven Sandbox titles among them) on the build at `3381d5a`'s tree; c5 **1 failed /
10 passed** on that build (`artifacts:63`, the source archive stamped `654ee60` against HEAD
`3381d5a` - the build predated the commits), then **11 passed** on the gate's build at `f4c0216`
(rerun `c5-change10b`); c2 **1 failed / 21 passed** at three workers (`browse:343` - the grid read
before hydration, the flake changes 3, 4, 6 and 10A recorded), then **1 failed / 21 passed** again (the same `browse:343`) and `browse:343` alone **1 passed** twice on fresh servers (reruns `c2-alone-343-change10b`, `-2`) at `--workers
1` on a fresh server (rerun `c2-w1-change10b`). c1 and c3 not run: no install, session or tuning
title reads the Sandbox.

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

## Plan 13-08 - the gallery at `/playground/`, and the address move (2026-09-11)

`/browse/` moved to `/playground/` and `/c/<id>/` to `/playground/<id>/` (13-CONTEXT D-20, move-clean: no forwarding page, every `/c/` and `/browse/` link dead). Read every such address in the sections above accordingly; `build/c/` and `build/browse/` no longer exist and `build/playground/` holds the gallery and the 26 workspace pages. `src/lib/ui/browse-ui.spec.ts` is **9** (6 + 3): the rail derived from `FOR_TERMS` with the observed count printed and exactly one facet row; the card's one category, one tag, one sentence and one accessible link name; the favorite star's round trip with the drop count against the live catalog. Its third title was rewritten against 13-03's eleven tokens. `src/lib/ui/instrument.spec.ts` scan 5 now holds A-42's index form ABSENT and the mono list at six (the card's metadata block went with the Bible). Unit: 88 files / 904 tests (+1 todo), sweep `4 19`. e2e: 78 titles / 94 runs, no title added and none deleted - `e2e/browse.e2e.ts` twelve in, twelve out; the sort is a `<select>`, the one chip row is the FOR facet (`tag-show`, `tag-play`, `tag-all`), the round trip scrolls the shell's centre column (`[data-testid="shell-centre"]`) rather than the window, and the session walk's two gallery hops assert the document and not the device slot (the shell's slot is 13-11's). wrangler 4.128.0 was started detached through PowerShell `Start-Process npx.cmd` per chunk (five chunks, 21 / 17 / 16 / 20 / 20) and did not die in any of them.

## 2026-09-18 change 10C - a fader's bar stays on the lift

The bench on the deployed `e55398c`: "in sandbox fader now jumps back to 0 by default". No value
moved - `D` sends on change only - but 10B's `R` cleared an Absolute fader's bar on layer 2 when
the finger left, and a bar going dark reads as the fader falling to 0. The clause is gone
(`src/lib/sandbox/runtime.ts`, `RELEASE`): every fader keeps its bar where the finger left it, a
Spring fader alone moves on the lift. `runtime.spec.ts` test 13 asserts the bar after the lift;
test 7's pinned figures follow `R`'s 22 characters (five 2795, four 2208, one fader on two slots
1321, page 3 two / three / five slots 2825 / [2010, 847] / [847, 908, 834, 783, 489]; three slots
now fit `vb`, `hb`, `vhb`, `bx` as well); `emit.spec.ts` test 2's pair 1845 / 3372 / 1527. Quick
99 / 1014 + 1 todo green twice at `--maxWorkers=2`; check 659; the full e2e suite twice on fresh
servers 101 passed / 4 failed, every red a `browse.e2e.ts` hydration title (`:299`, `:343`,
`:1186`, `:1263` or `:1404`), and `:1404` checked by hand on the built site (search "pad" + the
"show" chip = aurora, pinwheel, starfield, the set the test computes). Catalog wire untouched.

## 2026-09-18 change 11 - the Sandbox's XY pad with up to five fingers

`BENCH-2026-09-16.txt` section 11 (answers 1a and 2a). Four source commits, no push, no device, no
deploy: `881146b` feat(sandbox) - the schema's optional `touches` and the model's readers;
`96f4fa3` feat(sandbox) - the multitouch runtime variant, the emitter, `runtime.spec.ts` /
`emit.spec.ts`, the wire harness's six fixtures; `f331083` feat(sandbox) - the editor, the copy,
the inspector, the route, `sandbox-ui.spec.ts`; `df60006` test(sandbox) - the e2e walk and the
gate's quick constant; then this section, the Done paragraph under section 11, a paragraph in
`docs/INSTALL-RUNBOOK.md`, a section in `docs/entries/sandbox-runtime.md`, the gate script's quick
constant at what the run proves (95 / 999), and the gate records `gate/change-11.*` (before, at
`e8c22ec`, on a clean worktree `../hangar-gate-11` with its own `npm ci`; removed after the records
were copied) and `gate/change-11-after.*` (at `df60006`).

**What moved in the suites.** `runtime.spec.ts` 14 -> 16: 6 (the change 11 fixtures among the
texts through both class gates, the variant's entry counted as an entry, the names held on both
runtimes), 7 (the canonical loop over the change 11 fixtures too - every packed text a fixed
point), 14 (every change 11 fixture pressed, moved and lifted on every region with no error), 15
new (two fingers on a Touches-2 pad on pairs 50 / 51 and 52 / 53 with independent positions - the
second finger's onset moving the first's values not at all; the union crosshair - eight of nine
cells under two fingers, five after one lifts; a third finger ignored - no pair 54, nothing on the
held pairs, the picture as it was, its lift silent; the lowest free slot - a new finger is finger
1 again on 50 / 51; Relative per finger - 31 on one finger's x with the other's pair silent, 0
then 32 on the other's y, held between touches and continued at 63; a one-finger pad beside a
two-finger one giving test 4's values and taking over as test 2 says; five fingers on 60..69 with a
sixth ignored, the middle slot's lift leaving 24 cells lit and the next finger retaking slot 3 on
64 / 65), 16 new (the variant's three texts canonical and pinned - R 234, O 392, I[4] 601 against
249 / 323 / 502; the runtime with every branch 2,970 against 2,795; every subset of the other
kinds beside a multitouch pad through the packer on five slots - thirteen fit, `vbxk` / `hbxk` /
`vhbxk` over on the Timer at 956; page 3 with a two-finger pad 869 / 876 / 846 / 956 / 540 refused
and the same four elements without the knob, the button or the fader fitting; a one-finger pad's
seventh column, no tail forced, the paint reading the defaults only under the variant, the field
at 1 or absent byte-identical). `emit.spec.ts` 8 -> 9: 9 new (the seventh column `cc2 +
128(touches-1)`, the flag word untouched, the pairs and the ceilings 127 / 125 / 123 / 121 / 119,
every string byte-identical with the field at 1 under two, three and five slots, the variant's
Setup at +50, page 3's pad at three fingers without the knob landing five canonical strings inside
908 and with the knob refused on the Timer 48 over). `sandbox-ui.spec.ts` 12 -> 13: 13 new (the
select 3 as one entry, 6 / 0 / 2.5 / -1 refused with nothing recorded, a CC number 126 refused on
its field under 3 fingers with the line and the model at 1, 123 landing, cc2 124 refused, 5
fingers refused on the select with the line kept in the state and the model at 3, 2 landing and
the line gone, undo and redo, a fader refusing it, Play locking it; the panel's select with its
five options and the helper, the problem line with `aria-describedby`, none of it on a fader; the
route's sixth wire and the inspector's snap-back; a record at 1..5 reads, 6 / 0 / 2.5 and a count
whose last pair passes 127 refused whole, a button's controller not read against it).
`e2e/sandbox.e2e.ts` 7 -> 8 titles: the Touches walk (X, a click, Escape; the select at 1 with
the helper; 3 one entry; 126 refused on the CC field with the line and 120 landing; 5 refused on
the select with the line and the select back at 3, no entry; 2 landing; the draft reloaded at 2
fingers and CC 120).

**Counts, carried + delta:** quick (the `server` project, the gate's own pipeline) 95 / 995 + 1
todo -> **95 / 999 + 1 todo** (+0 / +4: `runtime` 14 -> 16, `emit` 8 -> 9, `sandbox-ui` 12 ->
13), green twice at `--maxWorkers=2` (`quick-A` 51.8 s, `quick-B` 52.9 s) - change 10C's "99 /
1014" was both projects, the server's 95 / 995 and the sweep's 4 / 19, so with the sweep the tree
is 99 / 1018 + 1 todo; the gate script's constant is the server project's 95 / 999 now (it read
95 / 995 through 10C); check 659 -> **659** (0 / 0); lint clean; sweep `4 19` green (87 s;
`lua-entries` 1,804 combinations); e2e 90 titles / 105 runs -> **91 / 106** (+1 / +1: the Touches
walk); utilities **44** -> **44** (0 appeared, 0 disappeared; the built CSS byte-identical, raw
`e6d0ee3b…` and scoped `5aa7323e…` on both sides - no rule and no class was added); catalog
**27**, no entry touched; testids 319 -> **321** (`field-touches`, `touches-problem` new); copy
exports +3 (`TOUCHES`, `TOUCHES_HELPER`, `touchesCcRange`); OG 27 files, 159,169 B unmoved;
`frames.json`, the golden frames, the preset baseline and the synthetic ZONA byte-identical.

**The sandbox-set diff per fixture** (the gate's `--sandbox` term, 361 -> 475 records): **every
one of the nineteen existing fixtures' records byte-identical - 361 same, 0 moved, 0 removed** -
and 114 added, the six new fixtures times nineteen (`runtime/multitouch`, `runtime/five-fingers`,
`runtime/multitouch-relative`, `runtime/two-pads`, `runtime/page3-multitouch`,
`emit/page3-touches`). **The base wire set and `--full` are equal to the before-record** (set
`1e4ba5c9…`, full `627cfb5b…`): every catalog string, the system halves' records and the base
`S/page3/…` records unmoved. That is the strongest proof that a one-finger pad is what it was: the
single-touch `R`, `O` and `I[4]` are the same bytes, and the variant is emitted only for a surface
that carries a Touches > 1 pad.

**The gate's terms** (`--before change-11` at `e8c22ec` on the worktree; `--after change-11
--against change-11 --check 659` at `df60006`): equal - the wire set and full (above), the OG 27
files / 159,169 B `9becd682…`, the raw CSS `e6d0ee3b…` and the SCOPED CSS `5aa7323e…`, the
utilities 44 -> 44, lint, the refuse-list `--stat` empty, the build (stamp `df60006`), the four
fixtures by hash-object, `src/` 11 modified / 0 added / 0 deleted / 0 renamed; check 659 -> 659;
moved as a feature moves them - the sandbox set `4a691b04…` -> `3bdb5974…` (114 added, nothing
else); the census `96d137f0…` -> `0cb162ee…` (2,835 -> 2,860 literals, 6,607 -> 6,654
occurrences: the variant's texts, the three copy strings, `field-touches` / `touches-problem`, the
paint's split literal); the copy exports `fe2f7209…` -> `09a12df9…` (three added); the testids
`23525109…` -> `ee1f20c1…` (319 -> 321); the titles `140f8ef8…` -> `a110ec22…` (996 -> 1,000
vitest incl. todo, 105 -> 106 playwright); the JS `bd8eae97…` -> `3d9cf59c…` (71 files). The
script exits 1 at the sandbox set by design (new fixtures); the later terms are compared from the
two records above. The gate's quick term read `no Vitest summary lines` in the before-record (the
pipe inside the script, as 10B's did) and `observed 95 files, 999 tests passed, 1 todo` against
the script's 99 / 1018 of the test commit in the after-record - the constant is 95 / 999 since the
docs commit, what the same pipeline proves by hand twice.

**Chunks** (fresh detached wrangler dev on 4173, stopped through PowerShell, HTTP 000 after each;
your 5173 untouched; the build stamped `df60006`): c4 by its files (`c4-files`) **19 passed**
(catalog, fidelity, first-experience, library, sandbox - the eight Sandbox titles among them); c5 by
its files (`c5-files`) **11 passed**. Two runs of the WHOLE suite first, by mistake (a bare chunk
name runs everything; the brief's `e2e-chunks.sh c4` is 10C's note, not a chunk): **103 passed / 3
failed** (`browse:343`, `browse:1186`, `browse:1404`) and **105 passed / 1 failed** (`browse:299`) -
every red a `browse.e2e.ts` title of the recorded hydration family, no Sandbox or install title
red; then `browse.e2e.ts` alone on a fresh server: **14 passed** (rerun `browse-alone-change11`). c1, c2 and c3 not run as chunks: no
install, session or tuning title reads the Sandbox (the two whole-suite runs covered them green).

**Questions for the user.** (a) The PDF's page 3 with its pad at two or more fingers does not fit
five slots - a fader, the button, the knob AND a multitouch pad are the one combination over (the
Timer 48 over; no packing exists under the shared texts) - and Store refuses it with the
over-budget line; say if that combination matters enough to re-cut the shared knob (608) or the
fader (503), which would move every fixture. (b) A finger past the count is ignored (no light, no
message); say if you want the newest finger to take the oldest's slot instead. (c) A count the
controllers cannot carry is refused with its line and the select snaps back; say if you would
rather the controllers were moved down to fit. (d) Changes 1 to 10C's questions still stand.

**Not supported by the tree / departures from the brief:** the count rides in the seventh column
(`cc2 + 128(t-1)`), neither the flag word nor a column of its own - measured cheaper by nine to
ten characters a pad; the per-slot state is six columns from `17 + 3k` with k the controller
offset, not `17 + 5(slot-1)` - the sixth column is the Relative anchor (a subtable per slot lost);
the multitouch machinery is a VARIANT of three texts emitted only with a Touches > 1 pad, not an
edit of the shared `O` / `R` (which would have moved every fixture); the variant's Setup paint
reads the tail defaults once (+50) so its entry fits 255/0; the five-kind + multitouch surface is
over and refused; the browser preview shows several fingers only from a touch screen (a mouse is
one pointer) - multitouch is proved in the VM; the gate's quick constant is the server project's
95 / 999, not the brief's 99 / 1014 + 4; `src/routes/sandbox/[draftId]/+page.svelte`'s header was
already 12 lines at `e8c22ec` (`comment-lines.mjs --todo` prints it; 10B left it) and is not
touched here beyond one wire line; ROADMAP / REQUIREMENTS / STATE untouched; CAT-04 stays `[ ]`;
the worktree `../hangar-gate-11` was removed after the records were copied.
