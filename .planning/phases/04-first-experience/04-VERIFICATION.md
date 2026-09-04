---
phase: 04-first-experience
verified: 2026-09-04T04:48:34Z
status: human_needed
score: 5/5 observable truths verified
suites:
  test_quick: "37 files / 534 passed | 1 todo — matches the expected figure"
  check: "421 files, 0 errors, 0 warnings"
  lint: "prettier --check clean, eslint exit 0"
  build: "exit 0; adapter-static wrote build/, postbuild archived e85f94aa"
  playwright: "21 passed (1.0m); paint probe recorded 135 pad frames in two seconds at 1280x720"
human_verification:
  - test: "Open the front door, choose the centre pad, click TRY ON DEVICE, pick the ZONA in the browser's chooser"
    expected: "Within about a second the panel shows ZONA IDENTIFIED with the firmware version and the active page read from the module, plus the sentence that install arrives in the next release; DISCONNECT ZONA appears; afterwards the module's own configuration is untouched because nothing was sent"
    why_human: "Web Serial has no CDP domain and no fake-device hook, so the happy path cannot be automated. The zero-write invariant IS machine-asserted against FakeTransport and by a source scan; what a person confirms is the real module's behaviour"
findings:
  - id: F1
    severity: warning
    title: "PREV-01 is marked complete in REQUIREMENTS.md with no annotation of accepted deviation 1"
  - id: F2
    severity: warning
    title: "PREV-05 is marked complete, but its third clause (a dozen visible cards at 30 fps) is unproven and unprovable at this scale"
  - id: F3
    severity: warning
    title: "CAT-01 is marked complete, but tpad — a catalog entry — has no deep link, by design"
  - id: F4
    severity: info
    title: "The paint probe asserts > 0, not the > 70 stall floor 04-VALIDATION.md's accepted deviation 3 contracted. Self-disclosed in 04-09-SUMMARY"
  - id: F5
    severity: info
    title: "Three of the four stepping routes named in criterion 2 (name-plate arrows, wheel, side-pad click) are implemented but asserted by no test"
  - id: F6
    severity: info
    title: "TryOnDevice.svelte's requestPort-first ordering and its absence of write symbols have no standing test — one-off acceptance probes only. Already logged in deferred-items.md"
  - id: F7
    severity: info
    title: "Coverflow's onskipped prop is dead; no caller passes it and the same information is handled internally"
  - id: F8
    severity: info
    title: "ROADMAP.md's progress table still reads `4. First Experience | 0/9 | Planned`"
---

# Phase 4: First Experience Verification Report

**Phase Goal:** The site is worth opening with no hardware attached — the glyph-field wordmark
dissolves into a coverflow of live ZONA pads, one large and centred, and choosing it reveals
`TRY ON DEVICE`. The first ten seconds are a wow.

**Verified:** 2026-09-04T04:48:34Z
**Status:** human_needed — every automated truth holds; one hardware behaviour is the user's
**Re-verification:** No — initial verification

## Suites run by the verifier

| Suite | Command | Result |
|---|---|---|
| Quick unit | `npm run test:quick` | **37 files / 534 passed \| 1 todo** — exactly the expected figure |
| Types | `npm run check` | **421 files, 0 errors, 0 warnings** |
| Lint | `npm run lint` | Prettier clean, ESLint exit 0 |
| Build | `npm run build` | exit 0; `build/c/` holds the eight row entries and **no `tpad`**; postbuild archived `e85f94aa` |
| Browser | `npx playwright test` | **21 passed (1.0m)**, port 4173 confirmed free beforehand and no listener, `workerd` or `wrangler` left afterwards; log in `.tmp-e2e/verify-04.log` |

The paint probe printed `pad frames painted in two seconds: 135 (viewport 1280x720)` — inside the
139–216 band 04-09-SUMMARY recorded, and comfortably above the 70 that 04-VALIDATION contemplated.

## Goal Achievement

### Observable Truths

| # | Truth (from the five success criteria, as amended by 04-VALIDATION) | Status | Evidence |
|---|---|---|---|
| 1 | The splash holds then dissolves into a coverflow; every visible pad runs its own configuration live in the vendored `PadSim`; motion is declared from the fixture, never faked; `tpad` is out of the row and the exclusion is asserted | ✓ VERIFIED | `Splash.svelte` phases `in → hold → dissolve → done`; `FrontDoor.svelte` renders `Coverflow` *before* the splash layer so the row is mounted and ticking underneath (e2e asserts `coverflow` is attached while `data-phase` is `in\|hold`); `Coverflow.svelte` builds `new PadSim(preset.state)` for every row id; `front-door.spec.ts` derives `motion` from `golden-frames.json` and compares, and cross-checks Phase 8's `restsBlack`; e2e proves aurora's canvas changes over 400 ms and ninepads' does not |
| 2 | Stepping by name-plate arrows, keyboard, wheel and side-pad click; a deep link lands centred with the splash skipped; the hero accepts mouse-as-finger through the tick-locked sampler | ✓ VERIFIED (coverage caveat, F5) | All four routes are in `Coverflow.svelte` (`NamePlate onprev/onnext`, `onKeyDown`, `onWheel` with a 40 px threshold and 260 ms cooldown, `onClick` reading `data-offset`); `/c/radar/` lands with `aria-activedescendant="slot-radar"`, zero `splash` elements and a canvas that moves; `TouchSampler` coalesces MOVEs and `SimHost.onFrame` calls `sampler.deliver` once **per tick**, before the tick, hero only |
| 3 | Choosing reveals the panel with `TRY ON DEVICE` primary and `KEEP ON DEVICE` secondary-disabled; nothing device-related before choosing; connect + identify only, zero writes; `requestPort()` before any await; the install-arrives-later line; present-but-disabled with the reason when Web Serial is absent; the port released on every un-choose path | ✓ VERIFIED (hardware happy path → human) | e2e counts `chosen-panel` at **0** after the splash clears and before any choose; `keep-on-device` is a real `disabled` attribute; `try-on.spec.ts` test 3 asserts zero writes against a recording transport **and** scans the source for six write-capable symbols; `TryOnDevice.svelte:277` makes `navigator.serial.requestPort(...)` the first statement with nothing awaited in front of it, every module fetched in `onMount`; `HONESTY` reads "…Writing arrives in the next release — this never writes."; the degrade e2e deletes `Navigator.prototype.serial`, asserts its own precondition, and finds the control present, disabled, naming Chrome, Edge and Firefox 151 and never "Chromium"; `unchoose()` calls `tryOn.release()` and an `$effect.pre` covers the Back-button path, with `onDestroy → closePort()` as the backstop |
| 4 | True black, one lime accent plus the alpha ladder, no third colour, no colour-authoring filter on a pad, glyph field on the splash only, quiet mixed-case headline with U+2019, wide-tracked uppercase wordmark, the 9×9 outline as favicon / loading state / pad frame; reduced motion stills at tick 64 and crossfades | ✓ VERIFIED | `identity.spec.ts` pins the eight tokens, recomputes every contrast from the declared alpha, forbids a ninth token and any hue outside `#000000` / `#d6ff4e`, and counts the favicon's 86 circles; an independent scan of every `src/lib/ui/*.svelte` style block found no colour literal outside those two plus `rgb(214 255 78 / α)`; the only `filter:` on the pad path is `brightness()` on the **slot wrapper** (`Coverflow.svelte:611`) — no `drop-shadow`, `blur`, `hue-rotate`, `sepia` or `invert` anywhere; `buildField` is imported by `Splash.svelte` and nothing else; the headline is `You’ve got to start somewhere…` with a real U+2019; `.wordmark` is `0.18em` uppercase; `PadFrame`, `PadSpinner` and `favicon.svg` all draw the same 9×9 dot recipe; `REDUCED_MOTION_TICKS = 64` with `stillFrame()` doing `reset()` then `run(64)`, and the e2e (with `emulateMedia` *and* `test.use`) proves the frame is lit and unchanged over 400 ms while `transitionDuration` is `0s` |
| 5 | One shared rAF, 10 ms accumulator with a 100 ms clamp, 33/50 ms paint intervals, IntersectionObserver `rootMargin: 200px`, self-cancelling loop, hero sim preserved across steps, a 9×9 backing canvas with `image-rendering: pixelated` and `putImageData`, the grid-protocol chunk off the front door's first paint, the catalog a static data file, the fidelity line present | ✓ VERIFIED (no fps floor, by accepted deviation 3) | `schedule.spec.ts` pins `TICK_MS`, `MAX_CATCHUP_MS`, `HERO_INTERVAL_MS`, `SIDE_INTERVAL_MS` **and reads the vendored host to prove parity**; `host.spec.ts` covers one-frame-for-all-pads, the 25 ms carry, the five-second clamp, the two cadences, paint-on-expiry-then-stop, `inWindow AND intersecting`, no reset on re-register, live reduced-motion toggle and a teardown that leaks nothing; `paint.spec.ts` counts exactly one `putImageData` and zero `drawImage`/`strokeRect`/`shadowBlur`; `config-shape.spec.ts` tests 13 and 14 guard the chunk over the **source** and over `build/index.html` and `build/c/aurora/index.html`, with a blind-probe guard; `FidelityLine` is unconditional |

**Score:** 5/5 truths verified.

### Required Artifacts

| Artifact | Expected | Status | Detail |
|---|---|---|---|
| `src/lib/catalog/front-door.ts` | The row, its order, its motion flags, the exclusion list | ✓ VERIFIED | 8 entries, imports **nothing** (asserted); `EXCLUDED_FROM_ROW` holds `tpad` with a one-line reason |
| `src/lib/catalog/front-door.spec.ts` | The agreement gate | ✓ VERIFIED | 8 tests: partition, derived motion, dark-pad exclusion, opening window, three-largest-move, no-adjacent-quiet, no compiler import, quiet copy byte-equal to the shelf |
| `src/lib/coverflow/slots.ts` | The geometry, pure | ✓ VERIFIED | Ring maths, mirrored `rotateY`, the approved ladder, `radiusForWidth` 3/2/1 → **7/5/3 visible pads** |
| `src/lib/sim/schedule.ts` / `paint.ts` / `touch.ts` | Clock, painter, finger | ✓ VERIFIED | 7 + 5 + 8 tests; constants held against the vendored host by reading it |
| `src/lib/sim/host.ts` | One rAF for the page | ✓ VERIFIED | 10 tests; `HostEngine` declared structurally so nothing under `src/vendor` is imported |
| `src/lib/device/try-on.ts` | Identify-only | ✓ VERIFIED | 6 tests including the double-sided zero-write gate; takes an already-open transport and never closes it |
| `src/lib/transport/transport.ts` | `failureCopy(f, raw?, controlLabel = "Connect")` | ✓ VERIFIED | Six interpolation sites; `no-web-serial` deliberately names no control; Phase 2's callers keep the default |
| `src/lib/ui/*.svelte` (11 files) | Frame, canvas, row, plate, fidelity line, splash, panel, controls, spinner, front door | ✓ VERIFIED | All wired; four-layer pad with two layers that never repaint; `PadCanvas` takes no context and sets no size — the host does both |
| `src/routes/+page.svelte`, `src/routes/c/[id]/{+page.ts,+page.svelte}` | Front door and one address per configuration | ✓ VERIFIED | `entries()` over `FRONT_DOOR`; build emitted 8 pages with distinct descriptions and no `build/c/tpad` |
| `src/app.css` | The identity | ✓ VERIFIED | Eight tokens, Quicksand first, focus ring never removed |
| `scripts/gen-licenses.mjs` | `OFL-1.1` allowed | ✓ VERIFIED | Allowlist extended; `THIRD-PARTY.md` lists `@fontsource/quicksand@5.3.0 — OFL-1.1`; `licenses/@fontsource` present; pin is exact (`"5.3.0"`, no caret) |
| `e2e/first-experience.e2e.ts` | The browser half | ✓ VERIFIED | 11 tests, all green; imports `FRONT_DOOR` from source rather than restating ids |

### Key Link Verification

| From | To | Via | Status | Detail |
|---|---|---|---|---|
| `Coverflow.svelte` | `PadSim` | `await import("../../vendor/botor/pad-sim")` inside `onMount` | ✓ WIRED | Dynamic, never static — and both a source guard and an artefact guard prove it |
| `SimHost` | canvas | `register()` sets `width/height = 9`, takes the 2D context, creates one reused `ImageData`, paints immediately | ✓ WIRED | Component cannot forget the backing store |
| `Coverflow` | `SimHost` | `setInWindow` + `setHero` on every step and resize | ✓ WIRED | `running = inWindow && intersecting && active` — the observer's blind spot is closed |
| pointer | engine | slot wrapper → `mapAxis` → `host.touchDown/Move/End` → `sampler` → `deliver()` once per tick | ✓ WIRED | Tick-locked; touch id is the **contact slot**, freed on the UP's delivery |
| `TryOnDevice` | `identifyOnly` | dynamic `import("$lib/device/try-on")` in `onMount`, then a click handler whose first statement is `requestPort` | ✓ WIRED | Activation window intact |
| un-choose | port | `unchoose() → tryOn.release()`, `$effect.pre` for Back, `onDestroy → closePort()` | ✓ WIRED | Three paths plus a backstop, all idempotent |
| `/c/[id]/` | `FRONT_DOOR` | `entries()` + `load()` → `frontDoorIndex` | ✓ WIRED | Unknown id → index −1 → shelf plus a bounded notice, never a dead end |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data? | Status |
|---|---|---|---|---|
| `PadCanvas` (×7) | 243-byte RGB frame | `PadSim.frame`, stepped by the shared rAF from `preset.state` | Yes — e2e reads the backing store and proves it changes for `aurora`/`radar` and does **not** for `ninepads` | ✓ FLOWING |
| `NamePlate` / `FidelityLine` | name, description, quiet line | `FRONT_DOOR`, held byte-equal to `CATALOG` (and to the shelf's own `quiet`) by the spec | Yes | ✓ FLOWING |
| `TryOnDevice` identified block | firmware, active page | `identifyOnly` folding real inbound heartbeat frames | Yes in node against a capture; on hardware → human check | ✓ FLOWING (node) |
| `ChosenPanel` reserved region | — | Deliberately no meter; a caption and one sentence | N/A — an inert meter was explicitly rejected (W-19) | ✓ CORRECT BY DESIGN |

### Behavioral Spot-Checks

| Behaviour | Command | Result | Status |
|---|---|---|---|
| Whole unit suite | `npm run test:quick` | 37 files / 534 passed \| 1 todo | ✓ PASS |
| Types | `npm run check` | 0 errors, 0 warnings | ✓ PASS |
| Lint | `npm run lint` | exit 0 | ✓ PASS |
| Static build | `npm run build` | exit 0, 8 `/c/` pages, no `tpad` | ✓ PASS |
| Browser suite against `build/` | `npx playwright test` | 21 passed | ✓ PASS |
| Vendored tree untouched | `git diff --stat 16e5232..HEAD -- src/vendor/` | empty | ✓ PASS |
| Vendored byte gate | `vendored-diff.spec.ts` (5 tests, inside the quick run) | green | ✓ PASS |
| No Claude/Anthropic attribution | grep of commit messages `16e5232..HEAD` and of `src/ e2e/ scripts/ docs/ static/ worker/` | none; the only hits are filesystem paths and a `CLAUDE.md export-ignore` assertion | ✓ PASS |
| Working tree | `git status --porcelain` | clean | ✓ PASS |
| Port hygiene | `netstat` before and after | free before, no listener and no `workerd`/`wrangler` after | ✓ PASS |

### Requirements Coverage

| Req | Description (abbreviated) | Marked in REQUIREMENTS.md | Verdict | Evidence |
|---|---|---|---|---|
| PREV-01 | Every card animates live in the firmware-faithful simulator, no hardware | **[x] Complete** | ⚠️ EARNED ONLY UNDER DEVIATION 1 (F1) | Every visible pad **runs** live; three of eight are honestly still and say so. The classification is derived from `golden-frames.json`, never declared, and faking motion is what PREV-02 forbids — so the delivery is the honest one. But the requirement's own line still reads "every card **animates**", and unlike PREV-02 and CONT-03 it carries no parenthetical recording the deviation. A reader of REQUIREMENTS.md alone would be misled |
| PREV-02 | The simulator consumes the exact compiler output; no hand-authored animation | [ ] Pending *(Lua-sourced entries: Phase 8)* | ✓ HONEST | Nothing is hand-authored: `PadSim` runs the same `PadState` the compiler compiles, and `preset-baseline.json` pins that compilation character-identical to BOTOR. The literal "consumes compiler **output**" arrives with Phase 8's wasmoon `SimEngine`. Leaving it Pending is correct |
| PREV-03 | One line on what the simulator matches and cannot show | [ ] Pending | ✓ DELIVERED, mark lags | `FidelityLine` is unconditional and its sentence is asserted character-for-character. Could justifiably be marked complete |
| PREV-04 | The focused card accepts mouse-as-finger | [ ] Pending | ✓ DELIVERED, mark lags | `TouchSampler` (8 tests) + `host.spec` test 9 (a finger moves the hero even under reduced motion, one sample per tick) + the tap rule proven in both directions in the browser |
| PREV-05 | Offscreen cards pause with a wake margin; reduced motion falls back to a still frame; the render path stays within budget at a dozen visible cards at 30 fps | **[x] Complete** | ⚠️ TWO CLAUSES OF THREE (F2) | Pausing and reduced motion are fully asserted. The third clause is not: the row mounts at most **7** pads, there is no fps assertion anywhere (accepted deviation 3), and the recorded 135 paints in two seconds is well under the ~300 the 33/50 ms cadences imply under five parallel workers. Refusing to assert an unmeasured floor is the right call; marking the clause complete is not |
| CAT-01 | Every configuration has a deep link that lands on its detail view | **[x] Complete** | ⚠️ EIGHT OF NINE (F3) | Eight real prerendered pages, each with its own `<head>`, landing centred with the splash skipped. But `tpad` is a catalog entry with **no** page — the e2e asserts `/c/tpad/` is a deliberate 404 — and the "detail view" is Phase 5.1's. This follows straight from accepted deviation 2, so it is disclosed; the unqualified **Complete** is still stronger than the code |
| CAT-04 | The catalog is a static data file of Profile-Cloud-shaped objects plus tuning metadata, no backend | [ ] Pending | ✓ DELIVERED, mark lags | `src/lib/catalog/` (from 08-01) with `build()` producing the Profile-Cloud object; 10 tests |
| CONT-01 | The nine BOTOR shelf presets are in the catalog, each compiling to the same Lua as BOTOR at the pinned version | [ ] Pending | ✓ DELIVERED | `catalog.spec.ts` asserts all nine exactly once and that the shelf is never extended; `preset-baseline.spec.ts` holds the compilation |
| CONT-03 | Every entry has a name, one-line description, feel-based tags, a Featured flag and a default knob state | [ ] Pending *(metadata gate for new entries: Phase 8)* | ⚠️ PARTIAL, correctly Pending | Name, description, tags and `featured` are present and gated. `knobs: []` / `defaults: {}` on every ported entry — the compiler-driven knob vocabulary for a `PadState` card is TUNE-01 and belongs to Phase 5. Honest, documented, and correctly left Pending |
| IDENT-01 | The reference identity | [ ] Pending | ✓ DELIVERED, mark lags | See truth 4 |
| IDENT-02 | Motion-forward while honouring `prefers-reduced-motion` | [ ] Pending | ✓ DELIVERED, mark lags | Live media subscriptions in `SimHost`, `NamePlate` and `Splash` — an OS toggle mid-session takes effect with no remount |
| DEGR-02 | Install controls present but disabled with the reason | [ ] Pending — **Phase 7** *(browser-capability half delivered in Phase 4)* | ✓ HALF DELIVERED, correctly attributed | The capability half ships here and is proven in the browser with `navigator.serial` deleted. The requirement stays with Phase 7, as the traceability table already says |

No orphaned requirements: the roadmap's eleven for Phase 4 are exactly the eleven the plans claimed.

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|---|---|---|---|
| — | `TODO`/`FIXME`/`XXX`/`HACK`/placeholder in Phase 4 source | none found | — |
| `Coverflow.svelte` | `onskipped` prop declared, never passed (F7) | ℹ️ Info | Dead parameter. The same information is used internally (`skipped.includes(...)` → `NamePlate unavailable`), and `NamePlate`'s doc comment still describes the callback route. Cosmetic only |
| `ChosenPanel.svelte` | A 152 px reserved region with a caption and a sentence | ℹ️ Info | **Not** a stub: it deliberately draws no inert meter, and the height is reserved so Phase 5's knobs cannot push the primary control under a reader. Correct by design (W-19) |
| `try-on.ts` / `TryOnDevice.svelte` | Names of write-capable symbols appear in header comments | ℹ️ Info | Comment-only (lines 6–14 of a block ending at line 38); the spec's needle-assembly idiom keeps the scan honest |
| Row order | Two `eslint-disable` lines for `svelte/prefer-svelte-reactivity` | ℹ️ Info | Justified in place: a `SvelteMap` proxy trap inside a 100 Hz loop is the exact cliff the design avoids |

### Human Verification Required

#### 1. Connect and identify a real ZONA, and confirm nothing was written

**Test:** Open the front door, choose the centre pad, click `TRY ON DEVICE`, pick the ZONA in the
browser's chooser.
**Expected:** Within about a second the panel shows `ZONA IDENTIFIED` with the firmware version and
the active page read from the module, and the sentence that install arrives in the next release.
`DISCONNECT ZONA` appears. Afterwards the module behaves exactly as before — its own configuration
untouched, because nothing was sent.
**Why human:** Web Serial is an operating-system capability with no CDP domain and no fake-device
hook. The invariant it would prove is already asserted twice in node (a recording transport that
saw zero writes, and a source scan for six write-capable symbols); what only a person can confirm is
the real module's response and that its configuration survived.

Two further properties are worth a human eye and are deliberately **not** assertions, recorded as
checkpoints rather than gates: whether the coverflow's depth reads as depth on a real screen, and
whether the splash's dissolve lands the wordmark cleanly on the header.

### Findings Summary (none blocking)

The phase goal is achieved. What follows is where the record is stronger than the code, or where a
load-bearing behaviour has no standing gate.

1. **F1 — PREV-01's checkbox carries no deviation note.** Marking it complete is defensible under
   accepted deviation 1, but PREV-02 and CONT-03 both carry parenthetical qualifiers in the same
   file and PREV-01 does not. One parenthetical — *(as amended by 04-VALIDATION deviation 1: every
   visible pad runs live; three are honestly still and say so)* — would close it.
2. **F2 — PREV-05's third clause is unproven.** "A dozen visible cards at 30 fps" cannot be true of
   a row that mounts at most seven, and no fps is asserted anywhere. Either qualify the mark or move
   the frame-budget clause to a phase that measures on real hardware.
3. **F3 — CAT-01 is eight of nine.** `tpad` has no `/c/` page, deliberately. Qualify the mark the
   way PREV-02 is qualified.
4. **F4 — the stall floor was contracted and not built.** 04-VALIDATION's accepted deviation 3
   promised `painted > 70` as the compensating control for having no fps floor; the shipped probe
   asserts `> 0`. 04-09-SUMMARY discloses the disagreement and records 139–216 (135 observed here),
   so the fix is one line. Until it lands, a row where only the hero paints would pass.
5. **F5 — three of four stepping routes are untested.** Criterion 2 names the name-plate arrows, the
   keyboard, the wheel and a side-pad click; only the keyboard is asserted. All four are present and
   read correctly, but a regression in `onWheel`, `onClick` or the plate's callbacks would ship green.
6. **F6 — `TryOnDevice.svelte` has no standing structural gate.** Its two load-bearing invariants —
   `requestPort()` first with nothing awaited, and no write-capable symbol in the file — were
   verified by one-off probes during plan 04-08 and by this verifier's own reading, not by a
   committed test. `src/lib/device/try-on.ts` *is* gated. `deferred-items.md` already logs the fix:
   widen `forbidden-instructions.spec.ts`'s `SCANNED_DIRS` to `src/lib`.
7. **F7 — dead `onskipped` prop.** Cosmetic.
8. **F8 — ROADMAP.md still shows `4. First Experience | 0/9 | Planned`** with the phase bullet
   unchecked, while all nine plans are `[x]`. `deferred-items.md` documents the GSD `state
   update-progress` defect behind this class of staleness.

None of the eight prevents the goal, and none contradicts a success criterion as amended. Items 1–3
are wording on three checkboxes; 4–6 are gates that would catch a future regression rather than a
present defect.

## Verdict

Phase 4 delivers what the brief asked for and does it honestly. The splash really does cover a row
that has already been running; the pads really are the vendored firmware simulator driven from the
compiler's own input; the three still pads are still because the fixture says they are, and the code
would rather go red than fake them. `TRY ON DEVICE` cannot write — that is a property of the file,
asserted from two directions, not a promise. The identity is two colours and a spec that fails on a
third. Every suite the phase claims is green, at the exact counts claimed, against the built bytes.

The gap between this phase and a clean `passed` is one hardware click that no test runner can make.

---

*Verified: 2026-09-04T04:48:34Z*
*Verifier: gsd-verifier — goal-backward, against the code rather than the summaries*
