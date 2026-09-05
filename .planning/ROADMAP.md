# Roadmap: HANGAR

## Overview

HANGAR is two nearly-independent products joined at one seam, and this roadmap keeps that seam
visible. A short scaffold phase settles the licence and the protocol pin, then the project forks:
a **hardware track** that opens with a deliberately isolated no-op write against a real ZONA (the
single riskiest unknown, answered in week one, not week six), and a **pure track** that vendors
BOTOR's compiler and simulator, turns them into a black-and-lime coverflow of live animating pads, and
then adds knobs, budget meters and shareable links — none of which needs a module plugged in. The
two tracks meet at the install flow, where the snapshot taken at connect, the RAM audition and the
deliberate flash store all land together, because splitting them would mean the first audition
destroys the state the snapshot exists to protect. Authoring new spectacle configs comes last, when
a working simulator and a live budget meter make it an easy job instead of a blind one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Scaffold, Licence and Pin** - Static-site skeleton with GPLv3 obligations and the exact grid-protocol pin settled from commit one (completed 2026-09-02)
- [x] **Phase 2: Walking Skeleton** - A bare page proves the full connect, fetch, write and store cycle on a real ZONA as a provable no-op (completed 2026-09-03)
- [x] **Phase 3: Vendor the Domain** - BOTOR's compiler, simulator and test suite run inside HANGAR, pinned against an independent fidelity oracle (completed 2026-09-02)
- [x] **Phase 4: First Experience** - Splash dissolves into a coverflow of live ZONA pads; choose one and `TRY ON DEVICE` appears — the wow front door, worth opening with no hardware attached (completed 2026-09-04)
- [x] **Phase 5: Tuning, Budgets and Shareable Links** - Knobs recompile live inside two visible 908-character budgets, and the tuned state travels in a URL (all 12 plans complete 2026-09-04, full suite green against the production build; verification and the first deploy of the tuned front door follow)
- [x] **Phase 5.1: Catalog Browse** - The sophisticated catalog behind the front door: sort, search, tags and a browse-to-detail flow over the same data file (all 11 plans complete 2026-09-05, full suite green against the production build at 691 unit + 13 sweep + 61 e2e; verification and the deploy follow)
- [x] **Phase 6: Device Session** - Feature-detected connect, ZONA identification, and every failure mode named in plain language (completed 2026-09-05; the six-row hardware checklist in docs/SESSION-RUNBOOK.md is presented to the user and unanswered, so success criteria 3, 4 and 5 are verified-by-user-pending)
- [x] **Phase 7: Install Flow** - Snapshot, RAM audition, PUT BACK and a separate deliberate flash store, all gated on real ACK frames (completed 2026-09-05; the full suite green against the production build at 776 unit + 13 sweep + 89 e2e; the seven-row hardware checklist in docs/INSTALL-RUNBOOK.md is presented to the user and unanswered, so the five *(hardware)* halves of its success criteria are verified-by-user-pending and no agent has written a byte to a real ZONA)
- [x] **Phase 8: New Configurations** - Six or more configs authored for spectacle against a working simulator and budget meter (completed 2026-09-04; the hardware audition is presented to the user and unanswered)

## Phase Details

### Phase 1: Scaffold, Licence and Pin
**Goal**: The repository exists as a deployable static site whose licence and dependency obligations are already satisfied, so both tracks can start from it without retrofitting anything.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-03, FOUND-04
**Success Criteria** (what must be TRUE):
  1. **AMENDED by 01-CONTEXT.md (D-02 — the repository is private permanently):** A visitor can load the deployed site over HTTPS and download, from a visible Source link, a source archive of exactly the deployed commit, with the commit SHA shown beside it. (Original wording: "follow a visible Source link to the public repository at the deployed commit".)
  2. A GPLv3 `LICENSE` and a third-party notices file are served from the site root, with `@intechstudio/grid-protocol`'s own GPLv3 listed.
  3. `@intechstudio/grid-protocol` is pinned to the exact version BOTOR's cost baseline was measured against (no caret), and a check fails if that pin is loosened or bumped without going through a test gate.
  4. A developer can produce a static build and preview it with no server running, and both test runners execute against that build.
**Plans**: 5 plans in 5 waves

Plans:
- [x] 01-01-PLAN.md — Scaffold with sv, install the exact grid-protocol pin, correct sv's output (wave 1)
- [x] 01-02-PLAN.md — PROTOCOL_PIN gate, bump policy, vendor seam, format-parity canary (wave 2)
- [x] 01-03-PLAN.md — GPLv3 LICENSE, third-party notices, source archive and postbuild (wave 3)
- [x] 01-04-PLAN.md — Basic Auth Worker, footer source link, Playwright against the static build (wave 4)
- [x] 01-05-PLAN.md — Deploy script with a clean-tree gate, then the manual gated deploy (wave 5)

### Phase 2: Walking Skeleton
**Goal**: Prove that a bare browser page — no framework, no Grid Editor runtime — can complete the whole write cycle against a real ZONA, using a write that changes nothing.
**Depends on**: Phase 1
**Requirements**: FOUND-01
**Success Criteria** (what must be TRUE):
  1. *(hardware — verified by the user on a real ZONA)* User opens a bare page, clicks connect, sees only ZONA's USB identity offered in the browser's port picker (VID 0x303a / PID 0x8123, never a bootloader identity), and the page reports the module identified as a ZONA with its firmware version.
  2. *(hardware)* The page displays the touch element's existing Setup and Timer strings, fetched from the module.
  3. *(hardware)* The page writes those exact same strings back and then stores them, and each step is reported as complete only after a matching ACKNOWLEDGE frame arrives from the module — never on a resolved local promise.
  4. *(hardware)* After the run the module is byte-for-byte unchanged: re-fetching Setup and Timer returns the original strings and the pad behaves exactly as it did before. The entire experiment is a provable no-op.
  5. The run records written answers to the open questions it exists to settle: whether an outbound host heartbeat is required, whether the 10 ms inter-message pacing is load-bearing at 2 Mbaud, and whether the Lua formatter WASM resolves from a plain static build.
**Plans**: 5 plans in 5 waves

Plans:
- [x] 02-01-PLAN.md — Pure protocol: descriptors, framing, decode guard, matcher, write refusal (wave 1)
- [x] 02-02-PLAN.md — Transport, capture, fake with faults, synthetic fixture, RequestQueue (wave 2)
- [x] 02-03-PLAN.md — The no-op sequence, /dev/skeleton/, the degrade e2e and the bare-import guard (wave 3)
- [x] 02-04-PLAN.md — Pre-flight, the runbook, and the hardware run checkpoint (wave 4)
- [x] 02-05-PLAN.md — The real fixture, its gate, docs/SKELETON-RESULTS.md and the measured timeouts (wave 5)

### Phase 3: Vendor the Domain
**Goal**: BOTOR's compiler and simulator run inside HANGAR unmodified, with fidelity pinned by something other than the code that produced it.
**Depends on**: Phase 1
**Requirements**: FOUND-02, FOUND-05, PREV-06
**Success Criteria** (what must be TRUE):
  1. A developer can run the vendored test suite — ported from BOTOR with only import-path rewrites — and see it green both in dev and against a production static build, proving the WASM asset resolves outside the dev server.
  2. Every vendored file names its BOTOR origin, and a written sync procedure documents how to re-pull upstream changes against a recorded upstream SHA.
  3. Compiling each of the nine shelf presets produces character-identical Lua to BOTOR at the pinned protocol version.
  4. Each preset's simulated output is pinned against an oracle transcribed from cited firmware source (file:line) or hardware capture, derived independently of the compiler — so a shared misreading of firmware fails the suite instead of hiding in it.
  5. No compile, cost or fit call can run before the Lua formatter WASM has initialised: an attempt waits for the gate rather than silently reporting invalid syntax or an unmeasurable cost.
**Plans**: 6 plans in 6 waves

Plans:
- [x] 03-01-PLAN.md — Wave 0 config, the six vendored BOTOR files, corrected VENDOR.md (wave 1)
- [x] 03-02-PLAN.md — Upstream sha256 manifest and the vendored-diff byte gate (wave 2)
- [x] 03-03-PLAN.md — Preset cost baseline from BOTOR own compiler, and the pin gate closure (wave 3)
- [x] 03-04-PLAN.md — Independent firmware oracle, its agreement spec, and golden frames (wave 4)
- [x] 03-05-PLAN.md — The memoised WASM gate and its proof (wave 5)
- [x] 03-06-PLAN.md — Hidden fidelity probe, the production-build e2e, docs/TESTING.md (wave 6)

### Phase 4: First Experience
**Goal**: The site is worth opening with no hardware attached — the glyph-field wordmark dissolves into a coverflow of live ZONA pads, one large and centred, and choosing it reveals `TRY ON DEVICE`. The first ten seconds are a wow.
**Depends on**: Phase 3
**Requirements**: PREV-01, PREV-02, PREV-03, PREV-04, PREV-05, CAT-01, CAT-04, CONT-01, CONT-03, IDENT-01, IDENT-02
**Success Criteria** (what must be TRUE):
  1. Visitor opens the site on any browser: the HANGAR glyph-field splash holds, then dissolves into a coverflow where one 9x9 pad is large and centred with neighbours receding left and right in depth — and every visible pad is animating live in the firmware-faithful simulator, running the exact compiled config that would be written to a module (no hand-authored animation, no hardware attached). The BOTOR shelf presets that light their LEDs form the seed row (tpad, which writes no LEDs, stays in the catalog but out of the row); Phase 8's configurations join the catalog from the same data file and enter the row deliberately, not automatically.
  2. Visitor steps the row with the name-plate arrows, keyboard, wheel or by clicking a side pad; a deep link lands with that configuration centred and the splash skipped. The centre pad accepts mouse-as-finger so the instrument can be played, not only watched.
  3. Visitor chooses the centre pad (click, Enter or the name) and a panel appears beneath the name plate with `TRY ON DEVICE` primary and `KEEP ON DEVICE` secondary; nothing about the device appears before choosing. In this phase `TRY ON DEVICE` connects and identifies a ZONA over the Phase 2 transport and states plainly that install arrives later — it never writes; on browsers without Web Serial it is present but disabled, with the reason.
  4. The site reads as the reference identity: true-black ground, one acid-lime accent, glyph-field wallpaper on the splash only, a quiet mixed-case headline, wide-tracked uppercase wordmark, and the 9x9 outline serving as logo, loading state and pad frame. Pads animate constantly; `prefers-reduced-motion` stills them to a representative frame and turns the dissolve into a short crossfade.
  5. Five to seven visible pads hold 30 fps on the centre and at least 20 fps on the sides, offscreen pads pause and wake before entering view, the catalog is a static data file of Profile-Cloud-shaped objects each carrying name, one-line description, feel-based tags and a Featured flag, and one quiet line states what the simulator matches exactly and what it cannot show.
**Plans**: 9 plans in 7 waves
**UI hint**: yes
**Design brief**: `.planning/design/FIRST-EXPERIENCE.md` — the user's reference frame and four answers (2026-09-04); it overrides the earlier catalog-of-cards wording wherever they differ.

Plans:
- [x] 04-01-PLAN.md — Catalog preflight, identity tokens, Quicksand through the licence gate, the 9x9 favicon (wave 1)
- [x] 04-02-PLAN.md — The front-door row gated against golden-frames, and the coverflow slot arithmetic (wave 2)
- [x] 04-03-PLAN.md — Sim primitives: the 10 ms clock, the one-call painter, the tick-locked finger (wave 2)
- [x] 04-04-PLAN.md — failureCopy gains a control label; the identify-only device path with zero writes (wave 2)
- [x] 04-05-PLAN.md — SimHost: one rAF, window-and-viewport gating, live reduced motion, clean teardown (wave 3)
- [x] 04-06-PLAN.md — The living row: pad layers, the coverflow band, stepping, and the front door route (wave 4)
- [x] 04-07-PLAN.md — Name plate, fidelity line, the glyph-field splash and its dissolve (wave 5)
- [x] 04-08-PLAN.md — Choosing, the panel, TRY ON DEVICE and KEEP ON DEVICE (wave 6)
- [x] 04-09-PLAN.md — Deep-link routes, the two chunk guards, and the phase gate (wave 7)

### Phase 5: Tuning, Budgets and Shareable Links
**Goal**: Visitors can turn knobs on any configuration, see the 908-character budgets as a live instrument instead of a write-time failure, and send the result to a friend as a link.
**Depends on**: Phase 4
**Requirements**: TUNE-01, TUNE-02, TUNE-03, TUNE-04, TUNE-05, TUNE-06, TUNE-07, SHARE-01, SHARE-02, SHARE-03, SHARE-04, DEGR-01
**Success Criteria** (what must be TRUE):
  1. Visitor can turn three to six knobs per configuration — drawn from colour, speed, layout, brightness, MIDI destination and config-specific parameters, using one shared widget vocabulary — and the preview updates live while the recompile is debounced. They can reset one knob by double-click or the whole configuration to defaults, and `SURPRISE ME` randomises into a state that is never over budget.
  2. Two separate live meters show Setup and Timer usage as `chars / 908` with a percentage, and when the fit ladder trims a feature to stay in budget the visitor is told so in one line rather than watching the preview quietly diverge from what they asked for.
  3. An over-budget state turns the offending meter red, disables `TRY ON DEVICE`, names the knob that pushed it over and offers a one-click back-off — the failure is surfaced next to the knobs and never travels to the wire to fail there.
  4. Copying a tuned configuration's link and opening it anywhere restores the knobs exactly (state in the URL hash, never the query string); `COPY LINK` confirms the copy in its own state; a stamp from an older HANGAR version says so plainly and lands on the base configuration rather than a subtly wrong one.
  5. A shared link unfurls on Discord with a build-time OG image rendered from the simulator, and the whole experience — catalog, simulation, tuning, sharing — works on every browser including iOS Safari.
**Plans**: 12 plans in 12 waves
**UI hint**: yes

Plans:
- [x] 05-01-PLAN.md — Baseline, the WebKit phone project, SimHost.replaceEngine and the gated fitState (wave 1)
- [x] 05-02-PLAN.md — The zero-import view seam: view.ts, copy.ts and idle.ts (wave 2)
- [x] 05-03-PLAN.md — The knob model: withChange, the nine preset descriptor lists, the Lua mapping (wave 3)
- [x] 05-04-PLAN.md — model.ts: the immediate preview, the debounced compile, the meters, SURPRISE ME and the ladder guards (wave 4)
- [x] 05-05-PLAN.md — The stamp, the share URL, and the two sweep proofs (wave 5)
- [x] 05-06-PLAN.md — The OG renderer and the dependency-free PNG encoder (wave 6)
- [x] 05-07-PLAN.md — gen-og.mjs, the build wiring and the Open Graph head (wave 7)
- [x] 05-08-PLAN.md — The ninth colour token with its identity-gate amendment, Knob.svelte and KnobRack.svelte (wave 8)
- [x] 05-09-PLAN.md — BudgetMeter, BudgetMessage, StampNotice and CopyLink (wave 9)
- [x] 05-10-PLAN.md — TuningRegion, the panel seam, and the structural gate over the tuning UI (wave 10)
- [x] 05-11-PLAN.md — Coverflow wiring: the live preview swap, the stamp landing, and eight e2e tests (wave 11)
- [x] 05-12-PLAN.md — /dev/tune/, the WebKit phone journey, the docs and the phase gate (wave 12)

### Phase 5.1: Catalog Browse
**Goal**: The sophisticated catalog behind the front door — the whole collection browsable, sortable and searchable without leaving the identity.
**Depends on**: Phase 5
**Requirements**: CAT-02, CAT-03
**Success Criteria** (what must be TRUE):
  1. Visitor reaches a browse screen from the front door and sees every configuration with name, one-line description, feel-based tags and Featured flag; the coverflow's data file is the only source.
  2. Visitor can sort by Featured, Newest and Name; no popularity metric is shown or faked.
  3. Visitor can open any configuration's focus/detail view — the chosen-pad state from Phase 4 with the knobs, meters and install controls docked by Phases 5 and 7 — and return to browse without losing position.
**Plans**: 11 plans in 11 waves
**UI hint**: yes

Plans:
- [x] 05.1-01-PLAN.md — The baselines and listing.ts: sixteen entries, import-free, gated against the catalog (wave 1)
- [x] 05.1-02-PLAN.md — sort.ts, filter.ts and grid.ts: three total orders, folded search, tag intersection, keyboard arithmetic (wave 2)
- [x] 05.1-03-PLAN.md — query.ts, return.ts and SimHost.repaintAll: the state that survives a round trip (wave 3)
- [x] 05.1-04-PLAN.md — The row of one: Coverflow's row prop, the arrow-less plate, and the tuner that hands its engine back (wave 4)
- [x] 05.1-05-PLAN.md — The routed set is sixteen: entries(), gen-og and the four gates D-07 invalidates (wave 5)
- [x] 05.1-06-PLAN.md — CatalogCard and BrowseGrid: sixteen live pads, one clock, one tab stop (wave 6)
- [x] 05.1-07-PLAN.md — The toolbar: search, the sort word row, the tag chips and the one live region (wave 7)
- [x] 05.1-08-PLAN.md — /browse/ itself, the lifted fidelity sentence, and the two chunk guards that could not see it (wave 8)
- [x] 05.1-09-PLAN.md — The header slot: BROWSE ALL, BACK TO BROWSE and the round trip walked by hand (wave 9)
- [x] 05.1-10-PLAN.md — e2e/browse.e2e.ts: eight tests (seven planned plus the authorised popstate regression), the frame measurement and the WebAssembly proof (wave 10)
- [x] 05.1-11-PLAN.md — The keyboard, the return, the D-18 hazard, the phone, and the phase gate (wave 11)

### Phase 6: Device Session
**Goal**: A visitor with a ZONA can get from a cold page to a verified connection, and every way that can go wrong tells them what to do next in plain language.
**Depends on**: Phase 2
**Requirements**: CONN-01, CONN-02, CONN-03, CONN-04, CONN-05, CONN-06, CONN-07, CONN-08
**Success Criteria** (what must be TRUE):
  1. Visitor sees one primary `CONNECT` control, enabled only when `"serial" in navigator && isSecureContext` and never gated by user-agent. An unsupported browser and an insecure context produce two different messages, each naming the fix, and the unsupported message names Chrome, Edge and desktop Firefox 151+ as browsers that work without ever saying "Chromium".
  2. Before clicking, the visitor reads what the browser's port picker is, that the browser asks and not HANGAR, and that HANGAR sees nothing at all until they choose a device.
  3. *(hardware)* Connecting offers only ZONA's USB identity (0x303a / 0x8123, bootloader identities never offered), verifies from the heartbeat that the module really is a ZONA before enabling any control, refuses any other module with a plain message, and shows the connected module's type and firmware version.
  4. *(hardware)* Each failure lands in its own named state instead of a raw exception: a port held by another program names Grid Editor as the likely culprit and gives the recovery in order (quit the other app, unplug, wait, replug, reload, connect); a cancelled picker is distinct from an empty picker; an empty picker branches to cable and driver, charge-only USB cable warning included.
  5. *(hardware)* A returning visitor is reconnected silently from a previously granted port without re-running the picker, and unplugging or replugging the module updates the UI immediately rather than failing on the next write.
**Plans**: 14 plans in 14 waves
**UI hint**: yes
**Design contract**: `.planning/phases/06-device-session/06-UI-SPEC.md` (approved 2026-09-04)
**Status at the gate (2026-09-05)**: criteria 1 and 2 are proven in two browsers against the production build. Criteria 3, 4 and 5 are *(hardware)* and are **verified-by-user-pending**: everything a scripted serial can check about them is green, and the parts only a real ZONA can settle are `docs/SESSION-RUNBOOK.md` rows A to F, presented to the user by plan 06-14 and unanswered. No claim about a real ZONA has been made by this phase.

Plans:
- [x] 06-01-PLAN.md — Baselines, the runes spike, the already-open row, the rig-aware not-zona (wave 1)
- [x] 06-02-PLAN.md — session-copy.ts: every session string, the nine-state table, capabilityOf (wave 2)
- [x] 06-03-PLAN.md — The light seam, and the session up to identification (wave 3)
- [x] 06-04-PLAN.md — The listener pair, the replug adoption, the watchdog, forget(), zero writes (wave 4)
- [x] 06-05-PLAN.md — Three shipped-gate widenings, each proven by a mutation (wave 5)
- [x] 06-06-PLAN.md — The fake serial, the /dev/session/ probe, and the two capability messages (wave 6)
- [x] 06-07-PLAN.md — The offer, the busy port, the unplug, the replug, and a visit that writes nothing (wave 7)
- [x] 06-08-PLAN.md — PadSpinner's two props, DeviceMark, FailureBlock (wave 8)
- [x] 06-09-PLAN.md — PickerExplainer, the reserved header note, and the one session live region (wave 9)
- [x] 06-10-PLAN.md — DeviceSlot's nine states, the disclosure, and the structural gate (wave 10)
- [x] 06-11-PLAN.md — The header cluster, the two-row phone layout, and the untouched opening (wave 11)
- [x] 06-12-PLAN.md — TryOnDevice consumes the session and gives up the port (wave 12)
- [x] 06-13-PLAN.md — The shipped chrome in two engines, and the connection that survives a walk (wave 13)
- [x] 06-14-PLAN.md — SESSION-RUNBOOK, the phase gate, and the hardware checkpoint (wave 14; the checkpoint is presented and unanswered)

### Phase 7: Install Flow
**Goal**: A visitor can put a configuration on their own ZONA in about a second, get their original back with one click at any time, and only commit it to flash on purpose.
**Depends on**: Phase 5, Phase 6
**Requirements**: SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-06, SAFE-07, SAFE-08, SAFE-09, DEGR-02
**Success Criteria** (what must be TRUE):
  1. *(hardware)* The connect screen says out loud that nothing is written without an explicit click, and at connect — before any write is possible — HANGAR snapshots the touch element's Setup and Timer strings. Every write control stays disabled until that snapshot is confirmed present and non-empty.
  2. *(hardware)* `TRY ON DEVICE` is the primary action and writes to RAM only: the pad plays the new configuration in about a second, the site states that speed honestly and confirms a settled state rather than animating a progress bar for a 200 ms operation, and a power cycle brings the original back.
  3. *(hardware)* `PUT BACK` restores the snapshotted configuration with one click at any time, including in a fresh tab after the browser was closed, because the snapshot persists in `localStorage` keyed by module identity.
  4. *(hardware)* `KEEP ON DEVICE` is a visibly secondary, separate action — never an equal-weight button beside `TRY ON DEVICE` — and requires a confirmation naming what is being replaced ("the Setup and Timer scripts on your ZONA's touch element") and stating that it survives a power cycle. On a rig with other Grid modules the confirmation also names them and states that their current pages are stored too, while still allowing the action.
  5. *(happy path on hardware; failure paths exercised against recorded frames with no hardware)* "Installed" means an ACKNOWLEDGE frame arrived for each event write: a write that lands one event but not the other is detected and reported plainly with retry and `PUT BACK` both offered, retries on timeout are bounded, and a connection lost mid-write ends in a named failure state rather than an infinite retry loop. On browsers without Web Serial the install controls are present but disabled with the reason inline, never hidden.
**Plans**: 13 plans in 13 waves
**UI hint**: yes

Plans:
- [x] 07-01-PLAN.md — Phase 6 closed, the five baselines, the fifth descriptor and its key (wave 1) (completed 2026-09-05)
- [x] 07-02-PLAN.md — One writer for three clicks, the storeAllowed throw undone by name, the fake ZONA that refuses (wave 2) (completed 2026-09-05)
- [x] 07-03-PLAN.md — snapshot.ts and install-copy.ts, each importing nothing, with the caps asserted (wave 3) (completed 2026-09-05)
- [x] 07-04-PLAN.md — The session's seams: the write view, onClass, onConnection, announce, writeLock (wave 4) (completed 2026-09-05)
- [x] 07-05-PLAN.md — The tuner's onconfig channel and the byte-for-byte wire pin (wave 5) (completed 2026-09-05)
- [x] 07-06-PLAN.md — The install store: the snapshot at connect, TRY ON DEVICE and PUT BACK in RAM (wave 6) (completed 2026-09-05)
- [x] 07-07-PLAN.md — The install store: KEEP ON DEVICE with the read-back proof, the taxonomy, the bounds (wave 7) (completed 2026-09-05)
- [x] 07-08-PLAN.md — The shim answers with the real fake, the /dev/install/ probe, the fourteen states walked (wave 8) (completed 2026-09-05)
- [x] 07-09-PLAN.md — The allow-list mutations observed, then PutBack, KeepConfirm and InstallState (wave 9) (completed 2026-09-05)
- [x] 07-10-PLAN.md — The panel writes: the never-writes literals retired, KEEP ON DEVICE quiet, the column row (wave 10) (completed 2026-09-05)
- [x] 07-11-PLAN.md — The header lock, the snapshot line, and the degrade test extended (wave 11) (completed 2026-09-05)
- [x] 07-12-PLAN.md — The install flow on the real page in two engines (wave 12) (completed 2026-09-05)
- [x] 07-13-PLAN.md — INSTALL-RUNBOOK, the phase gate, and the hardware checkpoint - the first real write (wave 13; the checkpoint is presented and unanswered) (completed 2026-09-05)

### Phase 8: New Configurations
**Goal**: The catalog stops being a port of BOTOR's shelf and becomes HANGAR's own — configurations authored for spectacle against a working simulator and a live budget meter.
**Depends on**: Phase 5
**Requirements**: CONT-02
**Success Criteria** (what must be TRUE):
  1. At least six new configurations, authored for HANGAR rather than ported from BOTOR, are in the catalog, each with its name, one-line description, feel-based tags, Featured flag and default knob state filled in.
  2. Each new configuration fits both the 908-character Setup and 908-character Timer budgets at its default knob positions, shown green in the live meters.
  3. Each new configuration is verified in the simulator at its defaults and swept across its full knob range, with no combination silently exceeding budget — the fit ladder either holds it or names what it trimmed.
**Plans**: 8 plans in 8 waves

Plans:
- [x] 08-01-PLAN.md — The counts helper, the catalog module, the nine ported entries, the metadata gate and golden frames (wave 1)
- [x] 08-02-PLAN.md — wasmoon at an exact pin, its licence, the lazy gate and the Grid API host (wave 2)
- [x] 08-03-PLAN.md — The SimEngine seam and the nine-preset Lua parity gate (wave 3)
- [x] 08-04-PLAN.md — EUCLID, and the CONT-02 gate: canonical form, budget, subset, knob sweep, execution (wave 4)
- [x] 08-05-PLAN.md — CHORUS, ARC and GHOST (wave 5)
- [x] 08-06-PLAN.md — LATTICE, MORPH and SONAR; the floor of six cleared with seven (wave 6)
- [x] 08-07-PLAN.md — The production-build laziness proof and the testing docs (wave 7)
- [x] 08-08-PLAN.md — docs/HARDWARE-AUDITION.md and the hardware checkpoint (wave 8)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

**Parallelism** (config: `parallelization: true`):
After Phase 1 the project forks into two independent tracks that may run concurrently:
- Hardware track: 2 → 6
- Pure track (no hardware needed): 3 → 4 → 5

They join at Phase 7, which depends on both. Phase 8 depends only on Phase 5 and may run alongside
Phases 6 and 7.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold, Licence and Pin | 5/5 | Complete   | 2026-09-02 |
| 2. Walking Skeleton | 5/5 | Complete | 2026-09-03 |
| 3. Vendor the Domain | 6/6 | Complete | 2026-09-02 |
| 4. First Experience | 9/9 | Complete | 2026-09-04 |
| 5. Tuning, Budgets and Shareable Links | 12/12 | Complete    | 2026-09-04 |
| 5.1. Catalog Browse | 11/11 | Complete    | 2026-09-05 |
| 6. Device Session | 14/14 | Complete (hardware rows A-F awaiting the user) | 2026-09-05 |
| 7. Install Flow | 13/13 | Complete (hardware rows A-G awaiting the user) | 2026-09-05 |
| 8. New Configurations | 8/8 | Complete    | 2026-09-04 |

## Requirement Coverage

All 50 v1 requirements map to exactly one phase.

| Phase | Requirements | Count |
|-------|--------------|-------|
| 1 | FOUND-03, FOUND-04 | 2 |
| 2 | FOUND-01 | 1 |
| 3 | FOUND-02, FOUND-05, PREV-06 | 3 |
| 4 | PREV-01, PREV-02, PREV-03, PREV-04, PREV-05, CAT-01, CAT-04, CONT-01, CONT-03, IDENT-01, IDENT-02 | 11 |
| 5 | TUNE-01, TUNE-02, TUNE-03, TUNE-04, TUNE-05, TUNE-06, TUNE-07, SHARE-01, SHARE-02, SHARE-03, SHARE-04, DEGR-01 | 12 |
| 5.1 | CAT-02, CAT-03 | 2 |
| 6 | CONN-01, CONN-02, CONN-03, CONN-04, CONN-05, CONN-06, CONN-07, CONN-08 | 8 |
| 7 | SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-06, SAFE-07, SAFE-08, SAFE-09, DEGR-02 | 10 |
| 8 | CONT-02 | 1 |
| **Total** | | **50** |

## Verification Note

Most of this roadmap is verifiable with no hardware attached: Phases 1, 3, 4, 5 and 8 need only a
browser, and Phase 7's failure paths are exercised against recorded protocol frames. Criteria marked
*(hardware)* can only be confirmed with a real ZONA plugged in, and the user performs that testing
personally. Web Serial itself is not automatable — no CDP domain, no fake-device hook — so those
criteria are a checklist for a human, not assertions a test suite can make.

---
*Roadmap created: 2026-09-02*
