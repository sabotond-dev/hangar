# Phase 12: Touch Framework - Research

**Researched:** 2026-09-10
**Domain:** ZONA firmware touch pipeline, the Grid system element on the wire, a Lua library under
the 908 budget, and HANGAR's install / snapshot / Lua-host seams
**Confidence:** HIGH on everything read from `../grid-fw` and the pinned package; MEDIUM on the
maXTouch configuration bytes past the Linux-documented offsets; every hardware claim is UNVERIFIED
until the user's bench says otherwise

<user_constraints>
## User Constraints

**No `12-CONTEXT.md` exists** (`has_context: false`). The constraints below are copied from the
phase brief and from `ROADMAP.md` "Phase 12" and carry the same authority as locked decisions.

### Locked Decisions
- **908 per event, measured with `GridScript.compressScript`, at the RGB444 picker corner.** Eight
  entry headers were found quoting the wrong corner in Phase 11.
- **No new knob and no change to any knob's value count** without stating the shape-character
  consequence - POMODORO's append demoted a captured stamp to `older`.
- **Both Phase 11 gates:** decay lands on phase 0; `e >= 5` needs `and e < 9`; onset is
  `(e==4 or e>8)` with parentheses.
- **`src/vendor/` edits need a declared manifest row**; the compiler's constants may change, **the
  simulator's phase walk may not** (11-CONTEXT D-02).
- **No agent writes to a device. Nothing is hardware-verified without the user's bench.**
- **No Claude/Anthropic attribution anywhere.**
- `../grid-fw` and `../grid-editor` are **read-only siblings**: never write there, never
  `git checkout/restore/stash/clean`.
- The framework is **a library in the system element**, not an idiom-plus-gate (ROADMAP Phase 12).
- The three removals are LATTICE, FORGE and SHUTTLE (catalog 29 -> 26). GHOST and POMODORO are
  confirmed good. SNAKE stays deferred.
- D-20: CLEAR writes the element's firmware `defaultConfig`, RAM only, no confirmation. D-21: the
  line beside CLEAR is `Reset the current page to factory default` (41 characters).

### Claude's Discretion
- The library's function set, names, hysteresis width and per-call shape (this document sketches
  and costs one; the bench answers may move constants).
- Whether the system TIMER event (6 at element 255) is written at all (recommendation below: no).
- The wave order, as long as the blocked/unblocked split below is honoured.

### Deferred Ideas (OUT OF SCOPE)
- SNAKE (deferred by the user, 11-16 A.4).
- Clock sync / inbound MIDI (11-16 A.1; `docs/MIDI-IN-PROBE.md` never run).
- Teaching `touch.ts` to coalesce code 9 (`TOUCH-CODE-9.md`, C.5) - the probe below *measures*
  the firmware's stream; changing the sampler is a fidelity-contract decision for whoever owns it.
- The `_coordMax` two-axis fix (D-11-13-a) unless a plan touches `lua-host.ts` anyway.
</user_constraints>

## Project Constraints (from CLAUDE.md)

- Start every file-changing task through a GSD command (`/gsd:execute-phase`, `/gsd:quick`,
  `/gsd:debug`); no direct repo edits outside a GSD workflow.
- HANGAR ships GPLv3; `@intechstudio/grid-protocol` is pinned **exactly** (`1.20260825.1135`), never
  a caret; `@wasm-fmt/lua_fmt` resolves transitively at 0.2; `wasmoon` is an exact pin and is never
  imported at boot (`src/lib/sim/ready.ts` is the only module that names it).
- `GridScript.compressScript` / `checkSyntax` are unusable until `await initLuaFormatter()`; do not
  await it at app boot, and never `await` it in the same click handler before `requestPort()`.
- Static hosting only; no emojis in UI or documents; feature-detect `"serial" in navigator`.
- Safety: nothing writes without an explicit click, flash writes stay separate from RAM auditions,
  the module's original configuration is always recoverable.

---

## The finding that most changes the plan

**Both probes can be at the bench before a single line of HANGAR changes, and the init order is
already settled from source.** Three facts, each with its line:

1. **System setup runs before touch setup, by construction, in Lua.** `grid-fw/common/src/lua/init.lua:46-50`:
   ```lua
   ele[#ele]:post_init_cb()
   for i = 0, #ele - 1 do
     collectgarbage("collect")
     ele[i]:post_init_cb()
   end
   ```
   and `post_init_cb` is `self:ini()` for every element type (`grid_ui_system.h:24-26`,
   `grid_ui_touch.h:60-62`). On a ZONA `ele` has exactly two entries - touch at 0, system at 1
   (`grid_module.c:455-465`, `grid_ui_model_init(ui, 2)`) - so `ele[#ele]` *is* the system element.
   The C comment at `grid_ui.c:986` describes the clear loop; the load order lives in `init.lua`,
   and it is the same order. **A global defined in system setup is visible to touch setup.** The
   hardware probe below still proves it, because the roadmap asks for that and because a proof on
   the desk costs one paste.
2. **A CONFIG/EXECUTE runs the written body immediately, in the order HANGAR writes**
   (`grid_decode.c:1283-1288`: `grid_ui_register_script` then `grid_ui_process_single`). So at
   install time the init order is **HANGAR's write order**, not the firmware's page-load order.
   Write element 255 event 0 *before* element 0 event 0, or the touch setup that calls the library
   raises `attempt to call a nil value` once, at install, on the desk.
3. **The probes are two paste-able scripts, exactly like `docs/MIDI-IN-PROBE.md`** - installed with
   Grid Editor or BOTOR's shelf, and the brightness probe through HANGAR's own `/dev/install/`
   textareas today. Nothing in either probe waits for the system-element seam. The bench session
   that decides the library's constants can therefore run in parallel with the code that makes
   element 255 reachable, instead of after it.

The second-most consequential finding is in question 5: **ARC's "visual keeps going" and the
sequencers' "still not precise" have one root**, and it is not a simulator bug - it is that a real
finger is never still. The controller reports MOVE on every 8-raw-unit wobble at 100 Hz; a mouse
that has stopped produces nothing. ARC's rate branch re-arms the swirl on the first jitter MOVE
after the stop tap (`arc.ts:212`, `if r~=s.r then ... F(s.f)`), and EUCLID's per-contact dedup
toggles twice when a finger sits on a cell boundary. Hysteresis is the library's first job.

## Summary

The system element is cheap on the wire (one more `CONFIG` event, `ELEMENTNUMBER` `ff`, encodes and
decodes with the pinned package with no change to `encode_packet`) and expensive in HANGAR's seams:
`descriptors.ts` hard-codes `ELEMENT_TOUCH`, the synthetic ZONA keys its RAM by event number only
and echoes `ELEMENT_TOUCH` on every report, the snapshot record is a two-string pair, the install
store classifies "partial" as "Timer landed, Setup did not", and every exact write/fetch count in
`install.spec.ts`, `session.e2e.ts` and `install.e2e.ts` is pinned to two. Every one of those moves.
The Lua host has no notion of a second element; it needs a `system` string run before Setup and on
every `restart()`, and `host-surface.spec.ts` needs to admit the library's globals.

The library itself fits with room: cell hit-test with hysteresis (`Q`, 285), per-axis send-on-change
(`A`, 154), finger-lights-its-cell (`F`, 118) and a phase-0 decay helper (`D`, 68) total **643 of
908** in the system setup, and they use only `glp`, `glag`, `glpfs`, `glt` and `s:gms`, all of which
HANGAR's host already registers. Calling `Q` saves EUCLID 92, STEPS 87 and RADAR POINTS 92 characters
each. The user's own snippet needs `lwi` and `map_saturate` (`gmaps`), neither registered; the sketch
avoids both, so previewability costs no new host global.

**Primary recommendation:** ship `docs/TOUCH-PROBE.md` first (Wave 0, no code), make element 255
reachable in parallel (Wave 1), land the removals and the plain fixes that need no bench (Waves 2-3),
build the host seam and the library skeleton (Wave 4a), and hold the library's constants, the five
re-fits and LUMEN's ramp for the bench answers (Waves 4b, 5).

---

## Question 1 - The system element on the wire and in the firmware

### 1a. Init order (settled from source; probe still specified)

| Path | Order | Evidence |
|---|---|---|
| Page load (power-on, page change, after a flash store) | VM restarted, then `init.lua` loads every `page/element/event.cfg` via `gas`, then **system `post_init_cb` first**, then elements 0.. in ascending order | `grid_ui.c:1072-1078` (`grid_lua_stop_vm` / `start_vm`, then `grid_ui_page_read`); `grid_ui.c:962-975` runs the compiled-in `init.lua`; `init.lua:25-50` |
| Runtime write (CONFIG/EXECUTE) | The written event body runs **immediately**, once, in write order | `grid_decode.c:1283-1288` |
| Event dispatch cycle | Triggered events first (system element first, then 0..), then **one** `touch_pop` per touch element | `grid_ui.c:766-808`; `events.lua:10-23` |

Each event body is wrapped as `ele[N].<fn> = function (self) local _efn = EFN; EFN = "<fn>"; <body>
EFN = _efn end` (`grid_ui.c:370-383`). Two consequences for the library:
- **A `local function` in system setup is invisible to touch setup.** Library functions must be
  plain globals (`function Q(...)`), and their state tables (`H={}`) must be globals too.
- The system element's `self` inside its own setup is `ele[1]`, whose metatable carries only
  `gtt`, `gtp`, `get`, `gsen`, `ggen` and the element index (`grid_ui_system.c:9-15`). **No `lwi`,
  no touch accessors.** A library function that needs the touch element takes it as a parameter
  (`A(s, ...)`), exactly as the entries' own `P(s,c)` helpers do.

### 1b. How HANGAR would write it

**On the wire, nothing new.** `CLASS_CONFIG_ELEMENTNUMBER` is a two-hex-digit field
(`grid_protocol.h:1157-1158`; `dist/index.js:790-791`). Measured with the pinned package:
`encode_packet` with `ELEMENTNUMBER: 255` emits `...00 ff 00...` for page/element/event. Firmware
maps 255 to `element_list_length - 1` on receipt (`grid_decode.c:1254-1256`) and maps it back to 255
on the REPORT (`grid_decode.c:1338`), so a fetch filter naming `ELEMENTNUMBER: 255` matches. The
budget check is the same `scriptlength <= 909` for every element (`grid_decode.c:1269`,
`GRID_PARAMETER_ACTIONSTRING_maxlength 909`); the system events have the same 908.

**In HANGAR, five seams, all mechanical:**

| Seam | Today | Change |
|---|---|---|
| `src/lib/protocol/constants.ts:33-37` | `ELEMENT_TOUCH = 0`, `TOUCH_EVENTS`, `defaultFor(event)` | add `ELEMENT_SYSTEM = 255`, `SYSTEM_EVENTS = grid.get_element_events(ElementType.SYSTEM)`, `defaultFor(element, event)`; export `SYSTEM_DEFAULT_SETUP` (`--[[@cb]]--[[page init]]`, 24, canonical) |
| `src/lib/protocol/descriptors.ts:106-190` | `fetchConfig(sx,sy,page,event)` / `sendConfig(...)` hard-code `ELEMENT_TOUCH` in descr and filter | an `element` parameter defaulting to `ELEMENT_TOUCH`; labels `fetch-${element}-${event}` so the step ids `fetch-setup` / `write-setup` in `sequence.ts` gain a `-sys` sibling |
| `src/lib/transport/sequence.ts:229-305` | `fetchBoth` / `writeBoth`, Timer then Setup, `EventStrings {setup,timer}` | `fetchAll` / `writeAll` over a `ConfigSet {system, setup, timer}`; **order: system setup, touch timer, touch setup** (fact 2 above plus `writeBoth`'s existing Timer-first rule) |
| `src/lib/transport/fixtures/synthetic.ts:187-195, 357-385` | RAM keyed `configs[event]`; report echoes `ELEMENTNUMBER: ELEMENT_TOUCH` | key by `${element}/${event}`; echo the requested element. **Without this every element-255 fetch times out in node and in Playwright** (the filter never matches) and every element-255 write silently overwrites the touch Setup |
| `src/lib/device/install.svelte.ts:1134-1160` | `#classify` reads `partial` as "Timer landed, Setup did not" | classify by the landed step ids over three writes: `system` landed / `timer` landed / `setup` landed; `install-copy.ts` `partialBlock(landed, failed)` takes the names |

**Do not write event 4 (utility).** Its default `gpl(gpn())` is the module's utility button: page
load of the *next* page (`gpn` is `PAGE_NEXT`, `grid_protocol.h:354`; `l_grid_page_load`,
`grid_lua_api.c:1676-1714`). It is the user's physical button, nothing in a configuration needs it,
and a stray write there would change what the button does on their module. Never fetch it either -
HANGAR should not snapshot what it never writes.

**Do not write event 6 (system timer) either.** The library is functions; it needs no timer. Writing
the default `print("tick")` would run it once (fact 2) and cost a protocol-buffer write for nothing.
Three writes per install, not five: **system setup (255/0), touch timer (0/6), touch setup (0/0).**

### 1c. Snapshot, PUT BACK, CLEAR - and whether the library survives a CLEAR

| Action | Today (`install.svelte.ts`) | With the system element |
|---|---|---|
| Snapshot (`#snapshot`, `:590-663`) | `fetchModuleKey`, `fetchBoth` (2 fetches), `canWriteBack` guard, `persistIfAbsent` | 3 fetches; the guard runs over three strings (the system default is non-empty, so a factory module passes); the record gains `system` |
| PUT BACK (`:869-905`) | `#ramLeg` writes the pair; after a keep, `#storeLeg` proves both strings | writes all three in the order above; the store proof compares three |
| CLEAR (`:931-956`) | writes `TOUCH_DEFAULT_SETUP` / `TOUCH_DEFAULT_TIMER` | **decision below** |
| Store proof (`#storeLeg`, `:1003-1055`) | `fetchBoth` x REFETCH_ROUNDS, byte-equal on two | three |

**Does the library survive a CLEAR? Recommend: no - CLEAR writes the system default too.**

| Option | Writes | What it costs | What it buys |
|---|---|---|---|
| **A. CLEAR resets both elements** (touch defaults + `--[[@cb]]--[[page init]]` at 255/0) | 3 | one more ACK per clear; `install.spec.ts:19` and the by-class counts move 2 -> 3; the runbook row C sentence names three | D-21's line stays literally true ("the current page"); a KEEP after a CLEAR stores a page with **no** HANGAR cfg file, because writing an event's own default sets `cfg_default_flag` and `grid_ui_bulk_page_store` then *deletes* `pp/01/00.cfg` (`grid_ui.c:398-409`, `:1126-1134`). Nothing HANGAR wrote is left on the module, in RAM or flash |
| B. CLEAR resets the touch element only | 2 | D-21's copy becomes untrue by one element on a page HANGAR did write; a KEEP after a CLEAR still stores the library to flash | nothing - every install rewrites the library anyway, so nothing depends on its persistence |

The library is inert without a caller, so keeping it has no value and losing it has no cost; the
only thing at stake is whether "factory default" is a true sentence. **A.**

**Snapshot schema.** `snapshot.ts:59-62` is `hangar.snapshot.v1`, `EventPair {setup,timer}`,
validated per entry (`validEntry`, `:154-165`). The header already reserves a `.v2` beside it. A v1
entry taken before this phase has no `system` string; PUT BACK from it should write the **system
default**, not nothing, so the module is left in the state the visitor came in with (a factory
system element - the only kind HANGAR can have met, since nothing before this phase wrote one).
The site has never been public, so as with POMODORO the cost is recorded, not paid.

### 1d. Page scope - confirmed per page

The store path is `%02x/%02x/%02x.cfg` = page / element index / event type (`grid_ui.c:1145`), and
`init.lua:25-44` reads `page/i/` for every element including the system one. The VM is stopped and
restarted on every page load (`grid_ui.c:1072-1074`), so the global table - and therefore the
library - dies with the page and is rebuilt from that page's own system setup. **Per page, not
module-global.** A visitor whose ZONA is on page 2 gets the library on page 2 only, which is exactly
where HANGAR's touch configuration goes (D-10's reported active page).

One live-VM subtlety, harmless but worth writing in the header: **runtime writes do not clear
`_G`.** A TRY ON DEVICE of entry B after entry A leaves A's library globals in the VM until a page
load; since every install rewrites the same library, the only way this shows is if a future library
version *removes* a global. Version the library string; the snapshot/install path never needs to.

### 1e. Nothing models the system element today, and what modelling it costs

`src/lib/sim/lua-host.ts` (`LuaHostOptions`, `:79-93`: `setup`, `timer`), `lua-pad-sim.ts` and the
vendored `pad-sim.ts` know one element. Grep for `255` / `system` in the three files: nothing.

**Cost in the host: two `doString`s and one ordering rule.**
- `install()` (`lua-host.ts:322-365`): run `system` **after** `PRISTINE_SNAPSHOT` and **before**
  `SELF_PRELUDE` and Setup, so the library's globals and state tables (`H`, `P`, `O`) are wiped and
  rebuilt by `restart()` (`:401-420`), whose wipe must then re-run `system` before Setup. Taking the
  snapshot *after* the system setup would make restart leave `H[i]` populated across a card remount.
- The library calls `s:gms` on the touch element; the host's `self` (`SELF_PRELUDE`, `:225-235`)
  already provides it. No new binding.
- `globalKeys()` expectations in `lua-host.spec.ts` move (five new globals).
- `host-surface.spec.ts:368` ("resolves every call site in every hand-authored entry") classifies a
  bare `Q(` as unresolved. Admit a `LIBRARY_GLOBALS` list **derived from the library source**
  (`/\bfunction\s+([A-Z])\s*\(/`) and scan the library itself with the same classifier - it
  resolves today (`glp`, `glag`, `glpfs`, `glt`, `math.abs`, `s:gms`).
- `lua-entries.sweep.spec.ts` gains one constant clause: the library's cost <= 908 and canonical.
- Runtime: one more compiled chunk per card mount, sub-millisecond; no effect on the 100 Hz loop.

---

## Question 2 - Why the simulator is wrong about touch: the frame, read against `touch.ts`

### 2a. The firmware's touch pipeline, stage by stage

1. **Sensor.** An Atmel/Microchip maXTouch mXT144U over I2C, 12 x 12 sense lines
   (`grid_esp32_touch.h:44-46`), configured from `mxt144u_cfg.raw`. Relevant object lines (OBP_RAW,
   `type instance size bytes...`):
   - T7 (power, line 16): `0A 0A 00 43 ...` - idle and active acquisition interval both **10 ms**.
     The pad is scanned at 100 Hz whether or not a finger is down. HIGH (offsets 0-1 are the
     Linux-documented `IDLEACQINT`/`ACTVACQINT`).
   - T100 (multitouch, line 60): `83 C0 00 00 00 00 05 88 00 0C 32 2D 2D FF 03 ... 00 0C 32 32 32 FF 03 ...`.
     CFG1 `0xC0` = INVERTX | INVERTY (Linux `MXT_T100_CFG_INVERTX BIT(7)`, `INVERTY BIT(6)`);
     TCHEVENTCFG (byte 4) `0x00` = every event type reported (zona-docs 4.6, VERIFIED there);
     NUMTCH (byte 6) **5** contacts; XSIZE/YSIZE 12; **XRANGE = YRANGE = 0x03FF = 1023** (bytes 13-14,
     24-25, Linux-documented offsets); XLOCLIP/XHICLIP 45, YLOCLIP/YHICLIP 50 (bytes 11-12, 22-23 -
     MEDIUM: standard T100 layout, not in the Linux driver). Bytes 32 onward carry TCHTHR, TCHHYST,
     TCHDIDOWN/TCHDIUP (detect integration), MOVFILTER, MOVSMOOTH, MOVHYSTI/MOVHYSTN in Microchip's
     NDA-only order - **LOW confidence on any specific value there; the probe measures the effect
     instead of the byte.**
2. **Driver.** `grid_esp32_touch_proc_t100` (`grid_esp32_touch.c:831-868`): `event = status & 0x0F`
   passed **untranslated**; x, y are the controller's 16-bit values; types FINGER, PASSIVE_STYLUS,
   HOVERING_FINGER and GLOVE are forwarded, **LARGE_TOUCH is dropped** (`:863-864`) and every other
   type returns. Messages are read by the main task once per FreeRTOS tick (`grid_esp32s3.c:466-469`,
   `vTaskDelay(1)` at 100 Hz), all pending messages in one read.
3. **Element input.** `grid_ui_touch_store_input` (`grid_ui_touch.c:101-143`):
   `new = lerp(min, max+1, raw / 2^10)` then clamp - with the defaults 0..127 that is
   `floor(raw / 8)`; with `txma(1023)` it is the identity. Mirrored when min > max. Then a
   **per-id change gate on (x, y, event) after scaling** (`:127-131`), then a ring of **10**
   samples shared by all contacts, silently dropping the newest when full (`:137-139`).
4. **Dispatch.** `grid_utask_process_ui` (`grid_esp32_port.c:238-252`) runs
   `grid_ui_process_triggered` at most every `GRID_PARAMETER_UICOOLDOWN_us` = **10 000 us**
   (`grid_protocol.h:121`) when anything is pending (`grid_ui_events_any`, `grid_ui.c:527-550`,
   includes a non-empty touch ring). `_events_process` (`events.lua:10-23`) runs the triggered events
   (Timer) **then pops exactly one touch sample** and calls `touch_cb(tid, tev, txv, tyv)`.
5. **LEDs.** `grid_esp32_utask_led` every 9.5 ms (`grid_esp32s3.c:201-204`): `grid_led_tick`,
   `grid_led_render_framebuffer`, straight into the RMT WS2812 encoder
   (`grid_esp32_led.c:34-52`).

### 2b. Every way the stream differs from `src/lib/sim/touch.ts` and `lua-host.ts`

| # | Firmware | `touch.ts` / `lua-host.ts` | Effect on a configuration |
|---|---|---|---|
| 1 | Event codes are the raw T100 nibble: 1 MOVE, 2 UNSUP, 3 SUP, 4 DOWN, 5 UP, 6 UNSUPSUP, 7 UNSUPUP, 8 DOWNSUP, **9 DOWNUP** (zona-docs 4.6; 1/4/5 verified on hardware) | `touch.ts:27-30` emits **4, 1, 5 only**; `lua-host.touchTap` synthesises 9 for tests | `TOUCH-CODE-9.md`; every class-B fix is invisible in the preview |
| 2 | **A still finger is not still.** Any wobble of >= 8 raw units (1 of 128) at 100 Hz is a MOVE; MOVHYST filtering is whatever the NDA bytes say | A stopped mouse emits nothing; the change gate then drops repeats | ARC's rate branch re-arms on the first jitter MOVE after the stop tap; EUCLID/STEPS/RADAR POINTS toggle twice on a boundary; MORPH's trail cell flickers between neighbours ("random lighting in the centre"); CONSOLE's mute row was measured toggling 210 times in 210 samples unguarded (11-07) |
| 3 | Scan 10 ms; ring read 10 ms; one pop per >= 10 ms | one sample per contact per tick queued, one pop per tick | Same for one finger. Two moving fingers fill the shared ring in ~100 ms on both; both drop the newest sample - including an UP. Modelled |
| 4 | DOWN waits for TCHDIDOWN consecutive detections (value LOW confidence); UP has no integration | DOWN on the first tick | Very short taps vanish or arrive as 9 on the module; never in the preview |
| 5 | Coordinates: 10-bit, `floor(raw/8)` -> 0..127, edges clipped by LOCLIP/HICLIP so the finger reaches 0 and 127 before the physical edge | `mapAxis` = `floor(offset/extent*128)` over the CSS box, edge to edge | Same quantisation; a physical edge is reached earlier on the module. No cell-test consequence |
| 6 | Both axes inverted at the controller (CFG1 0xC0); the Lua sees the module's frame | The preview's orientation was bench-checked by the MORPH/STAGE corner reports in Phase 11 | No new finding; do not re-open |
| 7 | Per-cycle order: **Timer, then touch pop** (`events.lua`) | `tick()` (`lua-host.ts:780-806`): **touch pop, then Timer** | A Timer that reads state `touch_cb` wrote in the same 10 ms sees it one tick later on the module than in the preview. No shipped entry depends on it; a header sentence is enough |
| 8 | LARGE_TOUCH messages are dropped: a finger that grows into a palm loses its UP; SUP (3) exists | Never produced | The compiled watchdog's reason; hand-authored per-contact tables (`s.q[i]`, CHORUS's `s.z[i]`) can leak a contact. The CHORUS re-fit's single-voice shape below removes one such table |
| 9 | Five contacts (NUMTCH 5); ids 0..4 lowest-free | `MAX_CONTACTS = 5`, lowest free slot | Same |
| 10 | The `prev_*` gate persists across contacts of the same id | `gate` map persists until `restart()` | Same |
| 11 | Every CONFIG/EXECUTE paints the whole pad **white for 64 LED ticks** (`grid_alert_all_set(..., WHITE, 64)`, `grid_decode.c:1281`) | Never | Not touch; explains the 0.6 s white flash after TRY ON DEVICE. Put one sentence in the runbook |

**What `touch.ts` gets right, and should keep:** one sample per contact per tick, coalescing
consecutive MOVEs to the newest, UP as the final sample, five slots. Row 2 is the one the library
answers; rows 1 and 4 are what the probe measures.

### 2c. LUMEN: the render path between a written value and a lit LED

Read end to end, nothing between `glc`/`glp` and the wire is unmodelled:

- `grid_led_render_framebuffer_one` (`grid_led.c:408-463`): per layer, `intensity = f(phase, shape)`
  (ramp / inverse / square / `sine_lookup`), then `min_lookup[i] * min + mid_lookup[i] * mid +
  max_lookup[i] * max` summed over the three layers, `/ 2 / 256`, clamp 255 in
  `grid_led_framebuffer_set_color` (`:377-406`). This is exactly `pad-sim.ts:1487-1507` as 11-09.2
  described it: three stops, phase, shape intensity, per-layer weights, the layer sum, the single
  divide by 512.
- **No gamma table, no brightness floor, no global dimmer, no per-colour multiply** anywhere in
  `grid_led.c` or `grid_esp32_led.c`. The 243-byte framebuffer goes to `rmt_transmit` byte for
  byte (`grid_esp32_led.c:43-52`).
- The alert layer (`grid_alert_*`) is the third layer and is zero unless firmware raises it.

**The candidate is physical, not in `grid_led.c`, and it is real: the preview displays the byte as
an sRGB code value; the WS2812 drives it as linear duty.** `paint.ts:66-80` writes `frame[n]`
straight into `ImageData`, so on a monitor byte 27 is about 0.9 % luminance ((27/255)^2.2) and byte
196 about 56 %. On the LED, 27 is **10.6 %** of full output and 196 is 77 %. The human brightness
response is compressive (roughly a 0.33-0.5 power), so 10.6 % duty reads as somewhere near 40-50 %
brightness, and 84 vs 139 (the one-step-from-default change 11-09.2 identified) is 33 % vs 55 %
duty - a difference the eye reads as maybe 15 %. **The preview exaggerates LUMEN's depth; the module
under-reports it.** Both are showing the same bytes. This is consistent with "seems like nothing
changed" twice, and with 11-09.2's arithmetic being right.

**What a probe would show:** four bands at 196 / 139 / 84 / 27 side by side with the 253 reference
row (the brightness probe below). If the user can tell all four apart, the knob is fine and the
complaint was the row-0 anchor (11-09.2 H3); if 84 and 139 merge, no re-cut inside 27..196 will ever
read and the ramp needs a perceptual shape or a true black. Costed for the planner:

| LUMEN route | Setup at picker corner | Bottom row at @DEPTH 1..4 (anchor R) |
|---|---|---|
| today, `d//36` | 746 | 198 / 141 / 85 / 28 |
| 11-09.2's `32/32` | **746** | reaches exact black at 4 |
| **quadratic, `d*d//1296`** | **758** (+12, 150 free) | 154 / 78 / 28 / 3 - perceptually even on linear PWM |

None ships before the bench says which picture is wanted (11-16 A.9 stands).

---

## Question 3 - The library, costed

### 3a. What the user's snippet needs that the host does not have

HANGAR's host registers **16** bare globals (`HOST_GLOBALS`, `lua-host.ts:172-189`: `glag glc glp
glf gls glt glpfs glim gtt grxm txma tyma gmms gmbs gks gmss` - counted, the brief's "15" is one
short) and **9** `self:` methods (`:192-202`). The snippet, translated to the minified vocabulary:

| Snippet | Minified | Registered? |
|---|---|---|
| `self:led_width()` | `self:lwi()` (`grid_protocol.h:825`, returns 9 on ZONA) | **no** - a bare literal `9` is cheaper anyway |
| `map_saturate(...)` | `gmaps(...)` - pure Lua from `common/src/lua/mapsat.lua` | **no** - either inline `glim` arithmetic (used below) or add `gmaps` to the prelude as the 13-line firmware source verbatim |
| `self:midi_send` | `s:gms` | yes |
| `math.abs`, `math.floor` | Lua base | yes (wasmoon) |

**The library sketched below needs no new host global.** If the planner wants `gmaps` for MORPH's
margins, it is a prelude addition of firmware's own Lua, not a binding.

### 3b. The functions (minified, canonical under `compressScript`, syntax-checked in wasmoon)

Every string measured with the pinned `GridScript.compressScript` after `initLuaFormatter()`; each
is already its own fixed point. Globals are single capitals because every call site pays the name
and no firmware Lua global is a single capital (`init.lua`, `events.lua`, `mapsat.lua`,
`simplecolor.lua`, `simplemidi.lua`, `autovalue.lua` checked).

**`Q` - cell hit-test with hysteresis and per-contact dedup (285).** Returns the cell 0..80 when the
contact's cell changed (or on onset), nil otherwise; forgets the contact on an end code. The
hysteresis is +-9 raw units around the previous cell's centre (`(p*128+64)//9`), against a cell half
width of ~7.1 - a finger must travel ~2 units past a boundary to switch, and a 1-unit wobble on the
line never switches. `W` is the one-axis helper.
```lua
H={}function W(v,p)if p then local k=(p*128+64)//9 if v-k<9 and k-v<9 then return p end end return v*9//128 end function Q(i,e,x,y)if e~=1 and e~=4 and e<9 then H[i]=nil return end local h=H[i]local n=W(x,h and h%9)+W(y,h and h//9)*9 if n==h then return end H[i]=e<9 and n return n end
```
Measured in a real Lua VM: a DOWN at x=14 (cell 0), MOVEs 15, 14, 15 -> held in cell 0; 16 -> cell 1;
back to 15, 20, 24, 26 -> held in 1; 30 -> cell 2. The plain `x*9//128` reads 0,1,0,1,1,1,1,1,2 over the
same samples - two spurious toggles.

**`A` - per-axis send-on-change, the user's snippet per contact (154).** Sends CC `c` for x and CC
`d` for `127-y` on channel `h`, each only when that axis moved, on codes < 4 (the snippet's `4 > e`);
a DOWN primes the memory without sending, so a press then a move sends only the moved axis.
```lua
P={}function A(s,i,e,x,y,c,d,h)local p=P[i]or{}if e<4 then if x~=p[1]then s:gms(h,176,c,x,0)end if y~=p[2]then s:gms(h,176,d,127-y,0)end end P[i]={x,y}end
```
Measured: DOWN(10,10) sends nothing; MOVE(11,10) sends CC16=11 only; MOVE(11,12) sends CC17=115 only.

**`F` - the finger lights its cell (118).** Layer `l`, phase 255 on the new cell, 0 on the contact's
previous cell; `n=nil` on lift.
```lua
O={}function F(i,n,l)local o=O[i]if o and o~=n then glp(glag(0,o),l,0)end if n then glp(glag(0,n),l,255)end O[i]=n end
```

**`D` - a decay that lands on phase 0 (68).** `glpfs(a,l,w,250,0)` + `glt(a,l,w//6)`: rate 250 is
-6 on the uint8 ring, so any `w` that is a multiple of 6 reaches 0 exactly (Phase 11 gate 1).
```lua
function D(n,l,w)local a=glag(0,n)glpfs(a,l,w,250,0)glt(a,l,w//6)end
```

**The whole system setup: `--[[@cb]]` + `Q W A F D` = 643 of 908, 265 free.** (`Q` alone without
hysteresis - what 11-08 inlined - is 154; the hysteresis costs 131 and is the reason the library
exists.)

### 3c. What a caller pays, and what each affected entry saves (picker corner, measured)

| Entry | Idiom replaced | Call shape | Setup before -> after | Saved | Free after |
|---|---|---|---|---|---|
| EUCLID | `if e~=1 and e~=4 and e<9 then s.q[i]=nil return end local m=x*9//128+y*9//128*9 if s.q[i]==m then return end s.q[i]=e<9 and m` + `self.q={}` | `local m=Q(i,e,x,y)if not m then return end` | 790 -> **698** | **92** | 210 |
| STEPS | same, with `c`,`r` recomputed from `a` | `local a=Q(i,e,x,y)if not a then return end local c=a%9 local r=a//9` | 479 -> **392** | **87** | 516 |
| RADAR POINTS | same | as EUCLID | 579 -> **487** | **92** | 421 |
| CONSOLE | `if e~=1 and e~=4 and e<9 then return end local c=x*9//128 local r=y*9//128` | `local n=Q(i,e,x,y)if not n then return end local c=n%9 local r=n//9` (mute-row `s.q[i]` stays) | 852* -> **845** | 7 | 63 |
| MORPH | `if i>0 or e==3 or e>=5 and e<9 then return end local c=x*9//128+y*9//128*9` | `if i>0 then return end local c=Q(i,e,x,y)if not c then return end` | 766* -> **757** | 9 | 151 |

`*` after the plain fix in question 5 (CONSOLE +8 interactive-silent; MORPH +56 corners and
margins). A `Q` call costs 41 characters; an `A` call `A(s,i,e,x,y,16,17,@CH)` 22; `F(i,n,1)` 8;
`D(n,2,252)` 10. **Every gate figure above is a defaults-plus-substitution measurement of a re-fit
string built from the shipped source - the planner re-measures after writing the header.**

### 3d. Semantics the bench may move (why 4b waits)

- The hysteresis width (9). If the probe shows wobble larger than 2 raw units under a still
  finger, widen to 10 or 11; if it shows none, 8 is enough and `Q` shrinks.
- Whether `A` should send on the DOWN (the snippet says no; a DAW's MIDI-learn may want the press).
- Whether a coalesced 9 should light a cell at all in `F` (today `Q` returns the cell for a 9 and
  forgets it at once, so a tap lights and never unlights - `F(i,nil,l)` on the caller's end path is
  the caller's job).

---

## Question 4 - The two probes, specified to the tap

Both follow `docs/MIDI-IN-PROBE.md`'s shape: paste-exact, budget-checked, canonical. Recommend a new
`docs/TOUCH-PROBE.md`. **Install route:** Grid Editor or BOTOR's shelf, exactly as MIDI-IN-PROBE
says (the Editor's ZONA layout has a System element slot at `ZONA.svelte:107-116`, `elementNumber
255`; selection of it is by the module's utility button rather than a click, `Device.svelte:377` -
MEDIUM). The brightness probe and the touch half of the touch probe also paste into HANGAR's
`/dev/install/` two textareas today. Once Wave 1 lands, a third textarea there is the sure route for
the system half. **Warn in the doc: do not press the utility button during the session** - its
default reloads the next page and drops the RAM configuration (1b).

### Probe A - touch (system 35 + touch 380 of 908)

System element, event 0:
```lua
--[[@cb]]function K()return 255 end
```
Touch element, event 0 (Timer left at the default; nothing arms it):
```lua
--[[@cb]]for a=0,80 do glc(a,1,255,255,255,1)glp(a,1,0)end self.o={}self.n=0 self.touch_cb=function(s,i,e,x,y)local o=s.o[i]if o then glp(glag(0,o),1,0)end local n=x*9//128+y*9//128*9 if e~=3 and e<5 or e>8 then glp(glag(0,n),1,255)s.o[i]=n else s.o[i]=nil end s.n=(s.n+1)%128 s:gms(i,176,20,x,0)s:gms(i,176,21,y,0)s:gms(i,176,22,e,0)s:gms(i,176,23,s.n,0)end glp(glag(0,80),1,K())
```
What it does: white layer 1, dark; the cell under each finger lights and the previous cell goes
dark; every sample sends four CCs on **channel = contact id** - CC20 = x, CC21 = y, CC22 = event
code, CC23 = a running sample counter; the last statement lights the bottom-right cell only if `K`
exists, i.e. only if the system setup ran first. If the doc's paste route is the Editor, paste the
system script first, then the touch script.

The user taps, with a MIDI monitor open on the ZONA's port (under fifteen minutes):

| Tap | Report back |
|---|---|
| 1. Nothing yet - look at the pad | Is the **bottom-right cell lit** after the paste? (yes = system ran before touch; no = it did not, and the touch script raised at its last line - tapping still works) |
| 2. Rest one finger dead still on the middle of a cell for five seconds | How fast does **CC23 count** while you hold still, and does **CC22 read 1** during it? (0 messages = no jitter; a steady stream = jitter and its rate) |
| 3. Rest a finger on the **line between two cells** for five seconds | Do the two cells **flicker** between each other? How many CC22=1 rows per second? |
| 4. Tap as fast as you can, ten times | Does **CC22 = 9** ever appear? Do some taps produce nothing at all? |
| 5. Press and hold, then lift slowly | CC22 sequence: expected 4, then 1s, then 5 |
| 6. Touch each of the four corners and the centre | CC20/CC21 values at each - expected 0/127 pairs and about 63/63 |
| 7. Five fingers at once | Do rows appear on channels 0..4? |
| 8. Wipe a whole flat palm across the pad, then lift | Does any cell stay lit? (LARGE_TOUCH drops the UP) |

### Probe B - brightness (touch setup 172 of 908, no system script)

```lua
--[[@cb]]local v={196,139,84,27,0,128,64,32,16}for n=0,80 do local a=glag(0,n)local c=n%9 local r=n//9 local d=r==0 and 255 or v[c+1]glc(a,1,d,d*90//255,0,1)glp(a,1,255)end
```
Columns 0-3 are LUMEN's **bottom-row anchor at @DEPTH 1, 2, 3, 4** (196, 139, 84, 27 in the anchor
hue), column 4 dark, columns 5-8 a halving ladder 128 / 64 / 32 / 16; the top row is the row-0
reference (253 emitted) across all nine columns. Nothing to touch.

| Look | Report back |
|---|---|
| 1. Columns 0-3, left to right | How many **distinct** steps do you see: 4, 3, 2, or 1? Which pairs merge? |
| 2. Column 3 (27) against column 4 (dark) | Is 27 clearly lit? |
| 3. Columns 5-8 | Which is the last column you can see at all? |
| 4. Same, with the room lights off | Repeat 1 and 3 |

Answers 1-2 decide LUMEN's ramp (2c); answer 3 decides whether any catalog decay tail below ~32 is
visible on the desk at all, which touches every `D()` caller.

---

## Question 5 - The plain fixes, diagnosed from source, each costed at the picker corner

### ARC - Timer still painting after MIDI stops (+18)

Diagnosis (source, not simulator): the stop tap is `(e==4 or e>8) and cell==40 -> s.s=1-s.s F(0)`
(`arc.ts:212`). The same handler's next line, for every non-end code, runs
`s.d=127-y local r=1+x*31//127 if r~=s.r then s.r=r s.f=glim(r//2,1,120)F(s.f)end`. A real finger
on cell 40 produces MOVEs (2b row 2); if `1+x*31//127` differs from `s.r` - it does whenever the
finger's column is not where the last drag left `s.r` - the swirl rate is re-armed to `s.f` while
`s.s` stays 0. The Timer then advances no phase (`p=(s.h+s.r*s.s)%256`), so the CC is constant -
"MIDI stops reliably" - and the swirl turns at `s.f` - "the visual doesn't". A click in the preview
produces no MOVE, so the preview never shows it.

| Fix | Setup | Delta |
|---|---|---|
| `if s.s>0 then F(s.f)end` inside the rate branch | 523 -> **541** | +18 |
| `if s.s<1 then return end` before the rate branch (a stopped ARC ignores drags entirely) | 523 -> 548 | +25 |

The first keeps `s.d`/`s.r` tracking while stopped so the resume is exact; recommend it. Test: a
DOWN at 40, a MOVE inside cell 40 at a different column, then assert layer 2's rate stays 0.

### CHORUS - one chord at a time, exclusive pads (+22, Timer -44)

Today chords are per contact (`s.z[i]`, `s.t[i]`; `chorus.ts:84-87`), so two fingers hold two
chords. Single-voice shape: `s.z` = the sounding pad, `s.c` = the contact holding it; any contact
landing on a different pad releases the old chord and sounds the new one; an end code from a contact
that is not `s.c` is ignored; the Timer watchdog becomes one counter.
Measured: Setup 771 -> **793** (with the `self.t=0 self.touch_cb` space), Timer 174 -> **130**,
115 free. Removes one per-contact table (2b row 8).

### MORPH - corner zones widened, zero point off the corner (+56, then +47 with `Q`)

`self.k={0,7,63,70}` with `d%2+d//2*9` over `d=0,3` are four 2x2 corner blocks; the bilinear weights
`u*v//127 ...` reach 0 only at the exact opposite corner.
- 3x3 corners: `self.k={0,6,54,60}`, `for d=0,8`, `d%3+d//3*9` (three sites): **+0**, 710.
- Dead margin so a corner region reads a full 127 / 0: `x=glim((x-24)*127//79,0,127)` and the same
  for `y` before the weights (24 raw units, about 1.7 cells, each end): **+56**, 766, 142 free.
- "Random lighting in the centre" is 2b row 2 - the trail cell `c` flickering between neighbours
  under a wobbling finger; `Q` with hysteresis answers it (757 with `Q`, 151 free). That part is
  Wave 4b; the widening is Wave 3.
No knob moves (`@SPREAD`, `@CCB`, `@DECAY`, `@CH`, `@TRAILC` untouched).

### NINE PADS - default 4x4, and why the knob was not found (a tuning-panel finding)

The knob exists (`knobs.preset.ts:456-499`, `gridKnob`, kind `count`, options `9` / `16`, default
index 0). `view.ts:325-370` gives a word row only to `WORD_KINDS` (`direction mode bend spring scale
note`); a `count` knob is a **rail** - `Knob.svelte:310-366`: a two-dot rail over an invisible range
input, with a readout of `9`. Two dots and a number read as an indicator, not a control, and it is
the fifth row of a five-knob rack. That is the finding: **a knob with two integer values has no
visible affordance.**

Two changes, both cheap:
1. Default index 0 -> 1 (`sends.grid = "4x4"` in `presets.ts:264`). Shape character unchanged
   (knob count and option counts unchanged; `shapeOf` sums option counts); every existing NINE PADS
   stamp still decodes `restored` at the index it was minted with; `frames.json` and
   `static/og/ninepads.png` move; the recorded cost `{ setup: 580, timer: 158 }` at `presets.ts:268`
   becomes 550 / 158 (measured: 4x4 compiles smaller); the card's name "Nine pads" and description
   need a sentence.
2. Widget: give a two-valued integer knob a word row (`"9 pads"` / `"16 pads"`) - either admit
   `count` to `WORD_KINDS` with a `wordFor("count", literal)` that suffixes the label, or a general
   rule "<= 2 integer values -> words". `view.spec.ts` and `tune-ui.spec.ts` hold the widget rule;
   PINWHEEL's `arms` (`count`, more values) must stay a rail.

Also record: NINEPADS's fast tap sends nothing (0 / 2, upstream BOTOR, 11-16 D) - a bench tester who
taps quickly sees nothing whichever grid is selected.

### CONSOLE - muted faders interactive but silent (+8), reversing 11-07

11-07 folded `and not s.m[c]` into the fader condition (-6). The reversal: store and repaint but do
not send - `if h~=s.v[c]then s.v[c]=h if not s.m[c]then s:gms(...)end P(s,c)end`. Measured 844 ->
**852**, 56 free; with `Q` 845, 63 free. Both cost either side of 11-07's shape; the user's sentence
("you should be able to change the muted ones only don't send the midi from those") is exactly the
first. The unmute then sends the *changed* level (`m and 0 or s.v[c]*127//7`, unchanged) - state
it in the header. `lua-smoke.spec.ts` test 8 ("leaves a muted CONSOLE column inert") reverses.

### JOYSTICK - a user decision, restated (11-16 C.3)

The `comet` trail is exclusive with the centre dot (`springLed` returns `comet` when `touch.kind`
is `comet`), which would flip `restsBlack` and take JOYSTICK off the front-door row. The four look
layers that keep the dot and animate: **shimmer 603, wave 621, swirl 641, ripple 652** of 908, each
moving JOYSTICK to `animated` and the front door's quiet-pad geometry. Ask, do not choose. Nothing
in the compiled Setup (542) needs the library.

### TRACKPAD - directional rounded edge flash, from scratch (553 with `D`, 603 without)

The compiled trackpad is 901 at the defaults / 907 at worst and `normalisePadState` strips every
look, so the edge flash cannot be a preset tune. A hand-authored single-finger trackpad:
```lua
--[[@cb]]self:txma(1023)self:tyma(1023)for a=0,80 do glc(a,1,@EDGEC,1)glp(a,1,0)end self.touch_cb=function(s,i,e,x,y)if i>0 then return end local c=s.c if e==3 or e>=5 and e<9 then s.c=nil return end if e==4 or e>8 or not c then s.c={x,y}return end local u,v=x-c[1],y-c[2]c[1]=x c[2]=y gmms(1,glim(u//@GAIN,-63,63))gmms(2,glim(v//@GAIN,-63,63))local h=math.abs(u)>math.abs(v)local q=x*9//1024 local r=y*9//1024 for k=-2,2 do local n if h then n=(u>0 and 8 or 0)+glim(r+k,0,8)*9 else n=glim(q+k,0,8)+(v>0 and 8 or 0)*9 end D(n,1,252-math.abs(k)*60)end end
```
Five edge cells on the side the pointer moves toward, centred on the finger's other coordinate,
brightness 252 / 192 / 132 falling off with distance ("rounded"), each landing on phase 0 (`D`).
**553 at `@EDGEC` 255,255,255 and `@GAIN` two digits; 603 with `glpfs`/`glt` inlined** if it must
not depend on the library. What it drops against the compiled one: two-finger scroll, tap-to-click,
the 24-deep drain loop. Both `txma` and `tyma` are unlocked (D-11-13-a's one-axis trap avoided).
It is a **new entry** beside the preset `tpad`, not a replacement, unless the user says otherwise:
a replacement removes a preset and moves the front door.

### The three removals - blast radius by file

Grep facts first: the word "lattice" also names the UI's registration lattice (`app.css`,
`instrument.spec.ts`, `ChosenPanel.svelte`, `+page.svelte`, `aesthetic.e2e.ts`) and "forge" matches
"forget"; none of those are the entry. The entry references:

| File | LATTICE | FORGE | SHUTTLE |
|---|---|---|---|
| `src/lib/catalog/entries/<id>.ts` | delete (245) | delete (361) | delete (460) |
| `src/lib/catalog/index.ts` | `:17`, `:56`, `:78` | `:15`, `:66`, `:88` | 3 lines |
| `src/lib/catalog/front-door.ts` (`EXCLUDED_FROM_ROW`) | `:82` block | `:122` block | `:114` block |
| `src/lib/catalog/listing.ts` | `:284-293` (**featured: true**) | `:403-412`, prose `:469` | `:379-388` |
| `src/lib/catalog/frames.json` | `:421` key | `:741` key | key |
| `src/lib/share/fixtures/wild-stamps.json` | 2 records | 2 records | 2 records |
| `src/lib/sim/lua-smoke.spec.ts` | `:948` sweep helper, `:1874` test | `:833-923` helpers, `:1750` test | `:4044` test (11-12) |
| `src/lib/catalog/touch-guard.spec.ts` | comment `:41` | **`DECLARED_EXCEPTIONS` row `:136`; `.length toBe(2)` at `:520` -> 1** | comment `:63` |
| `src/lib/catalog/decay-idiom.spec.ts` | - | - | comment `:124` |
| `src/lib/tune/colour-picker.spec.ts` | comment `:403` | **list `:583` `["console","forge","strip","wheels"]`** | - |
| `src/lib/catalog/host-surface.spec.ts` | comment `:76` (`pairs` stays - SONAR) | - | - |
| `static/og/<id>.png` | delete | delete | delete |
| `docs/HARDWARE-AUDITION.md`, `docs/TESTING.md` | rows | rows | rows |
| `.planning/REQUIREMENTS.md` CAT-01 dead links | `/c/lattice/` | `/c/forge/` | `/c/shuttle/` |

Count-bearing assertions that go red at 26: `og/build.spec.ts:227` and `e2e/artifacts.e2e.ts:124`
(`>= 27` - re-choose, ideally derived), `sort.spec.ts:81` `RECORDED` (featured drops by one:
LATTICE), `filter.spec.ts:176-178` `RECORDED` (entries 29 -> 26, tags, per-term counts),
`audition.spec.ts:52` `ROW_COUNT 25` -> 22, `lua-entries.sweep` combination totals, `catalog 29`
in `docs/TESTING.md`. `facets.spec.ts`'s `> 20` floor survives.

**The facet arithmetic - this is removals ten, eleven and twelve, and both rules 11-01 warned about
break:**

| Facet term | Now (29) | After (26) | Rule |
|---|---|---|---|
| FOR `keys` | 2 (chorus, lattice) | **1** | **singleton - forbidden** (`facets.spec.ts:231`) |
| FOR `shortcuts` | 3 | 2 | fine |
| FOR `modulation` | 8 | 7 | fine |
| FEELS `still` | 6 | **5** | **below the floor of six** (`facets.spec.ts:185-209`) |
| FEELS `readable` | 11 | 9 | fine |
| FEELS `playable` | 9 | 8 | fine |
| FEELS `expressive` | 12 | 11 | fine |
| FEELS `generative` | 13 | 12 | fine |

D-01's precedent is to retire the thin term and re-home the survivor on a term that describes the
feel, never to weaken the rule. Recommend: retire `keys` (FOR 8 -> 7 terms; CHORUS -> `play`, making
`play` 3), with the `?for=keys` link migration the way 11-01 migrated `drums`; and re-home one
Setup-only entry onto `still` - **LUMEN** (`show, expressive, readable` -> `show, still, readable`:
it paints once and never moves, `expressive` stays at 10) - so `still` holds at 6. Both are
judgements about the cards per CONT-03 and both are a line in `listing.ts` plus the entry file plus
`filter.spec.ts`'s census; `facets.ts`'s header sentence about the tenth removal is rewritten.

---

## Standard Stack

Unchanged from `CLAUDE.md`. Nothing new is installed. Verified at hand: Node v24.14.0, Playwright
1.62.1, wasmoon and `@intechstudio/grid-protocol 1.20260825.1135` in `node_modules`, `../grid-fw` at
`dc7d301` (2026-08-28), the same date as the pin.

| Piece | Use in this phase |
|---|---|
| `@intechstudio/grid-protocol` (pinned) | `ElementType.SYSTEM`, `get_element_events("system")`, `encode_packet` with `ELEMENTNUMBER 255` - all present, measured |
| wasmoon (exact pin) | the library and every re-fit run in the real VM before a header claims a number |
| Vitest `server` / `sweep` projects | every gate below |
| Playwright | the three-write shape on `/dev/install/` and the session counts |

## Don't Hand-Roll

| Problem | Do not build | Use instead | Why |
|---|---|---|---|
| The system default string | a literal `"--[[@cb]]--[[page init]]"` | `grid.get_element_events(ElementType.SYSTEM)[0].defaultConfig` through `defaultFor` | D-20: CLEAR's bytes track firmware through the pin, never a second source |
| Saturating map | a new helper | inline `glim((x-M)*127//(127-2*M),0,127)` or the firmware's own `gmaps` source | one is already in the host, the other is firmware's own Lua |
| A decay pair | new start/rate arithmetic per entry | `D(n,l,w)` with `w` a multiple of 6 | Phase 11 gate 1 by construction |
| Contact dedup | per-entry `s.q[i]` tables | `Q` | the whole reason for the phase |
| Element addressing | a second `fetchConfig` | one function with an `element` argument | one descriptor, one filter, one test |

## Architecture Patterns

### The install shape after this phase
```
ConfigSet { system: string; setup: string; timer: string }
writeAll:  255/0 system  ->  0/6 timer  ->  0/0 setup      (each ACKed, each its own step id)
fetchAll:  255/0        ->  0/0         ->  0/6            (order free; snapshot compares three)
CLEAR:     writeAll({ system: SYSTEM_DEFAULT_SETUP, setup: TOUCH_DEFAULT_SETUP, timer: TOUCH_DEFAULT_TIMER })
```
The tuner (`model.ts:203`, `ConfigStrings`) publishes `system` as a constant beside the two it
measures; the budget meter shows it once, as a fixed line, or not at all - it does not move with a
knob, so it is not a meter.

### The host shape
```
create(): registerGlobals -> PRISTINE_SNAPSHOT -> doString(system) -> SELF_PRELUDE -> timer wrapper -> Setup -> TOUCH_DISPATCH
restart(): RESTART_WIPE -> doString(system) -> SELF_PRELUDE -> Setup -> TOUCH_DISPATCH
```
`LuaHostOptions.system?: string`; `LuaPadSim` / `createEngine` pass the catalog's one library
string for every `lua` entry. Presets never see it.

### Where the library lives
One exported constant, `src/lib/catalog/library.ts` (`TOUCH_LIBRARY`, with the version in a comment
and a `LIBRARY_GLOBALS` list beside it), imported by the host route, the install route, the
host-surface gate and the sweep gate. Not per entry: one string, one cost, one wire shape.

### Anti-patterns
- **`local function` in the system setup** - invisible to touch setup (1a).
- **Writing touch setup before system setup** - raises once on the module (fact 2).
- **Writing events 4 or 6 of element 255** (1b).
- **A snapshot that stores only what it fetched before** - PUT BACK from a v1 record must write the
  system default, not skip the element.
- **Measuring a re-fit at the defaults** - the gate reads the picker corner.

## Runtime State Inventory

This phase changes a stored schema and what a device holds, so the inventory is filled in:

| Category | Items found | Action |
|---|---|---|
| Stored data | `localStorage["hangar.snapshot.v1"]` - `{setup, timer, takenAt}` per module per page, in any browser that has connected (the user's own, at most) | schema `.v2` with `system`; v1 records read as "system = default"; never overwrite (rule 3 stands) |
| Live device state | the user's ZONA: RAM and, after a KEEP, flash `pp/00/00.cfg`, `pp/00/06.cfg`; after this phase possibly `pp/01/00.cfg` | CLEAR + KEEP deletes the system cfg (default flag); the runbook names it |
| OS-registered state | none - verified: no service, no scheduler entries, static site | none |
| Secrets / env vars | none touched | none |
| Build artifacts | `static/og/{lattice,forge,shuttle}.png`, `frames.json` keys, `build/source-<sha>.tar.gz` | regenerate / delete; `artifacts.e2e.ts` reads the current sha |

## Common Pitfalls

### Pitfall 1: The fake ZONA conflates elements
`synthetic.ts` keys RAM by event only and echoes `ELEMENT_TOUCH` on every report. A fetch of 255/0
**times out** (filter mismatch) and a write to 255/0 **overwrites the touch Setup**. Fix the
fixture in the same task as the descriptors, or every install test fails in a way that looks like
the queue.

### Pitfall 2: Exact counts pinned to two
`install.spec.ts:19, :594-602, :710-795`, `session.e2e.ts` (`2 * connects`), `install.e2e.ts:1765`
(`toBe(2)`, already flaky as D-11-08.1-a), `docs/TESTING.md`, the runbooks. Every one moves to three
and D-11-08.1-a's "wait for completion" fix should land with them rather than beside them.

### Pitfall 3: `restart()` leaving library state behind
Snapshot before the system setup (1e), or a remounted card inherits `H[i]` from the last one.

### Pitfall 4: A library name that the surface gate refuses
`host-surface.spec.ts:368` fails the first entry that calls `Q(`. Land the admission list in the same
task as the library.

### Pitfall 5: Reading the probe's silence as "no jitter"
The firmware's change gate (`grid_ui_touch_store_input:127-131`) already drops sub-8-raw-unit
wobble. CC23 not counting means the wobble is under one unit of 128 - that is the *good* answer
and it still does not make a boundary finger safe; probe tap 3 is the one that matters.

### Pitfall 6: A three-write partial
Timer landed, system landed, Setup did not: the module runs the old Setup with the new library -
harmless. System did not land, Setup did: the Setup raised once on the module at its first library
call and installed no `touch_cb`; the pad is dead until PUT BACK. The classifier must name which
of three landed, and the copy must say the pad may be unresponsive.

### Pitfall 7: A page change between snapshot and write
Unchanged rule (Pitfall 4 of 07-RESEARCH) but now with a third string; the page-change re-snapshot
must fetch three.

## Recommended wave order

| Wave | Content | Needs the bench? | Depends on |
|---|---|---|---|
| **0** | `docs/TOUCH-PROBE.md`: probes A and B, paste-exact, budget lines, the tap tables above, the utility-button warning; `HARDWARE-AUDITION.md` gets two rows | is the bench - hand it over first | nothing |
| **1** | Element 255 reachable: constants, descriptors, `fetchAll`/`writeAll`, synthetic fixture keyed by element, snapshot v2, install three-write legs and classifier, CLEAR option A, `/dev/install/` third textarea, `install.spec` / `session.e2e` / `install.e2e` counts (with D-11-08.1-a's wait), runbook rows | no | nothing (parallel with 0) |
| **2** | Removals LATTICE / FORGE / SHUTTLE; facet re-cut (retire `keys`, CHORUS -> `play`, LUMEN -> `still`); count assertions; OG rebuild; dead-link rows | no | nothing |
| **3** | Plain fixes: ARC +18, CHORUS one-voice, MORPH corners + margin, NINE PADS default 16 + two-value word row, CONSOLE interactive-silent, TRACKPAD from scratch (inline `D` until Wave 4a lands, then switch), JOYSTICK put to the user | no | 2 (counts) |
| **4a** | `library.ts` skeleton (Q W A F D as sketched), `LuaHost.system`, `restart()` order, host-surface admission, sweep clause, `lua-smoke` tests for each function in the real VM | no | 1 (the install path writes it) |
| **4b** | Library constants and semantics finalised from probe A; re-fits EUCLID, STEPS, RADAR POINTS, CONSOLE (+Q), MORPH (+Q); headers re-measured at the picker corner; audition rows | **yes - probe A** | 4a, 3 |
| **5** | LUMEN: default index / `32/32` / quadratic, chosen from probe B; `frames.json`, OG, the 11-09.2 test's travel clause | **yes - probe B** | 0 |
| **6** | Gate: counts chain, `docs/TESTING.md`, the bench-note trace for `BENCH-2026-09-10.txt`, deferred items | after 4b and 5 | all |

Waves 1, 2, 3 and 4a are independent of each other and of the bench. If the bench answers arrive
before 4a, nothing changes except that 4b follows at once.

## Validation Architecture

### Test framework
| Property | Value |
|---|---|
| Framework | Vitest 4.1.11, projects `server` (quick) and `sweep`; Playwright 1.62.1 |
| Config | `vite.config.ts:67-120` |
| Quick run | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 84 869` (11-16's gate figures) |
| Full | `npm run test:sweep` (`4 19`), `npm run test:e2e` (105), `npm run check` (582), `npm run lint` |

### Phase behaviour -> test map
| Behaviour | Type | Where | Exists? |
|---|---|---|---|
| `encode_packet` with element 255 round-trips through `decodeFrame` | unit | `descriptors.spec.ts`, `decode.spec.ts` | Wave 1 |
| synthetic ZONA answers 255/0 with the requested element echoed, keeps two RAMs apart | unit | `synthetic.spec.ts` | Wave 1 |
| install writes exactly three `CONFIG/EXECUTE` in the order system, timer, setup; CLEAR writes three defaults; PUT BACK from a v1 record writes the system default | unit | `install.spec.ts`, `snapshot.spec.ts` | Wave 1 |
| a connect issues exactly three fetches and zero writes | e2e | `session.e2e.ts` (with the completion wait) | Wave 1 |
| the library is <= 908, canonical, and every name it defines is admitted by the surface gate | unit | `lua-entries.sweep.spec.ts`, `host-surface.spec.ts` | Wave 4a |
| `Q` holds a boundary finger (the nine-sample sequence above); `A` sends one axis per moved axis; `F` darkens the previous cell; `D` lands on phase 0 | unit, real VM | `lua-smoke.spec.ts` | Wave 4a |
| `restart()` rebuilds `H`, `P`, `O` empty | unit | `lua-host.spec.ts` | Wave 4a |
| ARC: layer-2 rate stays 0 after a stop tap followed by an in-cell MOVE | unit, real VM | `lua-smoke.spec.ts` | Wave 3 |
| CHORUS: a second finger on another pad releases the first chord; the watchdog releases one | unit | `lua-smoke.spec.ts` | Wave 3 |
| CONSOLE: a muted strip stores and repaints, sends nothing, sends the stored level on unmute | unit | `lua-smoke.spec.ts` test 8 reversed | Wave 3 |
| NINE PADS default renders 16 zones; a two-value count knob is a word row | unit | `presets.spec.ts`, `view.spec.ts`, `tune-ui.spec.ts` | Wave 3 |
| facets: zero singletons, FEELS 6..18, 26 entries | unit | `facets.spec.ts`, `filter.spec.ts`, `sort.spec.ts` | Wave 2 |
| the three OG files gone, 26 routed | unit + e2e | `og/build.spec.ts`, `artifacts.e2e.ts` | Wave 2 |
| touch-guard both gates green over the re-fits | unit | `touch-guard.spec.ts`, `decay-idiom.spec.ts` | Wave 4b |

### Sampling
- Per task: `npm run test:quick` against the carried `PREV_FILES` / `PREV_TESTS`.
- Per wave: sweep + check + lint; e2e on Waves 1, 2 and 6.
- Phase gate: full suite green, counts chained by plan as 11-16 did.

### Wave 0 gaps
- `docs/TOUCH-PROBE.md` (no test - a document, budget-checked by `checkSyntax` and
  `compressScript` in the writing task, the way MIDI-IN-PROBE was).
- `src/lib/catalog/library.ts` and its spec do not exist.

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node | everything | yes | v24.14.0 | - |
| `@intechstudio/grid-protocol` | measurements, wire | yes | 1.20260825.1135 (pinned) | - |
| wasmoon | library tests | yes | 1.16.0 | - |
| Playwright | Waves 1, 2, 6 | yes | 1.62.1 | - |
| `../grid-fw` (read-only) | this document's evidence | yes | `dc7d301` 2026-08-28 | - |
| Grid Editor with a ZONA | probe install route | user's bench | 1.7.x | HANGAR `/dev/install/` after Wave 1 |
| A ZONA and a MIDI monitor | probes A and B | **user only** | - | none - the bench is the fallback for nothing |

## Open Questions

1. **Does the Editor let the user reach the System element's Init event on a ZONA by clicking?**
   `Device.svelte:377` makes the 255 activator `pointer-events-none`; selection is by the module's
   utility press (MEDIUM). If that is awkward, the probe doc says so and the HANGAR route (Wave 1's
   third textarea) is the sure one.
2. **T100 threshold / hysteresis / integration bytes.** NDA layout; values LOW. The probe measures
   the behaviour instead; do not cite byte values in a header.
3. **Should `A` send on the DOWN?** The snippet says no. A bench question for the MORPH/WHEELS
   mapping story, not for the library's shape.
4. **TRACKPAD as a new entry or a replacement?** Cost is known both ways; the front-door row and
   `restsBlack` change only for a replacement.
5. **What the visitor sees while the module flashes white after a write** (2b row 11) - a runbook
   sentence, or nothing.

## Sources

### Primary (HIGH)
- `../grid-fw` at `dc7d301`: `common/src/lua/init.lua`, `events.lua`, `mapsat.lua`;
  `common/src/c/grid_ui.c` (370-420, 527-550, 695-808, 962-1078, 1098-1165), `grid_ui_system.{c,h}`,
  `grid_ui_touch.{c,h}`, `grid_decode.c` (1241-1362), `grid_led.c` (191-211, 377-472),
  `grid_lua.c` (292-400), `grid_lua_api.c` (1103-1125, 1676-1714), `grid_module.c` (20-100, 437-465),
  `grid_protocol.h` (121, 127, 272-289, 354, 825, 864-879, 1157-1158);
  `esp32s3/main/grid_esp32s3.c` (201-204, 300-320, 466-478); `esp32s3/components/grid_esp32_touch/`
  (`grid_esp32_touch.c` 55-75, 831-917; `mxt144u_cfg.raw` lines 16, 17, 60),
  `grid_esp32_module_zona/grid_esp32_module_zona.c`, `grid_esp32_led/grid_esp32_led.c`,
  `grid_esp32_port/grid_esp32_port.c` (236-252, 415-430), `grid_esp32_platform.c` (239-247).
- `@intechstudio/grid-protocol@1.20260825.1135`: `ElementType`, `get_element_events("system")`
  (0 / 4 / 6 with defaults of 24 / 19 / 22), `encode_packet` with `ELEMENTNUMBER 255`,
  `GridScript.compressScript` for every number in this document.
- HANGAR: `src/lib/protocol/{constants,descriptors,match}.ts`, `src/lib/transport/sequence.ts`,
  `src/lib/transport/fixtures/synthetic.ts`, `src/lib/device/{install.svelte,snapshot}.ts`,
  `src/lib/sim/{touch,lua-host,lua-pad-sim,paint}.ts`, `src/vendor/botor/{pad-sim,_pad}.ts`,
  `src/lib/catalog/{types,listing,front-door,host-surface.spec,touch-guard.spec}.ts`,
  `src/lib/browse/{facets,facets.spec}.ts`, `src/lib/tune/{view,knobs.preset,model}.ts`,
  `src/lib/ui/Knob.svelte`, `src/routes/dev/install/+page.svelte`, the twenty entry files,
  `docs/MIDI-IN-PROBE.md`.
- Phase records: `ROADMAP.md` Phase 12, `10-CONTEXT.md` D-20/D-21, `11-CONTEXT.md` D-01/D-02,
  `TOUCH-CODE-9.md`, `CANVAS-CONTEXT-LOSS.md`, `11-07`, `11-09.2`, `11-16` summaries,
  `deferred-items.md`, `BENCH-2026-09-10.txt`.
- Linux `drivers/input/touchscreen/atmel_mxt_ts.c` (fetched): T100 offsets CTRL 0, CFG1 1, TCHAUX 3,
  XSIZE 9, XRANGE 13, YSIZE 20, YRANGE 24; CFG1 bits SWITCHXY 5, INVERTY 6, INVERTX 7; the type enum.

### Secondary (MEDIUM)
- `../zona-docs/docs/ZONA_REFERENCE.md` 4.6 (event enum: 1/4/5 verified on hardware, the rest
  inferred; TCHEVENTCFG = 0 verified), Part 10 (known unknowns).
- `../grid-editor/src/renderer/main/grid-layout/grid-modules/devices/ZONA.svelte:107-116`,
  `Device.svelte:377`, `runtime/user-input.store.ts:141` for the Editor's system-element handling.

### Tertiary (LOW)
- T100 byte positions past offset 30 (LOCLIP/HICLIP at 11-12 / 22-23 are the standard layout and
  consistent with the Linux-anchored neighbours; TCHDIDOWN / MOVHYST values are not asserted).
- The perceptual figures in 2c (a power-law brightness response) - a reason to run probe B, not a
  measurement.

## Metadata

**Confidence breakdown**
- System element (wire, order, scope): HIGH - read in C and Lua, encoded with the pin.
- Touch pipeline divergences: HIGH for the firmware side, MEDIUM for the controller configuration.
- Library costs and savings: HIGH - every number is a `compressScript` measurement on the shipped
  source; the semantics are a sketch the bench may move.
- Plain fixes: HIGH for the diagnoses that rest on source (ARC, CHORUS, MORPH, CONSOLE, NINE PADS
  widget), costs measured; JOYSTICK and TRACKPAD are choices for the user.
- Removals: HIGH - counted from the tree; the facet re-homing is a judgement, offered not decided.
- LUMEN: the render path is HIGH (nothing unmodelled); the gamma hypothesis is a candidate until
  probe B.

**Research date:** 2026-09-10. **Valid until:** the next `@intechstudio/grid-protocol` bump or a
`grid-fw` change to `init.lua` / `grid_decode.c`; otherwise 30 days.
