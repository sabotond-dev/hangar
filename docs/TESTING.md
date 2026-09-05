# Testing HANGAR

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

This is the developer-facing guide: which command to run when, what each one costs, and the small
number of traps that have already cost real time. The per-phase validation contract — the sampling
rates, the Nyquist argument behind them and the per-task verification map — lives in each phase's
`XX-VALIDATION.md` (`.planning/phases/03-vendor-the-domain/03-VALIDATION.md` for the vendored
simulator, `.planning/phases/02-walking-skeleton/02-VALIDATION.md` for the protocol and transport
work) and is not repeated here.

## How to run it

Measured on this machine (Windows 11, Node v24.14.0) on 2026-09-05, at the end of Phase 7 — the
install-flow work, against a fresh `npm run build` at `f20d74f`, with 1.7 GB of memory free. Wall times
are the whole command including npm and process startup, each command run alone in the order below; the
parenthesised figure is the runner's own reported duration. Every number here is **observed**, never
predicted — the tree is shared between phases, so a row that was guessed rather than run is worse than
no row at all.

| Command                      | Covers                                                               | Measured                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`              | `svelte-check` over the whole project                                | 545 files, 0 errors, 0 warnings; 9 s wall                                                                                    |
| `npm run lint`               | `prettier --check .` then `eslint .`                                 | exit 0; 18 s wall                                                                                                            |
| `npm run build`              | `gen-og.mjs`, `vite build`, `postbuild.mjs`                          | exit 0; 12 s wall                                                                                                            |
| `npm run test:quick`         | the `server` Vitest project — everything except the three sweeps     | 73 files, 776 passed + 1 todo (777); 31 s wall (27.8 s), no timeout                                                          |
| `npm run test:sweep`         | the `sweep` project: three files, and 97% of its cost is one of them | 3 files, 13 tests; 118 s wall (115.5 s)                                                                                      |
| `npm run test:unit -- --run` | both Vitest projects in one run                                      | not re-run at the Phase 7 gate; Phase 6 measured 72 files, 737 passed + 1 todo (738); 85 s wall (82.7 s)                     |
| `npm run test:e2e`           | Playwright over the built site through `wrangler dev`, two projects  | 89 tests (78 chromium, 11 webkit-phone) at `--workers 3`; 1.8 m runner time, 112 s wall including the cold start, first time |

The quick run's one load-sensitive test (`lua-entries.spec.ts` test 6, Phase 7 deferred items 12 and 21) did not time out in this run at 1.7 GB free; on 2026-09-05 it did so three times at 0.8 to 1.7 GB
free on a tree that had not changed a vitest file. If a quick run reads 775 passed and one timeout in
that file, run the file alone before reading it as a regression.

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

**The project has three members as of Phase 5**, and the rule that admits a file is its cost, never
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

| File                                              | Tests | What it holds                                                                                     |
| ------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------- |
| `src/lib/protocol/constants.spec.ts`              | 5     | values read from the pinned package rather than restated                                          |
| `src/lib/protocol/descriptors.spec.ts`            | 10    | the four outbound descriptors, byte for byte                                                      |
| `src/lib/protocol/forbidden-instructions.spec.ts` | 5     | D-06: `PAGEACTIVE/EXECUTE`, `NVMERASE`, `PAGECLEAR`, `PAGEDISCARD`                                |
| `src/lib/protocol/framing.spec.ts`                | 9     | the frame scanner: split, coalesced and torn inputs                                               |
| `src/lib/protocol/decode.spec.ts`                 | 5     | the decode guard — `undefined`, never `false`                                                     |
| `src/lib/protocol/match.spec.ts`                  | 7     | which inbound class may resolve which waiter                                                      |
| `src/lib/protocol/write-guard.spec.ts`            | 6     | D-09: what makes a fetched string safe to write back                                              |
| `src/lib/transport/transport.spec.ts`             | 9     | the six named open failures, CONN-04's recovery order and the control label the copy interpolates |
| `src/lib/transport/capture.spec.ts`               | 6     | D-07's recorder and the pinned `STEP_IDS` vocabulary                                              |
| `src/lib/transport/fake.spec.ts`                  | 8     | capture replay and the five injected faults                                                       |
| `src/lib/transport/queue.spec.ts`                 | 8     | one outstanding request, bounded retry, a NACK never retried                                      |
| `src/lib/transport/sequence.spec.ts`              | 9     | the no-op cycle, including the mandatory restore in its `finally`                                 |
| `src/lib/transport/fixtures/synthetic.spec.ts`    | 3     | the generated capture, regenerated at module scope                                                |
| `src/lib/transport/fixtures/fixtures.spec.ts`     | 4     | **the gate**: at least one committed capture is real                                              |
| `src/lib/skeleton-results.spec.ts`                | 7     | `docs/SKELETON-RESULTS.md` answers all six questions, with citations                              |

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
| `src/lib/ui/identity.spec.ts`        | 6     | IDENT-01's token ladder, the WCAG AA floor on black, the two font stacks, the 9x9 favicon                                        |
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
centred, alive and with no splash, that all sixteen routed configurations are real files with their
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
hand-authored configurations. Every count below was observed on 2026-09-04 by running each file on
its own, with the wall time of that single-file run beside it.

| File                                  | Tests | Cost   | What it holds                                                                                                                       |
| ------------------------------------- | ----- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/catalog/catalog.spec.ts`     | 10    | 0.48 s | the entry shape: unique ids, the preview kind derived from the source kind, knob ids and defaults that index their own value lists  |
| `src/lib/catalog/frames.spec.ts`      | 5     | 0.81 s | the golden-frame fixture: every entry renders, every recorded hash still matches, and the fixture covers the catalog exactly        |
| `src/lib/catalog/lua-entries.spec.ts` | 6     | 2.18 s | the CONT-02 gate on every hand-authored entry: canonical compressed form, both 908-character budgets, the knob sweep, execution     |
| `src/lib/sim/lua-host.spec.ts`        | 8     | 0.49 s | the Grid API the VM is handed - `led`, timers, MIDI, the element table - and the globals a configuration may not reach              |
| `src/lib/sim/lua-smoke.spec.ts`       | 3     | 0.66 s | the end-to-end shape: a hand-authored entry boots a VM, runs its Setup and Timer, and lights a 243-byte frame                       |
| `src/lib/fidelity/lua-parity.spec.ts` | 5     | 0.93 s | the nine shelf presets rendered twice - once by the vendored simulator, once by real Lua - and asserted equal                       |
| `src/lib/sim/lazy.spec.ts`            | 3     | 0.23 s | the fast half of D-14: the catalog reaches no engine, `engine.ts` reaches the Lua wrapper only dynamically, one module names the VM |

**Adding a configuration changes no test count.** Every catalog gate loops over `CATALOG` (or over
the hand-authored subset) _inside_ a single `it`, deliberately rather than through `it.each`. Three
configurations landed in plan 08-06 and `npm run test:quick` reported the same 41 files and 556 tests
before and after. That is what makes the counts above worth writing down: a moved number means a
moved gate, never a bigger catalog. The cost of an added entry is paid in the wall time of
`lua-entries.spec.ts` and `frames.spec.ts`, which is where it belongs.

**The VM-backed specs are cheap, and the expensive one is not the one anybody expected.**
`lua-entries.spec.ts` is the costliest at **2.18 s** - it calls `compressScript` for every event of
every hand-authored entry and then runs each one through a real VM at every knob position - against
the 10-second threshold its plan set. `lua-parity.spec.ts` renders all nine presets through both
engines in **0.93 s**, against the 20-second threshold its plan set; it was the one expected to hurt
and it does not, because wasmoon boots in milliseconds under Node and its per-preset samples are
memoised at module scope. Neither needs a carve-out today. If a future wave pushes one of them over,
the precedent is D-10's invariant sweep: **move it into its own Vitest project and run it per wave**,
never trim what it covers.

### What the catalog gates prove, and what they do not

`src/lib/fidelity/lua-parity.spec.ts` is **evidence**. The Lua it runs is the vendored compiler's own
output, executed in a real Lua 5.4 VM, and the result is compared against the vendored TypeScript
simulator - an independent transcription of the same firmware - and against a recorded fixture.
Agreement is two implementations meeting, not one implementation quoted twice.

`src/lib/catalog/frames.json` is a regression **tripwire, not an oracle**. Its hashes came out of the
engine they are used to check, so a red `frames.spec.ts` says rendering moved and says nothing about
which side of the move was right. That answer comes from the parity spec and from
`src/lib/fidelity/firmware-oracle.spec.ts`, never from regenerating the fixture.

`src/lib/catalog/lua-entries.spec.ts` is a **budget gate valid only at the current protocol pin**.
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

| File                                | Tests | Cost    | What it holds                                                                                                            |
| ----------------------------------- | ----- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/tune/copy.spec.ts`         | 6     | 0.38 s  | the Copywriting Contract as executable rules: sentence case, no exclamation, the compiler's own words never rewritten    |
| `src/lib/tune/idle.spec.ts`         | 3     | 0.22 s  | D-08's prefetch shim: `requestIdleCallback` where it exists, `setTimeout` where it does not, and an idempotent cancel    |
| `src/lib/tune/view.spec.ts`         | 8     | 0.53 s  | the zero-import view seam: the twelve knob kinds, the widget rule, and `over` outranking staleness on a meter            |
| `src/lib/tune/state.spec.ts`        | 5     | 0.44 s  | the reimplemented `withChange`, pinned against the vendored private it replaces                                          |
| `src/lib/tune/knobs.preset.spec.ts` | 6     | 0.43 s  | the nine per-card descriptor lists held against `presetById(id).knobs`, and every default derived from the shipped state |
| `src/lib/tune/knobs.lua.spec.ts`    | 4     | 0.45 s  | the Lua route arriving in the same descriptor shape, so the panel cannot tell the two routes apart                       |
| `src/lib/tune/model.spec.ts`        | 7     | 1.35 s  | the tuner: an immediate `PadSim` preview, a 120 ms debounced compile, and the stamp precomputed on every change          |
| `src/lib/tune/ladder.spec.ts`       | 5     | 0.71 s  | TUNE-04 and TUNE-05 against a real over-budget measurement, plus the never-writes scan over `src/lib/tune/`              |
| `src/lib/tune/surprise.spec.ts`     | 4     | 21.64 s | `SURPRISE ME` as a property, with 18,000 draws behind it: it moves something, it lands in budget, it terminates          |
| `src/lib/share/url.spec.ts`         | 4     | 0.37 s  | the two restated literals — the deployed origin and the vendored `STAMP_PREFIX` — held against their real sources        |
| `src/lib/share/stamp.spec.ts`       | 8     | 0.55 s  | the base36 stamp, the entry-consistency guard and the three landings (restored, older, unreadable)                       |
| `src/lib/og/png.spec.ts`            | 5     | 0.29 s  | the PNG encoder over `node:zlib` alone, verified byte by byte                                                            |
| `src/lib/og/render.spec.ts`         | 4     | 0.28 s  | the 1200x630 pad, with both structural colours computed from `src/app.css`'s tokens rather than typed                    |
| `src/lib/og/build.spec.ts`          | 5     | 0.86 s  | the `<head>` and the built artefact: every absolute `og:image` resolves back to a real file under `build/`               |
| `src/lib/ui/tune-ui.spec.ts`        | 5     | 0.23 s  | five structural rules over the seven tuning components, including the dynamic-import rule `config-shape` test 13 misses  |

**The costliest file in the `server` project is now `surprise.spec.ts` at 21.6 s on its own.** It
stays in `server` deliberately: it is 18,000 draws against a pure function with no compiler in the
loop, it is the per-task guard for the one control that can move every knob at once, and inside a
parallel run it overlaps with the other 65 files — the whole `server` project is 22.7 s.

### The sweep project's new membership

`*.sweep.spec.ts` is the file-name rule, and Phase 5 is what made it more than a convention.

| File                                            | Tests | Cost alone | Why it is a sweep                                                                   |
| ----------------------------------------------- | ----- | ---------- | ----------------------------------------------------------------------------------- |
| `src/lib/tune/reachability.sweep.spec.ts`       | 2     | 75.8 s     | it costs all 32,852 reachable knob states of the nine shelf cards, with no sampling |
| `src/vendor/botor/tests/pad-invariants.test.js` | 9     | 36.2 s     | 4,860 labelled states: 1,620 kind combinations times three brightness levels        |
| `src/lib/share/stamp-roundtrip.sweep.spec.ts`   | 2     | 1.6 s      | it round-trips every one of those states through the encoder and back               |

The whole `sweep` project is **3 files / 13 tests, 78.0 s** (80 s wall) against **1 file / 9 tests,
38.3 s** before Phase 5. The invariant sweep it used to be alone in is no longer the expensive one:
the reachability sweep is, and that is the price of the finding below being a measurement rather
than an opinion.

**Two of the three single-file costs above moved between 2026-09-04 and 2026-09-05 without a line of
either file changing** — reachability from 125.4 s to 75.8 s, `stamp-roundtrip` from 2.3 s to 1.6 s.
Nothing about the sweep got faster; the machine was less busy. That is the reason these numbers are
dated and the reason no threshold is asserted against any of them. The three files run in parallel,
which is why 75.8 + 36.2 + 1.6 is 113.6 s alone and 78.0 s together.

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
anywhere — observed between that plan's two commits. Three of the sixteen images (tpad, ghost, morph)
carry no lit LED at all and are exempted by their own declared `restsBlack`, not by a list.

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

| File                                 | Tests | Cost   | What it holds                                                                                                        |
| ------------------------------------ | ----- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| `src/lib/catalog/listing.spec.ts`    | 5     | 0.40 s | the sixteen restated entries held against the catalog in both directions, and the zero-import scan over the source   |
| `src/lib/browse/sort.spec.ts`        | 6     | 0.42 s | the three comparators against literal id sequences, and a scan asserting neither `localeCompare` nor `Intl` is named |
| `src/lib/browse/filter.spec.ts`      | 6     | 0.23 s | case-and-diacritic folding, the term split, AND-combining chips, and the standing chip row derived from the data     |
| `src/lib/browse/grid.spec.ts`        | 6     | 0.21 s | the column ladder and the whole keyboard model: clamp-never-wrap, `Home`/`End`, and `undefined` for a foreign key    |
| `src/lib/browse/query.spec.ts`       | 5     | 0.23 s | the URL-visible state: parsed defensively, serialised canonically, an unknown `?tag=` dropped silently               |
| `src/lib/browse/return.spec.ts`      | 4     | 0.21 s | the `sessionStorage` record, and that nothing in it ever throws                                                      |
| `src/lib/browse/typographic.spec.ts` | 4     | 0.39 s | the apostrophe and quotation-mark rules applied to a visitor's own query                                             |
| `src/lib/ui/browse-ui.spec.ts`       | 6     | 0.21 s | six structural rules over the browse components, including the comment-stripped "no popularity metric" scan          |

Eight files, **42 tests**, and the whole set runs in well under a second. That is deliberate: every
decidable thing on this screen lives in a pure `.ts` module with its own spec, because this
repository collects no `.svelte.spec.ts` in any Vitest project and one written here would report
green while running nothing. Everything that needs a real layout, a real canvas or a real history
entry is proven in a browser instead — `e2e/browse.e2e.ts` (11 chromium tests) and
`e2e/browse-webkit.e2e.ts` (3 titles, both projects, 6 against the total).

### What the browse gates prove, and what they do not

**The sixteen-canvas frame budget is a recorded measurement, not a threshold.** Test 6 of
`e2e/browse.e2e.ts` patches `CanvasRenderingContext2D.prototype.putImageData` in an init script and
counts pad frames for two seconds on the built site, then records the viewport, how many cards were
on screen and how many engines had been built beside the number. Observed at 1280x720 with 4 of 16
cards on screen and 4 engines built: **139–156** over four runs, and **152** in the Phase 5.1 gate
run. The test asserts only that the number is greater than zero. `.planning/research/STACK.md`'s own
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

| File                                              | Tests   | What it holds                                                                                                                                                                                                                                    |
| ------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/protocol/descriptors.spec.ts`            | 12      | 10 → 12: the fifth outbound descriptor, `SERIALNUMBER/FETCH`, addressed to the module and never broadcast, and `moduleKeyOf` over `WORD0..WORD3`                                                                                                 |
| `src/lib/protocol/forbidden-instructions.spec.ts` | 5       | **unchanged in count**: test 4 counts five builders and its class set names `SERIALNUMBER`                                                                                                                                                       |
| `src/lib/transport/sequence.spec.ts`              | 11      | 9 → 11: `writeBoth` as the one writer (Timer then Setup, verbatim) with `writeBack` an adapter over it; test 3 rewritten so a store on a rig RESOLVES with three acknowledgements to one request                                                 |
| `src/lib/transport/fixtures/synthetic.spec.ts`    | 6       | 3 → 6: the scripted ZONA's `currentpage` refusal, its flash and `powerCycle()`, its addressed serial report from the global position, and `rigResponder`                                                                                         |
| `src/lib/device/snapshot.spec.ts`                 | 7       | the durable record under `hangar.snapshot.v1`, keyed by serial then page, never overwritten, never deleted, `unavailable` on a throwing store                                                                                                    |
| `src/lib/device/install-copy.spec.ts`             | 6       | every install sentence held against `07-UI-SPEC.md` read from disk, zero import specifiers, the three caps by name                                                                                                                               |
| `src/lib/device/session.spec.ts`                  | 21      | 17 → 21: the write view whose `onData` throws, `onClass` fan-out beside a moving fold, `onConnection` once per teardown, `writeLock` and `announce`                                                                                              |
| `src/lib/device/session-copy.spec.ts`             | 6       | **unchanged in count**: test 5 rewritten for the amended `SAFE_PROMISE` (88 characters, present tense), test 6 walking the writing form of the unplugged block                                                                                   |
| `src/lib/tune/model.spec.ts`                      | 10      | 8 → 10: `onconfig` emitted from inside `land()` with the pair the meters measured, `undefined` on every stale                                                                                                                                    |
| `src/lib/device/wire-pin.spec.ts`                 | 4       | D-10: the strings on the wire are the meters' bytes for all nine presets and every Lua entry; `undefined` builds no request                                                                                                                      |
| `src/lib/device/install.spec.ts`                  | 18      | the store in node over a tee on `FakeTransport`: zero `CONFIG/EXECUTE` across connect, the snapshot and every knob move; the three clicks; partial, nothing-landed, lost, unconfirmed, kept-mismatch; the bounded retries; the pacing escalation |
| `src/lib/config-shape.spec.ts`                    | 14      | **unchanged in count, widened in reach**: the allow-list gained the store's three specifiers and the walk reads 8 of 8; three planted mutations each turned test 13 red with the offender named                                                  |
| `src/lib/ui/device-ui.spec.ts`                    | 11      | 7 → 11: the three install leaves, the 44px floor on every control, the twins and the 72px cell, a group that is not a dialog, the header lock's two bindings, no `setInterval`, no retyped install sentence                                      |
| `e2e/install.e2e.ts`                              | 11 / 12 | six untagged probe walks visiting all fourteen install states, four untagged titles on `/c/aurora/`, one `@webkit` title run on both projects                                                                                                    |

Standing gates untouched and green at the gate: `src/lib/ui/identity.spec.ts` (6),
`src/lib/ui/tune-ui.spec.ts` (5), `src/lib/sim/lazy.spec.ts` (3), `src/lib/transport/fixtures/fixtures.spec.ts`
(4), `src/lib/catalog/lua-entries.spec.ts` (6), `e2e/session.e2e.ts` (14 titles), `e2e/first-experience.e2e.ts`
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
