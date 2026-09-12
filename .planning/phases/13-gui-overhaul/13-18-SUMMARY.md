---
phase: 13-gui-overhaul
plan: 18
subsystem: device-copy
tags: [copy-batch, d-05, d-23, install-copy, session-copy, honesty-caps-retired, page-numbering, six-transfer-lines, register, section-16, section-9, safe-01, safe-05, safe-06, safe-07, conn-02, degr-02]

# Dependency graph
requires:
  - phase: 13-gui-overhaul
    plan: 17
    provides: "install-copy.ts's five-string sentences and the two bodies still naming three; seven ledger rows and five questions under From 13-17; PREV_FILES 94 / PREV_TESTS 961"
  - phase: 13-gui-overhaul
    plan: 12
    provides: "page-target.ts's pageName, putBackPageLine and the two D-05 labels (SWITCH_PAGE_LABEL, KEEP_PAGE_LABEL) in install-copy.ts; the page-numbering question"
  - phase: 13-gui-overhaul
    plan: 11
    provides: "the device band re-homed - the header's box, Device actions, the bar's device clause - with Phase 10's words in the Bible's places and the identity's move named"
  - phase: 12.1-gradient-touch
    plan: 08
    provides: "the KEEP confirmation naming the page's scripts (AMENDED_BY_THE_FOURTH_SCRIPT) and SNAPSHOTTING_BODY / identifiedBody left naming three - the fifth fact for the trace"
provides:
  - "13-18-BATCH.md: every string the Bible never wrote, in one table of 262 rows with the state it names, the fact it must carry, Phase 10's string and a proposal - answered 'approve' (13-CONTEXT D-23)"
  - "install-copy.ts (56 exports) and session-copy.ts (49) under D-05: the Bible's lines verbatim, the batch's lines as approved, pages numbered from one, the six transfer titles kept six, the four facts and 12.1's fifth carried"
  - "install-copy.spec.ts and session-copy.spec.ts at six each, holding every string against the Bible, the batch and D-23 read from disk, with the register re-asserted over every export and the honesty caps retired by name"
  - "the header's box in the PDF's words (Connect ZONA / ZONA connected / Preview only) in sentence case, the identity in Device actions; the install labels and the confirmation title in sentence case"
  - "13-COPY-NEW.md emptied into a record: every row landed, kept or handed on by module and batch row"
affects: [13-19 (tune/copy.ts, the twenty-seven names, batch rows F.1, F.11, F.17, J.10), 13-20 (the install column's move and the duplicate Apply to ZONA - J.13; the reset's section 16 confirmation under Device actions - I.6.5; transport.ts's open-failure wording - I.3.12, I.8; E.14, E.15, F.4, G.31, G.36, G.34, H.20, H.21; J.1, J.19, J.23, J.25, J.30, J.40), the bench (nothing here touched a device)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A copy module's contract is the documents that author it, read from disk: the Bible (section 9's table, section 16's rows), the batch, and the D-23 heading in 13-CONTEXT.md - every string the module can produce, with sample arguments folded back to the batch's placeholders, must be in one of them"
    - "pageName(page) = `Page ${page + 1}` in each of the three zero-import modules that name a page, each spec pinning wire 0 to Page 1; the wire is untouched and the offset is applied where the word is written"
    - "Sentence-case control labels: no text-transform, 0.01em tracking, 13px/600 (the confirmation's title 16px/600); the header's box at the weight Phase 6 gave the identity"
    - "The no-paraphrase rule as the narrower assertion that can be tested: every 'Click X' names a control exactly as the control reads, and a write click named in prose appears with its own case (Put back excused: it is the register's verb)"
key-files:
  created:
    - .planning/phases/13-gui-overhaul/13-18-BATCH.md
    - .planning/phases/13-gui-overhaul/13-18-SUMMARY.md
  modified:
    - src/lib/device/install-copy.ts
    - src/lib/device/install-copy.spec.ts
    - src/lib/device/session-copy.ts
    - src/lib/device/session-copy.spec.ts
    - src/lib/device/page-target.ts
    - src/lib/device/try-on.ts
    - src/lib/device/install.svelte.ts
    - src/lib/device/install.spec.ts
    - src/lib/device/session.spec.ts
    - src/lib/ui/InstallState.svelte
    - src/lib/ui/TryOnDevice.svelte
    - src/lib/ui/KeepOnDevice.svelte
    - src/lib/ui/PutBack.svelte
    - src/lib/ui/Clear.svelte
    - src/lib/ui/KeepConfirm.svelte
    - src/lib/ui/DeviceDetails.svelte
    - src/lib/ui/DeviceSlot.svelte
    - src/lib/ui/shell/ContextBar.svelte
    - src/lib/ui/shell/device-clause.ts
    - src/lib/ui/shell/shell.svelte.ts
    - src/lib/ui/device-ui.spec.ts
    - src/lib/ui/instrument.spec.ts
    - src/lib/ui/intro/card.ts
    - src/routes/+layout.svelte
    - src/routes/playground/[id]/+page.svelte
    - src/routes/sandbox/[draftId]/+page.svelte
    - e2e/install.e2e.ts
    - e2e/session.e2e.ts
    - e2e/sandbox.e2e.ts
    - e2e/tuning-webkit.e2e.ts
    - e2e/first-experience.e2e.ts
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
    - .planning/STATE.md

key-decisions:
  - "The batch is the copy contract for the two device modules (D-23): a string is a Bible line verbatim, a batch proposal as approved, or a builder over those, and the specs read all three documents from disk to say which"
  - "Pages are numbered from one (batch row I.3.1, D-19): the wire's 0-3 read as Page 1-4 everywhere, through one pageName per zero-import module, the wire untouched"
  - "The honesty caps are retired by name, with what they measured and what replaced them, in install-copy.ts's header and in install-copy.spec.ts test 3 - a mechanism that disappears with no sentence looks like an oversight"
  - "The six transfer-uncertainty titles stay six (D-23) and name no page; the bar reads them with a representative page and the confirmed captions with the real one"
  - "The header's box reads the PDF's words: Connect ZONA where a click connects, section 9's Preview only on the three no-device summaries, ZONA connected in S4 with the identity moved into Device actions - NO_ZONA_LABEL retired, the S1 hover swap and the identity's mono numerals gone"
  - "Every Phase 10 uppercase control label is sentence case now, in CSS as well as in the string: no text-transform, no 0.18em tracking, on the header's label, the four install controls, the disclosure's buttons and the confirmation's title"
  - "The install column's duplicate Apply to ZONA is NOT removed here (J.13 said task 02 would): the install e2e drives the column's primary in eighteen titles and the column's removal is 13-20's move of the whole column - recorded as deviation 1 and handed on"

# Metrics
duration: about 205 min of execution (task 01 about 60 min - reading the ledger, the Bible, the PDF, the modules and the summaries, the batch written and committed; task 02 about 145 min - the two modules, fifteen consumers, four specs, five e2e files, the check, the build, the quick suite five times, the sweep, five e2e chunks and their reruns, three negative checks, the ledger, STATE) plus this document
completed: 2026-09-12
---

# Phase 13 Plan 18: The Words Decided by the Person Whose Product It Is Summary

**One-liner:** Every string the Bible never wrote was put to the user in one 262-row batch and
approved as proposed (D-23); `install-copy.ts` and `session-copy.ts` were rewritten under D-05 with
section 9's and section 16's lines verbatim, the batch's for everything else, pages numbered from
one, the six transfer titles kept six, the four facts and 12.1's fifth traced old to new, and the
measured honesty caps retired by name - the term `+0 / +0` held at 94 / 961.

## The counts, carried and observed

| Gate | 13-17 left | 13-18 observed | Term |
| --- | --- | --- | --- |
| quick (`--project server --maxWorkers=2`) | 94 files / 961 tests (+1 todo) | **94 / 961 (+1 todo)** - green five times: twice before the CSS changes, three times after, the last on the fresh build | **`+0 / +0`** |
| `install-copy.spec.ts` | 6 | **6** - rewritten, not replaced | +0 |
| `session-copy.spec.ts` | 6 | **6** - rewritten, not replaced | +0 |
| `device-ui.spec.ts` | 17 | **17**, its strings updated | +0 |
| sweep | 4 / 19 | **4 / 19** | +0 |
| check (`svelte-check`) | 657 / 0 / 0 | **657 / 0 / 0** | +0 |
| lint | clean | **clean** (prettier and eslint) | - |
| e2e `test(` count | 83 | **83**; 99 runs across the two projects, green across the chunks and the named reruns (below) | **`+0 / +0`** |
| `install-copy.ts` exports | 61 (the plan said 59; 13-12 had added two) | **56** - the four caps and two page-less Put back lines gone, `pageName` and `Firmware` added, constants that name a page became builders | - |
| `session-copy.ts` exports | 47 | **49** - `NO_ZONA_LABEL` gone; `pageName`, `CONNECTED_LABEL`, `PREVIEW_ONLY_LABEL` added | - |

No test was added and no rule was folded: every register rule fits in the six tests each spec had.

## The answer, verbatim

Task 01's checkpoint returned the batch (`13-18-BATCH.md`, commit `abce6d0`): 262 rows in seven
columns over the intro (5), the gallery (16), the workspace (19), the Sandbox (48), My configs (34),
the device band (97 in eight sub-sections) and 43 non-string questions with a proposed answer each;
the ledger counted at **153 rows and 70 questions** against the plan's "about forty"; section 16 at
**eleven** rows, the earlier "about thirty-five" named as section 16 plus the PDF; the four-fact trace
with 12.1's fifth; the six transfer lines kept six with the cost of collapsing them stated and a
`collapse-six` option offered.

The user's answer, recorded as **13-CONTEXT.md D-23** (commit `9a6384b`):

> *"approve"*

Every proposal is taken as written; every section-J answer is taken as proposed; the six transfer
lines stay six. Page numbering shows 1 to 4 (row I.3.1).

## The four facts, traced old to new - and the fifth

| Fact | Phase 10 said | The Bible says | The new string (module, export) |
| --- | --- | --- | --- |
| RAM against flash | `TRY ON DEVICE` / `KEEP ON DEVICE`; `HONESTY_READY` *"Writes this into your ZONA’s memory in about a second. A power cycle puts yours back."*; `settledBody` *"…lives in memory only — a power cycle brings your own configuration back…"* | *Apply to ZONA* / *Store on ZONA* (§9); *Applied to Page 2. Store on ZONA to keep it after power-off.* (§16) | `TRY_ON_LABEL` = `Apply to ZONA`, `KEEP_LABEL` = `Store on ZONA` (verbatim); `settledCaption(page)` = §16's line verbatim, also `liveSettled`; `honestyReady(page)` *"Applies this to Page 2 in about a second. It stays until power-off unless you store it."*; `settledBody(name, page)` *"Arc is running on Page 2 in memory only. Changing page on your ZONA clears it; apply it again if that happens."*; `keepLineEnabled(page)` *"Stores this on Page 2 so it stays after power-off."*; `keptCaption(page)` = *Stored on ZONA · Page 2* (§16, also `liveKept` with the full stop) |
| the snapshot | `PUT BACK`; `SNAPSHOTTING_BODY` (three scripts); `identifiedBody` (three); `RESTORED_BODY` *"Your own Setup and Timer are back…"*; the two snapshot lines in session-copy (*"…own Setup and Timer…"*) | **no line** | `PUT_BACK_LABEL` = `Put back`; `puttingBackLabel(page)` *"Putting Page 2 back…"*; `snapshottingBody(page)` *"Taking a copy of what Page 2 holds — the touch element’s Setup and Timer and the page’s own init, timer and utility scripts — so it can be put back."*; `identifiedBody(fw, page)` *"Firmware 1.5.5, on Page 2. A copy of the page is saved here — … — so Put back can undo anything you apply."*; `restoredCaption(page)` *"Put back · Page 2"*; `restoredBody(page)` *"Page 2 holds exactly what it held when you connected — your own configuration, not a HANGAR default."*; `liveSnapshotSaved(page)` *"A copy of Page 2 is saved. Nothing has been written."*; `SNAPSHOT_DURABLE_LINE` / `SNAPSHOT_SESSION_LINE` *"A copy of the page your ZONA was on when you connected is kept in this browser / held until this tab closes, so it can be put back…"* |
| the firmware default | `CLEAR`; `CLEAR_LINE` *"Reset the current page to factory default"* (D-21); `CLEARED_CAPTION` `FACTORY DEFAULT`; `CLEARED_BODY` | *Reset active device page* (§9); *Reset Page 2 to its firmware default? Your browser draft will remain available.* (§16) | `CLEAR_LABEL` = `Reset active device page` (verbatim); `clearingLabel(page)` *"Resetting Page 2…"*; `clearLine(page)` *"Returns Page 2 to its firmware default. Your browser draft stays as it is."* (D-21's sentence superseded by D-23, said so in the comment); `clearedCaption(page)` *"Page 2 reset to its firmware default"*; `clearedBody(page)` *"Page 2 is running the firmware’s own default. Put back restores what was there when you connected, and your browser draft is untouched."*; `liveCleared(page)` *"Page 2 is reset to its firmware default."* |
| nothing without a click | `SAFE_NOTE` *"Nothing is written without a click."* | **no line** | `SAFE_NOTE` *"Nothing is written to your ZONA without a click. Browsing and previewing never touch it."* - `session-copy.spec.ts` asserts both clauses; every write is a named click and every step's "Click X" names a control as it reads (install-copy.spec.ts test 4) |
| the fifth (12.1-08, 13-17): a store carries the page's own scripts, five in all | `CONFIRM_REPLACES` *"…and the page’s own init, timer and utility scripts, and it survives a power cycle."*; the four partial rows | **no line** | `confirmReplaces(page)` *"This replaces what Page 2 holds on your ZONA — its touch element’s Setup and Timer and the page’s own init, timer and utility scripts — and it stays after power-off."*; `snapshottingBody` and `identifiedBody` now name the five (13-17 left them at three); the four `LandedWords` / `FailedWords` pairs kept with "the utility script" third; test 2 asserts the five names in write order on every partial and the three scripts on the three sentences |

## The honesty caps, retired by name

`HONESTY_CAP` (86), `PUT_BACK_CAP` (129), `KEEP_CAP` (86) and `CLEAR_CAP` (86) were measured maximum
lengths per string - `lines x CH_PER_LINE`, with `CH_PER_LINE` the 43 characters plan 10-01 measured
as the minimum occupancy of one Body line box in Phase 10's 372px install column - held in
`install-copy.spec.ts` test 3 by name and as arithmetic so a caption could not outgrow the cell
reserved for it and so a cap was a promise about strings not yet written. What superseded them, in
`install-copy.ts`'s header (dated 2026-09-12) and in the spec's test 3: D-05 changed the register
(the Bible's lines are verbatim and several are longer than 86) and the layout the caps were
measured against is being replaced by the Bible's proportional regions (13-11, 13-12, 13-20). The four
constants are gone, not left at a value nothing checks; test 3 asserts their absence from the
exports and their presence, by name with the numbers, in the header. The rules that travelled with
them and did not retire are asserted there too: Z-08's one "about a second" (twice in the module,
once in the type probe, nowhere else in `src/`), A-48's three stems over the nine reset strings,
the label rules (eleven labels, all sentence case, none the wire's words), SAFE-01's `WRITE_CLICKS`
equality, and the page numbering. The three cells that reserved height (Put back 72px, Store on ZONA
48px, the reset 48px) keep their floors - the twins are rendered and the tallest sets the height,
which was the mechanism; the number in the copy module was not.

## What moved, by module

**`src/lib/device/install-copy.ts`** (56 exports; 630 → 560 lines): every export rewritten - the
labels (`Apply to ZONA`, `Put back`, `Store on ZONA`, `Not now`, `Reset active device page`, the
four progress builders in section 9's shape), the honesty slot, the block captions and bodies
(section 16's two lines as captions), the seven titles (`PARTIAL_TITLE` at five strings: *"Only part
of this reached your ZONA"*), the seven blocks with every step naming a control as it reads, the
store confirmation, `KEEP_REASONS` (six reworded, `KeepReason` kept) and `CLEAR_REASONS` (three,
`ClearReason` kept, two by reference), the five live utterances; `pageName` and `Firmware` added.
**`session-copy.ts`** (49 exports): `CONNECT_LABEL` = `Connect ZONA`, `CONNECTED_LABEL` and
`PREVIEW_ONLY_LABEL` (section 9), `NO_ZONA_LABEL` retired, `CAPTION_UNPLUGGED` = *Disconnected · draft
retained*, `HIDDEN_NAME_IDLE` = section 16's Disconnected line, `TWO_STEP` naming Firefox,
`PERMISSION_DECLINED`, `SAFE_NOTE`, `REPLUG_OFFER`, `REVOKE_EXPLANATION`, the two snapshot lines,
the two unplugged lines, `silentBlock`'s first step, `pageName`, `identitySentence` (*"Firmware
1.5.5, on Page 3."*), `identityDescription` (*"… Opens Device actions."*), `liveConnected`.
**`page-target.ts`**: `pageName` from one, the wire untouched. **`try-on.ts`**: re-exports
`TRY_ON_LABEL`. **`install.svelte.ts`**: `#page()` and every utterance and title through it.

**The consumers:** `InstallState.svelte` (the page derived from the snapshot or the identity, every
caption and block through it, the caption style sentence case), `TryOnDevice.svelte` (`PRIMARY` =
`TRY_ON_LABEL`, the progress labels and `honestyReady` by page), `KeepOnDevice`, `Clear`,
`KeepConfirm` (`confirmCaption` / `confirmReplaces` by page), `PutBack` (three twins, the page-less
pair retired), `DeviceDetails`, `DeviceSlot` (one text label per state, the swap and the identity
markup and the mono rule removed, sentence case), `ContextBar` + `shell.svelte.ts` + the layout + the
two routes (`page` threaded to `deviceClause(phase, page)`), `intro/card.ts` (`RESUME_EYEBROW` =
`CONTINUE EDITING`, batch row D.4). The uppercase transform and the 0.18em tracking left nine rules
across six components.

**The specs:** `install-copy.spec.ts` (six: imports nothing; every string against the three documents
with the five names in write order and the three scripts on the three sentences; the caps retired
with the rules that stayed; the register over every export including the no-paraphrase scan and the
retired-vocabulary scan; the closed sets; the formatters), `session-copy.spec.ts` (six, the same
shape; two browsers named on purpose), `install.spec.ts` and `session.spec.ts` (call sites),
`device-ui.spec.ts` (17, the strings and the tracking rule at 0.01em), `instrument.spec.ts` (mono at
five, DeviceSlot off the list). **The e2e:** `install`, `session`, `sandbox`, `tuning-webkit`,
`first-experience` import the builders and the labels; the Target select's options and the review's
sentence are asserted through `pageName`.

## The paraphrase rule: shipped as the narrower assertion

The plan asked whether "no control label paraphrased in prose" can be a test. Not in general - a
paraphrase is a judgement. What is asserted instead, in both specs: every sentence that tells the
visitor to click something names a control exactly as the control reads (the five write clicks, or
the label the surface handed in); a write click named in prose appears with its own case (`Put back`
excused, because it is the register's own verb - *"can be put back"* - and the verb is not the
control); and none of Phase 10's labels or the verbs its prose paraphrased them with (`try-on`, "try
it on", "keep it again", "power cycle") appears in any string. The negative check ("Click the apply
button to read it again") is red by name on that scan and on the closed-set scan.

## Negative checks

1. An exclamation mark on `KEPT_PROOF_LINE` - **red**: `KEPT_PROOF_LINE shouts`, and the batch scan (the
   string is no longer the approved one).
2. "Chromium" in `HONESTY_INCAPABLE` - **red**: `HONESTY_INCAPABLE names an engine`, and the batch scan.
   (`transport.ts`'s unsupported message is `transport.spec.ts` test 6's, unchanged.)
3. "Click the apply button to read it again" as a step - **red** twice: the no-paraphrase scan (*tells
   the visitor to click "the apply button…", which is not a control as it reads*) and the closed-set
   scan (*clicks a control that is not on the screen*), plus the batch scan.

The module was restored from a copy after each and the hash compared: identical.

## The e2e result, chunked, every rerun named

One detached `wrangler dev` on the build of the tree; strings the e2e assert on moved in install,
session, sandbox, tuning-webkit and first-experience, so all five chunks ran.

| Chunk | Files | Result |
| --- | --- | --- |
| 1 | install, session | first run: **wrangler died** after 2 (32 `ERR_CONNECTION_REFUSED`, two `starting` reads); session alone at `--workers 2`: 14 + 2 red - **a real defect**, the header's label CSS-uppercased (`ZONA CONNECTED`), fixed with the sentence-case labels; on the rebuilt tree **session 16 passed**; install whole: 12 + 6 (wrangler died at `:1842`; `:1842` itself **a real e2e literal**, `LOST_ON_PAGE` pinned to *"The ZONA was unplugged mid-write."*, fixed); reruns alone: `:1842 :1977 :2090` **3 passed**, `:1842 :2232 :2397 :2489` **6 passed** (both projects); **install whole again: 17 passed, 1 failed** - `:1977` webkit-phone CLEAR, `CONFIG/EXECUTE` 6 for 5, the transient 13-17 also recorded - **green alone twice** at `--workers 1 --project=webkit-phone` |
| 2 | browse, browse-webkit | 20 passed, 1 failed - `browse:1186` (Back returns the filtered view: 26 cards for 5; no file this plan touched) - **green alone** |
| 3 | tuning, tuning-webkit | **20 passed** (46 s) |
| 4 | catalog, fidelity, first-experience, library, sandbox | 12 passed, 1 failed - `first-experience:268` **a real e2e literal** (*"This browser cannot write to a ZONA."* retyped), now `KEEP_REASONS.incapable` from the module; **the file 5 passed** |
| 5 | artifacts, radius, skeleton, smoke | first run: **wrangler died** (every title refused); rerun at `--workers 1`: 10 passed, 1 failed - `skeleton:21` (the degrade panel not visible; route untouched) - **the file 2 passed** |

99 runs green across the chunks and the reruns; 83 titles. The safety titles pass with the new
labels, which is the plan's real test of whether the rewrite changed behaviour.

## Deviations from Plan

**1. [Rule 4 declined - scope] The install column's duplicate `Apply to ZONA` was not removed.**
Batch row J.13 (approved) says "13-18 task 02 removes the duplicate `Apply to ZONA` from the column".
Not done: the column's primary (`try-on-device`) is what eighteen install e2e titles click, and
removing it is the column's removal, which J.13 itself assigns to 13-20 with the rest of the column.
The primary reads `Apply to ZONA` in both places for one more wave. Handed to 13-20 by name.

**2. [Rule 2 - a defect the rewrite exposed] The header's and the controls' labels were uppercased in
CSS.** Sentence-case labels rendered as `ZONA CONNECTED` and `APPLY TO ZONA` through
`text-transform: uppercase` on nine rules in six components. Removed with the 0.18em tracking;
`device-ui.spec.ts`'s Quiet-tier tracking rule now judges 0.01em; `InstallState`'s caption and the
confirmation's title are sentence-case lines at 14px and 16px.

**3. [Rule 3 - consequential] The header's S4 identity moved into Device actions**, as 13-11's table
said it would when the words changed (batch section B: the PDF's `ZONA connected`). `DeviceSlot`'s
identity markup, its mono numerals and the multi-module tail's CSS collapse went with it;
`identitySentence` and `multiModuleLine` already rendered the same facts in the panel, and the box's
accessible description carries the page. `instrument.spec.ts`'s mono list is five.

**4. [Rule 2 - the rule the batch stated] `Preview only` on the three no-device summaries.** The batch
retired `NO_ZONA_LABEL` for S1 and said nothing for S0a, S0b and S5; a control that cannot connect
must not read `Connect ZONA` (`device-ui.spec.ts` holds it), so those three read section 9's own
visible label for the No connection row, `PREVIEW_ONLY_LABEL`, verbatim.

**5. [Scope] Outside the two modules, only `RESUME_EYEBROW` was applied** (the coordinator named it).
The other approved rows that live in other modules are handed on with their exact strings (below),
so no wave invents them twice.

**6. Two e2e literals** (`LOST_ON_PAGE`'s sentence, first-experience's incapable reason) were retyped
copies of Phase 10 strings; both now import from the module. Not deviations from the plan, recorded
because the plan's e2e gate found them.

## Hand-off, by module and batch row

**To 13-19** (the tune copy and the twenty-seven names): `src/lib/tune/copy.ts` in full (56 exports
in Phase 10's register; `tryOnBudgetReason`'s comment and `copy.spec.ts`'s note still name
`HONESTY_CAP`, which no longer exists - reword when the file is rewritten); F.11 `LINK COPIED` →
`Link copied`; F.17 `monitorCount` `x{n}` → `×{n}` (`inspector-copy.ts`); F.1 a per-entry inspector
headline as an optional entry field, if wanted; J.10 retire `?feels=` and keep the `?tag=` mapping
(`query.ts`).

**To 13-20:** J.13 (the column; deviation 1); I.6.5 (`Reset active device page` under Device actions
with section 16's confirmation, A-45 retired by name in `device-ui.spec.ts` test 13); I.3.12
(`port-busy`'s second culprit *"…and another HANGAR tab can be holding it too."* and the step *"Close
any other HANGAR tab"*, after the bench reproduces the raw message) and I.8.1-I.8.7 (the open-failure
titles in the register: *"This browser can’t talk to hardware"*, *"Your ZONA isn’t there any more"*,
*"The port wouldn’t open"*, *"isn’t a secure context"*, *"pick your ZONA"*, *"can’t power the
module"*, `transport.ts`, held by `transport.spec.ts`); E.14 (`36 configurations` unfiltered); E.15
(*"Nothing starred yet. Star a configuration and it will be kept here."* / *"Nothing opened yet.
Configurations you open are kept here."*); F.4 (`UNKNOWN_NOTICE` → *"There’s no configuration at this
address. Pick one from the list."*); G.31 and G.36 (*"the most a page holds"*); G.34 (the
unreachable two-slot `overLine`); H.20 (*"This surface has {count} elements, and a page holds at most
16."*); H.21 (*"{region} doesn’t fit on the 9 × 9 surface."*); J.1 (the favicon, square, `#dcff71`);
J.19 (the Playground draft); J.23 (the one-shot view handoff); J.25 (the sandbox thumbnail's static
paint); J.30 (refuse a duplicate collection name; *"A collection called {name} already exists."*);
J.40 (substitute the snapshot's own utility for a landing's empty 255/4 in `install.svelte.ts`
`#pageUtility` - a store behaviour with `install.spec.ts` assertions to re-pin, not a word).

## The runbook and the bench

No device was connected to, written to or deployed to by this plan. Nothing was installed. CAT-04
stays `[ ]`. `.planning/ROADMAP.md`, `12-touch-framework/`, `12.1-gradient-touch/`, `src/vendor/`
untouched; no `gsd-tools state` command run - STATE edited by script against a copy (1081 → 1086
lines, six lines rewritten in place with their content retained, `status: executing`,
`completed_phases: 11`, `percent: 100` asserted). No `git checkout`, `git restore`, `git stash` or
`git clean`; every restore was a copy back with the hash compared. The three untracked root files are
the user's.

## Self-Check: PASSED

- `.planning/phases/13-gui-overhaul/13-18-BATCH.md` - FOUND (262 rows; commit `abce6d0`)
- `13-CONTEXT.md` `## D-23` with `> *"approve"*` - FOUND (commit `9a6384b`)
- `src/lib/device/install-copy.ts` contains `THE HONESTY CAPS ARE RETIRED BY NAME, 2026-09-12`, exports none of the four caps - FOUND
- `src/lib/device/install-copy.ts` → `13-18-BATCH.md` via `install-copy.spec.ts` test 2 reading the batch from disk (the plan's key link) - FOUND
- `src/lib/device/session-copy.ts` exports `CONNECTED_LABEL`, `PREVIEW_ONLY_LABEL`, `pageName`; not `NO_ZONA_LABEL` - FOUND
- `13-COPY-NEW.md` begins `# Phase 13 — the copy ledger (emptied 2026-09-12 by plan 13-18)` - FOUND
- commit `24a3c30` (task 02) - FOUND in `git log`
- `+0 / +0` observed as 94 / 961 (+1 todo) five times; sweep 4 19; check 657 / 0 / 0; e2e 83 / 99
