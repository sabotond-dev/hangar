---
phase: 12-touch-framework
plan: 10
subsystem: catalog
tags:
  [
    trackpad,
    edge-flash,
    timer-side-look,
    touch-library,
    replace,
    over-budget-fixture,
    picker-corner,
    negative-check,
    counts,
    user-decision,
  ]
requires:
  - phase: 12-touch-framework
    plan: 06
    provides: "The user's answer, verbatim: 'as is, selectable tuning options under Trackpad' - neither beside nor replace - and the hand-off's condition: a HANGAR-authored TRACKPAD on the library, measured at the picker corner, back to the user if it does not fit 908"
  - phase: 12-touch-framework
    plan: 07
    provides: "TOUCH_LIBRARY, 769 of 908, with D(n,l,w) - glpfs at rate 250 plus glt(w//6) - as the phase-0 decay this card's flash lands on"
  - phase: 11-bench-corrections
    plan: 05
    provides: "HANGAR's own nine in src/lib/catalog/presets.ts, which is where the tpad preset stays when it leaves the catalog"
provides:
  - "TRACKPAD (id `trackpad`), a hand-authored entry carrying the vendored trackpad recipe's EVERY gesture byte for byte - pointer, two-finger scroll, tap-to-click, the fast tap as one code 9, right-click on two, the 24-deep drain, the pointer hold-off, the 250 ms idle reset, the Timer's button release - plus the bench's edge flash as a TUNE OPTION with an off state that is the plain trackpad"
  - "THE FLASH LIVES IN THE TIMER, BY MEASUREMENT: the recipe is 893 of 908 under HANGAR's marker and every Setup-side flash is over 908 (1113 with everything kept, 942 with everything cut that is not a gesture); stored as `s.u,s.v=f,h` (11 characters) and painted from the Timer, the two events read Setup 903 at EVERY knob state and Timer 488 at the RGB444 picker corner / 486 at the defaults, both fixed points of compressScript"
  - "FOUR KNOBS, ALL IN THE TIMER: edge flash true/false, colour through the picker, width 3/5/7 cells, fade 42/31/21 ticks; every brightness `@T*(16-k*k)//16*6` a multiple of six by construction, the twelve reachable values asserted in the VM and read down to phase 0; shape character `8`, format `w`"
  - "THE tpad PRESET LEAVES THE CATALOG AND STAYS ON THE SHELF: eight ported cards, nine declared presets, presets.spec.ts untouched; `portedEntry('tpad')` and model.ts's entryFor fallback keep /dev/tune/, ladder.spec.ts and e2e/tuning.e2e.ts on the compiler's over-budget fixture with every number unchanged"
  - "EVERY GESTURE PROVED IN THE VM in lua-smoke.spec.ts's 23rd test: wire x 40x5 after a three-move hold-off, y -40x8, tap press at hid 0 and release at hid 3, a code-9 tap clicks, two fingers tapping press button 2, five scroll notches of -1 with no pointer and no light, the right column and the top row at 180/228/246/228/180, black inside 42 ticks, seven cells at fade 21 black inside 21, and the off state lighting nothing while the pointer moves"
  - "THE DECAY GATE IS BLIND TO A D( CALL, MEASURED: a 250 through D in the Timer leaves decay-idiom.spec.ts green; the smoke test is the phase-0 proof for this card, recorded for 12-12"
  - "Catalog BASE_CATALOG - 3 + 0 (26, split 8 + 18); static/og/ 26 - 1 + 1 (trackpad.png 4,443 bytes, 4 of 81 lit); frames.json regenerated, tpad's row gone, trackpad's 0 bytes / animating true at all five ticks; golden-frames.json byte-identical after regeneration; audition 22 + 1; lua-smoke 22 + 1; touch-guard rows 1 + 3"
affects:
  - "12-12 (deferred-items.md item 6: the dead /c/tpad/ address, CONT-01's 'nine', the D( blindness, TESTING.md's rows, the touch-guard count; the counts to rebuild)"
  - "13-07 (front-door.ts and front-door.spec.ts, one slot and one line moved here, still the ring)"
  - "Phase 13 (stale Trackpad prose in PadFrame.svelte, CatalogCard.svelte, c/[id]/+page.ts and +page.svelte, browse.e2e.ts - listed in item 6, none load-bearing)"
tech-stack:
  added: []
  patterns:
    - "A look that does not fit the Setup beside the gestures is painted from the Timer off a stored net delta: the Setup pays eleven characters, the Timer pays the look, and the knobs live where the room is"
    - "A brightness formula that ends in *6 is a phase-0 proof by construction, asserted in TypeScript from the same formula and then read in the VM, because the decay gate cannot see through a library call"
    - "A shelf card can leave the catalog without leaving the shelf: the preset stays declared, diffed and tunable as a fixture, and a named list in catalog.spec.ts says which one"
key-files:
  created:
    - src/lib/catalog/entries/trackpad.ts
    - .planning/phases/12-touch-framework/12-10-SUMMARY.md
  modified:
    - src/lib/catalog/index.ts
    - src/lib/catalog/entries/ported.ts
    - src/lib/catalog/catalog.spec.ts
    - src/lib/catalog/presets.ts
    - src/lib/catalog/library.ts
    - src/lib/catalog/touch-guard.spec.ts
    - src/lib/catalog/frames.spec.ts
    - src/lib/catalog/frames.json
    - src/lib/catalog/listing.ts
    - src/lib/catalog/front-door.ts
    - src/lib/catalog/front-door.spec.ts
    - src/lib/catalog/audition.spec.ts
    - src/lib/sim/demo.ts
    - src/lib/sim/demo.spec.ts
    - src/lib/sim/lua-smoke.spec.ts
    - src/lib/tune/model.ts
    - src/lib/tune/ladder.spec.ts
    - src/lib/tune/colour-picker.spec.ts
    - src/lib/tune/surprise.spec.ts
    - src/lib/tune/reachability.sweep.spec.ts
    - src/lib/share/stamp-roundtrip.sweep.spec.ts
    - src/lib/device/wire-pin.spec.ts
    - src/lib/ui/aesthetic.spec.ts
    - src/routes/dev/tune/+page.svelte
    - docs/HARDWARE-AUDITION.md
    - .planning/phases/12-touch-framework/deferred-items.md
    - .planning/STATE.md
key-decisions:
  - "The user's, acted on: one TRACKPAD card with the flash as a selectable tune option - not beside, not the plan's replace either, because the preset's gestures are kept whole"
  - "The flash is painted from the Timer, because no Setup-side shape fits 908 with the four gestures kept (measured 942 at best) and the Timer has 767 free"
  - "The id is `trackpad`, not `tpad`: four vendored-shelf fixtures and gates key on `tpad` and will keep describing the vendored preset; the D-09 test forbids a Lua entry under a shelf id; the over-budget probe needs the preset tunable"
  - "The tpad preset stays on HANGAR's shelf (nine declared, presets.spec.ts untouched) and leaves the catalog (eight carded); `portedEntry` and a one-line fallback in model.ts's entryFor keep the probe alive with its numbers unchanged"
  - "TRACKPAD keeps the preset's three tags, `still` included, on facets.ts's own definition (nothing moves on its own; MORPH is the precedent), so the FEELS histogram moves by zero"
  - "The recipe's three event-code guards are carried verbatim and DECLARED in touch-guard.spec.ts rather than narrowed to satisfy a text scan"
patterns-established:
  - "Measure the fold at the corner before designing the descriptor; when the Setup cannot hold a look beside the gestures, ask what the handler already knows and let the Timer paint it"
  - "A demo path for a gesture card is measured against the card's own idle reset and hold-off, not assumed: the first draft here shipped a black picture and the trace said why"
requirements-completed: [CONT-02, CONT-03, PREV-01, SHARE-04]
duration: 64min
completed: 2026-09-11
---

# Phase 12 Plan 10: TRACKPAD, the Edge Flash as a Tune Option Summary

**One trackpad card. The vendored recipe's every gesture kept byte for byte,
and the bench's edge flash - the edge the finger moves toward, centred on the
finger, rounded, fading to exact black - added as a tune option with an off
state that is the plain trackpad. It fits 908 only because the flash is
painted from the Timer: measured at the RGB444 picker corner, every
Setup-side shape is over (1113 with everything kept, 942 with everything cut
that is not a gesture), while the Timer-side shape reads Setup 903 at every
knob state and Timer 488 at the corner. The `tpad` preset leaves the catalog
and stays on the shelf as the compiler's over-budget fixture.**

## Performance

- **Duration:** 64 min
- **Started:** 2026-09-11T06:24Z (after 12-06's `1fbce72`)
- **Completed:** 2026-09-11T07:28Z
- **Tasks:** 2 of 2
- **Files modified:** 29 (2 created - the entry and this file - and 27
  edited, STATE.md included)

## Commits

| Task | Commit    | Files                                                                                                                                                                                                                                                                                                                                             |
| ---- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01   | `a7e5093` | `entries/trackpad.ts` (new), `index.ts`, `entries/ported.ts`, `catalog.spec.ts`, `presets.ts`, `library.ts`, `touch-guard.spec.ts`, `frames.spec.ts`, `tune/model.ts`, `tune/ladder.spec.ts`, `tune/colour-picker.spec.ts`, `tune/surprise.spec.ts`, `routes/dev/tune/+page.svelte`                                                                |
| 02   | `384e599` | `listing.ts`, `front-door.ts`, `front-door.spec.ts`, `sim/demo.ts`, `sim/demo.spec.ts`, `sim/lua-smoke.spec.ts`, `frames.json`, `audition.spec.ts`, `docs/HARDWARE-AUDITION.md`, `ui/aesthetic.spec.ts`, `device/wire-pin.spec.ts`, `share/stamp-roundtrip.sweep.spec.ts`, `tune/reachability.sweep.spec.ts`, `deferred-items.md`                     |

Commit 1 alone leaves four catalog specs red (`listing`, `front-door`,
`frames`, `audition`) by the plan's own task split; commit 2 greens them.
Both commits were made with `--only` over the named paths.

## The answer, and what it did to the plan

The plan was written for **beside**: a new card, GLIDE, a catalog `+1`, and
the preset untouched. The user's answer at 12-06 was neither beside nor the
offered replace:

> **"as is, selectable tuning options under Trackpad"**

Read by 12-06's hand-off as one card, the trackpad's gestures kept, the look
a knob. That is what shipped. The plan's task 01 ("the entry, costed before it
is designed") and task 02 ("into the catalog") were executed under that
reading; the plan's "Under `replace`" section was the closest map and was
re-derived from the tree, which added nine files the plan does not name (see
"What replacing tpad moved").

## Measure first: the fold at the picker corner

Everything through the pinned minifier after `padReady()`, `max(raw,
compressed)`, the sweep's own arithmetic, on 2026-09-11 before a descriptor
was written. The vendored `tpad` preset compiles to **902 / 146** through
HANGAR's compiler today (the vendored marker `--[[@cb#z.ptpad]] ` is 18
characters; under HANGAR's nine-character `--[[@cb]]` the same recipe is
**893 / 141**).

| Shape, Setup-side flash, everything at the corner (`false`, `255,255,255`, reach 3, fade 42) | Setup    | Of 908          |
| -------------------------------------------------------------------------------------------- | -------- | --------------- |
| the whole flash in the Setup, every gesture and the drain kept                               | **1113** | over by **205** |
| minus the 24-deep drain                                                                      | 1033     | over by 125     |
| minus the drain and the pointer hold-off                                                     | 993      | over by 85      |
| minus the drain, the flash not centred on the finger (whole edge)                            | 992      | over by 84      |
| minus the drain, the on/off knob dropped (always on)                                         | 1023     | over by 115     |
| drain kept, whole-edge flash, no on/off knob                                                 | 1074     | over by 166     |
| minus the drain, the hold-off, the centring AND the on/off knob                              | **942**  | over by **34**  |

So the hand-off's condition - "if it does not fit 908, return to the user" -
would have fired on every Setup-side shape, including the one with every
non-gesture cut. **The Timer is the other budget**, and the flash needs only
the net delta and the finger's position, both of which the handler already
holds:

| The shape that shipped                                              | Setup   | Timer   |
| ------------------------------------------------------------------- | ------- | ------- |
| at the RGB444 picker corner (`false`, `255,255,255`, 7 cells, 42)   | **903** | **488** |
| at the defaults (`true`, `214,255,78`, 5 cells, 42)                 | 903     | 486     |
| free of 908                                                         | 5       | 420     |

Both events are fixed points of `compressScript` and both pass `checkSyntax`.
**No knob token is in the Setup**, so its cost is 903 at every one of the
knob cross-product's states and the sweep's worst corner is a Timer figure.
The Setup is the recipe plus eleven characters, `s.u,s.v=f,h`, at the end of
the single-finger send branch, and `self.z=function(s)` became
`local function z(s)` (three characters cheaper, and a `self:` method the
host does not install is refused by host-surface.spec.ts).

## The entry

**`trackpad` / TRACKPAD**, `src/lib/catalog/entries/trackpad.ts`. Description:
"One finger moves the pointer, two fingers scroll, a tap clicks, and the edge
you move toward lights up." Tags `pointing`, `precise`, `still` - the preset's
three, unchanged. `restsBlack: true`, `preview: "lua"`, `featured: false`,
`addedAt` 2026-09-11.

**What is kept, all of it:** single-finger relative motion through `gmms(1,
..)` / `gmms(2,..)` clamped to +-63; two-finger scroll as notches on
`gmms(3,-d)` per 128 units, half-unit bias; tap-to-click on a lift with under
120 units of travel per finger (`gmbs(1,1)`), released by the Timer four calls
later (`gmbs(3,0)`); right-click on two (`glim(s.k,1,2)`); the 24-deep drain
over `touch_pop`; the four-call pointer hold-off after a contact change; the
25-Timer-call idle reset that recovers a lost lift; the Timer's safety release
at 100 quiet calls; `gmbs(3,0)` at load and `gtt(0,20)` on the last lift.

**The knobs (four, all in the Timer):**

| id       | label        | kind   | token | values                                                     | default | what it does                                                                                  |
| -------- | ------------ | ------ | ----- | ---------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `flash`  | Edge flash   | mode   | `@FX` | `true`, `false`                                            | 0       | `false` is the plain trackpad: the Timer never paints                                         |
| `colour` | Flash colour | colour | `@C`  | `214,255,78`, `255,255,255`, `0,200,255`, `255,170,0`      | 0       | written once over layer 1 by the Timer's first call; the picker reaches any RGB444 literal    |
| `reach`  | Flash width  | size   | `@N`  | `3`, `5`, `7`                                              | 1       | cells lit along the edge, centred on the finger; the loop is `-(@N//2)..@N//2`                |
| `fade`   | Fade length  | speed  | `@T`  | `42`, `31`, `21`                                           | 0       | ticks for the centre cell to reach black; 42 is D's ceiling (w = 252)                         |

**The shape character at birth is `8`** (`(4 * 7 + 12) mod 32`), format `w`:
measured by encoding the wild vector `{flash:1, colour:3, reach:2, fade:2}`
to `w81fa022`, which decodes `restored`. The defaults encode to no stamp.

**The flash.** Direction is the dominant axis of the net delta with its sign
(`h*h>f*f`, `u>0`); the dead band `f*f+h*h>2` keeps a resting finger's
one-unit wobble (probe Q1) from flashing; the position is the contact's own
last coordinate through `pairs(s.p)` under `s.n<2`; the edge is centred on
the other coordinate (`c[2]*9//1024`), clipped at the pad's edge by `glim`;
the profile is `@T*(16-k*k)//16*6`, **a multiple of six by construction**, so
every cell lands on phase 0 through the library's `D`. The twelve reachable
brightnesses: fade 42 -> 252 234 186 108; fade 31 -> 186 174 138 78; fade 21
-> 126 114 90 54; all between 54 and 252, all inside D's 42-tick ceiling.
The lag is at most one Timer period, 20 ms. **Two-finger scroll does not
flash** (`s.u` is only written in the single-finger branch), and neither does
a tap or the hold-off window.

## Every gesture, proved in the VM

`src/lib/sim/lua-smoke.spec.ts`, the file's 23rd test ("keeps every trackpad
gesture and flashes the edge the finger moves toward, to phase 0, from the
Timer"), eight stages, printed by a green run:

```
the twelve: 252 234 186 108 186 174 138 78 126 114 90 54
right drag: first lit at tick 14; column 8 rows 2..6 = 180 228 246 228 180; column 0 = 0 0 0; dark again 39 ticks after the last paint
right drag wire: x 40 40 40 40 40, y 0 0 0 0 0
up drag: row 0 cols 2..6 = 180 228 246 228 180; wire y -40 -40 -40 -40 -40 -40 -40 -40
tap: press at hid 0, release at hid 3
scroll: notches -1 -1 -1 -1 -1
seven cells, fade 21: column 8 rows 0..8 = 0 48 84 108 120 108 84 48 0; dark after 18
flash off: nothing lit, pointer x 40 40 40 40 40
```

Read one tick after the Timer wrote them, so each phase is six below its
formula value (252 -> 246, 234 -> 228, 186 -> 180). Also asserted: every
other cell 0 at the first lit tick; every phase 0 and every rate 0 after the
fade; a drag's lift sends no click; a tap flashes nothing; a fast tap
(`touchTap`, code 9) presses button 1; two fingers tapping press button 2 and
not 1; two fingers moving send no `gmms(1/2)` and light nothing, and their
lift is not a click; with `flash` at `false` nothing lights over the same drag
while the pointer still moves. `host.errors` empty at every stage.

**Two of the test's first expectations were wrong and the VM corrected them,
recorded in the test:** the hold-off swallows THREE moves, not four (`s.j=4`
is decremented on the onset's own dispatch), and the fade-21 neighbours read
108 after the tick, not 114.

## The negative checks, with both exit codes

1. **The decay gate through `D(`.** The Timer's `@T*(16-k*k)//16*6` was
   replaced by the literal `250` at its LAST occurrence (the first is in the
   header comment - the first attempt mutated the comment and the check came
   back green for the wrong reason; warning 1, suspected and redone).
   `decay-idiom.spec.ts` on the mutant: **exit 0, 3 passed** - the gate reads
   literal `glpfs` pairs and cannot see a `D(` call. `library.spec.ts` on the
   same tree: 3 passed (it proves `D`'s arithmetic, not the caller's `w`).
   Restored from the scratch copy; sha256 `fa807c88…` either side. The
   finding goes to 12-12 (deferred-items item 6.3): a gate clause for `D(`
   would also have to accept a `w` that depends on a loop variable, which
   the evaluator refuses, so the honest clause is "`w` is `<expr>*6`" by
   text - or the smoke test stays the proof.
2. **The exclusion list.** Observed in sequence rather than mutated: the first
   catalog gate run after task 01, before `front-door.ts` was edited, was
   **exit 1** with `front-door.spec.ts` red naming the card - "8 in the row
   plus 18 excluded must be exactly the 26 in CATALOG … - 'trackpad'". After
   the slot moved to `trackpad`: **exit 0**.

## What replacing `tpad` moved, file by file

The plan's "Under `replace`" section named `presets.ts`, `PRESETS.length` in
`catalog.spec.ts` and `presets.spec.ts`, `EXCLUDED_FROM_ROW`,
`DARK_BY_CONSTRUCTION`, the OG image, the `/c/tpad/` address and CONT-01.
Re-derived from the tree:

| File                                       | What moved                                                                                                                                                                                                                                                |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entries/ported.ts`                        | the `tpad` row leaves `PORTED_META` (eight); `SHELF_ONLY_META` keeps its browse shape; `portedEntry(id)` exported                                                                                                                                          |
| `index.ts`                                 | TRACKPAD imported, appended last to `CATALOG`, re-exported; `portedEntry` re-exported                                                                                                                                                                      |
| `catalog.spec.ts`                          | `SHELF_NOT_CARDED = ["tpad"]`; "carries all nine" -> "eight of the nine, and names the ninth"; `presetEntries.length` is `PRESETS.length - 1`. The D-09 test is untouched and green: `trackpad` is no shelf id                                              |
| `presets.ts`                               | comment only: the `tpad` declaration stays, with why (the shelf's diff gate, the knob rack, the over-budget probe)                                                                                                                                         |
| `presets.spec.ts`                          | **untouched** - nine against the vendored nine, still                                                                                                                                                                                                     |
| `tune/model.ts`                            | `entryFor`: `byId(id) ?? portedEntry(id)`, an unknown id still throws                                                                                                                                                                                     |
| `routes/dev/tune/+page.svelte`             | `byId` -> `portedEntry`; header amended; RESERVE 3 and the Scroll band unchanged                                                                                                                                                                          |
| `tune/ladder.spec.ts`                      | `mustEntry`: the same fallback, one line                                                                                                                                                                                                                  |
| `frames.spec.ts`                           | ported cross-check 9 -> 8                                                                                                                                                                                                                                 |
| `tune/colour-picker.spec.ts`               | the recorded split 12/6/3/5 -> 13/6/3/4 (one entry between two buckets, denominator 26)                                                                                                                                                                   |
| `tune/surprise.spec.ts`                    | compiler-driven entries 9 -> 8                                                                                                                                                                                                                            |
| `device/wire-pin.spec.ts`                  | the floor "nine shelf presets at least" -> eight carded                                                                                                                                                                                                   |
| `share/stamp-roundtrip.sweep.spec.ts`      | compiler-driven 9 -> 8; colour knobs exempt by format 27 -> 28 (61 + 28 = 89 hand-authored knobs)                                                                                                                                                         |
| `tune/reachability.sweep.spec.ts`          | racks 9 -> 8; laddered `over + 9` -> `over + 8`; Pass A prints 20,270 (total 44,846, floor 40,000 holds)                                                                                                                                                  |
| `touch-guard.spec.ts`                      | three declared rows for the recipe's guards; count 1 -> 4                                                                                                                                                                                                 |
| `library.ts`                               | comments: TRACKPAD is D's one caller; GLIDE leaves Q's list                                                                                                                                                                                               |
| `listing.ts`                               | the `tpad` row leaves; TRACKPAD's row lands last (CATALOG order), `motion: "dark"`, `quiet: DEMO_TOUCH_NOTE`                                                                                                                                              |
| `front-door.ts`                            | the excluded slot is `trackpad`'s, with the Lua-row reason; one header line. Ring untouched. **13-07 inherits**                                                                                                                                           |
| `front-door.spec.ts`                       | one line: `toContain("tpad")` -> `"trackpad"`. **13-07 inherits**                                                                                                                                                                                         |
| `sim/demo.ts`                              | `TRACKPAD_PATH`; `DEMO_PATHS` three; `DARK_BY_CONSTRUCTION` empty and still declared, with the reason                                                                                                                                                     |
| `sim/demo.spec.ts`                         | the non-vacuity guard restated: empty BECAUSE tpad is in no catalog and has no path; the three paths named                                                                                                                                                 |
| `ui/aesthetic.spec.ts`                     | the A-58 block: tpad is no card, no exemption, no path; every future exemption must carry an "N of 81" measurement                                                                                                                                         |
| `frames.json`                              | regenerated (`UPDATE_FRAMES=1`, exit 1 by design): `f9143d6f…` -> `9f9cd666…`, 32 lines replaced, only the tpad -> trackpad block                                                                                                                          |
| `static/og/`                               | `tpad.png` gone, `trackpad.png` 4,443 bytes, sha `704b46fe…`, 4 of 81 lit at the end of the demo path (tpad's was 4,192 at 0 lit); 26 files, gitignored                                                                                                    |
| `docs/HARDWARE-AUDITION.md`                | row 23, the cost row `903 / 486 / 4 / yes`, "eighteen" and "twenty-three" throughout, the dark-at-rest paragraph                                                                                                                                           |
| `audition.spec.ts`                         | `ROW_COUNT` 22 -> 23; the title                                                                                                                                                                                                                           |
| `deferred-items.md`                        | item 6, seven rows for 12-12 and Phase 13                                                                                                                                                                                                                 |

**Untouched, and why:** `browse/filter.spec.ts` and `sort.spec.ts` (the tags
are the preset's own, `featured` false both before and after: every RECORDED
number is unchanged, so there was nothing to recount); `wild-stamps.json`
(no record per entry is required - WHEELS and RADAR POINTS have none, and
test 8 asserts the fifteen captured records, not the entries);
`golden-frames.json` (see below); `src/vendor/`; every e2e file.

## The golden-frames finding

**No golden row moved, and it was proved rather than assumed.**
`UPDATE_GOLDEN=1 npx vitest run --project server src/lib/fidelity/golden-frames.spec.ts`
ran (exit 1 by design, the regenerator's own refusal test) and
`golden-frames.json` hashed `bf54f15c…` either side; `git diff --quiet` on it
passes. The fixture regenerates from the VENDORED shelf, which is untouched,
so its nine rows - `tpad`'s all-zero row included - still describe the
vendored presets. Consequence, recorded: `front-door.spec.ts`'s "the excluded
entry is excluded because it is dark" still derives `tpad`'s motion from that
fixture and asserts it dark - true of the preset, no longer about any catalog
card - and its `recorded = CATALOG ∩ GOLDEN` loop now visits eight. Green,
untouched, 13-07's.

## Counts, as observed baseline plus this plan's term

| Name         | Observed at `1fbce72`             | This plan                       | After `384e599`                                                  |
| ------------ | --------------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| `PREV_FILES` | 88                                | **+0**                          | **88**                                                           |
| `PREV_TESTS` | 902 (+1 todo)                     | **+1** (lua-smoke)              | **903** (+1 todo) - `check-counts.mjs 88 903` matches            |
| sweep        | `4 19`                            | +0 / +0                         | `4 19` matches; lua-entries 1,140 combinations, TRACKPAD's 37    |
| `BASE_CHECK` | 603 files, 0 / 0                  | +1 file (`trackpad.ts`)         | **604** files, 0 ERRORS 0 WARNINGS                               |
| catalog      | 26 (9 + 17)                       | **-3 + 0**, split **8 + 18**    | 26                                                               |
| OG images    | 26                                | **-1 + 1**                      | 26                                                               |
| audition     | 22                                | **+1**                          | 23                                                               |
| touch-guard  | 1 row                             | +3                              | 4                                                                |
| e2e          | 84 titles / 100 runs (`--list`)   | **+0 / +0**                     | 84 / 100 (`grep -c "test("` 84; `--list` "100 tests in 13 files") |
| lint         | clean                             | -                               | clean (`prettier --check .` and `eslint .`, exit 0)              |

TRACKPAD's 37 sweep combinations are derived from the sweep's own rule
(`lua-entries.sweep.spec.ts:552-616`: each non-colour value, 27 sampled
literals per colour knob, two corners): 2 + 3 + 3 + 27 + 2. The plan's
`85 887 / 87 106` literals are stale under Phase 13 and were not used
(12-06's deviation 1, same reason).

**Playwright: run once, 98 passed and 2 failed, then the two rerun green.**
`session.e2e.ts:701` (chromium, a 30 s `page.evaluate` timeout) and
`install.e2e.ts:1817` (webkit-phone, `zona.seen("CONFIG","EXECUTE")` 10 where
9 was expected) - both in device flows with the fake ZONA, neither in a file
this plan touched, neither the named transient's shape (no "Could not
connect", wrangler lived) but the same family: the run was three workers over
a machine that had just run the sweep. Rerun by specifier at `--workers 1`:
3 passed in 31.7 s. Named, not accepted: one red and one green each.
`config-shape.spec.ts`'s preload test likewise timed out once at 6,922 ms
under `check`, `lint` and the quick run together, and passed alone (14/14)
and in the counted run. `test-results/` removed.

## Deviations

### 1. [Rule 3 - Blocking] The id is `trackpad`, not `tpad`

The orchestrator's preference was `tpad` "if the tree allows a Lua entry
under a former preset id". It does not, for four reasons in the tree:
`golden-frames.json`, `preset-baseline.json`, `lua-parity.spec.ts` and
`front-door.spec.ts`'s derived-motion cross-check all key on `tpad` and keep
describing the vendored preset (a catalog entry under that key would be held
against another configuration's frames); `catalog.spec.ts`'s D-09 test refuses
a non-preset entry taking a shelf id; and `ladder.spec.ts`, `/dev/tune/` and
`e2e/tuning.e2e.ts` reach `byId("tpad")` expecting the over-budget PRESET. The
smallest honest change: a new id, the OG image and the listing row amended
rather than added, the address `/c/tpad/` dead (12-12's list).

### 2. [Rule 3 - Blocking] The preset stays on the shelf, and the tuner falls back to it

The plan's replace section says the preset leaves `presets.ts` (nine -> eight,
`presets.spec.ts` moved). Doing that orphans `knobs.preset.ts`'s rack, breaks
`presets.spec.ts`'s four tests, and takes the over-budget probe's only subject
away: the tpad preset is the one card whose 512-state knob band straddles 908
with a reserve of 3, which `/dev/tune/` and two e2e tests are built on. So the
preset stays declared (nine), leaves the catalog (eight carded),
`entries/ported.ts` exports `portedEntry(id)`, and `model.ts`'s `entryFor`
falls back to it - one line in a Phase 5 module, an unknown id still throwing.
Every probe number is unchanged because the preset is.

### 3. [Rule 3 - Blocking] The flash is painted from the Timer, not the Setup

The plan's sketch and its "Setup-side" measurements (553 with `D`) were
GLIDE's, a pointer without the preset's gestures. With the gestures kept, no
Setup-side shape fits (the table above). The Timer had 767 free; the handler
stores the net delta in eleven characters. This is the whole reason the fold
ships instead of a handover.

### 4. [Rule 3 - Blocking] Three touch-guard rows, where the plan said none

The plan's "`touch-guard.spec.ts` green, no new row" was GLIDE's, and GLIDE had
no tap. The recipe's `e==3 or e>=5`, `e>4` and `e==4 or e>7` are each read by
the gate's letter as wrong and are each right because of the pass around them
(a code 9 is registered as an onset and ended in the same pass, which is what
makes a fast tap click). Narrowing them to satisfy a text scan would change
tap-to-click on hardware; they are declared instead, keyed on the whole
branch, with the reason.

### 5. [Rule 3 - Blocking] Nine review literals the plan's file list does not name

`frames.spec.ts`, `colour-picker.spec.ts`, `surprise.spec.ts`,
`wire-pin.spec.ts`, `stamp-roundtrip.sweep.spec.ts`,
`reachability.sweep.spec.ts` (two literals), `aesthetic.spec.ts`,
`demo.spec.ts` and `front-door.spec.ts` each pin a number the fold moves
(nine presets, the colour split, the exemption list, one line of the
exclusion). Each was found by running the suite - the way every re-count in
those files records itself - and each is amended in place with the reason,
never deleted. `wire-pin`, `stamp-roundtrip` and `reachability` were found by
the counted quick run and the full sweep AFTER the first catalog pass was
green, which is why the sweep ran three times.

### 6. [Rule 1 - Bug] The first demo path shipped a black picture

`gen-og` refused it: "rendered an entirely dark pad at the end of its demo
path". Replayed tick by tick: the path paused 48-56 ticks between its runs,
and the recipe's idle reset (`s.q>25` Timer calls, 250 ms) forgot the held
contact after 50 ticks of stillness, so each run re-registered the finger with
a fresh three-move hold-off and the three-move runs sent and lit nothing (the
trace: runs one, three and four lit; two and five did not). Half-cell steps
also landed on the same cell twice and were dropped by the host's change
gate. The path is now contiguous (six ticks apart), one whole cell per
sample, 176 ticks, lift at 164; the picture has 4 of 81 lit. The recipe's
behaviour is unchanged and is now written where the next path author reads
it.

### 7. [Rule 1 - Plan claim corrected] `still` is true of TRACKPAD

The plan's interfaces block says "`still` is false of it (it flashes)".
`facets.ts` defines `still` on the motion-at-rest axis and names TPAD and
MORPH among its carriers; MORPH lights under a finger exactly as this card
does. The preset's three tags are kept, the histogram moves by zero, and the
floor of six `still` carriers - which the plan's tagging would have broken -
is not touched.

### 8. [Process] Stale plan literals not used; gsd-tools state commands not run

As 12-06 and every plan since 12-04: `85 887`, `87 106` and the plan's
verify literals were not used; the observed baseline at `1fbce72` was measured
once and the terms applied to it. `advance-plan`, `update-progress`,
`roadmap update-plan-progress`, `requirements mark-complete`,
`record-metric`, `add-decision` and `record-session` were not run. STATE.md
was edited by a script against a scratch copy (sha256 `ea2904c4…` before),
asserting `status: executing`, `completed_phases: 11`, `percent: 100`,
`total_phases: 14`, `total_plans: 160` unchanged and Phase 13 kept at 6 of
20 alongside Phase 12 at 11 of 12. `ROADMAP.md` and `REQUIREMENTS.md` are
byte-identical; **CAT-04 stays `[ ]`**.

### 9. [Process] Two of the plan's task-02 files had nothing to move

`filter.spec.ts` and `sort.spec.ts` RECORDED blocks: the fold keeps the
preset's tags and its `featured: false`, so `entries`, `tags`, every term
count and the featured boundary are unchanged. Listed in the plan's
`files_modified` for a `+1`; under `-3 + 0` there is no recount to make.

## Questions recorded for the user

1. **The on/off knob shows the Lua literals `true` / `false`** in the tune
   panel, because a knob's values are literal Lua text and there is no label
   map for a `mode` knob. If "on / off" is wanted, that is a panel change,
   not an entry change.
2. **Two-finger scroll does not flash.** The bench line describes a moving
   finger; the scroll branch never writes `s.u`. Adding a top/bottom flash
   for scroll is a Timer-side change with 420 characters of room, if wanted.
3. **The preset's own three tunables (tap, pointer, scroll) are not knobs on
   TRACKPAD.** Every one of their widest values is a Setup character the
   Setup does not have (5 free). If any of them matters more than the drain
   loop, say which and the trade is measured.
4. **`/c/tpad/` is dead and the id is `trackpad`.** A shared `tpad` link
   lands on the 404 route. If the old address should redirect, that is a
   route, not a card.
5. **Should the tpad preset also leave the shelf?** It would force the
   over-budget probe and `ladder.spec.ts` test 1 onto another card, and no
   other shelf card has a band that straddles 908. Deviation 2 kept it.
6. **The flash trails the finger by up to 20 ms** and its dead band is one
   raw unit; both are the bench's to judge (row 23).
7. **A finger that rests a quarter of a second and moves again loses its
   first three samples** - the recipe's idle reset plus hold-off, unchanged
   from the preset and now visible because the flash shows it. If that reads
   as "the edge is late to start", the window is the recipe's `25`, and
   moving it is a preset-behaviour change.

## What the plan asserts that the tree does not support

1. **"beside", `glide`, GLIDE, `BASE_CATALOG - 3 + 1`, `26 + 1` OG,
   `22 + 1` audition as an ADDITION beside the preset** - the answer was
   neither beside nor replace; the terms are `-3 + 0`, `-1 + 1`, `+1`.
2. **`PREV_FILES 85 / PREV_TESTS 887`, e2e `87 / 106`, check 581** - the
   tree is 88 / 902 (+1 todo), 84 / 100, 603 at `1fbce72`.
3. **"the 24-deep drain loop … the preset keeps them"** as something the new
   entry drops - the drain is kept; nothing of the recipe is dropped.
4. **"553 with `D`" for the sketch** - GLIDE's figure; the fold's Setup-side
   floor with the gestures is 942 and its shipped Setup is 903.
5. **"`still` is false of it"** - see deviation 7.
6. **"`touch-guard.spec.ts` green, no new row"** - three rows; deviation 4.
7. **"the catalog's decay gate proves it"** (must-have 3) - the gate cannot
   see a `D(` call; `library.spec.ts` proves `D` and the smoke test proves
   the card. The plan's own negative check anticipated this and it is
   recorded as the finding it asked for.
8. **"`wild-stamps.json` only if `stamp.spec.ts` requires a record per
   entry - read it and say"** - it does not (WHEELS, RADAR POINTS have none;
   test 8 counts the fifteen captured records).
9. **`demo.ts:248`, `front-door.spec.ts:195-215`, `listing.ts:219-237`,
   `audition.spec.ts:52`** - near enough; the tpad row was at `listing.ts:228`,
   `ROW_COUNT` at `:58`, the restsBlack rule at `front-door.spec.ts:186-209`.
10. **"the preset sits at 907 of 908"** - 907 is its worst knob state; its
    defaults are 902, and under HANGAR's marker the same recipe is 893.

## Known Stubs

None. The entry's every branch is reached by its test; the empty
`DARK_BY_CONSTRUCTION` is a declared, gated list and not a placeholder.

## Notes for the next plans

- **12-12:** `deferred-items.md` item 6 has seven rows; the counts to rebuild
  are in the table above; `docs/TESTING.md`'s cost table wants a TRACKPAD row
  (903 / 488 corner / 486 defaults) and a note that `tpad`'s row is a shelf
  fixture's.
- **13-07:** `front-door.ts` lost the `tpad` slot to `trackpad` and
  `front-door.spec.ts` moved one line; both still assert the eight-entry
  ring. The "excluded because it is dark" test reads the vendored golden
  fixture's `tpad` row.
- **Any plan adding a Lua entry:** the recipe's 250 ms idle reset and the
  hold-off are now documented at `TRACKPAD_PATH`; a demo path for a card with
  such a reset must keep its samples inside the window.

**No device was touched, nothing was deployed, and nothing about the flash is
hardware-verified.** The gestures are the hardware-tested recipe's; the
flash, its lag, its dead band and its two-finger silence are proved in
wasmoon and go to the bench as row 23.

## Self-Check: PASSED

- `src/lib/catalog/entries/trackpad.ts`: FOUND. Setup 903 / Timer 488 at the
  corner re-measured by the sweep (`4 19` green).
- `src/lib/catalog/frames.json` `9f9cd666…` with `trackpad` and without
  `tpad`: FOUND. `golden-frames.json` `bf54f15c…`: unchanged after
  regeneration.
- `static/og/trackpad.png` 4,443 bytes: FOUND (gitignored); `tpad.png`: gone.
- Commits `a7e5093` and `384e599`: FOUND in `git log`.
- `git diff --stat HEAD -- src/vendor/`: empty. `firmware-oracle.spec.ts`,
  `preset-baseline.json`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`:
  byte-identical to `1fbce72`.
- Nothing under `.planning/phases/13-gui-overhaul/`, `src/lib/store/`,
  `src/lib/ui/shell/`, `src/lib/ui/intro/`, `Wordmark.svelte`,
  `MotionControl.svelte` or `motion.svelte.ts` touched.
- `git status --short`: only the user's three untracked root files.
