# TRACKPAD COMET - the history behind src/lib/catalog/entries/trackpad-comet.ts

TRACKPAD COMET is TRACKPAD's pointer with a comet that follows the finger, asked 2026-09-17 (`BENCH-2026-09-16.txt`
section 4). Its source is `src/lib/catalog/entries/trackpad-comet.ts`, whose header carries the mechanism, the wire
and the traps; this file starts at change 17B, the first change after it was written that the header alone does not
hold.

## Change 17B, 2026-09-23: no MIDI, and a previous landing's receive cleared (`BENCH-2026-09-16.txt` sections 17 and 18)

TRACKPAD COMET sends mouse reports (`gmms`, `gmbs`), not MIDI, so it declares no output and gains no knob (the rack
and the stamp are unmoved). Section 17's decision - every card assigns its own receive callback or nil - could not go
in the Setup: it is TRACKPAD's byte for byte (lua-smoke.spec.ts holds the two equal) and has 5 free, and
`self.midirx_cb=nil` is 18 characters. So the TIMER assigns `s.midirx_cb=nil` on every call, from its first, 20 ms
after the Setup (the Setup arms it); a previous landing's callback guards itself on the touch callback it was made
beside, so it is inert inside that window too. Timer 424 / 427 -> 440 / 443 (defaults / corner), Setup 903 unmoved;
frames.json and the OG image unmoved. **Latch: one control** - the pad is one mouse surface (a finger, two fingers to
scroll, a tap to click); nothing sits beside it to slide onto. `lua-smoke.spec.ts` "TRACKPAD COMET: no MIDI ...": after
three ticks no callback over a previous landing's, the pointer still moves, no MIDI.
