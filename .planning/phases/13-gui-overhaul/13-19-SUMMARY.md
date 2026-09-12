---
phase: 13-gui-overhaul
plan: 19
subsystem: tune-copy-and-catalog-names
tags: [copy, register, d-05, d-14-q11b, d-23, sentence-case, names, ids, tune-04, share-03, mix-two-cut, caps-retired, sweep, og]

# Dependency graph
requires:
  - phase: 13-gui-overhaul
    plan: 18
    provides: "the approved batch (D-23) with rows F.1, F.11, F.17, J.10 handed on; the retired-caps comment shape in install-copy.ts and its spec; PREV_FILES 94 / PREV_TESTS 961"
  - phase: 13-gui-overhaul
    plan: 10
    provides: "MIX TWO cut (D-12) with copy.ts's five exports left standing for this plan; Randomize scoped off the MIDI settings, which made SURPRISE_ALL_HELD's sentence imprecise"
  - phase: 13-gui-overhaul
    plan: 09
    provides: "inspector-copy.ts with the PDF's Randomize, Reset settings and Share snapshot verbatim; the per-field reset; copyName"
  - phase: 12.1-gradient-touch
    plan: 09
    provides: "the catalog at 26 = 8 + 18, the OG set at 26 files / 154,136 B, the sweep at 4 19 in about 104 s, docs/HARDWARE-AUDITION.md at 28 rows"
provides:
  - "src/lib/tune/copy.ts in D-05's register: 48 value exports, every HANGAR mechanic keeping its fact; the mix family deleted by name; SURPRISE_ME / RESET_ALL / COPY_LINK retired in favour of inspector-copy.ts's one copy; the measured caps retired by name"
  - "src/lib/tune/copy.spec.ts at six: the Bible, the batch and D-23 read from disk; TUNE-04's fact asserted as a fact; the register over every export; the caps' absence and their retirement"
  - "twenty-six names in sentence case (eighteen moved) with every literal in one commit, ids byte-unchanged and proved so"
  - "the four tune controls (reset, lock, back-off, share) rendered in sentence case at 13px / 0.01em; the lock's reflow invariant as a fixed inline-size"
  - "batch rows F.1, F.11, F.17 landed; J.10 handed to 13-20; the three requirement rows named for 13-20"
affects: [13-20 (TUNE-07, SHARE-02, TUNE-06 amendments; J.10; the mix-family and tune-copy prose in docs/TESTING.md if it is ever re-cased), the bench (nothing here touched a device; docs/HARDWARE-AUDITION.md's Config cells read the new names)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A copy module names the documents that author it and its spec reads them from disk (13-18's pattern, now on tune/copy.ts): section 7 for the locks and Randomize, batch row F.11 for Link copied, D-23 for the answer"
    - "One copy of a Bible line: when a control's line already lives in another copy module, the older constant is retired by name rather than rewritten to the same words"
    - "A measured cap is retired by name with what it measured and what replaced it; an invariant a cap carried (the lock's width) moves into the CSS rule that actually holds it, and the spec reads the rule"
    - "A name is not an id: re-casing names is proved id-safe by byte-identical fixtures, an identical OG filename list and a negative check that re-cases one id and counts the red tests"
key-files:
  created:
    - .planning/phases/13-gui-overhaul/13-19-SUMMARY.md
  modified:
    - src/lib/tune/copy.ts
    - src/lib/tune/copy.spec.ts
    - src/lib/tune/inspector-copy.ts
    - src/lib/browse/labels.ts
    - src/lib/ui/Knob.svelte
    - src/lib/ui/ColourPicker.svelte
    - src/lib/ui/BudgetMessage.svelte
    - src/lib/ui/CopyLink.svelte
    - src/lib/ui/tune-ui.spec.ts
    - src/lib/catalog/entries/ (18 files)
    - src/lib/catalog/listing.ts
    - src/lib/catalog/types.ts
    - src/lib/catalog/audition.spec.ts
    - src/lib/browse/sort.spec.ts
    - src/lib/browse/typographic.spec.ts
    - src/lib/share/stamp.spec.ts
    - e2e/first-experience.e2e.ts
    - docs/HARDWARE-AUDITION.md
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
    - .planning/STATE.md

key-decisions:
  - "SURPRISE_ME, RESET_ALL and COPY_LINK are retired from tune/copy.ts rather than rewritten: Randomize, Reset settings and Share snapshot have lived verbatim in inspector-copy.ts since 13-09 and the components read them there; a second constant with the same words is the drift the module's header forbids"
  - "The mix family is five exports, not four: the plan's four strings plus their composer mixChildName, all deleted by name with copy.spec.ts's seven assertions and A-15's genetics scan"
  - "Lock / Locked replace HOLD / HELD (section 7's noun in sentence case); the same-width rule they carried moves into a fixed 52px inline-size on both .lock rules, asserted by copy.spec.ts test 5"
  - "The uppercase transform and 0.18em tracking come off the reset, the two locks, the back-off and the share control (Rule 2 - the CSS was re-casing sentence-case words, 13-18's deviation 2 in the tune components)"
  - "Twenty-six names, eighteen moved: the eight preset names were already sentence case on the shelf; ids, fixtures, OG filenames and stamps proved unmoved"
  - "The OG images are byte-identical after the rename because D-21's images carry no text; the name moves in the prerendered og:image:alt and title. The plan's 'new bytes' is a claim the tree does not support"
  - "J.10 (retire ?feels=) is handed to 13-20: a codec change in query.ts whose feels field ten files read, outside this plan's files and its +0 / +0 term; the batch offered '13-19 or 13-20'"

# Metrics
duration: about 40 min of execution (task 01 about 15 min - the module, the spec, four components, three negative checks, a build and a quick run; task 02 about 25 min - the rename script, the audition document, the id negative check, a build, a quick run, the sweep, check, lint, five e2e chunks and four reruns) plus this document
completed: 2026-09-12
---

# Phase 13 Plan 19: The Tune Copy in the Register and the Names Re-cased Summary

**One-liner:** `tune/copy.ts` rewritten under D-05 with every HANGAR mechanic keeping its fact (48
value exports from 56: the mix family deleted by name, three Phase 10 labels retired in favour of
`inspector-copy.ts`'s one copy, the measured caps retired by name, Lock / Locked on the row), and the
eighteen hand-authored names re-cased so all twenty-six read as the PDF's `Arc` / `Aurora` /
`Chorus` - every literal in one commit, the ids proved byte-unchanged, the sweep run at `4 19` in
98 s - on the term `+0 / +0` at 94 / 961.

## The counts, carried and observed

| Gate | 13-18 left | 13-19 observed | Term |
| --- | --- | --- | --- |
| quick (`--project server --maxWorkers=2`) | 94 files / 961 tests (+1 todo) | **94 / 961 (+1 todo)** - twice, after task 01 and after task 02, both on a fresh build; `check-counts.mjs 94 961` matches | **`+0 / +0`** |
| `tune/copy.spec.ts` | 6 | **6** - rewritten inside | +0 |
| `catalog/copy.spec.ts`, `listing.spec.ts`, `typographic.spec.ts` | 5, 4, 4 | **5, 4, 4** - `catalog/copy.spec.ts` and `listing.spec.ts` needed no edit (they compare the listing to the catalog structurally and carry no name literal); `typographic.spec.ts`'s two titles re-cased | +0 |
| `stamp.spec.ts` | 9 | **9** - one title re-cased; the `older` fixture untouched | +0 |
| `tune-ui.spec.ts` | its count | held - the 53-character count retired, the reason held against `RANDOMIZE`, two monitor counts on U+00D7 | +0 |
| sweep | 4 / 19 | **4 / 19**, RUN, **98 s wall clock** (12.1-09: about 104 s; Vitest's own duration 93.25 s) | +0 |
| check (`svelte-check`) | 657 / 0 / 0 | **657 / 0 / 0** | +0 |
| lint | clean | **clean** (prettier and eslint) | - |
| catalog | 26 = 8 + 18 | **26 = 8 + 18** | +0 |
| `static/og/` | 26 files, 154,136 B | **26 files, 154,136 B**, filename list diffed empty, **bytes identical** (below) | +0 |
| audition rows | 28 | **28**, 24 Config cells re-cased in place | +0 |
| e2e `test(` count | 83 | **83**; 99 runs green across the chunks and the named reruns (below) | **`+0 / +0`** |
| `tune/copy.ts` value exports | 56 | **48** - five mix exports deleted, three Phase 10 labels retired | - |

**The plan's stale numbers, said once:** the plan carries `93 / 935` and "twenty-seven names" /
"27 files" in `static/og/`. 13-18 left 94 / 961 and the catalog has been 26 = 8 + 18 since 12-10
(`tpad` left the cards, `trackpad` joined; 12-12 and 12.1-09 record it). Twenty-six names, twenty-six
images.

## The twenty-six names, before and after

The eight preset names were already sentence case on the shelf (`presets.ts`, which HANGAR declares,
diffed against the vendored nine by `presets.spec.ts`) and did not move. The eighteen hand-authored
names moved. Ids in the third column did not.

| # | Before | After | Id (unchanged) |
| --- | --- | --- | --- |
| 1 | Aurora | Aurora | `aurora` |
| 2 | Pinwheel | Pinwheel | `pinwheel` |
| 3 | Starfield | Starfield | `starfield` |
| 4 | Radar | Radar | `radar` |
| 5 | Joystick | Joystick | `joystick` |
| 6 | Nine pads | Nine pads | `ninepads` |
| 7 | Four faders | Four faders | `faders` |
| 8 | Dial | Dial | `dial` |
| 9 | EUCLID | **Euclid** | `euclid` |
| 10 | CHORUS | **Chorus** | `chorus` |
| 11 | ARC | **Arc** | `arc` |
| 12 | GHOST | **Ghost** | `ghost` |
| 13 | MORPH | **Morph** | `morph` |
| 14 | SONAR | **Sonar** | `sonar` |
| 15 | STEPS | **Steps** | `steps` |
| 16 | CONSOLE | **Console** | `console` |
| 17 | STRIP | **Strip** | `strip` |
| 18 | LUMEN | **Lumen** | `lumen` |
| 19 | STAGE | **Stage** | `stage` |
| 20 | CULL | **Cull** | `cull` |
| 21 | SNAKE | **Snake** | `snake` |
| 22 | QUADRANT | **Quadrant** | `quadrant` |
| 23 | POMODORO | **Pomodoro** | `pomodoro` |
| 24 | WHEELS | **Wheels** | `wheels` |
| 25 | RADAR POINTS | **Radar points** | `radar-points` |
| 26 | TRACKPAD | **Trackpad** | `trackpad` |

Sentence case for the one multi-word name (`Radar points`, as `Nine pads` and `Four faders` already
read); no name carries `ZONA`. The shelf's `tpad` preset (not carded, reached only through
`portedEntry("tpad")`) already read `Trackpad` and now shares its word with the catalog's `trackpad`;
nothing keys on a name, so nothing collides. `Mirror` - the blocked configuration the audition
document must name and the catalog must not hold - was re-cased in the same move.

## The literals: 65 in 24 files, plus ten prose mentions in five

**65 literals that render, assert or compare a name**, moved in commit `7df9d5d`:

| Where | Literals |
| --- | --- |
| `src/lib/catalog/entries/*.ts` (18 files) | 18 `name:` values |
| `src/lib/catalog/listing.ts` | 18 `name:` values (the restated listing, gated by `listing.spec.ts`) |
| `src/lib/browse/sort.spec.ts` | 2 - `before("Arc", "Aurora")`, `before("Sonar", "Starfield")` |
| `src/lib/catalog/audition.spec.ts` | 2 - `BLOCKED = "Mirror"`, `entry.name === "Morph"` |
| `e2e/first-experience.e2e.ts` | 1 - `workspace-name` `toHaveText("Euclid")` |
| `docs/HARDWARE-AUDITION.md` | 24 Config cells (rows 2-9, 10 `Mirror (optional)`, 12-23, 25-27), edited in place at the same width - no row re-wrapped, no re-padding, the doc's own text unchanged elsewhere (append-only) |

**Ten prose mentions** re-cased where they sat beside a moved literal: `types.ts`'s doc comment,
`typographic.spec.ts`'s two titles, `stamp.spec.ts`'s one title, `audition.spec.ts`'s two titles and
four messages. Not re-cased, on purpose: comments and test titles that name entries in the register
the plans of Phases 8-12 wrote them in (`lua-smoke.spec.ts`'s 55, `install.e2e.ts`'s `LUMEN`
identifier and messages, `device-ui.spec.ts`'s and `shell.spec.ts`'s `["PLAYGROUND", "ARC"]`
breadcrumb fixtures - which are correct, the breadcrumb IS uppercase), and `docs/TESTING.md`'s
history (29 mentions in dated prose). A test title is not a rendered string, and re-casing a dated
record would falsify it.

**`audition.spec.ts`'s parser** (`namesIn`) now reads a capitalised run followed by lower-case
words; it claims exactly the same rows as before and a cell that still read `EUCLID` would claim
nothing and fail test 3 by name. The Morph-is-Setup-only prose match is without case, because the
document's prose is Phase 11's and the file is append-only.

## Ids did not move, proved

- `git diff --quiet -- src/lib/catalog/frames.json src/lib/fidelity/preset-baseline.json
  src/lib/fidelity/golden-frames.json` - clean; sha256 identical either side.
- `static/og/`: the filename list before and after diffed empty (26 names, every one an id); total
  154,136 B against 12.1-09's 154,136 B; **and the 26 images are byte-identical** (sha256 per file).
  The plan asserts "new bytes" because "`ogAlt` carries the name, so every OG image is re-rendered".
  The images ARE re-rendered by `npm run build` (twice here), but `src/lib/og/render.ts` draws no
  text (D-21: nothing rasterises a font in Node without a native dependency; Discord renders
  `og:title` as real text). The name moves where it lives: the prerendered `<title>` (`Euclid —
  HANGAR`) and `og:image:alt` (`The Euclid configuration running on a ZONA’s 9 by 9 pad.`), which
  `og/build.spec.ts` holds against `ogAlt(entry.name)` on the built HTML.
- **The negative check**, from a scratch copy with the hash compared after: `euclid.ts`'s `id:
  "euclid"` re-cased to `"Euclid"` - **twelve tests red** across five specs: `catalog.spec.ts`
  ("gives every entry a unique url slug" - the route's slug), `frames.spec.ts` (four - keyed by id),
  `listing.spec.ts` ("restates the catalog exactly"), `og/build.spec.ts` (two - the page and its
  image resolve by id), `stamp.spec.ts` (four - "wild-stamps.json names euclid"). Names and ids are
  separate things, and the tree says so in twelve places.

## `tune/copy.ts`, family by family

56 value exports before (58 `export` lines less the two types), 48 after. Every remaining export
keeps its fact; the words moved where Phase 10's register showed.

| Family | Fact kept | What moved |
| --- | --- | --- |
| captions `TUNING` / `SETUP` / `TIMER` / `COLOUR` | one-word section labels | nothing - D-05 permits uppercase for short section labels; the spec now says so and holds them to one word |
| `SURPRISE_ME`, `RESET_ALL`, `COPY_LINK` | the three controls | **retired** - `Randomize`, `Reset settings`, `Share snapshot` are `inspector-copy.ts`'s (`RANDOMIZE`, `RESET_SETTINGS`, `SHARE_SNAPSHOT`, PDF page 5 and section 7 verbatim, landed by 13-09) and the components read them there; `CopyLink.svelte`'s default label is now `SHARE_SNAPSHOT`. The spec asserts the three absent here and verbatim there |
| `TURN_IT_DOWN` | the back-off under an over-budget message | `Turn it down` - a verb on a button, and still not `Put it back` (the device band's control) |
| `LINK_COPIED` | the share control for 2 s after the copy | `Link copied` - **batch row F.11, approved (D-23)**; the spec reads the row from disk |
| `KNOB_HOLD` / `KNOB_HELD` | a setting is locked against Randomize; the state is in the accessible name | `Lock` / `Locked` - section 7's noun in sentence case; the 4 / 4 same-width rule retired, the invariant moved into CSS (below) |
| `SURPRISE_ALL_HELD` | every randomizable setting is locked; MIDI settings are never randomized | `Everything that can be randomized is locked. MIDI settings are never randomized.` - both facts of 13-10's scope rule; names the state, never the control (asserted against `RANDOMIZE`) |
| the two meters (`MEASURING`, `meterNumerals`, `meterPercent`, `meterExpansion`, `emptyTimerExpansion`) | how many of 908 are used | unchanged - already in the register |
| the forecast (`forecastDelta`, `forecastExpansion`) | what a choice would cost | unchanged; U+2212 still in its one place in `src/` |
| `METERS_UNAVAILABLE` | the formatter never resolved | `The character counter couldn’t load, so the two budgets aren’t shown. Everything else here still works.` |
| the picker's seven | RGB444, 16 steps, the cheap steps, the corner | unchanged; their counts stay in `colour-picker.spec.ts` |
| `EMPTY_RACK` | a configuration with nothing to change; the meters still measure | `This configuration has no settings to change. Its two budgets below are still live.` |
| the ladder (`lowerFirst`, `ladderLine`) | **TUNE-04: a feature was trimmed, and which** | words unchanged (already plain); the FACT is now asserted over four step counts and three labels - budget named, "turned down" said, the compiler's label present lower-cased at its first character only, the count present |
| over budget (four sentences, two back-offs) | a setting did it / it arrived like this; one event or both | unchanged; the comments say `Turn it down` |
| `tryOnBudgetReason` | over budget on which event, and the way back | `Over the 908-character budget on Setup. Turn something down to apply it.` - no cap; `HONESTY_CAP` retired by name |
| `SHARE_FALLBACK_LINE`, `SHARE_FALLBACK_FIELD_NAME` | the keys to press; the field's name | `wouldn’t`; `Snapshot link` (the control's noun) |
| the three stamp landings | **SHARE-03: an older link lands on the base configuration and says so** | `These settings came with the link. Reset settings returns the configuration to its defaults.` (names the control as it reads); `…Its settings couldn’t be read, so this is Euclid at its defaults.`; the fact asserted as a fact: older says "older version" and the name, unreadable says the name and never "older" |
| the live region (eight) | what changed, once (section 14) | `settings` for `knobs`, `randomized` for `randomised`; the one-utterance rule kept |
| `ogAlt` | what the picture shows | unchanged; the name interpolated raw |
| `DESTRUCTIVE_CONFIRMATIONS` | none on this panel | `[]`; the comment now points the one store confirmation at `install-copy.ts` |
| **`MIX_TWO`, `MIX_LINE`, `MIX_THIS`, `MIX_THAT`, `mixChildName`** | nothing - the feature is gone (D-12) | **deleted by name** (below) |

**`typographic.ts`'s verdict: innocent.** It replaces an ASCII apostrophe between two letters with
U+2019 and nothing else - no casing, no tracking. What DOES case a name at render is the breadcrumb
(`+page.ts`: `["PLAYGROUND", listed.name.toUpperCase()]`, the Sandbox likewise) and the intro's hero
caption (`HeroSurface.svelte`: `{entry.name.toUpperCase()} / {term.toUpperCase()}`), both of which
are exactly what D-05 permits uppercase for - the PDF's own `PLAYGROUND / ARC` and `ARC / MODULATION`.
Both untouched; the built `euclid/index.html` reads `PLAYGROUND / EUCLID` in the breadcrumb and
`Euclid` everywhere else.

## The mix family, deleted by name

`MIX_TWO` (the control, `MIX TWO`), `MIX_LINE` (`Takes half its settings from each, at random. Nothing
is sent to your ZONA.`), `MIX_THIS` (`THIS ONE`), `MIX_THAT` (`THAT ONE`) - the four strings the plan
names - and their composer `mixChildName(changes)` (`Take this: …`), which 13-10 also named. Gone
with `copy.spec.ts`'s seven assertions over them and A-15's genetics-vocabulary scan (it existed to
keep the crossover metaphor off a control that no longer exists). The header retires them by
identifier, dated.

`grep -rn "MIX TWO" src/` after: **three hits, none in code** - `colour-picker.spec.ts:596` (a
failure message: "two, not four, since MIX TWO left at 13-10"), `colour-picker.spec.ts:704` and
`tune-ui.spec.ts:31` (comments recording the deletion). They are the record 13-10 said the phase
would keep so nothing later mistakes the cut for a gap; the machine check is `copy.spec.ts` test 1,
which strips comments and asserts none of the three uppercase strings appears as a string literal in
any file under `src/`. The plan's "empty" is read as "no string, no export".

## The measured caps, retired by name

With 13-18's comment shape (`THE MEASURED CAPS ARE RETIRED BY NAME, 2026-09-12` in the header;
`copy.spec.ts` test 5 asserts each absent as an assertion and present by name with its number):

| Cap | What it measured | What replaced it |
| --- | --- | --- |
| `HONESTY_CAP` (86) | `tryOnBudgetReason`'s worst form under `install-copy.ts`'s cap from outside (2 x `CH_PER_LINE`, the 43 of plan 10-01's 372px column); 10-03 shortened the literal to 85 | 13-18 retired the cap with the column; the reason reads in the register and no number governs it |
| `SURPRISE_ALL_HELD`'s 53 (10-UI-SPEC 13.4) | the sentence's length, in `copy.spec.ts` and `tune-ui.spec.ts` | the sentence is rewritten (13-10 had already made "every knob" imprecise); no count |
| `KNOB_HOLD` / `KNOB_HELD` at 4 / 4 | the same width, so toggling could not reflow the row | `Lock` / `Locked` are not; both `.lock` rules (Knob, ColourPicker) declare `inline-size: 52px` over the 44px floor, and test 5 reads the rule - the invariant moved from a letter count to the CSS that holds it |
| `MIX_TWO` 7, `MIX_LINE` 75, `MIX_THIS` / `MIX_THAT` 8 / 8 | the family's counts | gone with the family |
| `forecastExpansion`'s 44 | a count of an unchanged sentence | a number in a copy module is a description, not a rule |

The picker's seven counts stay in `colour-picker.spec.ts`: those strings did not change, so their
numbers still describe them.

## The four tune controls in sentence case (Rule 2)

`Knob.svelte`'s `.reset` and `.lock`, `ColourPicker.svelte`'s `.lock`, `BudgetMessage.svelte`'s
`.back-off` and `CopyLink.svelte`'s `.control` carried `text-transform: uppercase` and 0.18em - so
13-09's `Reset` rendered `RESET`, and `Lock`, `Turn it down` and `Share snapshot` would have rendered
`LOCK`, `TURN IT DOWN`, `SHARE SNAPSHOT`. Same defect 13-18 found in the device band (its deviation 2),
same fix: 13px / 600 / 0.01em, no transform. `ColourPicker.svelte`'s comment kept its line count so
D-15's three circles stay at `:840 / :867 / :882` (`radius.spec.ts` layer A green; layer B on the
fresh build). Allowlist unchanged, `border-radius` count unchanged.

## The batch hand-off rows

| Row | Landed |
| --- | --- |
| F.1 (a per-entry inspector headline, "if you want it, say so") | answered by silence under D-23's rule: **one constant stands**, no twenty-six headlines written |
| F.11 `LINK COPIED` → `Link copied` | **landed**, `copy.ts` `LINK_COPIED`; the spec reads row F.11 from the batch |
| F.17 `x{n}` → `×{n}` | **landed**, `inspector-copy.ts` `monitorCount` with U+00D7; `tune-ui.spec.ts`'s two counts |
| J.10 retire `?feels=`, keep `?tag=` | **handed to 13-20** - a codec change in `query.ts` whose `feels` field is read by ten files (`facets`, `filter`, `query` and their specs, `BrowseToolbar.svelte`, both playground routes, `browse.e2e.ts`), outside this plan's files and its `+0 / +0` term; the batch said "13-19 or 13-20" |
| `FOR_LABELS` (E.1-E.8) | **already applied** - the seven values in `labels.ts` are the batch's approved ones as shipped; only the comment moved from "provisional" to "approved (D-23)" |

`SURPRISE_ALL_HELD`'s replacement is **not in the batch**: 13-10 proposed one (*Every setting
Randomize can roll is held. MIDI settings are never rolled.*) and said it was ledgered for 13-18, but
the ledger's 13-10 section carries only the monitor rows, so the batch never saw it. Written here in
the register with 13-10's two facts and the lock vocabulary; flagged as question 1 below.

`13-COPY-NEW.md` is a record now (13-18); its "handed to 13-19" paragraph and rows F and J are
updated to say where each went. Nothing handed to 13-19 is unlanded except J.10, which is handed on
with its reason.

## The three requirement rows, named for 13-20 (not edited)

`.planning/REQUIREMENTS.md` is untouched (`git diff --quiet` clean).

| Row | Its wording today | What moved in this plan | For 13-20 |
| --- | --- | --- | --- |
| `TUNE-07` | *"User can hit `SURPRISE ME`…"* | the control reads `Randomize` (13-09, `inspector-copy.ts`), `SURPRISE_ME` is retired from `copy.ts`, and 13-10's scope rule (MIDI destination, channel and send are never rolled; `Undo randomize` exists) is now also in `SURPRISE_ALL_HELD`'s second sentence | two changes in one row: the label and the scope |
| `SHARE-02` | *"an explicit `COPY LINK` control whose own state confirms the copy"* | the control reads `Share snapshot` and confirms as `Link copied` (F.11); `COPY_LINK` is retired; the state-confirms-the-copy behaviour is unchanged (`tuning.e2e.ts:550` green) | the label only |
| `TUNE-06` | *"reset one knob (double-click) or the whole configuration"* | 13-09's per-field `Reset` now renders in sentence case; the whole-configuration control reads `Reset settings`; the register says "setting" where the row says "knob" | the per-field affordance beside the double-click, and the noun |

## The e2e result, chunked, every rerun named

Build first (`npm run build`, 22.6 s, on the tree after task 02); one fresh detached `wrangler dev`
per chunk through `e2e-chunks-1319.sh` (12.1-08's script with the log names changed); free memory
between 0.15 and 0.78 GB across the run.

| Chunk | Files | Result |
| --- | --- | --- |
| 1 | install, session | 33 passed, 1 failed - `install:1977` webkit-phone CLEAR, `CONFIG/EXECUTE` **7 for 5** (the transient 13-17 and 13-18 also recorded: a retried write counts extra frames); alone at `--workers 1`: chromium passed, webkit-phone failed again; **alone per project: webkit-phone passed, chromium passed** |
| 2 | browse, browse-webkit | 20 passed, 1 failed - `browse-webkit:357` (`scrollIntoViewIfNeeded` timeout at 0.25 GB free); **the title alone: 2 passed** (both projects) |
| 3 | tuning, tuning-webkit | 12 passed, 8 failed - **wrangler died mid-chunk** (`ERR_CONNECTION_REFUSED` on five; the other three `waitForPicture` / debounced-recompile timeouts under the same load); **the chunk rerun whole: 20 passed** (37 s) |
| 4 | catalog, fidelity, first-experience, library, sandbox | **13 passed** - including `first-experience:430`'s `Euclid` |
| 5 | artifacts, radius, skeleton, smoke | **11 passed** |

99 runs green across the chunks and the reruns; 83 titles. Every e2e that imports a moved string
(`LINK_COPIED`, `TURN_IT_DOWN`, `STAMP_RESTORED`, `SHARE_FALLBACK_FIELD_NAME`, `MEASURING`,
`stampUnreadable`, `tryOnBudgetReason`, `backOffKnob`) reads it from the module and passed; the one
e2e name literal moved.

## Negative checks

Task 01, each from a scratch copy of `copy.ts` with the hash compared after (identical, `20e07d98…`):

1. The ladder line without its label clause - **red** on the string equality, and with the exact
   strings preserved for the pinned label and the clause dropped for every other label, **red on the
   fact test by name**: *ladderLine(1) does not say WHICH feature was trimmed*.
2. An exclamation mark in `meterExpansion` - **red** twice: *meterExpansion carries an exclamation
   mark* (the register test) and the meter test's equality.
3. `MIX_TWO` and `MIX_THIS` re-added - **red** twice: *MIX_TWO is still exported* and the
   uppercase-run rule (*MIX_TWO shouts "MIX"*); `grep -rn "THIS ONE" src/` found it at `copy.ts:141`.

Task 02, from a scratch copy of `euclid.ts` (hash identical after, `605fc43f…`): one id re-cased -
**twelve tests red** in five specs (above).

## Deviations from Plan

**1. [Rule 2 - one copy] `SURPRISE_ME`, `RESET_ALL` and `COPY_LINK` retired rather than rewritten.**
The plan's family table has them becoming `Randomize`, `Reset settings`, `Share snapshot` verbatim.
Those three lines have lived verbatim in `inspector-copy.ts` since 13-09 and every component reads
them there; a second constant with the same words in `copy.ts` would be the second copy the module's
header exists to forbid. `copy.spec.ts` asserts the three absent here and verbatim there, and
`STAMP_RESTORED` names `Reset settings` as the control reads. Export arithmetic: 56 → 48, not the
plan's 52.

**2. [Rule 2 - a defect the rewrite exposed] The reset, the locks, the back-off and the share control
were uppercased in CSS.** Sentence-case words rendered as `RESET` (13-09's, already shipped that way)
and would have rendered `LOCK`, `TURN IT DOWN`, `SHARE SNAPSHOT`. Removed with the 0.18em tracking in
four components (13-18's deviation 2, in the tune components). `tune-ui.spec.ts` held no tracking
rule on these; `radius.spec.ts` layer A was kept green by holding `ColourPicker.svelte`'s line count.

**3. [Rule 3 - the invariant a cap carried] The lock's fixed width.** `Lock` / `Locked` are not the
same width and the lock's grid column is `auto`, so toggling would have moved the reset beside it by
a few pixels. Both `.lock` rules declare `inline-size: 52px` above the 44px floor; `copy.spec.ts` test
5 reads both rules. The 44px floor assertions in `tune-ui.spec.ts` still hold.

**4. [Scope, named] J.10 handed to 13-20.** A codec change in `query.ts` read by ten files, outside
this plan's files and its `+0 / +0` term; the batch offered either plan.

**5. [Rule 1 - the plan's claim against the tree] The OG images are byte-identical, not "new bytes".**
`render.ts` draws no text (D-21), so a name change cannot move a pixel; the images were re-rendered
twice and matched sha256 for sha256. The name moves in the prerendered HTML, where `og/build.spec.ts`
holds it. Recorded rather than forced.

**6. [Scope, said once] Twenty-six names, eighteen moved.** The plan says twenty-seven re-cased; the
tree has twenty-six and eight were already sentence case. The tally is the table above.

**7. [Rule 2 - a string the batch never saw] `SURPRISE_ALL_HELD`.** The coordinator's brief says its
replacement is in the batch; it is not (13-10's question never reached the ledger). Written in the
register with 13-10's two facts; question 1.

**8. [Rule 3 - the harness] the U+2212 escape and heredoc backslashes.** The Write tool decoded the spec's
`"\u2212"` escape (written here as backslash-u-2212) to the glyph (which would have doubled the character the spec counts to one); fixed
by a script that writes the backslash by code point. Bash heredocs on this machine drop one backslash
from `\\`, which silently emptied a regex in the first rename script (the audition cells re-cased in
a second pass with `String.fromCharCode(92)`). Both recorded so the next plan does not lose an hour
to them.

## Questions for the user, recorded rather than answered (D-01)

1. **`SURPRISE_ALL_HELD`** now reads *Everything that can be randomized is locked. MIDI settings are
   never randomized.* - 13-10's two facts in the lock vocabulary, because the batch never carried the
   row. The second sentence is true on every entry but only informative on the ones with MIDI
   settings (`faders`' `send` and `channel`, and the other MIDI-bearing entries); if you would rather
   the first sentence alone, it is one string and one spec line.
2. **`EMPTY_RACK`** says *no settings to change* where Phase 10 said *nothing to turn*; and the
   register's noun is *setting* throughout (`6 settings randomized`, `Settings back to their
   defaults`). If you prefer *parameter* (section 7's other word), it is a find-and-replace inside
   one module.
3. **`SHARE_FALLBACK_FIELD_NAME`** is `Snapshot link` (the control's noun) where Phase 5 said
   `Shareable link`. Say if `Shareable link` should stay.
4. **The `Locked` width** is held by a fixed 52px on the lock button rather than a measurement;
   Inter 600 at 13px sets `Locked` at about 47px. If the bench shows the word clipped at any zoom,
   56px is one number in two rules.
5. **The prose that still says `EUCLID`** - comments and test titles in the specs, `docs/TESTING.md`'s
   history, `install.e2e.ts`'s `LUMEN` identifier - was left as the record it is. If you want the
   tree's prose re-cased too, it is a mechanical pass over about 90 lines with no rendered effect.

## What 13-20 will find

- The three requirement rows above, with the exact strings that moved.
- J.10, with its ten-file footprint named.
- `tune/copy.ts` at 48 exports in the register; `inspector-copy.ts` owning the three Bible labels;
  `CopyLink.svelte` defaulting to `SHARE_SNAPSHOT`.
- The mix family gone; the three prose mentions of `MIX TWO` in `src/` are the record.
- `docs/HARDWARE-AUDITION.md` reading `Euclid`, `Radar points`, `Mirror (optional)` in its Config
  cells and Phase 11's uppercase in its prose; `audition.spec.ts`'s parser reading sentence case.
- The batch's remaining hand-offs to 13-20 unchanged from 13-18's list.

## The runbook and the bench

No device was connected to, written to or deployed to by this plan. Nothing was installed. CAT-04
stays `[ ]`. `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `12-touch-framework/`,
`12.1-gradient-touch/`, `src/vendor/` untouched (`firmware-oracle.spec.ts` green and unedited); no
`gsd-tools state` command run - STATE edited by script against a copy with `status: executing`,
`completed_phases: 11`, `percent: 100` asserted unchanged before and after. No `git checkout`, `git
restore`, `git stash` or `git clean`; every restore was a copy back with the hash compared. No
`prettier --write .` (only the files this plan wrote). The three untracked root files are the
user's. Sibling repositories read-only.

## Self-Check: PASSED

- `src/lib/tune/copy.ts` contains `THE MEASURED CAPS ARE RETIRED BY NAME, 2026-09-12` and
  `THE MIX FAMILY IS GONE BY NAME, 2026-09-12`; exports none of `MIX_TWO`, `MIX_LINE`, `MIX_THIS`,
  `MIX_THAT`, `mixChildName`, `SURPRISE_ME`, `RESET_ALL`, `COPY_LINK` - FOUND
- `src/lib/tune/copy.spec.ts` at six `it(` - FOUND
- `src/lib/catalog/listing.ts` reads `name: "Radar points"` and no uppercase name - FOUND
- `src/lib/catalog/entries/` → `static/og/` via `ogAlt` in the built `og:image:alt` (the plan's key
  link): `build/playground/euclid/index.html` carries `The Euclid configuration running on a ZONA’s
  9 by 9 pad.` - FOUND
- `frames.json`, `preset-baseline.json`, `golden-frames.json` byte-unchanged - FOUND
- commits `82d710d` (task 01) and `7df9d5d` (task 02) - FOUND in `git log`
- `+0 / +0` observed as 94 / 961 (+1 todo) twice; sweep 4 19 in 98 s; check 657 / 0 / 0; e2e 83 / 99
