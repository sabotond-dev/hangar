---
phase: 13-gui-overhaul
plan: 04
subsystem: ui
tags:
  [
    deletion,
    negative-term,
    d-09,
    crt,
    halftone,
    lattice,
    screen-switch,
    motion-control,
    reduced-motion,
    tick-64,
    additive-only,
    allowlist,
    no-radius,
    copy-ledger,
    webkit,
  ]
requires:
  - phase: 13-gui-overhaul
    plan: 03
    provides: "PREV_FILES 86 / PREV_TESTS 894 (+1 todo) / e2e 88 titles, 108 runs / BASE_CHECK 584 / sweep 4 19 / catalog 26 / radius allowlist 15 rows, 32 declarations, observed on the clean tree at 63402de; the eleven tokens (the CRT rules already renamed to --color-workspace / --color-divider / --action-bloom); PadFrame's wash at 15% of the divider"
  - phase: 13-gui-overhaul
    plan: 01
    provides: "the count gate proved on a negative delta (a test fenced out with the file kept is a different red from a file deleted); the radius gate in three layers reading one allowlist; the todo's owner named (firmware-oracle.spec.ts:209); the copy ledger"
  - phase: 13-gui-overhaul
    plan: context
    provides: "D-01 (ask where not sure; never a corner), D-05 (the register), D-09 (the CRT, lattice, glyph field, Splash and SCREEN switch deleted; the switch's purpose re-homed under Help & shortcuts), D-15 (six circles, none touched here)"
  - phase: 13-gui-overhaul
    plan: validation
    provides: "D-5: the composition half (FrontDoor, Coverflow, NamePlate, Splash, PadSpinner, ChosenPanel) survives until 13-07 and 13-09; only the global half lands here"
provides:
  - "THE FIRST DELETION AND THE FIRST NEGATIVE TERMS: +0 files / -8 tests on the unit side (86 / 886, +1 todo), e2e -5 titles / -10 runs then +1 / +2 = -4 / -8 (84 titles, 100 runs), each half written out; the count gate reported the negatives as 13-01 proved it would"
  - "THE CRT, THE HALFTONE, THE LATTICE GROUND AND THE SCREEN SWITCH GONE FROM EVERY ROUTE AT ONCE (D-09): src/app.css keeps --action-bloom alone in :root and loses the switch (--crt, data-screen), Layer G (body::before), the :where() ground rule and the lattice; PadFrame.svelte loses Layer S and its 10px corner (D-01); FrontDoor.svelte loses the CRT shell (.crt-band, Layers R and T, both keyframe blocks, Switch 3); the two lattice roots drop the class; ScreenToggle.svelte and e2e/aesthetic.e2e.ts are deleted"
  - "SIX aesthetic.spec.ts TITLES AND TWO instrument.spec.ts TITLES DELETED BY NAME, re-read from the file first, with scan 4 KEPT because its subject is Coverflow.svelte alone (a finding: the plan's -7 is -6) and scan 8 kept in place so the file survives; instrument scan 1 rewritten, scan 2 renamed, scan 6 re-aimed at the ground rule that survives - the deletion's own gate over the retired vocabulary, held on every run"
  - "THE SWITCH'S PURPOSE RE-HOMED AS AN ADDITIVE-ONLY MOTION CONTROL: src/lib/sim/motion.svelte.ts (key hangar.motion.v1, the localStorage guard copied from ScreenToggle.svelte:79-109) hands SimHost a reducedMotion dependency that reports os || still with no branch that turns the OS's true into false; src/lib/ui/MotionControl.svelte is one checkbox, checked and disabled under the OS preference, mounted in the layout footer with 13-05 named as the plan that builds Help & shortcuts and moves it; two strings ledgered, one question recorded"
  - "THE REDUCED-MOTION PROOF MOVED RATHER THAN LOST: one tagged title in e2e/browse.e2e.ts asserts the STRONG thing - the browser's aurora backing store equals byte for byte the frame the same vendored PadSim produces at REDUCED_MOTION_TICKS over the same HANGAR preset in Node, and differs from tick 0 - and holds the additive rule in a browser; host.ts read, cited and not edited"
  - "THE ALLOWLIST AT THIRTEEN ROWS / TWENTY-EIGHT DECLARATIONS (from fifteen / thirty-two): PadFrame's row cleared (the frame's 10px removed, Layer S's 4px deleted), ScreenToggle's row gone with the file; D-15's six circles unmoved"
affects:
  - "13-05: the footer this plan mounts MotionControl.svelte in is the layout's GPLv3 footer; the shell's footer carries Help & shortcuts and moves the control under it without changing it (the layout comment names 13-05); browse.e2e.ts's header now names its one tagged title, so a second tag there needs the header amended again"
  - "13-06: the storage key hangar.motion.v1 (values animated | still) folds into the store module beside the KEEP-* keys; a unit spec of motionDeps()'s OR belongs there (this plan held the rule in the e2e title to keep the file term +0)"
  - "13-07: Splash.svelte still carries its own halftone grain (.grain, :318) and the glyph field - the composition half, D-5; the plan's grep is not empty until Splash goes. 13-09: Coverflow.svelte carries two added lines (the motionDeps import and the constructor argument) and FrontDoor.svelte 317 fewer; aesthetic.spec.ts scan 4 is deleted by name in the same commit as Coverflow.svelte; NamePlate's and ChosenPanel's rows are next"
  - "13-11: session.plugged has no reader since the tear went; its comment says the device UI is the next surface with a reason to read it. 13-18: two rows and one question in the ledger. 13-20: the allowlist at thirteen / twenty-eight; the terms below carried; the PadFrame dot-field question below"
tech-stack:
  added: []
  patterns:
    - "A deletion keeps a gate of its own: when the scans that gated a treatment go with it, the retired vocabulary is asserted absent (comments stripped) on every run by a surviving scan, so a grep in a SUMMARY is the proof once and the test is the proof afterwards"
    - "A preference that must never subtract from an OS setting is folded into the OS reading as an OR inside an injected dependency, so the rule is the shape of the code and the host that consumes it stays unedited"
    - "A browser proof of a simulator contract computes its expected frame with the same simulator in Node rather than reading a fixture that does not carry the tick, and asserts the weaker claim (not tick 0) beside the stronger one so neither can pass vacuously"
    - "A comment written into a .css or .svelte file after a deletion does not carry the retired lowercase vocabulary, so the raw grep that proves the deletion stays clean without stripping"
key-files:
  created:
    - src/lib/sim/motion.svelte.ts
    - src/lib/ui/MotionControl.svelte
    - .planning/phases/13-gui-overhaul/13-04-SUMMARY.md
  modified:
    - src/app.css
    - src/lib/ui/PadFrame.svelte
    - src/lib/ui/FrontDoor.svelte
    - src/routes/browse/+page.svelte
    - src/lib/ui/ChosenPanel.svelte
    - src/lib/ui/CatalogCard.svelte
    - src/lib/ui/BrowseGrid.svelte
    - src/lib/ui/Coverflow.svelte
    - src/lib/ui/radius-allowlist.ts
    - src/lib/device/session.svelte.ts
    - src/lib/ui/aesthetic.spec.ts
    - src/lib/ui/instrument.spec.ts
    - src/routes/+layout.svelte
    - e2e/browse.e2e.ts
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
    - .planning/STATE.md
  deleted:
    - src/lib/ui/ScreenToggle.svelte
    - e2e/aesthetic.e2e.ts
key-decisions:
  - "SCAN 4 OF aesthetic.spec.ts WAS KEPT, NOT DELETED: its subject is Coverflow.svelte's own 3D context and band, which this plan does not touch and which survive until 13-09 (D-5); the plan's -9 became -8 (six from aesthetic, two from instrument), and the plan's alternative -6 does not add up (6 + 2 is 8)"
  - "instrument.spec.ts SCAN 6 WAS RE-AIMED, NOT FOLDED: html and body paint the workspace token, nothing is painted over them, and the retired vocabulary names no rule and no component - the rule changed; scan 1 lost its CRT side and kept its instrument side; scan 2 changed a name (Primary's fill, not radius) and retired the ScreenToggle exemption, not a rule"
  - "THE MOTION CONTROL IS ADDITIVE BY CONSTRUCTION: motionDeps() reports os || still into SimHost's reducedMotion input, injected at both construction sites, so host.ts is read and not edited and there is no branch in which the OS's true becomes false; under the OS preference the box is checked and disabled"
  - "THE RE-HOMED TITLE ASSERTS TICK 64, NOT THE WEAKER THING: the frame is computed in Node with the same PadSim over the same preset, so the plan's fallback (the pad is not two-thirds unlit) was not needed and is asserted beside it as 'not tick 0'; host.spec.ts still holds the contract against a fake clock"
  - "--action-bloom SURVIVED D-09 because it is not a texture (§3 reserves glow for the light output and the primary action - its two consumers); PadFrame's DOT FIELD survived because it is the pad's unlit-cell mark that scan 8 asserts in place, so the plan's 'dot-field ground goes' clause was not followed and is asked below rather than decided"
  - "THE ADDITIVE RULE IS HELD BY THE E2E TITLE, NOT A NEW UNIT SPEC, so the plan's file term stays +0; the plan offered either. gsd-tools state advance-plan, update-progress, roadmap update-plan-progress and requirements mark-complete were NOT run; STATE.md was edited by script against a copy with every line asserted"
patterns-established:
  - "A count the plan states is re-counted at execution and the planner's figure is named beside the observation (-9 / -6 against -8; 895 against 894; '106 - 10 + 2 + 2' against 108 - 10 + 2; 'corners already zero' against a 10px that was there)"
requirements-completed: []
duration: 42min
completed: 2026-09-11
---

# Phase 13 Plan 04: The CRT, the Halftone, the Lattice and the SCREEN Switch Deleted Summary

**The first deletion in this project's history, and its first negative terms. The CRT scanline
layers, the halftone grain, the lattice ground and the SCREEN switch are gone from every route at
once, because they were a global layer and not any route's composition (D-09; the composition half
waits for 13-07 and 13-09 under D-5). Six unit titles were deleted from `aesthetic.spec.ts` and two
from `instrument.spec.ts`, each re-read from the file before deletion and named again below; scan 4
was kept because its subject is `Coverflow.svelte` alone, which is a finding and not a slip, so the
term is `-8` rather than the plan's `-9`. `e2e/aesthetic.e2e.ts` was deleted with all five titles
named, and the reduced-motion proof was re-homed as one tagged title in `browse.e2e.ts` that asserts
the strong thing: the browser's still frame is, byte for byte, the frame the simulator produces at
tick 64, and it is not tick 0. The switch's one real purpose survives as an additive-only motion
control whose rule is the shape of its code (`os || still`), with `host.ts` read and not edited.
The tree is green at `86 / 886 (+1 todo)`, `84 titles / 100 runs`, check `585 / 0 / 0`, sweep `4 19`.
Nothing here is hardware-verified, no device was touched, and nothing was deployed.**

## Performance

- **Duration:** about 42 min
- **Started:** 2026-09-11T02:56:47Z (first edit; reading began about 02:40Z, after 13-03's close at `63402de`)
- **Completed:** 2026-09-11T03:38Z
- **Tasks:** 2 of 2
- **Files:** 2 created, 2 deleted, 16 modified (plus this document)

## Commits

| Hash      | Message                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `2e15557` | `feat(13-04): the CRT, the halftone and the lattice removed from every route at once - the first negative term` (11 files, +271 / -2124) |
| `ab49f8f` | `feat(13-04): the SCREEN switch deleted, its purpose re-homed as an additive motion control, and the reduced-motion proof moved rather than lost` (11 files, +179 / -1017) |

Both with `git commit --only <paths> -F <message-file>`, pathspec before the message flag; the two new
files were `git add`ed first because `--only` cannot see an untracked path. Every deleted title is
named in its commit message. No push. No commit overlapped a suite run.

---

## The baseline, carried from 13-03, and this plan's terms written out

Tree at `63402de`, re-measured on the untouched tree before the first edit: **86 files / 894 tests
(+1 todo) / 88 e2e titles / 108 runs / check 584 / catalog 26 / sweep `4 19` / radius allowlist 15
rows, 32 declarations**. The plan carries `PREV_TESTS 895` and asserts `86 886`; that `895` is 13-01's
`-1` offset (12-10's unlanded `+1`), carried by every plan since and reconciled by none, stated here
once and not reconciled. The plan's literal `886` happens to coincide with the observed result
because its `-9` and the offset cancel against the tree's `-8`; the gate ran against the observed
number. Phase 12 stands at 10 of 12 with 12-06 open at a user checkpoint; nothing under
`.planning/phases/12-touch-framework/` was touched.

| Name             | Carried (13-03, observed here) | Term, written as a negative                                          | Observed after 13-04                                 |
| ---------------- | ------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------- |
| `PREV_FILES`     | **86**                         | **+0** (`aesthetic.spec.ts` survives with two scans)                 | **86**                                               |
| `PREV_TESTS`     | **894** (+1 todo)              | **-8** (`aesthetic` 8 -> 2, `instrument` 6 -> 4)                     | **886** passed, 1 todo                               |
| e2e titles       | **88**                         | **-5** (the deleted file) **+1** (the re-homed title) = **-4**       | **84** (`grep -c "test("` summed over `e2e/`)        |
| e2e runs         | **108**                        | **-10** (five titles in two projects) **+2** (one in two) = **-8**   | **100** (84 chromium + 16 webkit-phone), two of three full runs green, the third named below |
| sweep            | `4 19`                         | +0                                                                   | **`4 19`**                                           |
| `BASE_CHECK`     | **584**                        | -1 (`ScreenToggle.svelte`) +2 (the module, the control), provenance only | **585** files, 0 errors, 0 warnings              |
| catalog          | 26                             | +0                                                                   | 26                                                   |
| radius allowlist | 15 rows / 32 declarations      | **-2 rows / -4 declarations** (PadFrame's two cleared, ScreenToggle's two deleted) | **13 rows / 28 declarations**; the six circles unmoved |

The e2e arithmetic, in halves as the plan asked: **`-5 / -10` then `+1 / +2` = `-4 / -8`**, from the
observed `88 / 108` and not from the plan's literal `106` (`108 - 10 + 2 = 100`, where the plan's
`106 - 10 + 2 + 2` reaches the same number by counting 13-01's radius title a second time).

`npm run test:quick 2>&1 | node scripts/check-counts.mjs 86 886`: *matches the expected counts* (the
first piped read printed *no Vitest summary lines found* once while the raw run was green at the same
numbers; the second piped read matched - a pipe transient, named). `npm run test:sweep 2>&1 | node
scripts/check-counts.mjs 4 19`: *matches*. `npx playwright test --workers 3 2>&1 | node
scripts/check-counts.mjs --playwright 100`: *matches* on the first and the third full run; the second is
in the e2e section. `npm run check`: **585 files, 0 errors, 0 warnings**. `npm run lint`: clean.
`npm run build`: green, with `@import "tailwindcss" source(".")` and the `@source not inline(...)`
refusal at the top of `app.css` **kept intact** - the patch asserted both after every edit.

---

## Task 1: the CRT, the halftone and the lattice removed from every route at once

### Scan 1's allowlist as the checklist, walked

`CRT_FILES` was `src/app.css`, `PadFrame.svelte`, `FrontDoor.svelte`, `ScreenToggle.svelte`. Each
was walked and the vocabulary removed; the fourth is task 2's deletion. What went where:

| File                                | What went                                                                                                                                                                                                                                                                        | What stayed                                                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/app.css` (691 -> 362 lines)    | `--crt-scanline` and `--crt-roll` from `:root`; the switch (`html { --crt: 1 }`, `html[data-screen="flat"]`); Layer G (`body::before`, the halftone at 3px and the vignette, and its flat rule); the `:where()` ground rule; the lattice (`.lattice`, `.lattice::before`, its mask) | the scanner header and the rounded refusal; both `@font-face`; the eleven tokens; `--action-bloom` alone in `:root`; the type scale; the focus ring; `.pill` |
| `PadFrame.svelte` (252 -> 218)      | Layer S (`:global(.front-door) .pad::after`), the `--crt-noise` tile, the flat rule; the frame's `border-radius: 10px` (D-01)                                                                                                                                                       | the dot field with its 15% wash, the face, the gutters, the frame's border, the hero's bloom; the 6px inset (see below)            |
| `FrontDoor.svelte` (730 -> 413)     | the `screen` and `isLowPower` imports; `TEAR_MS`, `manyCores`, `showRoll`, `tearRun`, `tearing`, the `$effect`; the `{#key}` shell with `.crt-band` and `.crt-roll`; `.crt-band`, `.crt-band.chosen`, `.crt-roll`, `@keyframes crt-roll`, `.crt-band::after`, `@keyframes crt-tear`, the flat rule, the CRT reduced-motion block; two header paragraphs | `.row { position: relative }` (the coverflow's geometry was measured against it); everything else                                |

**Not on the allowlist and edited anyway, because the lattice's class lived there:**
`src/routes/browse/+page.svelte` (`class="browse lattice"` -> `class="browse"`) and
`ChosenPanel.svelte` (`class="panel lattice"` -> `class="panel"`), the two roots; and the A-56
exceptions' comments in `CatalogCard.svelte` (`.card`) and `BrowseGrid.svelte` (`.empty`), whose
`background-color: var(--color-workspace)` declarations were kept as stated facts with their reason
rewritten (they no longer occlude anything; they say what the card and the empty state paint).
`session.svelte.ts`'s `plugged` comment names the reader that went - the counter and its tests stay.

**The four-layer recipe.** The plan says it "becomes two" with "the dot-field ground" going. The tree
disagrees: the pad's four layers are the dot field, the canvas, the gutters and the frame; the CRT was
an admitted fifth (Layer S). Layer S went. The dot field is the unlit-cell mark - scan 8, which the
plan keeps *in place*, asserts its `background-image` names `--color-divider` - and D-09 names the
CRT, the lattice, the glyph field, Splash and the switch, not the dots. So the pad is the four layers
it was, minus the texture, and the plan's clause is recorded under "what the tree does not support"
and asked below rather than followed silently.

**The 6px inset stays with a new reason.** It was chosen to keep the 10px corner arc off a corner
LED; the arc is gone. The inset is kept because the coverflow's geometry, the browse wall and layer
C's computed-style sweep were all measured with the face 6px inside the frame, and the three
siblings share it. The header says so.

### The six titles deleted from `aesthetic.spec.ts`, verbatim, and the two kept

Re-read from the file before deletion. **The file carried exactly the eight titles the plan named -
no title was found that the list did not carry** - and no `it.todo`/`test.todo` (the tree's one todo
is `firmware-oracle.spec.ts:209`, checked before either file was touched).

1. *"scan 1: the CRT vocabulary appears only inside its allowlist of files"*
2. *"scan 2: every CRT layer declares pointer-events: none, and the real elements are aria-hidden"*
3. *"scan 3: no text-bearing element is a descendant of a CRT container"*
4. *"scan 5: no CRT selector names a canvas"*
5. *"scan 6: the noise tile declares no fill - only the filter's own output colours it"*
6. *"scan 7: .crt-band's geometry is string-equal to .band's, across the two files"*

**Kept: *"scan 4: Coverflow.svelte's 3D context stays ungrouped and its band keeps its clip and its
mask"*.** The plan says its subject is "CRT-adjacent geometry that this plan removes from `app.css`"
and deletes it, with the instruction to keep it if the subject survives. It survives entirely: the
scan reads `Coverflow.svelte` and nothing else - `.stage` carries no grouping property, `.band` keeps
`overflow: clip` and its `mask-image`, the slot keeps its inline recede - and this plan does not edit
that file's styles. Nothing in the scan names the CRT. It stays until 13-09 deletes the coverflow and
deletes the scan by name in the same commit; the header says so. **So the file's term is `-6`, not
`-7`, and the plan's term is `-8`, not `-9`.** The plan's own alternative, "`-6` if scan 4 keeps a live
subject", does not add up: six from this file and two from `instrument.spec.ts` is eight.

**Kept in place: *"scan 8: the unlit cell is drawn as a cell, in the token, and the pad that lights
nothing is still dark"*** - body verbatim but for two references to "exactly two layers stop" (the
old browser gate), now "the reduced-motion contract stills every pad". The file's header was
rewritten: what it used to gate, what it gates now, and the date D-09 removed the rest. 8 -> 2.

### `instrument.spec.ts`: two deleted, three rewritten (the plan says two), and which changed a rule

Deleted by name, re-read first:

7. *"scan 3: the lattice is monochrome, gradient-built, data-URI-free, on two roots, and nowhere near the 3D context"*
8. *"scan 4: the halftone declares exactly the pitches the measurement licensed, in one file"*

With them: `LATTICE_ROOTS`, `GROUND_EXCEPTIONS`, `DENSITIES`, the `lattice` entry of
`INSTRUMENT_VOCABULARY`, the `EXEMPT` table (ScreenToggle was the one exemption), the two readers of
`aesthetic.spec.ts`'s `CRT_FILES` (`crtFileIdentifiers`, `constantsOf`) and the `AESTHETIC_SPEC` and
`PAD_FRAME` constants. 6 -> 4.

| Scan | Was                                                                                                                                           | Is                                                                                                                                                                      | Rule changed?                                                                                                    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1    | *"the register line holds from both sides, with Layer G as the one declared exception"* - side A held Layer S to `.front-door`, Layers R and T to FrontDoor.svelte, and Layer G on every route; side B held the pill outside FrontDoor.svelte | *"the register line holds from the instrument side - the pill is authored once, in src/app.css, and never inside FrontDoor.svelte or under .front-door"* - side B alone | **Half the rule deleted with its subject**, the other half unchanged. The plan did not name this rewrite; the scan read `CRT_FILES`, `.pad::after`, `.crt-band` and `body::before` by name and could not survive unedited |
| 2    | *"the pill is Primary's radius and Secondary's outline, ..."*; the ScreenToggle exemption asserted; a message about the 22px cap of a 999px radius | *"the pill is Primary's fill and Secondary's outline, ..."*; the exemption retired with the file; the message says why 24px stays                                       | **A name, not a rule.** The radius half of the subject went at 13-03 (D-10); the title caught up. Both 44px axes and the outline are asserted as before |
| 6    | *"the lattice is a ground - one rule at :where() specificity, declared above .pill, with three named exceptions"*                              | *"the ground is solid - html and body paint the workspace token, nothing is painted over them, and the retired texture vocabulary names no rule and no component"*     | **A new rule.** No ground rule survives to re-aim at, so the scan holds the ground rule the Bible gives (§3, solid surfaces) and the deletion's own vocabulary absent - `body::before`, `.lattice`, `--crt`, `data-screen`, `crt-band`, `crt-roll`, `crt-tear` - in every `.css` and `.svelte` under `src/`, comments stripped. The plan said "the deletion removes its own gate"; it does not have to |

**Neither rewrite changed the count**, and the third did not either: 6 -> 4 is the two deletions.
`data-screen` joined scan 6's list in task 2's commit rather than task 1's, because task 1's tree
still carried `ScreenToggle.svelte` and the scan named it on its first run - which is the scan
working, and the reason the row moved with the deletion.

### `PadFrame`'s allowlist row, before and after

| Allowlist                | Rows | Declarations | `src/lib/ui/PadFrame.svelte`                                                                  |
| ------------------------ | ---: | -----------: | --------------------------------------------------------------------------------------------- |
| before (13-03)           |   15 |           32 | `{ declarations: 2, clearedBy: "13-04" }` - `:94` the frame's `10px`, `:228` Layer S's `4px` |
| after task 1 (`2e15557`) |   14 |           30 | **no row** - the `4px` deleted with Layer S under D-09, the `10px` removed under D-01          |
| after task 2 (`ab49f8f`) |   13 |           28 | (ScreenToggle's row `{ declarations: 2, clearedBy: "13-04 (deleted)" }` gone with the file)   |

The plan's "corners already zero from 13-03" is not what the tree had: 13-03 cleared `app.css`'s
pill and nothing in this file; the frame carried `10px` until this plan. Layer A's print on the green
run: 28 above zero remaining in 13 allowlisted files; 6 circles (D-15) at their six lines, unmoved.

### Where `--action-bloom` went

Nowhere. It is the one custom property left in `:root`, with its two consumers - `PadFrame.svelte`'s
`.pad.hero` (`box-shadow: 0 0 40px`) and `TryOnDevice.svelte`'s `.primary:hover` (`0 0 24px`). It
survived because it is not a texture: §3 reserves glow for the light output, the active selection and
the primary action, and those are exactly the two things it blooms. The `:root` comment says so; the
CRT's two colours that sat beside it went. Whether a 40px glow around the *frame* counts as the light
output's is flagged below for the user rather than decided.

### The grep, and what it still finds

The plan's verification - `grep -rn "crt\|scanline\|halftone\|lattice" src/ --include=*.css
--include=*.svelte` - **does not return nothing on this tree, and cannot until 13-07:**

```
src/lib/ui/ColourPicker.svelte:3,41,47,170,171,293,329   "lattice"   the RGB444 COLOUR lattice (4,096 values) - a different concept, not the texture
src/lib/ui/MixTwo.svelte:183                              "lattice"   the same colour lattice (13-10 deletes the file, D-12)
src/lib/ui/TuningRegion.svelte:467,609                    "lattice"   the same colour lattice
src/lib/ui/Splash.svelte:5,318                            "halftone"  the splash's OWN grain (.grain) - the composition half, 13-07 (D-5)
```

The grep that says what this plan claims, pasted from the tree after both commits:

```
$ grep -rn "data-screen\|--crt\|crt-band\|crt-roll\|crt-tear\|\.lattice\|body::before\|ScreenToggle\|hangar\.screen" src e2e \
    --include=*.ts --include=*.svelte --include=*.css \
  | grep -v "instrument.spec.ts\|session.svelte.ts\|aesthetic.spec.ts\|motion.svelte.ts\|MotionControl.svelte\|+layout.svelte\|radius-allowlist.ts"
(end)
```

The excluded files name the vocabulary only in comments, in scan 6's `RETIRED` list, or in the
header that says what went. **Every comment this plan wrote into a `.css` or `.svelte` file avoids
the lowercase vocabulary** ("the registration field", "the CRT treatment's two colours", "the dot
grain") so the raw grep stays clean without stripping; and `instrument.spec.ts` scan 6 holds the
retired tokens absent, comments stripped, on every run.

### Two negative checks, restored from scratch copies with sha256 either side

| # | Plant                                                                    | Red                                                                                                                                                     |
| - | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A | `body::before { ... background-image: radial-gradient(...) }` appended to `app.css` | scan 6: `src/app.css declares a background-image on "body::before". The ground is solid (§3, D-09) ...` - **there IS a test to go red**, which the plan said there would not be; the SUMMARY's grep found it too (1 hit) |
| B | `.dots`'s `background-color` removed from `PadFrame.svelte`               | scan 8: `PadFrame.svelte's .dots declares no background-color. Without it the cell STRUCTURE on an all-unlit face is invisible ...`                     |

`app.css` `fb851e02...` before and after A; `PadFrame.svelte` `65a34bc8...` before and after B. Both
restores made the build stale (layer B's guard) and were followed by a rebuild before the gated run.

---

## Task 2: the SCREEN switch deleted, its purpose re-homed, and the proof moved rather than lost

### `ScreenToggle.svelte` and the layout

Deleted (267 lines). In `+layout.svelte` the import and the footer comment-plus-control went
together; **the two `onMount` calls (`session.start()`, `install.start()`), the GPLv3 footer's three
links, the SHA and `SessionAnnouncer`'s position before `{@render children()}` were checked and left
verbatim** - the patch asserted each string once after the edit. The footer's last element is now
`<MotionControl />`, with a comment naming 13-05 as the plan that builds the PDF's footer
(`Help & shortcuts · Device actions`, pages 2 to 5) and moves the block under Help & shortcuts.

### The motion control, as landed

| Part               | Where                                    | What                                                                                                                                                                                                                                 |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| the preference     | `src/lib/sim/motion.svelte.ts`           | `MOTION_KEY = "hangar.motion.v1"`, values `animated` (default) and `still`; `storage()` / `recorded()` / `remember()` are `ScreenToggle.svelte:79-109`'s guard copied line for line (the property access inside its own `try`); the recorded choice read once at module scope, before hydration |
| the host input     | `motionDeps()` in the same module        | a `reducedMotion` dependency reporting **`(os matchMedia) \|\| (choice === "still")`**, subscribed to both (the OS query's `change`, and `chooseMotion()`), `stop()` removing both; injected at `BrowseGrid.svelte:335` and `Coverflow.svelte:681` (`new SimHost(motionDeps())`) |
| the control        | `src/lib/ui/MotionControl.svelte`        | one `<input type="checkbox" data-testid="motion-still">` inside a 44px label, `accent-color: var(--color-action)`, no border, no radius; **checked and disabled when the OS asks for less motion**; the explanation is the box's `aria-describedby` |
| the label          | `MOTION_LABEL`                           | **_Keep previews still_**                                                                                                                                                                                                            |
| the explanation    | `MOTION_EXPLANATION`                     | **_Cards hold one frame instead of animating. A pad still answers your finger, and your system’s reduced-motion setting always wins._** (a real apostrophe, U+2019)                                                                  |
| the ledger         | `13-COPY-NEW.md`                         | two rows (symbol, module, state, the facts each must carry, the string, no Bible line) and one question (below)                                                                                                                      |

**What it stops and what it leaves alone.** `host.ts`'s `active()` is the whole mechanism, unedited:
under `reduced` a pad animates only while a finger is on it (the hero's, or a demo card's contact
already in flight), and `demoLooping` and `engine.animating` are both gated off. So the wall holds
one frame per card and the pad under a finger still answers - §6's "animate only the selected or
explicitly previewed card" and §14's "keep motion generated by instrument output controllable", read
as a control. **Additive, never subtractive, by construction:** the OR has no branch in which the
OS's `true` becomes `false`, and the control shows itself checked and disabled rather than offering
a choice that could not take effect.

### `e2e/aesthetic.e2e.ts`, deleted with its five titles, verbatim

Re-read from the file before deletion; **all five were the plan's five, all `@webkit`, no title the
list did not carry, no todo:**

- *"@webkit reduced motion stops both moving layers, and neither was absent"*
- *"@webkit SCREEN: FLAT turns off all four layers, not the two that move"*
- *"@webkit the SCREEN choice survives a navigation and a reload, and the browse grid keeps Layer G alone"*
- *"@webkit Switch 3 removes only the roll bar, and only on four cores"*
- *"@webkit the lattice is a ground and the unlit cell is a cell - both facts only a browser can check"*

Five titles in two projects: `-5 / -10`.

### The re-homed title, and what it asserts

> ***"@webkit reduced motion snaps a normal entry to its representative frame, and it is not tick 0"***

In `browse.e2e.ts`, beside the untagged *"reduced motion stills every card"*, inside the same
`describe` with `test.use({ reducedMotion: "reduce" })` and the explicit `emulateMedia` before
`goto` that `first-experience.e2e.ts`'s *"a still configuration really is still"* established
(`test.use` alone leaves `matchMedia` reporting `false` inside the page). The mechanism is that
file's, already re-derived in `browse.e2e.ts` as `samplePad` and `waitForPicture`: wait for a picture,
sample the 9x9 backing store, sample again 400 ms later, assert equal and lit. **`+1 / +2`.**

**It asserts tick 64, not the weaker thing.** `golden-frames.json` samples ticks 0, 37, 101, 500 and
1009 and pins nothing at 64, and `src/lib/catalog/frames.json` samples the same five - so the plan's
"compare against the entry's own frames row" had no row to compare against. The frame is computed
instead: the title imports `PadSim` from the vendored simulator and `presetById` from HANGAR's own
shelf, builds `new PadSim(preset.state)`, runs it to `REDUCED_MOTION_TICKS` (asserted to be 64), and
compares the browser's 324 RGBA bytes reduced to 243 RGB against it, **byte for byte** (`paintPad`
writes the channels verbatim and alpha 255 or 0, so the reduction is exact). Tick 0 is computed the
same way and asserted **different from tick 64 first**, so "the still frame is not tick 0" cannot
pass vacuously; then the observed frame is asserted not equal to tick 0 and equal to tick 64. Green
in chromium and in webkit-phone. `host.spec.ts`'s fake-clock proof of the same contract is untouched.

**The additive rule is held in the same title**, which the plan allowed ("the new component's own test
or the title's assertion, whichever holds it"): the box is asserted checked and disabled under the OS
preference; then `hangar.motion.v1` is set to `animated` straight into `localStorage` (the key is
written out because `motion.svelte.ts` carries a rune and cannot be imported into Node), the page is
reloaded cold, and the pad is asserted still on the tick-64 frame. It was held here rather than in a
new unit spec so the plan's file term stays `+0`; a unit spec of the OR belongs beside 13-06's store
module, and the ledger and this document say so.

**The file's header changed.** `browse.e2e.ts` said no title in it carried the tag; it now says one
does and names it as the exception, with the reason (a host contract, not one engine's). No gate
greps that file for the tag; `playwright.config.ts` greps titles. The tag is written out nowhere else
in the file.

### `host.ts`, read and not edited

`git diff --quiet -- src/lib/sim/host.ts` exits 0 across both commits. `:267` (the media query
subscription) and `:733-739` (a normal entry runs to tick 64; a demo entry replays once) are cited in
the new title's comment and in `motion.svelte.ts`'s header. The host takes its dependencies through
its constructor - that is why the preference could reach it without a change to the loop.

### Five negative checks, restored from scratch copies with sha256 either side

| # | Plant                                                                                                        | Red                                                                                                                                                                                                                     |
| - | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C | the OS half dropped from `motionDeps()`'s OR (`motion.choice === "still"` alone)                              | the re-homed title, at its **first** hold assertion: `reduced motion holds one frame; 400ms of wall clock must not move it` - the host stopped honouring the OS at all, the defect caught earlier than aimed for          |
| C2 | a recorded `animated` allowed to override the OS (`recorded() === "animated" ? false : os \|\| still`)       | the same title, at the assertion aimed for: `a recorded preference for motion overrode the OS: the control must be additive only`                                                                                        |
| D | the expected frame moved to tick 65 (`at64.run(REDUCED_MOTION_TICKS + 1)`)                                   | `the still frame is not the tick-64 frame the simulator produces for aurora (host.ts:733-739, REDUCED_MOTION_TICKS)` - the comparison tells 64 from 65                                                                  |
| E | `<SessionAnnouncer />` removed from the layout, unit side                                                    | **`device-ui.spec.ts` 13 of 13 green and `config-shape.spec.ts` 14 of 14 green** - the plan's claim is unsupported (the first reads seven device components, never the layout; the second reads specifiers, not usage). **ESLint red:** `'SessionAnnouncer' is defined but never used` |
| E | the same plant, browser side                                                                                 | `session.e2e.ts` *"a session transition is announced once, and the other two regions stay quiet"*: `element(s) not found` at its first live-region read - **the live region's position is gated, by a browser test and a lint rule, not by the unit file the plan named** |

`motion.svelte.ts` `7333e276...` before and after C and C2; `browse.e2e.ts` `0e95e4a7...` before and
after D; `+layout.svelte` `7bb0860d...` before and after both halves of E. C, C2, D and E's browser
half each rebuilt through Playwright's own `npm run preview`.

---

## The e2e suite: three full runs, and the one named

- **Run 1, `--workers 3`: 100 passed**, `check-counts --playwright 100` *matches*.
- **Run 2: 89 passed, 11 failed** - ten `webkit-phone` titles at the tail of the run, nine of them
  `page.goto: Could not connect to server` (`tuning-webkit.e2e.ts:243/295/367/424/497`,
  `session.e2e.ts:628/1219`, `install.e2e.ts:2171`, `radius.e2e.ts:299`) and `install.e2e.ts:2074`'s
  `data-hydrated` never `"true"` - **the exact signature 13-03 recorded** when the `wrangler dev`
  server stopped answering during the WebKit tail; plus one chromium title, `session.e2e.ts:851`
  *"replugging offers the connection back"* (`Expected: 6, Received: 7` snapshot reads), the fake
  ZONA's timing race of the kind 13-01 recorded at `:820`. None names this plan's subject.
- **`webkit-phone` alone, one worker: 16 of 16** (20 before this plan, minus five, plus one).
- **Run 3, `--workers 3`: 100 passed**, *matches*.

Two of three full runs green and the third named, as warning 2 asks: neither one red nor one green
was accepted. The WebKit browser (2336) is installed and every tagged title ran in it, layer C
included.

---

## Counts, as carried names plus deltas

Stated once in the baseline table above and not repeated: **`86 / 886 (+1 todo)`** (`+0 / -8`),
**`84 / 100`** (`-5/-10` then `+1/+2` = `-4/-8`), sweep **`4 19`**, check **585**, catalog 26,
allowlist **13 / 28**.

---

## Deviations from the plan

### 1. [Rule 3 - blocking] `FrontDoor.svelte` edited, and 317 lines of it

Not in the plan's `files_modified`, but on scan 1's allowlist - the plan's own checklist - and the
home of the CRT shell, Layers R and T, Switch 3 and the `screen` import from the file task 2 deletes.
Without the edit the vocabulary could not leave and the build would import a deleted module.

### 2. [Rule 3] The two lattice roots and the two exceptions edited

`browse/+page.svelte`, `ChosenPanel.svelte`, `CatalogCard.svelte`, `BrowseGrid.svelte` - the class
lived on the first two, the A-56 comments on the last two. Not in `files_modified`.

### 3. [Rule 2] `instrument.spec.ts` scan 1 rewritten, not only scans 2 and 6

It read `CRT_FILES` out of `aesthetic.spec.ts`, `.pad::after`, `.crt-band` and `body::before` by
name and could not survive the deletion unedited. Its instrument side is unchanged.

### 4. [Finding] Scan 4 kept; the term is `-8`

Above. The plan's `-9` and its `-6` alternative are both named beside the observation.

### 5. [Rule 2] Scan 6 re-aimed as the deletion's own gate

The plan said there would be no test to go red on a returning CRT selector; there is.

### 6. [Rule 3] `BrowseGrid.svelte` and `Coverflow.svelte` edited to inject `motionDeps()`

Two lines each. The host takes its dependencies through its constructor, and the constructor is
called in these two files; there is no other way to reach it without editing `host.ts`, which the
plan forbids. No gate pins `Coverflow.svelte`'s bytes (checked), and 13-09 deletes it.

### 7. [Design, stated] The additive rule held in the e2e title, not a new unit spec

To keep the plan's file term `+0`; the plan offered either. 13-06 is where a unit spec belongs.

### 8. [Rule 1] `data-screen` joined scan 6's list in task 2's commit

Task 1's tree still carried `ScreenToggle.svelte`; the scan named it. The row moved with the deletion
so task 1 is green on its own gate.

### 9. [Rule 2] `session.svelte.ts`'s `plugged` comment

Its only reader was the tear. The comment names the deletion and the next surface with a reason to
read the counter; the field and its tests stay.

### 10. [Plan vs tree] The dot field kept; the frame's `10px` removed

The plan's "dot-field ground goes" conflicts with its own "scan 8 survives in place" and with D-09,
which does not name the dots; the plan's "corners already zero from 13-03" was not the tree. Both
recorded above; the first is a question below.

### 11. [Process] `gsd-tools state` commands not run; STATE.md by script against a copy

`advance-plan`, `update-progress`, `roadmap update-plan-progress` and `requirements mark-complete`
were not run (13-01 to 13-03's reasons: they corrupt front-matter lines and the `Status:` body;
IDENT-01 and IDENT-02 are already ticked and amended by name at 13-20; `PREV-05` is claimed only in
the sense of not breaking it). `record-metric`, `add-decision` and `record-session` were not run
either: their effects were written by a script that asserts every line it touches (`stopped_at`,
`last_updated`, `last_activity`, the Concurrent paragraph, five decision lines after 13-03's, `Last
session`, `Stopped at` with 13-03's stop retained) and asserts `status: executing`,
`completed_phases: 11`, `completed_plans: 139` and `percent: 100` unchanged. The metrics table
carries no Phase 11 to 13 rows and gained none.

### 12. [Rule 2] `browse.e2e.ts`'s header amended

Its own rule forbade a tag in the file; the plan put one there. The header now names the exception
and its reason rather than being left false.

### 13. [Design] Comments written without the retired lowercase vocabulary

So the raw grep the plan uses as proof stays clean in the files this plan wrote; the reason is in the
grep section.

---

## What the plan asserts that the tree does not support

1. **`PREV_TESTS 895` / `86 886`** - observed 894; the term is `-8`; `886` coincides.
2. **"`-9` on tests", "or `-6` if scan 4 keeps a live subject"** - `-8`; six plus two.
3. **"Scan 4 ... its subject is ... CRT-adjacent geometry that this plan removes from `app.css`"** -
   its subject is `Coverflow.svelte`'s, which this plan does not touch.
4. **"`PadFrame`'s four-layer recipe becomes two ... the dot-field ground go[es]"** - the dots are the
   pad's unlit-cell mark, asserted by the scan 8 the plan keeps; Layer S was the texture and went.
5. **"Corners already zero from 13-03"** - the frame carried `10px` until this plan.
6. **"`app.css`: ... the noise tile and its filter"** - the tile lived in `PadFrame.svelte` (scan 6 of
   the old file asserted exactly that); it went from there.
7. **"Two more are rewritten"** - three; scan 1 too.
8. **"there is no longer a test to go red"** on a returning CRT selector - scan 6 goes red naming it.
9. **"delete the `SessionAnnouncer` line ... expect `device-ui.spec.ts` red"** - it stays green; ESLint
   and `session.e2e.ts` go red.
10. **"`grep ... returns nothing`"** - it returns the RGB444 colour lattice and Splash's grain; the
    precise grep returns nothing.
11. **"`106 - 10 + 2 + 2`"** - `108 - 10 + 2`; 13-01's radius title was already in the 108.
12. **"compare against ... the entry's own `frames.json` row"** - no row samples tick 64; computed.
13. **"`ScreenToggle.svelte:81`"** - the guard is `:79-109` (`storage()` at `:79`, the `try` at `:80`).
14. `files_modified` omits `FrontDoor.svelte`, `Coverflow.svelte`, `BrowseGrid.svelte`, the two roots,
    the two exceptions, `session.svelte.ts` and the two files this plan creates.

---

## Questions recorded for the user rather than answered (D-01)

1. **The disabled state's words.** When the OS already asks for less motion the control is shown
   checked and disabled with the same explanation, whose last clause states the rule. Is a third,
   state-specific string wanted (*Your system asks for less motion, so previews are already still.*),
   or is the rule stated once enough? Ledgered for 13-18.
2. **The dot field.** The plan says it goes; scan 8 and D-09 say it stays; the PDF's page-5 matrix
   draws plain dark cells with no dot. It was kept. Should 13-07 / 13-09, which re-skin the pad, drop
   the dots and keep only the wash - which would retire scan 8's dot half by name?
3. **The hero's bloom.** `--action-bloom` at 40px around the hero frame was kept as "the light
   output's glow" under §3. The Bible reserves glow for the light output itself; a glow around the
   frame is a reading of that sentence, not a quotation. Keep or cut at 13-07?
4. **`session.plugged`.** A counter with no reader, kept for the device UI (13-11). Keep or delete?

Flagged for attention, not asked: `Coverflow.svelte` gained two lines despite Phase 10's promise not
to touch it (no gate pinned it; 13-09 deletes it); `docs/TESTING.md` still lists `aesthetic.spec.ts`
at 8, `instrument.spec.ts` at 6 and `e2e/aesthetic.e2e.ts` at 5 / 10 (13-20 rewrites); the plan's
verify line runs the unit scan before the build, and layer B needs the build first.

---

## What was NOT done, and why

- **NOTHING HERE IS HARDWARE-VERIFIED. No device was touched. Nothing was deployed.**
- **`src/vendor/` unmoved (`git diff --quiet HEAD~2 -- src/vendor/` exit 0); `firmware-oracle.spec.ts`
  unedited and green; `src/lib/sim/host.ts` read and not edited; `.planning/ROADMAP.md` and
  `.planning/REQUIREMENTS.md` byte-unchanged (CAT-04 stays `[ ]`); nothing under
  `.planning/phases/12-touch-framework/` touched; no sibling repository read.** D-15's six circles
  untouched at their six lines.
- **`prettier --write .` was not run**; only `instrument.spec.ts` and `browse.e2e.ts` were formatted,
  each after its own edit. The three user files at the repository root are untouched.
- **No `git checkout`, `git restore`, `git stash` or `git clean`**; every negative check restored from
  a scratch copy with its hash printed either side.
- **No commit overlapped a suite run.** The docs commit follows the third full e2e run and the sweep.
- The patch scripts, the restore copies, the Playwright logs and the STATE script live in the
  session scratchpad outside the tree; `git status --porcelain` shows only the user's three root files.

## Notes for the next plans

- **Build before a gated quick run** whenever a `.svelte` or `.css` moved, and after any `cp` restore.
- **13-05:** mount the shell's footer; move `<MotionControl />` under Help & shortcuts unchanged; the
  layout comment names you. **13-06:** `hangar.motion.v1` into the store module; a unit spec of
  `motionDeps()`'s OR belongs there.
- **13-07:** Splash's `.grain` is the last "halftone" in `src/`; the dot-field question above.
  **13-09:** delete `aesthetic.spec.ts` scan 4 by name with `Coverflow.svelte`; NamePlate's and
  ChosenPanel's rows. **13-11:** `session.plugged`. **13-18:** two rows, one question.
  **13-20:** the allowlist at thirteen / twenty-eight; the terms above; `docs/TESTING.md`.

---

## Self-Check: PASSED

Every file this document names as created or modified exists on disk, both deleted files are absent,
both task commits resolve in `git log --oneline --all`, and no stub marker (TODO, FIXME, placeholder)
is in any created file:

```
FOUND  src/lib/sim/motion.svelte.ts
FOUND  src/lib/ui/MotionControl.svelte
FOUND  src/app.css
FOUND  src/lib/ui/PadFrame.svelte
FOUND  src/lib/ui/FrontDoor.svelte
FOUND  src/routes/browse/+page.svelte
FOUND  src/lib/ui/ChosenPanel.svelte
FOUND  src/lib/ui/CatalogCard.svelte
FOUND  src/lib/ui/BrowseGrid.svelte
FOUND  src/lib/ui/Coverflow.svelte
FOUND  src/lib/ui/radius-allowlist.ts
FOUND  src/lib/device/session.svelte.ts
FOUND  src/lib/ui/aesthetic.spec.ts
FOUND  src/lib/ui/instrument.spec.ts
FOUND  src/routes/+layout.svelte
FOUND  e2e/browse.e2e.ts
FOUND  .planning/phases/13-gui-overhaul/13-COPY-NEW.md
FOUND  .planning/STATE.md
FOUND  .planning/phases/13-gui-overhaul/13-04-SUMMARY.md
ABSENT src/lib/ui/ScreenToggle.svelte
ABSENT e2e/aesthetic.e2e.ts
FOUND  commit 2e15557
FOUND  commit ab49f8f
```
