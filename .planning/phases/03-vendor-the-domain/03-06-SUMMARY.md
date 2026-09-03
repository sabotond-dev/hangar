---
phase: 03-vendor-the-domain
plan: 06
subsystem: testing
tags: [wasm, lua_fmt, playwright, prerender, cloudflare-worker, d-12, docs, found-02, found-05]

# Dependency graph
requires:
  - phase: 03-03
    provides: "src/lib/fidelity/preset-baseline.json - the aurora entry the browser-produced numbers are compared against, captured from BOTOR's own compiler"
  - phase: 03-04
    provides: "The golden-frame tripwire and the firmware oracle that docs/TESTING.md describes"
  - phase: 03-05
    provides: "src/lib/pad - compilePreset / costOf / measureLua behind the memoised padReady() gate, which is what the probe page exercises"
provides:
  - "src/routes/dev/fidelity/+page.svelte - the hidden, prerendered browser probe that compiles aurora through $lib/pad and writes seven numbers into one scrapeable element"
  - "e2e/fidelity.e2e.ts - D-12: the production-build WASM proof, 2 tests, asserted against preset-baseline.json rather than restated numbers"
  - "docs/TESTING.md - the developer-facing test layout: quick vs sweep, the green-and-vacuous trap, the checkJs exclusion, the fidelity suite's limits, the stale-wrangler preflight, and the CSP/WASM note"
affects:
  - "04 (the catalog can rely on the WASM resolving from the deployed artifact; the probe route is the reference for how to await the gate from a component)"
  - "06/07 (any CSP hardening of worker/index.js must add 'wasm-unsafe-eval' to script-src or the formatter silently stops initialising)"
  - "Every future e2e author (the .tmp-e2e/ capture convention and the no-'failed'-in-a-test-title rule)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A browser proof runs the real dependency in the real artifact: dynamic import inside onMount, so the server build's node export condition cannot answer the question instead"
    - "An e2e that checks numbers reads the fixture that owns them, and its acceptance criterion greps for a literal restatement to make sure it never stops doing so"
    - "Assert an exact test total and the absence of the word failed, which forces a naming rule on every test title in the repository"

key-files:
  created:
    - src/routes/dev/fidelity/+page.svelte
    - e2e/fidelity.e2e.ts
    - docs/TESTING.md
  modified:
    - .gitignore

key-decisions:
  - "The probe compiles and costs through $lib/pad rather than the vendored functions, so the browser run exercises the same FOUND-05 gate the app does; 03-05's SUMMARY recommended this and it is what makes the proof about HANGAR rather than about grid-protocol"
  - "The probe's failure branch writes 'error: <message>' into the same element instead of throwing, so a broken run produces a readable assertion diff rather than a Playwright timeout carrying no information"
  - "e2e output is captured into .tmp-e2e/ (gitignored, added beside .tmp-format-parity/), never under test-results/ or playwright-report/, because Playwright unlinks its outputDir at the start of every run"
  - "/dev/fidelity ships in every deploy as an unlinked page and stays that way after launch; revisiting it is a docs/DEPLOY.md launch-checklist item, not a gate on this phase"

patterns-established:
  - "Stale-wrangler preflight before ANY build or e2e run: netstat on 4173, walk to the npx-cli root, PowerShell taskkill /T /F, re-check"
  - "No Playwright test title may contain the word 'failed', because the gate greps the captured log for it"

requirements-completed: [FOUND-02, FOUND-05]

# Metrics
duration: 11 min
completed: 2026-09-03
---

# Phase 03 Plan 06: The production-build WASM proof and docs/TESTING.md Summary

**A real Chromium page, loading the real `build/` through `worker/index.js` under `wrangler dev`, initialises the 628,148-byte `lua_fmt_bg.D_18ElAm.wasm` served as `application/wasm` with an empty console and reproduces aurora's recorded lengths and costs exactly — and the whole test layout, including the trap that once made a green Vitest run mean nothing, is now written down in one document.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-09-03T10:48:40Z
- **Completed:** 2026-09-03T10:59:30Z
- **Tasks:** 3
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments

- ROADMAP criterion 1's second half is now a regression test rather than a claim. The vendored
  compiler runs in a browser against the production static build and returns the numbers
  `preset-baseline.json` recorded from BOTOR's own compiler.
- Every WASM fact the plan asserted was reproduced on this machine, first try, with no adjustment
  to either side: the hashed asset exists at the predicted path and size, the Worker serves it as
  `application/wasm`, and the page console is empty.
- `/dev/fidelity/` is a real prerendered file in `build/`, reachable by URL and linked from
  nowhere — confirmed both by grep over `src/routes/` and by an e2e assertion that the site root
  contains no `/dev/` link.
- The negative check bit: perturbing one expected number turned the spec red with a diff naming
  `setupCompressedLength` and printing the browser-produced `249` against the perturbed `250`.
- `docs/TESTING.md` ships in the GPLv3 source archive beside `PIN-POLICY.md` and `DEPLOY.md`, with
  every measured cell filled from a real run on a named machine and date.

## Task Commits

1. **Task 3-06-01: The hidden, prerendered fidelity probe route** — `1f598db` (feat)
2. **Task 3-06-02: The production-build WASM proof, against the real Worker** — `0e0202f` (test)
3. **Task 3-06-03: docs/TESTING.md — the quick/sweep split and the traps around it** — `07d601b` (docs)

No commit carries a trailer of any kind and none mentions Claude.

## The WASM asset, as built and as served

`npm run build` emitted:

```
build/_app/immutable/assets/lua_fmt_bg.D_18ElAm.wasm    628,148 bytes
```

Exactly the size the research recorded. The hash segment (`D_18ElAm`) is content-derived and will
move if the package is bumped; nothing in the repository hard-codes it.

### The full response header list

Captured with `wrangler dev` on 4173, using the credentials from `.dev.vars`:

```
$ curl -s -D - -o /dev/null -u "$SITE_USER:$SITE_PASSWORD" \
    http://127.0.0.1:4173/_app/immutable/assets/lua_fmt_bg.D_18ElAm.wasm

HTTP/1.1 200 OK
Content-Length: 628148
Content-Type: application/wasm
Cache-Control: private, no-store
ETag: "49890b714b7e54485f6abc535b9f5faa"
CF-Cache-Status: HIT
Referrer-Policy: no-referrer
X-Robots-Tag: noindex, nofollow, noarchive
```

That is the complete list — seven headers and nothing else.

**No `Content-Security-Policy` header is set.** `worker/index.js` does not set one, and the assets
binding does not add one. This is why the WASM instantiates today with no configuration at all.

**If a CSP is ever added** — a reasonable Phase 6/7 hardening for a site that talks to hardware —
`script-src` **must** include `'wasm-unsafe-eval'`. Without it the module never instantiates and the
symptom is indistinguishable from "the formatter never initialised": no network error, no obvious
CSP violation in the flow the user sees, just a probe that stays on `pending`. That sentence is now
in `docs/TESTING.md` as well as here.

`e2e/fidelity.e2e.ts` asserts the `content-type` because a **wrong** MIME does not fail loudly
either: `@wasm-fmt/lua_fmt`'s `__wbg_load` falls back from `WebAssembly.instantiateStreaming` to
`WebAssembly.instantiate` with only a console warning, and then runs the slower path forever.

## What the browser actually produced

The probe compiles `aurora` through `$lib/pad` — `compilePreset`, then `costOf`, then `measureLua`
twice — and serialises seven fields. All seven matched `src/lib/fidelity/preset-baseline.json`:

| Field                   | Browser | Fixture |
| ----------------------- | ------- | ------- |
| `preset`                | aurora  | aurora  |
| `setupRawLength`        | 250     | 250     |
| `timerRawLength`        | 55      | 55      |
| `setupCompressedLength` | 249     | 249     |
| `timerCompressedLength` | 54      | 54      |
| `costSetupUsed`         | 250     | 250     |
| `costTimerUsed`         | 55      | 55      |

The browser value of `setupCompressedLength` is not inferred from the pass: the negative run below
printed it as the `Received` side of the diff.

**Console state: empty.** `expect(consoleErrors).toEqual([])` passed, so nothing — not the
formatter, not the fallback warning, not the vendored `HEARTBEAT_INTERVAL` log (which is a
`console.log`, not an error) — produced a console error on the page.

**Timing.** The whole probe test, including page load and the 628 KB WASM fetch, ran in **1.0 s**
on its first (cold `wrangler dev`) run and **623–895 ms** on subsequent runs. The spec's timeout is
30 s deliberately: a timeout there should mean "it never initialised", not "the machine was busy".

## The stale-wrangler preflight

**No stale tree was found.** `netstat -ano | grep -w LISTENING | grep ":4173"` exited 1 and
`tasklist | grep -i workerd` matched nothing, before the first build and again before each of the
four Playwright runs. **No root PID had to be killed for a stale tree.**

One wrangler tree was started deliberately, to capture the header list above, and killed
immediately afterwards. Its shape confirmed the documented chain exactly:

```
375708  node npx-cli.js wrangler dev --port 4173 --ip 127.0.0.1
 372580  cmd.exe /d /s /c wrangler dev ...
  354236  node node_modules/.bin/../wrangler/bin/wrangler.js dev ...
   368776  node node_modules/wrangler/wrangler-dist/cli.js dev ...
    375800  workerd.exe serve --binary --experimental --socket-addr=entry=1
```

`powershell -NoProfile -Command "taskkill /PID 375708 /T /F"` terminated nine processes; 4173 was
free and no `workerd.exe` remained two seconds later. The listener is `workerd.exe`, four levels
below the `npx-cli` root — which is why killing the PID `netstat` reports is not enough.

## The negative check (task 3-06-02)

`e2e/fidelity.e2e.ts` was `git add`ed the moment it first ran green, before any perturbation — on
an untracked path `git checkout --` fails outright and the restore silently becomes a permanent
edit.

Perturbation: `setupCompressedLength: aurora.setupCompressedLength` became
`aurora.setupCompressedLength + 1`, so the expectation moved without a literal number entering the
file.

| State                                    | Command                                   | Result                                                          | Exit code |
| ---------------------------------------- | ----------------------------------------- | --------------------------------------------------------------- | --------- |
| Perturbed                                | `npx playwright test e2e/fidelity.e2e.ts` | `1 failed`, `1 passed (12.1s)`; diff names the field             | **1**     |
| Restored (`git checkout -- e2e/fidelity.e2e.ts`) | same                              | `2 passed (9.1s)`                                                | **0**     |

The failing diff, as observed:

```
- Expected  - 1
+ Received  + 1
...
-   "setupCompressedLength": 250,
+   "setupCompressedLength": 249,
```

The second test ("the probe page is not linked from the site") stayed green, correctly — the
perturbation did not touch it. After the restore, `git diff --quiet -- e2e/fidelity.e2e.ts` exited
**0**.

## Verification results

| Command                                                | Result                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| `npx playwright test e2e/fidelity.e2e.ts`              | `2 passed (9.1s)`; log has no `failed`                              |
| `npm run test:e2e`                                     | `8 passed (10.8s)`, 12 s wall; log has no `failed`                  |
| `npm run test:quick`                                   | `Test Files 11 passed (11)`, `Tests 352 passed \| 1 todo (353)`, 6 s wall |
| `npm run test:sweep`                                   | `Test Files 1 passed (1)`, `Tests 9 passed (9)`, 42 s wall          |
| `npx vitest run` (both projects)                       | `Test Files 12 passed (12)`, `Tests 361 passed \| 1 todo (362)`     |
| `npm run check`                                        | `353 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`               |
| `npm run lint`                                         | exit 0                                                              |
| `npm run build`                                        | exit 0; `build/dev/fidelity/index.html` present, `grep -c pending` prints `1` |
| `ls build/_app/immutable/assets/lua_fmt_bg.*.wasm`     | `lua_fmt_bg.D_18ElAm.wasm`, 628,148 bytes                           |
| `grep -c '^\s*import .*\$lib/pad' +page.svelte`        | **0** (the pad surface is not imported at module scope)             |
| `grep -q 'await import' +page.svelte`                  | exit 0                                                              |
| `grep -rn "dev/fidelity" src/routes/ \| grep -v "src/routes/dev/fidelity/"` | prints nothing                          |
| `grep -Ec "\b(249\|54\|250\|55)\b" e2e/fidelity.e2e.ts` | **0** (no restated numbers)                                        |
| `git check-ignore -q .tmp-e2e/fidelity.log`            | exit 0                                                              |
| `grep -c 'failed' e2e/*.e2e.ts`                        | 0, 0, 0 across all three specs                                      |
| `npx prettier --check docs/TESTING.md`                 | exit 0                                                              |
| `test -f docs/VALIDATION.md`                           | exit 1 (the Nyquist contract stays in the phase folder)             |
| `grep -c "TBD\|fill in" docs/TESTING.md`               | **0**                                                               |

Test counts are unchanged by this plan, as predicted: it adds no Vitest tests and two Playwright
tests (6 existing + 2 = 8).

## Files Created/Modified

**Created:**

- `src/routes/dev/fidelity/+page.svelte` (50 lines) — one `$state` string, one `onMount` that
  dynamically imports `$lib/pad`, one `<p data-testid="fidelity-probe">`. No styling, no
  navigation. The header comment explains why the import is dynamic and inside `onMount`.
- `e2e/fidelity.e2e.ts` (72 lines) — 2 tests. Reads the aurora entry from
  `preset-baseline.json`, records every `.wasm` response and every console error, navigates to
  `/dev/fidelity/` **with** the trailing slash, and asserts the object, the status, the MIME and
  an empty console.
- `docs/TESTING.md` (~170 lines) — seven sections: how to run it (a measured cost table plus the
  three-line sampling rule), why there are two Vitest projects, the green-and-vacuous trap with
  the 176 / 96 / 9 counts, why the vendored tree is excluded from type-checking but not from the
  test run (the 489 `checkJs` errors), what the fidelity suite proves and does not, the
  stale-wrangler preflight in full, and headers and WASM.

**Modified:**

- `.gitignore` — `.tmp-e2e/` added beside `.tmp-format-parity/`.

## Decisions Made

- **The probe goes through `$lib/pad`, not the vendored compiler.** 03-05's SUMMARY recommended it
  and it is the difference between proving that grid-protocol's WASM loads in a browser and proving
  that HANGAR's own gate resolves in a browser against the deployed artifact. The probe awaits
  `compilePreset`, `costOf` and `measureLua`, which is three of the six entry points and both
  load-bearing gates it can reach without a hand-built `CompileResult`.
- **The failure branch writes into the element rather than throwing.** A thrown error inside
  `onMount` leaves the probe on `pending` and Playwright reports a 30 s timeout with no cause. The
  `error: <message>` form puts the cause in the assertion diff. It also means the `not.toHaveText("pending")`
  wait cannot pass vacuously on a broken run — it resolves, and then the object comparison fails
  with the message visible.
- **`.tmp-e2e/` for captured logs, gitignored.** Playwright deletes `test-results/` at the start of
  every run, so a redirect target inside it is unlinked mid-run and the subsequent grep reads a path
  that no longer exists. `.tmp-format-parity/` already established the convention.
- **`/dev/fidelity` ships after launch as an unlinked page.** It is behind Basic Auth until the
  embargo date, the Worker sends `X-Robots-Tag: noindex` on everything, and the page exposes nothing
  but a preset's character counts. Removing it would mean the D-12 proof stops testing the deployed
  artifact. Recorded for `docs/DEPLOY.md`'s launch checklist as a thing to look at, not as a gate on
  this phase.

## Deviations from Plan

None - plan executed exactly as written.

Every fact the plan's `<interfaces>` block asserted was reproduced without adjustment: the hashed
wasm filename and its 628,148 bytes, the `application/wasm` content type, the absence of a CSP, the
`prerender.entries: ["*"]` behaviour, and the trailing-slash requirement. `$lib/pad` resolved by
directory index on the first attempt, so the documented fallback (importing `$lib/pad/index`
explicitly) was not needed.

## Issues Encountered

- **The PowerShell process-tree walk could not be run inline.** The Bash transport strips `$`
  variables from an inline `powershell -Command`, which turned `"ProcessId=$p"` into `"ProcessId="`
  and produced a parser error. Written to a `.ps1` file in the scratchpad and run with
  `-File` instead. Same class of problem as the backslash halving recorded in plans 01 and 03; all
  file contents here were authored with the Write/Edit tools and all backslash-heavy acceptance
  greps were run from `.sh` files.
- **`npx prettier --check` cannot infer a parser for `.gitignore`.** Passing it alongside a `.ts`
  file fails the whole invocation with exit 2. Harmless once known; `npm run lint` handles the file
  set correctly because Prettier's directory walk skips what it cannot parse.
- **`docs/TESTING.md` needed the `npx prettier --write` pass** the plan predicted: the hand-written
  tables were realigned. Scoped to that one file, never `npm run format` unscoped.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 3 is complete. Six plans, six summaries. What Phase 4 inherits:

- **The compile surface is proven in the browser**, not just in node. `$lib/pad`'s
  `compilePreset` / `costOf` / `measureLua` resolve against the deployed artifact in under a
  second on a cold server, so a catalog card that asks for a cost will get one.
- **A worked example of awaiting the gate from a component**: `src/routes/dev/fidelity/+page.svelte`
  is the shortest correct pattern — dynamic `await import("$lib/pad")` inside `onMount`, never at
  module scope, so prerender does not resolve the node condition and the WASM is not fetched until
  something needs it.
- **A standing constraint on Worker hardening**: adding a CSP without `'wasm-unsafe-eval'` in
  `script-src` breaks the compiler silently. Written in `docs/TESTING.md` and here.
- **`docs/TESTING.md`** as the one place to look before running anything, including the preflight
  that stops an hour being lost to a zombie `wrangler dev`.

Deferred, not blocking: whether `/dev/fidelity` should survive the removal of the Basic Auth gate at
launch. It exposes nothing, but it is an unlinked developer page on a public site. Noted for
`docs/DEPLOY.md`'s launch checklist.

No blockers.

---

_Phase: 03-vendor-the-domain_
_Completed: 2026-09-03_

## Self-Check: PASSED

All three created files and this summary exist on disk. All three task commits (`1f598db`,
`0e0202f`, `07d601b`) are present in `git log --oneline --all`, none carries a trailer of any kind
(`git log -1 --format='%(trailers)'` is empty for each), and none of the three messages mentions
Claude. The working tree is clean apart from this summary and the planning files committed
alongside it; port 4173 has no listener and no `workerd.exe` process remains.
