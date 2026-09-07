# HANGAR catalog surface

**Researched:** 2026-09-07
**Question answered:** how is a catalog entry born, what does it touch, and what does adding twenty
more cost?
**Method:** read-only. Every file cited was read; every number below was either read out of the
source, measured on this machine, or computed from the source by script. Where a number is a
projection it says so.
**Confidence:** HIGH for sections 1-3 (all direct source reads). MEDIUM for section 4's projections
(the scaling model is arithmetic over measured per-entry costs; the browser-side numbers are
projections, not measurements). HIGH for section 5 (Phase 8's own decision records).

---

## 0. Orientation

The catalog is one directory, `src/lib/catalog/`, and it is deliberately split into a **heavy half**
and a **light half**. The split is the single most load-bearing fact about the whole surface, and
every checklist item in section 3 exists because of it.

| Module | Weight | Why |
|---|---|---|
| `src/lib/catalog/index.ts` + `entries/*.ts` | **HEAVY** | `entries/ported.ts:13` imports `../../../vendor/botor/_pad`, which imports `@intechstudio/grid-protocol` at module scope — a 131,101-byte chunk. |
| `src/lib/catalog/types.ts` | light | asserted to import nothing but an erased `import type` (`types.ts:22`). |
| `src/lib/catalog/front-door.ts` | **zero imports** | `front-door.spec.ts:250-289` scans the source and fails on any specifier. |
| `src/lib/catalog/listing.ts` | **one erased `import type`** | `listing.spec.ts:294-346` scans the source; every specifier must sit on an `import type` line. |

`front-door.ts` and `listing.ts` therefore **restate** each entry's name, description, tags,
`featured`, `addedAt`, `restsBlack` and `preview` as literals, and their specs hold those literals
against `CATALOG` field-by-field in both directions (`front-door.spec.ts:100-117`,
`listing.spec.ts:109-145`). This is called out in the source as "the `src/lib/protocol-pin.ts`
pattern" — a literal held against another source by a spec, rather than an import that costs a chunk
(`listing.ts:5-26`, `front-door.ts:4-22`).

**Consequence for a new entry: every entry is declared three times** — once in `entries/<id>.ts`,
once in `LISTING`, once in `EXCLUDED_FROM_ROW` (or `FRONT_DOOR`). All three are gated. There is no
way to add one and only touch one file.

---

## 1. The sixteen shipped entries

`CATALOG` is `[...PORTED, EUCLID, CHORUS, ARC, GHOST, LATTICE, MORPH, SONAR]`
(`src/lib/catalog/index.ts:36-45`). Nine preset-driven, seven hand-authored Lua. Sixteen total.

### 1a. The nine compiler-driven entries (`source.kind === "preset"`, `preview: "padsim"`)

Built by `PORTED_META.map(...)` at `entries/ported.ts:87-112`. `name` and `description` are **read**
off the vendored shelf via `presetById` — never restated — so a BOTOR re-sync that renames a card
shows up here (`ported.ts:3-7`, asserted by `catalog.spec.ts:104-121`). What HANGAR owns is the
table at `ported.ts:30-85`: tags, `featured`, `restsBlack`. All nine share `addedAt: "2026-09-02"`
(`ported.ts:20`). All nine carry `knobs: []` and `defaults: {}` (`ported.ts:108-109`) — compiler
knobs live in `src/lib/tune/knobs.preset.ts`, not in the catalog, and `catalog.spec.ts:156-161`
makes a non-empty `knobs` on a preset entry a failure.

Costs are the vendored `PadPreset.cost` literals (`_pad.ts:4214-4385`), measured by BOTOR's own
compiler at the pinned protocol and independently re-captured in
`src/lib/fidelity/preset-baseline.json`.

| id | name | route | Setup | Timer | free (worst event) | featured | front door | restsBlack | tags | what it does |
|---|---|---|---|---|---|---|---|---|---|---|
| `aurora` | Aurora | preset | 250 | 55 | 658 | ✅ | slot 0 (centre) | no | ambient, flowing, colour | A band of light crosses the pad and your finger drags a glowing tail behind it. |
| `pinwheel` | Pinwheel | preset | 305 | 55 | 603 | ✅ | slot 1 | no | rotating, multi-touch, colour | A swirl turns around the centre; each finger paints in its own colour. |
| `starfield` | Starfield | preset | 238 | 55 | 670 | ✗ | slot 3 | no | ambient, generative, calm | Every LED shimmers at its own pace, so the field never repeats. |
| `radar` | Radar | preset | 438 | 55 | 470 | ✗ | slot 5 | no | rippling, xy-control, hypnotic | Rings roll outward from the centre while the pad sends finger X/Y to the host. |
| `joystick` | Joystick | preset | 535 | 24 | 373 | ✗ | slot 4 | no | expressive, pitch-bend, sprung | A sprung synth stick: X is pitch bend, Y a mod amount that falls to zero on lift. |
| `ninepads` | Nine pads | preset | 580 | 158 | 328 | ✅ | slot 2 | no | drums, playable, grid | Nine drum zones drawn in light, one note each, the held zone lit. |
| `faders` | Four faders | preset | 513 | 24 | 395 | ✗ | slot 6 | no | mixing, readable, rails | Four faders with white rails and coloured levels readable across a room. |
| `dial` | Dial | preset | 646 | 55 | 262 | ✗ | slot 7 | no | endless, gestural, precise | Circling a finger turns the pad into an endless encoder sending relative delta. |
| `tpad` | Trackpad | preset | **902** | 146 | **6** | ✗ | **excluded** | **yes** | desktop, pointer, utility | One finger moves the pointer, two scroll, a tap clicks, two fingers tapping right-click. |

`tpad` is the tightest configuration in the repository at **902 of 908** — six characters free.
It is also `exclusive: true` on the shelf (`_pad.ts:4419-4423` region) and writes no LEDs at all,
which is why it is the one preset entry with `restsBlack: true` and the one excluded from the
front-door row for being a black square (`front-door.ts:61-64`).

### 1b. The seven hand-authored Lua entries (`source.kind === "lua"`, `preview: "lua"`)

All seven carry `addedAt: "2026-09-04"`. Costs below are the **rendered** lengths (tokens
substituted), computed from the entry sources on 2026-09-07 and matching each file's own header
prose exactly; the cross-product corners are the all-longest and all-shortest knob settings, which
`lua-entries.spec.ts:365-442` proves are the extremes.

| id | name | knobs | Setup @def | Timer @def | worst corner | free at worst | featured | front door | restsBlack | tags |
|---|---|---|---|---|---|---|---|---|---|---|
| `euclid` | EUCLID | 6 | 702 | 218 | 706 / 221 | 202 | ✅ | excluded | no | polyrhythm, generative, drums, playable |
| `chorus` | CHORUS | 6 | 729 | 173 | 733 / 174 | **175** | ✅ | excluded | no | chords, harmonic, blooming, playable |
| `arc` | ARC | 5 | 379 | 251 | 382 / 253 | 526 | ✅ | excluded | no | modulation, hands-free, hypnotic, gestural |
| `ghost` | GHOST | 5 | 305 | 333 | 308 / 337 | 571 | ✗ | excluded | **yes** | looper, automation, gestural, generative |
| `lattice` | LATTICE | 6 | 615 | 171 | 618 / 172 | 290 | ✅ | excluded | no | isomorphic, playable, still, instrument |
| `morph` | MORPH | 5 | 507 | **0 (no Timer)** | 510 / 0 | 398 | ✅ | excluded | **yes** | macros, blend, readable, expressive |
| `sonar` | SONAR | 5 | 432 | 279 | 433 / 282 | 475 | ✗ | excluded | no | radial, sequencer, polar, hypnotic |

EUCLID's worst corner (706 / 221) is not written down anywhere in the repository — its header states
only the defaults (`entries/euclid.ts:13-20`). Every other entry's header states its corner. Worth
adding if euclid.ts is ever revised.

One sentence each, from the entry headers:

- **EUCLID** (`entries/euclid.ts:1-26`) — three concentric square rings of 8, 16 and 24 cells run
  Euclidean patterns at their own speeds and beat against each other on a 48-tick cycle; tap a step
  to toggle it.
- **CHORUS** (`entries/chorus.ts:1-38`) — nine 3x3 pads each fire a whole diatonic triad, and an
  amber bloom expands outward from the pad you hit, driven entirely by the LED engine's own
  phase-from-start argument.
- **ARC** (`entries/arc.ts:1-46`) — slide to set an LFO's rate and depth, lift, and it keeps sending
  CC; the whole-pad swirl's rotation speed *is* the LFO rate, because `glf` is a rate-only setter.
- **GHOST** (`entries/ghost.ts:1-41`) — drag once and the Timer records your path at 50 Hz; lift and
  a ghost retraces it forever in a second colour, still sending an X/Y CC pair.
- **LATTICE** (`entries/lattice.ts:1-46`) — an isomorphic note grid tuned in fourths over a static
  three-tone scale map, so every chord shape is the same shape in every key.
- **MORPH** (`entries/morph.ts:1-56`) — four corner macros bilinearly blended by one finger, each
  corner's brightness its own weight; **the only entry with no Timer event at all** (`timer: ""` at
  `entries/morph.ts:65`).
- **SONAR** (`entries/sonar.ts:1-55`) — a sweep line rotates through 16 angle buckets and fires the
  cells you armed; ring is pitch, angle is time.

### 1c. Featured vs. front door — the premise correction

The brief asks which five are "featured on the front door". Those are two different flags and they
do not overlap the way the phrasing implies:

- **Eight entries carry `featured: true`**, not five: `aurora`, `pinwheel`, `ninepads` (preset) and
  `euclid`, `chorus`, `arc`, `lattice`, `morph` (Lua). Asserted at `sort.spec.ts:127`. `featured`
  drives only the browse toolbar's default FEATURED sort (`src/lib/browse/sort.ts:29`) and the
  card's "Featured" mark. **The five featured Lua entries are the five referred to.**
- **The front door's coverflow ring is `FRONT_DOOR`, eight entries, and every one of them is
  preset-driven** (`front-door.ts:126-196`). `front-door.spec.ts:110-112` asserts
  `entry.preview === "padsim"` for every row member, so **no Lua entry can join the row today**.
- Ring order is `aurora, pinwheel, ninepads, starfield, joystick, radar, faders, dial`
  (`front-door.ts:99-108`). Index 0 opens as the centre and the ring wraps.
- All eight Lua entries and `tpad` sit in `EXCLUDED_FROM_ROW` with a one-line `why`
  (`front-door.ts:60-93`). Seven of the eight reasons are the same sentence: *"The front door is a
  curated row; new configurations join it deliberately, not by arriving in the catalog."*

**Mounted coverflow cards are bounded independently of catalog size.** `MAX_SLOT = 3`
(`src/lib/coverflow/slots.ts:16`) and `radiusForWidth` returns 3 / 2 / 1 by breakpoint
(`slots.ts:71-75`), so at most **7 pads are mounted on desktop, 5 on tablet, 3 on phone** no matter
how long the ring gets.

**Every one of the sixteen has a real prerendered page** at `/c/<id>/`, generated from `ROUTED`
(`src/routes/c/[id]/+page.ts:35-37`), and an OG image at `static/og/<id>.png`
(`scripts/gen-og.mjs:106`). `ROUTED === LISTING` today (`listing.ts:316`), and the reason it is a
separate export is written down at `listing.ts:299-315`: four files need "the entries with an
address" and three of them deciding it independently is three chances to ship a page whose
`og:image` 404s with nothing red.

---

## 2. The two authoring routes

### 2a. The compiler route — `src/vendor/botor/_pad.ts` (read-only, never edited)

**Shape.** A `PadPreset` (`_pad.ts:4177-4188`) is `{ id, name, sentence, category, knobs: KnobKind[],
exclusive?, quiet?, state: PadState, cost: { setup, timer } }`. It is built by the module-private
`preset()` factory (`_pad.ts:4189-4212`), which starts from `defaultState()`, applies a mutator, sets
`state.preset = id` and runs `normalisePadState`.

**The nine presets** are `PRESETS` (`_pad.ts:4214-4385`), in three categories: `looks`
(aurora, pinwheel, starfield), `instruments` (radar, joystick, ninepads, faders, dial), `computer`
(tpad). `presetById` is the lookup (`_pad.ts:4386-4388`).

**D-09 forbids extending it.** `catalog.spec.ts:123-131` asserts `PRESETS.length === 9` and that the
catalog carries all nine exactly once; `catalog.spec.ts:133-145` asserts no non-preset entry may take
a shelf id. `src/lib/fidelity/vendored-diff.spec.ts` holds the vendored files byte-pinned. **A new
configuration therefore cannot be a new preset.** The only two remaining `CatalogSource` kinds are
`state` (an arbitrary `PadState`, currently unused by any shipped entry) and `lua`.

**Preset knobs.** `PadPreset.knobs` is a list of `KnobKind` strings, not values — the twelve-member
union at `_pad.ts:4143-4176` (`colour`, `speed`, `direction`, `size`, `count`, `note`, `feel`,
`amount`, `mode`, `bend`, `spring`, `scale`). Each preset exposes 2-4 of them; e.g. aurora is
`["colour","speed","direction","size"]`, faders is `["note","amount"]`. The actual option lists live
in `src/lib/tune/knobs.preset.ts` (Phase 5), reached through `compilerKnobs`
(`src/lib/share/stamp.ts:115-119`).

**There is no `compilePreset` in `_pad.ts`.** The brief's name refers to HANGAR's own wrapper:

```
src/lib/pad/index.ts:55   compilePreset(id: string, user?: PadUserCode): Promise<CompileResult>
```

It `await padReady()` first (the FOUND-05 WASM gate, `src/lib/pad/ready.ts:25-34`), resolves the
preset, and delegates to the vendored `compile(state, user)` (`_pad.ts:2331`). `CompileResult`
(`_pad.ts:2300-2310`) is `{ state, plan, stamp, setup: PadAction[], timer: PadAction[], setupLua,
timerLua, timerPeriodMs, seams }`. The whole HANGAR compile/cost/fit/measure/validate surface is
`src/lib/pad/index.ts:55-125`; every entry point awaits the gate, and nothing else in HANGAR imports
the vendored measuring functions.

**How a preset becomes an entry:** it does not compile at all in the catalog path. `previewFor`
(`types.ts:97-99`) maps `kind: "preset"` to `preview: "padsim"`, and `createEngine`
(`src/lib/sim/engine.ts:117-128`) builds `new PadSim(preset.state)` — a synchronous constructor over
a `PadState`, **never over Lua**. `src/lib/pad/index.ts:14-17` states the rule explicitly: PadSim is
deliberately not behind the WASM gate, so the catalog never waits on 628 KB to draw a frame. Lua is
only produced when someone installs (Phase 7) or measures a budget.

**The reachable configuration space.** `PRESETS` is nine fixed states, and the knob racks move each
one within `PadState`. The `sweep` project measures it: **32,852 states** across the nine presets,
every one costed, none over 908 (`src/lib/tune/reachability.sweep.spec.ts:30-36, 132`). That
cross-product is the whole compiler-route space that a visitor can reach — and it is closed, because
new presets are forbidden.

### 2b. The Lua route — hand-authored source through wasmoon

**What an entry provides.** Exactly three things beyond the shared metadata
(`src/lib/catalog/types.ts:30-33, 48-61`):

1. `source: { kind: "lua", setup: string, timer: string }` — two Lua **templates** with `@TOKEN`
   placeholders. `timer: ""` means "no Timer event", which is not the same as an empty Timer:
   firmware's `gtt` is a no-op until the Timer event holds a stored action, and
   `createLuaPadSim` maps `""` onto `undefined` for the host (`lua-pad-sim.ts:197-217`).
2. `knobs: LuaKnob[]` — 3 to 6 of them (`catalog.spec.ts:163-171`). Each is
   `{ id, label, kind: KnobKind, token, values: string[], default: number }` where `default` is an
   **index into `values`**, never a value (`types.ts:48-61`). `kind` must come from the vendored
   `KnobKind` union; `KNOB_KINDS` (`types.ts:105-118`) is the runtime list and
   `types.ts:123-126` is a compile-time exhaustiveness assertion against the vendored union.
3. `defaults: Record<string, number>` — the same indices keyed by knob id, asserted to agree with
   the knobs (`catalog.spec.ts:204-223`).

**The shape the Lua must take.**

- Both strings open with the nine-character event marker `--[[@cb]]`. It is a Lua **block** comment,
  which is what lets `lua-host.ts:64-66` wrap the Timer body in `function() ... end` safely.
- **Canonical compressed form.** `GridScript.compressScript(rendered) === rendered` for both events,
  at the defaults and at every point of the knob sweep (`lua-entries.spec.ts:192-217, 428-430`).
  Reason: `cost()` charges `max(compressed, raw)`, so a readable indented version would be charged
  its raw length and the budget meter would lie.
- **No comments beyond the marker.** `compressScript` does not strip them; a trailing comment was
  measured surviving verbatim into the budget (`entries/euclid.ts:22-25`).
- **Restricted subset.** `lua-entries.spec.ts:90-147` forbids `math.random`, `string.`, `os.`, `io.`,
  `require`, `dofile`, `loadfile`, `setmetatable`, `getmetatable`, `rawget`, `rawset`, `goto` and the
  `::` label syntax — each with a stated reason (absent from the firmware build, or
  version-variable). `math.*` is allow-listed to `atan, sqrt, abs, max, min, floor, tointeger`
  (`lua-entries.spec.ts:151-159`).
- **Token grammar** `^@[A-Z][A-Z0-9_]*$`, and **no token may be a prefix of another in the same
  entry** (`catalog.spec.ts:178-187`). `renderLua` substitutes by plain `String.replaceAll`, so
  `@TRAIL` inside `@TRAILC` renders the colour as `42C`. This bit twice in one plan; MORPH's
  trail-length token is `@DECAY` and SONAR's sweep-period token is `@PERIOD` for exactly this reason
  (`entries/morph.ts:36-40`, `entries/sonar.ts:29-35`).
- **No knob value may itself look like a token** (`lua-entries.spec.ts:318-324`).
- **Every token must appear in at least one event** (`lua-entries.spec.ts:305-311`).

**What the simulator needs to animate it.** Route 1c: a real Lua 5.4 VM driving the vendored PadSim's
firmware LED engine.

| Module | Job |
|---|---|
| `src/lib/sim/ready.ts:58-67` | `luaReady()` — memoised `LuaFactory`, behind a **dynamic** `import("wasmoon")`. The **only** module in HANGAR allowed to name the package. |
| `src/lib/sim/ready.ts:49-55` | `glueWasmUri()` — in a browser, hands wasmoon an explicit `new URL("wasmoon/dist/glue.wasm", import.meta.url)`; without it wasmoon silently fetches from unpkg. Under Node it returns `undefined` so emscripten resolves off disk. |
| `src/lib/sim/lua-host.ts` | `LuaHost` — the Grid API, the touch FIFO, the timer, the MIDI/HID logs, `restart()`. |
| `src/lib/sim/lua-pad-sim.ts:83-102` | `renderLua(entry, knobs?)` — **pure**, no VM, no await. Token substitution only. |
| `src/lib/sim/lua-pad-sim.ts:105-217` | `LuaPadSim` + `createLuaPadSim` — the `SimEngine` wrapper. |
| `src/lib/sim/engine.ts:102-115` | `createEngine(entry)` — picks the route by `entry.preview`; the Lua branch is a **dynamic** import so a page of ported entries never carries the VM's module graph. |

The wrapped `PadSim` is built from `blankPadState()` (`lua-pad-sim.ts:48-50`), which sets every
`PadSlot` to `"user"`. With every slot user-owned, `PadSim.rebuild` arms nothing and `sim.tick()`
degenerates to "grid_led_tick, then render" — exactly the half a Lua host wants
(`lua-host.ts:15-20`).

**The Grid API a hand-authored entry may call** (`lua-host.ts:162-217`), and nothing else — an
unlisted call surfaces as a Lua "attempt to call a nil value" rather than a silent no-op:

- LEDs: `glag(slot, n)`, `glc(a,l,r,g,b,k)`, `glp(a,l,p)`, `glf(a,l,f)`, `gls(a,l,s)`,
  `glt(a,l,t)`, `glpfs(a,l,p,f,s)`, `glim(v,lo,hi)`
- Timer: `gtt(slot, ms)`
- Bare globals: `grxm(slot, mode)`, `txma(v)`, `tyma(v)`, `gmms(...)`, `gmbs(...)`, `gks(...)`
- Via `self:` only (`lua-host.ts:141-152`): `self:gms(ch, cmd, p1, p2, mode)`, `self:grxm`,
  `self:txma`, `self:tyma`, `self:touch_pop()`, `self:tid()`, `self:tev()`, `self:txv()`, `self:tyv()`
- The entry assigns `self.touch_cb = function(s, i, e, x, y) ... end`; a Lua-side dispatcher reads
  the field at call time, installed **after** Setup (`lua-host.ts:157-162, 276-281`).

Four firmware traps the host models, each of which an author must know:

- `glag` is **not** the identity — even rows are mirrored (`lua-host.ts:249-261`, `screenToHw`).
  An identity stub moves 40 of 81 cells.
- **F2Ieq**: a fractional argument does not round or truncate, it becomes **0**
  (`lua-host.ts:98-113`). `glp(a, 1, 127.5)` stores phase 0.
- Colour channels **truncate, never clamp** (`lua-host.ts:115-125`): 260 renders as 4. Every colour
  knob in the shipped seven keeps all channels inside 0..255 by construction, and each entry says so.
- Event codes: 1 MOVE, 4 DOWN, 5 UP, **9 TAP** — a sub-cycle press-and-lift coalesced into one
  message with no separate down or up (`lua-host.ts:68-76`). `e ~= 4 and e ~= 9` is the tap-only
  filter; `e == 3 or e >= 5` is lift-only. Both shapes ship.

**The keeper pitfall, mechanically excluded.** `glt(a, L, 65535)` on a layer carrying a decaying
trail replaces the countdown, the decay rate wraps past zero and the cell strobes forever. Three
draft configurations shipped that bug during research. `lua-smoke.spec.ts:60-62, 264-294` samples
every layer record on **every** tick and fails on the signature "timeout ≥ 64511 together with decay
rate ≥ 200". ARC's two legitimate `glt(a,2,65535)` keepers sit three orders of magnitude below the
rate floor and are documented as "do not fix this" (`entries/arc.ts:16-31`).

**Knobs on the Lua route reach the tune panel unchanged.** `luaKnobs`
(`src/lib/tune/knobs.lua.ts:44-56`) renames `values` → `options` and drops `token`; the panel cannot
tell the two routes apart. A hard ceiling applies: **`STAMP_OPTION_CEILING = 32`**
(`knobs.lua.ts:35`) — D-13 encodes a knob position as one base-32 character, and a 33rd option would
truncate silently and land a shared link on the wrong position. Today's widest knob is 16 (MIDI
channel, on both routes).

**A Lua entry has no `PadState`.** `baseStateFor` throws `NoPadStateError` for
`source.kind === "lua"` (`src/lib/tune/state.ts:108-117`), and `createEngine` documents that
`knobs` are ignored for a padsim entry rather than half-applied (`engine.ts:90-101`). The uniform
answer to a state change on either route is **construct a new engine**, not `setState` — D-08 was
amended for this and the reasoning is written into `engine.ts:11-31`.

---

## 3. The checklist for adding one entry

Assume a hand-authored Lua entry, since that is the only route open (§2a).

### Files that must change

| # | File | Change | Gate that catches omission |
|---|---|---|---|
| 1 | `src/lib/catalog/entries/<id>.ts` | **new** — the two canonical Lua strings, 3-6 knobs, `defaults`, tags, `featured`, `addedAt`, `restsBlack`, `preview: previewFor(SOURCE)` | — |
| 2 | `src/lib/catalog/index.ts` | import + append to `CATALOG` (`index.ts:36-45`) + a named re-export (`index.ts:47-53`) | nothing catches a *missing* entry here; everything downstream keys off `CATALOG` |
| 3 | `src/lib/catalog/listing.ts` | append a `ListingEntry` restating **id, name, description, motion, tags, featured, addedAt, restsBlack, preview**, plus `quiet` if not animated | `listing.spec.ts:96-165` (both directions, field by field) |
| 4 | `src/lib/catalog/front-door.ts` | append `{ id, why }` to `EXCLUDED_FROM_ROW` (D-18) — **or** join `FRONT_DOOR`, which today requires `preview === "padsim"` | `front-door.spec.ts:125-157` and `listing.spec.ts:257-292` both assert the **partition** of the catalog |
| 5 | `src/lib/catalog/frames.json` | regenerate: `UPDATE_FRAMES=1 npx vitest run --project server src/lib/catalog/frames.spec.ts` — it rewrites, runs `prettier --write`, then **fails by design** (`frames.spec.ts:22-24, 117, 124-128`) | `frames.spec.ts:123-138` — "covers every catalog entry, and only catalog entries" |
| 6 | `docs/HARDWARE-AUDITION.md` | the entry's **name** must appear in some row's Config column; the "The seven, and what they cost" table (`docs/HARDWARE-AUDITION.md:65-77`) goes stale | `audition.spec.ts:260-278` (every Lua entry is auditioned) — see the hard-coded `ROW_COUNT` note below |
| 7 | `docs/TESTING.md` | the catalog table at `docs/TESTING.md:278-300` and the browse table at `:493-510` state counts and wall times | not gated; drifts silently |

### Files that need **no** change (single-declaration by design)

- `src/routes/c/[id]/+page.ts` — `entries()` maps `LISTING` (`+page.ts:35-37`).
- `scripts/gen-og.mjs` — loops `ROUTED` (`gen-og.mjs:94, 106`). It writes `static/og/<id>.png`
  automatically as part of `npm run build`. Three gates fire per image: engine-buildable
  (`gen-og.mjs:114-126`), non-dark unless `restsBlack` (`:141-157`), under 1 MB (`:163-175`).
- `src/lib/og/build.spec.ts:208, 295` and `e2e/artifacts.e2e.ts:69-73` — both read `ROUTED`; their
  non-vacuity floors are `>= 16`, so they survive growth.
- `src/routes/browse/+page.svelte`, `BrowseGrid.svelte`, `CatalogCard.svelte` — all data-driven.
- `src/lib/sim/*`, `src/lib/tune/*`, `src/lib/share/stamp.ts` — all loop over `CATALOG`.

### Gates that must stay green (and whether their counts move)

**Counts that do NOT move.** This is a deliberate design property, recorded at
`docs/TESTING.md:294-300` and enforced by D-17 / `scripts/check-counts.mjs`: every catalog gate
loops over `CATALOG` *inside* a single `it`, never through `it.each`.

| Spec | Tests | Entry-count-agnostic? |
|---|---|---|
| `src/lib/catalog/catalog.spec.ts` | 10 | ✅ (`catalog.spec.ts:22-27` says so explicitly) |
| `src/lib/catalog/lua-entries.spec.ts` | 6 | ✅ (`lua-entries.spec.ts:4-8`) |
| `src/lib/catalog/frames.spec.ts` | 5 | ✅ — but `frames.spec.ts:187` hard-codes `ported.length === 9`, which is stable |
| `src/lib/catalog/front-door.spec.ts` | 8 | ✅ — asserts the partition, never a count (`front-door.spec.ts:130-133`) |
| `src/lib/catalog/listing.spec.ts` | 5 | ✅ |
| `src/lib/sim/lua-smoke.spec.ts` | 3 | ✅ |
| `src/lib/sim/lazy.spec.ts` | 3 | ✅ |
| `src/lib/fidelity/lua-parity.spec.ts` | 5 | ✅ — pinned to the **nine presets**, untouched by new Lua entries |
| `src/lib/config-shape.spec.ts` | 14 | ✅ — an import-graph guard; it names `build/c/euclid/index.html` (`:614`) as a representative off-row page |
| `src/lib/tune/surprise.spec.ts` | — | ✅ — `toBe(9)` at `:80` counts **preset** entries only |
| `src/lib/share/stamp-roundtrip.sweep.spec.ts` | — | ✅ — `toBe(9)` at `:123` counts preset entries only |
| `src/lib/tune/reachability.sweep.spec.ts` | 2 | ✅ — `racked()` at `:109-112` filters to `preview === "padsim"` with knobs; a Lua entry never enters the sweep |
| `e2e/browse.e2e.ts` (11 chromium) | 11 | ✅ — every expectation derives from `LISTING` (`browse.e2e.ts:18-25`) |
| `e2e/browse-webkit.e2e.ts` | 11 | ✅ |
| `e2e/catalog.e2e.ts` | 2 | ✅ — the `/dev/catalog/` probe picks the first entry of each preview kind |

**Counts and literals that DO move — the update list for N new entries:**

| Location | Hard-coded today | What N new entries do |
|---|---|---|
| `src/lib/browse/filter.spec.ts:107` | `LISTING.length === 16` | → `16 + N` |
| `src/lib/browse/filter.spec.ts:232` | `41 distinct tags` | recount |
| `src/lib/browse/filter.spec.ts:234-236` | `NINE_CHIPS` list + counts `[4,3,3,3,2,2,2,2,2]` | the standing chip row is derived (`filter.ts:121-125`: tags carried ≥ 2×, count-desc then name) and **will reshuffle** |
| `src/lib/browse/filter.spec.ts:247` | `32 singletons` | recount |
| `src/lib/browse/filter.spec.ts:140, 170, 181` | `drums` → `["ninepads","euclid"]`, `generative` → 3, `gestural` → 3, `ghost` → 1 | any new entry reusing those tags or containing "ghost"/"drums" in its text breaks these |
| `src/lib/browse/sort.spec.ts:59, 83, 102, 110, 112, 146, 167` | `16`, `3 * 16 * 15` | → `16+N`, `3*(16+N)*(15+N)` |
| `src/lib/browse/sort.spec.ts:127` | `eight are featured` | recount |
| `src/lib/browse/sort.spec.ts:155-160` | `seven newest (2026-09-04) then nine older (2026-09-02)` | a third `addedAt` date creates a **third block**; this assertion must be restructured |
| `src/lib/browse/sort.spec.ts` NAME sequence | the written-out code-point order | recompute |
| `src/lib/catalog/audition.spec.ts:52` | `ROW_COUNT = 12` | rows can be **grouped** (`"EUCLID / SONAR"` is one row, `audition.spec.ts:120-128`), so 20 entries need not mean 20 rows — but the doc must name every one and `ROW_COUNT` must match |
| `src/lib/catalog/audition.spec.ts:55` | `LUA_FLOOR = 6` | a floor; safe |
| `src/lib/tune/view.spec.ts:165` | `railSkin(16) === "track"` | keyed on the widest knob arity (MIDI channel, 16); safe unless a wider knob ships — and `STAMP_OPTION_CEILING` caps it at 32 |
| `src/lib/og/build.spec.ts:215`, `e2e/artifacts.e2e.ts:69` | `>= 16` | floors; safe |

**Also non-negotiable, and easy to miss:**

- `catalog.spec.ts:54-57` — description **≤ 110 characters**, one line, non-empty.
- `catalog.spec.ts:62-66` — every tag matches `^[a-z][a-z0-9-]*$`.
- `e2e/browse.e2e.ts:258-263` — **no two configurations may share a description**.
- `listing.spec.ts:243-250` — any `restsBlack` entry must carry `RESTS_DARK_NOTE`
  (`listing.ts:65-66`) **verbatim** as its `quiet` line.
- `listing.spec.ts:204-208` — all three motions (`animated`, `static`, `dark`) must still occur.
- `frames.spec.ts:214-234` — `restsBlack` is proved **in both directions** against the fixture.
- `npm run check` (svelte-check), `npm run lint` (prettier + eslint), `npm run build` (which runs
  `gen-og.mjs` first — see `package.json:11`).
- `git diff --stat HEAD -- src/vendor/` must print nothing.

**Ordering that matters:** `gen-og.mjs` runs **before** `vite build` because `vite build` copies
`static/` into `build/` (`gen-og.mjs:6-11`). And `npm run test:quick` must be run **after** a build,
because `config-shape.spec.ts` test 14 and `og/build.spec.ts` tests 1, 4 and 5 read `build/`
(`docs/TESTING.md:34-38`).

---

## 4. The cost of twenty

Baseline (Phase 7 gate, `docs/TESTING.md:20-27`): `test:quick` 73 files / 776 tests / 31 s;
`test:sweep` 3 files / 13 tests / 118 s; `test:e2e` 89 tests / 112 s. Re-measured single-file on
2026-09-07 on this machine.

### 4a. The browse page's payload

**The Lua VM already arrives on a cold `/browse/`, and that is correct.** The default sort is
FEATURED (`src/lib/browse/sort.ts:29`), five of the eight featured entries are Lua, so the first
screenful holds several Lua cards and the VM is fetched immediately. `e2e/browse.e2e.ts:707-722`
says so in terms: *"Do not 'simplify' this to a bare `/browse/`: it goes red for a good reason."*
The honest claim the suite tests is the filtered one — `?q=aurora` leaves one padsim card and
fetches **zero** WebAssembly.

Measured on the current `build/`:

| Thing | Now (16) | Per entry | At 36 |
|---|---|---|---|
| `build/browse/index.html` | **34,041 B** | ~1,170 B of prerendered card HTML (2 `card-` markers × 585 B avg) | ~**57,400 B** (+69%) |
| Listing chunk `build/_app/immutable/chunks/DtmYTZ_2.js` | **4,665 B** | ~292 B | ~**10,500 B** |
| `glue.<hash>.wasm` (Lua VM) | **271,581 B** | **0** | 271,581 B |
| `lua_fmt_bg.<hash>.wasm` (formatter) | 628,148 B | 0 | 628,148 B (not fetched on browse) |
| Protocol chunk `BFIKf6sX.js` | 39,269 B (131,101 B unminified figure quoted in comments) | 0 | unchanged |

**The WASM is fetched once, not once per card.** `luaReady()` memoises the `LuaFactory`
(`sim/ready.ts:58-67`) and wasmoon memoises the module inside it (`node_modules/wasmoon/dist/index.js:1702-1707`:
`createEngine` is `new LuaEngine(await this.getLuaModule())` over a single `luaWasmPromise`). So 20
more Lua entries add **0 bytes** of WebAssembly download. Each visible Lua card costs one extra
`lua_State` inside the shared emscripten heap, not a second module instance.

**What does scale is engines.** `BrowseGrid.svelte:207-234` builds one engine per card on first
intersection (`{ threshold: 0, rootMargin: "200px" }`, `:308-318`), and
`BrowseGrid.svelte:65-68` states the documented ceiling: *"past roughly 40 entries, revisit with
lazy mounting or virtualisation — the limit there is compositor memory for mounted canvases, not
simulation."* **16 + 20 = 36 sits just under that line.** All cards mount; only intersecting ones
build and tick.

### 4b. On-screen card count

`columnsForWidth` caps at **4 columns** (`src/lib/browse/grid.ts:23, 37-42`; 260 px min card, 24 px
gap). So:

| Catalog | Rows at 4 cols | Typical on-screen (≈2 rows + rootMargin) | Mounted `<canvas>` | Ticking |
|---|---|---|---|---|
| 16 | 4 | ~8-12 | 16 | ~8-12 |
| 36 | 9 | ~8-12 (**unchanged** — viewport-bound) | 36 | ~8-12 |

Painting cost per visible card is fixed by `SIDE_INTERVAL_MS = 50` (`src/lib/sim/schedule.ts:41`),
i.e. ~40 paints per card per 2 s — the number `e2e/browse.e2e.ts:611-706` records rather than gates.
**Concurrent animation does not scale with catalog size; only mounted-canvas memory does.**

The **coverflow is entirely unaffected**: `radiusForWidth` bounds it at 7 / 5 / 3 mounted pads
(`slots.ts:71-75`), and no Lua entry may join the row anyway.

### 4c. OG generation

16 images today, `static/og/` = **132 KB**, individual PNGs 4,192-6,957 B at 1200×630, rendered at
tick 64 (`src/lib/og/render.ts:29-30, 42`). Per image the work is: build an engine (a fresh wasmoon
`lua_State` for a Lua entry), `run(64)`, upscale 81 cells into 2.27 M pixels, encode PNG.

`npm run build` currently measures **12 s wall** end-to-end (`docs/TESTING.md:24`), of which
`gen-og.mjs` is one of three stages plus a Vite dev-server boot. Linear in `ROUTED`:

| | 16 | 36 |
|---|---|---|
| Images | 16 | 36 |
| `static/og/` | 132 KB | ~**300 KB** |
| gen-og share of build | ≤ 12 s total | **+~100-125%** of the gen-og stage; projected build ~16-20 s |

Not a threat. The 1 MB per-image tripwire (`gen-og.mjs:78`) has three orders of magnitude of margin.

### 4d. The test suites

Measured single-file on 2026-09-07 (all seven Lua entries present):

| Spec | Wall | `tests` segment | Unit of work | At 27 Lua entries |
|---|---|---|---|---|
| `lua-entries.spec.ts` | **2.56 s** | **1.47 s** | **283 knob combinations → 566 measured events**, each `compressScript`-d twice (canonical check + `measureLua`) | 283 → ~**1,090** combos; tests ~**5.7 s**, wall ~**7-8 s** |
| `frames.spec.ts` | 744 ms | **318 ms** | 96 engine builds (16 × 5 ticks + 16), 42 of them fresh Lua VMs | ~216 builds, 162 VMs; tests ~**1.2 s** |
| `lua-smoke.spec.ts` | 590 ms | **129 ms** | 7 entries × 216 ticks × 243 layer records ≈ **367 k** record reads | 27 entries ≈ **1.4 M** reads; tests ~**500 ms** |
| `catalog.spec.ts` | — (0.48 s recorded) | — | pure metadata loops | negligible |
| `lua-parity.spec.ts` | — (0.93 s recorded) | — | the **nine presets** | **unchanged** |
| `reachability.sweep.spec.ts` | part of the 118 s sweep | — | the **nine presets**, 32,852 states | **unchanged** — `racked()` filters to `preview === "padsim"` (`:109-112`) |

Exact sweep arithmetic per entry (computed 2026-09-07):

```
euclid  6 knobs  arities 6,6,5,5,7,16   sum 45  → 47 combos  → 94 measured events
chorus  6 knobs  arities 8,6,5,5,4,16   sum 44  → 46 combos  → 92
arc     5 knobs  arities 5,3,5,5,16     sum 34  → 36 combos  → 72
ghost   5 knobs  arities 5,5,5,4,16     sum 35  → 37 combos  → 74
lattice 6 knobs  arities 6,6,4,5,4,16   sum 41  → 43 combos  → 86
morph   5 knobs  arities 5,4,5,4,16     sum 34  → 36 combos  → 72
sonar   5 knobs  arities 5,5,5,5,16     sum 36  → 38 combos  → 76
                                        TOTAL   283 combos     566 events
```

The formula is `combos = Σ(knob arities) + 2` per entry (`lua-entries.spec.ts:386-412`); the
all-longest and all-shortest corners are the `+2`, licensed by the separability identity proved in
test 5 (`lua-entries.spec.ts:335-361`). **A 16-value MIDI-channel knob alone accounts for 112 of the
283 combos.** A new entry that drops the channel knob, or trims it to a handful of common values,
roughly halves its own sweep cost.

**The real risk is not wall time, it is memory.** `docs/TESTING.md:31-33` records that
`lua-entries.spec.ts` **test 6 timed out three times on 2026-09-05** at 0.8-1.7 GB free, on a tree
that had not changed a vitest file. It is the load-sensitive test in the quick run, and quadrupling
its work is the single most likely way to make `npm run test:quick` flaky. `docs/TESTING.md:302-310`
already names the escape hatch and the precedent: **move it into its own Vitest project and run it
per wave** (D-10's pattern for `pad-invariants.test.js`), never trim what it covers. Twenty new
entries is the wave that should do that.

**Suite totals.** No test count moves. `npm run test:quick` stays 73 files / 776 tests; the delta is
paid entirely in wall time, projected **+5-7 s** on a 31 s run. `check-counts.mjs` therefore needs no
new arguments — which is exactly the property D-17 bought.

### 4e. `frames.json`

15,259 bytes for 16 entries × 5 records = **~953 B per entry**. At 36 entries: ~**34,300 B**. Fully
regenerated by one command, prettier-normalised so regeneration is idempotent
(`frames.spec.ts:97-115`). Not a concern at any plausible size.

### 4f. Summary of what actually hurts

| Rank | Pressure | Severity |
|---|---|---|
| 1 | `lua-entries.spec.ts` memory under `test:quick` | **real** — already observed failing at 7 entries |
| 2 | `src/lib/browse/filter.spec.ts` + `sort.spec.ts` literal rewrites (tag counts, chip row, sort blocks, name sequence) | **real** — hand work, ~15 assertions, and the chip row genuinely reshuffles |
| 3 | `docs/HARDWARE-AUDITION.md` — `ROW_COUNT = 12` and every new name needing a row | **real** — a gated document |
| 4 | Mounted canvases on `/browse/` approaching the documented ~40 ceiling | **watch** — 36 is under it |
| 5 | Build time (`gen-og.mjs`) | minor — seconds |
| 6 | Browse HTML payload | minor — 34 KB → ~57 KB |
| 7 | WASM payload, coverflow, sweep project, parity spec, test counts | **zero** |

---

## 5. What a good entry looks like here

Sources: `.planning/phases/08-new-configurations/08-CONTEXT.md`,
`08-RESEARCH.md:330-737`, `08-06-SUMMARY.md:610-660`, and the shipped entry files themselves.

### 5a. The brief, and the bar it set

- **D-01:** at least six. Six is the floor, not the cap.
- **D-02:** *"Each must be fun **and useful**: a complete instrument or a real playing aid, not a
  screensaver. Spectacle is expected; usefulness is required."*
- **D-03:** both events measured with the pinned `compressScript`; nothing over 908 on either.

The ranking rubric Phase 8 actually applied was **spectacle × usefulness × independence from
unverified facts** (`08-RESEARCH.md:720-737`). The "why" column for each of the six is worth reading
as a specification of taste:

| Rank | Entry | Why it earned its place |
|---|---|---|
| 1 | EUCLID | "the most spectacular thing on the list and a complete drum machine. Three gears turning." |
| 2 | CHORUS | "the single best per-character visual in the corpus, and chord pads are instantly useful to a non-keyboardist." |
| 3 | ARC | "the only card where the animation *is* the data." |
| 4 | GHOST | "the clearest 'I made that happen' loop on the pad, and drawn automation is a genuinely rare feature." |
| 5 | LATTICE | "the one that makes ZONA an instrument… it never moves, which makes it the perfect contrast card in a rack of motion." |
| 6 | MORPH | "simplest to explain, easiest to map, and it reads across a room. Also the cheapest to ship." |

Two rules are visible in that list and are worth stating as rules:

- **A useful configuration is one somebody could gig with.** Every one of the seven sends real MIDI,
  and `lua-smoke.spec.ts:247-250` fails an entry that "produced no MIDI at all" across the scripted
  gesture — *"a silent instrument is exactly what the gate exists to notice."*
- **Contrast is a feature.** LATTICE was chosen partly because it is still. A wall of twenty
  animated cards would need its own quiet ones.

### 5b. What Phase 8 rejected, and why

| Candidate | Measured | Verdict |
|---|---|---|
| **STEP** — nine-step sequencer drawn with a finger | 355 / 246 | Dropped: **overlaps EUCLID's "sequencer" slot**. Kept as a "one-file follow-on" (`08-06-SUMMARY.md:628-629`). |
| **RIBBON** — pitch ribbon with real glissando | 708 / 111 | Dropped: "excellent but the 10-bit `txma`/`tyma` unlock is the fiddliest to knob-tune" (`08-RESEARCH.md:735`). Also a one-file follow-on. |
| **SONAR** — radial 16-step sequencer | 432 / 279 | Reserve, **shipped anyway in wave 6**. "Spectacular but overlaps EUCLID's sequencer slot." |
| **MIRROR** — four faders the DAW can move back | 638 / 0 | **Blocked, not rejected.** Its `midirx_cb` path is verified in firmware source but nobody has proven host MIDI reaches it on a ZONA. It is the one MEDIUM-confidence claim in the research. `audition.spec.ts:236-256` asserts MIRROR appears in the audition **only as an optional row** and is **absent from `CATALOG`** — either half alone would let it be quietly shipped or quietly forgotten. |

The two operating principles behind those calls:

1. **Overlap is a rejection reason.** Two entries that occupy the same slot in a visitor's head are
   worth less than one entry plus a different idea.
2. **An unverified hardware fact blocks shipping, and the block is encoded in a test.** MIRROR's
   status is not a note in a document, it is a two-sided assertion in a spec.

### 5c. Naming

- Hand-authored entries take a **single upper-case word**: `EUCLID`, `CHORUS`, `ARC`, `GHOST`,
  `LATTICE`, `MORPH`, `SONAR`. Ported entries keep the shelf's sentence case (`Aurora`,
  `Nine pads`, `Four faders`, `Trackpad`) because `name` is read from the preset and must match it
  byte-for-byte (`catalog.spec.ts:113-115`).
- `id` is the lower-cased name, matching `^[a-z][a-z0-9-]*$` (`catalog.spec.ts:85`), and is **stable
  forever** — it is the URL (`types.ts:65`).
- The name is what carries a **concept**, not a mechanism: EUCLID names the algorithm, MORPH names
  the gesture, GHOST names the feeling. None names a compiler kind or a widget.

### 5d. Description voice

Every description is **one sentence, ≤ 110 characters, no newline**
(`catalog.spec.ts:50-57`), and **no two may be identical** (`e2e/browse.e2e.ts:258-263`). The
shipped seven share an unmistakable grammar:

> **A concrete visual or gesture in second person, a semicolon or "and", then the payoff.**

- *"Three Euclidean rings turn at their own speeds and beat against each other; tap a step to change
  the pattern."*
- *"Press any of nine pads for a whole chord, and a warm bloom spreads outward from the pad you hit."*
- *"Draw a modulation shape with your finger; it keeps sending after you let go, and the swirl shows
  the rate."*
- *"The whole pad tuned in fourths, so every chord shape is the same shape in every key."*

Rules extractable from all sixteen:

- **Second person, present tense, active voice.** "your finger", "you hit", "you let go".
- **Never name a mechanism the visitor cannot see.** No `glpfs`, no "layer 2", no "phase 255". The
  mechanism goes in the TypeScript header, where it costs nothing.
- **Name the payoff, not the feature.** LATTICE's description is the *argument for* isomorphic
  layouts, not the layout.
- **No marketing adjectives.** No "stunning", "powerful", "amazing".

### 5e. The copy rules, verbatim

`src/lib/device/install-copy.ts:44-46` states the house rule and every copy spec enforces it:

> *"THE PUNCTUATION IS LOAD-BEARING. Real apostrophes (U+2019), a real ellipsis (U+2026), a real em
> dash (U+2014). No emoji, no exclamation marks, never…"*

Applied to the catalog:

- **Typographic apostrophes, U+2019, written directly in HANGAR-authored copy.** GHOST's
  *"your finger’s"* and MORPH's *"each corner’s"* are the only two curly apostrophes in
  `listing.ts` (`:251, :276`) and they are literal U+2019 in the source.
- **Vendored copy keeps its ASCII apostrophe and is converted at display.** Radar's
  *"your finger's position"* comes off the shelf (`_pad.ts` preset sentence) and must stay
  byte-equal to it (`catalog.spec.ts:116-119`). `src/lib/browse/typographic.ts:3-17` converts an
  ASCII apostrophe **between two letters** to U+2019 at render time and changes nothing else — no
  quotes, no ellipses, no dashes. **Do not "fix" a vendored sentence in the catalog.**
- **Zero exclamation marks** anywhere in the sixteen descriptions or the quiet lines.
- **Zero emoji.** `\p{Extended_Pictographic}` is asserted absent across the copy modules
  (`install-copy.spec.ts:321-325`, `session-copy.spec.ts:378-390`); CLAUDE.md forbids emoji
  project-wide.
- **Typographic double quotes** (U+201C/U+201D) where a visitor's query is echoed
  (`src/routes/browse/+page.svelte:112-117`).
- **An ellipsis means "this is still happening", never "there is more"** — descriptions are never
  clamped (`CatalogCard.svelte:40-44`).

### 5f. Tag vocabulary

- **Feel-based, never a compiler kind (CONT-03).** `ported.ts:22-25` states the rule: *"how the card
  feels to use, never which compiler kind produced it. A `look.kind` or `sends.kind` string must
  never appear here."* Every entry file repeats it in a comment above its `tags`.
- Lower-case slugs, `^[a-z][a-z0-9-]*$`, at least one per entry (`catalog.spec.ts:58-66`).
- Preset entries carry **3** tags, Lua entries carry **4**.
- **41 distinct tags across the sixteen**, of which **9 are carried twice or more** and become
  standing chips, and **32 are singletons** that stay searchable free text
  (`filter.spec.ts:232-247`, rule at `filter.ts:121-125`).
- The vocabulary in use divides into roughly four families:
  - *feel / motion*: `ambient`, `flowing`, `rotating`, `rippling`, `hypnotic`, `calm`, `blooming`,
    `still`, `generative`
  - *what you do with it*: `playable`, `gestural`, `expressive`, `hands-free`, `readable`, `precise`,
    `endless`
  - *musical role*: `drums`, `chords`, `harmonic`, `polyrhythm`, `sequencer`, `instrument`,
    `isomorphic`, `modulation`, `macros`, `looper`, `automation`, `blend`, `mixing`
  - *technical affordance*: `xy-control`, `pitch-bend`, `multi-touch`, `colour`, `grid`, `rails`,
    `radial`, `polar`, `sprung`, `desktop`, `pointer`, `utility`
- **Practical rule for twenty new entries:** reuse an existing tag deliberately when the feel really
  matches (it moves the chip row and is the point of chips), and coin a new one only when nothing
  existing is honest. Every new tag that lands on exactly one entry stays a singleton and changes
  nothing visible; a tag that reaches two entries **creates a chip** and will move
  `filter.spec.ts`'s `NINE_CHIPS`.

### 5g. The header a good entry file carries

Every one of the seven opens with a long TypeScript comment that is genuinely load-bearing, and it
follows a fixed shape (`entries/euclid.ts:1-27` is the template, `entries/sonar.ts:1-55` the richest):

1. **One-line thesis.** *"EUCLID - three Euclidean rings, one polyrhythm."*
2. **The mechanism**, in prose, with the arithmetic that makes it fit the 9×9 exactly.
3. **The look**, and *why `restsBlack` is what it is*.
4. **Every trap this specific entry contains**, named in capitals and marked do-not-fix where
   applicable — ARC's legitimate keepers, MORPH's `@DECAY`-not-`@TRAIL` prefix hazard, SONAR's
   `@PERIOD` and its "this is the canonical text, not the one printed in the research", LATTICE's
   two `@BASE` sites.
5. **The honest limit, explicitly labelled "for the card copy."** CHORUS releases a dead-still chord
   after two seconds; MORPH is single-contact by design; LATTICE loses a cell's light when two
   fingers share it; SONAR's cells on the same ring share a pitch. *Every one of the seven has one.*
6. **The measured numbers** — Setup and Timer at the defaults, the all-longest corner, and the claim
   that both are fixed points of `compressScript` and pass `checkSyntax`.
7. **The "no comments in the Lua" note**, with the reason (`compressScript` does not strip them).
8. The GPLv3 copyright line.

This is not decoration. `08-06-SUMMARY.md:646-648` records the working method: *"pulling the
canonical Lua and its substitution table out of the PLAN's own fenced blocks and markdown tables by
script, applying the token renames inside that script, and asserting each needle's occurrence count
per event before writing any entry file, made 'a needle was mistyped' and 'one of the two `@BASE`
sites was missed' structurally impossible."* Twenty entries should be authored the same way.

### 5h. The one-paragraph rule for a twenty-entry wave

A configuration earns its place when it is **a complete instrument or a real playing aid** that
**nothing else in the catalog already is**, whose **animation the C LED engine does for free**
(`glpfs` + `glt` and then zero Lua), that **fits 908 at every corner of its own knob
cross-product**, that **sends MIDI a visitor could map in a DAW**, whose **honest limit is written
into the entry header and the card copy**, and whose **name, one ≤110-character second-person
sentence and three or four feel tags** would let a stranger tell it apart from every other card on
the wall.

---

## Sources

**Primary (HIGH) — read directly:**
`src/lib/catalog/{types,index,listing,front-door}.ts`; `src/lib/catalog/entries/*.ts`;
`src/lib/catalog/{catalog,listing,front-door,frames,lua-entries,audition}.spec.ts`;
`src/lib/catalog/frames.json`; `src/lib/sim/{engine,ready,lua-host,lua-pad-sim,schedule}.ts`;
`src/lib/sim/lua-smoke.spec.ts`; `src/lib/pad/{index,ready}.ts`;
`src/vendor/botor/_pad.ts` (read-only); `src/lib/browse/{filter,sort,grid,typographic}.ts` + specs;
`src/lib/coverflow/slots.ts`; `src/lib/tune/{knobs.lua,state,copy}.ts`;
`src/lib/tune/reachability.sweep.spec.ts`; `src/lib/share/stamp.ts`; `src/lib/og/render.ts`;
`src/lib/config-shape.spec.ts`; `src/lib/fidelity/{lua-parity.spec.ts,golden-frames.json}`;
`src/routes/browse/+page.svelte`; `src/routes/c/[id]/+page.{ts,svelte}`;
`src/routes/dev/catalog/+page.svelte`; `src/lib/ui/{BrowseGrid,CatalogCard}.svelte`;
`scripts/{gen-og,check-counts}.mjs`; `e2e/{browse,browse-webkit,catalog,artifacts}.e2e.ts`;
`vite.config.ts`; `package.json`; `docs/{TESTING,HARDWARE-AUDITION}.md`;
`.planning/phases/08-new-configurations/{08-CONTEXT,08-RESEARCH,08-06-SUMMARY,08-VERIFICATION}.md`.

**Measured on this machine, 2026-09-07:**
`npx vitest run --project server` on `lua-entries.spec.ts` (2.56 s / 1.47 s tests),
`frames.spec.ts` (744 ms / 318 ms), `lua-smoke.spec.ts` (590 ms / 129 ms);
byte sizes of `build/browse/index.html`, `build/_app/immutable/chunks/*.js`,
`build/_app/immutable/assets/*.wasm`, `static/og/*.png`, `src/lib/catalog/frames.json`;
knob arities, sweep combination counts and the rendered default / longest / shortest costs of all
seven Lua entries, computed by script from the entry sources.

**Projections (MEDIUM) — arithmetic, not measurement:** all "at 36" figures in §4, the
`lua-entries.spec.ts` runtime at 27 Lua entries, and the gen-og build-time estimate. Nothing was
built or benchmarked at 36 entries.
