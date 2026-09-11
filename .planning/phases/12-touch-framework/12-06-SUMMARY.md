---
phase: 12-touch-framework
plan: 06
subsystem: catalog
tags:
  [
    joystick,
    checkpoint,
    user-decision,
    as-is,
    non-delivery,
    trackpad,
    hand-off,
    picker-corner,
    negative-check,
    counts,
  ]
requires:
  - phase: 12-touch-framework
    plan: 09
    provides: "PREV_FILES 85 / PREV_TESTS 887 as the plan carried them; the tree has since moved under Phase 13 (see Counts)"
  - phase: 11-bench-corrections
    plan: 06
    provides: "JOYSTICK's centre-from-power-on, the trail measured as exclusive with the dot, and the four look layers costed"
provides:
  - "THE USER'S ANSWER, VERBATIM, IN TWO PLACES: 'as is, selectable tuning options under Trackpad' - in JOYSTICK's comment in src/lib/catalog/presets.ts and here"
  - "JOYSTICK UNCHANGED BY THE USER'S CHOICE: the six-option table written into the comment at the RGB444 picker corner (trail 488, shimmer 614, wave 634, swirl 653, ripple 664, as-is 551), the 'more led animation, trail or something' half of the 2026-09-09 note a NAMED NON-DELIVERY with the reason"
  - "551 REPRODUCED: Pass B over 4,096 lattice colours at the defaults, Pass A over 540 non-colour states at the dearest pin 102,102,102 AND at 255,255,255 - max Setup 551 on both, Timer 24, over budget 0; the plan's 532 was never a corner figure"
  - "NOTHING REGENERATED, PROVED RATHER THAN ASSUMED: UPDATE_GOLDEN=1 then UPDATE_FRAMES=1 both ran (each failing by design at exit 1) and frames.json / golden-frames.json hash exactly as before; the OG image rebuilt at 4,326 bytes, sha256 identical; front-door.ts untouched, ring 2 / 4 / 6 and all three asserted properties holding unchanged"
  - "THE TRACKPAD HALF HANDED TO 12-10 BY NAME, with the orchestrator's reading and the measurement condition: neither beside nor replace - folded into one TRACKPAD card as a selectable tune option, on a HANGAR-authored TRACKPAD over the touch library, measured at the picker corner with the look knob at its dearest pin; if it does not fit 908, 12-10 returns to the user"
  - "deferred-items.md item 5: three rows for 12-12 (C.3's closing sentence, the missing audition row, the TESTING.md cost row)"
affects:
  - "12-10 (reads the TRACKPAD answer first; its 'beside' default is not the answer, and its files are unchanged by this plan)"
  - "12-12 (owns the three rows in deferred-items.md item 5; rebuilds the chains - this plan's term is +0 everywhere)"
  - "13-07 (inherits src/lib/catalog/front-door.ts and front-door.spec.ts, still the ring today, untouched here)"
tech-stack:
  added: []
  patterns:
    - "An as-is answer is proved as-is: the fixture regenerators are RUN and shown byte-identical, rather than a diff of files nobody touched being read as evidence"
    - "A plan's quoted cost is re-measured at the picker corner before it is written into a header, and the defaults figure is named beside it so a reader can tell which one they are looking at"
key-files:
  created:
    - .planning/phases/12-touch-framework/12-06-SUMMARY.md
  modified:
    - src/lib/catalog/presets.ts
    - .planning/phases/12-touch-framework/deferred-items.md
    - .planning/STATE.md
key-decisions:
  - "The user's: JOYSTICK stays as is; the trail and the four look layers are costed in the comment and none is taken"
  - "The user's: TRACKPAD's edge flash becomes 'selectable tuning options under Trackpad' - read by the orchestrator as one card with a tune option, not a card beside the preset; 12-10 acts on it, this plan does not"
  - "The three rows the as-is branch leaves behind (C.3, the audition row, the TESTING.md row) are written for 12-12 and not applied here, because 12-12 owns those files and an audition row is +1 against a declared +0"
patterns-established:
  - "A checkpoint answer that is neither of the options offered is recorded verbatim, read once by the orchestrator in writing, and handed to the consuming plan with a measurement condition rather than acted on by the plan that asked"
requirements-completed: [CONT-01]
duration: 14min
completed: 2026-09-11
---

# Phase 12 Plan 06: JOYSTICK's Visual, Asked and Answered Summary

**The user chose "as is" from six costed options, so JOYSTICK does not move: the
option table and the answer are written into the card's own comment at the
picker corner (551, not the plan's 532), the "more led animation" half of the
bench note is a named non-delivery with its reason, and nothing regenerated -
proved by running both regenerators and hashing. The TRACKPAD half of the
answer is neither of the two options offered and is handed to 12-10 with a
reading and a condition.**

## Performance

- **Duration:** 14 min for task 02 (task 01 was presented by the previous
  session; its report is `12-06-HANDOVER.md`)
- **Started:** 2026-09-11T06:08Z
- **Completed:** 2026-09-11T06:22Z
- **Tasks:** 2 of 2 (01 the checkpoint, answered; 02 the as-is branch)
- **Files modified:** 2 in the task commit, plus STATE.md and this file in the
  docs commit

## Commits

| Task | Commit    | Files                                                                          |
| ---- | --------- | ------------------------------------------------------------------------------ |
| 01   | (none)    | the checkpoint, presented and answered; `12-06-HANDOVER.md` is its report      |
| 02   | `56cc551` | `src/lib/catalog/presets.ts`, `.planning/phases/12-touch-framework/deferred-items.md` |

## The answer, verbatim

Asked *"which visual JOYSTICK gets - trail, shimmer, wave, swirl, ripple, or
as-is - and whether GLIDE is built beside the trackpad preset or replaces it"*,
the user answered:

> **"as is, selectable tuning options under Trackpad"**

Both halves are recorded in JOYSTICK's comment in `src/lib/catalog/presets.ts`
in exactly those words, and here.

**The first half is JOYSTICK's** and selects the plan's `as-is` branch.

**The second half is TRACKPAD's, and it is neither `beside` nor `replace`.**
It is handed to 12-10 below; nothing in this plan acts on it and nothing in
12-10's files was touched.

## Counts, as observed baseline plus this plan's term

The plan carries `PREV_FILES 85 / PREV_TESTS 887` from 12-09 (wave 9, plan 06:
the wave order and the plan order differ here, and 12-12 reconciles them). The
tree has moved under those names since the handover: Phase 13 ran six waves
(13-01 to 13-06) alongside Phase 12 while this plan stood open. So the numbers
below are the **observed baseline at `c3fd9e3`**, measured at this plan's
start, and this plan's term is **`+0` everywhere** - as-is moves no count. The
offset between the carried names and the observed baseline is Phase 13's and
is **not reconciled here**; 12-12 and 13-20 rebuild the totals.

| Name         | Carried (12-09)      | Observed at `c3fd9e3`               | This plan | After `56cc551`                    |
| ------------ | -------------------- | ----------------------------------- | --------- | ---------------------------------- |
| `PREV_FILES` | 85                   | **88**                              | **+0**    | **88**                             |
| `PREV_TESTS` | 887                  | **902** (+1 todo)                   | **+0**    | **902** (+1 todo)                  |
| sweep        | `4 19`               | `4 19` (107 s)                      | +0 / +0   | `4 19` (not re-run; comment-only)  |
| `BASE_CHECK` | 581                  | **603** files, 0 ERRORS 0 WARNINGS  | +0        | **603**, 0 / 0                     |
| catalog      | 26 (9 + 17)          | 26                                  | +0        | 26                                 |
| OG images    | 26                   | 26 (gitignored)                     | +0        | 26                                 |
| e2e          | 87 titles / 106 runs | **84 titles / 100 runs** (`--list`) | +0        | 84 / 100 (not run; comment-only)   |
| lint         | clean                | clean                               | -         | clean                              |

`check-counts.mjs 88 902` matched before and after; the plan's verify literal
`85 887` is stale under Phase 13 and was not used (deviation 1). The sweep was
run once, at the start, on the tree this plan did not change: a comment edit
in `presets.ts` cannot move a compiled state, and `presets.spec.ts` test 4
re-measures all nine byte-exact against the compiler in the quick run that
was done.

## The six costs, quoted and re-measured

Every figure at the RGB444 picker corner: Pass B over the 4,096 lattice
colours at the knob defaults; Pass A over the full non-colour cross-product
(`send` 12 x `bend` 3 x `spring` 3 x `brightness` 5 = 540 states) at the
dearest pin, and again at 255,255,255. Measured through Vite's Node API
against `src/lib/pad/index.ts`, `src/lib/tune/state.ts` and
`src/lib/share/stamp.ts` - the same modules the sweep costs a card through.

| Option        | Plan quoted | Handover, corner | Task 02, corner   | Timer | Free of 908 |
| ------------- | ----------- | ---------------- | ----------------- | ----- | ----------- |
| trail (comet) | 468         | 488              | not re-run        | 24    | 420         |
| shimmer       | 603         | 614              | not re-run        | 55    | 294         |
| wave          | 621         | 634              | not re-run        | 55    | 274         |
| swirl         | 641         | 653              | not re-run        | 55    | 255         |
| ripple        | 652         | 664              | not re-run        | 55    | 244         |
| **as-is**     | **532**     | **551**          | **551, both pins** | 24    | **357**     |

**The chosen option was re-measured, as the plan requires, and reproduces the
handover's 551 exactly**: max Setup 551 at the pin `102,102,102` (index 1638,
Pass B's dearest at 549) and 551 again at `255,255,255`; max Timer 24; over
budget 0 on all 540 states each. The worst vector is `send 0, bend 0, spring
1` with brightness at either 4 or 2.

**The plan's 532 was never a corner figure and was not the defaults figure
either.** The preset state at its defaults measures **543** - the number in
`presets.ts`'s `cost` line and in 11-06's comment, re-measured here. A TUNED
state at the same knob defaults measures **547**: `withChange` deletes
`state.preset` (load-bearing, `src/lib/tune/state.ts:11` - it is what makes a
stamp long-form), and the compiler's output moves four characters for it. The
sweep and the corner figure are of the tuned state, so 551 is the right number
for the header and 543 the right number for `cost`; the comment now says which
is which. The five options not taken were not re-run: the handover measured
all six on 2026-09-11 against a `presets.ts` no plan has touched since, and
this plan's term does not include a look layer.

## The front door under the chosen branch

Nothing moves, and the derivation is restated from the tree rather than
assumed. `src/lib/catalog/front-door.ts`'s ring reads aurora, pinwheel,
**ninepads**, starfield, **joystick (index 4)**, radar, **faders**, dial; the
row's joystick entry declares `motion: "static"` with the quiet line
byte-equal to the shelf's. The three asserted properties hold as they did:

- no dark pad in the opening window (indices 5, 6, 7, 0, 1, 2, 3; tpad is
  excluded from the row);
- dial, aurora and pinwheel at offsets -1, 0, +1 all move;
- the quiet pads sit at 2, 4 and 6, so no two are adjacent, including across
  the wrap.

The handover's observation stands and is worth carrying: **index 4 is the only
slot outside the opening window**, so JOYSTICK is the one card a visitor
scrolls to reach. `front-door.spec.ts` was run in the catalog pass (16 files /
114 tests green, 1 todo) and no assertion was weakened, because none was
touched.

**13-07 inherits `front-door.ts` and `front-door.spec.ts`.** They are still the
ring today and 13-07 dismantles the ring to a single hero after this plan
closes; nothing was done to either file here beyond leaving them as they are.

## What did not move, with the hashes

| Fixture                              | Before      | After regeneration | Moved |
| ------------------------------------ | ----------- | ------------------ | ----- |
| `src/lib/fidelity/golden-frames.json` | `bf54f15c…` | `bf54f15c…`        | no    |
| `src/lib/catalog/frames.json`         | `f9143d6f…` | `f9143d6f…`        | no    |
| `static/og/joystick.png` (gitignored) | 4,326 B, `72e57af9…` | 4,326 B, `72e57af9…` after `npm run build` | no |

`gen-og` reports JOYSTICK at **1 of 81 cells lit** - the power-on centre cell -
which is the picture the user kept. `static/og/` holds 26 files after the
build; GLIDE's twenty-seventh, or whatever 12-10 now ships, arrives one wave
later. `frames.json`'s joystick rows (`nonZeroBytes` 2 at rest, `animating`
false at all five ticks) and `golden-frames.json`'s hash are exactly what the
handover derived; **no row and no hash is listed as moved because none did.**

## The negative check, with both exit codes

The plan's as-is check is *"`git diff --stat` is empty of fixtures"*. Read
literally that is green on a tree nobody regenerated, which proves nothing
(warning 1: when a negative check comes back green, suspect the check). So it
was run in the form that can fail:

1. `UPDATE_GOLDEN=1 npx vitest run --project server src/lib/fidelity/golden-frames.spec.ts`
   - **exit 1, by design**: the regenerator ran and its own "refuses to run in
   regeneration mode" test reddened, which is the proof it rewrote the file.
2. `UPDATE_FRAMES=1 npx vitest run --project server src/lib/catalog/frames.spec.ts`
   - **exit 1, by design**, same mechanism, run second because motion is
   derived from the golden frames.
3. `sha256sum` on both fixtures: identical to the scratch copies taken before
   the plan's first edit.
4. `git diff --stat -- frames.json golden-frames.json static/og docs/HARDWARE-AUDITION.md front-door.ts front-door.spec.ts listing.ts`
   - **exit 0 and empty.**

Scratch copies of both fixtures and of `STATE.md` were taken to the scratchpad
before anything ran; no `git checkout`, `restore`, `stash` or `clean` was
used, and none was needed.

## The hand-off to 12-10

The user's words for the TRACKPAD half are, verbatim, **"selectable tuning
options under Trackpad"**. That is neither `beside` (the plan's default) nor
`replace` (the alternative offered). The orchestrator's reading, which 12-10
reads first and this plan does not act on:

> The edge-flash is **folded into TRACKPAD as a selectable tune option** - one
> card, the trackpad's two-finger scroll / tap / right-click kept, the look
> chosen in its own tune panel. 12-10's plan says the vendored preset sits at
> 907 of 908 and the compiler strips looks from a trackpad state, so this
> needs a **HANGAR-authored TRACKPAD on Phase 12's touch library** (as the
> nine presets were re-fitted in 12-08/12-09) measured at the picker corner
> with the look knob at its dearest pin; **if it does not fit 908, 12-10
> returns to the user rather than shipping "beside"**.

One correction of fact to the parenthesis, so 12-10 does not go looking for
the wrong precedent: 12-08 and 12-09 re-fitted seven **hand-authored Lua
entries** onto the library (EUCLID, STEPS, RADAR POINTS, SONAR; CHORUS,
CONSOLE, MORPH), not the nine presets; the shape meant is the same - a
hand-authored entry over `TOUCH_LIBRARY`, costed at the picker corner - and
`glide.ts` in 12-10's plan is already that shape. What changes for 12-10 is
the **id, the card count and the gestures**: one TRACKPAD card, the `tpad`
preset's three gestures kept, the look a knob, and the catalog `+0` rather
than `+1` if the preset is what the entry replaces in the listing - 12-10 says
which, measured, and returns to the user if 908 does not hold with the look
knob at its dearest pin. **Nothing in 12-10's files was changed by this
plan.**

## Deviations

### 1. [Rule 3 - Blocking] The plan's verify literal `85 887` is stale under Phase 13; the observed baseline `88 902` was used

The plan was written when 12-09 left 85 / 887. Six Phase 13 waves landed while
the checkpoint stood open; `check-counts.mjs 85 887` would fail on a tree this
plan did not change. The observed baseline at `c3fd9e3` was measured once at
the start (88 / 902 +1 todo, check 603, e2e 84 / 100, sweep `4 19`, catalog
26) and the plan's term was applied to it as `+0`. The offset is not
reconciled; 12-12 and 13-20 own the totals.

### 2. [Rule 2 - Missing critical functionality] The as-is negative check was run in a form that can fail

See "The negative check". Both regenerators were run and both fixtures hashed
either side, rather than reading an empty diff of untouched files as evidence.

### 3. [Process] The deferred row was written into Phase 12's `deferred-items.md`, and Phase 11's C.3 was not edited

The plan says *"into `deferred-items.md`'s successor list (12-12 owns the file;
note the row for it)"*. The successor list is
`.planning/phases/11-bench-corrections/deferred-items.md` C.3, which 12-12's
plan already marks *answered (12-06, verbatim)* and owns. So the row was
written as item 5 of Phase 12's `deferred-items.md` - the phase's append-only
file, which 12-05, 12-08 and 12-11 each appended to - with C.3's closing
sentence spelled out for 12-12 to apply.

### 4. [Process] Six of the plan's eight `files_modified` are untouched, by the branch chosen

`front-door.ts`, `front-door.spec.ts`, `listing.ts`, `frames.json`,
`golden-frames.json` and `docs/HARDWARE-AUDITION.md` are the look-layer and
trail branches' files. Under `as-is` none moves. `static/og/joystick.png` is
gitignored (`.gitignore:23`, `static/og/`), so that row is unsatisfiable in
any branch - 12-05 recorded the same for ninepads; the image was rebuilt and
its bytes recorded instead. `docs/HARDWARE-AUDITION.md` has **no JOYSTICK
row** (the handover found it); adding one is `+1` against this plan's declared
audition `+0`, so it was not added and the row is written for 12-12 in
`deferred-items.md` item 5.

### 5. [Process] `gsd-tools state` commands not run; STATE.md by script against a copy

`advance-plan`, `update-progress`, `roadmap update-plan-progress`,
`requirements mark-complete`, `record-metric`, `add-decision` and
`record-session` were not run (12-09's measured reasons: they corrupt three
frontmatter lines and `advance-plan` destroys the `Status:` body). STATE.md was
edited by a script that asserts every line it touches, with `status:
executing`, `completed_phases 11`, `percent 100`, `total_phases 14` and
`total_plans 160` asserted unchanged, and Phase 13 kept alongside Phase 12 at
6 of 20. `.planning/ROADMAP.md` and `REQUIREMENTS.md` are byte-identical;
**CAT-04 stays `[ ]`**.

## What the plan or the handover asserts that the tree no longer supports

1. **"as is, 532" and "trail, 468"** in the plan's table - 551 and 488 at the
   corner, 543 and 479 at the defaults (the handover's correction, reproduced
   for as-is above).
2. **`PREV_FILES 85 / PREV_TESTS 887`, e2e 87 / 106, check 581** - the
   handover's and the plan's baseline; the tree is 88 / 902, 84 / 100, 603
   under Phase 13. This plan's term is `+0` against either.
3. **"12-10 builds ... beside the `tpad` preset unless you say otherwise"** -
   the user said otherwise, in words that are neither option; recorded above.
4. **The handover's "12-10 and 12-12 wait behind it"** still holds; **"12-11
   ran ahead"** did, and its SUMMARY is on disk.
5. **`presets.ts:160-200` and `front-door.ts:150-176`** in `read_first` - the
   JOYSTICK declaration now spans `:166-275` after this plan's comment, and the
   ring's header paragraph sits at `:150-166` with the table at `:140-148`;
   near enough to find, not exact.
6. **STATE.md's own two lines disagree about Phase 12's count**: the `Plan:`
   line read *9 of 12 complete* (nine SUMMARY files on disk before this one)
   while the Phase 13 `Concurrent` line read *stands at 10 of 12 with 12-06
   open*. Ten is right after this plan; the `Plan:` line now says so and the
   `Concurrent` line is left as Phase 13 wrote it, with a dated clause noting
   12-06 closed after 13-06.
7. **The handover's "the four look-layer figures have not moved by a character
   since 11-06"** - not re-checked here; no plan has touched `presets.ts`'s
   JOYSTICK state since, and this plan's edit is a comment.

## Known Stubs

None. No code path was added; the one file edited under `src/` gained a
comment.

## Notes for the next plans

- **12-10**: read "The hand-off to 12-10" first. The answer is not `beside`.
- **12-12**: `deferred-items.md` item 5 has three rows for you; this plan's
  term is `+0` in every chain, in plan order and in wave order alike.
- **13-07**: `front-door.ts` and `front-door.spec.ts` are yours to dismantle;
  they were not touched here and still assert the eight-entry ring.

## Self-Check: PASSED

- `src/lib/catalog/presets.ts` contains the verbatim answer: FOUND
  (`grep -c 'as is, selectable tuning options under Trackpad'` = 1).
- `.planning/phases/12-touch-framework/deferred-items.md` item 5: FOUND.
- Commit `56cc551`: FOUND in `git log`.
- `frames.json` `f9143d6f…`, `golden-frames.json` `bf54f15c…`: unchanged.
- `git diff --quiet -- src/lib/fidelity/firmware-oracle.spec.ts src/lib/fidelity/preset-baseline.json`: exit 0.
- `git diff --stat HEAD -- src/vendor/`: empty. `git diff --quiet -- .planning/ROADMAP.md`: exit 0.
- Nothing under `.planning/phases/13-gui-overhaul/`, `src/lib/store/`,
  `src/lib/ui/shell/`, `src/lib/ui/intro/` touched. No device, no deploy.

## STATE.md, and how it was updated

Copied to the scratchpad first (sha256 `27c06d86…`, 873 lines). A script
rewrote the `Plan:` line (9 -> 10 of 12, 12-06 described), the `Status:` body
(the previous one retained as `Previous status, retained (12-11):`), appended
a dated clause to Phase 13's `Concurrent` line, added the `Phase 12 P06`
metrics row in plan order after P05, added three `[Phase 12]: 12-06:`
decisions, and rewrote `stopped_at`, `last_updated`, `completed_plans`
(139 -> 140), `Last session` and `Stopped at`. Asserted unchanged before the
write: `status: executing`, `completed_phases: 11`, `percent: 100`,
`total_phases: 14`, `total_plans: 160`, and every Phase 13 line other than the
one clause. No gsd-tools state command was run.
