# The live mirror (change 20, 2026-09-24)

When a ZONA is connected, **Mirror ZONA** puts the module's own lights on the plate in place of the
simulator, and the MIDI the module itself sent in the monitor beside it. Read-only: the mirror never
writes a configuration, never stores, never changes the page. This page is the research it was built
on (firmware and Grid Editor read at the paths below, 2026-09-24), what it shows, what it cannot, and
the exact bytes it puts on the wire.

Sources, read not assumed: `grid-fw/common/src/c/grid_protocol.h`, `grid_decode.c`, `grid_led.c`,
`grid_ui.c`, `grid_ui_touch.c`, `grid_transport.c`, `grid_port.c`, `grid_usb_midi.c`,
`grid_module.c`, `esp32s3/components/grid_esp32_port/grid_esp32_port.c` and
`grid_esp32_led/grid_esp32_led.c` (grid-fw at `dc7d301`); `grid-editor/src/renderer/serialport/
message-stream.store.ts:163-203, 300-373`, `instructions.ts:248-290`, `runtime/runtime.ts:1765-1790`,
`runtime/runtime-manager.store.ts:200-245` (grid-editor at `a0fb69d5`); the pinned
`@intechstudio/grid-protocol` `dist/index.js:3925-4115` (the encoder and the two decoders).

## 1. LEDPREVIEW (class 0x042) - the lights

**The frame.** `grid_protocol.h:1034-1052`: after the instruction, `LENGTH` (4 hex characters, the
number of characters that follow), then `LENGTH / 8` records of eight hex characters each: `NUM`
(2), `RED` (2), `GRE` (2), `BLU` (2). The pinned package's class table declares the same fields, so
`decode_packet_classes` reads `LENGTH` and the FIRST record only; the rest are read off the class
block's raw bytes (from index 8: three for the class code, one for the instruction, four for
`LENGTH`) - exactly where the Editor reads them (`message-stream.store.ts:164-184`,
`descr.raw[8 + i * 8 ...]`). HANGAR's frame decoder now hands that raw block through
(`src/lib/protocol/decode.ts`) and `src/lib/protocol/preview.ts` reads the records.

**What it carries.** The module's FINAL colour per LED, after every layer is mixed: `grid_led.c:
497-522` writes `led_frame_buffer`, which `grid_led_render_framebuffer_one` (`:407-462`) fills with
the sum of the three layers' min / mid / max colours weighted by each layer's shape and phase,
divided by 512 once and clamped at 255 - the same bytes the LED strip is sent
(`grid_esp32_led.c:36-50` hands that buffer to the RMT peripheral unchanged). It is not per layer.
The vendored simulator's frame is that same number (`pad-sim.ts`, "The single divide by 512 happens
AFTER the layer sum"), so the mirror paints through the same painter with no scaling: a mirrored
cell and a simulated cell of the same state are the same pixel. (The Editor multiplies each channel
by 4 for its own display; HANGAR does not, because its simulator does not.) `RED` is
`led_frame_buffer[i*3+1]` and `GRE` is `[i*3+0]` - the strip is GRB, the record is RGB.

**Which LEDs.** `NUM` is the HARDWARE index along the strip, 0 to 80 on a ZONA (`grid_module.c:
455-458`, `grid_led_init(led, 81, ...)`). The strip is a serpentine: logical cell `x + 9y` lives at
the hardware index in the `R0..R8` table (`grid_module.c:444-452`; row 0 reads 8, 7, ... 0). The
mirror converts with the same rule as the vendored `hwToScreen` (`src/lib/mirror/frame.ts`, and
`mirror.spec.ts` holds the two equal for all 81 indices).

**Only the LEDs that changed.** Each record is an LED whose change flag is set: the flag is raised
whenever the frame buffer's value for that LED changes (`grid_led.c:390-402`) and cleared when a
report carries it (`:516`). The flags accumulate while nobody is reporting them.

**When it is sent - three paths, two of them gated on an editor heartbeat.**

1. **Beside every host heartbeat of TYPE above 127** (`grid_decode.c:709-735`): the heartbeat
   notes the time, marks the editor connected, and, if any LED changed, sends a `LEDPREVIEW` REPORT
   with every changed LED. So a firmware-animated layer (a trail fading on its own, with no event
   running) reaches the host at the host's heartbeat rate.
2. **With every processed event while the editor is connected** (`grid_ui.c:739-760`,
   `grid_ui_clear_triggered`): after the events of one pass run, the frame buffer is re-rendered
   and, `if (change_length && editor_connected)`, a `LEDPREVIEW` EXECUTE with the changed LEDs is
   appended to the same message as the events' own output (MIDI, EVENTVIEW). A Lua timer or a touch
   callback that repaints therefore reaches the host at the rate the configuration runs.
3. **On request** (`grid_decode.c:739-756`): a `LEDPREVIEW` FETCH addressed to the module (its own
   position or the global one) raises EVERY LED's flag and answers with a REPORT of all 81. Nothing
   else changes: no layer, no configuration, no page. This is what the Editor sends when it wants a
   full picture (`runtime.ts:1779-1790`, `FetchLedpreview`).

"Editor connected" is one flag, `grid_sys.editor_connected`: set by any heartbeat of TYPE above 127
(`grid_decode.c:720-726`), cleared by the module's own port task when no such heartbeat has arrived
for 2 seconds (`grid_esp32_port.c:473-481`, "EDITOR TIMEOUT"). Nothing else in the firmware reads it
(`grid_ui.c:746` is the only consumer; the D51 port has the same pair).

**The rate.** Path 2 runs at the configuration's own pace; path 1 at the host's heartbeat period.
Every frame goes out through `grid_transport_send_msg_to_all` into the UI port's receive ring and
from there to every connected port, the USB CDC port included (`grid_transport.c:211-262`,
`grid_port.c:243-265`), so it arrives on HANGAR's serial stream with no other switch.

## 2. EVENT, EVENTPREVIEW, EVENTVIEW (0x050, 0x051, 0x053) - where the fingers are: they do not say

- **EVENT (0x050)** `grid_ui.c:598-630`: page, element, event, and two parameters read from the
  element's template list. **It returns immediately for the touch element**
  (`if (eve->parent->type == GRID_PARAMETER_ELEMENT_TOUCH) return;`, `:606-608`). A ZONA's only
  non-system element is the touch element (`grid_module.c:460-462`), so on a ZONA an EVENT frame is
  only ever the system element's (its setup, utility button, MIDI receive, timer).
- **EVENTVIEW (0x053)** `grid_ui.c:632-679`: sent with every processed event, touch element
  included, carrying page, element, event, `VALUE1`, `MIN1`, `MAX1` and the element's name. The
  value index comes from `GRID_ELE_EVE_TO_VALUE_IDX`, which maps potentiometers, buttons, encoders
  and endless knobs only (`grid_ui.c:56-69`); for the touch element it is "invalid" and the three
  values are read from index 0 of a template list the touch element never fills. **No x, no y, no
  contact id.**
- **EVENTPREVIEW (0x051)** `grid_decode.c:758-796`: answered to a FETCH only, one triple per element
  (index and two template values); the touch element has no position parameters in its template,
  so it carries none either.
- **Where the coordinates actually live.** `grid_ui_touch.c:98-143`: a contact's id, event code, x
  and y go into a ring the element's Lua reads with `touch_pop`, and the configuration's own
  `touch_cb` is handed them. They never leave the module unless the configuration sends them
  itself (as MIDI, say).
- **`rx_mode` type 3 is not a sender switch.** `rx_mode(3, mode)` (`grid_lua_api.c:832-865`)
  decides whether this module HANDLES an EVENTVIEW frame it RECEIVES from another module
  (`grid_decode.c:1154-1158`, `grid_rx_should_handle`), for a module with a screen showing its
  neighbours' names. It has no effect on what a ZONA sends. **HANGAR does not set it**, so the
  mirror sends no Lua at all and nothing needs restoring.

**So the mirror cannot show touch points, and says so** on the plate's status line: the protocol
has no frame that carries a ZONA finger's position. The e2e has no "a fake touch shows a ring" step
for the same reason, and the fake ZONA emits no touch frame, because no such frame exists to fake.

## 3. MIDI (0x000) - what the module sent

`grid_lua_api.c:867-903`: every `midi_send` builds a `MIDI` class block (`CHANNEL`, `COMMAND`,
`PARAM1`, `PARAM2`, two hex characters each) with instruction **EXECUTE** into the event's output,
which goes out through the same `send_msg_to_all` as everything else - so **yes, every message the
configuration sends is echoed to the serial host**, unconditionally, editor or no editor. The USB
port both translates it into a USB-MIDI packet (`grid_decode.c:55-80`) and writes the frame itself
to the CDC stream (`grid_port.c:243-265`). This is what the Editor's MIDI monitor shows
(`message-stream.store.ts:323-333`).

MIDI the module RECEIVES from the computer comes back with instruction **REPORT** and the global
source position (`grid_usb_midi.c:141-175`), so the two are told apart on the wire. The mirror's
monitor shows the EXECUTE frames from the ZONA's own address, labelled as from ZONA; a received
message, a sysex (`MIDISYSEX`) and another module's MIDI on a rig are not shown.

## 4. What HANGAR already decoded, and what changed

Before: the frame scanner (`framing.ts`), `decodeFrame` over the package's `decode_packet_frame` /
`decode_packet_classes` (`decode.ts`), and the heartbeat / page / config / store / serial classes
the session and the install store consume. `decodeFrame` dropped the class block's raw bytes, which
is the only place `LEDPREVIEW` records beyond the first live.

Change 20: `DecodedClass.raw` (optional; the class block between STX and ETX, exactly as the
package's frame decoder cut it); `src/lib/protocol/preview.ts`, which imports nothing and reads
`LEDPREVIEW` records (both instructions) and a sent `MIDI` message; one new builder in
`descriptors.ts`, `fetchLedPreview(sx, sy)`. The package's decoder is used for everything it
decodes; only the variable-length record run is read by hand, as the Editor reads it.

## 5. What the mirror sends - the whole write log, with the bytes

HANGAR already sent host heartbeats: exactly one TYPE 255 after every write leg, because it is the
only thing that re-enables page changes after a config write (`grid_decode.c:717`; `descriptors.ts`
`hostHeartbeat`). It never sent them periodically, so on its own the module never counted HANGAR
as an editor for longer than 2 seconds. The mirror uses that same builder, periodically, and one
new read request:

| When                   | Frame                                     | Builder                   | Effect on the module                                                                                     |
| ---------------------- | ----------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| Switch-on, first       | `HEARTBEAT` EXECUTE, TYPE 255, global     | `hostHeartbeat()`         | editor connected; page changes enabled (their normal state); a REPORT of whatever LEDs had changed       |
| Switch-on, second      | `LEDPREVIEW` FETCH, addressed to the ZONA | `fetchLedPreview(sx, sy)` | every LED's change flag raised, a REPORT of all 81                                                       |
| Every 100 ms while on  | `HEARTBEAT` EXECUTE, TYPE 255, global     | `hostHeartbeat()`         | keeps the editor flag set; a REPORT of the LEDs changed since the last one                               |
| Switch-off, disconnect | nothing                                   | -                         | the heartbeats stop; 2 s later the module's own timeout clears the editor flag and the LED traffic stops |

The bytes (the pinned encoder's output; `ii` is the per-request id, `ss` the per-load session byte,
`cc` the checksum - all three vary, everything else is fixed):

```
HEARTBEAT EXECUTE TYPE 255, 43 bytes:
  01 0f "0028" "ii" "ss" "00" "00" "00" "00" "0" "0" "00" 17  02 "010" "e" "ff" "ff" "01" "00" "00" 03  04 "cc" 0a
LEDPREVIEW FETCH to (0, 0), 33 bytes:
  01 0f "001e" "ii" "ss" "00" "00" "7f" "7f" "0" "0" "00" 17  02 "042" "f" 03  04 "cc" 0a
```

(The header fields in order: SOH, BRC, LEN, ID, SESSION, SX, SY, DX, DY, ROT, PORTROT, MSGAGE,
EOB. DX/DY `00 00` is the global address, `7f 7f` the module's own position.)

**Why 100 ms and not the Editor's 300.** A layer the firmware animates by itself (a trail that fades
with no Lua running) reaches the host only beside a heartbeat (path 1), so the heartbeat period IS
the mirror's frame rate for that kind of motion. 100 ms is ten pictures a second for 43 bytes each
on a 2 Mbaud link; everything a configuration repaints from its own timer or touch callback arrives
at its own rate through path 2 whatever this number is. `MIRROR_HEARTBEAT_MS` in
`src/lib/mirror/mirror.svelte.ts`.

**What "restored" means here.** The mirror changes two firmware flags and no configuration.
`editor_connected` goes back to 0 by the module's own 2-second timeout once the heartbeats stop -
the state it was in before (HANGAR's end-of-write heartbeat sets it for the same 2 seconds and no
longer). `page_change_enabled` is set to 1 by every TYPE 255, which is the value a module boots with
and the value every HANGAR write ends by restoring; HANGAR never sends TYPE 254
(`forbidden-instructions.spec.ts` test 3), so there is no other value to restore it to. No `rx_mode`,
no Lua, no config, no store, no page switch.

**Never under a write.** A write on the port while another write holds the port's writer is refused
by the browser ("The port is busy"), so the mirror sends nothing while the install store is
snapshotting, writing, switching the page, or holds the session's write lock; the install store's
own end-of-leg heartbeat keeps the module an editor across most of a leg, and the mirror's next
heartbeat resumes after it. A mirror heartbeat that fails is dropped and the next one is tried; it
never reaches the install store.

**Only the ZONA.** A TYPE 255 heartbeat is a global broadcast, so on a rig every module turns editor
and reports its LEDs. The mirror reads `LEDPREVIEW` and `MIDI` only from the ZONA's own source
address (the identity the session holds), so a neighbour never paints the plate.

## 6. What the mirror shows, and where

- **The plate**: the ZONA's 81 lights, through the same canvas, painter and colour path the
  simulator uses (`PadCanvas.svelte`, `paint.ts`). The mirror is an engine the simulator host holds
  under the same id; its frame is written as frames arrive and the host repaints at most once per
  paint interval of the shared animation frame (`SimHost.invalidate`) - many LED frames between two
  paints are one paint.
- **The status line** `Mirroring ZONA · page N`, with `· waiting for its lights` until the first
  LED frame and `· no lights reported` if none arrives within 2 seconds, and under it the line
  that says what the mirror cannot show - on the workspace in the row under the plate, where the
  finger's coordinates are while simulating; in the Sandbox under the mode line.
- **The MIDI monitor** beside the plate: the Playground's monitor bar (on every card while
  mirroring, not only the Lua ones) and the Sandbox's Play monitor, both reading the mirror's log,
  their source column / title saying ZONA.
- **Placement.** One outlined toggle, `Mirror ZONA`, on the name row beside the mode switch - the
  row that already says what the plate is doing - on the Playground workspace and in the Sandbox's
  Play (the Sandbox's Edit plate is the editor, not a preview, so the toggle is there only in Play,
  and leaving Play turns the mirror off). It exists only while a ZONA is connected (the session's
  `connected` phase - the capability, never the browser), is `aria-pressed`, and is off on every
  page load. While it is on, the plate takes no finger: the fingers are on the module.

## 7. What it cannot show

- **Where the fingers are.** Section 2. The lights the configuration draws around a finger are on
  the plate; the finger itself is not.
- **The brightness the eye sees.** The records are the frame buffer's values; the physical LEDs'
  current limit and the diffuser are not in them (the simulator's picture has the same limit).
- **A layer's animation between heartbeats** when nothing is running on the module: ten pictures a
  second, not the strip's own refresh.
- **Anything while a write runs**: the mirror is quiet for the leg and the picture holds.

## 8. Unproven on hardware - the bench rows

Built against the firmware and the Editor as read, and against the fake ZONA
(`src/lib/transport/fixtures/synthetic.ts`, `e2e/fake-zona.ts`). The hardware answers are
`docs/HARDWARE-AUDITION.md` rows 48-51 and `docs/INSTALL-RUNBOOK.md` row P: does `LEDPREVIEW`
arrive, and does the picture match the pad; are the touch points really absent from the wire; does
the MIDI echo arrive; and does the module drop back out of editor mode 2 seconds after Mirror goes
off, with page changes working.
