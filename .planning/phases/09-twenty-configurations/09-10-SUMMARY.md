---
phase: 09-twenty-configurations
plan: 10
subsystem: catalog
tags:
  [
    CONT-02,
    CONT-03,
    TUNE-01,
    phase-gate,
    measurements,
    hardware-audition,
    deferred-items,
    non-vacuity-floors,
    D-07,
    D-08,
    checkpoint,
  ]

# Dependency graph
requires:
  - ".planning/phases/09-twenty-configurations/09-01-SUMMARY.md - the FROZEN pair BASE_FILES 73 and BASE_TESTS 776 (+1 todo), BASE_E2E 89, and the pre-phase build wall time of 12 s at 34d0fd6. This is the only plan besides 09-01 permitted to write an arithmetic against BASE_*"
  - ".planning/phases/09-twenty-configurations/09-09-SUMMARY.md - the closing rolling pair PREV_FILES 74 / PREV_TESTS 780, BASE_SWEEP `4 19` at 701 combinations over twenty-seven Lua entries, PREV_E2E 89, svelte-check 567, KNOWN_TAGS 55, chip row 28, ROW_COUNT 32, and the fifteen-row arithmetic table"
  - ".planning/research/CATALOG-SURFACE.md section 4 - every projection at thirty-six entries, all MEDIUM confidence, all arithmetic, and its own sentence that nothing was built or benchmarked at 36 entries"
  - "docs/PIN-POLICY.md items 1, 4 and 6 - the bump checklist whose stake this plan re-states at twenty-seven hand-authored entries"
  - "src/lib/catalog/audition.spec.ts - what is gated in docs/HARDWARE-AUDITION.md is structure and agreement with the data, never wording, with the install-order sentence the one exception"
provides:
  - "THE COST OF THIRTY-SIX IS MEASURED RATHER THAN PROJECTED. Every row of CATALOG-SURFACE.md section 4 observed on this machine at 36a1965 and written into docs/TESTING.md beside the projection it replaces"
  - "The exact sweep count: 701 combinations over twenty-seven entries and 1,402 measured events, against the research's ~1,090 - a 36 % overshoot whose whole cause is that all seven Phase 8 entries carry a sixteen-value channel knob and none of the twenty does"
  - "BOTH .wasm ASSETS ARE BYTE-IDENTICAL AT THIRTY-SIX: glue 271,581 B and lua_fmt_bg 628,148 B, the zero-growth claim confirmed rather than assumed"
  - "The phase's reconciled arithmetic, with the frozen and rolling baselines shown meeting: 776 - 1 + 5 + 0x7 = 780 = BASE_TESTS + 4"
  - "Two non-vacuity floors raised from 16 to 36, each with a comment saying it is a number a human chose and that a derived comparison would be a tautology"
  - "docs/HARDWARE-AUDITION.md reads as one document: a section naming the six rows where a green test is not evidence, split into the latch-and-time family and the keystroke family with the difference stated"
  - "deferred-items.md holds eight items, every one this phase recorded, each with what would close it"
  - "THREE LOAD-SENSITIVE TESTS FOUND AND FIXED, none of them by a gate: og/build.spec.ts built a template string per pixel over 27.2 million pixels, lua-entries.sweep.spec.ts test 6 had a second of headroom against a 5,000 ms default, and queue.spec.ts waited a fixed 5 ms for a write three times"
  - "The hardware checkpoint, PRESENTED TO THE USER AND UNANSWERED. No agent in this phase connected to a device, performed a write or deployed"
affects:
  - "Phase 10 - the browse ceiling comment now carries a measurement rather than a projection, and thirty-six is four entries from the documented ~40 line the next configuration wave has to answer"
  - "docs/TESTING.md - the whole How-to-run table is dated 2026-09-07 at 36a1965 and is the tree Phase 10 starts measuring against"
  - "The next entry wave - deferred item 8 names the sixteen-value channel knob as the sweep's affordability lever, and nothing enforces it"

tech-stack:
  added: []
  patterns:
    - "A NON-VACUITY FLOOR IS A NUMBER A HUMAN CHOSE AND MUST STAY A LITERAL. expect(ROUTED.length).toBeGreaterThanOrEqual(ROUTED.length) is a tautology; the whole value of the line is that somebody has to re-choose it when the catalog shrinks past it, and the comment beside each says so"
    - "A TEST THAT WRITES DOWN A NUMBER OF MILLISECONDS WHERE IT MEANS A CONDITION IS A BUG IN THE TEST. Three of queue.spec.ts's tests waited `await sleep(5)` for a write; 5 ms of wall clock is not 5 ms of scheduled CPU, and polling the condition behind a generous deadline asserts the same thing without the race"
    - "A SPEC MADE EXPENSIVE BY GROWTH IS MADE CHEAPER OR GIVEN A CEILING, NEVER MADE SMALLER. og/build.spec.ts's per-pixel template string became three numeric comparisons over exactly the same pixels (4.27 s to 0.56 s); lua-entries.sweep.spec.ts test 6 took the explicit 600000 timeout its sibling sweep already carries. Neither sampled anything - that is the D-08 and D-10 rule"
    - "A PROJECTION IS REPLACED BY A MEASUREMENT WITH THE PROJECTION LEFT BESIDE IT. The value of CATALOG-SURFACE.md section 4 is not that it was right; it is that the next person can see which half of it was, and that requires both columns in one table"
    - "A DOCUMENT THAT QUOTES CATALOG DATA IS CHECKED BY SCRIPT OR NOT AT ALL. Correcting one stale sentence and leaving five true ones beside it is worse than leaving the section alone, because a reader cannot tell which was checked"

key-files:
  created:
    - ".planning/phases/09-twenty-configurations/09-10-SUMMARY.md"
  modified:
    - "docs/TESTING.md"
    - "docs/HARDWARE-AUDITION.md"
    - "docs/PIN-POLICY.md"
    - "src/lib/og/build.spec.ts"
    - "e2e/artifacts.e2e.ts"
    - "src/lib/ui/BrowseGrid.svelte"
    - "src/lib/catalog/lua-entries.sweep.spec.ts"
    - "src/lib/transport/queue.spec.ts"
    - ".planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md"
    - ".planning/phases/09-twenty-configurations/deferred-items.md"

decisions:
  - "The two floors stay literals at 36 rather than becoming ROUTED.length. A derived comparison is a tautology; the point of a non-vacuity floor is that a person chose the number and has to choose again"
  - "og/build.spec.ts's pixel classifier compares three numbers instead of building a `${r},${g},${b}` key. Identical coverage, identical assertions, 4.27 s to 0.56 s - the alternative, sampling fewer images, is what D-08 and D-10 forbid"
  - "lua-entries.sweep.spec.ts test 6 takes an explicit 600000 timeout, the exact idiom reachability.sweep.spec.ts:254 already uses. A sweep project's tests are long by definition and Vitest's 5,000 ms default is the wrong number for one"
  - "queue.spec.ts's three fixed 5 ms waits became a poll behind a 2,000 ms deadline. The queue was never wrong; the test had written a duration where it meant a condition. Eight tests before, eight after"
  - "The 05.1-UI-SPEC.md pass corrected SIX stale quoted facts rather than the one the plan named, and confirmed the chip row unchanged. Leaving five true sentences beside one corrected one is worse than leaving the section alone"
  - "The sixteen-row tag table at 05.1-UI-SPEC.md:456 was left at sixteen deliberately, because the document says in its own words that it is Phase 5.1's snapshot and that the live census is filter.spec.ts's RECORDED block"
  - "docs/HARDWARE-AUDITION.md's six-row section sits ABOVE the checklist rather than reordering it, because audition.spec.ts parses the numbered table and asserts its numbering. Grouping is editorial; the table is gated"
  - "npm run test:unit -- --run is documented as green again rather than as unsupported. It failed twice before the three fixes and passes at 78 files / 799 tests after them, which is exactly test:quick plus test:sweep"

requirements-completed: [CONT-02, CONT-03, TUNE-01]
requirements-contributed: []

# Metrics
duration: 88min
completed: 2026-09-07
---

# Phase 9 Plan 10: The Measurements, the Document, the Gate and the Pause — Summary

Everything the research projected at thirty-six entries is now a number somebody measured, and the
two most interesting ones disagree with it in opposite directions: the sweep came in 36 % cheaper
than projected and the build did not grow at all. The audition reads as one document with the six
rows that matter named first, eight deferred items are written down, and the checkpoint is in the
user's hands, unanswered.

---

## The seven-name block

| Name         | Value                       | Where it came from                                                                              |
| ------------ | --------------------------- | ----------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **73** — **frozen**         | 09-01, the clean tree Phase 7 closed at `34d0fd6`. Written against here, and nowhere else        |
| `BASE_TESTS` | **776** (+ 1 todo) — frozen | 09-01. Written against here, and nowhere else                                                    |
| `PREV_FILES` | **74** = `BASE_FILES + 1`   | measured by this plan: ` Test Files  74 passed (74)`                                             |
| `PREV_TESTS` | **780** (+ 1 todo) = `BASE_TESTS + 4` | measured by this plan: `      Tests  780 passed \| 1 todo (781)`                       |
| `BASE_SWEEP` | **`4 19`**                  | re-measured here, unchanged; `3 13` before 09-01                                                 |
| `BASE_E2E`   | **89** — **frozen**         | 09-01                                                                                            |
| `PREV_E2E`   | **89 (measured by 09-10)**  | re-measured by this plan at `--workers 3`, both projects                                         |

**This is the point at which the rolling pair and the frozen pair reconcile**, and the phase closes
with `PREV_FILES = BASE_FILES + 1` and `PREV_TESTS = BASE_TESTS + 4`.

---

## The measurement table — every projection beside its observed value

`.planning/research/CATALOG-SURFACE.md` section 4 said plainly *"nothing was built or benchmarked at
36 entries."* All of it was MEDIUM confidence and all of it was arithmetic. Built and benchmarked
here, on this machine, at commit `36a1965`, in one session:

| Thing                             | At 16 (measured 2026-09-07) | Projected at 36     | **Observed at 36**                | Difference                                       |
| --------------------------------- | --------------------------- | ------------------- | --------------------------------- | ------------------------------------------------ |
| `build/browse/index.html`         | 34,041 B                    | ~57,400 B           | **61,673 B**                      | +7.4 %                                           |
| listing chunk                     | 4,665 B (`DtmYTZ_2.js`)     | ~10,500 B           | **11,008 B** (`Bp335Xwq.js`)      | +4.8 %                                           |
| `glue.<hash>.wasm` (the Lua VM)   | 271,581 B                   | 271,581 B — **+0**  | **271,581 B** (`glue.Dlydm7r2`)   | **0 bytes, confirmed**                           |
| `lua_fmt_bg.<hash>.wasm`          | 628,148 B                   | 628,148 B — **+0**  | **628,148 B**                     | **0 bytes, confirmed**                           |
| protocol chunk `BFIKf6sX.js`      | 39,269 B                    | unchanged           | **39,269 B**                      | 0 bytes                                          |
| `static/og/`                      | 132 KB, 16 images           | ~300 KB             | **292 KB, 36 images** (210,926 B) | −2.7 %                                           |
| `npm run build`                   | 12 s wall                   | ~16-20 s            | **12.08 s wall**                  | **−25 to −40 % — the projection was wrong**      |
| `frames.json`                     | 15,259 B                    | ~34,300 B           | **33,553 B**                      | −2.2 %                                           |
| `lua-entries` sweep, combinations | 283                         | ~1,090              | **701**                           | **−35.7 %**                                      |
| `lua-entries` sweep, test segment | 1.47 s                      | ~5.7 s              | **3.89 s / 3.74 s** (twice)       | −32 %                                            |
| `lua-entries` sweep, run alone    | 2.56 s                      | ~7-8 s              | **4.54 s / 4.37 s** (twice)       | −40 %                                            |
| `frames.spec.ts` test segment     | 318 ms                      | ~1.2 s              | **649 ms**                        | **−46 %**                                        |
| `lua-smoke.spec.ts` test segment  | 129 ms                      | ~500 ms             | **286 ms**                        | **−43 %**                                        |
| `lua-parity.spec.ts`              | 0.93 s                      | unchanged           | **0.98 s**                        | unchanged, as projected — it is pinned to nine   |
| mounted canvases on `/browse/`    | 16                          | 36, under a ~40 ceiling | **36**                        | exact                                            |
| on-screen ticking cards           | ~8-12                       | ~8-12, unchanged    | **4 at 1280x720**                 | **−50 to −67 %; the reasoning held, not the number** |

Six rows are within ten per cent of the projection. **Four disagree by more than ten per cent**, and
they are the interesting ones:

**1. The build did not grow, by 25 to 40 %.** `gen-og.mjs` renders thirty-six 1200x630 PNGs where it
rendered sixteen, and the three-stage build still finishes in 12.08 s against 12 s at sixteen
entries. The OG stage was never the critical path — a Vite dev-server boot and
`vite-plugin-sveltekit-compile`'s `writeBundle` are, at 3.6 s of a 4.9 s Vite build from the build's
own `PLUGIN_TIMINGS` — so doubling a linear stage that was not the bottleneck cost nothing
observable.

**2. The sweep came in at 701 rather than ~1,090, and the cause is one knob.** Exact arithmetic
below. The projection assumed the twenty new entries would look like the seven that existed. **All
seven Phase 8 entries carry a sixteen-value MIDI-channel knob — 7 x 16 = 112 of their 283
combinations in one knob — and no entry authored in Phase 9 ships one.** The widest knob in any of
the twenty has five values. That single authoring choice is TUNE-01's qualifier for this phase and
it is recorded as deferred item 8, because nothing enforces it.

**3. `frames.spec.ts` and `lua-smoke.spec.ts` are 43-46 % under their projections.** Both projections
scaled the unit of work linearly (engine builds, layer-record reads). Both are dominated by
per-entry fixed costs the linear model over-counted; wasmoon's `lua_State` construction is cheap and
memoised behind one module.

**4. Four cards on screen, not eight to twelve.** The research projected 8-12 at both catalog sizes
on the argument that the count is **viewport-bound rather than catalog-bound**. That argument is
right and it is the important half. The number is not: at 1280x720 with the four-column cap, one row
fits, and one row is four cards. The repository already held the same reading and nobody had put the
two together — `docs/TESTING.md`'s browse section records *"Observed at 1280x720 with 4 of 16 cards
on screen and 4 engines built"* from the Phase 5.1 gate. **Two independent readings of "4 on screen",
taken at sixteen entries and at thirty-six, are the evidence that the catalog changes only the
mounted count.**

### The WASM zero-growth claim, confirmed

Both `.wasm` assets are byte-for-byte the sizes recorded at sixteen entries — `glue.Dlydm7r2.wasm` at
**271,581** and `lua_fmt_bg.D_18ElAm.wasm` at **628,148** — and the glue hash is the same one
`docs/TESTING.md` recorded on 2026-09-04. `luaReady()` memoises the `LuaFactory` and wasmoon memoises
the module inside it, so twenty more Lua entries add exactly **0 bytes** of WebAssembly download.
`e2e/catalog.e2e.ts` proves the stronger half separately: a cold catalog load fetches neither.

### The browse page, measured in a real browser

Chromium, production build, through the real Worker, at 1280x720:

```
mounted: 36        onScreen: 4        within 200px rootMargin: 4
first-paint 584ms  first-contentful-paint 584ms
domContentLoaded 582ms   loadEventEnd 731ms
document transfer 8,330 B (61,673 B uncompressed)   resources 30
```

---

## The exact sweep arithmetic, over twenty-seven entries

`combos = Σ(knob arities) + 2`, the two corners being the `+2` the separability identity licenses.
Printed by a throwaway harness run from the repository root and deleted before every commit.

| Entry      | Knobs | Arities        | Σ   | Combos |
| ---------- | ----- | -------------- | --- | ------ |
| `euclid`   | 6     | 6,6,5,5,7,16   | 45  | **47** |
| `chorus`   | 6     | 8,6,5,5,4,16   | 44  | **46** |
| `arc`      | 5     | 5,3,5,5,16     | 34  | **36** |
| `ghost`    | 5     | 5,5,5,4,16     | 35  | **37** |
| `lattice`  | 6     | 6,6,4,5,4,16   | 41  | **43** |
| `morph`    | 5     | 5,4,5,4,16     | 34  | **36** |
| `sonar`    | 5     | 5,5,5,5,16     | 36  | **38** |
| `hold`     | 5     | 4,4,4,4,4      | 20  | **22** |
| `steps`    | 6     | 5,4,4,4,4,4    | 25  | **27** |
| `slam`     | 5     | 4,4,4,4,4      | 20  | **22** |
| `keys`     | 5     | 4,4,4,4,4      | 20  | **22** |
| `gridlock` | 5     | 4,4,4,4,4      | 20  | **22** |
| `table`    | 4     | 4,4,4,4        | 16  | **18** |
| `console`  | 5     | 4,4,4,4,4      | 20  | **22** |
| `strip`    | 5     | 4,4,4,4,4      | 20  | **22** |
| `learn`    | 5     | 4,4,4,4,4      | 20  | **22** |
| `lumen`    | 4     | 4,4,3,4        | 15  | **17** |
| `stage`    | 4     | 4,4,4,4        | 16  | **18** |
| `shuttle`  | 6     | 4,4,4,4,4,4    | 24  | **26** |
| `cull`     | 4     | 3,4,4,4        | 15  | **17** |
| `forge`    | 5     | 4,4,4,4,4      | 20  | **22** |
| `switch`   | 4     | 4,4,4,4        | 16  | **18** |
| `snake`    | 5     | 4,4,4,4,4      | 20  | **22** |
| `etch`     | 4     | 4,4,4,4        | 16  | **18** |
| `life`     | 5     | 4,4,4,4,4      | 20  | **22** |
| `quadrant` | 4     | 4,3,4,4        | 15  | **17** |
| `pomodoro` | 5     | 4,4,4,4,4      | 20  | **22** |
| **Total**  |       |                |     | **701** over 27 entries, **1,402 measured events** |

**283 over seven, 701 over twenty-seven.** The twenty added 418 between them, **20.9 each** against
the seven originals' **40.4** — because none of the twenty carries a sixteen-value channel knob.

The sweep spec's own wall time, run alone under `--project sweep`, twice: **4.54 s and 4.37 s**
reported duration, of which **3.89 s and 3.74 s** is test time; 7.62 s and 7.17 s including `npx`
startup.

---

## The phase's reconciled arithmetic

| Suite     | Phase 9                  | Where the delta came from                                                                                                                        |
| --------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **quick** | **73 → 74 files (+1)**   | `host-surface.spec.ts` arrived (09-01, +1); `lua-entries.spec.ts` left for the sweep project (09-01, −1); `catalog/copy.spec.ts` arrived (09-02, +1) |
| **quick** | **776 → 780 tests (+4)** | `host-surface.spec.ts` **+4**, `lua-host.spec.ts` **+1**, `copy.spec.ts` **+5**, `lua-entries` moved out **−6**. Net **+4**                          |
| **sweep** | **`3 13` → `4 19`**      | one file in, with its six tests, in 09-01. Nothing else joined or left                                                                              |
| **e2e**   | **89 → 89, unchanged**   | no e2e title was added anywhere in the phase; the browse suites count `LISTING.length` and `catalog.e2e.ts` reads its entry count from `frames.json` |

**The two arithmetics meet, and saying so is half the value of the paragraph.** `BASE_FILES` and
`BASE_TESTS` are frozen at the clean tree; `PREV_FILES` and `PREV_TESTS` are the rolling pair every
wave asserted "I moved nothing" against. The chain:

```
09-01 left BASE_TESTS − 1 = 775   (+4 host-surface, +1 lua-host, −6 lua-entries out)
09-02 added 5              = 780  (catalog/copy.spec.ts)
09-03 … 09-09: PREV_TESTS + 0, seven times over

776 − 1 + 5 + 0×7 = 780 = BASE_TESTS + 4      ← the number this gate observed
```

A reader who does not notice that `BASE_*` and `PREV_*` are different names will read
`BASE_TESTS + 5` in 09-02's SUMMARY and `BASE_TESTS + 4` here and conclude one of them is wrong. They
are both right: 09-02's five is measured against the 775 that 09-01 left, not the 776 Phase 7 closed
on. **No number was adjusted to fit.**

Twenty configurations landed across seven waves and every one of those seven asserted
`PREV_FILES + 0` / `PREV_TESTS + 0` through `scripts/check-counts.mjs`. **Not one of the phase's five
count-moving changes is a configuration.**

---

## The three requirement qualifiers

| Requirement | Qualifier |
| --- | --- |
| **CONT-02** | Twenty configurations authored, thirty-six in the catalog, every one fitting both 908-character budgets at its defaults and at every corner of its own knob cross-product, proved by the separability identity rather than by enumeration. All twenty-seven hand-authored entries run in a real Lua 5.4 VM through the scripted gesture without error. **Every call site is checked against the registered host surface** — the D-07 gate, which is new in this phase. **Hardware: thirty-two audition rows are the user's and are unanswered.** |
| **CONT-03** | Every entry's name, one-line description, four feel tags, Featured flag and arrival date are declared in the entry file and restated in `LISTING`, gated field by field in both directions, with the copy counted by `copy.spec.ts` rather than read. |
| **TUNE-01** | Every hand-authored entry carries three to six knobs over the vendored `KnobKind` vocabulary, each with an index default, each token live in at least one event and none a prefix of another, and the whole cross-product measured. **No new entry ships a sixteen-value channel knob**, which is what kept the sweep affordable at twenty-seven entries. |

**Nothing about the twenty configurations is claimed as hardware-verified.** No agent in this phase
opened a serial port, wrote to a device, or deployed; every green result above is a statement about a
simulator, a compiler, a browser and a static build, and about nothing that has ever been plugged in.

---

## `AUDITION_DUMP=1`, all twenty-seven lines

```
AUDITION_DUMP -> C:\Users\sabot\Documents\Claude\hangar\.tmp-audition\
  euclid: setup 702/908, timer 218/908
  chorus: setup 729/908, timer 173/908
  arc: setup 379/908, timer 251/908
  ghost: setup 305/908, timer 333/908
  lattice: setup 615/908, timer 171/908
  morph: setup 507/908, no Timer
  sonar: setup 432/908, timer 279/908
  hold: setup 696/908, timer 102/908
  steps: setup 388/908, timer 251/908
  slam: setup 659/908, no Timer
  keys: setup 644/908, no Timer
  gridlock: setup 425/908, no Timer
  table: setup 529/908, no Timer
  console: setup 785/908, no Timer
  strip: setup 638/908, no Timer
  learn: setup 657/908, no Timer
  lumen: setup 604/908, no Timer
  stage: setup 505/908, timer 109/908
  shuttle: setup 663/908, timer 201/908
  cull: setup 564/908, no Timer
  forge: setup 716/908, timer 373/908
  switch: setup 487/908, no Timer
  snake: setup 581/908, timer 870/908
  etch: setup 535/908, no Timer
  life: setup 435/908, timer 674/908
  quadrant: setup 835/908, no Timer
  pomodoro: setup 733/908, timer 647/908
```

**Twenty-seven `.setup.lua` files and fourteen `.timer.lua` files**, counted on disk, which is what
the document says. **Every printed count matches the cost table character for character** — checked
row by row, not sampled. The directory was removed by hand afterwards. The heading's "twenty-seven"
was checked against `CATALOG.filter(e => e.source.kind === "lua").length`, which is **27**, and the
table's row count, counted by script, which is also **27**.

---

## The six rows where a green test is not evidence

Now a section of `docs/HARDWARE-AUDITION.md` in its own right, above the checklist, split into two
families because they fail in two different ways.

| Row | Config       | Family        | Why a green test is not evidence                                                                                    |
| --- | ------------ | ------------- | --------------------------------------------------------------------------------------------------------------------- |
| 13  | **HOLD**     | latch-and-time | firmware advances `prev_*` before the writability check; `pad-sim.ts` states it **cannot manufacture** the stuck contact |
| 19  | **CONSOLE**  | latch-and-time | the mute latch, the same bug                                                                                           |
| 23  | **STAGE**    | keystroke      | `gks` is recorded into `hidLog` and `lua-host.ts:429` says nothing in HANGAR consumes it                                |
| 24  | **SHUTTLE**  | keystroke      | the same HID invisibility, plus the 256-byte per-cycle protocol buffer at the top scrub speed                           |
| 26  | **FORGE**    | latch-and-time | the held-corner bank, the same bug, plus a watchdog nobody has watched fire                                            |
| 32  | **POMODORO** | latch-and-time | the 655-second `glt` ceiling and a Timer that drifts under load over 1,500 fires                                        |

**The difference between the families is what a failure means.** A latch that sticks is a *firmware*
behaviour the configuration has to survive; a keystroke that arrives as the wrong key is a *number in
an entry file*. The first is a note in the results; the second is a one-line fix. Five configurations
in this catalog send keystrokes (STAGE, SHUTTLE, CULL, FORGE, SWITCH) and every usage id in all five
was checked by hand against the USB HID Usage Tables Keyboard/Keypad page 0x07 and by nothing else.

The document's "What to record" section now asks rows 13, 19 and 26 for a **count** of fast flicks
rather than a verdict, and rows 23 and 24 for the keys that actually arrived.

---

## The document's other three claims, confirmed rather than rewritten

- **The dark-at-rest note already names GHOST, MORPH and ETCH**, each with its own half-sentence, and
  the derived set is `Trackpad, GHOST, MORPH, ETCH` — Trackpad being a shelf preset and outside this
  document's scope. No edit needed.
- **The Setup-only note lists thirteen names** and the data holds exactly thirteen `lua` entries with
  `timer: ""`: MORPH, SLAM, KEYS, GRIDLOCK, TABLE, CONSOLE, STRIP, LEARN, LUMEN, CULL, SWITCH, ETCH,
  QUADRANT. Fourteen have a Timer. Both counts derived by script. The `gtt` reason and the
  `/MORPH[^.]{0,200}Setup only/` match survive untouched.
- **The premise is present tense.** No sentence reads as though HANGAR cannot install; plan 07-13's
  correction stands.

---

## The two floors, and the negative check

`src/lib/og/build.spec.ts:220` and `e2e/artifacts.e2e.ts` both moved from `>= 16` to `>= 36`, each
with a comment saying it is a **human-chosen non-vacuity floor, not a count**, and that comparing
against `ROUTED.length` would be a tautology. Neither file's test count moved: `og/build.spec.ts`
reports 5, `artifacts.e2e.ts` contributes the same titles it always did.

**The negative check, observed:**

```
expect(wanted.length).toBeGreaterThanOrEqual(37);

 FAIL  |server| src/lib/og/build.spec.ts > the OG images and the heads that point at them (SHARE-04)
        > holds exactly one image per routed configuration
 AssertionError: expected 36 to be greater than or equal to 37
 ❯ src/lib/og/build.spec.ts:220:27
 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
 exit code 1
```

Restored to 36 from a copy taken before the edit: **5 passed, exit code 0**. The floor is still a
floor, and the message names the observed count.

---

## `05.1-UI-SPEC.md` — the seven quoted facts, before and after

Every one re-recorded from `LISTING` by the same throwaway script in one pass. **The derived row at
thirty-six entries:**

```
entries 36   distinct tags 55   singletons 27   chips 28
readable (11) · playable (10) · utility (8) · gestural (6) · expressive (5) · generative (5)
· grid (5) · hypnotic (5) · drums (4) · hotkeys (4) · precise (4) · still (4) · xy-control (4)
· ambient (3) · colour (3) · hands-free (3) · accessible (2) · blooming (2) · calm (2) · game (2)
· harmonic (2) · latching (2) · macros (2) · mixing (2) · modulation (2) · rails (2)
· rippling (2) · sequencer (2)
chipCounts: [11,10,8,6,5,5,5,5,4,4,4,4,4,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2]
```

**1. The chip row itself (`:441-447`) — CONFIRMED UNCHANGED.**

- Before: `readable (11) · playable (10) · utility (8) · gestural (6) · …` — twenty-eight chips
- After: **byte-identical.** The document's quoted row equals `chipTags(LISTING)` and its counts at
  thirty-six, name for name and number for number. 09-09 recorded it correctly and this plan
  confirmed it by script rather than by trusting seven SUMMARYs.

**2. `:449`, the provenance sentence — reworded, not renumbered.**

- Before: *"…every entry wave of Phase 9 re-took it, and 09-10 confirms this one rather than moving
  it). Today that is twenty-eight:"*
- After: *"…every entry wave of Phase 9 re-took it, and **09-10 confirmed this one by script at the
  phase gate rather than moving it** — `chipTags(LISTING)` over the thirty-six shipped entries returns
  exactly the twenty-eight names and counts below). Today that is twenty-eight:"*

**3. `:432` (the plan's `:427`) — STALE, corrected.**

- Before: *"…41 distinct tags across 16 configurations, 32 of them on exactly one…"*
- After: *"…**55 distinct tags across 36 configurations, 27 of them on exactly one** (it was 41 across
  16 with 32 singletons when Phase 5.1 wrote this; re-recorded at thirty-six by 09-10)…"*

**4. `:458` (the plan's `:444`) — already correct, CONFIRMED.**

- Before and after: *"The remaining **27** single-configuration tags sit behind `MORE TAGS`"*. 09-09
  moved it from 32 to 27 and 27 is what the script derives. Untouched.

**5. `:460` (the plan's `:450`) — already correct, CONFIRMED.**

- Before and after: *"…and **fifty-five** 44px chips above **thirty-six** live pads is a wall."*
  55 tags and 36 entries, both derived. Untouched.

**6. The sixteen-row tag table at `:456` — LEFT AT SIXTEEN, DELIBERATELY, and the document says so.**

- The sentence above it reads: *"The table below is Phase 5.1's snapshot of the first sixteen
  configurations and is deliberately left at sixteen; the live census is
  `src/lib/browse/filter.spec.ts`'s `RECORDED` block, which is what the row above is re-taken from."*
  Confirmed against the derived thirty-six-row census, which is in `filter.spec.ts` and in this
  SUMMARY. **A snapshot that says it is a snapshot is not stale**, and rewriting it would delete the
  one place the document shows what the vocabulary looked like at sixteen.

**7. `:298` (the plan's `:293`), the ASCII mock's count line — already correct, CONFIRMED.**

- Before and after: `36 of 36 configurations.` 09-09 moved it from `34 of 34` and the derived count
  is 36. The mock's tag block was also re-taken by 09-09 and matches the derived row's first
  twenty-eight names in order. Untouched.

### Five more quoted facts in the same document, found stale in the same pass

The plan's argument — *"leaving five true sentences beside one corrected one is worse than leaving
the section alone"* — applies to the whole document, so the pass did not stop at the seven.
**[Rule 1 — bug]**, all five:

| Where  | Before                                                                     | After                                                                                |
| ------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `:691` | *"Today that is **Trackpad, GHOST and MORPH**."*                            | *"Today that is **Trackpad, GHOST, MORPH and ETCH**"* + the provenance                |
| `:696` | *"One string serves all **three** … true of all **three**"*                 | *"One string serves all **four** … true of all **four**"*                             |
| `:518` | *"visible: `16 of 16 configurations.` · `4 of 16…` · `1 of 16…`"*           | *"`36 of 36 configurations.` · `4 of 36…` · `1 of 36…`"*                              |
| `:1029` | *"The result line reads `4 of 16 configurations.`"*                        | *"`4 of 36 configurations.`"*                                                         |
| `:1149` (W-16) | *"**All sixteen cards mount**…"*                                   | *"**Every card mounts**… thirty-six mounted canvases measured by 09-10 with four on screen at 1280x720"* |
| `:1151` (W-19) | *"the **32** singles… **forty-one** 44px chips above **sixteen** live pads"* | *"32 singles at sixteen entries, **27 at thirty-six**… **fifty-five** chips above **thirty-six** live pads"* |

Six rows for five facts, because the `restsBlack` note is two sentences. Nothing in the repository
goes red when any of these drifts: no spec reads a planning document. That is exactly why they were
checked by script.

---

## The deviations

### Auto-fixed issues

**1. [Rule 3 — blocking] `src/lib/og/build.spec.ts` timed out and turned the phase gate red**

- **Found during:** Task 9-10-01, running `npm run test:quick` after the documentation edits.
- **Issue:** `Test timed out in 5000ms` on *"paints real LEDs, not just the dot field and the
  frame"*, failing the quick run **twice**, at 0.37 GB and 0.47 GB of free memory. Run alone the file
  reported **4.27 s of test time against Vitest's 5,000 ms default per-test timeout**. The cause is
  linear growth the catalog created: the test classifies every pixel of every image in `static/og/`,
  which was 16 x 756,000 = 12.1 million pixels at sixteen entries and is **27.2 million** at
  thirty-six — and it built a `${r},${g},${b}` template string **once per pixel**, 27.2 million
  short-lived allocations per run.
- **Fix:** the three channels are compared numerically. Identical pixels, identical assertions,
  nothing sampled and nothing trimmed — which is the D-08 and D-10 rule for a spec that gets
  expensive. **4.27 s to 0.56 s of test time**, a 7.6x reduction, and the file's reported duration
  fell from 5.99 s to 1.38 s. Test count unmoved at 5.
- **Files modified:** `src/lib/og/build.spec.ts`.
- **Commit:** `aac1cc6`.

**2. [Rule 3 — blocking] `src/lib/catalog/lua-entries.sweep.spec.ts` test 6 timed out and turned
`npm run test:sweep` red**

- **Found during:** Task 9-10-01, running the plan's own verify block. Also reproduced twice under
  `npm run test:unit -- --run`.
- **Issue:** `Test timed out in 5000ms` at `lua-entries.sweep.spec.ts:388`, failing `test:sweep` at
  0.56 GB free. The test measures **701 knob combinations** and takes **3.89 s run alone** — about a
  second of headroom against Vitest's 5,000 ms default, and a loaded machine takes that second. **This
  is D-08's own file**: the move into the `sweep` project in 09-01 bought it a per-wave cadence and
  did not buy it a timeout, and the phase's own growth from 283 combinations to 701 consumed the
  margin.
- **Fix:** an explicit `600000` as the `it`'s second argument — **the exact idiom
  `src/lib/tune/reachability.sweep.spec.ts:254` already uses at its own long test**, which is why that
  75-second sweep has never had this problem. A sweep project's tests are long by definition; 5,000 ms
  is the right default for a unit test and the wrong one here. Six tests before, six after; 701
  combinations before, 701 after. The number that moved is a ceiling, not a budget.
- **Files modified:** `src/lib/catalog/lua-entries.sweep.spec.ts`.
- **Commit:** `aac1cc6`.

**3. [Rule 1 — bug] `src/lib/transport/queue.spec.ts` waited a fixed number of milliseconds where it
meant a condition**

- **Found during:** Task 9-10-01, `npm run test:quick`; also seen once under `test:unit`.
- **Issue:** `AssertionError: the bytes went out: expected [] to have a length of 1 but got +0` at
  `queue.spec.ts:115`, failing the quick run at 0.67 GB free. Three of its tests did
  `await sleep(5)` and then asserted that the queue had put a request's bytes on the transport.
  **5 ms of wall clock is not 5 ms of scheduled CPU** on a machine where two other specs are
  saturating the pool. The queue was never wrong.
- **Fix:** an `awaitWrite(transport, count)` helper that polls the condition behind a 2,000 ms
  deadline, used at all three sites. Its failure message says the write never happened and names how
  many it saw, so a genuinely broken queue still fails and fails legibly. **Eight tests before, eight
  after.** All three sites were changed rather than only the one observed failing, for the same
  reason the `05.1-UI-SPEC.md` pass did not stop at one sentence.
- **Files modified:** `src/lib/transport/queue.spec.ts`.
- **Commit:** `aac1cc6`.

**4. [Rule 1 — bug] Five more stale quoted catalog facts in `05.1-UI-SPEC.md`**

- **Found during:** Task 9-10-01 step 5, running the derived census against the whole document rather
  than against the seven sentences named.
- **Issue and fix:** the table above. `restsBlack` named three entries and the data holds four; the
  result-line copy examples and W-16 and W-19 all quoted a sixteen-entry catalog.
- **Files modified:** `.planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md`.
- **Commit:** `aac1cc6`.

**5. [Rule 2 — missing critical documentation] Four stale present-tense counts in `docs/TESTING.md`
outside the sections the plan named**

- **Found during:** Task 9-10-01 step 2, scanning the whole file for catalog-dependent numbers after
  dating the table 2026-09-07.
- **Issue:** a document re-measured whole and dated as such cannot carry *"all sixteen routed
  configurations are real files"*, *"Three of the sixteen images (tpad, ghost, morph)"*, *"the
  sixteen-canvas frame budget"* or *"the sixteen restated entries"* — a reader cannot tell which half
  was checked, which is the same failure mode step 5 exists to prevent.
- **Fix:** thirty-six routed configurations; four of the thirty-six images, with ETCH named and its
  arrival in 09-08 recorded; "the mounted-canvas frame budget" with the two independent 4-on-screen
  readings written out; the `listing.spec.ts` row carrying both its Phase 5.1 measurement and today's.
- **Files modified:** `docs/TESTING.md`.
- **Commit:** `aac1cc6`.

### Scope notes

- **The three test fixes are in files the plan did not list**, and two of them
  (`lua-entries.sweep.spec.ts`, `queue.spec.ts`) are outside the plan's subject entirely. They are
  here under Rule 3: each one turned a phase-gate command red, and the gate cannot be reported green
  without them. **None of the three is a change to what is covered** — the counts are 5, 6 and 8
  before and after — and none of them touches shipped code.
- **Nothing under `src/vendor/` was read for editing or edited**, and
  `git diff --stat HEAD -- src/vendor/` prints nothing. `src/lib/tune/` was not touched.
- **The throwaway harness** used to derive the sweep arithmetic, the tag census, the motion census
  and the Setup-only list was one temporary `*.sweep.spec.ts` under `src/lib/catalog/`, deleted before
  every commit. The browse measurement was one temporary `e2e/*.e2e.ts`, deleted immediately after its
  single run. Neither is in the repository and `git status --short` prints nothing as this plan leaves
  it.
- **No process was killed to make a test pass.** The machine's free memory moved between 0.28 GB and
  1.92 GB across the session under the user's own applications; every reading in this SUMMARY says
  which.

---

## Every deferred item this phase recorded

| #   | Title                                                                                       | Recorded by |
| --- | ------------------------------------------------------------------------------------------- | ----------- |
| 1   | Mackie Control is not attempted, and cannot be until inbound MIDI is proven                  | 09-05       |
| 2   | Keystroke configurations animate correctly and prove nothing about their output              | 09-06       |
| 3   | Nothing in the repository checks that a per-cell picture is distinguishable from itself      | 09-07       |
| 4   | Determinism is proved per entry by hand, not by a gate                                       | 09-08       |
| 5   | The tune panel has no widget for a multi-colour palette                                      | 09-09       |
| 6   | `kind: "state"` was preferred and used zero times                                            | **09-10**   |
| 7   | `planLayers`'s exclusions do not bind a hand-authored entry                                  | **09-10**   |
| 8   | A spec's cost grows with the catalog and no gate notices until it fails                      | **09-10**   |

Item 4 is numbered 4 rather than 3 because 09-08's plan was written before 09-07 landed its own third
item; the file is appended to, never overwritten, and that renumbering is recorded inside item 4.

**Item 6 carries both halves the plan asked for.** No slate entry's identity survives translation
into the six `look.kind`s and six `sends.kind`s — `sends.grid` has no 2x2 for QUADRANT, nothing in
`PadState` counts for POMODORO, and `showGrid` paints one `gridColour` — **and** a `state` entry
carries no knobs and no shareable stamp, because `compilerKnobs`
(`src/lib/share/stamp.ts:115-119`) returns an empty list for any source kind that is not `preset`
and says so in its own comment. Closing it pulls `state` entries into
`reachability.sweep.spec.ts`'s `racked()` set and a 75-second sweep, so it is a phase, not a patch.

**Item 7 records that D-09 cited a rule that does not apply on this route.** `planLayers` is a
compiler function over a `PadState` (`src/vendor/botor/_pad.ts:901`, called from `pad-sim.ts:357`); a
`lua` entry owns layers 1 and 2 directly and it never runs. What binds is the 49.6 % single-layer cap
and two free layers rather than three.

---

## The phase gate

Against a fresh production build at `9b95573`, in this order.

| Command                                | Expected                                | Observed                                                   |
| -------------------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| `npm run check`                         | 0 errors, 0 warnings                    | **567 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS**    |
| `npm run lint`                          | exit 0                                  | **exit 0**, prettier and eslint both clean                  |
| `npm run build`                         | exit 0, 36 images, 36 pages             | **exit 0, 12.6 s; 36 in `static/og/`, 36 in `build/og/`, 36 in `build/c/`** |
| `npm run test:quick \| check-counts 74 780` | `BASE_FILES + 1` / `BASE_TESTS + 4` | **74 files, 780 passed + 1 todo — matches**                 |
| `npm run test:sweep \| check-counts 4 19`   | `4 19`                              | **4 files, 19 passed — matches**                            |
| `npm run test:e2e -- --workers 3`       | `BASE_E2E` 89, unchanged                | **89 passed (1.9 m), both projects — `BASE_E2E + 0`**       |
| `git diff --stat HEAD -- src/vendor/`   | nothing                                 | **prints nothing**                                          |
| `vendored-diff.spec.ts`                 | 14 passed                               | **14 passed**                                               |
| `lua-parity.spec.ts`                    | 5 passed, pinned to the nine presets    | **5 passed**                                                |
| `preset-baseline.spec.ts`               | green                                   | **19 passed**                                               |
| `protocol-pin.spec.ts`                  | green                                   | **5 passed**                                                |
| the four together                       | one run                                 | **4 files, 43 passed**                                      |
| `audition.spec.ts`                      | 4 passed, `ROW_COUNT` 32                | **4 passed**; 32 numbered rows counted on disk by script     |
| `npm run test:unit -- --run`            | quick + sweep                           | **78 files, 799 passed + 1 todo** = 74 + 4 and 780 + 19     |

`test-results/` was removed by hand after every e2e run. `.tmp-audition/` was removed by hand after
the dump. Port 4173 has no listener after the run; only `TIME_WAIT` sockets remain and no `wrangler`
or `workerd` process survives.

### The e2e run took four attempts, and the reason is recorded rather than glossed

The gate's e2e run was red three times before it was green, and the honest account matters because
"green on the fourth attempt" is exactly what a flaky suite looks like from outside:

| Attempt | Free memory at start | Result                                    |
| ------- | -------------------- | ----------------------------------------- |
| 1       | ~0.5 GB              | **2 failed, 87 passed** (2.7 m)           |
| 2       | 0.35 GB              | **32 failed, 57 passed** (2.1 m)          |
| 3       | ~0.4 GB              | **27 failed, 62 passed** (2.1 m)          |
| 4       | **1.23 GB**          | **89 passed** (1.9 m), exit 0             |

**Every failing title in attempts 2 and 3 is on the tune-panel or install path**, which is the one
part of the site that fetches and instantiates the 628 KB WASM Lua formatter; the failure messages
are *"the setup meter settled on a number"* and `element(s) not found`, which is a meter that never
settles because the compile never finishes. The machine was running the user's own Blender, Adobe
Premiere and Chrome throughout and sat between 0.28 GB and 0.5 GB free.

**Two things rule out a regression rather than merely making one unlikely.** First,
`git diff --stat aac1cc6 -- src/lib/ui/ src/routes/ src/lib/tune/ src/lib/sim/` **prints nothing** —
not one byte of shipped code changed after the last green run; every change since is a spec file, a
markdown file or a comment. Second, the same suite ran **89 passed** earlier in this same session, on
this same tree, at 113.7 s. No process was killed to obtain the green run: the fourth attempt waited
for the user's own applications to release memory and then ran unmodified at `--workers 3`.

This is the third face of the same finding the three fixed tests are the first two of, and it is why
deferred item 8 is about the *shape* of the problem rather than about three files.

---

## The checkpoint

**Task 9-10-03 is a `checkpoint:human-verify` and this plan is `autonomous: false`.**

The checklist was **presented to the user verbatim and is unanswered.** No part of it was run, no
serial port was opened, no write was performed, no deployment was made, and no agent in this phase
has touched a ZONA. `docs/HARDWARE-AUDITION.md`'s `## Results` section still reads *"None yet. This
audition has not been run."*

The three things the checkpoint required confirming before presentation, each confirmed:

1. Task 2's gate is green — the table above.
2. `docs/HARDWARE-AUDITION.md` is on disk with thirty-two numbered rows, contiguous from 1, and
   `audition.spec.ts` reports 4 passed with `ROW_COUNT` 32.
3. `AUDITION_DUMP=1` writes the twenty-seven pasteable Setup files and fourteen Timer files, printed
   above.

**The phase closes with every automatable half green against a production build and the hardware half
marked as awaiting the user, in those words.**

---

## Commits

| Commit    | What                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------- |
| `aac1cc6` | `docs(09-10): the cost of thirty-six measured, two floors raised, three load-sensitive tests fixed` |
| `9b95573` | `docs(09-10): the audition reads as one document, and every deferred item this phase found`         |

## Self-Check: PASSED

Every file named above is on disk: `docs/TESTING.md`, `docs/HARDWARE-AUDITION.md`,
`docs/PIN-POLICY.md`, `src/lib/og/build.spec.ts`, `e2e/artifacts.e2e.ts`,
`src/lib/ui/BrowseGrid.svelte`, `src/lib/catalog/lua-entries.sweep.spec.ts`,
`src/lib/transport/queue.spec.ts`, `.planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md`,
`.planning/phases/09-twenty-configurations/deferred-items.md` and this SUMMARY. Both commit hashes
resolve in `git log`. Both floors read `toBeGreaterThanOrEqual(36)` — `og/build.spec.ts:220` and
`artifacts.e2e.ts:73` — and `docs/HARDWARE-AUDITION.md`'s checklist holds thirty-two numbered rows,
counted by script.

Every character count, byte size, wall time, combination total, chip count, tick reading, pixel
count, memory reading and failure message quoted above was read from a runner's, a script's or a
build's own output in this session. Nothing was carried from an earlier SUMMARY without being
re-observed, and the four rows where the research and the measurement disagree by more than ten per
cent are stated as disagreements rather than smoothed.
