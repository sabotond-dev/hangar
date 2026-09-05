---
phase: 06-device-session
plan: 02
subsystem: device
tags: [copy, taxonomy, slot-states, capability, import-free, CONN-02, CONN-03, CONN-05, CONN-08]

# Dependency graph
requires:
  - "src/lib/tune/copy.ts (05-02) — the zero-import copy-module precedent and the reason for it: Phase 4's chunk guard matches specifier TEXT"
  - "src/lib/ui/TryOnDevice.svelte (04-08) — the four authored strings this module absorbs, lifted by copy and paste from lines 109-135"
  - "src/lib/transport/transport.ts (02-01, 06-01) — failureCopy's six branches and its trailing controlLabel contract, which the six failureCopy states render verbatim"
  - "src/lib/device/try-on.ts (04-08) — capabilityOf and its doc comment, moved out of it"
  - ".planning/phases/06-device-session/06-UI-SPEC.md — the approved Copywriting Contract, the nine slot states and the nine-state failure taxonomy"
  - "scripts/check-counts.mjs (08-01, D-17) — baseline plus delta, never a literal total"
provides:
  - "src/lib/device/session-copy.ts — every visitor-facing session string in ONE module with ZERO import specifiers, so a header component may name it on the first paint of /"
  - "SessionPhase (seventeen members) and slotStateOf, a switch with no default: the nine-slot-state table as a pure function testable in node"
  - "FAILURE_COPY_STATES (6) + AUTHORED_STATES (3) = NAMED_STATES (9), the closed taxonomy a test can count"
  - "CONNECT_LABEL, so the header's recovery steps name the header's button and the panel's name the panel's"
  - "notZonaBlock / silentBlock / unpluggedWhileConnectedBlock — the three HANGAR authors, each taking the rendering surface's control label (Y-14)"
  - "moduleTail / multiModuleLine — undefined for an empty list, so no single-module connection carries a stray separator"
  - "capabilityOf, synchronous and import-free, re-exported from try-on.ts so every Phase 4 caller is unchanged"
affects:
  - "src/lib/device/try-on.ts — Capability and capabilityOf become a one-line re-export"
  - ".planning/phases/06-device-session/deferred-items.md — item 2, the managed-computer sentence"
  - ".planning/STATE.md, .planning/ROADMAP.md — Phase 6 at 2/14"

tech-stack:
  added: []
  patterns:
    - "A copy module's mechanical rules are asserted by WALKING ITS OWN EXPORTS (Object.entries over the namespace import) rather than a hand-written list, with one declared sample per exported function, so a string added later is covered on the day it is added and a function without a sample fails by name"
    - "A deliberate omission from an approved contract is made into a GATE rather than a note: the spec asserts that no exported string contains the omitted sentence's tell and no export name contains its name, so reinstating it is a red test beside a deferred item"
    - "A phase-to-state table is transcribed into the spec as a Record over the union, so a phase added without a row is a type error in the spec as well as in the switch it describes"
    - "A total switch over a union with NO default branch: adding a member is a compile error rather than a silent fall-through"

key-files:
  created:
    - "src/lib/device/session-copy.ts (440 lines)"
    - "src/lib/device/session-copy.spec.ts (382 lines)"
    - ".planning/phases/06-device-session/06-02-SUMMARY.md"
  modified:
    - "src/lib/device/try-on.ts (-24 lines, +5)"
    - ".planning/phases/06-device-session/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "MANAGED_POLICY is deliberately NOT written, a recorded deviation from 06-UI-SPEC's unsupported row: about:policies exists only in Gecko, showing it to everyone would send a Safari or iOS visitor to a page that does not exist for them, and showing it only where it applies needs a signal that the browser is desktop Firefox 151+ — which this phase's no-user-agent rule forbids, and which a capability sniff aimed at one engine only disguises"
  - "SAFE_PROMISE measures 126 characters, not the 125 both 06-UI-SPEC and 06-02-PLAN state. The STRING is verbatim from the contract (proved by a scripted substring match against 06-UI-SPEC.md itself); the count is the contract's own off-by-one. PICKER_EXPLAINER's 130 checks out exactly, which is what makes this a miscount rather than a transcription error. The spec asserts 126"
  - "RECONNECT_OFFER measures 88 characters, not the 97 the plan wanted — the plan said measure and record, so 88 is the recorded figure and the spec asserts it"
  - "CHOOSER_NEVER_APPEARED_BODY takes a U+2019 apostrophe where 06-UI-SPEC line 584 has an ASCII one. The Copywriting Contract's own typography rule governs its own table, and every other character is byte-identical (verified by substituting the apostrophe back and re-matching)"
  - "capabilityOf's doc comment could not move UNCHANGED: its third paragraph named the browser engine, which this phase forbids in comments as well as in copy. Reworded to `the browsers that ship Web Serial`, the same claim without the word — exactly the fix 06-01 made in transport.ts for the same reason"
  - "session-copy.spec.ts scans the RAW source for the engine name, comments included, in the shape of transport.spec.ts test 6 — the invariant that caught 06-01's comment"
  - "The identity is exported in PIECES (firmwareText, moduleTail, identitySentence, identityDescription, multiModuleLine) and no slot-label builder ships: the firmware and the page number are monospaced numeric runs inside an otherwise-Quicksand line (Y-18), so the component owns the markup"

requirements-completed: []
requirements-contributed: [CONN-02, CONN-03, CONN-05, CONN-08]

# Metrics
duration: 25min
completed: 2026-09-05
---

# Phase 6 Plan 02: session-copy.ts — every word the session says, in a module that imports nothing Summary

**Forty-four exported names and zero import specifiers: every visitor-facing sentence of the device session now exists once, in a module a header component may name on the first paint of `/`, together with the seventeen-phase → nine-slot-state table as a `switch` with no `default` and the capability rule moved out of `try-on.ts` so the 152px header note is decided synchronously in the first hydrated frame instead of appearing and then vanishing on a browser that cannot connect. One sentence of the approved contract is deliberately not written — the managed-computer `about:policies` line, which has no honest trigger that is not a user-agent read in disguise — and that omission is a gate rather than a note: test 6 fails on any exported string containing `about:` and on any export name containing `MANAGED`, and both halves were observed red.**

## The five-name carry-forward block

Measured by **06-01** on a clean tree at `746cfa2`. Carried forward verbatim, unchanged by this plan.

| Name         | Value                      | Measured                                                                             |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------ |
| `BASE_FILES` | **66**                     | `npm run test:quick` on the clean tree                                                 |
| `BASE_TESTS` | **691** (+ 1 todo = 692)   | `npm run test:quick` on the clean tree                                                 |
| `BASE_SWEEP` | **`3 13`**                 | `npm run test:sweep` — the literal it printed. Never re-derived                        |
| `BASE_E2E`   | **61 (measured by 06-01)** | `npm run build && npm run test:e2e`. **Frozen.** 06-14 asserts `BASE_E2E + 16` = **77** |
| `PREV_E2E`   | **61 (measured by 06-01)** | the same run. Rolls at 06-06, 06-07 and 06-13                                          |

**`PREV_E2E` does not move here.** This plan adds no route, no component and no browser-reachable
behaviour — three files under `src/lib/device/`, all of them node-tested — so `test:e2e` was not run.

### Observed totals: previous SUMMARY plus this plan's delta

06-01 left the tree at **66 files / 694 tests**. This plan's delta is **+1 file / +6 tests**, so quick
stands at **67 / 700**, which is `BASE_FILES + 1` and `BASE_TESTS + 9` — 06-01's three plus this
plan's six, exactly the arithmetic the plan's gate encodes.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 66 694     # re-measured BEFORE any edit
  check-counts: observed 66 files, 694 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:quick 2>&1 | node scripts/check-counts.mjs 67 700     # after
  check-counts: observed 67 files, 700 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo
  check-counts: matches the expected counts

npm run check 2>&1 | grep -Ei "0 errors"
  1788573582251 COMPLETED 519 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (exit 0)
```

`svelte-check` moves 517 → **519 files** for the two new files, 0 errors. Provenance only, asserted
nowhere.

## Task 1 — `session-copy.ts` (commit `c9073d3`)

440 lines, **zero import specifiers**, 44 runtime exports (33 constants, 11 functions) and four exported types.

### It imports nothing, and the scan says so

```
stripped length: 6877
occurrences of from ": 0
occurrences of import(: 0
occurrences of import : 0
occurrences of default: 0
```

The third line is stricter than the plan asked and costs nothing: with no `import ` at all there is
no side-effect import either. The fourth is task 1's other structural claim, quoted below.

### `slotStateOf` has no `default`, and the switch closes like this

```ts
    case "forgotten":
      return "S7";
  }
}
```

Seventeen `case` labels over the seventeen-member union, nine returns, and **no `default`**, so a
phase added later is a type error here rather than a silent fall-through onto a shape nobody
designed. TypeScript accepts the missing tail return because the switch is exhaustive over the union;
that is the same fact stated twice, and it is the point.

`starting` is `S1`. It is the value plan 06-03 initialises `phase` to and therefore the slot state of
**every prerendered page**: the static document ships the resting slot and the header note, and
hydration either leaves both exactly where they are (a capable browser: `starting` becomes `idle`) or
removes the note once, in the first hydrated frame, and never again.

### The four Phase 4 strings were lifted, not retyped

Copied out of `src/lib/ui/TryOnDevice.svelte` by copy and paste:

| String | From | Now |
| --- | --- | --- |
| `NOT_ZONA_TITLE` | `TryOnDevice.svelte:119` | module-private const behind `notZonaBlock` |
| `notZonaBody` | `TryOnDevice.svelte:120-122` | module-private builder, fallback `an unknown module` intact |
| `SILENT_TITLE` | `TryOnDevice.svelte:125` | module-private const behind `silentBlock` |
| `silentBody` | `TryOnDevice.svelte:126-129` | module-private builder |
| `UNPLUGGED_AFTER` | `TryOnDevice.svelte:135` | exported as `UNPLUGGED_WHILE_CONNECTED`, and `LIVE_UNPLUGGED` is an alias of it rather than a second copy |
| `STATUS_CHOOSING/OPENING/IDENTIFYING` | `TryOnDevice.svelte:109-111` | exported unchanged |

The bodies were reflowed onto one line each — they were concatenations in the component and the
module's rule is one literal per sentence — and the character sequence is unchanged, which
`session-copy.spec.ts` test 5 now holds character for character. The **only** amendments are the two
step lists, each with a comment beside it naming 06-UI-SPEC **Y-14** as the authority and Phase 4's
own copy rule as the reason:

- `not-zona` step 1 was `Disconnect`, a control that is not on the screen once the session has closed
  the port. It becomes `Plug in a ZONA`, and step 2 takes the interpolated label.
- `silent` step 2 hard-coded the panel's label. It becomes `Click {label} again and pick a different
  port`.

### Every long literal, verified against the approved spec rather than proofread

A scratch script pulled every string literal out of `session-copy.ts` and asked whether
`06-UI-SPEC.md` contains it:

```
OK     130  PICKER_EXPLAINER
OK     126  TWO_STEP
OK      61  PERMISSION_DECLINED
OK     126  SAFE_PROMISE
OK      88  RECONNECT_OFFER
OK      98  REPLUG_OFFER
OK     105  REVOKE_EXPLANATION
OK      44  UNPLUGGED_WHILE_CONNECTED
OK      36  STATUS_CHOOSING
MISS   153  CHOOSER_NEVER_APPEARED_BODY
OK      37  LIVE_DETECTED
OK      52  LIVE_FORGOTTEN
OK     139  NOTHING_LISTED_STEPS step
OK      77  NOTHING_LISTED_STEPS step
OK     183  NOTHING_LISTED_STEPS step
```

**The measured lengths, recorded as the plan requires:**

| Export | Measured | Plan / spec said |
| --- | --- | --- |
| `PICKER_EXPLAINER` | **130** | 130 — exact |
| `TWO_STEP` | 126 | — |
| `PERMISSION_DECLINED` | 61 | — |
| `SAFE_PROMISE` | **126** | 125 — **the contract is off by one; see the deviations** |
| `RECONNECT_OFFER` | **88** | 97 "wanted", to be measured — **88 is the real count** |
| `REPLUG_OFFER` | 98 | — |
| `REVOKE_EXPLANATION` | 105 | — |
| `UNPLUGGED_WHILE_CONNECTED` | 44 | Phase 4's, verbatim |
| `CHOOSER_NEVER_APPEARED_BODY` | 153 | — |
| `NOTHING_LISTED_STEPS` | 139 / 77 / 183 | — |

The single `MISS` is the ASCII-apostrophe deviation below, and it is the only one: substituting
U+0027 back for U+2019 makes the match succeed at the same length of 153, so nothing else about that
sentence differs.

### `MANAGED_POLICY` is not written — the deliberate deviation from 06-UI-SPEC's `unsupported` row

06-UI-SPEC's `unsupported` row carries one sentence more than this module writes:

> `On a managed computer a policy may have switched this off — check about:policies.`

It is true, and on the one browser it describes it is the most useful sentence in the block. **It is
not exported and not written**, and the reason is a rule this phase obeys against a rule it declines
to invent. `about:policies` exists only in Gecko, so putting the sentence in every `unsupported`
state would send a Safari or an iOS visitor to a page that does not exist for them. Showing it only
where it applies needs a signal that the browser is desktop Firefox 151+, and **this phase's standing
rule forbids reading the user agent in any file**. A capability sniff aimed at one engine is a
user-agent read wearing a different name: it would exist for no reason except to identify that
engine, and it would rot the first time another engine grew the same shape. The missing thing is the
**signal**, not the string.

The tree-wide scans, quoted:

```
grep -rn MANAGED src e2e            -> no match (exit 1)
grep -rn "about:policies" src e2e   -> no match (exit 1)
```

Recorded in two places, as the plan requires: this paragraph, and
`.planning/phases/06-device-session/deferred-items.md` item 2, which names the missing signal
("revisit if Firefox ever exposes a non-user-agent way to know that an enterprise policy has disabled
Web Serial") rather than only the missing string, and transcribes the sentence so nobody has to
retype it. **Owner: unowned, blocked on a browser capability that does not exist.**

## Task 2 — `session-copy.spec.ts`, six gates (commit `1aa79c4`)

```
npx vitest run --project server src/lib/device/session-copy.spec.ts
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

1. **imports nothing at all, so any component may name it on the first paint** — strips comments,
   asserts zero `from "`, zero `import(` and zero `import `, with non-vacuity on both the raw read
   (> 4000 characters) and the stripped remainder, so a file that was all comments could not pass.
2. **maps all seventeen phases onto the nine slot states, and starting is S1** — the table is a
   `Record<SessionPhase, SlotState>`, so a phase added to the union without a row is a **type error in
   the spec** as well as in the switch; 17 rows asserted, every row compared, `starting` asserted
   separately by name, and the produced set compared against all nine slot states.
3. **names nine states, partitioned six and three** — 6 + 3 = 9, disjointness asserted member by
   member, the concatenation compared against `NAMED_STATES`, distinctness asserted, and every named
   state shown to land in S0a, S0b, S5 or S6.
4. **interpolates the rendering surface's label and hard-codes no control name** — both blocks built
   from **both** surfaces' labels, plus the comment-stripped source scanned for the panel label and
   for Phase 4's `Disconnect`.
5. **holds the long sentences character for character** — the three measured lengths and ten literals.
6. **obeys the typography rules, names one browser on purpose, and names no engine** — the export
   walk, below.

### Test 6 walks the module's own exports

```ts
  for (const [name, value] of Object.entries(copy)) {
    if (typeof value === "function") {
      const args = SAMPLES[name];
      expect(args, `no sample input is declared for ${name}`).toBeDefined();
      const build = value as (...a: readonly unknown[]) => unknown;
      push(name, build(...args));
    } else {
      push(name, value);
    }
```

`push` recurses into arrays and into block objects, so the step lists and the failure details — the
exact places a hard-coded label would hide — are covered too. A function without a declared sample
fails **by name**, so a sentence added later cannot escape the rules. The walk found more than 30
strings; the rules applied to each are: no engine name, no ASCII apostrophe, no exclamation mark, no
three-full-stop ellipsis, no spaced double hyphen, no emoji (`\p{Extended_Pictographic}`), and no
`about:`. Positively: U+2019, U+2026 and U+2014 each appear somewhere, so the bans are not vacuously
satisfied by a module with no punctuation.

**Exactly one string names a browser**, asserted as an equality against a one-element list rather
than a count:

```ts
    expect(named, "one string names a browser, and only one").toEqual([
      "CHOOSER_NEVER_APPEARED_BODY",
    ]);
```

That is the **one recorded exception** to the Copywriting Contract's "never a browser name outside
`UNSUPPORTED_DETAIL`" rule. A settings path is worthless without the browser it belongs to, and the
sentence stays a suggestion ("may be blocking") rather than a claim about which browser the visitor
has. Recording it by name makes it an exception rather than a hole.

The same test scans the **raw** source — comments included — for the engine name, in the shape of
`transport.spec.ts` test 6. That is the invariant which caught 06-01's comment, and it is why
`capabilityOf`'s doc comment could not move unchanged (deviation 1).

### The five negative checks, every one observed red and restored

**1. One character of `PICKER_EXPLAINER`** (`ports` → `port`). Test 5:

```
AssertionError: the 130-character pre-click line: expected 129 to be 130
```

**2. `slotStateOf("forgotten")` returns `"S6"`.** Test 2:

```
AssertionError: forgotten renders as S7: expected 'S6' to be 'S7'
```

**3. An ASCII apostrophe in `REVOKE_EXPLANATION`.** **Two** tests went red, 5 and 6:

```
AssertionError: expected 'Removes this site\'s permission to se…' to be 'Removes this site’s permission to see…'
AssertionError: REVOKE_EXPLANATION has a typewriter quote: expected true to be false
```

**4. The panel's label hard-coded into `silentBlock`.** Test 4:

```
AssertionError: expected 'Click TRY ON DEVICE again and pick a …' to be 'Click CONNECT ZONA again and pick a d…'
```

Worth recording: the assertion that fired is the one built from the **header's** label. The plan's
own assertion — `silentBlock(1.5, "TRY ON DEVICE").steps[1]` — would have **passed** against the
hard-coded string, because the hard-coded value is exactly what that call expects. Test 4 therefore
builds both blocks from **both** surfaces' labels; without the second surface the gate would have
been unfalsifiable in the direction it exists to catch.

**5. `MANAGED_POLICY` reinstated — both halves of the deviation guard, observed separately.** Adding
the export with its full sentence fires the string half:

```
AssertionError: MANAGED_POLICY points at a browser-internal page: expected true to be false
```

That assertion aborts the test before the export-name loop, so the name half was observed on its own,
by reinstating the export with the sentence's `about:policies` clause removed:

```
AssertionError: MANAGED_POLICY reinstates the managed-computer sentence: expected true to be false
```

Both halves are live. A later reader who reinstates the managed-computer sentence finds out from a red
test and from the deferred item beside it, instead of shipping a sentence to visitors who have no
`about:policies` to open.

All five restored; 6 passed again.

## Task 3 — `capabilityOf` moves, `try-on.ts` re-exports (commit `f09ce22`)

`try-on.ts` loses 24 lines and gains five:

```ts
// capabilityOf lives in session-copy.ts, which imports nothing, so the session
// can decide the capability synchronously in the first hydrated frame rather
// than after a dynamic import has landed. Re-exported here so every existing
// caller and try-on.spec.ts test 1 keep working unchanged (06-02).
export { capabilityOf, type Capability } from "./session-copy";
```

`git diff --stat` for the whole task: `src/lib/device/try-on.ts | 29 +++------ | 5 insertions(+), 24
deletions(-)`. **`try-on.spec.ts` is not in the diff. `TryOnDevice.svelte` is not in the diff** — it
reaches `capabilityOf` through its dynamic `import("$lib/device/try-on")`, which the re-export
satisfies.

```
npx vitest run --project server src/lib/device/    ->  2 files, 13 tests passed
  session-copy.spec.ts   6 passed
  try-on.spec.ts         7 passed
```

### The negative check, observed red on both consumers

Deleting the re-export line:

```
ERROR "src\lib\device\try-on.spec.ts" 16:10 "Module '"./try-on"' has no exported member 'capabilityOf'."
ERROR "src\lib\ui\TryOnDevice.svelte" 238:33 "Property 'capabilityOf' does not exist on type 'typeof import(".../src/lib/device/try-on")'."
```

and, at runtime:

```
FAIL |server| src/lib/device/try-on.spec.ts > reads the capability from the environment, and absence beats insecurity
TypeError: capabilityOf is not a function
```

Restored; both green. The check is stronger than the plan asked for: it names the component as well
as the spec, which is the caller nobody would have thought to run.

## Deviations from Plan

### 1. [Rule 1 - Bug] `capabilityOf`'s doc comment could not move unchanged: it named the browser engine

**Found during:** task 3, while lifting the comment.

**Issue:** the plan says to move `Capability` and `capabilityOf` "with the whole doc comment,
unchanged". Its third paragraph read *"`insecure` is deliberately reachable here even though
Chromium can barely produce it"*. This phase's standing rule bans that word **in comments as well as
in copy** — `transport.spec.ts` test 6 enforces it over `transport.ts`, and 06-01 was caught by it on
its first run (06-01-SUMMARY deviation 1). Moving the comment verbatim into a module whose own spec
scans the raw source for the same word would have shipped a file that fails its own gate.

**Fix:** the phrase becomes *"even though the browsers that ship Web Serial can barely produce it"* —
the same claim, more general and still true (`navigator.serial` is `[SecureContext]` in every browser
that has it), in the house style 06-01 established for exactly this. Every other word of the comment,
and every line of the function, moved unchanged.

**Files modified:** `src/lib/device/session-copy.ts`. **Commit:** `c9073d3`.

### 2. [Rule 1 - Bug] `SAFE_PROMISE` is 126 characters, not 125

**Found during:** task 1, measuring.

**Issue:** 06-UI-SPEC's reservation arithmetic and 06-02-PLAN's table both give SAFE-01 as **125**
characters, and the plan's test 5 asks for `SAFE_PROMISE.length === 125`. The approved sentence is
**126**.

**Fix:** the **string** is what is authoritative and it is verbatim — a scripted substring match
against `06-UI-SPEC.md` itself confirms it, and `PICKER_EXPLAINER`'s stated 130 checks out to the
character in the same run, which is what makes this a miscount in the contract rather than a
transcription error here. The spec asserts **126**. Nothing about the 152px reservation changes: it
is a *measured* height at the 372px column, not a character-count computation, and one character does
not move a three-line box.

**Files modified:** `src/lib/device/session-copy.spec.ts`. **Commit:** `1aa79c4`.

### 3. [Rule 1 - Bug] `CHOOSER_NEVER_APPEARED_BODY` takes a real apostrophe where the spec has a typewriter one

**Found during:** task 1, when the verbatim scan reported the only `MISS`.

**Issue:** 06-UI-SPEC line 584 writes `Check the site's permissions` with U+0027, which contradicts
the Copywriting Contract three sections later in the same document: *"real apostrophes (`’`,
U+2019)"*.

**Fix:** U+2019, and the rest of the sentence is byte-identical — substituting U+0027 back makes the
substring match succeed at the same length of 153. The contract's own typography rule governs its own
table; the alternative was a shipped string that fails the module's own test 6.

**Files modified:** `src/lib/device/session-copy.ts`. **Commit:** `c9073d3`.

### 4. [Rule 2 - Missing critical functionality] Test 4 builds both blocks from both surfaces' labels

**Found during:** task 2, running negative check 4.

**Issue:** the plan's test 4 asserts `silentBlock(1.5, "TRY ON DEVICE").steps[1]` equals
`Click TRY ON DEVICE again and pick a different port`. Phase 4's defect was that exact string
hard-coded, so the assertion is satisfied **by the bug it exists to catch**. The source scan would
still have fired, but the behavioural half of the gate would have been vacuous in one direction.

**Fix:** both blocks are built from **both** labels, so the header's call is asserted to produce the
header's label. That is the assertion that actually went red.

**Files modified:** `src/lib/device/session-copy.spec.ts`. **Commit:** `1aa79c4`.

### 5. [Scope] `RECONNECT_OFFER` is 88 characters, not the 97 the plan hoped for

The plan wrote "**97** wanted — measure and record the real count". Measured: **88**. Recorded here,
asserted in test 5, and it makes the header note's reservation slightly easier rather than harder: 88
characters is two Body lines at the 372px column, and the region is sized by its longest candidate
(the 130-character pre-click line at three lines) either way.

### 6. [Process] Test 1 also asserts zero `import `, and test 6 also scans the raw source

Two assertions beyond the plan's letter, both free and both closing a hole the plan's own standing
rules describe: a bare side-effect import (`import "./x";`) contains neither `from "` nor `import(`,
and the engine-name ban applies to comments, which an exported-strings walk cannot see.

## Requirements

**`requirements-contributed: [CONN-02, CONN-03, CONN-05, CONN-08]`** — contributed, **not completed**.
Not one of them closes here, because every one of them is about what a visitor reads and no component
renders any of these strings yet:

- **CONN-02** (two distinct capability messages) gains both captions, the `CONNECT_LABEL` the two
  `failureCopy` calls interpolate, and the engine-name ban as an executable test. The messages
  themselves live in `transport.ts`; the surface that shows them is plan 06-10.
- **CONN-03** (the pre-click line) gains the 130-character sentence and the SAFE-01 promise beside it.
  The region that reserves 152px for them is plan 06-09.
- **CONN-05** (the empty picker) gains `Nothing listed?`, its three steps, the
  `The chooser never appeared?` disclosure and the two-step sentence. The disclosure is plan 06-08.
- **CONN-08** (the identity on screen) gains `identitySentence`, `identityDescription`, `moduleTail`
  and `multiModuleLine`. The slot that renders them is plan 06-10.

## What the next plan inherits

- The five-name block above, **verbatim, all five**. `BASE_E2E` is **61** in all fourteen SUMMARYs.
- `PREV_FILES` / `PREV_TESTS` for plan 06-03 are **67 / 700** — this plan's closing numbers.
- **`SessionPhase` is the union plan 06-03's session holds**, `starting` is what it initialises
  `phase` to, and `slotStateOf` is total over it with no `default`. Adding a phase means adding a
  `case` here and a row in `session-copy.spec.ts`'s `TABLE`, and both are compile errors until you do.
- `already-open` is **not** a `SessionPhase`. Plan 06-03 maps that `OpenFailure` key onto the
  `unknown` phase, which is how the UI spec folds it into the `unknown` row.
- **Nothing in this module may gain an import**, including `import type`. The header note's whole
  layout guarantee rests on it, and test 1 is the gate.
- `capabilityOf` is reachable from **both** `$lib/device/session-copy` (synchronously, import-free)
  and `$lib/device/try-on` (through the re-export). New callers should name `session-copy`; the
  re-export exists for the ones Phase 4 already wrote.

## Self-Check: PASSED

Files claimed created, verified present:

- `src/lib/device/session-copy.ts` — FOUND (440 lines)
- `src/lib/device/session-copy.spec.ts` — FOUND (382 lines)
- `.planning/phases/06-device-session/06-02-SUMMARY.md` — FOUND

Commits claimed, verified in `git log`:

- `c9073d3` feat(06-02): session-copy.ts - every word the session says, in a module that imports nothing — FOUND
- `1aa79c4` test(06-02): six gates over thirty strings, the seventeen-row table and the module's import-freedom — FOUND
- `f09ce22` refactor(06-02): capabilityOf moves to session-copy.ts and try-on re-exports it — FOUND

Claims verified by scan rather than by memory:

- `grep -rn MANAGED src e2e` — no match
- `grep -rn "about:policies" src e2e` — no match
- `git status --short` — clean at the close of task 3
