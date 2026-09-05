# Requirements: HANGAR

**Defined:** 2026-09-02
**Core Value:** Plug in a ZONA, open a URL, and half a minute later the pad is doing something spectacular. If everything else fails, browser-to-hardware install must work.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases. IDs in brackets refer to the research
feature table in `.planning/research/FEATURES.md`.

### Foundation

- [x] **FOUND-01**: A bare browser page (no framework, no Editor) connects to a ZONA over Web Serial, fetches the touch element's existing Setup and Timer configs, writes the identical strings back, and stores — every step acknowledged by the module, the whole run a provable no-op on the hardware (the walking skeleton)
- [x] **FOUND-02**: The `_pad.ts` compiler, `pad-sim.ts` simulator and `pad-sim-host.ts` render loop are vendored into HANGAR with their existing test suites passing unchanged, quarantined under a single vendor directory with a written sync procedure back to BOTOR
- [x] **FOUND-03**: `@intechstudio/grid-protocol` is pinned to the exact version BOTOR's cost baseline was measured against, and any bump is a test-gated change
- [x] **FOUND-04**: The repository carries a GPLv3 licence, a notices file for third-party licences (grid-protocol is itself GPLv3), and the deployed site serves a source archive of the deployed commit (GPLv3 section 6(d) — the repository itself stays private, per D-02)
- [x] **FOUND-05**: Compile, cost and fit are gated on the Lua formatter WASM being initialised, so no card can ever appear syntactically invalid or fail to measure because the formatter has not loaded yet

### Connect [A]

- [x] **CONN-01**: User sees one primary `CONNECT` control, enabled only when `"serial" in navigator && isSecureContext` — never gated by user-agent sniffing [A1]
- [x] **CONN-02**: User on an unsupported browser and user on an insecure context see two different messages, each naming the fix; the unsupported message names browsers that do work (Chrome, Edge, desktop Firefox 151+) and never says "Chromium" [A2]
- [x] **CONN-03**: User reads, before clicking, what the browser's port picker is, that the browser asks and not HANGAR, and that HANGAR sees nothing until they choose [A3]
- [x] **CONN-04**: User whose port is held by another program (typically Grid Editor) sees Grid Editor named as the likely culprit and the recovery in order — quit the other app, unplug, wait, replug, reload, connect — instead of the raw `Failed to open serial port` exception [A4]
- [x] **CONN-05**: User who cancels the picker sees a distinct "you cancelled" state, and user whose picker listed nothing sees the cable/driver branch (charge-only USB cable warning included) [A5]
- [x] **CONN-06**: Returning user is reconnected silently from `navigator.serial.getPorts()` without re-running the picker, and unplug/replug updates the UI through the `connect`/`disconnect` events instead of failing on the next write [A8]
- [x] **CONN-07**: The port picker is filtered to ZONA's USB identity only (VID 0x303a / PID 0x8123); bootloader identities are never offered, and after opening, the module is verified as a ZONA from its heartbeat before any control is enabled — any other module is refused with a plain message [A9]
- [x] **CONN-08**: User can see the connected module's type and firmware version, so "connected" means "connected to a ZONA", not "a port is open" [A7]

### Non-destructive install [B]

- [ ] **SAFE-01**: Nothing is written to the module without an explicit click, and the connect screen says so out loud [B1]
- [ ] **SAFE-02**: `TRY ON DEVICE` writes to RAM only and is the primary action; `KEEP ON DEVICE` stores to flash and is a visibly secondary, separate action; the two never sit as equal-weight buttons [B2]
- [ ] **SAFE-03**: At connect — before any write is possible — HANGAR snapshots the touch element's Setup and Timer configs, and `PUT BACK` restores them with one click at any time [B3]
- [ ] **SAFE-04**: The snapshot persists in `localStorage` keyed by module identity, so `PUT BACK` survives a closed tab [B4]
- [ ] **SAFE-05**: `KEEP ON DEVICE` requires a confirmation that names what is being replaced ("the Setup and Timer scripts on your ZONA's touch element") and states that it survives a power cycle [B5]
- [ ] **SAFE-06**: On a rig with more than one Grid module, the flash confirmation names the other modules and states that their current pages are stored too (PAGESTORE is a global broadcast); the action remains allowed
- [ ] **SAFE-07**: "Installed" means an ACKNOWLEDGE frame was received for each event write, never a resolved writer promise; a write that lands one event but not the other is detected, reported plainly, and recovered by retry or by reloading the page from flash — the user is never left with a silent half-written config
- [ ] **SAFE-08**: The install states its own speed honestly ("about a second") and confirms a settled state rather than showing a progress bar for a 200 ms operation [B6]
- [ ] **SAFE-09**: Retries on timeout are bounded, and a lost connection mid-write ends in a named failure state with `PUT BACK` still offered, never an infinite retry loop

### Preview [C]

- [x] **PREV-01**: Every card in the catalog animates live in the firmware-faithful simulator with no hardware attached [C1]
- [x] **PREV-02**: The simulator consumes the exact compiler output that would be written to the module — no hand-authored animation anywhere [C2]
- [ ] **PREV-03**: The site states in one line what the simulator matches exactly and what it cannot show (physical LED colour, diffusion, touch feel) [C3]
- [ ] **PREV-04**: The focused card accepts mouse-as-finger input so the user can play the instrument, not just watch it [C4]
- [x] **PREV-05**: Offscreen cards pause (IntersectionObserver with a wake margin), `prefers-reduced-motion` falls back to a still frame or play-on-hover, and the render path stays within budget at a dozen visible cards at 30 fps [C5]
- [x] **PREV-06**: Every ported preset's simulated output is pinned against an oracle derived independently of the compiler (firmware source or hardware capture), so a shared misreading cannot hide behind a green suite

### Catalog [D]

- [x] **CAT-01**: Every configuration has a deep link that lands on its detail view [D1]
- [x] **CAT-02**: User can sort by Featured, Newest and Name; no popularity metrics are shown or faked [D4]
- [x] **CAT-03**: User can open a focus/detail view for one configuration where it runs at full frame rate with interaction, knobs, budget meters and install controls [D5]
- [ ] **CAT-04**: The catalog is a static data file of Profile-Cloud-shaped config objects plus tuning metadata, buildable with no backend

### Content

- [ ] **CONT-01**: The nine BOTOR shelf presets — starfield, aurora, pinwheel, radar, faders, ninepads, tpad, dial, joystick — are in the catalog, each compiling to the same Lua as BOTOR at the pinned protocol version
- [x] **CONT-02**: At least six new configurations authored for spectacle are in the catalog, each fitting the 908/908 budget at its default knob positions and verified in the simulator
- [ ] **CONT-03**: Every catalog entry has a name, a one-line description, feel-based tags, a Featured flag and a default knob state

### Tuning [F]

- [x] **TUNE-01**: Each configuration exposes three to six knobs (from colour, speed, layout, brightness, MIDI destination and config-specific parameters) using one shared widget vocabulary [F1]
- [x] **TUNE-02**: Every knob change recompiles and re-simulates live; the recompile is debounced, the preview is not [F2]
- [x] **TUNE-03**: Two separate live meters show Setup and Timer usage as `chars / 908` with a percentage [F3]
- [x] **TUNE-04**: When the fit ladder trims a feature to stay in budget, the user is told so in one line rather than the preview silently diverging from their expectation [F4, generic wording acceptable in v1]
- [x] **TUNE-05**: An over-budget state disables `TRY ON DEVICE`, turns the offending meter red, names the knob that pushed it over and offers a one-click back-off; the click never reaches the wire to fail there [F5]
- [x] **TUNE-06**: User can reset one knob (double-click) or the whole configuration to defaults [F6]
- [x] **TUNE-07**: User can hit `SURPRISE ME` to randomise knobs into a state that is never over budget [X8]

### Sharing [E]

- [x] **SHARE-01**: The tuned state is encoded as the versioned base36 stamp in the URL hash (never the query string), and opening such a URL restores the knobs exactly [E1]
- [x] **SHARE-02**: User has an explicit `COPY LINK` control whose own state confirms the copy [E2]
- [x] **SHARE-03**: A stamp from an older HANGAR version fails gracefully — "this link was made with an older version" — and lands on the base configuration, never a subtly wrong one [E3]
- [x] **SHARE-04**: Every catalog configuration has a build-time OG image rendered from the simulator, so a shared link unfurls with the pad picture and title on Discord [E4]

### Honest degrade [G]

- [x] **DEGR-01**: The full catalog, simulator, tuning and sharing work on every browser including iOS Safari — only install is absent [G1]
- [ ] **DEGR-02**: Install controls are present but disabled with the reason inline on unsupported browsers, never hidden [G2]

### Identity

- [ ] **IDENT-01**: The site implements the reference identity: true-black ground, a single acid-lime accent (~#D6FF4E), generative glyph-field texture as wallpaper, wide-tracked uppercase type, and the 9x9 pad outline as logo, loading state and card frame
- [ ] **IDENT-02**: The site is motion-forward — a rack of running machines — while honouring `prefers-reduced-motion`

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Connect

- **CONN-09**: Expanded cable/driver troubleshooting page [A6] — trigger: first "nothing showed up" report

### Non-destructive install

- **SAFE-10**: Page-change / VM-reset warning during an audition, driven by PAGEACTIVE reports [B7] — trigger: first "the audition disappeared" report

### Catalog

- **CAT-05**: Free-text search over name, tags and description [D2] — trigger: catalog exceeds ~20 entries
- **CAT-06**: Tag chips that filter on click and are individually removable [D3]
- **CAT-07**: Capability filters (needs MIDI destination, uses touch, animation only, fits at max brightness) [D6]
- **CAT-08**: Curated shelves beyond a single Featured sort [D7]
- **CAT-09**: Named deterministic slugs (`/c/starfield#stamp`) [X7]

### Tuning

- **TUNE-08**: Fit-ladder degradation names the exact feature trimmed via compiler introspection [F4 full]
- **TUNE-09**: Generated Lua viewable on demand, read-only [X5 extended]

### Sharing

- **SHARE-05**: Fully bidirectional URL state — knob drags update the hash via `replaceState` [E5]
- **SHARE-06**: `COPY LINK` offered as the unsupported-browser fallback ("open this on a desktop browser") [G3]

### Preview

- **PREV-07**: Before/after compare of the module's existing config against the candidate, where the existing config is parseable [X6]

### Content

- **CONT-04**: Community submissions accepted by pull request into the static catalog, with a review process

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Accounts, cloud library, community uploads [N1] | User-uploaded Lua is arbitrary code executed on a stranger's hardware from a stranger's website — categorically unlike a sandboxed shader. Also moderation, storage and abuse surface for a static site. Sharing is URL-encoded instead. |
| Full layer/zone authoring in the browser [N2] | QMK Configurator's friction chain is the cautionary tale. HANGAR tunes named configurations; authoring lives in BOTOR and the Editor. |
| Firmware update, bootloader, DFU [N3] | HANGAR must never be able to brick a module. The port picker never even offers bootloader identities. |
| Streaming the real ZONA's LEDs as the preview [N4] | Structurally capped at 3.3 Hz by the editor-heartbeat gate in firmware; it would make a spectacular config look broken. |
| Auto-apply on connect [N5] | Violates "nothing writes without a click"; reads as a website taking over your hardware. |
| A single Install button doing RAM and flash together [N6] | Collapses the audition/commit distinction that is the entire safety story. |
| User-agent sniffing for the install gate [N7] | Firefox 151 already broke that assumption once; Chrome Android exposes `navigator.serial` for Bluetooth only. Feature-detect. |
| Raw serial console / log pane [N8] | A debugging tool for firmware flashers; it turns a playground into a terminal. Plain-language errors instead. |
| Like counts, view counts, trending [N9] | Needs a backend; fake counts corrode the honesty everything else depends on. |
| QR codes [N10] | Install needs USB needs a desktop; a QR sends the config to the one device that can never install it. |
| Screenshots of the browser port picker [N11] | Chrome's and Firefox's differ and drift across versions; describe it in words. |
| Erase device / factory reset [N12] | A button whose only function is destroying the user's work — the opposite of `PUT BACK`. |
| Grid Editor as a dependency | The whole point of the Web Serial route. |
| Modules other than ZONA | Simulator, compiler and identity are all 9x9-specific. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 2 | Complete |
| FOUND-02 | Phase 3 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 3 | Complete |
| CONN-01 | Phase 6 | Complete (one control, in the header, on `/`, `/c/<id>/` and `/browse/`, enabled from `capabilityOf({hasSerial, secure})` and nothing else; no user-agent read exists anywhere in the tree, asserted by session-copy.spec.ts and the source scans; proven in both browsers) |
| CONN-02 | Phase 6 | Complete (two distinct messages, both rendered in a real browser: `unsupported` on WebKit with no `navigator.serial`, `insecure` through a shadowed `isSecureContext` - the first time the insecure branch has ever rendered in this project; the unsupported one names Chrome, Edge and desktop Firefox 151 and no engine) |
| CONN-03 | Phase 6 | Complete (the 130-character pre-click line beneath the header row in every not-connected state and in the chosen panel, never both at once; the Firefox two-step sentence ships unconditional and brand-free beneath `Nothing listed?`, because no non-brand behavioural signal for that prompt exists) |
| CONN-04 | Phase 6 | Complete against a scripted `NetworkError`: the named block, Grid Editor by name, the six steps in order, the browser's own `Failed to open serial port.` nowhere on the page, in node and in a browser from both the probe and the shipped header. That Grid Editor is what produces that error on a real machine is docs/SESSION-RUNBOOK.md row C - Phase 2's row 0 was never exercised - and is awaiting the user |
| CONN-05 | Phase 6 | Complete (`cancelled` is its own state with `You closed the chooser`; the empty-picker branch is the `Nothing listed?` disclosure beneath it, charge-only cable first, because the API cannot tell the two apart - one `NotFoundError`, three causes; the third cause, a site setting, gets its own disclosure) |
| CONN-06 | Phase 6 | Complete against a scripted serial: `getPorts()` on load offers `ZONA detected` with the port unopened, one click connects with zero `requestPort()` calls (never automatic, D-06), `disconnect` flips the header in the same turn, and the replug that mints a NEW port object is adopted by USB identity; the connection survives a four-hop client-router walk and a reload lands the offer. The grant surviving a browser restart (and for the deployed origin) and the replug on real hardware are runbook rows A and B, awaiting the user |
| CONN-07 | Phase 6 | Complete with the correction the research found: the filter is `0x303a/0x8123`, but every ESP32-S3 Grid module shares that identity, so the filter does NOT narrow the picker to a ZONA and the heartbeat verify is the whole of it - `not-zona` ships as a routine first-class state naming the module that answered. Proven against synthetic heartbeats; the rig half (a real second module named in the header, a real non-ZONA refused) is runbook row D, awaiting the user |
| CONN-08 | Phase 6 | Complete (type, firmware and active page in the header while connected - `ZONA · fw 1.5.5 · page 3` from the Phase 2 capture - LIVE rather than frozen at connect time, with the rig tail filling in as other modules announce themselves; `connected` is reached only after the heartbeat names a ZONA) |
| SAFE-01 | Phase 7 | Pending |
| SAFE-02 | Phase 7 | Pending |
| SAFE-03 | Phase 7 | Pending |
| SAFE-04 | Phase 7 | Pending |
| SAFE-05 | Phase 7 | Pending |
| SAFE-06 | Phase 7 | Pending |
| SAFE-07 | Phase 7 | Pending |
| SAFE-08 | Phase 7 | Pending |
| SAFE-09 | Phase 7 | Pending |
| PREV-01 | Phase 4 | Complete (five presets animate; three quiet presets show their real static picture, declared and gated against the golden frames; tpad rests black and is out of the front-door row) |
| PREV-02 | Phase 4 (Lua-sourced entries: Phase 8) | Complete |
| PREV-03 | Phase 4 | Pending |
| PREV-04 | Phase 4 | Pending |
| PREV-05 | Phase 4 | Complete (row mounts at most seven pads; offscreen pause and reduced motion asserted; paint count recorded 135–216 per 2 s, no fps floor asserted — accepted deviation 3) |
| PREV-06 | Phase 3 | Complete |
| CAT-01 | Phase 4 | Complete (eight prerendered /c/<id>/ pages; tpad has a catalog entry but no page because it writes no LEDs — /c/tpad/ lands on the shelf with a notice) |
| CAT-02 | Phase 5.1 | Complete with one qualifier about provenance, not about behaviour: the three orders ARE the shipped comparators in src/lib/catalog/index.ts as 05.1-CONTEXT.md D-10 amends them - byFeatured() (featured first, then name, no addedAt tie-break), byNewest() and a plain code-point nameAsc, with no localeCompare and no Intl.Collator anywhere. 05.1-UI-SPEC.md W-08 AGREES with that rule and is NOT superseded; what the amendment supersedes is 05.1-RESEARCH.md, whose Standard Stack row and Do-Not-Hand-Roll row both recommend Intl.Collator("en", { sensitivity: "base" }). nameAsc is not exported, so src/lib/browse/sort.ts restates it and sort.spec.ts tests 2-4 gate the restatement against byFeatured()/byNewest()/byName() id sequences while test 5 asserts mechanically that neither localeCompare nor Intl is named. The no-popularity-metric half is held by browse-ui.spec.ts test 1 as a comment-stripped source scan with fragment-assembled needles, and by W-04 refusing a count on any chip |
| CAT-03 | Phase 5.1 | Complete with one qualifier that must not be read past: the INSTALL CONTROLS ARE PHASE 7'S AND ARE STILL ABSENT OR DISABLED. What this phase delivers is the focus view itself - all sixteen configurations now have a real prerendered /c/<id>/ page (05.1-05), an off-row entry gets a row of one with an arrow-less plate, the hero runs at full frame rate and takes mouse-as-finger, Phase 5's knobs and both 908 meters are there, and the way back restores sort, query, tags and scroll offset. TRY ON DEVICE connects and identifies only, KEEP ON DEVICE is really disabled, and nothing writes. The install half is docked, not built |
| CAT-04 | Phase 4 | Pending |
| CONT-01 | Phase 4 | Pending |
| CONT-02 | Phase 8 | Complete (seven configurations against a floor of six — EUCLID, CHORUS, ARC, GHOST, LATTICE, MORPH, SONAR — canonical, in budget across their whole knob range, run in a Lua VM over the unmodified simulator; the twelve-row hardware audition is presented to the user and unanswered) |
| CONT-03 | Phase 4 (metadata gate for new entries: Phase 8) | Pending |
| TUNE-01 | Phase 5 (knob data for Lua entries: Phase 8) | Complete |
| TUNE-02 | Phase 5 | Complete |
| TUNE-03 | Phase 5 | Complete |
| TUNE-04 | Phase 5 | Complete (guard, unreachable in practice: reachability.sweep.spec.ts costs all 32,852 reachable knob states and none crosses 908, so the fit ladder is proven against a measured over-budget reserve in ladder.spec.ts and watched in a browser on /dev/tune/, never met by a visitor) |
| TUNE-05 | Phase 5 | Complete (guard, unreachable in practice: the red meter, the disabled TRY ON DEVICE with its reason, the named knob and TURN IT DOWN are all real code, reachable only by passing a real reserved to cost() - e2e/tuning.e2e.ts tests 9 and 10 are a browser doing exactly that) |
| TUNE-06 | Phase 5 | Complete |
| TUNE-07 | Phase 5 | Complete |
| SHARE-01 | Phase 5 | Complete |
| SHARE-02 | Phase 5 | Complete |
| SHARE-03 | Phase 5 | Complete |
| SHARE-04 | Phase 5 | Complete with two qualifiers: routed entries only - 8 of the 16 catalog entries, because the excluded eight are not in FRONT_DOOR, have no prerendered /c/<id>/ page and therefore no <head> to carry an og:image; and a real Discord unfurl is unverifiable until the Basic Auth embargo lifts, because worker/index.js gates the whole site fail-closed and no crawler ever reaches the head the tests check |
| DEGR-01 | Phase 5 | Complete (iOS is approximated by WebKit at a phone viewport: e2e/tuning-webkit.e2e.ts's five tagged tests run in both projects and cover the front door, choosing without sideways scroll, a knob turn with both meters settling, COPY LINK's confirm state and a shared link landing with install present but disabled) |
| DEGR-02 | Phase 7 (browser-capability half delivered in Phase 4) | Pending |
| IDENT-01 | Phase 4 | Pending |
| IDENT-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 50 total
- Mapped to phases: 50 ✓
- Unmapped: 0

Every v1 requirement maps to exactly one phase. Per-phase counts: Phase 1 (2), Phase 2 (1),
Phase 3 (3), Phase 4 (13), Phase 5 (12), Phase 6 (8), Phase 7 (10), Phase 8 (1).

---
*Requirements defined: 2026-09-02*
*Last updated: 2026-09-05 after Phase 6's gate (CONN-01..08 closed with their qualifiers; the hardware halves of CONN-04, CONN-06 and CONN-07 are docs/SESSION-RUNBOOK.md rows A to E, presented to the user and unanswered; SAFE-01 and DEGR-02 remain Phase 7's)*
