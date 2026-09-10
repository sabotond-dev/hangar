# Slot probe result — 2026-09-10, on the user's ZONA

`SLOT-PROBE.md`, run through `/dev/install/` on the preview at `9d435db`.
Timer box `--[[@cb]]function P()return 255 end`; Setup box lights one of three
cells on the first tap depending on what happened. **This is ground truth for
D-07 and for every Sandbox plan.**

## Result

> **"bottom right corner lits up!"**

**Cell 80.** The touch Setup called `s.tim(s)` — the touch Timer's registered
body — and afterwards `P` was defined. Both halves of the mechanism the research
read from `grid_ui.c:373` are confirmed on hardware:

1. **An event body is a callable method on its element** (`ele[N].name = function(self)…`), reachable from another event's body.
2. **Globals defined inside it persist** once it has run.

So a Timer whose body is nothing but function definitions is **a library slot
that HANGAR already writes**, and the touch Setup can pull it in with an
11-character call before doing anything else. D-07's condition is met: **Sandbox
v1 takes the split architecture** — the research measured it at 861 characters
of runtime plus 366 for the PDF's own four-element surface, both inside 908.

## What this does not prove, stated so nobody assumes it

- **`ele[1]:map()` — the system element's mapmode slot — was not tested.** The
  probe wrote only the two touch events HANGAR already writes. The mechanism is
  the same, so it is now very likely, but it is **unverified**, and event 4
  doubles as the utility button (its default is `gpl(gpn())`, page-next). Whether
  Sandbox v1 uses that third slot is a plan decision that needs its own bench
  row if taken.
- Whether a body called this way runs with the **same `self`** it would have on
  its own schedule was not distinguished from "it ran at all". The probe called
  `f(s)` with the touch element, which is what a library call would do anyway.
- The Timer was **never armed** in this probe. A library Timer that is also
  scheduled would re-run its definitions on every tick — harmless for pure
  function definitions, and a cost only if the body does work.

## A finding on the way, unrelated to slots

The first attempt failed with **session phase `unknown`, "The port would not
open"**, while the install store read `ready` with a landed snapshot
(`durable 642 22`, three fetches OK). The port had opened once — the snapshot
proves it — and a second open was refused because the earlier tab still held
it. Closing the other HANGAR tab, re-plugging, reloading and connecting once
fixed it. **The store's refusal to write without a live session was correct**;
the copy *"The port would not open"* was accurate but did not say *why*, and
"another tab may be holding your ZONA" is the sentence a visitor needs. Filed
for Phase 13's copy pass (D-05).

## What it changes downstream

- **12-07's library** stays in the **system** setup as planned — that slot runs
  first at page load, before any touch event exists. Nothing in this probe
  moves it.
- **Phase 13's Sandbox compiler** takes the split: runtime in one slot, the
  region table and cell→region map in another, called from Setup. The Knob's
  rotary gesture (D-08, +150–200) and the XY pad both fit under it.
- The `ele[1]:map()` question is **Phase 13's second bench row**, taken only if a
  plan wants the third slot.

---

# Slot probe 2 result — 2026-09-10, on the user's ZONA

`SLOT-PROBE-2.md`. The system element's fourth event (255/4) was written through
**Grid Editor** with `function P2()return 255 end`; the touch Setup, on the first
tap, called `ele[#ele]` under four candidate names and lit one of three cells.

## Result

> **"bottom right corner!"**

**Cell 80.** A **touch** script called the **system** element's fourth slot and
the global it defined persisted. The mechanism the first probe proved between
two events of one element **holds across elements too**, and it holds for the
slot the firmware binds to the utility button. **D-18 is met: Sandbox v1 has
three 908-character slots.** The PDF's page-3 surface — a 2×6 Fader, an XY pad,
a Button and a Knob — is installable as drawn; the research's four-kind runtime
(≈1,030–1,080) fits with room, and D-08's rotary Knob is not at risk from budget.

## What is still open, stated so nobody assumes it

- **Which of the four names is the real one** — `map`, `mapmode`, `utility` or
  `util` — the probe did not distinguish. 13-15 reads it from `grid-fw`'s system
  element source now that the mechanism is certain, and confirms with one tap at
  the bench. The emitted runtime must call the one true name, not a fallback
  chain.
- **Grid Editor can reach the System element on a ZONA** — confirmed on the way,
  by the route the research rated MEDIUM: pressing the module's utility button
  selects it. That press fires page-next first. Recorded as a bench fact.
- **HANGAR still does not write 255/4.** Whether the Sandbox's install path is
  allowed to — with the utility button's page-next default restored by PUT BACK,
  as 13-02's checkpoint text anticipated — is a decision the Sandbox install
  plan (13-17) must make in the open, because it reverses a constant 12-02 wrote
  with a reason. The reason (a web page must not silently change what a physical
  button does) is answered by the same envelope D-06 uses: a click, a named
  confirmation, and PUT BACK restoring the default.

## What it changes downstream

- 13-02's checkpoint is **fully answered before the plan runs**: D-18 chose the
  probe, and the probe said yes. The executor records both and asks nothing.
- 13-14 emits against three slots; 13-15's VM measurement is a confirmation of
  headroom, not a ceiling decision; 13-15's re-ask rule stays in place in case
  the measured runtime is larger than the sketch by more than the slot gained.
- 13-17 owns the 255/4 write decision and its PUT BACK.
