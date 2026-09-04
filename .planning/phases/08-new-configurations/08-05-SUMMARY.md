---
phase: 08-new-configurations
plan: 05
subsystem: catalog
tags:
  [
    chorus,
    arc,
    ghost,
    lua,
    knobs,
    budget,
    canonical-form,
    golden-frames,
    pitfall-1,
    D-04,
    D-08,
    D-11,
    D-12,
    D-18,
  ]
requires:
  - "src/lib/catalog/ (08-01) - CatalogEntry, CATALOG, frames.json, frames.spec.ts, check-counts.mjs"
  - "src/lib/sim/lua-host.ts (08-02) - createLuaHost and the Grid API; glf, glim, glpfs, glt, glag, gtt and self:gms were all already registered"
  - "src/lib/sim/engine.ts + lua-pad-sim.ts (08-03) - createEngine, renderLua"
  - "src/lib/catalog/lua-entries.spec.ts + src/lib/sim/lua-smoke.spec.ts (08-04) - the CONT-02 gate, unchanged"
  - "src/lib/catalog/front-door.ts (Phase 4) - EXCLUDED_FROM_ROW"
provides:
  - "src/lib/catalog/entries/chorus.ts - CHORUS, nine diatonic triads with a per-press bloom, six knobs"
  - "src/lib/catalog/entries/arc.ts - ARC, a drawable triangle LFO that keeps modulating after lift, five knobs"
  - "src/lib/catalog/entries/ghost.ts - GHOST, a 50 Hz gesture looper with replay, five knobs"
  - "frames.json now covers thirteen entries; the ten previous records are byte-identical"
affects:
  - "Wave 6 (plan 08-06): three more entries through the same unchanged gate; CONT-02's floor of six is then cleared"
  - "Phase 4's front-door row: chorus, arc and ghost joined EXCLUDED_FROM_ROW, so FRONT_DOOR is byte-identical to what Phase 4 left"
tech-stack:
  added: []
  patterns:
    - "Canonical Lua and its substitution table extracted from the PLAN by script, never retyped - the templates are derived, so a needle cannot be mistyped"
    - "Knob value sets designed against the arithmetic of the corner bound: each set's longest value is chosen so the all-longest corner lands on the planner's measured number"
key-files:
  created:
    - src/lib/catalog/entries/chorus.ts
    - src/lib/catalog/entries/arc.ts
    - src/lib/catalog/entries/ghost.ts
  modified:
    - src/lib/catalog/index.ts
    - src/lib/catalog/front-door.ts
    - src/lib/catalog/frames.json
decisions:
  - "Every needle in the plan's three substitution tables matched the canonical text exactly once, in the expected event - no drift between 08-RESEARCH.md and the plan"
  - "GHOST's Timer renders 333 and not the research's 331, and the difference is exactly the two characters of @CCX+1 in place of the literal 17 - proved by substituting 17 back and comparing byte for byte"
  - "front-door.spec.ts needed no change for the second wave running: its partition is derived from data, so three more exclusions cost nothing"
  - "ARC's two legitimate glt(a,2,65535) keepers did not trip the pitfall-1 guard, exactly as the corrected floor-plus-rate signature predicted"
metrics:
  duration: 22 min
  tasks: 3
  files: 6
  completed: 2026-09-04
---

# Phase 8 Plan 05: CHORUS, ARC and GHOST Summary

Three more configurations authored for HANGAR went through the wave-4 gate without the gate moving a
line — a nine-chord pad whose every press blooms outward from the cell you hit, a modulation LFO you
draw with a finger and whose swirl speed *is* the rate, and a gesture looper whose ghost retraces
your path forever in a colour that is not your hand's. All three are canonical Lua, in budget across
their whole knob cross-product, inside the restricted subset, executing through a real gesture, and
recorded into golden frames. The catalog holds four hand-authored entries and thirteen entries in
all, and `npm run test:quick` reports exactly the totals plan 08-04 left behind.

---

## The measured baseline, re-measured

Measured on this machine, on this tree, at commit `ee0d6da`, **before this plan touched anything**:

```
npm run test:quick
 Test Files  41 passed (41)
      Tests  556 passed | 1 todo (557)
```

**BASE_FILES = 41, BASE_TESTS = 556** — identical to what `08-04-SUMMARY.md` recorded. Nothing
landed in between.

### Totals observed AFTER this plan

```
npm run test:quick   ->  41 files, 556 passed | 1 todo (557)
npm run test:sweep   ->   1 file,    9 passed
```

**Baseline plus a delta of no files and no tests**, which is the point of the wave: the gates loop
over the catalog internally, so a green run means the same thing before and after three
configurations were added. Verified through the helper:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 41 556   -> exit 0
npm run test:sweep 2>&1 | node scripts/check-counts.mjs 1 9      -> exit 0
```

**`npm run test:e2e` was not run, and `BASE_E2E = 21` is carried forward unverified.** This plan adds
no route and no component, and the one application consumer of the catalog iterates `FRONT_DOOR`,
which is byte-identical to what Phase 4 left because all three entries went into
`EXCLUDED_FROM_ROW`. The rendered site is unchanged. **Plan 08-06 should re-measure 41 / 556, 1 / 9
and 21 rather than inherit them.**

---

## The three configurations, measured

Every number below was reproduced in this repository, at the pin, by rendering the stored templates
through `renderLua` and comparing against the canonical text extracted from the plan.

| | Setup at defaults | Timer at defaults | all-longest corner | all-shortest corner |
|---|---|---|---|---|
| **CHORUS** | **729** (179 free) | **173** (735 free) | 733 / 174 | 726 / 173 |
| **ARC** | **379** (529 free) | **251** (657 free) | 382 / 253 | 376 / 250 |
| **GHOST** | **305** (603 free) | **333** (575 free) | 308 / 337 | 304 / 332 |

Every one is a fixed point of the pinned minifier (`compressScript(x) === x`) and `checkSyntax` is
`true` on both events of all three. The corners land exactly on the planner's measured numbers.

### Byte-identity with the canonical text

**Proved before anything else was written, and proved without retyping a character of Lua.** A
script extracted the six canonical strings and the sixteen substitution rows straight out of
`08-05-PLAN.md`'s fenced blocks and tables, applied each substitution and asserted its occurrence
count per event. A throwaway spec (created, run, deleted — it is not in the repository) then compared
`renderLua(ENTRY)` against those extracted strings:

```
CHORUS  setup rendered 729 canonical 729 identical true
        timer rendered 173 canonical 173 identical true
ARC     setup rendered 379 canonical 379 identical true
        timer rendered 251 canonical 251 identical true
GHOST   setup rendered 305 canonical 305 identical true
        timer rendered 333 canonical 331 identical false   <- deliberate
```

**Every needle in all three substitution tables was found exactly once, in exactly the event the plan
said, on the first attempt.** No needle was wrong and no expected number was touched. There is **no
drift between `08-RESEARCH.md` and the plan** for these three configurations — which is what the
plan's `<output>` asked to be told either way, and wave 6 can trust the same extraction method.

GHOST's Timer is the single deliberate exception, and the difference was pinned rather than assumed:
substituting the literal `17` back for the rendered `16+1` makes the rendered text byte-identical to
the research's 331-character string. The two extra characters are the whole of the difference.

### The occurrence table — where each token lives

| entry | needle (canonical) | token | Setup | Timer |
|---|---|---|---|---|
| CHORUS | `c[j+1]=48+t[d%7+1]` | `@KEY` | 1 | 0 |
| CHORUS | `local t={0,2,4,5,7,9,11}` | `@SCALE` | 1 | 0 |
| CHORUS | `glc(a,2,255,200,80,1)` | `@BLOOMC` | 1 | 0 |
| CHORUS | `*22//1,4,0)` | `@BLOOMRATE` | 1 | 0 |
| CHORUS | `s:gms(0,144,s.h[z][j],100,0)` | `@CH`, `@VEL` | 1 | 0 |
| CHORUS | `s:gms(0,128,s.h[o][j],0,0)` | `@CH` | 1 | 0 |
| CHORUS | `s:gms(0,128,s.h[z][j],0,0)` | `@CH` | 0 | 1 |
| ARC | `glc(a,2,0,110,255,1)` | `@SWIRLC` | 1 | 0 |
| ARC | `*41//1%256` | `@ARMS` | 1 | 0 |
| ARC | `glc(a,1,255,255,120,1)` | `@HEARTC` | 1 | 0 |
| ARC | `s:gms(0,176,16,glim(` | `@CH`, `@CC` | 0 | 1 |
| GHOST | `glc(a,1,0,255,180,1)` | `@RECC` | 1 | 0 |
| GHOST | `glc(a,2,255,80,255,1)` | `@GHOSTC` | 1 | 0 |
| GHOST | `if s.n<250 then` | `@LEN` | 0 | 1 |
| GHOST | `s:gms(0,176,16,x,0)` | `@CH`, `@CCX` | 0 | 1 |
| GHOST | `s:gms(0,176,17,127-y,0)` | `@CH`, `@CCX+1` | 0 | 1 |

The plan's warning about CHORUS's two look-alike note-off rows was real and both were applied:
`s.h[o]` releases the previous chord **in the Setup**, `s.h[z]` is the watchdog release **in the
Timer**. `@CH` therefore occurs twice in CHORUS's Setup and once in its Timer, and twice in GHOST's
Timer — which is exactly why `lua-entries.spec.ts` test 5 counts occurrences **per event**.

---

## The knob value sets

`kind` is drawn from the vendored compiler's own `KnobKind` union (D-12) in every case, never from a
Lua-specific one. `default` is an INDEX, and `defaults` repeats those indices by knob id.

### CHORUS — six knobs

| id | label | kind | token | values (display order) | default |
|---|---|---|---|---|---|
| `key` | Key | `note` | `@KEY` | `36`, `41`, `43`, `45`, **`48`**, `50`, `55`, `60` | index 4 |
| `scale` | Scale | `scale` | `@SCALE` | **`0,2,4,5,7,9,11`** (major), `0,2,3,5,7,8,10` (natural minor), `0,2,3,5,7,9,10`, `0,2,4,5,7,9,10`, `0,2,4,6,7,9,11`, `0,1,3,5,7,8,10` | index 0 |
| `bloomColour` | Bloom colour | `colour` | `@BLOOMC` | **`255,200,80`**, `255,60,0`, `0,255,200`, `120,0,255`, `255,255,255` | index 0 |
| `bloomSpeed` | Bloom speed | `speed` | `@BLOOMRATE` | `2`, **`4`**, `6`, `8`, `12` | index 1 |
| `velocity` | Velocity | `amount` | `@VEL` | `40`, `70`, **`100`**, `127` | index 2 |
| `channel` | MIDI channel | `amount` | `@CH` | **`0`** through `15` | index 0 |

The plan asked for a natural minor alongside major and a bloom rate from a slow 2 to a fast 12; both
are there, with four more modes for free because every seven-note table is fourteen characters wide
and therefore costs nothing at any corner. The sweep is `8+6+5+5+4+16 + 2 = 46` combinations.

### ARC — five knobs

| id | label | kind | token | values (display order) | default |
|---|---|---|---|---|---|
| `swirlColour` | Swirl colour | `colour` | `@SWIRLC` | **`0,110,255`**, `255,40,120`, `0,255,140`, `180,0,255`, `255,255,255` | index 0 |
| `arms` | Arms | `count` | `@ARMS` | **`41`** (one arm), `82` (two), `123` (three) | index 0 |
| `heartColour` | Heart colour | `colour` | `@HEARTC` | **`255,255,120`**, `255,255,255`, `255,90,0`, `0,255,255`, `255,0,120` | index 0 |
| `cc` | CC number | `amount` | `@CC` | `1`, **`16`**, `20`, `74`, `102` | index 1 |
| `channel` | MIDI channel | `amount` | `@CH` | **`0`** through `15` | index 0 |

Sweep: `5+3+5+5+16 + 2 = 36` combinations.

### GHOST — five knobs

| id | label | kind | token | values (display order) | default |
|---|---|---|---|---|---|
| `recordColour` | Recording colour | `colour` | `@RECC` | **`0,255,180`**, `0,200,255`, `255,140,0`, `120,255,0`, `255,255,255` | index 0 |
| `ghostColour` | Ghost colour | `colour` | `@GHOSTC` | **`255,80,255`**, `255,140,0`, `0,200,255`, `180,255,255`, `255,255,255` | index 0 |
| `loopLength` | Loop length | `size` | `@LEN` | `60`, `120`, `180`, `220`, **`250`** | index 4 |
| `cc` | CC pair | `amount` | `@CCX` | **`16`**, `20`, `74`, `102` | index 0 |
| `channel` | MIDI channel | `amount` | `@CH` | **`0`** through `15` | index 0 |

Every `@LEN` value is at or under 250, so the recorded table can never outgrow what the loop
replays, and every `@CCX` value leaves `@CCX+1` inside the 0..127 controller range. Sweep:
`5+5+5+4+16 + 2 = 37` combinations.

**Note on how the value sets were chosen.** They are not decorative. Because the separability
identity reduces the whole cross-product to the corners, the *length* of each knob's longest value is
what decides where the all-longest corner lands. Each set was designed so that corner is exactly the
planner's measured 733 / 174, 382 / 253 and 308 / 337 — and `lua-entries.spec.ts` test 6 then
measured it rather than trusting the arithmetic.

---

## Execution: the smoke gate's MIDI table

Reproduce with `SMOKE_REPORT=1 npx vitest run --project server src/lib/sim/lua-smoke.spec.ts
--reporter=verbose`.

| entry | messages in 218 ticks | first three `(ch, cmd, p1, p2, mode)` |
|---|---|---|
| euclid | 76 | `(0,128,36,0,0)` `(0,144,36,100,0)` `(0,128,38,0,0)` |
| **chorus** | **18** | `(0,144,48,100,0)` `(0,144,52,100,0)` `(0,144,55,100,0)` |
| **arc** | **109** | `(0,176,16,18,0)` `(0,176,16,31,0)` `(0,176,16,43,0)` |
| **ghost** | **218** | `(0,176,16,25,0)` `(0,176,17,102,0)` `(0,176,16,38,0)` |

Each row is the behaviour assertion the plan asked to be observed, read off a real Lua 5.4 VM:

- **CHORUS plays a chord, and it is the right chord.** The first three messages are note-ons for
  **48, 52, 55** at velocity 100 — C major, the first of the nine triads, exactly the harmony the
  research measured. 18 messages over the scripted drag is the note-on / note-off traffic of a finger
  sliding between pads with the watchdog releasing behind it.
- **ARC keeps modulating.** 109 messages is one CC per Timer fire across the whole 218-tick run —
  the Timer's period is 20 ms against a 10 ms tick — and the values climb (`18, 31, 43`), which is
  the triangle oscillator running. Crucially the count is *the full run*, not the gesture: the
  oscillator did not stop when the finger lifted, which is the entire product claim of the card.
- **GHOST's ghost really replays.** 218 messages is exactly two per Timer fire — the X and Y halves
  of the CC pair, `16` and `17` — sustained for the whole run including the 200 settle ticks after
  the lift. A recorder that stopped at the lift would have produced a fraction of that.

All three: no Lua error, `pendingTouches` back to 0, and **ARC's two legitimate `glt(a,2,65535)`
keepers did not trip the pitfall-1 guard**, exactly as 08-04's corrected floor-plus-rate signature
predicted — the swirl's rate is 4 at rest and at most `glim(r//2,1,120)` under a finger, three orders
of magnitude below the guard's `fre >= 200` half. That reasoning is written into `arc.ts` where the
next reader will look, and `grep -c "65535" src/lib/catalog/entries/arc.ts` prints `3`.

---

## The golden frames: thirteen entries

```
chorus  tick    0  198 lit bytes  animating true
        tick   37  198
        tick  101  198
        tick  500  198
        tick 1009  198

arc     tick    0  152 lit bytes  animating true
        tick   37  160
        tick  101  160
        tick  500  161
        tick 1009  162

ghost   tick    0    0 lit bytes  animating true
        tick   37    0
        tick  101    0
        tick  500    0
        tick 1009    0
```

Each row proves its entry's declared `restsBlack` rather than leaving it asserted:

- **CHORUS 198 lit bytes at every tick** is the blue/violet chessboard painted on layer 1 at phase
  255 from Setup — lit before any finger arrives, so `restsBlack: false`.
- **ARC 152 rising to 162** is the swirl armed at Setup with a continuous rate and a keeper, and the
  *changing* count between ticks is the rotation itself. `restsBlack: false`.
- **GHOST zero at every tick** is the design: both layers are coloured at Setup but left at phase 0,
  and `glc`'s sixth argument forces the minimum stop black, so a sampler that never touches reads an
  all-zero frame. `restsBlack: true`, and `frames.spec.ts` test 5 is what turns that declaration into
  a checked fact.

### The three required checks on the regeneration

1. **The nine ported records are byte-identical to before.**
2. **EUCLID's record is byte-identical to before.**

Compared record by record against a copy taken before regeneration:

```
prior records compared: 10   byte-identical: 10   changed: []
note identical: true   ticks identical: true
after entry count: 13
```

A changed ported hash would have meant the engine selector broke `PadSim`'s path; a changed EUCLID
hash would have meant the Lua route moved under it. Neither did.

3. **Two consecutive regenerations are byte-identical.** Two `UPDATE_FRAMES=1` runs back to back
   produced files that `diff -q` reports identical. After committing the fixture a third
   regeneration was run and `git diff --quiet -- src/lib/catalog/frames.json` exited **0**, which is
   the acceptance criterion in its literal form (it can only be satisfied against a committed
   fixture, since the first regeneration necessarily differs from `HEAD`). Prettier collapsed the
   primitive `ticks` array onto one line, as documented; nothing was hand-formatted.

Regeneration behaved exactly as documented: `UPDATE_FRAMES=1` rewrote, shelled out to
`npx prettier --write`, and **failed by design** with `Tests 1 failed | 4 passed (5)`. Re-run clean:
**5 passed**.

---

## The negative check: observed red, reverted

| Perturbation | Green exit | Red exit | Tests that went red | Message |
|---|---|---|---|---|
| GHOST's record deleted from `frames.json` | **0** | **1** | `covers every catalog entry, and only catalog entries` (test 1), plus tests 2, 3 and 5 | test 1's diff names the missing id: `-   "ghost",`; test 2 then reports `AssertionError: ghost: sample count: Target cannot be null or undefined` |

**Both exit codes: 0 and 1.** Test 1 is the one the plan named and it went red naming `ghost`, as
specified. Three further tests went red alongside it, which is correct and worth recording: a missing
record is not a single-assertion failure, it is a hole every downstream test falls into. `frames.json`
was committed before the perturbation (08-01's lesson), so `git checkout --` really restored it —
`git diff --quiet -- src/lib/catalog/frames.json` exited **0** afterwards and the spec was **5
passed** again.

---

## The `EXCLUDED_FROM_ROW` branch

**The conditional branch was taken: `src/lib/catalog/front-door.ts` exists**, so all three entries
were registered in `EXCLUDED_FROM_ROW` with the same one-line `why` euclid carries:

```ts
{ id: "chorus", why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog." },
{ id: "arc",    why: "..." },
{ id: "ghost",  why: "..." },
```

**`front-door.spec.ts` needed no change and no literal was touched — it still reports 8 passed.**
There was no exclusion-count literal to update: Phase 4's partition test derives every number it
prints from the data and asserts only the partition. The exclusion list went from two entries
(`tpad`, `euclid`) to five. `FRONT_DOOR` itself is byte-identical to what Phase 4 left.

Two of its other guards deserve a note for wave 6, because GHOST is the first entry in the catalog
that rests black besides `tpad`:

- the "only dark preset" and `restsBlack`-versus-derived-motion assertions both range over
  `src/lib/fidelity/golden-frames.json`, the **nine-preset Phase 3 fixture**, and are filtered on
  presence. GHOST has no record there, so it is invisible to them and `tpad` is still the only dark
  preset by that spec's reckoning. That is correct, not a gap: the Lua entries' darkness is gated by
  `frames.spec.ts` test 5 against `frames.json`, which is the fixture that actually records them.
- the per-row `preview === "padsim"` assertion still stands untouched, and remains the one line
  Phase 4/5.1 must revisit when the first Lua entry actually joins the row.

---

## Deviations from Plan

**None.** The plan executed exactly as written. Every canonical string, every needle, every occurrence
count, every rendered length and every corner reproduced the planner's measurement on the first
attempt, including GHOST's deliberate 333. No gate was edited, no spec file was touched, no knob
value had to be rewritten to fit, and no auto-fix rule fired.

Two things worth recording that are *not* deviations:

- **No Grid global had to be registered.** ARC calls `glf` (the rate-only setter) and `glim`; CHORUS
  calls `math.sqrt`; ARC calls `math.atan` with two arguments. All were already in 08-02's host and
  all are inside `lua-entries.spec.ts`'s numeric-library whitelist, so 08-04's note about `gln`,
  `gld` and `glx` did not come into play. Nothing in `src/lib/sim/lua-host.ts` changed.
- **No description hit the 110-character cap.** EUCLID needed a word trimmed in wave 4; this wave's
  three came in at 96 (CHORUS), 106 (ARC) and 103 (GHOST) characters, each checked before the file
  was written.

---

## Verification

| Check | Result |
|---|---|
| `npx vitest run --project server src/lib/catalog/lua-entries.spec.ts` | 1 file, **6 passed** (count unmoved from 08-04) |
| `npx vitest run --project server src/lib/sim/lua-smoke.spec.ts` | 1 file, **3 passed** (count unmoved) |
| `npx vitest run --project server src/lib/catalog/frames.spec.ts` | 1 file, **5 passed** |
| `npx vitest run --project server src/lib/catalog/catalog.spec.ts` | 1 file, **10 passed** |
| `npx vitest run --project server src/lib/catalog/front-door.spec.ts` | 1 file, **8 passed**, unedited |
| `npx vitest run --project server src/lib/fidelity/lua-parity.spec.ts` | 1 file, **5 passed** |
| `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 41 556` | exit 0 (**41 / 556 | 1 todo**) |
| `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9` | exit 0 |
| `npm run check` | 449 files, **0 ERRORS**, 0 warnings |
| `npm run lint` | exit 0 |
| `git diff --stat HEAD -- src/vendor/` | prints nothing |
| `git diff --stat HEAD -- src/lib/catalog/*.spec.ts src/lib/sim/*.spec.ts` | prints nothing — no spec file was modified in this plan |
| `ls src/lib/catalog/entries/*.ts \| wc -l` | `5` — `ported` plus `euclid`, `chorus`, `arc`, `ghost` |
| `grep -c "65535" src/lib/catalog/entries/arc.ts` | `3` — the keeper is explained where it lives |
| `frames.json` shape | **13 entries**, names all four hand-authored ones; ticks `0,37,101,500,1009` |
| Repository clean of scratch files | confirmed — `git status --short` shows only the plan's own files at every commit |

---

## Notes for wave 6

- **The extraction method works; use it.** Pulling the canonical Lua and its substitution table out
  of the PLAN's own fenced blocks and markdown tables by script, then asserting each needle's
  occurrence count per event before writing the entry file, caught nothing this time because there
  was nothing to catch — but it made "a needle was mistyped" structurally impossible, which is the
  failure mode 08-04's recipe warns about hardest. The script lived in the scratchpad, not the repo.
- **Design the knob value sets against the corner arithmetic.** The all-longest corner is decided by
  the *length* of each knob's longest value multiplied by that token's occurrences in that event.
  Working backwards from the planner's measured corner is how all three landed on it exactly.
  Fourteen-character scale tables and two-character note numbers cost nothing at any corner.
- **SONAR's printed Timer is known NOT to be canonical** (`if s.v[n] then` minifies to
  `if s.v[n]then`, 280 raw to 279 compressed) — 08-VALIDATION.md says so and it is the one place
  where the research text as printed would go red on test 1. Carry the canonical text, not the
  printed one. Every other candidate in this wave was canonical as printed.
- **MORPH's empty Timer needs no special case** anywhere: `compressScript("") === ""` and
  `checkSyntax("") === true`, and `lua-entries.spec.ts` test 1's comment already says so.
- **MORPH will be the second entry that rests black.** GHOST is the first, and it went through
  `frames.spec.ts` test 5 with no adjustment. Expect the same.
- **Both gate counts are still 6 and 3**, and `catalog.spec.ts` is still 10 and `front-door.spec.ts`
  still 8. If any of those move in wave 6, something was parameterised by the runner and should not
  have been.
- **Gate cost at four entries:** `lua-entries.spec.ts` 2.37 s / 2.40 s wall over two runs, `tests`
  segment 961-984 ms — up from ~0.9 s at one entry, because its sweep now measures
  `47 + 46 + 36 + 37 = 166` knob combinations, two events each. `lua-smoke.spec.ts` 1.62 s / 655 ms,
  `tests` segment 108 ms-1.0 s. Both are still far under the 10-second threshold 08-04 set for
  flagging in `docs/TESTING.md`; re-measure at seven entries in plan 08-07, where roughly 4 s for
  `lua-entries.spec.ts` should be expected.
- **Re-measure the suite baseline. 41 / 556 (quick), 1 / 9 (sweep), 21 (e2e, carried unverified)** is
  what this plan left behind — unchanged from 08-04, which is the whole point of the wave.

## Self-Check: PASSED

All three created files and all three modified files exist on disk. All three commits (`f490258`,
`448d4d6`, `c8c5e0d`) are present in `git log`. No scratch file remains in the repository.

## Requirements

`requirements: [CONT-02, CONT-03, TUNE-01]` in the plan frontmatter is phase-level attribution, and
**none is marked complete here** — on the precedent of 08-01 through 08-04. `.planning/REQUIREMENTS.md`
is unchanged by this plan.

- **CONT-02** ("at least six new configurations authored for spectacle are in the catalog, each
  fitting the 908/908 budget at its default knob positions and verified in the simulator") is now
  **four sixths met**. CHORUS, ARC and GHOST each satisfy every clause of it, but the requirement's
  own floor is six and wave 6 authors the remaining three. **The plan that lands the sixth entry —
  08-06 — is the plan that marks this.**
- **CONT-03** is satisfied by all thirteen entries and its gate (`catalog.spec.ts` tests 1, 7 and 8)
  is green over all of them. It stays open because REQUIREMENTS.md assigns it to Phase 4 with Phase 8
  owning the metadata gate for new entries.
- **TUNE-01** now has its data for four entries: sixteen knobs across CHORUS, ARC and GHOST, every
  `kind` drawn from the vendored compiler's own `KnobKind` union. The requirement is owned by Phase
  5, which builds the widgets.
