# Phase 8: New Configurations - Research

**Researched:** 2026-09-04
**Domain:** ZONA Lua config authoring (908/908), the compiler/simulator animation gap, catalog gating
**Confidence:** HIGH on budget and behaviour (both measured, in Node, against the pinned protocol and
the vendored simulator). MEDIUM on one hardware-dependent claim (MIDI-IN, candidate 10).

---

## Summary

Three things came out of this that change the shape of the phase.

**First: the Timer event is 90% empty on every shipped card, and that is where the new
configurations live.** BOTOR's nine presets spend 238-902 characters of Setup and only 24-158 of
Timer. Nothing on the shelf uses the Timer for anything but a keeper or a watchdog. A stored Timer
that re-arms itself as its first statement is a free 100-a-second scheduler with ~750 unused
characters, and it is the difference between "a pretty background you can touch" and a step
sequencer, a Euclidean drum machine, a drawable LFO, a gesture looper and a radial sequencer. Ten
candidates were authored, all ten fit, all ten were run.

**Second: PREV-02 - "the simulator consumes the exact compiler output" - is currently satisfied by
a coincidence that new configurations break.** `PadSim` runs no Lua. It is a TypeScript
transcription of what the compiler *would* emit, driven from a `PadState`. So a configuration that
is not expressible as a `PadState` cannot animate on a card, and every genuinely new idea in this
phase is exactly that. The measured answer is a Lua VM: **wasmoon (Lua 5.4, WASM, MIT, 271 KB / 95 KB
brotli) driving `PadSim`'s own LED engine through its already-public `pokeLayer`/`layer`/`tick`/
`frame` hooks, with no edit to any vendored file.** This was not estimated. It was built in the
scratchpad and cross-checked: running BOTOR's own emitted Setup Lua for all nine presets through
wasmoon reproduces `PadSim`'s 243 layer records exactly, and the rendered frames hash-match
`golden-frames.json` at all five sampled ticks for all nine presets. Route 1c makes PREV-02
*literally* true for the first time.

**Third: the budget harness works and every number below is measured, not estimated.**
`GridScript.compressScript` = `shortify` (substitute known Grid function names from the protocol's
192-entry lookup) then `minifyLua` (the WASM StyLua pass: collapse whitespace, drop the space in
`]then` / `]and` / `if(`). It does **not** strip comments - a trailing comment survives and adds two
newlines on top of its own length. `checkSyntax` is `beautifyLua` in a try/catch, so it silently
returns `false` before `initLuaFormatter()` resolves; FOUND-05's gate already covers this.

**Primary recommendation:** take route **1c**, seeded by a Wave 0 that proves the Lua host against
the nine presets before a single new config is authored; ship 6 of the 10 candidates below
(recommended six: EUCLID, ARC, GHOST, MORPH, CHORUS, LATTICE); keep hand-authored Lua in a
HANGAR-owned `src/lib/catalog/` beside the compiler-driven entries, gated by one Vitest spec that
asserts canonical form, syntax, budget and a golden frame per entry.

---

## Project Constraints (from CLAUDE.md)

| Directive | Consequence for this phase |
|---|---|
| GSD workflow enforcement - no direct repo edits outside a GSD command | Every file this phase adds lands through `/gsd:execute-phase`. |
| `@intechstudio/grid-protocol` pinned exactly (`1.20260825.1135`), no caret; a bump is a test-gated change | The measured character costs below are only valid at this pin. The catalog gate must run against the pinned minifier, and a protocol bump must re-measure every catalog entry, not just the nine presets. |
| Exact pin because the datestamp version is not semver and a silent bump moves the fit ladder | Same rule applies to hand-authored entries: their 908 headroom is a measured property of this minifier version. |
| Do not `await initLuaFormatter()` at boot; lazy on first tune/install, prefetch on idle or hover | A second lazy WASM chunk (wasmoon) follows the same rule - see Bundle budget below. |
| Never re-order a stamp payload enum; append only | Relevant if route 1b is ever taken: `LOOK_KINDS` has 7 free slots in its 4-bit field, `SEND_KINDS` has 2 free in its 3-bit field. |
| Vitest 4.1.11, node environment, no config beyond the project split | The catalog gate belongs in the existing `server` project, not the `sweep` project. |
| `optimizeDeps.exclude` on grid-protocol is the proven Vite incantation | wasmoon ships its own `.wasm`; expect the same class of asset-resolution question and test it against the production build, exactly as FOUND-05 did. |

Two HANGAR decisions constrain this phase harder than anything in CLAUDE.md:

- **D-04 - vendored files are import-paths-only.** `src/lib/fidelity/vendored-diff.spec.ts` asserts
  byte-identity of all six vendored files against `upstream-manifest.json` once five recorded
  deltas are inverted. Nothing in this phase may edit `_pad.ts` or `pad-sim.ts`. Everything below
  is designed around that, and route 1c needs no exception because `pokeLayer` and `layer` are
  already public.
- **D-08 - a fidelity bug is a BOTOR bug, fixed upstream and re-synced.** This is what prices
  route 1b (below).

---

## Phase Requirements

| ID | Description | Research support |
|---|---|---|
| CONT-02 | At least six new configurations authored for spectacle are in the catalog, each fitting the 908/908 budget at its default knob positions and verified in the simulator | Ten candidates, all measured under budget with 178-603 characters of Setup headroom and 577-908 of Timer headroom, all `checkSyntax` true, all executed. "Verified in the simulator" is the load-bearing clause - see the Animation Gap. |
| PREV-01 / PREV-02 | Every card animates live in the firmware-faithful simulator, consuming the exact compiler output - no hand-authored animation anywhere | The Lua-VM route satisfies PREV-02 more strictly than today's `PadState` route, and the nine-preset cross-check is the evidence. A hand-authored config previewed by a hand-drawn animation would violate PREV-02 outright; that option is off the table. |
| PREV-06 | Simulated output pinned against an independently derived oracle | Unaffected and reused: the Lua route drives the *same* engine `firmware-oracle.spec.ts` pins, so the oracle keeps covering it for free. |
| CONT-03 | Name, one-line description, feel-based tags, Featured flag, default knob state | Supplied per candidate below. |
| TUNE-01..05 | 3-6 knobs, live recompile, two 908 meters, fit-ladder honesty, over-budget back-off | Knobs listed per candidate. Hand-authored entries need a knob mechanism the compiler does not provide - see "Knobs on hand-authored Lua". |
| CAT-04 | Static data file of Profile-Cloud-shaped config objects, no backend | Catalog shape below. |

---

## The animation gap, precisely

### What the vendored compiler can express today

`PadState` (`_pad.ts:245`) is three sheets plus a global brightness detent.

| Sheet | Field | Reachable values |
|---|---|---|
| **look** | `kind` | `none`, `breathe`, `shimmer`, `scan`, `wave`, `swirl`, `ripple`, `drift`, `showpiece` |
| | `colour`, `colourB` | quantised RGB |
| | `speed` | 1..8 detent into `SPEED_TABLE` -> `fre` |
| | `reverse` | `256 - rate` |
| | `edge` | `soft` / `hard` (`gld(a,2,0,0,0)`, +14 chars) |
| | `axis` | x / y / diagonal / antidiagonal (scan, wave) |
| | `wavelength` | 8..45, snapped, excluding 27-29 |
| | `arms`, `spiral` | 1/2/3 arms (phase x41/82/123), `+ n%9*8` drag |
| | `ringsFrom` | centre / edge (rate sign, ripple) |
| **touch** | `kind` | `none`, `comet`, `perFinger`, `bloom`, `glow`, `disturb` |
| | `colour`, `trailMs` (`DECAY_TABLE`), `brush` (1 or 2 cells) | |
| **sends** | `kind` | `none`, `xy`, `zones`, `faders`, `trackpad`, `dial` |
| | | grid 3x3/4x4/9x9, faders 3/4, layout blocks/rails, baseNote, order, channel, ccBase, velocity, phase press/held/release, fingers first/any/each, invertX/Y, hiRes, axes both/x/y, spring + springTo, bend none/x/y, scale chromatic/major/minor/pentatonic, toggle latch, dialMode/dialSense/dialRadius, showGrid + gridColour + heldColour, the seven trackpad tunables |

Its Timer emitter produces exactly three things: nothing, the slow keeper (`gtt(0,3e5)` + `glt(...,65535)`),
or the zones watchdog at 20 ms - plus the trackpad's own hand-carried recipe. There is **no
vocabulary at all** for a Timer that sequences, counts, oscillates, records or scans.

### What `PadSim` can animate

`pad-sim.ts:9` says it plainly: *"No Lua VM runs here."* It takes a `PadState`, calls `armLook`,
`armTouchInit`, `armSendsPicture` at construction, and re-implements each compiled handler
(`xyBody`, `zonesBody`, `fadersBody`, `dialBody`, `touchPaint`, `runTimerBody`) in TypeScript. So
**the simulator's expressive range is exactly the compiler's, by construction.** Anything outside
`PadState` is invisible on a card.

### The three routes

#### 1a - new `PadState` combinations

**What is reachable:** roughly 9 x 6 x 6 kind combinations, times colour/speed/axis/wavelength/arms/
scale/layout. The pad-invariants sweep already walks 4,860 labelled states, so this space is
mapped and known-good.

**How spectacular can it get:** as spectacular as the nine presets, and no more. Everything here is
a recolour or a re-pairing of shipped ideas - "ripple + perFinger + zones on 4x4", "drift + bloom +
faders". Those are *variants*, and the roadmap already calls the nine "the port of BOTOR's shelf".

**Verdict:** 1a can produce six catalog *entries* in about a day and satisfies the literal words of
CONT-02. It cannot produce six configurations *authored for spectacle*, and the phase goal says the
catalog "stops being a port of BOTOR's shelf and becomes HANGAR's own". Not one of the ten
candidates below is reachable this way. **Use 1a only as the fallback if 1c fails.**

#### 1b - author new looks and sends upstream in BOTOR, then re-sync

**Cost, measured by counting the sites one existing feature touches.** `ripple` appears at 8 places
in `_pad.ts` (the `LookKind` union, `LOOK_KINDS`, the `compile` emitter case, `normalisePadState`'s
default guard, the stamp writer, the stamp reader, the ledger label, the preset), 3 in `pad-sim.ts`
(`armLook` case, `ripplePhase`, an import), and 15 assertions across the three ported suites. Two
new looks is therefore roughly 22 code sites plus ~30 test assertions.

**But the expensive part is not the code, it is the re-sync.** D-04 pins all six vendored files by
sha256 against a recorded upstream SHA, and D-11a's `capture-preset-baseline.mjs` refuses to run
unless `git ls-remote sabotond-dev/botor refs/heads/main` starts with the recorded commit *and* the
local sibling checkout is sitting on it. Landing a look upstream means: BOTOR PR, merge, new SHA,
re-record `upstream-manifest.json`, re-capture `preset-baseline.json`, update the pinned commit in
three files, re-run 361 tests plus the 4,860-state sweep.

**And the candidates are not looks.** The interesting ones need a Timer *behaviour*, which means new
`SendKind`s. `SEND_KINDS` is a 3-bit stamp field with 6 of 8 slots used. Two new kinds exhaust it;
five forces stamp format "e" and a decoder-compatibility story (there is already a known
graft-misalignment hole documented in `pad.test.js`). That is a multi-week BOTOR project.

**Verdict:** correct in the long run, wrong for this phase. Recommend one narrowly-scoped
BOTOR patch *only* if the user wants a knob-tunable variant of a hand-authored card to appear on
BOTOR's own shelf. Ask him (open question 2).

#### 1c - a HANGAR-owned Lua host driving `PadSim`'s LED engine

**This is the recommendation, and it is proven, not proposed.**

The insight is that `PadSim` is two things fused: a compiled-Lua *interpreter* written in TypeScript,
and a firmware *LED engine* (the `glc`/`glp`/`glt`/`glpfs` stores, `ledTick` transcribed verbatim
from `grid_led.c:191-211`, `weightsOf`, `shapeIntensity`, the 256-entry `SINE_LOOKUP`, and the
single divide-by-512 after the layer sum). The second half is exactly what a Lua host needs, and it
is exactly what `firmware-oracle.spec.ts` independently pins.

`PadSim` already exposes that half publicly. From `pad-sim.ts:1502-1556`:

```ts
layer(hw: number, layer: 0|1|2): { min; mid; max; pha; fre; sha; timeout }
pokeLayer(hw: number, layer: 0|1|2, patch: Partial<{ min; mid; max; pha; fre; sha; timeout }>): void
get frame(): Uint8Array      // :1451
get animating(): boolean     // :1465
tick(): void                 // :860 - pop, timer, ledTick, render
```

They are labelled "test hooks", but they are the whole contract. **A Lua host can drive the
oracle-pinned engine with zero edits to any vendored file.** D-04 is satisfied by not touching it.

Construct the `PadSim` from a blank state with every slot detached
(`owned: { touchHandler: "user", timer: "user", layer1: "user", layer2: "user" }`): `rebuild` then
arms nothing, `timerPeriod` stays `null`, and `runTimerBody` never fires. The host keeps its own
touch FIFO and its own `gtt` deadline, calls into Lua, and then calls `padSim.tick()` purely for
`ledTick` + `render`.

**The proof.** Built in the scratchpad, run in Node:

1. wasmoon + ~60 lines of Grid-API stubs ran BOTOR's own `compile(preset.state).setupLua` for all
   nine shelf presets.
2. For each preset, all **243 layer records** (81 LEDs x 3 layers x min/mid/max/pha/fre/sha/timeout)
   were compared against a fresh `new PadSim(preset.state)`.

```
aurora     MATCH (243/243 layer records)      joystick   MATCH (243/243)
pinwheel   MATCH (243/243 layer records)      ninepads   MATCH (243/243)
starfield  MATCH (243/243 layer records)      faders     MATCH (243/243)
radar      MATCH (243/243 layer records)      dial       MATCH (243/243)
                                              tpad       MATCH (243/243)
ALL NINE PRESETS MATCH
```

3. Then the frames, at the golden-frame ticks `[0, 37, 101, 500, 1009]`, running the firmware
   `ledTick` on both sides and rendering through the same exported `shapeIntensity`/`weightsOf`:

```
aurora     0:=/g  37:=/g  101:=/g  500:=/g  1009:=/g
pinwheel   0:=/g  37:=/g  101:=/g  500:=/g  1009:=/g
starfield  0:=/g  37:=/g  101:=/g  500:=/g  1009:=/g
radar      0:=/g  37:=/g  101:=/g  500:=/g  1009:=/g
joystick   0:=/g  37:=/g  101:=/g  500:=/g  1009:=/g
ninepads   0:=/g  37:=/g  101:=/g  500:=/g  1009:=/g
faders     0:=/g  37:=/g  101:=/g  500:=/g  1009:=/g
dial       0:=/g  37:=/g  101:=/g  500:=/g  1009:=/g
tpad       0:=/g  37:=/g  101:=/g  500:=/g  1009:=/g
LUA ROUTE == PADSIM AT EVERY SAMPLED TICK
```

(`=` means the Lua route's rendered frame hash equals `PadSim.frame`'s; `/g` means both equal the
recorded hash in `src/lib/fidelity/golden-frames.json`.)

All ten new candidates were then run through the same host: Setup, Timer wrapped as a stored event
body, a scripted drag/tap/lift, 60 timer ticks, 3 LED ticks per timer tick. **Zero runtime errors
across all ten**, and each one's musical behaviour was asserted (see the candidate table).

##### Fidelity risks, honestly

| Risk | Assessment |
|---|---|
| **Lua 5.5 (module) vs 5.4 (wasmoon)** | The configs use one small subset: numeric `for`, `local`, integer `+ - * // %`, `math.atan/sqrt/abs/max/tointeger`, table constructors, `pairs`, `#`, closures, `and`/`or`/`not`, comparisons. That subset is identical across 5.3, 5.4 and 5.5. Integer/float distinction, floor `//` and floor `%` all arrived in 5.3 and are unchanged. Confidence HIGH for the subset, MEDIUM as a general statement about 5.5 - mitigate by *forbidding* anything outside the subset in the catalog gate rather than by hoping. |
| **`LUA_FLOORN2I = F2Ieq` (a fractional argument to a Grid function silently becomes 0)** | This lives in the C *argument conversion*, not in Lua semantics, so the host owns it: the stubs implement `Number.isInteger(v) ? v : 0` themselves. Verified in the probe: `glp(0,1,127.5)` stored phase **0**, `glp(1,1,127.0)` stored **127**. This is a fidelity *gain* - `PadSim` models it per call site, the host models it once. |
| **The 10 ms C tick vs Lua timer callbacks** | Already solved by `PadSim.tick()`, whose one pinned interleave is "touch pop, timer, `grid_led_tick`". The host must re-arm its `gtt` deadline **before** running the body, exactly as `PadSim` does and exactly as firmware's pcall demands. |
| **Freeze-on-expiry** | Inside `PadSim.ledTick`, untouched. Phase advances *before* the last-tick `fre = 0`. |
| **`glag` returns the HARDWARE index** | The single biggest trap. The first probe used identity and would have mirrored 40 of 81 cells. The stub must be `screenToHw(n % 9, n // 9)` - `screenToHw` is already exported from `pad-sim.ts`. Both cross-checks above use it, which is why they pass. |
| **wasmoon's `lua.global.set` marshalling** | Numbers cross as JS doubles; integral floats (`159.0`) arrive `Number.isInteger` true, which is the correct firmware behaviour. Verified. |
| **`touch_pop` drain loops (the trackpad)** | Not modelled. `tpad` writes no LEDs, so its frame is all zeros by design and the cross-check is vacuously true there. Any *new* hand-authored config that drains the ring needs FIFO plumbing in the host. None of the ten do. |

##### Licence and bundle

| | wasmoon 1.16.0 | fengari 0.1.5 |
|---|---|---|
| Lua | 5.4 (real Lua compiled to WASM) | 5.3 (reimplementation in JS) |
| Licence | MIT | MIT |
| Last published | 2026-04-25 | 2025-12-26 |
| Raw / gzip / brotli | 271 KB + 152 KB JS -> **111 + 39 KB gzip, 95 + 34 KB brotli** | 1.64 MB unpacked, pure JS |
| Node dependencies | `@types/emscripten` only | `readline-sync`, `sprintf-js`, `tmp` |
| Runs in Node for build-time frames and Vitest | yes, same build | yes |

MIT is GPLv3-compatible in the permissive direction, so HANGAR stays GPLv3 and `THIRD-PARTY.md`
gains one MIT entry. **Choose wasmoon**: real Lua (so the semantics question is "5.4 vs 5.5", not
"a reimplementation vs the real thing"), a third of fengari's size, no Node-only transitive deps,
and actively published.

**Bundle budget.** The whole Lua chunk is **~129 KB brotli**, against the 193 KB brotli of the
`lua_fmt_bg.wasm` HANGAR already lazy-loads. It must obey the same rules: never at boot, lazy on
first open of a Lua-backed card, prefetched on `requestIdleCallback` or on hover. Two consequences
for the catalog:

- A Lua-backed card's **thumbnail** cannot animate before the chunk lands. Ship a build-time still
  frame (SHARE-04 already renders OG images from the simulator in Node, and wasmoon runs in Node, so
  it is the same code path) and swap to live once the chunk resolves.
- `padReady()` gates the *formatter*; the Lua host needs its own separate memoised gate. Do not fuse
  them: a browse-only visitor should download neither.

### Recommendation

**Route 1c, with a 1a fallback.** Concretely:

1. **Wave 0** builds `src/lib/sim/lua-host.ts` (wasmoon + Grid-API stubs + FIFO + `gtt` deadline)
   and `src/lib/sim/lua-pad-sim.ts` (the duck-typed wrapper `SimHost` already consumes:
   `tick`, `run`, `frame`, `animating`, `touchDown/Move/Up/Tap`, `coordMax`, `pendingTouches`),
   and proves it by porting the nine-preset cross-check above into
   `src/lib/fidelity/lua-parity.spec.ts`. **If that spec is not green, no new configuration is
   authored.** The parity spec is cheap insurance and it is already written, in the scratchpad.
2. **Waves 1-3** author the six chosen configurations against the gate.
3. Route 1b stays open as a *later* offer to BOTOR (open question 2), not as a dependency.

---

## The budget, measured

### What `compressScript` actually does

`GridScript.compressScript(s) = minifyLua(shortify(s))` (`grid-protocol/dist/index.js:4462`).

- **`shortify`** tokenises and substitutes **known Grid function names only**, from a 192-entry
  lookup built from `grid.getProperty("LUA")`. Confirmed present and used by the candidates:
  `led_address_get->glag`, `led_color->glc`, `led_value->glp`, `led_timeout->glt`,
  `led_animation_rate->glf`, `led_animation_type->gls`,
  `led_animation_phase_rate_type->glpfs`, `limit->glim`, `midi_send->gms`, `timer_start->gtt`,
  `rx_mode->grxm`, `touch_x_max->txma`, `touch_y_max->tyma`, `mouse_move_send->gmms`,
  `mouse_button_send->gmbs`, `led_width->lwi`, `immediate_send->gis`.
  **Everything you name yourself passes through at full length.** One-character locals are a budget
  decision, not a style one.
- **`minifyLua`** is the WASM StyLua pass. It collapses whitespace and newlines onto one line and
  removes a handful of separator spaces. Measured deltas on the candidates: `] then` -> `]then`,
  `] and` -> `]and`, `if (` -> `if(`. That is where the 1-2 character savings in EUCLID, SONAR,
  LATTICE and CHORUS came from.
- **Comments are not stripped.** Measured: a readable 136-character script compressed to 75; the
  same script with `-- a comment that costs money` appended compressed to 106, i.e. the comment's 29
  characters plus 2 newlines survived verbatim. Ship comment-free Lua.
- **`compressScript` is idempotent** on all ten candidates: `compress(compress(x)) === compress(x)`.
  That is what makes the canonical-form gate below safe.

### The gotcha that will bite an author

`cost()` (`_pad.ts:3064`) computes `used = Math.max(measure(lua), lua.length) + reserved`. **The raw
length wins if it is larger.** So a readable, indented, hand-authored Lua string that compresses to
400 characters would be reported by HANGAR's own budget meter as its raw 700. The compiler never
notices because it emits shortified text already.

**Rule for the catalog:** hand-authored entries store the canonical compressed string, and the gate
asserts `compressScript(entry) === entry`. Then raw == compressed and the meter tells the truth.

### The harness

Lives in the scratchpad at `.../scratchpad/measure.mjs`. It binds HANGAR's **own**
`node_modules/@intechstudio/grid-protocol/dist/index.js` by absolute `file://` URL - the same
separate-module-instance discipline `capture-preset-baseline.mjs` documents - awaits
`initLuaFormatter()`, and exports `measure(lua)`, `ok(lua)` (= `checkSyntax`) and `compress(lua)`.
Validated against the recipe book's published numbers: A5 breathing measures 75, matching the
recipe book's ledger exactly.

**This harness should be promoted into the repo** as the Phase 8 catalog gate. It is nine lines
on top of the existing `measureLua` in `src/lib/pad/index.ts`.

### Measured budget table - every candidate

All lengths in characters of the **canonical (compressed) string, marker included**. Limit 908 per
event. `checkSyntax` run on the canonical string. Every row was also **executed** in the Lua host.

| # | Config | Setup | free | Timer | free | syntax | runs clean | route needed |
|---|---|---|---|---|---|---|---|---|
| 1 | **STEP** | 355 | 553 | 246 | 662 | true / true | yes | 1c |
| 2 | **EUCLID** | 702 | 206 | 218 | 690 | true / true | yes | 1c |
| 3 | **ARC** | 379 | 529 | 251 | 657 | true / true | yes | 1c |
| 4 | **GHOST** | 305 | 603 | 331 | 577 | true / true | yes | 1c |
| 5 | **SONAR** | 432 | 476 | 279 | 629 | true / true | yes | 1c |
| 6 | **MORPH** | 507 | 401 | 0 | 908 | true / n/a | yes | 1c |
| 7 | **RIBBON** | 708 | 200 | 111 | 797 | true / true | yes | 1c |
| 8 | **LATTICE** | 615 | 293 | 171 | 737 | true / true | yes | 1c |
| 9 | **CHORUS** | 729 | 179 | 173 | 735 | true / true | yes | 1c |
| 10 | **MIRROR** | 638 | 270 | 0 | 908 | true / n/a | yes* | 1c |

\* MIRROR runs clean and its DAW-feedback path was exercised in the host, but the host cannot prove
the module actually receives host MIDI. See the MEDIUM-confidence note in its entry.

For comparison, the nine shipped presets at their defaults (from `preset-baseline.json`, captured
from BOTOR's own compiler at the pinned protocol): setup 238-902, timer 24-158. **Every new
candidate leaves at least 179 Setup characters and 577 Timer characters of headroom for knobs.**

---

## Eight-plus candidate configurations

Every Lua string below is the exact canonical text measured and executed. Notation is the recipe
book's: layer 2 is the autonomous background, layer 1 the touch response, `glag(0,n)` maps logical
`n = x + y*9` to the hardware index, `s` is the element table.

The design rule shared by all of them: **make the C engine do the animating.** A cell handed
`glpfs(a, L, 255, 250, 0)` + `glt(a, L, 42)` costs one call and then fades over 0.42 s with zero
further Lua. Every playhead, sweep, ghost and bloom below is that one trick applied to a different
path.

---

### 1. STEP - "a nine-step sequencer you draw with a finger"

**The job.** A real step sequencer. Nine columns are nine steps (9 divides by 3 and 9 and nothing
else, so nine steps is the one count that lands exactly on the grid). Nine rows are nine scale
degrees, top = highest. Tap a cell to place a note in that step; tap it again to make it a rest. A
playhead marches left to right and plays what you drew. Useful because it is a complete instrument
that needs no DAW at all - plug in, draw, hear.

**The look.** At rest: your programmed dots glowing green on layer 1, and a bright cyan column
sweeping left to right on layer 2, trailing three columns of decay behind it because each column is
handed to the C engine with rate 250 / timeout 42. The dot in the playhead column flares as the two
layers add. On touch: the dot you place lights instantly.

```
SETUP  (355/908)
--[[@cb]]for a=0,80 do glc(a,1,0,255,120,1)glp(a,1,0)glc(a,2,0,140,255,1)glp(a,2,0)end self.q={}self.m={0,2,4,5,7,9,11,12,14}self.touch_cb=function(s,i,e,x,y)if e~=4 and e~=9 then return end local c=x*9//128 local r=y*9//128 local o=s.q[c]if o then glp(glag(0,c+o*9),1,0)end if o==r then s.q[c]=nil else s.q[c]=r glp(glag(0,c+r*9),1,255)end end gtt(0,125)

TIMER  (246/908)
--[[@cb]]gtt(0,125)local s=self local k=(s.k or 0)%9 s.k=k+1 if s.z then s:gms(0,128,s.z,0,0)s.z=nil end local r=s.q[k]if r then local n=48+s.m[9-r]s:gms(0,144,n,100,0)s.z=n end for j=0,8 do local a=glag(0,k+j*9)glpfs(a,2,255,250,0)glt(a,2,42)end
```

**Measured behaviour** (Lua host): programming column 0 / row 0 and column 4 / row 8, then running
one bar of nine ticks, fired exactly `note 62` then `note 48` - `48 + m[9]` = 62 (top row, highest
degree) and `48 + m[1]` = 48 (bottom row, root). Both programmed cells read phase 255 on layer 1.

**Knobs (5).** Tempo (`gtt` ms, 60-500), Root note, Scale (the nine-entry `self.m` table), Channel,
Colour pair, Trail length (the `42`).

**MIDI.** Note-on velocity 100 on channel 1, note-off for the previous step first, so it is
monophonic and legato-free by design.

**Honest limits.** One note per column - it is a mono sequencer, not a drum grid (see EUCLID for
that). The playhead is not synced to any external clock; MIDI clock in was not investigated.

---

### 2. EUCLID - "three Euclidean rings, one polyrhythm"

**The job.** A three-voice Euclidean drum machine. Concentric square rings on a 9x9 have exactly
8, 16 and 24 cells, so three tracks of 8, 16 and 24 steps sit on the pad with no rounding at all.
Each ring is generated by the Bresenham Euclid (`t*k//n ~= (t-1)*k//n`, ~40 characters) at 3, 5 and
7 pulses. Tap any cell to toggle that step. Genuinely useful: Euclidean sequencing is a staple, and
the three ring lengths beat against each other on a 48-tick cycle you can hear immediately.

**The look.** Three rotating orange pulse markers on layer 1 (static, always visible), with a bright
cyan head running each ring at its own speed on layer 2, trailing 0.42 s of decay. The inner ring
completes three revolutions while the outer completes one. At rest the pad looks like three gears
turning at different rates.

```
SETUP  (702/908)
--[[@cb]]for a=0,80 do glc(a,1,255,90,0,1)glp(a,1,0)glc(a,2,0,200,255,1)glp(a,2,0)end self.c={}self.p={}self.i={}local h={3,5,7}for d=1,3 do local n=d*8 local u={}local v={}for t=0,n-1 do local q=t//(d*2)local w=t%(d*2)local a,b if q==0 then a,b=d,w-d elseif q==1 then a,b=d-w,d elseif q==2 then a,b=-d,d-w else a,b=w-d,-d end local m=a+4+(b+4)*9 u[t]=m self.i[m]=d*32+t v[t]=t*h[d]//n~=(t-1)*h[d]//n if v[t]then glp(glag(0,m),1,255)end end self.c[d]=u self.p[d]=v end self.touch_cb=function(s,i,e,x,y)if e~=4 and e~=9 then return end local v=s.i[x*9//128+y*9//128*9]if not v then return end local d=v//32 local t=v%32 s.p[d][t]=not s.p[d][t]glp(glag(0,s.c[d][t]),1,s.p[d][t]and 255 or 0)end gtt(0,110)

TIMER  (218/908)
--[[@cb]]gtt(0,110)local s=self local k=(s.k or 0)%24 s.k=k+1 for d=1,3 do local t=k%(d*8)local a=glag(0,s.c[d][t])glpfs(a,2,255,250,0)glt(a,2,42)s:gms(0,128,34+d*2,0,0)if s.p[d][t]then s:gms(0,144,34+d*2,100,0)end end
```

**Measured behaviour:** 15 pulse cells lit at boot (3+5+7, exactly as generated). Over 24 ticks the
three voices fired `{36: 9, 38: 8, 40: 7}` - ring 1 completes three revolutions of its 3-pulse
pattern, ring 2 one and a half of its 5, ring 3 one of its 7. That 9:8:7 is the polyrhythm.

**Knobs (6).** Tempo, Pulses per ring (three separate 0..n dials - the single best knob on the
card), Base note, Channel, Ring colours, Trail length.

**MIDI.** Notes 36 / 38 / 40 (kick / snare / hat by GM convention), note-off issued unconditionally
before each tick's note-on, so no track can hang.

**Honest limits.** Perimeter order is a Chebyshev square walk, so the "circle" is a square - which
on a 9x9 grid of square pixels is what a circle looks like anyway. The centre cell (index 40) is
unused; it is a natural home for a run/stop tap.

---

### 3. ARC - "a modulation LFO you draw with your finger"

**The job.** A hands-free modulation source that keeps sending after you let go. Slide left-right to
set the rate (5.1 s down to 160 ms per cycle), up-down to set the depth. The Timer runs a triangle
oscillator at 50 Hz and sends it as a CC. Useful because it is the one thing a controller usually
cannot do: modulate without you.

**The look.** The whole pad is a swirl (`math.atan` phase stagger, the A1 recipe) on layer 2, **and
the swirl's rotation speed is the LFO rate.** That works because `glf(a, layer, fre)` is a rate-only
setter - it changes speed without resetting phase, so the swirl accelerates smoothly under your
finger instead of jumping. In the middle, a 3x3 heart on layer 1 pulses at exactly the LFO value.
You can see the modulation, not just hear it.

```
SETUP  (379/908)
--[[@cb]]for n=0,80 do local a=glag(0,n)glc(a,2,0,110,255,1)glpfs(a,2,math.atan(n//9-4,n%9-4)*41//1%256,4,3)glt(a,2,65535)glc(a,1,255,255,120,1)glp(a,1,0)end self.r=4 self.d=127 self.h=0 self.touch_cb=function(s,i,e,x,y)if i>0 or e==3 or e>=5 then return end s.d=127-y local r=1+x*31//127 if r~=s.r then s.r=r local f=glim(r//2,1,120)for a=0,80 do glf(a,2,f)end end end gtt(0,20)

TIMER  (251/908)
--[[@cb]]gtt(0,20)local s=self local p=(s.h+s.r)%256 s.h=p if p<s.r then for a=0,80 do glt(a,2,65535)end end local v=p<128 and p*2 or 510-p*2 s:gms(0,176,16,glim(64+(v-128)*s.d//255,0,127),0)for j=-1,1 do for k=-1,1 do glp(glag(0,40+j*9+k),1,v)end end
```

**Measured behaviour:** a touch at x=127 set the LED rate to 16; at x=0 it set 1. At full depth the
CC swept 0..126 over 40 ticks; at zero depth it emitted a constant 64. The keeper is folded into the
oscillator (`if p < s.r` is true exactly on the phase wrap), so layer 2 is re-armed once per LFO
revolution for 40 characters instead of a separate keeper timer.

**Knobs (5).** Shape (triangle / ramp / square - a one-expression swap), Rate range, CC number,
Channel, Swirl colour and arm count.

**MIDI.** One CC per 20 ms tick = 50 messages/second, well under the ~18-per-10-ms ceiling.

**Honest limits.** The 20 ms Timer is the LFO clock, so the fastest cycle is 256/31 x 20 ms = 165 ms.
Anything faster wants a bigger phase step and gets steppy.

---

### 4. GHOST - "draw an automation curve once, and it loops forever"

**The job.** A gesture looper. Hold a finger and drag: the pad records your path at 50 Hz while
sending X and Y as CCs. Lift, and a ghost retraces exactly what you drew, forever, still sending.
Two fingers down clears it. Useful in the plainest possible way: it is drawn automation with no DAW,
no lane, no mouse.

**The look.** While recording, a green comet follows your finger on layer 1. After you lift, a
magenta comet retraces the same path on layer 2 - a different colour so you can always tell your
hand from its ghost. Both are the same one-call C decay.

```
SETUP  (305/908)
--[[@cb]]for a=0,80 do glc(a,1,0,255,180,1)glp(a,1,0)glc(a,2,255,80,255,1)glp(a,2,0)end self.g={}self.n=0 self.j=0 self.touch_cb=function(s,i,e,x,y)if i>0 then if e==4 then s.g={}s.n=0 s.j=0 for a=0,80 do glp(a,1,0)end end return end if e==3 or e>=5 then s.h=nil return end s.h=1 s.x=x s.y=y end gtt(0,20)

TIMER  (331/908)
--[[@cb]]gtt(0,20)local s=self local x,y if s.h then x=s.x y=s.y if s.n<250 then s.n=s.n+1 s.g[s.n]=x*128+y end s.j=0 elseif s.n>0 then s.j=s.j%s.n+1 local v=s.g[s.j]x=v//128 y=v%128 end if x then s:gms(0,176,16,x,0)s:gms(0,176,17,127-y,0)local a=glag(0,x*9//128+y*9//128*9)local l=s.h and 1 or 2 glpfs(a,l,255,250,0)glt(a,l,42)end
```

**Measured behaviour:** recording a three-point drag then lifting replayed `10,60,110,10,60,110`
across two loops - exact, in order, looping. A second-finger DOWN cleared it and MIDI went to zero.

**The trick worth stealing:** recording is done by the *Timer*, not the touch callback. The callback
only stores the last known `x, y`; the Timer samples it. So record and replay run at identically
20 ms per point, and the loop plays back at exactly the speed you drew it - which is not true if you
record on touch events (they are change-gated, so a slow drag records fewer points than a fast one).

**Knobs (5).** Loop length cap (the `250`, = 5 s), Sample rate / playback speed (the `gtt` 20),
CC pair, Channel, Ghost colour.

**Honest limits.** 250 samples of 5 s at 20 ms. A motionless finger still records (the Timer samples
the stored position), which is correct and is the reason the Timer-sampling design was chosen.

---

### 5. SONAR - "a radial 16-step sequencer, five voices deep"

**The job.** A polar sequencer. A sweep line rotates once every 1.12 s through 16 angle buckets;
tap any cell to arm it, and it fires when the sweep crosses it. Because the pitch comes from the
cell's *ring* (Chebyshev distance from centre) and the time from its *angle*, the pad is a 16-step,
5-voice grid in polar coordinates - inner rings low, outer rings high, minor pentatonic. Useful and
unusual: nothing else on a desk sequences in a circle.

**The look.** A cyan radar sweep rotating over a dark field, leaving 0.42 s of decay behind it, with
your armed cells glowing pink underneath. The angle buckets are derived from *exactly* the same
`math.atan(...)*41//1%256` expression the Pinwheel look uses, divided by 16 - so the sweep's step
boundaries line up with the swirl's own phase geometry.

```
SETUP  (432/908)
--[[@cb]]self.a={}self.o={}self.v={}local t={0,3,5,7,10}for n=0,80 do local c=glag(0,n)glc(c,1,255,60,120,1)glp(c,1,0)glc(c,2,120,255,255,1)glp(c,2,0)self.a[n]=(math.atan(n//9-4,n%9-4)*41//1%256)//16 local d=math.max(math.abs(n%9-4),math.abs(n//9-4))self.o[n]=36+t[d+1]end self.touch_cb=function(s,i,e,x,y)if e~=4 and e~=9 then return end local n=x*9//128+y*9//128*9 s.v[n]=not s.v[n]glp(glag(0,n),1,s.v[n]and 255 or 0)end gtt(0,70)

TIMER  (279/908)
--[[@cb]]gtt(0,70)local s=self local k=(s.k or 0)%16 s.k=k+1 if s.z then for j=1,#s.z do s:gms(0,128,s.z[j],0,0)end end s.z={}for n=0,80 do if s.a[n]==k then local a=glag(0,n)glpfs(a,2,255,250,0)glt(a,2,42)if s.v[n] then local m=s.o[n]s:gms(0,144,m,100,0)s.z[#s.z+1]=m end end end
```

**Measured behaviour:** arming the top-left corner (ring 4) and running two revolutions fired
exactly two note-ons, both `note 46` = `36 + t[5]` = the pentatonic top. Pending note-offs are
tracked in `s.z` and cleared on the following tick, so nothing hangs.

**Knobs (5).** Sweep speed (`gtt` 70), Root note, Ring scale (the five-entry `t`), Channel,
Sweep colour.

**Honest limits.** 81 cells are scanned per tick - 1,300 iterations/second at 70 ms, which firmware
does not charge for (there is no Lua instruction budget anywhere in grid-fw). Cells on the same ring
share a pitch, which is the point: ring = voice, angle = time.

---

### 6. MORPH - "four macros in the corners, one finger between them"

**The job.** A four-corner macro morph pad. Each corner owns a CC; your finger's position is
bilinearly blended into four weights that always sum to the full range. Park in a corner and that
macro is at 127 and the rest at 0; sit in the middle and all four are at a quarter. Useful because
four-corner morphing is a paradigm players already know (Kaoss pads, NI morph pads, Ableton macro
racks) and mapping four CCs is the easiest MIDI-learn job there is.

**The look.** Four 2x2 corner blocks, each its own hue (red / green / blue / amber, derived
arithmetically as `255-j*60, j*60, 128` so it costs nothing), and **each corner's brightness is its
own weight.** You can read the mix off the pad from across a room. Under your hand, a pale comet
trail on layer 2.

```
SETUP  (507/908)
--[[@cb]]for a=0,80 do glc(a,2,180,255,255,1)glp(a,2,0)end self.k={0,7,63,70}for j=0,3 do for d=0,3 do local a=glag(0,self.k[j+1]+d%2+d//2*9)glc(a,1,255-j*60,j*60,128,1)glp(a,1,0)end end self.touch_cb=function(s,i,e,x,y)if i>0 or e==3 or e>=5 then return end local u=127-x local v=127-y local w={u*v//127,x*v//127,u*y//127,x*y//127}for j=1,4 do s:gms(0,176,15+j,w[j],0)local b=s.k[j]for d=0,3 do glp(glag(0,b+d%2+d//2*9),1,w[j]*2)end end local a=glag(0,x*9//128+y*9//128*9)glpfs(a,2,255,250,0)glt(a,2,42)end

TIMER  none (0/908)
```

**Measured behaviour:** dead centre produced weights `31,31,31,32` (sum 125 - two units of floor
loss, invisible); the top-left corner produced `127,0,0,0`.

**Why no Timer.** MORPH's only animation is a per-touch decay, which is self-limiting. The obvious
"add the keeper" reflex is **actively harmful here** - see the pitfall below. Its Timer event is
genuinely empty, and that is the right answer.

**Knobs (5).** CC base (four consecutive), Channel, Corner colours, Trail length, Response curve
(linear vs squared weights - a `w*w//127` swap).

**Honest limits.** 16 `glp` writes plus 4 CCs per touch sample. Single-contact by design (`i > 0`
returns), because four fingers fighting over one blend is noise.

---

### 7. RIBBON - "a pitch ribbon with real glissando"

**The job.** A monophonic lead ribbon. The X axis is unlocked to its native 0..1023 and quantised
into 17 scale degrees across two-and-a-bit octaves; sliding retriggers only when you cross a degree,
so runs are clean instead of a note storm. Y is a CC (filter, timbre, whatever the DAW learns).
Useful for exactly what a keyboard cannot do: continuous melodic sweeps.

**The look.** A dark blue field; the **column of the note you are holding is lit as a full-height
orange rail**, so the ribbon shows you where the notes are while you play it, and a comet trail
follows your finger over the top.

```
SETUP  (708/908)
--[[@cb]]self:txma(1023)self:tyma(1023)for a=0,80 do glc(a,1,255,140,0,1)glp(a,1,0)glc(a,2,0,180,255,1)glp(a,2,0)end self.m={0,2,4,5,7,9,11}self.touch_cb=function(s,i,e,x,y)if i>0 then return end if e==3 or e>=5 then if s.z then s:gms(0,128,s.z,0,0)s.z=nil end if s.w then for j=0,8 do glp(glag(0,s.w+j*9),1,0)end s.w=nil end return end s.c=0 local d=x*17//1024 local n=48+s.m[d%7+1]+d//7*12 if n~=s.z then s:gms(0,144,n,100,0)if s.z then s:gms(0,128,s.z,0,0)end s.z=n if s.w then for j=0,8 do glp(glag(0,s.w+j*9),1,0)end end local c=d*9//17 for j=0,8 do glp(glag(0,c+j*9),1,255)end s.w=c end s:gms(0,176,16,127-y*127//1023,0)local a=glag(0,x*9//1024+y*9//1024*9)glpfs(a,2,255,250,0)glt(a,2,42)end gtt(0,100)

TIMER  (111/908) - stuck-note watchdog
--[[@cb]]gtt(0,100)local s=self if s.z then s.c=(s.c or 0)+1 if s.c>20 then s:gms(0,128,s.z,0,0)s.z=nil end end
```

**Measured behaviour:** sweeping x across the pad produced the ladder `48, 50, 52, 55, 64, 76` - a
major scale, correctly deduplicated (two x positions inside one degree fired one note). Lifting
released every held note. New note-on is sent *before* the previous note-off, which is what makes
the glissando legato on a mono synth.

**Knobs (6).** Root note, Scale (`self.m`), Range (the `17`), CC number, Channel, Rail colour.

**Honest limits.** The 10-bit unlock means every `// 128` in this config is `// 1024`; miss one and
the picture collapses into the top-left cell. The watchdog is 2 s, and a genuinely motionless finger
emits nothing - real fingers jitter, but this is the one thing to feel on hardware.

---

### 8. LATTICE - "the whole pad is one instrument, tuned in fourths"

**The job.** An isomorphic note grid. `note = base + column + (8 - row) * 5`, i.e. one semitone
right, a perfect fourth up - the LinnStrument / Push / guitar tuning. 81 cells, four octaves, and
every chord shape is the same shape in every key, which is the entire argument for isomorphic
layouts. Multi-touch with a per-contact watchdog. This is the card that makes ZONA a playable
instrument rather than a controller.

**The look.** A static, delicate three-tone map on layer 2 that never moves: **roots amber,
in-scale degrees blue, out-of-scale cells nearly black.** Because the layout is isomorphic, the
roots fall into a regular diagonal lattice - the picture *is* the theory, and it is legible at a
glance. Held cells go white on layer 1 as you play.

```
SETUP  (615/908)
--[[@cb]]self.m={0,2,4,5,7,9,11}self.n={}self.p={}self.t={}for i=0,80 do local a=glag(0,i)local n=36+i%9+(8-i//9)*5 self.n[i]=n local p=(n-36)%12 local q=0 for j=1,7 do if self.m[j]==p then q=1 end end if p==0 then glc(a,2,255,180,60,1)elseif q>0 then glc(a,2,0,90,160,1)else glc(a,2,0,25,50,1)end glp(a,2,255)glc(a,1,255,255,255,1)glp(a,1,0)end self.touch_cb=function(s,i,e,x,y)s.t[i]=0 local c=x*9//128+y*9//128*9 if e==3 or e>=5 then c=nil end local o=s.p[i]if o~=c then if o then s:gms(0,128,s.n[o],0,0)glp(glag(0,o),1,0)end if c then s:gms(0,144,s.n[c],100,0)glp(glag(0,c),1,255)end s.p[i]=c end end gtt(0,100)

TIMER  (171/908) - per-contact watchdog
--[[@cb]]gtt(0,100)local s=self for i,c in pairs(s.p)do local t=(s.t[i]or 0)+1 s.t[i]=t if t>20 then s:gms(0,128,s.n[c],0,0)glp(glag(0,c),1,0)s.p[i]=nil s.t[i]=nil end end
```

**Measured behaviour:** the bottom-left cell, one column right, and one row up produced `36, 37, 42`
- +1 semitone across, +5 semitones (a fourth) up. Isomorphic, confirmed.

**Knobs (6).** Root note, Scale (highlight map), Row interval (5 = fourths, 3 = minor thirds,
4 = major thirds, 2 = whole-tone), Velocity, Channel, Root / scale / off colours.

**Honest limits.** Two fingers in the same cell: the light clears when the first leaves, though the
note stays correct. Same known limitation as the shipped Nine pads card - the repaint keys on the
cell, not on a per-cell contact count.

---

### 9. CHORUS - "nine chords, and every one of them blooms"

**The job.** Nine diatonic triads on the proven symmetric 3x3 layout (3 LEDs per pad, 0.19 LED
boundary error - the only division a 9-wide grid does honestly). Press a pad, get a full chord.
Baked at Setup from a seven-note scale table, so the module never computes a scale degree. Useful
in the flattest way possible: anyone who cannot play keys can comp a progression in thirty seconds.

**The look.** A blue/violet chessboard on layer 1 marking the nine pads, and on every press a warm
amber **bloom expanding outward from the pad you hit** across the whole grid on layer 2, driven
entirely by the C engine (81 `glpfs` in one burst, then zero Lua for 0.64 s). Nine pads, nine
different bloom centres.

```
SETUP  (729/908)
--[[@cb]]for n=0,80 do local a=glag(0,n)if(n%9//3+n//9//3)%2==0 then glc(a,1,0,60,120,1)else glc(a,1,80,40,140,1)end glp(a,1,255)glc(a,2,255,200,80,1)glp(a,2,0)end local t={0,2,4,5,7,9,11}self.h={}for z=0,8 do local c={}for j=0,2 do local d=z+j*2 c[j+1]=48+t[d%7+1]+d//7*12 end self.h[z]=c end self.z={}self.t={}self.touch_cb=function(s,i,e,x,y)s.t[i]=0 local z=x*3//128+y*3//128*3 if e==3 or e>=5 then z=nil end local o=s.z[i]if o==z then return end if o then for j=1,3 do s:gms(0,128,s.h[o][j],0,0)end end if z then for j=1,3 do s:gms(0,144,s.h[z][j],100,0)end local u,v=z%3*3+1,z//3*3+1 for n=0,80 do local p,q=n%9-u,n//9-v local a=glag(0,n)glpfs(a,2,255-math.sqrt(p*p+q*q)*22//1,4,0)glt(a,2,64)end end s.z[i]=z end gtt(0,100)

TIMER  (173/908) - per-contact chord watchdog
--[[@cb]]gtt(0,100)local s=self for i,z in pairs(s.z)do local t=(s.t[i]or 0)+1 s.t[i]=t if t>20 then for j=1,3 do s:gms(0,128,s.h[z][j],0,0)end s.z[i]=nil s.t[i]=nil end end
```

**Measured behaviour:** the nine pads produced, in order,
`48-52-55  50-53-57  52-55-59  53-57-60  55-59-62  57-60-64  59-62-65  60-64-67  62-65-69`
- C, Dm, Em, F, G, Am, Bdim, C(8va), Dm(8va) in C major. Correct diatonic harmony, generated in
130 characters.

**Knobs (6).** Key / root, Scale (major / minor / any seven-note table), Velocity, Channel, Bloom
colour, Bloom speed (the `4` / `64` rate-timeout pair).

**Honest limits.** Blooms replace rather than stack - a new press overwrites layer 2 - which is
what you want and is worth saying in the card copy. Sliding between pads is legato by construction.

---

### 10. MIRROR - "four faders that your DAW can move back" (MEDIUM confidence)

**The job.** The C9 rails fader layout, which is the only four-fader geometry a 9-wide grid gets
exactly right (touch boundaries at x = 32/64/96 land on LED columns 2.02/4.03/6.05, i.e. *on* the
white rails), **plus a MIDI-IN path so the bars follow the DAW.** ZONA has no motorised faders; this
is the closest a light-only surface gets, and it solves the real annoyance - picking up a fader that
is not where the plugin is.

**The look.** Five permanent white rails and four single-column colour bars (cyan / mint / lime /
amber), both layers driven together so the rails read white and not grey.

```
SETUP  (638/908)
--[[@cb]]grxm(0,2)for n=0,80 do local a=glag(0,n)local c=n%9 if c%2==1 then local f=c//2 glc(a,1,f*85,255-f*20,255-f*85,1)glc(a,2,f*85,255-f*20,255-f*85,1)glp(a,1,0)glp(a,2,0)else glc(a,1,255,255,255,1)glc(a,2,255,255,255,1)glp(a,1,255)glp(a,2,255)end end self.b=function(s,f,v)local l=(v+1)*9//128 for j=0,8 do local a=glag(0,f*2+1+j*9)local w=(8-j)<l and 255 or 0 glp(a,1,w)glp(a,2,w)end end self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 then return end local f=x*4//128 local v=127-y s:gms(0,176,16+f,v,0)s:b(f,v)end self.midirx_cb=function(s,h,e)if e[2]~=176 then return end local f=e[3]-16 if f>=0 and f<4 then s:b(f,e[4])end end

TIMER  none (0/908)
```

**Measured behaviour (in the host):** an inbound CC 17 = 127 lit all nine rows of bar 1; CC 17 = 0
cleared them.

**What is verified and what is not.**

- VERIFIED in firmware: `grid_decode_midi_to_ui` gates on `grid_rx_should_handle(GRID_RX_TYPE_MIDIVOICE, header)`,
  and `GRID_RX_MODE_HANDLE_EXTERNAL` is bit `0x02` - so `grxm(0,2)` is the right call
  (`grid_protocol.h:386-390`, `grid_decode.c:20-28, 439`).
- VERIFIED: `common/src/lua/decode.lua:19-23` calls `el:midirx_cb({instr, sx, sy}, {ch, cmd, p1, p2})`
  on **every** element that has the field. A raw `self.midirx_cb` bypasses the stock `gmrr` wrapper,
  which installs a `_midirx_cb` filtering `header[1] == 13` (`simplemidi.lua:101-140`) and is why
  module-to-module MIDI "looked broken" - it arrives as instr 14 EXECUTE, not 13 REPORT.
- **NOT verified:** that host MIDI over USB actually reaches this path on a ZONA, and which `instr`
  value it carries. The handler above deliberately does not filter on `h[1]` at all.

**Verdict:** ship MIRROR only if Botond confirms it on hardware, and keep a plain four-fader
fallback (the same Setup minus `grxm` and `midirx_cb`, ~90 characters cheaper) ready to substitute.
Treat this as the tenth candidate, not one of the six.

---

### Which six to ship

Ranked on spectacle x usefulness x independence from unverified facts:

| Rank | Config | Why |
|---|---|---|
| 1 | **EUCLID** | The most spectacular thing on the list and a complete drum machine. Three gears turning. |
| 2 | **CHORUS** | The bloom is the single best per-character visual in the corpus and chord pads are instantly useful to a non-keyboardist. |
| 3 | **ARC** | The only card where the animation *is* the data. `glf` making the swirl accelerate under your finger is a "how did it do that" moment. |
| 4 | **GHOST** | The clearest "I made that happen" loop on the pad, and drawn automation is a genuinely rare feature. |
| 5 | **LATTICE** | The one that makes ZONA an instrument. The static root lattice is beautiful and it never moves, which makes it the perfect contrast card in a rack of motion. |
| 6 | **MORPH** | Simplest to explain, easiest to map, and it reads across a room. Also the cheapest to ship (no Timer at all). |

Reserves, in order: **SONAR** (spectacular but overlaps EUCLID's "sequencer" slot), **STEP**
(overlaps EUCLID), **RIBBON** (excellent but the 10-bit unlock is the fiddliest to knob-tune),
**MIRROR** (blocked on hardware).

---

## Where new configurations live, and how they are gated

### The rule that shapes everything

D-04: `_pad.ts`'s `PRESETS` array is vendored and byte-pinned. **New configurations must never be
added there.** `presetById` and `PRESETS` stay exactly as upstream and remain the *nine*.

### Proposed shape - `src/lib/catalog/`

```
src/lib/catalog/
  index.ts            # CATALOG: readonly CatalogEntry[], sorts, lookup by id
  entries/
    ported.ts         # the nine, as { source: "preset", presetId: "aurora", ... }
    euclid.ts         # one file per hand-authored config
    chorus.ts
    ...
  catalog.spec.ts     # THE GATE
  frames.json         # one golden frame hash per entry per sampled tick
```

```ts
export type CatalogEntry = {
  // --- CONT-03 / CAT-02 ---
  id: string;                 // url slug, stable forever
  name: string;               // "EUCLID"
  description: string;        // one line
  tags: readonly string[];    // feel-based: "polyrhythm", "generative", "drums"
  featured: boolean;
  addedAt: string;            // ISO date, drives the Newest sort

  // --- how it is produced, and therefore how it previews ---
  source:
    | { kind: "preset"; presetId: string }      // route 1a - compiler-driven
    | { kind: "state"; state: PadState }        // route 1a - a tuned PadState
    | { kind: "lua"; setup: string; timer: string };  // route 1c - hand authored

  // --- how it previews (PREV-01/02) ---
  preview: "padsim" | "lua";   // derived from source.kind; explicit so the
                               // catalog can be read without a switch

  // --- TUNE-01: 3..6 knobs ---
  knobs: readonly Knob[];
  defaults: Readonly<Record<string, number | string | boolean>>;

  // --- what actually goes on the wire (CAT-04, Profile-Cloud shape) ---
  // Derived, never stored: build() returns the object below.
};

// Profile-Cloud-shaped, exactly as PROJECT.md records it.
export type PadConfigObject = {
  id: string;
  name: string;
  description: string;
  configType: "preset";
  type: ModuleType.ZONA;
  version: { major: number; minor: number; patch: number };
  configs: [{
    controlElementNumber: 0;
    events: [
      { event: 0 /* SETUP */; config: string },
      { event: 6 /* TIMER */; config: string },
    ];
  }];
};
```

### Knobs on hand-authored Lua

The compiler gets knobs for free; hand-authored Lua does not. Two options, and the cheap one is
clearly right for six cards:

- **Recommended - literal substitution.** Each knob names a token in the Lua and a value set:
  `{ id: "tempo", kind: "range", token: "@TEMPO", values: [60, ..., 500], default: 125 }`, and the
  builder does `lua.replaceAll(token, String(value))`. Because every knob value below is a *literal
  swap of the same or similar length*, the character cost is bounded and can be **measured across
  the whole knob cross-product at build time** - which is precisely what CONT-02's third success
  criterion ("swept across its full knob range, with no combination silently exceeding budget")
  asks for. With 179-603 characters of headroom on every candidate, no realistic sweep gets close.
- Rejected - a per-config TypeScript emitter function. It re-invents `_pad.ts` one card at a time
  and nothing would gate the emitters against each other.

The base36 stamp (SHARE-01) then encodes knob *indices* for Lua entries rather than `PadState`
fields, in a HANGAR-owned envelope that never collides with BOTOR's format (prefix it and reject on
mismatch - SHARE-03 already demands "this link was made with an older version" rather than a subtly
wrong config).

### The fit ladder

`fit()` (`_pad.ts:4089`) degrades a `PadState`; it has nothing to say about hand-authored Lua. For
Lua entries the honest equivalent is: **the knob cross-product is proven in budget at build time, so
there is no runtime ladder and TUNE-04's "we trimmed something" line never fires.** That is a
simpler and more honest story than a fake ladder. TUNE-05's over-budget path stays wired for
compiler-driven entries.

### How the coverflow consumes them

`SimHost` (`pad-sim-host.ts`) holds `sim: PadSim | undefined` per card and calls `tick`, `frame`,
`animating`, `touchDown/Move/Up`, `setState`, `coordMax`, `pendingTouches`. The Lua wrapper
implements that same surface, so Phase 4's card component needs one change: type the field as
`PadSim | LuaPadSim` (or a shared `SimEngine` interface) and pick by `entry.preview`. Everything
else - the shared rAF, the 100 ms catch-up clamp, the 33 ms render interval, the
`IntersectionObserver` gating - is unchanged and applies to Lua cards identically.

---

## Don't hand-roll

| Problem | Do not build | Use instead | Why |
|---|---|---|---|
| Animating a hand-authored config | A second simulator, or a per-card hand-drawn animation | wasmoon + `PadSim.pokeLayer`/`layer`/`tick`/`frame` | PREV-02 forbids hand-drawn animation outright, and a second engine would need its own firmware oracle. The existing engine is already pinned 26/26 against independently transcribed firmware constants. |
| The firmware LED model (weights, /512, sine table, freeze-on-expiry) | Re-transcribing `grid_led.c` | `PadSim`'s public hooks; `weightsOf`, `shapeIntensity`, `SINE_LOOKUP`, `glcStops` are all exported | A second transcription is a second chance to make the same misreading that `ledIndexToCell` already made once, and a green suite hid it. |
| The serpentine | `n` as the hardware index | `screenToHw(x, y)`, exported from `pad-sim.ts` | Identity mirrors 40 of 81 cells. Verified: the cross-check only passes with `screenToHw`. |
| Measuring character cost | `lua.length`, a regex minifier, or a hand-kept table | `GridScript.compressScript(...).length` via `measureLua`, behind `padReady()` | The minifier substitutes 192 known names; nothing else reproduces it, and `checkSyntax` silently returns `false` before the WASM loads. |
| Per-frame LED animation in Lua | A Timer that repaints 81 cells every tick | `glpfs` phase stagger + `glt` timeout; one call per cell, then zero Lua | The whole reason a spectacular ZONA is cheap. A 30-fps Lua repaint would eat the budget and the cycle. |
| Keeping a decaying trail alive | `glt(a, layer, 65535)` in a keeper | Nothing - decays are self-limiting | See the pitfall below; this one is a real, found bug. |
| Note-off safety | A short fixed gate, or hoping for an UP | A per-contact age counter in the Timer, reset on every sample | Firmware's delta gate advances before the ring-writability check, so a dropped UP is permanent (`grid_ui_touch.c:130-142`). |
| Euclidean patterns | A rotation/remainder algorithm | `t*k//n ~= (t-1)*k//n` | ~40 characters, exact, integer-only, no table. |
| An angle bucket | `math.atan2` | `math.atan(y, x)` (two-arg form) | `atan2` does not exist in this Lua. Verified at `lmathlib.c:72-77`. |
| `math.abs(a) > math.abs(b)` | | `a*a > b*b` | 10 characters. |

---

## Common pitfalls

### Pitfall 1: re-arming `glt` on a layer that carries a decaying trail

**What goes wrong.** The keeper idiom `for a=0,80 do glt(a,L,65535) end` is correct for a
C-animated background. Applied to a layer whose cells are handed `glpfs(a,L,255,250,0)` +
`glt(a,L,42)`, it replaces the 42-tick countdown with 65535, so the rate 250 keeps decrementing
past zero and **wraps** - the trail never dies and every touched cell strobes forever.

**How it was found.** MORPH, RIBBON and CHORUS were first drafted with the standard keeper. Running
them in the Lua host showed 81 lit cells on a layer that should have had four.

**How to avoid.** A keeper belongs only on a layer armed by `glpfs` at Setup with a continuous rate.
If a config's only animation is per-touch decay, its Timer is empty and that is correct. ARC folds
its keeper into the oscillator (`if p < s.r`) and only re-arms the swirl layer.

**Warning sign.** A card whose comet trail never fades, or a frame count that never returns to rest.

### Pitfall 2: `cost()` reports the raw length, not the compressed one

`used = max(measure(lua), lua.length)`. A pretty, indented, hand-authored config is charged its raw
length. Store canonical compressed strings and gate on `compressScript(x) === x` (idempotent on all
ten candidates).

### Pitfall 3: `glag` is not the identity

`glag(0, n)` returns the **hardware** index. The stub in a Lua host must be
`screenToHw(n % 9, n // 9)`. The first probe written for this research used identity and produced a
result that looked plausible and was wrong for 40 of 81 cells.

### Pitfall 4: the Timer must re-arm as its FIRST statement

The handler runs inside a pcall (`grid_lua.c:369`); a re-arm at the end dies permanently on the
first Lua error. Every Timer above opens with `gtt(0, ...)`. `writePad` already encodes the
matching rule for install order: **Timer (event 6) first, always** - Setup runs immediately in the
live VM and `gtt` is a no-op until the Timer event holds at least one stored action
(`_pad.ts:3908-3916`).

### Pitfall 5: a fractional argument silently becomes 0

Lua 5.5 with `LUA_FLOORN2I = F2Ieq`. `glp(a, 1, 127.5)` sets phase **0**. Close every division,
`math.sqrt` and `math.atan` with `// 1`. Dropping the `// 1` in a swirl gives every cell phase 0 and
the whole grid breathes in unison, which reads as broken hardware rather than broken arithmetic.

### Pitfall 6: colour channels are truncated, not clamped

`lua_tointeger` truncates to uint8, so 260 becomes 4 - a bright cell turns almost black with no
warning. Phase and index arguments *are* clamped/guarded, so off-grid brushes are free; colours are
not. Any knob that scales a channel needs a compile-time range check.

### Pitfall 7: `self.tim` and a stored Timer event

There is one timer slot per element. None of the ten candidates assigns `self.tim` in Setup, because
they all use a stored Timer (event 6). Never mix the two, and never install two watchdogs.

### Pitfall 8: the watchdog kills a genuinely motionless finger

Enqueue is change-gated, so a stationary contact emits nothing. The 2 s counters in RIBBON, LATTICE
and CHORUS are the recipe book's compromise. This is the top item for the hardware audition: hold a
chord dead still for three seconds and see whether it survives.

### Pitfall 9: `math.random` is real but weakly seeded

It is compiled in and seeded at VM start, but `luaL_makeseed` on ESP-IDF has little boot entropy, so
the same "random" field may recur after a power cycle. None of the ten uses it; the arithmetic
scatter `a*97%256` plus a rate mix is what makes Starfield never repeat.

---

## Environment availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node | The measuring harness and the Lua host in Vitest | yes | v24.14.0 | - |
| `@intechstudio/grid-protocol` at the pin | `compressScript` / `checkSyntax` | yes | 1.20260825.1135 | none - the pin is the measurement |
| `@wasm-fmt/lua_fmt` WASM | the above | yes | resolves in Node and in the production build (FOUND-05) | none |
| Vendored `_pad.ts` / `pad-sim.ts` | compile, cost, LED engine | yes | a0fb69d5, byte-pinned | none |
| `wasmoon` | route 1c | **not installed** | 1.16.0 available, MIT | route 1a (fallback) |
| `golden-frames.json` + `firmware-oracle.ts` | fidelity gates | yes | Phase 3 | none |
| A physical ZONA | the hardware audition rows | Botond has one; BOTOR's shelf can audition | - | none - HANGAR cannot install until Phase 7 |
| `grid-fw` clone (read-only) | firmware citations | yes | `Documents\Claude\grid-fw` | - |

**Missing with no fallback:** none.
**Missing with a fallback:** `wasmoon` - `npm install wasmoon` (one package, one transitive
`@types/emscripten`). If Wave 0's parity spec fails, fall back to route 1a and say so out loud in
the phase summary rather than shipping a hand-drawn preview.

---

## Validation Architecture

### Test framework

| Property | Value |
|---|---|
| Framework | Vitest 4.1.8 (`devDependencies`), node environment |
| Config file | `vite.config.ts`, `test.projects` = `server` + `sweep` |
| Quick run | `npm run test:quick` (`vitest run --project server`) |
| Full suite | `npm run test:unit -- --run` then `npm run test:e2e` |
| Sweep (per wave, not per task) | `npm run test:sweep` - 4,860 states, ~39 s |

### Phase requirements -> test map

| Req | Behaviour | Type | Automated command | File |
|---|---|---|---|---|
| CONT-02a | Every catalog entry's Setup and Timer are canonical: `compressScript(x) === x` | unit | `npx vitest run --project server src/lib/catalog/catalog.spec.ts -t canonical` | new |
| CONT-02b | Every entry's both events measure <= 908 **and** `max(raw, compressed) <= 908` | unit | `... -t budget` | new |
| CONT-02c | `GridScript.checkSyntax` is true for both events of every entry, after `padReady()` | unit | `... -t syntax` | new |
| CONT-02d | The whole knob cross-product of every entry stays <= 908 on both events | unit | `... -t "knob sweep"` | new |
| CONT-02e | Each entry runs its Setup and Timer in the Lua host with no error, and 200 ticks plus a scripted drag/tap/lift raise nothing | unit | `npx vitest run --project server src/lib/sim/lua-host.spec.ts` | new |
| CONT-02f | Each entry's rendered frame hashes match a recorded golden set at ticks [0, 37, 101, 500, 1009] | unit | `npx vitest run --project server src/lib/catalog/frames.spec.ts` | new |
| CONT-03 | Every entry has name, one-line description, >= 1 tag, a boolean `featured`, an `addedAt`, and 3..6 knobs each with a default | unit | `... -t metadata` | new |
| PREV-02 (Wave 0 gate) | The Lua host reproduces `PadSim`'s 243 layer records for all nine presets, and its frames hash-match `golden-frames.json` at all five ticks | unit | `npx vitest run --project server src/lib/fidelity/lua-parity.spec.ts` | new - **already written in the scratchpad and green** |
| PREV-05 | A dozen visible cards hold 30 fps with Lua cards among them | manual/e2e | Playwright canvas-pixel sampling, extended from Phase 4 | Phase 4's |
| TUNE-03 | Both meters read the entry's measured cost | e2e | `npm run test:e2e` | Phase 5's |
| Bundle | The Lua chunk is lazy: a cold catalog load fetches neither `glue.wasm` nor `lua_fmt_bg.wasm` | e2e | Playwright request interception against the **production build** | new |
| - | `vendored-diff.spec.ts` still green - nothing in `src/vendor/` moved | unit | `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts` | exists |

### Sampling rate

- **Per task commit:** `npm run test:quick`
- **Per wave merge:** `npm run test:unit -- --run` + `npm run test:sweep` + `npm run test:e2e`
- **Phase gate:** full suite green against the **production static build** (the FOUND-05 lesson:
  a WASM asset that resolves in dev can fail in `build/`), then `/gsd:verify-work`

### Wave 0 gaps

- [ ] `npm install wasmoon` (+ one `THIRD-PARTY.md` MIT entry, + `licenses` regeneration)
- [ ] `src/lib/sim/lua-host.ts` - wasmoon engine, the ~15 Grid stubs, the F2Ieq integer rule,
      `screenToHw`-correct `glag`, a touch FIFO with the change gate and 10-deep cap, a `gtt`
      deadline that re-arms before the body runs
- [ ] `src/lib/sim/lua-pad-sim.ts` - the `SimHost`-compatible wrapper over a blank fully-`owned:"user"`
      `PadSim`
- [ ] `src/lib/sim/ready.ts` - a **separate** memoised lazy gate, not fused with `padReady()`
- [ ] `src/lib/fidelity/lua-parity.spec.ts` - port the nine-preset cross-check (scratchpad:
      `xcheck/crosscheck.mjs` and `xcheck/frames.mjs`)
- [ ] `src/lib/catalog/` skeleton + `catalog.spec.ts` + `frames.json`
- [ ] Promote the measuring harness (scratchpad `measure.mjs`) as thin helpers over
      `src/lib/pad/index.ts`

### Hardware audition checklist (for Botond, on a real ZONA)

HANGAR cannot install until Phase 7, so these run through **BOTOR's shelf** (paste the compressed
Timer into event 6 first, then the Setup into event 0 - minimalist mode off).

| # | Config | What to check | Why it cannot be simulated |
|---|---|---|---|
| 1 | any | Store Timer first, then Setup. Confirm the pad starts moving within a second | `gtt` is a no-op until the Timer event holds a stored action |
| 2 | EUCLID | The three rings visibly run at different speeds and the 48-tick pattern repeats | Perceived polyrhythm |
| 3 | EUCLID / SONAR | Tap-to-toggle feels reliable, not double-triggering | Real T100 event codes, including the DOWNUP 9 fast tap |
| 4 | ARC | Sliding X accelerates the swirl **without a phase jump** | `glf` rate-only semantics on real hardware |
| 5 | ARC | The 3x3 heart pulse is visible at the chosen colour and brightness | Physical LED diffusion |
| 6 | GHOST | The replayed ghost runs at the speed you drew it | Timer drift under load |
| 7 | CHORUS / LATTICE | Hold a chord dead still for 3 s - does the 2 s watchdog cut it? | A motionless finger emits nothing; jitter is physical |
| 8 | LATTICE | The root lattice is legible at the dim colour chosen; raise it if not | Physical brightness of `0,25,50` after the /512 |
| 9 | MORPH | Corner brightness tracks the blend readably across the room | Perception |
| 10 | RIBBON | A fast sweep does not machine-gun notes; the rail keeps up | 100 Hz pop rate under a fast drag |
| 11 | MIRROR | **Does an inbound CC from the DAW move the bar at all?** If not, drop MIRROR | The one MEDIUM-confidence claim in this document |
| 12 | any | Leave a card running 15 minutes; confirm nothing freezes or strobes | The 655 s `glt` ceiling and pitfall 1 |

---

## Open questions

1. **Which six?** The recommendation is EUCLID, CHORUS, ARC, GHOST, LATTICE, MORPH, with SONAR,
   STEP, RIBBON as reserves and MIRROR blocked on hardware. Six is the CONT-02 floor, not a cap -
   all nine non-MIRROR candidates already fit and run. Ship more if the plan has room.

2. **Would you accept a HANGAR-authored patch into BOTOR?** Route 1b is the right long-term home for
   anything that should also appear on BOTOR's own shelf with knobs. It is priced above as
   ~22 code sites + ~30 test assertions per look, plus a gated re-sync (new upstream SHA,
   re-recorded manifest, re-captured baseline). Behavioural cards would additionally exhaust the
   3-bit `SEND_KINDS` field and force stamp format "e". **Recommendation: do not block Phase 8 on
   it.** If you want one, MORPH is the cheapest candidate to upstream (no Timer, one new SendKind).

3. **Does host MIDI-in reach `midirx_cb` on a ZONA?** Firmware says the path exists and `grxm(0,2)`
   is the correct enable. Nothing proves a USB host CC arrives with the right `instr`. One five-minute
   hardware test decides MIRROR's fate.

4. **Knob mechanism for hand-authored Lua.** Token substitution is recommended above. Confirm that
   TUNE-01's "one shared widget vocabulary" is satisfied by mapping Lua tokens onto the same
   widget kinds the compiler-driven cards use, rather than inventing Lua-specific controls.

5. **Stamp envelope for Lua entries.** SHARE-01/03 need a HANGAR-owned format that cannot be
   confused with BOTOR's `a`/`b`/`c`/`d`. A distinct leading character plus a length check is the
   cheapest fail-closed answer, but it is a Phase 5 seam this phase should not decide alone.

6. **Should the Lua host also become the preview for the nine ported presets?** It reproduces them
   exactly. Running everything through one engine would remove the `PadSim | LuaPadSim` branch
   entirely and make PREV-02 unambiguous - at the cost of making the 129 KB Lua chunk mandatory for
   the catalog rather than optional. **Recommendation: no.** Keep `PadSim` for the nine so a
   browse-only visitor downloads nothing extra, and keep the parity spec as the bridge.

---

## Sources

### Primary (HIGH confidence)

- `@intechstudio/grid-protocol@1.20260825.1135` - `dist/index.js:4400-4480` (`shortify`,
  `minifyScript`, `compressScript`, `checkSyntax`, `GridValidator.lookup`, 192 entries); executed,
  not read only.
- `src/vendor/botor/_pad.ts` @ `a0fb69d5` - `PadState` (:245), `LookKind`/`TouchKind`/`SendKind`
  (:161-185), `compile` (:2331), `measure` (:3041), `cost` (:3064), `fit` (:4089), `PRESETS`
  (:4214), `LOOK_KINDS`/`SEND_KINDS` stamp fields (:2577-2600, :2660-2690, :2840-2860), `writePad`
  Timer-first comment (:3898-3916).
- `src/vendor/botor/pad-sim.ts` @ `a0fb69d5` - "No Lua VM runs here" (:9), `screenToHw` (:65),
  `armLook` (:536), `rebuild` (:355), `tick` (:860), `ledTick` (:884), `runTimerBody` (:902),
  `render` (:1472), `frame` (:1451), `animating` (:1465), `layer`/`pokeLayer` (:1502-1556).
- `src/lib/fidelity/preset-baseline.json`, `golden-frames.json`, `golden-frames.spec.ts` (tick
  choice and regeneration protocol), `upstream-manifest.json`, `vendored-diff.spec.ts` (D-04).
- `scripts/capture-preset-baseline.mjs` - the read-only sibling discipline and the separate-module-
  instance formatter trap, reused by the harness.
- `intechstudio/grid-fw` @ `485b0d85` (read-only clone) - `grid_protocol.h:386-390` (`grxm` /
  `rx_mode` bitmask), `grid_decode.c:20-28` (`grid_rx_should_handle`), `grid_decode.c:439`
  (MIDIVOICE gate), `common/src/lua/decode.lua:19-23` (`pass_midi` -> `midirx_cb`),
  `common/src/lua/simplemidi.lua:81-140` (the `gmrr` wrapper and its `header[1] == 13` filter),
  `grid_protocol.h:370` (`gtt`), `:836` (`txma`).
- `zona-docs/docs/ZONA_RECIPES.md` (110 KB, the recipe book) - sections 0.1-0.9, Parts A/B/C, D2's
  budget ledger, D3's shrinking table. Every number there was measured against this same minifier;
  A5's 75 was reproduced exactly by the harness built for this research, which validates the harness.
- The user's `project_zona_module_config.md` memory - hardware-confirmed orientation, the touch/LED
  axis agreement, the Timer keeper, `touch_pop`, the rate scale (2.56/fre s per revolution), the
  `glf` rate-only finding, the HID same-cycle click bug, the traps list.
- **Measurements made for this document**, all reproducible from
  `.../scratchpad/{measure,candidates,report,canon}.mjs` and `.../scratchpad/{luavm,xcheck}/`:
  the ten-candidate budget table, the ten-candidate execution run, the nine-preset 243-record
  cross-check, the nine-preset five-tick frame cross-check, `compressScript` idempotence, the
  comment-survives measurement, wasmoon/lua_fmt transfer sizes.

### Secondary (MEDIUM confidence)

- npm registry metadata for `wasmoon@1.16.0` (MIT, 458 KB unpacked, published 2026-04-25) and
  `fengari@0.1.5` (MIT, 1.64 MB, 2025-12-26) - registry-reported, not audited.
- Lua 5.3/5.4/5.5 equivalence over the subset the configs use - reasoned from the language's own
  change history, not differentially tested against a 5.5 build. Mitigated by restricting the
  catalog to that subset.

### Tertiary (LOW confidence - flagged for validation)

- That host MIDI over USB reaches `midirx_cb` on a ZONA with `grxm(0,2)`, and which `instr` it
  carries. Firmware shows the path; nothing shows the traffic. Blocks MIRROR only.
- The exact perceptual reading of every colour choice above. Every RGB triple is a starting point
  for the hardware audition, not a measured result - one layer caps at 49.6% and there is no gamma
  correction anywhere in the WS2812 path.

---

## Metadata

**Confidence breakdown**

| Area | Level | Reason |
|---|---|---|
| Budget numbers | HIGH | Measured with the pinned minifier; harness independently validated against the recipe book's published ledger |
| Candidate correctness | HIGH | All ten executed in a real Lua VM; musical behaviour asserted per candidate |
| Route 1c feasibility | HIGH | Built and cross-checked: 243/243 layer records and 5/5 frame hashes on all nine presets |
| Route 1b cost | MEDIUM | Site counts are measured; the re-sync effort is estimated from the D-01/D-04/D-11a gate machinery |
| Lua 5.4 vs 5.5 | MEDIUM | Reasoned over a restricted subset, not differentially tested |
| MIDI-IN (MIRROR) | LOW-MEDIUM | Firmware path verified; hardware traffic unverified |
| Colour and perception | LOW | Hardware audition required |

**Research date:** 2026-09-04
**Valid until:** 2026-10-04 for the ecosystem claims (wasmoon versions). The budget numbers are
valid for as long as `@intechstudio/grid-protocol` stays at `1.20260825.1135` and the vendored
compiler stays at `a0fb69d5` - a bump of either invalidates the table and must re-run the harness.
