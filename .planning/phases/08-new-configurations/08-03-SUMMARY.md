---
phase: 08-new-configurations
plan: 03
subsystem: sim
tags:
  [
    sim-engine,
    lua,
    parity,
    wave-0-gate,
    fidelity,
    dynamic-import,
    D-06,
    D-07,
    D-08,
    D-12,
    D-17,
  ]
requires:
  - "src/lib/sim/lua-host.ts (08-02) - LuaHost, createLuaHost, the Grid API"
  - "src/lib/sim/ready.ts (08-02) - luaReady() and the fingerprinted glue.wasm URL"
  - "src/lib/catalog/types.ts (08-01) - CatalogEntry, CatalogSource, LuaKnob"
  - "src/lib/fidelity/golden-frames.json (Phase 3) - the recorded five-tick tripwire"
  - "src/vendor/botor/_pad.ts (Phase 3) - compile(), PRESETS, DEFAULT_PAD_STATE"
  - "src/vendor/botor/pad-sim.ts (Phase 3) - PadSim, layer(), pokeLayer(), screenToHw"
provides:
  - "src/lib/sim/engine.ts - interface SimEngine, createEngine(entry, knobs), SimEngineError"
  - "src/lib/sim/lua-pad-sim.ts - LuaPadSim, createLuaPadSim, renderLua, blankPadState"
  - "src/lib/fidelity/lua-parity.spec.ts - THE WAVE 0 GATE, 5 tests, green"
  - "LuaHost.restart() / LuaHost.globalKeys() / LuaHost.hid - a synchronous firmware page-load reset and its proof"
  - "The compiler's full emitted call surface in the VM: bare gmbs/gmms/gks and the self: touch queue"
  - "glue.Dlydm7r2.wasm now emitted into build/_app/immutable/assets/"
affects:
  - "Plans 08-04..08-08 are LICENSED to proceed: the gate is green"
  - "Phase 4's Coverflow row now obtains engines from createEngine and skips, never crashes on, an entry it cannot build"
  - "Plan 08-04's budget gate calls renderLua directly - the signature is below"
tech-stack:
  added: []
  patterns:
    - "A compile-time structural assertion (_padSimIsASimEngine) instead of a runtime one"
    - "An engine factory whose second branch is a dynamic import, so a chunk is a capability rather than a cost"
    - "A pristine-global snapshot in Lua, so a synchronous reset restores a genuinely clean _G"
key-files:
  created:
    - src/lib/sim/engine.ts
    - src/lib/sim/lua-pad-sim.ts
    - src/lib/fidelity/lua-parity.spec.ts
  modified:
    - src/lib/sim/lua-host.ts
    - src/lib/ui/Coverflow.svelte
decisions:
  - "SimEngine omits setState (the D-08 amendment): a state change constructs a new engine"
  - "reset() is a real reset - a Lua pristine-global snapshot lets it restore a clean _G synchronously"
  - "gmbs, gmms and gks are registered as BARE globals: the compiler emits them bare, gms it does not"
  - "The compiled touch queue (self:touch_pop/tid/tev/txv/tyv) shares the host's one FIFO"
metrics:
  duration: 35 min
  tasks: 2
  files: 5
  completed: 2026-09-04
---

# Phase 8 Plan 03: The SimEngine Seam and the Wave 0 Parity Gate Summary

**THE WAVE 0 GATE IS GREEN.** BOTOR's own emitted Setup Lua, run through a real Lua 5.4 VM over a
blank fully user-owned `PadSim`, reproduces all **2,187 layer records (9 x 243)** and hash-matches
both a live `PadSim` and Phase 3's recorded `golden-frames.json` at **all five sampled ticks for all
nine presets**. Plans 08-04 to 08-08 may author against the Lua route. `glue.Dlydm7r2.wasm` now lands
in the build, because the row finally has an application-level consumer of `src/lib/sim/ready.ts`.

---

## The parity result, plainly

| Preset    | 243 layer records | Frame vs live PadSim, 5 ticks | Frame vs golden-frames.json, 5 ticks |
| --------- | ----------------- | ----------------------------- | ------------------------------------ |
| aurora    | 243 / 243         | 5 / 5                         | 5 / 5                                |
| pinwheel  | 243 / 243         | 5 / 5                         | 5 / 5                                |
| starfield | 243 / 243         | 5 / 5                         | 5 / 5                                |
| radar     | 243 / 243         | 5 / 5                         | 5 / 5                                |
| joystick  | 243 / 243         | 5 / 5                         | 5 / 5                                |
| ninepads  | 243 / 243         | 5 / 5                         | 5 / 5                                |
| faders    | 243 / 243         | 5 / 5                         | 5 / 5                                |
| dial      | 243 / 243         | 5 / 5                         | 5 / 5                                |
| tpad      | 243 / 243         | 5 / 5 (vacuous - see below)   | 5 / 5 (vacuous - see below)           |
| **total** | **2187 / 2187**   | **45 / 45**                   | **45 / 45**                          |

The record count is asserted as a running counter against the literal `2187`, so a loop that silently
compared nothing cannot pass. `PRESETS.length === 9` is asserted first for the same reason.

**tpad is recorded, not hidden.** It writes no LEDs at all, so its frame is all zeros at every tick
and its agreement is vacuous - `golden-frames.spec.ts`'s own note says the same. It stays in the
nine, and test 4 asserts that it is the **only** preset that is dark at every sampled tick. That
inverts the problem: a green nine can no longer hide it, and if the Lua route ever stopped writing
LEDs entirely, the list would grow and test 4 would go red.

Two of the nine are the interesting ones for the *frames* half: five presets are static at every tick
by design, so test 4 also asserts that at least one preset's hash MOVES between tick 0 and tick 37.
It does.

---

## The measured baseline, re-measured

The plan and the orchestrator both said to re-measure rather than trust `08-02-SUMMARY.md`. Measured
on this machine, on this tree, at commit `7774cbb`, **before this plan touched anything**:

```
npm run test:quick
 Test Files  38 passed (38)
      Tests  542 passed | 1 todo (543)
```

**BASE_FILES = 38, BASE_TESTS = 542** - identical to `08-02-SUMMARY.md` this time. Phase 4 landed
nothing in between.

### Totals observed AFTER this plan

```
npm run test:quick   ->  39 files, 547 passed | 1 todo (548)
npm run test:sweep   ->   1 file,    9 passed
npm run test:e2e     ->  21 passed (58.9 s)
```

Exactly `BASE_FILES + 1` and `BASE_TESTS + 5`, verified through the helper:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 39 547   -> exit 0
npm run test:sweep 2>&1 | node scripts/check-counts.mjs 1 9      -> exit 0
```

**Plan 08-04 should treat 39 / 547 (quick), 1 / 9 (sweep) and 21 (e2e) as its baseline - and should
re-measure rather than trust them.**

---

## `SimEngine`, verbatim - Phase 4 types against this

```ts
export interface SimEngine {
  tick(): void;
  run(n: number): void;
  /** Firmware page-load semantics: back to the state right after Setup. */
  reset(): void;
  /** 243 bytes, screen order, RGB. */
  readonly frame: Uint8Array;
  /** True while anything is still counting down or still to fire. */
  readonly animating: boolean;
  readonly coordMax: 127 | 1023;
  readonly pendingTouches: number;
  touchDown(id: number, x: number, y: number): void;
  touchMove(id: number, x: number, y: number): void;
  touchUp(id: number, x: number, y: number): void;
  touchTap(id: number, x: number, y: number): void;
}

export class SimEngineError extends Error {} // name === "SimEngineError"

export async function createEngine(
  entry: CatalogEntry,
  knobs?: Readonly<Record<string, number>>,
): Promise<SimEngine>;
```

Eleven members, asserted as a literal list of eleven in test 5 so a shortened list cannot pass.
`src/lib/sim/host.ts`'s `HostEngine` is this minus `touchTap`, so a `SimEngine` is accepted by
`SimHost.register` unchanged.

**The D-08 amendment, recorded so nobody re-litigates it.** D-08 lists `setState` in the surface.
`SimEngine` takes everything except `setState`, because the two engines take incompatible state: a
`PadState` is meaningless to a hand-authored Lua entry, whose state change is a knob INDEX moving and
whose rebuild is a re-render of the template plus a fresh VM. The uniform answer for both engines is
**construct a new engine through `createEngine`**; `PadSim`'s own comment prices that at
"microseconds". D-08's intent is preserved exactly - the card component picks an engine by
`entry.preview` and changes nothing else - only the mechanism for a state change moves from a method
to a constructor. The reasoning is in `engine.ts`'s module comment. **`08-CONTEXT.md` D-08 already
carries the amendment inline**; nothing further is needed there.

### `renderLua` - plan 08-04's budget gate calls this

```ts
export function renderLua(
  entry: CatalogEntry,
  knobs?: Readonly<Record<string, number>>,
): { setup: string; timer: string };
```

Pure: no VM, no await, no I/O. For each knob, `knob.token` is replaced with
`knob.values[index]` in both event strings, where `index` is `knobs[knob.id]`, else
`entry.defaults[knob.id]`, else `knob.default`. An index outside `values` falls back to
`knob.default` rather than substituting `undefined` into Lua source - a stamp from an older catalog
version is untrusted input. `String.prototype.replaceAll` with a **plain string needle**, never a
regular expression, because a token is catalog-authored data and `@` must stay a character rather
than becoming a metacharacter question.

Also exported from `lua-pad-sim.ts`: `blankPadState()`, `LuaPadSim` (with `errors` and `close()`
beyond `SimEngine`) and `createLuaPadSim(entry, knobs?)`.

---

## Does `reset()` restore a clean VM global table? **Yes - and it is proved, not assumed.**

The plan allowed for it not to, and said to make `reset()` throw a named error in that case. That
turned out to be avoidable, and throwing would have been costly: `SimHost.stillFrame()` calls
`reset()` from `register()` on the reduced-motion path, so a throwing `reset()` would break the row
for every visitor who asked for less motion.

`LuaHost.install` now runs a **pristine-global snapshot** in Lua after the Grid API and `SELF_PRELUDE`
are in place and **before** Setup:

```lua
__hangar_pristine = {}
for k in pairs(_G) do __hangar_pristine[k] = true end
```

`LuaHost.restart()` then wipes everything added since, rebuilds `self` empty, re-runs Setup and
reinstalls the touch dispatcher:

```lua
for k in pairs(_G) do if not __hangar_pristine[k] then _G[k] = nil end end
```

Clearing a field while traversing with `pairs()` is explicitly permitted in Lua (only *adding* one is
undefined), so the wipe is a single pass with no key list. It is synchronous - `doStringSync` - which
is what lets `SimEngine.reset()` stay synchronous over an already-loaded VM. Host state (FIFO, gate,
`msClock`, tick count, timer deadline, `coordMax`, `rxMode`, MIDI/HID/error logs) is cleared and
`sim.reset()` is called **first**, so a Setup that calls `txma` or `gtt` writes into a clean slate.

Verified directly: a config whose Setup sets a global `zz_setup` and whose Timer sets `zz_timer`, run
50 ticks, has both globals; after `restart()` it has `zz_setup` (Setup re-ran) and **not** `zz_timer`,
with `tickCount` 0, `timerArmed` true and no errors. Test 5 also asserts the picture-level version:
`run(50)`, `reset()`, `run(50)` reproduces the same frame hash with an empty error log.

`LuaHost.globalKeys()` was added so that assertion can be made at all.

---

## `lua-parity.spec.ts` - 5 tests, and the measured cost

Three consecutive runs of `npx vitest run --project server src/lib/fidelity/lua-parity.spec.ts`:

| Run | Wall       | `tests` segment |
| --- | ---------- | --------------- |
| 1   | **1.69 s** | 367 ms          |
| 2   | **875 ms** | 362 ms          |
| 3   | **862 ms** | 379 ms          |

**Far under the plan's 20-second threshold**, so no `docs/TESTING.md` carve-out is needed and nothing
is flagged for 08-07 on this axis. The reason it is cheap: a VM instantiates in single-digit
milliseconds under Node, and the 45 five-tick samples are computed once into a module-level memo that
tests 2, 3 and 4 all read. **A fresh pair of engines is still built per sample** - `run(n)` is
cumulative on both sides - the memo holds the *results*, never an engine, so answering the same 45
questions three times does not build 135 VMs.

The five tests:

1. **2,187 layer records.** For every preset, `hw` 0..80, layer 0..2, all seven fields (`min`, `mid`,
   `max`, `pha`, `fre`, `sha`, `timeout`) deep-equal a fresh `new PadSim(preset.state)`'s. Names the
   preset, the hw index, the layer and the field in every message. Asserts `PRESETS.length === 9`
   first and the running record count against `2187` last.
2. **Frames equal a live PadSim** at ticks `[0, 37, 101, 500, 1009]`, as sha256 of the 243-byte frame.
3. **The same hashes equal `golden-frames.json`.** The half that makes this a pin rather than a
   handshake: two engines can drift together, a recorded hash cannot drift at all.
4. **Not vacuous.** The blank user-owned `PadSim` reports `animating === false` and an all-zero frame
   before Setup runs and after 200 ticks with no Lua at all; at least one preset's hash moves between
   tick 0 and tick 37; and `tpad` is the only preset dark at every tick.
5. **The engines are interchangeable.** All eleven `SimEngine` members present with the right `typeof`
   on both a `PadSim` and a `LuaPadSim`; `createEngine` returns a `PadSim` for a `preview: "padsim"`
   catalog entry and a `LuaPadSim` for a `lua` entry (which is what exercises the dynamic import);
   `renderLua`'s knob substitution honours `entry.defaults` over `knob.default`; and `reset()`
   round-trips.

No `it.each`, so the counts in `08-VALIDATION.md` do not move when a catalog entry is added later.
Nothing outside the repository is read: `grep -c "grid-editor"` and `grep -c "git-common-dir"` both
print `0`.

### The two negative checks - observed red, reverted

Both files were `git add`-ed **before** the perturbation, so `git checkout --` really restores and
`git diff --quiet` really compares (08-01's lesson).

| | **Check A** | **Check B** |
|---|---|---|
| Perturbation | `glag`'s body replaced with the identity (`return logical;`) in `src/lib/sim/lua-host.ts` | one hex digit of `starfield`'s tick-101 hash in `src/lib/fidelity/golden-frames.json` changed from `e5...` to `a5...` |
| Green exit code | **0** | **0** |
| Red exit code | **1** | **1** |
| Tests that went red | **1, 2 and 3** | **3 only** |
| Test 1's message | `AssertionError: aurora: layer(0, 2).pha: expected +0 to deeply equal 120` | (green) |
| Test 2 | red: `aurora at tick 0: the Lua route's frame hash differs from the vendored simulator's` | **stayed GREEN** |
| Test 3's message | `aurora at tick 0: ... differs from the hash Phase 3 recorded` | `starfield at tick 101: the Lua route's frame hash differs from the hash Phase 3 recorded` |
| After `git checkout --` | `git diff --quiet` exits 0; 5 passed | `git diff --quiet` exits 0; 5 passed |

**All four exit codes: 0, 1, 0, 1.**

Check B is the one that earns test 3 its place. Perturbing the *fixture* reddens test 3 while test 2
stays green, which is exactly the discrimination the plan asked for: test 2 asks "do the two engines
agree", test 3 asks "do they agree with what was recorded", and one perturbation can now tell them
apart.

---

## The build: `glue.*.wasm` lands, and stays off the front door

```
build/_app/immutable/assets/glue.Dlydm7r2.wasm      271,581 bytes
build/_app/immutable/assets/lua_fmt_bg.D_18ElAm.wasm   628 kB (the formatter - a different gate)
```

Same filename and same hash 08-02 predicted from its temporary probe. **08-02's deferred acceptance
criterion is discharged here**, which is where it belonged: the asset needed an application-level
consumer of `ready.ts`, and that consumer is the `SimEngine` seam, which is this plan's design
decision to make.

The reachability chain, every hop of it deliberate:

```
Coverflow.svelte  --(dynamic, in onMount)-->  $lib/sim/engine
engine.ts         --(dynamic, lua branch only)-->  lua-pad-sim.ts  ->  lua-host.ts  ->  ready.ts
ready.ts          --  new URL("wasmoon/dist/glue.wasm", import.meta.url)  ->  the emitted asset
```

Measured, not assumed:

- The two built chunks that mention `glue` (`CO7j-N7I.js`, `Cl9DjCLv.js`) are referenced by
  **neither** `build/index.html` **nor** `build/c/aurora/index.html` - `grep -c` prints `0` in all
  four combinations. A cold `/` load fetches neither `glue.*.wasm` nor `lua_fmt_bg.*.wasm`.
- `src/lib/config-shape.spec.ts` stays **14 passed**, both halves: the D-21 source guard (anchored to
  the static `from "..."` form, which a dynamic `import("$lib/sim/engine")` from `onMount` does not
  trip) and the artefact guard over `build/index.html`.
- `npm run test:e2e` reports **21 passed**, unchanged from `04-VERIFICATION.md`'s number.

The only static import added to `src/lib/ui/` is `import type { SimEngine } from "$lib/sim/engine"`,
which is erased before a bundle exists and whose specifier carries none of the D-21 guard's markers.

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] `gmbs`, `gmms` and `gks` were missing, and the gate is what found them**

- **Found during:** Task 8-03-02, first run of the parity spec.
- **Issue:** `Error: attempt to call a nil value (global 'gmbs')` from tpad's Setup, which opens
  `--[[@cb#z.ptpad]] self:txma(1023)self:tyma(1023)gmbs(3,0)...`. Four of the nine presets failed.
  08-02's Grid API contract table was derived from the hand-authored candidate configurations in
  08-RESEARCH; the compiler's own emitted surface is wider. `_pad.ts`'s `OUT_CALLS` is
  `["gms", "gmms", "gmbs", "gks"]` - the MIDI send plus the trackpad and keyboard recipes' mouse-move,
  mouse-button and key sends.
- **Fix:** All three registered as **bare** globals with a variadic recorder and a new
  `get hid(): readonly HostHid[]`. Bare is correct and checked: every emitted MIDI send is
  `s:gms(...)` - never bare - while `gmbs`/`gmms` are only ever bare, so 08-02's "gms is method-only,
  and a bare `gms(...)` still raises" decision stands untouched. `lua-host.spec.ts` test 8's
  unregistered-call half still uses `gnothere`, so "anything outside the surface raises" is intact.
- **Files modified:** `src/lib/sim/lua-host.ts`
- **Commit:** `8332ccd`

**2. [Rule 2 - Missing critical functionality] The compiled touch queue: `self:touch_pop/tid/tev/txv/tyv`**

- **Found during:** Task 8-03-02, reading the compiler's whole emitted call surface after finding (1).
- **Issue:** tpad's compiled touch handler drains its backlog with
  `o=s:touch_pop() i=s:tid() e=s:tev() x=s:txv() y=s:tyv()` inside a `while o and g<24` loop
  (`_pad.ts:2259`). None of the five existed. The parity gate does not touch anything, so this would
  not have reddened it - it would have raised on the first finger on the pad instead, which is the
  worst possible place for a gap.
- **Fix:** `touch_pop()` shares the host's **one** FIFO with `tick()`'s own pop (a second queue could
  disagree with `pendingTouches`); `tid/tev/txv/tyv` read whichever sample was last taken, and
  `tick()` makes its own sample current before dispatching so a handler that reads them before its
  first `touch_pop` sees what it was called with.
- **Files modified:** `src/lib/sim/lua-host.ts`
- **Commit:** `8332ccd`

**3. [Rule 3 - Blocking] `LuaHost.restart()`, because `SimEngine.reset()` is synchronous**

- **Found during:** Task 8-03-01.
- **Issue:** `SimEngine.reset()` must be synchronous - `SimHost.stillFrame()` calls it from
  `register()` on the reduced-motion path, where there is nothing to await into - and `LuaHost`
  offered no synchronous way to re-run Setup. The plan anticipated this and offered a throwing
  `reset()` as the fallback; a throwing `reset()` would break the row for reduced-motion visitors.
- **Fix:** `restart()` (see the section above), plus `globalKeys()` so a spec can prove the wipe.
  The plan's `files_modified` did not list `lua-host.ts`; the alternative was a worse `reset()`.
- **Files modified:** `src/lib/sim/lua-host.ts`
- **Commit:** `7a789ba`

**4. [Rule 2 - Missing critical functionality] The row now obtains its engines from `createEngine`**

- **Found during:** Task 8-03-01, discharging 08-02's deferred criterion.
- **Issue:** `Coverflow.svelte` built `new PadSim(presetById(entry.id).state)` directly. Nothing in
  the application graph imported `src/lib/sim/ready.ts`, so Vite could not emit `glue.wasm` - the
  criterion 08-02 explicitly carried forward to this plan. It is also D-08's own requirement that the
  row pick an engine by `entry.preview`.
- **Fix:** `await Promise.all([import("$lib/sim/engine"), import("$lib/catalog")])` in `onMount`, then
  `byId(entry.id)` and `await createEngine(configuration)` inside a `try`, with the id pushed into
  `skipped` on any failure. A preview kind with no engine is now **skipped, not crashed on**, which is
  the D-08 amendment's other half. The `skipped` list, the `onskipped` callback, the name plate's
  "unavailable" state and the console warning are unchanged.
- **Files modified:** `src/lib/ui/Coverflow.svelte`
- **Commit:** `7a789ba`

### Deferred / not done

**5. `gln`, `gld` and `glx` remain unregistered.** They are in `_pad.ts`'s `LED_CALLS` but no preset
emits them, and D-14's rule is that an unlisted call raises. If a future `PadState` combination emits
one, the parity gate (or 08-04's smoke test) will say so by name in one line. Recorded so the next
reader does not have to re-derive the list.

**6. `self.midirx_cb` still has no dispatcher.** Unchanged from 08-02: no MIDI input source exists in
HANGAR and MIRROR is blocked on hardware (D-04).

### Environment note

**The first `npm run test:e2e` reported 12 passed / 9 failed, every failure
`net::ERR_CONNECTION_REFUSED`.** The wrangler dev server exited part-way through the run;
`netstat` afterwards showed only `TIME_WAIT` sockets on 4173 and no `LISTENING` one. Infrastructure,
not the build: an immediate re-run with no code change reported **21 passed (58.9 s)** and the port
was free and process-clean before and after. Recorded because a later plan will see it again.

---

## Verification

| Check | Result |
|---|---|
| `npx vitest run --project server src/lib/fidelity/lua-parity.spec.ts` | 1 file, **5 passed**, 862-875 ms |
| `grep -c "  it(" src/lib/fidelity/lua-parity.spec.ts` / `it.each` | `5` / `0` |
| `grep -q "2187"` / `"golden-frames.json"` / `"setupLua"` in the spec | all exit 0 |
| `grep -c "grid-editor"` / `"git-common-dir"` in the spec | `0` / `0` |
| `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 39 547` | exit 0 (**39 / 547**) |
| `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9` | exit 0 |
| `npm run test:e2e` | **21 passed** (second run; see Environment note) |
| `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts` | **14 passed** |
| `npx vitest run --project server src/lib/config-shape.spec.ts` | **14 passed** (D-21 both halves) |
| `npm run check` | 443 files, **0 ERRORS**, 0 warnings |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0; `glue.Dlydm7r2.wasm` in `build/_app/immutable/assets/` |
| `grep` for the `glue` chunks in `build/index.html` and `build/c/aurora/index.html` | `0` in all four |
| `git diff --stat HEAD -- src/vendor/` | prints nothing |
| `grep -q "await import" src/lib/sim/engine.ts` | exit 0 |
| `grep -c 'from "./lua-pad-sim"' src/lib/sim/engine.ts` | `0` |
| `grep -q "_padSimIsASimEngine" src/lib/sim/engine.ts` | exit 0 |
| `grep -q "replaceAll" src/lib/sim/lua-pad-sim.ts` | exit 0 |
| Port 4173 free before and after; no wrangler/workerd process left | confirmed |

---

## Notes for later plans

- **08-04:** call `renderLua(entry, knobs)` for the knob-cross-product budget sweep. It builds no VM
  and awaits nothing. The Grid API contract is 08-02's table **plus** bare `gmbs`, `gmms`, `gks` and
  the `self:` touch queue `touch_pop`/`tid`/`tev`/`txv`/`tyv`. `gln`, `gld`, `glx` still raise.
- **08-04:** `frames.spec.ts`'s local `engineFor` can now be replaced by `createEngine` from
  `$lib/sim/engine` - the comment in that file already says so, and the first Lua entry is when it
  must be.
- **08-04..08-06:** an entry appended to `CATALOG` must also be registered in `EXCLUDED_FROM_ROW`
  with a `why` (D-18) until the row is widened deliberately - `front-door.spec.ts` asserts the
  partition, and its per-row `preview === "padsim"` assertion will need revisiting when a Lua entry
  first joins the row.
- **08-07:** the VM asset is `glue.Dlydm7r2.wasm`; the discriminator against the formatter is
  `lua_fmt_bg`. `src/lib/sim/ready.ts` is still the only module naming the package.
- **Everyone:** re-measure the suite baseline. **39 / 547 (quick), 1 / 9 (sweep), 21 (e2e)** is what
  this plan left behind.

## Self-Check: PASSED

All three created files and both modified files exist on disk; both commits (`7a789ba`, `8332ccd`)
are present in `git log`.

## Requirements

`requirements: [CONT-02, PREV-02]` in the plan frontmatter is phase-level attribution, and **neither
is marked complete here**, on 08-01's and 08-02's precedent:

- **CONT-02** ("at least six new configurations authored for spectacle are in the catalog") is
  unmet. This plan proved the engine those configurations will run on and authored none. Waves 4 to 6
  (plans 08-04 to 08-06) author them.
- **PREV-02** ("the simulator consumes the exact compiler output - no hand-authored animation
  anywhere") is now **demonstrated for the Lua route** - that is exactly what this gate is - but its
  traceability row reads "Phase 4 (Lua-sourced entries: Phase 8)" and no Lua-sourced entry exists
  yet. Marking it complete while the catalog holds nothing the claim applies to would over-claim by
  one wave. The plan that lands the first Lua entry with a green frames fixture is the plan that
  marks it.

`.planning/REQUIREMENTS.md` is therefore unchanged by this plan.
