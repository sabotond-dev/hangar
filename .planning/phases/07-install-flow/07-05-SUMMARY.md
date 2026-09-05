---
phase: 07-install-flow
plan: 05
subsystem: tune, ui, device
tags: [onconfig, ConfigStrings, land, D-10, D-17, wire-pin, TuningRegion, Coverflow, TryOnDevice, SAFE-02, SAFE-07]

# Dependency graph
requires:
  - ".planning/phases/07-install-flow/07-04-SUMMARY.md - the five-name block (BASE_FILES 69, BASE_TESTS 724, BASE_SWEEP `3 13`, BASE_E2E 77 frozen, PREV_E2E 77), the tree at quick 71 / 748, sweep `3 13`, svelte-check 537"
  - "07-CONTEXT.md D-10 (what is written is byte for byte what the meters measured), D-17 (the onconfig emit inside land(), undefined on every stale)"
  - "07-RESEARCH.md Pattern 5 (the strings channel from the tuner), Pitfall 5 (the debounce lands a new compile between the click and the write), The measurement that pins D-10 (the nine-preset table this plan re-derives)"
  - "src/lib/tune/model.ts (05-xx) - buildTuner, land(), moveTo, overView().apply, measurePadsim, measureLuaRoute; model.spec.ts's recorder and fake-timers discipline"
  - "src/lib/transport/sequence.ts (07-02) - writeBoth and EventStrings, the shape onconfig's pair feeds; src/lib/transport/fake.ts - FakeTransport.writes; fixtures/synthetic.ts - zonaResponder"
  - "src/lib/catalog/lua-entries.spec.ts test 1 (Phase 8) - the fixed-point property wire-pin test 2 cites rather than re-sweeps"
provides:
  - "ConfigStrings ({ readonly setup; readonly timer }) exported from src/lib/tune/model.ts, with the D-10 rule in its comment"
  - "TunerOptions.onconfig?(config: ConfigStrings | undefined): optional, emitted from inside land() with the pair the numbers were measured from, and undefined beside BOTH feed = \"stale\" assignments (moveTo, overView().apply)"
  - "land(setup, timer, config): the pair is a parameter, so no path can publish numbers without the bytes behind them and no stale emit can republish an old pair"
  - "TuningRegion.svelte onconfig prop (structural type) passed straight into buildTuner; Coverflow.svelte configStrings ($state) reset with overBudgetReason on a step and handed to TryOnDevice as config; TryOnDevice.svelte config?: { setup; timer } declared in its props type, unbound, read by nothing until 07-10"
  - "src/lib/device/wire-pin.spec.ts 4: D-10 and D-17 as four gates across every catalog entry, in node, against FakeTransport only; the nine-preset table re-derived with presets 9 / mismatches 0; stringsOrRefuse, the store's decision shape"
  - "model.spec.ts 8 -> 10 (the pair with every landing and undefined on the same tick as a knob move; TURN IT DOWN's back-off publishes undefined then the resolved pair)"
affects:
  - "07-06 (install.svelte.ts) consumes ConfigStrings | undefined as its config input and treats undefined as not-ready-to-write; stringsOrRefuse in wire-pin.spec.ts is the shape"
  - "07-10 (TRY ON DEVICE writes) binds TryOnDevice's config prop, removes the svelte/no-unused-props directive above its destructure, and hands the pair to the install store verbatim"
  - ".planning/phases/07-install-flow/deferred-items.md - item 6 appended; .planning/STATE.md, .planning/ROADMAP.md - Phase 7 at 5/13"

tech-stack:
  added: []
  patterns:
    - "A derived payload is published from the ONE function that lands the measurement it was derived from, as a parameter of that function rather than a variable the general emit could read - so the payload cannot be published stale, and cannot be published without the numbers that vouch for it"
    - "A debounce's stale window is made a structural property by publishing undefined on the same tick the feed goes stale: the consumer's not-ready state is then set BEFORE the trailing timer can land, and the race between a click and a recompile has no branch to lose"
    - "A pin between two derivations is stated against BOTH: the independent recomputation (which holds whatever the publisher does) and the publisher's own figure (which is the one a reserve moves) - a negative check that leaves the pin green tells you which half is missing"
    - "A prop a later plan will read is declared in the props type and NOT bound, with the one rule that still fires silenced by name above the destructure and its reason - bound and unread is a lint error, and inventing a read to satisfy the linter would ship behaviour the plan did not ask for"

key-files:
  created:
    - "src/lib/device/wire-pin.spec.ts"
    - ".planning/phases/07-install-flow/07-05-SUMMARY.md"
  modified:
    - "src/lib/tune/model.ts"
    - "src/lib/tune/model.spec.ts"
    - "src/lib/ui/TuningRegion.svelte"
    - "src/lib/ui/Coverflow.svelte"
    - "src/lib/ui/TryOnDevice.svelte"
    - ".planning/phases/07-install-flow/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "onconfig(undefined) in moveTo is UNCONDITIONAL, placed as the statement after the (conditional) `feed = \"stale\"`: while the feed is still \"measuring\" nothing has been published and undefined is already the truth, so the count of withdrawals equals the count of stale assignments (2 / 2) without a branch to keep in step"
  - "The pair travels as a PARAMETER of land(), not a closure variable emit() reads - the negative check that moved the emit into emit() published undefined from the first view and an old pair from every stale view, which is exactly the two failure shapes D-17 exists to forbid"
  - "model.spec.ts test 10 reaches the back-off through DIAL at ladder.spec.ts's 300 reserve, not tpad as the plan's action text said: ladder.spec.ts's header measured that tpad is blocked on `sends` and offers no step at any reserve, so its apply() returns at `if (!step) return` and would publish nothing - the plan's own gate could not have been reached with its own fixture (Rule 1)"
  - "wire-pin test 1 pins the lengths against costOf() AND against the meter the tuner published at the landing (the view land() emits before the pair). The plan's negative check (reserved 1 / 0 in test 1) stayed GREEN against the independent costOf alone, because a reserve moves the tuner's meter and never the strings; the meter half is what D-10's sentence is about and what the reserve check is red on (expected 250 to be 251)"
  - "wire-pin tests 1 to 3 await the first defined onconfig through a promise on the real clock rather than model.spec.ts's 64-hop settle(): the Lua route crosses a real asynchronous boundary (a dynamic import and a VM being built) that a fixed hop count cannot be trusted to cover for seven entries; test 4, a debounce question on aurora, uses settle() exactly as model.spec.ts does"
  - "TryOnDevice declares `config` in its props type and does not bind it; `svelte/no-unused-props` is silenced by name above the destructure with its reason (the form Coverflow.svelte carries for its two Sets). Bound, `@typescript-eslint/no-unused-vars` fires; unbound, the Svelte rule fires; a read was not the plan's to invent (Rule 3)"

requirements-completed: []
requirements-contributed: [SAFE-02, SAFE-07]

# Metrics
duration: 19min
completed: 2026-09-05
---

# Phase 7 Plan 05: The strings channel from the tuner, and the pin that says the bytes are the numbers Summary

**The tuner now publishes the exact Setup and Timer it measured, from inside `land()`, beside the numbers - and withdraws them (`undefined`) on the same tick a knob moves or TURN IT DOWN backs off, so the 120 ms in which the meters show the previous numbers is also 120 ms in which there is nothing to write (D-17, Pitfall 5 made structural). The pair reaches `TryOnDevice` as `config` through `TuningRegion`'s one new prop and `Coverflow`'s `configStrings`, as a structural `{ setup; timer }` type in all three files, so no `src/lib/ui/` component names `$lib/tune/model` and the `from` specifier lists are unchanged at 9 / 19 / 7. `wire-pin.spec.ts` holds D-10 across every catalog entry: for all nine compiler-driven entries the published strings are the compiled text and their lengths equal both `costOf()`'s `used` and the meter the tuner showed (presets 9, mismatches 0, every compressed Setup exactly one character shorter); for all seven Lua entries the pair is `renderLua`'s text and its own `measureLua`; aurora's pair goes through `writeBoth` onto a `FakeTransport` verbatim with `compressScript` strictly shorter than what was written; and `undefined` builds no request. `model.spec.ts` 8 -> 10, four negative checks red and restored byte-identical (one of them rewrote a test to make it red, see Deviations). Quick 71 / 748 -> 72 / 754, sweep `3 13`, svelte-check 538 / 0. No device was connected to, looked for or written to.**

## The five-name carry-forward block

Carried verbatim from 07-04, which carried it from 07-01's measurement on the clean tree Phase 6 closed at `145f85d`. Nothing in it is re-derived here.

| Name         | Value                      | Note                                                                                                                            |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **69**                     | This plan adds **1** spec file (`wire-pin.spec.ts`). Tree: **72** (+ 3)                                                          |
| `BASE_TESTS` | **724** (+ 1 todo = 725)   | 07-01 + 2, 07-02 + 5, 07-03 + 13, 07-04 + 4 (748); this plan adds **6** (model.spec.ts 8 -> 10, wire-pin.spec.ts 4). Tree: **754** (+ 30) |
| `BASE_SWEEP` | **`3 13`**                 | Unchanged; observed `3 13` again                                                                                                |
| `BASE_E2E`   | **77 (measured by 07-01)** | **Frozen.** 07-13 asserts `BASE_E2E + 12` = **89**. Not run by this plan (no route, no build; the plan does not ask for it)         |
| `PREV_E2E`   | **77 (measured by 07-01)** | Unchanged; rolls at 07-08, 07-12 and 07-13                                                                                      |

`BASE_CHECK` (provenance only): **538 files, 0 errors, 0 warnings** after Task 3 (537 after Tasks 1 and 2; the new spec is the one added file).

### Observed totals: previous SUMMARY plus this plan's delta

07-04 left the tree at **71 / 748**; re-measured here **before the first edit** at `723db2b` and equal. This plan's delta is **+1 file / +6 tests**.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 71 748     # before any edit, at 723db2b
  check-counts: observed 71 files, 748 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:quick 2>&1 | node scripts/check-counts.mjs 72 754     # after 060b486
  check-counts: observed 72 files, 754 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run check 2>&1 | grep -Ei "error|warning"
  1788609443869 COMPLETED 538 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (eslint silent; exit 0)
```

`format-parity.spec.ts` did not flake; nothing was re-run.

### Per-file counts after this plan

| File                                 | Before | After  | Plan said |
| ------------------------------------ | ------ | ------ | --------- |
| `src/lib/tune/model.spec.ts`         | 8      | **10** | 10        |
| `src/lib/device/wire-pin.spec.ts`    | -      | **4**  | 4         |
| `src/lib/ui/tune-ui.spec.ts`         | 5      | **5**  | 5 (unedited) |
| `src/lib/config-shape.spec.ts`       | 14     | **14** | 14 (unedited) |
| `src/lib/device/` (all six specs)    | 47     | **51** | -         |

## Task 1 - onconfig: the emit inside land(), undefined on every knob move (commit `7a072e8`)

`src/lib/tune/model.ts`: `ConfigStrings` exported with the D-10 rule in its comment (why the uncompressed string is the meter, and why nothing compresses at install time); `TunerOptions.onconfig?` optional; `land(setup, timer, config)` sets the numbers, marks the feed settled, emits the view and then the pair - the pair is a **parameter**, so a landing cannot publish numbers without the strings and `emit()` has nothing to republish. `measurePadsim` splits `compileState` from `costOf` so the published `result.setupLua` / `result.timerLua` are the same `CompileResult` that was costed; `measureLuaRoute` publishes `renderLua`'s exact text. The withdrawal, `options.onconfig?.(undefined)`, sits as the next statement after both `feed = "stale"` assignments, with the Pitfall 5 reason written beside `moveTo`'s.

**The counts the plan asked for:** `feed = "stale"` assignments **2** (`moveTo`, `overView().apply`); `onconfig?.(undefined)` calls **2**. The four `onconfig` occurrences in the file are the option's declaration, the emit in `land()` and the two withdrawals.

`moveTo`'s withdrawal is unconditional although the stale assignment beside it is conditional (`if (feed !== "measuring")`): while nothing has landed, nothing has been published and `undefined` is already the truth, so the two counts stay equal without a branch to keep in step.

`src/lib/tune/model.spec.ts` 8 -> **10**; the recorder gains `configs` / `onconfig`, which every existing test spreads into `buildTuner` unchanged:

9. *onconfig carries the compiled pair with every landing, and undefined the instant a knob moves* - aurora, fake timers: `configs` is `[]` before the landing; one landing is one pair whose `setup.length` / `timer.length` are the landed meters; `set("band", …)` makes the very next call `undefined` **before any timer advances** and it stays `undefined` through `settle()`; after `COMPILE_DEBOUNCE_MS` a new defined pair lands whose `setup` differs from the first and whose lengths are the new meters.
10. *TURN IT DOWN's back-off publishes undefined, then the resolved pair* - **dial at `OVER_RESERVE` (300)**, the door `ladder.spec.ts` measured (see Deviations for why not tpad): the over-budget landing still publishes its pair; `apply()` publishes `undefined` as its next call; after the debounce the resolved pair lands with both lengths inside 908 and `setup.length === view.setup.used - 300`, the view's state being `"over"` (the meter's word for a settled figure past its limit).

### Two negative checks, each observed red on the intended test and restored byte-identical (`8434ed97…`)

| # | Mutation in `model.ts` | Red on | What it said |
| - | ---------------------- | ------ | ------------ |
| 1 | the `onconfig?.(undefined)` removed from `moveTo` | test 9 (1 failed, 9 passed) | `AssertionError: a knob move did not publish anything: expected [ { …(2) } ] to have a length of 2 but got 1` - the old pair was the last call |
| 2 | the pair held in a closure variable set by `land()` and emitted from `emit()` | tests 9 and 10 (2 failed, 8 passed) | test 9: `AssertionError: a pair was published before anything landed: expected [ undefined ] to deeply equal []` (the general emit published from the first view; the "defined pair while stale" assertion sits behind it); test 10: `the back-off published nothing: expected [ Array(4) ] to have a length of 3 but got 4` |

## Task 2 - the report, threaded through the region to the panel (commit `3008404`)

`TuningRegion.svelte`'s diff is the prop declaration, its doc comment and one line in the `buildTuner` call, and nothing else. **Diff stat: `src/lib/ui/TuningRegion.svelte | 8 ++++++++`** (+8 / -0):

```
+    onconfig,                                            (the destructure)
+    /** The compiled pair, or undefined while measuring. The owner hands it to
+     *  the install store, which writes it verbatim - never a re-compile at
+     *  click time. */
+    onconfig?: (config: { setup: string; timer: string } | undefined) => void;
+        onconfig,                                        (the buildTuner call)
```

`Coverflow.svelte` (+16): `configStrings` (`$state`, two strings, so its rule 3 is not violated) declared beside `overBudgetReason`; reset to `undefined` in the same `$effect` that resets the budget reason on a step, with the reason in prose (a neighbour's strings are not known until its own region lands, and a click in the gap must write nothing); `onconfig={(config) => (configStrings = config)}` on the region; `config={configStrings}` on `TryOnDevice`.

`TryOnDevice.svelte` (+17): `config?: { setup: string; timer: string }` declared in the props type with a comment naming plan 07-10 as its consumer and the specifier rule as the reason for the structural type; **not bound in the destructure**, with `// eslint-disable-next-line svelte/no-unused-props -- …` above it (see Deviations). Its never-writes literals are untouched - that is 07-10's.

### The scans, quoted

The structural type stands in all three files: no `from "$lib/tune/model"` and no inline `import("$lib/tune/model")` alias anywhere. Comment-stripped `from` specifier lists, HEAD vs after: `TuningRegion.svelte` **9 -> 9**, `Coverflow.svelte` **19 -> 19**, `TryOnDevice.svelte` **7 -> 7** - no new specifier in any of the three. `tune-ui.spec.ts` test 1's `LAZY` scan (which binds `TuningRegion.svelte`) and `config-shape.spec.ts` test 13's walk both green unedited: **5** and **14**.

## Task 3 - wire-pin.spec.ts: the bytes are the numbers, across the whole catalog (commit `060b486`)

`src/lib/device/wire-pin.spec.ts`, **4**, `server` project, `beforeAll(() => padReady())`. Every write in the file lands in `FakeTransport.writes` through `RequestQueue` and `writeBoth`; nothing opens a port. Tests 1 to 3 await the first defined `onconfig` through a promise (`landing()`), which also records **the meters the tuner published at the landing** - the `used` figures of the view `land()` emits immediately before the pair. Test 4 uses `model.spec.ts`'s `settle()` discipline.

1. *for every compiler-driven entry, the published strings are the compiled text and their lengths are the meter's used figures* - nine entries, `reserved` absent: `config.setup === result.setupLua`, `config.timer === result.timerLua` against an independent `compileState(resetAll(entry))`; lengths equal `costOf(result)`'s `used` **and** the tuner's landed meters; `compressScript(setup)` is shorter by exactly the action count (1 per Setup). The table, as printed:

```
wire-pin: reserve 0 / 0, every compiler-driven entry at its defaults
aurora     setup  250 used  250 meter  250 | timer   55 used   55 meter   55 | compressed(setup)  249 | actions 1 | fits
pinwheel   setup  305 used  305 meter  305 | timer   55 used   55 meter   55 | compressed(setup)  304 | actions 1 | fits
starfield  setup  238 used  238 meter  238 | timer   55 used   55 meter   55 | compressed(setup)  237 | actions 1 | fits
radar      setup  438 used  438 meter  438 | timer   55 used   55 meter   55 | compressed(setup)  437 | actions 1 | fits
joystick   setup  535 used  535 meter  535 | timer   24 used   24 meter   24 | compressed(setup)  534 | actions 1 | fits
ninepads   setup  580 used  580 meter  580 | timer  158 used  158 meter  158 | compressed(setup)  579 | actions 1 | fits
faders     setup  513 used  513 meter  513 | timer   24 used   24 meter   24 | compressed(setup)  512 | actions 1 | fits
dial       setup  646 used  646 meter  646 | timer   55 used   55 meter   55 | compressed(setup)  645 | actions 1 | fits
tpad       setup  902 used  902 meter  902 | timer  146 used  146 meter  146 | compressed(setup)  901 | actions 1 | fits
presets: 9   mismatches: 0
```

   Identical to 07-RESEARCH's nine rows; every compressed figure is `used - 1` with one action per Setup.

2. *for every Lua entry, the published strings are the rendered text, and the rendered text is already canonical* - seven entries: the landed pair `toEqual(renderLua(entry, tuner.indices))`; every event's length equals the tuner's meter (the empty Timer included, as a true zero); every non-empty string equals its own `measureLua` - the fixed point `lua-entries.spec.ts` test 1 holds across the whole knob cross-product, cited at the defaults. MORPH's empty Timer was walked (`emptyTimers > 0`).
3. *the bytes on the wire are the published strings, verbatim* - aurora's pair through `writeBoth(queue, TARGET, config)` against `zonaResponder`: two `CONFIG/EXECUTE` frames, Timer (6) then Setup (0), `ACTIONSTRING` verbatim and `ACTIONLENGTH` the length; `compressScript(config.setup).length` **strictly less than** the written length and the strings unequal - the negative that proves nothing compressed on the way.
4. *the pair is undefined while measuring, and no write can be built from undefined* - fake timers: no call before the landing, the first call is the pair, `undefined` on `set()` and through the window; `stringsOrRefuse` (the store's shape) refuses `undefined` as `measuring` and a 909-character Setup as `over-budget`; `transport.writes` is `[]` after both refusals; the recompiled pair is accepted and still not written.

Wall time: the whole file runs in about 0.9 s once the formatter is warm (test 1 about 110 ms, test 2 about 100 ms for seven VMs).

### Two negative checks, each observed red on the intended test and restored byte-identical

| # | Mutation | Red on | What it said |
| - | -------- | ------ | ------------ |
| 1 | `land()` emits `compressScript(config.setup)` / `compressScript(config.timer)` (in `model.ts`, restored to `8434ed97…`) | tests 1 and 3 (2 failed, 2 passed) | test 1: `aurora: the published Setup is not the compiled text: expected '--[[@cb#z.paurora]]for n=0,80 do loca…' to be '--[[@cb#z.paurora]] for n=0,80 do loc…'` (the length assertions sit behind it); test 3: `the written Setup is already the compressed form - the pin is gone: expected 249 to be less than 249` |
| 2 | `landing(entry.id, { setup: 1, timer: 0 })` in test 1 (in the spec, restored to `b8e819e1…`) | test 1 (1 failed, 3 passed) | `aurora: Setup's length is not the meter the tuner published: expected 250 to be 251` - the meter moved by one, the strings did not, and the pin went red: the shipped reserve is 0 / 0 |

On the spec's first draft, check 2 stayed **green** - see Deviations, item 2.

## Files created and modified

- `src/lib/tune/model.ts` - modified; `ConfigStrings`, `onconfig`, `land()`'s third parameter, `measurePadsim` split, `measureLuaRoute`'s pair, two withdrawals with prose
- `src/lib/tune/model.spec.ts` - modified; recorder + 2 tests, 8 -> 10
- `src/lib/ui/TuningRegion.svelte` - modified; one prop (+8)
- `src/lib/ui/Coverflow.svelte` - modified; `configStrings`, its reset, two attributes (+16)
- `src/lib/ui/TryOnDevice.svelte` - modified; `config` in the props type, one directive (+17)
- `src/lib/device/wire-pin.spec.ts` - created; 4
- `.planning/phases/07-install-flow/07-05-SUMMARY.md` - this file
- `.planning/phases/07-install-flow/deferred-items.md` - item 6 appended (never overwritten)
- `.planning/STATE.md`, `.planning/ROADMAP.md` - Phase 7 at 5/13, by hand

## Deviations from plan

### Auto-fixed

**1. [Rule 1 - Bug in the plan's fixture] model.spec.ts test 10 uses dial at the 300 reserve, not tpad**
- **Found during:** Task 1, reading `ladder.spec.ts`'s header before writing the test
- **Issue:** the plan's action text reaches the over-budget door "through `reserved` on `tpad`, the way `ladder.spec.ts` reaches it". `ladder.spec.ts` measured on 2026-09-04 that tpad **can never produce a ladder**: its only sheet is `sends`, the compiler refuses to shed sends, and `fit()` returns `{ fits: false, steps: [], blocked: "sends" }` at every reserve. `overView().apply()` with no moved knob and no step returns at `if (!step) return` - it would publish nothing, and the test's "next call is undefined" could not be reached with the plan's fixture.
- **Fix:** dial at `OVER_RESERVE` (`{ setup: 300, timer: 0 }`, already in `model.spec.ts`), "the only pairing on this shelf that exercises TUNE-04 and TUNE-05 at once" per `ladder.spec.ts`. The test also asserts the landing's state is `"over"` (the door) and `setup.length === used - 300`.
- **Files modified:** `src/lib/tune/model.spec.ts`. **Commit:** `7a072e8`.

**2. [Rule 1 - Bug in the spec as first written] wire-pin test 1 pins against the tuner's published meter as well as costOf()**
- **Found during:** Task 3, the second negative check
- **Issue:** the plan's test 1 asserts `config.setup.length === cost.setup.used` "against `costOf(result)`" - an independent recomputation with no reserve. Its negative check (`reserved: {setup: 1, timer: 0}`) says "the `used` figures move by one and the pin goes red". Observed: **it stayed green** (4 passed). A reserve moves the tuner's meter and never the strings, and an independent `costOf()` without the reserve does not move either; the assertion as specified is immune to the mutation meant to demonstrate it.
- **Fix:** `landing()` records the `used` figures of the view `land()` emits before the pair, and test 1 asserts both lengths against **that** (the meter the visitor sees - D-10's own words) beside the `costOf()` pin, and prints them as a `meter` column; test 2 asserts every Lua event's length against its meter too. Re-run: red on `aurora: Setup's length is not the meter the tuner published: expected 250 to be 251`. The `costOf()` pin is kept: it holds whatever the tuner does, and the two together say which half a future regression is in.
- **Files modified:** `src/lib/device/wire-pin.spec.ts`. **Commit:** `060b486`.

**3. [Rule 3 - Blocking] `svelte/no-unused-props` on TryOnDevice's unread `config` prop**
- **Found during:** Task 2, `npm run lint`
- **Issue:** the plan wants `config` declared and "read nowhere yet". Bound in the destructure, `@typescript-eslint/no-unused-vars` fires (`'config' is assigned a value but never used`); declared in the props type and left unbound, `svelte/no-unused-props` fires on the destructure line (`'config' is an unused Props property`). Task 2's acceptance requires `npm run lint` exit 0, and inventing a read (a data attribute, say) would ship behaviour the plan did not ask for.
- **Fix:** the unbound form, so only one rule fires, and `// eslint-disable-next-line svelte/no-unused-props -- …` with its reason directly above `let {`, the form `Coverflow.svelte` and `BrowseGrid.svelte` already carry for `prefer-svelte-reactivity`. The prop's comment says so and names 07-10 as the plan that binds it and removes the directive. Recorded as deferred item 6 so the directive does not outlive its reason.
- **Files modified:** `src/lib/ui/TryOnDevice.svelte`. **Commit:** `3008404`. `npm run lint` after: exit 0.

### Departures recorded, not deviations from the plan

1. **`wire-pin.spec.ts` tests 1 to 3 await the first landing through a promise, not `settle()`.** The plan says "through the same fake-timer discipline `model.spec.ts` uses". That discipline is right for a padsim entry, whose first landing is a fixed-length promise chain; it is not safe for the Lua route, where `measureLuaRoute` awaits a dynamic `import()` and `buildTuner` awaits a real VM - `model.spec.ts` itself runs its two Lua tests on the real clock for that reason. `landing()` resolves on the first defined `onconfig` and is deterministic for both routes; test 4 (aurora, a debounce question) uses `vi.useFakeTimers()` + `settle()` + `advanceTimersByTimeAsync` exactly as `model.spec.ts` does.
2. **The `onconfig(undefined)` in `moveTo` is unconditional** where the stale assignment beside it is conditional; the reason is in the source and above.

## Known stubs

None. `TryOnDevice`'s `config` prop is declared and unread by design and by the plan ("it reads it nowhere yet"); it is a seam for 07-10 with a named directive, not a stub that prevents this plan's goal.

## Requirements

**`requirements-contributed: [SAFE-02, SAFE-07]`** - contributed, not completed. SAFE-07 ("installed means these exact bytes"): the bytes are now a published, pinned property of the tuner across every catalog entry, and `undefined` is the state in which no write can be built; nothing writes yet. SAFE-02 (the primary control writes what it showed): the control can now be handed the exact strings and is structurally without them for the debounce window; 07-06 / 07-10 make it write. `REQUIREMENTS.md` is not edited here.

## Deferred items

Appended to `.planning/phases/07-install-flow/deferred-items.md`:

- **Item 6** - `TryOnDevice.svelte` carries `// eslint-disable-next-line svelte/no-unused-props` above its props destructure because `config` is declared and not yet bound. Owner: 07-10, which binds the prop and must remove the directive (an unused-directive warning will fire the moment it does, so it cannot be forgotten silently).

## Next plan readiness

07-06 (`install.svelte.ts`) starts from: quick **72 / 754**, sweep `3 13`, svelte-check 538 / 0. It takes `ConfigStrings | undefined` as its config input (`import type { ConfigStrings } from "$lib/tune/model"` is fine in a `.svelte.ts` store under `src/lib/device/` - the specifier rule binds `src/lib/ui/` only), treats `undefined` as not-ready-to-write with the meters' measuring language, and writes the pair verbatim through `writeBoth` - `stringsOrRefuse` in `wire-pin.spec.ts` is the decision shape, with the 908 refusal in front of `sendConfig`'s own `RangeError`. 07-10 binds `config` in `TryOnDevice.svelte`, removes the directive, and retires the never-writes literals.

The Phase 6 hardware checkpoint (SESSION-RUNBOOK rows A to F) is still unanswered; this plan did not need it. No device was connected to, written to or looked for; every write in this plan's spec went to a `FakeTransport`.

---
*Phase: 07-install-flow*
*Completed: 2026-09-05*

## Self-Check: PASSED

Checked after writing, at 2026-09-05T12:06:33.000Z.

- FOUND: `src/lib/tune/model.ts` (contains `onconfig`, 4 occurrences: the declaration, the emit in `land()`, the two withdrawals)
- FOUND: `src/lib/tune/model.spec.ts` (10)
- FOUND: `src/lib/ui/TuningRegion.svelte`, `src/lib/ui/Coverflow.svelte` (contains `configStrings`), `src/lib/ui/TryOnDevice.svelte`
- FOUND: `src/lib/device/wire-pin.spec.ts` (contains `setupLua`; 4)
- FOUND: `.planning/phases/07-install-flow/07-05-SUMMARY.md`
- FOUND: `.planning/phases/07-install-flow/deferred-items.md` (item 6 appended)
- FOUND: commit `7a072e8`
- FOUND: commit `3008404`
- FOUND: commit `060b486`
- PASS: quick 72 / 754 through check-counts; sweep 3 13; svelte-check 538 / 0; lint exit 0
- engine name occurrences in this SUMMARY and in the three commit messages: 0
