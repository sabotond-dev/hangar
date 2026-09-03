---
phase: 02-walking-skeleton
plan: 01
subsystem: protocol
tags:
  [grid-protocol, web-serial, framing, vitest, encode_packet, decode_packet_frame]

# Dependency graph
requires:
  - phase: 01-scaffold-licence-and-pin
    provides: "The exact @intechstudio/grid-protocol pin (1.20260825.1135), the Vitest server/sweep projects, and the prettier/eslint/svelte-check gates"
provides:
  - "src/lib/protocol/ - 7 pure modules and 7 specs, 47 tests, no browser and no hardware"
  - "The four outbound descriptors (heartbeat, fetch, write, store) with the desktop's verbatim parameter names"
  - "encodeRequest, which appends the terminator and returns the BRC id the acknowledgement echoes"
  - "FrameScanner - EOT + LF with a cursor and an 8 KB ceiling"
  - "decodeFrame - the truthiness guard, provably before decode_packet_classes"
  - "matchResponse - ok | nack | no, with the id correlator on ACK and NACK only"
  - "canWriteBack - D-09's refusal as a pure function with a named reason per shape"
  - "A structural spec proving no page-change, erase or clear instruction exists in shipped source (D-06)"
affects:
  [
    02-02 transport,
    02-03 skeleton page,
    06 device session,
    07 install flow,
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Package-owned numbers are READ from grid.getProperty, never restated; a source grep enforces it"
    - "Every protocol test input is real encoder output, so no test invents wire bytes"
    - "Structural specs assemble forbidden tokens from fragments so the spec's own source stays clean"

key-files:
  created:
    - src/lib/protocol/constants.ts
    - src/lib/protocol/descriptors.ts
    - src/lib/protocol/framing.ts
    - src/lib/protocol/decode.ts
    - src/lib/protocol/match.ts
    - src/lib/protocol/write-guard.ts
    - src/lib/protocol/index.ts
    - src/lib/protocol/constants.spec.ts
    - src/lib/protocol/descriptors.spec.ts
    - src/lib/protocol/forbidden-instructions.spec.ts
    - src/lib/protocol/framing.spec.ts
    - src/lib/protocol/decode.spec.ts
    - src/lib/protocol/match.spec.ts
    - src/lib/protocol/write-guard.spec.ts
  modified: []

key-decisions:
  - "descriptors.ts is the only shipped module that calls encode_packet, and forbidden-instructions.spec.ts asserts that by scanning src/lib/protocol and src/lib/transport rather than by convention"
  - "The framing spec's EOT-boundary test splits at len-4, not the plan's len-3: EOT sits at len-4, so only len-4 makes the test's own name ('EOT alone in the second chunk') true"
  - "match.spec builds every incoming class from real encoder output and then rewrites only SX/SY to 0, because encode_packet forces the source address to zero on the wire and the decoder subtracts 127 - an outbound frame decodes SX -127, an attached module reports 0"
  - "matchResponse compares with === after coercing both sides through Number, so a filter key the incoming class does not carry coerces to NaN and fails - which is why an ACK filter names no class parameters at all"

patterns-established:
  - "TDD per task: specs committed red, implementation committed green, then a prescribed mutation observed red and restored with git checkout"
  - "Files created in a task are git added before any negative-check mutation, so restoration is byte-exact"

requirements-completed: [FOUND-01]

# Metrics
duration: 16 min
completed: 2026-09-03
---

# Phase 2 Plan 1: The Pure Protocol Layer Summary

**Seven pure modules that build every byte HANGAR will put on the wire and refuse every byte it must not: four outbound descriptors with the desktop's verbatim parameter names, an EOT+LF frame scanner with a cursor and an 8 KB ceiling, a truthiness decode guard, an ACK-only id correlator and D-09's write refusal - 47 node tests, no browser, no port.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-09-03T20:41:00Z
- **Completed:** 2026-09-03T20:57:05Z
- **Tasks:** 3 (6 commits: test → feat per task)
- **Files created:** 14

## Accomplishments

- `constants.ts` reads `CONFIG_LENGTH` (909), `HEARTBEAT_INTERVAL` (250), `VERSION` (1.5.5) and the touch event table from the pinned package. A spec asserts the literal `909` appears nowhere in the module, so a pin bump moves the limit in one place.
- The four builders round-trip through the pinned encoder and decoder, and the frames measure exactly the researched lengths on the wire: heartbeat 43, fetch 49, store 33, and a write with a 17-character string 66 = 49 + 17.
- `sendConfig` throws a `RangeError` before a frame can exist for a config at or above the limit, or one carrying a non-printable character (whose index it names) - the last pure point before the wire.
- `FrameScanner` reassembles a real frame from **every one of its 48 split points**, from coalesced runs, from a torn frame, from leading garbage (where the next frame resyncs), and drops an 8 KB buffer with a single overflow callback.
- `decodeFrame` checks `decode_packet_frame` for truthiness **first**; a spy proves `decode_packet_classes` is called zero times for a checksum-corrupted frame. The desktop's `!== false` guard and its decode-before-check ordering are both provably absent (source greps in the spec, not just in review).
- `matchResponse` returns the heartbeat rejection before anything else, treats a NACK as a distinct rejection rather than a timeout, and applies the id correlator only where firmware echoes it - a REPORT decodes `LASTHEADER` as the firmware's protocol major (1) and is matched without it.
- `forbidden-instructions.spec.ts` proves structurally that no shipped module can name a page change, erase or clear instruction, that `TYPE: 254` appears nowhere, and that exactly one file encodes a packet.

## Task Commits

1. **Task 2-01-01: Constants and the four outbound descriptors** — `0fd1245` (test), `a65e780` (feat)
2. **Task 2-01-02: The frame scanner and the decode guard** — `4728ea4` (test), `b200d6c` (feat)
3. **Task 2-01-03: The response matcher, the write refusal and the barrel** — `68aa1b4` (test), `0bde090` (feat)

## Files Created/Modified

- `src/lib/protocol/constants.ts` - Package-read limits, the ZONA USB filter and hwcfg, and HANGAR's own policy numbers (timeouts, retry bound, identify window)
- `src/lib/protocol/descriptors.ts` - `hostHeartbeat`, `fetchConfig`, `sendConfig`, `storePage`, `encodeRequest`; the only module that encodes a packet
- `src/lib/protocol/framing.ts` - `FrameScanner`, `EOT`, `TERMINATOR`, `MAX_BUFFER`
- `src/lib/protocol/decode.ts` - `decodeFrame`, `DecodedClass`, `DecodedFrame`
- `src/lib/protocol/match.ts` - `matchResponse`, `MatchResult`
- `src/lib/protocol/write-guard.ts` - `canWriteBack`, `FetchedEvent`, `WriteGuard`
- `src/lib/protocol/index.ts` - The barrel (6 re-exports)
- Seven matching `*.spec.ts` files - 5 / 10 / 5 / 9 / 5 / 7 / 6 = 47 tests

## Negative Checks (observed red, then restored)

Every mutation below was applied to a committed, `git add`ed file and restored with `git checkout --`; the tree was verified clean afterwards.

1. **Task 1 - the config-length guard.** Changed `config.length >= CONFIG_MAX` to `> CONFIG_MAX`.
   Red: `src/lib/protocol/descriptors.spec.ts > outbound descriptors > a config at the limit is refused before it can be built` — `AssertionError: expected function to throw an error, but it didn't` at `descriptors.spec.ts:138:61`. Run: `Tests 1 failed | 9 passed (10)`.

2. **Task 2 check A - a torn frame emits nothing.** Fed a frame with its terminator removed to a fresh scanner: `push()` returned 0 frames and `buffered` equalled the 48-byte input length. Run as a throwaway spec inside `src/` (the server project's include glob is `src/**` only), deleted immediately; never committed.

3. **Task 2 check B - dropped retention.** Replaced `this.buf = this.buf.slice(start)` with `this.buf = []`.
   Red, exactly as the plan predicted for tests 2-4: `every split point emits one byte-identical frame`, `the terminator alone in the second chunk still emits the frame`, `the EOT alone in the second chunk still emits the frame`. Two further tests that pin the same retention property also went red: `two frames plus a trailing partial retain the partial` and `eight kilobytes with no delimiter resets the buffer and reports the overflow once` (with the buffer cleared every push, the ceiling can never be reached). Tests 1, 5, 7 and 9 stayed green. Run: `Tests 5 failed | 4 passed (9)`.

4. **Task 3 - the heartbeat early return.** Deleted `if (cls.class_name === "HEARTBEAT") return "no";` entirely (not relocated - the plan records why a relocation is inert).
   Red: `src/lib/protocol/match.spec.ts > response matcher > a heartbeat never resolves a waiter, even against a loose filter` — `AssertionError: expected 'ok' to be 'no'`. Run: `Tests 1 failed | 6 passed (7)`.

## Verification

| Check | Result |
|---|---|
| `constants.spec.ts` | `Test Files 1 passed (1)`, `Tests 5 passed (5)` |
| `descriptors.spec.ts` | `Tests 10 passed (10)` |
| `forbidden-instructions.spec.ts` | `Tests 5 passed (5)` (re-run after task 3: still 5) |
| `framing.spec.ts` | `Tests 9 passed (9)` |
| `decode.spec.ts` | `Tests 5 passed (5)` |
| `match.spec.ts` | `Tests 7 passed (7)` |
| `write-guard.spec.ts` | `Tests 6 passed (6)` |
| `npm run test:quick` | `Test Files 18 passed (18)`, `Tests 399 passed \| 1 todo (400)` — 352 + 1 baseline plus 47 |
| `npm run test:sweep` | `Tests 9 passed (9)` — unchanged |
| `npm run check` | `367 FILES 0 ERRORS 0 WARNINGS` |
| `npm run lint` | exit 0 |
| `grep -c "!== false" descriptors.ts / decode.ts` | 0 / 0 |
| `grep -c "909" constants.ts` | 0 |
| `grep -lr "encode_packet" src/lib/protocol --include=*.ts \| grep -v spec` | `src/lib/protocol/descriptors.ts` (1 file) |
| `grep -c "PAGEACTIVE" descriptors.ts` | 0 |
| `grep -cE "TYPE:\s*254" descriptors.ts` | 0 (`TYPE: 255` present) |
| `grep -cE "frame\[0\]" decode.ts` | 0 |
| `grep -c "MAX_BUFFER = 8192" framing.ts` | 1 |
| decode.ts guard ordering | first `decode_packet_frame` at line 29, first `decode_packet_classes` at line 33 (call sites 29 and 38) |
| match.ts heartbeat ordering | first `HEARTBEAT` at line 29, first `filter.class_parameters` at line 60 |
| `grep -c "export \*" index.ts` | 6 |

## Decisions Made

- **`descriptors.ts` is the single encoder.** The structural spec scans `src/lib/protocol/` and `src/lib/transport/` (tolerating the latter's absence until plan 02) and asserts exactly one non-spec file contains `encode_packet`, naming it. Convention would not survive plan 03's page.
- **The forbidden needles are assembled from fragments** (`["NVM", "ERASE"].join("")`), so `forbidden-instructions.spec.ts` does not itself contain the literals it forbids and a future rule could scan it without an exclusion.
- **`matchResponse` coerces both sides through `Number` and compares with `===`.** The desktop's loose `!=` existed because its decoder produced strings. A consequence worth keeping: a filter key that the incoming class does not carry coerces to `NaN` and fails the comparison, which is precisely why the write filter names no class parameters (a `CONFIG/ACKNOWLEDGE` is a six-byte class block whose `PAGENUMBER`, `EVENTTYPE` and `ACTIONSTRING` are all `undefined` — asserted in `decode.spec.ts` test 5).
- **`match.spec` synthesises inbound classes by rewriting only `SX`/`SY`.** `encode_packet` forces the source address to zero on the wire and the decoder subtracts 127, so an outbound frame decodes `SX: -127` while a directly attached module reports `SX: 0`. Everything else in the class is genuine decoder output.
- **The `LASTHEADER` trap is asserted, not just avoided.** `match.spec` test 3 asserts the REPORT's `LASTHEADER` decodes as the protocol major (1), that it differs from the request id, that the match succeeds without `expectedId`, and that passing `expectedId` would make it fail — the bug that would show up as "the first FETCH works and the second times out".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The EOT-boundary split index was off by one in the plan**

- **Found during:** Task 2 (framing.spec.ts test 4)
- **Issue:** The plan (and 02-RESEARCH.md's test-input table) specifies "split at `len - 3` (EOT alone in the second chunk)". A frame ends `... EOT c c LF`, so `EOT` sits at `len - 4`; slicing at `len - 3` leaves `EOT` as the **last byte of the first chunk** and the test's own name is false.
- **Fix:** Split at `FETCH.length - 4` and assert `FETCH[split] === EOT` in the test, so the name is literally true and the assertion proves the input exercises the intended boundary. The `len - 3` case is covered anyway by test 2, which walks every split point.
- **Files modified:** `src/lib/protocol/framing.spec.ts`
- **Verification:** `Tests 9 passed (9)`; the test is one of the three the prescribed retention mutation turns red.
- **Committed in:** `4728ea4`

**2. [Rule 3 - Blocking] decode.spec test 4 referenced a spec that does not exist**

- **Found during:** Task 2 (decode.spec.ts test 4)
- **Issue:** The plan's test name cites "multi-class coverage lives in `synthetic.spec` test 2", a file this plan does not create and which is not in its file list.
- **Fix:** Took the plan's own explicitly preferred simpler option and named the test "returns every class in the frame, never just the first". It asserts `classes.length === frame.length` against the decoder's own array (not a literal) and greps `decode.ts` for `frame[0]`, exactly as the plan specifies.
- **Files modified:** `src/lib/protocol/decode.spec.ts`
- **Verification:** `Tests 5 passed (5)`; `grep -cE "frame\[0\]" src/lib/protocol/decode.ts` prints 0.
- **Committed in:** `4728ea4`

**3. [Rule 1 - Bug] FOUND-01 was NOT left marked complete in REQUIREMENTS.md**

- **Found during:** Plan close-out (the workflow's `requirements mark-complete` step)
- **Issue:** All five plans of this phase carry `requirements: [FOUND-01]`, and FOUND-01 reads "connects to a ZONA over Web Serial ... every step acknowledged by the module ... a provable no-op on the hardware". Running `requirements mark-complete FOUND-01` after plan 1 of 5 flipped the checkbox and the traceability row to `Complete` while no hardware has been touched and no page exists — a false claim in a document the user reads, and one that contradicts this summary's own "Next Phase Readiness".
- **Fix:** Ran the command as the workflow specifies, observed the resulting text, then reverted `.planning/REQUIREMENTS.md` with `git checkout --`. FOUND-01 stays `Pending`. The command is idempotent, so plan 05 — the hardware run and `docs/SKELETON-RESULTS.md` — marks it truthfully.
- **Files modified:** none (reverted)
- **Verification:** `grep -n "FOUND-01" .planning/REQUIREMENTS.md` shows `- [ ]` and `| FOUND-01 | Phase 2 | Pending |`
- **Committed in:** n/a (no change committed)

---

**Total deviations:** 3 auto-fixed (2 bug, 1 blocking)
**Impact on plan:** Two are test-fidelity corrections inside the plan's own intent; the third prevents a requirement from being reported satisfied four plans early. No module behaviour, count or acceptance criterion changed. All per-spec counts (5/10/5, 9/5, 7/6) are exactly as planned.

## Issues Encountered

- The Vitest `server` project's include glob is `src/**`, so the task 2 torn-frame negative check could not run from a scratch directory. Resolved by running it as a temporary spec inside `src/lib/protocol/`, deleting it immediately; it was never committed and the count stayed at 47.
- `decode_packet_frame`'s failure logging is `console.log` and cannot be suppressed, so the framing and decode runs print `Checksum mismatch` and `Frame error` noise for their deliberately corrupt inputs. Expected, documented in 02-RESEARCH.md, and harmless in the node project — but plan 03's Playwright console assertion must filter to `type === "error"`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 (transport) can import everything through `$lib/protocol` and inherits `FrameScanner`, `decodeFrame` and `matchResponse` unchanged. The structural spec already scans `src/lib/transport/` and will start enforcing D-06 there the moment the directory exists.
- Nothing here touches a browser or a port, so the hardware checklist is still entirely ahead: the module's real SX/SY, the active page from `PAGEACTIVE/REPORT`, and the D-08 measurements that will replace the placeholder `TIMEOUTS`.
- One thing worth carrying forward: the id correlator is only ever passed when a request's `correlateById` is true, and only the write and the store set it. A queue that passed it unconditionally would break every fetch.

## Self-Check: PASSED

All 7 modules and 7 specs verified present on disk; all 6 task commits verified in `git log`.

---

*Phase: 02-walking-skeleton*
*Completed: 2026-09-03*
