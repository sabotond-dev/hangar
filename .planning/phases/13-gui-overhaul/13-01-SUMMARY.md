---
phase: 13-gui-overhaul
plan: 01
subsystem: testing
tags:
  [
    count-gate,
    negative-delta,
    no-radius,
    allowlist,
    d-15,
    six-circles,
    tailwind-scanner,
    preflight,
    webkit,
    requirements,
    copy-ledger,
    baseline,
  ]
requires:
  - phase: 12-touch-framework
    plan: 11
    provides: "PREV_FILES 85 / PREV_TESTS 887 (+1 todo) / e2e 87 titles, 106 runs / BASE_CHECK 581 / sweep 4 19 / catalog 26, measured on a clean tree - the pair this plan re-measured and found unchanged at eb79e3c"
  - phase: 13-gui-overhaul
    plan: context
    provides: "D-01 (never a rounded corner, as a gate), D-10 (true circles exempt, rounded rectangles never), D-15 (six circles by file and line), D-14 Q15 (the BUILD and KEEP families), D-05 (the register the ledger carries)"
provides:
  - "THE COUNT GATE PROVED AGAINST A NEGATIVE DELTA before any deletion lands: scripts/check-counts.mjs needed no change; drive (a) one test fenced out with the file kept (85 886 green, 85 887 red on the tests line), drive (b) one file moved out (84 885 green, 85 885 red on the FILES line, 84 887 red on the tests line, 85 887 red on both - two different strings), drive (c) the todo unmoved at 1 and owned by src/lib/fidelity/firmware-oracle.spec.ts:209"
  - "THE NO-RADIUS GATE IN THREE LAYERS, GREEN ON THE TREE AS IT STANDS: src/lib/ui/radius-allowlist.ts (the one declaration all three read), src/lib/ui/radius.spec.ts (layer A the source scan with a sixteen-row allowlist of thirty-three declarations that can only shrink, layer B the built-CSS scan that refuses a missing or stale build) and e2e/radius.e2e.ts (layer C, one @webkit title, the computed-style sweep over eleven routes in both engines with D-10's square arm proved on all six of D-15's circle kinds)"
  - "THE SIX CIRCLES COUNTED AT EXACTLY SIX and set-equal to D-15's pairs - ColourPicker.svelte:829, :857, :872 and Knob.svelte:598, :653, :674 - a seventh red until D-15 names it; 60 circle elements measured square in the browser"
  - "A FINDING layer B caught on its first run: the shipped stylesheet carried .rounded, .rounded-md and .rounded-full because Tailwind's scanner had tokenised those words out of .planning/ documents (rounded-md and rounded-full occur exactly once in the tracked tree, in 13-01-PLAN.md). src/app.css now imports Tailwind with source(\".\") and refuses the named rounded family with @source not inline()"
  - "A FINDING about the user-agent stylesheet, measured: Chromium gives nothing a radius; WebKit gives input[type=search|text|number], textarea and select 5px as part of the native control appearance, dropped on inputs and textareas by any author border, background-color or appearance: none, kept on select until an explicit border-radius: 0. Tailwind preflight already resets all of them; no element needed a reset, and the arm is proved on an injected select"
  - "FOURTEEN REQUIREMENT ROWS minted append-only in .planning/REQUIREMENTS.md - BUILD-01..08 and KEEP-01..06 - each unticked, dated, naming its plan, every one claimed by at least one Phase 13 plan's frontmatter; CAT-04 stays [ ]"
  - "THE COPY LEDGER .planning/phases/13-gui-overhaul/13-COPY-NEW.md with D-05's register in full and eight seeds (the plan says seven)"
affects:
  - "13-02 to 13-20: every plan that touches a .svelte or .css must npm run build before npm run test:quick, or layer B is red as stale; every plan that clears a component removes its ALLOWLIST row in the same commit"
  - "13-03: app.css's first lines are now the scoped Tailwind import and the rounded refusal - keep them when the tokens are rewritten; instrument.spec.ts:691 still asserts .pill declares 999px and must move with the pill"
  - "13-08: a <select> on WebKit is 5px until border-radius: 0 - preflight's rule is what holds it; the seven FOR labels and the chip-versus-rail question go in the ledger"
  - "13-18: the ledger has eight seeds and no proposals; 13-20: the allowlist must be empty, the six circles still six, and the terms below carried"
tech-stack:
  added: []
  patterns:
    - "A gate with a declared allowlist asserts the row's count EQUAL to the file's, so growth, over-count and a stale row are three different reds and the list can only shrink to nothing"
    - "A built-artefact scan asserts the artefact is fresher than its newest input before it reads a byte, and a skip is a real skip the count gate sees"
    - "A browser sweep tolerates an author-set value only while the same allowlist the source scan reads is non-empty, and attributes every computed value to an author rule or names it a user-agent default"
    - "A plant that must land inside a grouping rule (@layer) recurses; a plant that reports green is suspected first (three of this plan's did, and two were the plant's fault)"
key-files:
  created:
    - src/lib/ui/radius-allowlist.ts
    - src/lib/ui/radius.spec.ts
    - e2e/radius.e2e.ts
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
    - .planning/phases/13-gui-overhaul/13-01-SUMMARY.md
  modified:
    - src/app.css
    - docs/TESTING.md
    - .planning/REQUIREMENTS.md
key-decisions:
  - "THE ALLOWLIST'S declarations FIELD COUNTS ONLY WHAT MUST BE CLEARED (above zero and not a D-15 circle), and CIRCLES is its own constant - because a row that counted its circles could never reach zero and the list could never be empty at 13-20. The plan's sketch put the six inside the rows; the rows still carry them as a cross-check"
  - "LAYER C TOLERATES AN AUTHOR-SET RADIUS ONLY WHILE THE ALLOWLIST IS NON-EMPTY AND ONLY AT A VALUE AN ALLOWLISTED FILE DECLARES, read from the same module - because the plan's 'anything non-zero fails' would be red for nineteen waves on today's 6px cards, and a gate that is red for nineteen waves is not a gate"
  - "LAYER B IS RED ON A STALE BUILD, not only on a missing one - the orchestrator's warning that a scan of a stale artefact proves nothing, made mechanical by comparing the newest .svelte/.css mtime to the oldest built stylesheet"
  - "THE TAILWIND SCANNER IS SCOPED TO src/ AND THE rounded FAMILY REFUSED AT THE COMPILER (Rule 2) - a word in a planning document must not put a rule in the production stylesheet; every utility the markup uses was measured emitted before and after"
  - "gsd-tools state advance-plan and update-progress were NOT run: STATE.md's position is Phase 12's (10 of 12, 12-06 open) and Phase 13 wave 1 ran alongside it; requirements mark-complete was not run because IDENT-01 and IDENT-02 are already ticked and 13-20 amends them by name"
patterns-established:
  - "A count the plan states is re-counted at execution and the planner's figure is named beside the observation (43 grep hits, 41 declarations; ten, nine; seven, five; seven seeds, eight)"
requirements-completed: []
duration: 65min
completed: 2026-09-11
---

# Phase 13 Plan 01: The Instruments the Rest of the Phase Runs On Summary

**Nothing user-visible shipped. Four instruments did: the count gate was driven backwards three ways
on scratch plants and found already correct (the research's Wave 0 gap named the wrong exposure);
the no-radius gate landed in three layers and green, with sixteen allowlist rows carrying thirty-three
declarations that can only shrink, D-15's six circles counted at exactly six, and the built-CSS layer
earning its place on its first run by finding three Tailwind radius utilities emitted from words in a
planning document; fourteen requirement rows were minted append-only and every one is claimed; and the
copy ledger exists with D-05's register and eight seeds. Nothing in this plan is hardware-verified, no
device was touched, and nothing was deployed.**

## Performance

- **Duration:** about 65 min
- **Started:** 2026-09-11T00:35Z (reading), first measurement 00:44Z
- **Completed:** 2026-09-11T01:40Z
- **Tasks:** 4 of 4
- **Files:** 4 created, 3 modified (plus this document)

## Commits

| Hash      | Message                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------- |
| `615f8d0` | `docs(13-01): the count gate driven backwards three ways, and the baseline re-measured`                 |
| `5bf21bc` | `test(13-01): the no-radius gate, layers A and B, with the allowlist that can only shrink`              |
| `385e63e` | `test(13-01): the no-radius gate, layer C - the computed-style sweep in both engines`                   |
| `f0a1b8b` | `docs(13-01): fourteen requirement rows minted for the Sandbox and persistence, and the copy ledger`   |

Every commit used `git commit --only <paths> -F <message-file>`, pathspec before the message flag;
new files were `git add`ed first because `--only` cannot see an untracked path. No push.

---

## The baseline, observed on the clean tree at `eb79e3c`, beside 12-VALIDATION's projection

**Phase 12 is at 10 of 12** - `12-06` is open at a user checkpoint, `12-10` and `12-12` wait behind
it - so `12-12-SUMMARY.md` does not exist and the pair was carried from `12-11-SUMMARY.md`. Stated
once, reported and not reconciled:

| Name             | Projected (12-VALIDATION) | Observed 2026-09-11         | Offset |
| ---------------- | ------------------------- | --------------------------- | ------ |
| quick files      | 85                        | **85**                      | 0      |
| quick tests      | 888 (+1 todo)             | **887** (+1 todo)           | **-1** |
| sweep            | `4 19`                    | **`4 19`**                  | 0      |
| e2e titles       | 87                        | **87** (`grep -c "test("`)  | 0      |
| e2e runs         | 106 (87 + 19)             | **106** (87 chromium + 19 webkit-phone) | 0 |
| `svelte-check`   | 582                       | **581**, 0 errors 0 warnings | **-1** |
| catalog          | 27                        | **26**                      | **-1** |
| `static/og/`     | 27                        | **26** files, gitignored    | **-1** |
| audition rows    | 23                        | **22** numbered rows in `docs/HARDWARE-AUDITION.md` | **-1** |

The `-1` on tests is 12-10's unlanded `+1`; the `-1` on catalog and OG is 12-06's `replace` branch
already taken by 12-04's three removals (26 = 9 + 17, per 12-11); the check and audition offsets are
the projection's, not the tree's. **The observation is Phase 13's baseline.** 13-20 rebuilds the
totals from it and names this offset once.

**A transient e2e failure on the first baseline run, named:** `e2e/session.e2e.ts:820` *"unplugging
changes the page immediately, with no click"* (chromium) - the fake ZONA had answered two of the three
snapshot reads when the unplug fired (`Expected: 3 Received: 2`, 30 s timeout). Green in isolation in
1.6 s and green on the second full run at 106. Not a red in the tree; recorded because warning 7 asked.

---

## Task 1: the count gate driven backwards, three ways

`scripts/check-counts.mjs` read at `eb79e3c`: it compares two integers and rejects only a negative
*expected* total, which no plan produces. **The tool was already correct for a negative delta; the
research's Wave 0 gap named the wrong exposure, and the two real ones are (a) and (c).** No change was
made to the script. Every plant restored from a scratch copy, sha256 either side, never `git checkout`:

| Drive | Plant | Command | Exit | Printed |
| --- | --- | --- | --- | --- |
| (a) | one `it(...)` in `src/lib/browse/sort.spec.ts` fenced in a block comment (2 of 2 replacements asserted), file kept | `85 886` | **0** | `matches the expected counts` |
| (a) | same | `85 887` | **1** | `tests: observed 886, expected 887` |
| (b) | `src/lib/sim/demo.spec.ts` (two tests) moved out of the tree | `84 885` | **0** | `matches the expected counts` |
| (b) | same | `85 885` | **1** | `files: observed 84, expected 85` |
| (b) | same | `84 887` | **1** | `tests: observed 885, expected 887` |
| (b) | same | `85 887` | **1** | `files: observed 84, expected 85; tests: observed 885, expected 887` |
| (c) | the todo across all three runs | - | - | `887 passed \| 1 todo`, `886 passed \| 1 todo`, `885 passed \| 1 todo` |

`sort.spec.ts` `9f6d7886…` before and after; `demo.spec.ts` `8b2a3064…` before and after. **The two red
lines in (b) are different strings** - that is the distinction 13-04 (tests deleted, file kept) and
13-07 / 13-09 / 13-10 (file deleted) depend on. **The todo's owner is
`src/lib/fidelity/firmware-oracle.spec.ts:209`**, the only `it.todo` or `test.todo` under `src/`; no
file this phase deletes carries one. `docs/TESTING.md` gained one appended paragraph (18 lines added, 0
removed, prettier clean) under the count-gate row; 12-12 and 13-20 each rewrite the rest at their own
close.

---

## Task 2: layers A and B, and the allowlist as landed

**Re-count.** `grep -rn border-radius` gives **43 hits; 41 are declarations.** Two are comment lines
(`app.css:391`, `Knob.svelte:25`), which the scan blanks before counting. Of the 41: **2 `inherit`**
(`app.css:292` the focus ring, and `Knob.svelte:569` a second focus ring the plan did not name), **6
`50%`**, **33 above zero** in `src/app.css` and fifteen components. The planner's "Knob (ten, of which
three 50%)" counted the comment and the inherit: Knob has **nine** declarations, three circles, one
inherit, and **five** to clear at 13-09, not seven.

**The allowlist, sixteen rows, thirty-three declarations, printed by the green run:**

| File | declarations | clearedBy | Note |
| --- | --- | --- | --- |
| `src/app.css` | 1 | 13-03 | `:421` the pill, 999px - removed, not re-skinned |
| `src/lib/ui/PadFrame.svelte` | 2 | 13-04 | |
| `src/lib/ui/ScreenToggle.svelte` | 2 | 13-04 (deleted) | |
| `src/lib/ui/BrowseToolbar.svelte` | 1 | 13-08 | the search field's own 6px |
| `src/lib/ui/CatalogCard.svelte` | 3 | 13-08 | |
| `src/lib/ui/FacetRow.svelte` | 1 | 13-08 | |
| `src/lib/ui/TuningRegion.svelte` | 1 | 13-09 | |
| `src/lib/ui/Knob.svelte` | 5 | 13-09 | circles 3 at `:598, :653, :674`; clears `:635, :701, :761, :858, :911` |
| `src/lib/ui/ColourPicker.svelte` | 6 | 13-09 | circles 3 at `:829, :857, :872`; clears `:654, :688, :749, :787, :839, :878` |
| `src/lib/ui/ChosenPanel.svelte` | 2 | 13-09 (deleted) | 13-VALIDATION D-5 deletes it |
| `src/lib/ui/NamePlate.svelte` | 1 | 13-09 (deleted) | |
| `src/lib/ui/CopyLink.svelte` | 1 | 13-09 | |
| `src/lib/ui/BudgetMeter.svelte` | 3 | 13-10 | |
| `src/lib/ui/MixTwo.svelte` | 2 | 13-10 (deleted) | D-12 |
| `src/lib/ui/DeviceDetails.svelte` | 1 | 13-11 | |
| `src/lib/ui/KeepConfirm.svelte` | 1 | 13-11 | |

`declarations` counts **only what must be cleared** and is asserted **equal** to the observed count, so
the list reaches empty at 13-20; the six circles live in their own `CIRCLES` constant and each row's
`circles`/`circleLines` is cross-checked against it.

**The six, printed and asserted at 6, set-equal to D-15:** `ColourPicker.svelte:829` (the 2px tick),
`:857` (the 12px rail thumb), `:872` (the 2px home mark); `Knob.svelte:598` (the 8px dot), `:653` (the
12px slider thumb), `:674` (the 2px home mark). **D-15's glosses are off by one row** - it calls `:829`
"the rail thumb" and `:857`/`:872` "markers"; the source says tick, thumb, home. The pairs are the
decision and are unchanged; the module records the source's names.

**Layer B, and what it found.** The built CSS carried **41 radius declarations across 8 stylesheets, 6
of them 50%**, and three values no source declares: `.rounded{border-radius:.25rem}`,
`.rounded-md{border-radius:var(--radius-md)}`, `.rounded-full{border-radius:2147483647px}`. Tailwind v4
auto-detects sources from the project root and had tokenised `rounded-md` and `rounded-full` out of
**`13-01-PLAN.md`** (each occurs exactly once in the tracked tree) and `rounded` out of comments. Ten
more dead utilities (`.italic`, `.sticky`, `.opacity-0`, `.pointer-events-none`, `.underline`, …) came
from the same scan. **Fix (Rule 2):** `@import "tailwindcss" source(".")` and
`@source not inline("rounded{,-{t,r,b,l,s,e,tl,tr,bl,br,ss,se,es,ee}}{,-{none,xs,sm,md,lg,xl,2xl,3xl,4xl,full}}")`
at the top of `src/app.css`, with the reason in a comment. Measured: 64 utility rules before, 51 after,
thirteen dropped, one added (`.shrink`), and **every utility the markup uses** (`sr-only`, `flex`,
`grid`, `mt-16`, `px-4`, `py-6`, `gap-x-4`, `gap-y-1`, `border-t`, `items-center`, `text-xs`, `block`,
`border`, `flex-wrap`, and `[&_a]:underline` as its escaped variant) still emitted. `0.css` 17,725 →
16,853 bytes.

**Layer B refuses a missing or stale build.** Absent `build/`: red naming `npm run build`; with
`HANGAR_SKIP_BUILT_CSS=1`: a real `ctx.skip()` that prints its reason and that `check-counts.mjs 1 2`
turns into `tests: observed 1, expected 2` (exit 1) - **a gated run cannot take the shortcut.** A
`.svelte` or `.css` newer than the oldest built stylesheet: red naming the file and both timestamps.
(13-VALIDATION says layer B is "skipped with a named reason" when the build is absent; the plan says
red unless the flag; the plan was followed.)

**Five negative checks, all restored sha256-identical:**

| # | Plant | Arm | Printed |
| - | ----- | --- | ------- |
| 1 | `.plant-13-01 { border-radius: 4px }` in `src/routes/dev/type/+page.svelte` (no row) | unlisted file | `src/routes/dev/type/+page.svelte:119 border-radius: 4px` |
| 2 | CatalogCard's row raised 3 → 4, file untouched | over-count | `src/lib/ui/CatalogCard.svelte: row says 4, the file has 3 (:317 6px, :357 10px, :441 6px)` |
| 3 | `class="fidelity rounded"` in `FidelityLine.svelte` | utility token, no allowlist | `src/lib/ui/FidelityLine.svelte:86 class="..." carries "rounded"` |
| 4 | `build/` moved away | absent build; then the flagged skip | red naming `npm run build`; `1 passed \| 1 skipped`; check-counts exit 1 |
| 5 | a `.svelte` restored by `cp` (fresh mtime) | stale build | `…+page.svelte was modified after build/_app/immutable/assets was written … Run npm run build first` - observed three times as a side effect of plants 1-3's restores, then cleared by a rebuild |

Plants 1-3 each also tripped arm 5, because a `cp` restore is a write. That is the guard working, and
the reason every later plan rebuilds after touching a component.

---

## Task 3: layer C, the computed-style sweep

**One `@webkit` title: +1 title, +2 runs**, the only place in this phase where one title is two runs by
design. Eleven routes - `/`, `/browse/`, `/c/aurora/` and `/c/arc/` with the chosen panel opened, and
the seven `/dev/*` pages discovered from `src/routes/dev/` (`smoke.e2e.ts` keeps no route list to
reuse). On each, every element and every generated `::before`/`::after`: a percentage must be the
literal `50%` on a box square within one device pixel; a non-zero length is red unless the allowlist is
non-empty **and** an author rule set it **and** the value is one an allowlisted file declares; a
computed radius no author rule matches is a user-agent default and is red at any value; when the
allowlist is empty every non-zero length is red. **The plan's "anything non-zero fails" would be red on
today's 6px cards for nineteen waves**; the tolerance is the same shrinking allowlist layer A reads.

**D-10's square arm, made non-vacuous.** The first run measured **0 circles** on every route: a cold
`/c/<id>/` shows the coverflow only. With the panel opened on ARC, four kinds; the picker's rails
(`.tick`, `.thumb`, `.home`) exist only for a **lattice** colour knob (4,096 values - the vendored
presets, per 10-08), and every Lua entry's colour knob is a palette that mounts a swatch Knob instead.
So two workspaces: **AURORA** carries `picker:tick`, `picker:thumb`, `picker:home` and Knob's dot and
home; **ARC**'s 16-value amount knob carries `knob:thumb`. All six kinds are asserted measured on some
route; **60 circles measured square** per run (47 on aurora, 13 on arc). Two races closed on the way:
Enter is ignored before the entry's pad has painted (seen once on the phone project), and the sweep can
run before the last rail mounts (seen once in chromium, the thumb missing) - the preconditions are now
the pad's first painted pixel and the panel's own `.thumb`, `.dot` and `.home`. Three green runs after.

**The UA finding, measured in bare documents.** Chromium: nothing. WebKit (desktop and iPhone 15
emulation): `input[type=search]`, `input[type=text]`, `input[type=number]`, `<textarea>`, `<select>`
compute **5px** on all four corners, as part of the native control appearance - gone on the inputs and
the textarea the moment an author sets a `border`, a `background-color` or `appearance: none`; **kept on
`<select>`** through all three and removed only by an explicit `border-radius: 0`. **No element on the
site needed a reset**: Tailwind v4's preflight, imported at the top of `app.css`, already carries
`button, input, select, optgroup, textarea { background-color: transparent; border-radius: 0 }`, and
the search field carries its own 6px anyway (`BrowseToolbar.svelte:489`, allowlisted). The elements
13-08 and 13-09 will build: a search field is safe under any author border; **a `<select>` is 5px on
WebKit until `border-radius: 0`**, which preflight provides as long as it stays.

**Three negative checks, the file restored sha256-identical each time:**

| # | Plant (init script) | Result | Printed |
| - | ------------------- | ------ | ------- |
| 1 | `[data-testid="commit-sha"] { border-radius: 3px }` | red in both projects | `/ <code data-testid="commit-sha"> computes border-radius 3px \| 3px \| 3px \| 3px, and 3px … is a value no allowlisted source file declares (D-01)` on every route |
| 2 | same element, `50%` on a 40x24 box | red in both | `… carries border-radius 50% on a 40x24 box: a 50% radius on a non-square element is a pill wearing a circle's clothes (D-10)` |
| 3 | a bare `<select>` appended and preflight's rule deleted at run time | red in **webkit-phone only** | `/ <select#plant-select> computes border-radius 5px \| 5px \| 5px \| 5px from no author rule: a user-agent default no source scan can see …` |

Plant 3 reported green twice before it was right: first it pruned only top-level rules while preflight
sits inside `@layer base` (nothing deleted), then it deleted the rule and still saw 0px because the
site's textareas and inputs lose the native appearance under preflight's `background-color` anyway - the
`<select>` is the one control that keeps it. **Both greens were the plant's fault, and both were
suspected first**, as warning 1 asks.

**A phantom match, caught before commit.** The first cut of the header quoted the title-counting grep
pattern literally, so `grep -c "test("` read 89 across `e2e/` - the exact trap `browse-webkit.e2e.ts`'s
header records. Reworded; the count is 88.

---

## Task 4: the fourteen rows and the ledger

Appended to `.planning/REQUIREMENTS.md` by a splice that inserted 43 lines after three unique anchors
and asserted every original line survives in order; `git diff` shows 43 insertions, 0 deletions.
Two subsections after `IDENT-02` - `### Sandbox [BUILD]` and `### Persistence [KEEP]` - fourteen
`Pending` rows appended to the traceability table, and the "every v1 requirement maps to exactly one
phase" paragraph gains a second paragraph (the coverage bullets still count fifty and are 13-20's).
Every row unticked, dated `minted 2026-09-10 (13-01)`, naming its plan; KEEP-06 says its shape is the
user's at 13-13. **CAT-04 stays `[ ]`.** 12-10 and 12-12 will find the file as they left it plus these
lines.

**Every id is claimed, by frontmatter grep:**

| Id | Plans | Id | Plans |
| --- | --- | --- | --- |
| BUILD-01 | 13-14, 13-15, 13-16, 13-20 | KEEP-01 | 13-06, 13-07, 13-13, 13-16, 13-20 |
| BUILD-02 | 13-14, 13-16, 13-20 | KEEP-02 | 13-06, 13-13, 13-20 |
| BUILD-03 | 13-02, 13-14, 13-15, 13-17, 13-20 | KEEP-03 | 13-06, 13-08, 13-13, 13-20 |
| BUILD-04 | 13-15, 13-20 | KEEP-04 | 13-13, 13-17, 13-20 |
| BUILD-05 | 13-17, 13-20 | KEEP-05 | 13-06, 13-13, 13-20 |
| BUILD-06 | 13-16, 13-20 | KEEP-06 | 13-13, 13-20 |
| BUILD-07 | 13-16, 13-20 | | |
| BUILD-08 | 13-16, 13-20 | | |

**None is unclaimed.**

**The ledger** (`13-COPY-NEW.md`): D-05's register in full, the rule every later plan follows (a Bible
line is taken verbatim and not ledgered; an invented string is written in the register, landed so the
screen is never blank, and ledgered; a plan that is not sure writes its question in the row), and the
table seeded with **eight** symbols - `RESTORED_CAPTION`, `SAFE_NOTE`'s successor, and the six titles
§16's single "Unknown transfer result" row would collapse (`UNCONFIRMED`, `KEPT_MISMATCH`, `PARTIAL`,
`NOTHING_LANDED`, `RESTORED_UNCONFIRMED`, `SNAPSHOT_FAILED`). **The plan says seven and names eight**;
all eight are seeded and the miscount is recorded in the ledger. **Tallies: 162 exported strings
(research §4); about 35 with a §16 or PDF line; about 40 needing a new line; 8 seeded here, 0
proposed.** 13-08 adds seven `FOR` labels and one naming question; 13-18 empties it.

---

## Counts, as carried names plus deltas

| Name | Carried (12-11, observed here) | Term | Observed after 13-01 |
| --- | --- | --- | --- |
| `PREV_FILES` | **85** | **+1** (`radius.spec.ts`) | **86** |
| `PREV_TESTS` | **887** (+1 todo) | **+2** (layer A, layer B) | **889** passed, 1 todo |
| sweep | `4 19` | +0 | **`4 19`**, run at start and at close |
| `BASE_CHECK` | **581** | +2 files, provenance only | **583** files, 0 errors 0 warnings |
| e2e titles | **87** | **+1** (`radius.e2e.ts`) | **88** (`grep -c "test("`) |
| e2e runs | **106** (87 + 19) | **+2** (one `@webkit` title in both projects) | **108** (88 chromium + 20 webkit-phone), full suite green |
| catalog | **26** | +0 | 26 |
| `static/og/` | **26** | +0 | 26, gitignored |
| radius declarations | **41** (43 grep hits) | - | 33 allowlisted + 6 circles + 2 inherit |

`npm run test:quick 2>&1 | node scripts/check-counts.mjs 86 889`: *matches the expected counts*.
`npm run test:sweep 2>&1 | node scripts/check-counts.mjs 4 19`: *matches*.
`npx playwright test --workers 3 2>&1 | node scripts/check-counts.mjs --playwright 108`: *matches*.
`npm run check`: **583 files, 0 errors, 0 warnings**. `npm run lint`: clean. The plan's literals
`86 890` and `88 / 108` move by the tests offset (`-1`) to `86 889` and hold at `88 / 108`.

---

## Deviations from the plan

### 1. [Rule 2 - missing critical correctness] Tailwind's scanner scoped to `src/`, the rounded family refused

Found by layer B on its first run (Task 2). Three radius utilities in the shipped CSS from words in
`.planning/`. `src/app.css` lines 1-22: `source(".")` and `@source not inline(...)`. Every used utility
measured before and after. **Commit `5bf21bc`.**

### 2. [Planner defect, named] The counts the plan carried

43 → 41 declarations (two comment lines); Knob ten/seven → nine/five (a comment and an inherit); a
second `inherit` at `Knob.svelte:569` the plan did not name; D-15's glosses for `:829/:857/:872` off by
one row; "seven" seeds → eight. All recorded where they land.

### 3. [Design, documented in the header] `declarations` counts only what must be cleared; `CIRCLES` is its own constant

The plan's sketch put the six inside the rows and summed them; a row that counted its circles could
never reach zero. The rows still carry `circles`/`circleLines` and they are cross-checked.

### 4. [Rule 2] Layer B is red on a stale build, and its skip is a real skip

Not in the plan; warning 1 made mechanical. A `.svelte`/`.css` newer than the oldest built stylesheet
is red. The cost is one `npm run build` per component edit before a gated quick run.

### 5. [Design, documented in the header] Layer C's tolerance is the allowlist, attributed to author rules

The plan's strict rule cannot be green today. Values are tolerated only while the allowlist is
non-empty, only from an author rule, only at an allowlisted value; UA defaults are red at any value.

### 6. [Rule 3] Two workspace routes and the panel opened, with two race preconditions

No single entry mounts all six circles; a cold workspace mounts none. Documented above.

### 7. [Process] `requirements mark-complete` and `state advance-plan` / `update-progress` not run

IDENT-01 and IDENT-02 are already `[x]` and are amended by name at 13-20; ticking them again would
touch rows this plan must not. STATE.md's position is Phase 12's and is left as it is (below).

---

## What the plan asserts that the tree does not support

1. `85 / 888`, `582`, `27`, `27`, `23` - observed `85 / 887`, `581`, `26`, `26`, `22`.
2. "43 declarations … Knob (ten) … seven non-circle declarations cleared at 13-09" - 41, nine, five.
3. "`ColourPicker.svelte:829` the rail thumb … `:857`, `:872` markers" - tick, thumb, home.
4. "the route list `smoke.e2e.ts` already keeps; reuse it" - it keeps none; derived from `src/routes/dev/`.
5. "The UA finding is expected … fix it with an explicit reset in `app.css`" - no reset was needed;
   preflight already carries it, and the search field is authored 6px regardless.
6. "anything that resolves to a non-zero length is a failure" beside "the title green in both projects"
   - not both, on a tree with 33 authored radii; the tolerance above is how both hold.
7. "Seed it with … seven" - eight symbols named.
8. `ChosenPanel → 13-09`, `MixTwo → 13-10` as re-skins - 13-VALIDATION D-5 and D-12 delete both; the
   rows say `(deleted)`.

---

## Questions recorded for the user rather than answered

None. This plan authored no string a visitor can read; the ledger's questions section says so. Two
things are flagged for the user's attention rather than asked: **D-15's three glosses** (deviation 2,
the pairs unchanged) and **13-VALIDATION's "skipped with a named reason"** for a missing build, which
the plan's stricter rule overrode.

---

## What was NOT done, and why

- **NOTHING HERE IS HARDWARE-VERIFIED. No device was touched. Nothing was deployed.**
- **`gsd-tools state advance-plan`, `update-progress` and `roadmap update-plan-progress` were not run.**
  STATE.md says Phase 12 is executing at 10 of 12 with 12-06 open; Phase 13 wave 1 ran alongside it and
  that is recorded, not corrected. `percent` reads 100 and is left. `record-metric`, `add-decision` and
  `record-session` were run with a copy taken first; what they corrupted and how it was repaired is in
  the section below.
- **`prettier --write .` was not run.** Only the seven files this plan touched were formatted; the three
  user files at the repo root are in `.prettierignore` and untouched. `npm run lint` is clean.
- **`src/vendor/` unmoved; `firmware-oracle.spec.ts` unedited and green; `.planning/ROADMAP.md`
  byte-unchanged across the four commits; nothing under `.planning/phases/12-touch-framework/` touched;
  no sibling repository read.**
- **No Playwright run overlapped a commit**, and no listener was left on 4173.
- The two `.tmp-e2e/` probe files and the scratch copies live outside the tree and are not committed.

## Notes for the next plans

- **Build before a gated quick run** whenever a `.svelte` or `.css` moved; layer B is red otherwise.
- **13-03:** keep `app.css`'s first 22 lines; `instrument.spec.ts:691` asserts `.pill` declares
  `999px` and moves with the pill (13-VALIDATION says 13-04 rewrites scan 2).
- **13-08:** a `<select>` is 5px on WebKit until `border-radius: 0` - preflight holds it today.
- **13-09:** clear Knob's five and ColourPicker's six; the six circles stay; remove both rows.
- **13-18:** eight seeds, no proposals. **13-20:** `ALLOWLIST` empty, `CIRCLES` six, the terms above.

---

## Self-Check: PASSED

Every file this document names as created or modified exists on disk, and every commit hash it
names resolves in `git log --oneline --all`; no stub marker (TODO, FIXME, placeholder) is in any
created file:

```
FOUND  src/lib/ui/radius-allowlist.ts
FOUND  src/lib/ui/radius.spec.ts
FOUND  e2e/radius.e2e.ts
FOUND  .planning/phases/13-gui-overhaul/13-COPY-NEW.md
FOUND  src/app.css
FOUND  docs/TESTING.md
FOUND  .planning/REQUIREMENTS.md
FOUND  .planning/phases/13-gui-overhaul/13-01-SUMMARY.md
FOUND  commit 615f8d0
FOUND  commit 5bf21bc
FOUND  commit 385e63e
FOUND  commit f0a1b8b
```
