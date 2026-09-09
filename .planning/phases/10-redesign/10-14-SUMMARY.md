---
phase: 10-redesign
plan: 14
subsystem: docs
tags:
  [gate, measurement, requirements, roadmap, deferred-items, checkpoint, honesty]
wave: 15
requires:
  - "10-13.2: the last wave-14 plan, and the tree this gate measures"
  - "10-01: BASE_FILES 74, BASE_TESTS 780, BASE_E2E 89, BASE_SWEEP 4 19, BASE_SWEEP_WALL 123 s, BASE_CHECK 567"
provides:
  - "The phase closed as a chain: quick 81 / 828 = BASE_FILES + 7 / BASE_TESTS + 48 in sixteen terms, e2e 103 = BASE_E2E + 14 in six, sweep 4 19, check 584 / 0 / 0"
  - "docs/TESTING.md re-measured whole at the gate, with eight of 10-VALIDATION's estimates named as wrong"
  - "deferred-items.md at twenty-four items, each with what would close it"
  - "REQUIREMENTS.md: twenty PHASE 10 GATE QUALIFIERs, four with an explicit unresolved half"
  - "ROADMAP.md: twenty requirement IDs, sixteen plans in fifteen waves, 16/16"
affects:
  - "docs/TESTING.md is now the observation that replaces 10-VALIDATION.md's three projected tables"
  - "docs/PIN-POLICY.md item 4 is gated by the reachability sweep's two passes as well as by the stored strings"
  - "The next phase inherits a baseline block that was proved to meet its own far end"
tech-stack:
  added: []
  patterns:
    - "A phase total written as a chain with running totals, so the baseline and the total are visibly the same arithmetic seen from two ends"
    - "A wrong estimate is NAMED as wrong in the document that carried it, never silently corrected"
    - "A negative check restored from a scratch copy taken before the perturbation, never with git checkout --, with sha256 compared both sides"
key-files:
  created:
    - .planning/phases/10-redesign/10-14-SUMMARY.md
  modified:
    - docs/TESTING.md
    - docs/PIN-POLICY.md
    - .planning/phases/10-redesign/deferred-items.md
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
decisions:
  - "No requirement checkbox was ticked by this phase. All twenty were closed by earlier phases; CAT-04 stays Pending for the third time and TUNE-04 keeps Phase 5's tick without being re-claimed, because MIX TWO is not mounted"
  - "The gate's own negative-check instruction was wrong and the finding is worth more than the check: facets.spec.ts:99's floor is 30 against an observed 36, so a raise of one is green"
  - "10-14's qualifier table says CLEAR takes a fourth tier on five channels; the shipped tree has three tiers and three channels (A-46, A-47). The observation wins"
  - "The Goal line's Inter Italic was already amended at 0c8a18d; the surviving occurrence was success criterion 1, found by grepping rather than by following the instruction"
  - "10-02's A-02 reversal is EIGHT edits, not the seven this plan quotes"
metrics:
  duration: ~85min
  completed: 2026-09-09
  tasks_completed: 2
  tasks_total: 3
---

# Phase 10 Plan 14: The Phase Gate Summary

**Every projection `10-VALIDATION.md` carried is now an observation taken on a clean tree against a
fresh production build, the phase total is a sixteen-term chain whose two ends visibly meet, eight
estimates are named as wrong including this plan's own negative-check instruction — and the one
hardware row this phase created is handed over unanswered, with no agent having touched a device and
no agent having deployed.**

## Performance

- **Duration:** ~85 min
- **Completed:** 2026-09-09
- **Tasks:** 2 of 3 — **task 3 is a blocking checkpoint and is UNANSWERED**
- **Files created:** 1 · **Files modified:** 5

---

## The gate, observed

All of it on a clean tree at `305e425`, in the order the plan names, each command run alone, free
memory recorded beside each.

| Command                          | Observed                                              | Against               | Verdict |
| -------------------------------- | ----------------------------------------------------- | --------------------- | ------- |
| `npm run check`                  | **584 FILES 0 ERRORS 0 WARNINGS**, 8 s, 6.69 GB free  | `BASE_CHECK` 584      | exact   |
| `npm run lint`                   | exit 0, 16 s, 6.68 GB free                            | —                     | clean   |
| `npm run test:quick`             | **81 files / 828 passed + 1 todo**, 32 s, 6.67 GB free | `BASE_FILES + 7` / `BASE_TESTS + 48` | exact |
| `npm run test:sweep`             | **4 files / 19 tests**, 93 s wall (90.47 s), 6.64 GB free | `4 19`, `BASE_SWEEP_WALL` 123 s | counts exact, **30 s faster on a third more work** |
| `npm run build`                  | exit 0, **10 s**, `source-305e425….tar.gz` 1,468 KB   | 12 s / 12.08 s / 16–20 s projected | **under all three** |
| `npm run test:quick` (after build) | **81 / 828 + 1 todo**, 32 s                          | unchanged             | exact   |
| `npx playwright test --workers 3` | **103 passed (1.8 m)**, 109 s wall, 6.29 GB free      | `BASE_E2E + 14`       | exact   |
| `npm run licenses`               | exit 0, five production dependencies                  | —                     | clean   |

**The `check` reading correction 10-01 recorded still holds**: `grep -Ei "error|warning"` cannot print
nothing, because `svelte-check`'s own summary line matches the pattern. It printed exactly one line
and that line reads `0 ERRORS 0 WARNINGS`.

### The e2e run was never piped

Playwright's output was redirected to a file and the file was grepped afterwards. Piping a Playwright
run through `grep` or `head` truncates it on SIGPIPE and reports a false total; that is a documented
hazard in this repository and it was not re-tested.

---

## The `BASE_TESTS` chain, sixteen terms, with its running total

```
BASE_TESTS 780
  +6 (10-01: aesthetic 1, font-assets 5)                     786
  +1 (10-02: identity 6 -> 7)                                787
  +0 (10-03)                                                 787
  +6 (10-04: aesthetic 1 -> 7)                               793
  +5 (10-05: demo 2, host +3)                                798
  +4 (10-06: facets 4)                                       802
  -1 (10-07: sort 6 -> 5)                                    801
  +0 (10-08)                                                 801
  +3 (10-09: tune-ui +2, surprise +1)                        804
  +6 (10-10: colour-picker 6)                                810
  +4 (10-11: mix 2, tune-ui +2)                              814
  +5 (10-12: install +3, constants +2)                       819
  +2 (10-13: device-ui +2)                                   821
  +5 (10-13.1: instrument created with 5)                    826
  +2 (10-13.2: instrument 5 -> 6, aesthetic 7 -> 8)          828
  +0 (10-14: the gate writes no tests)                       828
```

**Sixteen terms, one per plan.** Every term was checked against the SUMMARY that plan wrote, not
against its own `check-counts` line: each SUMMARY carries `PREV_TESTS` in and out, and the sixteen
in-values chain to the sixteen out-values with no gap and no overlap. **Observed 828. `BASE_TESTS`
780 plus 48 is 828. The two ends meet.**

`BASE_FILES + 7` is exact and the seven created files are `aesthetic`, `font-assets`, `demo`,
`facets`, `mix`, `colour-picker`, `instrument`.

### The `BASE_E2E` chain, six terms

```
BASE_E2E 89
  +8 (10-04: aesthetic.e2e.ts, 4 titles x 2 projects)                 97
  +0 (10-05: gen-og and the dark exemption, no title moves)           97
  +0 (10-07: D-11 and A-19, six sites, every edit inside a title)     97
  +4 (10-13: install.e2e.ts, 2 titles x 2 projects)                  101
  +0 (10-13.1: the aesthetic pass adds no title, and runs anyway)    101
  +2 (10-13.2: aesthetic.e2e.ts test 5, 1 title x 2 projects)        103
```

**Observed 103**, split **85 chromium / 18 webkit-phone**. The three zero terms are written out
rather than omitted, because a zero absent from a chain is indistinguishable from a term nobody
computed.

### The sweep's four totals, reproduced exactly

| Figure | 10-08 recorded | Observed at the gate |
| --- | --- | --- |
| reachability Pass A | 19,502 | **19,502** |
| reachability Pass B | 24,576 | **24,576** |
| reachability total | 44,078 | **44,078**, in 87.0 s, over budget **0**, Pass B colours excluded **0** |
| stamp round-trip, Lua half | 234,784 | **234,784** |
| `lua-entries` combinations / measurements | 1,728 / 3,456 | **1,728 / 3,456** |
| `ninepads` | 640 of 908, 268 free | **640 / 268** |
| `tpad` | 907 of 908, no colour knob | **907 / 1, no colour knob** |

### Everything else the gate asserts

- `src/lib/fidelity/vendored-diff.spec.ts` **14** and `lua-parity.spec.ts` **5**, both green.
- `npm run licenses` clean; `THIRD-PARTY.md` names **Inter** and **Grifter** and does not name
  Quicksand; `licenses/` holds five entries and no Quicksand file.
- `tar -tzf build/source-305e425….tar.gz` shows **no font binary** and **`static/fonts/README.md`
  present** — verified from both sides in one listing.
- `git diff --stat HEAD -- src/vendor/` **empty**.
- `git diff --stat 0c8a18d..HEAD -- src/lib/ui/Coverflow.svelte` **empty** — the phase's standing
  promise, proved once at the end as well as sixteen times along the way. `0c8a18d` is the commit
  10-01 measured `BASE_*` on.
- `test-results/` removed by hand; `git status --porcelain` empty; nothing listening on 4173.

---

## Where the planner was wrong — every row named

A validation document whose estimates are never checked teaches the next phase to estimate
carelessly. These are recorded in `docs/TESTING.md` as well as here.

**1. The e2e sampling rule said five waves; it was seven.** Its stated reason — *"no e2e title moves
in it"* — is wrong for two waves that move no title and must run anyway. Amended by name twice.

**2. The 10-12 term was `+4`, then `+3`, and it is `+5`.** Revision 1 carried a `session.spec.ts +1`
that 10-12's own task 02 denies twice; revision 2 carried a payload of empty strings.

**3. The 10-13 term was `+3`; it is `+2`.** A-45 and A-46 each removed a test the estimate counted.

**4. `src/lib/tune/copy.spec.ts` was printed as 5 and is 6.** It moves no total, which is exactly why
stating it matters.

**5. `browse-webkit.e2e.ts` was said never to name `newest`.** It does, at `:79`. The claim was wrong
and the number was right — 10-07's term stays 0.

**6. The phase total moved four times** — `+40` → `+45` → `+46` → `+48` — and six occurrences of a
superseded total survive in shipped SUMMARYs and are deliberately not edited.

**7. `npm run check` "must print nothing" is impossible.** First recorded by 10-01; still true at 584.

**8. This plan's own negative-check instruction was wrong, and the finding is worth more than the
check.** It asked for a non-vacuity floor raised **by one**, expecting red.

| Arm | Change | Result |
| --- | --- | --- |
| A | `facets.spec.ts:99` `toBeGreaterThan(30)` → `(31)` | **GREEN.** 4 passed. `LISTING.length` is 36 |
| B | → `(36)` | **RED.** `the listing was actually read: expected 36 to be greater than 36` |

The floor sits **six below its observation**, so it would not notice five entries disappearing.
Restored from a scratch copy — never `git checkout --` — sha256
`58f7313cf758ceb585fa414cb93571fd6ca30183188ba025ecf129c283fa7ecd` before and after, and
`git diff --quiet` exit 0.

**9. `Requirements: TBD` and `Plans: TBD` were not both TBD.** `Plans` had already become
`14 plans in 14 waves` at `0c8a18d` and then `9 of 14 complete`. Filled at **sixteen in fifteen
waves**.

**10. The Goal line's "Inter Italic" was already amended at `0c8a18d`.** The plan says to amend the
Goal line by name; the surviving occurrence was in **success criterion 1**, found by grepping rather
than by following the instruction. Amended there, by name and dated.

**11. 10-14's own qualifier table says SAFE-02's CLEAR "takes a fourth tier distinguished on five
non-colour channels".** The shipped tree has **three** tiers — A-46 retired the Bare tier and `CLEAR`
sits in **Quiet** — and A-47 separates `CLEAR` from `KEEP ON DEVICE` on **three** channels, two of
which are behaviour. Neither four nor five is the shipped number. Traced to A-46/A-47 rather than
absorbed.

**12. The A-02 reversal is EIGHT edits, not the seven this plan quotes.** 10-02 found the eighth by
running the predicate rather than reading it: `scripts/deploy.mjs` step 5's `hasFontNote` check must
go with the note, or **every deploy refuses**. Quoted below with the correction.

---

## The six ROADMAP success criteria, walked one at a time

The twenty requirement qualifiers are not a substitute for this. They say what each requirement
proved; the six criteria are what the phase promised, and a criterion nobody walks is a criterion
nobody checked.

### 1. impeccable, Grifter and Inter, and the licence discharged into `THIRD-PARTY.md`

**Answered in three parts, and one of them is half met.**

- **impeccable is installed and was used.** It lives at `~/.claude/skills/impeccable/` as a
  user-scoped tool, not a project dependency; `10-UI-SPEC.md` §0 was authored through it and answers
  its six gates; **no plan runs `npx impeccable install`** and `npm ls impeccable` stays empty. That
  is V-06 and it is met.
- **Grifter carries headlines and Inter carries body text** — 10-02, with `--font-display` asserted
  equal to **every** display `@font-face` family rather than to the first one found.
- **Inter *Italic* does not ship.** D-12 withdrew it. The Goal line was corrected at `0c8a18d`;
  criterion 1 itself still said "Inter Italic" and is amended here by name and dated.
- **The licence is discharged but not resolved.** `gen-licenses.mjs` records Grifter's family,
  licensee and licence name in `THIRD-PARTY.md`, the binary is `export-ignore`d from
  `git archive HEAD`, and `static/fonts/README.md` stands in the archive in its place — all three
  verified in the gate's own archive listing. **Whether Hanson Method's licence permits
  redistribution at all is the user's question and is unanswered**, and the files themselves declare
  `PERSONAL USE` in their OpenType `name` table (nameID 13, copyright `HANSON METHOD™ DESIGN`),
  verified by parsing the OTF in 10-RESEARCH. Handed over as **Open item 2**.

**Not answered:** the licence resolution, and whether Grifter looks right beside Inter.

### 2. Front door and browse both first-class

**10-07.** The ring stays at **eight** and gains the `FOR` link row (A-22) — ten static
`<a href="./browse/?for=…">` in the prerendered front door, making it the entry to browse rather than
its rival, with `front-door.ts` still declaring zero specifiers. `/browse/` carries two captioned
facet rows of sixteen chips **with no disclosure**, and `?tag=` **migrates** rather than dropping,
under a four-case ruling.

**Not answered:** whether the ring should grow. Blocked by `front-door.spec.ts:110-112`'s
`preview === "padsim"` requirement, which **twenty-seven of thirty-six** entries fail. Open item 3.

### 3. One sequence, plus CLEAR under every Phase 7 rail

**10-12 and 10-13.** `InstallAction` **4**, `WRITE_CLICKS` length **4** asserted equal to the four
control labels, `Clear.svelte` in the **Quiet** tier, the `FACTORY DEFAULT` block, and the payload
read from the pinned package's own `defaultConfig` (**641 / 22**, canonical under the pinned
minifier).

**The criterion's own words asked for "its own confirmation and bench row" and it got neither,
deliberately.** D-19 dropped the confirmation because `PUT BACK` and a power cycle each undo a clear
(A-45); A-51 folded the hardware check into runbook **row C** rather than adding a row H, so the
runbook is still **seven rows, A–G**.

**Not answered:** row C's clear half — task 3's checkpoint, and the user's.

### 4. Playful, legible tuning; a stylized RGB picker; one idea nobody does

**10-09, 10-10, 10-11.** Knob locks; the **live cost forecast**, the idea the survey found in no
product in the category, `cost()`-only and memoised; the three-rail lattice picker over the
hardware's own 4,096 colours with A-09's six-shape fence; and `MixTwo`.

**Not answered: one thing, and it is not nothing.** `MixTwo` is built, property-tested over 36
entries and **not mounted** — it renders its four results only when a consumer supplies `onchild`,
and the only thing on the page that owns a `SimHost` is `Coverflow.svelte`, which this phase promises
not to edit. Mounting it also owes `TuningRegion.svelte`'s height reservation a term 10-UI-SPEC gives
it nowhere. Deferred item 8, and one of the items handed to the user.

### 5. The paragraphs gone, each by a named amendment, and SAFE-01's fate said out loud

**10-03 and 10-05.** **Ten retirements**, each an amendment with its pinning assertion rewritten in
the same commit — 618 characters of prose gone from the site, counted by script before and after.
Five reservations **re-derived** from the measured `CH_PER_LINE` of 43 rather than adjusted: header
note 152px → 24px, honesty slot 72px → 48px, two unchanged under a new face, meters shown to hold
because not one term of their arithmetic is a character count. `SAFE_NOTE` at **35** characters, with
`REQUIREMENTS.md:169` amended and dated.

**Not answered:** which of Open item 1's three forms the user wants. Form 1 ships; both reversals are
costed at one edit each.

### 6. A reduced-motion escape hatch in both browser projects, and the accent palette still governing

**10-04, plus 10-09/10-10's censuses.** `e2e/aesthetic.e2e.ts` — four titles, both projects, both
vacuity holes opened first — plus `aesthetic.spec.ts`'s source scans. The reserved accent list is
still **eight**, `--color-over` still **three**, the palette still **nine tokens and three hexes**,
which is how a picker that can produce any colour for the pad leaves the chrome alone.

**Not answered:** whether the CRT *reads well*, which is the user's eye — and now also whether the
instrument register reads as a technical instrument rather than as decoration, which 10-13.1's five
source scans can prove the **shape** of and cannot prove the **effect** of.

---

## Open for the user — restated with measured reversal costs

The plan names three. **There are more, and pretending otherwise would be the same defect this gate
exists to catch.** Each has a number, not a description.

### 1. SAFE-01's form

**Shipped:** `SAFE_NOTE`, **35** characters, on the control that would do the writing, unconditional,
in **every** state, on both surfaces that carry the primary — more places than the 88-character
paragraph it replaced ever reached.

**Form 2** (the 88-character sentence back in the disclosure): **one render site.**
**Form 3** (explicit dated retirement of SAFE-01's second clause): **one constant deleted and one
`REQUIREMENTS.md` note.** 10-03 states both.

### 2. Grifter

**Shipped:** D-14 as written — served from the site, `export-ignore`d from the source archive,
recorded by family, licensee and licence name.

**The A-02 reversal is EIGHT edits, not seven** — 10-02 found the eighth by running the predicate —
and **no component is touched and no test is rewritten**, which is what D-14's one-token requirement
bought:

1. `npm i @fontsource-variable/archivo@5.3.0` — exact pin, **not** `-D`, because `src/app.css` ships
   to every visitor and `license-checker-rseidelsohn` runs `--production`.
2. `src/app.css`, the swappable block: `font-family` → `"Archivo Variable"`, `src` → the same
   relative-`url()` shape as Inter's, plus `font-weight: 100 900`.
3. `src/app.css`, the token: `--font-display`'s first family → `"Archivo Variable"`. Edits 2 and 3 are
   the "two lines" §5.1 promises, and test 7 is red until both are done.
4. `.gitattributes`: remove the `static/fonts/GRIFTER-Bold.woff2 export-ignore` line and its D-13
   comment block.
5. `src/lib/ui/font-assets.spec.ts`: remove the one `ALLOWED_FONTS` row.
6. `scripts/gen-licenses.mjs`: remove the two Grifter paragraphs.
7. `static/fonts/` deleted, both the binary and the README.
8. **`scripts/deploy.mjs` step 5: remove the `hasFontNote` predicate along with the note.** With the
   note gone and the check left in, `hasFontNote` is false on every archive and **every deploy
   refuses**.

**The unresolved half stays unresolved, and it is redistribution rather than use.**
`scripts/postbuild.mjs:82-89` publishes `git archive HEAD` at an unauthenticated URL, so a font file
in the tracked tree is **redistributed** — a different permission from displaying it on your own
site, and the one most foundry licences withhold. **The files declare `PERSONAL USE` in their
OpenType `name` table**, verified by parsing the OTF. Even a written commercial-use grant does not
clear the archive case; only an explicit grant to include the file in a publicly downloadable source
archive does. **Recommendation, which you are free to refuse:** one email to the foundry asking
specifically about the source-archive case, ship Grifter meanwhile, treat Archivo as the prepared
fallback.

### 3. The front-door ring

**Shipped:** eight, plus the `FOR` link row.

**Growing it is blocked today** by `front-door.spec.ts:110-112`'s `preview === "padsim"` requirement,
which **twenty-seven of thirty-six** entries fail, because they are Lua configurations and a ring
member that loaded `wasmoon` would put a **271,581-byte** WASM asset on the front door's first paint
— the one thing `e2e/catalog.e2e.ts` proves a cold load never fetches. Growing the ring means either
a second engine on the opening screen or a relaxation of that requirement.

### 4. The accent cross — a possible ninth accent use

**Shipped:** the distinguished cross is `var(--color-line)` at **0.4** against the field's
`var(--color-line-soft)` at **0.2** — twice the alpha — plus a second, non-colour channel (once, at
one declared position). **No accent.** `src/app.css`'s own comment states the fork: *"a lattice in the
accent would have been a ninth use."*

**Cost of taking it:** the reserved accent list moves from **eight to nine** and the assertion that
quotes all eight in its failure message is rewritten. That assertion is the only thing standing
between the palette and drift, so this is a one-line change to the guard rather than to the design —
which is precisely why it is a decision and not an edit.

**Cost of leaving it:** nothing. The cross reads today; the geometry departure is recorded (15px
where §19.1a says 14px, because `7 + 1 + 7` is the only symmetric answer about a 1px stroke).

### 5. MIX TWO, built and not mounted

**Shipped:** `src/lib/tune/mix.ts` and `MixTwo.svelte`, property-tested over all 36 entries with
knobs — 9,000 runs, 36,000 results, 27,894 redrawn positions — and **rendering nothing on the site.**

**Cost of mounting it:** five lines of `onchild` wiring plus `unregister(id)` on teardown, into
`Coverflow.svelte` — the file this phase promises not to edit — **and** a term in
`TuningRegion.svelte`'s height reservation (`194 + 48r + 66w + 196p − 4`, asserted twice in
`tune-ui.spec.ts` test 7), which 10-UI-SPEC gives MIX TWO nowhere. A block whose height changes when
four results appear is exactly the reflow that reservation exists to prevent.

**Cost of leaving it:** `TUNE-04` is **deliberately not re-claimed by this phase**, because ticking it
would claim something the tree does not support. It keeps Phase 5's `[x]` for Phase 5's reason.

**And a sixth item, at no cost to state:** MIX TWO can be `disabled` and §13.4 gives it **no reason
string**, where `SURPRISE ME` gets a 53-character one. Two ways out, both cheap: a fifth string in
§13.4, or make `THAT ONE` never empty by handing the entry's own defaults as the second candidate —
which changes what the feature *is*, slightly.

---

## The twenty requirement qualifiers

Written into `REQUIREMENTS.md` in full, one per row, each saying what was proved **and** what was not.
Summarised:

| ID | Proved | Not proved |
| --- | --- | --- |
| IDENT-01 | nine tokens, three hexes, no fourth hue through a font swap, two texture members and four CRT layers; `--font-display` = **every** display `@font-face` family | **Grifter's licence is the user's and unresolved**; whether Grifter reads beside Inter |
| IDENT-02 | reduced motion at the **compositor** in both projects, both vacuity holes opened first; a demo card replays once and freezes; `SCREEN: FLAT` reaches the two layers no preference can | whether the CRT reads as texture or as dirt; whether the register reads as an instrument |
| SAFE-01 | zero writes **by class** across connect, snapshot and every knob move, node and browser; **four** clicks in `WRITE_CLICKS`; the guarantee in every state; `:169`'s eight-needle figure corrected to **ten**, having been stale at nine | which of Open item 1's three forms; the `InstallAction` exhaustiveness audit **names nothing** |
| SAFE-02 | the two install weights unchanged through D-04, as a site-wide count; the pill arrived and Quiet took nothing | the plan's own "fourth tier / five channels" is **three and three** |
| SAFE-03 / SAFE-04 | CLEAR refuses without a snapshot with **zero writes of any class**; the snapshot record read, never written | **row C's clear half, unanswered** (A-51: no row H); SAFE-04's key still wire-unproven |
| SAFE-05 | **untouched** — Phase 7's `KEEP ON DEVICE` block satisfies it whole | A-45 removed the confirmation, so it **was not extended**; the qualifier records what was not done |
| SAFE-07 | `cleared` from two ACKs, never from a resolved writer promise, against scripted faults | **no hardware half**, and no runbook row for it |
| PREV-03 | **closed** at 44 characters, unconditional wherever it appears | nothing |
| CONN-03 | amended: the pre-click explanation retired, `SAFE_NOTE` and the browser's own prompt carrying the intent | the Firefox two-step sentence is unconditional because no non-brand signal exists |
| CAT-02 | three sorts become two, on a **data finding**; `addedAt` out of the projection, kept on the entry | nothing |
| CAT-03 | sixteen terms, two facets, three per entry, OR within and AND across; count-derived row and outsider chip retired; `disabledTags()` kept | nothing in its own subject |
| CAT-04 | the same, rendered | **still `Pending` for the third time** — its subject is the catalog data file's shape |
| CONT-03 | "four feel tags" → **exactly three**, re-cut across **twenty-eight** source files | nothing |
| TUNE-01 | knobs counted as knobs; one picker per panel; the `colour` kind chosen **by kind alone** | a Lua colour knob still shows a swatch row inside the picker |
| TUNE-02 | the forecast is `cost()` only, memoised, hover-and-focus, never touch, never animated | offered on **option rows only**; five of twelve knob kinds are rails |
| TUNE-04 | locks and `MIX TWO`, both **ephemeral**, zero new reachable states | **MIX TWO is not mounted**; Phase 5's tick is not re-claimed |
| TUNE-05 | **proven-unreachable with the margin as a number**: 640/268, 907/1, zero of 24,576 over the wall | nothing about reachability |
| SHARE-01 | format `w` claimed, both routes round-tripped at 44,078 and 234,784 | nothing |
| SHARE-03 | format `x` still landing `restored`, against literals captured **before `w` existed** | nothing |
| DEGR-02 | CLEAR present-but-disabled with its reason inline, contrasted with `PUT BACK`'s **absence**, red when planted the other way | nothing |

---

## Deferred items

`deferred-items.md` goes from **ten** items to **twenty-four**, each with what would close it — a work
list, not a wish list. New at the gate:

11. The second halftone density, measured over budget at 12.00 ms against a 2 ms threshold, refused.
12. `isolation: isolate` is load-bearing and invisible to every source scan — the lattice shipped
    painting nothing, two screenshots byte-identical at 8,492 bytes.
13. The lattice declaration count is a floor, not an equality (A-60).
14. `demo.spec.ts` stays green when `tpad` is renamed out of `DARK_BY_CONSTRUCTION` — the honesty
    gate is held in **two** places, not three.
15. Four accessibility walks read hand-declared lists, and one **passed having read nothing**.
16. `FacetRow.svelte` straddles the register line and nothing states that as a rule.
17. The `InstallAction` exhaustiveness audit names nothing.
18. **T3** — `SURPRISE ME` as a shelf of five. Blocked by the same missing hop as MIX TWO.
19. **T5** — the hardware A/B audition, carried verbatim because the reason is the item: *a **safety**
    risk, not a technical one — it adds a class of click that writes twice per gesture and cannot be
    verified without hardware.*
20. **T6** — knobs on the pad itself.
21. The CRT-over-text mitigations and the **new class of gate** they need (Open item 8): four changes,
    one of which is a contrast gate that **composites** rather than reads a token.
22. The front-door ring.
23. Nothing type-checks `e2e/`.
24. Nothing gates `docs/INSTALL-RUNBOOK.md` or `docs/TESTING.md`.

---

## Deviations from Plan

### 1. [Rule 1 — Bug] The plan's negative check could not go red as written

**Found during:** Task 1. **Issue:** the instruction was to raise a non-vacuity floor **by one** and
expect red; `facets.spec.ts:99`'s floor is 30 against an observed 36. **Fix:** both arms were run —
+1 (green, reported as the finding) and 36 (red, naming the observed count) — rather than substituting
a different check or reporting a pass. **Restored from a scratch copy**, sha256 identical, `git diff
--quiet` exit 0. No commit of the perturbation.

### 2. [Rule 1 — Bug] The plan pointed at the wrong line for "Inter Italic"

**Found during:** Task 2. **Issue:** the Goal line had already been amended at `0c8a18d`; the
surviving occurrence was success criterion 1. **Fix:** grepped the file, amended criterion 1 by name
and dated, and recorded the instruction's error beside it. **Commit:** `7e7fc16`.

### 3. [Rule 2 — Missing critical] `requirements mark-complete` was NOT run, deliberately

The state-update protocol calls for marking the plan's `requirements` frontmatter complete. Running
it would tick **CAT-04**, which is `Pending` on purpose for the third time, and would re-claim
**TUNE-04**, which this phase cannot support because MIX TWO is not mounted. **All twenty were closed
by earlier phases**; this phase extends, amends or records-as-untouched. No checkbox was ticked, and
`REQUIREMENTS.md`'s footer says so and why.

### 4. The plan's SAFE-02 qualifier disagrees with the tree

Named in full above (item 11 of "Where the planner was wrong") and written into the requirement row
rather than absorbed.

### 5. The plan's Grifter reversal count disagrees with 10-02

Seven in the plan, **eight** in 10-02's own recipe, with the eighth named and its consequence stated
(every deploy refuses). The SUMMARY quotes eight.

### 6. Scope, declared

`docs/PIN-POLICY.md` is in the plan's task 1 action but not in its `files_modified` frontmatter. It
was edited as the action instructs, and this line is the declaration.

---

## Known Stubs

None introduced. **One pre-existing stub is restated rather than hidden:** `MixTwo.svelte` renders
its four results only when a consumer supplies `onchild`, and no consumer does. It is Open item 5,
deferred item 8, and the reason `TUNE-04` is not re-claimed.

---

## The one thing this gate cannot prove

No negative check is added here and adding one would be theatre. Instead, stated plainly: **this gate
cannot prove that the CRT reads well, that Grifter looks right beside Inter, or that a clear leaves a
real ZONA running the firmware's own default — dark at rest, a soft bloom under a finger.** Two of
those are the user's eye and one is row C's clear paragraph.

---

## Checkpoint: task 10-14-03 — HANDED OVER, UNANSWERED

**Type:** `checkpoint:human-verify`, `gate="blocking"`.

**Not run, not answered, not marked done.** No agent in this phase connected to a device, performed a
write, or deployed; `npm run deploy` was not run. This checkpoint is where that promise is handed over
rather than quietly kept.

It carries three sections: **A**, `docs/INSTALL-RUNBOOK.md` **row C's clear half** on a real ZONA —
where the correct observation is **dark at rest with a soft white bloom under a finger**, because the
firmware default installs a proximity-weighted touch callback and a pad that stays dark under a finger
is a **failure**, not a pass; **B**, the decisions above, each with its measured cost; and **C**, the
three things only the user's eye can settle. Rows A–G remain **seven** and there is **no row H**
(A-51). `docs/MIDI-IN-PROBE.md` (A, B), `docs/SESSION-RUNBOOK.md` (A–F) and
`docs/HARDWARE-AUDITION.md` (32 rows) remain the user's and unanswered.

---

## Commits

| Task | Commit | What |
| --- | --- | --- |
| 10-14-01 | `f3fa398` | every projection replaced by an observation, and eight wrong estimates named |
| 10-14-02 | `7e7fc16` | twenty qualifiers, sixteen plans, and the criterion that still said Inter Italic |
| — | (this file) | the gate SUMMARY and the state update |

---

## Self-Check: PASSED

Files claimed created or modified, all present: `10-14-SUMMARY.md`, `docs/TESTING.md`,
`docs/PIN-POLICY.md`, `deferred-items.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`.

Commits claimed, both in `git log`: `f3fa398`, `7e7fc16`.

Counts claimed, re-read off the files: `PHASE 10 GATE QUALIFIER` appears **21** times in
`REQUIREMENTS.md` — twenty rows plus the footer that names them; `ROADMAP.md` carries **16**
`- [x] 10-` plan lines; `deferred-items.md` carries **24** numbered items; `ROADMAP.md` contains
**one** remaining occurrence of "Italic", inside criterion 1's own amendment note recording that it
is now "Inter".

Gate re-verified after every documentation edit: `npm run check` **584 / 0 / 0**, `npm run lint`
clean, `npm run test:quick` **81 / 828 + 1 todo**. `test-results/` removed; `git status --porcelain`
empty; nothing listening on 4173.
