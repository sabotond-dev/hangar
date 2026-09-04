---
phase: 08-new-configurations
plan: 02
subsystem: sim
tags:
  [lua, wasmoon, vm, host, grid-api, lazy-gate, licences, D-06, D-07, D-08, D-17]
requires:
  - "scripts/check-counts.mjs (08-01) - observed-baseline-plus-delta suite counting"
  - "src/vendor/botor/pad-sim.ts (Phase 3) - screenToHw, glcStops, PadSim.layer/pokeLayer/tick/frame"
  - "src/vendor/botor/_pad.ts (Phase 3) - DEFAULT_PAD_STATE, PadSlot/PadOwnership, CELLS, GRID"
provides:
  - "wasmoon@1.16.0 - an exactly pinned MIT runtime dependency, its licence and its transitive @types/emscripten discharged"
  - "src/lib/sim/ready.ts - luaReady(), resetLuaReadyForTests(), type-only LuaEngine/LuaFactory re-export"
  - "src/lib/sim/lua-host.ts - LuaHost, createLuaHost, type HostMidi, type LuaHostOptions"
  - "src/lib/sim/lua-host.spec.ts - 8 tests pinning the four silent firmware traps"
affects:
  - "Plan 08-03 (the SimEngine wrapper and the nine-preset parity spec sit directly on LuaHost)"
  - "Plan 08-04 (authors call exactly the Grid globals listed below and nothing else)"
  - "Plan 08-07 (the emitted VM asset filename, and the one-module rule for naming the package)"
tech-stack:
  added:
    - "wasmoon 1.16.0 (MIT) - real Lua 5.4 compiled to WebAssembly, exact pin, no caret"
    - "@types/emscripten 1.39.10 (MIT) - wasmoon's only runtime dependency, transitive"
  patterns:
    - "A second memoised lazy gate beside padReady(), deliberately not fused with it"
    - "Type-only re-export so exactly one module names a lazily loaded package"
    - "An explicit WASM URI passed to a third-party loader that would otherwise reach a CDN"
key-files:
  created:
    - src/lib/sim/ready.ts
    - src/lib/sim/lua-host.ts
    - src/lib/sim/lua-host.spec.ts
    - licenses/wasmoon@1.16.0-LICENSE.txt
    - licenses/@types/emscripten@1.39.10-LICENSE.txt
  modified:
    - package.json
    - package-lock.json
    - THIRD-PARTY.md
decisions:
  - "The gtt deadline is a true ONE-SHOT, not an automatic re-arm - the only model that satisfies the plan's own test 6"
  - "The colour rule is u8(f2i(v)), F2Ieq before the uint8 narrowing, not Math.trunc"
  - "wasmoon is handed an explicit glue URI in a browser; its default is an unpkg.com fetch"
  - "vite.config.ts unchanged: optimizeDeps.exclude was measured and makes no difference to the build"
metrics:
  duration: 41 min
  tasks: 3
  files: 5
  completed: 2026-09-04
---

# Phase 8 Plan 02: The Lua VM and its Grid API Host Summary

A real Lua 5.4 VM now runs inside HANGAR — in Node under Vitest and in the browser, behind its own
memoised gate that nothing awaits at boot — and drives the vendored simulator's firmware LED engine
through `pokeLayer` alone, with the serpentine, the F2Ieq integer rule, colour truncation, the
change-gated 10-deep touch FIFO and the one-shot timer all implemented as firmware implements them,
and with every vendored byte exactly where Phase 3 left it.

---

## The baseline, re-measured

**The plan told me to read `BASE_FILES` / `BASE_TESTS` / `BASE_E2E` from `08-01-SUMMARY.md`. Those
numbers are stale: Phase 4 ran to completion in between and landed ten more spec files.** Measured on
this machine, on this tree, at commit `381dfa1`, **before this plan touched anything**:

```
npm run test:quick
 Test Files  37 passed (37)
      Tests  534 passed | 1 todo (535)

npm run test:sweep
 Test Files  1 passed (1)
      Tests  9 passed (9)
```

**BASE_FILES = 37** (was 28 in `08-01-SUMMARY.md`)
**BASE_TESTS = 534** (was 468)
**BASE_E2E = 21** (was 10; from `04-VERIFICATION.md`, not re-run here — see Verification)

This is exactly the failure mode D-17 was written to prevent, and the helper is what made it
harmless: no assertion in this plan carries a literal, so re-measuring cost one command.

### Totals observed AFTER this plan

```
npm run test:quick
 Test Files  38 passed (38)
      Tests  542 passed | 1 todo (543)

npm run test:sweep
 Test Files  1 passed (1)
      Tests  9 passed (9)
```

Exactly `BASE_FILES + 1` and `BASE_TESTS + 8`, verified through the helper:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 38 542   -> exit 0
npm run test:sweep  2>&1 | node scripts/check-counts.mjs 1 9      -> exit 0
```

**Plan 08-03 should treat 38 / 542 (quick), 1 / 9 (sweep) and 21 (e2e) as its baseline — and should
re-measure rather than trust them.**

---

## The dependency

```
wasmoon@1.16.0            MIT    exact pin, in "dependencies"
  @types/emscripten@1.39.10   MIT    transitive, its only runtime dependency
```

**Why the exact pin.** Not the datestamp reason `@intechstudio/grid-protocol` has — wasmoon is
semver. The reason is that this phase's entire budget and fidelity story is measured against **one**
Lua implementation. A minor bump is a fidelity change until a run of the parity spec says otherwise,
so it is a deliberate, test-gated commit rather than a lockfile refresh. Plan 08-07 writes that into
`docs/PIN-POLICY.md`; `package.json` takes no comments, so this paragraph is the record until then.

**The lockfile did NOT reformat.** The plan expected the documented Phase 1 behaviour (tabs to two
spaces across the whole file). `git diff --stat package-lock.json` reported `20 insertions(+),
1 deletion(-)` — the real change and nothing else. Recorded because the plan told me to expect the
opposite and a later reader should not go looking for a reformat that never happened.

`@intechstudio/grid-protocol` still resolves to `1.20260825.1135`; `protocol-pin.spec.ts` reports
5 passed.

**`npm run licenses` exited 0 with no allowlist edit** (`git diff --quiet -- scripts/gen-licenses.mjs`
exits 0). It now covers 5 production dependencies. Both new licence texts materialised, and both in
the shape the plan predicted: `license-checker-rseidelsohn` creates a directory only for a **scoped**
package, so the unscoped one is a bare top-level file.

```
licenses/wasmoon@1.16.0-LICENSE.txt
licenses/@types/emscripten@1.39.10-LICENSE.txt
```

---

## The WASM asset: which branch, and the finding that made the choice mandatory

**Branch (c).** Measured, not assumed — all three branches were tried with a temporary probe importer
and a real `npm run build` each:

| Branch | What was tried | Result |
|---|---|---|
| (a) | a bare `await import("wasmoon")` reachable from a route | build exits 0, **no wasmoon asset emitted** |
| (b) | (a) plus `"wasmoon"` added to `optimizeDeps.exclude` | build exits 0, **still no asset**. `optimizeDeps` governs the dev-server prebundle; it has no effect on `vite build` |
| (c) | `new URL("wasmoon/dist/glue.wasm", import.meta.url).href` handed to the factory | **asset emitted and fingerprinted** |

`vite.config.ts` is therefore **unchanged** — branch (b) was tested and rejected on evidence, not
skipped.

### The emitted asset — plan 08-07 needs this

```
build/_app/immutable/assets/glue.Dlydm7r2.wasm     271,581 bytes  (271.58 kB, 111.94 kB gzip)
```

Reproduced byte-for-byte and hash-for-hash across two independent probe builds. The other `.wasm` in
that directory is `lua_fmt_bg.D_18ElAm.wasm` (628.14 kB) — the formatter, which is a different gate.
`glue.` is a safe discriminator; so is "any `.wasm` that is not `lua_fmt_bg`".

### The finding: wasmoon's default is a third-party CDN fetch

`node_modules/wasmoon/dist/index.js:1664-1674`, shipped verbatim into HANGAR's chunk:

```js
if (customWasmUri === undefined) {
  const isBrowser = ...;
  if (isBrowser) customWasmUri = `https://unpkg.com/wasmoon@${version}/dist/glue.wasm`;
}
```

So with no explicit URI, **every visitor who opens a Lua-backed card fetches 271 KB from
unpkg.com.** That is a privacy leak, a third-party availability dependency on the site's core
feature, and — for a GPLv3 site that serves its own Corresponding Source — a binary arriving from
somewhere other than the origin that is obliged to offer it. Branch (c) is therefore not a fallback
here; it is the only correct form, and it would have been correct even if branch (a) had emitted the
asset.

Under Node (Vitest, prerender, any future build-time frame rendering) the URI is left `undefined` on
purpose: wasmoon's emscripten glue then resolves `glue.wasm` off the filesystem next to its own
`dist/index.js`, which is both correct and faster than any URL HANGAR could hand it. `glueWasmUri()`
branches on `process.versions.node`, not on `typeof window`, so a Web Worker gets the fingerprinted
asset rather than falling through to the CDN.

### The asset is not in THIS plan's build, and that is a reachability fact

`npm run build` on the committed tree emits **only** `lua_fmt_bg`. Nothing in the application graph
imports `src/lib/sim/ready.ts` yet — `lua-host.ts` imports it, and only `lua-host.spec.ts` imports
`lua-host.ts`, and a spec is not an entry point. Vite cannot emit an asset for a module that is not
in the graph, so the plan's acceptance criterion "the VM's WASM asset is in the build" **cannot be
satisfied by any file this plan owns**. See Deviations.

What *was* proved, with the exact wiring shape plan 08-03 will use — a dynamic
`void import("$lib/sim/ready").then((m) => m.luaReady())` inside `Coverflow.svelte`'s `onMount`:

- the asset lands at `build/_app/immutable/assets/glue.Dlydm7r2.wasm`, same hash, same size;
- `src/lib/config-shape.spec.ts` stays **14 passed** — the D-21 source guard is anchored to the
  `from "..."` form, so a dynamic import is the rule being obeyed, and the artefact guard still finds
  no protocol chunk referenced from `build/index.html`;
- the build's `[plugin rolldown:vite-resolve]` warnings about `module` and `url` being "externalized
  for browser compatibility" are **benign**: the emitted chunk carries `{}` stubs for both and has no
  top-level `import "module"`. wasmoon's Node fallbacks sit behind `typeof document === 'undefined'`
  and are unreachable in a browser.

The probe was reverted; `git diff --quiet -- src/lib/ui/Coverflow.svelte` exits 0.

---

## The exported surface

### `src/lib/sim/ready.ts`

```ts
export type { LuaEngine, LuaFactory };          // TYPE-ONLY, erased at build time
export function luaReady(): Promise<LuaFactory>;
export function resetLuaReadyForTests(): void;
```

The `import type` is the load-bearing word. A value import at module scope would defeat the whole
plan; a type import is erased before a bundle exists, so `lua-host.ts` writes
`import type { LuaEngine } from "./ready"` and **never names the package**. Verified:
`grep -c "wasmoon" src/lib/sim/lua-host.ts` prints `0`. Plan 08-07's "only `ready.ts` names it" guard
is a one-module rule with no exemptions.

This gate is **separate from `padReady()` on purpose**: that one gates the ~628 KB Lua *formatter*,
this one the ~271 KB Lua *VM*. A browse-only visitor should download neither, and fusing them would
make either one imply the other.

### `src/lib/sim/lua-host.ts`

```ts
export type HostMidi = { ch; cmd; p1; p2; mode };            // all readonly
export type LuaHostOptions = { sim: PadSim; setup: string; timer?: string };

export class LuaHost {
  static create(opts): Promise<LuaHost>;
  tick(): void;  run(n: number): void;  close(): void;
  touchDown/touchMove/touchUp/touchTap(id, x, y): void;
  get midi(): readonly HostMidi[];
  get errors(): readonly string[];        // added - see Deviations
  get rxMode(): number | undefined;       // added - grxm is otherwise unobservable
  get coordMax(): 127 | 1023;
  get pendingTouches(): number;
  get timerArmed(): boolean;
  get tickCount(): number;
  get frame(): Uint8Array;                // added - delegates to the sim
  get animating(): boolean;               // added - delegates to the sim
}
export function createLuaHost(opts): Promise<LuaHost>;
```

`frame`, `animating`, `run`, `tick`, `coordMax`, `pendingTouches` and `touchDown/Move/Up` together
are already the structural `HostEngine` that `src/lib/sim/host.ts` accepts, minus `reset()`. Plan
08-03 supplies `reset()` in its wrapper (a Lua entry resets by constructing a new engine — D-08 as
amended).

---

## The Grid globals a configuration may call — plan 08-04's contract

**This list is exhaustive. Anything else raises `attempt to call a nil value`, by design** — a typo
that does nothing is a card that looks subtly wrong forever; a typo that raises is a card that fails
its gate. Test 8 pins that.

| Spelling | Firmware | Host |
|---|---|---|
| `glag(slot, n)` | `led_address_get` | `screenToHw(n % 9, n // 9)`, `n` clamped to 0..80 |
| `glc(a, L, r, g, b, k)` | `led_color` | `pokeLayer(a, L, glcStops(u8(r), u8(g), u8(b), k ~= 0))` |
| `glp(a, L, pha)` | `led_value` | `pokeLayer(a, L, { pha })` |
| `glf(a, L, fre)` | `led_animation_rate` | `pokeLayer(a, L, { fre })` — rate only, no phase reset |
| `gls(a, L, sha)` | `led_animation_type` | `pokeLayer(a, L, { sha })` |
| `glt(a, L, t)` | `led_timeout` | `pokeLayer(a, L, { timeout })` |
| `glpfs(a, L, p, f, s)` | `led_animation_phase_rate_type` | one `pokeLayer` with all three |
| `glim(v, lo, hi)` | `limit` | clamp, integers |
| `gtt(slot, ms)` | `timer_start` | arms the ONE-SHOT host deadline |
| `grxm(slot, mode)` | `rx_mode` | records the mode |
| `txma(v)` / `tyma(v)` | `touch_x_max` / `touch_y_max` | sets `coordMax` |
| `self:gms(ch, cmd, p1, p2, mode)` | `midi_send` | appends to the ordered log — **channel first** |
| `self:grxm(slot, mode)` | | same as the bare form |
| `self:txma(v)` / `self:tyma(v)` | | same as the bare forms |

**`grxm`, `txma` and `tyma` are registered BOTH as bare globals and as `self` methods.** The recipe
book's own configurations use both spellings — MIRROR's Setup opens with a bare `grxm(0,2)` while
RIBBON's opens with `self:txma(1023)`. `gms` is deliberately **method-only**: it is never called
bare in any candidate, so a bare `gms(...)` still raises.

An out-of-range address or layer is **ignored**, never thrown — "phase and index arguments are
clamped/guarded, so off-grid brushes are free" (08-RESEARCH pitfall 6). Colours are not guarded, and
that is the point of test 4.

`self` is created **in Lua**, never marshalled in from JS, so a configuration's arbitrary fields
(`self.q`, `self.m`, `self.h`, its own helper methods like `self.b`) are real Lua values the host
never touches. `self.touch_cb` is read back through a Lua-side dispatcher **at call time**, not
captured, so a config that reassigns it later is honoured. `self.midirx_cb` has no dispatcher yet —
there is no MIDI input source in HANGAR to route, and MIRROR is blocked on hardware (D-04). Adding
one is six lines whenever a source exists.

---

## The Timer, compiled once

```ts
await engine.doString("__hangar_timer = function() " + timerLua + " end");
this.timerFn = engine.global.get("__hangar_timer");
```

Compiled **once, at create**, and invoked as a cached JS-callable Lua function per tick. Never
`doString`-ed per tick: a Timer runs at 100 Hz, the smoke gate runs 200 ticks across seven entries
and `frames.spec.ts` samples to tick 1009, so re-parsing several hundred characters of Lua on every
one of those would put the Lua parser, not the simulation, at the top of the profile.

**The `--[[@cb]]` wrap was verified on a real body, not assumed.** ARC's canonical Timer (the one
that opens `--[[@cb]]gtt(0,20)local s=self ...`) wraps cleanly: the marker is a Lua *block* comment,
so it comments itself out and the remaining statements become the function body. `self` resolves as a
global inside the wrapper, which is exactly how every stored Timer reads it (`local s = self`). The
`load()` fallback the plan held in reserve was not needed.

Measured effect: **ARC ran 200 ticks — 100 timer fires, 100 MIDI records, 161 lit frame bytes, zero
errors** — inside a 542 ms spec file whose `tests` segment is 64 ms.

---

## `lua-host.spec.ts` — 8 tests, and what each one would catch

Measured wall duration, three consecutive runs: **499 ms / 483 ms / 462 ms** (`tests` segment
60-69 ms; the rest is transform and import). This is the first VM-backed spec in the repository and
it is **not** a slow one — the VM instantiates in single-digit milliseconds under Node, and the
formatter WASM is never touched. `docs/TESTING.md` can quote ~0.5 s.

1. The gate is memoised and lazy; two hosts share one factory; `resetLuaReadyForTests()` yields a
   different promise. **ORDER MATTERS** — it must stay first and it is the only test allowed to call
   the reset.
2. `glag` is the serpentine for all 81 logical cells, **and exactly 40 of them move**.
3. F2Ieq: `glp(a,1,127.5)` stores `0`, `glp(a,1,127.0)` stores `127`, `glp(a,1,60//7)` stores `8`.
4. Colour truncation: 260 wraps to 4; 300 wraps to 44 with `min` 2 and `mid` 22, so the `/20` and
   `/2` derivation is pinned and not just the narrowing; the sixth argument forces `min` black.
5. The blank sim is genuinely inert — `animating` false, `pendingTouches` 0, an all-zero frame after
   100 ticks, and still all-zero under a host with an empty Setup.
6. The timer in all three re-arm positions (see below).
7. The touch FIFO: change-gated, capped at 10, exactly one pop and one dispatch per tick.
8. MIDI recorded in order with the channel first, and an unregistered call rejecting with a message
   naming the symbol.

### The negative check — observed red, reverted

| | |
|---|---|
| Perturbation | `glag`'s body replaced with the identity (`return logical;`) in `src/lib/sim/lua-host.ts` |
| Green exit code | **0** |
| Red exit code | **1** |
| Test that went red | `resolves glag through the serpentine, and moves exactly 40 of the 81 cells` (test 2) |
| Message | `AssertionError: expected [] to have a length of 40 but got +0` |
| After `git checkout --` | `git diff --quiet -- src/lib/sim/lua-host.ts` exits 0; 8 passed again |

All three `src/lib/sim/` files were staged with `git add` **before** the perturbation — on an
untracked path `git checkout --` fails outright and `git diff --quiet` passes vacuously, so a
restore-and-compare over untracked files measures nothing (08-01's lesson, applied).

**The count assertion had to be moved to the front to earn that message.** The first attempt asserted
the per-cell equality inside the loop, so the identity stub reddened at
`expected +0 to be 8` for logical cell 0 — a true failure that diagnoses nothing. Asserting the
moved-cell count first, then the mapping, is what makes the failure say *"the serpentine is gone"*
instead of *"cell 0 is in the wrong place"*.

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] The `gtt` deadline is a true one-shot, not an automatic re-arm**

- **Found during:** Task 8-02-02, while designing test 6.
- **Issue:** The plan's implementation note says "on a tick where the deadline has passed, set the
  next deadline, **then** invoke the cached Timer function", with `gtt` inside the body only updating
  the period for the following arm. The plan's **own test 6** then requires that "a body with the
  re-arm at the END stops after its first raise". Those two are not simultaneously satisfiable: if
  `tick()` re-arms unconditionally from a stored period, a body that raises before reaching its
  trailing `gtt` is re-armed anyway and fires forever. The plan's prose describes what `PadSim` can
  afford — every body the compiler emits is `gtt`-first by construction, so there the two models
  coincide — and a hand-authored Timer is exactly the case where they do not.
- **Fix:** Modelled firmware's actual one-shot. `gtt` sets `timerDeadline = msClock + ms`; a fire
  sets `timerDeadline = null` **before** running the body; the body's own opening `gtt` is the only
  thing that re-arms. A `gtt`-first body fires on ticks 5, 10, 15, 20 and survives a raise; the same
  body with its `gtt` at the end fires once and stops, with `timerArmed` false. Both halves are
  asserted in test 6. This is strictly more faithful — it makes pitfall 4 *reproducible in the
  simulator* rather than a rule the gate has to take on trust.
- **Files modified:** `src/lib/sim/lua-host.ts`
- **Commit:** `ae077db`

**2. [Rule 1 - Bug] The colour rule is `u8(f2i(v))`, not `Math.trunc`**

- **Found during:** Task 8-02-02.
- **Issue:** The plan specifies `u8(v) = ((Math.trunc(v) % 256) + 256) % 256`. `Math.trunc(127.5)` is
  127, but the C argument conversion is `lua_tointeger` under `LUA_FLOORN2I = F2Ieq`, which **fails**
  on a fractional value and yields 0 — it never truncates a float. The uint8 truncation the research
  documents (260 becomes 4) happens afterwards, on an already-integral value, at assignment.
- **Fix:** `u8(v)` applies `f2i` first, then the uint8 wrap. Both rules are then one rule applied in
  the firmware's order. The plan's test 4 (`260 -> 4`) passes identically under either; the
  difference only shows on a fractional channel, where the plan's form would have reported 127 where
  firmware reports 0.
- **Files modified:** `src/lib/sim/lua-host.ts`
- **Commit:** `ae077db`

**3. [Rule 2 - Missing critical functionality] An explicit glue WASM URI, because the default is a CDN**

- **Found during:** Task 8-02-01, reading the shipped bundle to decide the branch.
- **Issue:** `LuaFactory` with no `customWasmUri` detects a browser and fetches
  `https://unpkg.com/wasmoon@1.16.0/dist/glue.wasm`. Third-party fetch, on the site's core feature,
  for a binary a GPLv3 site is obliged to serve itself.
- **Fix:** `ready.ts` hands the factory a Vite-fingerprinted same-origin URL in every non-Node
  environment. Documented in the module comment so nobody "simplifies" it away.
- **Files modified:** `src/lib/sim/ready.ts`
- **Commit:** `ae077db`

**4. [Rule 2 - Missing critical functionality] `createLuaHost` releases the VM when Setup raises**

- **Found during:** Task 8-02-03, writing test 8's rejection half.
- **Issue:** `LuaHost.create` builds the engine, then runs Setup. A Setup that raises — which is
  exactly what an unregistered call does — propagated out with the engine still allocated and no
  reference left anywhere to close it.
- **Fix:** `try`/`catch` around `install`, `engine.global.close()` then rethrow.
- **Files modified:** `src/lib/sim/lua-host.ts`
- **Commit:** `9d748ee`

**5. [Rule 2 - Correctness] `grxm`, `txma` and `tyma` registered as bare globals as well as `self` methods**

- **Found during:** Task 8-02-02, cross-reading the candidate configurations.
- **Issue:** The plan's table lists all four of `gms`, `grxm`, `txma`, `tyma` under `self:`. MIRROR's
  Setup (08-RESEARCH:694) opens with a **bare** `grxm(0,2)`. Registering the colon form alone would
  make that a `nil value` error.
- **Fix:** Both spellings registered for `grxm`/`txma`/`tyma`. `gms` stays method-only, because no
  candidate calls it bare and "an unlisted call must raise" is worth more than symmetry.
- **Files modified:** `src/lib/sim/lua-host.ts`
- **Commit:** `ae077db`

**6. [Rule 2 - Observability] Four getters the plan's surface did not list**

`errors` (the pcall log — D-14's execution smoke gate needs "no configuration raised" to be an
assertion rather than a crashed run), `rxMode` (without it "record the mode" records nothing
anybody can read), and `frame` / `animating` (one-line delegations to the sim that complete the
structural `HostEngine` shape 08-03 needs). Commit `ae077db`.

### Deferred / not done

**7. [Blocked by graph reachability] "The VM's WASM asset is in the build" is carried to plan 08-03**

- **Issue:** Nothing in the application graph imports `src/lib/sim/ready.ts`. `lua-host.ts` imports
  it; only `lua-host.spec.ts` imports `lua-host.ts`; a spec is not an entry point. Vite cannot emit
  an asset for a module outside the graph, so no file this plan owns can make the criterion true.
  Making it true would mean inventing an application-level consumer of the Lua engine — which is
  plan 08-03's `SimEngine` seam and D-08's design decision, not this plan's to make.
- **What was done instead:** The mechanism was proved end to end with a temporary probe in the exact
  shape 08-03 will use, the asset filename and byte size are recorded above, and the probe was
  reverted with `git diff --quiet` confirming a clean tree.
- **What 08-03 must check:** after wiring `createEngine` into the row, `ls
  build/_app/immutable/assets/ | grep -v lua_fmt_bg | grep .wasm` must print `glue.Dlydm7r2.wasm`.
  If it does not, the wiring is static where it should be dynamic, or it is not reachable at all.

**8. `self.midirx_cb` has no dispatcher.** No MIDI input source exists in HANGAR and MIRROR is blocked
on hardware (D-04). `grxm` is recorded so a configuration that asks for RX mode is observable; the
callback itself is six lines whenever a source arrives.

### Environment note

The plan's `BASE_FILES` / `BASE_TESTS` instruction pointed at `08-01-SUMMARY.md`, whose numbers were
nine files and 66 tests stale by the time this plan ran, because Phase 4 completed in between. That
SUMMARY says in as many words to re-measure rather than trust it, and the orchestrator's brief said
the same. Recorded here because every remaining Phase 8 plan carries the identical instruction and
will hit the identical staleness.

---

## Verification

| Check | Result |
|---|---|
| `npx vitest run --project server src/lib/sim/lua-host.spec.ts` | 1 file, **8 passed**, 462-499 ms |
| `grep -c "  it(" src/lib/sim/lua-host.spec.ts` / `it.each` count | `8` / `0` |
| `npm run test:quick` through the helper at `37+1` / `534+8` | exit 0 (**38 / 542**) |
| `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9` | exit 0 |
| `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts` | 1 file, **14 passed** |
| `npx vitest run --project server src/lib/protocol-pin.spec.ts` | **5 passed** |
| `npx vitest run --project server src/lib/licence-notices.spec.ts` | 1 file, **7 passed** |
| `npx vitest run --project server src/lib/config-shape.spec.ts` | 1 file, **14 passed** |
| `npm run build` | exit 0, `build/_app/immutable` present |
| `npm run check` | 440 files, **0 errors**, 0 warnings |
| `npm run lint` | exit 0 |
| `git diff --stat HEAD -- src/vendor/` | prints nothing |
| `grep -c "wasmoon" src/lib/sim/lua-host.ts` | `0` |
| `grep -q "await import(" src/lib/sim/ready.ts` | exit 0 |
| `package.json` / `package-lock.json` wasmoon | `1.16.0` in both |
| `@intechstudio/grid-protocol` | `1.20260825.1135`, unmoved |
| Port 4173 free before every build; no wrangler/workerd process | confirmed |

**`npm run test:e2e` was not run.** This plan adds no route, no component and no e2e test; the app
graph is byte-identical to the one Phase 4 left green (the only build-visible change is
`THIRD-PARTY.md`, which grew two lines and is asserted by `artifacts.e2e.ts` for existence, not
content). `BASE_E2E = 21` is carried forward from `04-VERIFICATION.md` unverified, and is flagged as
such so plan 08-03 — which does touch the row — re-measures it rather than inheriting an assumption.

---

## Notes for later plans

- **08-03:** `LuaHost` is `HostEngine` minus `reset()`. Construct the blank sim exactly as
  `lua-host.spec.ts`'s `blank()` does — `DEFAULT_PAD_STATE` with all four `PadSlot`s `"user"` — and
  keep test 5's inertness assertion in the parity spec, or a parity pass could be the simulator
  quietly answering its own question.
- **08-03:** wire `ready.ts` in through a **dynamic** import from `src/lib/ui/`, never a static
  `from "..."` — `config-shape.spec.ts` test 13 forbids the static form, and `Coverflow.svelte`
  already demonstrates the correct shape for `pad-sim`.
- **08-04:** the Grid globals table above is the complete contract. Anything outside it raises.
- **08-07:** the asset to look for is `glue.Dlydm7r2.wasm`; the discriminator against the formatter
  is `lua_fmt_bg`. `ready.ts` is the only module naming the package, with no exemptions needed.
- **Everyone:** re-measure the suite baseline. 38 / 542 / 9 / 21 is what this plan left behind.

## Self-Check: PASSED

All five created files and the three modified files exist on disk; all three commits
(`151252f`, `ae077db`, `9d748ee`) are present in `git log`.

## Requirements

`requirements: [CONT-02, PREV-02]` in the plan frontmatter is phase-level attribution, and **neither
was marked complete here** — deliberately, on 08-01's precedent:

- **CONT-02** ("at least six new configurations authored for spectacle are in the catalog") is
  unmet. This plan built the engine those configurations will run on and authored none. Waves 4 to 6
  (plans 08-04 to 08-06) author them.
- **PREV-02** ("the simulator consumes the exact compiler output — no hand-authored animation
  anywhere") is not yet demonstrated. The Lua host exists, but the claim only becomes true when the
  nine-preset parity spec in plan **08-03** shows the Lua route reproducing every layer record and
  every golden-frame hash. That spec is the Wave 0 gate D-07 makes a precondition for authoring
  anything, and marking the requirement complete before it runs would assert the very thing the gate
  exists to check.

`.planning/REQUIREMENTS.md` is therefore unchanged by this plan.
