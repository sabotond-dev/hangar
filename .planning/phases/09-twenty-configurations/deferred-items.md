# Phase 9 — deferred items

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

Things this phase found, decided not to do, and wrote down instead of leaving to
memory. Each item names what was found, which plan found it, and what would
close it. Nothing here blocks the phase.

## 1. Mackie Control is not attempted, and cannot be until inbound MIDI is proven (decided by 09-05)

`USE-CASES.md`'s open question 5 and `09-CONTEXT.md`'s open item 3 both ask
whether CONSOLE should be an MCU surface. It is not. MCU is a bidirectional
protocol — the desk sends fader positions, track names and meter data back — and
`midirx_cb` is verified in firmware source and never tested on a rig, which is
exactly the block D-04 places on the whole clock-locked family.
`docs/MIDI-IN-PROBE.md` is the bench test that would unblock it. CONSOLE ships as
plain controller messages and says so on the card; an MCU surface would be a
different configuration, not a knob on this one.

## 2. Keystroke configurations animate correctly and prove nothing about their output (recorded by 09-06)

`gmms`, `gmbs` and `gks` resolve in `src/lib/sim/lua-host.ts` and are recorded
into `hidLog`; `lua-host.ts:429` states that nothing in HANGAR consumes them.
STAGE and SHUTTLE — and CULL, FORGE and SWITCH in wave 7 — therefore pass every
automated gate in this repository while their actual output is unchecked.
`lua-smoke.spec.ts` was widened in 09-02 to accept HID as output, which is
honest, and it is not the same as verifying a keystroke. What would close this:
either a HID consumer in the simulator that decodes `gks` tuples into named key
events and asserts them against a per-entry expectation, or the bench rows 23
and 24. The first is cheap and worth planning; the second is the only thing that
proves the wire.

## 3. Nothing in the repository checks that a per-cell picture is distinguishable from itself (recorded by 09-07)

CULL's five fill patterns and SWITCH's nine glyphs are both claims about
DISTINCTNESS: five bands you can tell apart with the colour taken away, nine
marks you can tell apart at three cells across. Both were measured by hand
before shipping, and 09-07 then checked what the repository would say if they
were wrong. Two of SWITCH's nine glyphs were made identical and the whole quick
suite was run: only `frames.spec.ts` test 3 went red, and it went red on the
frame HASH — a change detector that fires for any pixel change and says nothing
about distinctness. With the fixture re-taken over the perturbed entry the suite
was **74 files, 780 passed**, shipping a card whose card copy promises nine
different marks and whose pad has eight. What would close this: a spec that
extracts each entry's declared per-cell picture — the row masks, the glyph table
— and asserts the intended sets are pairwise distinct, or, more generally, a
`frames.spec.ts` test that reduces a declared-distinct entry's tick-0 frame to
one channel per cell and asserts the named regions differ. It is a small spec and
QUADRANT in wave 9 makes the same kind of accessibility claim, so it has at least
three carriers already.

## 4. Determinism is proved per entry by hand, not by a gate (recorded by 09-08)

`lua-entries.sweep.spec.ts` test 4 refuses `math.random`, which is the only
_source_ of non-determinism this repository can see statically. Nothing asserts
that two builds of the same entry produce the same frames — `frames.spec.ts`
compares against a recorded fixture, so a non-deterministic entry would first
show up as an inexplicable hash mismatch in a later wave rather than as a
finding here. Plan 09-08's tasks 1 and 2 ran the check by hand for SNAKE and
LIFE and recorded the result. What would close this: a sixth test in
`frames.spec.ts` that builds each entry twice and compares, at one tick, costing
one extra engine build per entry.

Numbered 4 rather than 3: 09-08's plan was written before 09-07 landed its own
third item, and the file is appended to, never overwritten.

## 5. The tune panel has no widget for a multi-colour palette (recorded by 09-09)

`src/lib/tune/view.ts`'s `widgetFor` gives a `kind: "colour"` knob a swatch row
only when EVERY value parses as one RGB triple, and
`src/lib/tune/knobs.lua.spec.ts` turns that into a rule with a stated reason:
*"a colour that reaches a rail is a malformed value set, not a rendering
choice"*. QUADRANT's palette is four colours in one twelve-number value, which
is neither malformed nor a single colour, and it went red on both that spec and
`view.spec.ts`'s totality assertion over every colour value in the catalog. The
entry was corrected - the knob ships `kind: "mode"` and renders as a
four-position rail - because `src/lib/tune/` is not an entry wave's to edit and
09-01's rule is that the entry is wrong, not the gate. But the consequence is
that a visitor tuning QUADRANT sees four unlabelled positions where the thing
being chosen is four colours, which is exactly the case a swatch exists for.
What would close this: a fourth widget - a swatch STRIP, n squares per value -
chosen when a `colour` knob's values each parse as a whole number of triples,
plus the corresponding `swatchOf`/`hueName` generalisation. It is the only
multi-colour knob in the catalog today, so the cost of leaving it is one card's
tune panel and the cost of fixing it is a widget nothing else needs yet.

## 6. `kind: "state"` was preferred and used zero times (recorded by 09-10)

D-06 asked every configuration in this phase to reach for `source.kind: "state"`
first and to fall back to `lua` only with a stated reason. **All twenty were
checked against the `PadState` vocabulary and all twenty moved to `lua`**, each
with its reason written into its own entry file's route note. The catalog closes
the phase at thirty-six entries with `state` reading **zero**, and the two
structural reasons behind that are worth having in one place rather than spread
across twenty route notes.

**Half one: no slate entry's identity survives the translation.** A `state`
entry is a `PadState`, which offers six `look.kind`s and six `sends.kind`s and
nothing else. Every one of the twenty needed something outside that grid, and
the failures are not near-misses. `sends.grid` is `3x3 | 4x4 | 9x9` and there is
no 2x2, so QUADRANT's four zones are outside the vocabulary by arithmetic.
Nothing in `PadState` counts, so POMODORO's twenty-five minute countdown has no
representation at all - every `look.kind` computes a colour from a tick and has
no memory of how many ticks have gone by. `showGrid` paints its zones in one
`gridColour`, so a per-cell picture cannot be drawn there even where a zone
count fits. The route note in each entry file is the per-entry version of this.

**Half two, and it is the half that would bite a future author who solved half
one: a `state` entry carries no knobs and no shareable stamp today.**
`compilerKnobs` (`src/lib/share/stamp.ts:115-119`) returns an empty list for any
source kind that is not `preset`, and it says so in its own comment - *"a
`state`-kind source is compiler driven and has no descriptor table of its own,
so it exposes no knobs and can carry no stamp - a true answer rather than an
invented rack"*. `stampKnobs` reads through it, so a `state` entry's tune panel
renders its empty-rack copy and its URL carries nothing. **An entry that fitted
the sheet perfectly would still ship with no tuning and no sharing**, which is
two of the three things a HANGAR card is for.

What would close this: an optional `knobKinds` on the `state` source that
`compilerKnobs` reads, giving a `state` entry a descriptor table without
inventing one. Note the second-order cost before starting: that same change
pulls `state` entries into `src/lib/tune/reachability.sweep.spec.ts`'s `racked()`
set, which today filters to `preview === "padsim"` and already costs 75.8 s over
32,852 states for nine presets. It is a phase, not a patch.

## 7. `planLayers`'s exclusions do not bind a hand-authored entry (recorded by 09-10)

D-09 asked for a layer plan per entry, and every one of the twenty has one. But
the mechanism D-09 named is a **compiler** rule: `planLayers` lives in
`src/vendor/botor/_pad.ts:901` and is called from `pad-sim.ts:357` against a
`PadState`. A `lua` entry owns layers 1 and 2 directly, in its own Lua, and
`planLayers` never runs for it - so its exclusions constrain nothing about any
configuration authored in this phase, and a plan that cites them is citing a
rule that is not enforced on this route.

What actually binds a hand-authored entry is two facts, and they are the ones a
future wave should be given instead: **a single layer caps at 49.6 % brightness**,
which is why every bright picture in this catalog paints two layers, and **there
are two free layers rather than three**, because firmware reserves one. Both are
in `.planning/research/ZONA-CAPABILITIES.md` and neither is gated.

What would close this: nothing, if the next phase's context says "two layers,
49.6 % each" rather than "follow `planLayers`". It is recorded so that the next
phase does not re-derive it from a failing pad.

## 8. A spec's cost grows with the catalog and no gate notices until it fails (recorded by 09-10)

Three tests crossed a wall-clock limit at the Phase 9 gate, and all three were
found by running the commands rather than by any gate:
`src/lib/og/build.spec.ts`'s "paints real LEDs" and
`src/lib/catalog/lua-entries.sweep.spec.ts` test 6 both hit Vitest's **default
5,000 ms per-test timeout**, and `src/lib/transport/queue.spec.ts` lost a fixed
`await sleep(5)` race to the load the first two created. All three were fixed in
plan 09-10 - the first made allocation-free, the second given the explicit
600,000 ms timeout its sibling sweep already carries, the third made to poll a
condition instead of a clock - and `docs/TESTING.md` records each with its
before and after.

**What is not fixed is the shape of the problem.** Every one of those specs is
linear in `CATALOG.length`, nothing asserts a cost ceiling anywhere, and the
default timeout is a silent line the catalog walks towards one entry at a time.
The next twenty configurations will cross it again, in specs nobody has thought
about, and the failure will look like flakiness on somebody's machine rather
than like growth.

There is a second, sharper version of the same gap: **the sweep is affordable at
twenty-seven entries only because of an authoring convention with no gate behind
it.** All seven Phase 8 entries carry a sixteen-value MIDI-channel knob - 112 of
their 283 combinations in one knob - and no entry authored in Phase 9 ships one,
which is why the sweep came in at 701 combinations rather than the ~1,090
`.planning/research/CATALOG-SURFACE.md` projected. Nothing refuses a
sixteen-value knob, or even reports the cost of adding one.

What would close this: a single reported number rather than an assertion - a
line at the end of `lua-entries.sweep.spec.ts` printing the combination total and
the per-entry worst case, the way `AUDITION_DUMP` prints character counts, so a
wave that adds an expensive knob sees the cost in its own run instead of
discovering it two phases later. A hard cap is the wrong shape here: the D-08 and
D-10 rule is that a sweep is never trimmed to fit, so the number wants to be
visible, not enforced.
