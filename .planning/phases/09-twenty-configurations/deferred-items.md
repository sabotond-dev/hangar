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
