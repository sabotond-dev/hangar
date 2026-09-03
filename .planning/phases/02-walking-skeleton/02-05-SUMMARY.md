---
phase: 02-walking-skeleton
plan: 05
subsystem: testing
tags:
  [
    web-serial,
    zona,
    grid-protocol,
    fixtures,
    hardware-evidence,
    timeouts,
    vitest,
    D-07,
    D-08,
  ]

# Dependency graph
requires:
  - phase: 02-walking-skeleton
    provides:
      "plan 02's CAPTURE_SCHEMA, STEP_IDS, CaptureRecorder and FakeTransport; plan 01's FrameScanner,
      decodeFrame and the starting TIMEOUTS; plan 04's four hardware captures"
  - phase: 03-vendor-the-domain
    provides: "03-06-SUMMARY.md - the production-build WASM proof that answers question (f)"
provides:
  - "src/lib/transport/fixtures/zona-hardware.json - the complete arm B capture, 3,746 events, source: hardware"
  - "Two further committed arms: zona-hardware-a-hb-on-pace-10.json and zona-hardware-a-hb-on-pace-0.json"
  - "src/lib/transport/fixtures/fixtures.spec.ts - the gate: the phase cannot ship on synthetic evidence"
  - "docs/SKELETON-RESULTS.md - D-08's six answers, each citing a fixture and a timestamp"
  - "src/lib/skeleton-results.spec.ts - 7 tests binding the document to the constants it justifies"
  - "The shipped TIMEOUTS (300 / 250 / 3000) and PRE_SEND_DELAY_MS (0), measured rather than guessed"
  - "DESKTOP_PRE_SEND_DELAY_MS - the A/B toggle's 10 ms, kept so the experiment stays repeatable"
  - "FOUND-01 complete: all five criteria, four on hardware and the fifth in writing"
affects: [06 device session, 07 install flow, 04 catalog]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A committed fixture declares its provenance in a top-level `source` field, and a spec fails when the repository holds only synthetic evidence"
    - "A measured constant cites the document that justifies it, and a test parses one machine-readable line out of that document to assert they agree"
    - "A structural spec over a prose document asserts STRUCTURE and CITATION, never wording - a gate that fires on honest edits gets deleted"

key-files:
  created:
    - src/lib/transport/fixtures/zona-hardware.json
    - src/lib/transport/fixtures/zona-hardware-a-hb-on-pace-10.json
    - src/lib/transport/fixtures/zona-hardware-a-hb-on-pace-0.json
    - src/lib/transport/fixtures/fixtures.spec.ts
    - docs/SKELETON-RESULTS.md
    - src/lib/skeleton-results.spec.ts
  modified:
    - src/lib/protocol/constants.ts
    - src/lib/transport/fake.spec.ts
    - src/lib/transport/queue.ts
    - src/routes/dev/skeleton/+page.svelte
    - docs/TESTING.md

key-decisions:
  - "fixtures.spec.ts tests 2 to 4 select the hardware arms by FILENAME, not by `source`, so flipping `source` makes exactly the provenance gate red instead of turning three tests vacuous"
  - "The restore rule is asserted as one restore-page-change per write-setup per arm, not as a closing step - the pace-0 probe never wrote, so it correctly has neither, and the rule stays real rather than excused"
  - "Shipped fetchMs 300 and executeMs 250 are ten times the slowest thing ever observed on each path; pagestoreMs stays 3000 and the comment says MEASURED AND UNCHANGED, because measured-and-kept and never-measured look identical in a source file otherwise"
  - "PRE_SEND_DELAY_MS ships at 0 but the constant stays named, because the burst probe never exercised the mechanism the 10 ms sleep would defend against"
  - "DESKTOP_PRE_SEND_DELAY_MS added so the skeleton page's A/B toggle keeps sending at 10 ms in its paced position - reading the shipped 0 there would have sent at 0 in both positions AND stamped the capture pace-0, mislabelling the arm"
  - "All three complete arms are committed (3.2 MB); the superseded mid-run export is not"

patterns-established:
  - "Every number in a results document is recomputed from the committed JSON, and the document names which of the capture's two clocks it is quoting"

requirements-completed: [FOUND-01]

# Metrics
duration: 30 min
completed: 2026-09-04
---

# Phase 2 Plan 5: The Results Summary

**A real ZONA's capture is committed and a spec now fails if the repository ever holds only synthetic evidence; `docs/SKELETON-RESULTS.md` answers all six of D-08's questions with a fixture and a timestamp behind each one - the host heartbeat is not required, the 10 ms pacing is not load-bearing, and the shipped timeouts dropped from 1000/500 to 300/250 because 160 real requests all settled under 40 ms.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-09-03T22:34:00Z
- **Completed:** 2026-09-03T23:04:00Z
- **Tasks:** 3, each committed atomically
- **Files created:** 6, modified: 5

## Accomplishments

- **The phase can no longer be closed on synthetic data.** `fixtures/fixtures.spec.ts` test 1 reads
  every `*.json` in the fixtures directory and fails unless one declares `"source": "hardware"`, and
  the mutation that makes it fail has been watched failing.
- **The framing path is pinned against real chunk boundaries.** `fake.spec.ts` test 1 now replays
  `zona-hardware.json`: 2,356 recorded chunks emitted in order, 1,241 frames reproduced, zero refused,
  and the 149 interleaved `tx` events correctly skipped. The synthetic fixture and its spec are
  untouched, so the suite still runs with nothing plugged in.
- **All six questions are answered in writing with citations.** Predictions (a) and (b) are marked
  **confirmed**, not quietly restated; (c) carries a latency table and the reasoning behind each
  shipped number; (d) and (e) report what 1,550 real frames actually contained; (f) is answered by
  reference to Phase 3, and the spec grants it that exemption explicitly rather than accepting a
  decorative fixture citation.
- **The shipped timeouts are the measured ones and cannot drift from the document.**
  `skeleton-results.spec.ts` test 7 parses one machine-readable line out of the document and asserts it
  equals `TIMEOUTS` and `PRE_SEND_DELAY_MS`.
- **FOUND-01 is complete.** Criteria 1 to 4 were confirmed on hardware in plan 04; criterion 5 asked for
  written answers, and they now exist with a spec holding them in place.

## Task Commits

1. **Task 2-05-01: Commit the real capture and gate the phase on it** - `f22fe4e` (test)
2. **Task 2-05-02: `docs/SKELETON-RESULTS.md` - the six answers, each with a citation** - `5763e10` (docs)
3. **Task 2-05-03: Ship the measured timeouts, and tie them to the document** - `72086c1` (feat)

## The answers, in one table

| #   | Question                          | Answer                                                                                         |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| (a) | Host heartbeat required?          | **No**, for `CONFIG` or `PAGESTORE`. Prediction **confirmed**. The `TYPE 255` restore after a write is a separate, still-mandatory mechanism. |
| (b) | Is the 10 ms pre-send gap load-bearing? | **No**, on this evidence. Ship 0, with a named caveat.                                     |
| (c) | Real latencies / honest timeouts  | FETCH 11.9-29.7 ms, EXECUTE 14.8-21.6, PAGESTORE 13.6-38.7. Ship 300 / 250 / 3000.              |
| (d) | Active page reported unprompted?  | **Yes**, on every heartbeat, 4/s, carrying page **3** - not 0.                                   |
| (e) | Other modules' heartbeats?        | **None.** `otherModules: []`, and `SX 0, SY 0` on all 1,550 decoded frames.                     |
| (f) | WASM from a static build?         | **Yes** - answered by Phase 3, `03-06-SUMMARY.md`, no fixture.                                   |

**Prediction (a) was confirmed, not falsified.** Arm B ran 271.5 seconds with no periodic host
heartbeat and the module sent 1,086 inbound heartbeats at 4.00 per second throughout, with both
fetches answered before the host had transmitted anything at all. The capture holds exactly 149 `tx`
events against 149 request steps, so every outbound byte in the arm is accounted for by a request and
five of those are the mandatory restores.

**Which clock, stated once.** The document quotes the per-step `sentAt` to `settledAt` figures from
`steps` throughout, never the page's `burst` summary block, which reads 0.2 to 1.1 ms higher over the
very same twenty requests. Section (b) prints both, once, for the same steps. Arm B holds 120 burst
steps across six probes while its `burst` block describes only the last twenty, so the aggregate came
from `steps`.

## The shipped values

`Shipped: fetchMs=300, executeMs=250, pagestoreMs=3000, preSendDelayMs=0`

**Final grep pattern for that line, as the acceptance criterion asked:** the line is committed
**unwrapped** (no backticks), so the criterion's own pattern matches verbatim and prints `1`:

```
grep -cE "^Shipped: fetchMs=[0-9]+, executeMs=[0-9]+, pagestoreMs=[0-9]+, preSendDelayMs=[0-9]+$" docs/SKELETON-RESULTS.md
```

The spec's regex is deliberately more tolerant (`^\s*` + optional backticks + `\s*$`) so that wrapping
it in code formatting later does not break the gate.

| Constant                    | Was  | Now  | Why                                                                                                  |
| --------------------------- | ---- | ---- | ---------------------------------------------------------------------------------------------------- |
| `TIMEOUTS.fetchMs`          | 1000 | 300  | 10x the slowest fetch ever observed (29.7 ms), 18x the p99 of the 124-sample arm                     |
| `TIMEOUTS.executeMs`        | 500  | 250  | 10x the slowest write observed (21.6 ms), rounded up                                                 |
| `TIMEOUTS.pagestoreMs`      | 3000 | 3000 | **Measured and unchanged.** ~78x the worst store, kept because a busy store is dropped silently      |
| `PRE_SEND_DELAY_MS`         | 10   | 0    | 20/20 at pace 0 with no timeout and no NACK, p50 3.1 ms against 14.0                                 |
| `DESKTOP_PRE_SEND_DELAY_MS` | -    | 10   | New. Only the `/dev/skeleton/` A/B toggle reads it (see deviation 1)                                 |

## Files Created/Modified

| File                                                        | What                                                                             |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/lib/transport/fixtures/zona-hardware.json`             | Arm B, 3,746 events, 150 steps, 2.4 MB. The primary evidence                     |
| `src/lib/transport/fixtures/zona-hardware-a-hb-on-pace-10.json` | Arm A, 911 events, 512 KB                                                    |
| `src/lib/transport/fixtures/zona-hardware-a-hb-on-pace-0.json`  | The pace-0 probe, 230 events, 170 KB                                         |
| `src/lib/transport/fixtures/fixtures.spec.ts`               | 4 tests - the provenance gate, identity, chunk replay, the restore rule          |
| `docs/SKELETON-RESULTS.md`                                  | The six answers, two Phase 7 caveats, what the module carries now, what is open  |
| `src/lib/skeleton-results.spec.ts`                          | 7 tests over the document's structure, citations and the constants it binds      |
| `src/lib/protocol/constants.ts`                             | The measured `TIMEOUTS`, `PRE_SEND_DELAY_MS`, `DESKTOP_PRE_SEND_DELAY_MS`        |
| `src/lib/transport/fake.spec.ts`                            | Test 1 re-pointed at the hardware capture; count unchanged at 8                  |
| `src/lib/transport/queue.ts`                                | One stale doc comment ("Default PRE_SEND_DELAY_MS (10)")                         |
| `src/routes/dev/skeleton/+page.svelte`                      | Two sites now read `DESKTOP_PRE_SEND_DELAY_MS` for the paced arm                 |
| `docs/TESTING.md`                                           | The walking skeleton's 15 spec files with counts, the gate, refreshed timings    |

**The fixtures cost 3.2 MB.** The plan set no size cap and the JSON is evidence, so it was committed at
full length rather than truncated. Prettier reformatted all three (1-space export indent to 2-space),
and `JSON.stringify(JSON.parse(before))` was compared against the same of the after for each file:
**identical**. No recorded value moved.

**The superseded export is not committed.** `zona-hardware-b-hb-off-pace-10-partial-after-store.json`
is an earlier, mid-run copy of arm B and a strict prefix of its events. Committing it beside the
complete arm would read as two runs. It is named in the document's "What was run" section - deliberately
outside the six answer sections, so `skeleton-results.spec.ts` test 4 does not require it to exist on
disk.

## Negative Checks (observed red, then restored)

Each mutation was applied to a file already `git add`ed and restored with `git checkout --`;
`git diff --quiet` confirmed a byte-exact tree after each one.

1. **Task 1 - the hardware-fixture gate.** `"source": "hardware"` changed to `"synthetic"` in **all
   three** committed hardware fixtures (flipping only one leaves "at least one" green).
   Red: `src/lib/transport/fixtures/fixtures.spec.ts > the committed captures (FOUND-01 criterion 5) > at least one committed capture came from real hardware`
   - `AssertionError: no committed capture declares source: hardware - the phase cannot be closed on synthetic evidence. Run docs/SKELETON-RUNBOOK.md.: expected [] to not have a length of +0`
   at `fixtures.spec.ts:59:11`. Run: `Tests 1 failed | 3 passed (4)` — **exactly test 1**, which is the
   point of selecting the arms by filename in tests 2 to 4.

2. **Task 2 - the citation gate.** `zona-hardware.json` replaced with `zona-hardware-b-arm.json` in
   section (a).
   Red: `src/lib/skeleton-results.spec.ts > docs/SKELETON-RESULTS.md (FOUND-01 criterion 5) > every cited fixture exists on disk`
   - `AssertionError: docs/SKELETON-RESULTS.md cites src/lib/transport/fixtures/zona-hardware-b-arm.json, which does not exist: expected false to be true`
   at `skeleton-results.spec.ts:118:9`. Run: `Tests 1 failed | 5 passed (6)`. The failure names the
   missing file, as the validation table required.

3. **Task 3 - timeout drift.** `TIMEOUTS.executeMs` changed from 250 to 251.
   Red: `src/lib/skeleton-results.spec.ts > docs/SKELETON-RESULTS.md (FOUND-01 criterion 5) > the shipped timeouts are the ones the results document recorded`
   - `AssertionError: executeMs: expected 251 to be 250` at `skeleton-results.spec.ts:182:45`, **naming
   both numbers**. Run: `Tests 1 failed | 6 passed (7)`.

## Verification

| Check                                              | Result                                        |
| -------------------------------------------------- | --------------------------------------------- |
| `fixtures/fixtures.spec.ts`                        | `Tests 4 passed (4)`                          |
| `fake.spec.ts`                                     | `Tests 8 passed (8)` — count unchanged        |
| `skeleton-results.spec.ts`                         | `Tests 7 passed (7)`                          |
| `forbidden-instructions.spec.ts` (after each task) | `Tests 5 passed (5)` — D-06 intact, 5 plans on |
| `npm run test:quick`                               | `Test Files 26 passed (26)`, `Tests 453 passed \| 1 todo (454)` |
| `npm run test:sweep`                               | `Tests 9 passed (9)`                          |
| `npm run test:unit -- --run`                       | `27 files, 462 passed \| 1 todo (463)`        |
| `npm run check`                                    | `385 FILES 0 ERRORS 0 WARNINGS`               |
| `npm run lint`                                     | exit 0                                        |
| `npm run build` + `build/dev/skeleton/index.html`  | exit 0, present                               |
| `npx playwright test`                              | `10 passed`, `grep -c failed` = 0             |
| `npx prettier --check src/lib/transport/fixtures/` | clean                                         |
| `grep -ci "tbd" docs/SKELETON-RESULTS.md`          | `0`                                           |
| `(a)`..`(f)` in the document                       | 1, 3, 1, 1, 2, 1 — each at least 1            |
| `grep -c "zona-hardware"` / `"03-06-SUMMARY"` / `"255"` / `"1.20260825.1135"` | 21 / 1 / 1 / 2 |
| `grep -ci "restart"`                               | 5                                             |
| the `^Shipped: ...$` pattern                       | `1`                                           |
| `grep -c "skeleton"` / `"fixtures.spec"` in `docs/TESTING.md` | 11 / 4                              |
| `grep -c "SKELETON-RESULTS" src/lib/protocol/constants.ts` | 2                                     |
| hardware capture events / frames                   | 3,746 events; **1,241 frames**, all `ok: true` |

The plan's own two gates:

```
node -e "const c=require('./src/lib/transport/fixtures/zona-hardware.json');process.exit(c.source==='hardware'?0:1)"   # 0
grep -ci "tbd" docs/SKELETON-RESULTS.md                                                                                 # 0
```

## Decisions Made

- **Tests 2 to 4 of `fixtures.spec.ts` select the hardware arms by filename.** Selecting by `source`
  would have made the prescribed mutation turn three tests vacuous — and with `requireAssertions: true`
  a vacuous test fails, so the negative check would have produced four reds and proved less about which
  one was the gate. Test 1 asserts the field; the others assert the data. The reasoning is in the file.
- **The restore rule is asserted per write, not per capture.** The pace-0 probe is `identify` plus one
  burst and never wrote a config, so it has no `restore-page-change` and correctly needs none. Rather
  than exempting that arm, test 4 asserts `restores.length === writes.length` for every arm plus "at
  least one arm actually exercised it" — which is a stronger claim than the closing-step version and
  passes honestly on all three. The exception is stated in the results document too, as the plan's
  standing rule required.
- **`pagestoreMs` is documented as MEASURED AND UNCHANGED.** Eleven stores ran 13.6 to 38.7 ms, so
  3000 ms is ~78x the worst. It stays anyway: a `PAGESTORE` arriving during a bulk NVM operation is
  dropped with no ACK and no NACK (`grid_decode.c:979-981`), so a timeout is the only signal that case
  produces and it must mean "genuinely busy". Without the comment, "measured and kept" and "never
  measured" are indistinguishable in the source.
- **All three arms committed, the superseded one not.** Sections (b), (d) and (e) genuinely need the
  A-arm and the pace-0 probe as evidence, and `fixtures.spec.ts` gains from replaying three
  independently-recorded chunk streams rather than one.
- **Answer (f) cites no fixture, by design.** The skeleton never loads the formatter, so no capture from
  this run could evidence it either way. Test 3 asserts (f) cites `03-06-SUMMARY.md` **and** that it
  cites no fixture at all — a decorative citation there would be worse than none.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dropping `PRE_SEND_DELAY_MS` to 0 silently broke the skeleton page's A/B toggle**

- **Found during:** Task 3
- **Issue:** `src/routes/dev/skeleton/+page.svelte` reads
  `pacedTenMs ? protocol.PRE_SEND_DELAY_MS : 0` in two places, and it stamps the capture's `run.id`
  from the resulting number (`${arm}-pace-${preSendDelayMs}`). With the shipped constant at 0 the
  "pace sends 10 ms apart" toggle would have sent at 0 ms in **both** positions — and worse, would have
  labelled every future export `pace-0` regardless of the checkbox. That is not a dead control; it is a
  capture that lies about which arm produced it, which would have quietly invalidated any repeat of the
  runbook.
- **Fix:** Added `DESKTOP_PRE_SEND_DELAY_MS = 10` to `src/lib/protocol/constants.ts`, with a comment
  saying plainly that nothing in the shipped request path reads it and that it exists only so the A/B
  toggle keeps measuring what its label says. Both page sites now read it. `PRE_SEND_DELAY_MS` remains
  the shipped default that `RequestQueue` picks up.
- **Files modified:** `src/lib/protocol/constants.ts`, `src/routes/dev/skeleton/+page.svelte`
- **Verification:** `npm run check` `385 FILES 0 ERRORS`; `npm run test:quick` 453 passed; e2e 10
  passed; the page still prerenders (`build/dev/skeleton/index.html` present).
- **Committed in:** `72086c1`

**2. [Rule 1 - Bug] A stale doc comment in `queue.ts` asserted the old default**

- **Found during:** Task 3
- **Issue:** `QueueOptions.preSendDelayMs` was documented as "Default PRE_SEND_DELAY_MS (10). The A/B
  arm sets it to 0." Both halves became false in the same commit.
- **Fix:** Rewritten to "Default PRE_SEND_DELAY_MS, which the hardware run set to 0 (results (b))."
- **Files modified:** `src/lib/transport/queue.ts`
- **Verification:** `npm run lint` exit 0; queue.spec unchanged at 8 passed.
- **Committed in:** `72086c1`

### Deliberate deviations

**3. [Deliberate] `fake.spec.ts` test 1 asserts more than "the chunks come back in order"**

The plan said only the fixture it reads should move. It does — but a hardware capture makes three
further assertions free and worth having, so the test now also asserts that nothing was left in the
scanner, that no frame in the arm was refused by the decode guard, that the decoded heartbeat count
equals the recorded heartbeat-frame count, and that the only `PAGENUMBER` seen across 1,086
`PAGEACTIVE` classes is the identity block's `activePage`. The test count is unchanged at 8 and the
file's other seven tests are untouched.

**4. [Deliberate] `fixtures.spec.ts` test 1 also checks the synthetic fixture still says `synthetic`**

Cheap, and it is the other half of the same invariant: the gate is meaningless if the fallback fixture
could quietly relabel itself as evidence.

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs, both created by this plan's own constant change)
+ 2 recorded-deliberate
**Impact on plan:** No file, test count or acceptance criterion changed. Every predicted count landed
exactly: `fixtures.spec` 4, `fake.spec` 8 (unchanged), `skeleton-results.spec` 6 then 7, quick 25/446
then 26/452 then 26/453, sweep 9, e2e 10. The one added export
(`DESKTOP_PRE_SEND_DELAY_MS`) exists because shipping the measured 0 without it would have broken the
instrument that produced the measurement.

## Issues Encountered

- **The definition of "required" was not met literally, and the document says so.** The page's
  pre-registered definition asked for all four conditions "within a 10 s window from connect". Only
  condition (i) — the inbound heartbeat rate — was observable in that window; the operator's first
  fetch landed 60.6 s after connect, the first write at 108.6 s and the first store at 143.1 s. The
  answer is written as met-on-the-substance with the window discrepancy stated, because the module was
  still acknowledging four and a half minutes in with the host silent, which is a stronger result than
  the definition asked for. Reporting it as a clean pass would have hidden a real detail about how the
  run was performed.
- **`results` is absent from the pace-0 capture**, as plan 04 flagged. Nothing in `fixtures.spec.ts` or
  `skeleton-results.spec.ts` indexes into `results` or `burst`; both are optional in the `Capture` type
  and are treated as such.
- **Two untracked planning files remain in the tree** — `.planning/design/FIRST-EXPERIENCE.md` and
  `.planning/phases/04-first-experience/04-CONTEXT.md`. They belong to Phase 4 discussion work, predate
  this plan and were deliberately left alone. Nothing this plan touched is uncommitted.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **FOUND-01 is complete.** Criteria 1 to 4 were confirmed against a ZONA RevH on firmware 1.5.5 in
  plan 04; criterion 5's written answers now exist with a spec holding each one to its citation. The
  requirement is marked done in `REQUIREMENTS.md`.
- **Phase 6 has its inputs.** No heartbeat loop is needed for `CONFIG` or `PAGESTORE`; the `TYPE 255`
  restore after a write is mandatory regardless; the port grant survives a browser restart, so CONN-06's
  silent reconnect is viable; the module's real active page is not 0; and `SerialPort.forget()` is
  Phase 6's to ship. All of it is in `docs/SKELETON-RESULTS.md` rather than in a summary.
- **Phase 7 has its two caveats in writing**: the store restarts the module's Lua VM, so "provable
  no-op" is a claim about stored bytes and not about the running script; and the module's own config
  string is the truth, not the package default (642 characters against 641).
- **Still entirely unexercised:** every failure path. No unplug mid-write, no port conflict, no timeout
  and no negative acknowledgement has been seen from real hardware — `attempts: 1` on all 200 recorded
  steps and 1,550 of 1,550 frames decoded. `FakeTransport`'s five injected faults remain the only
  evidence any of it works. The port-conflict message (D-04, CONN-04) in particular is recorded as NOT
  EXERCISED and is Phase 6's to close.
- **Phase 2 is complete** — 5 plans, 5 summaries. Ready for `/gsd:verify-work 02`.

## Self-Check: PASSED

- All six created files verified present on disk: the three fixtures, `fixtures.spec.ts`,
  `docs/SKELETON-RESULTS.md`, `src/lib/skeleton-results.spec.ts`.
- `f22fe4e`, `5763e10` and `72086c1` all present in `git log`.
- Every number in this summary and in `docs/SKELETON-RESULTS.md` was recomputed from the committed
  JSON, not transcribed from plan 04's summary.

---

_Phase: 02-walking-skeleton_
_Completed: 2026-09-04_
