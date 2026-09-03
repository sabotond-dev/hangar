---
phase: 03-vendor-the-domain
plan: 04
subsystem: testing
tags: [fidelity, oracle, firmware, grid-fw, vitest, golden-frames, pad-sim]

requires:
  - phase: 03-01
    provides: The six vendored BOTOR files, including pad-sim.ts and _pad.ts
  - phase: 03-02
    provides: The upstream byte manifest that proves the vendored copy is unpatched
  - phase: 03-03
    provides: The preset baseline spec idiom and the mustPreset narrowing helper
provides:
  - An independently derived firmware oracle with a grid-fw file:line citation per constant
  - An exhaustive agreement spec between the vendored simulator and that oracle (PREV-06, ROADMAP criterion 4)
  - A labelled golden-frame regression tripwire covering all nine presets at five non-aliasing ticks
affects: [03-05, 03-06, simulator, catalog-rendering, grid-protocol-bumps]

tech-stack:
  added: []
  patterns:
    - "Two-source oracle: an isolated author derives the constants, a different author writes the comparison"
    - "Negative check per gate: observe red, restore, observe green, record both exit codes"
    - "Environment-gated fixture regeneration that fails the run by design"

key-files:
  created:
    - src/lib/fidelity/firmware-oracle.ts
    - src/lib/fidelity/firmware-oracle.spec.ts
    - src/lib/fidelity/golden-frames.json
    - src/lib/fidelity/golden-frames.spec.ts
  modified: []

key-decisions:
  - "The oracle's LED_LOOKUP_DIRECTION is load-bearing semantically but not numerically: the ZONA table is self-inverse, so agreement on the data cannot confirm the direction, and the spec honours the declaration instead of trying both"
  - "The tick-order test asserts the settled frame at expiry+1 against hashes[T-1+phaseAdvanceOffsetAtExpiry], so the oracle constant selects the expectation and flipping it goes red"
  - "The weight-sum constant is read from the oracle's own tables at phase 0, never written as a literal, because a literal would be a third transcription and the weakest link"
  - "Golden-frame regeneration runs npx prettier --write on the fixture inside the spec, because JSON.stringify puts the primitive ticks array on five lines and Prettier collapses it"

patterns-established:
  - "Isolated-author derivation: the independence is the deliverable, recorded as a verbatim opened-files list in the SUMMARY"
  - "D-08 discipline: a mismatch is reported side by side with its firmware citation, never reconciled by editing the oracle or the vendored copy"

requirements-completed: [PREV-06]

duration: 19 min
completed: 2026-09-03
---

# Phase 03 Plan 04: Pin the simulator against something that is not the simulator Summary

**An independently derived firmware oracle (five grid-fw tables, two derived functions, the expiry tick order, every value cited to `file:line` at `dc7d301e`), an exhaustive 7-test agreement spec that found zero disagreement with the vendored simulator, and an 11-test golden-frame tripwire over all nine presets at five non-aliasing ticks.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-09-03T10:14:30Z (previous plan's metadata commit)
- **Completed:** 2026-09-03T10:33:46Z
- **Tasks:** 3
- **Files created:** 4

## Accomplishments

- ROADMAP criterion 4 is met by construction. The oracle's author was structurally prevented
  from reading the simulator, so agreement on 81 LED cells, 256 sine entries, 256 weight
  triples, 2048 colour-stop comparisons and 1280 shape/phase pairs is two independent readings
  of the same C, not one reading transcribed twice.
- The vendored simulator and the oracle agree on **every** value. D-08 never fired: no
  mismatch, no side-by-side report, no red test left standing, and
  `git diff --stat HEAD -- src/lib/fidelity/firmware-oracle.ts src/vendor/` prints nothing.
- The freeze-on-expiry tick order (D-06 e) is pinned through the vendored public API only, with
  no reach into private state. The fallback in the plan was **not** needed.
- Nine presets have committed frame hashes, lit-byte counts and animating flags at ticks
  0, 37, 101, 500 and 1009, labelled in the fixture's own text as a tripwire and not an oracle.

## Task Commits

1. **Task 3-04-01: Re-derive the firmware constants independently** - `21555bb` (feat)
2. **Task 3-04-02: Assert the vendored simulator against the oracle, exhaustively** - `b3a554d` (test)
3. **Task 3-04-03: Golden frames - a labelled regression tripwire for all nine presets** - `5d37780` (test)

## Files Created

- `src/lib/fidelity/firmware-oracle.ts` (484 lines) - `LED_LOOKUP` (81), `SINE_LOOKUP` (256),
  `MIN_WEIGHT`/`MID_WEIGHT`/`MAX_WEIGHT` (256 each), `LED_LOOKUP_DIRECTION`,
  `LAYER_SCALE_DIVISOR` (512), `LAYER_COUNT` (3), `layerStops`, `shapeIntensity`, `TICK_ORDER`,
  `ORACLE_SOURCE`. Every constant carries a grid-fw `file:line` citation with the C quoted
  verbatim in the doc comment.
- `src/lib/fidelity/firmware-oracle.spec.ts` (298 lines) - 7 exhaustive assertions plus the
  named `it.todo` for the unobservable divisor and layer count.
- `src/lib/fidelity/golden-frames.json` - `note`, `ticks`, and 45 entries
  (9 presets x 5 ticks) of `sha256` / `nonZeroBytes` / `animating`.
- `src/lib/fidelity/golden-frames.spec.ts` - 11 tests plus the `UPDATE_GOLDEN` regeneration path.

## The oracle author's independence (PREV-06 evidence)

**The oracle was written by a separate, isolated agent.** The `gsd-executor` agent type cannot
spawn subagents, so the `/gsd:execute-phase` orchestrator spawned the isolated author itself, as
a general-purpose agent, with task 3-04-01's subagent prompt passed **verbatim** - no plan file
attached, no simulator summarised, no firmware value supplied. The deliverable was already on
disk (untracked) when this executor started; this executor performed only the plan's
post-return mechanical verification and the commit, and changed no value in the file.

The executor of task 3-04-02 and 3-04-03 (this agent) is the different author the plan requires:
it read `pad-sim.ts` and `_pad.ts` freely, which is exactly what the comparison side needs.

### Verbatim opened-files list, as reported by the author

> Commit verified first: `git -C C:/Users/sabot/Documents/Claude/grid-fw rev-parse HEAD` →
> `dc7d301e4fb8502c4db5b2500e1f7f991ef06110`. Match.
>
> | File (under `C:\Users\sabot\Documents\Claude\grid-fw\`) | Lines read |
> |---|---|
> | `common/src/c/grid_module.c` | 400-480 (grep for `#define R[0-8]` line numbers). Covers `grid_module_tek2_ui_init` 403-434, `grid_module_zona_led_is_alert_all` 436-443, R0-R8 445-453, `grid_module_zona_ui_init` 455-464 |
> | `common/src/c/grid_led.c` | 1-100, 100-160, 160-220, 290-470 (grep for the four `*_lookup` declarations) |
> | `common/src/c/grid_led.h` | 1-60 |
> | `common/src/c/grid_lua_api.c` | 1055-1110, 1295-1345, 1560-1600 |
>
> Nothing else was opened. No file under `src/vendor/botor/`, no `.planning/phases/03-*` doc,
> nothing under `.claude/projects\`, no other TS/JS in HANGAR. Working files were confined to
> the session scratchpad.
>
> **Transcription method:** rather than retyping 1,024 hex literals, a scratchpad node script
> parsed the four tables from the exact cited line ranges of `grid_led.c` and the nine row
> macros from `grid_module.c:445-453`, asserting length 256 / values 0-255 for each table and
> that `LED_LOOKUP` is a permutation of 0..80. The emitted TypeScript was then re-parsed and
> compared element-by-element against that parse. All five arrays match.

The list contains none of `pad-sim.ts`, `_pad.ts`, `src/vendor/botor/tests/`, `03-RESEARCH.md`
or `03-CONTEXT.md`. That is the manual-only verification 03-VALIDATION.md names for PREV-06.

### Verbatim judgement calls, as reported by the author

> 1. **`LED_LOOKUP_DIRECTION`.** `grid_led_lookup_get` (grid_led.c:171-183) on its own only
>    returns a pointer — it does not settle direction. I followed the value:
>    `l_grid_led_address_get` (grid_lua_api.c:1333) pushes `lookup[subidx]` to Lua, and that
>    value becomes the `num` argument of the layer setters, which index
>    `led_smart_buffer[num + led_count*layer]` (:309-311) and ultimately
>    `led_frame_buffer[led_index*3+…]` (:391-403). So subscript = logical, value = hardware.
>    Corroborated by TEK2 at grid_module.c:409-411, `grid_led_lookup_alloc_single(led, i, i + 10)`
>    on an 18-LED module. Call: **`"logical index -> hardware index"`**.
>
> 2. **The ZONA table is self-inverse.** `LED_LOOKUP[LED_LOOKUP[i]] === i` for all 81 entries
>    (odd rows are ascending runs, even rows descending). This means the direction label has
>    **zero numeric consequence** for ZONA and cannot be validated by comparing data with the
>    other author — only the semantics differ. Flagged explicitly in the file so a reviewer does
>    not mistake agreement for confirmation.
>
> 3. **`LAYER_SCALE_DIVISOR = 512`.** The C is two successive divisions, `mix / 2 / 256`
>    (grid_led.c:458-460). Because the accumulators are `uint32_t`, nested truncating division
>    equals one division by the product, so 512 is exact rather than an approximation. Exported
>    the product, quoted the original expression.
>
> 4. **`forceMinBlack` models net effect, not the write sequence.** grid_lua_api.c:1091-1094
>    calls `grid_led_set_layer_color` (which writes `r/20` into min) and *then* overwrites min
>    with 0,0,0. `layerStops` returns `min: [0,0,0]` directly; mid and max keep the values
>    `set_layer_color` wrote. Equivalent for any observer of final state.
>
> 5. **`shapeIntensity` shapes ≥ 4.** The C switch (grid_led.c:429-442) has **no `default:`
>    label**, but `intensity` is pre-seeded with `phase` at :428. Unknown shapes therefore behave
>    identically to shape 0. I made this an explicit `default:` arm rather than leaving it
>    implicit — same behaviour, but a reviewer should know it was a derived conclusion, not a
>    transcribed line.
>
> 6. **uint8 input wrapping.** `grid_led_set_layer_color` takes `uint8_t r, g, b`, and the Lua
>    binding writes `uint8_t param[5] = lua_tointeger(...)`. I apply `Math.trunc(x) & 0xff` to
>    inputs of both functions. Lua's own coercion of non-integers is *not* modelled —
>    `lua_tointeger` semantics live outside the permitted read set.
>
> 7. **`struct LED_layer` line range.** The task's read set said `grid_led.h:28-40`; the struct
>    actually ends at **line 37** (39-53 are the `grid_led_is_alert_all_t` typedef and
>    `struct grid_led_model`). I cite 28-37, the true extent.
>
> 8. **Cross-check documented in the file:** at every one of the 256 indices,
>    `MIN_WEIGHT[i] + MID_WEIGHT[i] + MAX_WEIGHT[i] === 254`, never 256. Verified
>    programmatically. That is a cheap independent check for the other author, and it explains
>    why a saturated layer lands one count short of its stop. Also noted the fold plateau:
>    `MID_WEIGHT[127]` and `MID_WEIGHT[128]` are both `0xfe`.
>
> 9. **Not exported (outside the fixed shape), but worth knowing:**
>    `grid_module_zona_led_is_alert_all` (grid_module.c:436-443) computes its border test as
>    `x = n % 9, y = 8 - n / 9` on the **hardware** index — `grid_alert_all_set`
>    (grid_led.c:215-221) loops raw indices, never through `LED_LOOKUP`. Also, `LED_layer.timeout`
>    is `uint16_t` (grid_led.h:36) while `grid_alert_one_set_timeout` (grid_led.c:292) narrows it
>    to `uint8_t`.

### How the judgement calls landed against the spec's expectations

- **Call 2 is the one that bears on the spec's strength, and it limits it.** Because the ZONA
  table is self-inverse, the two possible readings of `LED_LOOKUP` produce identical numbers.
  The 81-cell test therefore confirms the *data* independently but **cannot** confirm the
  *direction*: only the semantics differ, and the spec honours
  `ORACLE.LED_LOOKUP_DIRECTION` as declared rather than trying both until one passes. Trying
  both would be fitting the oracle to the simulator, which is the failure mode the plan exists
  to prevent. The direction remains a single-source claim resting on the author's derivation
  from `grid_led.c:171-183` plus `grid_lua_api.c:1301-1336`, recorded here so no reviewer
  mistakes numeric agreement for confirmation of it.
- **Call 5** predicted that an unknown shape falls through to the identity ramp. The spec sweeps
  `sha` 0..4 x `pha` 0..255 and the simulator's `default:` arm agrees at every one of the 1280
  pairs, including the whole of shape 4.
- **Call 8**'s sum-254 property is asserted directly, with the constant read from the oracle's
  own phase-0 row rather than written as a literal. Confirmed at all 256 phases on both sides.
- **Call 3** (`512`) and `LAYER_COUNT` (3) remain unasserted: `pad-sim.ts` exposes neither, so
  the spec carries the named `it.todo` and 03-VALIDATION.md already carries the Manual-Only row.
- **Calls 4 and 6** are both confirmed by the exhaustive colour sweep: 4 channel patterns x 256
  values x both `forceMinBlack` branches, 2048 comparisons, all in agreement.

## Mechanical verification of the oracle (task 3-04-01, executor side)

No value in `firmware-oracle.ts` was changed. Verified before the commit:

| Check | Result |
|---|---|
| `test -f src/lib/fidelity/firmware-oracle.ts` | exit 0 |
| Ten `export const` names present | exit 0 |
| `export function layerStops`, `export function shapeIntensity` | exit 0, exit 0 |
| Commit `dc7d301e4fb8502c4db5b2500e1f7f991ef06110` cited | exit 0 |
| Citation counts | `grid_led.c:` 19, `grid_module.c:` 4, `grid_lua_api.c:` 5, `grid_led.h:` 6 (minimums 6/1/1/1) |
| Restriction stated in the header | exit 0 ("Not read, by instruction") |
| Table lengths, parsed from source | `LED_LOOKUP` 81 and a permutation of 0..80, `SINE_LOOKUP` 256, `MIN`/`MID`/`MAX_WEIGHT` 256 each |
| Weight sums, parsed from source | exactly one distinct value across all 256 indices: 254 |
| `LED_LOOKUP[LED_LOOKUP[i]] === i` | true for all 81 (the author's call 2, confirmed) |
| `npx prettier --check` | exit 0 |
| `npm run check` | `348 FILES 0 ERRORS 0 WARNINGS` |
| `npm run lint` | exit 0 |

## Sibling repository integrity (grid-fw)

`git -C "C:/Users/sabot/Documents/Claude/grid-fw" status --porcelain` captured before the plan
and after the last task. Both captures are **empty** (0 bytes), and `cmp` of the two reports
byte equality (exit 0). `git -C ... rev-parse HEAD` reported
`dc7d301e4fb8502c4db5b2500e1f7f991ef06110`, matching the commit the oracle cites. No git command
that writes was run in either sibling repository.

## Negative checks (observed red, restored, observed green)

| # | Gate | Perturbation | Failing test | Red exit | Green exit |
|---|---|---|---|---|---|
| A | Firmware oracle, LED table | `LED_LOOKUP[0]` 8 -> 7 | `agrees on all 81 LED lookup cells in the direction the oracle declares` | **1** | **0** |
| B | Firmware oracle, tick order | `TICK_ORDER.phaseAdvanceOffsetAtExpiry` 1 -> 0 | `agrees on the tick order at layer expiry` | **1** | **0** |
| C | Golden frames | one hex digit of aurora's tick-101 `sha256` | `aurora frames are unchanged at every recorded tick` | **1** | **0** |

Failure messages, as observed:

- **A:** `LED cell (x=0, y=0), logical index 0: oracle grid_module.c:445-458 says hardware 7:
  expected 8 to be 7` - the message names the specific cell, as 03-VALIDATION.md requires.
- **B:** `frozen picture after expiry at tick 42: oracle grid_led.c:191-211 gives
  phaseAdvanceOffsetAtExpiry=0, so the expected frozen frame is the one at tick 41` - the oracle
  constant selects the expectation, so flipping it flips the test.
- **C:** `aurora at tick 101: frame hash changed` - the message names the preset and the tick.

Both oracle perturbations were reverted with `git checkout -- src/lib/fidelity/firmware-oracle.ts`
and the golden fixture with `git checkout -- src/lib/fidelity/golden-frames.json` (possible
because the two new task-3 files were `git add`ed the moment the first generation succeeded,
before any perturbation - on an untracked path `git checkout --` fails outright and
`git diff --quiet` passes vacuously). After the last restore,
`git diff --stat HEAD -- src/lib/fidelity/firmware-oracle.ts src/vendor/` printed nothing.

## Tick-order fallback

**Not used.** The plan allowed a weaker static-preset assertion if no `PadState` reachable
through the vendored public API produced an `animating` true-to-false transition within 2000
ticks. One does: `defaultState()` with `enabled.look = false` and `enabled.sends = false` leaves
the default comet touch look as the only ticking layer, and a single `touchDown(0, 64, 64)`
decays to `animating === false` at **tick 42**, well inside the budget. The frames at tick 41
and tick 42 differ (asserted explicitly, so the offset is load-bearing rather than vacuous) and
the frame is byte-identical at ticks 43, 52 and 142. No row was added to 03-VALIDATION.md's
Manual-Only table; the existing "if the fallback fires" row stands unfired.

## Verification results

| Command | Result |
|---|---|
| `npx vitest run --project server src/lib/fidelity/firmware-oracle.spec.ts` | `Test Files 1 passed (1)`, `Tests 7 passed \| 1 todo (8)` |
| `npx vitest run --project server src/lib/fidelity/golden-frames.spec.ts` | `Test Files 1 passed (1)`, `Tests 11 passed (11)` |
| `npm run test:quick` | `Test Files 10 passed (10)`, `Tests 347 passed \| 1 todo (348)` |
| `npm run test:sweep` | `Tests 9 passed (9)` (49.5 s) |
| `npm run check` | `348 FILES 0 ERRORS 0 WARNINGS` |
| `npm run lint` | exit 0 |
| `git diff --stat HEAD -- src/vendor/` | prints nothing |
| Two consecutive golden runs, then `git diff --quiet -- golden-frames.json` | green, green, exit 0 |
| `UPDATE_GOLDEN=1` twice, then `git diff --quiet -- golden-frames.json` | exit 1, exit 1 (by design), exit 0 |

Golden fixture shape, measured: nine presets, five entries each, ticks `[0,37,101,500,1009]`.
The five animating presets (aurora, pinwheel, starfield, radar, dial) each produce **5 distinct**
hashes across the five ticks - no aliasing was reintroduced. The four static presets (joystick,
ninepads, faders, tpad) produce 1 hash each and report `animating: false` at every tick. tpad's
`nonZeroBytes` is 0 at all five ticks, which the fixture note labels as by design.

## Decisions Made

- **The direction is honoured, not searched.** The spec builds its logical-to-hardware mapping
  from `ORACLE.LED_LOOKUP_DIRECTION` as declared and asserts that the result is a permutation.
  It never tries the inverse to see whether that passes instead.
- **The tick-order expectation is indexed by the oracle constant.** The settled frame
  (`hashes[expiry + 1]`) is compared against `hashes[expiry - 1 + phaseAdvanceOffsetAtExpiry]`,
  and the spec separately asserts that `hashes[expiry - 1] !== hashes[expiry]` so the offset
  cannot be vacuously satisfied. `rateZeroedOnExpiry` is asserted the same way: the observable
  consequence is "the picture never moves again", so the spec asserts
  `movedAfterExpiry === !rateZeroedOnExpiry`.
- **The weight-sum constant is derived, never written.** Taken from
  `MIN_WEIGHT[0] + MID_WEIGHT[0] + MAX_WEIGHT[0]`. A literal `254` in the spec would have been a
  third transcription of the firmware and the weakest link in a chain built to have none.
- **Golden regeneration shells out to `npx prettier --write`** rather than formatting through
  the Prettier API, so the normalising pass is exactly the command `npm run lint` checks against.
  `cwd` is derived from the fixture URL, so it does not depend on the runner's working directory.

## Deviations from Plan

None - plan executed exactly as written.

The only structural departure was pre-arranged and is not a deviation by the executor: task
3-04-01's subagent was spawned by the `/gsd:execute-phase` orchestrator rather than by this
executor, because the `gsd-executor` agent type cannot spawn subagents. The plan's fallback
("execute this task in a fresh context in which you have opened none of the forbidden files, and
say so in the SUMMARY") was therefore not needed - the isolation was real and agent-enforced, and
it is recorded above.

## Issues Encountered

None. The vendored simulator agreed with the independently derived oracle on every one of the
~3,900 compared values at the first run, so D-08's stop-and-report path was never entered.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ROADMAP criterion 4 is closed. The simulator is now pinned against a source that is not the
  simulator, and the pin is exhaustive rather than sampled.
- Plan 03-05 can rely on the design fact this plan confirmed by measurement: `PadSim` needs no
  Lua formatter. `firmware-oracle.spec.ts` and `golden-frames.spec.ts` both run with the WASM
  uninitialised and neither has a `beforeAll` gate - that absence is what makes 03-05's WASM
  gate spec meaningful rather than redundant.
- Two residual gaps, both already named in 03-VALIDATION.md's Manual-Only table and neither
  closable inside HANGAR:
  1. `LAYER_SCALE_DIVISOR` (512) and `LAYER_COUNT` (3) are unobservable through `pad-sim.ts`'s
     public surface. Closing this is an upstream BOTOR change (export the two constants) plus a
     re-sync per D-03.
  2. The ZONA lookup's *direction* cannot be cross-confirmed because the table is self-inverse.
     The data is confirmed independently; the semantics rest on one author's derivation.

---

_Phase: 03-vendor-the-domain_
_Completed: 2026-09-03_

## Self-Check: PASSED

All four created files exist on disk and all three task commits are present in `git log --oneline --all`.
