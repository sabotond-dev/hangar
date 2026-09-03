---
phase: 2
slug: walking-skeleton
status: planned
nyquist_compliant: true
wave_0_complete: true
created: 2026-09-02
updated: 2026-09-03
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 (node env, two projects: `server` quick ~4 s, `sweep` ~39 s) + @playwright/test 1.62.1 over `wrangler dev` on `./build` |
| **Config file** | `vite.config.ts` (`test.projects`; no change expected this phase), `playwright.config.ts` (no change expected) |
| **Quick run command** | `npm run test:quick` |
| **Wave run command** | `npm run check && npm run lint && npm run test:quick && npm run test:sweep` |
| **Full suite command** | the wave run plus `npm run build && test -f build/dev/skeleton/index.html` and `npm run test:e2e` |
| **Estimated runtime** | quick ~5 s; sweep ~40 s; e2e ~60-90 s (wrangler cold start 4.6 s) |

**Baseline before this phase:** `test:quick` **11 files / 352 passed | 1 todo**; `test:sweep` 9 tests;
`npx playwright test` **8 passed**. Every count below is that baseline plus what the named plan adds.

**Facts the map depends on (from 02-RESEARCH.md, all executed against the pinned package or read from
firmware source):**

- `@types/w3c-web-serial@1.0.8` is already installed and already in `tsconfig.json`'s `types`.
  `npm run check` is 0 errors today. **This phase installs nothing.**
- `decode_packet_frame` returns `undefined` on all seven failure exits, **never `false`**. The
  desktop's `!== false` guard (`serialport.ts:170-173`) is dead code guarding a real, reachable bug.
- `CONFIG/ACKNOWLEDGE` and `PAGESTORE/ACKNOWLEDGE` echo the request BRC `ID` in `LASTHEADER`
  (`grid_decode.c:1307`, `:947`), so ACKs **are** correlatable. `CONFIG/REPORT` is **not** —
  `VERSIONMAJOR` occupies the same offset 5.
- **A successful `CONFIG/EXECUTE` clears `page_change_enabled` (`grid_decode.c:1279`) and only an
  inbound `HEARTBEAT` with `TYPE 255` restores it (`grid_decode.c:717`); the timeout restore at
  `grid_esp32_port.c:480` is commented out. Every run, in both A/B arms and after any error, ends with
  one.**
- The USB-attached module's `TYPE 1` heartbeat carries the active page in the **same BRC frame**
  (`grid_transport.c:199-203`), four times a second. There is no fetch for the active page and none
  exists — D-10 is answered for free.
- A single BRC frame routinely carries more than one class. Iterate; never take `[0]`.
- `PAGEACTIVE/EXECUTE`, `NVMERASE`, `PAGECLEAR`, `PAGEDISCARD` are forbidden forever (D-06) and a
  structural spec enforces it across `src/lib/protocol/` and `src/lib/transport/`.

**Step-id vocabulary (pinned in wave 2, asserted in wave 5):** `capture.ts` exports `STEP_IDS` —
`identify`, `fetch-setup`, `fetch-timer`, `write-timer`, `write-setup`, `store`, `refetch-setup`,
`refetch-timer`, `restore-page-change`, `burst`. `sequence.ts` uses those constants, the synthetic
fixture's spec asserts the closing step is `restore-page-change` from wave 2, and plan 05's
`fixtures.spec.ts` asserts the same shape against the real capture. A gate cannot be written against
ids that are only discovered after the hardware run.

**Sequencing constraint (honoured by the plan order):** every fixture-backed test before the human
checkpoint runs against the SYNTHETIC fixture (`"source": "synthetic"`, real bytes from
`grid.encode_packet`, invented timing). After the checkpoint, `fixtures.spec.ts` asserts at least one
committed fixture has `"source": "hardware"`, so the phase cannot ship on synthetic data.

---

## Sampling Rate

- **After every task commit:** `npm run test:quick` (~5 s), plus `npm run lint` when a source file changed
- **After every plan wave:** `npm run check && npm run lint && npm run test:quick && npm run test:sweep`
- **Before `/gsd:verify-work`:** full suite incl. `npm run test:e2e` and the build check; then the
  Manual-Only hardware checklist below, run by the user
- **Max feedback latency:** 10 s quick / 60 s wave

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Expected | Status |
|---------|------|------|-------------|-----------|-------------------|----------|--------|
| 2-01-01 | 01 | 1 | FOUND-01 | unit | `npx vitest run --project server src/lib/protocol/constants.spec.ts src/lib/protocol/descriptors.spec.ts src/lib/protocol/forbidden-instructions.spec.ts` | 5 + 10 + 5 = `20 passed` | ⬜ pending |
| 2-01-02 | 01 | 1 | FOUND-01 | unit | `npx vitest run --project server src/lib/protocol/framing.spec.ts src/lib/protocol/decode.spec.ts` | 9 + 5 = `14 passed` | ⬜ pending |
| 2-01-03 | 01 | 1 | FOUND-01 (D-09) | unit | `npx vitest run --project server src/lib/protocol/match.spec.ts src/lib/protocol/write-guard.spec.ts` then `npm run test:quick` | 7 + 6 = `13 passed`; quick `18 files / 399 passed | 1 todo` | ⬜ pending |
| 2-02-01 | 02 | 2 | FOUND-01 (CONN-02/04/05) | unit | `npx vitest run --project server src/lib/transport/transport.spec.ts` | `6 passed` | ⬜ pending |
| 2-02-02 | 02 | 2 | FOUND-01 (D-07) | unit | `npx vitest run --project server src/lib/transport/capture.spec.ts src/lib/transport/fake.spec.ts src/lib/transport/fixtures/synthetic.spec.ts` | 6 + 8 + 3 = `17 passed`, **zero skipped** — regeneration is a module-scope side effect, not a guarded test | ⬜ pending |
| 2-02-03 | 02 | 2 | FOUND-01 (SAFE-07/09 mechanism) | unit | `npx vitest run --project server src/lib/transport/queue.spec.ts` then `npm run test:quick` | `8 passed`; quick `23 files / 430 passed | 1 todo` | ⬜ pending |
| 2-03-01 | 03 | 3 | FOUND-01 (D-10/D-11/D-12) | unit | `npx vitest run --project server src/lib/transport/sequence.spec.ts` | `9 passed` (the ninth: a CONFIG/REPORT never moves the active page); quick `24 files / 439 passed | 1 todo` | ⬜ pending |
| 2-03-02 | 03 | 3 | FOUND-01 (D-05/D-09, CONN-02) | build | `npm run build && test -f build/dev/skeleton/index.html && npm run check && npm run lint`, then the ten-testid loop in the task's acceptance | exit 0; `skeleton-status` present in the prerendered HTML; all ten testids present, including `skeleton-degrade` (rendered **instead of** the connect button when the browser has no Web Serial) and the read-only `skeleton-ports` line the runbook's row P reads | ⬜ pending |
| 2-03-03 | 03 | 3 | FOUND-01 (DEGR-02 shape) | unit + e2e | `npx vitest run --project server src/lib/config-shape.spec.ts` then `npx playwright test` | `12 passed`; quick `24 files / 442 passed | 1 todo`; e2e `10 passed`, zero `failed` in `.tmp-e2e/` | ⬜ pending |
| 2-04-01 | 04 | 4 | FOUND-01 | gate + doc | `npm run check && npm run lint && npm run test:quick && npm run test:sweep && npm run build && npx playwright test` | quick `442 passed | 1 todo`, sweep `9 passed`, e2e `10 passed`; `docs/SKELETON-RUNBOOK.md` exists | ⬜ pending |
| 2-04-02 | 04 | 4 | FOUND-01 crit. 1-4 | **manual (checkpoint:human-verify)** | pre-checkpoint gate only: `npm run check && npm run lint && npm run test:quick && npm run build && test -f docs/SKELETON-RUNBOOK.md` | the human checklist below; user hands back one capture JSON per arm with `"source": "hardware"` | ⬜ pending |
| 2-05-01 | 05 | 5 | FOUND-01 (D-07) | unit | `npx vitest run --project server src/lib/transport/fixtures/fixtures.spec.ts src/lib/transport/fake.spec.ts` | 4 + 8 = `12 passed`; quick `25 files / 446 passed | 1 todo` | ⬜ pending |
| 2-05-02 | 05 | 5 | FOUND-01 crit. 5 (D-08) | unit + doc | `npx vitest run --project server src/lib/skeleton-results.spec.ts` | `6 passed`; quick `26 files / 452 passed | 1 todo`; `docs/SKELETON-RESULTS.md` with no `TBD`, and answer (f) citing `03-06-SUMMARY.md` rather than a fixture | ⬜ pending |
| 2-05-03 | 05 | 5 | FOUND-01 crit. 5 | unit + full | `npx vitest run --project server src/lib/skeleton-results.spec.ts` then the full suite | `7 passed`; quick `26 files / 453 passed | 1 todo`; sweep `9`; e2e `10 passed` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**If a per-file count differs from the table** because a task legitimately needed an extra assertion,
the executing task updates the number here and states the delta in its SUMMARY. A stale count is worse
than no count.

---

## Wave 0 Requirements

**None.** The framework, both Vitest projects, Playwright with Chromium 151.0.7922.34, the wrangler
harness, `.dev.vars` and the `@types/w3c-web-serial` wiring are all present and green
(`npm run check` -> `353 FILES 0 ERRORS`). No install, no config change, no new fixture-directory
convention beyond `src/lib/transport/fixtures/`.

Files the phase creates, by wave:

- **Wave 1** — `src/lib/protocol/{constants,descriptors,framing,decode,match,write-guard,index}.ts` and
  seven specs
- **Wave 2** — `src/lib/transport/{transport,web-serial,capture,fake,queue,index}.ts`,
  `fixtures/synthetic.ts`, `fixtures/synthetic-zona.json`, `scripts/make-synthetic-capture.mjs`,
  five specs
- **Wave 3** — `src/lib/transport/sequence.ts` + spec, `src/routes/dev/skeleton/+page.svelte` (nine
  controls, the `skeleton-degrade` panel, the read-only `skeleton-ports` line, two A/B toggles),
  `e2e/skeleton.e2e.ts`, three new tests in `src/lib/config-shape.spec.ts`
- **Wave 4** — `docs/SKELETON-RUNBOOK.md`
- **Wave 5** — `src/lib/transport/fixtures/zona-hardware.json`, `fixtures/fixtures.spec.ts`,
  `docs/SKELETON-RESULTS.md`, `src/lib/skeleton-results.spec.ts`, revised `constants.ts`,
  updated `docs/TESTING.md`

---

## Manual-Only Verifications (the user, with a ZONA on the desk)

Web Serial is not automatable — no CDP domain, no fake-device hook. Criteria 1 to 4 are a checklist
for a person. The full version lives in `docs/SKELETON-RUNBOOK.md`, written in task 2-04-01; this
table is the contract it must match step for step.

**Preconditions, stated so a failure is not misdiagnosed:**

- Grid Editor **fully quit** — tray icon, Quit, not just the window closed (except step 0, which needs
  it running on purpose).
- The module carries its **factory configuration** (D-02).
- **Only the ZONA is attached** — another Grid module makes the page disable the store button, which is
  correct (D-12) and ends the run early.
- Served over HTTPS on the deployed preview URL (**the user deploys; the executor never does**) or over
  `http://localhost` via `npm run preview`. **Never `file://`** — not a secure context, so
  `navigator.serial` is simply absent and the page correctly shows its degrade state.
- **Keep the tab in the foreground.** A backgrounded tab throttles timers and invalidates every latency
  measurement.
- Chrome, Edge, or Firefox 151+. On Firefox a site-permission prompt appears **before** the port
  chooser — normal, not an extension install.

| # | Behavior | Requirement | Exact steps | Passes when |
|---|----------|-------------|-------------|-------------|
| **0** | Port-conflict message | CONN-04 (D-04) | With Grid Editor **running and connected**, click `Connect` and pick the ZONA | The page names Grid Editor and lists the recovery in order — quit from the tray icon, unplug, wait, replug, reload, connect. Not a raw `Failed to open serial port.` Then quit the Editor and continue |
| **1** | Connect and identify | crit. 1, CONN-07 | Click `Connect`; look at the chooser before picking; pick the ZONA | The picker lists one device and no bootloader entry. Within about a second the page shows `ZONA`, its revision, firmware `M.m.p`, its SX/SY, heartbeat `TYPE 1`, and an active page number read from the module |
| **2** | Fetch | crit. 2 | Click `Fetch` | Both strings appear verbatim with their character counts and an acknowledgement latency each. Neither empty, neither 909 or longer. Setup several hundred characters (the package default is 641), Timer short (22) |
| **3** | Write back and store | crit. 3, SAFE-07 | Click `Write back (RAM)` — Timer first, then Setup — then `Store to flash - writes the config that is already there` | Three acknowledgements, each with its own latency, each reported separately. Border LEDs animate yellow-dim during the store and settle. No negative acknowledgement. At most one retry, which then succeeds |
| **4** | Byte identity | crit. 4 | Click `Re-fetch` | The page reports byte-identical: yes, for both events, against what step 2 captured |
| **A/B-1** | Heartbeat off | crit. 5 (a) | Reload; set host heartbeat **off**; repeat 1-4 | Record whether inbound heartbeats keep arriving at 3/s or more for at least 10 s and whether all three acknowledgements still arrive, against the definition printed on the page |
| **A/B-2** | Pacing burst | crit. 5 (b) | On each arm click `Run burst probe` at 10 ms and at 0 ms | 20 read-only `CONFIG/FETCH` each. Record timeouts, negative acknowledgements and the latency spread |
| **R** | **Restore — mandatory, every arm** | safety (`grid_decode.c:1279`/`:717`) | The page sends one `HEARTBEAT TYPE 255` automatically at the end of every run. If anything went wrong, click `Restore heartbeat` before closing the tab | The page reports `page change restored`. **No arm is complete without this row** — a config write leaves the module unable to change page until this heartbeat arrives or it is power-cycled |
| **E** | Export | crit. 5 (D-07) | Click `Export JSON` on each arm | One JSON per arm, including the burst results. Hand the files back |
| **P** | Permission persistence | Phase 6 input | After the run, quit the browser, reopen it, open the page and read the `skeleton-ports` line reporting how many ports this origin has already been granted | The number is recorded in `docs/SKELETON-RESULTS.md`. The page renders this as an observation on load and never reconnects on its own — silent reconnect is CONN-06 and belongs to Phase 6 |

The executor waits at task 2-04-02, then plan 05 commits the captures under
`src/lib/transport/fixtures/`, re-points the replay test at the real one, and writes
`docs/SKELETON-RESULTS.md` from the JSON.

---

## Negative checks (observe red before trusting)

| Gate | Task | How to make it red | Expected |
|------|------|--------------------|----------|
| Descriptor length refusal | 2-01-01 | change `sendConfig`'s guard from `>=` to `>` | descriptors.spec test 8 red, naming the 909 case |
| Frame scanner delimiter | 2-01-02 | drop the `EOT` half of the condition, leaving only the terminator; and separately feed a torn frame with no terminator | framing.spec test 9 red; the torn frame emits zero frames and the buffer retains all of it |
| Matcher ordering | 2-01-03 | move the HEARTBEAT early return after the class-name check | match.spec test 1 red — a heartbeat must never resolve a waiter |
| Recovery order | 2-02-01 | reorder `steps` so `Reload` precedes `Plug` | transport.spec test 4 red |
| Synthetic fixture integrity | 2-02-02 | delete one recorded rx chunk from the committed JSON | synthetic.spec test 2 red on the frame count |
| Retry bound | 2-02-03 | raise `attempts` to 4 | queue.spec test 3 red reporting 4 writes where 3 were expected |
| **The restore rule** | **2-03-01** | **delete the `finally` from `runNoOpCycle`** | **sequence.spec test 7 red — the restore heartbeat must be sent even when a write is refused. Quote the red line verbatim in the SUMMARY** |
| Degrade path | 2-03-03 | render the connect button unconditionally | skeleton e2e test 1 red on the control count |
| Step-id vocabulary | 2-02-02 | drop the closing step from the synthetic capture | synthetic.spec test 3 red — the same shape plan 05 asserts against real data, failing in wave 2 where it is cheap |
| Hardware-fixture gate | 2-05-01 | change the fixture's `source` to `synthetic` | fixtures.spec test 1 red — the phase cannot ship on synthetic data |
| Results citations | 2-05-02 | replace one cited fixture filename with one that does not exist | skeleton-results.spec test 4 red, naming the missing file |
| Timeout drift | 2-05-03 | change `TIMEOUTS.executeMs` by one | skeleton-results.spec test 7 red, naming both numbers |

---

## Validation Sign-Off

- [x] All tasks have an `<automated>` verify (the checkpoint's is its pre-checkpoint gate; its human
      steps are in `<how-to-verify>`)
- [x] Sampling continuity: no 3 consecutive tasks without an automated verify
- [x] Wave 0 covers all MISSING references — there are none; nothing is installed
- [x] No watch-mode flags anywhere
- [x] Feedback latency < 10 s quick / < 60 s wave
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planned 2026-09-03
