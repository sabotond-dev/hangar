# MIDI in HANGAR: outputs, types, RX and the colour input

Change 17 (BENCH-2026-09-16.txt section 17, 2026-09-23): every element that sends MIDI, in the Sandbox and on the
playground, has a **Type**, a **Channel** and a **Number**, and **receives** by default. Part 17A landed the shared
pieces, the whole Sandbox and one playground card (ARC); part 17B moved the nineteen other hand-authored cards onto
the same model, one commit per card (section 6), and 17C the seven ported presets and two panel fixes (section 8). This document was 17B's manual: the model, the wire per type, the receive rules, the colour
input, how an entry declares its outputs, and the Lua recipe ARC proved.

## 1. What the firmware does with MIDI in (read, not assumed)

- **Voice messages reach Lua by default.** `grid-fw/common/src/lua/init.lua` runs
  `grxm(rx_type.MIDIVOICE, rx_feat.FORWARD | rx_feat.HANDLE_EXTERNAL)` on every page load, so a voice message from
  outside the module is handed to Lua with no `grxm` call of ours. (ORBIT's `grxm(2, ...)` turns on the REALTIME class,
  MIDIRTM, which is off by default; voice is not.) `HANDLE_INTERNAL` is off, so the module's own sends never come back.
- **Every element hears every message.** `decode.lua`'s `pass_midi` calls each element's `midirx_cb` with a header
  `{instr, sx, sy}` and an event `{ch, cmd, p1, p2}`. `instr` is 13 (REPORT) for the host's traffic and 14 (EXECUTE)
  for a neighbouring module's sends passing through; `ch` is 0..15, `cmd` the status as a byte (176, 144, 128, 208,
  224, 192...), `p1` and `p2` the data bytes.
- **`gmrr` does not reach a touch element** (`_pad.ts:2822`), so HANGAR assigns `self.midirx_cb` itself, as BOTOR's
  motor faders do (`_pad.ts` `motorRx`). Nothing clears `midirx_cb` between landings: a card that does not assign one
  keeps the previous card's. **Every HANGAR landing that receives assigns its own; the Sandbox and every hand-authored
  card with nothing to receive assign `nil` (17B); a callback guards itself** (below) so it is inert once another card's
  touch callback is installed.
- Whether host MIDI actually reaches the touch element's `midirx_cb` on a module is **not yet benched**
  (`docs/HARDWARE-AUDITION.md` rows 10 and 40). Everything below is proved in the VM (`LuaHost.midiIn`).

## 2. The types

| Type             | Status | Continuous | Trigger     | Bytes sent                           | Number |
| ---------------- | ------ | ---------- | ----------- | ------------------------------------ | ------ |
| CC               | 176    | yes        | yes         | number, value                        | yes    |
| Pitch bend       | 224    | yes        | no          | 0, value (64 is the centre, 8192)    | no     |
| Channel pressure | 208    | yes        | no          | value, 0                             | no     |
| Note             | 144    | no         | yes         | number, velocity; off 128, number, 0 | yes    |
| Program change   | 192    | no         | `once` only | program (the number), 0              | yes    |

"Common only" (answer 2): the Editor's poly aftertouch, 14-bit CC and NRPN are not offered. **Pitch bend is 7-bit**:
the value is the most significant byte and the least significant is 0, so 64 is exactly the centre and 127 is 16256
(99.2 % of full bend) - chosen over `v*129` (which reaches 16383 but puts the centre at 8256) because a spring fader or
an LFO must rest on no bend. No element carries a 14-bit value today (the relative fader's fine position is internal).
**Program change** is offered only on a trigger that has no off (`once: true`); every Sandbox button has an off
(momentary release, toggle's second press, a radio release), so the Sandbox offers Note and CC on a button.

## 3. The Sandbox

**The row's CHANNEL WORD** (`sandbox/model.ts` `channelWord`, the eighth column of `J`): the wire channel, plus 16 times
the type's code, plus 128 when the element does not receive. The codes make the status `176 + 16 * code`: CC 0,
Channel pressure 2, Pitch bend 3, Note -2 (144). A controller on channel 1 that receives is `0` - exactly the column
before change 17 - so the word costs nothing at the defaults and at most one character beyond them (the dearest,
`175`, a channel pressure on 16 with Receive off). An XY pad's Y axis is the fifteenth column when its word differs from
the X axis's (forcing the tail `,min,max,flags`); a pitch bend's controller column is 0 (the first data byte).
Measured against a flag-word bit (`,0,127,24` forced on an otherwise-default row: +10) and a column of its own (+2 to +4
on every row): the channel column is always written, so the word wins.

**Sending** (`runtime.ts` `D`): the scaled value on the word's channel `h%16` and status `176 + 16*(h//16%4)`; a
controller `c,v`, a channel pressure `v,0`, a pitch bend `c,v` with `c` 0. A button's note or controller from the word
(`176 - (h%128)//96*32`), its off a note-off (128, velocity 0) or the min. A relative knob sends relative CC steps
whatever its stored type (its Type row is hidden).

**Receiving** (`runtime.ts` `Y`, assigned `self.midirx_cb=Y` at the end of the touch Timer, every run):

```lua
function Y(s,h,v)if h[1]~=13 or s.touch_cb~=O then return end
local t,n,w=v[2],v[3],v[4]if t==128 then t,w=144,0 end
local q=v[1]+t-176
for _,r in pairs(J)do local k=r[5]if k and r[8]<64 then
 for j,o in pairs(k==4 and{r[8],r[15]or r[8]}or{r[8]})do
  if o==q and(o>31 or n==r[5+j])then
   local u,d=o//16==2 and n or w,r[13]-r[12]
   local p=d~=0 and glim((u-r[12])*127//d,0,127)or 0
   if k==3 then r[17]=u~=r[12]and u>0 or nil Q(r,r[17]and function()return 255 end)
   else r[16+j]=k>4 and p or p*127 D(nil,r,18+j,0,p)I[k](nil,0,r)end
  end end end end end
```

The rule: host traffic only (`h[1]==13`), and only while this surface's entry `O` is still the element's touch
callback. A note-off folds into a note-on at 0 (simplemidi.lua's rule). The message becomes a WORD the way the rows
spell theirs (`channel + status - 176`: a note -32..-17, a CC 0..15, a program change 16..31 - no output's - a channel
pressure 32..47, a pitch bend 48..63); a row that receives (word under 64) matches it whole, and for a word under 32 (a
CC or a note) the number too. The value is a channel pressure's first byte, anything else's second, mapped back through
min..max to a position (floored; exact at the default 0..127). Per kind:

- **Fader**: the held fine position (so a relative fader's next move continues from it, and a spring fader shows the
  value until its next release returns it), the bar redrawn by its own branch with no finger.
- **Button**: on when the value is above 0 and not the button's min (its off value), the light on or off; a radio
  group is not enforced (a DAW sends every member's state); nothing is sent.
- **XY pad** (one touch): the matching axis's held position; the crosshair drawn through the held pair's nearest cell
  (the last received X and Y). A pad with more than one touch does not receive (its slots are transient and a slot's
  cell column is its occupancy).
- **Knob** (absolute): the position and the arc. A relative knob keeps no position and does not receive.
- **No echo**: the received value is kept as the element's last value sent (`D` called with no element stores it and
  sends nothing); the branch's own redraw finds nothing new to send.

**The colour input** (a surface setting, off by default; the Sandbox's no-selection panel, "Color input"): a CC on
its channel numbered `first + n - 1` recolours element n (the surface's order, a blank included) on layers 1 and 2.
The value is a **hue wheel** (`Z`, 337 characters): 0 the element's own colour back, 1..126 round the wheel in six
sectors of 256 (`(w-1)*1536//126`: 1 red, 22 yellow, 43 green, 64 cyan, 85 blue, 106 magenta), 127 white, dimmed by
the surface's brightness below 255. A Launchpad-style palette index was measured out: 128 RGB triples are about ten
times the wheel's text. Off by default because a colour controller always listening on a channel a DAW also uses for
its own feedback would recolour elements unasked; a question for the user.

**Where the Lua lives**: every part is packed into the five slots, the touch Setup being the fifth under five slots
(between its data half and its pull-ins), first fit decreasing and then an exact search when first fit loses
(`packRuntime`, `PACK_SEARCH_LIMIT`). The receive callback is 539 characters; the colour input's `Z` 337 and 38 more in
`Y`. See `docs/entries/sandbox-runtime.md` "Change 17A" for every figure and the budget.

## 4. The playground: how an entry declares its outputs (17B's contract)

An entry lists `outputs` (`src/lib/catalog/types.ts` `MidiOutput`):

```ts
outputs: [
  {
    id: "lfo",                 // a slug, unique in the entry
    name: "LFO",               // the block's sub-head: what the output is (Ring 1, X axis, Bite)
    kind: "continuous",        // or "trigger"; a trigger with no off may add `once: true`
    tokens: { type: "@TYPE", channel: "@CH", number: "@CC", receive: "@RX" },
  },
],
```

`tokens` name the output's knobs by their Lua token (a compiler card's knobs, which have none, by knob id). `type` and
`channel` are required; `number` where the type carries one; `receive` where the card answers host MIDI. Each knob is an
ordinary token knob - the stamp encodes its index, the budget sweep measures its rungs - declared with the ladders in
`src/lib/tune/midi.ts`:

- **Type**: `typeValues(output)` - `CONTINUOUS_STATUSES` `["176", "224", "208"]`; `TRIGGER_STATUSES` `["144", "176"]`;
  `ONCE_STATUSES` adds `"192"`. The literal is the status byte. Kind `mode`. Worded by its role (view.ts
  `MIDI_TYPE_WORDS`); three or more a select, two a segmented pair.
- **Channel**: `CHANNEL_VALUES`, `"0"`..`"15"` - the firmware's 0-based channel on the wire; since 17B the panel READS
  it 1..16 (`model.ts` shows a Lua card's channel one up in its words, readout and typed field; the index and the literal
  are the knob's own, so the stamp and the Lua do not move). The sixteen must stay in order: Same channel for all
  writes every output's Channel by index.
- **Number**: `numberValues(kept)` - 0..127 with a card's OLD rungs first in their old order, then the rest ascending,
  so a saved copy (which reopens by index) keeps its value. Kind `amount` for a controller number; a note ladder may keep
  `note`. It is a wide knob (two stamp characters) - add it to `knobs.lua.spec.ts`'s named wide list.
- **Receive**: `RECEIVE_VALUES` `["0", "13"]`, default `RECEIVE_ON_INDEX` (1). The literal is the header INSTR the
  callback answers, so On and Off cost the same Lua: `h[1]==@RX`.

Rules the specs hold (`catalog.spec.ts`, `outputProblems`): the ladders exactly as above, no knob in two roles, every
output knob a MIDI destination by its id or label words (`midi`, `cc`, `channel`, ...: `midiType`, `midiReceive`,
`ring1Channel`), and a card's knob cap (three to six, the sync cards' more) counted WITHOUT its outputs' knobs.
Append new knobs after the existing ones (a record's older indices land on the knobs they were). A grown rack changes
the stamp's shape: a card's older links land `unreadable` (the known pattern) - say so in the card's commit. Update the
card's rows in `docs/TUNING-REVIEW.md`.

The tuning panel (TuningRegion.svelte) draws MIDI as: **Same channel for all** (a select over Per output and the
channels in the rows' own numbering; it shows the shared channel, or Per output when they differ, and writes every
output's Channel), then one block per output under its name - Type, Channel, Number (gone under a pitch bend or a
channel pressure), Receive - then any MIDI knob no output names, as before. Since 17C (section 8) a block's head is a
one-line summary that folds it, and a Number is worded by its output's Type.

## 5. The Lua recipe on a card (ARC, `src/lib/catalog/entries/arc.ts`)

**Send** by the type, the value `o` computed once and kept as the last value sent:

```lua
local o,t=<value>,@TYPE s.l=o s:gms(@CH,t,t==208 and o or t>223 and 0 or @CC,t==208 and 0 or o)
```

For a trigger: `s:gms(@CH,@TYPE,@CC,<velocity>)` on, and off `@TYPE==144 and 128 or 176` with 0 (a CC trigger's off
value); a `once` output sends nothing on release.

**Receive**: a card whose Setup has room assigns in its Setup; a card near the budget (ARC's Setup is 806 of 908) makes
the callback from its TIMER once per install, keyed on its own touch callback (every install makes a new one), and the
callback acts only while that touch callback is still the element's:

```lua
if s.k~=s.touch_cb then s.k=s.touch_cb s.midirx_cb=function(s,h,v)
  if s.k==s.touch_cb and h[1]==@RX and v[1]==@CH and v[2]==@TYPE and(@TYPE>207 or v[3]==@CC)then
    local w=@TYPE==208 and v[3]or v[4]
    if w~=s.l then <set the card's value from w> end
  end end end
```

(A note output also folds `v[2]==128` into 144 at 0.) `w~=s.l` is the echo guard for a card that sends continuously:
its own last value coming back is ignored. What "the value" is per card is the card's decision, recorded in its entry
doc: ARC's received value is the LFO's CENTRE (the offset fader moves so that, at depth 0, the value comes back exactly;
the Timer repaints the fader's lit cell).

**Why `library.ts` did not change**: a shared matcher and sender (about 90 + 150 characters) fit neither library half
(255/0 has 66 free, 255/6 35), and 255/4 is a catalog card's page-next (D-19). A per-card inline send is ~45 characters
more than the old `s:gms(@CH,176,@CC,o,0)`, and the receive ~160 in whichever of Setup or Timer has room. If 17B finds a
card that fits in neither, the next move is to free room in 255/0 (its `P B L` state and the `A` sender only LUMEN
calls) for a shared `M` helper - that moves every card's system records and is a decision to record, not a detail.

## 6. What 17B found and settled (the nineteen hand-authored cards, 2026-09-23)

Every hand-authored card is on this model now; `docs/entries/<card>.md` "Change 17B" has each card's decisions and
figures, and `BENCH-2026-09-16.txt` section 17's Done paragraph "17B" the table.

- **Every card assigns `self.midirx_cb`**: its own guarded callback, or `nil` - in the Setup where it fits, in the
  Timer where the Setup is full (TRACKPAD and TRACKPAD COMET assign `nil` on every Timer call: their Setup is 903 of
  908). A Timer-made callback is made once per install, keyed on the touch callback (`s.j`), ARC's route.
- **The pull-in** (`self:tim()`): a still card (CONSOLE, STRIP, LUMEN, QUADRANT, MORPH, and WHEELS whose Timer only
  springs) cannot arm a Timer to make its callback - an armed Timer reads as motion to the preview at tick 0, which moved
  frames.json and turned the listing's `static` into `animated` when tried. The module runs a touch element's Timer body
  as a method (the Sandbox's first probe); the host models it since 17B (`lua-host.ts` SELF_PRELUDE, HOST_SELF_METHODS
  `tim`). The Setup calls `self:tim()` last; the body runs once, synchronously, arming nothing, and hands functions
  back through fields read into the Setup's upvalues (`local M ... self:tim()M=self.m`; a field CALL is refused by
  host-surface.spec.ts, a field READ into a local is not). RADAR calls it too: its Timer's first timed run is five
  minutes away. The install order (0/6 before 0/0) matters for these cards again; `docs/HARDWARE-AUDITION.md` row 41.
- **The trigger off**: `T*3//2-88` is the note-off 128 under a note (144) and the controller again (176) under a CC -
  eleven characters against `T==144 and 128 or 176`'s twenty-three. A CC trigger is a gate: its value on, 0 off.
- **Several outputs of one kind** are tables built once (`{@T1,..}`, `{@CH,@C2,..}`, `{@N1,..}`) and indexed per
  element; a bank reading one base (CONSOLE's nine faders) stays one output with a first Number, and under a pitch
  bend or a pressure each fader goes on its own channel from the first (the Mackie layout).
- **What a received value does**, by kind: a continuous control's value and light (CONSOLE, STRIP, WHEELS' mod wheel,
  MORPH's corners held until the next touch, LUMEN's and RADAR's held pair drawing the cursor or the comet, WHEELS'
  pitch wheel shown and held - no spring, nothing sent back); a pad's light on and off (QUADRANT, the Sandbox button's
  receive); a sequencer's note ARMS one cell at the playhead and never clears (ORBIT, STEPS, SONAR, RADAR POINTS - an
  echo of the card's own notes lands on armed cells and changes nothing); a note that holds no value receives nothing
  (CHORUS's chord, GHOST's replay, POMODORO's announcements, SNAKE's game notes).
- **Pitch bend stays 7-bit** except WHEELS' pitch wheel, which was fourteen-bit first and keeps its fourteen bits under
  a pitch bend (its other types send the top seven).
- **The sweeps**: a card's output knobs are walked one at a time (the stamp round-trip sweep's Pass C, the gate's
  hash-wire past one million sampled states), never cross-producted - STEPS alone would be 2^16 x 16^8.

## 7. What 17C carried from here (done: section 8)

- The compiler-driven cards (the vendored `_pad.ts`) assign no callback; their landing needs `self.midirx_cb=nil` (or
  their own) appended by the tune model - a wire change for every preset card.
- The ladders, the words, the blocks, the 1..16 channel display, the pull-in and the stamp need nothing more;
  `outputProblems` names a bad declaration.

## 8. The ported presets (change 17C, 2026-09-23)

The seven cards the vendored compiler (`src/vendor/botor/_pad.ts`, read-only) produces from a `PadState` - AURORA,
PINWHEEL, STARFIELD, JOYSTICK, NINE PADS, FOUR FADERS and DIAL - are on this model now. Two routes, chosen per card:

| Card        | Route                | Outputs (kind)                           | Types offered    | Receive                                                           | Latch                            | Setup / Timer (corner)           | Ring |
| ----------- | -------------------- | ---------------------------------------- | ---------------- | ----------------------------------------------------------------- | -------------------------------- | -------------------------------- | ---- |
| AURORA      | wrapped              | X axis, Y axis (continuous)              | CC, PB, pressure | the comet drawn at the held pair                                  | already (the first finger)       | 361 / 55 -> 784 / 55             | yes  |
| PINWHEEL    | wrapped              | X axis, Y axis (continuous)              | CC, PB, pressure | the comet at the held pair, the first finger's colour             | already                          | 413 / 55 -> 841 / 55             | yes  |
| STARFIELD   | wrapped              | X axis, Y axis (continuous)              | CC, PB, pressure | the comet at the held pair                                        | already                          | 349 / 55 -> 777 / 55             | yes  |
| JOYSTICK    | wrapped              | X axis (PB), Y axis (CC 17) (continuous) | CC, PB, pressure | the parked dot moved to the held pair's cell                      | already                          | 491 / 24 -> 622 / 445 (pull-in)  | yes  |
| DIAL        | wrapped              | Dial (continuous)                        | CC, PB, pressure | absolute: the level the next turn continues from; relative: `nil` | already                          | 592 / 55 -> 904 / 55             | yes  |
| FOUR FADERS | rebuilt (a Lua card) | Fader 1..4 (continuous)                  | CC, PB, pressure | the fader's bar                                                   | fixed: a contact keeps its fader | 525 / 24 -> 765 / 300 (pull-in)  | no   |
| NINE PADS   | rebuilt (a Lua card) | Pads (trigger, a bank from a base note)  | Note, CC         | a pad's note lights it, its off darkens it                        | fixed: a contact keeps its pad   | 565 / 158 -> 752 / 764 (pull-in) | no   |

**The wrap** (`src/lib/catalog/entries/ported-midi.ts`). The compiled pair is rewritten on HANGAR's side, after the
compile and before the brightness scaling, by one function every consumer calls (`presetWire`: the tuner's meters and
landing, the gate's `P/` records, the sweeps): each card's template finds the sends the compiler wrote for the shelf's
Send and Channel - both superseded, so the compiler always writes 16 / 17 on channel 0 - and replaces each with the
output's tokens through ARC's `M(t,c,n,o)` (defined once, before the touch callback), then appends the card's
receive (`self.midirx_cb`, guarded on the touch callback it was made beside; JOYSTICK's made by its Timer and pulled in,
its Setup had no room). Every find is exact - the whole call, counted, a miss thrown as `WrapMissError` - and no
`gms(` survives but `M`'s; `ported-midi.spec.ts` walks every compiler knob state each card can reach (the non-colour
product, the colour at the sweep's 27 literals) at the outputs' defaults and dearest literals. The inserted text is
canonical, so the compiled string's one-character-per-action rule (`wire-pin.spec.ts`) holds.

- **The rack.** A wrapped entry's `knobs` are its outputs' token knobs only; `supersedes` names the shelf knobs they
  took over (the Send, the Channel, JOYSTICK's Bend). An output knob with a superseded knob's id takes its rack
  position (`stamp.ts`'s `stampKnobs`), so a saved copy's positions keep landing on the same knob; a superseded id no
  knob takes (Bend) leaves the rack, and the compiler compiles its shelf value.
- **The stamp.** At the outputs' defaults the card still writes the vendored stamp, so every older link of AURORA,
  PINWHEEL and STARFIELD still lands `restored`; once an output moves it writes HANGAR's index format over the whole
  rack (format `w` - the lattice colour rides it). An older JOYSTICK or DIAL link whose Send, Channel or Bend was off
  the shelf's lands `unreadable` (the known pattern).
- **The ladder.** The vendored ladder plans over the bare compile; on a wrapped card the rewrite's measured cost is
  held back as a reserve (`model.ts` `ladderReserve`), so its steps and its resolved state are the wire's. Randomize's
  fit test measures the wire. Neither is reachable by a visitor: `reachability.sweep.spec.ts` costs every compiler
  state at the outputs' dearest literals, and the dearest is DIAL's 904 of 908.
- **What the browser shows.** The vendored PadSim runs the `PadState`, not the Lua: the picture under every gesture is
  the compiled preset's, which is the module's - the rewrite touches no LED call. The sends differ only in their
  bytes, and a compiler-driven preview keeps no MIDI log (the monitor bar is absent), so nothing on the page claims a
  message. No MIDI reaches any preview, so a receive is the module's alone. The five wrapped cards were already
  latched (the first finger claims `s.f`), so no gesture shows the preview and the module disagreeing. That is why the
  two cards whose fix IS the latch were not wrapped.

**The rebuilt cards** (`entries/faders.ts`, `entries/ninepads.ts`; `docs/entries/faders.md`, `ninepads.md`). FOUR
FADERS' fault is the one the user saw - "i saw it on the faders config in playground" - and NINE PADS' slide
re-triggered its pads ("legato for free", the compiler's words, overruled as CHORUS's was at 17B): a wrapped card's
preview would still slide while the module latched, so both are hand-authored Lua cards now, RADAR's route (12b),
their pictures proved equal to the shelf presets frame for frame in the VM (`frames.json` and the OG images unmoved),
and both left the front-door ring, which holds five: Aurora, Pinwheel, Starfield, Joystick, Dial. NINE PADS also
plays a fast tap now (the compiled preset sent nothing on one - a recorded BOTOR finding a hand-authored card can fix).

**The panel** (17B's questions 5 and 6, decided): an output's Number is worded by its output's Type - a note name
under Note, the number under CC or Program change (hidden under Pitch bend and Channel pressure, as before) - and each
output block's head is a full-width button on the rack's grid, the name in the label column and a one-line summary in
the house mono (`Note · Ch 1 · C1 · Receive`), a chevron of straight lines at its end, that opens and closes the block
(click, Enter, Space; `aria-expanded`); every block arrives folded when a card has more than four outputs (STEPS'
eight), open at four or fewer.

## 9. Extra messages (change 21A, 2026-09-24)

Andrew Huang, testing HANGAR and a ZONA, asked whether a touch on an XY pad could play a note on and off beside its X
and Y (`BENCH-2026-09-16.txt` section 21). The Sandbox's answer: an element's MIDI output is a list - its own outputs,
then up to **three extra messages**, each with a trigger.

| Trigger   | On                                                                  | Off                                       | Types                            | Kinds                                                 |
| --------- | ------------------------------------------------------------------- | ----------------------------------------- | -------------------------------- | ----------------------------------------------------- |
| **Touch** | the finger lands (an onset, a 9, a Latch Off hand-over's arrival)   | the finger leaves - every path `R` covers | Note (a velocity), CC (127 / 0)  | every kind that takes touch: fader, button, pad, knob |
| **Value** | follows the element's value like its own output, sent on the change | -                                         | CC, Pitch bend, Channel pressure | fader, XY pad (its X or its Y), absolute knob         |

- **The model** (`store/schema.ts` `Extra`): `{ trigger, type, channel 1..16, number 0..127, velocity?, source? }`. A
  Touch note's `velocity` is 1..127 fixed (absent 100), or `"x"` / `"y"` - the landing's position on the element's box
  through the calibrated axes (`A`), mapped `p*126//127+1`: 1 at the low edge, 127 at the high one, never 0 (a
  note-off). A Value message's `source` is an XY pad's axis (absent X). A Touch CC sends 127 on and 0 off - a gate on
  its controller, not the element's Min / Max (those scale the element's own value).
- **The order**: at the landing the element's own messages first, then the Touch messages (a synth hears X and Y before
  the note starts on them); at the release the Touch offs first, then the element's own release.
- **A multitouch pad** (Touches > 1): the Touch note is a **gate for the pad** - on at the first finger down, off at the
  last finger up (`W` counts the region's holders). A Value message follows the pad's first slot.
- **Never received, never echoed.** Receive stays on the element's own outputs; the receive callback stores a value
  without sending (`D` with no element), and an extra sends only where the element's own output would.
- **Not offered where it cannot work**: a Value message on a button (its value is its press) or a relative knob (its
  detents are steps) - a stored one is kept in the record and not sent; a blank takes none.
- **The wire**: a row's keyed field `m={{w,n,v},...}` - `w` the word as the channel word spells a type (the channel plus
  16 x the code: a note -2, a CC 0, a channel pressure 2, a pitch bend 3; never a receive bit), `n` the number (0 under a
  pitch bend or a pressure), `v` a Touch note's velocity or 128 / 129 for X / Y, a Touch CC's 127, a Value message's
  column negated (19 a fader's, a knob's and a pad's X, 20 its Y; a multitouch pad's first slot 20 and 21). The sign
  tells the two triggers apart. Measured against a table of its own keyed by region index (`P={[2]={...}}`): the row
  field is cheaper on every surface measured, data and readers - page 3 with one Touch note 18 against 49, page 3 with
  three extras on every element 171 against 263, sixteen with a Touch note on every button 144 against 196 - because
  `W` and `D` hold the row, not its index.
- **The Lua** (`runtime.ts`, only on a surface that carries one): `W(s,r,x,y)`, called by the entry after the branch on
  a landing (`if o then W(s,r,x,y)end`) and by `R` on every release (`W(s,r)`), sends the Touch ons and offs; `D` sends
  each Value message beside the element's own (`g[3]==-n`). Their costs are section 10's table.

## 10. A Note on a continuous output (change 21A, 2026-09-24)

"then we need to add note on off inside midi output for each element no?" - "Both, as a choice": the Type of a
**fader, an absolute knob and each axis of a one-touch XY pad** gains **Note**, played by a **Note mode**:

- **Pitch** - a ribbon. The value picks the note: Min..Max is the note range, and a **Scale** (Chromatic, Major, Minor,
  Dorian, Mixolydian, Lydian, Phrygian, Major pentatonic, Minor pentatonic - the catalog's own scale words, `tune/view.ts`
  `SCALE_WORDS`) rooted on **Min** quantises it DOWN: the largest scale degree at or under the value's distance above
  Min's pitch class (`model.ts` `pitchOf`, the runtime's twin). A touch plays the value's note at the fixed Velocity
  (1..127, default 100); sliding onto another note sends the old note's off and then the new note's on - never two held
  by one finger; the lift sends the off. A relative ribbon or a knob plays its held note at the landing (the Min until it
  has moved) and re-notes as it moves.
- **Gate** - a touch plays the fixed **Note** (typed as a name or a number) at the value where it lands as its velocity
  (through Min..Max; never 0 - `glim(u,1,127)`); moving changes the value and not the note; the lift sends the off.
- **Receive**: a Note does not receive (the row is hidden under a Note) - a note is an event, not a held value: under
  Pitch a received note would have to be placed back through the scale, under Gate its only number is a velocity the
  element does not keep between touches.
- **Not offered** on a pad with more than one touch (its fingers are transient slots, and one output cannot hold a note
  per finger) or a relative knob (a controller alone); a button keeps its Note / CC.
- **The wire**: the channel word's code - Gate the button's -2, **Pitch -3** - with the receive-off bit always set (a Note
  never receives): an X word 80..95 under Pitch, 96..111 under Gate, read `h%128//16` 5 and 6 by the note-aware `D` (the
  continuous codes 0, 2 and 3 read the same). Under Pitch the number column carries the velocity; a non-chromatic
  Pitch's degrees ride the row as `[24]={...}` (the Y axis `[25]`). The sounding note is column 22 (23 for Y).

| Text (canonical, `emit.spec.ts` test 12)                                   | Characters      |
| -------------------------------------------------------------------------- | --------------- |
| `W` with a Touch extra / with From X or Y / with the pad's gate            | 146 / 220 / 237 |
| `W` with a continuous Note / with every piece                              | 296 / 585       |
| `D` (174) with a Value extra / with a Note / with both                     | 299 / 399 / 524 |
| the entry `O` with its call (273), `R` with its call (232, multitouch 243) | 297, 238 (249)  |

**Only a surface that carries an extra or a Note carries any of it**: every one of the gate's 46 earlier Sandbox
fixtures emits byte-identical strings (with the new fields present and inert too), and the gate's Sandbox set moved only
by its sixteen new fixtures (874 records equal, 304 added). **Budgets** at the picker corner under five slots (255/6,
255/0, 255/4, Timer, Setup): page 3 receiving 893/908/905/897/877 (69 free) cannot take a Touch note on its pad
(858/908/854/1147/908, over); with every Receive off it can (893/908/907/728/502 -> 858/908/882/904/590), and a C major
ribbon on the fader beside it is over again (858/908/858/1131/907). Every element receiving, a Touch note on every element
puts the three kind combinations change 11 put over beside a multitouch pad over (`vbxk`, `hbxk`, `vhbxk`); every
continuous element a Pitch note, seven (`vbk`, `hbk`, `vhbk`, `bxk`, `vbxk`, `hbxk`, `vhbxk`). The cap floor with every
option on - change 21A's Pitch on Major and three dearest extras beside the representative's every other option - is
**4** 1 x 2 faders from an empty surface; `cost.ts`'s representative is unmoved (11, and 14 from twelve).

**The inspector** (`RegionInspector.svelte`): under a Note, `Note mode` (Pitch / Gate - the word `Mode` is Behavior's
Absolute / Relative), then Pitch's Scale and Velocity or Gate's Note, in place of the number; Min / Max's helper names the
note range. After the element's own rows, one block per extra on 17C's folding head - `Message n`, a chevron, and on a
line of its own the summary (`Touch · Note · Ch 1 · C3 · Vel 100`, `Value · CC · Ch 2 · 74 · from Y`), the remove box in
the lock column - with Trigger (where the kind takes both), Type, Channel, Number (a note name under Note), Velocity
(Fixed / From X / From Y, then its stepper) and Source (a pad's Value); then **+ Add message** (disabled at three): a Touch
note on a pad and a button, a Value CC on a fader and an absolute knob. Extras show on one element at a time (13A's
multi-edit does not reach them), are not remembered (13B), and ride the Grid Editor profile file (13C) in its five
strings, which are the landing's.
