---
phase: 08-new-configurations
plan: 01
subsystem: catalog
tags: [catalog, fixtures, test-infrastructure, D-09, D-10, D-12, D-17, D-19]
requires: []
provides:
  - "src/lib/catalog/ — CATALOG, byId, byFeatured, byNewest, byName"
  - "CatalogEntry / CatalogSource / LuaKnob / PadConfigObject / build() / previewFor()"
  - "KNOB_KINDS, ZONA_MODULE_TYPE, EVENT_SETUP, EVENT_TIMER"
  - "src/lib/catalog/frames.json — golden frames per entry at [0, 37, 101, 500, 1009]"
  - "scripts/check-counts.mjs — observed-baseline-plus-delta count gate (D-17)"
affects:
  - "Phase 4 (coverflow seed row adopts CatalogEntry — D-10)"
  - "Plans 08-02 to 08-08 (every new entry lands in src/lib/catalog/)"
  - "Plan 08-04 (replaces frames.spec.ts engineFor with createEngine)"
tech-stack:
  added: []
  patterns:
    - "Literal-plus-spec-assertion for pinned-package constants (the src/lib/protocol-pin.ts pattern)"
    - "Fixed test counts with internal loops, never it.each, so a new entry moves no total"
    - "UPDATE_FRAMES regeneration that rewrites, prettifies, then fails by design"
key-files:
  created:
    - scripts/check-counts.mjs
    - src/lib/catalog/types.ts
    - src/lib/catalog/entries/ported.ts
    - src/lib/catalog/index.ts
    - src/lib/catalog/catalog.spec.ts
    - src/lib/catalog/frames.json
    - src/lib/catalog/frames.spec.ts
  modified: []
decisions:
  - "restsBlack is a declared fact proved by the fixture in both directions, not a hard-coded exemption (D-19)"
  - "defaults holds knob INDICES, never values (D-13)"
  - "The catalog module names neither the pinned protocol package nor the compile surface"
metrics:
  duration: 19 min
  tasks: 3
  files: 7
  completed: 2026-09-04
---

# Phase 8 Plan 01: The Catalog Module Summary

`src/lib/catalog/` is now the single home for every HANGAR configuration — the nine ported BOTOR
presets today, the hand-authored Lua entries of waves 4 to 6 — with a `CatalogEntry` shape Phase 4
can adopt for its seed row with no migration, a 10-test metadata gate, a 5-test golden-frame gate,
and a counts helper that makes every later count assertion a delta rather than a literal.

---

## The Phase 8 baseline

**Measured on this machine on 2026-09-04, BEFORE this plan created anything.** Every later plan in
this phase reads these numbers. They are the anchor for "observed baseline plus a stated delta"
(D-17); no plan in this phase may assert an absolute suite total, because Phase 4 depends only on
plan 08-01 and lands specs in the same tree while Phase 8 runs.

```
npm run test:quick
 Test Files  26 passed (26)
      Tests  453 passed | 1 todo (454)

npm run test:sweep
 Test Files  1 passed (1)
      Tests  9 passed (9)

npm run test:e2e
  10 passed (21.9s)
```

**BASE_FILES = 26**
**BASE_TESTS = 453**
**BASE_E2E = 10**

(The todo count is reported by `scripts/check-counts.mjs` and never asserted.)

### Totals observed AFTER this plan

```
npm run test:quick
 Test Files  28 passed (28)
      Tests  468 passed | 1 todo (469)

npm run test:sweep
 Test Files  1 passed (1)
      Tests  9 passed (9)

npm run test:e2e
  10 passed (26.8s)
```

Exactly `BASE_FILES + 2` files and `BASE_TESTS + 15` tests, verified through the helper:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 28 468   -> exit 0
npm run test:sweep  2>&1 | node scripts/check-counts.mjs 1 9      -> exit 0
```

**Plan 08-02 should treat 28 / 468 (quick), 1 / 9 (sweep) and 10 (e2e) as its own baseline** — but
should re-measure rather than trust them, because Phase 4 may land specs in between.

### Using the helper

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs <expectedFiles> <expectedTests>
npm run test:sweep  2>&1 | node scripts/check-counts.mjs 1 9
npm run test:e2e    2>&1 | node scripts/check-counts.mjs --playwright <expectedTests>
```

It parses Vitest's `Test Files N passed` / `Tests P passed | T todo` and Playwright's `N passed`,
prints what it observed, and exits 1 naming both the observed and the expected number. A run that
printed no summary line at all is a failure, not a vacuous pass. The file contains **zero
backslashes** (verified by counting them) — every regular expression uses `[0-9]`, and the newline
and ANSI-escape characters come from `String.fromCharCode` — so any line of it can be quoted into a
plan without a shell transport halving an escape.

---

## The exported surface

### `src/lib/catalog/index.ts`

```ts
export { build, previewFor, KNOB_KINDS, ZONA_MODULE_TYPE, EVENT_SETUP, EVENT_TIMER } from "./types";
export type { CatalogEntry, CatalogSource, LuaKnob, PadConfigObject } from "./types";

// Hand-authored Lua entries are appended here as they are authored (waves 4-6).
export const CATALOG: readonly CatalogEntry[] = Object.freeze([...PORTED]);

export function byId(id: string): CatalogEntry | undefined;
export function byFeatured(): readonly CatalogEntry[];  // featured first, then by name
export function byNewest(): readonly CatalogEntry[];    // addedAt desc, ties by name
export function byName(): readonly CatalogEntry[];      // name asc
```

One import path for a consumer:
`import { CATALOG, byId, build, type CatalogEntry } from "$lib/catalog";`

Every sort returns a **new** array (`[...CATALOG].sort(...)`); `CATALOG` is frozen and never
reordered in place. Name comparison is a plain `<`/`>`, never `localeCompare`, so the order does not
depend on the runner's or the visitor's locale.

### `src/lib/catalog/types.ts`

```ts
export type CatalogSource =
  | { kind: "preset"; presetId: string }
  | { kind: "state"; state: PadState }
  | { kind: "lua"; setup: string; timer: string };

export type CatalogEntry = {
  id: string;                                   // url slug, stable forever: ^[a-z][a-z0-9-]*$
  name: string;
  description: string;                          // one line, no newline, <= 110 chars
  tags: readonly string[];                      // feel-based (CONT-03)
  featured: boolean;
  addedAt: string;                              // "YYYY-MM-DD", drives the Newest sort
  source: CatalogSource;
  preview: "padsim" | "lua";                    // DERIVED from source.kind, stored explicitly
  knobs: readonly LuaKnob[];
  defaults: Readonly<Record<string, number>>;   // knob id -> INDEX into knob.values
  restsBlack: boolean;
};

export function previewFor(source: CatalogSource): "padsim" | "lua";

export const KNOB_KINDS = ["colour","speed","direction","size","count","note",
                           "feel","amount","mode","bend","spring","scale"] as const;

export const ZONA_MODULE_TYPE = "ZONA";
export const EVENT_SETUP = 0;
export const EVENT_TIMER = 6;

export type PadConfigObject = { id; name; description; configType: "preset";
  type: "ZONA"; version: {major;minor;patch};
  configs: [{ controlElementNumber: 0;
              events: [{event: 0; config: string}, {event: 6; config: string}] }] };

export function build(entry, lua: {setup, timer}, version): PadConfigObject;
```

**`restsBlack`** is TRUE iff the entry renders an all-zero frame at **every** sampled tick with no
touch input. It is not a preference and not an exemption — it is a fact about the configuration,
asserted against `frames.json` in **both directions** by `frames.spec.ts` test 5 (D-19). A card that
goes black by accident is red because it did not declare it; a card that declared it and then lit up
is red too. Several genuinely useful cards are dark at rest — `tpad` writes no LEDs at all, and a
card whose only light is a touch response has nothing to show until a finger arrives (MORPH and
GHOST arrive in later waves and are exactly this). Declaring it is what stops "the picture went
black" being indistinguishable from "this one is meant to be black".

**What the module deliberately does not name.** `grep -c` prints `0` for `intechstudio`, `lib/pad`
and `pad-sim` in `types.ts`, and `0` for `intechstudio` in `index.ts` and `entries/ported.ts`. The
three pinned-package constants are literals in `types.ts` and are asserted against
`ModuleType.ZONA`, `EventTypeToNumber(EventType.SETUP)` and `EventTypeToNumber(EventType.TIMER)`
inside `catalog.spec.ts` — the `src/lib/protocol-pin.ts` pattern. Importing them as values would put
the whole protocol package's module graph in the chunk of any page that only wants to list names.
`build()` takes already-compiled Lua as an argument for the same reason: the compile surface sits
behind the FOUND-05 WASM gate and the catalog must be readable without waiting on 628 KB of
WebAssembly.

A compile-time exhaustiveness check (`MissingKnobKind`) stops `npm run check` if the vendored
`KnobKind` union ever gains a member that `KNOB_KINDS` has not.

### `LuaKnob`, and why `defaults` holds indices

```ts
export type LuaKnob = {
  id: string;                  // stable slug, unique within the entry
  label: string;               // "Tempo"
  kind: KnobKind;              // the SHARED vocabulary, from the vendored compiler (D-12)
  token: string;               // "@TEMPO" — matches ^@[A-Z][A-Z0-9_]*$
  values: readonly string[];   // literal Lua text, in display order, at least 2
  default: number;             // an INDEX into values, never a value
};
```

`kind` comes from the vendored compiler's own `KnobKind` union — inventing a Lua-specific union is
exactly what D-12 forbids. `values` are **strings** even when they read as numbers (`"110"`,
`"0,200,255"`, `"3,5,7"`): one type keeps the wave-4 knob-sweep budget arithmetic trivial.

`entry.defaults` duplicates each knob's `default` **index** keyed by knob id, because Phase 5 reads
a knob state as a record and this is the shape it reads. Indices rather than values keep the stamp
envelope D-13 defers to Phase 5 an integer problem rather than a value-encoding one.
`catalog.spec.ts` test 8 asserts the key set and every index agree with `knobs`.

---

## The nine ported entries

Built by mapping a HANGAR-owned table of `{ id, tags, featured, restsBlack }` over `presetById(id)`,
so `name` and `description` are **read from the vendored shelf**, never restated — a BOTOR re-sync
that renames a card shows up in the catalog instead of silently disagreeing with it. A typo in an id
throws at module scope. `addedAt` is one shared constant, `"2026-09-02"` (the date Phase 3 landed the
vendored shelf). Featured: `aurora`, `pinwheel`, `ninepads`. `knobs: []` and `defaults: {}` on all
nine, because compiler-driven knobs for a `PadState` card are TUNE-01 and belong to Phase 5; the gate
encodes exactly that rule (empty `knobs` is correct on a preset entry and a failure on a Lua one).

### Which entries rest black

The fixture showed **`tpad` alone** resting black — `nonZeroBytes` 0 at all five ticks. The other
eight are lit at every sampled tick:

| entry | nonZeroBytes at [0, 37, 101, 500, 1009] | restsBlack |
|---|---|---|
| aurora | 149, 136, 159, 154, 155 | false |
| pinwheel | 152, 152, 151, 145, 145 | false |
| starfield | 225, 226, 223, 225, 222 | false |
| radar | 126, 157, 134, 142, 146 | false |
| joystick | 2, 2, 2, 2, 2 | false |
| ninepads | 162, 162, 162, 162, 162 | false |
| faders | 135, 135, 135, 135, 135 | false |
| dial | 145, 154, 154, 150, 148 | false |
| tpad | 0, 0, 0, 0, 0 | **true** |

**This matched the declaration written in task 8-01-02 exactly** — test 5 passed on the first run
after regeneration, so no declaration had to be corrected. Note `joystick` at 2 lit bytes: lit, but
only just, which is why "some light" is asserted per entry rather than as a global threshold.

---

## The `engineFor` seam plan 08-04 replaces

`src/lib/catalog/frames.spec.ts` selects a frame source by `entry.preview`:

```ts
type FrameSource = {
  run(n: number): void;
  readonly frame: Uint8Array;
  readonly animating: boolean;
};

async function engineFor(entry: CatalogEntry): Promise<FrameSource> {
  if (entry.preview === "padsim") {
    if (entry.source.kind === "preset") { ...presetById -> new PadSim(preset.state) }
    if (entry.source.kind === "state") return new PadSim(entry.source.state);
  }
  // Replaced by $lib/sim/engine's createEngine in plan 08-04, when the first
  // Lua-backed entry exists. Until then no catalog entry has preview "lua", and
  // test 1 below is what proves it: an entry added without an engine goes red
  // here rather than being silently skipped.
  throw new Error(`no engine for preview "${entry.preview}" (entry ${entry.id})`);
}
```

**Plan 08-04 replaces only the body**, keeping the `FrameSource` shape (or widening it to the D-08
`SimEngine` surface). Test 2 constructs an engine for every catalog entry, so a Lua entry added
before 08-04 lands turns that test red with the entry's id in the message rather than being skipped.
A **fresh** engine is built per sample because `run(n)` is cumulative.

---

## The two gates

**`catalog.spec.ts` — exactly 10 tests, no `it.each`.** Every test loops over the entries
*internally* and names the offending entry in its message, so adding a configuration in wave 4, 5 or
6 changes **zero** test counts and the numbers in `08-VALIDATION.md` stay stable. The ten: metadata
completeness; unique url slugs plus `byId` round-trip; `preview` is `previewFor(source)`; ported name
and description equal the vendored preset's `name` and `sentence`; all nine shelf presets present
exactly once; D-09 (the shelf is still nine and no non-preset entry steals a preset id); the knob
arity and token rules (3-6 knobs, kind in `KNOB_KINDS`, token shape, no token a prefix of another,
`values.length >= 2`, integer `default` in range — and empty `knobs` on preset entries); `defaults`
agrees with `knobs`; the pinned-package constants; and `build()` plus the three sorts.

**`frames.spec.ts` — exactly 5 tests.** Coverage in both directions; every entry has an engine and
the five ticks in order; the hashes, `nonZeroBytes` and `animating` still match; the ported entries'
hashes and lit-byte counts cross-checked against `src/lib/fidelity/golden-frames.json` (which is what
proves a catalog entry's `presetId` resolves to the state Phase 3 pinned rather than to a lookalike);
and `restsBlack` asserted in both directions with a non-vacuity guard (at least one entry's frame
differs between two sampled ticks, and at least one entry is lit at rest).

### Regeneration

```
UPDATE_FRAMES=1 npx vitest run --project server src/lib/catalog/frames.spec.ts
```

rewrites `frames.json`, shells out to `npx prettier --write src/lib/catalog/frames.json`, and then
**fails by design** (test 1 asserts `UPDATE_FRAMES` is empty), so a regeneration can never be
mistaken for a passing run. Exit code observed: **1**, with `Tests 1 failed | 4 passed (5)`.

**Two consecutive regenerations are byte-identical — confirmed.** The fixture was staged with
`git add` the moment it first existed, then regenerated again; the sha256 of `frames.json` was
`686700c783980a2e7e868b3d6041366e76c2e44330358d1afb15432aec11c54b` both times and
`git diff --quiet -- src/lib/catalog/frames.json` exited 0. Prettier collapses the primitive `ticks`
array onto one line (`"ticks": [0, 37, 101, 500, 1009],`) and that is correct; nothing asserts
one-element-per-line anywhere.

---

## Negative checks (both observed red, both reverted)

| # | Perturbation | Green exit | Red exit | Test that went red | Message |
|---|---|---|---|---|---|
| 1 | `aurora`'s `tags` set to `[]` in `entries/ported.ts` | 0 | 1 | `carries complete metadata on every entry` (test 1) | `AssertionError: aurora: has at least one tag: expected 0 to be greater than 0` |
| 2 | one hex digit of `aurora`'s tick-101 `sha256` in `frames.json` (`55fc` -> `55fd`) | 0 | 1 | `still hashes to the recorded frames at every tick` (test 3) **and** `agrees with the Phase 3 tripwire on every ported entry` (test 4) | `AssertionError: aurora at tick 101: frame hash changed` |

Both files were staged with `git add` **before** being perturbed — on an untracked path
`git checkout --` fails outright and `git diff --quiet` passes vacuously, so a restore-and-compare
over untracked files measures nothing. After restoring, `git diff --quiet` exited 0 for both, and the
suites went back to 10 passed and 5 passed.

Note that check 2 turning **two** tests red is the intended belt-and-braces: the cross-check against
Phase 3's tripwire independently catches a tampered ported hash.

---

## Verification

| Check | Result |
|---|---|
| `npx vitest run --project server src/lib/catalog/catalog.spec.ts` | 1 file, **10 passed** |
| `npx vitest run --project server src/lib/catalog/frames.spec.ts` | 1 file, **5 passed** |
| `npm run test:quick` through the helper at `BASE_FILES + 2` / `BASE_TESTS + 15` | exit 0 (28 / 468) |
| `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9` | exit 0 |
| `npm run test:e2e` | 10 passed (unchanged) |
| `npm run check` | 390 files, **0 errors**, 0 warnings |
| `npm run lint` | exit 0 |
| `git diff --stat HEAD -- src/vendor/` | prints nothing |
| `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts` | 1 file, **14 passed** |
| `grep -c "  it(" catalog.spec.ts` / `frames.spec.ts` | `10` / `5`; `it.each` count `0` |
| `frames.json` shape | 9 entries, `ticks` = `0,37,101,500,1009` |
| Port 4173 free before and after the e2e run; no `wrangler`/`workerd` process left | confirmed |

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] `engineFor` did not type-narrow, so `npm run check` reported an error**

- **Found during:** Task 8-01-03, after the fixture generated and the spec ran green.
- **Issue:** The plan's `engineFor` snippet ends the `padsim` branch with
  `return new PadSim(entry.source.state as PadState)`. Vitest passed (esbuild strips types without
  checking them), but `svelte-check` reported
  `Property 'state' does not exist on type '{ kind: "state"; ... } | { kind: "lua"; ... }'` —
  TypeScript cannot infer `source.kind !== "lua"` from `preview === "padsim"`, and the `as PadState`
  cast asserts the property's *type*, not its *presence*.
- **Fix:** Replaced the cast with an explicit narrow,
  `if (entry.source.kind === "state") return new PadSim(entry.source.state);`, letting control fall
  through to the existing throw. This also removed the need for the `PadState` type import, which
  would otherwise have become an unused-import lint error.
- **Files modified:** `src/lib/catalog/frames.spec.ts`
- **Commit:** `64753a6`

**2. [Rule 2 - Correctness] Test 7's non-vacuity assertion made robust against a future `state` entry**

- **Found during:** Task 8-01-02.
- **Issue:** The plan specifies `CATALOG.length === PRESETS.length + luaCount`. That is correct
  today but goes red the moment wave 4-6 (or Phase 4) adds an entry with `source.kind === "state"`,
  which the `CatalogSource` union already permits — a false failure in a gate whose job is to catch
  real ones.
- **Fix:** Kept the external anchor that provides the non-vacuity (`presetEntries.length ===
  PRESETS.length`, where `PRESETS.length` is not counted from `CATALOG`) and made the completeness
  assertion cover all three kinds: `CATALOG.length === presetEntries.length + luaEntries.length +
  stateEntries.length`. A catalog that lost every entry still cannot pass, because the first
  assertion pins the ported count to the vendored shelf's own length.
- **Files modified:** `src/lib/catalog/catalog.spec.ts`
- **Commit:** `ff2bd83`

**3. [Rule 3 - Blocking] `npm run check 2>&1 | grep -E "0 errors"` cannot match**

- **Found during:** Task 8-01-01.
- **Issue:** `svelte-check` switches to its machine-readable format when stdout is not a TTY, and
  prints `COMPLETED 390 FILES 0 ERRORS 0 WARNINGS`. The plan's acceptance command greps
  case-sensitively for `0 errors`, which never matches through a pipe. Every acceptance criterion in
  the plan that uses that command is unsatisfiable as written.
- **Fix:** Ran `npm run check 2>&1 | grep -Ei "0 errors"` (case-insensitive) throughout. The
  substance of the check is unchanged. **Later plans in this phase should use `grep -Ei`.**
- **Files modified:** none.

### Environment note (not a code deviation)

**A concurrent Phase 4 planner swept two of this plan's files into its own commit.**
`src/lib/catalog/frames.json` and the first revision of `src/lib/catalog/frames.spec.ts` were staged
(deliberately, so the negative check could use `git checkout --`) when the Phase 4 planning agent
committed `docs(04): plan revision 2 ...` with a whole-index `git add`. Both files therefore landed
in commit `5ca679d` rather than in this plan's `64753a6`, which carries only the follow-up narrowing
fix. **The content is correct, complete and committed**; nothing was lost and no history was
rewritten, because another agent is live in this tree and a rebase would be destructive. Recorded
here so a reader tracing `frames.json` back to a `feat(08-01)` commit is not confused. This is a
concrete argument for the standing rule against `git add -A`.

---

## Notes for later plans

- **Re-measure the baseline.** 28 / 468 / 9 / 10 is what this plan left behind, but Phase 4 lands
  specs in the same tree. Always observe, then apply a delta.
- **`grep -Ei`, not `grep -E`, for `npm run check`.**
- **Adding a catalog entry requires a `frames.json` record** or `frames.spec.ts` test 1 goes red.
  Regenerate with `UPDATE_FRAMES=1`, expect a deliberate failure, then re-run clean.
- **`git add` a new fixture before perturbing it.** On an untracked path `git checkout --` fails and
  `git diff --quiet` passes vacuously.
- **Neither spec count moves when an entry is added.** Keep it that way: internal loops, never
  `it.each`.
- `front-door.ts` does not exist yet, so D-18's `EXCLUDED_FROM_ROW` has nothing to hook into. Phase 4
  creates it; wave 4-6 entries add themselves there when it does.

## Requirements

`requirements: [CONT-02, CONT-03]` in the plan frontmatter is **phase-level attribution, and neither
was marked complete here** - deliberately:

- **CONT-02** ("at least six new configurations authored for spectacle are in the catalog") is
  *unmet*. This plan built CONT-02 home and authored nothing; waves 4 to 6 (plans 08-04 to 08-06)
  author the configurations. Marking it complete now would be false.
- **CONT-03** ("every catalog entry has a name, a one-line description, feel-based tags, a Featured
  flag and a default knob state") has its **gate** - `catalog.spec.ts` tests 1, 7 and 8 - and all
  nine ported entries satisfy it. It stays open because REQUIREMENTS.md assigns it to Phase 4 with
  Phase 8 owning the metadata gate for new entries, and every entry added in a later wave must still
  pass it.

`.planning/REQUIREMENTS.md` is therefore unchanged by this plan.

## Self-Check: PASSED
