---
phase: 07-install-flow
plan: 01
subsystem: protocol
tags: [baseline, descriptors, serialnumber, module-key, step-ids, forbidden-instructions, SAFE-01, SAFE-04]

# Dependency graph
requires:
  - ".planning/phases/06-device-session/06-14-SUMMARY.md - Phase 6 closed: its five-name block (BASE_FILES 69, BASE_TESTS 724, BASE_SWEEP `3 13`, BASE_E2E 61 frozen, PREV_E2E 77), the hardware checkpoint presented and unanswered"
  - "07-CONTEXT.md D-04 amended - the durable-snapshot key is the module's factory serial, read over the wire, addressed to the ZONA's SX/SY and never broadcast"
  - "07-RESEARCH.md Pattern 1 - grid_decode.c:839-869 (IS_ME | IS_GLOBAL acceptance, REPORT at the global position), grid_esp32_platform.c:139-181 (the eFuse MAC), grid_protocol.h:952-965 (WORD0..3 at offsets 5/13/21/29, length 8), and the round trip measured against the pinned package"
  - "src/lib/protocol/descriptors.ts (02-01) - the four skeleton descriptors, encodeRequest, GridRequest; src/lib/transport/capture.ts (02-01) - STEP_IDS"
  - "scripts/check-counts.mjs (08-01, D-17) - baseline plus delta, never a literal total"
provides:
  - "The five-name carry-forward block for Phase 7, measured on the clean tree Phase 6 closed at 145f85d: BASE_FILES 69, BASE_TESTS 724, BASE_SWEEP `3 13`, BASE_E2E 77 (frozen), PREV_E2E 77 (measured by 07-01)"
  - "fetchSerialNumber(sx, sy) - the fifth and last outbound descriptor: SERIALNUMBER/FETCH addressed to the module, filter SERIALNUMBER/REPORT with no address and no id correlation, TIMEOUTS.fetchMs; 33 bytes on the wire"
  - "moduleKeyOf(cls) - WORD0..WORD3 each >>> 0, lowercase hex, padded to eight: one stable 32-character key"
  - "STEP_IDS has eleven members with fetch-serial second, after identify and before fetch-setup; StepId widened by itself"
  - "descriptors.spec.ts at 12 (two new tests, test 5's round-trip list widened), forbidden-instructions.spec.ts at 5 with test 4 counting five builders and its class set naming SERIALNUMBER"
  - "The ten per-file counts every later plan asserts absolutely, observed on the clean tree, all equal to the plan's expectations"
affects:
  - "07-02 (sequence.ts fetchModuleKey, synthetic.ts serialNumberReportFrame) consumes fetchSerialNumber, moduleKeyOf and the fetch-serial step id"
  - "07-06 (install.svelte.ts) keys the durable snapshot with moduleKeyOf's string"
  - "07-13's phase gate asserts BASE_E2E + 12 = 89 against the 77 frozen here"
  - ".planning/phases/07-install-flow/deferred-items.md - created; .planning/STATE.md, .planning/ROADMAP.md - Phase 7 at 1/13"

tech-stack:
  added: []
  patterns:
    - "A phase's baselines are measured on the clean tree the previous phase closed, before the first edit, and the e2e total is written down twice under two names from the one run; BASE_E2E is frozen so the phase gate asserts against a number the phase's own additions have not absorbed"
    - "A wire-unproven descriptor is pinned by a round trip through the package's own encoder and decoder, the frame length is recorded beside the four measured ones, and the comment says in plain words that no capture holds such a frame and names the runbook row where it meets a module"
    - "The set of outbound instructions is closed by a test that lists the builders and asserts the class set exactly; widening it is a named amendment in the file's header, and the count of tests does not move"

key-files:
  created:
    - ".planning/phases/07-install-flow/07-01-SUMMARY.md"
    - ".planning/phases/07-install-flow/deferred-items.md"
  modified:
    - "src/lib/protocol/descriptors.ts"
    - "src/lib/protocol/descriptors.spec.ts"
    - "src/lib/protocol/forbidden-instructions.spec.ts"
    - "src/lib/transport/capture.ts"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "BASE_E2E and PREV_E2E are both 77, from the one Playwright run at --workers 3 on the clean tree at 145f85d (67 chromium + 10 webkit-phone). BASE_E2E never moves again; 07-13 asserts BASE_E2E + 12 = 89"
  - "fetch-serial is the SECOND member of STEP_IDS, after identify and before fetch-setup. The plan's prose said 'after fetch-timer' while its own code snippet and acceptance criterion said second; the snippet, the criterion and 07-RESEARCH ('immediately after connected, before the snapshot fetch') agree, so the prose is the slip"
  - "The fetch's wire length (33) and the report's (65) are asserted inside the new test rather than added to test 6, so the plan's edit list for the spec (two tests plus test 5's list) is what the diff shows; the fetch is byte-for-byte the length of a page store because both are empty class blocks"
  - "The high-word case in test 12 uses WORD1 0x00000001 beside WORD0 0xfffffff0 and asserts the exact key fffffff0000000010000000000000000, so one class exercises both the sign hazard and the leading-zero padding at once"
  - "No spike: 06-01 measured that a .svelte.ts module is compiled and collected by the server project and that a $state field arrives in node as a plain own class property; install.svelte.ts (07-06) rests on that measurement and on the same rule against $derived"
  - "SAFE-01 and SAFE-04 are contributed, not completed. The gate counts to five and the key exists as a pure function pair; nothing persists yet and nothing writes yet. REQUIREMENTS.md is not edited by this plan"

requirements-completed: []
requirements-contributed: [SAFE-01, SAFE-04]

# Metrics
duration: 19min
completed: 2026-09-05
---

# Phase 7 Plan 01: Phase 6 closed, the five baselines, the fifth descriptor and its key Summary

**Phase 7 starts on measured ground: Phase 6 is closed (06-14-SUMMARY on disk with its five-name block, 06-VERIFICATION beside it, the hardware checkpoint presented and unanswered), and the clean tree at `145f85d` measures quick 69 / 724, sweep `3 13`, e2e 77 at `--workers 3`, svelte-check 533 / 0 errors - every number equal to 06-14's closing block, none adjusted. On that ground the one instruction this phase needs that never existed lands: `fetchSerialNumber(sx, sy)` asks a ZONA for its factory serial by address and never by broadcast, `moduleKeyOf` turns the four decoded words into one 32-character lowercase hex key with no sign and no missing digit, `fetch-serial` is the second of eleven step ids, and the gate over HANGAR's outbound vocabulary counts five builders instead of being quietly outgrown. The set is closed at five.**

## The five-name carry-forward block

Measured on the clean tree Phase 6 closed, at `145f85d`, **before any edit in this plan**, on 2026-09-05, one command at a time so no run was under another's load.

| Name         | Value                        | Measured                                                                                                                    |
| ------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **69**                       | `npm run test:quick`: `Test Files 69 passed (69)`. This plan adds no spec file                                                |
| `BASE_TESTS` | **724** (+ 1 todo = 725)     | the same run: `Tests 724 passed \| 1 todo (725)`. This plan adds 2, so the tree now stands at 726                             |
| `BASE_SWEEP` | **`3 13`**                   | `npm run test:sweep`: `Test Files 3 passed (3)`, `Tests 13 passed (13)` - the literal it printed. Never re-derived            |
| `BASE_E2E`   | **77 (measured by 07-01)**   | `npm run build && npm run test:e2e -- --workers 3`: `77 passed (1.1m)`, 67 chromium + 10 webkit-phone. **Frozen.** 07-13 asserts `BASE_E2E + 12` = **89** |
| `PREV_E2E`   | **77 (measured by 07-01)**   | the same run. Rolls at 07-08, 07-12 and 07-13                                                                               |

`BASE_CHECK` (provenance only, asserted nowhere): **533 files, 0 errors, 0 warnings**, `npm run check`.

### Reconciliation against 06-14

06-14's closing block: quick **69 / 724**, sweep **`3 13`**, e2e **77** at `--workers 3` (its `BASE_E2E` 61 + 16), svelte-check 533. Every one of the five numbers measured here equals it. No discrepancy, so no commit had to be found and nothing was adjusted. The build was of `145f85d` (postbuild: `source-145f85d7242cfe4e160772764440e9f9e7b103ce.tar.gz`, 953 KB), one commit after 06-14's `aca8227` - the two commits between them (`b78d443`, `145f85d`) are the phase's verification and roadmap documents and touch no test.

The e2e run had no retry and no flaky line. `first-experience.e2e.ts` passed 11 with neither of Phase 6 deferred item 8's two sites firing (this plan does not edit that file; the owner is Phase 7's first editor of it, 07-11). `test-results/` appeared after the green run (Phase 6 deferred item 5) and was removed by hand. After the run: no LISTENING socket on 4173 or 4174 (TIME_WAIT entries only), no `wrangler` or `workerd` process.

### The ten per-file counts

Observed on the same clean tree with the JSON reporter, every one equal to the plan's expectation in parentheses. Every later plan's per-file arithmetic starts from these.

| File                                            | Observed | Expected |
| ----------------------------------------------- | -------- | -------- |
| `src/lib/protocol/descriptors.spec.ts`          | **10**   | 10       |
| `src/lib/protocol/forbidden-instructions.spec.ts` | **5**  | 5        |
| `src/lib/transport/sequence.spec.ts`            | **9**    | 9        |
| `src/lib/transport/fixtures/synthetic.spec.ts`  | **3**    | 3        |
| `src/lib/device/session.spec.ts`                | **17**   | 17       |
| `src/lib/device/session-copy.spec.ts`           | **6**    | 6        |
| `src/lib/tune/model.spec.ts`                    | **8**    | 8        |
| `src/lib/ui/device-ui.spec.ts`                  | **7**    | 7        |
| `src/lib/config-shape.spec.ts`                  | **14**   | 14       |
| `e2e/session.e2e.ts`                            | **14** chromium (+ 2 webkit-phone) | 14 |

Also observed, because Task 2 depends on it staying green unedited: `src/lib/transport/fixtures/fixtures.spec.ts` **4**.

### Why there is no spike

06-01 measured it: a `.svelte.ts` runes module is compiled and collected by the `server` Vitest project, and a `$state` field arrives in node as a plain own class property with no accessor on the prototype. `install.svelte.ts` (07-06) rests on that measurement and on the same rule against `$derived`; nothing here repeats it.

## Task 1 - Phase 6 has closed, and the five baselines are re-measured

**Precondition held.** `.planning/phases/06-device-session/06-14-SUMMARY.md` exists (32,470 bytes), carries the five-name block quoted above, and states in its one-liner and in its Task 3 section that the hardware checkpoint was **presented to the user and unanswered**. `06-VERIFICATION.md` is beside it and ROADMAP's progress row reads `6. Device Session | 14/14 | Complete (hardware rows A-F awaiting the user)`. The tree was clean (`git status --short` empty) at `145f85d`. The phase started.

The five measurements are the block above. Commands, in the order run: `npm run check`, `npm run test:quick`, `npm run test:sweep`, the per-file JSON run, `npm run build`, `npm run test:e2e -- --workers 3`. No file was edited until all six had finished.

This task has no commit of its own: its artefact is this SUMMARY, committed with the plan's metadata.

## Task 2 - the fifth descriptor, the key, and the step id

`6848345` - `feat(07-01): the fifth descriptor, the module key, and the fetch-serial step`

`src/lib/protocol/descriptors.ts`:

- The header says **five** outbound instructions, names Phase 7 and the durable-snapshot key as the reason for the fifth, says the set is closed at five and that `forbidden-instructions.spec.ts` test 4 counts them, and says where the fifth's parameter names come from (the desktop never sends one, so the pinned package's tables and `grid_protocol.h:952-965`).
- `import type { DecodedClass } from "./decode"` - one type import; nothing else in the import list moved.
- `storePage()`'s comment no longer says D-12 disables the button on a rig. It says Phase 2's D-12 did that, SAFE-06 (07-CONTEXT D-05) supersedes it, the store stays allowed and the confirmation names the other modules and says their pages are stored too. The descriptor's body is untouched.
- `fetchSerialNumber(sx, sy)` exactly as the interfaces block gives it, with the four-paragraph comment: addressed and never broadcast (`grid_decode.c:839-869`, the REPORT at the global position, no LASTHEADER so `correlateById: false`, a filter naming no address for the same reason `storePage()`'s does not); what the words are (`grid_esp32_platform.c:139-181`, `grid_esp32_usb.c:20-24`, WORD2 and WORD3 always zero on this chip and the key still spanning all four); source-verified and wire-unproven, with `docs/INSTALL-RUNBOOK.md` row A named (that file is 07-13's; the name is a forward reference on purpose).
- `moduleKeyOf(cls)` with the comment saying why `>>> 0` is load-bearing and why the padding is.

`src/lib/transport/capture.ts`: `STEP_IDS` gains `fetch-serial` as its second member with a one-line comment naming Phase 7 and 07-01. The array as committed:

```ts
export const STEP_IDS = [
  "identify",
  // Phase 7 (07-01): the module's own key, fetched before the snapshot.
  "fetch-serial",
  "fetch-setup",
  "fetch-timer",
  "write-timer",
  "write-setup",
  "store",
  "refetch-setup",
  "refetch-timer",
  "restore-page-change",
  "burst",
] as const;
```

Eleven members, `fetch-serial` second. `fixtures.spec.ts` test 4 is a `toContain` superset check per step (`expect(STEP_IDS, ...).toContain(step.id)`), so no capture changed and no spec was edited.

**Verified:** `npm run check` 533 / 0 errors / 0 warnings; `npm run lint` exit 0; `npx vitest run --project server src/lib/protocol/ src/lib/transport/fixtures/fixtures.spec.ts` **8 files / 51 tests** green with no spec edited (the existing ten descriptor tests, five forbidden tests and four fixture tests among them). The raw-source scan of `descriptors.ts` with fragment-assembled needles: page-change class name **absent**, all three erase-and-clear names **absent**, `TYPE: 254` absent, `encode_packet` named 4 times in this one module and in no other shipped module.

## Task 3 - two tests on the descriptor, and the gate that counts to five

`85505e2` - `test(07-01): pin the serial-number fetch and the module key, and count to five`

`src/lib/protocol/descriptors.spec.ts` **10 -> 12**:

- Test 11, *"the serial-number fetch is addressed to the module, and its report decodes to four words"*: `fetchSerialNumber(0, 0)` has `brc {DX: 0, DY: 0}`, class `SERIALNUMBER`, instr `FETCH`, `class_parameters {}`, label `fetch-serial`, `correlateById === false`, `timeoutMs === TIMEOUTS.fetchMs`, and a filter that `toEqual`s `{class_name: "SERIALNUMBER", class_instr: "REPORT"}` with `brc_parameters` and `class_parameters` both undefined. Then the round trip: a REPORT built by `grid.encode_packet` with `WORD0 0x12345678, WORD1 0x9abcdef0, WORD2 0, WORD3 0`, decoded by `decode_packet_frame` and `decode_packet_classes`, comes back as `{WORD0: 305419896, WORD1: 2596069104, WORD2: 0, WORD3: 0}` at `SX -127, SY -127` - the same numbers 07-RESEARCH recorded, re-run rather than trusted.
- Test 12, *"moduleKeyOf is 32 lowercase hex characters, stable, and distinct for distinct words"*: the report above keys to `123456789abcdef00000000000000000`; `/^[0-9a-f]{32}$/` matches; a second call on the same class returns the same string; `WORD0 0x12345679` gives a different key; `WORD0 0xfffffff0, WORD1 0x00000001` keys to `fffffff0000000010000000000000000` with no `-` and exactly 32 characters.
- Test 5's round-trip list gains `fetchSerialNumber(0, 0)`, so every descriptor still round-trips.

**The two encoded frame lengths on the wire** (`encode_packet` output plus the terminator the caller appends), measured against the pinned package `1.20260825.1135` and asserted in test 11:

| Frame                                        | Bytes  | Note                                                              |
| -------------------------------------------- | ------ | ----------------------------------------------------------------- |
| `SERIALNUMBER/FETCH` (`fetchSerialNumber`)   | **33** | An empty class block - byte-for-byte the length of `storePage()`  |
| `SERIALNUMBER/REPORT` with the words above   | **65** | Four eight-character hex words in a 62-byte class block           |

`src/lib/protocol/forbidden-instructions.spec.ts` **5, unchanged**: test 4's built list gains `fetchSerialNumber(0, 0)`, the class-name set becomes `["CONFIG", "HEARTBEAT", "PAGESTORE", "SERIALNUMBER"]`, the instr set stays `["EXECUTE", "FETCH"]`, and the title reads *"the builders produce only the five instructions HANGAR is allowed to send"*. The file's header carries an `AMENDMENT (Phase 7, plan 07-01)` paragraph beneath 06-05's, naming the reason and saying that a sixth builder would make the test fail. A widening, not a new test.

### Negative checks, each observed red on the intended test and restored byte-identical

A scratch runner applied each mutation, ran the one spec, restored the original and compared SHA-256 before and after (equal in all three). `descriptors.ts` never appeared in `git status`.

1. **The broadcast address.** `fetchSerialNumber`'s `brc_parameters` changed to `{DX: -127, DY: -127}`. `descriptors.spec.ts`: 1 failed, 11 passed. Test 11 said: `AssertionError: expected { DX: -127, DY: -127 } to deeply equal { DX: +0, DY: +0 }`, with `- "DX": 0 / + "DX": -127`. Red on `-127`, by name.
2. **The missing pad.** `.padStart(8, "0")` removed from `moduleKeyOf`. `descriptors.spec.ts`: 1 failed, 11 passed. Test 12 said: `AssertionError: expected '123456789abcdef000' to be '123456789abcdef00000000000000000'` - eighteen characters where thirty-two are required, the two zero words having collapsed to one digit each.
3. **The builder removed from test 4.** `fetchSerialNumber(0, 0)` deleted from the built list. `forbidden-instructions.spec.ts`: 1 failed, 4 passed. Test 4 said: `AssertionError: expected [ 'CONFIG', 'HEARTBEAT', 'PAGESTORE' ] to deeply equal [ 'CONFIG', 'HEARTBEAT', ...(2) ]` with `- "SERIALNUMBER"` as the one missing element. The widening is asserted, not decorative.

**Verified after restore:** `npx vitest run --project server src/lib/protocol/descriptors.spec.ts src/lib/protocol/forbidden-instructions.spec.ts` **17 passed** (12 + 5, first run); `npm run lint` exit 0; `npm run check` 533 / 0 errors; `npm run test:quick 2>&1 | node scripts/check-counts.mjs 69 726` -> `observed 69 files, 726 tests passed, 1 todo ... matches the expected counts` (`BASE_FILES` + 0, `BASE_TESTS` + 2); `npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13` -> `matches the expected counts`. `format-parity.spec.ts` did not flake; nothing was re-run.

## Files created and modified

- `src/lib/protocol/descriptors.ts` - header at five, the type import, `storePage()`'s comment under SAFE-06, `fetchSerialNumber`, `moduleKeyOf`
- `src/lib/transport/capture.ts` - `STEP_IDS` gains `fetch-serial` second
- `src/lib/protocol/descriptors.spec.ts` - 10 -> 12; the `serialReport` helper; test 5's list widened
- `src/lib/protocol/forbidden-instructions.spec.ts` - test 4 widened to five builders; the header amendment
- `.planning/phases/07-install-flow/07-01-SUMMARY.md` - this file
- `.planning/phases/07-install-flow/deferred-items.md` - created, carrying Phase 6's inherited items by pointer and this plan's notes
- `.planning/STATE.md`, `.planning/ROADMAP.md` - Phase 7 at 1/13, by hand

## Deviations from plan

None under Rules 1 to 4. No bug was found in the tree, nothing was missing that the task needed, nothing blocked, and no architectural question arose. Three notes, none of them a deviation:

1. **A plan-text slip resolved in favour of the plan's own code and criterion.** The interfaces block's prose says `fetch-serial` is "placed after `fetch-timer`"; the snippet directly beneath it, the acceptance criterion ("`fetch-serial` is the second") and 07-RESEARCH's timing all put it second, after `identify`. Second is what shipped.
2. **The frame lengths are asserted inside test 11**, not added to test 6, so the spec's diff is the two tests and test 5's list the plan enumerates. The plan asked only for the lengths to be recorded; pinning them costs nothing and matches how the other four are held.
3. **ROADMAP.md already showed `07-01-PLAN.md` ticked as completed** before this plan ran (line 214, at `145f85d`). The line is true now and is left as it stands; the progress row (`0/TBD | Not started`) was the one that needed the hand edit and got it. Recorded in `deferred-items.md` as a planning-artefact note for whoever ticks the remaining twelve.

The one line I wrote and removed before committing (an `encodeRequest(...).descr` assertion that asserted nothing and would not have type-checked) never reached the tree.

## Requirements

**`requirements-contributed: [SAFE-01, SAFE-04]`** - contributed, **not completed**. SAFE-01's structural half is stronger (the vocabulary gate says five and would fail on a sixth), and SAFE-04's key exists as a pure function pair pinned by its address, its words and its key. Nothing persists yet, nothing is keyed yet, nothing writes yet. Both close in the plan that owns them (07-13 for the phase's requirements), and `REQUIREMENTS.md` is not edited here.

## Deferred items

Recorded in `.planning/phases/07-install-flow/deferred-items.md` (created by this plan):

- Inherited from Phase 6 by pointer: item 8 (the two pre-hydration key presses in `first-experience.e2e.ts`, owner 07-11 as that file's first Phase 7 editor; neither site fired this run), item 5 (`test-results/` after every e2e run, removed by hand here), item 7 (e2e at `--workers 3`, used here), items 10 to 13 as 06-14 listed them.
- This plan's note on the pre-ticked roadmap line.

Nothing was unobservable as planned; all three negative checks were observed.

## Next plan readiness

07-02 starts from: quick **69 / 726**, sweep `3 13`, `sequence.spec.ts` **9**, `synthetic.spec.ts` **3**, `descriptors.spec.ts` **12**, `forbidden-instructions.spec.ts` **5**. It imports `fetchSerialNumber` and `moduleKeyOf` from `$lib/protocol` - the barrel is `export * from "./descriptors"`, so both reach it with no barrel edit (this plan did not touch `index.ts`) - and names the `fetch-serial` step id. `synthetic.ts` stays the only file outside `descriptors.ts` that calls `encode_packet`; this plan added none.

The hardware checkpoint of Phase 6 (rows A to F) is still unanswered. This plan did not need it; the phase's first real write (07-13) does.

---
*Phase: 07-install-flow*
*Completed: 2026-09-05*

## Self-Check: PASSED

Checked after writing, at 2026-09-05T10:29:21.070Z.

- FOUND: `src/lib/protocol/descriptors.ts`
- FOUND: `src/lib/protocol/descriptors.spec.ts`
- FOUND: `src/lib/protocol/forbidden-instructions.spec.ts`
- FOUND: `src/lib/transport/capture.ts`
- FOUND: `.planning/phases/07-install-flow/07-01-SUMMARY.md`
- FOUND: `.planning/phases/07-install-flow/deferred-items.md`
- FOUND: commit `6848345`
- FOUND: commit `85505e2`
- PASS: descriptors.ts names SERIALNUMBER
- PASS: descriptors.ts pads with padStart(8
- PASS: descriptors.ts is free of the page-change name
- PASS: capture.ts names fetch-serial
- PASS: forbidden-instructions.spec.ts names SERIALNUMBER
- PASS: STATE.md has no leftover token
- PASS: SUMMARY has no leftover token
