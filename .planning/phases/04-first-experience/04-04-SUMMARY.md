---
phase: 04-first-experience
plan: 04
subsystem: device
tags: [connect, identify, copy, D-13, D-22, D-23, DEGR-02, W-18, W-20]
requires:
  - "src/lib/transport/sequence.ts - newIdentifyState, absorbFrame, identify, identifyTimedOut and the Identity shape, unchanged"
  - "src/lib/protocol/framing.ts + decode.ts - FrameScanner and decodeFrame, unchanged"
  - "src/lib/transport/fake.ts - FakeTransport.fromCapture and the writes array the never-writes invariant reads"
  - "src/lib/transport/fixtures/synthetic.ts - heartbeatFrame, used with a non-ZONA hardware config"
provides:
  - "src/lib/transport/transport.ts - failureCopy(f, raw?, controlLabel = \"Connect\"), interpolated at its six Connect sites"
  - "src/lib/device/try-on.ts - TRY_ON_LABEL, Capability, capabilityOf, TryOnState, IdentifyOutcome, identifyOnly"
  - "src/lib/device/try-on.spec.ts - 6 tests, including the never-writes invariant asserted twice"
  - "docs/TESTING.md - transport.spec.ts recorded at 7, not a stale 6"
affects:
  - "Plan 04-08 renders every TryOnState and owns the click handler; it calls failureCopy(f, raw, TRY_ON_LABEL) and identifyOnly(transport)"
  - "Any future caller of failureCopy that passes a label positionally must pass raw (or undefined) first"
  - "src/lib/device/ exists for the first time; it is NOT covered by forbidden-instructions.spec.ts's SCANNED_DIRS"
tech-stack:
  added: []
  patterns:
    - "A trailing, defaulted parameter added to a Phase 2 function so that three positional callers and six existing assertions move by exactly zero lines - proven with `git diff -U0 | grep -c \"^-[^-]\" == 0`"
    - "An absence asserted twice: once dynamically (FakeTransport.writes is empty after a full cycle) and once structurally (the comment-stripped source contains no `.write(`), because either half alone is a weaker gate"
    - "A pure capability function over an explicit environment record, so a branch the shipping browsers cannot produce is still reachable from a test"
    - "Injected now/pollMs/sleep with real defaults, so a 1500 ms window is driven in microseconds without a fake timer"
key-files:
  created:
    - src/lib/device/try-on.ts
    - src/lib/device/try-on.spec.ts
  modified:
    - src/lib/transport/transport.ts
    - src/lib/transport/transport.spec.ts
    - docs/TESTING.md
decisions:
  - "The seventh transport test types its local helper as ReturnType<typeof failureCopy> rather than importing FailureCopy, because widening the existing `import type { OpenFailure }` line would have been a REMOVED line and the plan's own acceptance criterion requires the spec to have gained lines only"
  - "The never-writes negative check was run as TWO perturbations rather than one: an assertion aborts its test at the first failure, so a single unconditional write can only ever prove half one. Half two was proven separately with a write behind a guard the spec never satisfies"
  - "src/lib/device/ was deliberately NOT added to forbidden-instructions.spec.ts's SCANNED_DIRS - out of this plan's scope and consistent with 04-03, which left src/lib/sim/ unscanned. Recorded as a note for a later plan, not fixed here"
metrics:
  duration: 18 min
  tasks: 2
  files: 5
  completed: 2026-09-04
---

# Phase 4 Plan 04: The Control Label and the Identify-Only Path Summary

Phase 2's failure copy can now name whichever button is actually on the screen, and Phase 4 has a
device path that opens a port, listens until the module names itself, and is structurally incapable
of writing to it — proven twice, once by a transport that records every byte handed to it and once
by reading the source.

---

## Suite totals — observed

**Previous end state, from 04-03-SUMMARY:** quick **34 files / 510 passed | 1 todo**, sweep
**1 file / 9**, e2e **10**.

**Re-measured on this machine before this plan touched anything** (Phase 8 shares the tree, so the
baseline is re-observed rather than trusted):

```
npm run test:quick
 Test Files  34 passed (34)
      Tests  510 passed | 1 todo (511)
```

It reproduced 04-03's recorded end state exactly.

### Totals observed AFTER this plan

```
npm run test:quick   ->  35 files, 517 passed | 1 todo (518)
npm run test:sweep   ->   1 file,    9 passed (9)
npm run test:e2e     ->  10 passed (34.9s)
```

Exactly `BASE_FILES + 1` and `BASE_TESTS + 7` (one test into `transport.spec.ts`, six in the new
`try-on.spec.ts`). Verified through `scripts/check-counts.mjs` at each task boundary:

| After task | Command | Result |
|---|---|---|
| 4-04-01 | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 34 511` | exit 0 |
| 4-04-02 | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 35 517` | exit 0 |
| plan end | `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9` | exit 0 |
| plan end | `cat .tmp-e2e/04-04-plan-end-e2e.log \| node scripts/check-counts.mjs --playwright 10` | exit 0 |

**Plan 04-05 should treat 35 / 517 (quick), 1 / 9 (sweep) and 10 (e2e) as its baseline** — and
should re-measure rather than trust them.

---

## The six interpolated sites, as they now read

The signature is `failureCopy(f: OpenFailure, raw?: string, controlLabel = "Connect")`. Titles,
details and step ordering are Phase 2's words verbatim; only the control's name moves.

| # | Failure | Field | Now reads |
|---|---------|-------|-----------|
| 1 | `insecure-context` | `detail` (last clause) | ``…is not a secure context either, which is why the ${controlLabel} button does nothing there.`` |
| 2 | `insecure-context` | `steps[1]` | ``Click ${controlLabel} again`` |
| 3 | `cancelled` | `steps[0]` | ``Click ${controlLabel} again and pick the ZONA`` |
| 4 | `port-busy` | `steps[5]` | ``Click ${controlLabel} again`` |
| 5 | `unplugged` | `steps[2]` | ``Click ${controlLabel} again`` |
| 6 | `unknown` (default arm) | `steps[0]` | ``Unplug the ZONA, plug it back in, and click ${controlLabel} again`` |

`no-web-serial` names no control under either label, and that is correct — there is no button to
click on a browser that cannot talk to hardware at all. It now carries a comment saying so, and
test 7 asserts the absence in both directions rather than leaving it unstated.

The reason the parameter is third rather than second is recorded in a comment **above** the
function, never inside the parameter list (a comment between parameters would land inside the
captured signature the arity probe reads).

---

## Exported surface of `src/lib/device/try-on.ts`, verbatim

Plan 04-08 renders directly against this. Nothing in the tree imports it yet.

```ts
/** The control's name, in one place, so the copy and the button cannot drift. */
export const TRY_ON_LABEL = "TRY ON DEVICE";

export type Capability = "unsupported" | "insecure" | "ok";

/** A capability test over an explicit environment record, never a browser test. */
export function capabilityOf(env: {
  hasSerial: boolean;
  secure: boolean;
}): Capability;

/** UI-SPEC Screen 4's state machine, as a union the component holds. */
export type TryOnState =
  | "unsupported"
  | "insecure"
  | "idle"
  | "choosing"
  | "opening"
  | "identifying"
  | "identified"
  | "not-zona"
  | "silent"
  | "failed"
  | "unplugged-after";

/** The three ways listening can end. */
export type IdentifyOutcome =
  | { kind: "identified"; identity: Identity }
  | { kind: "not-zona"; moduleType: string | undefined }
  | { kind: "silent" };

/**
 * Listen until the module names itself. Takes an ALREADY OPEN transport, and
 * never closes it: the port belongs to the session, not to one identification
 * attempt (UI-SPEC W-20).
 */
export async function identifyOnly(
  transport: GridTransport,
  opts: {
    now?: () => number;
    pollMs?: number;
    sleep?: (ms: number) => Promise<void>;
  } = {},
): Promise<IdentifyOutcome>;
```

`POLL_MS = 50` is module-private. `Identity` and `GridTransport` are re-exported types from
`$lib/transport`, not redefined here.

**Notes plan 04-08 needs.** `capabilityOf` orders absence over insecurity: `{hasSerial: false,
secure: false}` is `"unsupported"`, because that is the message naming a fix the visitor can act
on. `identifyOnly` never closes the transport and never touches `navigator` — the component owns
`requestPort()` (first statement, nothing awaited before it), `port.open()`, the
`WebSerialTransport` construction and the `DISCONNECT ZONA` control.

---

## The non-ZONA hardware config the spec uses

`EN16_HWCFG = 195` — **EN16, RevH**, taken from the pinned package's own table:

```
node --input-type=module -e "import {grid} from '@intechstudio/grid-protocol'; console.log(grid.module_hwcfgs())"
  -> ... {"type":"EN16","revision":"RevH","hwcfg":"195"} ... {"type":"ZONA","revision":"RevH","hwcfg":"161"}
```

That is the same table `absorbFrame` resolves `revision` out of, and `grid.module_type_from_hwcfg(195)`
returns `"EN16"` — which is what test 4 asserts the `not-zona` outcome carries. It is a real Grid
module a visitor could plausibly have on the cable instead of a ZONA, and it is named in a comment
in the spec beside its value.

---

## The negative checks, observed red

### Task 4-04-01 — the label interpolated at only five of the six sites

The `unknown` step was reverted to a hard-coded `Connect`. Test 7 went red naming `unknown`:

```
FAIL  |server| src/lib/transport/transport.spec.ts > open failure taxonomy (CONN-02, CONN-04, CONN-05) > the copy names the control that is actually on the screen
AssertionError: unknown names Phase 4's control: expected 'The port would not open The browser r…' to contain 'TRY ON DEVICE'
```

Restored; `git diff --quiet -- src/lib/transport/transport.ts` then showed only the intended change
and the spec returned to 7 passed.

### Task 4-04-02 — the never-writes invariant, both halves

The plan asks for a single perturbation turning test 3 red on **both** halves. A Vitest assertion
aborts its test at the first failure, so one perturbation can only ever demonstrate the half that
runs first. Both halves were therefore proven separately, which is a stronger demonstration of the
plan's own point — that either half alone is a weaker gate.

**Perturbation A — `void transport.write(new Uint8Array([0]));` reached on every call.** Half one
(the recorded write) red, and test 6 red as well:

```
FAIL  |server| src/lib/device/try-on.spec.ts > TRY ON DEVICE: connect and identify, never write (D-13, D-22) > writes nothing across a full open, identify and close cycle, and cannot
AssertionError: TRY ON DEVICE wrote to the module: expected [ Uint8Array[ 0 ] ] to have a length of +0 but got 1

FAIL  |server| src/lib/device/try-on.spec.ts > TRY ON DEVICE: connect and identify, never write (D-13, D-22) > registers exactly one data callback and never reaches the transport's write
AssertionError: the path asked the transport to write: expected 1 to be +0 // Object.is equality
```

**Perturbation B — the same write behind `if (opts.pollMs === -1)`, a guard no test satisfies.**
Nothing was written at runtime, so half one passed and only the structural half fired — which is
exactly the case a recording-only gate would wave through:

```
FAIL  |server| src/lib/device/try-on.spec.ts > TRY ON DEVICE: connect and identify, never write (D-13, D-22) > writes nothing across a full open, identify and close cycle, and cannot
AssertionError: try-on.ts reaches .write(: expected true to be false // Object.is equality
```

Both perturbations were reverted with `git checkout --`; `git diff --quiet -- src/lib/device/try-on.ts`
exited 0 afterwards and the spec returned to 6 passed.

---

## Verification

| Check | Result |
|---|---|
| `npx vitest run --project server src/lib/transport/transport.spec.ts` | **7 passed (7)** |
| `npx vitest run --project server src/lib/device/try-on.spec.ts` | **6 passed (6)** |
| Both in one run | 2 files, **13 passed** |
| `npx vitest run --project server src/lib/config-shape.spec.ts` | **12 passed (12)** |
| `npx vitest run --project server src/lib/protocol/forbidden-instructions.spec.ts` | **5 passed (5)** |
| Arity probe over the comment-stripped signature (3 args, `raw?` second, defaulted `controlLabel` third) | exit 0 |
| `git diff -- src/routes/dev/skeleton/+page.svelte` | no output |
| `git diff -U0 -- src/lib/transport/transport.spec.ts \| grep -c "^-[^-]"` | `0` — the spec only gained lines |
| `grep -E "transport\.spec\.ts.*\\\| +7 +\\\|" docs/TESTING.md` | matches (line 86) |
| `try-on.ts` reaches none of `.write(`, `RequestQueue`, `hostHeartbeat`, `sendConfig`, `storePage`, `fetchConfig`, comment-stripped | exit 0 |
| `try-on.ts` contains none of `userAgent`, `Chromium`, `navigator.vendor`, over the RAW source | exit 0 |
| `npx playwright test e2e/skeleton.e2e.ts` | **2 passed (22.5s)**, log in `.tmp-e2e/04-04-task1-skeleton.log`, `failed` absent (`grep -ci failed` -> 0) |
| `npm run test:e2e` (whole suite, plan end) | **10 passed (34.9s)**, log in `.tmp-e2e/04-04-plan-end-e2e.log` |
| `npm run test:quick` through the helper at 34 / 511, then 35 / 517 | exit 0 |
| `npm run test:sweep` through the helper at 1 / 9 | exit 0 |
| `npm run check` | 403 files, **0 ERRORS**, 0 warnings |
| `npm run lint` | exit 0 |
| `git diff --quiet -- src/vendor` | exit 0 |
| Port 4173 free before both e2e runs; no `wrangler` / `workerd` process and no listener afterwards | confirmed (0 matching processes) |
| Working tree clean after every commit | confirmed |

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] Widening the spec's type import would have violated the plan's own gate**

- **Found during:** Task 4-04-01, first draft of test 7.
- **Issue:** The helper that joins title, detail and steps needs the `FailureCopy` type. The obvious
  move — widening the existing `import type { OpenFailure } from "./transport";` — is a **removed**
  line, and the same task's acceptance criterion requires
  `git diff -U0 -- src/lib/transport/transport.spec.ts | grep -c "^-[^-]"` to print `0`. A second
  `import type` line from the same module would also be a duplicate import.
- **Fix:** The helper is typed `ReturnType<typeof failureCopy>`, which needs no import at all and
  tracks the function's own return type if it ever changes. The import line is byte-identical to
  Phase 2's, and the spec gained lines only.
- **Files modified:** `src/lib/transport/transport.spec.ts`
- **Commit:** `56a2a82`

**2. [Rule 1 - Bug] The plan's single negative check could only ever prove one half**

- **Found during:** Task 4-04-02.
- **Issue:** The plan calls for adding one `void transport.write(...)` and confirming test 3 goes
  red on **both** halves. Vitest aborts a test at its first failed assertion, so with the recorded
  write red first, the structural scan never executes and its half is never demonstrated. Recording
  "both halves red" from that run would have been a claim the output did not support.
- **Fix:** Two perturbations, each isolating one half — an unconditional write for the recording,
  and a write behind an unsatisfiable guard for the scan. Both red lines are quoted above. This is
  a stronger check than the plan's, and it is the check that actually demonstrates the plan's stated
  reason for having two halves.
- **Files modified:** none (both perturbations reverted)
- **Commit:** n/a — verification only

**3. [Rule 2 - Missing critical functionality] `try-on.ts` named an engine in a comment**

- **Found during:** Task 4-04-02, running the no-sniffing scan.
- **Issue:** The first draft explained the unreachable `insecure` branch with "even though Chromium
  can barely produce it". That scan reads the **raw** source, deliberately, and CONN-02's whole
  point is that HANGAR never names an engine a visitor cannot map onto the icon on their desktop —
  not in copy and not in the comments that become copy.
- **Fix:** Reworded to "the browsers that ship Web Serial", which is both accurate and the vocabulary
  the rest of the codebase uses.
- **Files modified:** `src/lib/device/try-on.ts`
- **Commit:** `4f25f84`

**4. [Rule 1 - Bug] `docs/TESTING.md` would have contradicted itself**

- **Found during:** Task 4-04-01.
- **Issue:** The plan asks for the per-file row to move from 6 to 7. The paragraph above that table
  says the walking skeleton "added … 98 tests", and 98 is exactly the sum of the table's rows. Moving
  one row to 7 makes the table total 99 and the sentence stale — the same defect the plan calls out
  ("a stale count in that table is worse than no count"), one paragraph higher.
- **Fix:** One sentence added recording that Phase 4 has since added the control-label test, so the
  table totals 99. The 98 attributed to the walking skeleton stays, because it is true of the
  walking skeleton.
- **Files modified:** `docs/TESTING.md`
- **Commit:** `3d2f392`

### Observations, not deviations

- **`src/lib/device/` is not covered by `forbidden-instructions.spec.ts`.** That spec's
  `SCANNED_DIRS` is `["src/lib/protocol", "src/lib/transport"]`, so D-06's erase/clear scan and the
  "only the descriptor module encodes a packet" rule do not see the new directory. `src/lib/sim/`
  from 04-03 is in the same position. Not fixed here: it edits a Phase 2 spec outside this plan's
  `files_modified`, and `try-on.spec.ts` test 3 already scans this specific file for a stricter list.
  **Worth one line in a later plan** — widening `SCANNED_DIRS` to `src/lib` would cost no tests and
  close both gaps at once.
- **`identifyOnly` registers no `onClose` handler.** A port that closes mid-identification lands in
  `silent` (or `not-zona`) when the window elapses, which is correct copy for it, and the caller —
  which owns the port — is the right place to notice a disconnect. UI-SPEC's `unplugged-after` state
  is keyed on the `navigator.serial` `disconnect` event, which is a component concern, not this
  module's.
- **The `not-zona` outcome reports the first module seen.** With more than one non-ZONA module on
  the bus the choice is arbitrary; a `Map` iterates in insertion order, so it is the first one that
  heartbeated. UI-SPEC Screen 4 shows one module type in that block, so this matches the copy.
- **`npm run check` through a pipe prints `0 ERRORS` in capitals.** Every check here used `grep -Ei`.
- **The comment-stripping scans were run as `node -e` one-liners**, not from scratch files: the
  plan's backslash-free strip expression survived the Bash transport intact this time (the `$` in
  `.*$/gm` was escaped once for the shell). No scratch file was left in the repository.
- **One heredoc had to be replaced by the `Write` tool.** The Bash heredoc carrying
  `try-on.spec.ts` failed with an unmatched-quote parse error before the file was created; the
  content was written directly instead. Nothing about the file changed.

---

## Notes for later plans

- **Baseline for 04-05: quick 35 / 517 (plus the one pre-existing todo), sweep 1 / 9, e2e 10.**
  Re-measure before applying a delta.
- **Plan 04-08 owns the handler, and the ordering rule binds it, not this module.** `identifyOnly`
  takes an already-open transport precisely so that `navigator.serial.requestPort()` can be the
  first statement in the click handler with nothing awaited in front of it. Any refactor that makes
  `identifyOnly` open the port itself breaks that rule silently — the picker rejects with what reads
  as a permissions bug.
- **Call `failureCopy(f, raw, TRY_ON_LABEL)`, never `failureCopy(f, TRY_ON_LABEL)`.** The label is
  the third parameter. Passing it second puts it in `raw` and it will surface inside the `unknown`
  detail as "The browser reported: TRY ON DEVICE" — which no test in this plan catches, because the
  three existing positional callers are exactly what the trailing position protects.
- **`transport.spec.ts` test 7 pins the label at all six sites.** A future edit that adds a seventh
  `Connect` to any failure whose copy already names a control turns it red; one added to
  `no-web-serial` turns it red too, from the other direction.
- **The identify window is driven by injection, not by fake timers.** `identifyOnly(t, { now, sleep })`
  is how any future test should exercise the timeout; installing `vi.useFakeTimers()` around it
  would also freeze `performance.now()` inside `absorbFrame`, which stamps `lastSeen`.

## Known Stubs

None. `identifyOnly` returns real outcomes folded from real decoded frames, and `capabilityOf` is
total over its input. Nothing in either file returns a placeholder, an empty value standing in for
real data, or copy that says "coming soon".

The one deliberate *absence* is the rendering: this plan writes no Svelte, by design (the plan's own
objective says so), and plan 04-08 mounts these states. That is a sequencing boundary, not a stub.

## Requirements

`requirements: [DEGR-02]` in the plan frontmatter is phase-level attribution. **DEGR-02 is not
complete after this plan, and it is not marked** in `.planning/REQUIREMENTS.md`, whose traceability
row already reads "Phase 7 (browser-capability half delivered in Phase 4) | Pending".

DEGR-02 requires that install controls are *present but disabled with the reason inline* on
unsupported browsers, never hidden. This plan delivers the two halves that make that possible — the
capability branch (`capabilityOf`) and the reason (`failureCopy(f, undefined, TRY_ON_LABEL)`) — and
renders neither. No control is present or disabled anywhere until plan 04-08.

`.planning/REQUIREMENTS.md` is therefore unchanged by this plan.

## Self-Check: PASSED

All five claimed source and documentation files and this SUMMARY exist on disk, and all four claimed
commits (`56a2a82`, `3d2f392`, `c58683e`, `4f25f84`) are in the history.
