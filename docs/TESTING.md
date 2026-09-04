# Testing HANGAR

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

This is the developer-facing guide: which command to run when, what each one costs, and the small
number of traps that have already cost real time. The per-phase validation contract — the sampling
rates, the Nyquist argument behind them and the per-task verification map — lives in each phase's
`XX-VALIDATION.md` (`.planning/phases/03-vendor-the-domain/03-VALIDATION.md` for the vendored
simulator, `.planning/phases/02-walking-skeleton/02-VALIDATION.md` for the protocol and transport
work) and is not repeated here.

## How to run it

Measured on this machine (Windows 11, Node v24.14.0) on 2026-09-04, at the end of Phase 4. Wall
times are the whole command including npm and process startup; the parenthesised figure is the
runner's own reported duration. Every number here is **observed**, never predicted — the tree is
shared with Phase 8, so a row that was guessed rather than run is worse than no row at all.

| Command                      | Covers                                                                     | Measured                                                                                |
| ---------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `npm run test:quick`         | the `server` Vitest project — everything except the invariant sweep        | 37 files, 534 passed + 1 todo (535); 14 s wall (10.1 s)                                 |
| `npm run test:sweep`         | the `sweep` project: `src/vendor/botor/tests/pad-invariants.test.js` alone | 1 file, 9 tests; 40 s wall (36.1 s)                                                     |
| `npm run test:unit -- --run` | both Vitest projects in one run                                            | 38 files, 543 passed + 1 todo (544); 49 s wall (44.7 s)                                 |
| `npm run test:e2e`           | Playwright over the built site through `wrangler dev`                      | 21 tests; 56.5 s runner time, 59 s wall including the build and the wrangler cold start |
| `npm run check`              | `svelte-check` over the whole project                                      | 421 files, 0 errors, 0 warnings                                                         |
| `npm run lint`               | `prettier --check .` then `eslint .`                                       | exit 0                                                                                  |

The sampling rule, in three lines:

- After every task: `npm run test:quick`, plus `npm run lint` when the task touched a source file.
- After every wave: `npm run check && npm run lint && npm run test:quick && npm run test:sweep`.
- Before verification: all of the above plus `npm run test:e2e`.

## Why there are two Vitest projects

`src/vendor/botor/tests/pad-invariants.test.js` sweeps 4,860 labelled states — 1,620 kind
combinations times three brightness levels — and accounts for almost all of the whole-run wall
time: 36.4 s of a 38.3 s two-project run, against 3.9 s for the other twenty-six files. That is the
whole reason it is a separate project rather than one more file in `server`.

The sweep is the anti-drift mechanism. It runs less **often** — per wave, not per task — and never
less **fully**. Do not trim it, do not sample a subset of the states, do not add a `--bail`, and do
not move it back into the `server` project to "simplify the config". If it is slow, that is the
cost of the guarantee it provides.

Note also that `server` excludes the sweep by **file name**, never by directory. A directory-wide
`src/vendor/**` exclusion is exactly the failure described next.

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
added one more test to `transport.spec.ts` — the control label the copy interpolates — so the
table below totals 99.

| File                                              | Tests | What it holds                                                                                      |
| ------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------- |
| `src/lib/protocol/constants.spec.ts`              | 5     | values read from the pinned package rather than restated                                           |
| `src/lib/protocol/descriptors.spec.ts`            | 10    | the four outbound descriptors, byte for byte                                                       |
| `src/lib/protocol/forbidden-instructions.spec.ts` | 5     | D-06: `PAGEACTIVE/EXECUTE`, `NVMERASE`, `PAGECLEAR`, `PAGEDISCARD`                                 |
| `src/lib/protocol/framing.spec.ts`                | 9     | the frame scanner: split, coalesced and torn inputs                                                |
| `src/lib/protocol/decode.spec.ts`                 | 5     | the decode guard — `undefined`, never `false`                                                      |
| `src/lib/protocol/match.spec.ts`                  | 7     | which inbound class may resolve which waiter                                                       |
| `src/lib/protocol/write-guard.spec.ts`            | 6     | D-09: what makes a fetched string safe to write back                                               |
| `src/lib/transport/transport.spec.ts`             | 7     | the five named open failures, CONN-04's recovery order and the control label the copy interpolates |
| `src/lib/transport/capture.spec.ts`               | 6     | D-07's recorder and the pinned `STEP_IDS` vocabulary                                               |
| `src/lib/transport/fake.spec.ts`                  | 8     | capture replay and the five injected faults                                                        |
| `src/lib/transport/queue.spec.ts`                 | 8     | one outstanding request, bounded retry, a NACK never retried                                       |
| `src/lib/transport/sequence.spec.ts`              | 9     | the no-op cycle, including the mandatory restore in its `finally`                                  |
| `src/lib/transport/fixtures/synthetic.spec.ts`    | 3     | the generated capture, regenerated at module scope                                                 |
| `src/lib/transport/fixtures/fixtures.spec.ts`     | 4     | **the gate**: at least one committed capture is real                                               |
| `src/lib/skeleton-results.spec.ts`                | 7     | `docs/SKELETON-RESULTS.md` answers all six questions, with citations                               |

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

| File                                 | Tests | What it holds                                                                                                              |
| ------------------------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/ui/identity.spec.ts`        | 6     | IDENT-01's token ladder, the WCAG AA floor on black, the two font stacks, the 9x9 favicon                                  |
| `src/lib/catalog/front-door.spec.ts` | 8     | the row and the exclusion list as a **partition** of the catalog, and motion derived from the fixture rather than declared |
| `src/lib/coverflow/slots.spec.ts`    | 8     | the ring arithmetic and the slot ladder, including the left/right mirror                                                   |
| `src/lib/sim/schedule.spec.ts`       | 7     | the 10 ms accumulator, the 100 ms catch-up clamp and parity with the vendored host's constants                             |
| `src/lib/sim/paint.spec.ts`          | 5     | one `putImageData` per pad per paint, zero of every forbidden call, and the unlit-cell alpha                               |
| `src/lib/sim/touch.spec.ts`          | 8     | mouse-as-finger geometry and the tick-locked, at-most-one-sample-per-tick delivery                                         |
| `src/lib/sim/host.spec.ts`           | 10    | the shared rAF host: the 9x9 backing store, the coverflow window gate, the hero's continuity across steps, teardown        |
| `src/lib/ui/glyph-field.spec.ts`     | 5     | the splash field is deterministic and byte-identical across two builds                                                     |
| `src/lib/device/try-on.spec.ts`      | 6     | connect and identify against `FakeTransport`, including **zero writes** across a full cycle                                |

`src/lib/config-shape.spec.ts` went from 12 tests to **14**. The two additions are the pair that keeps
the 131,101-byte `@intechstudio/grid-protocol` chunk off the front door's critical path, and they are
deliberately redundant with each other: test 13 walks the **source** of both routes and every file in
`src/lib/ui/`, forbidding `vendor`, `intechstudio` and `lib/pad` in the `from` form only — the
`onMount` dynamic import is the rule being obeyed, not broken — while test 14 walks the **built**
artefact, finds the chunk containing `GRID_PARAMETER_ELEMENT_POTMETER` and asserts that neither
`build/index.html` nor `build/c/aurora/index.html` references it. Test 14 also fails when it can find
no such chunk at all, because a probe that has gone blind must fail rather than pass. Perturbing
`FidelityLine.svelte` with one static vendored import turns test 13 red without a rebuild and leaves
test 14 green, which is exactly why there are two.

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
centred, alive and with no splash, that all eight row entries are real files with their own
descriptions while the excluded one is provably a 404 and an unknown address still lands on the shelf
with a line saying so, and that the shared animation loop is really painting. All but one assert an
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
`FakeTransport` in `src/lib/device/try-on.spec.ts`, including the never-writes invariant. The one
remaining hardware check is a person with a ZONA on the desk: open the front door, choose a pad, click
`TRY ON DEVICE`, pick the module, and confirm the identified block names the firmware and the active
page and that the module's own configuration is untouched afterwards.

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
