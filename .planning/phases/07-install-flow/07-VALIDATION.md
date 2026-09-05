---
phase: 7
slug: install-flow
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-05
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is the Nyquist contract. `docs/TESTING.md` (updated by plan 07-13) is the developer-facing
> companion and deliberately does not duplicate the map below. There is no `docs/VALIDATION.md`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x (node env, `expect.requireAssertions`, `passWithNoTests`), two projects: `server` (quick) and `sweep` + @playwright/test 1.62.1 over `wrangler dev` on `./build`, two projects: `chromium` and `webkit-phone` grepped on `@webkit` |
| **Config file** | `vite.config.ts` (Vitest) and `playwright.config.ts` — **neither is edited in this phase.** No new project, no new include, no new browser. `src/**/*.{test,spec}.{js,ts}` already collects `src/lib/device/` |
| **Quick run** | `npm run test:quick` (= `vitest run --project server`) |
| **Sweep** | `npm run test:sweep` (= `vitest run --project sweep`) |
| **Wave run** | `npm run check && npm run lint && npm run test:quick && npm run test:sweep` |
| **Full suite** | the wave run plus `npm run build` and `npm run test:e2e` |
| **Count gate** | `… 2>&1 \| node scripts/check-counts.mjs <files> <tests>` — **baseline + delta only, never a literal total (Phase 8 D-17)** |
| **New dependency** | **none.** Everything this phase needs is installed and pinned |
| **Hardware** | **none, to any agent.** Every gate runs against `FakeTransport` in node or the fake serial shim plus a Node-side scripted ZONA in Playwright. The first write to a real ZONA is the user's click at 07-13's checkpoint |

**Baselines are NOT known at planning time.** Phase 6 was executing while this phase was planned
(06-03 in flight at planning; 06-04's `absorbFrame` clock landed while the plans were being written),
so no number in `07-RESEARCH.md` (`quick 66 files / 692`, `sweep 3 / 13`, `e2e 61`) is asserted
anywhere. **Task 07-01-01 confirms Phase 6 has closed** (`06-14-SUMMARY.md` on disk with its
five-name block) **and re-measures all five on the clean tree**, reconciling them against 06-14's
closing block, and records them in `07-01-SUMMARY.md` as the Phase 7 baseline. The e2e total is
recorded twice, under `BASE_E2E` and `PREV_E2E`, from the one run.

### The five-name carry-forward block

Phase 5.1 established it, Phase 6 carried it, and this phase inherits it unchanged:

> **Every SUMMARY in this phase carries the same five names, whether or not that plan moved them.**

| Name | What it is | How it moves |
|---|---|---|
| `BASE_FILES` | the `test:quick` **file** count as that plan left the tree | re-measured by every plan that changes it; copied verbatim otherwise |
| `BASE_TESTS` | the `test:quick` **test** count as that plan left the tree | same |
| `BASE_SWEEP` | the literal the sweep printed — expected `3 13` | never re-derived; this phase adds no `*.sweep.spec.ts`. **If 07-01 observes a different literal, that literal is the phase's and every plan quotes it** |
| `BASE_E2E` | the Playwright total **on the clean tree Phase 6 closed**, measured once in 07-01 | **never moves.** 07-13's phase gate asserts `BASE_E2E + 12` against it |
| `PREV_E2E` | the **last measured** Playwright total, with the plan that measured it named beside it | starts **equal to `BASE_E2E`**; re-measured by 07-08 and 07-12 (the two plans that add titles) and by 07-13; copied verbatim by every other plan |

A plan's `PREV_FILES` / `PREV_TESTS` are the immediately preceding SUMMARY's `BASE_FILES` /
`BASE_TESTS`. Any plan that finds a name missing from the SUMMARY it reads **stops rather than
guessing**. `BASE_CHECK` (the `svelte-check` file count) is provenance only; only `0 errors` is
asserted.

### Facts the map depends on

Read from this repository on 2026-09-05 by the planner, from the sources, not estimated.

- **Phase 7 starts only after Phase 6 closes.** 07-04 edits `session.svelte.ts`, `session.spec.ts`,
  `session-copy.ts` and `session-copy.spec.ts`; 07-10 edits `TryOnDevice.svelte`; 07-11 edits
  `DeviceDetails.svelte` and `e2e/first-experience.e2e.ts`; 07-08 extends `e2e/fake-serial.ts`. Every
  one of those is a Phase 6 file until 06-14 lands. 07-01-01 asserts the closure and stops otherwise.
- **The runes-in-node assumption is already a measurement.** 06-01's spike showed a `.svelte.ts`
  module is compiled and collected by the `server` project and that a `$state` field arrives in node
  as a plain own class property. `install.svelte.ts` rests on that and on the same rule against
  `$derived` (derived answers are methods). No spike is repeated.
- **`GridTransport` carries exactly ONE `onData` callback** (`transport.ts:12`, `web-serial.ts`,
  `fake.ts:110`). Phase 6's session registers it after identification and folds heartbeats through
  it. A second registration silently unhooks the fold. 07-04's `onClass` seam is the only way a
  second consumer receives frames, and the transport view the session hands out has an `onData` that
  **throws** — asserted in `session.spec.ts` test 19.
- **`session.spec.ts` test 15 scans `session.svelte.ts` for eight write-shaped needles** (`.write(`,
  `RequestQueue`, `sendConfig`, `storePage`, `fetchConfig`, `writeBack`, `storeToFlash`,
  `hostHeartbeat`). Every write of this phase therefore lives in `install.svelte.ts`, and the session's
  write view is built with `transport.write.bind(transport)` — `write.bind(` is not `.write(` — with the
  comment saying it is the one place the session names `write` and still never calls it.
- **`session.svelte.ts` keeps exactly four static `from` specifiers; `install.svelte.ts` has exactly
  three** (`./install-copy`, `./snapshot`, `./session.svelte`). Both files are on the first paint of
  `/c/{id}/` through the panel; `config-shape.spec.ts` test 13 walks them, and 07-08 widens
  `PERMITTED_SPECIFIERS` by three exact paths before the layout names the install store.
- **`canWriteBack` rejects an empty string**, and D-03 (a `[user]` decision) says "present and
  non-empty". 07-UI-SPEC's Z-16 proposes that an empty fetched string is a valid snapshot. **D-03
  wins**: the store lands `snapshot-failed` on an empty string. Z-16 is carried as an open question
  for the user (see § Open questions), not implemented.
- **`buildTuner` publishes no strings today** — only meters, ladder, over-budget and stamp. 07-05's
  `onconfig` emit inside `land()` is the only channel from the tuner to the wire, and its
  `undefined` on every `feed = "stale"` is what disables the primary control inside the 120 ms
  debounce window.
- **`cost().used === setupLua.length` with reserve 0/0** across all nine shelf presets (07-RESEARCH's
  measurement, re-derived by `wire-pin.spec.ts` test 1). The strings go on the wire verbatim; a
  compression at install time is one character shorter per action and is the negative check.
- **Playwright resolves `$lib/protocol` inside `src/lib/transport/fixtures/synthetic.ts`.** Measured
  on 2026-09-05 with a scratch config outside the tree: a test importing `synthetic.ts` by path
  listed and passed (`1 passed (590ms)`), and the pinned package's own `HEARTBEAT_INTERVAL` log line
  appeared under Playwright's loader. That is what lets `e2e/fake-zona.ts` be the real
  `zonaResponder` exposed into the page rather than a second fake.
- **`config-shape.spec.ts` test 12 is generalised** (06-05) to every directory under
  `src/routes/dev/`, so `/dev/install/` is covered the moment it exists; test 14 reads `build/` and
  is a no-op without a fresh build — 07-08, 07-10 and 07-13 build first.
- **`e2e/first-experience.e2e.ts`'s degrade test asserts the unsupported copy inside
  `connect-status`.** The panel keeps the capability block (06-12's decision), so the test stays green
  through 07-10 unedited and is **extended** in 07-11 with three appended assertions and no new title.
- **No lint rule bans `setInterval`** (Phase 6 deferred item 3). Every ban in this phase is a per-file
  source scan: `install.spec.ts` tests 8 and 18, `device-ui.spec.ts` test 8.
- **The e2e arithmetic is tag-sensitive.** `chromium` runs everything; `webkit-phone` runs only
  `@webkit` titles. **A tagged title adds 2 to the suite total; an untagged one adds 1.** 07-08 adds
  six untagged (+6); 07-12 adds four untagged and one tagged (+6). Total **+12**.
- **Firmware writes Setup before Timer to flash** — the reverse of the RAM order — under an unplug
  during a store (STATE.md's Phase 7 note). No mitigation exists in software; it is a runbook caution
  on row E and a deferred item.

### The architectural decisions this phase's plans make, so the checker can see them

| Decision | Where | Why |
|---|---|---|
| The writes live in a **second runes store**, `install.svelte.ts`, never in the session | 07-06 | Phase 6's never-writes gate is a source scan of `session.svelte.ts`; growing the session turns it red with no honest replacement. A separate file keeps a structural guarantee |
| The session gains **six members** — the write view, `onClass`, `onConnection`, `announce`, `writeLock`, `unpluggedWhileWriting` — and no seventh static specifier | 07-04 | D-16's seam plus what the header lock (Z-15) and the one live region (Z-17) need; all scalars, a `Set` and bound methods |
| The write view's `onData` **throws** naming `onClass` | 07-04 | D-16 says a second raw registration is forbidden and a spec asserts it; a throw is assertable, a comment is not |
| **`writeBoth(q, target, strings)`** is the one writer; `writeBack` is an adapter | 07-02 | TRY ON DEVICE and PUT BACK on one hardware-proven path; the vendored `writePad` is a source, not a second writer |
| `storeToFlash`'s throw is removed and `sequence.spec.ts` test 3 is **rewritten**; `Identity.storeAllowed` stays as an informational field | 07-02 | D-18 names the edit; SAFE-06 supersedes Phase 2's D-12; deleting the field would churn captures and `fixtures.spec.ts` for nothing |
| The durable key is `SERIALNUMBER/FETCH` **addressed** to the ZONA; a timeout degrades to a **session-only** snapshot with its own honest sentence | 07-01, 07-06, 07-04 | D-04 amended; a content hash is broken, not weaker (the strings change on the first write); a broadcast on a rig gets N indistinguishable reports (asserted in `synthetic.spec.ts` test 6) |
| The record is keyed **module, then page**, and **never overwritten or deleted** | 07-03 | Pitfall 4 (cross-page restore), Pitfall 9 (the in-memory copy is the rail), Z-13 (forgetting a permission keeps the copy) |
| The store's phases are **fourteen**, named as 07-UI-SPEC's I0–I13 with `snapshot-failed` standing for I9 cause 4; a NACK on the first leg is `nothing-landed` and on the second `partial`, with `cause` recorded and rendered nowhere | 07-06, 07-07 | The UI spec carries no NACK-specific block; the classification is exact and testable, the copy gap is a deferred item |
| **D-03 over Z-16**: an empty fetched string is `snapshot-failed` | 07-06 | A `[user]` decision outranks an `[orchestrator]` UI reading; `canWriteBack` already knows the empty string is the shape of a non-active-page fetch |
| `onconfig` fires **inside `land()`** with the pair and **`undefined` on every stale** | 07-05 | D-17; Pitfall 5's race becomes a structural property; `TRY ON DEVICE` disabled for the 120 ms window |
| The e2e ZONA is **the real `zonaResponder` in Node**, exposed through `page.exposeFunction`, with scripted faults on top | 07-08 | One fake, not two; the request id read off the real wire; measured resolvable at planning time |
| A **probe with a phase trace** (`/dev/install/`) proves the fourteen states before the chrome exists | 07-08 | A 40 ms `writing` never stays on screen; a trace makes transients assertable |
| `KEEP ON DEVICE` moves to the **Quiet** tier; the confirmation's affirmative is Secondary; **no third colour** | 07-09, 07-10 | Z-01, Z-02: SAFE-02 made literal; the block carries the warning by copy, weight and layout |
| `PUT BACK` is **absent** on an incapable browser, and the degrade test is **extended** with `toHaveCount(0)` | 07-11 | Z-12: offering to restore nothing is worse than no control; the shipped assertions stay byte-identical |
| `PUT BACK` after a keep **stores too**, with no confirmation | 07-07 | Z-04: a gate on the escape hatch is the one place a gate does harm |
| The header **never shows an install state**; it **locks** its two controls under `writeLock` on every leg | 07-11 | Z-15: the slot is sized on four labels and a write lasts two frames; the two controls are the one way a visitor can produce `partial` by hand |
| The twelve install utterances go through **`session.announce`** into Phase 6's one region; the session's own unplug utterance is **suppressed under `writeLock`** | 07-04, 07-07 | Y-16, Z-11, Z-17: one region, one utterance per outcome, and never a false `Nothing was written` |
| The pacing escalation and the three re-fetch rounds ship as **fields the probe shows and the runbook asks about** | 07-07, 07-13 | D-19: the two unmeasured timings become measurements rather than guesses |

### Why the waves are serial

No two plans in this phase run concurrently, for the same arithmetic reason Phases 5.1 and 6 gave:
every acceptance criterion asserts an exact cumulative count, and two plans adding specs in the same
wave would both compute the wrong total. The `wave` numbers in the frontmatter are dependency
groupings, one plan each; `depends_on` names the previous plan explicitly. Serial waves cost wall
time and buy a gate that cannot be green for the wrong reason.

### Expected deltas after each plan

| Plan | `test:quick` files | `test:quick` tests | `test:sweep` | `test:e2e` |
|---|---|---|---|---|
| 07-01 | +0 | **+2** | 3 / 13 | unchanged (measured) |
| 07-02 | +0 | **+5** | 3 / 13 | unchanged |
| 07-03 | **+2** | **+13** | 3 / 13 | unchanged |
| 07-04 | +0 | **+4** | 3 / 13 | unchanged |
| 07-05 | **+1** | **+6** | 3 / 13 | unchanged |
| 07-06 | **+1** | **+8** | 3 / 13 | unchanged |
| 07-07 | +0 | **+10** | 3 / 13 | unchanged |
| 07-08 | +0 | +0 | 3 / 13 | **+6** |
| 07-09 | +0 | **+2** | 3 / 13 | unchanged |
| 07-10 | +0 | **+1** | 3 / 13 | unchanged |
| 07-11 | +0 | **+1** | 3 / 13 | unchanged (three assertions appended to an existing title) |
| 07-12 | +0 | +0 | 3 / 13 | **+6** |
| 07-13 | +0 | +0 | 3 / 13 | unchanged (re-measured) |
| **Phase total** | **+4** | **+52** | **unchanged** | **+12** |

The e2e arithmetic written out: 07-08 adds six untagged probe walks (**+6**); 07-12 adds four untagged
titles on the real page and one `@webkit` title (4 + 2 = **+6**). Total **+12**. 07-11 adds
assertions to an existing title and moves nothing.

Per-file counts, which **are** asserted absolutely:

| File | Tests | Plan |
|---|---|---|
| `src/lib/protocol/descriptors.spec.ts` | 10 → **12** | 07-01 |
| `src/lib/protocol/forbidden-instructions.spec.ts` | **5**, unchanged (test 4 widened to five builders) | 07-01 |
| `src/lib/transport/sequence.spec.ts` | 9 → **11** (test 3 rewritten) | 07-02 |
| `src/lib/transport/fixtures/synthetic.spec.ts` | 3 → **6** | 07-02 |
| `src/lib/device/snapshot.spec.ts` | **7** | 07-03 |
| `src/lib/device/install-copy.spec.ts` | **6** | 07-03 |
| `src/lib/device/session.spec.ts` | 17 → **21** | 07-04 |
| `src/lib/device/session-copy.spec.ts` | **6**, unchanged (test 5 rewritten) | 07-04 |
| `src/lib/tune/model.spec.ts` | 8 → **10** | 07-05 |
| `src/lib/device/wire-pin.spec.ts` | **4** | 07-05 |
| `src/lib/device/install.spec.ts` | **8**, then **18** | 07-06, 07-07 |
| `src/lib/config-shape.spec.ts` | **14**, unchanged (allow-list widened by three, walked) | 07-08, 07-09 |
| `src/lib/ui/device-ui.spec.ts` | 7 → **9** → **10** → **11** | 07-09, 07-10, 07-11 |
| `e2e/install.e2e.ts` | **6** titles, then **11** titles / 12 runs | 07-08, 07-12 |
| `e2e/first-experience.e2e.ts` | title count unchanged; three assertions appended | 07-11 |

Standing gates that must be green at the phase gate and are **not** edited: `src/lib/ui/identity.spec.ts`
(**6**), `src/lib/ui/tune-ui.spec.ts` (**5**), `src/lib/catalog/front-door.spec.ts`,
`src/lib/catalog/lua-entries.spec.ts`, `src/lib/sim/lazy.spec.ts` (**3**), `src/lib/transport/fixtures/fixtures.spec.ts`
(**4** — its superset check over `STEP_IDS` absorbs `fetch-serial`), `e2e/catalog.e2e.ts` (**2**),
`e2e/session.e2e.ts` (**14**), and `e2e/tuning-webkit.e2e.ts`.

### The new cost

| Suite | Threshold | If exceeded |
|---|---|---|
| `src/lib/device/*.spec.ts` | none stated — the four new files are pure node over `FakeTransport`, fake timers and a Map-backed storage; `wire-pin.spec.ts` compiles every catalog entry once behind `padReady()` (WASM, ~1 s cold) | record the wall time; do not trim entries from the pin |
| `e2e/install.e2e.ts` | none stated; two tests wait out a 3000 ms `pagestoreMs` timeout three times per leg and one waits 2000 ms for the slow line, so the file costs roughly 25–40 s on `chromium`; 07-08's test 6 (~19 s of retries) and 07-12's test 10 are `test.slow()` against Playwright's default 30 s per-test budget, which `playwright.config.ts` leaves unset | record each slow test's wall time; do not shorten the timeouts under test — they are the shipped constants |
| `npm run test:sweep` | **unchanged.** This phase adds no `*.sweep.spec.ts` | if it moves, something was misfiled |

---

## Requirement ownership

`.planning/ROADMAP.md` maps **SAFE-01 to SAFE-09 and DEGR-02** to Phase 7 and this phase closes all
ten, each with a qualifier that must appear in 07-13's SUMMARY and in the traceability pass:

| Requirement | Closed by | Qualifier |
|---|---|---|
| SAFE-01 | 07-13 | Zero config writes without a click, **by class**, in node (`install.spec.ts` 4) and in a browser (`install.e2e.ts` 1); every write attributable to one of three clicks; the session's source scan still clean; both never-writes surfaces in the present tense - the header note's `SAFE_PROMISE` amended in 07-04, the panel's two literals retired in 07-10 |
| SAFE-02 | 07-13 | Primary full-width accent; `KEEP ON DEVICE` in the Quiet tier a hairline, a region and `PUT BACK` away; live only after a settled try-on (Z-05). **RAM-only on hardware is runbook row D** |
| SAFE-03 | 07-13 | Snapshot before any control enables, in the gated order (`fetch-serial`, `fetch-setup`, `fetch-timer`, `canWriteBack`, memory, then storage); `PUT BACK` one click from every state with a session. **Row C is user-pending** |
| SAFE-04 | 07-13 | The record keyed by serial and page, never overwritten, surviving a throwing store; **the key is wire-unproven** — `SERIALNUMBER/FETCH` is source-verified and no capture holds it; the session-only degrade is honest and tested. **Rows A and F are user-pending; a failed row A closes SAFE-04 as partially verified, not as a lie** |
| SAFE-05 | 07-13 | The confirmation names the touch element and the power cycle before the store is sent; `role="group"`, focus on the container, two exits plus Escape. **Row E is user-pending** |
| SAFE-06 | 07-13 | Against a synthetic rig: three acknowledgements resolve one store, the sentence names the modules in `sx` order, the action stays allowed; Phase 2's refusal undone by name. **Row G is optional and user-pending — every frame Phase 2 recorded carried SX 0, SY 0** |
| SAFE-07 | 07-13 | Settled from the acknowledgements only; a dropped second ACK is `partial` naming Setup with retry and `PUT BACK` offered; a NACK on the first leg is `nothing-landed`; the bytes are the meters' (`wire-pin.spec.ts`). Proven against scripted faults in node and in a browser — which is what the criterion asks for |
| SAFE-08 | 07-13 | "About a second" once, before the click (Z-08); no bar, no spinner, no minimum duration; the busy label swaps in 0 ms; the 2000 ms line is the one escape hatch. **Wall time on hardware is row B** |
| SAFE-09 | 07-13 | Three attempts and no more; a NACK and an abort never retried; a lost link a named state with `PUT BACK` waiting for the module; pacing escalates once and the attempt count does not move |
| DEGR-02 | 07-13 | On WebKit at a phone viewport: `TRY ON DEVICE` and `KEEP ON DEVICE` present, disabled, explained; `PUT BACK` absent by decision (Z-12); the shipped degrade test extended, its original assertions byte-identical |

---

## Sampling Rate

- **After every task commit:** `npm run test:quick`, plus `npm run lint` for HANGAR-owned files, plus
  `npm run check` for any task touching `.svelte` or `.ts`.
- **After every plan wave:** `npm run check && npm run lint && npm run test:quick && npm run test:sweep`.
- **After any task that changes what a build contains:** `npm run build`, then `test:quick` **again** —
  `config-shape.spec.ts` test 14 reads `build/`. Waves 8, 10 and 13 do this.
- **Before `/gsd:verify-work`:** the full suite including `npm run build` and `npm run test:e2e`
  against the **production static build** — plan 07-13 runs it as its second task.
- **Max feedback latency:** ~35 s (quick), ~3 min (wave with the sweep), ~3 min (e2e with the build).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | all | precondition + baseline | Phase 6 closed (06-14-SUMMARY on disk); five baselines re-measured on the clean tree (`BASE_E2E` = `PREV_E2E`); ten per-file counts recorded | exists | ⬜ pending |
| 07-01-02 | 01 | 1 | SAFE-04 | type | `npm run check` `0 errors`; the protocol and fixtures specs green **unedited**; `STEP_IDS` has eleven members | exists | ⬜ pending |
| 07-01-03 | 01 | 1 | SAFE-01, SAFE-04 | unit | `... descriptors.spec.ts` **12**; `... forbidden-instructions.spec.ts` **5** with test 4 saying five; quick +0 / +2 | exists | ⬜ pending |
| 07-02-01 | 02 | 2 | SAFE-03, SAFE-06 | type | `npm run check` `0 errors`; `storeToFlash` has no `throw`; `writeBack` calls `writeBoth` | exists | ⬜ pending |
| 07-02-02 | 02 | 2 | SAFE-06, SAFE-07 | unit | `... synthetic.spec.ts` **6**; no other spec edited | exists | ⬜ pending |
| 07-02-03 | 02 | 2 | SAFE-03, SAFE-06, SAFE-07 | unit | `... sequence.spec.ts` **11** with test 3 rewritten; quick +0 / +5 | exists | ⬜ pending |
| 07-03-01 | 03 | 3 | SAFE-04 | unit | `... snapshot.spec.ts` **7**; zero specifiers; no `removeItem` call | created here | ⬜ pending |
| 07-03-02 | 03 | 3 | SAFE-05, SAFE-08 | type + measured | `npm run check` `0 errors`; zero specifiers; fourteen lengths recorded under their caps | created here | ⬜ pending |
| 07-03-03 | 03 | 3 | SAFE-05, SAFE-08 | unit | `... install-copy.spec.ts` **6**; the scripted match's OK/MISS list; quick +2 / +13 | created here | ⬜ pending |
| 07-04-01 | 04 | 4 | SAFE-01 | source | `session.spec.ts` **17** green **unedited**; exactly four `from "`; `.write(` zero, `write.bind(` once | exists | ⬜ pending |
| 07-04-02 | 04 | 4 | SAFE-04, SAFE-09 | unit | `... session-copy.spec.ts` **6** with test 5 rewritten (`REVOKE_EXPLANATION` and `SAFE_PROMISE`); six measured lengths, `SAFE_PROMISE` 88; test 1 still zero specifiers | exists | ⬜ pending |
| 07-04-03 | 04 | 4 | SAFE-01, SAFE-09 | unit | `... session.spec.ts` **21**; test 15 unedited; quick +0 / +4 | exists | ⬜ pending |
| 07-05-01 | 05 | 5 | SAFE-07 | unit | `... model.spec.ts` **10**; stale count equals undefined-emit count | exists | ⬜ pending |
| 07-05-02 | 05 | 5 | SAFE-02 | source | `tune-ui.spec.ts` **5**, `config-shape.spec.ts` **14**; no new `from` specifier in the three components | exists | ⬜ pending |
| 07-05-03 | 05 | 5 | SAFE-07 | unit | `... wire-pin.spec.ts` **4**; the pin table with `mismatches: 0`; quick +1 / +6 | created here | ⬜ pending |
| 07-06-01 | 06 | 6 | SAFE-03, SAFE-04 | source | `npm run check` `0 errors`; exactly three `from "`; `.onData(`, `.write(`, `setInterval`, `$derived` all zero; `session.spec.ts` still **21** | created here | ⬜ pending |
| 07-06-02 | 06 | 6 | SAFE-01, SAFE-07 | source | `npm run check` `0 errors`; the `finally` restores and unlocks; `#classify` by `instanceof`, no regex | exists | ⬜ pending |
| 07-06-03 | 06 | 6 | SAFE-01, 03, 04, 07 | unit | `... install.spec.ts` **8**; quick +1 / +8 | created here | ⬜ pending |
| 07-07-01 | 07 | 7 | SAFE-05, SAFE-06 | source | `npm run check` `0 errors`; the store leg waits a heartbeat then loops ≤ 3; `keepReason` is the seven-row table | exists | ⬜ pending |
| 07-07-02 | 07 | 7 | SAFE-07, SAFE-08, SAFE-09 | source | `npm run check` `0 errors`; `instanceof` twice, no regex; `DESKTOP_PRE_SEND_DELAY_MS` from the awaited module; a `setTimeout` for the slow line | exists | ⬜ pending |
| 07-07-03 | 07 | 7 | SAFE-05..09 | unit | `... install.spec.ts` **18**; quick +0 / +10 | exists | ⬜ pending |
| 07-08-01 | 08 | 8 | SAFE-01 | fixture | `npx playwright test --list` collects no title from `fake-zona.ts`; the round-trip self-check recorded and deleted | created here | ⬜ pending |
| 07-08-02 | 08 | 8 | SAFE-01 | build + source | `build/dev/install/index.html` exists; `config-shape.spec.ts` **14** after a build with three new permitted paths; the probe-path mutation red on test 12 | created here | ⬜ pending |
| 07-08-03 | 08 | 8 | SAFE-01, 03, 07, 09 | e2e | `... e2e/install.e2e.ts --project chromium` **6 passed**; suite `PREV_E2E + 6`; the fourteen-state table | created here | ⬜ pending |
| 07-09-01 | 09 | 9 | SAFE-01 | source (mutations) | `config-shape.spec.ts` **14**; three mutations observed red (direct marker, the walk through `install.svelte`, the walk through `install-copy`) | exists | ⬜ pending |
| 07-09-02 | 09 | 9 | SAFE-02, SAFE-05 | type + measured | the 72px cell constant across three lines; the group's focus order; the rig sentence with two modules; the probe unchanged in the diff | created here | ⬜ pending |
| 07-09-03 | 09 | 9 | SAFE-02, SAFE-05, DEGR-02 | unit (source) | `... device-ui.spec.ts` **9**; quick +0 / +2 | created here | ⬜ pending |
| 07-10-01 | 10 | 10 | SAFE-01, SAFE-08 | type + measured | `npm run check` `0 errors`; neither `never writes` nor `next release` in the source; the five-twin slot's height constant; `first-experience.e2e.ts` green **unedited** | exists | ⬜ pending |
| 07-10-02 | 10 | 10 | SAFE-02 | type + measured | the 48px cell constant across seven strings; never both `keep-on-device` and `keep-confirm-yes`; Escape's two rules observed | exists | ⬜ pending |
| 07-10-03 | 10 | 10 | SAFE-02, DEGR-02 | unit (source) + build | `... device-ui.spec.ts` **10**; `config-shape.spec.ts` **14** after a fresh build; quick +0 / +1 | exists | ⬜ pending |
| 07-11-01 | 11 | 11 | SAFE-01, SAFE-04 | type + observed | both header controls disabled during a delayed RAM leg **and** a delayed store leg; the snapshot line in both forms; `DeviceSlot` and `SessionAnnouncer` absent from the diff | exists | ⬜ pending |
| 07-11-02 | 11 | 11 | DEGR-02 | unit + e2e | `... device-ui.spec.ts` **11**; `first-experience.e2e.ts` passes with three appended assertions and the originals byte-identical; e2e total unchanged; quick +0 / +1 | exists | ⬜ pending |
| 07-12-01 | 12 | 12 | SAFE-02, SAFE-05, SAFE-08 | e2e | `... e2e/install.e2e.ts --project chromium` **9 passed** | exists | ⬜ pending |
| 07-12-02 | 12 | 12 | SAFE-08, DEGR-02 | e2e, two projects | `... e2e/install.e2e.ts` **12 passed** across both projects; suite `PREV_E2E + 6`; the removed-tag arithmetic observed | exists | ⬜ pending |
| 07-13-01 | 13 | 13 | all | docs | seven rows with pass conditions, three bolded measurements, two warnings; no engine named | created here | ⬜ pending |
| 07-13-02 | 13 | 13 | **SAFE-01..09, DEGR-02** | phase gate | quick `BASE + 4 / +52`, sweep `3 13`, e2e `BASE_E2E + 12`, against a fresh production build; ten qualifiers written | exists | ⬜ pending |
| 07-13-03 | 13 | 13 | **SAFE-02, 03, 04, 05, 06 (hardware)** | **checkpoint:human-verify** | not automatable — the seven runbook rows, run by the user on a real ZONA; **the first real write** | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

`07-RESEARCH.md`'s Wave 0 gaps, each mapped to a creating task. **None is a framework gap** — Vitest,
Playwright, both browser binaries, `wrangler`, `.dev.vars` and the runes-in-node measurement are all
in place. The gaps are files, one shipped rule to undo twice, and one assumption that was tested at
planning time (Playwright's `$lib` resolution).

- [ ] **Phase 6 closed** → **07-01-01** (a precondition, not a file)
- [ ] `src/lib/protocol/descriptors.ts` gains `fetchSerialNumber` + `moduleKeyOf`; `STEP_IDS` gains
      `fetch-serial`; `descriptors.spec.ts` and `forbidden-instructions.spec.ts` test 4 widen to five → **07-01**
- [ ] `src/lib/transport/sequence.ts` gains `writeBoth`, `targetOf`, `fetchModuleKey`; `storeToFlash`'s
      throw removed; `sequence.spec.ts` test 3 rewritten → **07-02**
- [ ] `src/lib/transport/fixtures/synthetic.ts` gains the SERIALNUMBER report, the `currentpage` NACK,
      `flash` + `powerCycle`, `rigResponder` → **07-02**
- [ ] `src/lib/device/snapshot.ts` + `snapshot.spec.ts` → **07-03**
- [ ] `src/lib/device/install-copy.ts` + `install-copy.spec.ts` → **07-03**
- [ ] `src/lib/device/session.svelte.ts` gains six members; `session-copy.ts` six string changes (`SAFE_PROMISE` amended);
      `session.spec.ts` +4; `session-copy.spec.ts` test 5 rewritten → **07-04**
- [ ] `src/lib/tune/model.ts` `onconfig`; `TuningRegion` / `Coverflow` / `TryOnDevice` threading;
      `wire-pin.spec.ts` → **07-05**
- [ ] `src/lib/device/install.svelte.ts` + `install.spec.ts` (**not** `install.svelte.spec.ts`) → **07-06**, **07-07**
- [ ] `e2e/fake-serial.ts`'s responder hook; `e2e/fake-zona.ts`; `src/routes/dev/install/+page.svelte`;
      `+layout.svelte`'s `install.start()`; `config-shape.spec.ts` allow-list +3; `e2e/install.e2e.ts` → **07-08**
- [ ] `PutBack.svelte`, `KeepConfirm.svelte`, `InstallState.svelte`; `device-ui.spec.ts` +2 → **07-09**
- [ ] `TryOnDevice.svelte`'s two literals retired; `KeepOnDevice.svelte` Quiet; `ChosenPanel.svelte`
      column; `Coverflow.svelte` Escape → **07-10**
- [ ] `DeviceDetails.svelte` lock + snapshot line; `first-experience.e2e.ts` extended → **07-11**
- [ ] `e2e/install.e2e.ts` +5 on the real page → **07-12**
- [ ] `docs/INSTALL-RUNBOOK.md`, `docs/TESTING.md`, `docs/HARDWARE-AUDITION.md`, `deferred-items.md` → **07-13**

The phase's own Wave 0 gate — the property that licenses everything downstream — is **task 07-06-03**:
the snapshot-before-write and the zero-writes-without-a-click, held in node against a fake ZONA
before any control exists to click.

---

## What the fixtures and gates prove

- `descriptors.spec.ts` proves the fifth descriptor is addressed, decodes to four words and keys to
  32 hex characters. It does **not** prove a real ZONA answers it — runbook row A does.
- `synthetic.spec.ts` and `sequence.spec.ts` prove the writer's order and bytes, the refusal, the
  flash model and the rig's N acknowledgements. They model firmware from a source reading; the
  circularity is named in `synthetic.ts`'s header.
- `snapshot.spec.ts` proves the record survives its own writes, a throwing store and a wrong schema,
  and is never overwritten. It does **not** prove a browser's profile keeps `localStorage` across a
  restart — row F does.
- `install-copy.spec.ts` proves every string exists character for character and every cap holds. It
  does **not** prove the copy is good — 07-UI-SPEC's approval does, and the runbook's hand-back asks.
- `session.spec.ts` tests 18–21 prove the seams; test 15 proves the session still never writes.
- `wire-pin.spec.ts` proves the bytes are the meters across every catalog entry.
- `install.spec.ts` proves the snapshot order, the three clicks, the restore on every path, the
  fourteen states, the bounds, the pacing rule and the file's shape — against faults a real cable
  has never been asked to produce on demand.
- `e2e/install.e2e.ts` proves the same machine drives the probe and the shipped chrome in two engines,
  including the degrade path, with a ZONA that is the node suite's ZONA.
- `device-ui.spec.ts` tests 8–11 prove the leaves are light, reserved, grouped and not dialogs, and
  that the never-writes literals are gone.
- `config-shape.spec.ts` keeps the first paint light through the install path; the widening is
  proven by three mutations observed red.

---

## Manual-Only Verifications

| What | Why it cannot be automated | Who |
|---|---|---|
| A real ZONA answering `SERIALNUMBER/FETCH` | Source-verified, wire-unproven: no capture holds the frame and the desktop editor never sends one | Botond, runbook row A |
| The first RAM write landing, its wall time, and whether 0 ms pacing survived two full-size writes | Nothing but a module can prove a write landed; a fake ACK proves only that HANGAR believed one. The 2,048-byte ring is the mechanism the Phase 2 probe never exercised | Botond, runbook row B |
| `PUT BACK` restoring the pad by eye | The comparison is against a physical module | Botond, runbook row C |
| A power cycle bringing the original back | RAM is not readable after it is gone | Botond, runbook row D |
| `KEEP ON DEVICE` surviving a power cycle, and the re-fetch round count | Flash is the definition of "survives"; the post-store reload time has never been measured | Botond, runbook row E |
| Fresh-tab `PUT BACK` from the browser's own storage | Profile state plus flash state; neither is simulable | Botond, runbook row F |
| A rig's confirmation against real traffic | Every frame Phase 2 recorded carried SX 0, SY 0 | Botond, runbook row G *(optional)* |
| Whether `KEEP ON DEVICE` may take a third colour | Z-01's ruling is no; the reversal is one line | Botond (07-CONTEXT open question 1) |
| Whether the module's id should be shown | 07-RESEARCH open question 5: last four hex characters only with a second module ever stored | Botond (07-CONTEXT open question 2) |
| Whether an empty fetched string should be a valid snapshot (Z-16) | D-03 says non-empty; Z-16 disagrees; this phase implements D-03 | Botond |

---

## Negative checks (observe red before trusting)

Every new gate names the mutation that makes it red, and the executor **observes** the red before
committing.

| Plan | Gate | Mutation that must turn it red |
|---|---|---|
| 07-01 | `descriptors.spec.ts` 11 | broadcast the fetch (`DX -127`) |
| 07-01 | `descriptors.spec.ts` 12 | drop `padStart(8, "0")` |
| 07-01 | `forbidden-instructions.spec.ts` 4 | remove the fifth builder from the list and watch the class set miss `SERIALNUMBER` |
| 07-02 | `sequence.spec.ts` 3 | restore the `storeAllowed` throw |
| 07-02 | `sequence.spec.ts` 10 | swap the two writes in `writeBoth` |
| 07-02 | `sequence.spec.ts` 11 | make the responder ACK a wrong-page write |
| 07-02 | `synthetic.spec.ts` 4 / 5 / 6 | remove the `currentpage` branch; skip the flash copy; rewrite the serial report's address |
| 07-03 | `snapshot.spec.ts` 3 / 5 / 6 | overwrite an existing entry; drop a `try`; pass a malformed record through |
| 07-03 | `install-copy.spec.ts` 3 / 4 / 5 / 6 | lengthen a `PUT BACK` line past 129; repeat `about a second`; a trailing full stop on a title; an Oxford comma; a seventh reason (compile error) |
| 07-04 | `session.spec.ts` 18 | register the install sink with `transport.onData` inside the fold |
| 07-04 | `session.spec.ts` 19 | let the view pass `onData` through |
| 07-04 | `session.spec.ts` 20 | fire `"closed"` from `disconnect()` unconditionally |
| 07-04 | `session.spec.ts` 21 | drop the `!this.writeLock` guard on the unplug utterance |
| 07-04 | `session-copy.spec.ts` 5 / 6 | Phase 6's old `REVOKE_EXPLANATION`; Phase 6's old `SAFE_PROMISE`; collapse the writing form; an ASCII apostrophe |
| 07-05 | `model.spec.ts` 9 | remove `onconfig?.(undefined)` from `moveTo`; emit from `emit()` instead of `land()` |
| 07-05 | `wire-pin.spec.ts` 1 / 3 | compress inside `land()`; pass a non-zero reserve |
| 07-06 | `install.spec.ts` 3 / 4 / 6 / 7 | persist before `canWriteBack`; swap the writes; take the fetch over the record; remove the `finally`'s restore; proceed on `undefined` — **observed as a write** |
| 07-07 | `install.spec.ts` 9 / 10 / 13 / 14 / 18 | skip `#nextHeartbeat()`; a fourth round; `armed` from `partial`; retry a NACK; escalate on a NACK; `setInterval` for the slow line |
| 07-08 | `config-shape.spec.ts` 12 | the probe path in `src/routes/+page.svelte` |
| 07-08 | `install.e2e.ts` 3 | remove the responder's `mismatchRefetch` handling |
| 07-09 | `config-shape.spec.ts` 13 | `$lib/transport` in `PutBack.svelte` (direct); `$lib/transport/sequence` in `install.svelte.ts` (walk); `$lib/protocol` in `install-copy.ts` (walk, and `install-copy.spec.ts` 1) |
| 07-09 | `PutBack` / `KeepConfirm` | drop the twins; `role="dialog"`; an accent-filled affirmative |
| 07-09 | `device-ui.spec.ts` 8 / 9 | `role="dialog"`; a retyped sentence; a 40px button |
| 07-10 | `TryOnDevice` | keep Phase 4's `HONESTY` and read it beside a button that writes |
| 07-10 | `ChosenPanel` / `Coverflow` | the `space-between` row; the missing `writing` guard on Escape |
| 07-10 | `device-ui.spec.ts` 10 | a sixth honesty twin |
| 07-11 | `DeviceDetails` | lock the RAM legs only and watch `DISCONNECT ZONA` enabled under a store |
| 07-11 | `first-experience.e2e.ts` / `device-ui.spec.ts` 11 | `PUT BACK` disabled instead of absent; `writing` in the slot's label |
| 07-12 | `install.e2e.ts` 7 | assert the header lock without the responder's delay — racy, which is why the delay exists |
| 07-12 | the tag arithmetic | remove `@webkit` from test 11 and watch the total drop by one |

---

## Standing hazards carried into this phase

- **The baselines are unknown at planning time and Phase 6 is landing in this tree.** 07-01 asserts
  the closure and measures; every later plan asserts previous + delta; the sweep literal `3 13` is the
  documented exception.
- **`install.svelte.spec.ts` would be collected by nothing.** The spec is `install.spec.ts` and says why.
- **A static import of `$lib/transport` or `$lib/protocol` from `install.svelte.ts` is invisible to the
  direct marker scan and is caught only by the walk** — which is why 07-08 widens the allow-list before
  the layout names the store, and why 07-09 observes the walk go red.
- **`config-shape.spec.ts` test 14 proves nothing without a fresh `build/`.** Three waves build first.
- **The e2e total is tag-sensitive**; one `@webkit` title lives in this phase and it is in 07-12.
- **The fake ZONA is modelled on a source reading of firmware**, in node and in the browser alike; it
  can only prove HANGAR is consistent with that reading. Rows A, B and E are the only closure.
- **The 40 ms write is unobservable live.** Every browser assertion about `writing` holds the
  acknowledgement in Node first; a test that forgets is flaky-or-green, never red.
- **`Identity.storeAllowed` is now informational.** Any new code that refuses on it is reintroducing a
  rule SAFE-06 superseded.
- **The two Phase 4 literals promising HANGAR never writes are retired in 07-10.** Until that wave, a
  tree with 07-06's store and Phase 4's copy is a tree that can write while saying it cannot — which is
  why no plan between 07-06 and 07-10 mounts the store in a shipped component.
- **Firmware writes Setup before Timer to flash.** An unplug during a store can leave a flash state
  the RAM order would not produce; no software mitigation exists and the runbook says not to pull the
  cable during a store.
- **All five of Phase 7's success criteria carry a *(hardware)* half** and close as
  **verified-by-user-pending**. No plan may mark them done.

---

## Open questions the plans could not resolve from the documents

1. **Z-16 versus D-03.** The UI spec reads SAFE-03's "non-empty" as "both fetches ACK'd"; the context's
   D-03 (a `[user]` decision) says "present and non-empty", and `canWriteBack` refuses an empty string
   as the shape of a non-active-page fetch. The plans implement **D-03**. If the user prefers Z-16,
   07-06's `#snapshot` drops the `canWriteBack` gate to an `actionString !== undefined` check and
   `install.spec.ts` test 3 inverts — one edit, one test.
2. **A NACK has no copy of its own in the UI spec.** The plans land a refused first leg in
   `nothing-landed` (whose second step names the cable — wrong for a refusal) and a refused second leg
   in `partial`, with `cause` recorded and rendered nowhere. A one-line cause clause is a copy
   amendment for the morning; recorded in 07-13's deferred items.
3. **The third colour** (07-CONTEXT open question 1) — the plans ship Z-01's **no**; the reversal is
   the one line Z-01 records.
4. **Showing the module id** (07-CONTEXT open question 2) — the plans show none; 07-RESEARCH's
   last-four-characters suggestion is a deferred item.
5. **`SNAPSHOT_SESSION_LINE` is authored in 07-04**, not transcribed: 07-UI-SPEC contracts the slot for
   the durable form and D-04 (amended) demands an honest session-only sentence the spec does not
   write. It is held to the same rules and cap as its sibling and is the one string in the phase the
   UI checker has not seen.

---

## Validation Sign-Off

- [ ] Every task has an automated command that fails when the task is not done
- [ ] Every negative check above was observed red before the gate was trusted
- [ ] No plan carries a literal whole-suite total (the sweep's `3 13` is the documented exception, and
      07-01 confirms it)
- [ ] Every widened gate (`forbidden-instructions` 4, `sequence.spec` 3, `session-copy.spec` 5,
      `config-shape` 13) carries its amendment note in the amended file's own header
- [ ] Every SUMMARY carries the five-name block, and `BASE_E2E` is byte-identical in all thirteen
- [ ] `session.svelte.ts` still has exactly four static specifiers and `install.svelte.ts` exactly
      three at the phase gate; `session.spec.ts` test 15 is green unedited
- [ ] Phase 4's chunk guards, Phase 8's laziness guards, `identity.spec.ts`, `tune-ui.spec.ts`,
      `front-door.spec.ts`, `lua-entries.spec.ts`, `session.e2e.ts` and `catalog.e2e.ts` are green at
      the phase gate, unedited
- [ ] SAFE-01 to SAFE-09 and DEGR-02 are marked complete **each with the qualifier stated above**
- [ ] The hardware checkpoint is recorded as **presented and unanswered**, the five *(hardware)* halves
      as **verified-by-user-pending**, and the SUMMARY says **no agent has written a byte to a real ZONA**
