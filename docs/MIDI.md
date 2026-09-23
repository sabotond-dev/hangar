# MIDI in HANGAR: outputs, types, RX and the colour input

Change 17 (BENCH-2026-09-16.txt section 17, 2026-09-23): every element that sends MIDI, in the Sandbox and on the
playground, has a **Type**, a **Channel** and a **Number**, and **receives** by default. Part 17A landed the shared
pieces, the whole Sandbox and one playground card (ARC); part 17B moves the other twenty-six cards onto the same
model, one commit per card. This document is 17B's manual: the model, the wire per type, the receive rules, the colour
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
  keeps the previous card's. **Every HANGAR landing that receives assigns its own; the Sandbox assigns `nil` when
  nothing receives; a callback guards itself** (below) so it is inert once another card's touch callback is installed.
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
- **Channel**: `CHANNEL_VALUES`, `"0"`..`"15"` (the firmware's 0-based channel, X-08; the Lua cue shows).
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
channel pressure), Receive - then any MIDI knob no output names, as before.

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

## 6. What 17B carries from here

- Every card's Setup (or Timer) must assign `self.midirx_cb` - its own callback, guarded, or `nil` - or a previous
  landing's stays live until a Store or a power cycle. The compiler-driven cards (the vendored `_pad.ts`) assign none;
  their landing would need `self.midirx_cb=nil` appended by the tune model - a wire change for every preset card, 17B's.
- The ladders, the words, the blocks and the stamp need nothing more; `outputProblems` names a bad declaration.
