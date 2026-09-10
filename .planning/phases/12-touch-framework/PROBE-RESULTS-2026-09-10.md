# Probe results — 2026-09-10, on the user's ZONA

Both probes from `12-RESEARCH.md` §4, installed through `/dev/install/` on the
gated preview at `9d435db`. The user reported question by question; MIDI
monitor readings are copied where they were given. **These are the phase's
ground truth. Everything the simulator said about touch is subordinate to
this file.**

---

## Probe B — brightness

| Look | Answer |
|---|---|
| Columns 0–3 (LUMEN's bottom row at `@DEPTH` 1, 2, 3, 4 = 196, 139, 84, 27) | **Four distinct brightness levels.** |
| Column 3 (27) against column 4 (dark) | **Column 3 clearly lit.** |
| Columns 5–8 (128, 64, 32, 16) | **All visible, visibly getting darker.** |

**Consequence.** The simulator was right about the bytes and the LEDs render
them. Four steps are plainly distinct on the desk. So the round-one complaint —
*"the color depth / opacity doesn't work"* — was not the LEDs. Two candidates
remain, and both must be tested in the tree, not argued:

1. **The knob's value is not reaching the pair TRY sends.** NINE PADS carries
   the same shape of report: *"make a 16 pads cause nothing changed"* after the
   4×4 knob shipped (`grid[2]`, default index 0 = 3×3). Two knobs on two entries,
   both "nothing changed." A test that builds the tuner for LUMEN, sets `depth`
   to 0 then 3, and asserts the landed pair differs is the deciding evidence.
   If it does not differ, that is a HANGAR bug affecting every knob on every
   entry.
2. The user compared the top rows, which cannot move (`d = 36 − row*@DEPTH`,
   so row 0 is constant at every depth).

The sRGB-versus-linear gamma hypothesis from the research is **not** the
explanation: 27 is clearly lit and 16 is visible.

---

## Probe A — touch

### Q1. One finger dead still on the middle of a cell, 5 s

```
CC20 65  CC21 66  CC22 1  CC23 65
CC20 66  CC21 66  CC22 1  CC23 66
CC20 66  CC21 67  CC22 1  CC23 67
CC20 66  CC21 67  CC22 5  CC23 68
```

**A still finger is not still.** x wobbles 65↔66, y 66↔67, and every one-unit
wobble is a MOVE (code 1) with the counter ticking once per message. The finger
sat at the centre of cell 40 (spans 57–71 on both axes), so at the *cell* level
it did not flicker here — but every entry that acts on MOVE acts on this. This
is ARC's re-arm after its stop tap, exactly as the research predicted.

### Q2. One finger on the line between two cells, 5 s

```
CC20 71  CC21 80  CC22 1  CC23 48
CC20 72  CC21 80  CC22 1  CC23 49
CC20 71  CC21 80  CC22 1  CC23 50
CC20 71  CC21 80  CC22 1  CC23 51
CC20 71  CC21 80  CC22 5  CC23 52
```

*"yes i can find a minuscule spot where the two LEDs flicker. sending a lot of
messages constantly."*

**The boundary is one unit wide.** `71*9//128 = 4` and `72*9//128 = 5`, so a
one-unit wobble across x=71/72 flips the cell. **This is the sequencers'
"not precise"** — EUCLID, STEPS, RADAR POINTS: a finger near an edge is read as
alternating taps on two cells. **The hysteresis margin must be at least 2 units;
3 is the working figure.**

### Q3. Ten taps as fast as possible

```
CC22 4 → CC22 1 → CC22 5 → CC22 4 → ...
```

*"No 9. And i dont think that all my taps recorded but that can be a hardware
calibration issue, this is a prototype after all."*

**Code 9 never appears.** Every tap a human can make arrives as 4, at least one
1, then 5. The firmware's coalesced DOWNUP path exists in source but a finger
cannot press and lift inside one 10 ms scan.

**Consequences, and they are large:**
- `src/lib/sim/touch.ts`'s 4-then-5 is **what the hardware does**. The gap
  recorded in `11-bench-corrections/TOUCH-CODE-9.md` is real in the firmware
  and **not real in practice**. That document's framing is superseded by this
  one.
- The class-B "swallowed fast tap" fixes across 11-02, 11-04, 11-08, 11-09,
  11-09.1 were **correct for the firmware and harmless**, but they were not
  fixing the user's complaint. Every "0 vs 2" measurement was taken by
  injecting code 9, which the hardware does not produce for a human tap.
- **The user's "not precise" was Q2 the whole time.**

**Dropped taps** are a touch-threshold matter on the prototype, not something a
configuration can address. Noted for the production unit.

### Q4. Press, hold, lift slowly

Answered by Q3's trace: **4, then 1s, then 5.**

### Q5. Four corners and the centre

| Where | CC20, CC21 |
|---|---|
| corner | 127, 1 |
| corner | 1, 1 |
| corner | 0, 126 |
| centre | 64, 68 |

**Full range.** The pad reaches its edges within one unit; the outer cells are
as reachable as the inner ones. Centre x is exact; y sits 4 low, consistent
with Q1's (65, 66) — either a slight physical offset or where a finger naturally
lands. Inside the middle cell with room to spare either way.

### Q6. Five fingers at once

*"it was super laggy and absolutely not registered all 5 fingers seamlessly
constantly"* — and, on a fuller look at the monitor, *"i can see ch 1-5
messages in them."*

**All five contacts are tracked and reported on channels 1–5.** Smoothness
under five suffers, and a good part of that is the probe itself — four CCs per
finger per sample is a flood. Multi-touch works; single contact is what is fast
and reliable.

### Q6.5. After the five fingers lifted

*"4 lights stayed behind after the 5 finger extravaganza."*

**Four of five lift events were lost.** The probe clears a cell only on code 5,
and for four contacts it never came. **This is the most important answer in the
probe.** Every entry that sends note-on at press and note-off at release hangs
notes exactly this way, and no simulator shows it.

### Q7. Flat palm wiped across the pad, lifted

*"yes, stayed behind and some of them are even flickering and sending MIDI we
mightve killed the hardware momentarily."*

**A large contact loses its lift and leaves phantom contacts that keep
jittering and sending.** The controller lost track of a large touch and went on
reporting ghosts. The user was told to PUT BACK and power-cycle if the ghosts
persist; it is a known behaviour of that class of touch controller, not damage.

---

## What the library must be, decided by this file

1. **Cell hit-testing with hysteresis, margin 3 units.** A contact belongs to a
   cell and moves only after crossing the boundary by the margin. This alone
   answers EUCLID, STEPS, RADAR POINTS and ARC's visual (Q1, Q2).
2. **A lift is never trusted on its own** (Q6.5, Q7). Contacts expire: a new
   press on a cell held by a stale contact clears it, and a Timer-side timeout
   releases any contact that has not reported within a short window. Both, not
   one — a stuck note is the worst failure a MIDI instrument has.
3. **Per-axis send-on-change** (the user's snippet), gated by cell or by a raw
   delta, never on every sample (Q1 — the raw stream is a flood).
4. **Single contact by default.** Multi-touch is real but lossy (Q6, Q6.5);
   an entry that wants two fingers earns a bench row, and WHEELS is one.
5. **Finger lights its cell.** Feedback for where the firmware thinks you are —
   the probe itself is the proof this reads well on the desk.
6. **No design may depend on code 9** (Q3). The onset edge `(e==4 or e>8)` stays
   correct and harmless; nothing new is built on the `e>8` half.

## What this file retires

- `TOUCH-CODE-9.md`'s "the preview cannot make the gesture five waves fixed"
  — the gesture does not occur on hardware. The preview is faithful here.
- The sRGB-gamma hypothesis for LUMEN (Probe B).
- Any reading of the round-one precision complaints as fast-tap loss.

## What this file opens

- **The knob-to-install path is the prime suspect for LUMEN and NINE PADS**,
  and it is testable in node today.
- Dropped single taps and the palm ghosting are **hardware** findings for the
  production unit, recorded here for the user, not for a plan.
