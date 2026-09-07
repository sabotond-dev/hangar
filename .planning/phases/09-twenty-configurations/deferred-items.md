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
