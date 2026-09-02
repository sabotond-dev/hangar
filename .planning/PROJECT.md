# HANGAR

## What This Is

A public web playground for Intech Studio's ZONA — the 9x9 XY-pad module. Visitors browse a catalog
of flashy, show-off pad configurations, watch every one of them animate live in a firmware-faithful
simulator in the browser, turn a few real knobs, and load the result straight onto their own ZONA
over Web Serial. No Grid Editor, no install, no account, and no hardware required to look around.

It is the playground half of the ZONA story: BOTOR is where configs get engineered, HANGAR is where
people fall in love with them.

## Core Value

Plug in a ZONA, open a URL, and half a minute later the pad is doing something spectacular.
If everything else fails, browser-to-hardware install must work.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Connect to a ZONA from the browser over Web Serial: `navigator.serial.requestPort()` with the
      Grid USB VID/PID filters, port opened at 2 000 000 baud, module identified as a ZONA
- [ ] Install a config onto the connected module: Setup (event 0) and Timer (event 6) on the single
      touch element, written to RAM first so it is an audition, never a commitment
- [ ] Store to flash as a separate, deliberate, clearly labelled action
- [ ] Put back: snapshot whatever was on the module at connect time, restore it on demand, and make
      it obvious that opening HANGAR never writes anything by itself
- [ ] A catalog of flashy configurations, seeded by porting the nine proven BOTOR shelf presets
      (starfield, aurora, pinwheel, radar, faders, ninepads, tpad, dial, joystick), then extended
      with new ones authored for spectacle
- [ ] Live simulator preview on every card — the firmware-faithful `pad-sim` engine running the real
      compiled config, animating with no hardware attached; the focused card takes mouse-as-finger
- [ ] Tune knobs per configuration (colour, speed, layout, brightness, MIDI destination) that
      recompile in the browser and hold the config inside the 908-character Setup and 908-character
      Timer budgets, with the fit ladder degrading gracefully instead of failing
- [ ] Shareable URL that encodes the tuned state (the existing base36 stamp), so a tuned config
      travels through a Discord link with no accounts and no backend
- [ ] Honest degrade where Web Serial does not exist (Safari, every iOS browser, Firefox on Android,
      desktop Firefox before 151): the whole catalog still browses and simulates, install is disabled
      with a plain explanation — detected by feature, never by user agent
- [ ] Ships as a static site — no server, no database, no auth

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Accounts, cloud library, community uploads — sharing is URL-encoded instead; a backend would add
  moderation, cost and abuse surface for nothing that launch needs
- Full config authoring (a layer/zone editor in the browser) — HANGAR tunes named configurations, it
  does not build them from nothing; that is the Adjust/Code level of the ZONA GUI spec and belongs in
  BOTOR and the Editor
- Modules other than ZONA — the simulator, the compiler and the entire visual language are 9x9-specific
- Firmware update, bootloader, DFU — HANGAR must never be able to brick a module
- Any dependency on Grid Editor being installed or running — that is the whole point of the Web Serial route

## Context

**The architecture is already proven, in three separate pieces that have never been combined:**

- **Browser-to-hardware.** The Grid Editor's web build already drives real modules from a browser:
  `navigator.serial.requestPort({ filters })` in `grid-editor/src/renderer/serialport/serialport.ts:202`,
  and `SerialTransport` (`serial-transport.ts`) opening the port at 2 000 000 baud behind a
  `GridTransport` interface it shares with the websocket and virtual transports. The wire protocol
  lives in `@intechstudio/grid-protocol` (1.20260825.1135), a published npm package that runs in the
  browser — profile-cloud already imports it.
- **Config as JSON.** Profile Cloud's shape, proven in production:
  `{ id, name, description, configType: "profile" | "preset" | "snippet", type: ModuleType, version,
  configs: [{ controlElementNumber, events: [{ event, config: <lua source> }] }] }`. A HANGAR catalog
  entry is this object plus tuning metadata.
- **The configs and the simulator.** BOTOR (`grid-editor` @ `redesign`, public at
  github.com/sabotond-dev/botor) holds `src/renderer/main/zona/_pad.ts` — a ~3.2k-line compiler from a
  parameter model to Setup+Timer Lua, with a cost function using the real `compressScript`, a fit
  ladder, and a base36 stamp — plus `pad-sim.ts`, a firmware-faithful simulator (integer weight tables
  summing 254, single /512 after layer sum, verbatim 256-entry sine lookup, freeze-on-expiry tick
  order) that is pinned by tests and has already caught a real committed bug.
  Nine presets fit the budget today; the worst measured stack was 941/908 at full brightness, which is
  known pre-existing debt in the fit ladder.

**Why the live simulator matters so much here:** the module's own LED preview mirror was measured at
3.3 Hz, so streaming the real pad to the screen is impossible. The simulator is the only way a card
can look alive, and it is also the only reason the site is worth opening with no hardware attached.

**ZONA hard facts that constrain every configuration** (full detail in the user's
`project_zona_module_config.md` memory): 81 LEDs, serpentine wiring already corrected in firmware;
Lua 5.5 where a fractional argument silently becomes 0; exactly one touch element with exactly two
events, each capped at 908 characters; five simultaneous contacts, but the Lua shim pops one sample
per 100 Hz cycle; no pressure sensing; animation runs in C with zero Lua per frame, and phase stagger
across the grid is what makes waves and swirls; a page change destroys the whole Lua VM.

## Constraints

- **Compatibility**: Web Serial needs HTTPS plus a user gesture and exists in Chromium (Chrome 89+,
  Edge, Opera) and, since 2026-05-19, desktop Firefox 151+ (with its own per-site prompt and an
  enterprise policy that can switch it off). Safari, every iOS browser and Firefox on Android can never
  install. A large share of visitors will still be browse-only, so the catalog and the simulator have
  to carry the site on their own. Detect the capability (`"serial" in navigator && isSecureContext`),
  never the browser.
- **Budget**: 908 characters for Setup and 908 for Timer, comments included (the minifier does not
  strip them). Every knob a visitor turns has to keep the config inside that.
- **Licensing**: `grid-editor` is GPLv3. Porting `_pad.ts` and `pad-sim.ts` into HANGAR makes HANGAR a
  derivative work, so HANGAR ships GPLv3 with public source. Consistent with the BOTOR decision, but it
  is a decision, not an accident.
- **Safety**: the site talks to hardware people paid for. Nothing writes without an explicit click,
  flash writes stay separate from RAM auditions, and the module's original config is always recoverable.
- **Hosting**: static only. Cloudflare is the established host on this machine (zona-docs runs there).
- **Dependency**: `@intechstudio/grid-protocol` is upstream Intech's package and its version tracks
  firmware; HANGAR pins it.

## Visual Identity

Set by the user's reference images (2026-09-02). This is HANGAR's own identity, not Intech house style:

- **Ground is black.** Not near-black — black, so an LED-grid motif reads as light in a dark room.
- **One accent: acid lime** (~#D6FF4E, the family of the `#e4ff68` already in the editor palette).
  Effectively a two-colour system; a third colour has to earn itself.
- **Texture is generative glyph fields** — dense mosaics of tiny `x`, `o`, `+`, `□`, `◦` marks packed
  into blocks, with solid lime rectangles punched through them, under halftone and dot grain. This is
  the wallpaper of the site, not decoration in a corner.
- **Type is wide-tracked uppercase**, heavily letter-spaced, small against large empty areas.
  `H A N G A R` sits in the middle of the noise, quiet, while the pattern shouts.
- **The 9x9 pad is the hero motif** — a rounded-square grid outline in lime on black, cells picked out
  at the intersections, glowing. It is the logo, the loading state and the card frame at once.
- **Motion-forward.** Cards animate constantly; the site should feel like a rack of running machines.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Standalone public site talking to hardware over Web Serial, not a Grid Editor panel | The Editor route works but only reaches people who already installed the Editor; a URL reaches everyone, and the editor's own web build proves a browser can drive a module | — Pending |
| Port the nine BOTOR presets as the seed catalog, then author new ones | They are produced by a tested compiler, they fit the budget, and several are hardware-proven; authoring from zero would re-litigate solved problems | — Pending |
| Live `pad-sim` preview on every card | The hardware's own LED mirror is 3.3 Hz, so the simulator is the only possible preview — and it makes the site worth opening with no ZONA attached | — Pending |
| Tune knobs, not full authoring | "Playground" means turning knobs on great configs; a browser layer/zone editor is a different, much larger product | — Pending |
| Shareable state in the URL via the base36 stamp, no accounts | Keeps the whole thing static and free, and the stamp format already exists and is versioned | — Pending |
| HANGAR gets its own black and acid-lime identity | The user's reference images; the site is a playground, not an Intech product surface | — Pending |
| GPLv3, public source | Consequence of reusing the GPLv3 compiler and simulator; already the BOTOR precedent | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-02 after initialization*
