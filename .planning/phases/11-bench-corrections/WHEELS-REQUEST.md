# The wheels — a new configuration, requested 2026-09-09

Given after the bench notes and after Phase 11 was registered, so it is an
**addition to this phase's scope**, not one of the thirty-five bench items.

> "also: add a pitch and modwheel configs, leftside a pitchwheel rightside a
> modwheel on the ZONA beautifully visualized on the module"

## The reading, and the ambiguity

The word is plural — "configs" — but the layout sentence describes **one module
carrying both wheels**: pitch on the left, mod on the right. That is also how a
synthesiser's left-hand controller section is actually laid out, and it is the
reading taken here: **one catalog entry with two wheels side by side.**

The other reading is two separate entries, one per wheel, each using the full
pad. It is not obviously wrong — a full-width pitch wheel has four times the
horizontal target area — but it loses the thing the request names, which is the
pair sitting next to each other the way they do on a keyboard. **If a planner
prefers two entries, that is a change of reading and belongs to the user, not to
the plan.**

## What makes this worth building, and what makes it hard

**The two wheels are not the same control with different labels.** A pitch wheel
is spring-loaded: it returns to centre the instant you let go, and its rest value
is the middle of its range. A mod wheel stays exactly where you left it, and its
rest value is wherever that was. **That asymmetry is the whole config** — get it
wrong and it is two faders in different colours.

The spring-back is also the visual: on release, pitch should travel home rather
than snap, in light and in MIDI together. That needs the Timer event, which means
the entry spends both budgets rather than one.

## Verified against the host before proposing it

- **Pitch bend is reachable.** MIDI pitch bend is status `224` (`0xE0`), 14-bit,
  centre `8192`, sent as `self:gms(<ch>, 224, <lsb>, <msb>, 0)`. The existing
  entries already send `144` (note on), `128` (note off) and `176` (CC) through
  the same call, so the status byte is not special-cased anywhere.
- **`gmbs` is NOT pitch bend.** It is one of the compiler's HID out-calls —
  `gmms`, `gmbs`, `gks` are mouse-move, mouse-button and keyboard, recorded by
  `recordHid` in `src/lib/sim/lua-host.ts:458`, and bound bare only because
  `tpad`'s compiled Setup opens with `gmbs(3,0)`. Anything reading `gmbs` as
  "bend send" would produce a config that silently emits mouse clicks.
- **The mod wheel is ordinary CC.** CC1 is the modulation wheel by convention;
  `176` with controller `1`.

## What still has to be answered by whoever plans it

1. **The budget.** This entry spends Setup *and* Timer, and 908 characters is the
   cap on each. The spring-back animation and two independent wheels on one pad
   is not obviously cheap. Cost it before designing it, the way this phase costs
   every other request.
2. **Where the divide falls.** Nine columns do not halve. Columns 0–3 and 5–8
   with column 4 as a lit divider is the obvious answer and it is honest about
   the geometry; 0–4 and 4–8 sharing a column is not.
3. **Resolution.** Touch gives `y` in 0–127 while the pad shows nine rows, so the
   *value* can be far finer than the *display*. Pitch especially wants the full
   14 bits, not nine steps — the LEDs are the readout, not the quantiser. Do not
   quantise the value to the row.
4. **Whether the spring returns in MIDI as well as in light.** It must, or a
   held note stays bent after the finger is gone. That is the failure mode worth
   a test.
5. **Rest state.** Pitch rests at centre — lit at the middle row. Mod rests where
   it was left, which means it has state that survives a release, and on a fresh
   Setup it starts at zero.

## Scope note

Phase 11 removes nine entries and this adds one, so the catalog lands at
**twenty-eight**, not twenty-seven. Every count this phase touches has to carry
that.
