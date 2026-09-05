---
phase: 07-install-flow
plan: 13
subsystem: docs
tags: [install-runbook, phase-gate, hardware-checkpoint, traceability, SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-06, SAFE-07, SAFE-08, SAFE-09, DEGR-02, D-13, D-14, D-19, deferred-items-22-29, verified-by-user-pending]

# Dependency graph
requires:
  - ".planning/phases/07-install-flow/07-12-SUMMARY.md - the five-name block (BASE_FILES 69, BASE_TESTS 724, BASE_SWEEP `3 13`, BASE_E2E 77 frozen, PREV_E2E 89), the tree at quick 73 / 776 expected (read 775 + item 12's timeout three times under memory pressure), sweep `3 13`, e2e 89 = 78 chromium + 11 webkit-phone at `--workers 3`, svelte-check 545; deferred items 1 to 21"
  - "07-01-SUMMARY.md - BASE_E2E 77, measured once on the clean tree Phase 6 closed at 145f85d and frozen; the gate asserts BASE_E2E + 12 against it"
  - "07-02 to 07-11 - what each plan proved and could not: the exact string pin (07-05), the snapshot gate in the gated order with D-03 over Z-16 (07-06, item 7), the session-only fallback and the two snapshot lines (07-04, 07-06, 07-11), the three legs and their labels (07-07, 07-10), the fourteen states (07-06, 07-07, 07-08), the header write-lock (07-04, 07-11), the never-both rule (07-10), install-put-back-click on the probe (07-08, item 10), keptThisSession set on kept and cleared by a put-back that stored (07-07)"
  - "07-CONTEXT.md D-14 (the user's daytime checklist: the first RAM write, PUT BACK, a power cycle bringing the original back, KEEP ON DEVICE surviving a power cycle, a fresh-tab PUT BACK) and D-19 as amended (0 ms pre-send escalating to 10 on a write timeout with no NACK; three re-fetch rounds after the ZONA's next heartbeat; SERIALNUMBER/FETCH unproven on hardware)"
  - "07-RESEARCH.md § The hardware checklist and § Open Questions 1 to 3, Pitfalls 3, 6 and 7; 07-VALIDATION.md § Expected deltas, § Requirement ownership, § Manual-Only Verifications; 07-UI-SPEC.md I0 to I13, the header disclosure, the Copywriting Contract"
  - "docs/SESSION-RUNBOOK.md and docs/SKELETON-RUNBOOK.md - the house shape: before you start, getting the page open, a table with a Pass column, if something goes wrong, what to hand back"
  - "src/lib/device/install-copy.ts and session-copy.ts - every string the runbook quotes, transcribed rather than paraphrased; src/lib/protocol/constants.ts - executeMs 250, pagestoreMs 3000, RETRY_ATTEMPTS 3, retryBackoffMs 120/240/360, PRE_SEND_DELAY_MS 0, DESKTOP_PRE_SEND_DELAY_MS 10"
provides:
  - "docs/INSTALL-RUNBOOK.md - seven rows A to G, each with a Do this, a Passes when, a why-a-machine-cannot and a Pass column; D-19's three measurements in bold (row A: which snapshot line - durable or session-only - which is whether a real ZONA answered SERIALNUMBER/FETCH; row B: the wall time from the click to PLAYING NOW, the white border flash, a timeout, and whether pacing escalated; row E: the re-fetch round count, from the probe's steps list); the two warnings; the numbers block; both ways of opening the page with the Basic Auth prompt and the file:// trap; the twelve device-state blocks one line each; a five-step recovery order; the hand-back. It says in plain words that it writes to the module, that nothing before row B has ever written to a real ZONA from this site, and that the executor and the orchestrator never run any row"
  - "The phase gate, green first time against the production build at f20d74f: check 545 / 0 / 0, lint exit 0, build exit 0, quick 73 / 776 (BASE_FILES + 4, BASE_TESTS + 52) with no timeout, sweep `3 13` (unchanged), e2e 89 (BASE_E2E 77 + 12; 78 chromium + 11 webkit-phone) at --workers 3; every one of the thirteen per-file counts at the value 07-VALIDATION asserts"
  - "docs/TESTING.md - the How-to-run table re-measured at the Phase 7 gate, Phase 7's arithmetic beside Phase 6's with BASE_E2E as 07-01 froze it, a new section on the install flow's test surface (thirteen per-file counts, the Node responder's role and limits, install.e2e.ts's three blocks, the D-13 reading, the two numbers recorded and not gated, the runbook as the hardware half, two conventions), the e2e per-file table at 89, six probe routes"
  - "docs/HARDWARE-AUDITION.md item 2 in the present tense: HANGAR installs now through TRY ON DEVICE with PUT BACK beside it and KEEP ON DEVICE behind a confirmation; the audition through BOTOR's shelf is still the way to hear a configuration not yet in the catalog"
  - "SAFE-01 to SAFE-09 and DEGR-02 closed in REQUIREMENTS.md with the qualifier each earned, the five hardware halves named as INSTALL-RUNBOOK rows and marked awaiting the user; ROADMAP.md Phase 7 at 13/13 complete with the checkpoint presented and unanswered"
  - "deferred-items.md items 22 to 29: the NACK copy the contract does not carry; the module id shown to the visitor; the third colour; the setInterval lint rule enforced by hand in five scans; the flash write ordering under an unplug as a runbook caution; the durable record consulted only after a non-empty fetch (item 7 carried); the pacing escalation and the re-fetch rounds as experiments recorded and not gated, with refetchRounds having no probe readout; and PUT BACK after a keep in an earlier page load being memory-only"
  - "The hardware checkpoint, PRESENTED to the user and UNANSWERED: the first write to a real ZONA from this site is the user's click at row B, and no agent has written a byte to a real ZONA in this phase"
affects:
  - "The user - docs/INSTALL-RUNBOOK.md rows A to G are theirs to run; the row results, row A's answer, row B's wall time and pacing, row E's round count decide how SAFE-04 finally closes (partially verified if row A reads the session-only form) and what happens to the pacing escalation and the three-round bound (item 28)"
  - "Phase 7 verification - every count is on the record as baseline plus delta; the five (hardware) halves are verified-by-user-pending, in those words, and must not be read as done"
  - "A gap plan - items 22 to 29, each with its owner; item 29 (a fresh tab's PUT BACK after a keep is memory-only) is Rule 4 territory over the one persistent schema and waits on the user's decision"
  - ".planning/STATE.md - Phase 7 at 13 of 13 by hand, 100% with the three hardware checkpoints (Phases 6, 7, 8) unanswered; the Phase 7 flash-ordering blocker rewritten as a caution and a new blocker naming the unanswered checklist"

tech-stack:
  added: []
  patterns:
    - "A runbook row is designed against the store's semantics, not transcribed from the research: row E runs in one tab because keptThisSession is a field of the page load; row F leaves a memory-only try-on on the module before the browser is quit so that the pad coming back to the original can only have come from the browser's storage; the research's row F as written (after row E's final PUT BACK) would have restored an original over an identical original and proved nothing about the record"
    - "A runbook row that asks for a number says where on the page the number is, and the check is to look: the plan said refetchRounds was on the probe, the probe shows pacing only, so the row reads the count from the steps list (one refetch-setup line per round) and the gap is item 28 rather than a source edit this plan is forbidden"
    - "A measurement whose exact readout is on the probe is also given a real-page proxy, so the row can be run on the page a visitor sees: pacing escalation is deducible from the first click's behaviour (it fires only on a write timeout with no refusal, so PLAYING NOW with no block in between means it never fired); the round count's proxy is the time to KEPT and whether the mismatch block ever appeared"
    - "The hardware halves close as verified-by-user-pending, in those words, with the row that would confirm each named beside the requirement; a phase that marked them done because a fake agreed with a source reading would be doing exactly what the fake's own header warns about"

key-files:
  created:
    - "docs/INSTALL-RUNBOOK.md"
    - ".planning/phases/07-install-flow/07-13-SUMMARY.md"
  modified:
    - "docs/TESTING.md"
    - "docs/HARDWARE-AUDITION.md"
    - ".planning/phases/07-install-flow/deferred-items.md"
    - ".planning/REQUIREMENTS.md"
    - ".planning/ROADMAP.md"
    - ".planning/STATE.md"

decisions:
  - "THE HARDWARE HALVES CLOSE AS VERIFIED-BY-USER-PENDING, IN THOSE WORDS: SAFE-02, SAFE-03, SAFE-04, SAFE-05 and SAFE-06 are closed against the fake with the runbook row that would confirm each named beside them (D, C, A and F, E, G); SAFE-04 closes with its key wire-unproven so a failed row A makes it partially verified rather than a lie; no agent has written a byte to a real ZONA"
  - "ROWS A TO F RUN IN ONE TAB, BY DESIGN AND BY THE STORE'S SEMANTICS: keptThisSession is set on kept, cleared by a put-back that stored and never reset by an unplug or a reconnect, so a keep, a power cycle and a PUT BACK in one page load leave the module as found; a fresh tab's PUT BACK is memory-only (item 29), and the runbook's recovery step 4 gives the HANGAR-only route back (try on, keep, put back)"
  - "ROW F PROVES THE DURABLE RECORD BY LEAVING AURORA IN MEMORY BEFORE THE BROWSER IS QUIT: at the fresh connect a copy taken then would be Aurora, and an existing record is what wins, so the pad coming back to the original can only have come from localStorage; the honest failure on a session-only row A is named in the row (PUT BACK restores Aurora and the pad does not change; a power cycle brings the original back)"
  - "THE ROUND COUNT IS READ FROM THE PROBE'S STEPS LIST, NOT FROM A READOUT THAT DOES NOT EXIST: each round records refetch-setup and refetch-timer through the queue's onStep, so the number of refetch-setup lines after store ok is the count; no source file is edited by rule and the gap is item 28"
  - "THE D-13 READING: install on chromium, degrade on webkit-phone. The six probe walks and the four real-page titles run on chromium alone because Web Serial exists in no WebKit; the one @webkit title (07-12's test 11) is the degrade path; +12 is 6 + 4 + 1 x 2, not two engines walking the install"
  - "THE D-19 INVERSION IS NAMED SO NOBODY RE-INVERTS IT: the clause as first written said the write path uses the desktop's 10 ms and the runbook measures 0 ms; what 07-07 ships is the reverse - 0 ms pre-send (PRE_SEND_DELAY_MS, SKELETON-RESULTS (b)) escalating once to DESKTOP_PRE_SEND_DELAY_MS on a write timeout with zero NACKs per 07-RESEARCH Pitfall 3 - and row B records whether the escalation ever fired. The 0 ms-then-escalate design stands; D-19's pacing clause was amended in place after plan check 2 to match"
  - "AN EIGHTH DEFERRED ITEM IS APPENDED BEYOND THE PLAN'S SEVEN: a finding is a finding for a gap plan, and PUT BACK after a keep in an earlier page load being memory-only is a product fact the runbook works around and cannot fix"

requirements-completed: [SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-06, SAFE-07, SAFE-08, SAFE-09, DEGR-02]
requirements-contributed: []

# Metrics
duration: 35min
completed: 2026-09-05
---

# Phase 7 Plan 13: INSTALL-RUNBOOK, the phase gate, and the hardware checkpoint Summary

**Everything a machine can prove about writing to a ZONA is proven, in one run, against the bytes that would be deployed - and the seven things no machine can check are a checklist a person can run at a bench in half an hour, three of them asking for a number. The gate ran green first time against the production build at `f20d74f`: `svelte-check` **545** files / 0 errors / 0 warnings, `npm run lint` exit 0, `npm run build` exit 0, quick **73 / 776** (`BASE_FILES` 69 + 4, `BASE_TESTS` 724 + 52, no timeout at 1.7 GB free), sweep **`3 13`** (unchanged), e2e **89** (`BASE_E2E` 77 + 12 = 78 chromium + 11 webkit-phone) at `--workers 3`, and every one of the thirteen per-file counts 07-VALIDATION asserts absolutely read its expected value when the files were run alone. `docs/INSTALL-RUNBOOK.md` has rows A to G with a Do this, a Passes when, a why-a-machine-cannot and a Pass column, every expected string transcribed from `install-copy.ts` and `session-copy.ts`, and D-19's three measurements in bold: whether a real ZONA on 1.5.5 answers `SERIALNUMBER/FETCH` (row A - read off the header's snapshot line, durable or session-only), the wall time of the first RAM write and whether 0 ms pacing survived two full-size writes (row B), and how many re-fetch rounds the store's read-back took (row E), with the caution that the firmware flashes Setup before Timer under an unplug. Two rows were redesigned against the store's own semantics rather than transcribed: rows A to F run in one tab because `keptThisSession` is a field of the page load, and row F leaves Aurora in memory before the browser is quit so the pad coming back to the original can only have come from the browser's storage. `docs/TESTING.md` carries the re-measured numbers, the install suite's place in the map, the Node responder's role and its limits, and one line naming the runbook as the hardware half; `docs/HARDWARE-AUDITION.md` no longer says HANGAR cannot install. SAFE-01 to SAFE-09 and DEGR-02 are closed with the qualifier each earned; the five *(hardware)* halves are **verified-by-user-pending**, in those words. Deferred items 22 to 29 are appended - the plan's seven and one more: a `PUT BACK` after a keep in an earlier page load is memory-only. **The hardware checkpoint has been presented to the user and is unanswered. No agent has written a byte to a real ZONA in this phase; the first write is the user's click at row B.** No source file was edited. No device was connected to, looked for or written to.**

## The five-name carry-forward block

Carried from 07-12, which carried it from 07-01's measurement on the clean tree Phase 6 closed at `145f85d`. This plan re-measures `BASE_FILES`, `BASE_TESTS`, `BASE_SWEEP` and `PREV_E2E` and **copies `BASE_E2E` verbatim from 07-01**: **77 (measured by 07-01)** - the gate `BASE_E2E + 12` = **89** is asserted against that frozen number and passed.

| Name         | Value                      | Note                                                                                                                                          |
| ------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **69**                     | This plan adds **0** spec files. Tree re-measured: **73** (+ 4 = 07-03 + 2, 07-05 + 1, 07-06 + 1)                                              |
| `BASE_TESTS` | **724** (+ 1 todo = 725)   | This plan adds **0**. Tree re-measured: **776** passed + 1 todo (+ 52 = 2 + 5 + 13 + 4 + 6 + 8 + 10 + 0 + 2 + 1 + 1 + 0 + 0), **no timeout**    |
| `BASE_SWEEP` | **`3 13`**                 | Unchanged; observed `3 13` again                                                                                                              |
| `BASE_E2E`   | **77 (measured by 07-01)** | **Frozen; copied verbatim.** The gate asserted `BASE_E2E + 12` = **89** through `check-counts.mjs --playwright 89` and it matched               |
| `PREV_E2E`   | **89 (measured by 07-13)** | Was 89 (07-12); this plan adds **0** titles and re-measured **89** (78 chromium + 11 webkit-phone); `--list` reads `Total: 89 tests in 12 files` |

`BASE_CHECK` (provenance only): **545 files, 0 errors, 0 warnings** (unchanged from 07-09 onward: no component added or amended since).

### Observed totals: baseline plus the phase's stated delta

07-VALIDATION's phase total is **+4 files / +52 tests** on quick, **unchanged** on sweep, **+12** on e2e. Observed against 07-01's baseline: quick **69 + 4 = 73 / 724 + 52 = 776**, sweep **`3 13`**, e2e **77 + 12 = 89**. Every number agrees; nothing was adjusted and no plan had to be found for a discrepancy. The machine had **1.73 GB free of 15.26 GB** with six node processes resident when the gate began.

```
npm run check 2>&1 | grep -Ei "error|warning"
  1788628808233 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS       (9 s wall)

npm run lint
  All matched files use Prettier code style!   (eslint silent; exit 0; 18 s wall)

npm run build
  postbuild: f20d74fa04a5d7360be2f50ae78697318e2557c3 - source-f20d74fa04a5d7360be2f50ae78697318e2557c3.tar.gz is 1085 KB   (exit 0; 12 s wall)

npm run test:quick 2>&1 | node scripts/check-counts.mjs 73 776
  Test Files  73 passed (73)      Tests  776 passed | 1 todo (777)      Duration 27.77s     (31 s wall)
  check-counts: observed 73 files, 776 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  Test Files  3 passed (3)        Tests  13 passed (13)                 Duration 115.51s    (118 s wall)
  check-counts: matches the expected counts

npm run test:e2e -- --workers 3 --reporter list 2>&1 | node scripts/check-counts.mjs --playwright 89
  89 passed (1.8m)     [chromium] 78   [webkit-phone] 11   install.e2e.ts 12 runs     (112 s wall; first run, no rerun)
  check-counts: observed 89 tests passed
  check-counts: matches the expected counts
  slowest: install.e2e.ts test 6 (unconfirmed / restored-unconfirmed) 23.3 s; test 10 (the live region) 11.1 s; test 4 (partial / nothing-landed) 5.9 s

npx playwright test --list
  Total: 89 tests in 12 files
```

No listener on 4173 or 4174 before or after the run (the shipped webServer is started and stopped by Playwright); `test-results/` removed by hand afterwards; `git status` clean after each commit.

### Per-file counts, each run alone (`npx vitest run --project server <files> --reporter=json`)

| File                                              | Plan said | Observed  |
| ------------------------------------------------- | --------- | --------- |
| `src/lib/protocol/descriptors.spec.ts`            | 12        | **12**    |
| `src/lib/protocol/forbidden-instructions.spec.ts` | 5         | **5**     |
| `src/lib/transport/sequence.spec.ts`              | 11        | **11**    |
| `src/lib/transport/fixtures/synthetic.spec.ts`    | 6         | **6**     |
| `src/lib/device/snapshot.spec.ts`                 | 7         | **7**     |
| `src/lib/device/install-copy.spec.ts`             | 6         | **6**     |
| `src/lib/device/session.spec.ts`                  | 21        | **21**    |
| `src/lib/device/session-copy.spec.ts`             | 6         | **6**     |
| `src/lib/tune/model.spec.ts`                      | 10        | **10**    |
| `src/lib/device/wire-pin.spec.ts`                 | 4         | **4**     |
| `src/lib/device/install.spec.ts`                  | 18        | **18**    |
| `src/lib/config-shape.spec.ts`                    | 14        | **14**    |
| `src/lib/ui/device-ui.spec.ts`                    | 11        | **11**    |
| `e2e/install.e2e.ts`                              | 11 / 12   | **11 titles / 12 runs** (11 chromium + 1 webkit-phone) |
| `src/lib/ui/identity.spec.ts` (standing)          | 6         | **6**     |
| `src/lib/ui/tune-ui.spec.ts` (standing)           | 5         | **5**     |
| `e2e/session.e2e.ts` (standing)                   | 14        | **14 titles** (14 chromium + 2 webkit-phone = 16 runs) |
| `e2e/first-experience.e2e.ts` (standing)          | unchanged | **11 titles** |
| `src/lib/sim/lazy.spec.ts` (standing)             | 3         | **3**     |
| `src/lib/transport/fixtures/fixtures.spec.ts` (standing) | 4  | **4**     |
| `src/lib/catalog/lua-entries.spec.ts` (standing)  | 6         | **6** (test 6 in budget alone and in the full run) |

The webkit-phone project's eleven: `tuning-webkit.e2e.ts` 5, `browse-webkit.e2e.ts` 3, `session.e2e.ts` 2, `install.e2e.ts` 1.

## Task 1 - `docs/INSTALL-RUNBOOK.md` (commit `f20d74f`)

233 lines, Prettier-formatted, `npm run lint` exit 0, in the shape of `docs/SESSION-RUNBOOK.md`: the opening paragraph says in those words that **this runbook writes to your module**, that nothing before row B has ever written to a real ZONA from this site (Phase 2 echoed the module's own strings, Phase 6 wrote nothing, every Phase 7 write landed in a scripted port or a fake module that is a function in Node), and that **the executor and the orchestrator never run any row of this document**. Then **Before you start** (seven items: quit Grid Editor; know what the pad is doing; stay on one page of the module; a second module for row G; Chrome, Edge or desktop Firefox 151 or newer; rows A to F in one tab; do not pull the cable during a store), the **two warnings** (the checklist writes to the module; Grid Editor cannot open a held port, with `DISCONNECT ZONA` one click away and the lock's reason quoted), the **numbers block** (`executeMs` 250, `pagestoreMs` 3000, three attempts at 120 / 240 / 360, the 2000 ms line quoted, three re-fetch rounds after the next heartbeat with 120 and 240 between, 0 ms pacing escalating once to 10, the serial's three attempts of 300 ms), **Getting the page open** (`npm run preview` on `http://127.0.0.1:4173/`; the deployed origin only if the user deploys; the Basic Auth realm; the `file://` trap with its two tells; `/c/aurora/` as the page the suite drove; the `/dev/install/` probe and what it writes), **Where the controls are** (every honesty-slot line, the two device-state blocks, the install row's three controls and their lines, the disclosure's contents and the rule that it does not open while a card is chosen), **the table**, two things to know before rows D and E, **If something goes wrong** (the twelve blocks one line each, plus the header's writing form and the lock), **Recovery** (five steps) and **What to hand back**.

The seven rows, and what each asks for:

| # | Row | The measurement or the pass |
| --- | --- | --- |
| **A** | The module names itself and is remembered (SAFE-04; D-19 timing 1) | **Which snapshot line the disclosure reads**: `A copy of your ZONA’s own Setup and Timer is saved in this browser, so it can be put back even in a new tab.` (the serial arrived) or `…is held until this tab closes, so it can be put back while you are here.` (three `SERIALNUMBER/FETCH` attempts unanswered). Then the reopened tab shows the same line and `PUT BACK` again |
| **B** | The first RAM write (SAFE-02, SAFE-08; D-19 timing 3) | **The wall time from the click to `PLAYING NOW`**, whether the border LEDs flashed white, whether it ever timed out, and **whether pacing escalated** - deducible on the real page (a first click landing `Nothing reached your ZONA` or `Only one of the two scripts landed` with no refusal, then the retry landing; `PLAYING NOW` with no block means it never fired) and exact on the probe's `pacing escalated` line. This is the first real write from this site |
| **C** | `PUT BACK` (SAFE-03) | One click, no confirmation, `RESTORED`, the pad doing what it did before row B |
| **D** | A power cycle brings the original back (SAFE-02) | After a try-on, unplug and replug: the module comes up running its own configuration; one click reconnects |
| **E** | `KEEP ON DEVICE` survives a power cycle (SAFE-05, D-12; D-19 timing 2) | The confirmation's three strings read before anything is sent; `KEEPING…`, the yellow-dim border, `KEPT` only after the read-back with `KEPT_PROOF_LINE`; the replug coming up running Aurora; the reconnect and `PUT BACK` with `RESTORED`'s stored line. **The round count**: the time to `KEPT` and whether the mismatch block appeared on the real page; exact on the probe as the number of `refetch-setup` lines after `store ok`. **The caution**: the firmware writes Setup to flash before Timer, so the cable stays in while the label reads `KEEPING…` or `PUTTING BACK…` |
| **F** | Fresh-tab `PUT BACK` (SAFE-04) | A memory-only try-on, the browser quit completely, a fresh connect, `PUT BACK`: the pad returns to the original, which can only have come from the browser's storage because the module's memory held Aurora at connect. The honest failure on a session-only row A is named: `PUT BACK` restores Aurora, the pad does not change, a power cycle brings the original back |
| **G** *(optional)* | A rig (SAFE-06) | The confirmation's fourth sentence naming the module as the header spells it, its `KEEP ON DEVICE` enabled, `NOT NOW` - **do not confirm unless willing to store that module's page** |

**The scan.** `grep -n -i "chromium\|webkit\|blink\|gecko" docs/INSTALL-RUNBOOK.md` reads **0 lines** (one hit on the substring `blink` inside "blinks out" was reworded to "goes dark for an instant" before the commit; browser names - Chrome, Edge, Firefox 151 - appear where the person needs them, as the runbooks before it do). Attribution scan 0 lines; exclamation marks 0.

## Task 2 - the phase gate, the two documents, and the traceability pass (commit `docs(07-13): the phase gate re-measured…`)

The gate ran in the plan's order - check, lint, build, quick, sweep, e2e - each command alone, every number first time, none re-run; the numbers are above. Then:

**`docs/TESTING.md`.** The How-to-run table re-measured at the Phase 7 gate against `f20d74f` (the `test:unit -- --run` row is marked as not re-run, with Phase 6's figure kept rather than guessed); a paragraph on item 12's load-sensitive test not firing at 1.7 GB free; Phase 7's arithmetic beside Phase 6's with `BASE_E2E` named as 07-01 froze it; a new section, **The install flow's test surface**, with the thirteen per-file counts and the standing gates, the Node responder's role (the node suite's own `zonaResponder` exposed into the page, the request id read off the real wire, five faults on top and none inside) and its limits (it models firmware's acceptance rule, its flash and its power cycle from a source reading, and it answers `SERIALNUMBER/FETCH` because it was told to), `install.e2e.ts`'s three blocks and the D-13 reading, the two numbers recorded and not gated, one paragraph naming `docs/INSTALL-RUNBOOK.md` as the hardware half with the sentence that no agent has written a byte, and two conventions (the one in-page snapshot; the bounded beat loop); the e2e per-file table at 89 with `install.e2e.ts` at 11 / 1 / 12; six probe routes. `grep -c -i install docs/TESTING.md` reads 24.

**`docs/HARDWARE-AUDITION.md`** item 2 in the present tense: HANGAR installs now - a card's `TRY ON DEVICE` writes it into the module's memory with `PUT BACK` beside it, and `KEEP ON DEVICE` stores it behind a confirmation, with the runbook named - but only for a configuration already in the catalog; the audition through BOTOR's shelf is still the way to hear one that is not, and it is the route the document assumes. `grep -i "cannot install"` reads 0 lines; `PUT BACK` is present.

**`deferred-items.md`** items 22 to 29 appended, never overwritten (the file has 30 `##` headings: the inherited block and 29 items) - see § Deferred items.

## The ten requirement qualifiers

Written into `.planning/REQUIREMENTS.md`'s traceability table and repeated here. Each names the plan and the test that earned it; the five *(hardware)* halves are **verified-by-user-pending** and are not claimed.

- **SAFE-01** - closed **as a number**: zero config writes across connect, the snapshot and every knob move, counted **by class** in node (`install.spec.ts` test 4) and in a browser (`install.e2e.ts` test 1; `session.e2e.ts`'s seven cable tests since 07-08); every write attributable to one of three clicks; the session's source scan still clean (`session.spec.ts` test 15). Both never-writes surfaces speak in the present tense: the header note's `SAFE_PROMISE` amended in **07-04** (its *cannot write at all* clause retired, `session-copy.spec.ts` test 5 rewritten) and the panel's two Phase 4 literals retired in **07-10**. No hardware half.
- **SAFE-02** - closed: primary full-width accent, `KEEP ON DEVICE` Quiet tier a hairline and a region away, live only after a settled try-on (Z-05); the affirmative bordered, never filled (07-09, 07-10; 07-12 tests 7 to 9). **RAM-only on real hardware is row D, user-pending.**
- **SAFE-03** - closed against the fake: snapshot before any control enables, in the gated order; `PUT BACK` one click from every state with a session, the snapshot's strings verbatim through the one writer (07-06; `install.spec.ts` 1 to 3 and 5; `install.e2e.ts` 1 and 2; 07-12 test 9). **Row C is user-pending.**
- **SAFE-04** - closed against the fake **with the key wire-unproven**: the record under `hangar.snapshot.v1` keyed by serial then page, never overwritten or deleted, surviving a throwing store and a `FORGET THIS ZONA` (07-03, 07-06, 07-11); `SERIALNUMBER/FETCH` source-verified, never observed - no capture holds the frame and the desktop editor never sends one; the session-only degrade honest and tested. **Rows A and F are user-pending; if row A reads the session-only form, SAFE-04 closes as partially verified rather than as a lie.**
- **SAFE-05** - closed: the confirmation names the touch element and the power cycle before the store is sent, `role="group"` and not a dialog, focus on the container, two exits plus `Escape`, `PAGESTORE/EXECUTE` 0 until the commit (07-09, 07-10; 07-12 test 8). **Row E is user-pending.**
- **SAFE-06** - closed against a synthetic rig: three acknowledgements resolve one store, the sentence names the modules in `sx` order, the action stays allowed; Phase 2's refusal undone by name in 07-02 with `sequence.spec.ts` test 3 rewritten (07-12 test 8's rig page). **Row G is optional and user-pending; every frame Phase 2 ever recorded carried SX 0, SY 0.**
- **SAFE-07** - closed: settled from the acknowledgements only; a dropped second ACK is `partial`, named by half, with retry and `PUT BACK` offered; a NACK on the first leg is `nothing-landed`; the bytes are the meters' (`wire-pin.spec.ts`). Proven against scripted faults in node and in a browser (`install.e2e.ts` test 4), which is what criterion 5 asks for. No hardware half.
- **SAFE-08** - closed: "about a second" once, before the click, and nowhere else on the site (Z-08); no bar, no spinner, no minimum duration; the label swaps with a `0s` transition and `PLAYING NOW` is said from the acknowledgements; the 2000 ms line is the one escape hatch, spoken once (07-10; 07-12 tests 7 and 10). **Wall time on hardware is row B, user-pending.**
- **SAFE-09** - closed: three attempts and no more; a NACK and an abort never retried; a lost link a named state with `PUT BACK` waiting; the pacing escalation fires once and moves no attempt count; no infinite loop possible by construction (`install.spec.ts`; `install.e2e.ts` 4 to 6; 07-12 test 10). No hardware half.
- **DEGR-02** - closed on WebKit at a phone viewport and on the desktop project: `TRY ON DEVICE` and `KEEP ON DEVICE` present, really `disabled`, with the reason adjacent; `PUT BACK` absent by decision (Z-12); the body names Chrome, Edge and desktop Firefox 151 and no engine (07-11's extension of the shipped degrade test with its shipped assertions byte-identical; 07-12 test 11 on both projects).

**Phase 7's success criteria.** Criteria 1 to 4 are *(hardware)* in full and close as **verified-by-user-pending**; criterion 5's happy path is *(hardware)* and closes the same way, while its failure paths - a half-landed write detected and reported with retry and `PUT BACK` offered, bounded retries, a lost link a named state, the degrade path present-but-disabled - close against recorded frames and scripted faults, which is what the criterion asks for.

## The D-13 reading

D-13 says Playwright walks the states "in both projects". What this phase implements: the six probe walks (07-08) and the four real-page titles (07-12 tests 7 to 10) run on **`chromium` alone**, because Web Serial exists in no WebKit and the shim would be proving a browser that cannot exist; the **degrade path** is what runs on **`webkit-phone`** - the one `@webkit` title, 07-12's test 11, on both projects. The e2e delta of **+12** is that arithmetic (6 + 4 + 1 x 2), not two engines walking the install.

## The D-19 inversion, out loud

07-CONTEXT D-19 as first written said the write path uses the desktop's 10 ms pacing and the runbook measures 0 ms. What 07-07 ships is the **reverse**: **0 ms** pre-send (`PRE_SEND_DELAY_MS`, from `docs/SKELETON-RESULTS.md` § (b)) **escalating once to `DESKTOP_PRE_SEND_DELAY_MS` (10 ms)** on a write timeout with zero NACKs anywhere in the action, per 07-RESEARCH Pitfall 3, with the queue rebuilt so the retry already on the screen runs at the new pace - and the runbook's row B records whether the escalation ever fired. The 0 ms-then-escalate design stands; D-19's pacing clause was amended in place after plan check 2 to match, and both readings are on the record here and in STATE.md's decisions so nobody re-inverts it from the older wording.

## Deferred items

Appended to `.planning/phases/07-install-flow/deferred-items.md`, each with its reasoning and an owner:

- **22** - a refusal has no copy of its own: a NACK lands `nothing-landed` or `partial` with `cause` recorded and rendered nowhere; the cable step is wrong for a NACK (firmware's five deterministic reasons, Pitfall 7). Owner: the contract, then a gap plan.
- **23** - the module id shown to the visitor (07-RESEARCH open question 5): the last four hex characters only when a second module has ever been stored. Owner: the user.
- **24** - the third colour: Z-01's ruling is no; the reversal is one line. Owner: the user.
- **25** - no lint rule bans `setInterval`, still (Phase 6 item 3); Phase 7 added four scans by hand, so the convention lives in five places. Owner: unowned tree-wide change.
- **26** - the flash write ordering under an unplug is a runbook caution (row E), not a mitigation; none exists or is planned; stays open until row E's timing is on the record. Owner: the STATE.md blocker.
- **27** - the durable record is consulted only after a non-empty fetch (item 7 carried): a few-line reorder held on the Z-16 versus D-03 ruling. Owner: the user's D-03 ruling.
- **28** - the pacing escalation and the re-fetch rounds are experiments recorded and not gated; `pacingEscalated` is on the probe, `refetchRounds` has no readout and the count is read from the `steps` list; once rows B and E are answered each becomes a deletion, a constant or a measured bound. Owner: the runbook's answers, then a gap plan.
- **29** *(found by this plan)* - `PUT BACK` after a keep in an earlier page load is memory-only: `keptThisSession` is a field of the store instance, the durable record does not remember a keep, and a fresh tab's `PUT BACK` leaves flash holding the kept configuration; the HANGAR-only route back is try on, keep, put back (recovery step 4). A `kept` mark beside the record is a change to the one persistent schema - Rule 4 - and waits on the user's decision.

Items 1 to 21 are unchanged.

## Deviations from plan

### Auto-fixed

**1. [Rule 1 - Plan defect] `refetchRounds` is not on the `/dev/install/` probe**
- **Found during:** Task 1, writing row E against the probe's source (`src/routes/dev/install/+page.svelte` renders `install-pacing` and no rounds readout; `install.svelte.ts` line 95 says the field "holds the number" and nothing renders it).
- **Issue:** the plan's row E and the orchestrator's brief say the round count is the probe's readout; it is not.
- **Fix:** the row reads the count from the probe's `steps` list - each round records `refetch-setup` and `refetch-timer` through the queue's `onStep`, so the count is the number of `refetch-setup` lines after `store ok` - and gives the real page a proxy (the time to `KEPT`; whether the mismatch block appeared). No source file edited by rule; recorded as deferred item 28.
- **Files modified:** `docs/INSTALL-RUNBOOK.md`, `deferred-items.md`. **Commits:** `f20d74f`, task 2's.

**2. [Rule 2 - Missing critical information] Rows A to F must run in one tab, and row E's final `PUT BACK` depends on it**
- **Found during:** Task 1, reading `install.svelte.ts` for what `PUT BACK` does after a power cycle: `keptThisSession` is set on `kept`, cleared by a put-back that stored, and never reset at `closed` or `connected`, so within one page load a keep, a replug and a `PUT BACK` leave the module as found - and across page loads the `PUT BACK` is memory-only.
- **Issue:** the research's row E ("then `PUT BACK` and `KEEP ON DEVICE` again") cannot be run as written (`KEEP ON DEVICE` is disabled after a put-back, `Available after a try-on.`), and a person who closed the tab between the store and the put-back would leave HANGAR's configuration in flash without knowing.
- **Fix:** Before-you-start item 6 and the row's Do-this keep rows A to F in one tab; recovery step 4 gives the HANGAR-only route back when the keeping tab is gone; the product fact is deferred item 29.
- **Files modified:** `docs/INSTALL-RUNBOOK.md`, `deferred-items.md`. **Commits:** `f20d74f`, task 2's.

**3. [Rule 1 - Plan defect] The research's row F could not prove what it claimed**
- **Found during:** Task 1, designing row F. As written (close the browser after row E's final `PUT BACK`, reopen, `PUT BACK`), the module's memory already holds the original at the fresh connect, so a copy taken then equals the record and the row restores an original over an identical original - indistinguishable from a fresh snapshot.
- **Fix:** row F starts with a memory-only `TRY ON DEVICE`, then quits the browser: at the fresh connect a copy taken then would be Aurora and an existing record is what wins, so the pad coming back to the original can only have come from the browser's storage. The honest failure on a session-only row A is named in the row.
- **Files modified:** `docs/INSTALL-RUNBOOK.md`. **Commit:** `f20d74f`.

### Departures recorded, not deviations from the plan

1. **An eighth deferred item** (29) beyond the plan's seven, because a finding is a finding for a gap plan.
2. **Row A's reopen half proves the durable line and the offer, and the row says so**; the record being the thing put back is row F's proof, because at row A's reopen the module's memory still holds the original.
3. **Row B's pacing answer is given a real-page reading** (the escalation fires only on a write timeout with no refusal, so `PLAYING NOW` with no block in between means it never fired) beside the probe's exact line, so the row can be run on the page a visitor sees.
4. **The runbook's counts paragraph carried the expected numbers (776 / 13 / 89) when task 1 was committed** and the gate then measured exactly those, so nothing in the committed runbook had to move.
5. **The plan's duration is measured from 07-12's docs commit (17:09Z) to this plan's**, because no start stamp was recorded; about 35 minutes.
6. **`docs/TESTING.md`'s `test:unit -- --run` row was not re-measured** and says so, keeping Phase 6's figure marked as Phase 6's rather than a guess.
7. **`.planning/REQUIREMENTS.md` was edited by hand** rather than through `requirements mark-complete`, so the ten rows carry their qualifiers in the table the way Phase 6's CONN rows do.

## Known stubs

None. This plan adds no code; the runbook quotes strings the shipped components render, and the two measurements it asks for are fields the store publishes.

## What is not done, and is not claimed

**The hardware checkpoint has been presented to the user and is unanswered.** No row of `docs/INSTALL-RUNBOOK.md` has been run. Nobody has connected a real ZONA through the install flow, seen a real module answer `SERIALNUMBER/FETCH` or fail to, clicked `TRY ON DEVICE` against hardware, watched a `PUT BACK` by eye, pulled a cable after a try-on or after a store, counted a real store's re-fetch rounds, or put an original back from a fresh browser. **No agent has written a byte to a real ZONA in this phase**: every write Phase 7 made landed in a scripted serial port or in a fake module that is a function in Node, and the first real write from this site is the user's click at row B. Phase 7's five *(hardware)* halves are **verified-by-user-pending**. Phase 6's six rows (`docs/SESSION-RUNBOOK.md`) and Phase 8's twelve (`docs/HARDWARE-AUDITION.md`) are unanswered too. The executor did not deploy; the origin the runbook names is the user's to deploy or not.

## Files created and modified

- `docs/INSTALL-RUNBOOK.md` - created (`f20d74f`), 233 lines
- `docs/TESTING.md`, `docs/HARDWARE-AUDITION.md`, `.planning/phases/07-install-flow/deferred-items.md` - modified (task 2's commit)
- `.planning/phases/07-install-flow/07-13-SUMMARY.md` - this file
- `.planning/REQUIREMENTS.md` - SAFE-01..09 and DEGR-02 ticked and qualified; the footer
- `.planning/ROADMAP.md` - Phase 7 ticked in the phase list; the 07-13 line ticked; the progress row at 13/13
- `.planning/STATE.md` - Phase 7 at 13 of 13 by hand: frontmatter, position, progress, metrics, trend, the per-plan row, five decisions, two blockers, the session block; no `previous_stopped_at` key

---
*Phase: 07-install-flow*
*Completed: 2026-09-05*

## Self-Check: PASSED

Checked after writing, at 2026-09-05T17:43Z.

- FOUND: `docs/INSTALL-RUNBOOK.md` (233 lines; seven rows A to G; `Before you start`; engine scan 0 lines; Prettier clean)
- FOUND: `docs/TESTING.md` (contains `install`, 24 mentions; the How-to-run table re-measured; the e2e table at 89), `docs/HARDWARE-AUDITION.md` (`cannot install` 0 lines; `PUT BACK` present)
- FOUND: `.planning/phases/07-install-flow/deferred-items.md` (items 22 to 29 appended; 30 `##` headings), `.planning/phases/07-install-flow/07-13-SUMMARY.md`
- FOUND: commits `f20d74f` (task 1, the runbook) and `468103b` (task 2, the two documents and the deferred items)
- PASS: the gate - check 545 / 0 / 0, lint exit 0, build exit 0 at f20d74f, quick 73 / 776 through check-counts (exit 0, no timeout), sweep `3 13` through check-counts (exit 0), e2e 89 = 78 chromium + 11 webkit-phone at --workers 3 through check-counts --playwright 89 (exit 0), first time, none re-run; `--list` 89
- PASS: every per-file count at its expected value when run alone (thirteen asserted files and seven standing gates)
- PASS: `BASE_E2E` in this SUMMARY is byte-identical to 07-01 (77, measured by 07-01); the arithmetic reconciles at +4 / +52 / unchanged / +12
- PASS: REQUIREMENTS.md - ten boxes ticked, ten traceability rows qualified; ROADMAP.md - the phase list, the 07-13 line and the progress row; STATE.md - `previous_stopped_at` keys 0, completed_plans 83, percent 100, one P13 metric row
- PASS: no source file under `src/` in any diff of this plan; no listener on 4173 or 4174; `test-results/` absent; attribution lines in every file this plan touched: 0
- NOT DONE, NOT CLAIMED: the hardware checkpoint (INSTALL-RUNBOOK rows A to G) is presented to the user and unanswered; no agent has written a byte to a real ZONA in this phase; no deploy
