---
phase: 05-tuning-budgets-and-shareable-links
verified: 2026-09-04T20:45:00Z
status: human_needed
score: 5/5 success criteria verified
re_verification: false
suites_run:
  test_quick: "58 files, 646 passed | 1 todo (647), 27.1 s — matches docs/TESTING.md"
  test_sweep: "3 files, 13 tests, 95.4 s — 32,852 reachable states costed, 0 over 908; kind cross-product 1,296 combinations, worst 906"
  check: "494 files, 0 errors, 0 warnings"
  lint: "prettier --check . clean, eslint clean, exit 0"
  build: "green — gen-og.mjs wrote 8 PNGs, vite build, postbuild archive 757 KB at 35b6fb3"
  e2e: "44 passed across chromium + webkit-phone, 41.9 s; port 4173 released, no listener remains"
human_verification:
  - test: "Open a tuned /c/<id>/#z.<stamp> link on a real iPhone or iPad in Safari; turn a knob, watch both meters settle, tap COPY LINK, paste the result into Notes."
    expected: "The pad animates, the rack wraps without sideways scroll, both meters land on real numbers, COPY LINK flips to LINK COPIED, and the pasted URL carries the stamp."
    why_human: "Playwright's webkit-phone project is a WebKit build at an iPhone 15 viewport, not iOS Safari on iOS. It is the closest automatable approximation and it is declared as such in the DEGR-01 traceability row, but it is not the device."
  - test: "Once the Basic Auth embargo lifts, paste a /c/aurora/ link into Discord (and into the Facebook / Twitter card debuggers)."
    expected: "A large embed with the 1200x630 pad picture, the name as title and the one-line description."
    why_human: "worker/index.js gates the whole site fail-closed via assets.run_worker_first, so no crawler can reach the prerendered <head> today. The tags and the bytes are asserted; the unfurl itself is not observable."
  - test: "Confirm the two Phase 5 entries under STATE.md § Blockers/Concerns should now be annotated (see Observations 1)."
    expected: "The stamp-checksum concern is annotated RESOLVED by the entry-consistency guard, and the 941/908 concern is annotated with what this phase's sweep actually measured."
    why_human: "A planning-document judgement about how to record a falsified prediction, not a code fact."
---

# Phase 5: Tuning, Budgets and Shareable Links — Verification Report

**Phase Goal:** Visitors can turn knobs on any configuration, see the 908-character budgets as a live
instrument instead of a write-time failure, and send the result to a friend as a link.
**Verified:** 2026-09-04T20:45:00Z
**Status:** human_needed — every automated truth verified; two items are inherently not automatable
and are already declared as qualifiers in `REQUIREMENTS.md`.
**Re-verification:** No — initial verification.

Verification was goal-backward and code-first. Every claim below was read out of the tree or produced
by running the suite on this machine; no number is taken from a SUMMARY.

---

## Goal Achievement

### Observable Truths

| #   | Truth (ROADMAP success criterion)                                                                                              | Status     | Evidence                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Three to six knobs per configuration from one shared vocabulary; live preview, debounced recompile; double-click / RESET ALL / SURPRISE ME never over budget | ✓ VERIFIED | 75 knobs over 16 entries (37 compiler-driven + 38 Lua), all inside 3–6 and gated both sides; 12 `KnobKind`s → 3 widgets; `COMPILE_DEBOUNCE_MS = 120` with an undebounced `PadSim` swap; 18,000 SURPRISE draws all inside 908                        |
| 2   | Two separate live meters, `chars / 908` plus a percentage, measured by the pinned `compressScript`; the ladder line tells the visitor when a feature was trimmed | ✓ VERIFIED | `BudgetMeter.svelte` renders `meterNumerals`/`meterPercent` off `meterView()`; `measurePadsim` calls `costOf(await compileState(...))` behind `padReady()`; four states present; `ladder.spec.ts` test 2 pins the compiler's own sentence byte for byte |
| 3   | Over budget: red meter, `TRY ON DEVICE` disabled with the reason, the knob named, one-click back-off, never reaching the wire   | ✓ VERIFIED | `--color-over` in three scoped uses; `budgetReason` → real `disabled` on `TryOnDevice`; `overBudgetKnob` names the culprit; `TURN IT DOWN` calls `over.apply()`; e2e tests 43 and 44 drive it in a browser via `/dev/tune/`'s real `PadReserved`   |
| 4   | Stamp in the URL hash, exact restore, `COPY LINK` confirms in its own state, older/unreadable links land on the base configuration | ✓ VERIFIED | `/c/<id>#z.<format><payload>`; BOTOR `d` / HANGAR `x`; 286,932 sweep round-trips green; entry-consistency guard present; `CopyLink.svelte` awaits nothing before `writeText` and has a select-and-copy fallback; e2e 31/34/37/40                    |
| 5   | Build-time OG image from the simulator; the whole experience works on every browser including iOS Safari                        | ✓ VERIFIED (2 declared qualifiers → human) | 8 PNGs for the 8 routed entries, written before `vite build`; absolute `og:image` + 11 tags in every prerendered head; `build.spec.ts` asserts the file behind each absolute URL; 5 `@webkit` tests pass in both projects |

**Score: 5/5 truths verified.**

---

### Required Artifacts

| Artifact                              | Expected                                       | Status     | Details                                                                                                                                          |
| ------------------------------------- | ---------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/tune/view.ts`                | knob view-model, meter arithmetic, zero imports | ✓ VERIFIED | 476 lines; `KNOB_KIND_NAMES` (12), `EVENT_BUDGET = 908`, `widgetFor`, `meterView`; `view.spec.ts` test 8 asserts it imports nothing at all           |
| `src/lib/tune/copy.ts`                | every visitor sentence, zero imports            | ✓ VERIFIED | Meters, ladder line, four over-budget sentences, three landings, live-region strings; `copy.spec.ts` 6 tests including a mechanical copy-rule pass  |
| `src/lib/tune/idle.ts`                | `requestIdleCallback` shim with a Safari fallback | ✓ VERIFIED | `onIdle` with `IDLE_TIMEOUT_MS`/`FALLBACK_DELAY_MS`; 3 tests cover both paths and double-cancel                                                     |
| `src/lib/tune/state.ts`               | `withChange`, `applyKnob`, `readKnob`, `resetAll` | ✓ VERIFIED | `withChange` drops `state.preset` (the load-bearing part); `resetAll` returns the card as published                                                 |
| `src/lib/tune/knobs.preset.ts`        | nine descriptor tables over `PadState`          | ✓ VERIFIED | 24 KB; `presetKnobs()` + `colourTargetFor()` derived from state; 6 tests including "no decorative knob: every option changes the compiled Lua"      |
| `src/lib/tune/knobs.lua.ts`           | token-substitution knobs from the catalog       | ✓ VERIFIED | `luaKnobs()` + `STAMP_OPTION_CEILING = 32`; 4 tests                                                                                                |
| `src/lib/tune/model.ts`               | the tuner: preview, debounce, meters, ladder, over-budget, stamp | ✓ VERIFIED | 23.6 KB; `buildTuner` with `set/reset/resetAll/surprise/stamp/destroy`; both routes; one `fitState` call site behind `needsLadder`                  |
| `src/lib/tune/surprise.ts`            | bounded roll that never lands over budget       | ✓ VERIFIED | `SURPRISE_ROLL_LIMIT = 12`, `SURPRISE_BUDGET_MS = 400`; caller applies the ladder on exhaustion                                                     |
| `src/lib/share/stamp.ts`              | encode/decode + entry-consistency guard         | ✓ VERIFIED | `parseHash`, `encodeFor`, `decodeFor`, `compilerKnobs`, `stampKnobs`; the `p<presetId>` row decided before the guard, exactly as VALIDATION records |
| `src/lib/share/url.ts`                | the share URL, zero imports                     | ✓ VERIFIED | `SITE_ORIGIN`, `STAMP_PREFIX = "z."`, `shareUrl()`                                                                                                 |
| `src/lib/og/png.ts` / `render.ts`     | dependency-free PNG + pad renderer              | ✓ VERIFIED | `node:zlib` only; `OG_WIDTH/OG_HEIGHT`, `FRAME_RGB`, `UNLIT_DOT_RGB`; 9 tests                                                                       |
| `scripts/gen-og.mjs`                  | 8 PNGs into `static/og/` before `vite build`     | ✓ VERIFIED | Ran during my build; 8 files, 4.3–7.0 KB each; header documents the ordering and the absolute-URL crawler finding                                   |
| `src/lib/ui/Knob.svelte`              | one component, three skins                      | ✓ VERIFIED | 18.4 KB, `ondblclick={onreset}` present, no div-slider                                                                                              |
| `src/lib/ui/KnobRack.svelte`          | wrapping grid, never scrolls                    | ✓ VERIFIED | 6.3 KB; `tune-ui.spec.ts` test 2 asserts no horizontal scroll anywhere in the tuning UI                                                             |
| `src/lib/ui/BudgetMeter.svelte`       | the two numbers                                 | ✓ VERIFIED | 9.2 KB; 26 px arithmetic, tabular nums, `over` outranks `stale`, no `meter` role (iOS reason documented)                                            |
| `src/lib/ui/BudgetMessage.svelte`     | ladder line + over-budget block                 | ✓ VERIFIED | 7.1 KB; `TURN IT DOWN` rendered only when there is a back-off to offer                                                                              |
| `src/lib/ui/StampNotice.svelte`       | three landings                                  | ✓ VERIFIED | 4.0 KB; `STAMP_RESTORED` / `stampOlder` / `stampUnreadable`, empty on `none`                                                                        |
| `src/lib/ui/CopyLink.svelte`          | copy without awaiting, honest fallback          | ✓ VERIFIED | 8.0 KB; no `await` before `writeText`; `fellBack()` reveals a readonly field and selects it                                                         |
| `src/lib/ui/TuningRegion.svelte`      | the reserved region filled                      | ✓ VERIFIED | 26.6 KB; both height constants (194 / 246, inner 162 / 214) with the measured 257 px wrap width; one live region on one trailing timer              |
| `src/lib/ui/ChosenPanel.svelte`       | the panel seam                                  | ✓ VERIFIED | Layout only; tuning snippet, share slot, three-region honesty stack                                                                                 |
| `src/lib/ui/TryOnDevice.svelte`       | disabled with the reason                        | ✓ VERIFIED | `budgetReason` is one of three honesty-slot strings, sized by the real `tryOnBudgetReason("Setup and Timer")`                                       |
| `src/lib/ui/Coverflow.svelte`         | live preview swap, stamp landing                | ✓ VERIFIED | `applyPreview` → `host.replaceEngine`; `land()` never partially restores; `replaceState("", …)` never pushes                                        |
| `src/lib/sim/host.ts` `replaceEngine` | swap in place, keep canvas/observer/slot         | ✓ VERIFIED | 3 dedicated tests (host.spec 12–14) including the reduced-motion still-before-paint order                                                           |
| `src/lib/pad/index.ts` `fitState`     | the gated ladder entry point                    | ✓ VERIFIED | `await padReady()` then `vendorFit`; documented as N+1 minifier calls                                                                               |
| `src/routes/c/[id]/+page.svelte`      | the Open Graph head                             | ✓ VERIFIED | 11 tags, absolute `og:image`, `twitter:card: summary_large_image`, unknown ids fall back to the shelf                                               |
| `src/routes/dev/tune/+page.svelte`    | the over-budget probe                           | ✓ VERIFIED | 227 lines; measured `RESERVE = { setup: 3, timer: 0 }` on tpad, opening at Scroll 7 = 910/908; no test-only prop anywhere in the region              |
| `e2e/tuning.e2e.ts`                   | 10 tests                                        | ✓ VERIFIED | Observed 10 titles; all green in chromium                                                                                                          |
| `e2e/tuning-webkit.e2e.ts`            | 5 `@webkit` tests, run in both projects          | ✓ VERIFIED | Observed 5 titles; 10 runs green (5 chromium + 5 webkit-phone)                                                                                     |
| `src/lib/ui/tune-ui.spec.ts`          | 5 structural rules                              | ✓ VERIFIED | No compiler specifier, no horizontal scroll, 44 px floor, alarm red in two components and on no button, both region constants present               |
| `src/lib/ui/identity.spec.ts`         | X-27 amendment                                  | ✓ VERIFIED | `be16c77` touched TOKENS (+`--color-over`), the hex regex (2→3) and five prose sites, nothing else; still 6 tests; untouched since                  |

No artifact is a stub, orphan or hollow prop. Every one of the twelve leaf modules and eleven
components is imported and used on a live path; the four `$lib/tune` modules are reachable from
`TuningRegion.svelte` and `/dev/tune/`, and `src/lib/og/*` from `scripts/gen-og.mjs` and `build.spec.ts`.

---

### Key Link Verification

| From                        | To                            | Via                                       | Status  | Details                                                                                                     |
| --------------------------- | ----------------------------- | ----------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `TuningRegion.svelte`       | `$lib/tune/model`             | `await import(...)`, never static         | ✓ WIRED | `config-shape.spec.ts` test 13/14 green; no compiler specifier reaches a first-paint chunk                    |
| `model.ts` `moveTo`         | `SimHost.replaceEngine`       | `onpreview` → `applyPreview` → `host`     | ✓ WIRED | Preview repaints on the knob's own tick; the compile is the only debounced half                               |
| `model.ts` `measurePadsim`  | pinned `compressScript`       | `costOf(await compileState(s))`           | ✓ WIRED | Behind `padReady()`; `model.spec.ts` test 4 holds the meters against the minifier's own numbers               |
| `model.ts` `ladderFor`      | `fitState`                    | one call site, guarded by `needsLadder`   | ✓ WIRED | `model.spec.ts` test 5 asserts there is exactly one door                                                      |
| `model.ts` `overView`       | `TryOnDevice` disabled        | `onover` → `onbudget` → `budgetReason`    | ✓ WIRED | Both in `Coverflow.svelte` (line 846/870) and in `/dev/tune/` (line 224/206)                                  |
| `BudgetMessage` `TURN IT DOWN` | `OverBudgetView.apply()`   | `onclick={over.apply}`                    | ✓ WIRED | e2e test 44 observes the meter go back inside                                                                 |
| `Coverflow.land()`          | `parseHash` + `decodeFor`     | `await import("$lib/share/stamp")`        | ✓ WIRED | `restored` sets every index; `older`/`unreadable` set none and open the panel to explain                      |
| `model.ts` `emit()`         | `CopyLink` `url`              | `payload` → `onstamp` → `shareUrl(...)`   | ✓ WIRED | Recomputed eagerly on every emit, which is what makes the click handler await-free                            |
| `/c/[id]/+page.svelte` head | `static/og/<id>.png`          | absolute `og:image` on `SITE_ORIGIN`      | ✓ WIRED | `build.spec.ts` resolves each absolute URL to a file under `build/`; `e2e/artifacts.e2e.ts` serves it         |
| `package.json` `build`      | `scripts/gen-og.mjs`          | `node scripts/gen-og.mjs && vite build`   | ✓ WIRED | Visible chain, not a lifecycle hook — verified by running the build                                           |

---

### Data-Flow Trace (Level 4)

| Artifact                | Data variable        | Source                                             | Real data? | Status     |
| ----------------------- | -------------------- | -------------------------------------------------- | ---------- | ---------- |
| `BudgetMeter.svelte`    | `view.used/pct`      | `meterView()` ← `costOf(compileState())` ← WASM minifier | Yes    | ✓ FLOWING  |
| `KnobRack` / `Knob`     | `KnobView[]`         | `knobViews()` ← `stampKnobs(entry)` ← catalog + `_pad` | Yes      | ✓ FLOWING  |
| Hero canvas             | `SimEngine`          | `new PadSim(stateOf(indices))` / `createEngine()`    | Yes        | ✓ FLOWING  |
| `BudgetMessage`         | `ladder` / `over`    | `fitState()` plan + `PadCost.free`                   | Yes        | ✓ FLOWING  |
| `CopyLink`              | `url`                | `shareUrl(id, encodeFor(entry, indices))`            | Yes        | ✓ FLOWING  |
| `StampNotice`           | `kind`               | `decodeFor(entry, parseHash(page.url.hash))`         | Yes        | ✓ FLOWING  |
| `/c/<id>/` OG head      | `ogImage`            | `SITE_ORIGIN` + real file written by `gen-og.mjs`    | Yes        | ✓ FLOWING  |
| `/dev/tune/` probe      | `budgetReason`       | `cost()` with a real `PadReserved`, not a fake cost   | Yes        | ✓ FLOWING  |

No hollow props found. The one place a hardcoded empty could have hidden — `TryOnDevice`'s
`budgetReason` sizing twin — is the real `tryOnBudgetReason("Setup and Timer")` call, not a
transcription.

---

### Behavioral Spot-Checks

| Behaviour                                      | Command                                                             | Result                                                                          | Status |
| ---------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------ |
| Whole unit suite                               | `npm run test:quick`                                                | 58 files, 646 passed \| 1 todo (647), 27.1 s                                     | ✓ PASS |
| Reachability + round-trip sweeps               | `npm run test:sweep`                                                | 3 files, 13 tests, 95.4 s; 32,852 states costed, **over budget 0**, tpad worst 907 | ✓ PASS |
| Types                                          | `npm run check`                                                     | 494 files, 0 errors, 0 warnings                                                  | ✓ PASS |
| Format + lint                                  | `npm run lint`                                                      | prettier clean, eslint clean, exit 0                                             | ✓ PASS |
| Production build incl. OG generation           | `npm run build`                                                     | green; 8 PNGs, source archive 757 KB at `35b6fb3`                                | ✓ PASS |
| Browser suite, both projects                   | `npx playwright test`                                               | **44 passed** in 41.9 s                                                          | ✓ PASS |
| OG guard against a real `build/`               | `npx vitest run --project server src/lib/og/build.spec.ts …`        | 5 files / 33 tests green **with `build/` and `static/og/` present** — the guard was in its asserting branch, not its absent branch | ✓ PASS |
| Vendored tree unchanged                        | `git diff --stat 16e5232..HEAD -- src/vendor/`                      | empty                                                                            | ✓ PASS |
| Vendored bytes match the pin                   | `vendored-diff.spec.ts` (+ `front-door.spec.ts`)                     | 2 files / 22 tests green against `a0fb69d5`                                      | ✓ PASS |
| Port hygiene                                   | `netstat -ano \| grep 4173 \| grep LISTEN`                          | no listener; only TIME_WAIT sockets; no `workerd`/`wrangler` process              | ✓ PASS |

Every observed number matches `docs/TESTING.md`'s "How to run it" table exactly — the table is
current, not aspirational.

---

### Detail on each success criterion

**Criterion 1 — the knobs.**
The vocabulary is one table: `KNOB_KIND_NAMES` restates the vendored twelve-member `KnobKind` union
and `view.spec.ts` test 1 asserts it in both directions with a type-level `Exclude`, so a member added
upstream stops `npm run check`. `widgetFor` collapses all twelve onto `swatch | words | rail` and
test 2 asserts every kind resolves. Counted from the tree: 37 compiler-driven knobs across the nine
BOTOR presets and 38 across the seven Lua entries (arc 5, chorus 6, euclid 6, ghost 5, lattice 6,
morph 5, sonar 5) — **75 knobs over 16 entries**, and both routes are gated at 3–6
(`knobs.preset.spec.ts` test 1 and `catalog.spec.ts` line 166). The preview is not debounced:
`moveTo()` calls `swapEngine(new PadSim(stateNow()))` on the same tick, and only `schedule()` is
delayed by `COMPILE_DEBOUNCE_MS = 120`; `model.spec.ts` tests 1 and 2 pin both halves. `replaceEngine`
keeps the canvas, its backing store, its observer registration and the hero flag — `host.spec.ts`
test 12 asserts the hero flag survives by observing a contact reach the swapped-in engine, which is
the property that matters here. (A newly built `PadSim` does start its own animation at tick 0; that
is deliberate and is what makes the reduced-motion still frame deterministic. Nothing in the roadmap
criterion asks for tick continuity.) Double-click reset is `ondblclick={onreset}` on `Knob.svelte`
line 176. `RESET ALL` and `SURPRISE ME` are the region's, not the rack's. The 18,000-draw property is
real: `surprise.spec.ts` `DRAWS = 2000` × 9 compiler-driven entries, every draw checked against
`fits()`.

**Criterion 2 — the meters.**
Two `BudgetMeter` instances, each fed a `MeterView` built by `meterView()` from a number and a
three-value `MeterFeed`. `over` is derived from the number and outranks `stale`, so a warning is never
dimmed. The numbers come from `costOf(await compileState(state), reserved)` behind `padReady()` — the
pinned `compressScript`, the same function the fit ladder is calibrated on. Lua entries take the
`measureLua` path and an empty Timer reads a true `0 / 908` rather than a dead meter. The four states
(measuring / settled / stale / over) are all rendered; there are no invented warn bands. The ladder
line exists and is a tested guard: `ladder.spec.ts` test 2 renders the compiler's own `step.label`
through `ladderLine()` and compares byte for byte, with the sentence held nowhere in the spec itself.

**Criterion 3 — over budget, and whether the qualifier is honest.**
It is honest, and unusually so. The claim is falsifiable and was falsified in my run: the sweep costed
**32,852 reachable knob states** and reported `over budget 0`, with tpad's worst at 907 of 908 and the
kind cross-product's worst at 906. So no visitor can reach the state, and the phase says exactly that
rather than pretending otherwise. What it built instead is a guard that is watched working:
`ladder.spec.ts` produces the overrun by handing a real `PadReserved` to the vendored `cost()` and
reads the overrun figure out of the compiler's own diagnostic; `/dev/tune/` mounts the shipped region
with a **measured** `{ setup: 3 }` reserve on tpad, chosen small enough that the knob straddles 908 in
both directions; e2e tests 43 and 44 are a real browser observing the red meter, the disabled primary
control with its reason, the named knob and the working back-off. No test-only prop was added to the
region to make this reachable — the reserve is Phase 7's install-marker mechanism used early. The
`--color-over` token appears in exactly three scoped uses (meter fill + outline, meter numerals +
percentage, message left rule) and on no button, asserted by `tune-ui.spec.ts` test 4.

**Criterion 4 — the link.**
`/c/<id>#z.<format><payload>`, hash only. `encodeFor` returns `undefined` at the defaults, so a base
link carries no fragment at all. Compiler entries reuse BOTOR's `encodeStamp` (format `d`); Lua
entries use HANGAR's `x` with one base-32 character per knob plus a shape character. Restoration is
exact and never partial: `restored` writes every index, `older` and `unreadable` write none. The
entry-consistency check is present and is the whole of SHARE-03's "never a subtly wrong one" —
`encodeStamp(rebuilt) !== payload` ⇒ unreadable, with the one legitimate false negative (`p<presetId>`)
handled by a string comparison **before** the check, exactly as `05-VALIDATION.md` specified. So
`#z.pdial` under aurora is unreadable and `#z.paurora` under aurora is restored at defaults; the sweep
round-tripped 32,852 compiler vectors and 254,080 Lua vectors. `COPY LINK` → `LINK COPIED` is its own
2-second state; the handler contains no `await` before `navigator.clipboard.writeText`, and the
no-clipboard branch reveals a readonly field and selects it (e2e test 40 forces that branch with
`addInitScript`).

**Criterion 5 — the unfurl and every browser.**
Eight PNGs for the eight routed entries, 1200×630, 4.3–7.0 KB, written into `static/og/` by
`gen-og.mjs` **before** `vite build` (verified by running the build, not by reading the script). Every
prerendered head carries all eleven tags with an absolute `og:image`; I read
`https://hangar.sabotond.workers.dev/og/aurora.png`, `<title>Aurora — HANGAR</title>` and
`twitter:card` out of `build/c/aurora/index.html`. `build.spec.ts` is genuinely the guard the phase
says it is — the crawler ignores absolute URLs, so the build cannot catch a missing image, and the
spec resolves each absolute URL back to a file under `build/`. Critically, the spec's `existsSync`
guards were in their **asserting** branch during my run because `build/` and `static/og/` both
existed; I re-ran it explicitly after a fresh build to be sure. The WebKit phone project carries five
`@webkit` tests that run in both projects (front door, choosing without sideways scroll, a knob turn
with both meters settling, `COPY LINK`'s confirm state, and a shared link landing with install present
but disabled) — 10 green runs.

---

### Requirements Coverage

| Requirement | Source plans        | Status                | Evidence                                                                                                                     |
| ----------- | ------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| TUNE-01     | 05-03, 05-08, 05-10 | ✓ SATISFIED           | 75 knobs / 16 entries, 3–6 gated on both routes; 12 kinds → 3 widgets                                                          |
| TUNE-02     | 05-04, 05-11        | ✓ SATISFIED           | Undebounced `PadSim` swap + 120 ms debounced compile; `model.spec.ts` 1–2; e2e 6                                               |
| TUNE-03     | 05-04, 05-09        | ✓ SATISFIED           | Two meters, pinned minifier, `chars / 908` + `%`; e2e 24                                                                       |
| TUNE-04     | 05-04, 05-09, 05-12 | ✓ SATISFIED (qualified) | Qualifier **justified**: the sweep I ran reports 0 of 32,852 over 908; the ladder line is pinned to the compiler's own sentence and watched in a browser |
| TUNE-05     | 05-04, 05-09, 05-12 | ✓ SATISFIED (qualified) | Qualifier **justified**: every element is real code driven by a real `PadReserved`; e2e 43 and 44 are a browser doing exactly that |
| TUNE-06     | 05-04, 05-08, 05-10 | ✓ SATISFIED           | `ondblclick={onreset}`; `resetAll()` lands on the card as published; e2e 25                                                    |
| TUNE-07     | 05-04, 05-10        | ✓ SATISFIED           | 18,000 draws all inside 908; exhausted rolls fall to the ladder rather than to a failure state; e2e 30                          |
| SHARE-01    | 05-05, 05-11        | ✓ SATISFIED           | Hash only; 286,932 sweep round-trips; e2e 34                                                                                   |
| SHARE-02    | 05-09, 05-11        | ✓ SATISFIED           | `LINK COPIED` own state + select-and-copy fallback; e2e 31, 40, and the `@webkit` twin                                          |
| SHARE-03    | 05-05, 05-09, 05-11 | ✓ SATISFIED           | Three landing sentences; entry-consistency guard; e2e 37                                                                       |
| SHARE-04    | 05-06, 05-07        | ✓ SATISFIED (2 qualifiers) | Both qualifiers **justified and precise**: 8 of 16 (the other 8 have no route and therefore no head), and the real unfurl is unobservable behind `run_worker_first` Basic Auth → human item |
| DEGR-01     | 05-01, 05-12        | ✓ SATISFIED (qualified) | Qualifier **justified**: 5 tagged tests × 2 projects, all green. "WebKit at a phone viewport" is stated rather than "iOS Safari" → human item |

No orphaned requirements: every ID `.planning/ROADMAP.md` maps to Phase 5 is claimed by at least one
plan and is covered above. Nothing in `REQUIREMENTS.md` claims more for this phase than the tree
delivers, and the three qualifier rows say more about their limits than a verifier would have had to
extract.

---

### Anti-Patterns Found

| File                             | Line   | Pattern                                   | Severity | Impact                                                                                                             |
| -------------------------------- | ------ | ----------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/lib/tune/copy.ts`           | 5 fns  | `${by} characters` with no singular form   | ℹ️ Info  | "1 characters over 908". Already recorded in `deferred-items.md` with its reasoning; lives entirely inside the branch this phase measured as unreachable |
| `src/lib/tune/model.ts`          | ~420   | `backOff = ""` when there is nothing to offer | ℹ️ Info | Not a stub — `BudgetMessage` renders no control for an empty string, which is the honest answer for tpad (its only sheet is `sends` and `fit()` proposes no steps at any reserve) |
| whole phase                      | —      | TODO / FIXME / XXX / HACK / PLACEHOLDER   | none     | Zero occurrences in any Phase 5 source file                                                                          |
| whole phase                      | —      | `return null` / `return []` / `=> {}` on a render path | none | None; every `[]`/`{}` initial value found is overwritten by a fetch, a compile or a store before it reaches a render  |

No blockers, no warnings.

---

### Standing guards (item 6)

| Guard                                                        | Status  | Evidence                                                                                             |
| ------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------ |
| Phase 4 first-paint chunk guards (`config-shape.spec.ts` 13/14) | ✓ GREEN | Re-run explicitly against the fresh `build/`                                                            |
| Phase 8 laziness guards (`sim/lazy.spec.ts`, `e2e/catalog.e2e.ts`) | ✓ GREEN | Both in the green runs above                                                                            |
| `src/vendor/` untouched                                       | ✓ GREEN | `git diff --stat 16e5232..HEAD -- src/vendor/` is empty; `vendored-diff.spec.ts` green against `a0fb69d5` |
| `identity.spec.ts` amended exactly per X-27, and nowhere else  | ✓ GREEN | `be16c77` is the only commit touching it; the diff is TOKENS + the hex regex + five prose sites; 6 tests before and after |
| No third colour beyond `--color-over`                          | ✓ GREEN | One `@theme` declaration, three scoped uses, none on a button; `identity.spec.ts` still fails a tenth token or a fourth hue |
| No Claude/Anthropic attribution                                | ✓ GREEN | Source and docs: zero. Commit messages `16e5232..HEAD`: zero co-author trailers and zero "generated with" lines; the only matches anywhere are the tooling filenames in `.gitattributes`/`.gitignore`/`.prettierignore`, and `CLAUDE.md` is `export-ignore`d out of the GPLv3 source archive |
| No sibling repo touched                                        | ✓ GREEN, with a note | See Observation 3                                                                                       |
| No paid dependency                                             | ✓ GREEN | `package.json` adds nothing in this phase; `wasmoon` and `@intechstudio/grid-protocol` are exact-pinned OSS |
| Working tree clean, nothing committed by this verification     | ✓ GREEN | `git status --short` empty apart from gitignored `.tmp-e2e/`                                            |

---

### Observations (non-blocking, recorded rather than fixed)

**1. `STATE.md` § Blockers/Concerns still carries two Phase 5 items this phase's own measurements
settle, with no annotation.**
The Phase 2 entry in that same list carries an explicit `RESOLVED 2026-09-03 by the hardware run`
prefix, which is the house form — these two do not:

- *"[Phase 5] The base36 stamp checksum is a known open hole in prior art (a relabelled stamp can
  decode to a different card) — needs its own design pass before sharing goes public."* This is the
  exact hole `stamp.ts`'s entry-consistency guard closes; `stamp.spec.ts` test 5 pins both directions
  and a Phase 5 decision records that deleting the guard was **observed** to make a minted link load a
  different card. The concern is answered; the list does not say so.
- *"[Phase 5] The 941/908 over-budget preset combination noted in PROJECT.md is known pre-existing
  compiler debt; **it surfaces during the full-range knob sweep**."* The full-range knob sweep ran and
  it did not surface: 0 of 32,852, worst 907. `PROJECT.md` line 85 still reads "the worst measured
  stack was 941/908 at full brightness" unqualified — defensible as a statement about BOTOR's whole
  parameter space, but a reader landing on it after this phase has no way to tell that HANGAR's
  reachable subset was measured and is clean.

Neither affects any shipped behaviour. Both are one sentence each, and both are exactly the kind of
stale record this project otherwise refuses to leave lying around.

**2. Two of the three deferred items named in the verification brief are not in `deferred-items.md`.**
The "1 characters over 908" pluralisation is there, fully reasoned. The **unselected-dot hover no-op**
is recorded, but only inside `05-08-SUMMARY.md` as a finding for the designer — reasonable, since it
is a question about the UI spec rather than a defect to schedule. The **`state add-decision` prefix
defect** is recorded nowhere I can find: no summary, no deferred item, no decision. (The tree does show
the symptom — `add-decision` writes `[Phase 05]` while other `STATE.md` sections carry `[Phase 5]` —
but nothing names it.) 47 Phase 05 decisions did land, so nothing was lost.

**3. The sibling `grid-editor` checkout has 11 modified files, and none of them is HANGAR's doing.**
Recording it because "no sibling repo touched" is an explicit gate and a bare `git status` there looks
alarming. The diff is 1,609 insertions of BOTOR's own **motor faders** feature — `REDESIGN.md` gains
two changelog rows dated `hardware-verified 2026-09-04`, `_pad.ts` +319, `pad-sim.ts` +278,
`pad.test.js` +424, `pad-sim.test.js` +436. It is unrelated to tuning, budgets or sharing, and
HANGAR's vendored copies are byte-identical to the pinned `a0fb69d5` (empty vendor diff, green
`vendored-diff.spec.ts`, which reads nothing outside this repository). The only HANGAR code that
touches the sibling at all is `format-parity.spec.ts`, which runs the sibling's own Prettier in
**stdout mode** with no write, and `capture-preset-baseline.mjs`, which is not part of any suite.

*Forward risk, for whoever schedules the next protocol bump:* that same sibling diff says **"Stamp
format 'd' gains a five-bit motor block on the fader branch … the invariant sweep grows to 5184
states."* HANGAR's stamp compatibility and its 908-character ladder are calibrated against
`a0fb69d5`. `docs/PIN-POLICY.md`'s six-item checklist is the right instrument for it; this is just the
first concrete sign that it will be needed.

---

### Human Verification Required

#### 1. A real iOS device

**Test:** Open a tuned `/c/<id>/#z.<stamp>` link on an iPhone or iPad in Safari. Turn a knob, watch
both meters settle, tap `COPY LINK`, paste into Notes.
**Expected:** The pad animates; the knob rack wraps rather than scrolling sideways; both meters land
on real numbers; `COPY LINK` flips to `LINK COPIED`; the pasted URL carries the stamp; `TRY ON DEVICE`
is present, disabled and says why.
**Why human:** `webkit-phone` is a WebKit build at an iPhone 15 viewport driven by Playwright, not
iOS Safari on iOS. It is the closest automatable approximation, it is green, and DEGR-01's
traceability row already says exactly this — but the promise in the requirement is about the device.

#### 2. A real Discord unfurl, after the embargo

**Test:** Once the Basic Auth gate is removed, paste `https://hangar.sabotond.workers.dev/c/aurora/`
into Discord, and run the same URL through the Facebook and Twitter card debuggers.
**Expected:** A large embed carrying the 1200×630 pad picture, `Aurora — HANGAR` as the title and the
one-line description.
**Why human:** `worker/index.js` gates every request fail-closed under `assets.run_worker_first`, so
no crawler can reach the head. The tags, the bytes and the served asset are all asserted; the unfurl
is not observable from here.

#### 3. A judgement call on two planning records

**Test:** Decide whether the two Phase 5 entries under `STATE.md` § Blockers/Concerns should be
annotated (Observation 1), and whether `PROJECT.md`'s 941/908 sentence wants a clause pointing at the
reachability sweep.
**Expected:** Either an annotation in the house `RESOLVED <date> by <mechanism>` form, or a decision
that both stay as written because they describe BOTOR rather than HANGAR.
**Why human:** It is a documentation judgement about how to record a falsified prediction, not a code
fact, and this verification is not permitted to edit either file.

---

### Gaps Summary

There are no gaps in the phase's goal. All five success criteria are achieved in code, on live paths,
with real data flowing, and every claim is backed by a suite I ran rather than by a SUMMARY I read:
646 unit tests, 13 sweep tests over 32,852 costed states, 494 files type-checked clean, a green
production build that generated the eight OG images itself, and 44 browser tests across two engines.

The status is `human_needed` rather than `passed` for three reasons, none of which is a defect:

1. **iOS Safari is approximated, not tested.** Declared honestly in DEGR-01's row; needs a device.
2. **The Discord unfurl is unobservable behind the Basic Auth embargo.** Declared honestly in
   SHARE-04's row; needs the embargo to lift.
3. **Two planning records are stale in the phase's own favour** (Observation 1) and one deferred item
   named in the brief was never written down (Observation 2). Both are documentation, both are one
   sentence, and neither touches a shipped byte — but this project's standard is that a record which
   has been overtaken says so, and these two do not.

The most notable thing about this phase is what it did with an inconvenient measurement: TUNE-04 and
TUNE-05 specify a failure state that turns out to be unreachable, and rather than fake a ladder or
quietly ship an untested branch, the phase measured the whole reachable space, said plainly that no
visitor can get there, built the guard anyway, and pointed a real browser at it through a probe using
a real compiler reserve. The `guard, unreachable in practice` qualifier on those two requirement rows
is not a hedge — it is a more precise claim than "Complete" would have been, and I was able to
reproduce every number in it.

---

_Verified: 2026-09-04T20:45:00Z_
_Verifier: gsd-verifier — goal-backward, code-first, suites executed on this machine_
