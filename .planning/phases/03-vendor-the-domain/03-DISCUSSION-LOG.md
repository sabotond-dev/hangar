# Phase 3: Vendor the Domain - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-02
**Phase:** 3-vendor-the-domain
**Areas discussed:** Upstream provenance, Oracle strength for PREV-06, Vendored tests location and speed, Cost baseline and production-build proof

---

## Upstream provenance

| Option | Description | Selected |
|--------|-------------|----------|
| Local HEAD a0fb69d5, after you push it | Newest compiler/sim state; user pushes `botor redesign:main` first so the SHA is public | ✓ |
| Local HEAD a0fb69d5, unpushed | Vendor now, push whenever; headers cite an unpublished SHA | |
| Public botor main 8689ec81 | Only what is published; loses two newest commits | |

**User's choice:** Local HEAD a0fb69d5, after you push it

| Option | Description | Selected |
|--------|-------------|----------|
| sabotond-dev/botor, branch main | The public GPLv3 fork where the zona code lives; Intech headers stay inside files | ✓ |
| intechstudio/grid-editor | Root upstream; zona files never existed there | |
| Both, explicitly | Fork commit line plus root upstream line | |

**User's choice:** sabotond-dev/botor, branch main
**Notes:** VENDOR.md's current "intechstudio/grid-editor @ redesign" wording is wrong and gets corrected.

| Option | Description | Selected |
|--------|-------------|----------|
| On demand, by a `/gsd:quick` sync task | User decides when a BOTOR change matters; tests + baseline make a bad sync fail loudly | ✓ |
| At the start of every HANGAR phase | Diff BOTOR against recorded SHA each phase | |
| Never after v1 — fork the compiler | HANGAR's copy becomes its own lineage | |

**User's choice:** On demand

---

## Oracle strength for PREV-06

| Option | Description | Selected |
|--------|-------------|----------|
| Transcribed tables + adversarial re-derivation | Keep BOTOR's cited tests; add an oracle from an agent forbidden from reading pad-sim.ts | ✓ |
| Transcribed tables only | Port existing citations as-is | |
| Add hardware capture later | Transcription now, Tier-6 checklist for hardware day | |

**User's choice:** Transcribed tables + adversarial re-derivation

| Option | Description | Selected |
|--------|-------------|----------|
| The five load-bearing tables | LED lookup, 256-sine, weights/512, colour ramp, tick order | ✓ |
| Everything pad-sim.ts cites | All ~12 cited sites | |
| You decide | Claude scopes at planning | |

**User's choice:** The five load-bearing tables

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, labelled as regression not oracle | Frame hashes at fixed ticks per preset as a tripwire | ✓ |
| No | Skip frame hashes | |

**User's choice:** Yes, labelled as regression not oracle

| Option | Description | Selected |
|--------|-------------|----------|
| Stop and report; fix upstream in BOTOR, then re-sync | Vendored files stay import-paths-only; oracle never edited to match | ✓ |
| Patch the vendored copy locally, note it in VENDOR.md | Faster; permanent merge conflict | |
| Stop and ask me each time | Per-case decision | |

**User's choice:** Stop and report; fix upstream, then re-sync

---

## Vendored tests location and speed

| Option | Description | Selected |
|--------|-------------|----------|
| src/vendor/botor/tests/, verbatim .js | Same sync procedure and header; Vitest glob already matches | ✓ |
| Root tests/ as HANGAR-owned .ts | ARCHITECTURE.md layout; every re-sync becomes a hand-merge | |
| You decide | Claude picks at planning | |

**User's choice:** src/vendor/botor/tests/, verbatim .js

| Option | Description | Selected |
|--------|-------------|----------|
| Keep it whole; measure; split only if quick-run exceeds ~30 s | Threshold decided now, split into `test:sweep` per wave only if needed | ✓ |
| Always run everything, whatever it costs | Risks a multi-minute inner loop | |
| Split the sweep out from the start | Pre-emptive | |

**User's choice:** Keep whole, measure, split only past ~30 s

---

## Cost baseline and production-build proof

| Option | Description | Selected |
|--------|-------------|----------|
| Run BOTOR's own compiler read-only in its checkout | Throwaway script inside grid-editor's node_modules at a0fb69d5 emits the nine presets' Lua + costs into a HANGAR fixture | ✓ |
| Capture from the vendored copy, check by eye | Circular | |
| Hand-transcribe from notes/fixtures | Costs known, full Lua not | |

**User's choice:** Run BOTOR's own compiler read-only in its checkout

| Option | Description | Selected |
|--------|-------------|----------|
| A Playwright test compiles a preset in the built site | Hidden entry awaits initLuaFormatter(), compiles, asserts cost equals baseline; proves .wasm served and initialises under CSP | ✓ |
| Assert the .wasm file exists in build/ only | Static check; does not prove it loads | |
| Defer to Phase 4 when there is a real page | Reword criterion 1 to Vitest-only | |

**User's choice:** A Playwright test compiles a preset in the built site

---

## Done check

| Option | Description | Selected |
|--------|-------------|----------|
| I'm ready for context | WASM gate placement recorded as Claude's discretion | ✓ |
| Discuss the WASM gate | Loading UX / gating the simulator | |
| Revisit an earlier area | | |

**User's choice:** I'm ready for context

## Claude's Discretion

- Vendor directory layout; `src/lib/fidelity/` layout
- `vendored-diff.spec.ts` mechanism (recorded upstream bytes preferred)
- Golden-frame tick counts and hash
- Whether `pad-sim-host.ts` gets a smoke test this phase (no jsdom just for it)
- Baseline script mechanics inside the sibling checkout
- WASM gate module shape (single memoised promise; simulator never gated)

## Deferred Ideas

- Hardware capture (Tier 6) when a ZONA is available
- Shared `@zona/pad` package — only on the escalation rule
- Zone blocks — only if Phase 8 wants zone-engine configs
- WASM loading UI — Phase 4
- Formatting BOTOR's zona files upstream — user's call in BOTOR (`// prettier-ignore` on the sine table first)
