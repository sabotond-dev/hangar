---
phase: 11-bench-corrections
plan: 06
subsystem: catalog
tags: [catalog, presets, knobs, divergence, bench, midi, budget]
requires:
  - phase: 11-bench-corrections
    plan: 05
    provides: "src/lib/catalog/presets.ts - HANGAR's ownership of the nine preset VALUES, the empty INTENDED_DIVERGENCE record proved by three planted negatives, and the PREV_FILES 84 / PREV_TESTS 843 / PREV_E2E 103 / BASE_CHECK 579 / sweep 4 19 baseline"
  - phase: 11-bench-corrections
    plan: 04
    provides: "the bloom/disturb standing rule, the class-A decay fix behind STARFIELD's stuck colour, and the class-B +7 that makes this plan's cost table disagree with the one it was given"
provides:
  - "AURORA, PINWHEEL and STARFIELD send an xy stream with fingers = first, measured 415 / 477 / 403 of 908 setup and proved not to move a single frame hash"
  - "NINE PADS carries an appended Pads knob at 9 and 16 zones, so 4x4 is selectable; the requested option is 30 characters CHEAPER than the default it replaces"
  - "JOYSTICK rests lit at cell 40 from power-on, recorded as a reversal of the shipped bottom-centre argument with what the reversal costs on the Y axis stated"
  - "src/lib/catalog/divergence.ts: INTENDED_DIVERGENCE moved out of a spec file and spent for the first time, at seventeen rows read by THREE gates"
  - "11-04's bloom/disturb standing rule is now a GATE rather than a header comment, after the gap was measured rather than assumed"
  - "The JOYSTICK trail refused with evidence: comet costs the parked dot AND the power-on cell, and the card measures ZERO lit bytes at rest"
affects: [11-07, 11-16]
tech-stack:
  added: []
  patterns:
    - "A declared-divergence record as a plain module rather than a spec const, so three gates read one table instead of three copies of it"
    - "An allowance that COMPARES FIRST and consults the record only on a disagreement, with both sides counted, so a record that grew to excuse everything cannot pass as a comparison"
    - "A standing rule written above the record it would otherwise be laundered through, after measuring that declaring the divergence was enough to land it"
key-files:
  created:
    - src/lib/catalog/divergence.ts
  modified:
    - src/lib/catalog/presets.ts
    - src/lib/catalog/presets.spec.ts
    - src/lib/catalog/catalog.spec.ts
    - src/lib/catalog/frames.spec.ts
    - src/lib/catalog/frames.json
    - src/lib/catalog/listing.ts
    - src/lib/catalog/front-door.ts
    - src/lib/tune/knobs.preset.ts
    - src/lib/tune/knobs.preset.spec.ts
    - e2e/fidelity.e2e.ts
    - src/routes/dev/fidelity/+page.svelte
key-decisions:
  - "The plan's cost table is the PRE-11-04 one for the THIRD wave running. Measured 415 / 477 / 403 against its 408 / 463 / 396, and the delta is +165 rather than +158 because 11-04's class-B guard lands on the LIVE arm that only an enabled sends reaches."
  - "The JOYSTICK trail is a FINDING and did not ship. sendsInit emits the power-on lit cell only when springLed returns glow, and touch.kind = comet makes it return comet - so the trail costs the very thing the same bench note's first clause asks for, and the card measures ZERO lit bytes at rest."
  - "invertY was deliberately NOT flipped alongside springTo, against the plan. springRestCell never reads invert once springTo is centre, so the pairing saves 4 characters and reverses a second decision nobody mentioned."
  - "The 4x4 picture is a fifth of the light: 162 lit bytes against 32, because four does not divide nine and the compiler lights one marker cell per zone instead of tiling. It ships as selectable and the numbers are pinned in the spec."
  - "INTENDED_DIVERGENCE moved out of presets.spec.ts into a plain module, because catalog.spec.ts and frames.spec.ts both hold a HANGAR value against a vendored one and a spec file cannot be imported by another spec file without its describes registering twice."
  - "11-04's bloom/disturb rule became a real assertion after the gap was MEASURED: the planted bloom was caught as undeclared, and presets.spec.ts went fully green the moment a row was written for it and the cost refreshed."
patterns-established:
  - "When a plan pairs two field changes, check whether the second one is load-bearing for the ask: springTo alone reaches cell 40 and invertY never enters the arithmetic"
requirements-completed: []
duration: 0h 55m
completed: 2026-09-09
---

# Phase 11 Plan 06: Four of the Five Bench Notes, and the Fifth Measured Rather Than Trimmed — Summary

**AURORA, PINWHEEL and STARFIELD send an xy stream at 415, 477 and 403 of 908, with every frame hash
unmoved. NINE PADS gains an appended Pads knob and the requested 4x4 is 30 characters CHEAPER than the
3x3 it can replace — and lights a fifth as many cells, which the spec now pins rather than leaves for a
bench to discover. JOYSTICK rests lit in the middle of the pad from power-on, recorded as a reversal of
the shipped design argument with what it costs on the Y axis stated. THE TRAIL DID NOT SHIP, and the
reason is measured: the compiler emits the power-on lit cell only for `glow`, so `comet` buys a trail by
spending the very thing the same bench note's first clause asks for, and JOYSTICK measures ZERO lit
bytes at rest. Seventeen declared divergences, four negative checks, and 11-04's standing rule turned
from a header comment into a gate after the hole was measured.**

## Performance

- **Duration:** ~55 m
- **Tasks:** 2 of 2
- **Files:** 1 created, 10 edited
- **Commits:** `73872f5`, `849eac3`

---

## Counts, as carried name plus delta

| Name           | Carried                | Declared | Observed                     | Agreement |
| -------------- | ---------------------- | -------- | ---------------------------- | --------- |
| quick files    | `PREV_FILES` 84        | **+0**   | **84**                       | agrees    |
| quick tests    | `PREV_TESTS` 843       | **+1**   | **844** (+1 todo)            | agrees    |
| e2e            | `PREV_E2E` 103         | **+0**   | **103**, **run**             | agrees, see the flake note |
| sweep          | `4 19`                 | +0       | **4 19**                     | agrees    |
| `svelte-check` | `BASE_CHECK` 579       | —        | **580**, 0 ERRORS 0 WARNINGS | **+1**    |
| catalog        | 27 (9 preset + 18 Lua) | +0       | **27**, untouched            | agrees    |
| reachability Pass A | 19,502            | moves    | **20,782**                   | **+1,280**, expected |

`node scripts/check-counts.mjs 84 844` exited **0**, run twice — once after the first build and once
after the last. `node scripts/check-counts.mjs 4 19` exited **0** twice. `npm run lint` clean at both
task boundaries; `npm run build` exit **0** four times; `npm run check` **580 FILES 0 ERRORS 0
WARNINGS**.

**The +1 is the whole delta and it splits with nothing left over:** `knobs.preset.spec.ts` gained the
one test *"reaches 4x4 from an APPENDED NINE PADS knob, and says what 4x4 looks like"*, going 6 → 7.
Every other suite is flat. The `bloom` gate was deliberately folded into `presets.spec.ts` test 1's
existing walk rather than written as a test of its own, which is what kept the total at +1 while still
closing the hole.

**`svelte-check` is +1 and that is reported, not asserted:** one new file, `divergence.ts`.

**The reachability sweep's total MOVED, and a stationary one would have meant the knob was not
reachable.** Pass A 19,502 → 20,782, and the whole of the +1,280 is NINE PADS' own cross-product
doubling from 1,280 to 2,560. Over budget **0**, Pass B colours excluded **0**.

**No agent connected to or wrote to a device, nothing was deployed, and nothing here is claimed as
hardware-verified.** Every one of the five asks came from the user's bench and only their bench can
confirm the fix. **No sibling repository was read or written.**

---

## The five asks, before and after, at the worst knob position

Every figure is `cost(compile(state))` after `await padReady()` — `max(compressed, raw)` — and the
worst column is the reachability sweep's, over the whole knob cross-product rather than 908 minus the
default. That distinction is stated because plan 11-04 found four rows of `upstream-manifest.json`
making exactly that error.

| Ask | Change | Setup before | Setup after | Timer | Worst reachable | Free at worst | Plan said |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **AURORA** *"send MIDI"* | `sends.kind = "xy"`, `fingers = "first"` | 250 | **415** | 55 | 429 | **479** | 408 |
| **PINWHEEL** *"make this send MIDI"* | same | 312 | **477** | 55 | 486 | **422** | 463 |
| **STARFIELD** *"should send midi"* | same | 238 | **403** | 55 | 422 | **486** | 396 |
| **NINE PADS** *"selectable to 4x4"* | appended knob; 3x3 stays the default | 580 | **580** / **550** at 4x4 | 158 | 640 | **268** | 550 ✓ |
| **JOYSTICK** *"start from the middle"* | `sends.springTo = "centre"` | 542 | **543** | 24 | 551 | **357** | 532 |
| **JOYSTICK** *"trail or something"* | **NOT SHIPPED** — see below | 542 | *(478 / 479 if taken)* | 24 | — | — | 468 |

**Nothing came close to 908 and nothing needed trimming.** The dearest card in the catalog is still
`tpad` at 907 of 908, untouched by this plan.

### The plan's table disagrees, for the third wave running, and by a knowable amount

The plan lists 408, 463 and 396 against baselines of 250, 305 and 238 — the **pre-11-04** figures again,
which 11-05 already reported once. But the disagreement is not only the stale baseline: the plan's
implied delta is **+158** and the measured delta is **+165**, identically on all three cards. The extra
7 is 11-04's class-B fast-tap guard, which lands on the `LIVE` arm — a guard only an **enabled `sends`**
compiles. So a card that had no `sends` at all when the table was taken picks up 11-04's +7 on the day
it gains one. The plan's own +0 premise could not have predicted that, and the number is reported
rather than absorbed.

JOYSTICK's 532 → measured 543 splits the same way: +7 of stale baseline, and +4 because `invertY` was
deliberately not flipped (below). The trail's 468 → measured 478 is +7 of stale baseline and +3 more
that was not chased, because the option was refused on behaviour rather than on cost.

---

## `fingers`: the expensive reading, taken on purpose

The vendored default is **`"any"`, not `"each"`** as the plan states — `normalisePadState` resets
`fingers` to the default whenever `sends.kind` is `"none"` (`_pad.ts:1443-1447`), so all three cards
read `"any"` on the shelf.

Measured, all three policies, all three cards:

| card | `first` | `any` | `each` |
| --- | --- | --- | --- |
| aurora | **415** | 320 | 320 |
| pinwheel | **477** | 382 | 382 |
| starfield | **403** | 308 | 308 |

`"any"` and `"each"` cost **identically**; `"first"` costs **95 more** on every card, which is the
finger-claiming gate. So the plan's *"`each` is cheaper still"* is right about the direction and 7
characters out on the figures, and it understates the choice: **the cheaper option was the one not
taken, and it was not taken twice over.** Under `"any"` every contact writes the same CC pair, so a
second finger fights the first for one stream; `"first"` claims one contact and streams one position,
which is what a host expects from an XY pad and what the shelf itself already ships on RADAR and
JOYSTICK. The user asked for MIDI, not for a finger policy, so the conservative reading was bought at
95 characters a card with 422 to 486 still free at the worst knob position.

---

## `planLayers`, and the picture proved unmoved rather than argued

| card | before | after |
| --- | --- | --- |
| aurora | `sends:false, layer1:touch, layer2:look` | `sends:TRUE, layer1:touch, layer2:look` |
| pinwheel | same shape | same shape, `sends:true` |
| starfield | same shape | same shape, `sends:true` |

`sends` goes true and **no layer moves**, because an `xy` stream claims none. The plan asks for the
frame hashes to be checked *before* regenerating, and they were, twice over:

- A scratch probe sampled all five ticks through `PadSim` on both states: **byte-identical hashes and
  identical `nonZeroBytes` on all fifteen samples.**
- `frames.spec.ts` test 3 re-samples every catalog entry against the **committed** `frames.json` and was
  green with the change in place — which is the stronger statement, because it is the shipped tripwire
  rather than a probe.

**So `frames.json` was NOT regenerated in task 01**, on 11-04's own precedent: regenerating a tripwire
to identical content and reporting it as evidence is not evidence.

---

## NINE PADS: what "selectable" cost, and what 4x4 actually looks like

The knob is `id: "grid"`, `label: "Pads"`, `kind: "count"`, options `["9", "16"]`, default **0** — the
card still ships at 3x3, because the user asked for selectable and not for a different card.

**`count` and not a new vocabulary.** It is an existing member of the vendored `KnobKind` union
(PINWHEEL's arms knob already uses it), so nothing was invented; adding it to ninepads' `knobs` array is
two divergence rows (`knobs.length` and `knobs[4]`), which is exactly the case the plan anticipated.

**The options are `"9"` and `"16"` and not `"3x3"` and `"4x4"`, and the reason is the readout.**
`count` is not one of `view.ts`'s `WORD_KINDS`, so this knob renders as a rail; a rail prints
`integerReadout` when every option is a single integer and falls back to `positionText` — *"2 of 3"* —
when one is not. A literal grid string would have shipped the card's one new control as a positional
rail carrying no information. Nine and sixteen ARE the number of pads, on a card called Nine pads.

### The 4x4 picture is worse, with the frame as evidence

The plan asks for this to be looked at and said out loud if it is a regression. It is.

| grid | compiled zone paint | lit bytes at rest |
| --- | --- | --- |
| **3x3** | `for n=0,80 ... local zx,zy=n%9//3,n//9//3 if(zx+zy)%2==0 then glc(a,1,0,68,204,1) else glc(a,1,0,27,81,1) end glp(a,1,255)` — a checkerboard over **the whole pad** | **162** |
| **4x4** | `for n=0,80 ... if n%9%2==1 and n//9%2==1 then glp(a,1,255) else glp(a,1,0) end` — **one marker cell per zone**, sixteen dots | **32** |

Four does not divide nine, so the compiler cannot tile and falls back to a marker grid. The held-lit
behaviour follows: 3x3 repaints a whole zone (`for m=0,80 ... if q==o or q==z`), 4x4 lights a single
cell (`glp(glag(0,z%4*2+z//4*18+10),2,255)`). **A fifth of the light, and a different kind of picture.**
It ships because the marker grid is the honest answer for a grid that does not tile and because the user
asked for the option, and both figures are asserted in `knobs.preset.spec.ts` so a re-sync that changes
the marker layout goes red and so nobody meets it as a surprise.

**9x9 also compiles, at 307 of 908 — cheaper than either — and is deliberately not offered.**
Eighty-one zones is a different card rather than a position of this one. Adding it later is one entry in
`GRID_PADS`.

### "Appended, so existing links still decode" is true, and not for the reason the plan gives

The plan's standing rule says knob positions are stamp payload and warns that an inserted knob
re-points every existing link. **That is true of the eighteen hand-authored Lua entries and of none of
the nine.** `share/stamp.ts`'s `encodeFor` sends a `"padsim"` entry through the **vendored**
`encodeStamp` over the `PadState`; only a `"lua"` entry gets format `x` or `w`, whose payload is one
base-32 character per knob **by index**. So no shared NINE PADS link was ever at risk here, and
`sends.grid` was already an encoded field.

Appending is still right and the index assertion still earns its line — it is what makes "appended" a
fact — but the reason is documented in `knobs.preset.ts` so the next plan does not carry the caution
into a place it does not apply.

**One index DID move and it is harmless for that reason:** `presetKnobs` appends `brightness` by
construction, so ninepads' brightness went from index 4 to 5. Under the Lua route that would re-point a
link; under the state codec it is invisible. The spec asserts the whole rack order by id, and that
brightness is last.

**NINE PADS is now AT the six-knob ceiling** `knobs.preset.spec.ts` test 1 enforces. A seventh knob on
this card turns test 1 red, which is the intended conversation.

**The fast tap is untouched and is not claimed as fixed.** `lua-smoke.spec.ts` still reports
`ninepads: fast tap 0, slow tap 2`, before and after, exactly as 11-04 classified it and 11-05
re-measured it across eight value variants. The 4x4 ask and that defect are independent and this plan
closed one of them.

---

## JOYSTICK: the rest position shipped, and the trail refused with evidence

### The reversal

`sends.springTo = "centre"` moves `springRestCell` from **76** to **40** and `sendsInit` emits
`self.l=40 glp(glag(0,40),1,255)`, so the dot is lit in the middle of the pad from power-on. **542 →
543**, one character, because the parked CC literal goes from `0` to `64`.

**Recorded as a reversal.** The shipped mutator's argument is carried verbatim into `presets.ts` above
the change:

> *"The classic pitch/mod stick: the bend axis centres by definition, and the CC axis falls to zero like
> a mod amount. Up is more, like the fader cards, so the stick rests at the bottom-centre cell."*

**What the reversal costs, stated:** the Y axis no longer falls to zero on lift, so a held mod amount
now rests at **64** instead of 0. The `quiet` line moved with it, byte-equal in three files:

> *"Left-right is pitch bend and snaps back straight. Up-down is a mod amount that returns to the middle
> on lift."* (109 characters)

**Per-axis spring is NOT reachable, checked rather than assumed.** `SpringTo` is a single field on the
state — `_pad.ts:209`, `"centre" | "zero"`, read at `_pad.ts:312` — so *"centre on the bend axis, zero
on the CC axis"* would need a compiler change to the emitted shape, which D-02 does not grant here. The
plan asked for this to be reported either way; the answer is no.

### `invertY` was NOT flipped, against the plan

The plan pairs `springTo = "centre"` with `invertY = false`. Read at `_pad.ts:599-607`, `springRestCell`
**never reads `invert` once `springTo` is `"centre"`** — both axes return 4 on the earlier branch. So
flipping it contributes nothing to the ask and reverses a **second** decision the user did not mention:
"up is more". Measured: **543** with `invertY` true, **539** with it false. The extra 4 characters are
the price of not changing something nobody asked to change, out of 357 free at the worst knob position.

### The trail: a finding, not a failure

`touch.kind = "comet"` is one field and it does not ship. The two halves of one bench note fight each
other at one line of the compiler:

```
_pad.ts:1951   if (s.sends.kind === "xy" && springLed(s, plan) === "glow") {
_pad.ts:1955     const cell = springRestCell(s);
                 out.push(`self.l=${cell}`, `glp(glag(0,${cell}),1,255)`);
```

`springLed` returns `"comet"` the moment `touch.kind` is `"comet"` (`_pad.ts:1932-1934`), so the
power-on lit cell is **not emitted at all**, and the `glow` case's parked dot becomes a one-shot
decaying pulse at cell 40 on lift. Measured over five sampled ticks with no finger on the pad:

| joystick variant | setup | rest cell | `springLed` | `self.l=` emitted | lit bytes at rest |
| --- | --- | --- | --- | --- | --- |
| as shipped | 542 | 76 | glow | yes | **2** |
| **centre (shipped here)** | **543** | **40** | glow | yes | **2** |
| centre + `invertY:false` | 539 | 40 | glow | yes | 2 |
| comet alone | 478 | 76 | comet | **no** | **0** |
| centre + comet | 479 | 40 | comet | **no** | **0** |

**The trail makes JOYSTICK a black square** — which is the exact property `front-door.ts` cites for
keeping `tpad` out of the row entirely. It would also flip `restsBlack`, move `motion` to `"dark"` and
put the card outside the front-door row, for a bench note that asks to *improve* the visual aspect.
Cheaper, and cheaper is not the question.

**What IS reachable and keeps the dot**, costed in `presets.ts` for the user's next bench pass rather
than chosen for them: a look layer behind the stick — ripple **652**, shimmer **603**, wave **621**,
swirl **641** of 908, all animating, all fitting. That reverses the shipped *"Dark field, one glow dot"*
decision without being asked to, and it would move JOYSTICK's `motion` to `"animated"`, so it is a
decision for the user rather than for this wave.

### The residue numbers, from both sides

The plan asks for the research's **seven** to be stated beside 11-04's **zero**, and it is worth being
precise about what 11-04 actually measured, because it is not a preset-backed probe:

- The research measured a comet trail leaving **one permanent unit of residue per crossed cell**, 1 to 7
  of 255 depending on `trailMs`.
- 11-04 moved the decay start to `(256 - rate) * ticks` and re-derived the freeze column from
  `DECAY_TABLE` at **all twelve reachable `trailMs` values**: every row goes from a freeze of 1 to 7
  down to **0**, at **+0 characters**. It also moved `tests/pad-sim.test.js`'s expectation from
  `after.pha === 3` to `0`.
- **11-04 explicitly recorded that no probe measures preset-backed residue end to end**, because
  11-02-03's probe iterates `CATALOG.filter(source.kind === "lua")` and cannot reach a preset. It handed
  that gap to 11-16.

So the trade-off the research described **is** gone — the arithmetic and the vendored simulator test
both say zero — and it is gone by derivation rather than by a preset-backed measurement. This SUMMARY
says both, because "11-04 measured zero" is true of the decay and not of a preset probe.

**And it did not decide anything here.** The trail was refused on the power-on dot and the black pad,
not on residue. The ordering did turn a trade-off into a free win; it just was not the binding
constraint.

---

## `motion`, re-derived from the fixture rather than reasoned about

`frames.json` was regenerated in task 02. **Exactly five rows moved, all JOYSTICK, all `sha256` only:**

```
- "sha256": "875b0381d7b780b57eddf12596098bfd746adbdb3cf560c8597203cd35440507"
+ "sha256": "7ee5cbd714c2ed051a12a444ffa4a50d339d5422453ca3d84a40c6596ef69e8f"
  "nonZeroBytes": 2,
  "animating": false
```

`nonZeroBytes` stays **2** — one lit cell, at a different address — and **`animating` stays `false` at
all five ticks**. So:

- JOYSTICK's `motion` **does not move**. It is still `"static"` in `front-door.ts` and in `listing.ts`,
  and neither file's `motion` field was touched.
- The front door's *"the three quiet pads land on 2, 4 and 6"* geometry is **unchanged**, and the
  property `front-door.spec.ts` asserts — no two non-animated rows adjacent, including across the wrap —
  is unchanged with it. Wave 14's user-facing checkpoint can quote the same geometry.
- `restsBlack` is unchanged, so `listing.ts` and `frames.spec.ts`'s both-directions gate are unmoved.

`front-door.spec.ts` derives `motion` from `src/lib/fidelity/golden-frames.json`, which is sampled over
the **vendored** states and is therefore also unmoved. Both readings agree.

---

## Three gates needed the record, and one of them was not in the plan

`INTENDED_DIVERGENCE` moved out of `presets.spec.ts` into **`src/lib/catalog/divergence.ts`**, a plain
data module that imports nothing. It moved because two more gates hold a HANGAR value against a vendored
one, and **a spec file cannot be imported by another spec file without its `describe` blocks registering
twice**. The alternative was a hand-copied allowance list in each of three files, which is this phase's
warning 3 three times over.

| Gate | What broke | How it was answered |
| --- | --- | --- |
| `presets.spec.ts` | nothing; it reads the same table from its new home | seventeen rows; test 2's non-vacuous header assertion is untouched and still green |
| `catalog.spec.ts` | *"agrees with the vendored shelf on every ported name and description"* went red on three sentences | compares **all eighteen strings**, consults the record only on a mismatch, counts `compared` and `allowed` and asserts `allowed < compared` |
| `frames.spec.ts` | *"agrees with the Phase 3 tripwire on every ported entry"* went red on JOYSTICK | compares **all forty-five samples**, consults `stateDiverges` only on a disagreement, counts `compared` and `excused` |
| `e2e/fidelity.e2e.ts` | **not in the plan.** The browser probe went red at *"costSetupUsed: expected 250, received 415"* | the probe names its own preset, the e2e looks the fixture up by that name, and `stateDiverges` is asserted first |

**The compare-first shape is not rhetoric and the difference is measurable.** AURORA, PINWHEEL and
STARFIELD all carry declared `state.*` rows and all three still hash **identically** to Phase 3. A gate
that skipped every card with a declared row would have stopped comparing **thirty of the forty-five
samples** to buy the one it needed.

### The e2e collision, and a second staleness axis nobody has recorded

`src/routes/dev/fidelity/+page.svelte` compiles through `$lib/pad`, which 11-05 pointed at HANGAR's
nine, and `e2e/fidelity.e2e.ts` holds the result against `preset-baseline.json`, BOTOR's compiler's
output over BOTOR's states. This is 11-05's negative check 1b arriving from the browser: **a fidelity
gate that has been made vacuous does not go quiet, it goes red about the wrong thing** — here it accused
a WASM build of a fault that was a catalog decision.

The probe moved to **RADAR first, and RADAR failed too**, at *"expected 438, received 445"*. That is a
**second** axis nobody has written down: `preset-baseline.json` **predates plan 11-04** and was never
recaptured, so it is stale for the four presets the class-B fix moved by +7 — pinwheel 305 for a
compiler that emits 312, radar 438 for 445, joystick 535 for 542, faders 513 for 520.
`preset-baseline.spec.ts` stays green over those four only through its own intended-divergence
substitution, which the e2e has no access to. **DIAL is clean on both axes** — untouched by 11-04 and by
11-06, 646 / 55 on both sides — and is what the probe compiles now. The `stateDiverges` half is
mechanical; the 11-04 half is named in the file with the numbers, because it is not derivable from
anything the e2e can import.

---

## The `bloom` gap: measured, then closed

The plan says *"if nothing catches it, that is a gap this plan should close"*. Something caught it, and
not as the rule:

1. Planted `d.touch.kind = "bloom"` on joystick. **Three tests red** — `presets.spec.ts` test 1 at
   *"NOBODY DECLARED IT"*, test 4 at the cost, `frames.spec.ts` test 3 at the hash. Exit **1**.
2. Did what the failure message tells an author to do: wrote a divergence row for
   `state.touch.kind`, and updated the declared cost to the measured 491. **`presets.spec.ts`: 4
   passed. Exit 0.** Fully green, with a HANGAR preset selecting `bloom`.

So the record enforced *"say it out loud"* and **nothing at all enforced the rule**. A header comment is
not a gate, exactly as the plan suspected.

**Closed inside `presets.spec.ts` test 1's existing walk**, so the suite total stayed at +1: one
assertion, above the record on purpose, refusing `bloom` and `disturb` whether or not the divergence is
declared, with the residue measurement and the D-02 reasoning in its failure message and an instruction
for the phase that repairs the decay at its source. Re-planted afterwards and observed red on the new
line, exit **1**.

---

## The four negative checks, with exit codes

| # | Task | Check | Observed | Exit |
| - | ---- | ----- | -------- | ---- |
| 1 | 01 | `sends.kind = "xy"` on tpad + a divergence row — **the plan's instrument** | **Not what the plan predicts.** `normalisePadState` does NOT strip it; tpad becomes an xy card at **135** characters and test **4** goes red at *"expected 135 to be 902"*, not test 2 | **1** |
| 1b | 01 | re-aimed at a field the normaliser DOES undo on that card: `sends.channel = 9` + a row | test **2** red: *"THE TWO SIDES ARE IDENTICAL HERE, so there is no divergence left for this row to declare"* | **1** |
| 2 | 02 | grid knob **inserted at index 0** instead of appended | `knobs.preset.spec.ts`'s rack-order assertion red; **`stamp.spec.ts` GREEN** (1 file, all tests passed) — which is why the index assertion had to be written | **1** |
| 3 | 02 | `touch.kind = "bloom"` on joystick, undeclared | 3 tests red across 2 files, all at *"NOBODY DECLARED IT"* / cost / frame hash | **1** |
| 3b | 02 | the same `bloom`, **with the row written and the cost refreshed** | **4 passed. GREEN, and that is the gap.** | **0** |
| 3c | 02 | `bloom` again, against the new gate | red on the new line, naming the rule and the residue measurement | **1** |

### Check 1, and why the plan's instrument does not work

The plan expects `normalisePadState` to strip an `xy` on the exclusive trackpad and for the resulting row
to be identical on both sides. It does not: `sends.kind` **is** the trackpad, so setting it to `xy`
simply makes tpad a different card. What the normaliser resets on a trackpad state is the fields the
trackpad emitter never reads — `channel`, `invertX`, `invertY`, `fingers` (`_pad.ts:1442-1447`) — so the
check was re-aimed at `sends.channel` and then behaved exactly as designed.

**Every plant was reverted from a scratch copy with sha256 compared either side**, and the post-restore
hashes were re-printed each time (`presets.ts` `4fb0f102…` then `9267bb1a…`, `divergence.ts` `3704ee38…`
then `08d7bd21…`, `knobs.preset.ts` `530f6f60…`). **`git checkout`, `git restore`, `git stash` and
`git clean` were not used at any point in this plan.**

---

## The three sentences, counted by script

`DESCRIPTION_CAP` is **110** (`copy.spec.ts:52`), asserted over both `CATALOG` and `LISTING`.

| card | before | after | length |
| --- | --- | --- | --- |
| aurora | *"A band of light crosses the pad, and your finger leaves a glowing tail behind it."* (81) | *"A band of light crosses the pad, your finger leaves a glowing tail, and the pad sends your position."* | **100** |
| pinwheel | *"Light turns around the centre, and each finger paints in its own colour."* (72) | *"Light turns around the centre, each finger paints in its own colour, and the pad sends your position."* | **101** |
| starfield | *"Every light breathes at its own pace, so the pad never repeats itself."* (70) | *"Every light breathes at its own pace, so the pad never repeats itself, and it sends your position."* | **98** |

Each is one added clause echoing RADAR's shipped *"and the pad sends your finger's position to your
computer"* rather than reinventing the wording; RADAR's own line is untouched at 90. STARFIELD's
identity clause is kept **verbatim** — the full RADAR clause is 55 characters against 40 of headroom, so
the echo is the short form there. The sentences live in `presets.ts` and flow through `ported.ts`; the
restatements in `listing.ts` and `front-door.ts` were patched with the **replacement count asserted at
exactly one** per file, which is wave 4's answer to wave 2's `String.replace` losses.

The joystick `quiet` line is 109 characters and is in `copy.spec.ts`'s authored corpus (preset
*descriptions* are exempt, `LISTING`/`FRONT_DOOR` **quiet lines are not**), so it passes the no-shout,
no-emoji, no-typewriter-apostrophe and no-spaced-hyphen rules.

---

## The vendored tree: nothing moved

```
$ git diff --stat HEAD -- src/vendor/
(no output)

$ git diff --stat 4131ff5 HEAD -- src/vendor/          # 11-03's tip to now
 src/vendor/botor/_pad.ts               | 70 ++++++++++++++++++++++++++--------
 src/vendor/botor/pad-sim.ts            | 29 ++++++++++----
 src/vendor/botor/tests/pad-sim.test.js | 19 +++++----
 src/vendor/botor/tests/pad.test.js     |  7 +++-
 4 files changed, 92 insertions(+), 33 deletions(-)
```

Byte for byte 11-04's and 11-05's recorded output. `pad-sim.ts` still hashes to
`2651e236ab8f2dd19c7441abeaf43584b0a3a919840f79e1ab27fee10604b39b` and `_pad.ts` to
`c8f4ccb3a32638b2386e69700deac61cc60b31312fba828f834110a1f0a092d3` — both 11-05's digests.
`git diff --quiet 9d06b00 HEAD -- src/lib/fidelity/firmware-oracle.spec.ts` exits **0**: green and
**unedited**. It was not opened.

**`upstream-manifest.json` was not touched.** This plan rewrote none of the four mislabelled *"free at
its worst knob position"* rows, so per the instruction not to half-correct them, 11-04's handover stands
unchanged and 11-16 still owns pinwheel 596 for a true 591, radar 463 for 450, joystick 366 for **357**
— which this plan's sweep re-observed independently — and faders 388 for 384.

---

## Commits

| Commit | Task | What |
| --- | --- | --- |
| `73872f5` | 11-06-01 | three cards start sending, and the record is spent for the first time |
| `849eac3` | 11-06-02 | four by four is selectable, the stick rests in the middle, and the trail is a finding |

**One correction to `73872f5`'s own message, made here rather than by rewriting it.** It says the record
*"lands its first nine rows"*; it lands **twelve** — four per card, because the walk covers `cost` as
well as `state.sends.kind`, `state.sends.fingers` and `sentence`. `849eac3` adds five (two for NINE
PADS' `knobs`, three for JOYSTICK) for a total of **seventeen**. `git show 73872f5:src/lib/catalog/divergence.ts
| grep -c 'plan: "11-06"'` reads **12**.

---

## Deviations from Plan

### Auto-fixed and auto-decided

**1. [Rule 3 — blocking] `INTENDED_DIVERGENCE` had to leave `presets.spec.ts` to be readable at all**

- **Found during:** Task 01, the moment three sentences changed and `catalog.spec.ts` went red.
- **Issue:** Two further gates hold a HANGAR value against a vendored one, and a spec file's
  `describe` blocks register twice if another spec imports it.
- **Fix:** `src/lib/catalog/divergence.ts`, a plain module importing nothing, read by
  `presets.spec.ts`, `catalog.spec.ts`, `frames.spec.ts` and `e2e/fidelity.e2e.ts`. Adds **zero** test
  files, so `PREV_FILES` is unmoved.
- **Commit:** `73872f5`

**2. [Rule 2 — missing correctness] `catalog.spec.ts` and `frames.spec.ts` needed allowances the plan
does not mention**

- Both compare first and consult the record only on a mismatch, both count what they compared and what
  they excused, and both assert the excused set is a strict subset. Not skip lists.
- **Commits:** `73872f5`, `849eac3`

**3. [Rule 1 — bug] `e2e/fidelity.e2e.ts` and the WASM probe page**

- **Issue:** The probe compiles through `$lib/pad` (HANGAR's nine) against `preset-baseline.json`
  (BOTOR's). It failed at `"costSetupUsed: expected 250, received 415"`, a message about the WASM build
  that had nothing to do with the WASM build.
- **Fix:** the probe names its own preset, the e2e resolves the fixture by that name and asserts
  `stateDiverges` first with a message naming the file to change. Probe moved to DIAL. Test title
  de-hardcoded from "aurora"; the e2e count is unmoved at 103.
- **Commit:** `849eac3`

**4. [Rule 2 — missing correctness] 11-04's `bloom`/`disturb` rule became a gate**

- The plan asked for this conditionally and the condition was met. Folded into the existing walk so the
  test total stays at +1.
- **Commit:** `849eac3`

**5. [judgement] `invertY` was NOT flipped, against the plan's explicit pairing**

- `springRestCell` never reads `invert` once `springTo` is `"centre"`. The pairing saves 4 characters
  and reverses a second, unasked-for decision. 543 shipped against 539.

**6. [judgement, and the largest] The JOYSTICK trail was refused rather than shipped**

- The plan's `must_haves` say JOYSTICK *"leaves a trail"* and that the trail *"costs nothing"*. The tree
  does not support that: the trail and the power-on centre dot are mutually exclusive at
  `_pad.ts:1951`, and the trail makes the card measure zero lit bytes at rest. The definite half of the
  bench note shipped; the tentative half is reported with a costed menu. **Not trimmed and not
  silently dropped** — the plan's own rule is that a request that cannot fit is a finding.

**7. [reported, not reconciled] `frames.json` was not regenerated in task 01**

- The plan says to regenerate it. Nothing moved — proved by the committed tripwire re-sampling green
  rather than by writing identical content. It WAS regenerated in task 02, where five rows really moved.

No Rule 4 checkpoints were reached. **The trail was the closest call**, and it was resolved by
measurement rather than escalated, because the alternative it would have asked about — putting a look
layer on JOYSTICK — is costed and handed to the user rather than taken.

---

## What the plan asserts that the tree does not support

Seven, and none was reconciled into a passing number or a quieter sentence.

### 1. The declared-cost table is the pre-11-04 one AGAIN, and the delta is +165 rather than +158

408 / 463 / 396 against measured 415 / 477 / 403, and 532 against 543. The stale baselines account for
+7; the remaining +7 on the three is 11-04's class-B guard landing on the `LIVE` arm, which only a card
with an enabled `sends` compiles. **The third wave in this phase to report this table.**

### 2. The vendored `fingers` default is `"any"`, not `"each"`

`normalisePadState` resets it whenever `sends.kind` is `"none"`. And `"any"` and `"each"` cost
**identically** — 320 / 382 / 308 — so the plan's *"`each` is cheaper still on AURORA (313) and
PINWHEEL (368)"* is 7 characters out on both and describes a saving available from two options rather
than one.

### 3. JOYSTICK cannot have both the centre rest and the trail

Covered in full above. The plan's `must_haves` assert both, and `sendsInit`'s `springLed(s, plan) ===
"glow"` guard makes them exclusive. Measured, not argued: `self.l=` absent and 0 lit bytes at rest under
`comet`.

### 4. `invertY = false` is not load-bearing for *"start from the middle"*

`springRestCell` returns 4 on both axes before `invert` is ever read.

### 5. Per-axis spring is not reachable

`SpringTo` is one field. The plan asks *"check whether it does, and report either way"*; it does not.

### 6. The tpad negative check does not behave as described

`normalisePadState` does not strip `sends.kind` on the trackpad — it strips the fields the trackpad
emitter never reads. The check was re-aimed and then worked.

### 7. Knob order is not stamp payload for a preset-backed entry

The plan's standing rule — *"Knob positions are stamp payload. APPEND, never insert"* — is true of the
eighteen Lua entries and of none of the nine. `encodeFor` sends a `"padsim"` entry through the vendored
`encodeStamp` over the `PadState`. Appending is still correct and the assertion still earns its line;
the stated reason was wrong.

---

## A flake worth reporting rather than absorbing

`npx playwright test` at the default worker count failed **once on each of three consecutive full runs,
with a DIFFERENT test each time**, and every one of them passes when its own file is run alone:

| run | failure | alone |
| --- | --- | --- |
| 1 | `browse.e2e.ts:329` search narrows the grid — expected 7, received 27 | **11 passed** |
| 2 | `session.e2e.ts:770` replug — `CONFIG FETCH` expected 4, received 3 | **14 passed** |
| 3 | `browse-webkit.e2e.ts:310` search field does not zoom — 30 s timeout waiting for the element to be stable | **6 passed** |

(An earlier run also hit `browse-webkit.e2e.ts:202` with `InvalidStateError` out of `getContext("2d")`;
it too passed alone.) **`npx playwright test --workers=1` is 103 passed, exit 0**, which is the run this
SUMMARY's count is taken from. None of the four touches a surface this plan changed — the one that did,
`fidelity.e2e.ts`, was a real failure and is fixed. This looks like machine contention rather than a
regression, and it is recorded because a suite that fails one different test per parallel run will
eventually be believed.

---

## Known Stubs

None. Every one of the five asks is either shipped and measured or refused with the measurement that
refused it. The JOYSTICK trail is **not** a stub: it is a documented finding with its costs, in
`presets.ts` where the next author will read it, in this SUMMARY, and in the handover below.

---

## Requirements

`requirements-completed` is empty on purpose. The plan's frontmatter lists `[CONT-01, CONT-03, TUNE-01,
TUNE-05]`:

- **CONT-03**, **TUNE-01** and **TUNE-05** are already `[x]` and were not touched. TUNE-01's *"three to
  six knobs"* was re-observed with NINE PADS now at exactly six; TUNE-05's margin was re-observed at
  `ninepads` **640 of 908, 268 free** and `tpad` **907 of 908**, over budget 0 across 45,358 states.
- **CONT-01** is `[ ]` and this plan makes it **less** true for the third time. 11-03 recorded that five
  of the nine no longer compile to the same Lua as BOTOR after 11-04; 11-05 added a second surface;
  11-06 has now **spent** it, so four of the nine deliberately compile to different Lua and three carry
  different copy. **11-03's proposed amendment for 11-16 should be widened again**, and it should now
  name `src/lib/catalog/divergence.ts` as the record of exactly which cards and which fields.

---

## For the waves that follow

- **The JOYSTICK trail is the user's decision and it is costed.** Comet gives a trail and a black pad at
  rest (0 lit bytes, `restsBlack` would flip, `motion` would go `"dark"`, the front-door row would have
  to be re-argued). A look layer gives motion and keeps the dot at ripple 652 / shimmer 603 / wave 621 /
  swirl 641 of 908, and would move JOYSTICK's `motion` to `"animated"` — which **would** move the front
  door's quiet-pad geometry, since the three still cards currently land on 2, 4 and 6. Nothing here is
  hardware-verified; the user's bench is the only thing that can say which reads better on a ZONA.
- **NINE PADS is at the six-knob ceiling.** A seventh knob turns `knobs.preset.spec.ts` test 1 red on
  purpose.
- **NINE PADS' fast tap is still open**, unchanged at 0 / 2, and independent of the 4x4 ask. 11-04
  classified it as shape-not-constant; 11-05 closed the "could a value fix it" question at NO across
  eight variants; this plan touched neither.
- **11-16 gains a fifth item.** (a) The four mislabelled manifest figures, untouched, with joystick's
  true 357 re-observed here. (b) NINEPADS' fast tap. (c) `phaseCond`'s press arm. (d) The
  vacuous-fidelity-spec failure mode — **now seen from a second side**: `e2e/fidelity.e2e.ts` hit the
  same shape in a browser and was repaired here. (e) **New: `preset-baseline.json` predates 11-04 and
  is stale for four presets** — pinwheel 305/312, radar 438/445, joystick 535/542, faders 513/520 — and
  `preset-baseline.spec.ts` is green over them only through its own substitution table. Anything else
  that reads that fixture directly, as the e2e does, has to pick a preset clean on **two** axes.
- **CONT-01's amendment should now also name `src/lib/catalog/divergence.ts`.**
- **`PREV_FILES` 84 · `PREV_TESTS` 844 · `PREV_E2E` 103 · `BASE_CHECK` 580 · sweep `4 19` ·
  reachability Pass A 20,782 · catalog 27 (9 preset + 18 Lua)** are what wave 7 carries forward.

---

## Self-Check: PASSED

- `src/lib/catalog/divergence.ts` — FOUND, exports `INTENDED_DIVERGENCE` (17 rows), `PresetDivergence`,
  `declaredDivergence`, `stateDiverges`; imports nothing
- `src/lib/catalog/presets.ts` — FOUND, aurora/pinwheel/starfield at `sends.kind = "xy"`, joystick at
  `springTo = "centre"` with `invertY = true`, ninepads' `knobs` carrying `"count"`
- `src/lib/tune/knobs.preset.ts` — FOUND, `gridKnob` appended to `BY_PRESET.ninepads`
- `src/lib/tune/knobs.preset.spec.ts` — FOUND, 7 tests
- `src/lib/catalog/frames.json` — FOUND, 5 rows changed, all joystick, all `sha256`
- Commits `73872f5`, `849eac3` — both FOUND in `git log --oneline --all`
- `check-counts.mjs 84 844` exit 0 (x2); `check-counts.mjs 4 19` exit 0 (x2);
  `check-counts.mjs --playwright 103` exit 0 at `--workers=1`; `npm run check` 580 files 0 ERRORS 0
  WARNINGS; `npm run lint` clean; `npm run build` exit 0 (x4)
- `git diff --stat HEAD -- src/vendor/` **empty**; `git status --porcelain` **empty**;
  `test-results/` removed; no server left running
