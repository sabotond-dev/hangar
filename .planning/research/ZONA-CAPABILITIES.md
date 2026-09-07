# ZONA capability map

What a ZONA module can actually do, read out of the authoritative sources on this machine, for an
author designing HANGAR catalog configurations.

**Researched:** 2026-09-07
**Scope:** the pad surface, the LED engine, output paths, the Lua surface, the limits, and the things
an author will assume and be wrong about.

---

## 0. Read this before anything else: capability has three tiers, not one

This is the single most important finding in this document, and it is the one an author will get
wrong. "What a ZONA can do" and "what a HANGAR catalog entry may do" are **different questions with
different answers**, because HANGAR's in-browser simulator is strictly narrower than the firmware.

| Tier | What it is | Where it lives | Surface |
|---|---|---|---|
| **T1 Firmware** | What the hardware can do | `grid-fw` @ `dc7d301` | 56 globals + 11 touch accessors |
| **T2 BOTOR compiler + PadSim** | What the vendored shelf compiles and previews | `hangar/src/vendor/botor/{_pad,pad-sim}.ts` | 10 LED calls + 4 out-calls, from a typed `PadState` |
| **T3 HANGAR Lua host** | What hand-authored Lua may call in the browser | `hangar/src/lib/sim/lua-host.ts` | **15 globals + 9 `self:` methods. That is all.** |

A configuration only ships if it renders. **T3 is the real budget of the imagination.** Everything in
Parts 1-6 below is labelled with the tier it applies to.

### The trap, stated plainly

`hangar/src/lib/sim/lua-host.ts:360-412` registers the entire Grid API available to a hand-authored
entry. **`gln`, `gld` and `glx` are not in it.** Nor are `gmss`, `gis`, `gps`, `gwss`, `grnd`, `gpl`,
`gpc`, `gmx`, `gmy`, `print`, or anything else.

The file says why, at `lua-host.ts:353-357`:

> An unlisted call must surface as a Lua "attempt to call a nil value", never as a silent no-op: a
> typo that does nothing is a card that looks subtly wrong forever, and a typo that raises is a card
> that fails its gate.

**Consequence: essentially every recipe in `zona-docs/docs/ZONA_RECIPES.md` and in Part 7 of
`ZONA_REFERENCE.md` will raise on load in HANGAR**, because they are all built on the three-stop
`gln`/`gld`/`glx` idiom — including that document's own "Paste this first" script
(`ZONA_REFERENCE.md:97`). Those recipes are correct for a physical ZONA and unusable as HANGAR
catalog entries without translation to `glc`.

Verified two ways: a `grep -c` for `gln|gld|glx|gmss|gis|gps|gwss|grnd|gpl` in `lua-host.ts` returns
**0**; and none of the seven shipped hand-authored entries (`arc`, `chorus`, `euclid`, `ghost`,
`lattice`, `morph`, `sonar`) contains any of those three names.

### A second, subtler trap

The vendored compiler's trap scanner *does* know `gln`/`gld`/`glx` — `_pad.ts:3513-3524` lists all
ten LED calls including them. So user code calling `gln` **passes `findTraps` cleanly and then raises
at runtime in the simulator.** The static gate and the runtime host disagree about the surface. Do
not treat "the compiler accepted it" as "it will render".

---

## 1. The pad surface

### 1.1 The module, physically

| Property | Value | Source |
|---|---|---|
| Module type | `ZONA` | `grid-protocol@1.20260825.1135`, `ModuleType.ZONA`; no `XY` entry remains |
| Hardware config id | 161 | `ghwcfg()` |
| Elements | **exactly 2**: `touch` at index 0, `system` at index 255 | `grid_module.c:459` `grid_ui_model_init(ui, 2)`; verified via `grid.get_module_element_list(ModuleType.ZONA)` -> `["touch", null x254, "system"]` |
| Other controls | **none.** No buttons, no encoders, no faders, no screen | same |
| LEDs | 81, 9x9 | `grid_module.c:457` `grid_led_init(led, 81, ...)` |
| Touch sensor | Microchip maXTouch MXT144U over I2C | `esp32s3/components/grid_esp32_module_zona/grid_esp32_module_zona.c` |
| Simultaneous contacts | **5** | `grid_ui_touch.c:124` `assert(value.id < 5)` |
| Pressure / area / Z | **none, and it is a hardware configuration fact** | T100 `TCHAUX = 0x00`; `struct touchvalue_t` has no such field |
| Pages | 4 (0..3) | `grid_ui.c:77` `ui->page_count = 4` |

There is **one control element**, so there is **one script budget** — this is why the 908-character
wall bites as hard as it does.

### 1.2 The event vocabulary an author writes against

The touch element has **exactly two events**, and no editor surface can offer a third.

```c
// grid-fw/common/src/c/grid_ui_touch.c:94-96
grid_ui_element_malloc_events(ele, 2);
grid_ui_event_init(ele, 0, GRID_PARAMETER_EVENT_INIT,  ...);
grid_ui_event_init(ele, 1, GRID_PARAMETER_EVENT_TIMER, ...);
```

Confirmed machine-readably: `grid.get_element_events("touch")` returns exactly
`[{desc:"setup", value:0}, {desc:"timer", value:6}]`.

| Slot | Event id | Lua field | Editor tab |
|---|---|---|---|
| Setup | 0 | `ele[0].ini` | Setup |
| Timer | 6 | `ele[0].tim` | Timer |
| **Touch callback** | **not an event** | `self.touch_cb` | **none — you assign it inside Setup** |

**There is no Touch event and no `tc` handler.** `EventType.TOUCH = 9` still exists in the protocol
bundle (verified: `EventType` includes `"TOUCH":"touch"`) but **no element type references it**. It
is dead weight from the pre-release `XY` module. A stray `"event": 9` in a profile loads silently and
does nothing. Everything interactive hangs off `self.touch_cb`, assigned from Setup. That is Intech's
shipped design, not a workaround — the factory script does exactly this.

### 1.3 What a touch reports

```lua
self.touch_cb = function(self, id, evt, x, y) ... end
```

Exactly four arguments after `self`. **There is no fifth** — no pressure, no area, no velocity.
`struct touchvalue_t` has exactly four fields (`grid_ui_touch.h:16-21`) and `events.lua:21` passes
four.

| Arg | Meaning | Range |
|---|---|---|
| `id` | contact slot | 0..4 |
| `evt` | raw maXTouch T100 event nibble | 0..9, see below |
| `x` | X coordinate | 0..127 default, 0..1023 unlocked |
| `y` | Y coordinate | 0..127 default, 0..1023 unlocked |

**Velocity does not exist.** An author wanting note velocity must either use a fixed value (which is
what `PadState.sends.velocity` does — a literal 1..127, and `_pad.ts:293` notes `"From position" has
no measured recipe`) or derive it from movement between samples in Lua.

### 1.4 The event nibble, and the code-9 trap

`evt` is literally `status & 0x0f` from the sensor, passed through untranslated. It is **not a Grid
concept**, which is why it matches nothing in Intech's documentation.

| evt | Meaning | Confidence |
|---|---|---|
| 0 | NONE | INFERRED |
| 1 | MOVE | **VERIFIED on hardware** |
| 2 / 3 | UNSUP / SUP (grip-palm suppression) | INFERRED |
| 4 | DOWN | **VERIFIED on hardware** |
| 5 | UP | **VERIFIED on hardware** |
| 6 / 7 / 8 | combination codes | INFERRED |
| 9 | **DOWNUP — a tap inside one sensor scan** | INFERRED |

The numeric assignment lives in Microchip's NDA-only Object Protocol Guide; no public open-source
driver defines it. The primitive set is confirmed by Microchip's public AN3111.

> **The rule an author must internalise: onset is `e == 4 or e > 8`; an end is `e >= 5`.**

A handler written `if e==4 then noteOn elseif e==5 then noteOff` **leaks a stuck note on every fast
tap**, because code 9 arrives as one message with no separate 5 behind it. The vendored compiler
treats this as a hard trap: `_pad.ts:3595-3597` scans for `e == 5` and raises
`trap-end-of-contact` — *"A fast tap would leave a finger stuck down, because it arrives as one
message with no separate lift."* `_pad.ts:25-27` records that no code path in the compiler emits
`e == 5` at all.

The simulator models this honestly: `pad-sim.ts:238-246` defines `ended(e) = e === 3 || e >= 5` and
`live(e) = e !== 3 && e < 5`. Note `pad-sim.ts:229-231` — **the sim never synthesizes code 9**, so a
tap-handling bug is invisible in the HANGAR preview and appears only on hardware. Author accordingly.

### 1.5 Rate: the number that governs every design

**100 Hz throughout, and Lua pops exactly one sample per cycle for the whole module.**

```lua
-- grid-fw/common/src/lua/events.lua:18-24
if ele[i]:touch_pop() and ele[i].touch_cb then
  ele[i]:touch_cb(ele[i]:tid(), ele[i]:tev(), ele[i]:txv(), ele[i]:tyv())
end
```

The sensor scans at 100 Hz; the UI cycle is gated by `GRID_PARAMETER_UICOOLDOWN_us = 10000`
(`grid_protocol.h:121`, verified at current HEAD). One pop per cycle, across all five contacts
combined:

| Moving contacts | Produced/s | Delivered/s | Effective per-contact rate |
|---|---|---|---|
| 1 | ~100 | ~99 | ~99 Hz |
| 2 | ~200 | ~99 | ~50 Hz each |
| 3 | ~300 | ~99 | ~33 Hz each |
| 5 | ~500 | ~99 | **~20 Hz each** |

A **stationary** contact produces nothing (the delta gate), so a held five-finger chord costs nothing.
Motion is what costs.

The queue is a **10-entry ring** (`grid_ui_touch.c:71`, verified:
`grid_swsr_malloc(&state->swsr, 10 * sizeof(struct touchvalue_t))`), giving ~100 ms of burst
absorption. Overflow is silently discarded.

The gate is not a fixed-phase scheduler — every microsecond `touch_cb` burns is added to the interval
before the next one. **Keep `touch_cb` under ~1000 us.** At 1 ms you already lose ~9 % of samples; at
5 ms you lose a third.

### 1.6 Coordinates, resolution, mirroring

Default range is **0..127** per axis; native raw is **0..1023** (10-bit ADC, T100
`XRANGE = YRANGE = 0x03FF`).

The rescale, verified at current HEAD (`grid_ui_touch.c:110-119`):

```c
new[i] = lerp(min[i], max[i] + 1, new[i] / (double)(1 << state->adc_bit_depth));
new[i] = clampi32(new[i], min[i], max[i]);
if (tmin[i] > tmax[i]) new[i] = mirrori32(new[i], min[i], max[i]);
```

- **Unlock full resolution** with `self:txma(1023) self:tyma(1023)` in Setup. Then change every
  `/127` to `/1023`. It buys the correct *range*, not extra resolution: there are still exactly 1024
  distinct values either way.
- **Do not set `txma(16383)` and call it 14-bit.** `16384 * 1023 / 1024 = 16368`, so the top 15 codes
  are unreachable. Set 0..1023 and scale in Lua: `(v * 16383) // 1023`.
- **Mirroring is free**: min above max mirrors the axis. `self:txmi(127) self:txma(0)` flips X.
- **Min/max accessors are write-only.** `self:txma()` with no argument raises `inaccessible`. Cache
  the value yourself if you need to read it back.
- Element state **resets on every page change** to `0/0/127/127`, so re-assert range in Setup, every
  time.

In HANGAR (T3), `txma`/`tyma` exist both bare and as `self:` methods (`lua-host.ts:398-400`,
`SELF_PRELUDE` at `:145-146`), and the host tracks `coordMax` as 127 or 1023 accordingly.

### 1.7 Orientation — the one place two sources genuinely disagree

**`zona-docs/docs/ZONA_REFERENCE.md:129` says the origin corner is UNKNOWN** and prescribes a
hardware test to settle it:

> **Which physical corner is (0,0): UNKNOWN.** It depends on how the sensor flex and the LED flex are
> mounted and it appears in no source file.

**`_pad.ts:16-23` says it was settled, on hardware:**

> Hardware-verified orientation (settled on a real ZONA): logical (0,0) is the TOP-LEFT LED, +x runs
> right, +y runs DOWN, and `led_address_get(0, x + y*9)` is plain row-major. Touch and LED axes agree.
> No axis flips are needed anywhere.

**`_pad.ts` is authoritative.** It is the later source, it records a measurement rather than an
absence of evidence, and the whole vendored shelf plus HANGAR's golden frames are built on it. The
zona-docs "UNKNOWN" is a stale open question, not a live contradiction. Note that `_pad.ts` carries a
diagnostic code `unmeasured-orientation` (`_pad.ts:3435`) and a `Calib {rot, flipX, flipY}` type, so
per-unit calibration remains representable if a later unit disagrees.

**Rotation does not rotate the axes.** `module_rotation()`/`gmr` returns 0..3, but nothing in the LED
path or the touch path reads it. Rotating a ZONA rotates the editor picture only. Compensate yourself
in Lua if you need it.

---

## 2. The LED engine

### 2.1 The mechanism that makes ZONA worth a catalog

Every LED carries **three independent layers**, and a layer is not a colour — it is a small animation
generator holding its own `color_min`, `color_mid`, `color_max`, a phase byte `pha`, a phase
increment `fre`, a waveform `sha`, and a countdown `timeout`.

Firmware advances that phase **in C, every ~10 ms, with no Lua running**
(`grid_led.c:191-211`, re-verified verbatim at current HEAD `dc7d301`):

```c
void grid_led_tick(struct grid_led_model* led) {
  for (uint8_t j = 0; j < led->led_count; j++) {
    for (uint8_t i = 0; i < GRID_LED_LAYER_COUNT; i++) {
      struct LED_layer* ledbuf = &led->led_smart_buffer[j + (led->led_count * i)];
      if (ledbuf->timeout) {
        ledbuf->pha += ledbuf->fre;
        if (ledbuf->timeout == 1) { ledbuf->fre = 0; }
        --ledbuf->timeout;
      }
    }
  }
}
```

**Arm all 81 once in Setup and the grid animates itself for ~11 minutes at zero Lua cost.** Motion
comes from staggering the *starting phase*: same rate everywhere, different phase per LED. Offset by
`x` for a sideways wave, `x+y` for a diagonal, `math.atan(y-4, x-4)` for a swirl. This is the single
highest impact-per-character mechanism on the module and every good catalog entry uses it.

### 2.2 Layers

```c
#define GRID_LED_LAYER_ALERT 0
#define GRID_LED_LAYER_UI_A  1
#define GRID_LED_LAYER_UI_B  2
#define GRID_LED_LAYER_COUNT 3
```
(verified at `grid_led.h:7-11`, current HEAD)

| Layer | Status |
|---|---|
| 1 (UI_A) | free — conventionally the **touch response** |
| 2 (UI_B) | free — conventionally the **background/look** |
| 0 (ALERT) | **reserved.** Page change, USB connect, watchdog, bank change, transfer, purple "page change disabled" flash |

**Layers ADD.** `grid_led_render_framebuffer_one` accumulates `mix_r += ...` across all three layers
and divides by 512 **once, after** the loop. Not alpha, not max, not last-wins.

On ZONA the alert system touches only the **32 border LEDs**
(`grid_module.c:437-443`, verified: `x == 0 || x == 8 || y == 0 || y == 8`), so the inner 7x7 of
layer 0 is technically free — **do not use it.** An alert will brighten whatever your UI layers show,
because the mix is additive.

Writes to layer index >= 3 are **silently dropped**. `grid_led_reset` zeroes all three layers on every
page change, so Setup must rebuild every stop it needs.

### 2.3 The colour model, exactly

Phase -> intensity through the layer's **shape** (`grid_led.c:419-442`):

| shape | Name | intensity |
|---|---|---|
| 0 | ramp up (**reset default**) | `phase` |
| 1 | ramp down | `255 - phase` |
| 2 | square | `(phase < 128) * 255` |
| 3 | **sine** | `sine_lookup[phase]` |

Intensity -> three weights:

```
p <= 127 :  W_min = 254 - 2p    W_mid = 2p          W_max = 0
p >= 128 :  W_min = 0           W_mid = 510 - 2p    W_max = 2p - 256
```

The weights **always sum to exactly 254**, so there is no brightness dip at the seam and mid peaks at
both 127 and 128.

```
out_c = clamp255( floor( SUM over layers L of
          ( min_c[L]*W_min + mid_c[L]*W_mid + max_c[L]*W_max ) / 512 ) )
```

> **One layer can never exceed 254/512 = 49.6 % of the colour you ask for.**

| What you write | Peak framebuffer value |
|---|---|
| `glx(i,1,64,64,64)` @ phase 255 (factory) | **31** — about 12 % |
| `glx(i,1,255,255,255)` @ phase 255 | 126 |
| same on layers 1 **and** 2 | 253 |
| all three layers | 379, clamped to 255 |

**That is why a stock ZONA looks dim, and it is a design constraint on every HANGAR card: to look
bright, paint the same value on both UI layers.**

Three more facts:
- **No gamma correction anywhere** in the WS2812 path. Ramp phase linearly and it will look badly
  non-linear. Apply your own curve.
- **No master brightness.** Every call is per-LED-and-layer. (`glsb` is the VSN LCD backlight.)
- **Undocumented 6th alpha argument** on `gln`/`gld`/`glx`, clamped 0..1, premultiplying at write
  time. Firmware-only, invisible in the protocol bundle. Not available in T3.

`glc` is the one-call convenience: `min = c/20`, `mid = c/2`, `max = c` (`grid_led.c:298-303`), and a
nonzero 6th argument **forces min to black**. **In HANGAR (T3) `glc` is the only colour call you
have**, so `glc(a, layer, r, g, b, 1)` is the idiom for every card. The vendored compiler already
prefers it: `_pad.ts:985-988` notes it is "29 characters cheaper per loop than separate gln/gld/glx,
so it is used everywhere except drift".

### 2.4 The animation calls

| Short | Human | Signature | Writes |
|---|---|---|---|
| `glt` | `led_timeout` | `glt(led, layer, ticks)` | `timeout`, uint16. **The run switch** |
| `glf` | `led_animation_rate` | `glf(led, layer, rate)` | `fre`, uint8 |
| `gls` | `led_animation_type` | `gls(led, layer, shape)` | `sha`, uint8 |
| `glpfs` | `led_animation_phase_rate_type` | `glpfs(led, layer, phase, rate, shape)` | all three, **exactly 5 args** |
| `glp` | `led_value` | `glp(led, layer, phase)` | `pha` |
| `glag` | `led_address_get` | `glag(element, n)` -> hw index or **nil** | — |

Rules that decide whether a card animates at all:

- **With `timeout == 0` nothing moves.** `glpfs` alone sets phase and shape but the phase does not
  advance. `glt` alone animates nothing either, because the reset default rate is 0. **You need both.**
- Max timeout **65535 ticks ~= 655 s ~= 10 min 55 s**. Larger values truncate mod 65536.
- **Rate is uint8 and wraps mod 256.** `-1` becomes 255 and runs the phase backwards; `-5` becomes 251.
- Cycle time at rate F is `256 / F` ticks: 2.56 s at F=1, 0.64 s at F=4.
- **On the last tick firmware sets `fre = 0` then decrements**, so the animation **freezes at its
  final phase** and **re-arming with `glt` alone will not restart it.** Re-issue `glf` or `glpfs`.
  Re-arming *before* expiry keeps motion continuous.
- Total phase advance over T ticks is exactly `fre * T` (mod 256) — use it to land exactly on 0.
  The `DECAY_TABLE` in `_pad.ts:395-411` is built entirely on this: every `(rate, ticks)` product
  lands in 248..254 so "the fade always ends dark and the one-frame end-of-fade flash is unreachable."

**The self-erasing trail trick**, which is why good ZONA cards need no cleanup pass: if a layer's min
and mid are black and only max is coloured, the layer is dark for every intensity below 129. Set
phase 255 with a negative rate and a matching timeout and firmware fades that one cell to exact black
in C. Multi-touch then works by construction, with no per-contact bookkeeping and no erase pass.

### 2.5 Addressing

`glag` is a bare table read into a lookup allocated once at module init. Verified verbatim at current
HEAD (`grid_module.c:445-458`):

```
 y\x |   0   1   2   3   4   5   6   7   8
  0  |   8   7   6   5   4   3   2   1   0
  1  |   9  10  11  12  13  14  15  16  17
  2  |  26  25  24  23  22  21  20  19  18
  ...
  8  |  80  79  78  77  76  75  74  73  72
```

**`glag(0, x + y*9)` is correct and no row is mirrored.** The serpentine correction lives *inside the
lookup table*; `glag` does nothing but index it. Even rows are mirrored in hardware.

The simulator reimplements both directions (`pad-sim.ts:65-74`):

```ts
export function screenToHw(x, y) { return y * GRID + (y % 2 === 0 ? GRID - 1 - x : x); }
```

- **Element 0 owns all 81 entries.** `glag(1, n)` is nil for every n.
- `glag` returns **nil out of range**, and every LED function starts `if (lua_isnil(L,1)) return 0;`
  — so an out-of-range cell **silently does nothing**. Convenient for edge-clipped brushes, dangerous
  when you have an invisible off-by-one.
- `led_width`/`lwi` returns a **hard-coded literal 9**. Writing `9` costs 1 character; `self:lwi()`
  costs 11.

### 2.6 What the HANGAR simulator faithfully reproduces — and what it does not

`pad-sim.ts` is a deterministic, time-stepped, **firmware-faithful LED model**. `tick()` is exactly
one 10 ms firmware period; there is no `Date.now`, no timers and no DOM in the file.

**Reproduced exactly** (transcribed from `grid_led.c` and pinned by hand-computed test vectors):

| Thing | Where |
|---|---|
| The 256-entry sine lookup, **verbatim** (it is asymmetric — `SINE[0]=128` but `SINE[128]=126`, a 255 plateau at 61..67 — and no closed form reproduces it) | `pad-sim.ts:83-108` |
| The three weight tables as a closed form, all 256 rows enumerated | `pad-sim.ts:111-114` |
| Shape->intensity including the fall-through for unknown shapes | `pad-sim.ts:119-131` |
| `glc`'s stop derivation (`min=c/20, mid=c/2, max=c`, C uint8 truncation) | `pad-sim.ts:135-160` |
| The additive 3-layer sum and the `/512` | render loop |
| The serpentine, both directions | `pad-sim.ts:65-74` |
| uint8/uint16 wrapping, Lua `//` semantics | `pad-sim.ts:162-183` |
| The 10-deep FIFO and per-contact change gate | `pad-sim.ts:257-289` |
| Layer 0 exists and participates in the render sum (never written) | `pad-sim.ts:185-192` |

**NOT reproduced — hard limits on what a card can demonstrate in the browser:**

1. **No Lua VM in `pad-sim.ts` at all.** For `preset`/`state` entries the sim *interprets the typed
   `PadState`*, reproducing the numbers the emitted Lua would leave. Fidelity is held by importing
   every compiler-owned table from `_pad.ts` rather than copying it. For `lua` entries a **separate**
   host (`lua-host.ts`, wasmoon) runs real Lua against the same LED engine.
2. **HID is recorded, never simulated.** `lua-host.ts:407-410` binds `gmms`, `gmbs`, `gks` to
   `recordHid`, and the comment at `:429` is explicit: *"Nothing in HANGAR consumes them."* A mouse or
   keyboard card **cannot be shown working** in the browser.
3. **The trackpad card writes no LEDs at all.** `pad-sim.ts:392-397`: *"Trackpad writes no LEDs at
   all: the frame stays black and the panel keeps static art for that one card. Its mouse output is
   outside this engine's scope."* It is excluded from HANGAR's front-door row for exactly this reason.
4. **The stuck-contact hardware bug is deliberately not reproduced.** `pad-sim.ts:262-268`: the sim's
   gate only advances on a *successful* enqueue, so *"the sim still runs the watchdog semantics, it
   just cannot manufacture the stuck contact."* **A latching bug will look fine in HANGAR and stick on
   hardware.**
5. **Code 9 (DOWNUP) is never synthesized** (`pad-sim.ts:229-231`). Same class of blind spot.
6. **No MIDI input, no `midirx_cb`, no page system, no cross-module, no alerts, no tearing, no
   thermal/core-contention effects.**
7. MIDI **out** is modelled as a typed log only: `SimMidi {ch, cmd, p1, p2, mode}` delivered to an
   `onMidi` sink (`pad-sim.ts:218-224`, `:943-951`).

---

## 3. Output — everything a ZONA can send

### 3.1 The constraint nobody documents: 256 bytes per cycle

`GRID_LUA_STDO_LENGTH = 256` (`grid_lua.h:17`). Every protocol-emitting call appends a text frame to
one buffer, cleared once per 10 ms cycle. An append that does not fit is **refused**, and `midi_send`
writes `#stdoFull` and returns without sending.

| Call | Bytes/frame | Ceiling per cycle |
|---|---|---|
| `gms` MIDI voice | 14 | **~18 messages** |
| `gmss` sysex | 10 + 2n | one call of ~122 data bytes |
| `gks` keyboard | 10 + 4n | ~61 key steps |
| `gmms`/`gmbs`/`ggms`/`ggbs` | 10 | ~25 |
| `print` | variable | competes with all of the above |

Design consequences:
- 7-bit CC: ~18/cycle -> 1800/s.
- 14-bit CC (mode 1, two messages): ~9/cycle.
- NRPN 14-bit (mode 3, four messages): ~4/cycle.
- **A five-finger chord sending 14-bit X and Y per finger costs 20 messages and will not fit in one
  cycle.** Rate-limit in Lua; firmware does not queue.
- **Strip every `print` before storing** — a chatty print starves your MIDI.

### 3.2 MIDI out

**Raw global** — `midi_send(channel, command, parameter1, parameter2)`, exactly 4 args, all truncated
to uint8. **No `-1` handling: passing -1 sends 255.** The USB side composes `byte1 = command | channel`,
so `command` must be a status nibble with the low nibble clear (0x80, 0x90, 0xA0, 0xB0, 0xC0, 0xD0,
0xE0) and `channel` must be 0..15.

**Element wrapper with modes** — `self:gms(channel, command, p1, p2, mode)`:

| mode | Label | Emits |
|---|---|---|
| nil/0 | 7-bit | `gms(ch, cmd, p1, p2)` |
| 1 | **CC 14-bit** | `gms(ch,0xB0,p1,p2//128)` then `gms(ch,0xB0,p1+32,p2%128)` |
| 2 | NRPN | CC99 = `p1//128`, CC98 = `p1%128`, CC6 = `p2` |
| 3 | **NRPN 14-bit** | CC99, CC98, then CC6 = `p2//128`, CC38 = `p2%128` |

Mode 1 uses `p1 + 32` for the LSB, so **`p1` must be 0..31** for a standard 14-bit CC pair.

**Yes to 14-bit CC and NRPN. No to MPE.** There is no MPE support anywhere — no per-note channel
allocator, no pitch-bend-range configuration, no RPN 0 emission. You can hand-roll per-contact channel
assignment (`channel = base + id`) in Lua, which is MPE-*shaped* but is not MPE and will not be
recognised as such without you emitting the configuration messages yourself.

Pitch bend and aftertouch have **no mode** — use the raw global and split yourself:
```lua
local v=x*16383//1023 gms(0,224,v%128,v//128)   -- pitch bend
gms(0,208,y//8,0)                                -- channel aftertouch
```

**Sysex** — `gmss(...)`, 2+ integers, each one payload byte. **You must supply 0xF0 and 0xF7
yourself.** ~122 payload bytes per call, and one such call fills the cycle. **Not available in T3.**

**There is no MIDI stream or running-status variant.** The only MIDI emitters are `gms` and `gmss`.

### 3.3 MIDI in

A ZONA touch element **can** receive MIDI — `_decode_process` loops all elements with **no type
test**. Assign `self.midirx_cb = function(s, header, event)` directly in Setup; `header[1]` is 13 for
host MIDI and 14 for the module's own echo. Siblings: `sysexrx_cb`, `eventrx_cb`, `rtmrx_cb`.

Defaults (set at every VM start) already forward and handle external MIDIVOICE and MIDISYSEX, so
**host MIDI reaches `midirx_cb` with no configuration**. MIDI **clock and transport are off by
default** — enable with `grxm(rx_type.MIDIRTM, rx_feat.FORWARD | rx_feat.HANDLE_EXTERNAL)` and set
`rtmrx_cb`. That is the **only working clock-sync route on ZONA**, because `gts` is dead there.

**`midirx_register`/`gmrr` is broken on a touch element** — it does `event_function_name():sub(1,-2)`
and `EFN` is nil inside `touch_cb`. Assign the field directly.

**Not available in T3.** `grxm` exists in the HANGAR host but only as a recorded no-op shim; there is
no inbound MIDI in the browser.

### 3.4 HID

All globals; **none exists as an element method.**

**Keyboard** — `gks(default_delay_ms, is_modifier, state, keycode, ...)`; one leading delay then any
number of 3-tuples (rejected unless `(nargs-1) % 3 == 0`).

| Field | Values |
|---|---|
| `default_delay` | 0..255 ms between every step |
| `is_modifier` | 0 = ordinary key; 1 = modifier; **15 = this tuple is a delay** (third value = ms, 0..4095) |
| `state` | 0 up, 1 down, **2 = down-then-up** (expanded by firmware) |
| `keycode` | USB HID usage id, 0..255 |

**Mouse** — `gmms(axis, position)` and `gmbs(button, state)`.
- Axis **1 = X, 2 = Y, 3 = scroll wheel** (confirmed both firmware and editor side).
- **Position is a relative delta, not an absolute coordinate**, -128..127.
- **Mouse button is a BITMASK**: 1 Left, 2 Right, 4 Middle. Clamped 1..4, so 3 (left+right) is
  reachable and nothing above 4 is.

**Gamepad** — `ggms(axis, position)` axis 0..5 = X,Y,Z,RX,RY,RZ; `ggbs(button, state)` where button
is a **bit index 0..31** — *unlike the mouse*. That asymmetry is a real trap.

**There is no HID absolute pointer or digitizer.** ZONA cannot present itself as a touchscreen or
tablet to the host.

In T3: `gmms`, `gmbs`, `gks` resolve and are recorded; **`ggms`/`ggbs` are not registered at all** and
will raise. A gamepad card is not currently buildable as a HANGAR Lua entry.

### 3.5 Everything else

| Path | Call | Reality |
|---|---|---|
| **OSC** | via `gps` | **The firmware has no OSC support and no IP stack at all.** OSC is an Electron package (`Greg-Orca/package-osc`, a personal account) that requires Grid Editor *running on a host PC*. Close the Editor and OSC stops. Its shipped default send Lua calls `self:encoder_min()`, which does not exist on Touch, so **as shipped nothing on ZONA ever registers an address**. |
| **WebSocket** | `gwss(...)` | To the Editor's own server, default port 1337. Same Editor dependency. |
| **Package** | `gps(pkgid, ...)` | Editor required. Assembles into `char message[1024]` with `strcat` and **no bounds check** — keep well under 1000 chars. Silently skips nil/functions/tables, shifting every later argument. |
| **Debug** | `print(...)` | Debug Monitor only. Costs the 256-byte buffer. |
| **Cross-module** | `gis(dx, dy, lua)` | **Really executes remote Lua.** Coordinates are offsets relative to the sender; `gis(nil,nil,...)` broadcasts and **the sender executes its own broadcast**. 909-char limit, asynchronous, silently dropped during a page load or store. |

**None of these five exist in T3.** A HANGAR card cannot demonstrate OSC, WebSocket, packages, print,
or cross-module.

### 3.6 Pages

`gpc` (current), `gpn` (next — **a getter, does not change page**), `gpp` (previous — same), `gpl(n)`
(load). **To move, use `gpl(gpn())`.** 4 pages, 0..3.

**A page change destroys the whole Lua VM** — `grid_ui_bulk_page_load` calls `lua_close` then restarts.
Everything goes: globals, `ele`, every `self.<field>`, `touch_cb`, `midirx_cb`; touch min/max snap back
to 0/0/127/127; running timers are cancelled; all 81 LEDs x 3 layers are zeroed. **Setup is the sole
reconstruction point.**

**Not available in T3.** Design HANGAR cards as single-page.

---

## 4. The Lua surface

### 4.1 The interpreter

**Lua 5.5.0** (vendored at `common/dep/lua-5.5.0`). Available: `//`, `& | ~ << >>`, integer/float
subtypes, `goto`, `<const>`, `<close>`, `math.tointeger`, `math.type`, `math.atan(y,x)`.

Three traps:

| Trap | Detail |
|---|---|
| **`global` is a reserved word** in 5.5 | Using it as a name is a syntax error |
| **No `math.pow`, `math.atan2`, `math.log10`, `math.cosh/sinh/tanh`** | Gated behind `LUA_COMPAT_MATHLIB`, which no build defines. Use `x^2` and `math.atan(y,x)` |
| **Numbers are 64-bit ints and doubles** | Full precision at 64-bit-emulation cost on a 32-bit MCU. Prefer integer arithmetic in `touch_cb` |

Libraries: base, `package`, `table`, `string`, `math` (incl. `math.random`), `io`, `os`, `dirent`,
`debug`. **`coroutine` is NOT present** (explicitly commented out) — any "spread this over several
cycles" design must be a hand-rolled state machine on `self.<field>`. **`utf8` is NOT present.**
`print` is Grid's, not Lua's. There is **no sandbox**.

**The float-division trap is the one that silently ruins cards.** Lua 5.5 with `LUA_FLOORN2I=F2Ieq`
turns a fractional argument to a firmware call **silently into 0**. `_pad.ts:28-32` records that no
compiler path emits a bare `/` at all — every division is `//` and every `math.sqrt`/`math.atan`
result is closed with `// 1`. `findTraps` raises `trap-float-division`: *"A fraction reaching the
lights or the MIDI output silently becomes zero on this hardware."*

### 4.2 Scope and the name-collision minefield

Your Setup body compiles as `ele[0].ini = function (self) <your script> end`, so you have:

- **`local`** for anything the callback closes over — becomes an upvalue of `touch_cb`, faster than a
  global lookup, and **cannot collide**.
- **`self.<field>`** for anything the Timer must also read.
- **Never a bare global.**

`_G` at the moment your Setup runs already holds every registered Grid short name plus the runtime
helpers and dispatch machinery. **`gms = 3` kills every MIDI send on the module until the next page
change.**

**This is what `lua_function_forbiddens()` actually is — and the common framing of it is misleading.**
It is *not* a list of calls you may not make. `grid-editor/src/renderer/lib/monaco.ts:492` uses it
under the comment `//FORBIDDEN IDENTIFIERS`, pushing it into the syntax highlighter's `forbiddens`
list. It is the **reserved-identifier list**: names you must not use for your own variables. It has
199 entries and includes every short name (`glag`, `gms`, `glp`, `gtt`, ...), every element accessor
(`tid`, `tev`, `txv`, `tyv`, `lwi`, `txma`, ...), every handler name (`ini`, `tim`, `bc`, `pc`, ...)
and the shim helpers (`glim`, `glut`, `gmaps`, `sgn`, `color_curve`, `midi_auto_ch`, ...).

`lua_function_to_human_map()` has **179 entries** — short-name to human-name for every element type,
not just touch. Only the 11 `GRID_LUA_FNC_T_*` entries apply to ZONA.

### 4.3 The complete touch-element surface (T1)

**Exactly 11 protocol accessors** — `GRID_LUA_FNC_T_LIST_length 11` (`grid_protocol.h:860`, verified
at current HEAD), and confirmed by counting `GRID_LUA_FNC_T_*` in the protocol bundle: **11**.

| idx | short | human | Direction | Notes |
|---|---|---|---|---|
| 0 | `ind` | element_index | read | always 0 |
| 1 | `lix` | led_index | read | returns 0, identical to `ind`. **Useless** |
| 2 | `lwi` | led_width | read | hard-coded literal **9** |
| 3-6 | `txmi` `tymi` `txma` `tyma` | touch min/max | **write only** | defaults 0,0,127,127 |
| 7 | `tid` | touch_id | read | current sample's contact id |
| 8 | `tev` | touch_event | read | current sample's raw nibble |
| 9 | `txv` | touch_x_value | read | current sample's x |
| 10 | `tyv` | touch_y_value | read | current sample's y |

**`touch_area`/`tar`, `tsx` and `tsy` do NOT exist.** They appeared in the old grid-protocol 1.6.9
bundle and in earlier notes. Gone — verified by the list length and by the bundle dump.

Plus on the same metatable: `touch_pop`, `getv`, `setv`, `gtt`, `gtp`, `get`, `gsen`, `ggen`, `type`,
`post_init_cb`, `ini`, `gen`; plus `gms`/`gmrr` from `simplemidi.lua`, `glp`/`glc` from
`simplecolor.lua`, `get_auto_value`/`get_auto_mode` from `autovalue.lua`.

Plain fields you assign: **`touch_cb`** (the whole interaction surface), `midirx_cb`, `sysexrx_cb`,
`eventrx_cb`, `rtmrx_cb`.

**40 element-scoped functions do NOT exist on touch** (`bc`, `bva`, `ec`, `eva`, `pc`, `pva`, `epc`,
`ld`, `map`, ...). Calling one raises `attempt to call a nil value` and **aborts the whole script** —
which for Setup means `touch_cb` is never assigned and **the pad goes completely dead**.

### 4.4 Three helpers that misbehave on a touch element

All follow from `EFN` being nil inside `touch_cb`:

| Helper | What happens |
|---|---|
| `self:gms(ch, cmd, p1, -1)` | `midi_auto_p2` returns 0. **Always pass p2 explicitly** |
| `self:gmrr(-1, ...)` | Lua error from `nil:sub()` |
| `self:glp(-1, v)` | **silent no-op** |

And **`glp(n, layer, -1)` never works on ZONA.** Any phase below 0 takes the "auto" branch, which
treats the first argument as an *element index*. `glag(0, x+y*9)` produces 0..80, and for 2..80
`grid_ui_element_find` returns NULL and it is a **silent no-op with no error at all**. `findTraps`
raises `trap-auto-phase`: *"Automatic phase does nothing on this pad."* **Always pass an explicit
0..255 phase.**

The editor's standard LED action blocks are **near-useless on ZONA**: with the default layer of `-1`
they call `color_auto_layer`, whose table has **no touch key at all**, and a nil layer returns
immediately. With an explicit layer they resolve `glag(self:ind(), 0)` = **hardware index 8, exactly
one cell of 81**. `_pad.ts:3789` codifies this: `PAD_NOOP_SHORTS = ["sglc", "sglp"]` — *"Blocks that
resolve a single LED through the element index and do nothing at all on a 81-cell pad."* And
`PAD_KILLER_SHORTS = ["bmo","emo","epmo","pmo"]` are the four the action picker will happily offer
that **kill the script**.

### 4.5 The HANGAR Lua host (T3) — the authoritative list for a catalog entry

**This is the surface a hand-authored HANGAR configuration may call. Nothing else exists.**

**Globals** (`lua-host.ts:360-412`):

| Call | Signature as bound |
|---|---|
| `glag(slot, n)` | slot ignored; returns clamped hw index |
| `glc(a, l, r, g, b, k)` | the **only** colour call |
| `glp(a, l, p)` | phase |
| `glf(a, l, f)` | rate |
| `gls(a, l, s)` | shape |
| `glt(a, l, t)` | timeout |
| `glpfs(a, l, p, f, s)` | phase+rate+shape |
| `glim(v, lo, hi)` | clamp |
| `gtt(slot, ms)` | timer arm |
| `grxm(slot, mode)` | recorded |
| `txma(v)` / `tyma(v)` | axis max, also bare |
| `gmms(...)` / `gmbs(...)` / `gks(...)` | **recorded, inert** — variadic on purpose |

**`self:` methods** (`SELF_PRELUDE`, `lua-host.ts:141-151`):
`self:gms(ch,cmd,p1,p2,mode)`, `self:grxm(slot,mode)`, `self:txma(v)`, `self:tyma(v)`,
`self:touch_pop()`, `self:tid()`, `self:tev()`, `self:txv()`, `self:tyv()`.

`gms` is bridged under a private name deliberately *"so a bare `gms(...)` still raises — it is only
ever called as `self:gms(...)`."* Note the asymmetry: `gmms`/`gmbs`/`gks` **are** callable bare
(because tpad's Setup does `gmbs(3,0)`), but `gms` is **not**.

**Exists in firmware, unavailable in the HANGAR simulator:**
`gln`, `gld`, `glx`, `glr`, `glg`, `glb`, `glsb`, `gmss`, `ggms`, `ggbs`, `gis`, `gps`, `gwss`,
`print`, `gpc`, `gpn`, `gpp`, `gpl`, `gtp`, `gts`, `get`, `gec`, `ghwcfg`, `ghaslcd`, `gmx`, `gmy`,
`gmr`, `gvmaj`/`gvmin`/`gvpat`, `grnd`, `gsg`, `gsen`, `ggen`, `gens`, `gfls`, `gfcat`, `glut`,
`gmaps`, `sgn`, all calibration calls, all `gui_draw_*`.

`self` is a real table — `self.q`, `self.m`, whatever the config wants — and the host never touches
it. `restart()` restores `_G` to a pristine snapshot and gives a brand-new empty `self`.

**`math.random` note:** the Lua standard library is present in wasmoon, but a card that uses
`math.random` will not be deterministic, and HANGAR pins golden frames. Prefer arithmetic pseudo-noise
keyed on the cell index — which is exactly what the vendored `shimmer` look does, and why `pad-sim.ts`
comments that shimmer's pattern *"is genuinely hardware-keyed and follows the serpentine on screen."*

### 4.6 The `--[[@cb]]` convention

An event's stored config is a concatenation of action blocks, each prefixed `--[[@<short>]] <lua>`.
`--[[@cb]]` means "one Code Block holding raw Lua" — what every hand-written ZONA config should use.
It is a genuine Lua block comment, so the module executes the string unchanged. It costs **9
characters, once per event**, and it is **not worth golfing**: an unknown short silently falls back to
the RAW block.

---

## 5. Limits

### 5.1 The 908-character wall, as the minifier counts it

The firmware constant is **909** (`GRID_PARAMETER_ACTIONSTRING_maxlength 909`, verified at
`grid_protocol.h:127` at current HEAD — note zona-docs cites line 122 at the older sha `485b0d85`; the
value is unchanged). Three gates apply and **the editor is one byte stricter than firmware**:

| Gate | Rule | Ceiling |
|---|---|---|
| Firmware on receipt | `scriptlength <= 909` | 909 |
| Editor on send | rejects if compressed length `>= 909` | **908** |
| Editor code editor | throws if `toLua().length >= 909` | **908** |

**Treat 908 as the budget. It is per event**, and ZONA has two events, so the true ceiling is
908 (Setup) + 908 (Timer).

**How it is counted.** The editor sends `GridScript.compressScript(toLua())`, which is **shortify then
minify** — human API names replaced by firmware short names, then whitespace stripped. **Comments are
NOT stripped.** Measured on the factory script: human-readable 945 -> shortify only 862 -> minify only
715 -> compressed body 632 -> **stored with marker 641**.

Two consequences an author must absorb:
1. **The factory script does not fit in 909 in its human-readable form.** Budget in *compressed*
   bytes.
2. **Identifiers outside the substitution table cost their full length.** `touch_cb` is not in the
   table. Every local and global you invent costs what you type. `self.a` beats `self.anchor`.

HANGAR charges `Math.max(compressed, raw)` (`_pad.ts:3060`, and `lua-entries.spec.ts:230-232` asserts
compressed never exceeds raw for canonical text). Thresholds: `EVENT_BUDGET = 908`,
`BUDGET_WARN = 606`, `BUDGET_ERROR = 890` (`_pad.ts:3037-3039`).

**The knob cross-product rule.** HANGAR gates the budget at **every corner of the knob
cross-product**, not just at defaults (`lua-entries.spec.ts:435-436`). The shipped entries record
their worst corner in a header comment:

| Entry | Worst corner (setup / timer) |
|---|---|
| `ghost` | 308 / 337 |
| `arc` | 382 / 253 |
| `sonar` | 433 / 282 |
| `morph` | 510 |
| `lattice` | 618 / 172 |
| `chorus` | 733 / 174 |

**A knob is not free.** Every value you offer must fit alongside every other knob's most expensive
value. Comments in the Lua are forbidden for the same reason — `findTraps` raises `trap-comment`
because *"a trailing comment was measured surviving verbatim into the budget."*

For the nine ported presets the measured costs are:

| Preset | setup | timer | Free (setup) |
|---|---|---|---|
| starfield | 238 | 55 | 670 |
| aurora | 250 | 55 | 658 |
| pinwheel | 305 | 55 | 603 |
| radar | 438 | 55 | 470 |
| faders | 513 | 24 | 395 |
| joystick | 535 | 24 | 373 |
| ninepads | 580 | 158 | 328 |
| dial | 646 | 55 | 262 |
| **tpad** | **902** | 146 | **6** |

`tpad` is `exclusive: true` and effectively full. It is also the card that writes no LEDs.

### 5.2 Timer resolution and limits

| Human | Short | Form | Args |
|---|---|---|---|
| `timer_start` | `gtt` | `gtt(element, ms)` / `self:gtt(ms)` | exactly 2 |
| `timer_stop` | `gtp` | `gtp(element)` | 1 |
| `timer_source` | `gts` | `gts(element, source)` | **do not use** |
| `event_trigger` | `get` | `get(element, event)` | 2 |

- **Milliseconds, one-shot.** To repeat, **re-arm inside the handler**. `gtt(index, 0)` never fires
  (the guard is `> 0`) and is identical to `gtp`.
- **Firing sets a flag; it does not run the handler.** The 1 kHz tick sets `GRID_EVE_STATE_TRIG`; the
  Lua handler runs on the next 100 Hz UI cycle. **The countdown resolves at 1 ms but execution is
  quantised to ~10 ms**, and later under load. **Do not build 1 ms LFOs.**
- **Trap 1: the handler only exists if a Timer config has been stored.** TIMER is not in the Touch
  `__index` metatable, so with no stored `.cfg` the field is nil and the trigger is silently
  swallowed. The compiled-in default `print("tick")` is **never executed** — it feeds only the
  editor's fetch. Alternative: no element metatable defines `__newindex`, so
  `self.tim = function(s) ... end` inside Setup **rawsets the handler directly** and costs no second
  event.
- **Trap 2: `gts` kills the timer on ZONA.** It moves the element onto a SAMD51-only sync tick that
  nothing on ESP32-S3 drives. Any nonzero source stops the countdown **with no error**.

HANGAR's keeper periods: `KEEPER_PERIOD_SLOW = 300000` ms (5 min) and `KEEPER_PERIOD_FAST = 20` ms
(`_pad.ts:2288-2289`).

### 5.3 The re-arm problem: what happens after 10 min 55 s

`glt` maxes at 65535 ticks ~= **655 s**. When the countdown reaches 1, firmware **sets the rate to 0**
and the animation freezes at whatever phase it reached. **Re-arming with `glt` alone will not restart
it** — you must re-issue `glf` or `glpfs`. Re-arming *before* expiry keeps motion continuous.

Three options, and **there is no fourth — nothing in firmware repeats an LED animation indefinitely
on its own**:

1. **A Timer event** re-arming every 81 LEDs: 63 characters in its own budget. Also restores the
   editor's fast LED preview path. *Recommended.*
2. **`self.tim` rawset from Setup** — ~25 bytes more, but avoids the store-a-Timer-config step.
3. **Re-arm inside `touch_cb`** — ~45 bytes, but **the background then runs only while the pad is
   being used.** Fine for a demo table, not for a shipped profile.

For a HANGAR catalog entry this is not optional: a card whose animation dies after 11 minutes on a
visitor's real hardware is a broken card.

### 5.4 Memory and state

**No Lua heap cap and no custom allocator on ZONA** — stock `realloc`/`free` against ESP-IDF's
**internal SRAM only** (~512 KB, shared with LED buffers, USB, LittleFS). Absolute free bytes are
UNKNOWN — firmware prints it only on its own UART console. `collectgarbage("count")` is the only
honest measure. GC runs `LUA_GCSTEP, 256` once per port-task iteration and after every event cycle.

- **Per-contact state tables are free.** Five records of four fields ~= 850 bytes. **Key your state by
  `id`.**
- **Per-sample allocation is not free.** The factory `touch_cb` builds up to **seven fresh tables per
  call at up to 100 calls/second** — ~700 short-lived tables per second. Do not copy that.
  Preallocate in Setup and mutate, or keep coordinates in plain number locals.

### 5.5 What makes a config expensive

| Cost centre | Detail |
|---|---|
| **Lua time in `touch_cb`** | The dominant cost. Every microsecond directly costs touch samples. Keep under ~1000 us |
| **Per-cycle protocol bytes** | 256-byte buffer; ~18 MIDI messages per 10 ms cycle |
| **Characters** | 908 per event, counted after shortify+minify, comments included |
| **LED writes** | **Cheap and flat.** Writing one LED and writing all 81 cost the same at the output, because the render and DMA transmit are unconditional. Repainting the whole 9x9 every cycle is affordable (INFERRED, unmeasured: 324 C calls well under 1 ms against a 10 ms budget) |
| **Allocation** | Tables per callback, not bytes held |

Cheap wins, measured (`ZONA_REFERENCE.md` 7.7): write `9` not `self:lwi()` (**9 bytes/use**); inline
`glag(0,x+y*9)` rather than a named helper (**46 once + 1/call**); `glpfs` instead of `glp`+`glf`+`gls`
(**14 per LED**); hoist `local h=glag(0,i)` at 2+ uses; one-character locals (**3-5 per occurrence**);
skip `gln` when black is wanted (reset already zeroed it); `//1` instead of `math.tointeger` (**13**);
`x*8//127` instead of `math.floor(x*9/128)` (**11**). And the big one: **let firmware do the
animation** — a Lua fade needs a state table, a decay loop and an erase pass; `glpfs` + `glt` is 33
bytes and runs in C.

### 5.6 Rendering and timing hazards

- **LED refresh is on core 0; Lua is on core 1.** Firmware re-renders all 81 LEDs x 3 layers and DMAs
  the whole 243-byte framebuffer every ~10 ms. No dirty regions, no double buffer.
- **The displayed frame appears 0-10 ms after `touch_cb` writes it**, on a different core. One touch
  sample does not reliably equal one displayed frame.
- **Tearing is possible** — no mutex or double buffer. **Write LEDs in one pass, never
  erase-then-paint.**
- **The editor's LED preview updates at ~3 Hz during a drag** (heartbeat-driven), while the physical
  LEDs update at ~100 Hz. Expect visible lag *in the editor* — and note this is precisely the gap
  HANGAR's simulator exists to close (`pad-sim.ts:13-14`: *"the editor's live LED mirror updates at
  3.3 Hz while firmware animates at 100 Hz; this engine is the only honest preview"*).
- **An infinite loop in `touch_cb` hangs the port task forever.** Task WDT is 10 s with **panic
  disabled**, so there is no reset — the module stops answering USB and recovery is a power cycle.
  **Bound every loop.**

### 5.7 Where errors surface

- **Inside `touch_cb`:** caught by `lua_pcall`, broadcast as a DEBUGTEXT line. The module does not
  crash. But **the failing sample was already popped and is lost**, the rest of the cycle's events
  abort, and at 100 Hz with a finger down you get one line every 10 ms. **No red badge, no toast, no
  inline marker.**
- **In Setup:** worse. `self.touch_cb` never gets assigned and **the pad goes completely dead**.
- Keep the Debug Monitor open the whole time you work on ZONA. It is an optional editor package that
  has to be opened first.

---

## 6. What is NOT possible — the assumptions an author will get wrong

Ordered by how likely an author is to trip on it.

1. **You cannot use `gln`/`gld`/`glx` in a HANGAR catalog entry.** The single highest-frequency
   mistake available, because every published ZONA recipe uses them. **`glc` only.** See section 0.
2. **There is no Touch event.** No `tc`, no `touch_handler`, no third tab. Everything hangs off
   `self.touch_cb` assigned inside Setup. `EventType.TOUCH = 9` exists in the bundle and is dead.
3. **There is no pressure, no Z, no contact area, and no velocity.** Not a missing API — the sensor is
   configured not to send them (`TCHAUX = 0x00`) and `struct touchvalue_t` has no field for them.
   Velocity-sensitive drum pads are not buildable from touch data alone.
4. **Five fingers do not give you five full-rate streams.** One sample per 10 ms cycle for the whole
   module. Five moving contacts is ~20 Hz each with latency pinned near 100 ms.
5. **A dropped release is permanent, and it will stick a note.** `prev_*` advances *before* the
   writability check — verified still present at current HEAD (`grid_ui_touch.c:126-142`). Any
   latching, note-on/note-off or voice-allocation logic can get a permanently stuck contact.
   Mitigate by **releasing on new DOWN for that slot**, plus a slow (>=5 s) Timer watchdog. **The
   HANGAR simulator cannot reproduce this**, so it will look fine in the browser.
6. **A fast tap does not send a separate UP.** Code 9 is one message. `e == 5` alone leaks notes.
7. **A palm produces no callback at all** — `MXT_T100_TYPE_LARGE_TOUCH` is silently dropped, not even
   an UP for the finger it swallowed.
8. **A fraction passed to a firmware call silently becomes 0.** Not an error, not a warning. Every
   division must be `//` and every `math.sqrt`/`math.atan` result closed with `// 1`.
9. **`glp(n, layer, -1)` (auto phase) does nothing on ZONA.** Silently.
10. **A layer with no colour stop renders pure black**, so setting phase on it is a silent no-op. The
    compiler refuses to emit it (`trap-unlit-layer`); a hand author must remember it.
11. **One layer caps at 49.6 % brightness.** A card that looks dim is usually a card using one layer.
12. **`glt` alone does not restart a finished animation** — the rate was zeroed on the last tick.
13. **Nothing repeats an LED animation forever.** Without a re-arm the pad freezes after 10 min 55 s.
14. **Rotation does not rotate the touch or LED axes.** It rotates the editor picture only.
15. **`coroutine` does not exist.** Nor `utf8`. Nor `math.pow`/`math.atan2`.
16. **`gts` (timer_source) silently kills the timer on ZONA.** There is no Grid-SYNC clock on this
    hardware. The only clock-sync route is MIDI RTM via `rtmrx_cb` — and that is not available in the
    HANGAR simulator.
17. **The editor's standard LED action blocks are near-useless on ZONA** — they address one cell of 81
    or no-op entirely. Four action blocks (`bmo`, `emo`, `epmo`, `pmo`) will **kill the script**.
18. **There is no MPE**, no per-note pitch bend infrastructure, no RPN emission. You can hand-roll a
    channel-per-contact scheme; it is not MPE.
19. **There is no HID absolute pointer or digitizer.** Mouse movement is a *relative delta*. ZONA
    cannot be a touchscreen to the host.
20. **Mouse button is a bitmask (1/2/4); gamepad button is a bit index (0..31).** Different
    conventions, same-looking call.
21. **OSC is not a firmware feature.** No IP stack exists. It requires Grid Editor running on a host
    PC with a third-party package, and its shipped default Lua does not work on a touch element at
    all.
22. **`print` costs your MIDI budget.** Strip prints before storing.
23. **A page change destroys the entire Lua VM and blacks every LED.** Setup is the sole
    reconstruction point, and touch min/max reset to 0/0/127/127 every time.
24. **`self:txma()` as a getter raises `inaccessible`.** Min/max are write-only.
25. **HANGAR cannot demonstrate HID, MIDI in, pages, sysex, OSC, WebSocket, packages, or
    cross-module.** A card built around any of them is a card with no preview.

---

## 7. Practical guidance for authoring twenty configurations

### 7.1 Choose the entry kind deliberately

`src/lib/catalog/types.ts:30-33` defines three:

```ts
export type CatalogSource =
  | { kind: "preset"; presetId: string }   // one of the nine vendored shelf cards
  | { kind: "state"; state: PadState }     // arbitrary compiler state
  | { kind: "lua"; setup: string; timer: string };  // hand-authored
```

| Kind | Preview | Best for | Cost |
|---|---|---|---|
| `preset` | `padsim` | Nothing new — all nine are already in the catalog | — |
| **`state`** | `padsim` | **New cards inside the compiler's vocabulary. Cheapest, safest, fully knob-and-stamp integrated, budget computed for you** | Limited to the `PadState` vocabulary |
| **`lua`** | `lua` | **Anything the compiler cannot express** | You own the budget, the traps, and the T3 surface limit |

**Recommendation: reach for `state` first.** The `PadState` vocabulary below is large and every
combination is already firmware-faithful, budget-measured and trap-free by construction. Drop to
`lua` only when the idea genuinely does not fit.

### 7.2 The `PadState` vocabulary (for `kind: "state"` entries)

`_pad.ts:245-356`. Three sheets — **look**, **touch**, **sends** — plus global brightness and calib.

**`look.kind`** (layer 2, armed once, animated in C):
`none | breathe | shimmer | scan | wave | swirl | ripple | drift | showpiece`
with `colour`, `colourB`, `speed` (1-8), `reverse`, `edge` (`soft|hard`),
`axis` (`x|y|diagonal|antidiagonal`), `wavelength`, `arms` (1-3), `spiral`,
`ringsFrom` (`centre|edge`).

**`touch.kind`** (layer 1, painted per sample, self-erasing):
`none | comet | perFinger | bloom | glow | disturb`
with `colour`, `trailMs` (snapped to `DECAY_TABLE`), `brush` (1-2).

**`sends.kind`**: `none | xy | zones | faders | trackpad | dial`
with `grid` (`3x3|4x4|9x9`), `faders` (3-4), `layout`, `baseNote`, `order` (`rows|columns|snake`),
`channel` (1-16), `ccBase`, `velocity`, `phase` (`press|held|release`), `fingers`
(`first|any|each`), `invertX/Y`, `hiRes`, `axes` (`both|x|y`), `spring`+`springTo`,
`bend` (`none|x|y`), `scale` (`chromatic|major|minor|pentatonic`), `toggle`,
`dialMode`+`dialSense`+`dialRadius`, `showGrid`+`gridColour`+`heldColour`, `trackpad`.

**Detent tables — these are the only legal values:**
- `SPEED_TABLE` rates: 1, 2, 3, 4, 6, 8, 12, 16 (cycle = 2560/rate ms).
- `DECAY_TABLE` ms: 210, 230, 250, 280, 310, 360, 420, 500, 630, 840, 1270, 2540.
- `BRIGHTNESS_TABLE`: 15 % Dim, 30 % Low, 50 % Half, 75 % Bright, 100 % Full. **Floor is never 0** —
  "no card can claim a Look while rendering black."
- Wavelength 8..45, **excluding 27/28/29** (they align with the 256/9 = 28.4 row stride and degenerate
  Wave into Scan — "the user would get Scan while the card said Wave").
- Colours are quantised to **RGB444** (4 bits/channel, steps of 17) so the URL stamp round-trips
  exactly.

### 7.3 The layer-plan rules that will silently drop a sheet

`planLayers` (`_pad.ts:901-983`) enforces mutual exclusion. **Know these before designing, or a card
will quietly render less than it claims:**

| Rule | Effect |
|---|---|
| `sends.kind === "trackpad"` | **drops look AND touch** — "uses the whole element on its own" |
| `showGrid` on zones/faders | **drops look AND touch** — "drawn on the pad, which uses both light layers" |
| `look.kind === "showpiece"` | **drops touch** — the two-layer look uses both layers |
| `touch.kind === "disturb"` with no look | **drops touch** — "bending the background needs a background to bend" |
| user owns `touchHandler` | drops touch and sends |
| user owns `layer1` / `layer2` | drops the corresponding sheet |

So: **a visible control and a background are mutually exclusive.** Twenty cards cannot all be
"animated background + drawn zones + touch trail". Plan the mix.

### 7.4 When the budget bites: the fit ladder

`_pad.ts:3966-3987` defines an automatic step-down ladder:
`showpiece -> swirl -> wave -> scan -> shimmer -> breathe`, plus dropping `showGrid`, `hiRes`,
`dialRadius`, then touch, then look. It is **blocked** on two things by design: **Sends never sheds
past fine resolution** ("a fader bank quietly becoming three faders is the silent lie this product
exists to prevent") and **user code is never touched**.

### 7.5 A working hand-authored template

From the shipped `euclid` entry (`src/lib/catalog/entries/euclid.ts`), showing the real T3 idiom —
`glc` with force-min-black, `glag`, `glp`, `glpfs`, `glt`, bare `gtt(0, ms)`, colon-called
`self:gms(...)`, and `@TOKEN` knob substitution:

```lua
--[[@cb]]for a=0,80 do glc(a,1,255,90,0,1)glp(a,1,0)glc(a,2,@RINGC,1)glp(a,2,0)end
self.c={} ... self.touch_cb=function(s,i,e,x,y)if e~=4 and e~=9 then return end ... end gtt(0,@TEMPO)
```

Timer:
```lua
--[[@cb]]gtt(0,@TEMPO)local s=self local k=(s.k or 0)%24 s.k=k+1
for d=1,3 do local t=k%(d*8)local a=glag(0,s.c[d][t])glpfs(a,2,255,250,0)glt(a,2,@TRAIL)
s:gms(@CH,128,@NOTE+d*2,0,0)if s.p[d][t]then s:gms(@CH,144,@NOTE+d*2,100,0)end end
```

Note it re-arms the timer **first**, matching the compiler's own gtt-first bodies, and uses
`e~=4 and e~=9` for onset — the correct code-9-safe form. Knob values are **indices into `values`**,
never the values themselves.

### 7.6 Entries must declare `restsBlack` honestly

`restsBlack` is *"not a preference — a fact about the configuration, asserted against frames.json in
both directions"*. Likewise `PreviewMotion` (`animated | static | dark`) is derived from
`golden-frames.json` and compared. **You cannot claim motion a card does not have.** A card whose only
light is a touch response is `restsBlack: true` and will be a black square on the front door.

---

## 8. Source inventory, currency and conflicts

| Source | Location | State | Authority |
|---|---|---|---|
| **grid-fw** | `../grid-fw` | HEAD `dc7d301`, **2026-08-28** | **Highest.** The hardware truth |
| **grid-protocol** | `hangar/node_modules/@intechstudio/grid-protocol` | `1.20260825.1135`, exact pin | Machine-readable; **generated from grid-fw**, so it can lag |
| **BOTOR** (dir named `grid-editor`) | `../grid-editor` | branch `redesign`, HEAD `a0fb69d5`, **working tree DIRTY** | The compiler + simulator truth |
| **vendored copy** | `hangar/src/vendor/botor/` | `a0fb69d5` | **What HANGAR actually runs** |
| **zona-docs** | `../zona-docs/docs/` | written against grid-fw `485b0d85` (2026-08-25) | Excellent synthesis; **slightly stale** |
| **HANGAR Lua host** | `hangar/src/lib/sim/lua-host.ts` | current | **The binding constraint for `lua` entries** |

### Verification performed

I re-verified the load-bearing firmware claims directly at current HEAD `dc7d301` rather than trusting
zona-docs' citations at `485b0d85`:

- `GRID_PARAMETER_ACTIONSTRING_maxlength 909` — **confirmed**, now at line **127** (zona-docs says 122).
- `GRID_LED_LAYER_*` / `COUNT 3` — confirmed, `grid_led.h:7-11`.
- `GRID_PARAMETER_UICOOLDOWN_us 10000` — confirmed, `grid_protocol.h:121`.
- Touch element = exactly 2 events (INIT, TIMER) — confirmed, `grid_ui_touch.c:94-96`.
- `grid_led_init(led, 81, ...)` + the full serpentine table + `grid_ui_model_init(ui, 2)` — confirmed
  verbatim, `grid_module.c:445-463`.
- `grid_led_tick` — confirmed verbatim.
- `assert(value.id < 5)` at `grid_ui_touch.c:124`; 10-entry ring at `:71` — confirmed.
- **The stuck-contact bug is still present at current HEAD** (`grid_ui_touch.c:126-142`): `prev_*`
  still advances before `grid_swsr_writable`. There is now a `uint8_t diff_res = adc_bit_depth - 7;`
  with a `// TODO write state to be read by event render` — **computed and unused**.
- Event id map `INIT 0 ... TIMER 6 ... COUNT 9` — confirmed, `grid_protocol.h:33-42`, with the source
  comment *"must not change because it would break profiles"*.
- `GRID_LUA_FNC_T_LIST_length 11` — confirmed, `grid_protocol.h:860`.

Machine-readable, from the pinned bundle:
- `ModuleType.ZONA` present; **no `XY` entry**.
- `get_module_element_list(ModuleType.ZONA)` -> index 0 `"touch"`, index 255 `"system"`, 2 total.
- `get_element_events("touch")` -> `[setup(0), timer(6)]` only.
- `lua_function_to_human_map()` -> **179** entries; `GRID_LUA_FNC_T_*` -> exactly **11**.
- `lua_function_forbiddens()` -> **199** entries, used by Monaco as `//FORBIDDEN IDENTIFIERS`.

Vendored-copy fidelity: `_pad.ts`, `pad-sim.ts` and `pad-sim-host.ts` were diffed against the
**committed** sibling blob at `a0fb69d5`. `pad-sim.ts` and `pad-sim-host.ts` are **byte-identical**
after the header strip; `_pad.ts` differs only by the single permitted `RGB` type inline. VENDOR.md's
claim holds.

### Conflicts, and which source wins

1. **Origin corner.** zona-docs says UNKNOWN and prescribes a test; `_pad.ts:16-23` says
   hardware-verified TOP-LEFT, +x right, +y down, plain row-major, touch and LED axes agreeing.
   -> **`_pad.ts` wins.** Later, and it records a measurement.
2. **Line numbers.** zona-docs cites `485b0d85`; the local clone is `dc7d301`. Several line numbers
   have shifted (e.g. the 909 constant, 122 -> 127). -> **The local clone wins; values are unchanged.**
3. **"The full Lua surface."** zona-docs Part 8 enumerates 56 globals — true for **firmware**. It is
   **not** the surface a HANGAR entry may call. -> **`lua-host.ts` wins for HANGAR.**
4. **`lua_function_forbiddens` framing.** It is a reserved-*identifier* list, not a banned-call list.
   -> Confirmed by `monaco.ts:492`.
5. **Editor version.** zona-docs says "Grid Editor v1.7.0"; the local sibling's `package.json` says
   `1.6.8` — because the local `grid-editor` directory **is the BOTOR fork** on branch `redesign`, not
   an Intech release checkout. Not a contradiction, but do not read its version string as Intech's.

### One live caveat the planner should know

**The sibling BOTOR working tree is dirty with unreleased work.** `git status --porcelain` shows
modifications to `_pad.ts`, `pad-sim.ts`, `pad-sim-host.ts`, `PadPanel.svelte`, `pad-editor.store.ts`
and all three test suites, plus untracked `tools/zona-motor-faders.js` and
`tools/ZONA-MOTORFADER-SETUP-README.txt`. The diff adds a **motorised-fader feature** (`MOTOR_TOP`,
`MOTOR_DELAY`, `MOTOR_HOPS`, `MOTOR_LEVELS`, `MOTOR_SPEED`, `MOTOR_EASE`, `MOTOR_LOCK`, a `motor`
field on `sends`, and thumbnail seeding in the host) in which fader levels follow CC the DAW sends
back, "gliding there like a motorised fader".

**It is uncommitted, so it is not in HANGAR and a re-sync at `a0fb69d5` will not pick it up.** Do not
design any of the twenty configurations against motorised faders. If that feature is wanted, it must
first be committed upstream and re-synced per the VENDOR.md procedure.

*(No writing git command was run in any sibling repository; the working trees were inspected read-only
and are unchanged.)*
