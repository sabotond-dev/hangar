---
phase: 06-device-session
plan: 14
subsystem: docs
tags: [runbook, phase-gate, testing-doc, traceability, hardware-checkpoint, verified-by-user-pending, CONN-01, CONN-02, CONN-03, CONN-04, CONN-05, CONN-06, CONN-07, CONN-08]

# Dependency graph
requires:
  - "06-01-SUMMARY.md - the five-name block measured on a clean tree at 746cfa2: BASE_FILES 66, BASE_TESTS 691, BASE_SWEEP `3 13`, BASE_E2E 61 (frozen), PREV_E2E 61"
  - "06-13-SUMMARY.md - PREV_FILES / PREV_TESTS 69 / 724, PREV_E2E 77, the shipped-chrome tests and the header on both engines this runbook describes"
  - "06-02, 06-04, 06-07 SUMMARYs - the strings, the listener pair, the replug adoption, the watchdog, forget(), the busy-port six steps, the identity line, each of which a runbook row quotes"
  - "docs/SKELETON-RUNBOOK.md and docs/SKELETON-RESULTS.md - the shape of a hardware runbook, and the two open questions (row 0, Firefox) this one inherits"
  - "src/lib/device/session-copy.ts and src/lib/transport/transport.ts - every string the runbook's Passes-when cells quote, read from the source that renders them"
  - "06-VALIDATION.md - the expected deltas (+3 / +33 / unchanged / +16), the eight qualifiers, the Manual-Only Verifications table"
provides:
  - "docs/SESSION-RUNBOOK.md - six hardware rows A to F with Do this, Passes when, why a machine cannot, and a Pass column; two warnings; the file:// trap; both ways of opening the page; the nine named states one line each; what to hand back; no engine named"
  - "docs/TESTING.md re-measured end to end at aca8227 against the production build, with a new section on the device session's test surface, the fake serial's role and limits, and the runbook named as the hardware half (deferred item 1 resolved)"
  - "The phase gate, green in one run: check 533 / 0 errors, lint 0, build 0, quick 69 / 724, sweep 3 13, e2e 77 at --workers 3 - every number baseline plus the phase's stated delta"
  - "CONN-01..08 closed in .planning/REQUIREMENTS.md with the qualifier each earned; SAFE-01 and DEGR-02 explicitly left to Phase 7"
  - "deferred-items.md items 11-14 and the 06-14 notes; the hardware checkpoint presented to the user and unanswered"
affects:
  - "Phase 7 - 07-01 re-measures the five baselines with Phase 6 closed; inherits deferred items 8 (owner), 10, 11, 12, 13 and the runbook's unanswered rows, which its first real write depends on"
  - ".planning/STATE.md, .planning/ROADMAP.md - Phase 6 at 14/14, complete with hardware rows awaiting the user"

tech-stack:
  added: []
  patterns:
    - "A phase whose success criteria are tagged (hardware) closes them as verified-by-user-pending, in those words, in the SUMMARY, the ROADMAP row and STATE - never as done because a scripted serial agreed with a source reading of the browser it fakes"
    - "A hardware runbook quotes the exact strings the page renders, read from the module that renders them rather than from the plan; every Passes-when cell here was checked against session-copy.ts and transport.ts, and one plan row was corrected by that check"
    - "The phase gate asserts the e2e total against BASE_E2E copied verbatim from the first plan plus the stated delta, and re-measures every other name; a gate that re-measured the number it asserts would assert nothing"
    - "A requirement closes with the qualifier it earned written into its traceability row, and a requirement whose spirit a phase exercised but does not own is explicitly NOT closed by that phase"
    - "docs/TESTING.md is re-measured once per phase, at its last plan, every wall time from a sequential run of one command alone, and every count observed rather than carried"

key-files:
  created:
    - "docs/SESSION-RUNBOOK.md"
    - ".planning/phases/06-device-session/06-14-SUMMARY.md"
  modified:
    - "docs/TESTING.md"
    - ".planning/phases/06-device-session/deferred-items.md"
    - ".planning/REQUIREMENTS.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "Row E of the runbook says the slot reads CONNECT ZONA with no caption immediately after FORGET THIS ZONA (06-UI-SPEC's S7) and NO ZONA only after the reload; the plan's row E said the header returns to NO ZONA. The spec's table is what the component renders, so the runbook follows the spec and records the plan's row as imprecise rather than repeating it"
  - "Row C tells the operator that on a machine which granted the port in an earlier row there is no picker - the header takes the adopted-port path and the open fails straight away - because a row that says 'pick the ZONA' to someone who never sees a list reads as a failed step"
  - "Row F asks the user whether the pre-click line was enough preparation for Firefox's first prompt, given that the two-step sentence lives beneath Nothing listed? in cancelled (D-04 amended) rather than in the pre-click line; the plan's 'the pre-click copy prepared the visitor for it' cannot be a pass condition against copy that deliberately does not say it, so it is a question"
  - "The runbook carries two notes beneath its table - the panel's TRY ON DEVICE being live in S5 (deferred item 10) and a managed Firefox reading Not in this browser (deferred item 2) - so neither is reported as a fault during the run"
  - "e2e/first-experience.e2e.ts:156 and :535 (deferred item 8) are NOT edited: this plan's files_modified is three documents and its rule is that no source file is edited here; neither site fired in this plan's full run, and the owner passes to Phase 7's first plan that touches the file"
  - "The e2e gate ran at --workers 3 (deferred item 7) and passed first time; docs/TESTING.md now instructs the flag on the command line because playwright.config.ts does not pin it and this phase does not edit that file"
  - "The unit-run row of docs/TESTING.md and the wall-time column were measured in a second, sequential pass after the gate, because a wall time taken while another suite ran would not be comparable with the Phase 5.1 row; the gate's own counts and runner durations are quoted from the gate run"
  - "Two spec tallies are recorded as errata rather than changed: SAFE_PROMISE is 126 characters (06-UI-SPEC and 06-02-PLAN say 125), and session-copy.ts's comment says failureCopy has six branches where since 06-01 it has seven (already-open renders through unknown). No code changed; the next editor of session-copy.ts owns the comment"

requirements-completed: [CONN-01, CONN-02, CONN-03, CONN-04, CONN-05, CONN-06, CONN-07, CONN-08]
requirements-contributed: [SAFE-01, DEGR-02]

# Metrics
duration: 30min
completed: 2026-09-05
---

# Phase 6 Plan 14: SESSION-RUNBOOK, the phase gate, and the hardware checkpoint Summary

**Everything a machine can prove about the device session is proven in one run against the bytes that would be deployed, and the six things it cannot are a checklist a person can run at a bench. The gate: `svelte-check` 533 files with 0 errors and 0 warnings, lint exit 0, a production build at `aca8227`, quick **69 files / 724 tests** (`BASE_FILES` 66 + 3, `BASE_TESTS` 691 + 33), sweep **`3 13`** unchanged, and e2e **77** at `--workers 3` (`BASE_E2E` 61 + 16, copied verbatim from 06-01 and asserted rather than re-measured: 67 chromium + 10 webkit-phone). Every number first time, none re-run, none adjusted, and every per-file count the plan quoted observed exactly. `docs/SESSION-RUNBOOK.md` carries six rows with a Pass column - the grant across a browser restart with the deployed origin asked for separately, unplug and replug, Grid Editor holding the port (the closure of `SKELETON-RUNBOOK` row 0, never exercised in Phase 2), a rig and a non-ZONA, `FORGET THIS ZONA`, and the optional Firefox two-step prompt - each with why a machine cannot check it, plus the two warnings the skeleton runbook did not need, the `file://` trap, the nine named states one line each, and what to hand back; it names no browser engine and its opening paragraph says nothing in this phase writes. `docs/TESTING.md` is re-measured end to end with a new section on the session's test surface and the fake serial's limits. CONN-01 to CONN-08 close with the qualifier each earned; SAFE-01 and DEGR-02 are explicitly Phase 7's. **The hardware checkpoint has been presented to the user and is unanswered.** Phase 6's three *(hardware)* success criteria are verified-by-user-pending, and no claim about a real ZONA has been made by this phase.**

## The five-name carry-forward block

`BASE_FILES`, `BASE_TESTS`, `BASE_SWEEP` and `PREV_E2E` **re-measured by this plan** at `aca8227`, as 06-VALIDATION.md schedules for the last plan. `BASE_E2E` **copied verbatim from 06-01** - it is the clean tree's e2e total, and it is what this plan's gate, `BASE_E2E + 16`, was asserted against. Re-measuring it here would have made the gate assert nothing.

| Name         | Value                      | Measured                                                                                                      |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **69** (re-measured)       | `npm run test:quick` at `aca8227`, after `npm run build`: `Test Files 69 passed (69)`. 06-01's 66 + 3          |
| `BASE_TESTS` | **724** (+ 1 todo = 725)   | the same run: `Tests 724 passed \| 1 todo (725)`. 06-01's 691 + 33                                             |
| `BASE_SWEEP` | **`3 13`**                 | `npm run test:sweep` - the literal it printed, unchanged from 06-01. Never re-derived                          |
| `BASE_E2E`   | **61 (measured by 06-01)** | **Copied verbatim, never re-measured.** This plan asserted `BASE_E2E + 16` = **77** against it, and it held    |
| `PREV_E2E`   | **77 (measured by 06-14)** | `npm run test:e2e -- --workers 3` at `aca8227`: `77 passed (1.1m)`, 67 chromium + 10 webkit-phone             |

`BASE_CHECK` (provenance only): **533 files, 0 errors, 0 warnings**, `npm run check`. 06-01 recorded 517; the phase added sixteen files to the type-checked set.

### The phase's arithmetic, reconciled end to end against 06-01

| Suite               | 06-01 baseline | 06-VALIDATION's stated phase delta | Observed here | Reconciles |
| ------------------- | -------------- | ---------------------------------- | ------------- | ---------- |
| `test:quick` files  | 66             | +3                                 | **69**        | yes        |
| `test:quick` tests  | 691            | +33                                | **724**       | yes        |
| `test:sweep`        | `3 13`         | unchanged                          | **`3 13`**    | yes        |
| `test:e2e`          | 61             | +16                                | **77**        | yes        |

No number disagreed, so nothing was traced back to a plan and nothing was edited to fit. The e2e +16 decomposes as 06-VALIDATION.md wrote it: 06-06 four titles of which one `@webkit` (+5), 06-07 five untagged (+5), 06-13 five of which one `@webkit` (+6).

### The commands, verbatim, in the plan's order

```
npm run check 2>&1 | grep -Ei "error|warning"
  1788600739131 COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!      (exit 0)

npm run build
  exit 0; postbuild: aca82274126a7d94e299c7db630fc34b38482d38 - LICENSE, THIRD-PARTY.md and licenses/
  copied into build/; source-aca82274126a7d94e299c7db630fc34b38482d38.tar.gz is 950 KB
  build/index.html 18,533 bytes; build/dev/session/index.html 8,024 bytes

npm run test:quick 2>&1 | tee .tmp-e2e/06-14-quick.log | node scripts/check-counts.mjs 69 724
  check-counts: observed 69 files, 724 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts
  Duration 22.58s

npm run test:sweep 2>&1 | tee .tmp-e2e/06-14-sweep.log | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo
  check-counts: matches the expected counts
  counted 1296 combinations in 2.6s; worst 906 of 908 at none/none/trackpad/hi=false/grid=false; over budget 0
  Duration 76.96s

npm run test:e2e -- --workers 3 2>&1 | tee .tmp-e2e/06-14-suite-w3.log | node scripts/check-counts.mjs --playwright 77
  check-counts: observed 77 tests passed
  check-counts: matches the expected counts
  77 passed (1.1m)          0 lines containing "failed"; no ProxyController, no Network connection lost
```

`format-parity.spec.ts` did not flake; the sweep and quick ran without a re-run. After the e2e run: **no listener on 4173 or 4174**, no `workerd` or `wrangler` process, and `test-results/` (present after the green run, deferred item 5) removed by hand.

### Per-file counts, each observed by running the file

Eleven files in one `npx vitest run --project server` with the JSON reporter, 87 of 87 passed:

| File                                              | Tests  | The plan's expectation           |
| ------------------------------------------------- | ------ | -------------------------------- |
| `src/lib/ui/identity.spec.ts`                     | **6**  | 6                                |
| `src/lib/ui/tune-ui.spec.ts`                      | **5**  | 5                                |
| `src/lib/catalog/front-door.spec.ts`              | **8**  | unchanged (8 since Phase 4)      |
| `src/lib/config-shape.spec.ts`                    | **14** | 14                               |
| `src/lib/ui/device-ui.spec.ts`                    | **7**  | 7                                |
| `src/lib/device/session.spec.ts`                  | **17** | 17                               |
| `src/lib/device/session-copy.spec.ts`             | **6**  | 6                                |
| `src/lib/transport/transport.spec.ts`             | **9**  | 9                                |
| `src/lib/device/try-on.spec.ts`                   | **7**  | 7                                |
| `src/lib/sim/lazy.spec.ts`                        | **3**  | Phase 8's laziness guard, green  |
| `src/lib/protocol/forbidden-instructions.spec.ts` | **5**  | 5 (widened by 06-05, not grown)  |

Playwright, per file and per project, from `.tmp-e2e/06-14-suite-w3.log`: `session.e2e.ts` **14 / 2**, `first-experience.e2e.ts` **11 / -** (unedited, deferred item 8's two sites did not fire), `browse.e2e.ts` 11, `tuning.e2e.ts` 10, `tuning-webkit.e2e.ts` 5 / 5, `smoke.e2e.ts` 4, `browse-webkit.e2e.ts` 3 / 3, `artifacts.e2e.ts` 3, `catalog.e2e.ts` **2** (Phase 8's other laziness guard, green), `fidelity.e2e.ts` 2, `skeleton.e2e.ts` 2 - **67 chromium + 10 webkit-phone = 77**.

## Task 1 - `docs/SESSION-RUNBOOK.md` (commit `aca8227`)

164 lines, modelled on `docs/SKELETON-RUNBOOK.md`: the copyright line; an opening paragraph that says in its second sentence that nothing in this phase writes, installs or stores; the Web Serial cannot-be-automated paragraph with the green counts; the inheritance of row 0 from Phase 2; **Before you start** (five items - Grid Editor quit except for row C, any configuration is fine because nothing writes, a second module for row D, Chrome / Edge / desktop Firefox 151+, and that switching tabs does not end the session); the **two warnings** (row E revokes a real permission; HANGAR holds the port for the whole visit so Grid Editor cannot open it, with `DISCONNECT ZONA` one click away); the four numbers (1500 ms identify, 750 ms missed heartbeats gated on the port having left, 500 ms coalescing, four heartbeats a second); **Getting the page open** naming `npm run preview` on `http://127.0.0.1:4173/` and the deployed origin `https://hangar.sabotond.workers.dev/` behind `npm run deploy`, the Basic Auth realm `HANGAR preview` on both, and the `file://` trap with its tell; a section on where the slot is and what connected looks like, including the reload landing the offer; the six-row table with a Pass column; two notes so deferred items 10 and 2 are not reported as faults; **If something goes wrong** with the nine named states one line each plus the `already-open` sentence; and **What to hand back**.

Every `Passes when` cell quotes the string the page renders, read from `session-copy.ts` or `transport.ts`: `ZONA detected` over `CONNECT ZONA`; `ZONA unplugged` over `NO ZONA` and `The ZONA was unplugged. Nothing was written.`; `Another program is holding the port` and the six steps ending `Click CONNECT ZONA again`; `That module is not a ZONA` with `It reported itself as <TYPE>. HANGAR only speaks to a ZONA, so nothing was sent.`; `· with <TYPE>` and `Also on the cable: <TYPE>.`; `CONNECT ZONA` with no caption after `FORGET THIS ZONA` and `NO ZONA` after the reload; `You closed the chooser` and `Nothing listed?` for a dismissed Firefox prompt.

The scan the acceptance criteria ask for, quoted:

```
grep -n -i -E "chromium|webkit|gecko|blink" docs/SESSION-RUNBOOK.md
  (no output)  -> scan: no engine name in docs/SESSION-RUNBOOK.md
grep -c "!" docs/SESSION-RUNBOOK.md
  0
npm run lint
  All matched files use Prettier code style!      (exit 0)
```

Chrome, Edge and Firefox are named, as the plan and the shipped `UNSUPPORTED_DETAIL` allow; no engine is.

## Task 2 - the phase gate, `docs/TESTING.md`, and the traceability pass (commit `268c0f0`)

### `docs/TESTING.md`

- The "How to run it" paragraph and table re-measured at `aca8227`, each wall time from a **sequential** pass of one command alone after the gate (the gate's own runs overlapped quick with sweep, which would have made the wall column incomparable with the Phase 5.1 row): quick 69 / 724 + 1 todo, 25 s wall (22.9 s); sweep 3 / 13, 79 s wall (76.8 s); unit 72 / 737 + 1 todo (69 + 3 files, 724 + 13 tests); e2e 77 (67 + 10) at `--workers 3`, 1.1 m runner; check 533 files, 7 s; build 10 s; lint exit 0. The unit and lint wall figures are the last two rows of the pass and are in the committed table.
- Two new paragraphs beneath the table: run e2e at `--workers 3` and why (deferred item 7); every count is a baseline plus a delta, with Phase 6's reconciled arithmetic.
- The skeleton table's `transport.spec.ts` row 7 → 9 and its totals sentence 99 → 101, naming the `already-open` row; the front-door table's `try-on.spec.ts` 6 → 7, naming the rig-aware refusal.
- The Phase 4 paragraph "Web Serial past the capability check is still not automatable" now points forward: Phase 6 widened both halves, and the hardware half is `docs/SESSION-RUNBOOK.md`.
- A new section, **The device session's test surface**: the per-file table (session-copy 6, session 17, device-ui 7, transport 9, try-on 7, config-shape 14 widened, forbidden-instructions 5 widened); the injectable serial surface and the 3-of-119 chunk fact; the fake serial's role **and its limits**, stated as the five things it cannot prove and the runbook rows that close them; `session.e2e.ts` at 14 titles adding 16; and three conventions from that file (wait on published state, walk the site's own links then assert the offer after a reload, make a counter leave zero once).
- "Before an e2e run": the suite is 77 (ten tagged titles), the per-file table with `session.e2e.ts` 14 / 2 / 16 and totals 67 / 10 / 77, five probe routes with `/dev/session/`, and the `test-results/.last-run.json` note.

### The eight qualifiers, as written into `.planning/REQUIREMENTS.md`

Each checkbox is now `[x]` and each traceability row reads `Complete (...)` with the text below, abridged here to the qualifier:

- **CONN-01** - closed, proven in both browsers: one control, in the header, on all three routes, enabled from `capabilityOf({hasSerial, secure})` and nothing else; no user-agent read anywhere in the tree, asserted by `session-copy.spec.ts` and the source scans.
- **CONN-02** - closed, proven in both browsers: two distinct messages, both rendered in a real browser - `unsupported` on WebKit with no `navigator.serial`, `insecure` through a shadowed `isSecureContext`, the first time the insecure branch has ever rendered in this project; Chrome, Edge and desktop Firefox 151 named, no engine.
- **CONN-03** - closed, proven in both browsers: the 130-character pre-click line beneath the header row and in the chosen panel, never both at once; the two-step sentence unconditional and brand-free beneath `Nothing listed?`, because no non-brand behavioural signal for that prompt exists.
- **CONN-04** - closed **against a scripted `NetworkError`**: the named block, Grid Editor by name, six steps in order, the browser's own sentence nowhere, from the probe and from the shipped header. **That Grid Editor is what produces it on a real machine is runbook row C**, awaiting the user.
- **CONN-05** - closed, proven in both browsers: `cancelled` is its own state; the empty-picker branch is a disclosure beneath it because the API cannot tell the two apart (one `NotFoundError`, three causes); the third cause gets its own disclosure.
- **CONN-06** - closed **against a scripted serial**: the offer on load with the port unopened, one click and zero `requestPort()` calls (never automatic), the unplug flipping the header in the same turn, the replug that mints a **new** port object adopted by USB identity, the connection surviving a four-hop walk, a reload landing the offer. **The grant surviving a browser restart - and for the deployed origin - and the replug on real hardware are runbook rows A and B**, awaiting the user.
- **CONN-07** - closed **with the correction the research found**: the filter is `0x303a/0x8123`, but every ESP32-S3 Grid module shares that identity, so the filter does not narrow the picker to a ZONA, the heartbeat verify is the whole of it, and `not-zona` is a routine first-class state naming the module that answered. **The rig half is runbook row D**, awaiting the user.
- **CONN-08** - closed: type, firmware and active page in the header while connected, **live** rather than frozen at connect time, the rig tail filling in as modules announce themselves; `connected` is reached only after the heartbeat names a ZONA.

**Explicitly NOT closed by this phase:**

- **SAFE-01** is Phase 7's. Its spirit is asserted twice here - zero writes across a full cycle in node (`session.spec.ts` test 15, both halves) and in a browser (`session.e2e.ts`, `writes() === 0` at the end of every visit, a planted write observed making it 2) - and the connect surface says it out loud. It closes when there is a write for the sentence to be about.
- **DEGR-02** is Phase 7's. The header obeys it - present, disabled, reason adjacent, never hidden - proven on WebKit at a phone viewport in `session.e2e.ts` test 13 and by `first-experience.e2e.ts` unedited. It closes when the install controls it is about exist.

### `deferred-items.md`

06-02's item 2 (the managed-Firefox sentence) is present and unedited; so are items 1 and 3 to 10. This plan **appends** four items with their reasoning, and a notes section:

- **11.** The `BroadcastChannel` second-tab detector - a second HANGAR tab produces the identical `NetworkError` as Grid Editor, so the visitor is told to quit an app that is not the problem; the two causes are indistinguishable at the `open()` rejection, so the signal has to come from HANGAR's own other tab. Owner: Phase 7, where a mid-write conflict is much worse.
- **12.** The idle-timeout close on a hidden tab - the session holds the port for the whole visit (a deliberate posture change from Phase 4's `closeOnHide`, stated in the runbook's second warning); an idle close interacts with an in-flight write and cannot be designed before the write exists. Owner: Phase 7.
- **13.** A staleness signal for a module that goes silent while its port stays attached - the watchdog fires only on the missed disconnect, silence alone leaves the session `connected` (06-04 test 12), Phase 6 publishes no such field because nothing would render it and the taxonomy is nine. Owner: Phase 7, where a write to a module that stopped answering is what matters; the private `#lastSeen` is the field to publish.
- **14.** Measurements recorded rather than gated - 3 of 119 chunks, the 152px note and the 124 / 276 headline, the hydration window, 1.1 m at three workers, the 1870 ms false green, row F's timing. Owner: none needed; it exists so a recorded number is not read as an asserted one.
- **Notes:** item 1 resolved by this plan; item 5 (`test-results/` after a green run) removed by hand and now written into `docs/TESTING.md`; item 7 (three workers, first time green); **item 8 read, decided, left** - not in this plan's files, no source file is edited here, neither site fired, owner passes to Phase 7's first plan that touches `first-experience.e2e.ts` or to 07-01; item 9 not re-measured; item 10 not driven and warned about in the runbook; and the two spec errata below.

### Two spec errata, recorded and not changed

- `SAFE_PROMISE` is **126 characters**, not the 125 that 06-UI-SPEC and 06-02-PLAN state. The string is verbatim from the contract (06-02 proved it by substring match against the spec) and `session-copy.spec.ts` asserts 126. The count in the spec is the erratum.
- `session-copy.ts`'s comment on `FAILURE_COPY_STATES` says the six states "are exactly the six branches failureCopy has". Since 06-01 `failureCopy` has **seven** branches: those six plus `already-open`, which renders through the `unknown` row and is deliberately not a named state. Nine named states is right; the transport's branch count in that sentence is stale. No code was changed in this plan, per its standing rule; the next editor of `session-copy.ts` owns the one-line comment fix.

### `.planning/ROADMAP.md` and `.planning/STATE.md`

By hand: Phase 6 checked and dated 2026-09-05 with the qualifier that the six-row checklist is presented and unanswered; 06-14 checked; the progress row `14/14 | Complete (hardware rows A-F awaiting the user) | 2026-09-05`; a **Status at the gate** line under the phase's success criteria saying criteria 1 and 2 are proven in two browsers and criteria 3, 4 and 5 are verified-by-user-pending. STATE.md: position at 14 of 14, the gate's numbers, the Phase 6 blocker line beside Phase 8's audition line in the same words, metrics recomputed by hand (70 plans, 1,861 minutes; Phase 06 at 14 plans, 492 minutes), the P13 and P14 rows added, five decisions, the session continuity.

## Task 3 - the hardware checkpoint: PRESENTED TO THE USER AND UNANSWERED

**This checkpoint was presented in the executor's final report and was not answered, simulated or run.** The executor never connected to a device, never wrote to one and never deployed. `docs/SESSION-RUNBOOK.md` is on disk at `aca8227`; task 2's gate is green; the page is reachable through `npm run preview` on `http://127.0.0.1:4173/`, or on `https://hangar.sabotond.workers.dev/` if the user chooses to deploy first (row A needs the deployed origin, and only the user may deploy).

Consequently, and in plain words: **Phase 6's success criteria 3, 4 and 5, tagged *(hardware)*, are verified-by-user-pending.** No claim about a real ZONA has been made by this phase. Nobody has yet, through the session: seen the grant survive a browser restart on any origin; unplugged and replugged a cable; asked Grid Editor to hold the port; attached a second Grid module or a non-ZONA; clicked `FORGET THIS ZONA` against a real browser profile; or connected from Firefox 151+. The scripted serial that walked all of those in the suite is modelled on a source reading of the browser, and its own header says so. The six rows are the only closure, and they are the user's.

## Deviations from Plan

### 1. [Process] Runbook row E follows the spec's S7, not the plan's wording

**Found during:** task 1, checking every `Passes when` string against `session-copy.ts` and 06-UI-SPEC. **Issue:** the plan's row E says the header "returns to `NO ZONA`" after `FORGET THIS ZONA`; 06-UI-SPEC's S7 (`forgotten`) renders `CONNECT ZONA` with no caption, and `NO ZONA` is S1, reached after the reload when nothing is granted. **Resolution:** the runbook says both, in order, so the operator does not read the correct S7 label as a failure. No code changed.

### 2. [Process] Runbook row C names the no-picker path

**Found during:** task 1. **Issue:** the plan's row C says "click `CONNECT ZONA` and pick the ZONA"; with a port granted in an earlier row the header takes the adopted-port path and no list appears (06-12's harness note, 06-13 test 12). **Resolution:** the row says a list appears only where nothing is granted, and that either path lands in the same block.

### 3. [Process] Runbook row F asks a question where the plan states a pass condition

**Found during:** task 1. **Issue:** the plan's row F passes when "the pre-click copy prepared the visitor for it", but D-04 amended moved the two-step sentence out of the pre-click line into `cancelled`'s `Nothing listed?` disclosure. **Resolution:** the row's pass condition is the prompt order and the completed connection; whether the pre-click line was enough preparation is asked as a question to hand back, with the copy's actual placement stated.

### 4. [Process] Wall times measured in a separate sequential pass

**Found during:** task 2. **Issue:** the gate ran quick and sweep concurrently to save wall time, which makes their wall clocks incomparable with the Phase 5.1 row in `docs/TESTING.md`. **Resolution:** the gate's counts and runner durations are quoted from the gate run; the wall column was measured afterwards, one command at a time, in `.tmp-e2e/06-14-timing2.log` and `.tmp-e2e/06-14-timing3.log`. The first attempt at that pass produced no wall figures because `bc` is absent from this Git Bash; it was redone with shell arithmetic.

### 5. [Process] The unit-run row is measured, not derived

The plan's command list does not include `npm run test:unit -- --run`, but `docs/TESTING.md`'s table has a row for it and the document's rule is that every figure is observed. It was run once, alone: 72 files, 737 passed + 1 todo (738), 82.4 s runner.

No Rule 1-3 deviation occurred: no source file was edited, no bug was found by the gate, nothing was auto-fixed.

## Known Stubs

None. This plan created two documents and edited four; it ships no component and wires no data.

## What the next phase inherits

- **The hardware checkpoint is open.** Rows A to F of `docs/SESSION-RUNBOOK.md`, presented and unanswered. Phase 7's first real write (its own runbook and checkpoint) rests on rows A to E having been run; 07-01, which only re-measures baselines, does not.
- The five-name block above. Phase 7 measures its own on a clean tree at its first plan, as 06-01 did; the numbers here are the tree it will find: quick **69 / 724**, sweep `3 13`, e2e **77** at `--workers 3`, svelte-check 533.
- Deferred items 8 (owner: Phase 7's first editor of `first-experience.e2e.ts`, or 07-01), 10, 11, 12 and 13, each with its reasoning in `deferred-items.md`.
- The two spec errata, for the next revision of 06-UI-SPEC and the next editor of `session-copy.ts`.
- `docs/TESTING.md` is current as of `aca8227` and goes stale with the first Phase 7 spec; Phase 7's last plan re-measures it, as this one did.

## Self-Check: PASSED

Files claimed, verified present on disk:

- `docs/SESSION-RUNBOOK.md` - FOUND, 164 lines, committed at `aca8227`; `grep -i chromium` empty, no exclamation mark
- `docs/TESTING.md` - FOUND, 751 lines, no `WALL_` or `RUNNER_` placeholder left, Prettier-clean
- `.planning/phases/06-device-session/deferred-items.md` - FOUND, 425 lines; 06-02's item 2 present and unedited; 17 `##` headings (items 1-14, Resolved, the 06-13 notes, the 06-14 notes)
- `.planning/REQUIREMENTS.md` - FOUND; eight `[x] **CONN-` lines, eight `| Phase 6 | Complete` rows
- `.planning/phases/06-device-session/06-14-SUMMARY.md`, `.planning/STATE.md`, `.planning/ROADMAP.md` - FOUND

Commits claimed, verified in `git log`:

- `aca8227` docs(06-14): SESSION-RUNBOOK - the six hardware rows a machine cannot run - FOUND
- `268c0f0` docs(06-14): the phase gate, TESTING.md re-measured, and the traceability pass - FOUND

State claimed, verified:

- no listener on 4173 or 4174; no `workerd` or `wrangler` process; `test-results/` ABSENT
- `verified-by-user-pending` appears in this SUMMARY, in ROADMAP.md and in STATE.md
- no file under `src/` changed in this plan (`git diff --stat 8f8ab6b..HEAD -- src` is empty); no device connected; no deploy
- the e2e log `.tmp-e2e/06-14-suite-w3.log` (gitignored) holds `77 passed (1.1m)` and zero lines containing `failed`
