---
phase: 10-redesign
plan: 03
subsystem: ui
tags:
  [
    copywriting,
    retirements,
    sizing-twins,
    safe-01,
    conn-03,
    prev-03,
    caps,
    ch-per-line,
    requirements-amendment,
  ]

requires:
  - phase: 10-redesign
    plan: 01
    provides: CH_PER_LINE = 43, and the named list of literals that bind against it
  - phase: 10-redesign
    plan: 02
    provides: Inter Variable as the shipped body face, so the metrics CH_PER_LINE was measured against are the metrics rendering now
provides:
  - "SAFE_NOTE at 35 - SAFE-01's guarantee on the control, unconditional, in every state, on both surfaces that carry the primary"
  - "Nine retirements landed, each a named amendment with its pinning assertion rewritten in the same commit"
  - "HONESTY_CAP 86, PUT_BACK_CAP 129, KEEP_CAP 86 - the three caps as arithmetic over the measured CH_PER_LINE"
  - "Five reservations re-derived: header note 24px, honesty slot 48px, PUT BACK 72px, KEEP 48px, meters 56px"
  - "PUT BACK's headroom stated as a number: 28 characters, and the cap IS the line boundary"
  - "PREV_FILES 76, PREV_TESTS 787, PREV_E2E 89, PREV_CHECK 570 - the carry-forward block for 10-04 onward"
affects:
  [10-04, 10-05, 10-12, 10-13, 10-14, copywriting, sizing-twins, requirements]

tech-stack:
  added: []
  patterns:
    - "A named amendment asserts the ABSENCE as well as the presence: a retired export is held out of Object.keys(copy) by name, or a re-added constant slips back in silently"
    - "A literal that exceeds a measured cap is SHORTENED and the cap never rises; the amendment is recorded as a row asserted from BOTH sides - the contract's form present in a contract AND over the cap"
    - "A copy gate that reads its contract from disk reads EVERY approved contract that amends it, and asserts each was loaded and is approved"

key-files:
  created: []
  modified:
    - src/lib/device/session-copy.ts
    - src/lib/device/session-copy.spec.ts
    - src/lib/device/install-copy.ts
    - src/lib/device/install-copy.spec.ts
    - src/lib/ui/fidelity-line.ts
    - src/lib/tune/copy.ts
    - src/lib/tune/copy.spec.ts
    - src/lib/ui/FrontDoor.svelte
    - src/lib/ui/DeviceNote.svelte
    - src/lib/ui/DeviceDetails.svelte
    - src/lib/ui/TryOnDevice.svelte
    - src/lib/ui/PutBack.svelte
    - src/lib/ui/KeepOnDevice.svelte
    - src/lib/ui/CopyLink.svelte
    - src/lib/ui/device-ui.spec.ts
    - src/lib/ui/tune-ui.spec.ts
    - .planning/REQUIREMENTS.md
    - .planning/phases/10-redesign/deferred-items.md
  deleted:
    - src/lib/ui/PickerExplainer.svelte

key-decisions:
  - "Open item 1 shipped as form 1, the recommendation: SAFE_NOTE on the control. Forms 2 and 3 are costed below and each is one edit"
  - "HONESTY_READY ships at 85, not the contract's 90, because 90 is over a cap the measurement moved - and the amendment is asserted from both sides rather than excused"
  - "tryOnBudgetReason's worst form shortened 90 to 85 for the same reason, in the sentence around the interpolation so all three forms move together"
  - "LIVE_DETECTED is RECONNECT_OFFER rather than a second copy of it - R-08 shortened the offer onto the sentence the announcer was already speaking"
  - "CopyLink's aria-describedby now follows the fallback line: R-07 removed the id it pointed at unconditionally"
  - "CONN-03's traceability row amended by name too, not only SAFE-01's: it named the 130-character line as the mechanism"

patterns-established:
  - "Z-08-shaped invariants are scanned over the whole of src/ with comments stripped, with any expected non-offender named and justified in the assertion"
  - "A negative check whose expected outcome is green is worth running twice: once as planned, and once with the new assertion removed, to prove which of the two states it describes"

requirements-completed: [PREV-03]
requirements-amended: [SAFE-01, CONN-03]

duration: 75min
completed: 2026-09-08
---

# Phase 10 Plan 03: Nine retirements and five reservations Summary

**Nine copy retirements landed, SAFE-01's guarantee moved from an 88-character paragraph in two
places to a 35-character line on the control in every state, and all five sizing reservations
re-derived from `CH_PER_LINE = 43` — two of them moving (152px → 24px, 72px → 48px), two holding at
the same number under a different face, and one that arithmetic says cannot move at all. Zero test
counts moved: 76 files / 787 tests, in and out.**

## Performance

- **Duration:** ~75 min
- **Completed:** 2026-09-08
- **Tasks:** 3
- **Files created:** 0 · **Files modified:** 18 · **Files deleted:** 1

---

## THE ELEVEN-NAME BLOCK, CARRIED

| Name              | Carried in | Leaves as    | Note                                                        |
| ----------------- | ---------- | ------------ | ----------------------------------------------------------- |
| `BASE_FILES`      | **74**     | **74**       | frozen at 10-01                                             |
| `BASE_TESTS`      | **780**    | **780**      | frozen at 10-01                                             |
| `PREV_FILES`      | **76**     | **76**       | **+0** — this plan adds no spec file                        |
| `PREV_TESTS`      | **787**    | **787**      | **+0** — assertions rewritten, never added                  |
| `BASE_SWEEP`      | **`4 19`** | **`4 19`**   | not run; this plan touches no sweep input                   |
| `BASE_SWEEP_WALL` | **123 s**  | **123 s**    | unchanged                                                   |
| `PREV_SWEEP_WALL` | **123 s**  | **123 s**    | unchanged                                                   |
| `BASE_E2E`        | **89**     | **89**       | frozen at 10-01                                             |
| `PREV_E2E`        | **89**     | **89**       | re-measured, `--workers 3`, **89 passed**, 1.6 min          |
| `BASE_CHECK`      | **571**    | **570**      | **−1**: `PickerExplainer.svelte` deleted. Always 0 / 0      |
| `CH_PER_LINE`     | **43**     | **43**       | spent, not re-measured                                      |
| `FONT_SRC`        | **(b)**    | **(b)**      | untouched                                                   |

`BASE_CHECK` is the one carried name that moves, and it moves by exactly the one file this plan
deletes. `npm run check` prints one line, as 10-01 recorded it must:
`COMPLETED 570 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.

---

## The nine retirements, with before and after counted by script

Every count is `[...s].length` over the exact literal, read out of the tree by a script, before and
after. Not one was counted by eye.

| #    | String                     | Before  | After   | Where the amendment is recorded                          |
| ---- | -------------------------- | ------- | ------- | -------------------------------------------------------- |
| R-01 | front door headline        | **30**  | **32**  | `FrontDoor.svelte`, comment beside the element           |
| R-02 | `PICKER_EXPLAINER`         | **130** | **—**   | `session-copy.ts`, a block where the export was          |
| R-03 | `SAFE_PROMISE`             | **88**  | **—**   | replaced by `SAFE_NOTE` at **35**                        |
| R-04 | `FIDELITY_LINE`            | **231** | **44**  | `fidelity-line.ts`, the doc comment on the constant      |
| R-05 | `HONESTY_NO_SESSION`       | **106** | **70**  | `install-copy.ts`, the doc comment on the constant       |
| R-06 | `HONESTY_READY`            | **104** | **85**  | see the measured amendment below — the contract says 90  |
| R-07 | `SHARE_QUIET_LINE`         | **68**  | **—**   | `tune/copy.ts`, a block where the export was             |
| R-08 | `RECONNECT_OFFER`          | **88**  | **37**  | `session-copy.ts`, the doc comment on the constant       |
| R-09 | `KEPT_PROOF_LINE`          | **124** | **53**  | `install-copy.ts`, the doc comment on the constant       |
| —    | `SAFE_NOTE` (new)          | —       | **35**  | `session-copy.ts`, a contract block of its own           |
| —    | `tryOnBudgetReason` worst  | **90**  | **85**  | shortened to fit `HONESTY_CAP`; see below                |

**R-01's before-count is 30, not the 32 the register implies** — `You’ve got to start somewhere…` is
30 code points with a real U+2019 and a real U+2026. The replacement is **32**, so the headline got
two characters longer and lost twelve pixels of height: it was Body at 16px / 1.5 (a 24px line box)
and is now Micro at 12px / 1.2 (a 14px line box). Measured on the shipped page by the e2e degrade
dump: `"headline":{"top":160,"h":14}`.

**Total prose removed from the site: 618 characters**, summed by the same script.
30 + 130 + 88 + 231 + 106 + 104 + 68 + 88 + 124 = **969 retired**; 32 + 35 + 44 + 70 + 85 + 37 + 53 =
**356 written back**; net **613**, plus the five characters `tryOnBudgetReason`'s worst form lost.

### The three new literals, printed by the script that counted them

```
  35  SAFE_NOTE            Nothing is written without a click.
  37  RECONNECT_OFFER      ZONA detected. One click connects it.
  32  FrontDoor headline   PICK ONE · IT IS ALREADY RUNNING
```

### The four rewritten ones, likewise

```
  44  FIDELITY_LINE        Every pad here runs the firmware’s own code.
  70  HONESTY_NO_SESSION   Connects to your ZONA and writes this into its memory. About a second.
  85  HONESTY_READY        Writes this into your ZONA’s memory in about a second. A power cycle puts yours back.
  53  KEPT_PROOF_LINE      The pad restarts once as it loads the stored version.
  85  tryOnBudgetReason(Setup and Timer)
      Over the 908-character budget on Setup and Timer. Turn something down and it returns.
```

`tryOnBudgetReason`'s other two forms are 75 each.

---

## The two literals the measurement forced shorter, and what was done instead of raising a cap

10-01 named them: at `CH_PER_LINE = 43`, `HONESTY_CAP` is `2 × 43 = 86`, and two strings authored at
**90** in the approved contract are four characters over.

| Literal | Contract form | n | Shipped form | n | What moved |
| ------- | ------------- | - | ------------ | - | ---------- |
| `HONESTY_READY` | `Writes this into your ZONA’s memory in about a second. A power cycle brings your own back.` | **90** | `Writes this into your ZONA’s memory in about a second. A power cycle puts yours back.` | **85** | two words: `brings` → `puts`, `your own` → `yours` |
| `tryOnBudgetReason` worst | `Over the 908-character budget on Setup and Timer. Turn something down and this comes back.` | **90** | `Over the 908-character budget on Setup and Timer. Turn something down and it returns.` | **85** | `and this comes back` → `and it returns`, in the sentence around `${events}` so all three forms move together |

**Neither cap was raised, and the reason is written into `install-copy.ts` where the next person to
be tempted will read it:** a cap widened to admit its own string stops reserving anything, and the
reservation is the entire reason the cap exists.

**`HONESTY_READY`'s amendment is asserted from both sides rather than excused.**
`install-copy.spec.ts` test 2 requires every literal over forty characters to appear verbatim in an
approved contract. The shipped 85-character form appears in neither, by construction. Rather than
silently exempting the name, the spec carries an `AMENDED_BY_MEASUREMENT` row that asserts:

1. the **contract's** 90-character form is present in one of the two approved contracts — so the row
   being amended is real and still says what it says; and
2. the contract's form is **over** the cap — so the shortening is proved necessary rather than
   convenient; and
3. the **shipped** form is under it.

Delete the row and test 2 goes red on the shipped string. Fake the row and test 2 goes red on the
contract's. It is the same shape as an archive exclusion checked from both sides.

`tryOnBudgetReason` needs no such row: `tune/copy.spec.ts` pins its three forms as literals and does
not read a contract from disk. It gained a cap assertion instead, with the arithmetic written out
(`2 × 43 = 86`) because that module cannot import `install-copy.ts` — both are import-free by
contract.

---

## The five reservations, with their formulas substituted

`ceil(longest / CH_PER_LINE) × 24`, at the measured **43**.

| Reservation | Declared at | Was | Longest now | Substituted | Becomes | Moves? |
| ----------- | ----------- | --- | ----------- | ----------- | ------- | ------ |
| **header note** | `DeviceNote.svelte`, `.cell` | **152px** (3 + 3 boxes + 8px) | `RECONNECT_OFFER` **37** | `ceil(37 / 43) × 24` | **24px**, one cell | **−128px** |
| **honesty slot** | `TryOnDevice.svelte`, `.honesty` | **72px** | `HONESTY_READY` / worst `tryOnBudgetReason`, both **85** | `ceil(85 / 43) × 24` | **48px** | **−24px** |
| **`PUT BACK` cell** | `PutBack.svelte`, `.cell` | **72px** | `PUT_BACK_LINE_AFTER_KEEP` **101** | `ceil(101 / 43) × 24` | **72px** | no |
| **`KEEP` cell** | `KeepOnDevice.svelte`, `.cell` | **48px** | `KEEP_LINE_ENABLED` **82** | `ceil(82 / 43) × 24` | **48px** | no |
| **meters block** | `TuningRegion.svelte`, asserted `tune-ui.spec.ts:344` | **56px** | — | `(14 + 4 + 8) × 2 + 4` | **56px** | no, and it cannot |

And the caps:

| Cap | Formula | Was | Is |
| --- | ------- | --- | -- |
| `HONESTY_CAP` | `2 × 43` | 129 | **86** |
| `PUT_BACK_CAP` | `3 × 43` | 129 | **129** |
| `KEEP_CAP` | `2 × 43` | 86 | **86** |

**Two of the three caps land byte-for-byte on the constants Phase 7 shipped**, which is 10-UI-SPEC
§12.2's table surviving the measurement intact. What moved is copy, not layout.

**`CLEAR_CAP` is not here.** `install-copy.ts` carries three caps and the comment says
three-becoming-four in 10-12, with `CLEAR_LINE`'s zero headroom flagged where 10-12 will read it.

### The two twins that do not move, derived out loud

**`ChosenPanel.svelte:217`, `min-block-size: 152px`, and `tune-ui.spec.ts:344`, `block-size: 56px`,
are byte-unchanged.** `git diff --stat HEAD -- src/lib/ui/ChosenPanel.svelte` prints nothing, and
`sed -n '344p' tune-ui.spec.ts` still prints the 56px message on line 344 — the honesty edit is at
348-349 and moved nothing above it.

The meters derivation, re-done: `(14 + 4 + 8) × 2 + 4 = 56`. 14px is the **fixed line box** on every
12px line inside the region, 4px the label-to-numeral gap, 8px the row gap, twice for two meters,
plus the 4px bar. **Not one term in that expression is a character count**, which is why the face
change cannot move it — `CH_PER_LINE` does not appear in it at all. 12px Inter in a 14px box is a
1.167 ratio, legible and unchanged in effect. This is the one sizing twin the deletions do not
collapse, and 10-UI-SPEC §12.2 asks for it said out loud, which is what this paragraph is.

The tuning region's 152px is the other half of Phase 4's arithmetic and is likewise not a character
count.

### `SAFE_NOTE` is asserted NOT to be a twin

`device-ui.spec.ts` holds four things about it in `TryOnDevice.svelte`: it is rendered exactly once;
it is named exactly twice in the file (the import and the render, nothing else); its own CSS rule
declares no `grid-area`; and the element rendering it carries no `class:twin`, no `aria-hidden` and
no `{#if}`. In the header note it renders once too, and there its hidden form is the never-both rule
rather than a sizing twin — the distinction is written into `DeviceNote.svelte`'s header in its own
paragraph, because nothing is ever swapped into its line; it is hidden only while the panel is
saying the same sentence eight pixels lower, and it holds its own height while hidden so the header
does not jump when a panel opens.

---

## SAFE-01: what shipped, and what the two reversals cost

**Shipped: form 1**, the spec's recommendation.
`SAFE_NOTE = "Nothing is written without a click."` (**35**), Micro (title) — `--font-sans`, 12px,
600, a 14px line box, 0.01em, sentence case — in `--color-ink` at 9.26:1 because a safety statement
is not quiet, 8px beneath the primary and above the honesty slot. **Unconditional, never swapped,
never a sizing twin.**

**It is on the screen in strictly more places than the paragraph it replaces.** `SAFE_PROMISE`
rendered in the header note in three of the nine slot states (S1, S2, S7) and inside the device
disclosure, which is a `<details>` a visitor had to open. `SAFE_NOTE` renders beneath the primary on
the chosen panel in **every** state — idle, connecting, writing, kept, every one of the seven
failure blocks, and on a browser that cannot write at all — and beneath the header's device slot in
all seven states the note renders in, hidden only where the panel is already saying it.

### The reversals, costed

**Form 2 — move the 88-character sentence into the device disclosure.** One edit, in
`DeviceDetails.svelte`: restore `SAFE_PROMISE` to `session-copy.ts`, put `<p class="body">{SAFE_
PROMISE}</p>` back at the S4 branch where the comment now marks its place, and delete `SAFE_NOTE`
with its two render sites (`TryOnDevice.svelte`'s one `<p class="safe-note">` and its rule;
`DeviceNote.svelte`'s one `<p class="safe-note">` and its rule). `session-copy.spec.ts` test 5
swaps its two absence assertions back for the 88-character literal and its length.
**Cost: 4 files, and SAFE-01 becomes false as written** — the requirement says *the connect screen*,
and a disclosure nobody opens is not the connect screen. The `REQUIREMENTS.md` row would have to say
so.

**Form 3 — retire SAFE-01's second clause explicitly.** One edit, in `REQUIREMENTS.md`: replace the
2026-09-08 amendment on row 169 with a dated retirement note, in the shape Phase 7 used twice, and
delete `SAFE_NOTE` and its two render sites as in form 2. **Cost: 4 files, and the honest one** — it
is the only form that does not pretend the guarantee is still stated.

Both reversals leave the header note at 24px: the note's collapse is R-02's and R-03's jointly, and
R-02 alone takes 130 characters out of a cell that then holds nothing longer than 37.

---

## `REQUIREMENTS.md`, amended by name and dated 2026-09-08

Three rows moved. **The "three clicks" clause and the "eight needles" figure on SAFE-01's row were
NOT touched** — both are 10-12's, and `session.spec.ts`'s needle list is nine today rather than
eight, which is the staleness 10-12 corrects by name.

- **SAFE-01** — the `SAFE_PROMISE` clause only, amended: the mechanism is `SAFE_NOTE`, 35
  characters, on the control, in every state, on both surfaces that carry the primary. Stays `[x]`.
- **CONN-03** — amended too, and this was not in the plan's task list. Its closure record named *"the
  130-character pre-click line"* as the mechanism, and R-02 retires that line, so leaving the row
  would have left a claim about a string that no longer exists. The amendment records that the
  browser's own chooser satisfies the explanatory half and `SAFE_NOTE` the consequential half, and
  that the Firefox two-step sentence, `Nothing listed?` and the blocked-ports disclosure are
  untouched because R-11's audit rule never retires a next step.
- **PREV-03** — `[ ]` → `[x]`, row `Pending` → **Complete at 44 characters**, with the second clause
  (`what it cannot show`) retired by name and the retirement's reason recorded: it named no risk, no
  consequence, no way back and no next step, and a wall of thirty-six animating pads demonstrates
  the limits of a screen better than a sentence apologising for them.

**SAFE-02 and SHARE-01 were deliberately not moved**, though the plan's frontmatter lists them.
Neither row names a retired string: SAFE-02's record is about tier, size and enablement (D-04's
sequence work is 10-12's) and SHARE-01's is about the base36 stamp, which R-07 does not touch.
Ticking or rewriting either would claim work this plan did not do.

---

## R-11's protected set, untouched, and the rule quoted where it will be read

`TWO_STEP`, `PERMISSION_DECLINED`, `NOTHING_LISTED` and its three steps,
`CHOOSER_NEVER_APPEARED_BODY`, `PUT_BACK_LINE`, `PUT_BACK_LINE_AFTER_KEEP`, `PUT_BACK_NEEDS_ZONA`,
`KEEP_LINE_ENABLED` and all six `KEEP_REASONS`, the seven failure blocks with every detail and every
step, `SHARE_FALLBACK_LINE`, `REPLUG_OFFER`, `REVOKE_EXPLANATION`, both snapshot lines and
`WRITE_LOCK_REASON` — all whole, all still asserted character-for-character by their own specs.

The audit rule is quoted in full in two places a later reader reaches from the code rather than from
a planning document: `session-copy.ts`, where `PICKER_EXPLAINER` used to be, and `tune/copy.ts`,
where `SHARE_QUIET_LINE` used to be.

> A string is retired only when the control beside it, or the pixels beside it, already say the same
> thing. A string that names a risk, a consequence, a way back or a next step is never retired,
> however long it is.

---

## Z-08, turned from a comment into a gate

`install-copy.ts:127` has said since Phase 7 that *"About a second" appears in the first two and
nowhere else on the site*. Both of those strings are rewritten by this plan, so the claim is now
asserted rather than inherited, in three ways:

1. **exactly two occurrences in `install-copy.ts`**, comments stripped;
2. **both of the two honesty strings still carry it**, so it cannot be lost from one and doubled in
   the other; and
3. **a walk over the whole of `src/`**, `.ts` and `.svelte`, comments stripped, `*.spec.ts`
   excluded — a copy gate has to quote the sentence it pins, so including them would forbid the
   mechanism.

The walk asserts an exact map, and it has **one expected row that is not an offender**:

```
{ "lib/device/install-copy.ts": 2, "routes/dev/type/+page.svelte": 1 }
```

`/dev/type/` is the unlinked type probe 10-01 measured `CH_PER_LINE` on, and its copy of the
sentence is the contract's 90-character form — the exact string those line-box occupancies were
taken against. **Rewriting it to the shipped 85 would falsify the record of what was measured**, so
it is named in the assertion with that reason and logged in `deferred-items.md` beside 10-02's note
about retiring the probe.

The comparison is **case-insensitive**, deliberately: the no-session form opens a sentence with
`About a second.` and the ready form carries `in about a second` mid-sentence. Z-08 is about the
phrase, not the capital, and a case-sensitive count would have read 1 and passed for the wrong
reason.

---

## Task Commits

1. **Task 10-03-01: the session surface** — `be1465f` (feat). R-01, R-02, R-03, R-08, `SAFE_NOTE`,
   `PickerExplainer.svelte` deleted, `REQUIREMENTS.md` SAFE-01 and CONN-03.
2. **Task 10-03-02: the install and share surfaces** — `cc3b117` (feat). R-04, R-05, R-06, R-07,
   R-09, the three caps, Z-08's gate, `REQUIREMENTS.md` PREV-03, `deferred-items.md`.
3. **Task 10-03-03: the five reservations** — `f074d0a` (feat). Four cells, two specs, the
   not-a-twin assertions.

---

## Negative checks — four planned, five observed

| #   | Perturbation                                                                                | Test                                                | Exit | Message                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1a  | `SAFE_PROMISE` restored as an export and rendered in `DeviceNote`                            | `session-copy.spec.ts` test 5                        | 1    | *"SAFE_PROMISE came back - it is retired by R-03 and replaced by SAFE_NOTE, which is 35 characters on the control rather than 88 in a paragraph"*                              |
| 1b  | the same, plus the note's cell back to 152px (the half the plan defers to the end of task 3) | `device-ui.spec.ts` test 10, **and** 1a again        | 1    | *"the header note's cell no longer reserves 24px - ceil(37 / 43) x 24 = 24, where 37 is RECONNECT_OFFER … and 43 is the CH_PER_LINE plan 10-01 measured in Inter"*             |
| 2   | `HONESTY_READY` lengthened by three characters (85 → 89)                                     | `install-copy.spec.ts` test 3                        | 1    | *"HONESTY_READY is over the honesty cap: expected 89 to be less than or equal to 86"*                                                                                          |
| 3   | `SHARE_QUIET_LINE` restored as an export with no render site                                 | `tune/copy.spec.ts` — **red, where the plan said green** | 1 | *"SHARE_QUIET_LINE came back - it is retired by R-07 and COPY LINK names itself"*                                                                                              |
| 3b  | the same, **and** the new absence assertion removed                                          | the whole quick suite                                | **0** | **76 files, 787 tests, 0 failures** — the finding the plan predicted, proved on the whole suite                                                                                |
| 4   | `PUT_BACK_LINE_AFTER_KEEP` lengthened to 140 (101 → 140)                                     | `install-copy.spec.ts` test 3                        | 1    | *"PUT_BACK_LINE_AFTER_KEEP is over the PUT BACK cap: expected 140 to be less than or equal to 129"*                                                                            |
| 4a  | the same, at 102 only                                                                        | `device-ui.spec.ts` — **green, and correctly so**    | 0    | see the headroom finding below                                                                                                                                                |

**Check 3 came back red where the plan expected green, and the reason is that this plan closed the
hole in the same commit.** So it was run a second way, with the new assertion removed as well: the
entire quick suite is then **76 files / 787 tests / 0 failures** with a retired user-facing string
re-exported and unrendered. That is the plan's finding, proved on the whole suite rather than on one
file. The general case — neither copy module enumerates its exports against a closed list — is
logged in `deferred-items.md` as 10-12's, because closing it moves test counts and this plan's
contract fixes those at +0 / +0.

### The `PUT BACK` headroom, stated as a number: **28 characters**

Check 4 was run at 102 first, as the plan writes it. At 102, `ceil(102 / 43)` is still **3**, so the
string does not cross a line boundary and `device-ui.spec.ts` stays green — **as it must**: the cell
assertion reads a static CSS declaration, and no string length can move it. What went red at 102
were the contract-containment check and the exact-101 assertion, which is a different gate doing a
different job.

Lengthening further: at **127** it is still three lines and still under the cap. At **140** it is
four lines and the cap fires by name. **The boundary and the cap are the same number**: three lines
at 43 is 129, and `PUT_BACK_CAP` is 129. So `PUT_BACK_LINE_AFTER_KEEP` has **28 characters of
headroom** (101 → 129), and the first character that would force a fourth line is the first
character over the cap. A later plan touching that string needs no other check than the cap.

**Restoration, byte-identical, stated rather than assumed.** Every perturbed file's sha256 was taken
before and after and compared:

- `src/lib/device/session-copy.ts` — `84ec1ac9a9ab5adac32edd8c20bb27d2438306f588033bcb6b9e8baa92601558`
  before and after checks 1a and 1b.
- `src/lib/ui/DeviceNote.svelte` — `8bd33d50…` before and after check 1a (pre-task-3 state);
  `cb92d0f2…` before and after the task-3 152px check; `732f1424…` before and after check 1b.
- `src/lib/device/install-copy.ts` —
  `12b293966ae7614fcf811e0b53f86b876bc1743c4862615684429660c7153572` before and after checks 2 and 4.
- `src/lib/tune/copy.ts` — `5b27924aa435526f076ca6e92b71c9fb85e9ddc667c67b66f68f1c55b2471bbf`
  before and after check 3.
- `git diff --quiet` exit **0** after the last restore, and `git status --porcelain` empty.

`git checkout --` was used only for check 1b, and only because both files were committed and clean
at that point.

---

## Verification

| Gate | Result |
| ---- | ------ |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | one line: `COMPLETED 570 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run lint` | clean — Prettier and ESLint |
| `npm run test:quick … check-counts.mjs 76 787` | *"observed 76 files, 787 tests passed, 1 todo … matches the expected counts"* — **+0 / +0** |
| per-file | `session-copy.spec.ts` **6**, `install-copy.spec.ts` **6**, `tune/copy.spec.ts` **6**, `device-ui.spec.ts` **11**, `tune-ui.spec.ts` **5** |
| `npm run build` | green; `source-cc3b117….tar.gz` 1,238 KB, `THIRD-PARTY.md` and `licenses/` copied |
| `npm run test:quick` after the build | 76 / 787 again |
| `npx playwright test --workers 3` | **89 passed**, 1.6 min — `PREV_E2E` unchanged |
| `git diff --stat HEAD -- src/vendor/ src/lib/ui/ChosenPanel.svelte src/lib/ui/Coverflow.svelte` | empty |
| `git status --porcelain` | empty. `test-results/` removed by hand |

### The plan's `grep` verification, reconciled rather than smoothed

The plan asks that
`grep -rn "PICKER_EXPLAINER\|SAFE_PROMISE\|SHARE_QUIET_LINE\|PickerExplainer" src` print **nothing**,
and it also requires that every retirement be a named amendment recorded where a later reader finds
it. **Those two cannot both be literally true**, and the second is the one that matters. The
reconciliation is a comment-stripped walk over `src/`, which finds **seven lines, all of them in
tests, all of them assertions that the name is ABSENT**:

```
session-copy.spec.ts:306-307   not.toContain("PICKER_EXPLAINER")
session-copy.spec.ts:310-311   not.toContain("SAFE_PROMISE")
tune/copy.spec.ts:283-284      not.toContain("SHARE_QUIET_LINE")
device-ui.spec.ts:170          "six components were listed - seven until R-02 retired PickerExplainer.svelte"
```

**No live code names any of the four.** No export, no import, no render site, no component file.

---

## Decisions Made

1. **Open item 1 ships as form 1** — `SAFE_NOTE` on the control. Both reversals are costed above at
   four files each, and both were kept to one edit per surface so the user can rule differently
   cheaply.
2. **`HONESTY_READY` at 85 and `tryOnBudgetReason` at 85**, against a contract that authors both at
   90. The cap never moves. The `HONESTY_READY` amendment is a spec row asserted from both sides;
   `tryOnBudgetReason` needs none because its spec pins literals rather than reading a contract.
3. **`LIVE_DETECTED` is `RECONNECT_OFFER`**, not a second copy of it. R-08 shortened the offer onto
   exactly the sentence the announcer already spoke, and `fidelity-line.ts`'s own rule — a claim the
   site makes twice can drift — applies to a module's two exports as much as to two files.
4. **`install-copy.spec.ts` reads two contracts, not one.** A gate that reads its specification from
   disk has to read every approved document that amends it, and has to assert each was loaded and is
   approved, or a failed read is a gate that passes everything.
5. **The header note's cell declares its floor as well as measuring it.** Phase 6 deliberately left
   the note's height to the browser. That is still true of the *content*, but a declared floor is
   what lets a test hold the collapse, and it is what the other three cells already do.
6. **CONN-03's traceability row was amended**, which the plan did not ask for. Its record named the
   retired string as the mechanism.
7. **Z-08's site-wide scan names its one non-offender rather than excluding a directory.** An
   allowlist with a reason is auditable; a `routes/dev/` exclusion is a hole.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — blocking] `install-copy.spec.ts` test 2 reads one contract, and three of this plan's
sentences are in another**

- **Found during:** Task 10-03-02
- **Issue:** Test 2 requires every literal over forty characters to appear verbatim in
  `07-UI-SPEC.md`. R-05, R-06 and R-09 author their new forms in `10-UI-SPEC.md` §13.3, so the task
  could not be completed without either weakening the gate or reading the second document.
- **Fix:** `UI_SPECS` is now a two-row list, each row carrying the path and the heading that proves
  it is the document it claims to be; both are asserted non-empty, correctly-headed and
  `status: approved`, and containment is `some`.
- **Files modified:** `src/lib/device/install-copy.spec.ts`
- **Committed in:** `cc3b117`

**2. [Rule 3 — blocking] `HONESTY_READY` cannot appear in any approved contract**

- **Found during:** Task 10-03-02
- **Issue:** The contract's form is 90 and the cap is 86, so the shipped form is by construction not
  in any spec. Test 2 would be red on correct code.
- **Fix:** `AMENDED_BY_MEASUREMENT`, asserted from both sides (contract form present AND over the
  cap) rather than an exemption list. Deleting the row is red; faking it is red.
- **Files modified:** `src/lib/device/install-copy.spec.ts`, `src/lib/device/install-copy.ts`
- **Committed in:** `cc3b117`

**3. [Rule 2 — missing critical functionality] `CopyLink`'s `aria-describedby` pointed at an id R-07
removed**

- **Found during:** Task 10-03-02
- **Issue:** The button carried `aria-describedby="copy-link-line"` unconditionally, and the
  paragraph holding that id rendered `SHARE_QUIET_LINE` in the normal state and
  `SHARE_FALLBACK_LINE` in the fallback. Retiring the quiet line leaves the paragraph with nothing
  to say in the normal state; leaving the attribute would point it at an element not in the
  document, which is worse than no description at all.
- **Fix:** The paragraph renders only in the fallback, and `aria-describedby` is conditional on the
  same flag. In the normal state the button's accessible name is its visible label, which names
  itself — R-07's whole argument.
- **Files modified:** `src/lib/ui/CopyLink.svelte`
- **Committed in:** `cc3b117`

**4. [Rule 1 — bug] `REQUIREMENTS.md`'s CONN-03 row claimed a string that no longer exists**

- **Found during:** Task 10-03-01
- **Issue:** The plan's action 7 names SAFE-01's row only. CONN-03's row closes the requirement with
  *"the 130-character pre-click line beneath the header row in every not-connected state"* — a
  sentence about `PICKER_EXPLAINER`, which R-02 retires. Landing R-02 without touching that row
  would have left the requirements record asserting a false thing about the shipped tree.
- **Fix:** Amended by name and dated, in the same shape as SAFE-01's, recording what carries each
  half of the requirement now and naming the three strings R-11 protects that were NOT retired with
  it.
- **Files modified:** `.planning/REQUIREMENTS.md`
- **Committed in:** `be1465f`

**5. [Rule 3 — blocking] `device-ui.spec.ts`'s component lists count a deleted file**

- **Found during:** Task 10-03-01
- **Issue:** `DEVICE_COMPONENTS` asserts its own length is 7 and checks every name against the
  directory. Deleting `PickerExplainer.svelte` makes test 1 red on a listed file that is not on
  disk.
- **Fix:** Six and three, with the retirement named in both doc comments and in test 1's failure
  message, so the count moving is the amendment being visible rather than a number quietly edited.
- **Files modified:** `src/lib/ui/device-ui.spec.ts`
- **Committed in:** `be1465f`

**6. [Rule 1 — bug] `LIVE_DETECTED` became a duplicate literal**

- **Found during:** Task 10-03-01
- **Issue:** R-08's new `RECONNECT_OFFER` is character-for-character the sentence `LIVE_DETECTED`
  already held. The duplication is created by this plan's own edit.
- **Fix:** `LIVE_DETECTED = RECONNECT_OFFER`. Same export name, same value, no caller affected, and
  `session-copy.spec.ts` asserts the two are one so a later edit to either cannot separate them.
- **Files modified:** `src/lib/device/session-copy.ts`, `src/lib/device/session-copy.spec.ts`
- **Committed in:** `be1465f`

**7. [Rule 2 — missing critical functionality] Z-08 was a comment, not a gate**

- **Found during:** Task 10-03-02
- **Issue:** The plan asks Z-08 to be asserted by script. The shipped suite had one export-level
  check (`about a second appears only in the honesty slot`) and no source-level or site-level one,
  and this plan rewrites both strings the invariant is about.
- **Fix:** Three assertions — the occurrence count in the module's stripped source, the presence in
  each of the two strings, and the site-wide walk with its one named non-offender.
- **Files modified:** `src/lib/device/install-copy.spec.ts`
- **Committed in:** `cc3b117`

---

**Total deviations:** 7 auto-fixed — 2 × Rule 1 (bug), 2 × Rule 2 (missing critical functionality),
3 × Rule 3 (blocking).
**Impact on plan:** No scope creep and no file outside the plan's eighteen. Three of the seven (1, 2,
5) are gates that would have been red on correct code; two (3, 4) are claims that would have become
false the moment the retirement landed; two (6, 7) close holes this plan's own edits opened or
exposed. Nothing in the plan's objective was dropped.

---

## Issues Encountered

**The plan's `grep` verification and its "named amendment" requirement contradict each other**, and
the contradiction is recorded above rather than resolved by deleting comments. The stricter and more
useful reading — no *live code* names a retired identifier — is what was verified, with a
comment-stripped walk whose output is quoted in full.

**Check 3's expected outcome was wrong in a way worth keeping.** The plan predicted green and
reasoned correctly about the shipped tree; the check came back red because the fix landed in the
same commit. Running it a second way, with the new assertion removed too, is what turned a
contradicted prediction into a measured finding about the whole suite.

**Nothing else.** No test was retried, no run was flaky, and every number in this document came from
a runner's, a build's or a script's own output in this session.

---

## Notes for the plans that follow

- **10-04** inherits `PREV_FILES 76` / `PREV_TESTS 787` / `PREV_E2E 89` / `BASE_CHECK 570`. Note the
  check figure moved by one: `PickerExplainer.svelte` is gone.
- **10-05** owns R-10, `RESTS_DARK_NOTE`, the tenth retirement. The register is then closed at ten.
- **10-12** owns four things this plan named and did not do: `CLEAR_CAP` at **86** (`CLEAR_LINE` is
  exactly 86, zero headroom, one added character breaks it); `install-copy.ts`'s comment going from
  three caps to four; SAFE-01's *"three clicks"* clause and `session.spec.ts`'s nine-needle list,
  which `REQUIREMENTS.md` still calls eight; and the export-exhaustiveness hole in both copy modules,
  logged in `deferred-items.md` and best closed in the same commit that adds CLEAR's strings.
- **`PUT_BACK_LINE_AFTER_KEEP` has 28 characters of headroom**, and the cap is the line boundary. Any
  plan touching it needs only `install-copy.spec.ts` test 3.
- **Anyone tempted to raise a cap** should read `install-copy.ts`'s header first: a cap widened to
  admit its own string stops reserving anything.
- **`/dev/type/`**, when it is finally retired, takes a row out of `install-copy.spec.ts` test 3's
  Z-08 map with it.

## User Setup Required

None. No agent connected to a device, opened a serial port, wrote to a module or deployed anything in
this plan.

## Next Phase Readiness

Wave 3 is complete. Nine of the phase's ten retirements are landed, every reservation on the device
surface is the output of a measured number rather than a provisional one, and the two that could not
move are shown to hold with their derivations written out. **10-04 is unblocked**, and it inherits
one open item from 10-02 rather than from this plan: a colour authored inside a component `<style>`
is still invisible to every gate the site has, and re-running 10-02's negative check 4 is the
cheapest proof that `aesthetic.spec.ts`'s new scans closed it.

---

_Phase: 10-redesign_
_Completed: 2026-09-08_

## Self-Check: PASSED

All eighteen modified files and this SUMMARY are on disk; `src/lib/ui/PickerExplainer.svelte` is
absent, as claimed. All three commit hashes resolve in `git log`: `be1465f`, `cc3b117`, `f074d0a`.

Every character count, pixel number, test count, exit code, sha256 and failure message quoted above
was read from a script's, a runner's or a build's own output in this session. The two places where
this plan's result disagrees with a document — `HONESTY_READY` shipping at 85 against the approved
contract's 90, and negative check 3 coming back red where the plan predicted green — are stated as
disagreements and given their reasons rather than smoothed. The plan's `grep` verification and its
"named amendment" requirement are reconciled in the open rather than by choosing one and not saying
so.
