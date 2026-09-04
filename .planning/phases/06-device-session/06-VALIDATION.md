---
phase: 6
slug: device-session
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-04
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is the Nyquist contract. `docs/TESTING.md` (updated by plan 06-14) is the developer-facing
> companion and deliberately does not duplicate the map below. There is no `docs/VALIDATION.md`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 (node env, `expect.requireAssertions`, `passWithNoTests`), two projects per Phase 3 D-10: `server` (quick) and `sweep` + @playwright/test 1.62.1 over `wrangler dev` on `./build` |
| **Config file** | `vite.config.ts` (Vitest) and `playwright.config.ts` — **neither is edited in this phase.** No new project, no new include, no new browser. The `src/**/*.{test,spec}.{js,ts}` glob already collects `src/lib/device/` |
| **Quick run** | `npm run test:quick` (= `vitest run --project server`) |
| **Sweep** | `npm run test:sweep` (= `vitest run --project sweep`) |
| **Wave run** | `npm run check && npm run lint && npm run test:quick && npm run test:sweep` |
| **Full suite** | the wave run plus `npm run build` and `npm run test:e2e` |
| **Count gate** | `… 2>&1 \| node scripts/check-counts.mjs <files> <tests>` — **baseline + delta only, never a literal total (Phase 8 D-17)** |
| **New dependency** | **none.** Everything this phase needs is installed and pinned |

**Baselines are NOT known at planning time.** Phase 5.1 was landing plans while this phase was
planned, so every number in `06-RESEARCH.md` (`59 files / 651 tests`, `3 13`, `44 e2e`) is provenance
and is asserted nowhere. **Task 06-01-01 re-measures all four on a clean tree** and records them in
`06-01-SUMMARY.md` as the Phase 6 baseline.

### The four-name carry-forward block

Phase 5.1 established it and this phase inherits it unchanged:

> **Every SUMMARY in this phase carries the same four names, whether or not that plan moved them.**

| Name | What it is | How it moves |
|---|---|---|
| `BASE_FILES` | the `test:quick` **file** count as that plan left the tree | re-measured by every plan that changes it; copied verbatim otherwise |
| `BASE_TESTS` | the `test:quick` **test** count as that plan left the tree | same |
| `BASE_SWEEP` | the literal the sweep printed — expected `3 13` | never re-derived; the `sweep` project is a named-file include and this phase adds no file to it. **If 06-01 observes a different literal, that literal is the phase's and every plan quotes it** |
| `PREV_E2E` | the **last measured** Playwright total, with the plan that measured it named beside it | copied verbatim by every plan that does not run `test:e2e`; re-measured and re-stated by every plan that does |

A plan's `PREV_FILES` / `PREV_TESTS` are the immediately preceding SUMMARY's `BASE_FILES` /
`BASE_TESTS`. **Four plans run `test:e2e`** — 06-06, 06-07, 06-13 and 06-14 — and the other ten carry
`PREV_E2E` unchanged. Every plan states the carry as an acceptance criterion on its last task, and any
plan that finds the name missing from the SUMMARY it reads **stops rather than guessing**.

`BASE_CHECK` (the `svelte-check` file count) is provenance only, recorded once in 06-01. Only
`0 errors` is ever asserted, because the file count moves whenever a file is added.

### Facts the map depends on

Read from this repository on 2026-09-04 by the planner, from the sources, not estimated.

- **`vite.config.ts`'s `server` project excludes `src/**/*.svelte.{test,spec}.{js,ts}`.** A spec named
  `session.svelte.spec.ts` would be collected by **nothing** and the suite would be green and vacuous.
  The spec is `src/lib/device/session.spec.ts` and the file says why in its own header.
- **The repository contains zero `.svelte.ts` files today**, so nothing yet proves the `server` project
  compiles a runes module. **Task 06-01-01 spikes it and deletes the spike**, and records the
  documented fallback (a pure `session-machine.ts` with a runes shell) if it does not.
- **`config-shape.spec.ts` test 13 matches specifier TEXT** against `["vendor", "intechstudio",
  "lib/pad"]`. `$lib/transport` matches none of them. Plan 06-05 widens it and **observes that the
  mutation is green before the widening and red after** — the same hole `tune-ui.spec.ts` test 1 found
  for `$lib/tune/model` and 05.1-08 closed for `$lib/catalog`.
- **`config-shape.spec.ts` test 14 is a no-op when `build/` is absent.** Any wave that adds a header
  component must run `npm run build` before reading that gate as evidence. Plans 06-09, 06-11 and
  06-14 do.
- **`config-shape.spec.ts` test 12 is hardcoded to `dev/skeleton`.** Plan 06-05 generalises it to every
  directory under `src/routes/dev/`, and 06-06 re-runs the mutation once `/dev/session/` exists —
  because a discovery-based scan cannot see a directory that does not exist yet, and that limit is
  recorded rather than papered over.
- **`e2e/first-experience.e2e.ts` asserts the unsupported copy inside `getByTestId("connect-status")`**
  — a location as well as a message. The decision (06-UI-SPEC and plan 06-12) is that the panel
  **keeps** the capability block, so the shipped test stays green **with no edit**, and 06-12 proves
  that rather than assuming it.
- **`grid-fw`'s ESP32-S3 USB component hard-codes `0x303a, 0x8123` for every module**, all labelled
  `Grid`. CONN-07's filter therefore lists an EN16 as readily as a ZONA, and the heartbeat verify is
  the whole of CONN-07. `not-zona` is a routine outcome, planned as a first-class state.
- **A replugged wired port is a NEW `SerialPort` object** (Chromium mints a fresh token). The
  `connect` handler identifies by `getInfo()` and adopts; the `disconnect` handler may compare object
  identity. Both directions are tested, in node (06-04) and in a browser (06-07).
- **One `NotFoundError` covers three causes** — cancelled, empty-and-dismissed, and blocked by a site
  setting — with the identical name and message. The UI states the common case and puts the other two
  one disclosure away each.
- **`MODULE_GONE_MS = 750` is declared in `constants.ts` and used by nothing.** This phase uses it, and
  publishes `moduleStale`, which **nothing in this phase renders** — the nine-state taxonomy is
  06-UI-SPEC's and no tenth state is invented. Phase 7 is its first consumer, and 06-14 records that.
- **`transport.spec.ts` has 7 tests and `try-on.spec.ts` has 6** before this phase; both are counted
  in the deltas below.
- **The e2e arithmetic is tag-sensitive.** `chromium` carries no `grep` and runs everything;
  `webkit-phone` runs only `@webkit` titles. **A tagged title adds 2 to the suite total; an untagged
  one adds 1.**

### The architectural decisions this phase's plans make, so the checker can see them

| Decision | Where | Why |
|---|---|---|
| `capabilityOf` **moves** to the import-free `session-copy.ts` and `try-on.ts` re-exports it | 06-02 | the 152px header note is absent in `unsupported`/`insecure`; if capability could only be known after a dynamic import, every visitor would paint the note and a WebKit visitor would lose it a tick later. One definition, one test, a new home |
| `ZONA_USB` moves to `src/lib/protocol/usb.ts`; `grantedZonaPorts` / `portIsAttached` / `isZonaPort` move to `src/lib/transport/ports.ts`; both re-exported from their old barrels | 06-03 | the whole load path — capability, listeners, the granted-port offer — then runs with **no dynamic import at all**, so a browse-only visitor pays nothing for CONN-06, and `requestPort()` can still be the first statement of a click handler |
| `already-open` is an `OpenFailure` key, **not** a session phase | 06-01, 06-03 | 06-UI-SPEC folds it into the `unknown` row; a tenth named state would contradict the approved contract |
| The announcement logic lives in the store, not in `SessionAnnouncer` | 06-09 | the coalescer, the hold and the "never on a heartbeat" rule all have edge cases, and edge cases belong where a node test can reach them |
| `moduleStale` is published and rendered nowhere | 06-04 | the taxonomy is nine; the mechanism is proven and its first consumer is named |
| The session's serial surface and transport factory are injectable | 06-03 | the difference between a session tested in node and a session testable only in a browser |

### Why the waves are serial

No two plans in this phase run concurrently, for the same arithmetic reason Phase 5.1 gave: every
acceptance criterion asserts an exact cumulative count, and two plans adding specs in the same wave
would both compute the wrong total. The `wave` numbers in the frontmatter are dependency groupings,
one plan each. Serial waves cost wall time and buy a gate that cannot be green for the wrong reason.

### Expected deltas after each plan

| Plan | `test:quick` files | `test:quick` tests | `test:sweep` | `test:e2e` |
|---|---|---|---|---|
| 06-01 | +0 | **+3** | 3 / 13 | unchanged (measured) |
| 06-02 | **+1** | **+6** | 3 / 13 | unchanged |
| 06-03 | **+1** | **+8** | 3 / 13 | unchanged |
| 06-04 | +0 | **+7** | 3 / 13 | unchanged |
| 06-05 | +0 | +0 | 3 / 13 | unchanged |
| 06-06 | +0 | +0 | 3 / 13 | **+5** |
| 06-07 | +0 | +0 | 3 / 13 | **+5** |
| 06-08 | +0 | +0 | 3 / 13 | unchanged |
| 06-09 | +0 | **+2** | 3 / 13 | unchanged |
| 06-10 | **+1** | **+6** | 3 / 13 | unchanged |
| 06-11 | +0 | +0 | 3 / 13 | unchanged |
| 06-12 | +0 | **+1** | 3 / 13 | unchanged |
| 06-13 | +0 | +0 | 3 / 13 | **+6** |
| 06-14 | +0 | +0 | 3 / 13 | unchanged (re-measured) |
| **Phase total** | **+3** | **+33** | **unchanged** | **+16** |

The e2e arithmetic written out, because it is where a reader gets lost: 06-06 adds four titles of which
one is `@webkit` (4 + 1 = **+5**); 06-07 adds five untagged (**+5**); 06-13 adds five of which one is
`@webkit` (5 + 1 = **+6**). Total **+16**.

Per-file counts, which **are** asserted absolutely:

| File | Tests | Plan |
|---|---|---|
| `src/lib/transport/transport.spec.ts` | 7 → **9** | 06-01 |
| `src/lib/device/try-on.spec.ts` | 6 → **7** | 06-01 |
| `src/lib/device/session-copy.spec.ts` | **6** | 06-02 |
| `src/lib/device/session.spec.ts` | **8**, then **15**, then **17** | 06-03, 06-04, 06-09 |
| `src/lib/config-shape.spec.ts` | **14**, unchanged | 06-05 (widened, not grown) |
| `src/lib/protocol/forbidden-instructions.spec.ts` | **5**, unchanged | 06-05 (widened) |
| `src/lib/ui/device-ui.spec.ts` | **6**, then **7** | 06-10, 06-12 |
| `e2e/session.e2e.ts` | **4**, then **9**, then **14** | 06-06, 06-07, 06-13 |

Standing gates that must be green at the phase gate and are **not** edited: `src/lib/ui/identity.spec.ts`
(**6**), `src/lib/ui/tune-ui.spec.ts` (**5**), `src/lib/catalog/front-door.spec.ts`,
`src/lib/sim/lazy.spec.ts` (**3**), `e2e/catalog.e2e.ts` (**2**), and `e2e/first-experience.e2e.ts`,
which is deliberately kept green **unedited** by 06-12.

### The new cost

| Suite | Threshold | If exceeded |
|---|---|---|
| `src/lib/device/*.spec.ts` | none — 33 pure node tests over fake ports, a fake transport and one committed capture; no WASM, no real timers outside `vi.useFakeTimers()` | — |
| `src/lib/ui/device-ui.spec.ts` | none — a source walk over seven files | — |
| `e2e/session.e2e.ts` | none stated; 14 tests over a built site, several feeding capture bytes through a shim | record the wall time; do not trim tests |
| `npm run test:sweep` | **unchanged.** This phase adds no `*.sweep.spec.ts` | if it moves, something was misfiled |

---

## Requirement ownership

`.planning/ROADMAP.md` maps **CONN-01 to CONN-08** to Phase 6 and this phase closes all eight. Each
closes with a qualifier that must appear in 06-14's SUMMARY and in the traceability pass:

| Requirement | Closed by | Qualifier |
|---|---|---|
| CONN-01 | 06-14 | One control, in the header, on all three routes, enabled from `capabilityOf({hasSerial, secure})` and nothing else. **No user-agent read exists anywhere in the tree**, asserted by the copy spec and the source scans |
| CONN-02 | 06-14 | Two distinct messages, both rendered **in a real browser**: `unsupported` on WebKit with no `navigator.serial`, and `insecure` through a shadowed `isSecureContext` — **the first time the insecure branch has ever rendered in this project** |
| CONN-03 | 06-14 | The 130-character pre-click line, in two mounts, never both at once. The Firefox two-step sentence ships **unconditional and brand-free** ("some browsers") per 06-UI-SPEC Y-05, superseding D-04's "detected by the prompt's behaviour": no non-brand behavioural signal for that prompt exists |
| CONN-04 | 06-14 | The named block and the six ordered steps, proven against a scripted `NetworkError`. **That Grid Editor is what produces it is runbook row C** — Phase 2's row 0 was never exercised |
| CONN-05 | 06-14 | `cancelled` is its own state, and the empty-picker branch is a disclosure beneath it because **the API cannot tell the two apart** (one `NotFoundError`, three causes). The third cause — blocked by a site setting — gets its own disclosure |
| CONN-06 | 06-14 | Silent reconnect is **one click, never automatic** (D-06). Proven against a scripted serial including the replug that mints a new port object. **The grant surviving a browser restart, and the replug on real hardware, are runbook rows A and B** |
| CONN-07 | 06-14 | Filter **and** verify — and the research corrected the requirement's premise: every ESP32-S3 Grid module shares `0x303a/0x8123`, so the filter does not narrow the picker to a ZONA and the heartbeat verify is the whole of it. `not-zona` ships as a first-class state. **The rig half is runbook row D** |
| CONN-08 | 06-14 | Type, firmware and active page visible while connected, and **live** rather than frozen at connect time; the rig tail fills in as modules announce themselves |

**SAFE-01 and DEGR-02 are Phase 7's and are NOT closed here.** SAFE-01's spirit is asserted twice in
this phase (zero writes in node and in a browser, plus a source scan that makes it a property of the
file); DEGR-02's header half is obeyed and proven on WebKit. 06-14's SUMMARY says both in those words.

---

## Sampling Rate

- **After every task commit:** `npm run test:quick`, plus `npm run lint` for HANGAR-owned files, plus
  `npm run check` for any task touching `.svelte` or `.ts`.
- **After every plan wave:** `npm run check && npm run lint && npm run test:quick && npm run test:sweep`.
- **After any task that changes what a build contains:** `npm run build`, then `test:quick` **again** —
  `config-shape.spec.ts` test 14 reads `build/` and is a silent no-op when it is absent. Waves 9, 11
  and 14 do this.
- **Before `/gsd:verify-work`:** the full suite including `npm run build` and `npm run test:e2e`
  against the **production static build** — plan 06-14 runs it as its second task.
- **Max feedback latency:** ~35 s (quick), ~3 min (wave with the sweep), ~2-3 min (e2e with the build).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | all | baseline + spike | four baselines re-measured on a clean tree; the runes spike run and deleted | exists | ⬜ pending |
| 06-01-02 | 01 | 1 | CONN-04 | unit | `... src/lib/transport/transport.spec.ts` reports **9 passed** | exists | ⬜ pending |
| 06-01-03 | 01 | 1 | CONN-07 | unit | `... src/lib/device/try-on.spec.ts` reports **7 passed**; quick is baseline +0 files / +3 | exists | ⬜ pending |
| 06-02-01 | 02 | 2 | CONN-02, 03, 05, 08 | source | `npm run check` `0 errors`; the module's comment-stripped source has zero `from "` and zero `import(` | created here | ⬜ pending |
| 06-02-02 | 02 | 2 | CONN-02, 03, 05 | unit | `... src/lib/device/session-copy.spec.ts` reports **6 passed** | created here | ⬜ pending |
| 06-02-03 | 02 | 2 | CONN-01 | unit | `try-on.spec.ts` **7** with the file unedited; quick is +1 file / +9 from baseline | exists | ⬜ pending |
| 06-03-01 | 03 | 3 | CONN-06, 07 | unit (no-op move) | quick unchanged; `usb.ts` has zero imports and `ports.ts` exactly one | created here | ⬜ pending |
| 06-03-02 | 03 | 3 | CONN-01, 05, 06, 07 | source | `npm run check` `0 errors`; exactly one static `from` beyond the two light modules; no `setInterval`; no `.write(` | created here | ⬜ pending |
| 06-03-03 | 03 | 3 | CONN-01, 05, 06, 07 | unit | `... src/lib/device/session.spec.ts` reports **8 passed**; quick +1 file / +8 | created here | ⬜ pending |
| 06-04-01 | 04 | 4 | CONN-06, 08 | unit | `sequence.spec.ts` unchanged and green; the `connect` handler has no identity comparison | exists | ⬜ pending |
| 06-04-02 | 04 | 4 | CONN-06, 08, SAFE-01 | unit | `session.spec.ts` reports **15 passed**; quick +0 files / +7 | exists | ⬜ pending |
| 06-05-01 | 05 | 5 | CONN-01 | unit (source) | `config-shape.spec.ts` **14 passed**; mutation 1 green before the widening, red after | exists | ⬜ pending |
| 06-05-02 | 05 | 5 | CONN-01 | unit (source) | `config-shape.spec.ts` **14 passed**; at least four probe directories discovered | exists | ⬜ pending |
| 06-05-03 | 05 | 5 | SAFE-01 | unit (source) | `forbidden-instructions.spec.ts` **5 passed** over `src/lib`; quick unchanged | exists | ⬜ pending |
| 06-06-01 | 06 | 6 | CONN-01 | fixture | `npx playwright test --list` collects no title from `e2e/fake-serial.ts`; the bubble self-check recorded | created here | ⬜ pending |
| 06-06-02 | 06 | 6 | CONN-01 | build artefact | `build/dev/session/index.html` exists; `config-shape.spec.ts` **14**, and its `dev/session` mutation is now red | created here | ⬜ pending |
| 06-06-03 | 06 | 6 | CONN-01, 02, 05, DEGR-02 | e2e, both projects | `e2e/session.e2e.ts --project chromium` **4 passed**; suite `PREV_E2E + 5` | created here | ⬜ pending |
| 06-07-01 | 07 | 7 | CONN-04, 06 | e2e | same file **7 passed**; `openCount(0) === 0` before the click, `requests() === 0` after | exists | ⬜ pending |
| 06-07-02 | 07 | 7 | **CONN-06 (the replug), SAFE-01** | e2e | same file **9 passed**; suite `PREV_E2E + 5`; `writes() === 0` over a whole visit | exists | ⬜ pending |
| 06-08-01 | 08 | 8 | CONN-08 | type + measured | `identity.spec.ts` **6**, `tune-ui.spec.ts` **5**; the panel spinner still 32px with all three attributes | exists | ⬜ pending |
| 06-08-02 | 08 | 8 | CONN-08 | type + guard | `identity.spec.ts` **6**; no hex, no SVG, no canvas in `DeviceMark` | created here | ⬜ pending |
| 06-08-03 | 08 | 8 | CONN-04 | type + observed | `npm run check` `0 errors`; the `already-open` block renders no list; quick unchanged | created here | ⬜ pending |
| 06-09-01 | 09 | 9 | SAFE-01 | unit | `session.spec.ts` reports **17 passed**; `#say` called from exactly six sites | exists | ⬜ pending |
| 06-09-02 | 09 | 9 | CONN-03, SAFE-01 | type + measured | the note's height is equal across S1/S2/S3 and absent in both capability states; the number recorded | created here | ⬜ pending |
| 06-09-03 | 09 | 9 | CONN-03 | build + a11y | `npm run build` succeeds; exactly one `session-live` per route; `config-shape.spec.ts` **14** | exists | ⬜ pending |
| 06-10-01 | 10 | 10 | CONN-01, 06, 08 | type + measured | the slot is 44px in all nine states and the header height is constant; `aria-expanded` in four states only | created here | ⬜ pending |
| 06-10-02 | 10 | 10 | CONN-05, 06 | type + observed | the four open/close behaviours observed; `FORGET THIS ZONA` absent without `canForget` | created here | ⬜ pending |
| 06-10-03 | 10 | 10 | CONN-01, 05, 08 | unit (source) | `... src/lib/ui/device-ui.spec.ts` reports **6 passed**; quick +1 file / +6 | created here | ⬜ pending |
| 06-11-01 | 11 | 11 | **CONN-01 (the header)** | precondition + measured | `BrowseLink` present or the plan **stops**; header heights constant per width across states; no scrollbar at 320px | exists | ⬜ pending |
| 06-11-02 | 11 | 11 | CONN-08, DEGR-02 | build + measured | `config-shape.spec.ts` **14** after a build; the note's height constant on all three routes | exists | ⬜ pending |
| 06-11-03 | 11 | 11 | CONN-01 | observed | the slot and note absent at 0 ms and present at 900 ms; the announcement once, after the splash, including when skipped | exists | ⬜ pending |
| 06-12-01 | 12 | 12 | DEGR-02 | type + observed | five un-choose paths keep the connection; `release()` still exported and called | exists | ⬜ pending |
| 06-12-02 | 12 | 12 | **CONN-02, 03 (the two mounts)** | unit + e2e | `device-ui.spec.ts` **7 passed**; `e2e/first-experience.e2e.ts` passes **unedited** | exists | ⬜ pending |
| 06-13-01 | 13 | 13 | **CONN-06 (navigation)** | e2e | `e2e/session.e2e.ts --project chromium` **11 passed**; the walk is client-router only; the reload lands in `detected` | exists | ⬜ pending |
| 06-13-02 | 13 | 13 | CONN-06, 07, SAFE-01 | e2e, two projects | same file **14 passed**; suite `PREV_E2E + 6`; two `@webkit` titles in the file | exists | ⬜ pending |
| 06-14-01 | 14 | 14 | all | docs | six rows with pass conditions and why each is human-only; no engine named | created here | ⬜ pending |
| 06-14-02 | 14 | 14 | **CONN-01..08** | phase gate | quick `BASE + 3 / +33`, sweep `3 13`, e2e `BASE_E2E + 16`, against a fresh production build | exists | ⬜ pending |
| 06-14-03 | 14 | 14 | **CONN-04, 06, 07 (hardware)** | **checkpoint:human-verify** | not automatable — the six runbook rows, run by the user on a real ZONA | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

`06-RESEARCH.md`'s Wave 0 gaps, each mapped to a creating task. **None is a framework gap** — Vitest,
Playwright, both browser binaries, `wrangler` and `.dev.vars` are all present and both Playwright
projects are configured. The gaps are files, plus one assumption that needed testing.

- [ ] **The runes-in-node assumption** — no `.svelte.ts` exists in this repository today → **06-01-01**,
      with a documented fallback if the spike fails
- [ ] `src/lib/device/session-copy.ts` + `session-copy.spec.ts` → **06-02**
- [ ] `src/lib/protocol/usb.ts` and `src/lib/transport/ports.ts` — the light seam, **before** the
      session can offer a reconnect without a chunk → **06-03-01**
- [ ] `src/lib/device/session.svelte.ts` + `session.spec.ts` (**not** `session.svelte.spec.ts`) →
      **06-03**, **06-04**, **06-09**
- [ ] The three shipped-gate widenings, **before** any component can violate a rule nothing watches →
      **06-05**
- [ ] `e2e/fake-serial.ts` and `src/routes/dev/session/+page.svelte` → **06-06**
- [ ] `e2e/session.e2e.ts` → **06-06**, **06-07**, **06-13**
- [ ] `docs/SESSION-RUNBOOK.md` → **06-14-01**

The phase's own Wave 0 gate — the property that licenses everything downstream — is **task 06-03-03**:
the session's whole machine, including all six refusal paths, runs in node against a fake port.

---

## What the fixtures and gates prove

- `session-copy.spec.ts` proves the strings exist, are character-exact, are import-free and interpolate
  the rendering surface's label. It does **not** prove they are good copy — that is 06-UI-SPEC's
  approval, already given, and the runbook's row C asks the user whether `port-busy` reads as helpful
  or as jargon.
- `session.spec.ts` proves every transition, every refusal, the in-flight guard, the replug adoption,
  the watchdog, `forget()`'s ordering and zero writes. It does **not** prove Chromium behaves as the
  research read it — the fakes are modelled on that reading, and the circularity is named in
  `e2e/fake-serial.ts`'s own header. Runbook rows A, B and E close it.
- `e2e/session.e2e.ts` proves the same machine drives the shipped chrome in two engines, including the
  degrade path no manual tester remembers to check and the insecure branch no browser produces on
  demand. Its `writes()` assertions are SAFE-01 as a number rather than a claim.
- `device-ui.spec.ts` proves the shape of the seven components: no compiler import, no new colour,
  44px controls, one live region, monospace scoped to the numerals, and the ARIA contract that keeps a
  control from both acting and expanding.
- `config-shape.spec.ts` tests 12, 13 and 14 keep the front door light and the probe routes unlinked;
  the widening in 06-05 is proven by a mutation that was **green before it and red after**.
- `forbidden-instructions.spec.ts` finally covers `src/lib/device/`, which is the directory that would
  do the writing if this phase were wrong about itself.

---

## Manual-Only Verifications

| What | Why it cannot be automated | Who |
|---|---|---|
| The grant surviving a full browser restart, **on the deployed HTTPS origin** | Permission storage is the browser's own profile state, and grants are per origin; only `127.0.0.1:4173` has ever been tested (carried from `SKELETON-RESULTS.md`) | Botond, runbook row A |
| Unplug and replug on real hardware | The new-token behaviour is Chromium's; the shim is modelled on a source reading | Botond, runbook row B |
| That Grid Editor is what produces the busy port, and whether the copy reads as helpful | Phase 2's row 0 was never exercised — the operator had no Grid Editor running | Botond, runbook row C |
| A real second Grid module, and a real non-ZONA refusal | Every frame in the Phase 2 run carried SX 0, SY 0; the other-module path has never met real traffic | Botond, runbook row D |
| `FORGET THIS ZONA` really revoking, and Grid Editor getting the module back | Revocation is profile state; the exclusivity half is an operating-system fact | Botond, runbook row E |
| The Firefox 151+ two-step prompt and its timing | The whole Phase 2 run was one browser; no Firefox 151+ desktop is known on this machine | Botond, runbook row F *(optional)* |
| Whether 152px of header note is worth its cost | A design judgement; 06-UI-SPEC open question 7 states the alternative (one paragraph, 72px) and what it would cost | Botond |
| Whether `FORGET THIS ZONA` belongs in v1 rather than in Phase 7 | 06-CONTEXT open question 3; removing it is one block from `DeviceDetails.svelte` | Botond |

---

## Negative checks (observe red before trusting)

Every new gate names the mutation that makes it red, and the executor **observes** the red before
committing.

| Plan | Gate | Mutation that must turn it red |
|---|---|---|
| 06-01 | `transport.spec.ts` already-open | delete the `InvalidStateError` branch, and separately give the copy a step |
| 06-01 | `try-on.spec.ts` rig | restore `seen[0]` and watch the EN16 be named |
| 06-02 | `session-copy.spec.ts` 5 | change one character of `PICKER_EXPLAINER` |
| 06-02 | `session-copy.spec.ts` 2 | make `slotStateOf` return `S6` for `forgotten` |
| 06-02 | `session-copy.spec.ts` 6 | put an ASCII apostrophe in `REVOKE_EXPLANATION` |
| 06-02 | `session-copy.spec.ts` 4 | hard-code `TRY ON DEVICE` into `silentBlock` |
| 06-02 | the re-export | delete it and watch `try-on.spec.ts` fail to compile |
| 06-03 | the barrel | delete `export * from "./ports"` and watch `svelte-check` name a call site |
| 06-03 | `session.spec.ts` 4 | remove the `#busy` guard and count two `requestPort` calls |
| 06-03 | `session.spec.ts` 5 | replace the `try` with a bare `.catch()` and watch the throw escape |
| 06-03 | `session.spec.ts` 6 | map `unplugged` to `unplugged-while-connected` |
| 06-03 | `session.spec.ts` 8 | drop the close on `not-zona` |
| 06-04 | `session.spec.ts` 10 | compare `ev.target === this.#port` in the `connect` handler |
| 06-04 | `session.spec.ts` 14 | call `forget()` before the teardown |
| 06-04 | `session.spec.ts` 13 | republish the identity on every fold |
| 06-04 | `session.spec.ts` 15 | add a write inside `#openAdopted` — **both halves observed red separately**, because a Vitest assertion aborts its test at the first failure |
| 06-05 | `config-shape.spec.ts` 13 | `import { openZonaPort } from "$lib/transport"` in a `src/lib/ui/` file — **green before the widening, red after** |
| 06-05 | `config-shape.spec.ts` 13 | `import { identifyOnly } from "$lib/device/try-on"` — proves the allowance is paths, not a namespace |
| 06-05 | `config-shape.spec.ts` 13 | a static `$lib/protocol` import inside `session-copy.ts` — red on the **walk**, which is what makes the allow-list more than a comment |
| 06-05 | `config-shape.spec.ts` 12 | put `dev/tune` into `src/routes/+page.svelte` |
| 06-05 | `forbidden-instructions.spec.ts` | a page-clear instruction as a string in `session.svelte.ts`, then in a comment |
| 06-06 | the shim | the bubble self-check: a `connect` listener on `navigator.serial` must see `ev.target` as the port |
| 06-06 | `config-shape.spec.ts` 12 | `dev/session` in `src/routes/+page.svelte` — green in 06-05, **red here** |
| 06-06 | the tag arithmetic | remove `@webkit` from test 2 and watch both the project list and the suite total drop by one |
| 06-07 | `session.e2e.ts` 4 | restore the object-identity comparison and watch the replug never adopt |
| 06-08 | `PadSpinner` | change the `size` default to 24 and watch the panel's spinner shrink |
| 06-08 | `identity.spec.ts` | hard-code a hex in `DeviceMark` |
| 06-08 | `FailureBlock` | render the `<ol>` unconditionally and find an empty list in the `already-open` state |
| 06-09 | `session.spec.ts` 16 | call `#say` from the fold's republish path; and speak immediately instead of on the trailing timer |
| 06-09 | `DeviceNote` | drop the sizing twins and watch the region's height change between S1 and S3 |
| 06-09 | the layout | move `session.start()` to module scope and watch `npm run build` fail naming `navigator` |
| 06-10 | `DeviceSlot` | remove the sizing twin and hover S1 |
| 06-10 | `DeviceDetails` | make the disclosure a focus trap and watch `Tab` become inescapable |
| 06-10 | `device-ui.spec.ts` 1-6 | six mutations, one per test, listed in the plan |
| 06-11 | the phone header | make the second row conditional on the session state and watch the coverflow jump on connect |
| 06-11 | the note | render it in `unsupported` and watch a browser that can never connect pay 152px for it |
| 06-11 | the splash hold | release on a fixed timer, skip the splash with a key, and watch the announcement land over the opening or not at all |
| 06-12 | `TryOnDevice` | keep the `onDestroy` close and watch the header flip to `NO ZONA` when the panel closes |
| 06-12 | `device-ui.spec.ts` 7 | re-add `aria-live` to `connect-status` |
| 06-12 | the one-block rule | render the failure block in both surfaces and count two copies of the six-step recovery |
| 06-13 | `session.e2e.ts` 14 | the same `aria-live` restoration, observed in a browser as two regions saying one thing |

---

## Standing hazards carried into this phase

- **The baselines are unknown at planning time.** Phase 5.1 is landing plans in this tree. 06-01
  measures; every later plan asserts previous + delta; **the sweep literal `3 13` is the documented
  exception and 06-01 confirms it still is.**
- **`session.svelte.spec.ts` would be collected by nothing.** The name is a trap the config's own
  exclude glob sets, and the spec's header says so.
- **A static import of the session's neighbours from `src/lib/ui/` is invisible to the source gate
  until 06-05 widens it.** No component wave precedes that widening, deliberately.
- **`config-shape.spec.ts` test 14 proves nothing without a fresh `build/`.** Three waves run the
  build for exactly this reason.
- **The e2e total is tag-sensitive.** A `@webkit` tag added to a title in the wrong file moves the
  suite total by one in a way no delta table explains.
- **The fake serial is modelled on a source reading**, so it cannot prove Chromium's behaviour, only
  HANGAR's consistency with it. Runbook rows A, B and E are the only closure.
- **The session now holds the port for a whole visit** rather than one panel. That is a deliberate
  safety-posture change from Phase 4's `closeOnHide`, it is 06-UI-SPEC open question 5, and while
  HANGAR holds the port Grid Editor cannot open it.
- **Three of Phase 6's five success criteria are tagged *(hardware)*** and close as
  **verified-by-user-pending**. No plan may mark them done.

---

## Deferred, and where it went

| Deferred | Where |
|---|---|
| A `BroadcastChannel` "already connected in another tab" detector | Out of scope: a second HANGAR tab produces the identical `NetworkError` as Grid Editor, so the visitor is told to quit an app that is not the problem. Recorded in `deferred-items.md` **with that reasoning**, so Phase 7 — where a mid-write conflict is much worse — inherits it rather than rediscovering it |
| An idle-timeout close on a hidden tab (PITFALLS C1) | Phase 7: it interacts with an in-flight write |
| `moduleStale` having a visible consumer | Phase 7: a write to a module that stopped answering is where it matters. Published and rendered nowhere here, deliberately, so the taxonomy stays at nine |
| Any write: snapshot, `PUT BACK`, `KEEP ON DEVICE`, store-to-flash | Phase 7, per the phase boundary in `06-CONTEXT.md` |
| Android WebUSB and iOS transports | Not here; recorded in `06-CONTEXT.md` as a possible later spike |
| Reducing the header note to one paragraph (72px) | 06-UI-SPEC open question 7; a copy-placement decision, one block from `DeviceNote.svelte` |

---

## Validation Sign-Off

- [ ] Every task has an automated command that fails when the task is not done
- [ ] Every negative check above was observed red before the gate was trusted
- [ ] No plan carries a literal whole-suite total (the sweep's `3 13` is the documented exception, and
      06-01 confirms it)
- [ ] The three widened gates each carry their amendment note in the amended file's own header
- [ ] Every SUMMARY carries the four-name block (`BASE_FILES`, `BASE_TESTS`, `BASE_SWEEP`, `PREV_E2E`)
- [ ] Phase 4's chunk guards, Phase 8's laziness guards, `identity.spec.ts`, `tune-ui.spec.ts`,
      `front-door.spec.ts` and `e2e/first-experience.e2e.ts` are green at the phase gate, the last of
      them **unedited**
- [ ] CONN-01 to CONN-08 are marked complete **each with the qualifier stated above**
- [ ] SAFE-01 and DEGR-02 are explicitly **not** claimed as closed
- [ ] The hardware checkpoint is recorded as **presented and unanswered**, and the phase's three
      *(hardware)* success criteria as **verified-by-user-pending**
