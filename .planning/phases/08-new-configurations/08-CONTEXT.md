# Phase 8: New Configurations — Context

**Gathered:** 2026-09-04, unattended (overnight delegation). Sources: the user's standing decisions
("Six or more" new configs; "delicate, complex configs that are fun and USEFUL"; "make sure you know
the top characters in two events" = 908/908), `08-RESEARCH.md` (measured, 2026-09-04), and the
Phase 3 vendoring rules. Every decision marked [orchestrator] was taken without the user and is
open to veto in the morning; the [user] ones are theirs.

## Phase boundary

Phase 8 authors six or more new ZONA configurations that fit 908 characters per event, animate
firmware-faithfully on the site, carry knobs, and are gated by tests. It does **not** build the
coverflow (Phase 4), the knob widgets or meters (Phase 5), or install (Phase 7). It may start before
those phases finish because its deliverables are data, a Lua host and tests.

## Decisions

### Scope and selection
- **D-01 [user]** At least six new configurations. Six is the floor, not the cap.
- **D-02 [user]** Each must be fun *and useful*: a complete instrument or a real playing aid, not a
  screensaver. Spectacle is expected; usefulness is required.
- **D-03 [user]** Both events measured with the pinned protocol's `compressScript`; nothing over 908
  on either.
- **D-04 [orchestrator]** Ship the research's recommended six — **EUCLID, CHORUS, ARC, GHOST,
  LATTICE, MORPH** — with **SONAR, STEP, RIBBON** as reserves to add if the plan has room (all nine
  fit and ran). **MIRROR is blocked** until the user's five-minute hardware test proves DAW MIDI-in
  reaches `midirx_cb`; a plain-fader fallback exists.
- **D-05 [orchestrator]** No HANGAR-authored patch into BOTOR's compiler for new looks. Phase 8 is
  not blocked on route 1b; if one is ever wanted, MORPH is the cheapest to upstream.

### Animation route
- **D-06 [orchestrator]** Route 1c: a **Lua VM (wasmoon, Lua 5.4, MIT, lazy-loaded)** drives the
  vendored `PadSim`'s LED engine through its already-public `pokeLayer` / `layer` / `tick` / `frame`
  hooks. **No vendored file is edited** (Phase 3's D-04 stands; `vendored-diff.spec.ts` stays
  green).
- **D-07 [orchestrator]** `PadSim` remains the preview for the nine ported presets; the Lua host is
  used only for hand-authored entries. A browse-only visitor never downloads the Lua chunk unless a
  Lua card enters view. A parity spec is the bridge: the Lua host must reproduce all nine presets'
  layer records and golden-frame hashes before any new config is authored (Wave 0 gate).
- **D-08 [orchestrator]** The Lua host implements the same `SimEngine` surface `SimHost` already
  calls (`tick`, `frame`, `animating`, `touchDown/Move/Up`, `setState`, `coordMax`,
  `pendingTouches`) so Phase 4's card component picks an engine by `entry.preview` and changes
  nothing else. `glag` is implemented as `screenToHw` (it is not the identity). Integer semantics
  follow the firmware's Lua 5.5 rules for the restricted subset, and the gate **forbids** anything
  outside that subset rather than reasoning about equivalence.

### Where configurations live
- **D-09 [orchestrator]** All configurations, ported and new, live in one HANGAR-owned catalog
  module, `src/lib/catalog/` (`index.ts`, `entries/*.ts`, `catalog.spec.ts`, `frames.json`). The
  vendored `PRESETS` array stays the nine and is never extended.
- **D-10 [orchestrator]** `CatalogEntry` carries `id`, `name`, `description`, feel-based `tags`,
  `featured`, `addedAt`, a `source` union (`preset` | `state` | `lua`), a derived `preview`
  (`padsim` | `lua`), `knobs` and `defaults`; `build()` derives the Profile-Cloud-shaped object.
  **Phase 4 adopts this shape for its seed row** so Phase 8 entries slot in with no migration.
- **D-11 [orchestrator]** Hand-authored Lua is stored in **canonical form**: `compressScript(x) === x`
  is asserted, because cost is `max(compressed, raw)` and comments are not stripped.

### Knobs
- **D-12 [orchestrator]** Knobs on Lua entries are **literal token substitution** (`@TEMPO` → value),
  three to six per entry, mapped onto the same widget kinds the compiler-driven cards use
  (TUNE-01's shared vocabulary). The **whole knob cross-product is measured at build time** and must
  stay within 908 on both events; there is no runtime fit ladder for Lua entries, so TUNE-04's
  "we trimmed something" line never fires for them.
- **D-13 [orchestrator]** The shareable-stamp envelope for Lua entries is a Phase 5 seam; Phase 8
  only guarantees stable `id`s and integer knob indices. Deferred, not decided here.

### Gate (CONT-02, CONT-03)
- **D-14 [orchestrator]** One Vitest spec per concern: canonical form, budget (`max(raw,
  compressed) <= 908`), syntax after `padReady()`, knob-sweep budget, Lua-host execution smoke
  (Setup + Timer, 200 ticks plus a scripted drag/tap/lift with no error), golden frame hashes at
  ticks [0, 37, 101, 500, 1009], and metadata completeness. Plus a production-build e2e assertion
  that a cold catalog load fetches neither the Lua WASM nor the formatter WASM.
- **D-15 [orchestrator]** Known trap recorded in the gate's comments: a keeper `glt(a,L,65535)` on a
  layer carrying decaying trails replaces the countdown and strobes forever; every candidate that
  had it was rewritten, and the smoke test runs long enough to catch a recurrence.

### Hardware
- **D-16 [user, standing]** The user tests on hardware personally. Until Phase 7 installs, the audition
  goes through BOTOR's shelf (Timer into event 6 first, then Setup into event 0). The research's
  twelve-row audition checklist becomes a `docs/` page the plan ships; it is a checkpoint the user
  runs in daytime, never something the orchestrator does.

## Deferred / out of scope
- MIRROR (blocked on hardware). Route 1b BOTOR patches. Stamp envelope (Phase 5). Coverflow
  integration beyond the `SimEngine` seam (Phase 4). Knob widgets and meters (Phase 5).

## Open for the user in the morning
1. Veto or confirm the six (D-04) — reserves are ready.
2. Whether to run the MIRROR MIDI-in test on the ZONA.
3. Whether adding `wasmoon` (MIT, ~129 KB brotli, lazy) as a runtime dependency is acceptable.
