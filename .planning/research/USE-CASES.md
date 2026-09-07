# What people would actually USE a ZONA for

**Researched:** 2026-09-07
**For:** the HANGAR phase that adds twenty configurations
**Confidence:** HIGH on local evidence (files read directly), MEDIUM on the wider-world half
(named products and documented workflows, cross-checked, but no ZONA-specific market data exists)

---

## Summary

Three things came out of this that change how the twenty should be chosen.

**One: the local evidence says nobody is sharing ZONA configurations yet, and there is no tag
vocabulary to inherit.** `profile-cloud` has no seed data on disk at all — every community
configuration lives in Firestore behind auth (`src/lib/firebase.ts`, `transfer-configs-to-dev.js`).
Its filter has no tag field: it searches name, type, configType, virtualPath and description as free
text, plus a `$BlockName` operator that searches the *action blocks* used inside the Lua
(`src/routes/Filter.ts:76-152`). So the closest thing the ecosystem has to a category vocabulary is
**the action-block catalogue itself** — which is a capability list, not a use-case list. HANGAR's
existing feel-based tags (`src/lib/catalog/entries/ported.ts:22-24`) are a genuinely new taxonomy,
not a divergence from an established one.

**Two: Intech's own published workflow list is the best available statement of what Grid owners
build**, and it is short, specific, and heavily weighted to DAW and mixer control. Sixteen named
workflows on `intech.studio/us/workflows`, plus eleven `RECOMMENDED_PACKAGES` in
`grid-editor/configuration.json:56-99`. Ableton appears three times. Lightroom, Photoshop,
TouchDesigner, RME TotalMix, OBS, Discord, Spotify, Elektron Syntakt and 1010Music Bluebox each
appear once. That is the demand curve, measured.

**Three, and this is the finding that should shape the phase: MIDI *in* works on a ZONA touch
element with no Editor running, and MIDI clock can be switched on with one call.**
`zona-docs/docs/ZONA_REFERENCE.md:1255-1312` verifies `self.midirx_cb` reaches the touch element,
that host MIDI arrives with no configuration at all (`grxm` defaults set at every VM start), and that
`grxm(rx_type.MIDIRTM, ...)` plus `self.rtmrx_cb` is the only working clock-sync route on ZONA.
This is the unlock. Every "spectacular but useless" light show in the catalog becomes *useful* the
moment it breathes on the host's downbeat, and every "useful but dull" controller becomes
*spectacular* the moment its LEDs mirror what the host sends back. It costs characters, and it is
untested on hardware, but it is the single highest-leverage direction available to the twenty.

**Primary recommendation:** build the twenty as roughly 8 "both" configurations (spectacle and
utility, several of them clock-locked or MIDI-in-lit), 6 high-demand workhorses whose spectacle is
carried by legibility rather than motion, and 6 pure show-offs — because the catalog also has to sell
the module to somebody who does not own one yet.

---

## Part One — Evidence from this machine

### 1.1 `profile-cloud`: what the platform reveals, and what it does not

Read read-only at `C:\Users\sabot\Documents\Claude\profile-cloud` (fork of
`intechstudio/profile-cloud` at `5c3093c`, per `REDESIGN.md`).

**The configuration schema** (`src/lib/schemas.ts:14-48`) is exactly the shape PROJECT.md already
records:

| Field | Meaning for use-case research |
|---|---|
| `configType: "profile" \| "preset" \| "snippet"` | Whole-module / single-element / code fragment. A ZONA config is always a **preset** — one element, one budget. |
| `type` | `ModuleType` or `ElementType` string. Compatibility filtering only. |
| `name`, `description` | Free text. `description` defaults to the literal placeholder `"Click here to add description"` in every shipped example — see 1.2. |
| `virtualPath` | **User-authored folder string.** This is the only user-side taxonomy in the whole platform, and it is per-user, unmoderated, and invisible until you own the config. |
| `featured` | Intech-curated boolean, backed by a deployable id list. |
| `files` | Attachments. Unused in anything on disk. |

**There is no tag field, no category enum, and no controlled vocabulary anywhere.** Sorting is Name /
Date / Type only (`src/routes/Sorter.ts:5-22`).

**What the platform substitutes for tags** is the action-block search operator
(`src/routes/Filter.ts:107-125`): typing `$MidiZone` extracts every `--[[@short]]` marker out of a
config's Lua, resolves it through `grid.ActionBlock.shortToDisplayName`, and matches on the display
name. So on Profile Cloud, "what a config does" is literally "which action blocks it contains". Two
consequences for HANGAR: (a) there is no external vocabulary to align with, so HANGAR's feel-tags are
free; (b) the *capability* vocabulary is worth mining, and I did — see 1.4.

**Curation is by ownership, not by content** (`src/lib/components/tree/ConfigTree.ts:34-66`):

- `isRecommendedConfig` — config's **owner** id is in `RECOMMENDED_CONFIG_PROFILE_IDS` (4 accounts)
- `isWorkflowConfig` — owner is in `WORKFLOW_CONFIG_PROFILE_IDS` (**1 account**)
- `isFeaturedConfig` — `featured === true` or id in `FEATURED_CONFIG_IDS` (3 ids)

All from `Configuration.json:1-13`. The Storefront tabs are Explore / My Library / Community /
Workflows. **One account owns every official workflow pack.** That is a very small curated surface —
which is exactly the gap HANGAR fills, and it also means HANGAR's twenty will, on day one, be a
larger curated ZONA library than anything that exists.

**Seed data: none.** `static/` holds six SVGs and a favicon. `public/wc/` holds the built web
component. `tools/` holds two CDP scripts. The only data-bearing script,
`transfer-configs-to-dev.js`, copies `where("public","==",true)` from the production Firestore to the
dev one — i.e. the community catalog is **network-only and behind Firebase auth**. I did not query
it (no downloading, no sign-up). *So: no evidence on this machine about what community members
actually build.* That is a real gap and it should be stated as one rather than papered over.

**Thumbnails as a design precedent worth stealing:** `src/lib/components/ConfigThumbnail.svelte`
renders each config's *real shape* — module faces per type with the configured elements lit
(`REDESIGN.md` change log, `8a3f19b`). HANGAR already goes further with live simulation, but the
principle — a card should show its own topology at a glance — is the same one that should drive the
"what should the 81 LEDs show" column below.

### 1.2 `grid-editor`: first-party examples, and what they are worth

Read read-only at `C:\Users\sabot\Documents\Claude\grid-editor`.

**The bundled profiles are defaults, not use cases.** `src/content/` holds eleven JSON profiles in
two families: `test 1-{bu16,ef44,en16,pbf4,po16,tek2,vsn1l,vsn1r}.json` and
`pressure-sensitive-defaults-{bu16,pbf4,vsn1l}.json`. Every element in `test 1-en16.json` is the same
three blocks — `self:bmo(0) self:bmi(0) self:bma(127)`, a neutral `glc`, and `print('tick')` on the
Timer. Description on all of them: `"Click here to add description"`. These are the
getting-started/factory payloads loaded by
`src/renderer/runtime/getting-started-profile.ts:19` (`PROFILE_PATTERN = "../../content/*.json"`).
**No ZONA profile exists in that folder at all.** Zero first-party example ZONA configurations ship
with the editor. HANGAR's twenty would be the first library of them anywhere.

**The host applications Intech themselves name** — `configuration.json:56-99`, `RECOMMENDED_PACKAGES`:

| Package | Host application | What it implies people do |
|---|---|---|
| `package-ableton-js` | Ableton Live | Clip launching + 4-8 track control |
| `package-ableton-mixer-and-launch-control` | Ableton Live | Mixer + Session view, again |
| `package-photoshop` | Adobe Photoshop | Tool/brush/adjustment control |
| `package-lightroom-classic` | Lightroom Classic | Develop sliders, culling |
| `package-touchdesigner-parhover` (`function-store/TD_ParHoverMIDI_VSN1`) | TouchDesigner | Hover-a-parameter, turn-a-knob |
| `package-spotify` | Spotify | Transport / volume |
| `package-discord` | Discord | Mute, deafen, push-to-talk |
| `package-deej` | Windows audio | Per-application volume mixing |
| `package-active-win` | (OS) | **Auto-switch the config to the focused app** |
| `package-overlay` | (OS) | On-screen display of the value you are changing |
| `package-image-stream` | (OS) | Image/streaming output |
| `package-OSC-Control` (`Greg-Orca/package-osc`) | anything OSC | Third-party, personal account |

And the published workflow list at `intech.studio/us/workflows`: *Ableton Mixer and Launch control,
Ableton Selected Track Control, Grid DJ Compact, Control RME Totalmix, TouchDesigner control, Chord
Performer, Scaled Keyboard, Bluebox Mixer, Elektron Syntakt FX Live Performance, MIDI LFO
Modulations, Modular MIDI, Pitch & Mod Wheel – Scaled Keyboard, MIDI Composer, MCU, 64CTRL, LrCTRL.*
Categories on that page: **Audio, DAW, DAWless, DJ, Photography, Post-processing, Streaming, OBS
Studio.**

**The critical caveat, and it is a hard filter on this phase:** every one of the packages above
*requires Grid Editor running in the background* (Intech's own Packages doc says so, and
`ZONA_REFERENCE.md:1414` records the OSC package running in the Electron main process — "Close the
editor and OSC stops"). **HANGAR's whole premise is no Editor.** So anything on that list which
depends on a package is out of reach for a HANGAR configuration, and anything that works over raw
MIDI or raw HID is in reach. Sorting the list by that test:

- **In reach with no software at all:** Ableton mixer/clip control (plain MIDI), MCU (Mackie Control
  is MIDI notes/pitch-bend/SysEx, and `gmss` exists), Scaled Keyboard, Chord Performer, Pitch & Mod
  Wheel, MIDI LFO, Modular MIDI, DAWless gear (Syntakt, Bluebox), DJ, TouchDesigner (native MIDI in),
  OBS (**via plain HID keyboard hotkeys — no plugin needed**), Lightroom/Photoshop/Resolve/Premiere
  (via plain HID keyboard shortcuts).
- **Out of reach without the Editor:** deej per-app volume, active-win auto-switching, overlay OSD,
  Spotify, Discord's rich integration (though push-to-talk is just a keystroke), OSC of any kind.

### 1.3 `zona-docs`: how Intech-adjacent documentation pitches the module

Read read-only at `C:\Users\sabot\Documents\Claude\zona-docs\docs` (7,147 lines across seven files).

**The pitch, verbatim** (`ZONA_BRIEF.md:63`): *"Backgrounds that run themselves, armed once in
Setup: swirl, diagonal wave, scanning bar, expanding rings, breathing, drifting colour. Touch on
layer 1 over the top: a glow following the finger, a finger that bends the wave by rewriting nearby
phases, ripples launched by a tap and left running in firmware, five contacts keyed by `id`. Then
the musical layers: 14-bit CC or NRPN from 1024 steps per axis, a note per contact with pitch bend
from X."*

Note the ordering: **look first, control second.** That is Intech's own framing and it matches
HANGAR's brief exactly.

**The recipe book's own job taxonomy** (`ZONA_RECIPES.md` table of contents) is the closest thing
to a use-case list that exists for this module:

| Part | Recipes | Job |
|---|---|---|
| A (A1-A9) | Swirl, diagonal wave, scan, radar rings, breathing pulse, colour movement, two-layer composite, shimmer/starfield, logo sweep | **Living background** — costs nothing while you play |
| B (B1-B6, B5w) | Finger glow, touch disturbs background, expanding bloom, comet trail, per-contact colour, watchdog, clear-and-repaint | **Touch that interacts with the motion** |
| C (C1-C10) | XY→2 CCs; 14-bit/NRPN/pitch-bend; 4x4 note pads; visible pads; 3x3 chessboard; gestures (tap/hold/swipe); **modal ZONA**; cross-module `immediate_send`; 4 faders with meters; 3 faders with rails; 4 faders `W#W#W#W#W`; **two-finger scroll with pointer, tap and right-click** | **Making it also do something musical (or pointer-shaped)** |
| D | Four complete builds (Aurora 305ch, Pinwheel 365ch, Radar XY 414ch, +1), budget ledger, shrinking Lua, diagnostic probe | **Practical** |

**The GUI spec's named jobs** (`ZONA_GUI_SPEC.md:613-668`) — Intech's fork-side product spec picks
exactly four first-evening jobs and names them: **I1 pad grid**, **I2 faders**, **V1/V4 living
background**, **C1-C3 trackpad**. It also names what it deliberately will not build in v1:
*"Freeform zone placement. Per-cell painting. Gestures. Modes on one pad. Two independent regions.
Driving another module. Anything that reads DAW state, which has no working path at all."*
(`ZONA_GUI_SPEC.md:110-114`). Three of those six — gestures, modes on one pad, two independent
regions — are exactly the territory a *catalog* can occupy that a *configurator* cannot, because a
catalog ships finished things.

**The trackpad is treated as a whole product on its own** (`ZONA_SCROLL.md`): one finger moves the
pointer, two fingers scroll vertically, one-finger tap left-clicks, two-finger tap right-clicks;
Setup is 893 of 908 characters with fifteen spare; the GUI spec gives it a permanent quiet line,
*"Uses the whole pad. Nothing else fits alongside it."* Three things firmware cannot do are listed
as disabled rows with reasons: **horizontal scroll** (both `tud_hid_mouse_report` call sites pass a
literal 0 for AC Pan), **click and drag**, and **absolute pointer**.

**And there is a whole prior research file on the single biggest friction in XY-pad adoption**
(`XY_LEARN_EVIDENCE.md`, compiled 2026-08-28, 143 lines, every URL fetched and read). Its verdict:
MIDI learn in every major DAW binds a parameter to the next incoming message, so a surface that
sends X and Y at once is inherently ambiguous to map. Documented across Kaoss Pad 1/KP3/NTS-3, Korg
padKONTROL, nanoPAD/nanoPAD2, TouchOSC, Lemur and Renoise, 2005-2025; Bitwig, Apple, Ableton,
Steinberg, Image-Line, Native Instruments and Renoise all document the bind-next mechanism; and
**Sensel admits the problem in the Morph's own manual** and prescribes disabling two dimensions while
learning. Its own safe-phrasing note warns against calling it a backlash.

> **Direct implication for the twenty.** Any XY configuration should ship a *mapping mode* — a
> deliberate way to send X alone and then Y alone — or HANGAR is shipping the exact frustration the
> evidence file documents. On a 9x9 lit pad this can be made beautiful rather than apologetic: light
> only the bottom row and send only X, then only the left column and send only Y. That is a knob
> ("Mapping helper: off / X only / Y only"), it is cheap, and *no competitor product does it on the
> device itself.* It is a differentiator hiding inside a papercut.

### 1.4 What a ZONA can actually emit — the capability envelope

Everything in this table is verified in `ZONA_REFERENCE.md` §6.3-6.6 against firmware source, plus
the action-block set in `grid-editor/src/renderer/config-blocks/`.

| Channel | Call | Range / shape | Notes |
|---|---|---|---|
| MIDI voice | `gms(ch, cmd, p1, p2 [,mode])` | 7-bit; **mode 1 = 14-bit CC**, mode 3 = NRPN | `p2 = -1` is broken on touch elements — always pass p2 explicitly (`:1179`) |
| MIDI pitch bend | raw `gms(0,224,v%128,v//128)` | 14-bit | No mode; split yourself |
| MIDI aftertouch | `gms(0,208,y//8,0)` | channel pressure | Not from real pressure — ZONA has none |
| MIDI SysEx | `gmss(...)` | ~122 data bytes per call | Enables MMC, MCU, and vendor protocols |
| **MIDI in** | `self.midirx_cb`, `sysexrx_cb`, `eventrx_cb`, `rtmrx_cb` | header[1]==13 is host traffic, 14 is own echo | **Works with no Editor.** Clock is off by default; `grxm(rx_type.MIDIRTM, ...)` turns it on |
| HID keyboard | `gks(delay, is_mod, state, keycode, ...)` | USB HID usage ids; `state 2` = down-then-up; `is_mod 15` = a delay step | Full macro capability |
| HID mouse | `gmms(axis, delta)` / `gmbs(buttonmask, state)` | axis 1=X, 2=Y, **3=wheel**; delta -128..127; buttons 1=L, 2=R, 4=M | **Relative only.** No absolute pointer, no horizontal wheel |
| HID gamepad | `ggms(axis, pos)` / `ggbs(bit, state)` | axes 0..5 = X,Y,Z,RX,RY,RZ; 32 buttons | Fully usable as a stick/throttle |
| Cross-module | `gis(x, y, luastring)` | 909-char payload, executes remotely | Verified in source, **untested in a rig**; loops back to sender |
| OSC | — | **does not exist in firmware** | No IP stack at all. Editor-package only |
| Absolute pointer / digitizer | — | **does not exist** | ZONA cannot present as a touchscreen |

**The constraints that kill otherwise-good ideas** (`ZONA_BRIEF.md` §3, `PROJECT.md` Context):

1. **One control element, two events, 908 characters each.** A configuration is a whole product, not
   a component. Two independent regions cost real bytes.
2. **Five contacts, but the Lua shim pops one sample per 100 Hz cycle.** One finger arrives intact;
   five lose 80 percent. Anything requiring genuine simultaneous multitouch expression (real MPE,
   two-hand chords with independent bend) is *not honestly deliverable* and must not be promised.
3. **No pressure, no contact area.** Velocity has to come from position, gesture speed, or a fixed
   value. Say so on the card.
4. **Event code 9** is a tap that arrives as one message with no release behind it. Latching
   configurations need `e==3 or e>=5`, and anything that holds state needs the B5w watchdog.
5. **Fractional numbers silently become 0** in Lua 5.5 firmware calls. Integer division everywhere.
6. **A page change destroys the Lua VM.** Modes live inside one page (`ZONA_RECIPES.md` C5) or not
   at all.
7. **Backgrounds freeze after ~11 minutes** without the Timer keeper.

### 1.5 HANGAR's existing sixteen — the baseline the twenty must not duplicate

From `hangar/src/lib/catalog/entries/`:

| Id | One line | Tags |
|---|---|---|
| `aurora` | Diagonal wave + comet trail | ambient, flowing, colour |
| `pinwheel` | Rotating swirl + per-contact trails | rotating, multi-touch, colour |
| `starfield` | Shimmer | ambient, generative, calm |
| `radar` | Expanding rings + XY | rippling, xy-control, hypnotic |
| `joystick` | Sprung pitch bend | expressive, pitch-bend, sprung |
| `ninepads` | 3x3 note pads | drums, playable, grid |
| `faders` | Column faders with rails | mixing, readable, rails |
| `dial` | Endless rotary | endless, gestural, precise |
| `tpad` | Two-finger trackpad (rests black) | desktop, pointer, utility |
| `EUCLID` | Three Euclidean rings beating against each other | polyrhythm, generative, drums, playable |
| `CHORUS` | Nine chord pads, bloom from the hit | chords, harmonic, blooming, playable |
| `ARC` | Draw a modulation shape; it keeps sending | modulation, hands-free, hypnotic, gestural |
| `GHOST` | A ghost retraces your drag forever | looper, automation, gestural, generative |
| `LATTICE` | Whole pad tuned in fourths | isomorphic, playable, still, instrument |
| `MORPH` | Four corner macros, weights as brightness | macros, blend, readable, expressive |
| `SONAR` | Radar sweep fires armed cells | radial, sequencer, polar, hypnotic |

**What is already covered:** ambient backgrounds, drum pads, chord pads, faders, an XY, an
isomorphic keyboard, a vector morph, two sequencers, a gesture looper, a trackpad.

**What is conspicuously absent:** anything clock-locked to a host; anything lit by MIDI coming *in*;
anything HID-keyboard (macros, OBS, editing, IDE); anything gamepad; anything DJ; anything for
lighting or visuals; anything with a latch/hold; anything explicitly accessibility-shaped; and any
toy. Six of those eight absences are cheap and at least three of them are "both" quadrant.

---

## Part Two — The wider world

Each entry: **who**, **host**, **what X and Y naturally mean**, **what the 81 LEDs should show**,
**MIDI / HID / both**, and a two-axis score — **Demand** (how many of the ZONA owners would want it,
1-5) and **Spectacle** (how it looks while being used, 1-5).

### 2.1 Music production in a DAW

**M1 — Device macro XY (the Kaoss job, done properly)**
Who: any producer. Host: Ableton Live, Bitwig, FL Studio, Logic — every one of them has a
two-parameter pairing worth a hand (filter cutoff × resonance is the canonical one; Live's Rack
Macros go up to sixteen and are explicitly designed to be mapped from a controller). X = cutoff /
first macro, Y = resonance / second macro. LEDs: a crosshair — full row and full column through the
finger — so the *value on each axis* is legible even after you lift, plus the mapping helper mode.
MIDI. **Demand 5, Spectacle 3.** With a living background under it, Spectacle 4.

**M2 — Clip / scene launcher**
Who: Live and Bitwig performers. Host: Ableton Session view, Bitwig clip launcher. X = track,
Y = scene. 81 clips is more than a Launchpad's 64. LEDs: one cell per clip; the whole point of a
Launchpad is that *"all 64 RGB pads light up to match the colour of clips in Ableton Live so you can
see at a glance what's loaded, playing and recording."* Without a package, ZONA cannot read clip
colour — **but it can be lit by MIDI in**, and Live's "Launchpad" style scripts send note-on colour
messages. Honest position: ship it lighting *local* state (armed / just-fired / holding), and offer
MIDI-in colouring as a knob for users who feed it. MIDI, both directions.
**Demand 5, Spectacle 5 — but the feedback half is the risky part. Highest value, highest risk.**

**M3 — Mixer strip (faders, pans, sends)**
Who: everyone who mixes. Host: any DAW; Mackie Control (MCU) is the universal protocol and Intech
already ships an MCU workflow; RME TotalMix is on their list too. X = which strip, Y = level. LEDs:
vertical bars over a dim track, with white rails on the touch boundaries — `ZONA_RECIPES.md` C7-C9
already solves the layout three ways and C9 (`W#W#W#W#W`) puts rails exactly on the boundaries.
MIDI. **Demand 5, Spectacle 2.** `faders` covers the basic case; an 8-strip MCU version is new.

**M4 — Step sequencer**
Who: beat makers. Host: any DAW, or hardware. Launchpad Pro ships *"a powerful four-track, 32-step
sequencer with eight-note polyphony, pattern chaining and scenes."* On 9x9: 8 tracks × 8 steps with
a column reserved, or 9 × 9. X = step, Y = track/pitch. LEDs: lit cells are armed, a bright column
sweeps as the playhead, the fired cell flashes. **This is the archetypal spectacular-and-useful grid
config** and it becomes far better with MIDI clock in. MIDI both ways.
**Demand 4, Spectacle 5.** `EUCLID` and `SONAR` are adjacent but neither is a plain step grid.

**M5 — Scale-aware note grid**
Who: producers who do not play keys. Host: any. Push folds a keyboard onto the pads and offers
Chromatic vs **In Key** mode, and layout options including 4ths, plus Fixed/non-Fixed root
behaviour. X = scale degree, Y = octave/row offset. LEDs: root notes bright, in-key notes dim, out-of
-key dark — the layout teaches itself. MIDI. **Demand 4, Spectacle 3.** `LATTICE` covers fourths;
an in-key folded variant with a visible root is a different, more beginner-friendly product.

**M6 — Drum rack with velocity-from-position**
Who: beat makers. Host: Drum Rack, Battery, Maschine. ZONA has no pressure, so velocity must come
from Y within the pad, which is exactly what a 9x9 makes possible: 3×3 pads, each three cells tall,
so the pad *shows* the three velocity bands. X = pad column, Y = pad row **and** velocity within it.
LEDs: nine coloured squares, the struck one blooms, the height of the bloom = velocity sent. MIDI.
**Demand 5, Spectacle 4.** `ninepads`/`CHORUS` are adjacent; the velocity idea is new and it turns
a hardware limitation into a visible feature.

**M7 — High-resolution automation lane**
Who: sound designers, mixers. Host: any DAW that accepts 14-bit CC / NRPN / pitch bend. ZONA's axes
unlock to 0..1023 (`self:txma(1023)`), which is genuinely more resolution than 7-bit MIDI can carry —
and `gms` mode 1 and 3 exist for exactly this. X = the parameter, Y = a second parameter or a fine/
coarse switch. LEDs: a long bar with a fine vernier row. MIDI.
**Demand 3, Spectacle 2.** Low spectacle, but it is a real claim no 7-bit controller can make.

**M8 — Chord performer**
Covered by `CHORUS`. Intech ship a "Chord Performer" workflow, so demand is confirmed.
**Demand 4, Spectacle 4.**

### 2.2 Live performance

**P1 — Latching effect XY (the Kaoss move)**
Who: electronic performers, DJs, guitarists with pedals. Host: Live, Bitwig, Kaoss-style plugins,
hardware. Korg's own copy: *"different effect parameters are assigned to the X-axis and Y-axis and
can be controlled simultaneously… complex operations that would normally require two hands can be
performed easily with just one."* The performance-critical behaviour is **hold**: lift your finger
and the last value stays. X and Y = the two effect parameters. LEDs: the held dot stays lit and
*pulses*, so the room can see the effect is still engaged; a "released" version dims to nothing.
MIDI. **Demand 5, Spectacle 4. This is a "both". Nothing in HANGAR latches yet.**

**P2 — Crossfade / blend**
Who: DJs, live electronic acts, VJs. Host: Live crossfader, Traktor, Serato, Resolume. X = A↔B,
Y = filter or FX depth. LEDs: two colours meeting at the finger — the split moves with you, which
reads across a stage. MIDI. **Demand 3, Spectacle 5.** Extremely photogenic, trivially legible.

**P3 — Beat-repeat / loop-roll pads**
Who: DJs, finger drummers. Host: Live's Beat Repeat, Traktor's Pad FX (Echo, Flanger, Reverb,
Repeater, Backspin, Braker), Serato's Hot Loop/Manual Loop modes. X = which roll, Y = subdivision
(1/4 → 1/32). LEDs: the active roll strobes **at its own rate**, so the grid visibly ratchets faster
as you move up. MIDI. **Demand 3, Spectacle 5. A "both" for the DJ slice of the audience.**

**P4 — Pseudo-MPE / per-contact expression**
Who: expressive players. Host: Bitwig, Logic, Equator, Quanta — MPE gives each finger independent
pitch, timbre and volume. **ZONA cannot honestly do MPE:** five contacts exist but one sample per
100 Hz cycle means five fingers lose 80% of their data, and there is no pressure at all. What *is*
honest is **two contacts on two channels**, each with X→bend and Y→CC. LEDs: one colour per contact
id (already proven in `pinwheel`), plus a bend-line trailing each finger. MIDI.
**Demand 3, Spectacle 4 — ship it, but name it honestly. Do not print "MPE" on the card.**

**P5 — One hand on the pad while the other plays**
Who: keyboardists, guitarists. Host: any. This is the mod-wheel/expression job and it is why an XY
pad sits *next* to a keyboard rather than replacing it. X = mod, Y = expression, sprung return to
centre. LEDs: a spring-back animation that visibly relaxes when you let go — the motion *is* the
affordance. MIDI. **Demand 4, Spectacle 3.** `joystick` covers the pitch-bend case.

**P6 — Gesture looper / drawn LFO**
Covered by `ARC` and `GHOST`. Intech's own "MIDI LFO Modulations" workflow confirms demand.
**Demand 3, Spectacle 5.**

### 2.3 Sound design and synthesis

**S1 — Vector / four-corner morph**
Who: synthesists. Host: Logic's vector synthesis (*"vector mixing lets you crossfade or XY-morph
between four sources"*), Live's Rack chains, u-he Zebra, hardware vector synths. X/Y = position in
the square; four corner weights sent as four CCs. LEDs: four corner glows whose brightness *is* the
weight. **`MORPH` already ships exactly this.** **Demand 4, Spectacle 4.**

**S2 — Wavetable position × filter**
Who: sound designers. Host: Serum, Live's Wavetable, Vital, Massive X. X = table position, Y =
cutoff or warp. LEDs: **draw the waveform** — each column a bar whose height is the sample value of
the current wave, redrawn as X moves. That is a genuinely new visual nobody has on hardware.
MIDI. **Demand 3, Spectacle 5. Strong "both" for the synth crowd.**

**S3 — Granular cloud**
Who: ambient / experimental producers. Host: Live's Granulator, Quanta, Portal, Kyma. Grain-cloud
parameters are canonically position, duration, density and dispersion. X = grain position in the
sample, Y = density/size. LEDs: a literal cloud — scattered dots that thicken and spread as Y rises,
scattered around the X column. MIDI. **Demand 2, Spectacle 5.** Beautiful, niche.

**S4 — Modulation matrix**
Who: patchers. Host: any synth with a mod matrix; also Bitwig's modulators. 9 sources × 9
destinations = 81 cells, exactly. Tap a cell to arm a routing; hold and slide up for depth. LEDs:
lit cells = live routings, brightness = depth. It is the only configuration where 81 is not a
coincidence. MIDI (CCs) or SysEx. **Demand 2, Spectacle 3.** Conceptually gorgeous, practically
depends on the synth accepting CC-per-routing. Flag as a stretch.

**S5 — Random / scatter generator**
Who: generative people. Host: any. Tap to fire a burst of randomised CCs within a range set by
finger position. LEDs: sparks radiating from the tap. MIDI. **Demand 2, Spectacle 4.**

### 2.4 Visuals, lighting and show control

**V1 — TouchDesigner parameter control**
Who: TD artists, installation builders. Intech already ship a TouchDesigner workflow and recommend
`function-store/TD_ParHoverMIDI_VSN1` — the "hover a parameter, move a control" pattern. TD reads
MIDI natively, no Editor needed. X/Y = any two float parameters. LEDs: whatever the config wants —
and because TD can *send* MIDI back, a TD patch can drive the 81 LEDs from the render. MIDI both
ways. **Demand 3, Spectacle 5. This is the most under-served audience on the list and it is one
Intech already courts.**

**V2 — Resolume clip trigger + FX**
Who: VJs. Host: Resolume Arena/Avenue — the Windows industry standard for live visuals; mapping a
MIDI controller to clips and effects is standard practice. X = column (clip), Y = layer. LEDs: the
grid mirrors the composition grid; the playing clip pulses. MIDI. **Demand 2, Spectacle 5.**

**V3 — Lighting colour picker**
Who: lighting designers, small-venue ops, anyone with RGB fixtures. Host: grandMA2/3, ChamSys MagicQ
(*"any MIDI Note or CC message received will be assigned to trigger the currently selected execute
box"*), or a DMX box with MIDI in. X = hue, Y = saturation. **LEDs: the pad literally becomes the
colour wheel — you are picking the colour on a surface that is showing you the colour.** This is the
single most self-evident config on the entire list; it needs no legend. MIDI.
**Demand 3, Spectacle 5. A "both", and the most demo-able thing in the catalog.**

**V4 — Cue-list trigger**
Who: LDs, theatre, worship tech. Host: grandMA (assign a MIDI note to an executor), ChamSys (MIDI
learn on execute boxes), QLab. 9 or 16 big cue zones. LEDs: the fired cue holds a bright ring; the
next cue in the list breathes gently — *a GO button that shows you what's next*. MIDI.
**Demand 2, Spectacle 3.**

**V5 — OBS scene switcher, with no plugin at all**
Who: streamers, podcasters, teachers. Host: OBS Studio. The MIDI route needs `obs-midi-mg` or
MIDIControl; **the HID route needs nothing** — OBS hotkeys are plain global keystrokes, so a ZONA
sending `Ctrl+Shift+F1..F9` switches scenes on a machine with zero extra software installed. X/Y =
scene grid. LEDs: nine big zones, the live scene glows red, the previewed one amber. HID.
**Demand 4, Spectacle 3. A "both", and the cheapest one to build.**

**V6 — Camera / PTZ pan-tilt**
Who: streamers, AV ops. Host: PTZ software, vMix, OBS with a PTZ plugin. X = pan, Y = tilt, absolute
position. LEDs: a mini-map of the room with the current framing lit. MIDI or gamepad HID.
**Demand 1, Spectacle 3.**

### 2.5 Non-audio professional work

**N1 — Trackpad**
Who: laptop-averse desk workers, anyone short of desk space. Already shipped as `tpad`; Sensel's
Morph is reviewed as *"the perfect trackpad controller for musicians and other creatives"*, which is
the whole pitch. Constraints are documented and hard: no horizontal scroll, no click-and-drag, no
absolute pointer. HID. **Demand 4, Spectacle 1** — the honest note is that `tpad` rests black, and
`frames.spec.ts` already records that.

**N2 — Video editing shuttle**
Who: editors. Host: Premiere Pro, DaVinci Resolve, Final Cut. J/K/L shuttle is universal; Loupedeck
and Stream Deck built entire businesses on this. X = shuttle speed (repeated J/L keystrokes, faster
the further out), Y = zoom (`-`/`=`) or track selection. LEDs: a speedometer — a bar that extends
further and pulses faster the harder you shuttle. HID keyboard, using `gks`'s built-in delay steps.
**Demand 3, Spectacle 4. A "both" and nothing in HANGAR is HID-keyboard yet.**

**N3 — Colour grading wheel**
Who: colourists. Host: DaVinci Resolve. Resolve takes no MIDI natively; a real grading panel speaks
its own protocol. What *is* reachable is keyboard shortcuts and mouse deltas. Honest version: the
pad drives the mouse as a fine trim wheel over whatever control is under the cursor, with X and Y as
two-axis relative deltas. LEDs: a colour wheel with your offset dot. HID mouse.
**Demand 2, Spectacle 4 — but flag it: without absolute pointer this is fiddly.**

**N4 — Photo culling grid**
Who: photographers. Host: Lightroom Classic, Capture One, Photo Mechanic. Intech ship LrCTRL and
`package-lightroom-classic`, but the culling shortcuts (`P` pick, `X` reject, `1`-`5` stars, arrow
keys) are plain keystrokes and need nothing. 9 big zones: reject / pick / five stars / next / prev.
LEDs: each rating a distinct colour **and a distinct shape** (colour-independent state is explicitly
required by `ZONA_GUI_SPEC.md` §7.7). HID.
**Demand 3, Spectacle 2.** Low spectacle, high real utility, big audience.

**N5 — Photoshop / illustration brush control**
Who: digital artists, retouchers. Host: Photoshop, Krita, Affinity. X = brush size (`[` / `]`
repeated), Y = opacity (number keys `1`-`0`, which set opacity directly). LEDs: a circle whose
radius is the brush size — legible at a glance. HID.
**Demand 2, Spectacle 3.** The `[`/`]` repetition is crude; state has to be tracked locally and can
drift out of sync with the app. Flag that.

**N6 — 3D view cube**
Who: Blender / CAD users. Host: Blender (numpad 1/3/7 front/side/top, 5 ortho, 0 camera), Fusion,
SolidWorks. Nine zones = nine canonical views; the middle band = orbit via mouse deltas. LEDs: an
isometric cube drawn on the 9x9, the active face lit. HID keyboard + mouse.
**Demand 2, Spectacle 4.** The cube drawing is a very good-looking static image.

**N7 — IDE / terminal macro pad**
Who: developers. Host: VS Code, JetBrains, tmux, a shell. The documented archetypes are build/run,
format, git add-commit-push, toggle terminal, jump to file. Nine or sixteen zones. LEDs: one colour
per macro family, a flash on fire; a "modifier held" state for a second bank
(`ZONA_RECIPES.md` C5 modal, 145 characters). HID keyboard.
**Demand 3, Spectacle 2.** ZONA owners skew creative, but developers buy macropads in volume.

**N8 — App / window switcher**
Who: everyone with too many windows. Host: OS. Nine zones = nine apps via `Win`+`1..9` (Windows
taskbar) or a launcher hotkey. LEDs: nine 3×3 glyph blocks — crude app icons drawn in LED, which
suits HANGAR's glyph-field visual identity exactly. HID keyboard.
**Demand 3, Spectacle 3.**

**N9 — Meeting / streamer control**
Who: remote workers, streamers. Host: Discord (push-to-talk, mute, deafen — Intech ship a Discord
package, but the keystrokes work without it), Zoom, Teams. LEDs: **a whole-pad red field when
muted.** Impossible to miss across a room, which is the actual product. HID keyboard.
**Demand 4, Spectacle 3.** Cheap, universally understood, and a great screenshot.

### 2.6 Accessibility and ergonomics

**A1 — One enormous target**
Who: users with limited fine motor control; also anyone who wants a panic/mute key. The whole 81-LED
pad is one button. The affordance argument is the same one that sells large-surface assistive
touchpads (the Cirque Smart Cat's *"extra-large touch surface"*, the Magic Trackpad's large smooth
surface). X and Y are ignored — deliberately. LEDs: the entire grid is the state, full-field colour,
with a shape change (filled vs ring) so it does not depend on colour vision. HID or MIDI.
**Demand 2, Spectacle 3.** Small audience, real value, trivially cheap in characters.

**A2 — Four huge quadrants**
Who: same. Four 4×4-ish zones with distinct colours *and* distinct patterns (solid / ring / cross /
checker), because `ZONA_GUI_SPEC.md` §7.7 requires colour-independent state and §7.5 specifies
measured contrast. HID. **Demand 2, Spectacle 2.**

**A3 — Reduce keyboard reach**
Who: RSI sufferers, one-handed users, people editing with a pen in the other hand. This is the same
job as the macro pad (N7), reframed: the value is that the modifier chords live on a flat surface a
palm away rather than across a keyboard. HID. **Demand 3, Spectacle 2.**

**A4 — Reduced-motion behaviour, as a first-class card state**
Not a configuration but a property every configuration needs: `prefers-reduced-motion` snapping to a
representative static frame is already in `pad-sim-host.ts`, and §7.6 of the GUI spec treats it as a
requirement. Any twenty that are *only* legible while moving fail this.

### 2.7 Play

**Y1 — Analog stick / throttle (gamepad HID)**
Who: sim racers, flight simmers, emulator users. Host: any game — a device that identifies as a
standard USB HID game controller works with Microsoft Flight Simulator, X-Plane, DCS and every
Windows sim. X/Y → `ggms` axes 0/1, or Y → throttle on axis 2. LEDs: a deadzone ring with your stick
position lit inside it; for throttle, a bar with a detent mark. HID gamepad.
**Demand 2, Spectacle 4 — and it is a category nobody expects a music-hardware company to ship.**

**Y2 — Snake / Pong / a playable game**
Who: everybody, for thirty seconds. Host: none — it runs on the module. LEDs: the game *is* the
display. Pure Spectacle 5, Demand 1, and **Shareability 5**: this is the card that gets posted to
Discord. HANGAR's core value is "half a minute later the pad is doing something spectacular" — a
game is the fastest possible route to that sentence being true.

**Y3 — Conway's Life**
Who: same. Tap cells to seed, firmware time evolves them. LEDs: the automaton. The whole thing is a
Timer-event loop over an 81-cell state — expensive in characters but conceptually perfect for 9×9.
**Demand 1, Spectacle 5.**

**Y4 — Etch-a-sketch / drawing**
Who: everyone. Draw with a finger, cells stay lit, a fast swipe clears. Optionally each cell sends a
note as you draw it, which makes it a drawing *instrument*. MIDI optional.
**Demand 2, Spectacle 4.**

**Y5 — Ambient desk object**
Who: anyone with a ZONA sitting idle. The catalog's ported presets already serve this
(`aurora`, `starfield`). A stronger version is one that means something: a visual metronome locked
to MIDI clock, a pomodoro ring that drains over 25 minutes, or a VU meter driven by CC from the host.
**Demand 3, Spectacle 4** — because "my controller is beautiful when I'm not using it" is a real
reason people keep hardware on the desk.

---

## Part Three — Ranking

Plotted on the two axes asked for. Scores are the Demand and Spectacle numbers above.

```
                        S P E C T A C L E  →
        1       2       3       4       5
D   5   ·       M3      M1      M6      M2  P1
E                       (mixer→ (drums   (clips) (latch XY)
M                        MCU)    velocity)
A   4   N1      N4/A3   V5 N9   M8 P5   M4
N       (tpad)  (cull)  (OBS,   (chords, (step seq)
D                       mute)    spring)
↓   3   ·       M7 N7   M5 V4   N2 P4   V1 P2 P3 S2 Y5
                (14bit, (in-key,(shuttle,(TouchDesigner,
                 macro)  cues)   2-hand)  crossfade, rolls,
                                          wavetable, ambient)
    2   ·       A2      N5 N8   N3 N6    V2 V3 S3 S5 Y1 Y4
                                 (grade,  (Resolume, colour
                                  cube)    wheel, grain, stick)
    1   ·       ·       V6      ·       Y2 Y3
                                        (games, Life)
```

### The ones that are BOTH — build these first

| # | Configuration | Why both |
|---|---|---|
| 1 | **Latching effect XY (P1)** | Highest-demand performance gesture there is, and the held-and-pulsing dot is the most legible "something is happening" a pad can show. Nothing in HANGAR latches. |
| 2 | **Step sequencer with a playhead (M4)** | The archetypal grid config. A sweeping column is the single most watchable thing 81 LEDs can do, and it is genuinely how people write drums. Doubles in value with MIDI clock in. |
| 3 | **Drum grid with velocity-from-position (M6)** | Turns "ZONA has no pressure" from an apology into a visible feature: the bloom height *is* the velocity you sent. |
| 4 | **Clip / scene launcher (M2)** | Biggest audience (Ableton three times on Intech's own workflow list), biggest visual payoff, and the one that most benefits from MIDI-in colouring. Also the riskiest. |
| 5 | **Lighting colour picker (V3)** | The pad shows the colour it is sending. Zero legend required, instantly understood by anyone who walks past, and it opens an audience Grid does not currently serve. |
| 6 | **Tempo-locked living background + XY (new, from §1.3)** | Takes what the module is *already* best at — free firmware animation — and makes it musically meaningful by locking it to `rtmrx_cb`. Costs almost nothing while you play, per Intech's own copy. |
| 7 | **OBS scene switcher over plain HID (V5)** | Works on a machine with no software installed at all, which is HANGAR's whole thesis. Live scene glowing red is a strong card image. |
| 8 | **Video shuttle (N2)** | Opens the entire Loupedeck/Stream Deck audience with keystrokes only, and the speedometer visual is genuinely new. |

### The workhorses — high demand, spectacle carried by legibility

M3 (MCU mixer), M1 (device macro XY with the mapping helper), M5 (in-key note grid),
N4 (photo culling), N9 (mute/meeting), N7 (IDE macros), A3 (reach reduction).

For these, "spectacular" has to mean **beautifully readable at rest**, not moving — rails on the
touch boundaries, a bar over a dim track, root notes brighter than in-key notes. `faders` and
`LATTICE` already prove this reads well on a card.

### The show-offs — low demand, maximum shareability

Y2/Y3 (games), S3 (granular cloud), S2 (wavetable drawing), V2 (Resolume), P2 (crossfade),
Y4 (drawing). The catalog needs these: a large share of HANGAR's visitors will never own a ZONA and
the site has to be worth opening anyway.

### Deliberately NOT recommended

| Idea | Why not |
|---|---|
| Anything marketed as **MPE** | One touch sample per 100 Hz cycle and no pressure. Five fingers lose 80% of their data. Promising MPE would be dishonest. Ship two-contact expression and call it that. |
| Anything needing a **Grid Editor package** (deej, active-win, overlay, Spotify, OSC) | Requires the Editor running. HANGAR's premise is no Editor. |
| Anything needing an **absolute pointer** or a **digitizer** | Verified absent from firmware. |
| **Horizontal scroll**, **click-and-drag** | Both firmware limits, already documented as disabled rows in the GUI spec. |
| **Anything reading DAW state via a script** | No path without the Editor. MIDI-in is the only feedback channel and it is the host's job to send it. |
| **OSC** | No IP stack in firmware at all. |
| **Freeform per-cell painting configs** | The GUI spec rules it out for good reasons; a catalog entry that requires the user to paint 81 cells is not a catalog entry. |

---

## Part Four — Shortlist: 44 candidate configurations

Working name — use case — visual idea. None duplicates the existing sixteen.
(Cut to twenty later; "both"-quadrant entries are marked ★.)

**Performance and DAW**

1. **HOLD** ★ — latching effect XY (P1); the released dot stays lit and pulses like a held breath.
2. **CROSSFADE** — A/B blend + filter (P2); two colour fields meeting at a moving seam.
3. **STEPS** ★ — 8×8 step sequencer (M4); armed cells glow, a bright column sweeps, hits flash white.
4. **SLAM** ★ — 3×3 drum pads, velocity from height within the pad (M6); the bloom height is the velocity.
5. **GRIDLOCK** ★ — 81-clip launcher (M2); a fired clip ripples outward, MIDI-in can recolour the grid.
6. **CONSOLE** — 8-strip MCU mixer (M3); eight bars over dim tracks with white rails on the boundaries.
7. **STRIP** — one whole-pad 14-bit fader (M7); a single huge bar with a vernier row for fine trim.
8. **KEYS** — in-key folded note grid (M5); roots bright, scale dim, out-of-key dark.
9. **RATCHET** — beat-repeat rolls, subdivision on Y (P3); the held pad strobes at the rate it is sending.
10. **DUET** — two contacts, two independent XY pairs on two channels (P4); one colour per finger, each trailing a bend line.
11. **SPRING** — mod/expression with sprung return (P5); the whole grid visibly relaxes when you let go.
12. **LEARN** — the mapping-helper config (from `XY_LEARN_EVIDENCE.md`); lights only the bottom row while sending X, only the left column while sending Y. Solves a twenty-year papercut on the device itself.

**Clock and feedback (the MIDI-in family)**

13. **PULSE** ★ — background locked to host MIDI clock; the whole grid breathes on the downbeat, bars sweep.
14. **TRANSPORT** ★ — a clock-driven playhead bar, one column per sixteenth, plus an XY over the top.
15. **LEVELS** — VU meter fed by CC from the host; two bars dance with the mix.
16. **MIRROR** — grid lit entirely by inbound MIDI notes; a canvas the host paints (the Launchpad trick, no Editor).
17. **METRONOME** — visual click locked to clock, with tap-tempo out; count-in ring drains around the edge.

**Sound design**

18. **TABLE** ★ — wavetable position × filter (S2); the grid *draws the waveform* as a column plot that morphs with X.
19. **GRAIN** — granular cloud (S3); scattered dots thickening and dispersing with density.
20. **MATRIX** — 9×9 modulation matrix (S4); lit cells are live routings, brightness is depth. The only config where 81 is not a coincidence.
21. **SCATTER** — tap fires a randomised CC burst (S5); sparks radiate from the touch.

**Visuals, lighting and show**

22. **LUMEN** ★ — hue × saturation colour picker for DMX (V3); the pad *is* the colour it is sending.
23. **CUE** — 9 cue-list GO buttons for grandMA/ChamSys/QLab (V4); fired cue holds a ring, the next one breathes.
24. **PATCH** — TouchDesigner two-parameter control (V1); a minimal crosshair, plus a MIDI-in mode so TD can drive the LEDs.
25. **DECKS** — Resolume layer/clip grid (V2); the composition grid mirrored, playing clip pulsing.
26. **STAGE** ★ — OBS scene switcher over plain HID hotkeys (V5); live scene glows red, preview amber, no plugin.
27. **FRAMING** — PTZ pan/tilt (V6); a room mini-map with the current framing lit.

**Desktop and professional**

28. **SHUTTLE** ★ — J/K/L video shuttle + zoom (N2); a speedometer arc that extends and pulses faster the harder you scrub.
29. **CULL** — photo rating grid (N4); each rating its own colour *and* its own shape.
30. **BRUSH** — brush size × opacity for Photoshop/Krita (N5); a circle whose radius is the brush size.
31. **CUBE** — Blender/CAD nine-view cube (N6); an isometric cube drawn on the 9×9, active face lit.
32. **FORGE** — IDE/terminal macro pad (N7); one colour per macro family, hold-for-second-bank via the C5 modal trick.
33. **SWITCH** — nine-app window switcher (N8); nine 3×3 glyph blocks, straight out of HANGAR's own visual identity.
34. **MUTE** — meeting/stream control (N9); the entire pad turns red when your mic is off.
35. **GRADE** — relative mouse trim wheel for Resolve (N3); a colour wheel with your offset dot. Ship with the fiddliness stated.

**Accessibility**

36. **BIGRED** — the whole pad is one button (A1); full-field colour plus a filled/ring shape change.
37. **QUADRANT** — four huge zones (A2); distinct colours *and* distinct fill patterns, contrast measured.
38. **REACH** — modifier chords a palm away instead of across a keyboard (A3); held modifiers shown as edge bars.

**Play**

39. **STICK** — gamepad analog stick / throttle (Y1); a deadzone ring with your position inside it.
40. **SNAKE** — playable snake on 81 LEDs (Y2); the game is the display. The Discord card.
41. **LIFE** — Conway's Game of Life (Y3); tap to seed, firmware time evolves it.
42. **ETCH** — draw with a finger, swipe fast to clear (Y4); optionally each drawn cell sends a note.
43. **BOUNCE** — a ball you bat around that fires a note on every wall hit; physics as an instrument.
44. **POMODORO** — a 25-minute ring that drains around the edge (Y5); an ambient object that means something.

---

## Open questions

1. **Does MIDI-in actually reach a ZONA touch element on real hardware?**
   Source-verified (`ZONA_REFERENCE.md:1255-1312`), never tested in a rig. Eight of the shortlist
   above depend on it. **This should be a hardware checkpoint before any MIDI-in config is planned.**
2. **What does the MIDI-in path cost in characters?** `midirx_cb` plus a filter plus a repaint on top
   of an existing config, against a 908/908 budget. Unmeasured. If it is 250+, the clock-locked
   family may need to be its own configurations rather than a knob on existing ones.
3. **What does the community actually build?** Unanswerable from this machine — Profile Cloud's
   catalog is network-only behind Firebase auth and I did not query it. If someone with an account
   exports the public collection, that is the single highest-value follow-up.
4. **Does `gks` reach media keys?** `gks` takes USB HID *keyboard* usage ids; media/transport keys
   live on the Consumer page. If that page is not in the descriptor, "media transport" configs are
   off the table. Not checked.
5. **Is Mackie Control actually reachable?** MCU is MIDI notes, pitch bend and SysEx, and `gms`/`gmss`
   both exist — but MCU is a *bidirectional* protocol and a controller that only talks is a
   half-controller. Needs a firmware-level read before CONSOLE is planned.
6. **Two fingers in one zone** — documented caveat: the highlight clears when the first finger leaves
   (`ZONA_GUI_SPEC.md` §4.2). Affects SLAM, GRIDLOCK, STAGE, CULL, and every zone-based config.

---

## Sources

### Primary — files on this machine, read directly (HIGH confidence)

- `profile-cloud/src/lib/schemas.ts` — config schema, configType enum, virtualPath, featured
- `profile-cloud/src/routes/Filter.ts` — search vocabulary, the `$ActionBlock` operator, `--[[@short]]` extraction
- `profile-cloud/src/routes/Sorter.ts` — Name/Date/Type, no tags
- `profile-cloud/src/lib/components/tree/ConfigTree.ts` — Storefront tabs, curation by owner id
- `profile-cloud/Configuration.json` — 4 recommended ids, **1** workflow id, 3 featured ids
- `profile-cloud/REDESIGN.md` — Storefront IA, thumbnail rendering, featured shelf
- `profile-cloud/transfer-configs-to-dev.js` — confirms the catalog is Firestore-only (not queried)
- `grid-editor/configuration.json:56-99` — `RECOMMENDED_PACKAGES`: the host applications Intech name
- `grid-editor/src/content/*.json` — eleven bundled profiles; all defaults, **no ZONA profile**
- `grid-editor/src/renderer/runtime/getting-started-profile.ts` — how those load
- `grid-editor/src/renderer/config-blocks/` — the action-block vocabulary (MIDI, MidiZone, NRPN, SysEx, 14-bit, SimpleKeyboard, MouseMove/Button, SimpleScroll, GamePadAxis/Button, Macro, AppLauncher, Lookup)
- `grid-editor/src/renderer/config-blocks/ActionBlockInformation.ts:24-40` — the category enum (`variables, led, screen, midi, hid, element settings, condition, loop, special, code, timer, function, zona, deprecated`)
- `grid-editor/src/renderer/main/zona/_zone-blocks.ts` — the ZONA zone engine, grab-on-onset membership, the three ZONA traps
- `zona-docs/docs/ZONA_BRIEF.md` — the pitch, the hard facts, "what you can build now"
- `zona-docs/docs/ZONA_RECIPES.md` — Parts A/B/C/D, the recipe taxonomy, four complete builds, C5 modal, C6 `immediate_send`/OSC, C7-C10 faders and trackpad
- `zona-docs/docs/ZONA_REFERENCE.md` §6.3-6.6 — MIDI out, **MIDI in (`midirx_cb`, `rtmrx_cb`, `grxm`)**, HID keyboard/mouse/gamepad, no-OSC, no-absolute-pointer
- `zona-docs/docs/ZONA_GUI_SPEC.md` §1, §2.1, §4.2-4.6, §7 — the four named jobs, the deliberate v1 exclusions, accessibility requirements
- `zona-docs/docs/ZONA_SCROLL.md` — the trackpad as a whole product, and its three firmware limits
- `zona-docs/docs/XY_LEARN_EVIDENCE.md` — the MIDI-learn ambiguity dossier, with its own safe-phrasing guidance
- `hangar/.planning/PROJECT.md` and `hangar/src/lib/catalog/entries/*.ts` — the existing sixteen

### Secondary — web, official or first-party (MEDIUM-HIGH confidence)

- [Intech Studio Workflows](https://intech.studio/us/workflows) — the sixteen published workflows and the eight categories
- [Intech Studio Packages overview](https://docs.intech.studio/guides/grid/packages/Packages/) — what each package does; packages need the Editor running
- [Ableton Reference Manual — Instrument, Drum and Effect Racks](https://www.ableton.com/en/manual/instrument-drum-and-effect-racks/) — up to 16 Macro Controls per Rack
- [Ableton — Push on Film: Chromatic & In-Key modes](https://www.ableton.com/en/blog/push-action-playing-chromatic-and-key-modes/) and [Using Push 2](https://www.ableton.com/en/manual/using-push-2/) — folded keyboard, In Key, 4ths layout, Fixed root
- [Novation Launchpad range](https://www.ableton.com/en/products/controllers/launchpad/) and [Launchpad X](https://novationmusic.com/en/launch/launchpad-x) — clip launching, drum mode, colour mirroring
- [Sound On Sound — Novation Launchpad Pro](https://www.soundonsound.com/reviews/novation-launchpad-pro) — the four-track 32-step sequencer
- [Korg KAOSS PAD KP3+ features](https://www.korg.com/us/products/dj/kaoss_pad_kp3_plus/page_1.php) — simultaneous X/Y parameter assignment, one-hand two-parameter control
- [Sensel Morph documentation](https://sensel.github.io/morph-docs/morph/) — overlays: music, gamepad, video editing, QWERTY; and the MIDI-learn workaround
- [Sound On Sound — Sensel Morph](https://www.soundonsound.com/reviews/sensel-morph) — the Music Production overlay layout
- [Roger Linn — What is MPE?](https://www.rogerlinndesign.com/support/support-linnstrument-what-is-mpe) and [LinnStrument](https://www.rogerlinndesign.com/linnstrument) — MPE's three dimensions, isomorphic layout
- [Apple — Wavetable, Vector and LA synthesis](https://support.apple.com/guide/logicpro/lgsife41a4be/mac) — XY-morph between four sources
- [MusicRadar — What is granular synthesis?](https://www.musicradar.com/news/what-is-granular-synthesis) — grain clouds, position/density modulation
- [ChamSys MagicQ MIDI documentation](https://secure.chamsys.co.uk/docs/magicq/manual/MIDI.html) — MIDI learn on execute boxes
- [MA Lighting forum — trigger cues using MIDI (grandMA3)](https://forum.malighting.com/forum/thread/67896-how-to-trigger-cues-using-midi/) — notes to executors
- [obs-midi-mg](https://obsproject.com/forum/resources/obs-midi-mg.1570/) and [MIDIControl](https://obsproject.com/forum/resources/midicontrol-control-obs-soundboard-twitch-chat-with-midi-devices.940/) — the MIDI route into OBS; hotkeys are the plugin-free route
- [Loupedeck CT](https://loupedeck.com/products/loupedeck-ct/) and [PetaPixel — Best editing consoles](https://petapixel.com/best-editing-consoles-for-photographers/) — the Lightroom/Premiere/Resolve control-surface market
- [Blender manual — Configuring Peripherals](https://docs.blender.org/manual/en/latest/getting_started/configuration/hardware.html) — 3D mice, tablets, alternative input
- [Serato — MIDI mapping with Serato DJ Pro](https://support.serato.com/hc/en-us/articles/209377487-MIDI-mapping-with-Serato-DJ-Pro) and [Traktor Kontrol Z2 on Serato](https://serato.com/dj/hardware/native-instruments-traktor-kontrol-z2) — Pad FX modes, loop control
- [Sound On Sound — Yamaha Tenori-On](https://www.soundonsound.com/reviews/yamaha-tenori) and [CDM — the wonders of grids](https://cdm.link/2014/06/watch-wonders-grids-monome-makers-defend-minimal-design/) — grid instruments as toys, sketchpads and ambient objects
- [Perkins — computer mice and mouse alternatives](https://www.perkins.org/resource/choosing-computer-mouse-low-vision/) — large-surface assistive touchpads
- [Macropad.io — macropads for developers](https://macropad.io/blogs/news/macropads-for-developers-7-time-saving-key-combos-to-automate) — the documented developer macro archetypes
- [Projectile Objects — Resolume vs VDMX vs MadMapper vs TouchDesigner](https://projectileobjects.com/2025/11/28/resolume-vs-vdmx-vs-madmapper-vs-touchdesigner-which-live-visuals-software-and-why/) and [VJ Union — mapping your MIDI controller](https://vjun.io/mowglitv/tips-for-mapping-your-midi-controller-2pc6) — VJ software landscape and mapping practice
- [Fab Academy — sim-racing button box](https://fabacademy.org/2025/labs/charlotte/students/andrew-puky/projects/final-project/) and [Fly Away Simulation — DIY joystick](https://flyawaysimulation.com/ask/answers/build-diy-flight-simulator-joystick/) — a standard USB HID game controller works with MSFS, X-Plane, DCS, P3D, FSX

### Not available

- **Profile Cloud's community catalog.** Firestore, behind Firebase auth. Not queried (no sign-up, no
  download). This is the largest gap in the evidence and it is the one that would most change the
  ranking.
- **korgforums.com** — noted as unreachable in `XY_LEARN_EVIDENCE.md` (expired TLS).
- **forum.ableton.com** — returns 403 to plain fetchers; the threads cited in
  `XY_LEARN_EVIDENCE.md` were read in a browser during that earlier pass, not re-verified here.

---

## Metadata

**Confidence breakdown**

| Area | Level | Reason |
|---|---|---|
| Profile Cloud schema and taxonomy | HIGH | Read the source files directly |
| Which host applications Intech target | HIGH | Their own `configuration.json` plus their own published workflow page |
| What ZONA can emit and receive | HIGH | `ZONA_REFERENCE.md` cites firmware source line numbers throughout |
| **MIDI-in working in practice** | MEDIUM | Source-verified, hardware-untested. Flagged as a checkpoint |
| What Grid *community members* build | LOW | No local evidence; catalog is network-only behind auth. Stated as a gap |
| Wider-world use cases | MEDIUM-HIGH | Each grounded in a named product or official doc; none is ZONA-specific |
| Demand scores | LOW-MEDIUM | Reasoned from Intech's own workflow weighting plus the general controller market. No ZONA sales or survey data exists |
| Spectacle scores | MEDIUM | Judgement, informed by what 81 LEDs can legibly show |

**Research date:** 2026-09-07
**Valid until:** ~2026-12-07 for the wider-world half; the local half is valid until the sibling
repos move.
