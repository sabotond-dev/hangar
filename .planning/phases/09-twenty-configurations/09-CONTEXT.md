# Phase 9: Twenty Configurations — Context

**Gathered:** 2026-09-07, with the user present. Sources: the user's ask ("research relevant use cases
for ZONA and come up with 20 more configurations, add them to HANGAR"), three research documents
committed at `e416b95` (`.planning/research/ZONA-CAPABILITIES.md`, `CATALOG-SURFACE.md`,
`USE-CASES.md`), and the user's three rulings on the proposed slate. [user] decisions are the user's;
[orchestrator] ones were taken without them and are open to veto.

## Phase boundary

Phase 9 takes the catalog from sixteen entries to thirty-six. It authors twenty new configurations,
each one useful to a named person in a named application and worth watching on a card. It does not
change how a configuration is installed (Phase 7), how the session reaches the module (Phase 6), or
how a card is tuned and shared (Phase 5). It does not widen the front-door ring.

## Decisions

### Scope and shape
- **D-01 [user]** Twenty new configurations, taking the catalog from sixteen to thirty-six. The slate
  is the table below, agreed with the user before planning.
- **D-02 [user]** **The front-door ring stays at eight.** New entries live in the catalog and on
  their own `/c/{id}/` pages. The ring may grow in a later phase once the new entries have been seen
  animating; this phase does not touch `FRONT_DOOR` or the `preview === "padsim"` rule that guards it.
- **D-03 [user]** Three or four entries are pure play — SNAKE, ETCH, LIFE and POMODORO. A large share
  of HANGAR's visitors can never install anything, and the site has to be worth opening anyway.
  These are also the most shareable cards.

### What is deliberately not in scope
- **D-04 [orchestrator]** **No configuration in this phase depends on inbound host MIDI.** Five of
  the strongest candidates in the research are a clock-locked family (a background breathing on the
  downbeat, a clock-driven playhead, a VU meter, a grid the host paints, a visual metronome). They
  rest on a capability that is verified in firmware source and never tested on hardware, and on a
  simulator path HANGAR does not have. `docs/MIDI-IN-PROBE.md` is the bench test that unblocks them;
  they are a later phase, not this one. Nothing in the slate below needs them.
- **D-05 [orchestrator]** Nothing that needs Grid Editor running, nothing marketed as MPE (one touch
  sample per 100 Hz cycle and no pressure), nothing needing an absolute pointer or OSC. Each is
  either off-premise or dishonest.

### How an entry is built
- **D-06 [orchestrator]** **Prefer `kind: "state"` over `kind: "lua"`.** `previewFor` returns
  `"padsim"` for both `preset` and `state`, and D-09 of Phase 8 pins only the nine `PRESETS` — a
  `state` entry carries an arbitrary `PadState` and is therefore firmware-faithful, budget-measured
  and trap-free by construction. Drop to hand-authored Lua only where an idea genuinely carries its
  own state or arithmetic. The route column in the slate is a starting assumption, not a contract: an
  entry may move from `lua` to `state` if it fits, and a move the other way must be justified in the
  plan's summary.
- **D-07 [orchestrator]** **The trap-scanner gap is closed before twenty new entries walk into it.**
  HANGAR's Lua host registers fifteen globals and `glc` among them, but not `gln`, `gld` or `glx` —
  the three-stop idiom every published ZONA recipe is built on. The vendored `findTraps` *does* know
  those three names, so recipe-book code passes the static gate and then raises "attempt to call a
  nil value" at runtime. A gate must reject any call the host does not register, and it must be red
  before an entry can rely on it.
- **D-08 [orchestrator]** `lua-entries.spec.ts` measures every knob combination through the minifier:
  283 combinations at seven hand-authored entries, and it has already timed out three times under
  memory pressure. It moves to its own Vitest project before the entry count grows, following the
  precedent Phase 8's D-10 set.
- **D-09 [orchestrator]** `planLayers` silently drops sheets: a visible control and an animated
  background are mutually exclusive, as are showpiece mode and touch. Each entry's layer plan is
  decided when it is planned, never discovered when it is written.

### Proof
- **D-10 [orchestrator]** Every entry clears what Phase 8's entries clear: canonical compressed form,
  both 908-character budgets at defaults *and* at every corner of its knob cross-product, a real Lua
  VM run without error where it is hand-authored, and a recorded golden frame set. The three
  declarations each entry needs — its entry file, `LISTING`, and the row/exclusion partition — are
  gated in both directions, as they are today.
- **D-11 [orchestrator]** **HOLD gets a bench row.** Latching is the highest-demand gesture in the
  research and it sits on a known firmware stuck-contact bug the simulator deliberately cannot
  reproduce, so it can look perfect in a browser and stick on hardware. A green test is not evidence
  for this one.
- **D-12 [user, standing]** No agent writes to or connects to a device. Nothing under `src/vendor/`
  is edited. The hardware checklists stay the user's.

### Amended after planning (2026-09-07) **[orchestrator]**
- **D-06 reversed.** `kind: "state"` is not the safe default; it is the *less* integrated route, and
  no entry on the slate can use it. Two findings, both checked against shipped code:
  `src/lib/share/stamp.ts:115-119` returns `[]` from `compilerKnobs` unless the source is a `preset`,
  so a `state` entry carries **no knobs and no shareable stamp** and `KnobRack` renders its empty
  copy; and every one of the twenty slate entries fails the `PadState` vocabulary individually
  (`_pad.ts:245-356` — `sends.grid` has no 2×2, `sends.faders` is 3 or 4 only, `toggle` is
  zones-only, `scale` is refused on the 9×9 in writing, the only HID kind is a trackpad, and nothing
  in the sheet has a clock, a state machine or a per-cell colour map). **The phase therefore ships
  twenty `lua` entries and zero `state` ones**, each with a per-entry route note. Making `state`
  viable means an optional `knobKinds` on the source, which pulls those entries into the
  reachability sweep — a phase of its own, not a patch, and it is recorded as a deferred item.
- **D-07 widened.** The gap is larger than the three missing LED calls: `findTraps` is exported from
  the vendored compiler and **is called by no HANGAR spec at all**, so there is no static gate over a
  hand-authored entry's call surface today. The only backstop is a runtime raise inside whichever
  branch the smoke gesture happens to reach. The new gate is therefore a call-site classifier, not a
  blocklist, and the disagreement between it and `findTraps` is proved in both directions.
- **D-09 corrected.** `planLayers` is reached only from the compile path, so it never runs for a
  hand-authored entry and its mutual exclusions do not bind. What binds instead is the 49.6 per cent
  single-layer cap and the two layers an entry owns directly. The decision survives in substance —
  every entry states its layer plan — but for the right reason.
- **Consequence for D-02.** Twenty-seven of thirty-six entries will be hand-authored Lua, and no Lua
  entry can enter the front-door ring while `front-door.spec.ts:110-112` requires `preview ===
  "padsim"`. The ring stays at eight as the user ruled; whether that rule should be retired is now
  the sharper question and is left open below.

## The slate

Twenty configurations, cut from forty-four candidates in `.planning/research/USE-CASES.md`.

| # | Name | What it is | Route |
|---|------|-----------|-------|
| 1 | HOLD | Latching effect XY; the released dot stays lit and pulses | state |
| 2 | STEPS | An 8×8 step sequencer with a bright column sweeping | lua |
| 3 | SLAM | Drum pads whose velocity is where in the pad you hit | lua |
| 4 | LUMEN | Hue by saturation colour picker for a lighting desk | lua |
| 5 | STAGE | An OBS scene switcher over plain hotkeys, no plugin | state |
| 6 | SHUTTLE | A video shuttle with a speedometer arc | lua |
| 7 | GRIDLOCK | An 81-clip launcher | lua |
| 8 | LEARN | A mapping helper that lights only the row it is sending X on | lua |
| 9 | KEYS | An in-key note grid; roots bright, out-of-key dark | state |
| 10 | CONSOLE | An eight-strip mixer with rails on the boundaries | lua |
| 11 | STRIP | One whole-pad 14-bit fader with a vernier row | state |
| 12 | CULL | A photo rating grid, a colour and a shape per rating | state |
| 13 | FORGE | Editor and terminal macros, one colour per family | state |
| 14 | SWITCH | A nine-app switcher in 3×3 glyph blocks | state |
| 15 | TABLE | Wavetable position by filter; the grid draws the wave | lua |
| 16 | SNAKE | Playable snake on 81 LEDs | lua |
| 17 | ETCH | Draw with a finger, swipe fast to clear | lua |
| 18 | LIFE | Conway's Life, tap to seed | lua |
| 19 | QUADRANT | Four huge zones for reach and low vision, colour and fill both | state |
| 20 | POMODORO | A 25-minute ring draining around the edge | lua |

Names are working names and the copy is not written here: each entry's name, one-line description and
tags are authored in its plan against Phase 8's copy rules (typographic apostrophes, no exclamation
marks, no emoji, sentence case in descriptions, feel-based tags from the existing vocabulary).

## Open for the user
1. Whether any entry on the slate should be swapped for one of the twenty-four candidates that did
   not make the cut (`USE-CASES.md` Part Four).
2. Whether the front-door ring should grow once the new entries can be seen animating.
3. Whether CONSOLE ships, given that Mackie Control is a bidirectional protocol and a controller that
   only talks is half a controller — the research left this unresolved.
