# The ZONA hardware audition

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

Phase 8 authored seven configurations for HANGAR — EUCLID, CHORUS, ARC, GHOST, LATTICE, MORPH and
SONAR — and Phase 9 is adding twenty more, of which HOLD, STEPS, SLAM, KEYS, GRIDLOCK and TABLE are
the first six.
Everything a machine can check about them is already green: each one is stored in canonical
compressed form, fits both 908-character budgets at its defaults and across its entire knob
cross-product, runs in a real Lua 5.4 VM driving the firmware-faithful LED engine without error, and
has a recorded golden frame set.

This document is the list of things a machine cannot check. Perceived polyrhythm, real touch event
codes, `glf`'s rate-only behaviour on physical hardware, LED diffusion and brightness after the
divide-by-512 with no gamma correction anywhere in the WS2812 path, timer drift under load, whether a
real finger is ever motionless enough to trip a 2 s watchdog, and whether anything strobes when it is
left alone for fifteen minutes. Eighteen rows, each with the reason it belongs to a bench and not to
a test suite.

It runs on your bench, in daytime, and it blocks nothing. The phase is complete and green without it.
A failing row is a bug report against a configuration — a knob value or a colour in an entry file
plus a `frames.json` regeneration — never against the checklist, the gate, the host or anything
vendored.

## Before you start

1. **Capture your module's current configuration first**, so you can put it back when you are done.
   HANGAR's safety stance is that the module's original configuration is always recoverable, and
   nothing in this document is exempt from it.
2. **This goes through BOTOR's shelf, with minimalist mode off.** HANGAR installs now — a card's
   `TRY ON DEVICE` writes it into the module's memory with `PUT BACK` beside it, and `KEEP ON DEVICE`
   stores it behind a confirmation (`docs/INSTALL-RUNBOOK.md` is that flow's own checklist) — but only
   for a configuration that is already in the catalog. The audition through BOTOR's shelf is still
   the way to hear one that is not yet in the catalog, and it is the route this document assumes. No
   part of this audition is run by an executor or an orchestrator. It is yours.
3. **The one ordering rule: paste the Timer into event 6 first, then the Setup into event 0.**
   `gtt` is a no-op until the Timer event holds at least one stored action, and the Setup runs
   immediately in the live VM — so a Setup-first paste arms a timer that does not exist yet, and the
   pad simply sits still. It looks exactly like a broken configuration and it is not one.
   `_pad.ts`'s own `writePad` encodes the same rule. Row 1 of the checklist is this rule.
4. **MORPH, SLAM, KEYS, GRIDLOCK and TABLE are the exceptions that prove it** — none of the five has
   a Timer at all, the Timer event of each is the empty string, so all five are Setup only, and they
   are the five cards that start from the Setup alone.
5. **Have somewhere to write eighteen lines.** The results go back into this document under a dated
   `Results` heading; see [What to record](#what-to-record).

## Getting the exact text

One command:

```
AUDITION_DUMP=1 npx vitest run --project server src/lib/catalog/audition.spec.ts
```

It writes `.tmp-audition/<id>.setup.lua` for every hand-authored configuration and
`.tmp-audition/<id>.timer.lua` for every one that has a Timer — thirteen Setup files and eight Timer
files — rendered at that configuration's default knob positions, and prints each file's character
count beside the 908-character budget. `.tmp-audition/` is gitignored; the command commits nothing
and, unlike the repository's other env-guarded writers, it does not fail the run.

**These are the exact bytes to paste.** Every configuration ships as a template with `@TOKEN`
substitution points in it, and what belongs on the module is the render at the defaults, which is
what the dump writes. Retyping a line of it by hand is how a one-character difference becomes an hour
of confusion — and because every configuration is stored in canonical compressed form, one stray
space is also a budget change.

## The thirteen, and what they cost

Measured at their default knob positions with the pinned minifier. The first seven come from
`08-06-SUMMARY.md`; HOLD, STEPS and SLAM were measured by `09-03-SUMMARY.md`, and KEYS, GRIDLOCK and
TABLE by `09-04-SUMMARY.md`:

| id         | name     | Setup | Timer            | knobs | dark at rest |
| ---------- | -------- | ----- | ---------------- | ----- | ------------ |
| `euclid`   | EUCLID   | 702   | 218              | 6     | no           |
| `chorus`   | CHORUS   | 729   | 173              | 6     | no           |
| `arc`      | ARC      | 379   | 251              | 5     | no           |
| `ghost`    | GHOST    | 305   | 333              | 5     | yes          |
| `lattice`  | LATTICE  | 615   | 171              | 6     | no           |
| `morph`    | MORPH    | 507   | 0 — **no Timer** | 5     | yes          |
| `sonar`    | SONAR    | 432   | 279              | 5     | no           |
| `hold`     | HOLD     | 696   | 102              | 5     | no           |
| `steps`    | STEPS    | 388   | 251              | 6     | no           |
| `slam`     | SLAM     | 659   | 0 — **no Timer** | 5     | no           |
| `keys`     | KEYS     | 644   | 0 — **no Timer** | 5     | no           |
| `gridlock` | GRIDLOCK | 425   | 0 — **no Timer** | 5     | no           |
| `table`    | TABLE    | 529   | 0 — **no Timer** | 4     | no           |

**MORPH, SLAM, KEYS, GRIDLOCK and TABLE are Setup-only, and that is legitimate rather than an
omission.** MORPH and SLAM animate only under a finger, with a per-touch decay that firmware runs
down to black on its own; KEYS paints a scale map once and never moves it; GRIDLOCK's ripple carries
its own countdown down to exact black; and TABLE redraws only when a finger crosses a shape
boundary. None of the five has anything for a Timer to advance. Store nothing into event 6 for any
of them; row 1's install-order rule below does not apply to a configuration that has no Timer at all.

GHOST and MORPH being dark at rest is a declared fact about them, not a fault: GHOST has nothing to
show until you draw a gesture for it to replay, and MORPH's corners light under a finger. If either
looks black on arrival, that is correct.

LATTICE is worth one line of arithmetic before you play it, because the layout is isomorphic and a
wrong note reads as a broken configuration: at the defaults the bottom-left cell is note 36, one
column right is 37 — a semitone — and one row up is **41**, a perfect fourth of five semitones. The
research document prints 42 there; 41 is what the arithmetic says and what the module will play.

## The checklist

Eighteen rows, in order. Each names why it cannot be simulated, so no row is busywork.

| #   | Config            | What to check                                                                                                                                                                                                                                                                             | Why it cannot be simulated                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | any               | Store the Timer into event 6 first, then the Setup into event 0. Confirm the pad starts moving within a second.                                                                                                                                                                           | `gtt` is a no-op until the Timer event holds a stored action, so the wrong order leaves a live Setup with nothing to fire it.                                                                                                                                                                                                                                                                                              |
| 2   | EUCLID            | The three rings visibly run at different speeds, and the 48-tick pattern repeats.                                                                                                                                                                                                         | Perceived polyrhythm — whether three beating cycles read as one groove or as noise is a judgement no frame hash makes.                                                                                                                                                                                                                                                                                                     |
| 3   | EUCLID / SONAR    | Tap-to-toggle feels reliable and does not double-trigger.                                                                                                                                                                                                                                 | Real T100 touch event codes, including the fast-tap DOWNUP 9 that firmware coalesces into a single message.                                                                                                                                                                                                                                                                                                                |
| 4   | ARC               | Sliding along X accelerates the swirl **without a phase jump**.                                                                                                                                                                                                                           | `glf` is a rate-only setter on real hardware; a phase reset would be plainly visible and no simulator can rule it out.                                                                                                                                                                                                                                                                                                     |
| 5   | ARC               | The 3x3 heart pulse is visible at the chosen colour and brightness.                                                                                                                                                                                                                       | Physical LED diffusion — nine adjacent cells on a real diffuser are not nine pixels.                                                                                                                                                                                                                                                                                                                                       |
| 6   | GHOST             | The replayed ghost runs at the speed you drew it.                                                                                                                                                                                                                                         | Timer drift under load; the simulator's clock is exact and the module's is not.                                                                                                                                                                                                                                                                                                                                            |
| 7   | CHORUS / LATTICE  | Hold a chord dead still for three seconds. Does the 2 s watchdog cut it?                                                                                                                                                                                                                  | A motionless finger emits nothing, because enqueue is change-gated — and whether a real finger is ever motionless is a physical question.                                                                                                                                                                                                                                                                                  |
| 8   | LATTICE           | The root lattice is legible at the dim out-of-scale colour; raise it if it is not.                                                                                                                                                                                                        | Physical brightness of `0,25,50` after the divide-by-512, with no gamma correction anywhere in the WS2812 path.                                                                                                                                                                                                                                                                                                            |
| 9   | MORPH             | Corner brightness tracks the blend readably from across the room.                                                                                                                                                                                                                         | Perception — a bilinear blend that is numerically correct can still be unreadable at two metres.                                                                                                                                                                                                                                                                                                                           |
| 10  | SONAR             | The sweep reads as a rotation rather than a scan, and armed cells stay visible underneath it.                                                                                                                                                                                             | Perceived motion, and LED contrast between a moving bright layer and a static armed one.                                                                                                                                                                                                                                                                                                                                   |
| 11  | MIRROR (optional) | **Optional — unblocks a future configuration and ships nothing today.** With `grxm(0,2)` and a `midirx_cb`, does an inbound CC from the DAW move a bar at all? If not, MIRROR stays unshipped. The script is now written out in `docs/MIDI-IN-PROBE.md`, which covers MIDI clock as well. | The one MEDIUM-confidence claim in the research: firmware shows the path, nothing shows the traffic arriving or what `instr` it carries.                                                                                                                                                                                                                                                                                   |
| 12  | any               | Leave a card running for fifteen minutes. Confirm nothing freezes and nothing strobes.                                                                                                                                                                                                    | The 655 s `glt` ceiling, and pitfall 1 — a keeper on a decaying trail wraps the countdown and strobes forever, which only time on hardware surfaces.                                                                                                                                                                                                                                                                       |
| 13  | **HOLD**          | Latch a value, then lift and put the same finger down and up quickly several times in different places. Does the latched cell always follow, or does one of them stick? Leave it latched for five minutes and confirm the breathing has not frozen.                                       | **The simulator deliberately cannot reproduce this.** Firmware advances `prev_*` before the writability check, so a dropped release leaves a permanently stuck contact — and `pad-sim.ts` states it only runs the watchdog semantics and cannot manufacture the stuck contact. Latching is the one gesture where a green test is not evidence. Also the 655 s `glt` ceiling: only time on hardware shows a frozen breathe. |
| 14  | STEPS             | The column sweep reads as a single moving bar rather than a flicker, and a tapped cell arms on the first touch every time.                                                                                                                                                                | Perceived motion at 30 fps against a physical diffuser, and real T100 touch codes including the fast-tap DOWNUP 9 that firmware coalesces into one message.                                                                                                                                                                                                                                                                |
| 15  | SLAM              | Hit the same zone high and low. Does the note get audibly louder, and does the bloom get taller by the same amount?                                                                                                                                                                       | Whether a height-derived velocity feels like a velocity is a judgement, and the mapping from lit rows to a loudness you hear is not a number any frame hash checks.                                                                                                                                                                                                                                                        |
| 16  | **KEYS**          | Stand back a metre. Are the three brightness levels — root, in-scale, out of key — still three, and do the unlit cells read as a deliberate absence rather than as dead LEDs?                                                                                                             | Physical brightness after the divide-by-512 with no gamma correction anywhere in the WS2812 path, and whether an unlit cell reads as a design or as a fault is a perception, not a byte.                                                                                                                                                                                                                                   |
| 17  | **GRIDLOCK**      | Fire cells fast in several different places, overlapping. Do the rings read as separate events, or does one cancel another? Then let the pad settle and confirm the nine track blocks are exactly as they were.                                                                           | Layer arithmetic is additive and the simulator sums it exactly; whether two overlapping rings on a physical diffuser read as two events is a judgement. The settle is arithmetically exact here and still worth one look on real LEDs.                                                                                                                                                                                     |
| 18  | **TABLE**         | Sweep X slowly across all four shapes and then as fast as you can. Does the plot change where your finger expects it to, and does the redraw ever stutter or drop a touch under the fast sweep?                                                                                           | The redraw is gated to keep `touch_cb` under a millisecond; whether that budget holds on the module under a real fast sweep, with real T100 sample timing, is exactly what no simulator clock can tell you.                                                                                                                                                                                                                |

## What to record

One line per row: pass, fail, or a note.

- **Row 8** wants the colour you actually used, if the dim out-of-scale colour had to be raised.
- **Row 11** wants the answer, and — if an inbound CC did move a bar — the `instr` value you
  observed. That single answer is what unblocks or permanently drops MIRROR. `docs/MIDI-IN-PROBE.md`
  holds the script for this row, and it names the two answers it wants — inbound CC, and MIDI clock —
  and where to write them.

The results belong in this document, under a dated `## Results` heading below. A failing row is a bug
report against the configuration it names: the fix is a knob value or a colour in
`src/lib/catalog/entries/<id>.ts` plus a `frames.json` regeneration, and nothing else.

## Results

None yet. This audition has not been run.

## A closing note on colour

Every RGB triple in the seven configurations is a starting point chosen on a screen, not a measured
result. One layer caps at 49.6 % and there is no gamma correction anywhere in the path, so a colour
that reads well in the simulator can be muddy or blinding on a diffuser. Changing one is a knob-value
edit in the entry file plus a `frames.json` regeneration — it touches no gate, no host and nothing
vendored.
