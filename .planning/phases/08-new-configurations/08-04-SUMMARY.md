---
phase: 08-new-configurations
plan: 04
subsystem: catalog
tags:
  [
    euclid,
    lua,
    knobs,
    budget,
    canonical-form,
    restricted-subset,
    golden-frames,
    pitfall-1,
    D-08,
    D-11,
    D-12,
    D-17,
    D-18,
    D-19,
  ]
requires:
  - "src/lib/catalog/ (08-01) - CatalogEntry, CATALOG, frames.json, frames.spec.ts, check-counts.mjs"
  - "src/lib/sim/lua-host.ts (08-02) - createLuaHost, the Grid API, errors/midi/coordMax/pendingTouches"
  - "src/lib/sim/engine.ts + lua-pad-sim.ts (08-03) - createEngine, renderLua, blankPadState"
  - "src/lib/pad/index.ts (Phase 3) - measureLua behind the FOUND-05 padReady() gate"
  - "src/vendor/botor/_pad.ts (Phase 3) - EVENT_BUDGET, KnobKind, CELLS"
provides:
  - "src/lib/catalog/entries/euclid.ts - EUCLID, the first HANGAR-authored configuration"
  - "src/lib/catalog/lua-entries.spec.ts - THE CONT-02 GATE. 6 tests, fixed count."
  - "src/lib/sim/lua-smoke.spec.ts - the execution gate and the pitfall-1 guard. 3 tests, fixed count."
  - "frames.spec.ts's engineFor now delegates to createEngine; frames.json covers ten entries"
affects:
  - "Waves 5 and 6 (plans 08-05, 08-06): every new entry passes through these two gates unchanged"
  - "Phase 4's front-door row: euclid is registered in EXCLUDED_FROM_ROW, so the row is untouched"
  - "Phase 5: there is no runtime fit ladder for a Lua entry - the whole cross-product is proven here"
tech-stack:
  added: []
  patterns:
    - "Template-over-canonical-Lua: the stored string is a fixed point of the minifier with tokens substituted in"
    - "Per-event separability arithmetic, which licences a corner-only bound over the whole knob cross-product"
    - "Forbidden-needle assembly from fragments, extended from protocol source scanning to Lua subset scanning"
    - "One memoised simulation run feeding three independent assertions"
key-files:
  created:
    - src/lib/catalog/entries/euclid.ts
    - src/lib/catalog/lua-entries.spec.ts
    - src/lib/sim/lua-smoke.spec.ts
  modified:
    - src/lib/catalog/index.ts
    - src/lib/catalog/front-door.ts
    - src/lib/catalog/frames.spec.ts
    - src/lib/catalog/frames.json
decisions:
  - "EUCLID's description is 109 characters, not the plan's 111: the catalog gate caps it at 110"
  - "The pitfall-1 guard is a FLOOR on the timeout, not equality with 65535 - the LED engine decrements it every tick"
  - "The smoke spec assembles its engine from renderLua + createLuaHost so it can read raw layer records"
  - "euclid joins EXCLUDED_FROM_ROW (D-18); front-door.spec.ts needed no change, its partition is derived from data"
metrics:
  duration: 25 min
  tasks: 3
  files: 7
  completed: 2026-09-04
---

# Phase 8 Plan 04: EUCLID and the CONT-02 Gate Summary

The catalog holds its first configuration authored for HANGAR rather than ported from BOTOR — EUCLID,
a three-voice Euclidean drum machine whose Setup and Timer are stored as canonical Lua templates over
six knobs — and the gate every remaining configuration must pass is written, watched going red three
times, and green: canonical storage so the budget meter tells the truth, both events inside the event
budget across the entire knob cross-product, the Lua subset restricted rather than reasoned about,
real execution through a real gesture in a real VM, a golden frame set rendered by the Lua route, and
the keeper-on-a-decaying-layer strobe bug mechanically excluded.

---

## The measured baseline, re-measured

Every plan in this phase carries the same instruction and hits the same staleness. Measured on this
machine, on this tree, at commit `2f4ce2f`, **before this plan touched anything**:

```
npm run test:quick
 Test Files  39 passed (39)
      Tests  547 passed | 1 todo (548)

npm run test:sweep
 Test Files  1 passed (1)
      Tests  9 passed (9)
```

**BASE_FILES = 39, BASE_TESTS = 547** — identical to `08-03-SUMMARY.md`. Nothing landed in between
this time.

### Totals observed AFTER this plan

```
npm run test:quick   ->  41 files, 556 passed | 1 todo (557)
npm run test:sweep   ->   1 file,    9 passed
```

Exactly `BASE_FILES + 2` and `BASE_TESTS + 9`, verified through the helper:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 41 556   -> exit 0
npm run test:sweep 2>&1 | node scripts/check-counts.mjs 1 9      -> exit 0
```

**`npm run test:e2e` was not run, and `BASE_E2E = 21` is carried forward unverified.** This plan adds
no route and no component. The only application-graph change is that `CATALOG` gained an entry — and
the one application consumer of the catalog, `Coverflow.svelte`'s `onMount`, iterates **`FRONT_DOOR`**
and calls `byId` per row entry, while `src/routes/c/[id]/+page.ts` generates its prerendered set from
`FRONT_DOOR` too. `FRONT_DOOR` is byte-identical to what Phase 4 left, because euclid went into
`EXCLUDED_FROM_ROW`. The rendered site is therefore unchanged. **Plan 08-05 should re-measure rather
than inherit this.**

**Plan 08-05 should treat 41 / 556 (quick), 1 / 9 (sweep) and 21 (e2e) as its baseline — and should
re-measure rather than trust them.**

---

## EUCLID, measured

### The two events

| | template | at the defaults | all-longest corner | all-shortest corner |
|---|---|---|---|---|
| **Setup** | 704 | **702** (206 free) | **706** (202 free) | 700 (208 free) |
| **Timer** | 235 | **218** (690 free) | **221** (687 free) | 217 (691 free) |

Every one of those is `raw === compressed` — each is a fixed point of the pinned minifier, so
`cost()`'s `max(compressed, raw)` charges the honest number rather than a raw length the compiler
would never have emitted. `checkSyntax` is `true` on both events at every combination measured.

**Byte-identity with the canonical text was proved before anything else was written.** A throwaway
spec (created, run, deleted — it is not in the repository) compared `renderLua(EUCLID)` against the
two canonical strings quoted in the plan's `<interfaces>`, read from files rather than retyped:

```
setup rendered 702 canonical 702   setup identical true
timer rendered 218 canonical 218   timer identical true
```

No needle was wrong, and no expected number was touched.

### The six substitutions, and where each one occurs

| needle (canonical) | token | occurrences in Setup | occurrences in Timer |
|---|---|---|---|
| `gtt(0,110)` | `@TEMPO` | 1 | 1 |
| `local h={3,5,7}` | `@PULSES` | 1 | 0 |
| `glc(a,2,0,200,255,1)` | `@RINGC` | 1 | 0 |
| `glt(a,2,42)` | `@TRAIL` | 0 | 1 |
| `s:gms(0,128,34+d*2,0,0)` | `@CH`, `@NOTE` | 0 | 1 |
| `s:gms(0,144,34+d*2,100,0)` | `@CH`, `@NOTE` | 0 | 1 |

Four of the six knobs appear in exactly one event. That is precisely why test 5's separability
identity counts occurrences **per event**: a single cross-event count would be wrong for five of the
six knobs and would happen to be right for `@TEMPO`.

### The six knob value sets

| id | label | kind | token | values (display order) | default |
|---|---|---|---|---|---|
| `tempo` | Tempo | `speed` | `@TEMPO` | `240`, `180`, `140`, **`110`**, `90`, `70` | index 3 |
| `pulses` | Pulses | `count` | `@PULSES` | **`3,5,7`**, `2,3,5`, `5,9,13`, `3,8,11`, `4,8,16`, `7,11,17` | index 0 |
| `ringColour` | Ring colour | `colour` | `@RINGC` | **`0,200,255`**, `255,90,0`, `0,255,120`, `255,255,255`, `120,0,255` | index 0 |
| `trail` | Trail | `size` | `@TRAIL` | `21`, **`42`**, `64`, `100`, `150` | index 1 |
| `note` | Base note | `note` | `@NOTE` | `24`, `30`, **`34`**, `36`, `40`, `48`, `60` | index 2 |
| `channel` | MIDI channel | `amount` | `@CH` | **`0`** through `15` (sixteen) | index 0 |

The all-longest corner is `tempo="240" pulses="7,11,17" ringColour="255,255,255" trail="100"
note="24" channel="10"`. Note that the longest tempo, note and (equal-longest) trail values are not
the largest numbers — length is what the budget charges, not magnitude.

`kind` comes from the vendored compiler's own `KnobKind` union (D-12), not from a Lua-specific one.
`@CH` is the channel and it is the **first** argument of `self:gms(ch, cmd, p1, p2, mode)`, cited in
the file against `zona-docs/docs/ZONA_RECIPES.md:1058`.

### The recorded golden frames

```
euclid  tick    0   30 lit bytes  animating true
        tick   37   45
        tick  101   73
        tick  500  111
        tick 1009  111
```

30 lit bytes at tick 0 is the research's "15 pulse cells lit at boot" seen from the other side: the
marker colour is `255,90,0`, so each of the 3+5+7 generated cells contributes exactly two non-zero
bytes. `restsBlack: false` is therefore proved by the fixture rather than declared and hoped for.

---

## The `EXCLUDED_FROM_ROW` branch, and what it cost

**The conditional branch was taken: `src/lib/catalog/front-door.ts` exists** (Phase 4 shipped it), so
euclid was registered in `EXCLUDED_FROM_ROW` with a one-line `why`:

```ts
{ id: "euclid", why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog." },
```

**`front-door.spec.ts` needed no change at all — it still reports 8 passed.** Phase 4's partition test
derives every number it prints from the data (`${rowIds.length} in the row plus ${excludedIds.length}
excluded must be exactly the ${catalogIds.length} in CATALOG`) and asserts only the partition, so
there was no literal to update and none was touched. Its other guards stayed green for reasons worth
recording, because waves 5 and 6 will want to know:

- the per-row `preview === "padsim"` assertion iterates `FRONT_DOOR`, which euclid is not in;
- the motion and dark-pad tests derive from `src/lib/fidelity/golden-frames.json`, the nine-preset
  Phase 3 fixture, which has no euclid record and is filtered on presence
  (`CATALOG.filter((entry) => GOLDEN.presets[entry.id])`), so a Lua entry is invisible to them.

**The first Lua entry that actually joins the row will trip the second of those.** The row's
`preview === "padsim"` assertion is the line Phase 4/5.1 must revisit at that moment, and it is a
deliberate design decision rather than a repair.

---

## `lua-entries.spec.ts` — the CONT-02 gate, 6 tests

Six `it` blocks, no runner-level parameterisation, every one looping internally and naming the entry
and the event. Waves 5 and 6 change no count here. `await padReady()` runs once in `beforeAll`,
because `compressScript` throws and `checkSyntax` silently returns `false` before the formatter WASM
resolves — a gate without it would report every correct configuration as broken.

1. **Canonical form (D-11).** `compressScript(x) === x` on the **rendered** text of both events. The
   comment states in as many words why it must never be the template: `gtt(0,@TEMPO)` is not valid
   Lua and would fail for the wrong reason. The empty-Timer case needs no branch — `compressScript`
   of the empty string is the empty string — so MORPH arrives in wave 6 with no edit here.
2. **Budget.** `max(raw.length, await measureLua(raw)) <= EVENT_BUDGET`, with `EVENT_BUDGET` imported
   from the vendored `_pad`; `grep -c "908"` on the spec prints `0`. Also asserts `compressed <= raw`,
   and the failure message reports the free characters.
3. **Syntax.** `GridScript.checkSyntax` is `true` on both events.
4. **The restricted Lua subset (D-08).** Thirteen forbidden constructs, each carrying a reason rather
   than a preference, plus a whitelist check on every numeric-library call (`atan`, `sqrt`, `abs`,
   `max`, `min`, `floor`, `tointeger`). **Every needle is assembled from fragments at runtime and
   every explanatory comment paraphrases**, so the spec's own source contains none of the strings it
   rejects: `grep -c` prints `0` for both of the acceptance criteria's probes. Needles that begin
   with a name character are matched only at a token boundary, so the stream library's prefix is not
   found inside a local named `radio` and the operating-system library's is not found inside a call
   to the cosine.
5. **Token discipline.** Every knob's token occurs at least once across the two templates; no knob
   **value** contains an `@` followed by an upper-case letter (asserted on the values themselves,
   before any rendering, because such a value would leave a live token behind for the next knob's
   pass or be eaten by it); no live token survives rendering at the defaults; and the per-event
   separability identity holds for every single-knob variation.
6. **The cross-product.** The per-knob sweep, the all-longest corner and the all-shortest corner —
   `sum(values) + 2 = 47` combinations for EUCLID, asserted as that exact number, each canonical and
   in budget on both events, with the leftover-token check carried through the whole sweep rather
   than only the defaults.

**The `@` trap is handled.** The event marker is `--[[@cb]]`, so a plain "no `@` remains" check is
permanently red. The gate matches `/@[A-Z]/` instead; the token grammar is `^@[A-Z][A-Z0-9_]*$` and
`@cb` is lower case, so the two cannot collide.

**No fit ladder fired, and none exists.** Written as a comment in test 6, not an assertion: there is
no runtime ladder for Lua entries because the whole cross-product is proven at build time, which is
why TUNE-04's "we trimmed something" line can never fire for one of these cards. **That is the
Phase 5 seam.**

### Measured cost

Four consecutive runs: **914 ms / 896 ms / 887 ms / 1.75 s** wall, `tests` segment 366-378 ms. It
calls `compressScript` 94 times for EUCLID alone. **Far under the plan's 10-second threshold**, so
nothing is flagged for `docs/TESTING.md` in plan 08-07 on this axis. With seven entries present the
`tests` segment should still be comfortably inside a second or two; re-check at wave 6 rather than
assuming.

---

## `lua-smoke.spec.ts` — the execution gate, 3 tests

Three `it` blocks over one **memoised** simulation run per entry, because building a VM and running
218 ticks with a 243-record-per-tick layer sweep three times over would triple the cost for no extra
evidence.

The engine is assembled from `renderLua` + `new PadSim(blankPadState())` + `createLuaHost` rather
than through `createEngine`, for one reason: the pitfall-1 guard has to read raw layer records, and a
`SimEngine` deliberately exposes only the rendered frame. The Lua text and the wrapped simulator are
identical either way — it is the same construction `createLuaPadSim` performs.

**The scripted gesture, identical for every entry:** a press, six moves down the diagonal two ticks
apart, a lift, then a fast tap (firmware event 9) on a second contact — 18 ticks — followed by 200
further ticks. Coordinates are **fractions of `host.coordMax`**, not pixels, so an entry that unlocks
the hi-res range with `touch_x_max` is dragged across its whole pad instead of the bottom-left
eighth.

1. **Builds, and lights the pad under a finger.** Deliberately not "non-black immediately after
   Setup": a configuration whose only light is a touch response renders an all-zero frame until a
   finger arrives, and that is a legitimate design (MORPH and GHOST are exactly this shape). What is
   broken is a card that never lights at all. The rest-state question stays where it belongs, on
   `entry.restsBlack` against `frames.json`.
2. **Survives the gesture plus 200 further ticks, and plays.** No Lua error, `pendingTouches` back to
   0, and at least one MIDI message. An entry that plays nothing means the gesture did not exercise
   the instrument — fix the gesture, never the assertion.
3. **Pitfall 1 cannot recur.** Every layer record on every tick of the run.

### The per-entry MIDI table (test 2)

Reproduce it with `SMOKE_REPORT=1 npx vitest run --project server src/lib/sim/lua-smoke.spec.ts
--reporter=verbose`. The report is behind an environment flag so the quick suite stays quiet.

| entry | messages in 218 ticks | first three `(ch, cmd, p1, p2, mode)` |
|---|---|---|
| euclid | **76** | `(0,128,36,0,0)` `(0,144,36,100,0)` `(0,128,38,0,0)` |

That reads exactly as the research described the instrument: an unconditional note-**off** on 36
before the note-**on** on 36, so no track can hang, then straight into voice 2 on note 38. Notes
36 / 38 / 40 are kick / snare / hat by General MIDI convention, and they are `@NOTE + d*2` at the
default base of 34. 76 messages over 218 ticks is ~19 timer fires at the default 110 ms period, each
sending three note-offs plus a note-on per active step.

### Measured cost

Three consecutive runs: **506 ms / 643 ms / 1.12 s** wall, `tests` segment 52-124 ms.

---

## `frames.spec.ts`: the seam replaced, the fixture regenerated

`engineFor`'s body is now `return await createEngine(entry)`, the placeholder throw and its comment
are gone (`grep -c "no engine for preview"` prints `0`), and the two now-unused vendored imports were
dropped. **The five tests, their titles and their assertions are untouched, and the spec still reports
5 passed** — the count did not move when the seam was replaced, which is the whole point of the
`FrameSource` shape 08-01 chose.

Regeneration behaved exactly as documented: `UPDATE_FRAMES=1` rewrote the fixture, shelled out to
`npx prettier --write`, and **failed by design** with `Tests 1 failed | 4 passed (5)`. Re-run clean:
**5 passed**.

**The nine ported frame records are byte-identical to before the seam change.** Compared record by
record against a copy taken before regeneration:

```
ported records compared: 9   byte-identical: 9   changed: []
note identical: true   ticks identical: true
after entry count: 10 (includes euclid)
```

A changed ported hash would have meant the engine selector broke `PadSim`'s path rather than that a
preset moved. None did.

---

## Negative checks: three observed red, three reverted

`src/lib/catalog/entries/euclid.ts` was committed before any perturbation, so `git checkout --`
really restores and `git diff --quiet` really compares (08-01's lesson). After each revert
`git diff --quiet -- src/lib/catalog/entries/euclid.ts` exited **0**.

| # | Perturbation | Green exit | Red exit | Test that went red | Message |
|---|---|---|---|---|---|
| A | `@TRAIL`'s default value `"42"` given a trailing space, `"42 "` | **0** | **1** | `stores both events in canonical compressed form (D-11)` (test 1) | `AssertionError: euclid/timer: stored text is not a fixed point of the minifier, so cost() would charge the raw length and the budget meter would be lying...` |
| B | a 900-character `@RINGC` value added (`0,200,255+10` then `+0` 444 times — valid Lua, canonical, so the budget assertion is what fires and not the canonical one) | **0** | **1** | `stays canonical and in budget across the whole knob cross-product` (test 6) | `AssertionError: euclid/setup at ringColour="0,200,255+10+0+...": 1593 characters, -685 free of 908: expected 1593 to be less than or equal to 908` |
| C | `for a=0,80 do glt(a,2,65535)end` appended to EUCLID's Timer template | **0** | **1** (after the guard was corrected — see Deviations) | `never re-arms a keeper on a layer carrying a decaying trail` (test 3) | `AssertionError: euclid: hardware index 16, layer 2, at tick 11 holds timeout 65534 - a keeper written as 65535 and counted down since - together with rate 250. The trail will never die and the cell will strobe forever` |

**All six exit codes: 0, 1 / 0, 1 / 0, 1.**

Check A used a trailing space rather than a leading-zero value on purpose: the minifier certainly
removes the space, whereas a numeric literal may or may not survive unchanged, and a negative check
that might not go red is not a check.

**Check C is the one that earned its keep.** On its first run the perturbed configuration still
reported **3 passed** — the guard as the plan specified it could not fire. See Deviations.

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] EUCLID's description was 111 characters; the catalog gate caps it at 110**

- **Found during:** Task 8-04-01, before the first run.
- **Issue:** The plan specifies the description verbatim as _"Three Euclidean rings turn at their own
  speeds and beat against each other; tap any step to change the pattern."_ That string is **111**
  characters. `catalog.spec.ts` test 1 asserts
  `expect(entry.description.length, "${entry.id}: description fits a card").toBeLessThanOrEqual(110)`.
  As written, the plan's own entry could not pass the plan's own prerequisite gate.
- **Fix:** _"tap any step"_ became _"tap a step"_ — **109** characters, same meaning, still describing
  how the card feels to use rather than which compiler kind produced it. The metadata is otherwise
  exactly as specified.
- **Files modified:** `src/lib/catalog/entries/euclid.ts`
- **Commit:** `f5c8985`

**2. [Rule 1 - Bug] The pitfall-1 guard as specified can never fire: the LED engine decrements a
keeper on every tick**

- **Found during:** Task 8-04-03, running the plan's own negative check C.
- **Issue:** The plan specifies "assert that **no record ever holds `timeout === 65535` together with
  `fre >= 200`**". I implemented exactly that. With
  `for a=0,80 do glt(a,2,65535)end` appended to EUCLID's Timer — the precise bug the guard exists to
  catch — the spec reported **3 passed**. The reason is in the vendored engine: `grid_led_tick`
  decrements every non-zero timeout once per tick (`pad-sim.ts`, `if (L.timeout) { ...; L.timeout -= 1; }`).
  The host's `tick()` runs the Lua half and then `sim.tick()` **atomically**, so by the time any
  observer can read a layer record, a keeper written during that tick already reads 65534. An
  equality test on 65535 is unobservable by construction from outside the host. A guard that cannot
  go red is not a guard, and this one guards the bug that shipped in three drafts during research —
  the most valuable assertion in the phase would have been decorative.
- **Fix:** the signature became a **floor** rather than an equality:
  `timeout >= 65535 - 1024 && fre >= 200`. A keeper written at Setup still reads at least 65317 after
  the full 218-tick run, while the longest legitimate countdown anywhere in this phase is 150 ticks
  and the compiler clamps its own trails to 200 — so the floor discriminates with three orders of
  magnitude of margin in both directions. `65535` is still named in the file (and in the failure
  message, which now reports the observed timeout **and** explains it is a keeper counted down since)
  so the acceptance criterion's `grep -q "65535"` and the diagnostic both still hold. With the fix,
  negative check C went red naming the entry, hardware index 16, layer 2 and tick 11.
- **Files modified:** `src/lib/sim/lua-smoke.spec.ts`
- **Commit:** `b2d25e1`
- **Waves 5 and 6 inherit the corrected guard and need do nothing.** Anyone re-reading the plan
  should read this entry first.

### Not a deviation, recorded because the plan asked

**`front-door.spec.ts` required no change.** The plan permitted this task to update an exclusion-count
literal if Phase 4's first draft asserted one, and to name the old and new numbers here. Phase 4's
shipped spec asserts the **partition** and derives every number in its message from the data, so
there was no literal to update. The exclusion list went from one entry (`tpad`) to two
(`tpad`, `euclid`) and the spec stayed at **8 passed** without being touched.

### Environment note

The plan's task 8-04-01 acceptance criteria explicitly forbid a whole-suite run, because registering
the first `preview: "lua"` entry makes `frames.spec.ts` tests 1, 3 and 5 red until task 8-04-03
replaces the seam and regenerates the fixture. **That intermediate state was observed and is real**:
between commits `f5c8985` and `b2d25e1` the tree carried a catalog entry with no frame record and no
engine behind its preview kind. The per-file gates named in tasks 1 and 2 (`catalog.spec.ts` 10
passed, `front-door.spec.ts` 8 passed, `lua-entries.spec.ts` 6 passed, `npm run check`, `npm run
lint`) were green throughout, and the whole suite was run only after task 3.

---

## Verification

| Check | Result |
|---|---|
| `npx vitest run --project server src/lib/catalog/lua-entries.spec.ts` | 1 file, **6 passed**, 887-914 ms |
| `npx vitest run --project server src/lib/sim/lua-smoke.spec.ts` | 1 file, **3 passed**, 506-643 ms |
| `npx vitest run --project server src/lib/catalog/frames.spec.ts` | 1 file, **5 passed** (count unmoved) |
| `npx vitest run --project server src/lib/catalog/catalog.spec.ts` | 1 file, **10 passed** |
| `npx vitest run --project server src/lib/catalog/front-door.spec.ts` | 1 file, **8 passed** |
| `npx vitest run --project server src/lib/fidelity/lua-parity.spec.ts` | 1 file, **5 passed** |
| `config-shape.spec.ts` + `vendored-diff.spec.ts` + `front-door.spec.ts` | 3 files, **36 passed** |
| `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 41 556` | exit 0 (**41 / 556**) |
| `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9` | exit 0 |
| `npm run check` | 446 files, **0 ERRORS**, 0 warnings |
| `npm run lint` | exit 0 (Prettier left both Lua literals on one line each) |
| `git diff --stat HEAD -- src/vendor/` | prints nothing |
| `grep -c "  it(" lua-entries.spec.ts` / `lua-smoke.spec.ts` | `6` / `3`; `it.each` count `0` in both |
| `grep -c "908"` in `lua-entries.spec.ts` | `0`; `EVENT_BUDGET` imported instead |
| `grep -c` for the two forbidden literals in `lua-entries.spec.ts` | `0` / `0` |
| `grep -c "id:" euclid.ts` / `grep -c "money"` / `grep -q "ZONA_RECIPES"` | `7` / `0` / exit 0 |
| `grep -q "createEngine"` / `grep -c "no engine for preview"` in `frames.spec.ts` | exit 0 / `0` |
| `frames.json` shape | 10 entries incl. `euclid`; ticks `0,37,101,500,1009` |
| Repository clean of scratch files after the throwaway checks | confirmed (`git status --short` shows only the plan's own files) |

---

## The recipe for waves 5 and 6

Follow this and nothing needs re-deriving. Every step below was executed for EUCLID.

1. **Take the canonical Lua from `08-RESEARCH.md`** and pass it through `compressScript` **once**,
   storing the result. The research text is a starting point, not a guarantee: SONAR's printed Timer
   is known **not** to be canonical (`if s.v[n] then` minifies to `if s.v[n]then`, 280 raw to 279
   compressed). Every other printed candidate is canonical, but check rather than assume — test 1 is
   what tells you.
2. **Write the canonical strings to files and derive the template by substitution in a script**,
   never by retyping. Retyping ~700 characters of dense Lua by hand is how a needle goes wrong. Then
   assert each needle's occurrence count per event before you write the entry file.
3. **Create `src/lib/catalog/entries/<id>.ts`** with the GPLv3 header, the templates as
   single-line string literals, three to six knobs whose `kind` comes from the vendored `KnobKind`
   union, and `defaults` repeating each knob's default **index** keyed by knob id. Keep the
   description **at or under 110 characters** and one line. Ship comment-free Lua — the minifier does
   not strip comments and they are charged to the budget.
4. **Register it** in `src/lib/catalog/index.ts` (import, append to `CATALOG`, re-export) **and** in
   `EXCLUDED_FROM_ROW` in `src/lib/catalog/front-door.ts` with a one-line `why` (D-18). Skipping the
   second turns Phase 4's partition test red.
5. **Prove the round-trip before anything else.** A throwaway spec comparing `renderLua(ENTRY)` to
   the canonical strings, byte for byte. Delete it; do not commit it. If the lengths differ, a needle
   is wrong — fix the template, never the expected number.
6. **Run the per-file gates, not the suite**, until the frames fixture is regenerated:
   `catalog.spec.ts` (10), `front-door.spec.ts` (8), `lua-entries.spec.ts` (6),
   `npm run check 2>&1 | grep -Ei "0 errors"`, `npm run lint`. `frames.spec.ts` tests 1, 3 and 5 are
   expected red in this window.
7. **Regenerate the frames fixture:**
   `UPDATE_FRAMES=1 npx vitest run --project server src/lib/catalog/frames.spec.ts`. It rewrites,
   prettifies and then **fails by design**. Re-run without the flag and expect 5 passed. Read the new
   entry's `nonZeroBytes` row and make sure `restsBlack` agrees with it.
8. **Neither gate's count moves.** `lua-entries.spec.ts` stays at 6 and `lua-smoke.spec.ts` at 3
   forever; both loop internally. If either number changes, something was parameterised by the runner
   and should not have been.
9. **Re-measure the suite baseline first, then assert baseline plus delta** through
   `scripts/check-counts.mjs` (D-17). Never write an absolute total into a plan or a command.
10. **Watch a gate go red on purpose** for anything new the entry introduces. The three perturbations
    in this SUMMARY are reusable as-is: a trailing space in a default value (test 1), an oversized
    knob value (test 6), and an appended keeper loop (test 3).

---

## Notes for later plans

- **08-05, 08-06:** the Grid globals contract is 08-02's table plus bare `gmbs`, `gmms`, `gks` and
  the `self:` touch queue. `gln`, `gld` and `glx` are still unregistered and still raise (D-14): if a
  new configuration calls one, **register it in `lua-host.ts` with a test** rather than weakening the
  gate — an unlisted call raising is the property that makes a typo a failure instead of a card that
  looks subtly wrong forever.
- **08-05, 08-06:** the smoke gate requires **at least one MIDI message** per entry. A configuration
  that is purely visual will fail it. If one arrives, extend the scripted gesture to reach the
  instrument; if the entry genuinely sends nothing, that is a design conversation, not an assertion
  to relax.
- **Phase 4/5.1:** the first Lua entry that joins `FRONT_DOOR` must revisit `front-door.spec.ts`'s
  per-row `preview === "padsim"` assertion. It is the only line in that spec that a Lua card in the
  row would trip.
- **Phase 5:** there is **no runtime fit ladder for a Lua entry**. TUNE-04's "we trimmed something"
  line never fires for one, because the whole cross-product is proven at build time by
  `lua-entries.spec.ts` test 6.
- **08-07:** `docs/TESTING.md` can quote ~0.9 s for `lua-entries.spec.ts` and ~0.6 s for
  `lua-smoke.spec.ts` at one entry. Both grow linearly with the entry count; re-measure at wave 6.
- **Everyone:** re-measure the suite baseline. **41 / 556 (quick), 1 / 9 (sweep), 21 (e2e, carried
  unverified)** is what this plan left behind.

## Self-Check: PASSED

All three created files and all four modified files exist on disk. All three commits (`f5c8985`,
`5e230ec`, `b2d25e1`) are present in `git log`. No scratch file remains in the repository.

## Requirements

`requirements: [CONT-02, CONT-03, TUNE-01]` in the plan frontmatter is phase-level attribution, and
**none is marked complete here** — on 08-01's, 08-02's and 08-03's precedent. `.planning/REQUIREMENTS.md`
is unchanged by this plan.

- **CONT-02** ("**at least six** new configurations authored for spectacle are in the catalog, each
  fitting the 908/908 budget at its default knob positions and verified in the simulator") is **one
  sixth met**. EUCLID satisfies every clause of it — budget, simulator verification, the lot — but the
  requirement's own floor is six, and waves 5 and 6 author the rest. The plan that lands the sixth
  entry is the plan that marks this.
- **CONT-03** ("every catalog entry has a name, a one-line description, feel-based tags, a Featured
  flag and a default knob state") is satisfied **by EUCLID and by all nine ported entries**, and its
  gate — `catalog.spec.ts` tests 1, 7 and 8 — is green over all ten. It stays open because
  REQUIREMENTS.md assigns it to Phase 4 with Phase 8 owning the metadata gate for new entries, and
  every entry added in a later wave must still pass it.
- **TUNE-01** ("each configuration exposes three to six knobs ... using one shared widget
  vocabulary") now has its **data** for one entry: EUCLID's six knobs draw their `kind` from the
  vendored compiler's own `KnobKind` union, and a compile-time exhaustiveness check stops
  `npm run check` if that union ever gains a member `KNOB_KINDS` has not. The requirement is owned by
  Phase 5, which builds the widgets; the nine ported entries still carry `knobs: []` because
  compiler-driven knobs for a `PadState` card are Phase 5's, not this catalog's.

### One requirement this plan did NOT mark, and the reader should know why

`08-03-SUMMARY.md` nominated **PREV-02** ("the simulator consumes the exact compiler output — no
hand-authored animation anywhere") for whichever plan "lands the first Lua entry with a green frames
fixture". That is this plan, and **the condition is now objectively met**: EUCLID's golden frames are
rendered by a real Lua 5.4 VM executing the exact text that would be written to the module, over the
vendored LED engine, with the nine-preset parity gate green beside it.

It was **not** marked, for two reasons that a verifier can overrule in one command:
`PREV-02` is not in this plan's `requirements` frontmatter, and its traceability row assigns it to
Phase 4 with Phase 8 owning only the Lua-sourced half. Marking a requirement outside a plan's
declared scope risks a "Complete" that no later plan re-examines. **The evidence is above; the
decision belongs to the phase verifier.**
