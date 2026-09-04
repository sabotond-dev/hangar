---
phase: 5
slug: tuning-budgets-and-shareable-links
status: complete
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-04
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is the Nyquist contract. `docs/TESTING.md` (updated by plan 05-12) is the developer-facing
> companion and deliberately does not duplicate the map below. There is no `docs/VALIDATION.md`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 (node env, `expect.requireAssertions`, `passWithNoTests`), two projects per Phase 3 D-10: `server` (quick) and `sweep` + @playwright/test 1.62.1 over `wrangler dev` on `./build` |
| **Config file** | `vite.config.ts` `test.projects` — **changed once, in plan 05-05**, to admit `src/**/*.sweep.spec.ts` into `sweep` and exclude it from `server`. `playwright.config.ts` — **changed once, in plan 05-01**, to gain a `projects` array |
| **Quick run command** | `npm run test:quick` (= `vitest run --project server`) |
| **Sweep command** | `npm run test:sweep` (= `vitest run --project sweep`) |
| **Wave run command** | `npm run check && npm run lint && npm run test:quick && npm run test:sweep` |
| **Full suite command** | the wave run plus `npm run build` and `npm run test:e2e` |
| **Estimated runtime** | quick ~4.5 s before this phase, higher after (see "The new cost"); sweep ~40 s before, **~85 s** after (the reachability sweep costs all 16,645 states but ladders only the scoped few — see "The new cost"); e2e ~40 s before, higher after twelve more runs, including the build and the wrangler cold start |

**Baseline measured on this machine on 2026-09-04, at planning time, on `eafcb1d` plus the staged
08-07 files:**

```
npm run test:quick   ->  43 files, 563 passed | 1 todo (564), 4.46 s
npm run test:sweep   ->  1 file, 9 tests
npm run test:e2e     ->  23 passed          (recorded in 08-08-SUMMARY.md)
npm run check        ->  456 files, 0 errors
```

**Those four numbers are recorded here as provenance and are asserted nowhere.** Per Phase 8 D-17 no
plan in this repository may carry a literal suite total. **Task 5-01-01 re-measures all four at
execution time and writes them into `05-01-SUMMARY.md` as the Phase 5 baseline**; every later plan
reads `BASE_FILES` / `BASE_TESTS` / `BASE_SWEEP_FILES` / `BASE_SWEEP_TESTS` / `BASE_E2E` from the
previous plan's SUMMARY and asserts baseline + delta through `scripts/check-counts.mjs`. Per-file
counts are exact and **are** asserted absolutely, because a per-file count is unaffected by anything
another phase does.

**Two e2e variables, and they are not interchangeable.** `BASE_E2E` is the **phase baseline**,
measured once by task 5-01-01 and never recomputed; plan 05-07 is the only plan that asserts against
it (`BASE_E2E + 1`), because the total has not moved before then. Plans 05-11 and 05-12 assert
against **`PREV_E2E`** — the e2e total recorded in the immediately preceding plan's SUMMARY —
because by then it has. `BASE_FILES` and `BASE_TESTS` already work the `PREV_` way (each plan reads
the previous SUMMARY's numbers); the e2e pair is spelled out because the two names would otherwise
read as one. **The sweep is the exception to all of it**: it is asserted with its literal file and
test counts (`1 9`, then `3 13`) in every plan including 05-01, because the `sweep` project is a
named-file include and its total is a property of this phase's own files.

### Facts the map depends on

Measured in this repository on 2026-09-04 against `@intechstudio/grid-protocol@1.20260825.1135` and
the vendored compiler at `a0fb69d5`, by the researcher (`05-RESEARCH.md`) and re-read by the planner
from the sources. They are reproductions, not estimates.

- **Over budget is unreachable.** 1,080 kind combinations with every expensive flag on: worst 906.
  16,645 HANGAR knob-cross-product states across the nine presets: zero over 908. `fit()` returns
  `{ fits: true, steps: [] }` for every state a visitor can produce, and every Lua entry was proven
  in budget across its whole cross-product in Phase 8. **TUNE-04 and TUNE-05 are therefore built as
  tested guards** (D-10 as amended): unit-tested against a synthetic over-budget result produced by
  passing a real `reserved` to `cost()`/`fit()`, and exercised end to end on `/dev/tune/`. They are
  never faked, and the SUMMARY that completes them carries the qualifier.
- **`KnobKind` is a label, not a binding.** Nothing vendored maps a kind to a `PadState` field;
  BOTOR's `PadPanel.svelte` at the pinned SHA does it per preset. `05-RESEARCH.md` § The recovered
  semantics is the transcription, and `knobs.preset.spec.ts` ties it back to `presetById(id).knobs`
  so a vendored re-sync goes red and names the card.
- **`withChange` is module-private** (`_pad.ts:3156`) and must be reimplemented. Deleting
  `state.preset` is load-bearing: `encodeStamp` short-circuits to `p<presetId>` whenever `preset` is
  set, so a tuned state that kept it encodes as the untuned card.
- **The stamp round-trip is a measured identity.**
  `JSON.stringify(normalisePadState(s)) === JSON.stringify(decodeStamp(encodeStamp(s)))` holds
  because `normalisePadState` quantises colour in the *state*, not in the codec.
- **`decodeStamp` already fails closed** on an unknown format, an out-of-domain field, a set reserved
  bit, a truncated payload and a non-zero tail. What it does **not** do is check that the stamp
  belongs to *this* entry: `/c/aurora/#z.pdial` decodes cleanly to Dial. The entry-consistency check
  (`encodeStamp(rebuilt) === payload`) is the whole of SHARE-03's "never a subtly wrong one".
- **And the consistency check has one legitimate false negative, handled by a row rather than by an
  exception.** `p<presetId>` is what `encodeStamp` emits for an untuned card, so it is exactly the
  stamp a BOTOR base-card link carries — but the check rebuilds by *applying* knobs, every `apply`
  goes through `withChange`, and `withChange` deletes `state.preset`, so `encodeStamp(rebuilt)` is a
  field dump and never equals `paurora`. `/c/aurora/#z.paurora` is therefore decided **before** the
  check, by one string comparison against `entry.source.presetId`, and lands `restored` at every
  default index. `p<any other preset>` stays `unreadable`. Plan 05-05 carries the row and pins both
  directions inside `stamp.spec.ts` test 5.
- **`zlib.crc32` exists in Node 24** and `deflateSync` emits the RFC-1950 stream `IDAT` holds. A
  realistic 1200×630 pad frame deflates to ~4 KB.
- **SvelteKit's prerender crawler follows `og:image`** (`node_modules/@sveltejs/kit/src/core/postbuild/crawl.js`)
  and `vite.config.ts`'s `handleHttpError` rethrows every 404 except three known paths. The PNGs
  must therefore exist in `static/og/` **before** `vite build` runs, and `handleHttpError` must not
  be widened.
- **`requestIdleCallback` is absent in Safari stable.** The formatter prefetch needs a `setTimeout`
  fallback or iOS pays the full 628 KB at the moment the panel opens.
- **`navigator.clipboard.writeText` works on iOS Safari 13.1+** but the activation dies across an
  `await`. The URL must be precomputed; the handler must contain no `await` before the call.
- **Playwright has no `projects` array today**, so all 23 e2e tests run in one default Chromium.
  Adding a bare second project doubles every test; the WebKit project therefore carries
  `grep: /@webkit/` and only titles carrying that tag run twice. **WebKit 26.5 is already installed
  on this machine.**
- **`fit` is not on HANGAR's compile surface.** `src/lib/pad/index.ts` re-exports `compile`, `cost`,
  `fits`, `measure` and `validate` behind `padReady()`, but not `fit`. Plan 05-01 adds `fitState()`
  there rather than letting a caller reach the vendored `fit` around the FOUND-05 gate.

### The design decision that shapes every count

**Every knob, meter, stamp and OG gate loops over its entries internally and never uses `it.each`.**
A test names the offending entry in its assertion message rather than being one test per entry. So
adding a configuration in a later phase changes no test count in this phase, and a green run means
the same thing before and after the catalog grows.

### The two guards that must stay green throughout

1. **`src/lib/config-shape.spec.ts` test 13** strips comments from `src/routes/+page.svelte`,
   `src/routes/c/[id]/+page.{svelte,ts}` and **every non-spec file in `src/lib/ui/`**, and fails on a
   `from "…"` specifier containing `vendor`, `intechstudio` or `lib/pad`. It matches the specifier
   **text**, so even `import type { PadState } from "…/vendor/…"` fails it. This is what dictates the
   `src/lib/tune/view.ts` (zero vendor imports, safe to import from a component) /
   `src/lib/tune/model.ts` (dynamic import only) split — D-18.
2. **`src/lib/config-shape.spec.ts` test 14** asserts the built `build/index.html` and
   `build/c/aurora/index.html` reference no chunk containing `GRID_PARAMETER_ELEMENT_POTMETER`. A
   dynamic import creates its own chunk and is not preloaded, which is why `Coverflow.svelte`'s
   existing `await import("$lib/sim/engine")` is green — every new compiler-side import in this
   phase must follow that shape.

Phase 8's laziness guards (`src/lib/sim/lazy.spec.ts`, `e2e/catalog.e2e.ts`) and Phase 4's
`front-door.spec.ts` and `identity.spec.ts` are also standing gates. `identity.spec.ts` is the one
that is **deliberately amended**, once, in plan 05-08 (UI-SPEC X-27), in the same task that adds the
token, with `src/app.css`'s guard comment updated in the same breath.

### Why the waves are serial

Plans 05-05 and 05-06 share no file and could run concurrently. They do not. Every acceptance
criterion in this repository asserts an **exact cumulative test count**, and two plans adding specs
in the same wave would both compute the wrong total. Serial waves cost wall time and buy a gate that
cannot be green for the wrong reason.

### Expected deltas after each plan

| Plan | `test:quick` files | `test:quick` tests | `test:sweep` | `test:e2e` |
|---|---|---|---|---|
| 05-01 | +0 | +4 | 1 file / 9 | unchanged |
| 05-02 | +3 | +17 | 1 file / 9 | unchanged |
| 05-03 | +3 | +15 | 1 file / 9 | unchanged |
| 05-04 | +3 | +16 | 1 file / 9 | unchanged |
| 05-05 | +2 | +12 | **3 files / 13** | unchanged |
| 05-06 | +2 | +9 | 3 files / 13 | unchanged |
| 05-07 | +1 | +5 | 3 files / 13 | +1 |
| 05-08 | +0 | +0 | 3 files / 13 | unchanged |
| 05-09 | +0 | +0 | 3 files / 13 | unchanged |
| 05-10 | +1 | +5 | 3 files / 13 | unchanged |
| 05-11 | +0 | +0 | 3 files / 13 | +8 |
| 05-12 | +0 | +0 | 3 files / 13 | +12 |
| **Phase total** | **+15** | **+83** | **1/9 → 3/13** | **+21** |

New spec files and their fixed test counts. These **are** asserted absolutely, per file:

| File | Tests | Plan |
|---|---|---|
| `src/lib/sim/host.spec.ts` | 10 → **13** | 05-01 |
| `src/lib/pad/ready.spec.ts` | 5 → **6** | 05-01 |
| `src/lib/tune/view.spec.ts` | **8** | 05-02 |
| `src/lib/tune/copy.spec.ts` | **6** | 05-02 |
| `src/lib/tune/idle.spec.ts` | **3** | 05-02 |
| `src/lib/tune/state.spec.ts` | **5** | 05-03 |
| `src/lib/tune/knobs.preset.spec.ts` | **6** | 05-03 |
| `src/lib/tune/knobs.lua.spec.ts` | **4** | 05-03 |
| `src/lib/tune/model.spec.ts` | **7** | 05-04 |
| `src/lib/tune/surprise.spec.ts` | **4** | 05-04 |
| `src/lib/tune/ladder.spec.ts` | **5** | 05-04 |
| `src/lib/share/stamp.spec.ts` | **8** | 05-05 |
| `src/lib/share/url.spec.ts` | **4** | 05-05 |
| `src/lib/tune/reachability.sweep.spec.ts` | **2** (sweep) | 05-05 |
| `src/lib/share/stamp-roundtrip.sweep.spec.ts` | **2** (sweep) | 05-05 |
| `src/lib/og/png.spec.ts` | **5** | 05-06 |
| `src/lib/og/render.spec.ts` | **4** | 05-06 |
| `src/lib/og/build.spec.ts` | **5** | 05-07 |
| `src/lib/ui/tune-ui.spec.ts` | **5** | 05-10 |
| `e2e/artifacts.e2e.ts` | +1 | 05-07 |
| `e2e/tuning.e2e.ts` | **8**, then **10** | 05-11, 05-12 |
| `e2e/tuning-webkit.e2e.ts` | **5**, run in **both** projects = 10 | 05-12 |

The e2e arithmetic is the one place a reader can get lost, so it is written out. Chromium carries no
`grep`, so it runs **every** test including the `@webkit`-tagged ones; the `webkit-phone` project
runs only the tagged ones. `23 + 1 + 8 + 2 + (5 × 2) = 44`. The eighth test in 05-11 is the
no-clipboard fallback — forced with `addInitScript`, because no browser Playwright drives takes that
branch on its own — and it is DEGR-01's clipboard half.

### The new cost

| Spec | Threshold set by its plan | If exceeded |
|---|---|---|
| `src/lib/tune/model.spec.ts` | none — it uses fake timers and one real `padReady()` | — |
| `src/lib/tune/ladder.spec.ts` | 15 s | record it; the ladder compiles once per step |
| `src/lib/tune/surprise.spec.ts` | 20 s (2,000 draws per compiler entry through `fits()`) | say so in the SUMMARY and reduce the draw count only with the measured number written down |
| `src/lib/tune/reachability.sweep.spec.ts` | **60 s**; projected **~35–45 s** — `cost()` on all 16,645 states at 05-04's measured 1.1–4.0 ms each (~37 s), plus the 1,080 kind combinations (~2 s), plus a **scoped** ladder pass | say so in the SUMMARY. The D-10 precedent is a separate project, never a trimmed sweep |
| `src/lib/share/stamp-roundtrip.sweep.spec.ts` | 20 s | same |
| `npm run test:sweep` as a whole | **120 s**; projected **~85 s** (the existing ~40 s plus ~40 s plus <10 s) | same |

**Why the reachability sweep ladders a scoped set rather than every state.** `fitState` is N+1
minifier calls and 05-04 measures `fit()` at 4.4 ms on a fitting state, so a per-state ladder would
add ~73 s on top of the ~37 s `cost()` pass — ~110 s against a 60 s file threshold — and buy nothing,
because `fit()` is defined to return `{ fits: true, steps: [] }` for any state `cost()` has already
accepted. So `cost()` runs on **all 16,645**, with no sampling, and `fitState` runs on every state
whose `cost().fits` is false (expected: zero) plus the measured worst-cost state per preset (nine
more). The scoping is arithmetic, and it is recorded here so that a later reader does not read it as
a trimmed sweep. The rule stands unchanged: if the measurement crosses a threshold, **say so; do not
trim**.

---

## Requirement ownership

`.planning/ROADMAP.md` maps twelve requirements to Phase 5 and this phase closes all twelve. Two of
them close with a qualifier that must appear in the completing SUMMARY and in the traceability pass:

| Requirement | Closed by | Qualifier |
|---|---|---|
| TUNE-04 | 05-12 | **guard, unreachable in practice.** The ladder line renders `steps[0].label` verbatim and is proven against a synthetic over-budget result in `ladder.spec.ts` and on `/dev/tune/`. `reachability.sweep.spec.ts` pins the finding that no state a visitor can reach produces a ladder step |
| TUNE-05 | 05-12 | **guard, unreachable in practice.** Same mechanism: the red meter, the disabled primary, the named knob and `TURN IT DOWN` are all real code, all tested, and reachable only by passing a real `reserved` to `cost()` |
| SHARE-04 | 05-07 (built), 05-12 (recorded) | **routed entries only, and unverifiable end to end.** Two qualifiers, both of which must appear in the completing SUMMARY. First: an OG image is generated for **routed entries only — 8 of the 16 catalog entries** — because the excluded eight are not in `FRONT_DOOR`, have no prerendered `/c/<id>/` page and therefore no `<head>` to carry an `og:image`. That is not an omission to fix in this phase; it is what "per catalog configuration" means while half the catalog has no address. Second: **a real Discord unfurl is unverifiable until the Basic Auth embargo lifts.** `og/build.spec.ts` and the artifact e2e prove the PNGs exist, are 1200×630 truecolour, are under 1 MB, are not black, are served as `image/png`, and are referenced by an absolute `og:image` from every routed page. They cannot prove a crawler ever fetched one, because `worker/index.js` gates the whole site fail-closed. Say that; do not claim SHARE-04 was observed |

TUNE-01 was partly contributed by Phase 8 (every hand-authored entry ships 3–6 knobs over the
vendored vocabulary); Phase 5 owns the widgets and closes it.

---

## Sampling Rate

- **After every task commit:** `npm run test:quick` (plus `npm run lint` for tasks touching
  HANGAR-owned files, plus `npm run check` for tasks touching `.svelte` or `.ts`)
- **After every plan wave:** `npm run check && npm run lint && npm run test:quick && npm run test:sweep`
- **Before `/gsd:verify-work`:** the full suite including `npm run build` and `npm run test:e2e`
  against the **production static build** — plan 05-12 runs it as its last task
- **Max feedback latency:** ~5 seconds (quick at the start of the phase, ~8 s at the end), ~90
  seconds (wave, once the sweep grows)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | DEGR-01 | baseline + config | all four baselines recorded in the SUMMARY; `playwright.config.ts` has two projects; `test:e2e` **unchanged** at the recorded baseline | exists | ⬜ pending |
| 5-01-02 | 01 | 1 | TUNE-02 | unit (node, injected deps) | `npx vitest run --project server src/lib/sim/host.spec.ts` reports `13 passed` | exists | ⬜ pending |
| 5-01-03 | 01 | 1 | TUNE-04, TUNE-05 | unit | `... src/lib/pad/ready.spec.ts` reports `6 passed`; `test:quick` is baseline +0 files / +4 tests | exists | ⬜ pending |
| 5-02-01 | 02 | 2 | TUNE-01, TUNE-03 | unit + structural | `... src/lib/tune/view.spec.ts` reports `8 passed`; the file names no vendor specifier | created here | ⬜ pending |
| 5-02-02 | 02 | 2 | TUNE-03, TUNE-04, TUNE-05, SHARE-02, SHARE-03 | unit | `... src/lib/tune/copy.spec.ts` reports `6 passed` | created here | ⬜ pending |
| 5-02-03 | 02 | 2 | DEGR-01 | unit | `... src/lib/tune/idle.spec.ts` reports `3 passed`; `test:quick` is 05-01's total +3 files / +17 tests | created here | ⬜ pending |
| 5-03-01 | 03 | 3 | TUNE-02, TUNE-06 | unit | `... src/lib/tune/state.spec.ts` reports `5 passed`; a tuned stamp never starts with `p` | created here | ⬜ pending |
| 5-03-02 | 03 | 3 | TUNE-01 | unit | `... src/lib/tune/knobs.preset.spec.ts` reports `6 passed`; every preset exposes 3–6 knobs | created here | ⬜ pending |
| 5-03-03 | 03 | 3 | TUNE-01 | unit | `... src/lib/tune/knobs.lua.spec.ts` reports `4 passed`; `test:quick` is 05-02's total +3 files / +15 tests | created here | ⬜ pending |
| 5-04-01 | 04 | 4 | TUNE-02, TUNE-03 | unit (fake timers) | `... src/lib/tune/model.spec.ts` reports `7 passed` | created here | ⬜ pending |
| 5-04-02 | 04 | 4 | TUNE-07 | property | `... src/lib/tune/surprise.spec.ts` reports `4 passed` | created here | ⬜ pending |
| 5-04-03 | 04 | 4 | **TUNE-04, TUNE-05 (the guards)** | unit | `... src/lib/tune/ladder.spec.ts` reports `5 passed`; `test:quick` is 05-03's total +3 files / +16 tests | created here | ⬜ pending |
| 5-05-01 | 05 | 5 | SHARE-01, SHARE-03 | unit | `... src/lib/share/stamp.spec.ts` reports `8 passed`; another entry's valid stamp is refused | created here | ⬜ pending |
| 5-05-02 | 05 | 5 | SHARE-01, SHARE-02 | unit | `... src/lib/share/url.spec.ts` reports `4 passed`; the origin literal equals `scripts/deploy.mjs`'s | created here | ⬜ pending |
| 5-05-03 | 05 | 5 | **TUNE-04, TUNE-05, SHARE-01** | sweep | `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 3 13` exits 0; `test:quick` is 05-04's total +2 files / +12 tests | created here | ⬜ pending |
| 5-06-01 | 06 | 6 | SHARE-04 | unit | `... src/lib/og/png.spec.ts` reports `5 passed` | created here | ⬜ pending |
| 5-06-02 | 06 | 6 | SHARE-04 | unit | `... src/lib/og/render.spec.ts` reports `4 passed`; `test:quick` is 05-05's total +2 files / +9 tests | created here | ⬜ pending |
| 5-07-01 | 07 | 7 | SHARE-04 | build script | `node scripts/gen-og.mjs` writes one PNG per routed entry into `static/og/`; `static/og/` is gitignored | created here | ⬜ pending |
| 5-07-02 | 07 | 7 | SHARE-04 | build artefact + unit | `npm run build` exits 0; `... src/lib/og/build.spec.ts` reports `5 passed` | created here | ⬜ pending |
| 5-07-03 | 07 | 7 | SHARE-04 | e2e | `test:e2e` is the recorded baseline +1; the image is served as `image/png` from the built site | exists | ⬜ pending |
| 5-08-01 | 08 | 8 | TUNE-05 | **amended Phase 4 gate** | `... src/lib/ui/identity.spec.ts` reports `6 passed` with the ninth token admitted; `src/app.css`'s guard comment names it | exists | ⬜ pending |
| 5-08-02 | 08 | 8 | TUNE-01, TUNE-06 | type + guard | `npm run check` reports `0 errors`; `... src/lib/config-shape.spec.ts` all passed | created here | ⬜ pending |
| 5-08-03 | 08 | 8 | TUNE-01 | type + guard | same, plus `npm run lint`; `test:quick` unchanged from 05-07's total | created here | ⬜ pending |
| 5-09-01 | 09 | 9 | TUNE-03 | type + guard | `npm run check` `0 errors`; `config-shape.spec.ts` all passed | created here | ⬜ pending |
| 5-09-02 | 09 | 9 | TUNE-04, TUNE-05, SHARE-03 | type + guard | same | created here | ⬜ pending |
| 5-09-03 | 09 | 9 | SHARE-02 | type + guard | same; `test:quick` unchanged from 05-08's total | created here | ⬜ pending |
| 5-10-01 | 10 | 10 | TUNE-01..07 | type + guard | `npm run check` `0 errors`; the region names no vendor specifier | created here | ⬜ pending |
| 5-10-02 | 10 | 10 | TUNE-05 | type + guard | `... src/lib/ui/identity.spec.ts` `6 passed`; the honesty slot reserves 72px | exists | ⬜ pending |
| 5-10-03 | 10 | 10 | TUNE-01..07 | structural | `... src/lib/ui/tune-ui.spec.ts` reports `5 passed`; `test:quick` is 05-09's total +1 file / +5 tests | created here | ⬜ pending |
| 5-11-01 | 11 | 11 | TUNE-02, TUNE-06 | type + guard | `npm run check` `0 errors`; `config-shape.spec.ts` all passed; `front-door.spec.ts` all passed | exists | ⬜ pending |
| 5-11-02 | 11 | 11 | SHARE-01, SHARE-03 | type + guard | same | exists | ⬜ pending |
| 5-11-03 | 11 | 11 | **TUNE-01, TUNE-02, TUNE-03, TUNE-06, TUNE-07, SHARE-01, SHARE-02, SHARE-03, DEGR-01** | e2e | `npx playwright test e2e/tuning.e2e.ts` reports `8 passed`; `test:e2e` is `PREV_E2E` (05-10's total) **+8** | created here | ⬜ pending |
| 5-12-01 | 12 | 12 | TUNE-04, TUNE-05 | probe page + e2e | `/dev/tune/` prerenders and is linked from nowhere; `e2e/tuning.e2e.ts` reports `10 passed` | created here | ⬜ pending |
| 5-12-02 | 12 | 12 | **DEGR-01** | e2e, two projects | `npx playwright test --project webkit-phone` reports `5 passed`; the whole run is `PREV_E2E` (05-11's total) **+12** | created here | ⬜ pending |
| 5-12-03 | 12 | 12 | all twelve | docs + phase gate | the full suite green at the totals this plan's SUMMARY records | exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

`05-RESEARCH.md`'s "Wave 0 gaps", each mapped to a creating task:

- [x] `npx playwright install webkit` — **already installed on this machine (WebKit 26.5)**; task
      5-01-01 verifies rather than installs
- [ ] `playwright.config.ts` gains `projects` with `grep: /@webkit/` on the WebKit project, with the
      e2e baseline recorded **before** the change → **5-01-01**
- [ ] `SimHost.replaceEngine` and its three tests, before any component swaps an engine → **5-01-02**
- [ ] `fitState()` on `src/lib/pad/index.ts`, so the ladder never reaches around the FOUND-05 gate
      → **5-01-03**
- [ ] `src/lib/tune/view.ts` — the zero-vendor-import type module the UI components may name
      → **5-02-01**
- [ ] `src/lib/tune/model.ts` — the dynamic-import-only compiler side → **5-04-01**
- [ ] The UI-SPEC's ninth palette token with `src/lib/ui/identity.spec.ts` amended in the same task
      → **5-08-01**
- [ ] `src/routes/dev/tune/` — the unlinked probe that makes TUNE-05 reachable at all → **5-12-01**
- [ ] `static/og/` gitignored and `scripts/gen-og.mjs` wired into `npm run build` **before**
      `vite build` → **5-07-01**
- [ ] `SITE_ORIGIN` in one module, held against `scripts/deploy.mjs` by a spec → **5-05-02**

The phase's own Wave 0 gate — the property that licenses TUNE-04 and TUNE-05 shipping as guards
rather than as features — is **task 5-05-03**.

---

## What the fixtures and gates prove

- `knobs.preset.spec.ts` proves HANGAR's descriptor list and BOTOR's `PadPreset.knobs` agree, so a
  vendored re-sync that changes a card's knobs goes red **and names the card**. It does not prove the
  field bindings are the ones BOTOR's panel uses — that transcription is evidence in
  `05-RESEARCH.md`, cited by file and line, and the `colour` binding rule is asserted mechanically
  because it is derivable from the state.
- `reachability.sweep.spec.ts` proves the unreachability finding **for the pinned compiler only**. It
  is a property of a version, not a law, and `docs/PIN-POLICY.md` gains a checklist line saying so.
- `stamp-roundtrip.sweep.spec.ts` proves the codec is lossless across every knob position HANGAR can
  produce. It does not prove BOTOR can reopen a HANGAR stamp — that is true by construction for
  format `d` and false by construction for format `x`, and both are stated in the SUMMARY.
- `og/build.spec.ts` proves the PNGs exist, are 1200×630 truecolour, are under 1 MB and are not
  black, and that every **routed** page carries the head tags — 8 of the 16 catalog entries; the
  other eight are not in `FRONT_DOOR`, have no page and so have no head to carry a tag. **It cannot
  prove a Discord unfurl**: the Basic Auth Worker blocks every crawler until the gate comes down on
  launch day. Say so; do not claim SHARE-04 was observed.
- `e2e/tuning.e2e.ts` test 8 proves the **select-and-copy fallback**, forced by deleting
  `navigator.clipboard` in an init script: the readonly field appears, holds the composed URL,
  carries `aria-label="Shareable link"` and computes to a 16px font size (the iOS zoom floor). It is
  the only coverage of that branch — wave 12's WebKit test asserts the *confirm* branch and states
  what to do if the fallback appears there instead.
- `e2e/tuning.e2e.ts` test 1 carries the **`/` cold-load WebAssembly assertion**, three lines inside
  an existing test. Wave 10's must-have claims the front door's first paint fetches no protocol chunk
  and no WebAssembly; `config-shape.spec.ts` test 14 covers the chunk half over the built HTML, and
  `e2e/catalog.e2e.ts` covers the WebAssembly half for `/dev/catalog/` — nothing covered it for `/`
  before this phase.
- `tune-ui.spec.ts` proves the components name no compiler specifier, that no `overflow-x` appears in
  the tuning region, that every interactive box declares its 44px floor, and that `--color-over`
  appears in exactly the **two components** X-01's three uses live in. The two numbers are not a
  contradiction and the plans say which they mean wherever either appears: X-01 scopes the token to
  three *uses* — the offending meter's bar fill and its 2px outline, that meter's numerals and
  percentage, and the 2px left rule on the over-budget message — and the first two of those are in
  `BudgetMeter.svelte` while the third is in `BudgetMessage.svelte`. The spec counts uses; the test
  counts components; the assertion message says so.

---

## Manual-Only Verifications

| What | Why it cannot be automated | Who |
|---|---|---|
| A real Discord unfurl | `worker/index.js` gates the whole site behind Basic Auth, fail-closed. Discord's crawler cannot fetch anything until the embargo lifts | Botond, on launch day |
| That the knob rack *feels* right on a real phone | WebKit at a phone viewport is an approximation of iOS Safari, not iOS Safari | Botond |
| Whether the tuned pad looks like what the knob promised | The simulator's fidelity is Phase 3's gate; taste is not a test | Botond |

---

## Negative checks (observe red before trusting)

Every new gate in this phase names the mutation that makes it red, and the executor **observes** the
red before committing. The list, by plan:

| Plan | Gate | Mutation that must turn it red |
|---|---|---|
| 05-01 | `host.spec.ts` replaceEngine tests | delete the `this.paint(...)` line from `replaceEngine` |
| 05-01 | `ready.spec.ts` test 6 | delete `await padReady()` from `fitState` |
| 05-02 | `view.spec.ts` budget literal | change `EVENT_BUDGET` in `view.ts` to 900 |
| 05-02 | `copy.spec.ts` | replace one `’` with `'` |
| 05-03 | `state.spec.ts` | delete `delete draft.preset` from `withChange` |
| 05-03 | `knobs.preset.spec.ts` | remove one knob descriptor from `aurora` |
| 05-04 | `model.spec.ts` debounce | make the compile synchronous |
| 05-04 | `ladder.spec.ts` | render an authored sentence instead of `steps[0].label` |
| 05-05 | `stamp.spec.ts` entry-consistency | delete the `encodeStamp(rebuilt) === payload` line |
| 05-05 | `url.spec.ts` | change the origin literal in `url.ts` |
| 05-06 | `png.spec.ts` | write the IHDR height before the width |
| 05-07 | `og/build.spec.ts` | remove `og:image` from the head |
| 05-08 | `identity.spec.ts` | add a tenth token to `@theme` |
| 05-10 | `tune-ui.spec.ts` | add `overflow-x: auto` to the rack |
| 05-05 | `stamp.spec.ts` test 5, the `p` row | decide format `p` *after* the consistency check and watch `paurora` on aurora land `unreadable` |
| 05-11 | `e2e/tuning.e2e.ts` stamp test | make the decoder ignore the entry-consistency result |
| 05-11 | `e2e/tuning.e2e.ts` fallback test | drop the `delete navigator.clipboard` init script and watch the test fail its own precondition rather than pass on the confirm branch |
| 05-12 | `e2e/tuning-webkit.e2e.ts` | remove the `@webkit` tag from one title and watch the webkit total drop |

---

## Standing hazards carried into this phase

- **A knob turn moves the Setup meter even when the knob is free.** `encodeStamp` grows from
  `paurora` (7 characters) to a field dump (12–20), and the stamp lives inside `setupLua` as the
  first action's marker name, so `cost()` charges it. This is real, it is not a bug, and no plan may
  hide it. Record it in the SUMMARY that first observes it.
- **Stepping while chosen drops the stamp.** `syncAddress()` replaces the URL with
  `resolve("/c/[id]", …)`, which has no fragment. That is correct — a different entry is a different
  configuration — and Phase 5 never writes the hash, so nothing here fights it. Say so in the SUMMARY
  rather than letting a later reader file it as a bug.
- **`tpad` is not in the front-door row**, so the tightest real budget (902/908) has no visitor-facing
  surface until Phase 5.1. It is reachable in Vitest and on `/dev/tune/`.
- **No Lua entry is in the front-door row.** The Lua knob path is required by D-02 and D-13, is built
  and fully tested, and has **no visitor-facing surface in this phase**. No plan may add a Lua entry
  to `FRONT_DOOR` to make a demo work — that is a curation decision the user reserved (Phase 8 D-18,
  `05-CONTEXT.md` open question 2).
- **The 152px reservation is a floor, not a ceiling.** The region is 334–514px tall in practice. The
  invariant this phase contracts is the one Phase 4's comment was written to protect: the primary
  control never moves. `05-UI-SPEC.md` § The size invariant is binding.

---

## Deferred, and where it went

| Deferred | Where |
|---|---|
| TUNE-08 (naming the exact feature trimmed by introspection) | later; `FitStep.label` is used verbatim in the meantime |
| TUNE-09 (viewing generated Lua) | later |
| SHARE-05 (knob drags update the hash) | later — and its absence is load-bearing: Phase 5 never writes the hash, which sidesteps `replaceState` eating the fragment, the `no-navigation-without-resolve` lint and Safari's activation expiry in one decision |
| SHARE-06 (`COPY LINK` as the unsupported-browser fallback) | later |
| Per-stamp OG images | would need a Worker; a tuned stamp shares its entry's image (D-15) |
| Browse, sort, search | Phase 5.1 |
| Install | Phase 7 |

---

## Validation Sign-Off

- [ ] Every task has an automated command that fails when the task is not done
- [ ] Every negative check above was observed red before the gate was trusted
- [ ] No plan carries a literal whole-suite total
- [ ] The two Phase 4 chunk guards and Phase 8's laziness guards are green at the phase gate
- [ ] TUNE-04 and TUNE-05 are marked complete **with the "guard, unreachable in practice" qualifier**
