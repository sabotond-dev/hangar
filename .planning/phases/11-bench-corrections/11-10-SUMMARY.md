---
phase: 11-bench-corrections
plan: 10
subsystem: sim
tags: [gmss, sysex, lua-host, host-globals, lumen, hex, seven-bit, budget]
requires:
  - phase: 11-bench-corrections
    plan: 09.2
    provides: "LUMEN's depth verdict - the knob delivers, row 0 cannot move, {1,2,3,4} is the whole legal travel - and the entry handed on at 608 Setup / 300 free at the picker corner with the whole 908 Timer unspent"
  - phase: 11-bench-corrections
    plan: 09.1
    provides: "the PREV_FILES 84 / PREV_E2E 86 source + 105 runs / BASE_CHECK 580 / sweep 4 19 / catalog 27 baseline"
  - phase: 11-bench-corrections
    plan: 09
    provides: "the four checkpoint answers, including the LUMEN sysex note this plan is the whole of"
provides:
  - "gmss, midi_sysex_send, registered as the sixteenth host global, so a configuration that sends sysex can be PREVIEWED instead of raising in its own catalog card"
  - "HostSysex and recordSysex - a third recorded log beside MIDI and HID, keeping the whole payload in call order, unmasked"
  - "LUMEN sending the colour under the finger as six ASCII hex digits inside its own 0xF0 and 0xF7"
  - "Both sysex encodings costed against LUMEN's real budget, with the seven-bit rule named as the fact that decides between them rather than a preference"
  - "The x*127//128 latent defect measured and FIXED on both axes at minus eighteen characters"
  - "The recorded finding that nothing in HANGAR - not the host, not the vendored trap scanner - validates seven-bit sysex data"
affects: [11-11, 11-16]
tech-stack:
  added: []
  patterns:
    - "A recorded out-call log whose element type is the shape of the message rather than a widened neighbour, with the absence of a discriminant justified from the firmware's own API surface"
    - "An entry test that derives its expected payload by parsing the entry's own Lua, so a re-cut of the palette or the ramp survives it and only a broken encoding reddens"
    - "A negative check re-planted until it reddens on the clause it was written for, rather than accepted because the test went red somewhere"
key-files:
  created: []
  modified:
    - src/lib/sim/lua-host.ts
    - src/lib/sim/lua-host.spec.ts
    - src/lib/catalog/host-surface.spec.ts
    - src/lib/catalog/entries/lumen.ts
    - src/lib/catalog/listing.ts
    - src/lib/sim/lua-smoke.spec.ts
    - docs/HARDWARE-AUDITION.md
key-decisions:
  - "A third log rather than a widened HostHid or HostMidi, and no call discriminant at all, because gmss is the only sysex emitter in the whole Grid global table"
  - "ASCII hex over raw RGB, decided by the seven-bit rule and not by taste: LUMEN's row 0 asks for 255 and a raw payload could not carry it"
  - "The Setup event carries the send, gated on the cursor changing or a contact beginning; the Timer stays entirely unspent because a per-tick send is a different card"
  - "x*127//128 fixed rather than reported, because the fix costs MINUS eighteen characters and touches nothing the sysex work touches"
  - "The depth half is exactly 11-09.2's verdict, carried forward by name and re-opened by nothing here"
patterns-established:
  - "A wave that adds a capability to the host surface states the new count in the one place that counts it and publishes the grep proving there is no second place"
requirements-completed: [PREV-01, PREV-02, CONT-02]
duration: 34min
completed: 2026-09-10
---

# Phase 11 Plan 10: gmss reaches the host, and LUMEN's colour reaches the wire as hex Summary

**The sixteenth host global is a sysex send, and the entry that needed it now emits
`240, 125, 70, 70, 53, 65, 48, 48, 247` - "FF5A00" for the anchor colour - because
a raw channel of 255 is not a legal sysex data byte and hex is the only encoding
that is both transmissible and legible.**

## Performance

- **Duration:** 34 min, one executor session
- **Tasks:** 2 of 2
- **Files modified:** 7, across two source commits

---

## The counts, as a carried name plus a delta

| Name        | Carried (11-09.2)             | Observed              | Delta                                    |
| ----------- | ----------------------------- | --------------------- | ---------------------------------------- |
| `PREV_FILES`| 84                            | **84**                | **+0**                                   |
| `PREV_TESTS`| 859                           | **862**               | **+3** — and the plan declared **+2**    |
| `PREV_E2E`  | 86 source titles / 105 runs   | **86 source titles**  | **+0** (the suite is not run by this plan)|
| `BASE_CHECK`| 580                           | **580**, `0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` | **+0** |
| sweep members| `4 19`                       | **`4 19`**            | **+0**                                   |
| catalog     | 27                            | **27**                | **+0**                                   |

`npm run test:quick` exits **0**: *"84 passed (84) / 862 passed | 1 todo (863)"*.
`node scripts/check-counts.mjs 84 862` exits **0**; `84 861` exits **1**,
*"tests: observed 862, expected 861"*. **Both were run and both are reported.**
`npm run test:sweep | node scripts/check-counts.mjs 4 19` exits **0**.
`npm run lint` clean. `grep -c "test(" e2e/*.e2e.ts` totals **86**.

### THE +3 AGAINST A DECLARED +2, WHICH IS THE PLAN'S OWN ARITHMETIC AND NOT A DEVIATION

**The plan asks for three tests and says the total is two.** Written out, because
this is exactly the shape 11-16 is told to report as a defect:

| Where | What the plan asks for | Added |
| --- | --- | --- |
| task 01 step 2 | "`lua-host.spec.ts` **+1**" | yes |
| task 01 step 3 | "`host-surface.spec.ts` **+1**" | yes |
| task 02 step 3 | "**+1** — a new test, not an extension of task 01's" | yes |

That is **+3**. The plan's `<verification>` reads `PREV_TESTS+2`, and task 02's own
justification for adding its test is that *"extending task 01's test instead would
leave the plan's own arithmetic disagreeing with its verification line"* — while
naming the `+2` term as *"(`lua-host.spec.ts` +1 and `host-surface.spec.ts` +1)"*,
which accounts for **task 01's two only** and omits its own.

**Every task's `<done>` was satisfied literally and the disagreement is reported
rather than reconciled**, per the standing rule. **The honest carried figure for
wave 14 is `PREV_TESTS` 862.**

### The sweep totals, re-observed and all unmoved

| Sweep readout | Carried | Observed | Moved? |
| --- | --- | --- | --- |
| compiler route / reachability | Pass A **20,782**, Pass B 24,576, total **45,358** | identical | **no** |
| Lua route round trip | Pass A **49,824** (w 49,424, x 382), Pass B 118,784, total **168,608** | identical | **no** |
| `lua-entries` | **1,176** combinations, 2,352 measurements | identical | **no** |
| kind cross-product | 1,296 combinations, worst **906 of 908** | identical | **no** |

**A FOURTH independent confirmation that the compiler-route Pass A cannot move
for a hand-authored Lua entry.** 11-09 found it, 11-09.1 and 11-09.2 confirmed it,
and this wave — which added 138 characters of Lua to LUMEN — confirms it again.
LUMEN's own sweep row reads `passA 64, passB 4096, format w, payload 8 characters`,
**unmoved**: the knob shapes did not move, and Pass A counts knob positions rather
than characters.

---

## Task 11-10-01 — gmss reaches the host (`3e36f75`)

### The recorder, chosen rather than copied, with the reason in the binding

**A THIRD LOG.** `HostSysex = { readonly bytes: readonly number[] }`, its own
`sysexLog`, its own `recordSysex`, its own `host.sysex` getter, cleared by
`restart()` beside the other two.

**Why not `HostHid`:** sysex is not a human interface device, and the union
`"gmms" | "gmbs" | "gks"` is what makes the recorded HID list readable at a
glance. Widening it puts a MIDI message in a type named for mouse clicks.

**Why not `HostMidi`:** `gms` does have a recorded-MIDI path and it was read
before anything was written, as the plan asked. It does not fit. `HostMidi` is
five FIXED fields — `ch`, `cmd`, `p1`, `p2`, `mode` — because a voice message is
exactly those five. A sysex message has no channel, no command nibble and no two
data bytes; it is a variable-length run of bytes. **Four of the five fields would
be permanently zero**, which is a type describing something it is not.

**AND NO `call` DISCRIMINANT, WHICH IS THE ONE PLACE THIS DEPARTS FROM THE PLAN'S
SUGGESTED SHAPE.** The plan asked for "a sibling recorder — `recordSysex`, its own
recorded list, **its own union**". The union was not built, and the reason is a
read fact rather than a preference: `ZONA_REFERENCE.md:1249-1250` states, verified
against `grid_lua_api.c:2220-2221`, that **`gms` and `gmss` are the only MIDI
emitters in the whole Grid global table**. A union over the sysex emitters
therefore has exactly one member and a discriminant that never discriminates.
Recorded here as a deviation rather than absorbed — see Deviations, item 1.

**The binding carries its reason in one sentence**, as asked:

```
// Its OWN recorder rather than recordHid's, because a sysex message is a
// variable-length run of bytes and not a mouse click, so it gets a list
// whose element type says so instead of a `call` union widened past what
// it is named for.
gmss: (...args: unknown[]) => this.recordSysex(args),
```

**The whole payload is recorded, byte by byte, in call order**, and framing
included — `gmss` requires the CONFIGURATION to supply `0xF0` and `0xF7`
(`grid_lua_api.c:905-935`, read through `../zona-docs/docs/ZONA_REFERENCE.md:1241`
and `:2022`), so the framing bytes are payload and not something the host adds.

**F2Ieq AND NOTHING ELSE**, exactly as `recordHid` does. No seven-bit narrowing
and no range check, deliberately: masking here would turn a real defect in a
configuration into a message that looks fine in the preview and is wrong on the
wire. That decision is what makes the finding below findable.

### The sixteen, and the grep that proves there is no second place

`grep -rn "fifteen\|HOST_GLOBALS\|15 globals" src/ docs/` — **34 hits, every one
classified**:

| Hit | Classification |
| --- | --- |
| `src/lib/catalog/host-surface.spec.ts:5` — *"registers fifteen bare Grid names and nine `self:` methods"* | **MOVED** to sixteen, with the reason and the plan number in the next line. **This is the ONLY count of the host surface anywhere in `src/` or `docs/`.** |
| `host-surface.spec.ts` × 8, `lua-host.spec.ts` × 8, `lua-host.ts` × 5 (`HOST_GLOBALS` as an identifier) | **correctly left** — every one is a reference to the array, never a number. The array IS the count. |
| `decay-idiom.spec.ts:62` *"the other fifteen"* | **correctly left** — fifteen catalog entries with a decay idiom, unrelated |
| `entries/console.ts:82` *"fourteen or fifteen times"* | **correctly left** — a bench observation of toggles |
| `entries/strip.ts:56` *"the top fifteen codes"* | **correctly left** — a 14-bit fader's unreachable codes |
| `device/install-copy.ts:255` *"the fifteenth state"*, `install.spec.ts` × 3 *"fifteen states"* / `.toBe(15)` | **correctly left** — the `InstallPhase` union's fifteen members |
| `ui/Coverflow.svelte:955` *"fifteen pixels"* | **correctly left** — a layout measurement |
| `docs/HARDWARE-AUDITION.md` × 3 *"fifteen minutes"*, *"fifteen seconds"* | **correctly left** — bench durations |
| `docs/TESTING.md:531` *"Phase 5 added fifteen `server` spec files"* | **correctly left** — a historical wave count |
| `docs/TESTING.md:854` *"the fifteen-row CLEAR enablement partition"* | **correctly left** — the same `InstallPhase` fifteen |

**One count existed, one count moved.** The "count that lives in five places and
moves in four" failure Phase 10 hit seven times is **not** reachable here, because
`registerGlobals()` iterates `HOST_GLOBALS` and TypeScript keys the binding record
off it — a name with no binding fails the build and a binding with no name is
unreachable. Both directions are demonstrated below.

**Two counts NOT moved, and the reason is written out rather than omitted:**
`docs/TESTING.md:397` gives `host-surface.spec.ts` **4** tests and `:399` gives
`lua-host.spec.ts` **9**. That table is explicitly *"measured at commit
`36a1965`"* and is a historical snapshot, not a live count — its `lua-smoke.spec.ts`
row reads **3** against today's **18**. Correcting one cell of an already-stale
snapshot would make it look checked. **11-16 owns it.**

### The two tests

`lua-host.spec.ts` **9 -> 10**: *"records a bare gmss whole, and the surface it
joined is sixteen names on a booted VM"*. Three claims:
a bare `gmss(240,1,2,247)gmss(240,127,247)` arrives as
`[[240,1,2,247],[240,127,247]]` — **whole, in order, framing included**; a
`gmss(1,2)` with no framing records as `[[1,2]]`, so **the host adds nothing the
configuration omitted**; and the Grid-shaped keys really in a booted VM's `_G`,
sorted, **equal `HOST_GLOBALS` and number sixteen**. The count is read off the VM,
never off the array — an array that counted itself would prove nothing.

`host-surface.spec.ts` **4 -> 5**: *"accepts a bare gmss and still refuses a bare
gms"*. Both halves in ONE test on purpose, so the second can never be read without
the first: `gmss` is in `GLOBALS` and NOT in `SELF_METHODS` (firmware gives it no
`self:` form), the classifier resolves a bare `gmss(...)` as *"a registered bare
global"*, a real VM answers `type(gmss) == "function"` and records the call, the
same VM's `_G` still has **no** `gms`, and the classifier still refuses a bare one.

**The file header's "FOUR TESTS, AND THE COUNT NEVER MOVES" was amended rather than
broken.** It now reads *"FIVE TESTS, AND THE COUNT NEVER MOVES WITH THE CATALOG"*
and names the distinction: adding a configuration still moves nothing; **a name
joining the surface is the other kind of change**, and it happens roughly never.

---

## Task 11-10-02 — LUMEN sends hex over sysex (`b01dca2`)

### The bytes LUMEN emits, and what proves them

Printed by the test on every run, from **live recorded messages** and not from a
document:

```
LUMEN colour over sysex, plan 11-10:
  press on cell 0        240, 125, 70, 70, 53, 65, 48, 48, 247   "FF5A00"
  move to cell 80        240, 125, 53, 53, 52, 67, 51, 70, 247   "554C3F"
  press again on cell 80 240, 125, 53, 53, 52, 67, 51, 70, 247   "554C3F"
```

| Byte | Value | What it is |
| --- | --- | --- |
| 0 | **240** | `0xF0`, **supplied by the configuration**, as `gmss` requires |
| 1 | **125** | `0x7D`, the MIDI **non-commercial manufacturer id** — the byte a receiver reads as "who is this from", and the one id reserved for exactly this use. Anything else in that slot claims somebody's registered id. |
| 2-7 | six ASCII hex digits | `70,70` = `"FF"` = 255; `53,65` = `"5A"` = 90; `48,48` = `"00"` = 0 — the anchor colour `255,90,0` |
| 8 | **247** | `0xF7`, also the configuration's |

**Cell 80** is the amber-white column at the bottom row: asked colour `85,76,63`
at the shipped `@DEPTH 3`, encoded `"554C3F"`. **Verified by arithmetic derived
from the entry's own Lua, never restated** — the test parses `local H={...}`, the
ramp `d=(\d+)-n//9*(\d+)` and the scale `\*d//(\d+)` out of the RENDERED Setup and
computes `H[col*3+k]*d//divisor` itself, so a future re-cut of the palette or the
ramp survives the test and only a broken encoding reddens it.

**What proves them, in five clauses:**

1. **The framing, on every message**: byte 0 is `0xF0`, the last is `0xF7`, and the
   length is exactly nine. Asserted explicitly because it is the part a later edit
   is most likely to drop and because firmware **warns and transmits anyway**
   (`grid_decode.c:96-100`) rather than refusing.
2. **The payload is the colour under the finger**, decoded back from its six digits
   by the test's own inverse and compared against the parsed arithmetic.
3. **The same cell sends the same message** (messages 2 and 3, one cell reached two
   ways) and **two different cells do not** — any difference between 2 and 3 is
   state leaking into the payload, and equality between 1 and 2 would mean the
   payload is not reading the cell.
4. **Seven bits**, on every data byte, plus a **non-vacuity clause**: the top-left
   cell's largest channel must be **above** 127, or the whole argument for hex
   would be empty. Measured: 255.
5. **The manufacturer id is `0x7D`.**

Also asserted: **Setup alone sends nothing** — a card that talks before it is
touched is a card that talks on every page load — and **a move inside one cell
re-sends nothing**.

### Can the host preview it, and how that was verified

**Yes, and it was verified three separate ways rather than asserted:**

1. **From a purpose-built Lua string** (`lua-host.spec.ts`): a bare
   `gmss(240,1,2,247)` reaches `host.sysex` with its four bytes in order, from a
   `LuaHost` that constructed without raising.
2. **From the catalog gate** (`host-surface.spec.ts`): a real VM answers
   `type(gmss) == "function"`, `host.errors` is empty after the call, and the
   classifier resolves the bare call as registered — so LUMEN's `gmss` line passes
   the D-07 gate rather than being tolerated by it.
3. **From the entry itself, under a scripted gesture** (`lua-smoke.spec.ts`): a
   press, a within-cell move, a cross-pad move and a second press produce **three**
   recorded messages with `host.errors` empty throughout.

**And the counterfactual is measured, not imagined.** With `gmss` removed from
`HOST_GLOBALS` the VM answers:

```
Error: [string "gmss(240,1,2,247)gmss(240,127,247)"]:1:
       attempt to call a nil value (global 'gmss')
```

**That is precisely what LUMEN would have done in its own catalog card had this
plan shipped the entry without the host change** — the one outcome PROJECT.md's
preview argument exists to prevent.

**What is NOT claimed.** A recorded sysex message is a record of what the
configuration asked to send. **No agent connected to a device, nothing was
deployed, and no desk received anything.** Whether a lighting desk parses
`F0 7D "FF5A00" F7` is a bench question and `docs/HARDWARE-AUDITION.md` row 16 is
where it lives.

### Both encodings costed, and the fact that decided between them

Every figure `max(GridScript.compressScript(lua).length, lua.length)` after
`await padReady()`, at the **RGB444 picker corner**:

| Encoding | Setup at the picker corner | Free of 908 | Verdict |
| --- | --- | --- | --- |
| **raw three-byte RGB** — `gmss(240,125,r,g,b,247)` | **660** | 248 | **NOT A CANDIDATE** — illegal |
| **raw, seven-bit split** — each channel `v%128, v//128` | **693** | 215 | legal, not hex, not legible |
| **ASCII hex** — six digits | **746** | **162** | **SHIPPED** |
| (a separate colour function instead of `F` returning) | 766 | 142 | rejected, 20 dearer |

**THE DECIDING FACT IS NOT TASTE. SYSEX DATA BYTES ARE SEVEN-BIT.** Every byte
between the `0xF0` and the `0xF7` must be 0..127, because a byte with the high bit
set is a **status** byte and ends the message where it stands. **Row 0 of this pad
is the anchor colour exactly**, so the very first cell a visitor touches asks for a
channel of **255** — measured, and asserted as clause 4's non-vacuity guard. The
**86 characters** the raw form saves buy a message that is **malformed at the top of
the pad and fine at the bottom**, which is the worst kind of wrong.

The seven-bit-safe raw split is transmissible and costs 53 fewer characters than
hex, and it was still not chosen: it is not hex, it is not readable at the other
end, and the note being answered says *"should send HEX"*.

### The event that carries it, and why

**The Setup's `touch_cb`, gated on `if n~=s.c or e>3`.** Not the Timer.

- **`n~=s.c`** — the cursor moved to a new cell, so the colour changed. One message
  per colour, not one per touch sample: the two controllers already fire on every
  sample and a sysex message repeating an unchanged colour at 100 Hz is noise.
- **`or e>3`** — inside the shipped filter `e~=1 and e~=4 and e<9`, an event above
  3 is a **press (4) or a fast tap (9)**. Without this half, touching the same cell
  twice would send once and a desk that missed the first message would need the
  finger to move to another cell and back. **+9 characters, and it closes the gap.**
- **The Timer stays entirely unspent — 0 of 908.** It is the obvious room and it is
  the wrong room: a Timer that sends on every tick is a different card, emitting the
  cursor's colour a hundred times a second whether or not anything changed. **A
  colour message belongs to the gesture that chose the colour.**

`F(n)` now ends `return r,g,b`, and the handler calls it on the NEW cell for its
return value before painting the cursor colour over the top. The cell is written
twice on a change — five wasted firmware calls — and that is the deliberate
cheaper half of a measured pair: a second colour function costs **766** against
this **746**. The picture is byte-identical either way, which `frames.json` proves.

### LUMEN's costs, before and after, at the RGB444 picker corner

| | Setup | free | Timer | free |
| --- | --- | --- | --- | --- |
| **before** (11-09.2) | **608** of 908 | **300** | 0 of 908 | **908** |
| **after** | **746** of 908 | **162** | **0** of 908 | **908** |

At the **defaults**: 604 -> **742**, 166 free. At the picker-**shortest** corner
(`@CURSORC` at `0,0,0`, twice): 592 -> **730**, which no gate reads and which is
recorded only so the next reader does not mistake it for the defaults figure.

**The ladder, so the number is an account rather than an assertion:**

| Step | Setup at the picker corner |
| --- | --- |
| as 11-09.2 left it | **608** |
| minus the two `*127//128` scales | **590** (**−18**, a fix that pays) |
| plus the sysex half — `D`, `return r,g,b`, the second `F` call, `or e>3`, the nine-byte `gmss` | **746** (**+156**) |

**Net +138, and LUMEN still has 162 free on Setup and the entire 908 on Timer.**

**THE FIGURE THIS PLAN FIRST CARRIED — "604 Setup with 302 free" — WAS WRONG
TWICE OVER, AND BOTH HALVES ARE RE-CONFIRMED HERE BY MEASUREMENT.** 604 is the
**defaults** figure and not a corner at all; and 604's own free is **304**, not
302. The corner the 908 gate reads is the RGB444 picker one and it was **608**.
Nothing was inherited: the ladder above starts from a re-measurement of the
unmodified entry, `BASE picker used=608 free=300`, taken before a character moved.

**LUMEN's declared corner and its picker corner are still the same point, and
still by accident**: `@CURSORC` already declares `255,255,255`, the longest literal
any picker can write. **ARC's and MORPH's accident, for the third time.** Five
entry headers are confirmed wrong and thirteen have never been checked; the header
says explicitly not to read the line as the norm. **11-16 owns the sweep.**

### The depth half — 11-09.2's verdict, carried forward and re-opened by nothing

**The user answered the depth note with an investigation rather than with either
costed option, and 11-09.2 ran it end to end. Its verdict, by name:**

> **LUMEN's depth knob delivers.** It reaches the emitted frame at all four values
> and moves the bottom row from 77 per cent of the anchor to 11 per cent of it. It
> does not move row 0 at all, and it cannot. **The ramp is already at the full
> travel the arithmetic permits**, so there is nothing to deepen without moving the
> subtrahend and the divisor together — which is costed, at zero characters, and
> left for the user to choose. **Nothing shipped to the entry's Lua.**

**This plan changed no `@DEPTH` literal, no knob value, no default and no ramp
character.** The 9 × 4 emitted-byte table in the entry header is untouched and the
`lua-smoke.spec.ts` depth test still prints it identically on every run. The
sentence 11-02's re-cuts owe was 11-09.2's to write and is not duplicated here.

**The recorded non-delivery this plan carries forward rather than dropping** — and
it is the only open item of its kind in the phase:

> **The simulator says LUMEN's depth knob moves the bottom row from `196,69,0` to
> `27,9,0`. The user's bench says it moves nothing. THE TWO HAVE NOT BEEN
> RECONCILED AND CANNOT BE FROM THIS SIDE.** The observation that settles it:
> install at `@DEPTH 1`, install again at `@DEPTH 4`, and compare the **BOTTOM
> row** rather than the pad as a whole. If the bottom row does change, the answer
> is that the ramp's SHAPE — all of its travel in the lower half — was the
> complaint. **If it does NOT change, something between HANGAR's rendered Lua and
> the pad's LEDs is losing the knob, and that is a finding about the install path
> rather than about this entry.** **11-16 must carry it.**

**One line the plan asked for explicitly.** `lumen-emitted` — opacity as an emitted
value rather than as a picture — **was not chosen by the user and is not built by
either plan**, and the sysex change does **not** make it moot: the message carries
the colour of the cell under the finger, which already includes the depth ramp's
scaling, so opacity leaves the module as part of a colour and never as a separate
number. A reader looking for that answer has it.

### `x*127//128` — measured, and FIXED, because the fix pays

**The measurement.** `x*127//128` maps 0..127 onto 0..**126** and can never emit
127: `127*127//128 = 16129//128 = 126`. **On both axes.** Same family as CONSOLE's
111.

**Fixed, and the decision is stated rather than implied.** The plan permitted a fix
only if it were free and did not disturb the sysex work. It is better than free:
this entry never calls `txma` or `tyma`, so the touch range **is** 0..127 and a
controller value **is** 0..127 — **the scale had nothing to scale**. Removing it
costs **minus eighteen characters** (608 -> 590 at the picker corner, measured) and
touches no line the sysex work touches. The top of both axes is now reachable.

It was **not** one of the user's complaints, and it did not spend any of LUMEN's
room ahead of the ask — it **paid for part of the ask**.

### Does anything validate seven-bit sysex data? No, and that is a finding

**Nothing does.** Measured, not reasoned:

- **The host records unmasked, on purpose.** A planted raw-RGB send on the top-left
  cell recorded `240, 125, 255, 90, 0, 247` — the 255 stored as-is — and **no
  assertion anywhere in the tree objected to the byte**. `recordSysex` applies
  `f2i` and nothing else, exactly as `recordHid` does, and the comment says why:
  masking would turn a real defect into a message that looks fine in the preview
  and is wrong on the wire.
- **The vendored trap scanner has never heard of `gmss`.** It is absent from
  `_pad.ts`'s `OUT_CALLS` (`:3563`), because no compiled recipe sends sysex.
- **So the only guard in existence is clause 4 of LUMEN's own test, and it covers
  LUMEN only.** A second sysex-sending entry would ship unguarded.

Recorded as **`D-11-10-a`** in `deferred-items.md`, with two candidate shapes
costed and neither built, because both are wider than one entry's plan.

### The description, counted by script

| | String | Length |
| --- | --- | --- |
| before | *"A colour picker for a lighting desk: hue across, depth down, and the pad is the colour it sends."* | **96** |
| after | *"A colour picker for a lighting desk: hue across, depth down, and the colour goes out as hex over sysex."* | **103** |

`catalog.spec.ts` caps a description at **110**, so the more obvious extension —
appending *", as hex over sysex"* to the existing clause, at **114** — **would not
have fitted**. The final clause replaces rather than appends. Changed in **both**
`entries/lumen.ts` and `listing.ts`; `listing.spec.ts` asserts the two equal in
both directions and `front-door.ts` carries no description for LUMEN (it is on the
exclusion list, `id` and `why` only).

### `frames.json` was NOT regenerated, and it was proved rather than assumed

- `npx vitest run --project server src/lib/catalog/frames.spec.ts` **without
  `UPDATE_FRAMES`**: **green**, run as part of `src/lib/catalog/` after the edit.
- `git diff --quiet HEAD -- src/lib/catalog/frames.json`: **exit 0**.

**The reason it could not move is structural**: `frames.spec.ts` builds each entry
at its **defaults** with **no gesture**, and every character this wave added lives
in `touch_cb` or in a function `touch_cb` calls. The one Setup-time change is
`F(n)` gaining `return r,g,b`, which paints nothing. **LUMEN's OG image is rendered
from the same engine and therefore did not move either** — `build.spec.ts`'s pixel
assertions pass.

This is the **fifth** consecutive plan in the phase that does not regenerate the
fixture.

**`restsBlack` stays FALSE**, re-observed green through `frames.spec.ts` test 5.

---

## The shape character: not spent, and proved before and after

`shapeOf(knobs) = STAMP_ALPHABET[(knobs.length * 7 + total options) % 32]`, read
off `CATALOG` through `stampKnobs` and `encodeFor` on the tree **before** task 01
and again **after** task 02:

| | knobs | value counts | total | stamp at `depth=0` | shape |
| --- | --- | --- | --- | --- | --- |
| **before** | 4 | `[4, 4, 3, 4]` | 15 | `wb00fff0` | **`b`** |
| **after** | 4 | `[4, 4, 3, 4]` | 15 | `wb00fff0` | **`b`** |

**No new knob and no change to any knob's value count.** The whole stamp is
byte-identical, not only its shape character. **No LUMEN link ever shared is
demoted from `restored` to `older`** — the tripwire POMODORO spent in 11-09
(`@MINS` four values to six, shape `n` to `p`, `xn33333` demoted) is **not spent
again**. `git diff --quiet HEAD -- src/lib/share/stamp.ts
src/lib/share/fixtures/wild-stamps.json` exits **0**.

---

## The negative checks, with what each one actually reddened on

**All plants restored from scratch copies with `sha256` compared either side. No
`git checkout`, `git restore`, `git stash` or `git clean` was run at any point.**
`lua-host.ts` `55768f42376e41891be42ca77a840fddd0a872a90b14b5dbfa383080d26fd1f7`
identical before each plant and after each restore; `lumen.ts`
`1c1ed5db8a8ff0638bf59e53a091e64c4c9ba9cc3f472bcd2a6b5661eeddf162` likewise.

### Task 01

| # | Plant | Result |
| --- | --- | --- |
| **1a** | `gmss` bound with a direct `g.set` and **removed from `HOST_GLOBALS`** | **RED, 4 tests**: *"these Grid names are in the VM but not in HOST_GLOBALS, so this gate would refuse a call that works: gmss"*, and *"the Grid names really in _G are not the sixteen the host registers"* |
| **1b** | `gmss` **removed from `HOST_GLOBALS` only**, binding left stranded in the record | **RED, 2 tests**, and this is the plan's predicted message verbatim: *"attempt to call a nil value (global 'gmss')"* |
| **2** | **`gms` added to `HOST_GLOBALS`** with a bare binding | **RED, 4 tests** |

**Check 1 was run twice on purpose, and the reason is a divergence from the plan.**
The plan predicted "bind `gmss` without adding it to `HOST_GLOBALS`" would make it
**unreachable**. That is only true if the binding goes through the record — and
TypeScript refuses to compile an extra key on `Record<(typeof HOST_GLOBALS)[number],
HostBinding>`, so the plant that *runs* is a direct `g.set`, which makes the name
**reachable and unlisted** and reddens the OTHER direction. **1b** is the plan's
literal scenario, reached by removing the name and leaving the binding stranded,
and it produces exactly the predicted nil-value raise. **Both directions of
"the list is the list" are therefore demonstrated rather than one.**

**Check 2's message was read, and it did not explain why — so it was fixed.**
Before this wave the assertion read only *"a bare gms became callable"*: a report
of the mismatch with no reason attached, which is precisely the shape that gets
"fixed" by the next reader. It now reads:

> *"a bare gms became callable. It is absent BY DESIGN, not by oversight: the host
> bridges it under the private name `__hangar_gms` so that the only spelling a
> configuration can reach is `self:gms(...)` ... Do not 'fix' this by adding it to
> HOST_GLOBALS"*

### Task 02

| # | Plant | Result |
| --- | --- | --- |
| **3** | **`0xF7` terminator dropped** | **RED**: *"lumen/press on cell 0: a sysex message must END with 0xF7, and this configuration supplies it - got 48"* — 48 is `'0'`, the last hex digit, so the message names the byte that took the terminator's place |
| **4** | **a data byte above 127** — three plants, see below | **RED**, and only the third reddened the clause the check exists for |

**CHECK 4 WAS RE-PLANTED TWICE, AND THAT IS THIS WAVE'S INSTANCE OF THE PHASE'S
STANDING WARNING.** The warning says: when a negative check comes back green,
suspect the check. **The inverse applies too — when a check goes red on the wrong
clause, the clause it was written for is still untested.**

| Plant | Emitted | Reddened on |
| --- | --- | --- |
| `gmss(240,125,r,g,b,247)` — full raw RGB | `240, 125, 255, 90, 0, 247` | **clause 1**, the nine-byte length. Clause 4 never ran. **But the recorded message is itself the finding: the host stored the 255 unmasked and nothing objected.** |
| `gmss(240,125,r,0,D(g//16),...)` — nine bytes, one raw | `240, 125, 255, 0, 53, 65, 48, 48, 247` | **clause 2**, the decode (*"the six digits ... decode to -17,90,0"*). Clause 4 still never ran. |
| `gmss(240,200,D(r//16),...)` — the id slot out of range, digits intact | `240, 200, 70, 70, 53, 65, 48, 48, 247` | **CLAUSE 4**: *"byte 1 is 200, and a sysex DATA byte above 127 is a status byte - it would end the message where it stands"* |

**Clause 4 is now known to be able to redden.** Had the first plant been accepted
because the test went red, the seven-bit assertion — the one clause nothing else in
the tree duplicates — would have shipped unproven.

---

## Deviations from Plan

### 1. [Rule 3 - blocking / design] No `call` discriminant on `HostSysex`

- **Found during:** task 01, choosing the recorder
- **Issue:** the plan asked for "a sibling recorder — `recordSysex`, its own
  recorded list, **its own union**". `ZONA_REFERENCE.md:1249-1250`, verified
  against `grid_lua_api.c:2220-2221`, states that `gms` and `gmss` are the **only**
  MIDI emitters in the whole Grid global table. A union over the sysex emitters has
  exactly one member.
- **Fix:** `HostSysex` is `{ bytes }` and nothing else, with the reason written into
  the type's own doc comment so the next reader does not add the discriminant back.
- **Files modified:** `src/lib/sim/lua-host.ts`
- **Commit:** `3e36f75`

### 2. [Rule 2 - missing critical functionality] The bare-`gms` assertion message now says WHY

- **Found during:** task 01, negative check 2, reading the message as the plan asked
- **Issue:** it read *"a bare gms became callable"* — a report of the mismatch with
  the reason living only in a comment four lines above. Adding a neighbour to
  `HOST_GLOBALS` is exactly the change that makes the absence look like an oversight.
- **Fix:** the message now names the `__hangar_gms` bridge, the `self:gms` spelling
  it protects, and says "do not fix this by adding it to HOST_GLOBALS".
- **Files modified:** `src/lib/catalog/host-surface.spec.ts`
- **Commit:** `3e36f75`

### 3. [Rule 3 - blocking] Task 02's test went into `lua-smoke.spec.ts`, not `lua-host.spec.ts`

- **Found during:** task 02, writing the entry test
- **Issue:** the plan names `src/lib/sim/lua-host.spec.ts` for the entry test. That
  file's own header forbids it in as many words: *"Every test drives a tiny
  purpose-built Lua string rather than a catalog entry. The catalog does not exist
  to this module ... a spec that reached for one here would fail for two unrelated
  reasons at once."* Importing `CATALOG` there would also create a dependency from a
  `sim` spec to the catalog that the lazy-loading gates care about.
- **Fix:** the test went into `src/lib/sim/lua-smoke.spec.ts`, which is where a
  catalog entry meets the host, whose header explicitly reserves *"a test that pins
  ONE entry's answer to ONE bench note"* as a per-plan exception, and where
  **11-09.2 put LUMEN's depth test for the same reason**. `lua-smoke.spec.ts`
  **17 -> 18**. The test count delta is unaffected; only the file differs.
- **Files modified:** `src/lib/sim/lua-smoke.spec.ts`
- **Commit:** `b01dca2`

### 4. [Rule 1 - bug] `x*127//128` removed on both axes

- **Found during:** task 02, step 5 — the plan asked for the measurement and left
  the decision to the executor
- **Issue:** maps 0..127 onto 0..126 and can never emit 127, on both axes.
- **Fix:** removed. The entry never calls `txma`/`tyma`, so the range is already
  0..127 and the scale had nothing to scale. **Minus eighteen characters.**
- **Files modified:** `src/lib/catalog/entries/lumen.ts`
- **Commit:** `b01dca2`

### 5. [Rule 1 - bug] `docs/HARDWARE-AUDITION.md`'s LUMEN row moved 604 -> 742

- **Found during:** task 02, checking for a second home for LUMEN's cost
- **Issue:** the audition's cost table is a live, pasteable reference measured at
  default knob positions. This wave moved LUMEN's defaults cost by 138 characters
  and the table said 604. `audition.spec.ts` gates the document's shape and asserts
  nothing about the numbers, so it would have stayed green forever.
- **Fix:** the row moved and the provenance paragraph now says which plan
  re-measured it and that **no other row has been re-checked** — recorded in full as
  `D-11-10-b` in `deferred-items.md`, because phase 11 has since changed the Lua of
  seven entries in that table.
- **Files modified:** `docs/HARDWARE-AUDITION.md`
- **Commit:** `b01dca2`

### 6. [Rule 3 - blocking] `build/` rebuilt locally so a stale prerender stopped failing

- **Found during:** task 02, the full `test:quick` run
- **Issue:** `src/lib/og/build.spec.ts` reads the prerendered `build/c/<id>/index.html`
  when `build/` exists and asserts `og:description` equals the catalog's. The
  description change made the local artifact stale and the test red — a real failure
  about a real artifact, not a flake.
- **Fix:** `npm run build` (`BUILD_EXIT=0`). **Everything it writes is gitignored**
  (`build/`, `static/og/`, `.svelte-kit/`) and `git status --porcelain` showed no
  tracked file touched by it. **Nothing was deployed**: no `wrangler`, no
  `npm run deploy`.
- **Files modified:** none tracked

**No other rule fired.** No missing dependency, no broken import, and no
architectural question — the host change had an exact template in the same file and
the entry change stayed inside the event it already owned.

---

## Everything the plan asserts that the tree does not support

1. **THE PLAN ASKS FOR THREE TESTS AND DECLARES A `+2` TERM.** Task 01 asks for
   `lua-host.spec.ts` +1 and `host-surface.spec.ts` +1; task 02 asks for one more,
   in as many words *"a new test, not an extension of task 01's"*. Its own
   justification names the `+2` term as *"(`lua-host.spec.ts` +1 and
   `host-surface.spec.ts` +1)"* — task 01's two — while adding a third. Observed
   **862**, declared 861. **Reported, not reconciled.** `check-counts 84 861` exits
   1 and `84 862` exits 0; both were run.

2. **The plan's `<files>` for task 02 names `src/lib/sim/lua-host.spec.ts` for a
   test that drives a CATALOG ENTRY**, which that file's own header forbids in as
   many words. See Deviation 3. Two of this phase's waves have now put an
   entry-driven test in `lua-smoke.spec.ts` for the same reason.

3. **The plan's negative check 1 predicts the wrong failure mode.** "Bind `gmss`
   without adding it to `HOST_GLOBALS`. Expect it **unreachable**" — a binding added
   through the record with no name in the list does not run at all, because
   TypeScript keys the record off `HOST_GLOBALS` and refuses to compile. The plant
   that runs is a direct `g.set`, which makes the name **reachable and unlisted**.
   Both variants were run; only the second produces the predicted message.

4. **The plan's task 02 step 3 says its test asserts "the payload matching the
   colour under the finger" and step 1 says the entry may use "the colour's hex
   digits as ASCII" — but the plan never says the message needs a manufacturer
   id.** It does: the byte immediately after `0xF0` is what a receiver reads as the
   sender's identity, so a message that put a hex digit there would claim a
   registered manufacturer's id. `0x7D`, the non-commercial id, is one byte and is
   asserted as clause 5. **Added rather than found in the plan.**

5. **`src/lib/sim/lua-smoke.spec.ts`'s own header still opens "Thirteen tests"**,
   and the file has carried more than that for several waves (17 at the start of
   this one, **18** now). **Not corrected here**: it is one of the stale header
   counts **11-16 owns**, and the three previous waves that added tests to this file
   left it alone for the same reason. Named so the next reader does not take it for
   a count that was checked.

6. **`docs/TESTING.md:397` and `:399` give `host-surface.spec.ts` 4 tests and
   `lua-host.spec.ts` 9**, both of which this wave moved. **Correctly left**: that
   table declares itself measured *"at commit `36a1965`"* and its `lua-smoke.spec.ts`
   row reads **3** against today's **18**, so it is a historical snapshot rather than
   a live count. Correcting one cell would make the other rows look checked.

---

## Invariants, each proved by a command

| Claim | Command | Result |
| --- | --- | --- |
| `frames.json` byte-untouched | `git diff --quiet HEAD -- src/lib/catalog/frames.json` | **exit 0** |
| `frames.spec.ts` green with no `UPDATE_FRAMES` | run in the server project after each task | **green** |
| `src/vendor/` untouched by this plan | `git diff --stat HEAD -- src/vendor/` | **empty**. No manifest row declared |
| `src/vendor/` unmoved since 11-04 | `git diff --stat 4131ff5 HEAD -- src/vendor/` | the recorded **four-file** output (`_pad.ts` 70, `pad-sim.ts` 29, `tests/pad-sim.test.js` 19, `tests/pad.test.js` 7) |
| `firmware-oracle.spec.ts` green and unedited | `git diff --quiet 9d06b00 HEAD -- ...`; run in the server project | **exit 0**; **green** |
| `upstream-manifest.json` untouched (**10th** wave) | `git diff --quiet 2d249f3 HEAD -- src/lib/fidelity/upstream-manifest.json` | **exit 0** — the four mislabelled *"free at its worst knob position"* rows stand for 11-16 |
| configs and roadmap untouched | `git diff --quiet HEAD -- playwright.config.ts vite.config.ts .planning/ROADMAP.md` | **exit 0** |
| `stamp.ts` and `wild-stamps.json` untouched | `git diff --quiet HEAD -- ...` | **exit 0** |
| `svelte-check` | `npm run check` | **580 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS** |
| lint | `npm run lint` | **clean** (prettier + eslint) |
| e2e term `+0` | `grep -c "test(" e2e/*.e2e.ts` | **86**; the suite is **not run** by this plan, and the grep is a sound proof of a zero and of nothing else |
| no Playwright suite was running at any commit | no Playwright run happened at all | - |
| `@DEPTH` still four values, shape still `b` | `stampKnobs` + `encodeFor` over `CATALOG`, before and after | `[4, 4, 3, 4]`, stamp `wb00fff0` both times |
| no sibling repository touched | `../zona-docs` READ only, for the `gmss` contract | - |
| nothing hardware-verified | no agent connected to or wrote to a device | - |
| nothing deployed | no `wrangler`, no `npm run deploy`; `npm run build` writes only gitignored paths | - |
| tree clean | `git status --porcelain` | empty before this SUMMARY |

Three scratch measurement specs were used (`zz-probe`, `zz-shape`, `zz-budget`) and
**deleted before either source commit**; they do not appear in the file count, and
`npm run check` reads 580 with them gone.

---

## Commits

| Hash | Message |
| --- | --- |
| `3e36f75` | `feat(11-10): the sixteenth global is a sysex send, and it gets its own recorder because a sysex message is not a mouse click` |
| `b01dca2` | `feat(11-10): LUMEN sends its colour as six hex digits inside its own 0xF0 and 0xF7, because a raw channel of 255 is not a sysex byte` |

---

## Carry-forward for wave 14

**`PREV_FILES` 84 · `PREV_TESTS` 862 · `PREV_E2E` 86 source titles / 105 runs ·
`BASE_CHECK` 580 · sweep members `4 19` · catalog 27**

**`PREV_TESTS` is 862, not the 861 this plan's verification line declares.** The
plan asks for three tests across its two tasks and states a `+2` term; all three
were added because every task's `<done>` requires them.

**Sweep totals, re-observed and all unmoved:**

- compiler route / reachability **Pass A 20,782**, Pass B 24,576, **total 45,358**
- Lua route **Pass A 49,824** (format w 49,424, format x 382), Pass B 118,784, **total 168,608**
- `lua-entries` **1,176 combinations, 2,352 measurements**
- kind cross-product 1,296 combinations, **worst 906 of 908**

**The host surface is SIXTEEN bare globals and nine `self:` methods.** Every
document and spec that states the number was found by grep, and there was exactly
one.

**Entry headers found quoting the declared-palette corner instead of the RGB444
picker corner: still FIVE** — CONSOLE, FORGE, STEPS, POMODORO and STAGE. LUMEN was
re-measured again by this plan and is correct, by the same accident as ARC and
MORPH. **Eight of twenty-eight checked; the rest never. 11-16 owns the sweep.**

Suite-running plans in this phase remain **five**: 11-01, 11-05, 11-08.1, 11-15,
11-16.

**Two open items handed forward:**

1. **The LUMEN depth discrepancy, unchanged and unreconciled.** The simulator says
   the bottom row walks `196,69,0 -> 27,9,0`; the bench says nothing moves. Only the
   bench can close it, and the exact observation is in the entry header and in
   11-09.2's SUMMARY.
2. **Nothing validates seven-bit sysex data** (`D-11-10-a`). One entry's test is the
   whole guard.

---

## Known Stubs

**None.** Nothing was stubbed. The host binding is complete and reachable, the
recorder keeps the whole payload, and the entry sends a fully framed message that a
test decodes back to the colour it claims to carry.

**Two things are deliberately absent and are named rather than left as edges:**

- **The seven-bit check is LUMEN's own and covers no other entry.** Recorded as
  `D-11-10-a` with two candidate shapes costed, neither built, because both are
  wider than one entry's plan.
- **The two depth-deepening routes 11-09.2 costed remain unbuilt on purpose**, with
  their character costs and their `frames.json`, OG-image and `restsBlack`
  consequences stated in the entry header. Only the user's bench can choose between
  them.

---

## Self-Check: PASSED

- `src/lib/sim/lua-host.ts` FOUND, `src/lib/sim/lua-host.spec.ts` FOUND,
  `src/lib/catalog/host-surface.spec.ts` FOUND,
  `src/lib/catalog/entries/lumen.ts` FOUND, `src/lib/catalog/listing.ts` FOUND,
  `src/lib/sim/lua-smoke.spec.ts` FOUND, `docs/HARDWARE-AUDITION.md` FOUND,
  `.planning/phases/11-bench-corrections/11-10-SUMMARY.md` FOUND.
- `3e36f75` FOUND in `git log --oneline --all`; `b01dca2` FOUND.
