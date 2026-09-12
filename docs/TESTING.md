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
