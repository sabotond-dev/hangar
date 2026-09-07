# The ZONA inbound MIDI probe

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

Two questions gate the next phase of the catalog, and no test suite on this machine can answer
either one:

- **Part A.** Does plain host MIDI reach a ZONA touch element at all?
- **Part B.** Does MIDI clock reach the pad?

Row 11 of `docs/HARDWARE-AUDITION.md` names the first of them and then stops. It says to try
`grxm(0,2)` and a `midirx_cb`, and leaves the reader to author the Lua on the spot against a callback
signature that exists in one place in one sibling repository. This document is that script, written
out, plus a second one for the clock. The answer should cost ten minutes at a bench rather than an
evening of archaeology.

Both scripts below were checked by machine against the pinned minifier before they were written into
this document. `GridScript.checkSyntax` accepts each one, `GridScript.compressScript` returns each
one unchanged (they are already in canonical compressed form), and they measure **264** and **328**
characters against a budget of 908. Paste them exactly as they appear. One changed space is a
different character count, and because the stored form is canonical it is also a different
configuration.

## What a yes unblocks

**Part A.** MIRROR, first of all. `src/lib/catalog/audition.spec.ts` holds MIRROR out of the live
catalog under decision D-04 until inbound host MIDI is proven to reach `midirx_cb` on real hardware,
and row 11 of the audition is the only thing that can lift that block. Beyond MIRROR: every
configuration whose LEDs show what the host sends back. A clip grid coloured by the DAW, a VU meter
the host paints, a mixer strip whose bars follow the faders instead of leading them. None of those
can be written today.

**Part B.** The whole clock-locked family. A background that breathes on the downbeat, a playhead
that steps because the host said so, a visual metronome, a sequencer that stays in phase with the
song rather than with its own timer. `gts` is dead on ZONA, so `rtmrx_cb` is the only clock-sync
route the hardware has. A no on Part B does not send that family down a different road; it closes it.

## Before you start

1. **Capture your module’s current configuration first**, so you can put it back when you are done.
   Both probes replace the pad’s Setup event. HANGAR’s safety stance is that the module’s original
   configuration is always recoverable, and nothing in this document is exempt from it. Restoring it
   is the last item of the hand-back below.
2. **Paste with whatever you use to author a configuration**, which today means Grid Editor or
   BOTOR’s shelf. Neither probe is in HANGAR’s catalog and the site installs only what is in the
   catalog, so this is not a `TRY ON DEVICE` job.
3. **A DAW, or anything else that sends MIDI**, with a MIDI output routed to the ZONA. Ableton Live,
   Bitwig, Reaper, Logic and FL Studio all offer this in their preferences, and so does a standalone
   MIDI monitor or a hardware controller feeding the same host.
4. **For Part B, clock output enabled to that port.** In every DAW named above it is a separate
   setting from the port itself, and in most of them it is off by default. Part B tests nothing while
   it is off.
5. **Somewhere to write two answers**, yes or no, plus anything the procedure did not predict.

## Neither probe has a Timer

Both scripts are Setup only, event 0. There is nothing to put into event 6.

That is worth stating, because a reader who knows the audition will go looking for a Timer. Item 3 of
`docs/HARDWARE-AUDITION.md` under Before you start makes Timer-first the one ordering rule for every
configuration in the catalog: `gtt` is a no-op until the Timer event holds at least one stored
action, so a Setup pasted first arms a timer that does not exist yet and the pad simply sits still.
Neither probe calls `gtt`. Both paint their LEDs once from the Setup and after that only from a
callback the firmware invokes, so there is no timer to arm and the ordering rule does not bite. Paste
the Setup, and that is the whole install.

## Part A, plain host MIDI

**264 characters, budget 908.**

```lua
--[[@cb]]for i=0,80 do local h=glag(0,i)gln(h,1,0,8,3)gld(h,1,0,120,40)glx(h,1,214,255,78)glp(h,1,0)end self.midirx_cb=function(s,h,v)if h[1]~=13 or v[2]~=176 or v[3]~=16 then return end local c=v[4]*8//127 for i=0,80 do glp(glag(0,i),1,i%9<=c and 255 or 0)end end
```

How it reads. The loop gives all 81 LEDs a three-stop colour ramp on layer 1 and parks each one at
phase 0, so the pad sits at a dim green that is visibly not black. That is deliberate and it is the
point of the probe. A dark pad cannot be told apart from a script that never ran, whereas a dim green
pad that never changes is a clean no and a dim green pad with a bright bar climbing across it is a
clean yes.

The callback then discards everything that is not the traffic under test. `h[1]~=13` drops the
module’s own outgoing MIDI, which arrives on the same mechanism carrying INSTR 14. `v[2]~=176` keeps
control change only. `v[3]~=16` keeps controller 16 only. What survives is one number in `v[4]`, and
the final loop lights columns 0 through `v[4]*8//127`: one column at the bottom of the controller’s
range, all nine at the top.

**Part A needs no `grxm` call.** `grid-fw/common/src/lua/init.lua:10-19` runs
`grxm(rx_type.MIDIVOICE, rx_feat.FORWARD | rx_feat.HANDLE_EXTERNAL)` at every VM start, and
`rx_feat.HANDLE_EXTERNAL` (0x02) is the bit that delivers a host message to a Lua callback. It is
already on before the Setup runs. Host MIDI voice messages reach `midirx_cb` with no configuration
at all.

Row 11 of the audition suggests `grxm(0,2)`. That is not quite the default spelled out: the default
is mode 3, and mode 2 keeps `HANDLE_EXTERNAL` while clearing `FORWARD` (0x01), the forward-from-USB
bit. So the call is at best redundant for this test and at worst a change to something the test did
not intend to change, which is why the script omits it. A reader who followed row 11 literally would
treat the call as load-bearing and would misread a silent pad as a routing mistake.

**Part A deliberately does not filter on channel.** The reference implementation at
`zona-docs/docs/ZONA_REFERENCE.md:1284-1290` tests `v[1]~=0` and therefore answers only on channel 1.
A DAW transmitting on channel 5 would light nothing, and the answer written down would be a no when
the truth was a yes, on the one question the whole next phase is waiting on. This probe accepts
controller 16 on every channel. If too much traffic gets through on your rig, add `v[1]~=0 or` back
to the front of the condition; do not trust a pad that stayed dark under a channel filter.

## Part B, MIDI clock

**328 characters, budget 908.**

```lua
--[[@cb]]for i=0,80 do local h=glag(0,i)gln(h,1,0,8,3)gld(h,1,0,120,40)glx(h,1,214,255,78)glp(h,1,0)end grxm(2,3)local n=0 local w=-1 self.rtmrx_cb=function(s,h,b)if b==250 or b==252 then n=0 w=-1 end if b~=248 then return end n=n+1 local p=n%12<4 and 255 or 0 if p==w then return end w=p for i=0,80 do glp(glag(0,i),1,p)end end
```

The same base paint as Part A, so a pad sitting at dim green is again a script that ran and heard
nothing. Then `grxm(2,3)`, which is the call this part turns on.

Realtime messages are off by default: the same `init.lua` block runs `grxm(rx_type.MIDIRTM, 0)`.
To switch them on, the named spelling is
`grxm(rx_type.MIDIRTM, rx_feat.FORWARD | rx_feat.HANDLE_EXTERNAL)` and the numeric spelling is
`grxm(2,3)`, because `rx_type.MIDIRTM` is 2 and `rx_feat.FORWARD | rx_feat.HANDLE_EXTERNAL` is
0x01 together with 0x02. Both are given because they serve different readers: the named one is what
can be looked up, at `grid-fw/common/src/lua/init.lua:10-11`, and the numeric one is what fits inside
908 characters.

The callback shape is not Part A’s, and it is verified at `grid-fw/common/src/lua/decode.lua:43-44`:

```
pass_rtm = function(el, x)
  if el.rtmrx_cb then
    el:rtmrx_cb({ x[1], x[2], x[3] }, x[4])
  end
end
```

So `self.rtmrx_cb=function(s,h,b)` takes a header triple and **one byte**, not a table of four. The
bytes that matter are **248** for clock, **250** for start and **252** for stop.

The arithmetic. MIDI sends 24 clocks to the quarter note, so 12 clocks is an eighth. The counter `n`
advances on every 248, and `n%12<4` is true for four clocks out of every twelve, so the pad is bright
for a third of an eighth and dark for the rest. That reads as a flash on the eighth rather than as a
square wave. Start (250) and stop (252) reset the counter, so pressing play a second time does not
leave the flash sitting on the offbeat.

The `w` guard is the reason Part B has one and Part A does not. Part A repaints when a controller
moves, which is as often as somebody moves it. Part B would otherwise repaint all 81 LEDs on every
one of the 24 clocks in every quarter note, at every tempo, for as long as the DAW is playing. `w`
holds the last phase written and the loop runs only when the phase actually changes: twice per eighth
instead of twenty-four times per quarter. That is a cost decision and not a correctness one.

## The two rows

| #     | Do this                                                                                                                                                                                                                                  | Passes when                                                                                                                                                                                                                                                           | Why a machine cannot check it                                                                                                                                                                                                                                      | Pass |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| **A** | Store the Part A script into the pad’s Setup event, event 0. The pad should light dim green within a second. Then send CC 16 from the DAW on any channel and sweep the controller from the bottom of its range to the top and back down. | A bright bar grows from the left-hand column to all nine columns as the controller sweeps up, and shrinks back as it sweeps down. The bar has to **follow** the controller rather than flicker once. A pad that stays flat dim green through the whole sweep is a no. | HANGAR’s simulator has no inbound MIDI of any kind, so there is nothing on this machine to run the callback against. The firmware source shows the path; nothing here shows the traffic arriving, or what INSTR value it carries when it does.                     |      |
| **B** | Store the Part B script into the pad’s Setup event, event 0. Enable MIDI clock output to the ZONA’s port in the DAW, press play, and watch for eight bars. Then change the tempo by a large amount, watch again, and press stop.         | The whole pad flashes in time, twice per beat, at the tempo the DAW is running. The flash rate follows the tempo change, and stop leaves the pad dark and still. A pad that stays flat dim green through playback is a no.                                            | `grxm` is a recorded no-op in the simulator and no clock exists to feed `rtmrx_cb`, so the routing call and the callback are both unexercised on this machine. Whether realtime messages survive the host, the cable and the firmware is a wire fact, not a claim. |      |

## If Part A shows nothing

Run one diagnostic variant before writing down a no. Delete `h[1]~=13 or` from the front of the
condition, so it begins `if v[2]~=176`, and paste it again. That accepts INSTR 14 as well, which is
the value the module’s own outgoing MIDI carries when it comes back on the same mechanism.

- **If the bar still never moves**, the answer is a genuine no. Nothing is arriving at the callback.
- **If the bar now moves**, something is reaching `midirx_cb` under INSTR 14 rather than 13. The
  probe installs no `touch_cb`, so the module is emitting nothing of its own while it runs, and that
  makes the finding worth writing out in full: what you were doing, and what the DAW was sending.
  Row 11 of the audition already asks for the `instr` value observed, and this is that value. It is a
  different answer from silence and it belongs in the hand-back as one.

## What to hand back

- **Part A: yes or no.** Did an inbound CC move the bar.
- **Part B: yes or no.** Did the pad flash in time with the DAW.
- **Anything the procedure did not predict**, including the diagnostic variant above if you ran it,
  and the DAW and channel you used.
- **The module’s original configuration confirmed restored.** That is item 1 of Before you start
  coming back round, and it is the last thing to do rather than the first thing to forget.

## What a yes still does not buy

A yes on either part is necessary and it is not sufficient. It opens a hardware door and a
documentation door. It does not yet open a door on the site.

HANGAR’s simulator has no inbound MIDI path of any kind. `grxm` in `src/lib/sim/lua-host.ts` records
a mode number and has no behaviour behind it, and the binding that reaches it discards the slot
argument entirely, so the host cannot tell MIDIVOICE from MIDIRTM even in the number it stores.
`midirx_cb` and `rtmrx_cb` appear nowhere under `src/` at all, except in one sentence of prose inside
`src/lib/catalog/audition.spec.ts`.

So a card lit by inbound MIDI, or one breathing on a host clock, would install and run on a real
ZONA and would sit motionless in its own catalog card on the site. Before such a card can ship, the
Lua host needs a synthetic MIDI source and a synthetic clock: something that drives `midirx_cb` and
`rtmrx_cb` on the simulated element on a schedule a preview can loop. That is a piece of work in
`src/lib/sim/`, and it begins only once one of these two answers comes back yes.

## Results

None yet. This probe has not been run.
