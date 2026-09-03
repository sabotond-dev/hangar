---
phase: 02-walking-skeleton
plan: 04
subsystem: hardware-validation
tags:
  [web-serial, zona, grid-protocol, hardware, runbook, checkpoint, D-04, D-09, D-10, D-11, D-12]

# Dependency graph
requires:
  - phase: 02-walking-skeleton
    provides: "plan 01's protocol layer, plan 02's transport, queue and CaptureRecorder, plan 03's sequence functions and the /dev/skeleton/ operator page"
  - phase: 01-scaffold-licence-pin
    provides: "the Basic Auth Worker, npm run preview over the real static build, and the deploy the user owns"
provides:
  - "docs/SKELETON-RUNBOOK.md - the hardware checklist in the repository, every control named by its on-screen label, with the mandatory restore row"
  - "Four hardware captures with source: hardware, schema hangar.skeleton.capture/1, protocolPin 1.20260825.1135 - plan 05's only input"
  - "Criteria 1 to 4 of FOUND-01 confirmed against a real ZONA RevH on firmware 1.5.5"
  - "The A/B answer: the host heartbeat is NOT required for CONFIG or PAGESTORE"
  - "The A/B answer: the 10 ms pre-send pacing is NOT load-bearing at 2 Mbaud and costs ~11 ms per request"
  - "The permission-persistence answer: Chrome 152 keeps the grant across a full browser restart (previously granted ports: 1)"
affects: [02-05 results, 06 device session, 07 install flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A hardware checklist lives in the repository, not in the plan, because the user follows it at the desk with the plan closed"
    - "Every measured claim in this phase is traceable to a capture file, an arm id and a step id, never to a recollection of the run"

key-files:
  created:
    - docs/SKELETON-RUNBOOK.md
  modified: []

key-decisions:
  - "The runbook says both routes ask for a password, because the Basic Auth gate fronts the local preview too and an unexplained prompt at 127.0.0.1 reads as a fault"
  - "The captures stay outside the repository until plan 05 normalises their names and commits them with the fixture"
  - "Step 0 (port conflict) is recorded as NOT EXERCISED rather than passed or failed - the user had no Grid Editor running and chose not to start one"

patterns-established:
  - "Checkpoint evidence is read from the exported JSON, not from the run narrative: every number in this summary was recomputed from the capture files"

# FOUND-01 stays Pending. Plan 05 marks it, after the real fixture, its gate and
# docs/SKELETON-RESULTS.md exist.
requirements-completed: []

# Metrics
duration: 36 min
completed: 2026-09-03
---

# Phase 2 Plan 4: The Hardware Run Summary

**A real ZONA RevH on firmware 1.5.5 completed the whole cycle from a bare browser page - identify, fetch, write back, store, re-fetch byte-identical - with zero timeouts, zero negative acknowledgements and zero refused frames across nearly 5,000 recorded events, and both open A/B questions came back answered: the host heartbeat is not required, and the 10 ms pacing is not load-bearing.**

## Performance

- **Duration:** 36 min wall, of which roughly 8 min was the executor's pre-flight and runbook, 11 min
  the checkpoint pause, and 8 min the user at the desk
- **Started:** 2026-09-03T21:56:00Z
- **Completed:** 2026-09-03T22:32:00Z
- **Tasks:** 2 (1 automated, 1 human checkpoint) - 4 commits
- **Files created:** 1, modified: 0

## Task Commits

1. **Task 2-04-01: Pre-flight green, and the runbook** - `365a200` (docs)
2. **Task 2-04-01 follow-up: the local preview is behind the auth gate too** - `166e7cc` (docs)
3. **Checkpoint pause recorded in STATE.md** - `9b25414` (docs)
4. **Task 2-04-02 follow-up: what the frame log looks like** - `a78e742` (docs)

## The run

Performed by the user on 2026-09-03 between roughly 22:15 and 22:23 UTC, over `npm run preview` at
`http://127.0.0.1:4173/dev/skeleton/` - a secure context, so no deploy was needed - in Chrome 152 on
Windows. The module was a ZONA **RevH on firmware 1.5.5**, HWCFG 161, USB VID `0x303a` / PID `0x8123`
(12346 / 33059 as the capture records them), SX 0, SY 0, ROT 0, heartbeat `TYPE 1`, **active page 3**,
`otherModules: []`. All four captures carry `"source": "hardware"`, schema
`hangar.skeleton.capture/1`, origin `http://127.0.0.1:4173` and `protocolPin: "1.20260825.1135"`.

## FOUND-01 criteria 1 to 4

| #         | Criterion                                                                       | Result                                             | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**     | Only ZONA's USB identity offered; the page identifies the module and its firmware | **PASS**                                           | `identify` step `ok` on all three completed arms. Identity block: `moduleType: ZONA`, `revision: RevH`, `firmware 1.5.5`, `usbVendorId 12346` (`0x303a`), `usbProductId 33059` (`0x8123`) - never a bootloader identity. `heartbeatType: 1`.                                                                                                                                                                                                    |
| **2**     | The page displays the module's existing Setup and Timer strings, fetched from it   | **PASS**                                           | Arm B `fetch-setup` 19.0 ms, `fetch-timer` 12.9 ms, both `ok`. Setup 642 characters, Timer 22 (`--[[@cb]]print("tick")`). Arm A the same strings at 29.7 / 11.9 ms.                                                                                                                                                                                                                                                                             |
| **3**     | Each write and the store reported complete only on a matching acknowledgement      | **PASS**                                           | Every `write-timer`, `write-setup` and `store` step carries a `matchedOn` list and a latency, so none settled on a local promise: writes matched on `class, instr, SX, SY, LASTHEADER`, the store on `class, instr, LASTHEADER`. 10 `CONFIG/ACKNOWLEDGE` and 10 `PAGESTORE/ACKNOWLEDGE` frames are in arm B's stream. No negative acknowledgement anywhere; `attempts: 1` on all 175 steps across the four files, so nothing needed a retry. |
| **4**     | Re-fetch proves the module is byte-for-byte unchanged                             | **PASS**                                           | Both completed arms report `results.byteIdentical: true`. Setup 642 to 642, Timer 22 to 22, `setupBefore === setupAfter` and `timerBefore === timerAfter` verbatim. Arm B's re-fetch ran **after ten stores**, so the flash round trip is inside the comparison.                                                                                                                                                                                |
| **R**     | Every arm ends with the restore heartbeat                                         | **PASS**                                           | `restore-page-change` appears with outcome `sent` immediately after every single `write-setup`: five times in arm B, once in arm A. No write anywhere in the run is unpaired.                                                                                                                                                                                                                                                                   |
| **5**     | The run records the measurements the open questions need                          | **PASS (measured here, written up in plan 05)**    | Four captures, listed below.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **0**     | The port-conflict message (D-04, CONN-04)                                         | **NOT EXERCISED**                                  | The user had no Grid Editor running and chose not to start one for the sake of the test. This is not a failure and the row is not marked passed - the message stays unproven against a real port conflict, and Phase 6 should exercise it.                                                                                                                                                                                                      |
| **P**     | Permission persistence (free observation)                                         | **PASS - `previously granted ports: 1`**           | After quitting Chrome completely and reopening it, the page reported one previously granted port for this origin. See finding 5.                                                                                                                                                                                                                                                                                                                |

## The two arms, measured

All latencies are the capture's own `sentAt` to `settledAt` per step, in milliseconds.

| Step                            | Arm A (heartbeat **on**, pace 10 ms)                                    | Arm B (heartbeat **off**, pace 10 ms)                                     |
| ------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `identify`                      | ok                                                                      | ok                                                                        |
| `fetch-setup`                   | 29.7                                                                    | 19.0                                                                      |
| `fetch-timer`                   | 11.9                                                                    | 12.9                                                                      |
| `write-timer`                   | 16.2                                                                    | 14.8 - 17.0 (n=5)                                                         |
| `write-setup`                   | 21.4                                                                    | 20.9 - 21.6 (n=5)                                                         |
| `restore-page-change`           | sent                                                                    | sent (n=5)                                                                |
| `store`                         | 35.4                                                                    | 13.6 - 38.7 (n=10)                                                        |
| `refetch-setup`                 | 13.4                                                                    | 13.6                                                                      |
| `refetch-timer`                 | 11.9                                                                    | 13.2                                                                      |
| `byteIdentical`                 | **true**                                                                | **true**                                                                  |
| burst, as the page reported it  | 20 fetches, 0 timed out, 0 refused, min 13.8 / p50 14.5 / max 16.5      | 20 fetches, 0 timed out, 0 refused, min 14.2 / p50 15.0 / max 17.2        |
| recorded events                 | 911 (460 rx chunks, 249 rx frames, 202 tx frames)                       | 3,746 (2,356 rx chunks, 1,241 rx frames, 149 tx frames)                   |
| wall time on the wire           | ~53 s                                                                   | ~272 s                                                                    |

The pace-0 probe (heartbeat on, pacing off) is identify plus one burst only: **20 fetches, 0 timed
out, 0 refused, min 3.0 / p50 3.3 / max 3.8 ms**, 230 events.

**Write-setup is consistently about 5 ms slower than write-timer** across all six write-back cycles -
642 characters against 22, the payload difference showing up exactly where it should.

## Findings

### 1. The host heartbeat is not required. The prediction is confirmed.

Arm B ran with `hostHeartbeat.enabled: false` for the whole arm and the module kept sending. Its
event stream holds **1,086 inbound `HEARTBEAT` frames over 271.5 seconds - 4.00 per second, dead
steady, with no host beat at any point** - and every `CONFIG/EXECUTE` and every `PAGESTORE/EXECUTE`
in that arm was acknowledged. The module does not stop talking and does not stop accepting writes
when the host is silent. This closes the phase's LOW-confidence open question and the STATE.md
blocker that names it.

The restore rule is untouched by this and is not weakened by it: what a type 255 heartbeat restores
is `page_change_enabled`, which a successful `CONFIG/EXECUTE` clears whether or not the host was
beating. Arm B is precisely the arm where row R is load-bearing, and it fired five times.

### 2. The 10 ms pre-send pacing is not load-bearing at 2 Mbaud.

Same module, same page, same burst of twenty read-only fetches, one arm apart:

| pacing | min  | p50  | max  | timeouts | negative acknowledgements |
| ------ | ---- | ---- | ---- | -------- | ------------------------- |
| 10 ms  | 13.8 | 14.5 | 16.5 | 0        | 0                         |
| 0 ms   | 3.0  | 3.3  | 3.8  | 0        | 0                         |

Removing the delay makes every request roughly **11 ms cheaper and nothing worse**: no timeout, no
negative acknowledgement, no refused frame, and the spread stays as tight (0.8 ms peak to peak at
pace 0 against 2.7 ms at pace 10). The 10 ms sleep inherited from the desktop is pure latency here.
Plan 05 should write the recommendation as "drop it, with the caveat that this is one module, one
cable and one host" - twenty samples on one rig is evidence, not proof, and Phase 7's install writes
far more data per request than a fetch does.

### 3. The active page was 3, not 0. D-10 is vindicated on real hardware.

Every capture reports `activePage: 3`. A skeleton that had assumed page 0 - the obvious constant, and
the one the desktop code makes tempting to hardcode - would have fetched an empty string from the
module and had nothing to write back. The three-condition rule (a `PAGENUMBER` **and** a `HEARTBEAT`
in the same decoded frame **and** no `EVENTTYPE` or `ACTIONLENGTH`) also held under real traffic:
`PAGEACTIVE/REPORT` rode beside all 1,086 heartbeats in arm B and 124 `CONFIG/REPORT` frames carried
page numbers of their own, and the run stayed pinned to page 3 throughout.

### 4. The factory Setup is 642 characters, not the 641 the package predicts.

The pinned package's own default table has the touch Setup at 641; the module returned **642**. One
character. The plan called this out in advance as interesting rather than alarming, and it is: the
page echoes back whatever it fetched, so the run is a no-op either way, and the re-fetch proves it.
The lesson for Phase 7 is that **the module's own string is the truth and the package default is a
hint** - any budget or diff logic that assumes the package default matches the hardware will be off
by a character on a factory module.

### 5. Chrome 152 keeps the Web Serial grant across a full browser restart.

Row P: after quitting Chrome completely, reopening it and loading the page, the line read
`previously granted ports: 1`. So `navigator.serial.getPorts()` returns the ZONA with no user gesture
and no chooser on a later visit, and **CONN-06's silent-reconnect offer in Phase 6 is viable** for
`http://127.0.0.1:4173`, and by the same mechanism for the deployed origin. This answers
02-RESEARCH's MEDIUM-confidence question on grant persistence without an experiment of its own. Two
caveats to carry forward: the grant is per origin, so the local preview's grant says nothing about
the deployed one; and a returned port is permitted, not open - `open()` still has to succeed, and
`SerialPort.forget()` is what revokes it.

### 6. Nothing in 1,550 real frames was refused by the decode guard.

Across the three captures, **0 frames failed to decode** - 1,241 + 249 + 60. The inbound class mix
was wider than the offline suite ever exercised, and all of it passed through cleanly:

| class                   | arm B | what it is                                        |
| ----------------------- | ----- | ------------------------------------------------- |
| `HEARTBEAT/EXECUTE`     | 1,086 | the module's own 4 Hz beat                        |
| `PAGEACTIVE/REPORT`     | 1,086 | riding beside every one of them                   |
| `CONFIG/REPORT`         | 124   | 2 fetches + 2 re-fetches + 120 burst fetches      |
| `CONFIG/ACKNOWLEDGE`    | 10    | the five write-back cycles                        |
| `PAGESTORE/ACKNOWLEDGE` | 10    | the ten stores                                    |
| `LEDPREVIEW/REPORT`     | 5     | unsolicited, mid-run                              |
| `DEBUGTEXT/EXECUTE`     | 16    | see below                                         |

The `LEDPREVIEW/REPORT` frames matter more than their count suggests: they are **unsolicited inbound
reports arriving while requests were outstanding**, and not one of them resolved a waiter. That is
plan 01's matcher rule - a report is never correlated by the echoed request id - holding against
traffic the fake never produced.

The `DEBUGTEXT` lines are the module talking in plain text, and they are free corroboration:

- `CDC TX dropped: 588` (arm B), `: 70` (arm A), `: 89` (pace-0), each the first frame after the port
  opened - the module reporting what it had queued while nothing was listening.
- `tick` x5 in arm B, x1 in arm A: **exactly one per write-back**. The factory Timer's own
  `print("tick")` firing because the `CONFIG/EXECUTE` restarted the module's script - independent
  evidence that the string written is the string running.
- `nvm store success` x10 in arm B, x1 in arm A: **exactly one per store**, a firmware-side
  confirmation sitting beside the `PAGESTORE/ACKNOWLEDGE` the page actually matched on.

### 7. The user clicked more than the checklist asked, and every click was safe.

Arm B contains five write-back cycles, ten stores and six burst probes rather than one of each. That
is worth recording rather than tidying away, because it is the strongest available evidence that the
cycle is genuinely a no-op: **five writes and ten flash stores later, the re-fetch still came back
byte-identical to the very first fetch.** Every one of the five write-backs was followed by its own
`restore-page-change`, from the page's own `finally`, so at no point was the module left unable to
change page. The repetition also widened the store latency sample (13.6 to 38.7 ms), which is more
useful for plan 05's timeout recommendation than a single measurement would have been.

### 8. Two burst clocks, and only the last probe is in the summary block.

Notes for plan 05, both found while recomputing the numbers from the files:

- The `burst` block's percentiles run consistently **0.6 to 0.9 ms above** the same twenty steps'
  `sentAt`-to-`settledAt` figures, in all three captures. Two different windows, both legitimate; the
  results document should name which one it is quoting.
- Arm B holds **120 `burst` steps** (six probes) but the `burst` summary block describes only the
  last twenty. Aggregating all six means reading `steps`, not `burst`.

## The captures

Read-only, outside the repository, not committed by this plan. **Plan 05 normalises the names and
commits them with the fixture and its gate.**

```
C:\Users\sabot\AppData\Local\Temp\claude\C--Users-sabot-Documents-Claude-hangar\
  9e0a83a0-9e73-4b17-922e-5ea9c879910b\scratchpad\captures\
```

| File                                                     | Arm                          | What it holds                                                                                                                                                                                     |
| -------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `zona-hardware-b-hb-off-pace-10.json`                    | B, heartbeat off, pace 10    | **The complete arm.** identify, fetch, 5x write-back, 10x store, re-fetch (byte-identical), 6 burst probes. 3,746 events, 2.0 MB. The richest of the four.                                        |
| `zona-hardware-a-hb-on-pace-10.json`                     | A, heartbeat on, pace 10     | The complete single cycle plus one burst. 911 events, 445 KB.                                                                                                                                     |
| `zona-hardware-a-hb-on-pace-0.json`                      | A, heartbeat on, pace 0      | Identify plus the pace-0 burst probe. 230 events, 155 KB. The other half of finding 2.                                                                                                            |
| `zona-hardware-b-hb-off-pace-10-partial-after-store.json` | B, heartbeat off, pace 10    | An earlier export of the same arm, taken mid-run. **Superseded** by the complete file above - same `capturedAt`, same run id, a strict prefix of its events. Kept only so the pair is not read as two runs. |

## Decisions Made

- **Step 0 is recorded as NOT EXERCISED.** The user had no Grid Editor running and chose not to start
  one. Writing it as a pass would put an untested claim into `docs/SKELETON-RESULTS.md`; writing it
  as a failure would be false. It is neither, and Phase 6 - which owns the failure vocabulary -
  should exercise it against a genuine port conflict.
- **The captures stay in the scratchpad for now.** Plan 05 owns naming, the fixture and the gate; a
  copy committed here under the browser's own filenames would have to be renamed and re-committed
  immediately.
- **The one-character Setup difference is reported, not reconciled.** There is nothing to fix. The
  module's string is the truth and the run echoed it back unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The runbook did not say the local preview is behind the auth gate**

- **Found during:** Task 2 (the checkpoint, before the user started)
- **Issue:** The runbook offered `npm run preview` at `http://127.0.0.1:4173/dev/skeleton/` as the
  no-deploy route without mentioning that Phase 1's Basic Auth Worker fronts every request there too.
  A sign-in prompt at `127.0.0.1` reads as a misconfiguration, and the natural reaction - assume the
  local build is broken and open `index.html` from disk instead - lands on exactly the `file://` trap
  the same page warns about.
- **Fix:** A paragraph naming the realm (`HANGAR preview`), saying the credentials come from the
  gitignored `.dev.vars` locally and from the two Worker secrets on the deployed preview, and stating
  that a prompt is the gate working. Also noted that `npm run preview` rebuilds first, so it always
  serves the current commit.
- **Files modified:** `docs/SKELETON-RUNBOOK.md`
- **Verification:** `npm run lint` exit 0; the user reached the page over the local preview and ran
  the whole session there.
- **Committed in:** `166e7cc`

**2. [Rule 2 - Missing Critical] The runbook did not prepare the operator for the frame log**

- **Found during:** Task 2 (the user's report afterwards)
- **Issue:** The user's one piece of unpredicted feedback: the frame log was startling - four
  heartbeat pairs a second, arriving forever, with no host beat needed to cause them. Nothing in the
  runbook said what normal traffic looks like, so "is it supposed to do that" had no answer in the
  document.
- **Fix:** A `What the frame log looks like` section: four `HEARTBEAT` + `PAGEACTIVE` pairs per second
  independent of the host-heartbeat toggle, plus the three `DEBUGTEXT` lines the run actually produced
  (`CDC TX dropped: <n>` on connect, `tick` after each write-back, `nvm store success` after each
  store), each with what it means.
- **Files modified:** `docs/SKELETON-RUNBOOK.md`
- **Verification:** `npx prettier --write` idempotent, `npm run lint` exit 0.
- **Committed in:** `a78e742`

---

**Total deviations:** 2 auto-fixed (both missing-critical documentation, both found by contact with
the actual run)
**Impact on plan:** No code changed. The runbook is this plan's only artifact and both fixes make it
correct for the next person who follows it - which is Phase 7's hardware checklist, since that one
starts from this document.

## Issues Encountered

- **Nothing went wrong on the hardware.** Zero timeouts, zero negative acknowledgements, zero retries,
  zero refused frames, and `attempts: 1` on all 175 recorded steps. Every status line the page printed
  matched what the runbook predicted, which is the outcome with the least information in it - the
  failure paths remain exercised only against the fake.
- The user's only surprise was the frame log's volume, now written into the runbook.
- `results` is absent from the pace-0 capture, because that arm was a probe and never fetched. Any
  consumer of these files has to treat `results` and `burst` as optional; plan 05's gate should say so
  rather than index into them.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 05 has everything it needs and more than it planned for.** Four hardware captures, both A/B
  answers measured rather than argued, and store latencies with a real spread (13.6 - 38.7 ms) to set
  a timeout against instead of one sample.
- **FOUND-01 stays `Pending`.** Criteria 1 to 4 are confirmed on hardware and criterion 5's
  measurements exist, but criterion 5 asks for _written_ answers. Plan 05 marks the requirement when
  `docs/SKELETON-RESULTS.md` and the committed fixture with its gate exist.
- **For Phase 6:** the silent-reconnect path is viable (finding 5), the module's real active page is
  not 0 (finding 3), and the port-conflict message is still unproven against a real conflict (step 0,
  not exercised) - that is Phase 6's to close.
- **For Phase 7:** the module's own string is the truth, not the package default (finding 4); the
  store is acknowledged twice over, once by `PAGESTORE/ACKNOWLEDGE` and once by a `nvm store success`
  `DEBUGTEXT` (finding 6); and unsolicited `LEDPREVIEW/REPORT` frames do arrive mid-transaction, so
  the matcher rule that refuses to correlate a report by request id is load-bearing on real hardware,
  not only in the fake.
- **Still entirely unexercised by anything:** every failure path. No unplug mid-write, no port
  conflict, no timeout and no negative acknowledgement has ever been seen from a real module.

## Self-Check: PASSED

- `docs/SKELETON-RUNBOOK.md` present on disk.
- `365a200`, `166e7cc`, `9b25414` and `a78e742` all present in `git log`.
- All four capture files present at the recorded scratchpad path, each parsed and re-measured for this
  summary; every number above was recomputed from the JSON rather than transcribed from the run.

---

_Phase: 02-walking-skeleton_
_Completed: 2026-09-03_
