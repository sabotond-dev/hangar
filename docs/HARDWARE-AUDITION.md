# The ZONA hardware audition

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

Phase 8 authored seven configurations for HANGAR — EUCLID, CHORUS, ARC, GHOST, LATTICE, MORPH and
SONAR — and Phase 9 added twenty more, closing at QUADRANT and POMODORO. Phase 11 then removed nine
of the twenty-seven on the user's own bench report — HOLD, KEYS, LEARN, SWITCH, ETCH, GRIDLOCK,
LIFE, SLAM and TABLE. **This document covers every hand-authored configuration still in the catalog:
eighteen of them.**
Everything a machine can check about them is already green: each one is stored in canonical
compressed form, fits both 908-character budgets at its defaults and across its entire knob
cross-product, runs in a real Lua 5.4 VM driving the firmware-faithful LED engine without error, and
has a recorded golden frame set.

This document is the list of things a machine cannot check. Perceived polyrhythm, real touch event
codes, `glf`'s rate-only behaviour on physical hardware, LED diffusion and brightness after the
divide-by-512 with no gamma correction anywhere in the WS2812 path, timer drift under load, whether a
real finger is ever motionless enough to trip a 2 s watchdog, and whether anything strobes when it is
left alone for fifteen minutes. Twenty-three rows, each with the reason it belongs to a bench and
not to a test suite. **Five of the twenty-three are the ones where a green test is not evidence**,
and they are pulled together in their own section below so that a person with an hour rather than an
afternoon knows where to start. It was thirty-two rows and six of them until plan 11-01 removed nine
configurations; the sixth was HOLD's latch, which left with HOLD.

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
4. **MORPH, CONSOLE, STRIP, LUMEN, CULL and QUADRANT are Setup only** — none of the six has a Timer
   at all, the Timer event of each is the empty string, and they are the six cards that start from
   the Setup alone. They are the exceptions that prove the rule above.
5. **Have somewhere to write twenty-three lines.** The results go back into this document under a
   dated `Results` heading; see [What to record](#what-to-record).

## Getting the exact text

One command:

```
AUDITION_DUMP=1 npx vitest run --project server src/lib/catalog/audition.spec.ts
```

It writes `.tmp-audition/<id>.setup.lua` for every hand-authored configuration and
`.tmp-audition/<id>.timer.lua` for every one that has a Timer — eighteen Setup files and twelve
Timer files — rendered at that configuration's default knob positions, and prints each file's character
count beside the 908-character budget. `.tmp-audition/` is gitignored; the command commits nothing
and, unlike the repository's other env-guarded writers, it does not fail the run.

**These are the exact bytes to paste.** Every configuration ships as a template with `@TOKEN`
substitution points in it, and what belongs on the module is the render at the defaults, which is
what the dump writes. Retyping a line of it by hand is how a one-character difference becomes an hour
of confusion — and because every configuration is stored in canonical compressed form, one stray
space is also a budget change.

## The eighteen, and what they cost — every hand-authored configuration in the catalog

Measured at their default knob positions with the pinned minifier. The first seven come from
`08-06-SUMMARY.md`; STEPS was measured by `09-03-SUMMARY.md`, CONSOLE and STRIP by
`09-05-SUMMARY.md`, LUMEN, STAGE and SHUTTLE by `09-06-SUMMARY.md`, CULL and FORGE by
`09-07-SUMMARY.md`, SNAKE by `09-08-SUMMARY.md`, and QUADRANT and POMODORO by `09-09-SUMMARY.md`.
**LUMEN was RE-MEASURED by `11-10-SUMMARY.md` and its row now reads 742, not the 604 it read
from plan 09-06 until then** — plan 11-10 removed two `*127//128` scales (−18) and added the
sysex colour send (+156). Every other row in this table is still its original wave's measurement and
none of them has been re-checked.
The nine other measurements that used to sit here left with the nine configurations plan 11-01
removed. The catalog holds nine more entries, and those nine are BOTOR's shelf presets rather than
HANGAR's own Lua:

| id         | name     | Setup | Timer            | knobs | dark at rest |
| ---------- | -------- | ----- | ---------------- | ----- | ------------ |
| `euclid`   | EUCLID   | 702   | 218              | 6     | no           |
| `chorus`   | CHORUS   | 729   | 173              | 6     | no           |
| `arc`      | ARC      | 379   | 251              | 5     | no           |
| `ghost`    | GHOST    | 305   | 333              | 5     | yes          |
| `lattice`  | LATTICE  | 615   | 171              | 6     | no           |
| `morph`    | MORPH    | 507   | 0 — **no Timer** | 5     | yes          |
| `sonar`    | SONAR    | 432   | 279              | 5     | no           |
| `steps`    | STEPS    | 388   | 251              | 6     | no           |
| `console`  | CONSOLE  | 785   | 0 — **no Timer** | 5     | no           |
| `strip`    | STRIP    | 638   | 0 — **no Timer** | 5     | no           |
| `lumen`    | LUMEN    | 742   | 0 — **no Timer** | 4     | no           |
| `stage`    | STAGE    | 505   | 109              | 4     | no           |
| `shuttle`  | SHUTTLE  | 663   | 201              | 6     | no           |
| `cull`     | CULL     | 564   | 0 — **no Timer** | 4     | no           |
| `forge`    | FORGE    | 716   | 373              | 5     | no           |
| `snake`    | SNAKE    | 581   | 870              | 5     | no           |
| `quadrant` | QUADRANT | 835   | 0 — **no Timer** | 4     | no           |
| `pomodoro` | POMODORO | 733   | 647              | 5     | no           |

**MORPH, CONSOLE, STRIP, LUMEN, CULL and QUADRANT are Setup only, and that is legitimate rather
than an omission.** MORPH animates only under a finger, with a per-touch decay that firmware runs
down to black on its own; CONSOLE and STRIP are control surfaces whose picture is a readout of the
last value you sent, repainted on the change that caused it and never otherwise; LUMEN computes
eighty-one colours once and then has nothing left to do; CULL paints a legend once and then has only
a per-press decay, which firmware runs down to exact black on its own; and QUADRANT is four targets
that are supposed to sit still, so a Timer would be motion nobody asked for on the one card whose
whole claim is that you can find it without looking.
None of the six has anything for a Timer to advance. Store nothing into event 6 for any of them;
row 1's install-order rule below does not apply to a configuration that has no Timer at all.

GHOST and MORPH being dark at rest is a declared fact about them, not a fault: GHOST has nothing to
show until you draw a gesture for it to replay, and MORPH's corners light under a finger. It was
three until plan 11-01 removed ETCH. If either of the two looks black on arrival, that is correct.

LATTICE is worth one line of arithmetic before you play it, because the layout is isomorphic and a
wrong note reads as a broken configuration: at the defaults the bottom-left cell is note 36, one
column right is 37 — a semitone — and one row up is **41**, a perfect fourth of five semitones. The
research document prints 42 there; 41 is what the arithmetic says and what the module will play.

## The five rows where a green test is not evidence

If you have an hour rather than an afternoon, run these five first. Everything in this document is
something a machine cannot check, but most of the rows are asking you to judge something — whether a
polyrhythm grooves, whether a colour reads at two metres. **These five are different. On each of them
the automated suite is green and the automated suite is not evidence**, and the reason splits cleanly
into two families that fail in two different ways.

**The latch-and-time family — rows 14, 20 and 23. CONSOLE, FORGE and POMODORO.** Two of
them latch: a contact goes down, something stays on, and the contact comes up. Firmware advances
`prev_*` **before** the writability check, so a release that is dropped under load leaves a
permanently stuck contact, and `pad-sim.ts` states in its own comment that it implements only the
watchdog semantics and **cannot manufacture that stuck contact**. The simulator is not failing to
model the bug; it deliberately does not model it, which means a green frame comparison over a latch
is a statement about a pad that does not have the bug. The third, POMODORO, is the time half of the
same problem: it runs for twenty-five minutes past a 655-second `glt` ceiling, and the re-issue that
carries it across has been checked over 160,000 simulated ticks on a clock that is exact and never on
one that is not. **What to do about it:** work the latch fast and repeatedly, in different places,
and count. A stuck contact is a thing you see once in fifty gestures, not once in five.

**The keystroke family — rows 17 and 18. STAGE and SHUTTLE.** These do not fail; they are simply not
observed. `gks` resolves in `src/lib/sim/lua-host.ts`, is recorded into `hidLog`, and `lua-host.ts`
says at `:429` that **nothing in HANGAR consumes it**. The card animates correctly, the smoke gate
counts the keystroke as output, the budget fits, the frames match — and not one of those says a key
was pressed, let alone which key. Four configurations in this catalog send keystrokes (STAGE,
SHUTTLE, CULL and FORGE — SWITCH was the fifth and plan 11-01 removed it); every usage id in all
four was checked by hand against the USB HID Usage Tables Keyboard/Keypad page 0x07 and by nothing
else. **What to do about it:** put a real
application in front of it and watch what arrives. A wrong usage id looks exactly like a right one
from here.

The difference between the two families matters when a row fails. A latch that sticks is a
**firmware** behaviour the configuration has to survive; a keystroke that arrives as the wrong key is
a **number in an entry file**. The first is a note in the results below, the second is a one-line fix.

## The checklist

Twenty-three rows, in order. Each names why it cannot be simulated, so no row is busywork. The five
above are 14, 17, 18, 20 and 23.

| #   | Config            | What to check                                                                                                                                                                                                                                                                             | Why it cannot be simulated                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | any               | Store the Timer into event 6 first, then the Setup into event 0. Confirm the pad starts moving within a second.                                                                                                                                                                           | `gtt` is a no-op until the Timer event holds a stored action, so the wrong order leaves a live Setup with nothing to fire it.                                                                                                                                                                                                                                                                                                                                                     |
| 2   | EUCLID            | The three rings visibly run at different speeds, and the 48-tick pattern repeats.                                                                                                                                                                                                         | Perceived polyrhythm — whether three beating cycles read as one groove or as noise is a judgement no frame hash makes.                                                                                                                                                                                                                                                                                                                                                            |
| 3   | EUCLID / SONAR    | Tap-to-toggle feels reliable and does not double-trigger.                                                                                                                                                                                                                                 | Real T100 touch event codes, including the fast-tap DOWNUP 9 that firmware coalesces into a single message.                                                                                                                                                                                                                                                                                                                                                                       |
| 4   | ARC               | Sliding along X accelerates the swirl **without a phase jump**.                                                                                                                                                                                                                           | `glf` is a rate-only setter on real hardware; a phase reset would be plainly visible and no simulator can rule it out.                                                                                                                                                                                                                                                                                                                                                            |
| 5   | ARC               | The 3x3 heart pulse is visible at the chosen colour and brightness.                                                                                                                                                                                                                       | Physical LED diffusion — nine adjacent cells on a real diffuser are not nine pixels.                                                                                                                                                                                                                                                                                                                                                                                              |
| 6   | GHOST             | The replayed ghost runs at the speed you drew it.                                                                                                                                                                                                                                         | Timer drift under load; the simulator's clock is exact and the module's is not.                                                                                                                                                                                                                                                                                                                                                                                                   |
| 7   | CHORUS / LATTICE  | Hold a chord dead still for three seconds. Does the 2 s watchdog cut it?                                                                                                                                                                                                                  | A motionless finger emits nothing, because enqueue is change-gated — and whether a real finger is ever motionless is a physical question.                                                                                                                                                                                                                                                                                                                                         |
| 8   | LATTICE           | The root lattice is legible at the dim out-of-scale colour; raise it if it is not.                                                                                                                                                                                                        | Physical brightness of `0,25,50` after the divide-by-512, with no gamma correction anywhere in the WS2812 path.                                                                                                                                                                                                                                                                                                                                                                   |
| 9   | MORPH             | Corner brightness tracks the blend readably from across the room.                                                                                                                                                                                                                         | Perception — a bilinear blend that is numerically correct can still be unreadable at two metres.                                                                                                                                                                                                                                                                                                                                                                                  |
| 10  | SONAR             | The sweep reads as a rotation rather than a scan, and armed cells stay visible underneath it.                                                                                                                                                                                             | Perceived motion, and LED contrast between a moving bright layer and a static armed one.                                                                                                                                                                                                                                                                                                                                                                                          |
| 11  | MIRROR (optional) | **Optional — unblocks a future configuration and ships nothing today.** With `grxm(0,2)` and a `midirx_cb`, does an inbound CC from the DAW move a bar at all? If not, MIRROR stays unshipped. The script is now written out in `docs/MIDI-IN-PROBE.md`, which covers MIDI clock as well. | The one MEDIUM-confidence claim in the research: firmware shows the path, nothing shows the traffic arriving or what `instr` it carries.                                                                                                                                                                                                                                                                                                                                          |
| 12  | any               | Leave a card running for fifteen minutes. Confirm nothing freezes and nothing strobes.                                                                                                                                                                                                    | The 655 s `glt` ceiling, and pitfall 1 — a keeper on a decaying trail wraps the countdown and strobes forever, which only time on hardware surfaces.                                                                                                                                                                                                                                                                                                                              |
| 13  | STEPS             | The column sweep reads as a single moving bar rather than a flicker, and a tapped cell arms on the first touch every time.                                                                                                                                                                | Perceived motion at 30 fps against a physical diffuser, and real T100 touch codes including the fast-tap DOWNUP 9 that firmware coalesces into one message.                                                                                                                                                                                                                                                                                                                       |
| 14  | **CONSOLE**       | Mute and unmute a strip a dozen times quickly, in different columns. Does a mute ever stick on, or clear on its own?                                                                                                                                                                      | **The dropped-release bug, and this row is now its first statement** — HOLD carried it before plan 11-01 removed HOLD. Firmware advances `prev_*` before the writability check, so a release dropped under load leaves a permanently stuck contact, and `pad-sim.ts` states it only runs the watchdog semantics and cannot manufacture that contact. A latch is where that bug shows.                                                                                             |
| 15  | **STRIP**         | Move slowly across one cell's worth of travel while watching the host's value. Do the low seven bits move smoothly, or jump?                                                                                                                                                              | **This is where the two-message claim is checked, and it is the only place it can be.** One `gms` with `mode: 1` becomes two CC messages on the wire — `@CC` then `@CC + 32` — and firmware, not HANGAR, does the expanding: `lua-host.ts` records one message per call and stores `mode` as a field, so the browser never sees a pair. Whether the two arrive, arrive in order, and arrive in the same cycle for the host to reassemble is a wire question no simulator answers. |
| 16  | **LUMEN**         | Hold the module beside a lit fixture driven by the colours it is sending and compare the two by eye, at three points across the pad and at the top and bottom of a column.                                                                                                                | No gamma correction anywhere in the WS2812 path and no colour management at either end — the desk has its own curve and the lamp its own gamut. Whether two lights match is the one question only two lights answer.                                                                                                                                                                                                                                                              |
| 17  | **STAGE**         | Plug the module into a computer with OBS open, bind three scenes to the keys this card sends, and press them. **Do the keystrokes arrive at all, and do they arrive as the right keys?** Try it with a modifier and without one.                                                          | **`gks` is recorded and inert in the browser** — `src/lib/sim/lua-host.ts` binds it to `recordHid` and says at `:429` that nothing in HANGAR consumes them. Every keystroke configuration in this catalog is unverified until this row is run, and no gate in this repository can catch a wrong usage id.                                                                                                                                                                         |
| 18  | **SHUTTLE**       | Scrub in a video editor at each of the four speeds, in both directions. Do the keystrokes keep up, does the transport actually reverse, and does the arc's spin match how fast the picture is moving?                                                                                     | The same HID invisibility as row 17, plus the 256-byte per-cycle protocol buffer: `gks` costs 10 + 4n bytes and one 10 ms cycle holds about sixty-one key steps, so whether the module can press a key as fast as the top speed asks is a firmware question a simulator cannot answer.                                                                                                                                                                                            |
| 19  | **CULL**          | Look at the pad through a colour-blindness simulator, or squint until the five colours merge into one. Are the five ratings still tellable apart, and can you name which band is which without checking?                                                                                  | The claim is about perception under a condition no frame hash models. A physical diffuser blurs a one-cell fill in a way a pixel grid does not, and whether a checker and a three-pip row survive that blur is the whole accessibility claim this card makes.                                                                                                                                                                                                                     |
| 20  | **FORGE**         | Hold the bottom-right corner, run three macros, release. Then hold it and lift with a fast flick a dozen times, and once slide off the corner before lifting. **Does the bank ever stay stuck in B?** Then hold it still for fifteen seconds and confirm the watchdog drops it back to A. | **The dropped-release bug.** Firmware advances `prev_*` before the writability check (`grid_ui_touch.c:126-142`) and `pad-sim.ts` states it only runs the watchdog semantics and cannot manufacture the stuck contact, so a stranded bank is invisible in a browser. The watchdog that answers it is a mitigation nobody has watched fire on hardware.                                                                                                                            |
| 21  | **SNAKE**         | Play a full game. Does the snake turn where you meant it to, or does the turn arrive a beat late? Then take your finger off and watch it play itself.                                                                                                                                     | One touch sample per 10 ms cycle across all contacts, plus a display that appears 0 to 10 ms after the write on a different core — the felt latency of a steer is exactly what a deterministic simulator cannot report.                                                                                                                                                                                                                                                           |
| 22  | **QUADRANT**      | Stand back two metres. Can you name each quadrant by its fill alone, with the colours ignored? Then hit each one without looking, ten times each, and count the misses that landed on the dark cross.                                                                                     | The claim is about perception at a distance through a physical diffuser, and whether a target is hittable without looking is a question about hands. A pixel comparison says the four fills differ; it cannot say a person can tell them apart, and it cannot say a finger lands where its owner meant it to.                                                                                                                                                                     |
| 23  | **POMODORO**      | Start it and leave the module alone for the full interval. **Does the inner breathe still move at the end, and does the ring reach zero at the right time?** Note how far behind a wall clock it finishes.                                                                                | The 655 s `glt` ceiling: the animation freezes when the countdown expires and only a re-issued rate restarts it. The re-issue is checked in a browser over 160,000 simulated ticks and has never run on hardware, where the Timer fires on the next 100 Hz cycle after its countdown and drifts under load over 1500 of them.                                                                                                                                                     |

## What to record

One line per row: pass, fail, or a note.

- **Row 8** wants the colour you actually used, if the dim out-of-scale colour had to be raised.
- **Row 11** wants the answer, and — if an inbound CC did move a bar — the `instr` value you
  observed. That single answer is what unblocks or permanently drops MIRROR. `docs/MIDI-IN-PROBE.md`
  holds the script for this row, and it names the two answers it wants — inbound CC, and MIDI clock —
  and where to write them.
- **Rows 14 and 20 want a count, not a verdict.** A stuck contact is intermittent by nature, so
  "it did not stick" is only useful with a number beside it: how many fast flicks, and how many of
  them stuck. Row 20 in particular — how many flicks before the bank stayed in B, if it ever did.
- **Rows 17 and 18 want the keys that actually arrived**, not just whether something arrived. A wrong
  usage id looks exactly like a right one from a browser, so write down what the application saw.

The results belong in this document, under a dated `## Results` heading below. A failing row is a bug
report against the configuration it names: the fix is a knob value or a colour in
`src/lib/catalog/entries/<id>.ts` plus a `frames.json` regeneration, and nothing else.

## Results

None yet. This audition has not been run.

## A closing note on colour

Every RGB triple in the eighteen configurations is a starting point chosen on a screen, not a
measured result. One layer caps at 49.6 % and there is no gamma correction anywhere in the path, so a colour
that reads well in the simulator can be muddy or blinding on a diffuser. Changing one is a knob-value
edit in the entry file plus a `frames.json` regeneration — it touches no gate, no host and nothing
vendored.
