# The simulator cannot produce the gesture five waves of this phase fixed

Found 2026-09-10 by plan 11-09.1 while rejecting a gesture design, and confirmed
directly afterwards by reading the sampler. Recorded here because it is a
fidelity gap, not a bug, and because the phase has now spent five waves on
behaviour the preview cannot reproduce through its own input path.

## What is true

`src/lib/sim/touch.ts` emits exactly three firmware event codes:

| constant | code | site |
|---|---|---|
| `EVT_DOWN` | 4 | `:99` |
| `EVT_MOVE` | 1 | `:122` |
| `EVT_UP` | 5 | `:136` |

**It never emits code 9 (DOWNUP).** 11-09.1 measured it from the other end and
got the same answer: a 300 ms press and the fastest press a pointer can make
*both* deliver `4` then `5`.

## Why it matters

Code 9 is the firmware's **coalesced fast tap** — a press and a lift arriving as
one message with no separate UP behind it. It is the whole subject of this
phase's class-B work:

- 11-02 admitted it in five hand-authored entries. Measured: **GHOST 0 → 406
  MIDI messages** on a fast tap, CHORUS 0 → 6, MORPH 0 → 4, LATTICE 0 → 2.
- 11-04 admitted it in the vendored compiler, reaching all nine presets.
  Measured: **RADAR 0 → 2, JOYSTICK 2 → 4, FADERS 0 → 1**, PINWHEEL from no
  trail at all.
- 11-08, 11-09 and 11-09.1 all designed around it.

Every one of those measurements was taken by **scripting code 9 into the Lua
host directly**. None of them went through `touch.ts`, because `touch.ts` cannot
produce it.

**So a visitor on the website can never trigger the behaviour the user reported
from their bench.** On hardware a quick tap is one message; in the preview the
same gesture is two. The fixes are right for the device — that is where the
user found the defect and where it matters — but the card in the browser is
demonstrably not doing what the card on the desk does, for the one gesture this
phase spent the most effort on.

## What this is not

**It is not the simulator being wrong.** `touch.ts`'s job is to convert pointer
events into at most one sample per contact per 10 ms tick, and it does that
faithfully. Nothing in it claims to model the firmware's coalescing.

**It is not the class-B fixes being wrong.** They are correct for the firmware
and were verified against it. If anything this makes them more valuable: the
defect was invisible in the preview and could only ever have been found on
hardware — which is exactly how it *was* found.

## The options, costed at the level this document can honestly reach

1. **Teach `touch.ts` to coalesce.** When a contact's down and up fall inside one
   tick, emit a single `9` instead of `4` then `5`. That is what the firmware
   does, and it would make the preview reproduce the gesture. The risk is that
   `touch.ts` is upstream of every entry in the catalog and a change there moves
   every fixture that samples a gesture — this needs measuring, not assuming.
2. **Record it and ship as is.** The preview stays unable to show a fast tap.
   Every class-B fix remains hardware-only, and the honest statement is that the
   browser under-reports what the pad does.
3. **Assert it deliberately**, so the gap is a declared property rather than an
   accident — a test naming the three codes and stating that 9 is out of scope,
   with the reason.

**Option 1 is the one that closes the gap and the one with real blast radius.**
Nothing here decides it; it belongs to whoever owns the fidelity contract, and
11-16 should carry it rather than let a later reader rediscover it.

## The immediate consequence, which is already paid

11-09.1 rejected a gesture design that depended on distinguishing a coalesced
DOWNUP from a separate down-and-up, **because in the preview that distinction
does not exist**. That retired a whole class of gesture design for this
catalog, and it is the largest carried fact of that wave.
