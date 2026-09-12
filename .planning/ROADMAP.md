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
- [x] **Phase 9: Twenty Configurations** - The catalog goes from sixteen entries to thirty-six, each one useful to a named person in a named application (**all 10 of 10 plans complete as of 2026-09-07; awaiting phase verification** — the baselines and the host-surface gate, the browse literals and the copy gate, and all seven entry waves: HOLD, STEPS and SLAM, then KEYS, GRIDLOCK and TABLE, then CONSOLE, STRIP and LEARN, then LUMEN, STAGE and SHUTTLE, then CULL, FORGE and SWITCH, then SNAKE, ETCH and LIFE, then QUADRANT and POMODORO. **The slate is complete at thirty-six entries, twenty-seven of them hand-authored Lua, twenty authored in this phase and zero of source.kind "state".** The phase gate is green against a fresh production build — check 567/0/0, lint 0, build 36 images and 36 pages, quick 74 / 780 + 1 todo, sweep 4 / 19, e2e 89 at --workers 3, `git diff --stat HEAD -- src/vendor/` empty — and CONT-02, CONT-03 and TUNE-01 close. **The thirty-two-row hardware audition is presented to the user and unanswered; nothing about the twenty configurations is claimed as hardware-verified.**) (completed 2026-09-07)
- [ ] **Phase 10: Redesign** - The whole interface rebuilt around browsing by niche, a natural try/put-back/keep flow, a stylized colour picker and intelligent tuning, in the ZONA landing's CRT register (**sixteen plans in fifteen waves, all executed; the phase gate is green and its third task is a blocking human-verify checkpoint, unanswered** - quick 81 / 828, sweep 4 / 19, e2e 103, check 584 / 0 / 0, all measured against a fresh production build. `docs/INSTALL-RUNBOOK.md` row C's clear half needs a real ZONA and is the user's. Deployed to the gated preview at a17e926)
- [x] **Phase 11: Bench Corrections** - Every configuration the user tested on hardware behaves as asked, is removed, or is deferred on the record; the catalog stops depending on another project to change its own contents (**19 of 19 plans executed 2026-09-09 to 2026-09-10**; catalog 36 -> 29, nine preset + twenty Lua; quick 84 / 869, sweep 4 19, e2e 86 titles / 105 runs, check 582; three requirements amended by name. **The checkpoint was answered by a second bench round on 2026-09-10** (`BENCH-2026-09-10.txt`): GHOST and POMODORO confirmed; ARC's MIDI stop confirmed and its visual not; EUCLID, STEPS, LUMEN and MORPH reported unfixed on hardware after fixes the simulator measured as correct; three more removals asked for; and one scope decision - a finger-to-LED interaction framework - which is Phase 12. Deployed to the gated preview at 9d435db.) (completed 2026-09-10)
- [ ] **Phase 12: Touch Framework** - A finger-to-LED interaction framework that works on a real ZONA, as a Lua library in the module's system element that every hand-authored configuration calls; HANGAR learns to write, snapshot, restore and clear that element; the entries the second bench round reported unfixed are re-fitted; three more removals take the catalog to twenty-six (not yet planned)
- [ ] **Phase 13: GUI Overhaul** - A total overhaul into a straightforward, modern web app in two parts, Playground and Sandbox, plus My configs, built from the user's two source documents as the Bible; no rounded corners anywhere; Sandbox v1 installs to the ZONA; Grifter + Inter (not yet planned; depends on Phase 12)

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

### Phase 9: Twenty Configurations
**Goal**: The catalog stops being a demo of what a ZONA can look like and becomes a library of what a ZONA is for - twenty configurations, each one useful to a named person in a named application and worth watching on a card.
**Depends on**: Phase 8
**Requirements**: CONT-02
**Success Criteria** (what must be TRUE):
  1. Twenty new configurations are in the catalog, taking it from sixteen to thirty-six, each with its name, one-line description, feel-based tags and default state filled in, and each declared in all three places the catalog gates in both directions.
  2. Every new configuration fits both the 908-character Setup and Timer budgets at its defaults and at every corner of its knob cross-product, and every hand-authored one runs in a real Lua VM without error with a recorded golden frame set.
  3. No configuration in the phase depends on inbound host MIDI, on Grid Editor running, or on a capability the simulator cannot render; the clock-locked family stays deferred behind docs/MIDI-IN-PROBE.md.
  4. A call the Lua host does not register is refused by a gate before it can reach an entry, closing the gap where recipe-book code passes the static trap scanner and raises at runtime.
  5. The front-door ring is unchanged at eight entries, and the browse page, the catalog gates and the budget sweep stay green at thirty-six.
**Plans**: 10 plans in 10 waves — **10 of 10 complete**

Plans:
- [x] 09-01-PLAN.md — The five baselines, the host-surface gate that closes the trap-scanner gap, and the knob sweep out of the quick run (wave 1) — completed 2026-09-07; seven names measured on the clean tree at 34d0fd6 and reconciled against 07-13 with no discrepancy (BASE_FILES 73, BASE_TESTS 776 + 1 todo, both frozen; PREV_FILES 73, PREV_TESTS 775; BASE_SWEEP `3 13` -> `4 19`; BASE_E2E 89 frozen, PREV_E2E 89); HOST_GLOBALS and HOST_SELF_METHODS exported and iterated by registerGlobals; host-surface.spec.ts at 4 with findTraps accepting a gln body the classifier refuses, proved in one test; the seven shipped entries passing unedited; lua-entries.spec.ts renamed into the sweep project with vite.config.ts unedited. Commits 71d66c0, be7c004
- [x] 09-02-PLAN.md — The browse literals derived or recorded, the catalog copy gate, and an execution gate that counts a keystroke as output (wave 2) — completed 2026-09-07; PHASE_ADDED_AT fixed at 2026-09-07 for all twenty; one RECORDED block per browse spec (entries 16, tags 41, singletons 32, nine chips and counts; entries 16, featured 8) with every other count derived from LISTING and the predicate under test restated in the spec; NEWEST asserted as date blocks descending, proved by a third addedAt run in lockstep; the NAME order a property plus two witness pairs; copy.spec.ts new at 5 tests with KNOWN_TAGS at 41 gated both ways, the census table, and the aurora and ghost anchors protected; lua-smoke test 2 asking for MIDI or HID with the HID non-vacuity half marked for 09-06. Quick 74 / 780, sweep `4 19`, six negative checks. Commits b29257e, 6fdde66, c5f5701
- [x] 09-03-PLAN.md — HOLD, STEPS and SLAM: latching, a sweeping column, and velocity from position (wave 3) — completed 2026-09-07; three configurations in all three declarations with the front-door ring untouched at eight; HOLD Setup 696 / Timer 102 (706 / 102 at the all-longest corner, 202 free, 22 combinations), STEPS 388 / 251 (391 / 253, 27), SLAM 659 / no Timer (666, 242 free, 22); nineteen entries, 354 sweep combinations, test count unmoved. Four measured Rule 1 corrections: the decay rate derived as 256-252//ticks from a starting phase of 252 with lengths that divide 252, because a fixed 250 freezes a cell half lit at every length but 42; SLAM's bloom on layer 1 alone; HOLD's clear pass restoring the frame; glim clamping a row count that is 4 in a three-row zone. frames.json regenerated once and byte-identical on the second run, SLAM's motion corrected to static; chip row nine to fourteen with 05.1-UI-SPEC.md re-recorded; HARDWARE-AUDITION at fifteen rows with ROW_COUNT 15 and D-11 in row 13. Quick 74 / 780, sweep 4 19, four negative checks. Commits 1fc2d27, f5027fa, e95a1a0
- [x] 09-04-PLAN.md — KEYS, GRIDLOCK and TABLE: an in-key grid, eighty-one clips, and a drawn waveform (wave 4) — completed 2026-09-07; three configurations in all three declarations with the front-door ring untouched at eight; KEYS Setup 644 / no Timer (649 at the all-longest corner, 259 free, 22 combinations), GRIDLOCK 425 / no Timer (431, 477 free, 22), TABLE 529 / no Timer (536, 372 free, 18); twenty-two entries, 416 sweep combinations, test count unmoved. Five measured corrections: a `scale` knob's values are a display vocabulary, so the plan's decimal bit masks — correct, and 48 characters cheaper — were refused by knobs.lua.spec.ts and view.spec.ts and KEYS carries semitone lists instead; +y runs down, so the plan's note formula played lower as the hand went up; a row interval of 12 makes the plan's own range rule unsatisfiable; GRIDLOCK's ripple is a phase climb to the uint8 wrap with a per-cell derived timeout, because a monotone shape couples brightness to lifetime and any staggered decay collapses inward; and the row-in-the-velocity mapping is v*14+14 rather than v+1. TABLE's two plot forms were both measured and the plan's cost prediction was wrong. frames.json regenerated once and byte-identical on the second run, all three static with their quiet lines already in place; chip row fourteen to sixteen with 05.1-UI-SPEC.md re-recorded; HARDWARE-AUDITION at eighteen rows with ROW_COUNT 18 and a cost table of thirteen. Quick 74 / 780, sweep 4 19, two negative checks. Commits 749499c, 2a5c53b, e6ffbe8, a22653f
- [x] 09-05-PLAN.md — CONSOLE, STRIP and LEARN: nine strips with a mute, one fourteen-bit fader, and the mapping helper (wave 5) — completed 2026-09-07; three configurations in all three declarations with the front-door ring untouched at eight; CONSOLE Setup 785 / no Timer (789 at the all-longest corner, 119 free, 22 combinations), STRIP 638 / no Timer (646, 262 free, 22), LEARN 657 / no Timer (665, 243 free, 22); twenty-five entries, sixteen of them Lua, 482 sweep combinations, quick unmoved at 74 / 780; CONSOLE ships as plain controller messages and not as a Mackie surface, with the question written into deferred-items.md as item 1; three deviations, every one measured; the chip row moved by six to twenty-two and KNOWN_TAGS did not move at all; ROW_COUNT 21 with rows 19, 20 and 21
- [x] 09-06-PLAN.md — LUMEN, STAGE and SHUTTLE: a colour picker, a scene switcher and a shuttle, and the first cards HANGAR cannot show working (wave 6) — completed 2026-09-07; three configurations in all three declarations with the front-door ring untouched at eight; LUMEN Setup 604 / no Timer (608 at the all-longest corner, 300 free, 17 combinations), STAGE 505 / 109 (511 / 109, 397 free, 18), SHUTTLE 663 / 201 (663 / 201, 245 free, 26); twenty-eight entries, nineteen of them Lua, 543 sweep combinations, quick unmoved at 74 / 780 even though this is the first entry wave to edit a test file; lua-smoke.spec.ts test 2 now asserts the HID non-vacuity half 09-02 deferred, and passes on STAGE and SHUTTLE, the first two entries in the catalog that send no MIDI at all; eight deviations, every one measured — the plan's depth divisor negative at one knob value and black at another, LUMEN third rather than first in the lit-byte ranking, a shuttle whose speed survived the lift, a shuttle that did not move for up to 400 ms, a declared motion the fixture disagreed with and a pad rebuilt rather than a declaration bent, a half-lit arc, a keeper that wore pitfall 1's signature once the spin could reverse, and a Timer that would have snapped a breathe to black; every HID usage id verified against the USB HID Usage Tables Keyboard/Keypad page 0x07 and the table named; the chip row moved by one to twenty-three with hotkeys standing on arrival, and KNOWN_TAGS 47 to 51; ROW_COUNT 24 with rows 22, 23 and 24 and a cost table of nineteen; deferred item 2 recorded. A three-stage negative check, the third stage the only one that reaches the new assertion. Commits d7497e5, 07b2b8d, 967184b
- [x] 09-07-PLAN.md — CULL, FORGE and SWITCH: ratings by shape, a modal macro bank, and nine glyph blocks (wave 7) — completed 2026-09-07; three configurations in all three declarations with the front-door ring untouched at eight; CULL Setup 564 / no Timer (565 at the all-longest corner, 343 free, 17 combinations), FORGE 716 / 373 (722 / 377, 186 free, 22), SWITCH 487 / no Timer (488, 420 free, 18); thirty-one entries, twenty-two of them Lua, 600 sweep combinations, quick unmoved at 74 / 780; all three declared `static` and the fixture agreed with all three, the first entry wave of the phase that needed no motion correction — and FORGE needed none only because its watchdog Timer is armed by the held corner rather than by Setup, so `timerArmed` is false at rest; three measured Rule 1 corrections — the plan's flash lengths 12, 24, 42, 64 do not divide 252 and two of the four would have frozen a band part lit, the plan's bank-B keycode shift lands on the LANG and system usage ids above 130 at one base value and became a second modifier instead with 225 removed from `@MOD` to avoid a collision, and a watchdog armed in Setup would have declared a motion the pad does not have; CULL's five single-channel band patterns measured and distinct (511/511, 341/170, 146, 257/257, 16/16), SWITCH's nine glyphs distinct with a minimum pairwise difference of two lit cells; the pinned minifier respaces `&` and `^` and leaves `>>` alone, measured three ways, so both bit-masked entries store a shift and a modulo; every HID usage id verified against the USB HID Usage Tables Keyboard/Keypad page 0x07 and every `gks` arity checked per call shipped; the chip row moved by one to twenty-four with `macros` standing and `readable` taking the head at ten, and KNOWN_TAGS 51 to 53; `RECORDED.singletons` corrected as a TAG count, not an entry count; ROW_COUNT 27 with rows 25, 26 and 27 and a cost table of twenty-two; deferred item 3 recorded from a DELIBERATELY GREEN negative check — two of SWITCH's nine glyphs made identical and the whole quick suite still 74 / 780 once the fixture was re-taken. Commits c9ec8c9, 0b32565, ce21926
- [x] 09-08-PLAN.md — SNAKE, ETCH and LIFE: the three cards a visitor who owns no ZONA opens the site for (wave 8) — completed 2026-09-07; three configurations in all three declarations with the front-door ring untouched at eight; SNAKE Setup 581 / Timer 870 (581 / 872 at the all-longest corner, 36 free on the Timer, 22 combinations), ETCH 535 / no Timer (537, 371 free, 18), LIFE 435 / 674 (435 / 677, 231 free, 22); thirty-four entries, twenty-five of them Lua, 662 sweep combinations, quick unmoved at 74 / 780 + 1 todo; every declaration agreed with the fixture — SNAKE and LIFE `animated` with a Timer armed at every sampled tick, ETCH `dark` with ZERO non-zero bytes at all five and `RESTS_DARK_NOTE` verbatim as its quiet line, the catalog’s third dark card; four deviations — a single signed index step cannot torus-wrap a 9x9 grid because the row step is `step//9` and Lua floor-divides -1 to MINUS ONE, so a left-steered snake would have climbed a row every step (two signed fields instead); the plan’s SNAKE never dies, because nothing turns it and it circles one row forever, so a perpendicular-only greedy autopilot was added and the self-played game became five bites and a death every 6.5 seconds, identically, forever; LIFE’s living cells needed `glpfs(a,2,255,0,0)` rather than `glp`, because `glp` leaves the rate and a cell returning from the dying layer would keep 247 and fade straight back out; and the plan’s deferred item is numbered 3 where 09-07 already took 3, so it is item 4; THREE consecutive `frames.json` regenerations byte-identical, both determinism checks byte-identical at tick 1009 (SNAKE `fe9da6ce3a5b0378`, LIFE `1a777083c3952421`), LIFE’s busiest sampled generation exactly twelve messages against a literal six-birth cap and 168 of the 256-byte cycle buffer, and ETCH’s wipe measured firing on a jump strictly greater than the threshold at all four settings; the chip row moved by TWO to twenty-six with `game` and `still` both standing and `playable` retaking the head from `readable` on the name tiebreak at ten each, and KNOWN_TAGS 53 to 55; ROW_COUNT 30 with rows 28, 29 and 30 and a cost table of twenty-five; deferred item 4 recorded; both negative checks observed red and restored; `static/og/` 198,152 bytes over 34 PNGs with ETCH’s the smallest at 4,192 and correctly black. Commits 5020956, a8964c2, 49c1479
- [x] 09-09-PLAN.md — QUADRANT and POMODORO: four large targets and a draining ring, and the twentieth entry lands (wave 9) — completed 2026-09-07; two configurations in all three declarations with the front-door ring untouched at eight, so the partition at thirty-six is 8 + 28; QUADRANT Setup 835 / no Timer (838 at the all-longest corner, 70 free, 17 combinations — the largest Setup and the least headroom in the catalog), POMODORO 733 / 647 (735 / 649, 173 free on the worse event, 22 combinations); thirty-six entries, twenty-seven of them Lua, 701 sweep combinations, quick unmoved at 74 / 780 + 1 todo; **QUADRANT's accessibility claim was measured rather than asserted** — the tick-0 frame reduced to max(r,g,b) gives four distinct patterns at 16 / 8 / 12 / 4 lit cells from a four-entry sixteen-bit mask table, at BOTH fills-on positions, and the finding inside the measurement is that hue separation is not luminance separation: on the palette named "high contrast" chartreuse and cyan sit at 1.02:1 and are the same colour on one channel, so the fill is the only thing telling those two apart; eighteen scripted taps along the dead cross produced ZERO MIDI messages and four different cells inside one quadrant produced note 48 four times; **POMODORO is the phase's only instance of the 655 second glt ceiling** and was run for 160,020 ticks outside every gate — 0 errors, the centre cell still at rate 1 and timeout 49,979 at the end, frames twenty ticks apart still differing, and exactly two MIDI messages over the whole run, one alarm, once; its ring is 32 lit at tick 37 and 31 at tick 1009, and 400 s of paused time moved it by zero cells; two deviations, both Rule 1 and both found by suites the plan's own verify blocks do not name — POMODORO produced no output at all inside lua-smoke's 218-tick window because its only note is twenty-five minutes away, so every tap now sends a transport note an octave below the alarm, and QUADRANT's twelve-number palette cannot be a kind "colour" knob because widgetFor's swatch row needs one RGB triple per value and knobs.lua.spec.ts makes the fall-through a hard failure, so it ships kind "mode" and the loss is deferred item 5; the phase-wide sweep over the finished LISTING found 19 non-animated entries every one carrying a non-empty single-line quiet sentence, four restsBlack entries all carrying RESTS_DARK_NOTE byte-for-byte, 36 distinct descriptions all inside the 110 cap, correct tag counts everywhere and ZERO disagreements between a declared motion or restsBlack and the fixture; the chip row moved by two to twenty-eight with `accessible` and `calm` both standing and `readable` retaking the head from `playable` at eleven against ten, and KNOWN_TAGS unmoved at 55 — the first entry wave of the phase to coin no tag; ROW_COUNT 32 with rows 31 and 32 and a cost table of twenty-seven, which is every hand-authored configuration in the catalog; the partition negative check observed red at exit 1 naming the missing id and restored byte-identical; **the full e2e suite re-measured in both projects at --workers 3: 89 passed, BASE_E2E + 0 across the whole phase**, with twenty new prerendered pages under it; `static/og/` 210,926 bytes over 36 PNGs with POMODORO's the largest at 6,562 and 74 of 81 cells lit. Commits edde82d, f84d446, 187ce58
- [x] 09-10-PLAN.md — The measured cost of thirty-six, the audition as one document, the phase gate and the hardware checkpoint (wave 10) — completed 2026-09-07; **everything `.planning/research/CATALOG-SURFACE.md` section 4 projected at thirty-six entries is now a number somebody measured**, on this machine at `36a1965`, written into `docs/TESTING.md` beside the projection it replaces — six of sixteen rows within ten per cent and four not: `npm run build` **did not grow at all** (12.08 s against 12 s at sixteen, because `gen-og` was never the critical path), the sweep is **701 combinations over twenty-seven entries and 1,402 measured events rather than the projected ~1,090** (all seven Phase 8 entries carry a sixteen-value MIDI-channel knob — 112 of their 283 combinations in one knob — and none of the twenty does; the widest knob in any of them has five values), and `frames.spec.ts` and `lua-smoke.spec.ts` came in 43-46 % under. **Both `.wasm` assets are byte-identical at thirty-six** — glue 271,581 and lua_fmt_bg 628,148 — so twenty more Lua entries cost exactly zero bytes of WebAssembly; browse HTML 61,673 B (+7 % over projection), listing chunk 11,008 B, `static/og/` 292 KB over 36 PNGs, `frames.json` 33,553 B. **Thirty-six canvases mount and FOUR are on screen at 1280x720**, not the projected 8-12, and the repository already held the same reading at sixteen entries (4 of 16, Phase 5.1 gate): two independent readings twenty entries apart are the evidence that the catalog changes only the mounted count, which is what the `BrowseGrid.svelte` ceiling comment now says instead of an estimate. The phase's frozen and rolling baselines **meet**: quick `BASE_FILES 73 + 1` / `BASE_TESTS 776 + 4`, sweep `3 13` -> `4 19`, e2e 89 unchanged, with the chain `776 − 1 + 5 + 0×7 = 780` written out so 09-02's `BASE_TESTS + 5` and this plan's `+ 4` are both readable as right; not one of the five count-moving changes is a configuration. **Three load-sensitive tests found by running the commands and fixed without sampling or trimming anything** (D-08 / D-10's rule): `og/build.spec.ts` built a `${r},${g},${b}` string **per pixel** over 27.2 million pixels and timed out twice at 0.37-0.47 GB free — three numeric comparisons over the same pixels took it from 4.27 s to 0.56 s; `lua-entries.sweep.spec.ts` test 6 had one second of headroom against Vitest's 5,000 ms default and took the explicit `600000` its sibling `reachability.sweep.spec.ts:254` already carries; `queue.spec.ts` waited a fixed 5 ms for a write at three sites and now polls the condition behind a 2,000 ms deadline. Counts unmoved at 5, 6 and 8, and `npm run test:unit -- --run` is green again at 78 / 799, exactly quick plus sweep. The two non-vacuity floors rose **16 -> 36 as literals** with a comment saying a comparison against `ROUTED.length` would be a tautology, and the negative check at 37 was observed red at exit 1 naming 36. `05.1-UI-SPEC.md`: the chip row **confirmed byte-identical** against `chipTags(LISTING)` at twenty-eight chips, and **six more stale quoted facts corrected in the same pass** — 41/16/32 -> 55/36/27, `restsBlack` three names -> four with ETCH, three result-line copy examples, W-16 and W-19 — because leaving five true sentences beside one corrected one is worse than leaving the section alone; the sixteen-row tag table left at sixteen deliberately, as the document itself says. `docs/HARDWARE-AUDITION.md` now reads as one document: a section above the checklist naming **the six rows where a green test is not evidence**, split into the latch-and-time family (13, 19, 26, 32 — the simulator *deliberately* does not reproduce firmware's dropped-release bug) and the keystroke family (23, 24 — `gks` is recorded and inert), with the difference stated; `ROW_COUNT` still 32, `audition.spec.ts` 4 passed, the cost table's twenty-seven checked against `CATALOG` by script, `AUDITION_DUMP=1` writing 27 Setup and 14 Timer files with every count matching the table. `deferred-items.md` at **eight** items, the three new ones being `kind: "state"` preferred and used zero times with both halves, `planLayers` never running for a `lua` entry, and a spec's cost growing with the catalog with no gate to notice. The e2e run needed four attempts and the three red ones are recorded rather than glossed — every failing title on the WASM-heavy tune-panel path, the machine at 0.28-0.5 GB free under the user's own applications, and `git diff` over `src/lib/ui`, `src/routes`, `src/lib/tune` and `src/lib/sim` since the last green run printing nothing. **The audition is presented to the user and unanswered; no agent in this phase opened a serial port, wrote to a device or deployed.** Commits aac1cc6, 9b95573

### Phase 10: Redesign
**Goal**: HANGAR stops looking like a well-behaved documentation site and starts looking like the ZONA landing - CRT and glitch, Grifter headlines and Inter upright - with a browse experience built for thirty-six configurations, a device flow that reads as one sequence, and tuning that is a pleasure rather than a rack of sliders.
**Depends on**: Phase 9
**Requirements**: IDENT-01, IDENT-02, SAFE-01, SAFE-02, SAFE-03, SAFE-05, SAFE-07, PREV-03, CONN-03, CAT-02, CAT-03, CAT-04, CONT-03, TUNE-01, TUNE-02, TUNE-04, TUNE-05, SHARE-01, SHARE-03, DEGR-02 — **twenty, filled 2026-09-09 by plan 10-14**, and none of them is new. Every one was closed by an earlier phase and is **extended, amended or explicitly recorded-as-untouched** here; each carries a qualifier in REQUIREMENTS.md saying what was proved and what was not. SAFE-04 rides with SAFE-03 in that qualifier and keeps its Phase 7 wire-unproven half. **SAFE-05 is the one that says less than the approved spec promised**: §4 read "Extended - CLEAR's confirmation names what is removed", A-45 removed the confirmation, and the honest record is that SAFE-05 stands exactly as Phase 7 closed it.
**Success Criteria** (what must be TRUE):
  1. The impeccable design skill is installed and the redesign is authored through it; Grifter carries headlines and Inter carries body text, with the licence question resolved and discharged into THIRD-PARTY.md. **AMENDED BY NAME, 2026-09-09, plan 10-14: "Inter Italic" is now "Inter".** D-12 withdrew the italic on 2026-09-08 and the Goal line above was corrected the same day at commit `0c8a18d`; this criterion was missed in that pass and carried the withdrawn face for a further eleven plans. Recorded as an amendment rather than a silent edit, and recorded as a defect in 10-14's own instruction, which said the surviving occurrence was in the Goal line: it was not, and grepping found it here.
  2. A visitor can choose a configuration immediately from the front door and can also browse thirty-six by niche and workflow, both paths first-class.
  3. TRY ON DEVICE, PUT BACK and KEEP ON DEVICE read as one sequence, and a fourth control - CLEAR - removes the current page's configuration from the module under every Phase 7 safety rail, with its own confirmation and its own bench row.
  4. Tuning is playful and legible, colour is chosen from a stylized RGB picker, and at least one tuning idea is something no configuration editor does today.
  5. The explanatory paragraphs the brief names are gone, each by a named amendment with its spec rewritten rather than deleted and its sizing reservation re-measured - and whatever SAFE-01 becomes is stated out loud rather than dropped silently.
  6. The CRT and glitch treatment has a reduced-motion escape hatch asserted in both browser projects, and the accent palette still governs the chrome even though the picker can produce any colour for the pad.
**Plans**: **16 plans in 15 waves — 16 of 16 complete**. Fourteen integers plus two decimal inserts at wave 14: **10-13.1** (D-17, 2026-09-08) and **10-13.2** (D-22, 2026-09-09), both in 05.1's precedent so nothing renumbers. D-17 moved 10-14 to wave 15 and moved no other line of it; D-22 moved no line of it at all. This line read `TBD` until `0c8a18d`, then `14 plans in 14 waves`, and is filled at sixteen by plan 10-14.
- [x] 10-01-PLAN.md — Wave 0: the eleven-name block, the font specifier and CH_PER_LINE (wave 1) — completed 2026-09-08; the three things the phase rested on are numbers rather than assumptions. CH_PER_LINE is **43**, not the provisional 46, measured as the minimum full-line-box occupancy over thirty-six full lines in both engines — and the premise behind 46 is refuted rather than missed: Inter is 2.35 per cent WIDER than Quicksand at 16px (673.39px against 657.95px on the 86-character CLEAR line), takes more line boxes on two of twenty-eight Body sentences and fewer on none. All five §12.2 reservations survive intact; only HONESTY_CAP moves, 129 → 86, and two shipped literals must shorten by four characters each (HONESTY_READY and tryOnBudgetReason's worst form), while CLEAR_LINE sits exactly on its 86 cap. FONT_SRC is §5.1 candidate (b), proved at the probe route's depth AND at src/app.css's by a perturbation reverted byte-identical: 200, font/woff2, 48,256 bytes, and the un-fingerprinted path 404s. BASE_SWEEP_WALL is 123 s at 4 19, taken before 10-08 grows the sweep by a third. Two gates landed — font-assets.spec.ts (5) over `git ls-files`, and aesthetic.spec.ts scan 4 (1) matching on rightmost compound and property name so Coverflow.svelte:1013 stays legal — with three negative checks observed red and both files restored byte-identical. Inter installed as a production dependency rather than -D, because /dev/type/ ships in the artefact and the licence gate runs --production. Quick 74 / 780 → 76 / 786, sweep 4 19, e2e 89 unchanged, src/app.css byte-unchanged. Commits 5e1e72c, 4fbe5e5
- [x] 10-02-PLAN.md — Wave 2: the type settlement (wave 2) — completed 2026-09-08; two `@font-face` blocks in `src/app.css`, Inter Variable at the specifier 10-01 proved and one static Grifter Bold reached only through `--font-display`, so the D-14 licence answer changing is a two-line edit that `identity.spec.ts` test 7 asserts. Quicksand uninstalled with its licence text and its hand-written paragraph in one commit; the source archive checked from BOTH sides, the exclusion and the note, on real listings. `--crt-scanline` at `:root` outside `@theme`, waiting for 10-04 to reference it. One hole left open and observed rather than argued: a colour authored inside a component `<style>` is invisible to every gate the site has, so 10-04 must close it. Quick 76 / 786 → 76 / 787, e2e 89, check 571. Commits 86f89e7, 7fdeb7d, 209c236
- [x] 10-03-PLAN.md — Wave 3: nine retirements and five reservations (wave 3) — completed 2026-09-08; **618 characters of prose gone from the site**, every count taken by script before and after. R-01 headline 30 → 32 in the Micro role with its case exception declared, R-02 `PICKER_EXPLAINER` 130 and its component retired, R-03 `SAFE_PROMISE` 88 retired, R-04 `FIDELITY_LINE` 231 → 44 (PREV-03's claim kept whole, its apology gone), R-05 106 → 70, R-06 104 → 85, R-07 `SHARE_QUIET_LINE` 68 retired, R-08 `RECONNECT_OFFER` 88 → 37, R-09 `KEPT` body 2 124 → 53. **SAFE-01 ships as form 1**: `SAFE_NOTE`, 35 characters on the control that would do the writing, unconditional and in EVERY state on both surfaces that carry the primary — more places than the paragraph reached. **Two literals were authored at 90 against a cap the measurement moved to 86 and both were SHORTENED, not the cap raised**, with `HONESTY_READY`'s amendment asserted from both sides. The five reservations are `ceil(longest / 43) × 24` substituted rather than adjusted: header note **152px → 24px**, honesty slot 72px → 48px, PUT BACK 72px and KEEP 48px unchanged under a new face, meters 56px shown to hold because not one term of its arithmetic is a character count. PUT BACK's headroom is **28 characters** and the cap IS the line boundary. Negative check 3 came back red where the plan predicted green, so it was run a second way — with the assertion removed the whole quick suite is green while a retired string sits re-exported, which is the finding. `REQUIREMENTS.md` amended by name and dated on SAFE-01, CONN-03 and PREV-03. Zero test counts moved: quick 76 / 787 in and out, e2e 89, check 571 → 570. Commits be1465f, cc3b117, f074d0a
- [x] 10-04-PLAN.md — Wave 4: the CRT and glitch treatment (wave 4) — completed 2026-09-08; **four layers behind one attribute on `<html>`, and none of them can reach a word.** G the page ground (`body::before`), S scanlines and an `feTurbulence` tile on pad frames, R one roll bar for the whole page inside a new `.crt-band` shell authored in `FrontDoor.svelte` because `Coverflow.svelte` may not be edited — and is not, byte for byte, across all three commits — and T the tear on `.crt-band::after`, seven `step-end` states over 180 ms of `clip-path` and `translateX`, on `navigator.serial`'s `connect` and no other event, with **zero** `filter:` in the file. **10-02's open hole is closed and observed:** moving `--crt-scanline` into a component now turns `aesthetic.spec.ts` scan 1 red by name while `identity.spec.ts` still passes 7 — the pair `10-VALIDATION:486` predicts. Scan 1 as §8.7 words it would NOT have caught it, so it also holds §7.1's placement rule with `--crt-noise` as the one exception asserted from both sides. **Two cost claims re-measured, one false.** Layer S on thirty-six browse frames: chromium 0.00 ms at p95, webkit-phone **61 ms** against a 2 ms threshold, so §8.5's declared fallback applies and Layer S is the front door's seven frames only — gated in the browser, not merely recorded. Layer G, which §8.5 calls zero by construction, cost **105 ms per scrolled frame** through a 26vmax inset blur; the vignette is a gradient now, 196 ms → 101 against a 78 ms floor. **The noise tile's home was decided by running the gate:** `identity.spec.ts` is green with the tile in `app.css` and green again with a pure red hidden inside it, because a percent-encoded hue is no hex at all — so the tile lives in the component and scan 6 holds it. `SCREEN: TEXTURED · FLAT` in the footer on every route, both 44px axes, guarded store at `hangar.screen.v1`. `aesthetic.spec.ts` 1 → **7**; `e2e/aesthetic.e2e.ts` new, four titles in both projects, each opening the two gates that would otherwise make it pass on nothing. Six negative checks, six red, every file restored byte-identically by sha256. Quick 76 / 787 → 76 / **793**, e2e 89 → **97**, check 570 → 571. Commits ec12c5c, 755b83c, cec5f49
- [x] 10-05-PLAN.md — Wave 5: D-09, no card rests dark (wave 5) — completed 2026-09-08; **three of the four dark configurations are given a finger, not a light, and the fourth cannot be lit by anything.** `src/lib/sim/demo.ts` holds the `DemoPath` type, a tick-locked pure driver that queues into the EXISTING `TouchSampler` at the EXISTING one-sample-per-contact-per-tick rate, and three authored gestures — GHOST 18 samples over 600 ticks, MORPH 26 over 360, ETCH 26 over 420 — which light **14, 19 and 5** cells where `frames.json` records zero at all five sampled ticks. Motion is never faked: HANGAR supplies the gesture and the firmware supplies every pixel, and no configuration, Lua source, character budget or frame hash was touched. **Trackpad gets no path because it can have none** — its draft sets `look.kind` and `touch.kind` to `none` and disables both, so it lights 0 of 81 under a drag, a two-finger scroll, taps and 2,000 idle ticks; `DARK_BY_CONSTRUCTION` records the measurement and the card keeps a sentence of its own. Four host changes, each with a test: delivery for demo entries, a widened `active()` (with a third term the spec did not ask for, because the one it names stops the loop between two gestures and nothing but a tick can restart it), **one `TouchSampler` per demo entry** — measured on a shared sampler at three of the visitor's five fingers accepted and ZERO delivered to the hero — and `stillFrame()`'s second branch. R-10 retires `RESTS_DARK_NOTE` for `DEMO_TOUCH_NOTE`, `restsBlack` survives with a second job asserted in both directions, and `gen-og.mjs`'s non-dark gate loses its `restsBlack` exemption by name: ETCH's 4,192-byte black square is now **4,737 bytes**, `static/og/` 210,926 → **213,919** over 36 files, byte-identical across two builds. 77 files / 798 tests, 97 e2e unchanged, sweep `4 19`, `Coverflow.svelte` byte-untouched.
- [x] 10-06-PLAN.md — Wave 6: D-10, the tag vocabulary re-cut (wave 6) — completed 2026-09-08; **fifty-five tags become sixteen in two declared facets, exactly three per entry, and the twenty-seven singletons go to zero by construction.** `src/lib/browse/facets.ts` declares ten `FOR` terms (what you would reach for it to do) and six `FEELS`, with OR within a facet and AND across — required rather than conventional, because `FOR` gives every entry exactly one term and a second chip under pure AND would always return zero. A term earns a chip because it is a facet member, not because two entries happen to carry it, so the row cannot drift as the catalog grows. The module imports NOTHING, not even an erased type, which keeps the sixteen terms in `/browse/`'s prerendered HTML at first paint. The re-cut landed in twenty-eight source files as well as `listing.ts` — proved by reverting one entry file and watching the both-directions equality name it — and `LEGACY_TAG_MAP` declares a destination for all fifty-five old terms, twenty-two mapped and thirty-three explicitly nowhere, with no singleton folded into a chip its author never saw. `05.1-UI-SPEC.md` carries three dated amendments including the correction that `MORE TAGS`, named there in nine places, was never built.
- [x] 10-07-PLAN.md — Wave 7: sixteen chips in two rows, two sorts and one URL migration (wave 7) — completed 2026-09-08; **the vocabulary 10-06 declared is now on the screen, and the assertion that proves it INVERTED rather than passed.** `BrowseToolbar`'s count-derived tag row and the outsider chip retire together for two `FacetRow.svelte` rows — `role="group"`, `aria-labelledby` derived from the facet's name, 44px on both axes per member — and `browse.e2e.ts`'s shipped block, which pressed `playable` then `generative` and asserted their INTERSECTION was smaller than either, is now false by 21 against 13: restoring it goes red with *"Expected < 13, Received 21"*, which proves both words landed in `FEELS` rather than merely that the new assertion passes. D-11 retires the Newest sort, `newestOrder`, `orderFor`'s middle branch and `addedAt`'s browse projection with no entry file touched. A-20 / G-10: `?for=` and `?feels=` are the written address, `?tag=` is read-only for one release, and the ruling has FOUR cases — a value ABSENT from `LEGACY_TAG_MAP` is dropped under W-12 unamended, which is what stops a third party's stray `tag` parameter filtering the shelf — with the address canonicalised once on arrival through the existing 500 ms timer. A-22 puts ten static `<a href="./browse/?for=…">` in the prerendered front door with `front-door.ts` still declaring zero specifiers. **One negative check did not fire and is reported as a finding:** `e2e/` sits outside every type gate this repository runs, proved by `npm run check` staying at 576 with a retired sort restored and by `npx tsc` over the same file naming it. 78 files / 801 tests (+0 / −1), 97 e2e (+0), check 576 (+1). Commits aba34b0, f178f20, ef1c229
- [x] 10-08-PLAN.md — Wave 8: the 4,096-colour lattice and the two-pass sweep (wave 8) — completed 2026-09-08; **D-06's colour knob is the whole reachable RGB444 lattice, and the sweep that makes it affordable got a third bigger while the wall clock got smaller.** `colourKnob` stops building an options array from the card's own colour plus a five-member palette and describes 4,096 positions, with `read()` and `apply()` as index ↔ RGB444 arithmetic through the vendored `quantiseColour` — so `read(apply(state, i)) === i` holds by construction rather than by an array happening to contain what was written. G-07 splits the reachability sweep into Pass A (every non-colour knob, colour pinned) and Pass B (the colour dimension, linear), and **the honest total RISES — 19,502 + 24,576 = 44,078 against 32,852, +34%** — recorded as a rise rather than the fall the spec's first pass predicted. **Pass B runs FIRST and MEASURES the pin, and the assumption was wrong five times out of six:** the dearest lattice literal is `102,102,102` (position 1,638, the first index whose three channels are all three digits — every nine-digit literal ties) on aurora, pinwheel, starfield, radar and joystick, and `255,255,255` only on `ninepads`, whose checkerboard emits a dimmed second copy. With the pin measured all nine worst-cost figures reproduce §11.4 exactly; pinned at the old palette's dearest, aurora and radar each read one character high. A-11 corrected in the suite: `tpad` is 907 of 908 and **has no colour knob**, `ninepads` at 640 of 908 leaves **268** free and that margin is an EQUALITY so it cannot shrink quietly, zero of Pass B's 24,576 states cross the wall and the picker's disabled set is asserted **empty**. SHARE-01/03: format `w` carries twelve raw bits per colour knob and is emitted for the 25 colour-bearing Lua entries while `cull` and `quadrant` keep emitting `x`; `wild-stamps.json` — 54 format `x` literals from the unmodified encoder — was committed **alone, one commit before `w` existed**, and the test asserts both that every captured literal still lands `restored` and that 25 entries now emit a different format, which is what makes it evidence rather than a tautology. `STAMP_OPTION_CEILING` stays 32, exempt BY FORMAT; raising it was measured breaking exactly two assertions and both are the value pin itself. The other two sweeps: stamp-roundtrip 44,078 and 276,160 → **234,784** (−15%, and the shrink is asserted), `lua-entries` 701 → **1,728** combinations on a length-complete 27-literal sample. 78 files / 801 tests (+0 / +0), 97 e2e (+0), check 577 (+1), sweep `4 19` unchanged at 119 s against `BASE_SWEEP_WALL` 123 s. Commits 5ab3e73, b3f99bb, 4924ee7, b31f292
- [x] 10-09-PLAN.md — Wave 9: knob locks and the budget as a live forecast (wave 9) — completed 2026-09-08; **two tuning ideas the survey could not find in any product in the category, and the one that arrived already written was the one that was broken.** Task 1 was inherited as **545 uncommitted lines** from a session killed mid-plan: green on `check`, on `lint` and on 802 quick tests, and **red on the phone project** — the lock's column had turned the knob row into a three-column grid, and a grid track's automatic minimum size is its content's min-content width, so the options row refused to wrap and pushed `knob-rack` to **scrollWidth 267 against clientWidth 245**, breaching the tuning region's outright prohibition on horizontal scroll in the one gate task 1's own verify block does not run. Every flexible track is `minmax(0, 1fr)` now, in four places, with the measurement beside the rule; **20 of 20**. **TUNE-04:** a 44px both-axes `HOLD` / `HELD` toggle per row with the state in the **accessible name**, and a second channel that spends no colour — the default marker moves from a 2px `--color-line-soft` dot at the default to a 2px `--color-line` bar spanning the selected option. The **accent census is 14 before and 14 after** and is now an assertion with all eight reserved entries quoted in its failure message. `surpriseIndices` takes the held set, the twelve-draw bound and the no-op rejection unchanged in code and only the domain shrinking — so holding all but one knob makes the **twelve-draw exhaustion reachable for the first time**, driven by a test that observes exactly **12 draws, 0 offered to the compiler** and says in its own comment why it could not have been written last week. With every knob held `SURPRISE ME` is a real `disabled` button with a **53**-character reason, because a button that appears to do nothing is worse. SHARE-01 untouched and proved: a held rack's stamp is byte-identical to an unheld one, measured off a **non-default** vector. **TUNE-02:** hovering or focusing an option shows what it would cost before it is chosen — a ghost band in both meters and a signed `--font-mono` delta beside the option. **`cost()` only, never `fit()`**, and the guard is the assertion that has held `fitState` to one call site since Phase 5: the negative check that called the fitter from the forecast went red **there**, and the debounce test did **not** blow its budget, so which guard caught it is a measurement rather than a guess. Memoised on the index vector, so a **hit publishes on a microtask** and only a miss waits out the same `COMPILE_DEBOUNCE_MS` a recompile waits — no second timing constant. The ghost is **three bands in one span and one token**, so a forecast above reads as the extra and one below reads as a notch cut out of a fill that genuinely stops short, with no direction branch to paint them differently. `transition: none` on the ghost and on the fill while a forecast shows. **Never on touch, gated twice** because the two gates fail differently: `pointerType === "touch"` per event and `@media (hover: hover)` for the paint, with `:focus-visible` asked of the element itself as the keyboard half. The fifth `--font-mono` use (**4 → 5**) carries W-03's own reason beside it, and **U+2212** is the fifth permitted typographic character, scoped to `forecastDelta` and asserted to appear **exactly once** in the comment-stripped code of all of `src/`; `--color-over` is still **exactly three** uses and the fourth is deliberately not taken. One gap counted rather than claimed: the forecast is offered on **option rows only**, because a rail has no candidate element to hover and no keyboard candidate at all — five of the twelve knob kinds are rails unconditionally — and 10-10's picker is the pointer-to-detent mapping that closes it. 78 files / 804 tests (+0 / **+3**, `surprise.spec.ts` +1 in task 1 and `tune-ui.spec.ts` +2 in task 2, leaving it at **7**), 97 e2e (+0), check 577 (+0), sweep `4 19` **not re-run** because no sweep file imports anything this plan touched. Commits 5316436, 5d3d2a6, 46c3f19
- [x] 10-10-PLAN.md — Wave 10: the stylized RGB picker (wave 10) — completed 2026-09-08; **colour is chosen from three sixteen-detent rails over the hardware's own 4,096-colour lattice, one picker per panel however many colour knobs an entry declares, and every filled pixel inside it is a flat fill of an exact stored RGB444 value.** A-09's six forbidden shapes are named in one source scan with `rgb()` carved out to the detents and the result; the unaffordable guard is proved on a synthetic one character from the wall and measured at **ZERO** on the shelf, with 10-08's 268-character margin in the failure message. The two-swatch window is gone and cannot come back. Tasks 1 and 2 arrived **committed from an interrupted session** and were reconciled against the gates rather than trusted: check, lint and quick were green and `npx playwright test e2e/tuning*` failed **3 of 20** — two measured narrow-width breaches and one e2e helper the picker had quietly invalidated. All three fixed forward. 79 files / 810 tests (+1 / +6), 97 e2e (+0), check 579 (+2), sweep `4 19` unmoved. Commits 5305fdc, e08f18c, 748ccae, 4eca063, 06796dd, 6c61ee5
- [x] 10-11-PLAN.md — Wave 11: MIX TWO (wave 11) — completed 2026-09-08; **two candidates, four results, one button, and the whole of the arithmetic is fifty lines in `src/lib/tune/mix.ts` where a seeded property test can reach it** — 9,000 runs over all 36 entries with knobs, 36,000 results, and not one index outside a knob's own options, not one held knob crossed, not one result with two redrawn positions. The sweep proves the same thing from the other end, reproducing 10-08's four totals exactly (19,502 / 24,576 / 44,078 / 234,784, over budget 0). The two candidates are **text**, deliberately, because two more canvases would be eight and `THIS ONE` is already running as the hero six centimetres up the same panel. A-15's forbidden-vocabulary scan had to be re-cut: the first spelling matched whole words and stayed **green** on a planted `Breeds`. 80 files / 814 tests (+1 / +4), 97 e2e (+0), check 582 (+3), sweep `4 19` unmoved at 92 s. Commits e71782b, d9ca8fc, d0a7d4e, 4fc84db
- [x] 10-12-PLAN.md — Wave 12: CLEAR, the machine and the copy (wave 12) — completed 2026-09-09; **a fourth write click that writes the firmware's own `defaultConfig` — Setup 641, Timer 22, read from the pinned package by event number — into RAM only, is called done only from two ACKs, refuses to run without a snapshot, and widened the never-writes proof on four fronts without denting it.** D-19 to D-21 rewrote this plan and 10-13 in place without renumbering either: A-48 made the payload a **protocol fact rather than copy**, so `constants.spec.ts` gained the two lengths and their canonicity under the pinned minifier, and the phase's own delta term moved from +3 to +5 and was named rather than absorbed. `WRITE_CLICKS` replaces the word "three" with a four-member `as const` asserted equal to the four control labels; `install.spec.ts` test 4 counts **by class**, so CLEAR's `CONFIG/EXECUTE` was already inside the count and needed no widening. Eight needles became ten, and eight had already been stale at nine since Phase 7. 80 files / 819 tests (+0 / +5), e2e not run (10-13's walk), check 582 (+0 — the plan said 583). Commits eb4836f, 0ca5e25, d931344, db0a266
- [x] 10-13-PLAN.md — Wave 13: CLEAR, part two — one control, one block, one browser walk (wave 13) — completed 2026-09-09; **a fourth write click that is Quiet-tier, shapeless and indistinguishable from `KEEP ON DEVICE` at rest — separated from it by three channels, two of which are behaviour — walked end to end in two engines against the fake, with the confirmation that was cut proved absent in node and in the browser.** A-45 dropped the confirmation because `PUT BACK` and a power cycle each undo a clear, and A-51 folded the hardware check into runbook **row C** rather than adding a row H, so the runbook is still seven rows. SAFE-02's two install weights turned from an assumption into a site-wide count. **One finding worth more than the plan:** a 44px both-axes accessibility walk **passed having read nothing** when a component was dropped from its hand-declared list, and only the separate length assertion caught it — `DEVICE_COMPONENTS` is seven and asserted at seven. 80 files / 821 tests (+0 / +2), 97 → **101** e2e (+4), check 583 (+1). Commits 7a6f771, e2a0005, 1670aba, 38fa78d
- [x] 10-13.1-PLAN.md — Wave 14 (INSERTED by D-17): the aesthetic pass, the instrument register made visible (wave 14) — completed 2026-09-09; **one `.pill` replacing eleven copies of a shape across nine files, a gradient-and-mask registration lattice on exactly two surface roots, `START EXPLORING` in place of a headline whose comment still defended a retired exception, and the seventh `--font-mono` use argued out loud rather than assumed.** Inserted as a decimal in 05.1's precedent so nothing renumbers; 10-14 moved to wave 15 and no other line of it moved. **The second halftone density was measured and REFUSED**: 12.00 ms at p95 on webkit-phone against a declared 2 ms threshold, six times over, with chromium at 0.00 ms in both arms — `DENSITIES` is 1 and scan 4 asserts it against the named constant, so the fallback is a state the tree is checked against rather than a silence. **And the lattice shipped once painting nothing at all with every source scan green**: two screenshots of `/browse/` came back byte-identical at 8,492 bytes, because without a stacking context a negative-`z-index` pseudo-element paints under `body`'s own background. `isolation: isolate` is the fix and is now asserted by name. Three places D-15/D-16/D-17 disagree with something already shipped are recorded rather than reconciled — chiefly that the register line is a line of **authorship**, not of DOM containment, which the plan's own task 2 would have been illegal under. 81 files / 826 tests (+1 / +5), 101 e2e (+0, proved by `grep -c "test("` before and after), check 584 (+1). Commits 03aa156, da34308, e1260c7, 60b01c6
- [x] 10-13.2-PLAN.md — Wave 14 (INSERTED by D-22): the aesthetic pass, corrected (wave 14) — completed 2026-09-09; **the lattice became a GROUND so its marks keep to the surround, and an unlit pad cell became legible** — two defects against the brief's own words, fixed by moving where an existing field paints and how an existing layer draws, and **both proved in a browser because a source scan is structurally blind to paint order**. Measured before anything changed: **418** text-bearing elements on `/browse/` sat under the field with no opaque ancestor between them and it, and crosses landed on the wordmark, on every knob readout and on every card description. The fix is `.lattice > :where(*) { background-color: var(--color-ground) }` — four declarations across four files, no new node — where `:where()` is load-bearing at 0,1,0 so any component's own scoped rule outranks it for free, and the rule is declared **above** `.pill` because at equal specificity source order decides. `PadFrame.svelte`'s header had carried half a diagnosis since Phase 4: the dots were there and Trackpad was still a black square, because cell **structure** is drawn by Layer 3 in `--color-ground` and a black grid divides nothing when the cells behind it are also black. **`color-mix()` earned its `@webkit` tag during execution**: it serialises as `color(srgb …)` in both engines and never as `rgba()`, and the first version of the test read a 0.05 wash as fully opaque because of it. Nothing renumbered and **10-14 kept its number, its wave and its `depends_on`**. 81 files / 828 tests (+0 / +2), 101 → **103** e2e (+2, the first non-zero e2e term since 10-13), check 584 (+0). Commits d0a6948, 9771a48, 2da294e
- [x] 10-14-PLAN.md — Wave 15: the phase gate — every number re-measured, every requirement given a qualifier, and the one hardware row handed to the user (wave 15) — **executed 2026-09-09 to its checkpoint**; every projection `10-VALIDATION.md` carried is replaced by an observation taken on a clean tree against a fresh production build, with **eight wrong estimates named as wrong** rather than quietly corrected — including this plan's own negative-check instruction, which asked for a non-vacuity floor raised by one and expected red, when `facets.spec.ts:99`'s floor is 30 against an observed 36 and red arrives only at 36. The phase total is written as a **sixteen-term chain from 10-01's `BASE_TESTS`** and the e2e total as a **six-term chain from `BASE_E2E`**, so both ends are visibly the same arithmetic: quick **81 / 828** = `BASE_FILES + 7` / `BASE_TESTS + 48`, sweep **`4 19`** with all four 10-08 totals exact, e2e **103** = `BASE_E2E + 14`, check **584 / 0 / 0**. `docs/TESTING.md` carries the observed per-file table and the cost table; `deferred-items.md` goes from ten items to twenty-four, each with what would close it; twenty requirement qualifiers say what was proved **and** what was not, four of them with an explicit unresolved half. All six Phase 10 success criteria are walked one at a time with the plan that answers each and the half it leaves open. **Task 03 is a blocking checkpoint and is UNANSWERED**: `docs/INSTALL-RUNBOOK.md` row C's clear half needs a real ZONA, and the correct observation is dark at rest with a soft bloom under a finger — a pad that stays dark under a finger is a failure, not a pass. **No agent in this phase connected to a device, performed a write, or deployed.** Commits f3fa398, and the gate commit below

### Phase 11: Bench Corrections

**Goal:** Every configuration the user tested on a real ZONA on 2026-09-09 either behaves as they
asked, is removed, or is recorded as deliberately deferred - and the catalog stops depending on
another project to change its own contents.

The input is `BENCH-2026-09-09.txt` in this phase's directory: the user's own notes from testing all
thirty-six entries. Thirty-five were tested; **Four faders was not**. Two pass as written (QUADRANT,
CULL) and SNAKE is deferred by the user in their own words, with its design notes kept.

**Nine removals take the catalog from thirty-six to twenty-seven**: HOLD, KEYS, LEARN, SWITCH, ETCH,
GRIDLOCK, LIFE, SLAM, TABLE. Every one is hand-authored, so nothing vendored moves - but the front
door ring, the facet vocabulary, `frames.json`, the browse count literals and a long tail of
assertions all name a catalog of thirty-six, and each is a real edit rather than a deletion.

**HANGAR takes ownership of the nine preset definitions.** They are read today from `PRESETS` in
`src/vendor/botor/_pad.ts:4214`, which made eight of the user's notes unfixable here. They are not
vendored behaviour: each is a short mutator over a descriptor - Aurora's is empty, Pinwheel's is
three lines. **The vendored compiler and simulator stay untouched**, because they are what makes the
preview firmware-faithful and they are the GPLv3 derivation this project's licensing rests on.
Three of the eight are then reachable with no new behaviour at all: `sends.grid` already accepts
`"4x4"` (NINE PADS), and `sends.kind` already accepts `"xy"` (AURORA and PINWHEEL send nothing today).

**One class bug leads, because it explains several reports at once.** `glpfs(a, l, 255, 250, 0)`
steps by `256 - 250 = 6` from a start of 255, and 255 is not divisible by 6: the phase walks down to
**3 and stops**, which is the residual glow and the stuck colour the user reported. Five literal
sites carry it - EUCLID, GHOST, LIFE, MORPH, SONAR - and CHORUS carries the same defect in computed
form. The correct idiom is already written down in this repository, in `life.ts` of all files: **the
decay length divides 252**, giving `256 - 252//28 = 247`, which lands exactly on zero.

**What is NOT the cause, checked before assuming it:** the quantisation bug fixed in the user's
hand-pasted crosshair config is absent here. Every entry already uses `x*9//128`, so the precision
complaints (LATTICE, FORGE, CONSOLE's top row, SONAR, EUCLID) are per-config, and at least two read
as event filtering rather than arithmetic - EUCLID and CONSOLE act on taps, which is exactly why a
swipe does not register.

The remaining work groups as: missing MIDI (AURORA, PINWHEEL, STARFIELD, LUMEN as hex over sysex,
MORPH suppressing unchanged and zero values); clock sync (EUCLID, SONAR, STEPS, RADAR); redesigns
(GHOST from scratch, SHUTTLE, STRIP as two independent faders plus a crossfader, RADAR as note-on
and note-off when the sweep crosses user-placed points); and feature work (POMODORO at one and five
minutes, JOYSTICK centred at rest with a trail, TRACKPAD given an animation, ARC given visible
amplitude, DIAL's counter-clockwise rate limited, STAGE's lining-up breath).

**One addition, requested after the bench notes** (`WHEELS-REQUEST.md`): a pitch wheel on
the left of the pad and a mod wheel on the right, visualised on the module. The two are not one
control twice - **a pitch wheel springs back to centre on release and a mod wheel holds where it was
left** - and that asymmetry is the entry. Pitch bend is reachable as status 224 through `self:gms`;
`gmbs` is a mouse-button out-call and reading it as bend would emit clicks. The catalog therefore
lands at **twenty-eight**, not twenty-seven.

**Requirements**: CONT-01 (amended and closed), CONT-02, CONT-03, CAT-01, CAT-03, CAT-04 (still Pending, deliberately), FOUND-02 (amended), PREV-01, PREV-02, PREV-06, TUNE-01, TUNE-05, SHARE-01, SHARE-03 (amended), SHARE-04
**Depends on:** Phase 10
**Plans:** 19 plans in 19 waves - 11-01 to 11-16 plus 11-08.1, 11-09.1 and 11-09.2 inserted as decimals

**Closed 2026-09-10.** Final counts: catalog 29 (9 preset + 20 Lua); `test:quick` 84 / 869 + 1 todo; sweep `4 19`; e2e 86 source titles / 105 runs; `svelte-check` 582; `static/og/` 29 files; audition 25 rows; 22 enumerated vendored divergences. **Nothing hardware-verified by an agent.** The user's second bench round answered the gate's checkpoint and is the input to Phase 12 - see `11-bench-corrections/BENCH-2026-09-10.txt`.

Plans:
- [x] 11-01 the removal, the facet re-cut, the decay gate
- [x] 11-02 both class bugs and both gates
- [x] 11-03 the vendored divergence record, empty
- [x] 11-04 the record spent: comet decay and the fast tap in the compiler
- [x] 11-05 HANGAR owns the nine presets
- [x] 11-06 the five preset asks
- [x] 11-07 CONSOLE, and FORGE and LATTICE swept
- [x] 11-08 EUCLID, SONAR, STEPS, MORPH's suppression
- [x] 11-08.1 (inserted) canvas context loss and the harness ordering bug
- [x] 11-09 ARC's amplitude, POMODORO's intervals, the four-question checkpoint, STAGE's breathing
- [x] 11-09.1 (inserted) ARC's stop/resume and MORPH's corner tap
- [x] 11-09.2 (inserted) LUMEN's depth investigated
- [x] 11-10 gmss reaches the host; LUMEN sends hex over sysex
- [x] 11-11 GHOST rewritten
- [x] 11-12 SHUTTLE rewritten
- [x] 11-13 STRIP as two independent controls
- [x] 11-14 RADAR POINTS beside the preset (new-entry)
- [x] 11-15 the wheels
- [x] 11-16 the gate; checkpoint answered by the second bench round

### Phase 12: Touch Framework

**Goal:** A finger-to-LED interaction framework that works on a real ZONA, delivered as a Lua
library in the module's **system element** so every hand-authored configuration calls it rather
than inlining its own; HANGAR learns to write, snapshot, restore and clear that element; and the
entries the second bench round reported unfixed are re-fitted onto it.

**The decision that opens this phase**, in the user's words from `11-bench-corrections/BENCH-2026-09-10.txt`:
*"we need to come up with a finger interaction - led interaction framework that works properly on a
real life ZONA."* The evidence is that **the simulator has been wrong about touch on hardware twice
in a row**: EUCLID and STEPS were fixed for the fast tap and the decay, measured correct through a
real Lua VM, and are still "not precise" on the desk; LUMEN's depth walks the bottom row 196 -> 27
in the simulator and the user has looked twice and seen nothing; and `src/lib/sim/touch.ts` cannot
produce the firmware's coalesced fast tap at all (`TOUCH-CODE-9.md`). Another round of per-entry
fixes measured in the simulator would produce a third round of "still not precise".

**What changes the shape of the work: the system element.** `grid.get_element_events("system")`
returns three events - setup (0), utility (4), timer (6) - each with its own 908, and
`grid-fw/common/src/c/grid_ui.c:986` states *"Handle system element first then all the ui elements
in ascending order"*: **system setup runs before touch setup**, so a function defined there is a
global every touch configuration can call by name. The framework is therefore a **library, not an
idiom-plus-gate**, and every "cannot fit" Phase 11 reported for helper code (Trackpad at 907,
WHEELS at 895) is moot for the helper's cost. Per configuration the wire budget goes from 1,816 to
4,540 characters.

**The cost is that HANGAR knows only the touch element today** - D-21 recorded that "the current
page" was true of everything HANGAR could change *because* it only ever wrote element 0. That stops
being true. Install writes three or five events; snapshot and PUT BACK capture and restore the
system element; CLEAR resets it; the Lua host runs system setup before touch setup or the preview
cannot call the library; the budget meter grows; the BOTOR compiler does not know the element
exists, so the nine presets stay as they are and the library serves hand-authored entries.

**Ground truth comes from the user's ZONA, not the simulator.** The phase opens by making the
system element reachable, then hands the user two probes: one that lights the cell the firmware
puts a finger in and reports raw x,y (and, by defining a global in system setup and calling it from
touch setup, confirms the init order on hardware); one that shows four brightness levels for LUMEN's
depth. The library is written against those answers - cell hit-testing with hysteresis, per-axis
send-on-change (the user's own snippet, quantised to the LED grid), and the finger lighting the cell
it is in - then gated, then the affected entries re-fitted: EUCLID, STEPS, RADAR POINTS, CONSOLE,
MORPH.

**Alongside, not dependent on the probe:** three removals (LATTICE, FORGE, SHUTTLE - catalog 29 ->
26); ARC's Timer still painting after MIDI stops; CHORUS one chord at a time with exclusive pads;
MORPH's corner single-channel zones widened; NINE PADS defaulting to 4x4 (the knob shipped and the
user did not find it - a tuning-panel finding of its own); CONSOLE's muted faders interactive but
silent, reversing 11-07; JOYSTICK's visuals (trail versus centre dot is a user decision, look-layer
alternatives costed at 603-652); TRACKPAD's directional edge flash, which needs a from-scratch Lua
entry because the compiler strips every look from a trackpad state. GHOST and POMODORO confirmed
good. SNAKE still deferred.

**Requirements**: TBD
**Depends on:** Phase 11
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 12 to break down)

### Phase 12.1: Gradient touch (INSERTED)

**Goal:** A finger on the ZONA is drawn where it is, not in a cell. The third bench round
(`BENCH-2026-09-11.txt`) found the sensor is not under the LEDs: a finger on row 2 / column 8 lights
the corner, and a fingertip between two LEDs lights nothing, because Phase 12's library turns a
continuous position into one cell. Two problems, in order: (1) a calibration probe for the user's
bench - the value the sensor reports with a finger centred on each LED, both axes - giving a
measured sensor-to-LED map; (2) a bilinear library primitive G(x,y,b) that lights the 2x2 LEDs
around the finger weighted by distance through that map, replacing Q's hit-test as what entries
call, with any discrete choice an entry needs (EUCLID's step) taken from the same weights. Every
entry that draws a finger (EUCLID, STEPS, RADAR POINTS, SONAR, CHORUS, MORPH, CONSOLE, LUMEN,
TRACKPAD's flash) is re-fitted and re-measured against 908. Must land before 13-14, the Sandbox
compiler, which would otherwise inherit the cell model; 13-07..13-13 do not depend on it. Every
agent on Fable 5.1 (the user's instruction for Phase 13 extends to this insertion).
**Requirements**: CONT-02, CONT-03, PREV-01, PREV-02, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-07
(12.1-CONTEXT D-25; the gate amends SAFE-03, SAFE-05, SAFE-07, PREV-02, CONT-02, SAFE-04, PREV-01 by
name and dated; CAT-04 stays unticked)
**Depends on:** Phase 12 (gate landed, bench pending); ordered before Phase 13 plan 13-14
**Plans:** 11 plans in two bands and a gate

Plans:
- [ ] 12.1-01: calibration.ts from Probe C, the probe documented, 255/6 recorded as answered (Band 1)
- [ ] 12.1-02: the library on two slots (255/0 782, 255/6 683), host systemTimer, the surface gate (Band 1)
- [ ] 12.1-03: EUCLID, STEPS, RADAR POINTS, SONAR, ARC re-fitted on G and the calibrated Q (Band 1)
- [ ] 12.1-04: CHORUS, MORPH, CONSOLE, LUMEN, TRACKPAD re-fitted (Band 1)
- [ ] 12.1-05: the simulator forward map, frames.json regenerated, OG re-rendered (Band 1)
- [ ] 12.1-06: the fourth string on the wire - constants, the ordered slot list, four writes and fetches (Band 2, after 13-12)
- [ ] 12.1-07: TRY / PUT BACK / CLEAR over four strings, the classifier, the snapshot key (Band 2)
- [ ] 12.1-08: the KEEP sentence, wire-pin over both strings, the fourth textarea, the fake, runbook rows I and J (Band 2, before 13-14)
- [ ] 12.1-08a: GHOST onto the gradient - N and G, its own colour, ghost.png re-rendered, audition row 27 (Band 1, runs now)
- [ ] 12.1-08b: the eight presets onto the gradient - the compiler emits K/G through the library, the preset landing publishes both strings, manifest rows on _pad.ts and pad-sim.ts (Band 2, checkpoint: mirror / compiler-only / stop)
- [ ] 12.1-09: the gate - re-measured, eleven-term chains, requirements amended, the bench rows (checkpoint)

### Phase 13: GUI Overhaul

**Goal:** A total overhaul of the interface into a straightforward, modern web app in two parts -
**Playground** (discover and adapt ready-made configurations) and **Sandbox** (compose a custom
surface from placed elements and install it) - plus **My configs**, built from two user-supplied
source documents as the Bible and one standing override: **no rounded corners, anywhere, ever**.

**The direction, in the user's words (2026-09-10):** *"Redesign lacked a lot of things. When I meant
redesign I meant a total overhaul which creates a webapp that has a straightforward, modern GUI and
UX. We are also going to separate the whole webapp into two parts: playground and sandbox. Rebuild
the aesthetic and GUI using the content below for your primary sources. Keep what's necessary,
remove the unimportant and add everything else that hasn't been added. Of course you can always come
up with new ideas, but this should be your Bible when it comes to basics and always ask me if you
are not 100% sure regarding something. The only thing that you need to consistently change from the
aesthetic below is that never use rounded corners for anything, remember that."*

**The Bible**, copied under `13-gui-overhaul/bible/`: `HANGAR-ZONA-GUI-design-specification.md`
(506 lines: purpose, IA, screen inventory P01-H02, Playground, workspace, Sandbox, device and
persistence model, preview and diagnostics, My configs and sharing, tokens, responsive, a11y,
components, copy, priorities, validation plan, open decisions) and `HANGAR for ZONA.pdf` (five
screens: intro, Playground gallery, Sandbox with a selected element, My configs, the Arc workspace).
The wordmark is `hangar-logo-w.svg`, supplied by the user. Every GUI decision cites a spec section or
a PDF page; where the spec is silent or unsure, the plan says so and asks.

**Decisions taken 2026-09-10** (`13-CONTEXT.md`): Phase 12 runs first, because it makes the
configurations behave on hardware and because the Sandbox needs its library to compile regions;
Sandbox v1 must **build, preview and install** to the ZONA, which needs a region-to-Lua compiler that
does not exist today; typography stays **Grifter + Inter** with Grifter's PERSONAL USE licence still
to be resolved before the site goes public; **no `border-radius` above zero**, held by a gate.

**Already resolved that the spec's section 19 leaves open:** transport is Web Serial, not Web MIDI;
Apply is a RAM write (Phase 7's TRY ON DEVICE) and Store is a separate flash write (KEEP ON DEVICE),
each on real acknowledgements; the device can be read back and compared (the snapshot); the
protocol carries `PAGEACTIVE_PAGENUMBER` and `PAGECOUNT`, so a target page is a real control rather
than read-only; the browser preview runs the configuration's actual Lua and is labelled as a
simulation where it is one. The companion `HANGAR-ZONA-design-tokens.css` the spec names was not
supplied; section 12's table carries every value.

**Requirements**: TBD
**Depends on:** Phase 12
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 13 to break down)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

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
| 9. Twenty Configurations | 10/10 | Complete (audition rows awaiting the user) | 2026-09-07 |
| 10. Redesign | 16/16 | Complete (runbook rows A-G awaiting the user, row C now carrying the clear) | 2026-09-09 |

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

**Phase 10 owns no row above, and that is correct.** It is a redesign phase: every one of the twenty
requirements it names was closed by an earlier phase, and Phase 10 **extends, amends or explicitly
records-as-untouched** each of them rather than claiming ownership. The mapping "all 50 map to exactly
one phase" is unchanged; the twenty qualifiers live in `REQUIREMENTS.md` beside the closure each one
already had. Recorded 2026-09-09 by plan 10-14, because a reader who greps this table for `IDENT-01`
and finds only Phase 4 should not conclude that nothing has touched it since.

## Verification Note

Most of this roadmap is verifiable with no hardware attached: Phases 1, 3, 4, 5 and 8 need only a
browser, and Phase 7's failure paths are exercised against recorded protocol frames. Criteria marked
*(hardware)* can only be confirmed with a real ZONA plugged in, and the user performs that testing
personally. Web Serial itself is not automatable — no CDP domain, no fake-device hook — so those
criteria are a checklist for a human, not assertions a test suite can make.

---
*Roadmap created: 2026-09-02*

### Phase 13.1: Bench corrections four (INSERTED)

**Goal:** The fourth bench round (`BENCH-2026-09-12.txt`) - rows I, L, H and M pass on the
user's ZONA; the interface differs from the PDF in nine places the user names. Each is a change to
what Phase 13 built, not a new screen: the intro fits the viewport without scrolling; the gallery's
Explore buttons match the PDF (grey, Grifter, arrow on the same row); Sandbox elements resize by
dragging their handles and each carries its own colour and a fuller look; a persistent CLEAR control
sits top right beside ZONA connected; a page switch from the Target select happens without the
review (section 9's destination review struck by the user); the install column under the workspace
surface goes and the context bar's right zone reads Target / Apply to ZONA / Store on ZONA; Edit
color opens inline below the swatch, not as a popover; MIDI output is two typed fields, CC number
and Channel, with the PDF's helper line; the budget meters are hidden (over-budget still refuses
Apply and names the cause). Put back's removal is pending the user's confirmation. Every agent
on Opus; the Bible stays the Bible; no rounded corners; every change re-proved by the three-layer
radius gate, the e2e suite and the sweep where an entry moves.
**Requirements**: IDENT-01, CAT-01, BUILD-06, BUILD-07, SAFE-01, SAFE-05, SAFE-09, TUNE-03, TUNE-05,
CONN-08 (amended or qualified by name at the gate)
**Depends on:** Phase 13 (gate landed, bench pending)
**Plans:** 8 plans in five waves

Plans:
- [ ] 13.1-01: the intro fits the viewport; the gallery's Explore buttons as the PDF draws them (wave 1)
- [ ] 13.1-02: the Target select switches on change - the destination review struck (wave 1)
- [ ] 13.1-03: Sandbox elements resize by dragging their handles, each in its own colour, the fuller look (wave 1)
- [ ] 13.1-04: Edit color opens inline below the swatch (wave 1)
- [ ] 13.1-05: a persistent Clear in the header beside ZONA connected (wave 2)
- [ ] 13.1-06: the install column gone, the bar's zone shared, Put back removed (wave 3)
- [ ] 13.1-07: MIDI output as two typed fields, the meters hidden, the e2e re-aimed (wave 4)
- [ ] 13.1-08: the gate - re-measured, the allowlist still empty, requirements amended by the user's word, the bench rows (checkpoint)
