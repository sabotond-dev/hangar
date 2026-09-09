# The four checkpoint answers

Given by the user on 2026-09-09, answering plan 11-09's blocking
`checkpoint:decision`. Recorded verbatim with what each one changes.

---

## 1. STAGE — build the breathing state

> *"implement breathing as planned"*

The third zone state ships. Note what the measurement found and do not lose it:
**`listing.ts` has been promising this since Phase 9** — *"the live one glows and
the one you are lining up breathes"* — while the code has only **live** and
**touched**. The breathing state was never broken. It was described, shipped in
the copy, and never built.

So this is authoring work with a budget cost, not a repair, and the copy is
already written for it.

---

## 2. ARC — stop and resume is a FEATURE, not a bug

> *"i meant to add stopping and resuming tap as a feature"*

**This reframes the note entirely and closes a live worry.** The bench note read
*"if you press the center it stops, pressing it again resumes, not intuitive
enough"*, and the source has **no stop, no resume and no toggle** — `s.r` cannot
reach 0. The open question was whether the hardware did something the simulator
does not reproduce, which would have meant the preview was lying.

It does not. The user was describing what they **want**, not what they saw.
Nothing about the simulator is in doubt.

**What ships:** tap the centre to stop, tap again to resume. New behaviour on an
entry that has none of it today.

**Cost it before designing it.** ARC is one of the fifteen entries whose header
quotes the **declared-palette corner** rather than the **RGB444 picker corner**
the 908 gate actually reads — a defect already confirmed in CONSOLE, FORGE and
STEPS. Measure ARC's true worst corner first; its header is not evidence.

A tap that toggles also has to coexist with 11-02's class-B fix, which admitted
code 9 (DOWNUP) as a real press. A toggle that fires on both the down and the up
of one fast tap would stop and resume in the same gesture and look like nothing
happened.

---

## 3. LUMEN — try the deeper ramp, but the observation is stronger than the ask

> *"try it but we observed no difference in the LEDs"*

**"No difference in the LEDs" is a stronger claim than "the ramp is too
shallow", and it is evidence against the measurement.** The simulator says depth
moves the anchor from **78% at DEPTH 1 to 11% at DEPTH 4** — that is a large,
plainly visible range. The user saw **nothing** on hardware.

So the first task is not to deepen anything. It is to establish **whether the
depth knob reaches the LEDs at all**: does changing it change the emitted Lua,
and does the changed Lua change what the pad writes? If the answer is that depth
never reaches a LED write on the real path, then deepening a ramp that is not
connected would have produced a second round of *"still no difference"* and cost
a bench cycle to discover.

Only once that is settled does the ramp get deepened.

---

## 4. MORPH's mapping mode — one tap, one message

> *"when you tap morphs corners it should only send one MIDI message"*

**This is cheaper than every reading the plan costed, and it is better.**

The plan's richest option was an assignment mode — a mode latch, a selection
gesture, and a single-corner emit — and it named the **gesture as the expensive
part**, the same problem STAGE's third state has. That expense is gone: **MORPH
already has four corner blocks** (`self.k = {0, 7, 63, 70}`, four 2×2 regions).
The corner tap **is** the selection. No latch, no mode, no new gesture, nothing
to exit.

**The behaviour:** a tap on corner *j* emits **only** CC *j*. The continuous
bilinear morph — where a finger anywhere sends all four, weighted — is
unchanged.

**Why it matters, and it is the same complaint as the suppression clause.** In a
DAW, MIDI-learn binds whichever message arrives first. With four CCs streaming
from every touch, corner 3 cannot be mapped to a filter: the moment you hit
learn, one of the other three lands first and takes the binding. That is why
*"mapping mode needed in"* sat in the same sentence as *"if something doesn't
change don't send it don't send 0 value"* — **both are about the pad shouting
over itself.** 11-08 fixed the shouting; this makes each corner individually
reachable.

**The design question left for the plan**, since it is mechanism rather than
intent: a corner tap must be distinguishable from the start of a continuous
morph gesture that happens to begin in a corner. Wave 11-08's own swipe work is
the precedent — its first shape was measured against an unguarded swipe and each
cell toggled an **even** number of times, so the naive fix looked exactly like
the bug. Measure this one the same way before trusting it.
