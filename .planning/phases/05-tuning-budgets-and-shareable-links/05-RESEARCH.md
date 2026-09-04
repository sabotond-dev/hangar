# Phase 5: Tuning, Budgets and Shareable Links — Research

**Researched:** 2026-09-04
**Domain:** knob models over a vendored compiler, live budget metering, URL-hash state codecs,
build-time PNG generation in Node, cross-browser (WebKit) coverage
**Confidence:** HIGH on everything measured in this tree; MEDIUM on Discord's unfurl rules (no
first-party spec exists); LOW on nothing that a plan depends on.

> **Everything numeric in this document was measured on this machine on 2026-09-04**, by loading the
> real modules through Vite's `ssrLoadModule` and running them. Nothing here is recalled from
> training data. The probe scripts were deleted after the run; the commands are reproduced in
> `## Code Examples` so any number can be re-derived.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase boundary.** Phase 5 turns knobs on any configuration, shows both 908-character budgets live,
and makes a tuned state travel in a URL that unfurls on Discord. It does not install (Phase 7), does
not build the browse catalog (Phase 5.1), and adds no accounts or backend.

**Knobs**
- **D-01 [user]** Three to six knobs per configuration from colour, speed, layout, brightness, MIDI
  destination and config-specific parameters, in one shared widget vocabulary.
- **D-02 [orchestrator]** The vocabulary is the vendored `KnobKind` union (twelve members in
  `_pad.ts`): one Svelte widget per kind family, chosen by kind, never per configuration. Compiler
  driven entries (`source.kind === "preset" | "state"`) expose BOTOR's own knobs over `PadState`;
  Lua entries expose the token-substitution knobs Phase 8 declared. The panel cannot tell them apart.
- **D-03 [user]** Reset one knob by double-click; reset the whole configuration; `SURPRISE ME`
  randomises into a state that is never over budget.
- **D-04 [orchestrator]** `SURPRISE ME` draws from each knob's value set and re-rolls (bounded, then
  falls back to the ladder) until `fits()` holds; for Lua entries every draw fits by construction.

**Live recompile and meters**
- **D-05 [user]** Every knob change re-simulates live; the recompile is debounced, the preview is not.
- **D-06 [orchestrator]** `PadSim` takes a `PadState`, so the preview updates on the same tick as the
  knob; the compile (needed only for cost) is debounced ~120 ms. Lua entries re-render by token
  substitution and restart the Lua engine, also debounced; the previous engine keeps painting until
  the new one has run Setup.
- **D-07 [user]** Two separate meters, Setup and Timer, `chars / 908` with a percentage, measured with
  the pinned `compressScript` after `padReady()` — the same function the fit ladder is calibrated on.
- **D-08 [orchestrator]** The formatter WASM is prefetched on `requestIdleCallback` once the coverflow
  has settled and awaited on first choose; until it resolves the meters show a quiet measuring state
  and never block the simulation. Nothing in Phase 4's first-paint chunk guards may regress.
- **D-09 [user]** TUNE-04: when the fit ladder trims a feature, one line says so. TUNE-05: over budget
  turns the offending meter red, disables `TRY ON DEVICE`, names the knob that pushed it over, and
  offers a one-click back-off; the click never reaches the wire.
- **D-10 [orchestrator]** Over-budget is reachable only for compiler-driven entries (`fit()`/`fits()`
  from the vendored compiler decide); Lua entries were proven in budget across their whole knob
  cross-product in Phase 8, so for them TUNE-04/05 are structurally unreachable and the UI states
  nothing rather than faking a ladder.

**Placement (Phase 4 D-08 honoured)**
- **D-11 [orchestrator]** Knobs and meters dock into the chosen panel's reserved `TUNING` region:
  knob rack first (96 px, horizontal scroll never; wraps at phone widths), then the two meters
  (56 px). `SURPRISE ME` and `RESET` sit at the rack's end as secondary controls; `COPY LINK` sits
  beside the install controls. The panel must not resize when the region fills.

**Sharing**
- **D-12 [user]** The tuned state is a versioned base36 stamp in the URL **hash**, never the query
  string; opening the URL restores the knobs exactly; `COPY LINK` confirms in its own state; a stamp
  from an older version says so plainly and lands on the base configuration.
- **D-13 [orchestrator]** Envelope: `/c/<id>#z.<format><payload>`. Compiler-driven entries reuse
  BOTOR's own `encodeStamp`/`decodeStamp` (current format `d`); Lua entries use a HANGAR-owned
  format letter not in BOTOR's alphabet of formats, carrying knob indices in catalog order. An
  unknown or undecodable stamp is SHARE-03's message plus the base configuration — never a partial
  restore. The stamp is applied after the coverflow has centred the entry (Phase 4's route logic
  stays untouched).
- **D-14 [user]** SHARE-04: a build-time OG image per catalog configuration, rendered from the
  simulator, so a link unfurls on Discord with the pad picture and title.
- **D-15 [orchestrator]** The OG image is a 1200×630 PNG per entry generated by a Node script at
  build time: run `PadSim` (or the Lua host) to a representative tick, paint the 9×9 in the identity
  (true black, lime frame, name in Quicksand is optional — text rendering in Node without a browser
  is a research question), encode PNG with `node:zlib` (no native deps, no paid service, no headless
  browser), emit under the build's static assets, and reference it with an absolute `og:image` from
  the prerendered `/c/<id>/` head. Tuned stamps share the base entry's image (documented forward risk
  from Phase 4 research).

**Every browser**
- **D-16 [user]** DEGR-01: catalog, simulator, tuning and sharing work on every browser including iOS
  Safari; only install is absent.
- **D-17 [orchestrator]** Playwright gains a WebKit project for the front door and the tuning panel;
  iOS is approximated by WebKit + a phone viewport. The clipboard write for `COPY LINK` needs a
  user-gesture-safe fallback (select-and-copy) where `navigator.clipboard` is unavailable.

### Claude's Discretion

The three items CONTEXT.md leaves **open for the user** are answered here as recommendations, not
decisions:

1. The look of the OG image (pad only, or pad plus name plate) — see `## The OG image`.
2. Whether Lua entries should enter the front-door row once they have knobs — see
   `## Scope reality: Lua knobs have no visitor-facing surface in Phase 5`.
3. Whether `SURPRISE ME` is the right label — no research bearing; kept.

D-15 explicitly delegates one question: "text rendering in Node without a browser is a research
question". It is answered in `## The OG image`.

### Deferred Ideas (OUT OF SCOPE)

Install (Phase 7). Browse catalog, sort and search (Phase 5.1). Per-stamp OG images (would need a
Worker). Accounts, likes, popularity (never). Phase 8's Lua entries joining the front-door row —
a curation decision recorded for the user, not made here.

Also out of scope from REQUIREMENTS.md "Later": **TUNE-08** (naming the exact feature trimmed via
compiler introspection), **TUNE-09** (viewing generated Lua), **SHARE-05** (knob drags update the
hash via `replaceState`), **SHARE-06** (`COPY LINK` as the unsupported-browser fallback).
SHARE-05's absence is load-bearing for this phase's design — see `## The stamp and the URL`.

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TUNE-01 | Each configuration exposes three to six knobs using one shared widget vocabulary | `## The knob model` — the twelve `KnobKind`s map to **three** widgets; the per-entry field bindings are recovered from BOTOR's own `PadPanel.svelte`; a universal `brightness` knob lifts the three presets that would otherwise expose only two |
| TUNE-02 | Every knob change recompiles and re-simulates live; recompile debounced, preview not | `## Live recompile` — measured `compile()+cost()` at 1.1–4.0 ms in Node; `PadSim.setState()` exists and rebuilds in microseconds; a `SimHost.replaceEngine()` addition avoids the canvas teardown that `register()` performs |
| TUNE-03 | Two live meters, Setup and Timer, `chars / 908` with a percentage | `## The meters` — `cost()` returns `{used, limit, free}` per event; `BUDGET_WARN = 606` and `BUDGET_ERROR = 890` are exported and give the meter three honest states before red |
| TUNE-04 | When the fit ladder trims a feature, one line says so | `## The fit ladder` — `FitStep.label` is documented as "the exact words the panel prints"; **but** `fit()` returns zero steps for every state HANGAR can reach. See the headline finding |
| TUNE-05 | Over-budget disables `TRY ON DEVICE`, reddens the meter, names the knob, offers a back-off | `## The fit ladder` + `## The headline finding` — over-budget is **unreachable** across all 1,080 kind combinations with every expensive flag on; the branch ships as a tested guard with a `/dev/` probe, not as a visible feature |
| TUNE-06 | Reset one knob (double-click) or the whole configuration to defaults | `## The knob model` — every knob is an index into an ordered value list, so reset is `index = default`; the whole-config reset is `state = entry base` and `preset` restored |
| TUNE-07 | `SURPRISE ME` randomises into a state never over budget | `## SURPRISE ME` — the `fits()` re-roll is correct and cheap; measured, it never loops. Property test rather than e2e |
| SHARE-01 | Versioned base36 stamp in the URL hash; opening restores knobs exactly | `## The stamp and the URL` — `encodeStamp`/`decodeStamp` round-trip is a **measured identity** (colours are quantised in the state, not in the codec); HANGAR format `x` for Lua knob indices |
| SHARE-02 | Explicit `COPY LINK` whose own state confirms the copy | `## COPY LINK` — `navigator.clipboard.writeText` is Safari 13.1+ / iOS Safari; the trap is any `await` before the call, so the URL string must be precomputed |
| SHARE-03 | An older stamp fails gracefully and lands on the base configuration | `## The stamp and the URL` — `decodeStamp` already fails closed on unknown formats; HANGAR must add the **entry-consistency** check, without which `/c/aurora/#z.pdial` would render Dial under Aurora's name |
| SHARE-04 | Build-time OG image per configuration, rendered from the simulator | `## The OG image` — measured: a realistic 1200×630 pad PNG deflates to **~4 KB** with `node:zlib`; `zlib.crc32` exists in Node 24; SvelteKit's prerender crawler **does** follow `og:image`, which dictates where the files go |
| DEGR-01 | Catalog, simulator, tuning and sharing work on every browser including iOS Safari | `## Every browser` — the two real WebKit gaps are `requestIdleCallback` (absent in Safari stable) and the clipboard gesture window; `overflow: clip` and `image-rendering: pixelated` are both fine |

</phase_requirements>

---

## Summary

Phase 5 is not a research problem about libraries. Every dependency it needs is already in the tree
and pinned. It is a research problem about **what the vendored compiler actually exposes**, and the
answer changes the shape of the phase in three places.

First, `KnobKind` is a **label**, not a binding. `_pad.ts` exports the twelve-member union and each
`PadPreset` declares two to four of them, but nothing in the vendored code says which `PadState`
field a given kind moves. BOTOR's own `PadPanel.svelte` (readable in the local `grid-editor`
checkout at the pinned SHA `a0fb69d5`) resolves it with a hard-coded per-preset `if/else` chain —
exactly what D-02 forbids HANGAR from copying. The recovered semantics are tabulated below. Three of
the nine presets declare only two knobs, below D-01's floor of three; a universal **brightness**
knob (in D-01's own list, free in Lua characters, already carried by stamp formats `c`/`d`) fixes
that with no invention.

Second, and this is the headline: **over-budget is unreachable.** A brute-force sweep of all 1,080
look × touch × sends kind combinations with `hiRes`, `showGrid`, `fingers: "each"`, `spring`,
`bend`, `dialRadius`, `scale` and `toggle` all switched on found **zero** states above 908. The
worst is 906 (trackpad). A second sweep over the proposed HANGAR knob cross-product for all nine
presets — 16,645 measured combinations — also found zero. The reason is structural: `fit()`'s own
`blocked` field only contemplates `"sends"` and `"usercode"`, and HANGAR exposes no user code. So
TUNE-04's ladder line and TUNE-05's red meter are correct code that no visitor can reach. They must
still be built and tested; they must not be faked; and the meters have to carry the drama by
themselves — which they can, because `BUDGET_WARN = 606` and `BUDGET_ERROR = 890` are exported and
`tpad` genuinely sits at 902/908.

Third, the front-door row is eight ported presets and nothing else: every Lua entry is in
`EXCLUDED_FROM_ROW` and `/c/[id]/+page.ts` prerenders from `FRONT_DOOR`. **Phase 5's Lua knob path
therefore has no visitor-facing surface.** It must still be built (D-02, D-13) and it is fully
testable in Vitest and on the existing unlinked `/dev/catalog/` probe page, but no plan should
assume a user can reach it before Phase 5.1.

**Primary recommendation:** split the phase along the three seams the compiler actually has —
(1) a HANGAR-owned knob model in `src/lib/tune/` that resolves `KnobKind` to a `PadState` binding for
compiler entries and to a `values` index for Lua entries, behind a dynamic import so Phase 4's chunk
guards hold; (2) live metering built on `cost()` with BOTOR's own warn/error thresholds, with the
over-budget branch shipped as a unit-tested guard plus a `/dev/tune/` probe rather than as a feature;
(3) sharing and OG as a separate, almost independent wave — a pure codec, a precomputed URL string,
and a pre-`vite build` Node generator writing into `static/og/`.

---

## The headline finding: TUNE-04 and TUNE-05 are unreachable

**Measured, 2026-09-04, this tree, `padReady()` resolved, pinned protocol `1.20260825.1135`.**

Sweep A — all kind combinations with every expensive flag on:

```
9 look kinds × 6 touch kinds × 6 send kinds × hiRes × showGrid = 1,080 states
each with fingers="each", spring=true, bend="x", dialRadius=true, scale="major", toggle=true
result: worst = 906 characters (none/none/trackpad), over-budget combos = 0
```

Sweep B — the proposed HANGAR knob cross-product, all nine presets (16,645 combinations):

| preset | combos | max Setup | max Timer | over budget |
|--------|-------:|----------:|----------:|------------:|
| aurora | 1,920 | 262 | 55 | 0 |
| pinwheel | 960 | 310 | 55 | 0 |
| starfield | 80 | 254 | 55 | 0 |
| radar | 3,840 | 454 | 55 | 0 |
| joystick | 1,440 | 548 | 24 | 0 |
| ninepads | 7,680 | 638 | 162 | 0 |
| faders | 40 | 520 | 24 | 0 |
| dial | 640 | 797 | 55 | 0 |
| tpad | 45 | 906 | 146 | 0 |

Corollary consequences the planner must carry:

1. **`fit()` returns `{ fits: true, steps: [] }` for every reachable state.** TUNE-04's line never
   fires. `FitPlan.resolved` is only populated when `steps.length > 0`, so it is always `undefined`.
2. **`cost().fits` is always `true`.** TUNE-05's red meter, the disable of `TRY ON DEVICE`, the
   "which knob pushed it over" attribution and the one-click back-off are all dead branches.
3. **`SURPRISE ME`'s `fits()` re-roll never loops.** D-04's "bounded, then falls back to the ladder"
   is correct defensive code that measured zero re-rolls.

**Recommendation (three parts, all of them required):**

- **Build the branches.** They are requirements, they are cheap, and the compiler could change (a
  vendored re-sync, or Phase 7 passing `reserved` characters for an install marker, would move every
  number). Correct dead code is not the same as a lie.
- **Prove them in Vitest with synthetic states.** Construct a `PadState` with a hand-made
  `CompileResult`-shaped stub, or pass a large `reserved` to `cost()` — `cost(result, {setup: 400,
  timer: 0})` puts `tpad` over instantly and exercises `validate()`'s real worded message,
  `This pad needs N more characters than it has room for.` That is the honest way to reach the branch.
- **Add a `/dev/tune/` probe page** in the established unlinked pattern (`src/routes/dev/skeleton`,
  `dev/fidelity`, `dev/catalog` already exist and `config-shape.spec.ts` asserts they are linked from
  nowhere) that mounts the tune panel against a forced over-budget cost, so Playwright can assert the
  red meter, the disabled control and the back-off click without inventing a fake catalog entry.
- **Tell the user.** This contradicts D-10's premise ("over-budget is reachable only for
  compiler-driven entries"). It is not reachable for either kind. The meters are still the right
  feature and still tell the truth — `tpad` at 902/908 and `dial` at 646/908 are genuinely different
  stories — but requirement 3 of the roadmap's success criteria describes a state no visitor can
  produce.

**What the meters can carry instead.** `_pad.ts` exports `BUDGET_WARN = 606` and
`BUDGET_ERROR = 890` alongside `EVENT_BUDGET = 908`. Those are the compiler's own thresholds and give
a four-state meter with no invented numbers:

| Range | State | Reachable today |
|-------|-------|-----------------|
| `used < 606` | calm | aurora 250, pinwheel 305, starfield 238, radar 438, joystick 535, faders 520 |
| `606 ≤ used < 890` | close | ninepads 638, dial 797 |
| `890 ≤ used ≤ 908` | tight | tpad 902 (not in the row; reachable in Phase 5.1) |
| `used > 908` | over | unreachable |

---

## The knob model

### What the vendored compiler gives, and what it does not

| Exported from `src/vendor/botor/_pad.ts` | Line | Use |
|---|---|---|
| `type KnobKind` (12 members) | 4158 | the widget vocabulary D-02 mandates |
| `PadPreset.knobs: KnobKind[]` | 4182 | which kinds a preset declares (2–4 each) |
| `PRESETS`, `presetById` | 4214, 4386 | the nine shelf cards and their `state` |
| `SPEED_TABLE`, `DECAY_TABLE`, `BRIGHTNESS_TABLE`, `DIAL_SENSE_TABLE`, `TRACKPAD_*` | 380–545 | the detent tables that *are* the value sets |
| `clonePadState`, `groundPadState`, `normalisePadState`, `quantiseColour` | 675, 1506, 1298, 490 | state hygiene |
| `compile`, `cost`, `fits`, `fit`, `validate`, `measure` | 2331, 3064, 3078, 4089, 3661, 3041 | the metering surface (all already re-exported and gated by `src/lib/pad/index.ts`) |
| `encodeStamp`, `decodeStamp`, `STAMP_PREFIX`, `STAMP_ALPHABET`, the five format letters | 2632, 2789, 2466–2503 | the stamp codec |

**Not exported, and needed:** `withChange(s, fn)` (line 3156) is module-private. It is five lines and
must be reimplemented in HANGAR:

```ts
// src/lib/tune/state.ts — the vendored withChange, reimplemented because it is private.
function withChange(s: PadState, change: (draft: PadState) => void): PadState {
  const draft = clonePadState(s);
  change(draft);
  delete draft.preset;      // any edit clears the shelf card: the stamp becomes a field dump
  delete draft.soloStream;  // audition state never travels
  return groundPadState(draft);
}
```

Deleting `preset` is **load-bearing**: `encodeStamp` returns the short form `p<presetId>` whenever
`state.preset` is set, so a tuned state that kept its `preset` would encode as the untuned card and
silently lose every knob. This is also why the first knob turn moves the Setup meter by a handful of
characters even when the field itself is free — `paurora` (7 chars) becomes `at7ghh1pv8j00` (13),
and the stamp lives inside `setupLua` as the first action's marker name, so `cost()` charges it. The
UI copy must not let that read as a bug.

**Not present anywhere:** the mapping from a `KnobKind` to a `PadState` field. BOTOR resolves it
per-preset in `grid-editor/src/renderer/main/zona/PadPanel.svelte` lines 1259–1920 (branch on
`selPreset.id`), with the reader/writer pairs at lines 458–519 and 538–803. That file is at the same
pinned SHA HANGAR vendored from, so it is authoritative. The table below is recovered from it.

### The recovered semantics (source: BOTOR `PadPanel.svelte` @ `a0fb69d5`)

| Preset | `PadPreset.knobs` | BOTOR's controls, in panel order | `PadState` field |
|---|---|---|---|
| aurora | colour, speed, direction, size | Colour, Speed, Direction, Band | `look.colour`, `look.speed` (1–8), `look.reverse`, `look.wavelength` ∈ {10, 15, 36} |
| pinwheel | colour, speed, count | Colour, Speed, Arms | `look.colour`, `look.speed`, `look.arms` ∈ {1,2,3} |
| starfield | colour, feel | Colour, Edge | `look.colour`, `look.edge` ∈ {soft, hard} |
| radar | colour, speed, note | Colour, Speed, Follows, Send, Channel | `look.colour`, `look.speed`, `sends.axes`, `sends.ccBase`, `sends.channel` |
| joystick | colour, note, bend, spring | Colour, Pitch bend, On lift, Send, Channel | `touch.colour`, `sends.bend`, `sends.spring`+`springTo`, `sends.ccBase`, `sends.channel` |
| ninepads | colour, note, scale, amount | Colour, Notes, Layout, Scale, Pads, Channel, Hit strength | `sends.gridColour`, `sends.baseNote`, `sends.grid`, `sends.scale`, `sends.toggle`, `sends.channel`, `sends.velocity` |
| faders | note, amount | Send, Channel, Faders | `sends.ccBase`, `sends.channel`, `sends.faders` ∈ {3,4} |
| dial | note, feel, mode, amount | Send, Channel, Sensitivity, Mode, Distance | `sends.ccBase`, `sends.channel`, `sends.dialSense`, `sends.dialMode`, `sends.dialRadius` |
| tpad | feel, amount | Tap, Pointer speed | `sends.trackpad.tapTolerance`, `sends.trackpad.pointerCap` |

Two facts follow. `PadPreset.knobs` is **not** a 1:1 render list — radar declares three kinds and
BOTOR renders five controls. And the field a kind moves genuinely varies by card: `colour` is
`look.colour` on four cards, `touch.colour` on joystick, `sends.gridColour` on ninepads.

**The D-02-compliant resolution.** The **widget** is chosen by kind and never by configuration; the
**field binding** is a per-entry descriptor. Both halves are needed and they are different things.
Two of the three bindings even fall out of a state-driven rule that reproduces BOTOR's choices
exactly, which is worth encoding as an assertion rather than a table:

```
colour → look.colour        when enabled.look && look.kind !== "none"
       → touch.colour       else when enabled.touch && touchUsesColour(touch.kind)
       → sends.gridColour   else when sends.showGrid
```

That rule yields `look.colour` for aurora/pinwheel/starfield/radar, `touch.colour` for joystick and
`sends.gridColour` for ninepads — byte-for-byte BOTOR's own per-preset choices.

### The three-knob floor, and the answer

starfield (2), faders (2) and tpad (2) fall below D-01's floor. **Add a universal `brightness`
knob** to every compiler-driven entry:

- It is in D-01's own list ("colour, speed, layout, brightness, MIDI destination…").
- `PadState.brightness` is a 1–5 detent into `BRIGHTNESS_TABLE`, which carries the display word
  (`Dim`, `Low`, `Half`, `Bright`, `Full`).
- It costs **nothing in Lua**: `scaleChannel` is applied at the final literal emission point, and
  `floor(v * 100 / 100) === v`, so the default detent emits a byte-identical body.
- It is already carried by stamp formats `c` and `d`, so it round-trips with no codec work.
- Measured effect on the sweep: it multiplies every preset's cross-product by 5 and changes no
  maximum by more than a few characters.

Result: 3–5 knobs per preset. Lua entries already carry 5–6. Nothing exceeds D-01's ceiling of six.

### The widget table (D-02: chosen by kind, never by configuration)

Three components, twelve kinds:

| Widget | Kinds | Presentation |
|---|---|---|
| `KnobSwatches.svelte` | `colour` | a row of fixed swatches. RGB444, because `quantiseColour` snaps every stored colour to 17-step channels anyway and the stamp carries 4 bits per channel — a free picker would be a visible lie. **Not `<input type="color">`**: it opens an OS panel, cannot be styled into the identity, and gives 4096 steps the state cannot hold |
| `KnobSegments.svelte` | `direction`, `mode`, `bend`, `spring`, `scale`, `feel` | a segmented radio group, 2–4 options with words |
| `KnobDial.svelte` | `speed`, `size`, `count`, `note`, `amount` | a detent stepper with `◀ ▶` and a value readout in `--font-mono` |

Checked against every value set in the tree: Lua entries use `colour`, `count`, `amount`, `note`,
`scale`, `speed`, `size`; presets use all twelve. `KnobDial` handles both a 3-detent `size` (aurora)
and a 16-detent `amount` (euclid's MIDI channel) without a per-configuration branch.

### The uniform knob descriptor

One shape serves both routes, which is what makes the panel unable to tell them apart:

```ts
// src/lib/tune/model.ts
export type KnobDescriptor = {
  id: string;              // stable within the entry; the reset target
  label: string;           // "Speed", "Ring colour"
  kind: KnobKind;          // picks the widget, never the field
  values: readonly KnobValue[];  // ordered, ≥2; index is the whole state
  default: number;         // an INDEX
};
export type KnobValue = { label: string; swatch?: string };
```

For a Lua entry this is `LuaKnob` verbatim (it already has `id`, `label`, `kind`, `values`,
`default`, and `CatalogEntry.defaults` maps id → index). For a compiler entry HANGAR authors the
descriptor list per preset, plus one `apply(state, index): PadState` per knob using `withChange`.

**The invariant that keeps HANGAR honest against BOTOR:** assert in Vitest that, for every preset,
`new Set(descriptors.map(d => d.kind))` minus `{"brightness-kind"}` equals
`new Set(presetById(id).knobs)`. If a vendored re-sync changes a card's declared knobs, the spec goes
red and names the card. Do not hand-write that set twice.

---

## Live recompile

### The preview path

`PadSim` has `setState(state: PadState)` (pad-sim.ts:351) which calls the same private `rebuild` as
`reset()`. Its own comment prices it: "at 243 layer structs a full rebuild costs microseconds and
buys equivalence." So a knob change on a compiler entry is *not* expensive and *is* firmware-faithful
— it re-runs Setup, exactly as a real config write would.

`SimEngine` (src/lib/sim/engine.ts) deliberately omits `setState`, with a written argument that must
not be re-litigated: the uniform answer to a state change is `createEngine`. Follow it. For a
compiler entry `createEngine` is one synchronous constructor; for a Lua entry it is a fresh VM, which
a token substitution needs anyway.

**The pitfall, and a small addition that removes it.** `SimHost.register(id, canvas, engine)` calls
`unregister(id)` first, which sets `canvas.width = 0`, and then re-registers with
`intersecting: false` and `inWindow: true`. Swapping an engine through `register` therefore tears
down the canvas backing store, loses the observer state, and leaves the pad not ticking until the
`IntersectionObserver` fires again. Add:

```ts
/** Swap the engine under an id, keeping the canvas, the observer and the slot state. */
replaceEngine(id: string, engine: HostEngine): void {
  const entry = this.entries.get(id);
  if (entry === undefined) return;
  entry.engine = engine;
  if (this.reduced) this.stillFrame(entry);
  this.paint(entry, this.deps.now());
  this.wake();
}
```

Eight lines, node-testable with the existing injected `HostDeps`, and it is what gives D-06's
"the previous engine keeps painting until the new one has run Setup" a mechanism: for the Lua route,
`await createEngine(entry, knobs)` first, then `replaceEngine`. The old engine keeps painting for the
whole await.

**Reduced motion.** `SimHost` snaps to a still frame under `prefers-reduced-motion`. A swap must
re-run `stillFrame`, which the snippet above does. Without it a reduced-motion visitor would see the
old frozen frame after every knob turn.

### The compile path (cost only)

Measured on this machine, in Node, with the formatter initialised:

| preset | `compile() + cost()` |
|---|---|
| starfield | 1.13 ms |
| pinwheel | 1.15 ms |
| faders | 1.73 ms |
| radar | 1.87 ms |
| joystick | 2.23 ms |
| dial | 2.54 ms |
| aurora | 2.79 ms |
| ninepads | 2.81 ms |
| tpad | 3.99 ms |
| `fit()` on a fitting state | 4.4 ms |

`cost()` calls `measure()` twice (once per event) and `measure()` is `GridScript.compressScript`,
which crosses the WASM boundary. Budget 3–10 ms in a browser. D-06's ~120 ms debounce is generous and
correct: it also collapses a slider drag into one compile.

**`fit()` must not be called on every keystroke.** It compiles once per ladder step (`N+1` minifier
calls, the ledger's comment says so explicitly). Since the ladder never produces steps in HANGAR,
call `fit()` **only** when `cost().fits === false` — which is never, in practice, and free.

### The formatter gate and D-08

`padReady()` (src/lib/pad/ready.ts) is memoised and awaits `initLuaFormatter()` (628 KB WASM) then
`padCompilerReady()`. `PadSim` is deliberately outside it. The meters are the only thing that needs
it, which is why the "quiet measuring state" in D-08 is correct and easy.

**`requestIdleCallback` is not available in Safari stable** — WebKit ships it behind a Develop /
Settings feature flag only, and MDN records it as not Baseline for that reason. D-08's prefetch must
be:

```ts
const idle = (fn: () => void) =>
  typeof requestIdleCallback === "function"
    ? requestIdleCallback(fn, { timeout: 2000 })
    : setTimeout(fn, 200);
```

**The chunk guards must not regress.** `src/lib/config-shape.spec.ts` test 13 walks
`src/routes/+page.svelte`, `src/routes/c/[id]/+page.{svelte,ts}` and **every file in
`src/lib/ui/`**, strips comments, and matches `from "…"` against
`COMPILER_MARKERS = ["vendor", "intechstudio", "lib/pad"]`. It matches the specifier text, so
**`import type { PadState } from "…/vendor/…"` fails it too.** Test 14 then asserts the built
`build/index.html` and `build/c/aurora/index.html` reference no chunk containing
`GRID_PARAMETER_ELEMENT_POTMETER`.

The architecture that satisfies both is already proven by `Coverflow.svelte`:

```
src/lib/tune/view.ts     ← plain view types, ZERO vendor imports. UI components import type from here.
src/lib/tune/model.ts    ← imports the vendored compiler and $lib/pad. NEVER statically imported by a UI file.
src/lib/ui/TunePanel.svelte
  onMount → const { buildTuner } = await import("$lib/tune/model");
```

`$lib/catalog/front-door.ts` (zero imports) versus `$lib/catalog/types.ts` (imports the vendor) is
the same split, already in the tree. Copy it.

---

## The meters

`cost(result, reserved?)` returns:

```ts
type Budget  = { used: number; limit: number; free: number };   // limit is always EVENT_BUDGET = 908
type PadCost = { setup: Budget; timer: Budget; slotsFree: number; fits: boolean };
```

`used = Math.max(compressScript(lua).length, lua.length) + reserved`. The raw length wins for all
nine presets, which is worth knowing: a minifier regression would not move these numbers, and
`preset-baseline.json` already records the compressed lengths separately for the D-11 bump gate.

`chars / 908` and a percentage are `used`, `EVENT_BUDGET`, `Math.round(used / 908 * 100)`. Use
`--font-mono` — 04-UI-SPEC reserves it for exactly three things, one of which is "(from Phase 5) the
`chars / 908` meters".

**Do not pass `reserved` in Phase 5.** The settings stamp is already inside `setupLua` (it is the
marker name of the first Setup action, `--[[@cb#z.<payload>]] body`), so `cost()` charges it. There
is no hidden reserve today. Phase 7 may add one for an install marker — if it does, every number in
this document moves and `tpad` at 902 goes over. Record that as the one live route to TUNE-05.

**`validate()` already writes the over-budget sentence**, in BOTOR's voice, per event:
`This pad needs ${-budget.free} more characters than it has room for.` Use it rather than authoring a
new one — `validateCompiled()` in `src/lib/pad/index.ts` already wraps it behind the gate.

---

## The fit ladder

`fit(state, { user?, reserved?, pinned? })` returns a `FitPlan`. Read the type carefully, because it
answers three of the objective's questions directly:

- **`FitStep.label`** is commented "The exact words the panel prints." Examples the code produces:
  `Stop drawing the control on the pad`, `Turn off fine resolution`,
  `Change the look from Drift to Wave`, `Change the touch response from Bloom to a comet trail`,
  `Turn off the touch response`, `Turn off the look`. TUNE-04's one line is `steps[0].label`, with no
  authoring needed.
- **`FitStep.saves: { setup, timer }`** is the measured character delta of that step, and
  **`FitStep.apply(state)`** returns the state with the step applied. That pair *is* TUNE-05's
  one-click back-off: render `steps[0].label` as the button, call `steps[0].apply(current)` on click.
- **`FitPlan.resolved`** is the fully-laddered state, present only when `fits && steps.length > 0`.
- **`FitPlan.blocked`** is `"sends"` or `"usercode"` when no ladder exists. The comment says why:
  "Sends never sheds past fine resolution, because a fader bank quietly becoming three faders is the
  silent lie this product exists to prevent."
- **`options.pinned: PadSheet`** — "the control the user's hand is on. The compiler never proposes
  degrading the thing they just moved." HANGAR should pass the `PadSheet` (`"look" | "touch" |
  "sends"`) of the knob most recently turned. That is also the honest answer to "name the knob that
  pushed it over": the compiler already refuses to blame it.

**`fit()` proposes and never applies.** So TUNE-04's phrasing ("when the fit ladder trims a feature")
requires HANGAR to choose: apply `resolved` and announce it, or offer and let the user click. Given
`fit()` never fires in practice, take the cheaper and more honest option: **offer, never apply.**
The preview then always shows exactly the state the knobs describe, which is the property the
compiler's own header says it exists to protect.

**Lua entries: state nothing.** D-10 is right for them and Phase 8 proved it
(`lua-entries.spec.ts`, "stays canonical and in budget across the whole knob cross-product"). There
is no ladder for a Lua entry and no partial state to trim. Render the meters and no ladder line.

---

## The stamp and the URL

### The formats

`STAMP_PREFIX = "z."`, `STAMP_ALPHABET = "0123456789abcdefghijklmnopqrstuv"` (base **32**, not 36 —
D-12's "base36" is loose wording; the alphabet is 32 characters and the writer packs 5 bits per
character). Formats:

| Letter | Meaning | Emitted when |
|---|---|---|
| `p` | preset reference, `p<presetId>` | `state.preset` is set and matches `^[0-9a-z]{1,12}$` |
| `a` | v1 field dump | default |
| `b` | v1 + xy `axes` bits + the dial branch | `sends.kind === "dial"` or xy `axes !== "both"` |
| `c` | v2 layout + a 3-bit brightness tail (1–4 only) | `brightness !== 5` |
| `d` | v2 layout + xy spring/bend block + zones scale/latch block + a 3-bit brightness tail (1–5) | joystick or scale/latch fields in play |

Measured round-trips: `encodeStamp(PRESETS[i].state)` gives `paurora`, `ppinwheel`, `pstarfield`,
`pradar`, `pjoystick`, `pninepads`, `pfaders`, `pdial`, `ptpad`. A tuned aurora (colour `#ff0088`,
speed 7) gives `at7ghh1pv8j00` — 13 characters — and
`JSON.stringify(normalisePadState(a)) === JSON.stringify(decodeStamp(stamp))` is **true**. The
identity holds because `normalisePadState` quantises colours to RGB444 in the *state*, not in the
codec; the comment at `quantiseColour` says so explicitly.

`decodeStamp` fails closed on: an unknown format letter, a kind index no longer emitted, a field out
of domain, a set reserved bit, a `d` payload whose fields do not *need* `d`, a truncated payload, and
a non-zero tail (`finished()`). All of them return `undefined`. That is SHARE-03's whole mechanism,
already written.

### The HANGAR format letter for Lua entries

BOTOR's payload alphabet is `a`–`v`. Its format letters so far are `a`, `b`, `c`, `d`, `p` and its
next will be `e`. **Claim `w`, `x`, `y`, `z` for HANGAR** and document the allocation — those four
are outside the base-32 alphabet, so BOTOR's `BitWriter` can never emit them as payload, and BOTOR
would need eighteen more format bumps to collide.

Use **`x`** for the Lua knob-index format. Payload, one base-32 character each:

```
x <shape> <i0> <i1> … <i(n-1)>

shape  = STAMP_ALPHABET[ (knobs.length * 7 + Σ(values.length)) % 32 ]   // a tripwire, not a hash
i(k)   = STAMP_ALPHABET[ index into entry.knobs[k].values ]
```

Decoder rejects, and lands on the base configuration with SHARE-03's message, when: the length is not
`2 + entry.knobs.length`; any character is outside the alphabet; the shape character disagrees; any
index is `>= values.length`. Add a Vitest assertion that **no knob anywhere has more than 32 values**
(today's maximum is 16, euclid's MIDI channel) so the one-character encoding cannot silently truncate.

The shape character is what makes an *added, removed or resized* knob a graceful failure rather than
a silently wrong restore. It does not catch a **reordered `values` array** — so add a second Vitest
rule that `LuaKnob.values` is append-only, checked against a committed fixture, in the same spirit as
`preset-baseline.json`.

### The entry-consistency check (SHARE-03's "never a subtly wrong one")

`decodeStamp("pdial")` succeeds. Nothing stops `/c/aurora/#z.pdial` from decoding to Dial's state and
rendering it under Aurora's name plate. Required guard, and it is cheap:

```
1. decode → PadState, else SHARE-03.
2. read each of the entry's knob descriptors OUT of the decoded state → an index vector.
3. rebuild: start from the entry's base state, apply every knob at its read index.
4. require encodeStamp(rebuilt) === the payload. Otherwise SHARE-03.
```

Step 4 is a one-line assertion that the stamp is reachable from *this entry's* knobs and nothing
else. It also covers the case where a future vendored re-sync widens a field HANGAR does not expose.

### The envelope, and why `replaceState` must not be involved

`Coverflow.svelte:260` is:

```ts
replaceState(resolve("/c/[id]", { id: heroId() }), page.state);
```

`resolve()` returns `/c/aurora` — **no fragment**. Any `replaceState` on a step therefore erases the
hash. The comment above it also records that `svelte/no-navigation-without-resolve` accepts only an
empty string or a `resolve()` call as the first argument, and that "building a concatenated string
the rule cannot type-check would be the worse trade."

**SHARE-05 (knob drags update the hash) is deferred.** Take the gift: **Phase 5 never writes the
hash.** `COPY LINK` composes the URL as a plain string and puts it on the clipboard; nothing
navigates; `Coverflow`'s route logic is untouched exactly as D-13 requires; the lint rule is never
engaged.

```ts
// src/lib/share/url.ts — one helper, one unit test, no navigation.
export const SITE_ORIGIN = "https://hangar.sabotond.workers.dev";  // hoisted from scripts/deploy.mjs
export function shareUrl(id: string, stamp: string | undefined): string {
  return `${SITE_ORIGIN}/c/${id}/${stamp === undefined ? "" : `#${STAMP_PREFIX}${stamp}`}`;
}
```

Note the trailing slash: `trailingSlash = "always"` is set in `src/routes/+layout.ts`, so `/c/aurora/`
is the canonical path and `resolve()`'s slash-less form is not what a shared link should carry.

**Emit no hash at the defaults.** A URL with no fragment *is* the base configuration, which is both
prettier and exactly what SHARE-01 restores. Only emit a stamp when the knob indices differ from
`entry.defaults`.

**Reading it.** On mount, `page.url.hash` is available on the prerendered `/c/[id]/` page. D-13 says
apply it after the coverflow has centred the entry; the natural point is inside the same `onMount`
async block that builds the engines, after `adopt()`/`syncHost()`.

**Auto-choose on a stamped link.** `/c/{id}` lands **un-chosen** (04-UI-SPEC, Routes and deep links),
so a stamped link would show the tuned pad running but no knobs. Recommend auto-choosing when a valid
stamp is present, via `replaceState("", { chosen: true })` — Phase 4's `unchoose()` already handles
the `pushedChosen === false` case by replacing rather than going back, so nothing new is needed. Flag
it to the designer as a visible behaviour change, not a mechanism problem.

**A note on SHARE-03's wording.** `decodeStamp` declines *unknown* formats, which in practice means
formats **newer** than the deployed build — but HANGAR always deploys the latest build, so the
realistic failure is a corrupted or hand-edited stamp, or one made before a knob changed. The copy
should say what is true for all three: something closer to *"That link was made with a different
version of this page, so here is the configuration as it ships."* Take the exact wording to the user;
"older" alone is not quite right.

---

## COPY LINK

`navigator.clipboard.writeText` — verified against MDN browser-compat-data (`api/Clipboard.json`,
fetched 2026-09-04):

| Browser | Added | Note from BCD |
|---|---|---|
| Chrome | 66 | from 107 must be called in a user-gesture handler, or hold `clipboard-write` |
| Firefox | 63 | must be called within user gesture event handlers |
| **Safari** | **13.1** | **must be called within user gesture event handlers** |
| **iOS Safari** | mirrors Safari | — |

So **iOS Safari can copy**. D-17's select-and-copy fallback is a fallback for an *insecure context*
or a browser without the API at all, not for iOS.

**The one real trap, and it is easy to walk into.** Safari expires the user activation across an
`await`; the call then rejects with `NotAllowedError`, and multiple independent write-ups describe
exactly this. The failing shape is:

```ts
// WRONG on Safari.
async function copy() {
  const { encodeStamp } = await import("$lib/tune/model");  // activation spent here
  await navigator.clipboard.writeText(shareUrl(id, encodeStamp(state)));
}
```

The fix is not a Safari workaround, it is a design rule: **precompute the URL.** The stamp is pure
(`encodeStamp` needs no formatter and no WASM — only `cost()` does), the tune module is already
loaded by the time a knob has been turned, and the string is ~40 characters. Recompute it on every
knob change into a plain `$state` string and have the handler be:

```ts
function copy(): void {
  navigator.clipboard.writeText(url).then(confirmed, fellBack);  // no await before the call
}
```

Also required by the spec: the document must be **focused**, and the context must be **secure**.
`http://127.0.0.1:4173` (the Playwright harness) and `http://localhost` are both potentially
trustworthy, so the e2e can exercise the real path.

**The fallback** (no `navigator.clipboard`, e.g. `file://` or a locked-down context): render the URL
into a visible, focused, read-only `<input>` with `select()` called, and change the control's copy to
say so. `document.execCommand("copy")` is deprecated and should not be the primary path, but it is
the only thing that works in that case and costs three lines behind a capability check.

**Confirm state (SHARE-02).** The control's own state, per D-12 — label swaps to `LINK COPIED` for
~2 s then reverts, `aria-live="polite"` on the label so it is announced. No toast; the site has no
toast vocabulary and 04-UI-SPEC's copy rules forbid inventing one.

**Testing it in Playwright.** `context.grantPermissions(["clipboard-read", "clipboard-write"])` is
Chromium-only. So: assert the round-trip via `navigator.clipboard.readText()` in the chromium
project, and in the WebKit project assert only the **confirm state** (which is the requirement's
actual wording).

---

## The OG image

### Where the files go — decided by SvelteKit's own crawler

Read from the installed source, `node_modules/@sveltejs/kit/src/core/postbuild/crawl.js`: the
prerender crawler's meta-property allow-list contains **`og:image`**, `og:image:url`,
`og:image:secure_url`, `og:url`, `og:video*`, `og:audio*`, and it calls `push_href(content)` for a
`META` tag whose property is in that list. `vite.config.ts`'s `handleHttpError` rethrows every 404
except the three postbuild artefacts.

Therefore: **generate the PNGs into `static/og/` before `vite build`.** Then the asset exists as a
real static file when the crawler runs, and the `og:image` value can be the absolute production URL
(which the crawler treats as external and ignores). A `+server.ts` endpoint would work in principle
but adds a `trailingSlash` question and a crawler-origin question for nothing.

```jsonc
// package.json
"build": "node scripts/gen-og.mjs && vite build && node scripts/postbuild.mjs"
```

Add `static/og/` to `.gitignore` — it is a build artefact, and a clean checkout regenerates it.

### Loading TypeScript from a Node build script

`scripts/capture-preset-baseline.mjs` records that plain `node` can import `_pad.ts` (Node 24 strips
types) but **cannot** import `pad-sim.ts`, because its extensionless `from "./_pad"` is not
resolvable by Node's ESM loader. The OG generator needs `PadSim`, the catalog, and (for 5.1) the Lua
host, so plain Node is out.

**Measured working answer: Vite's own Node API.** No new dependency; Vite is already a devDependency.

```js
import { createServer } from "vite";
const server = await createServer({
  configFile: "vite.config.ts", server: { middlewareMode: true },
  appType: "custom", logLevel: "warn",
});
const { PadSim } = await server.ssrLoadModule("/src/vendor/botor/pad-sim.ts");
const { FRONT_DOOR } = await server.ssrLoadModule("/src/lib/catalog/front-door.ts");
// … render …
await server.close();
```

**Measured: 135 ms to spin the server and load two modules**, and it resolved `$lib`, extensionless
TS and the pinned protocol package correctly. Every number in this document was produced this way.

### PNG with `node:zlib` only — measured

- **`zlib.crc32()` exists in Node 24** (`typeof require("node:zlib").crc32 === "function"`, verified
  on Node v24.14.0). No hand-rolled CRC table.
- PNG structure: 8-byte signature `89 50 4E 47 0D 0A 1A 0A`, then `IHDR` (width, height, bit depth 8,
  colour type 2 = truecolour RGB, all-zero compression/filter/interlace), then `IDAT` =
  `zlib.deflateSync(scanlines)` where each scanline is prefixed with filter byte `0` (None), then
  `IEND`. Each chunk is `length(4) + type(4) + data + crc32(type+data)(4)`.
- **Measured size:** a realistic 1200×630 mostly-black frame with a lime pad block deflates to
  **4,321 bytes of IDAT** — a ~4 KB PNG. Discord's guidance is a maximum of 8 MB and the practical
  advice is under 1 MB. Enormous headroom.
- `deflateSync` emits an RFC-1950 zlib stream, which is exactly what `IDAT` requires. No adler32 by
  hand either.

Assert in Vitest: PNG signature bytes, IHDR width 1200 / height 630, colour type 2, total size under
1 MB, and one non-black pixel (the "the pad went black" tripwire, mirroring `frames.spec.ts`'s
`nonZeroBytes`).

### Text in Node without a browser — the answer to D-15's research question

**You cannot rasterise Quicksand in Node without adding a dependency, and every candidate is
disqualified:**

| Approach | Verdict |
|---|---|
| `opentype.js` / `fontkit` | pure JS and they parse the TTF, but neither ships a **rasteriser** — they give glyph outlines. Filling those with anti-aliasing is a scanline rasteriser HANGAR would have to write and test |
| `satori` + `@resvg/resvg-js` | `resvg-js` is a native N-API module with prebuilt binaries. D-15 forbids native deps |
| `sharp`, `node-canvas`, `skia-canvas` | all native |
| headless browser screenshot | explicitly forbidden by D-15 |
| pre-rasterised glyph atlas committed to the repo | the atlas itself has to be produced by one of the above, and a fixture no checked-in script can regenerate is against this repo's grain (`preset-baseline.json`, `golden-frames.json`, `frames.json` are all script-produced) |

**Recommendation: no text pixels. Pad picture only.** Discord renders `og:title` as bold text
*above* the image, so the name is on the unfurl either way — D-14's "unfurls with the pad picture and
title" is fully satisfied. This also answers the user's open question 1 with evidence rather than
taste.

**If the designer insists on a mark**, the only zero-dependency option is a hand-authored bitmap font.
Scoped to the wordmark `HANGAR` that is **five unique glyphs** (H, A, N, G, R) at, say, 7×9 cells,
scaled up as blocks — which is arguably *more* on-identity than Quicksand, since the whole visual
language is a 9×9 LED grid. Roughly 45 lines of data and a 10-line blitter, fully unit-testable.
Offer it as a variant, not the default.

### The picture

Everything the browser draws around a pad is CSS — `PadCanvas`'s layer 1 dot field is a
`radial-gradient`, layer 3 the gutter gradients, layer 4 the border. None of it exists in Node, so
`renderOgPixels(frame: Uint8Array): Uint8Array` is a small, pure, testable HANGAR function that
reproduces the recipe into an RGB buffer: true black ground, the 81 cells as squares with the
`--color-line-soft` dot for unlit cells, `--color-line` frame, and the LED colours from
`PadSim.frame` untouched (04-UI-SPEC: "no CSS may author a colour the simulator did not").

Tick choice: `frames.json` samples `[0, 37, 101, 500, 1009]`. Pick one constant (**101** is past
Setup and inside every animation's first cycle) and record it in the script's header so a changed
image is a diffable decision. Every entry in `FRONT_DOOR` has `restsBlack: false`, so no OG image
will be a black square — assert it.

### The head tags

Currently `src/routes/c/[id]/+page.svelte` emits only `<title>` and `<meta name="description">`.
Add, in `<svelte:head>` (MEDIUM confidence — Discord publishes no first-party spec; two independent
aggregators agree and the `twitter:card` behaviour is consistently reported):

```html
<meta property="og:type" content="website" />
<meta property="og:site_name" content="HANGAR" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={`${SITE_ORIGIN}/c/${entry.id}/`} />
<meta property="og:image" content={`${SITE_ORIGIN}/og/${entry.id}.png`} />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content={`${entry.name} running on a ZONA’s 9 by 9 pad`} />
<meta name="twitter:card" content="summary_large_image" />
```

`twitter:card = summary_large_image` is the tag that makes Discord render the **large** embed rather
than an 80×80 thumbnail. Ship it even though nothing here is about Twitter.

`/` needs the same treatment with a shelf-level image; `og:image` on the root is what makes a bare
`hangar.sabotond.workers.dev` link unfurl. That is one extra generated PNG, not a new mechanism.

**The honest limitation, and it must be recorded.** `worker/index.js` gates the whole site behind
Basic Auth (`run_worker_first: true`, fail-closed on a missing `SITE_PASSWORD`). Discord's crawler
cannot fetch anything, so the unfurl **cannot be verified in production until the gate comes down on
launch day**. Phase 5 can verify everything structurally — file exists, dimensions, PNG signature,
size, tags present, absolute URLs, image reachable over HTTP through `wrangler dev` with credentials
— and nothing more. Say so in the SUMMARY rather than claiming SHARE-04 is observed.

---

## Scope reality: Lua knobs have no visitor-facing surface in Phase 5

`FRONT_DOOR` is eight entries: aurora, pinwheel, ninepads, starfield, joystick, radar, faders, dial.
`tpad` and **all seven Lua entries** are in `EXCLUDED_FROM_ROW` (Phase 8 D-18: new entries do not join
the row automatically). `src/routes/c/[id]/+page.ts` generates `entries()` from `FRONT_DOOR`, so
`/c/euclid/` does not exist as a page.

Consequences for the planner:

- The tune panel on the front door only ever meets **compiler-driven preset entries**.
- The Lua knob path is required by D-02 and D-13 and must be built, but its only exercisable surface
  is Vitest plus the unlinked `/dev/catalog/` probe page.
- SHARE-04 "every catalog configuration" cannot mean every `CATALOG` entry, because eight of them have
  no page to unfurl. Generate OG images from the **same source the route's `entries()` uses**, so
  Phase 5.1 gets its images by changing one import rather than the generator.
- Do **not** silently add Lua entries to the row to make the phase demoable. That is a curation
  decision the user reserved (CONTEXT.md open question 2), and D-18 forbids it.

---

## Every browser

### Playwright

`playwright.config.ts` has **no `projects` array** today, so all 21 e2e tests run in the default
Chromium. Adding a bare second project **doubles every test**. Scope it:

```ts
projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "webkit-phone", use: { ...devices["iPhone 15"] }, grep: /@webkit/ },
]
```

`devices["iPhone 15"]` is `{ defaultBrowserType: "webkit", viewport: 393×659, isMobile: true,
hasTouch: true }` (read from the installed `@playwright/test`). Tag the front-door and tuning specs
`@webkit` so only they run twice.

**The WebKit browser is not installed on this machine.** `~/AppData/Local/ms-playwright/` contains
`chromium-1234`, `chromium_headless_shell-1234`, `ffmpeg-1011`, `winldd-1007` and no webkit. Run
`npx playwright install webkit` — free, one download, no licence. Playwright is 1.62.1 here and the
config's `httpCredentials` and `webServer` are shared across projects, so nothing else changes.

### The WebKit gaps that actually matter

| Concern | Verdict | Source |
|---|---|---|
| `requestIdleCallback` | **absent in Safari stable** (feature-flagged only). D-08's prefetch needs a `setTimeout` fallback | MDN: "not Baseline… does not work in some of the most widely-used browsers" |
| Clipboard | works, Safari 13.1+ / iOS — but the activation dies across an `await` | MDN BCD `api/Clipboard.json` |
| `overflow: clip` (used at `Coverflow.svelte:687`) | Safari **16**+, iOS mirrors | MDN BCD `css/properties/overflow.json` |
| `image-rendering: pixelated` (used at `PadCanvas.svelte:73`) | Safari **10**+, iOS mirrors | MDN BCD `css/properties/image-rendering.json` |
| `:has()` (used at `NamePlate.svelte:129`) | Safari 15.4+ — WebKit shipped it first | MDN |
| `filter: brightness()` on the slot wrapper | fine; it is on a 2D wrapper, not a 3D-transformed canvas |  |
| Web Serial | absent, permanently — already the DEGR-02 path Phase 4 tests | WebKit standards position: oppose |
| WebAssembly (formatter 628 KB, VM 271 KB) | supported; the download cost on a phone is the argument for D-08's laziness |  |

None of these is a blocker. The two that need code are `requestIdleCallback` and the clipboard
gesture window; both are three-line fixes stated above.

### The panel at phone widths

D-11 says the knob rack is 96 px, wraps at phone widths and never scrolls horizontally. **Six knobs
do not fit in 96 px** with 44 px touch targets — that is 16 px per knob. A 2-column × 3-row grid of
44 px cells is ~148 px, and with the 56 px meter block the region is ~204 px against a 152 px
reserve.

The reserve's purpose (04-UI-SPEC and `ChosenPanel.svelte`'s header) is that **the primary control
does not jump upward**. The `TUNING` region sits *below* `TRY ON DEVICE` and above the separator, so
growth pushes only `KEEP ON DEVICE` down — the stated harm does not occur. Recommend the UI designer
amend the reserved height to the measured real value and record it; do not try to compress six knobs
into 96 px, and do not add horizontal scroll (D-11 forbids it explicitly).

### The first new colour

04-UI-SPEC's Color section states: *"No third colour earns itself in Phase 4… The first colour that
will genuinely earn itself is a warning on the flash-write confirmation in Phase 7."* TUNE-05 gets
there first.

**`src/lib/ui/identity.spec.ts` will go red.** Its test *"the token ladder is exactly the eight tokens
the spec approved"* asserts the exact set, and *"the ground is true black and nothing declares a third
hue"* scans every hex and `rgb()` in `src/app.css` and requires each to be `#000000` or
`214 255 78 / α`. Adding an alarm token is therefore a **deliberate, reviewed spec change**, not an
incidental edit — it needs the UI-SPEC amendment and the identity spec updated in the same task, with
the new token's contrast on black computed and asserted like every other row.

Given the headline finding, there is a cheaper option worth putting to the designer: since the
over-budget state is unreachable, the *visible* meter states are calm / close / tight, none of which
needs red. Ship the alarm token only if the `/dev/tune/` probe is the thing being coloured, and keep
the shipped palette at eight.

---

## Recommended file structure

```
src/lib/tune/
├── view.ts          # ZERO vendor imports. KnobView, MeterView, TuneView. UI imports type from here.
├── model.ts         # imports the vendored compiler + $lib/pad. Dynamically imported only.
├── knobs.preset.ts  # the nine per-preset descriptor lists + brightness (the recovered table)
├── knobs.lua.ts     # LuaKnob -> KnobDescriptor, plus renderLua wiring
├── state.ts         # withChange (reimplemented), applyKnob, readKnob, resetAll
├── surprise.ts      # the bounded fits() re-roll
└── *.spec.ts
src/lib/share/
├── stamp.ts         # format "x" codec + the entry-consistency check + SHARE-03 classification
├── url.ts           # SITE_ORIGIN, shareUrl(), no navigation
└── *.spec.ts
src/lib/ui/
├── TunePanel.svelte      # the rack + meters; dynamic import of $lib/tune/model in onMount
├── KnobSwatches.svelte   # kind: colour
├── KnobSegments.svelte   # kinds: direction, mode, bend, spring, scale, feel
├── KnobDial.svelte       # kinds: speed, size, count, note, amount
├── BudgetMeter.svelte    # one event; chars / 908 + percentage in --font-mono
└── CopyLink.svelte       # precomputed URL, gesture-safe, confirm state
src/lib/sim/host.ts       # + replaceEngine(id, engine)
src/routes/dev/tune/      # unlinked probe: forced over-budget cost, the only e2e path to TUNE-05
scripts/gen-og.mjs        # vite ssrLoadModule -> PadSim -> RGB buffer -> node:zlib PNG -> static/og/
src/lib/og/
├── render.ts        # renderOgPixels(frame) -> 1200x630 RGB. Pure, node-testable.
├── png.ts           # encodePng(rgb, w, h) using node:zlib only
└── *.spec.ts
```

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Character cost of a config | a length heuristic, a regex minifier | `cost()` / `measureLua()` behind `padReady()` | `max(compressScript(lua).length, lua.length) + reserved` is the exact function the fit ladder is calibrated on (D-07) |
| Encoding a tuned `PadState` | a JSON-to-base64 scheme | `encodeStamp` / `decodeStamp` | measured identity round-trip; five versioned formats; fail-closed on every corruption class; and it is what BOTOR can reopen |
| CRC-32 for PNG chunks | a 256-entry lookup table | `require("node:zlib").crc32` | present in Node 24, verified on this machine |
| zlib stream for `IDAT` | an adler32 + raw-deflate assembly | `zlib.deflateSync` | emits RFC-1950 directly, which is exactly what `IDAT` holds |
| Loading TS from a build script | `tsx`, `vite-node`, a bundling step | `vite.createServer().ssrLoadModule()` | Vite is already a devDependency; measured 135 ms; resolves `$lib` and extensionless TS |
| The words for a trimmed feature | authored copy per feature | `FitStep.label` | commented "the exact words the panel prints"; already in BOTOR's voice |
| The over-budget sentence | authored copy | `validate()` → `This pad needs N more characters than it has room for.` | already worded, already gated by `validateCompiled()` |
| Brightness percentages / speed seconds / decay ms | magic numbers in the UI | `BRIGHTNESS_TABLE`, `SPEED_TABLE`, `DECAY_TABLE`, `DIAL_SENSE_TABLE` | they carry the display words and the detent indices the stamp encodes |
| Restarting a pad on a knob change | a bespoke engine cache | `createEngine` + a new `SimHost.replaceEngine` | `engine.ts`'s header argues the case for construct-over-mutate; `replaceEngine` only fixes the canvas teardown |
| A colour picker | `<input type="color">` | a fixed swatch row | the state is RGB444 (`quantiseColour`); 4096 steps would be a picker that lies |

---

## Common Pitfalls

### Pitfall 1: the tune panel drags the compiler into the first paint
**What goes wrong:** `config-shape.spec.ts` test 13 goes red, or worse, test 14 goes red only after a
production build.
**Why:** the guard matches the **specifier string** in every file under `src/lib/ui/`, so even
`import type { PadState } from "../../vendor/botor/_pad"` fails. And the built-HTML guard catches
anything that survives.
**How to avoid:** `src/lib/tune/view.ts` with zero vendor imports for the types; `await
import("$lib/tune/model")` inside `onMount` or a handler for the values. `Coverflow.svelte` already
does exactly this with `$lib/sim/engine`.
**Warning sign:** any `from` specifier containing `vendor`, `intechstudio` or `lib/pad` in a
`src/lib/ui/*` file.

### Pitfall 2: the stamp keeps saying `paurora` after a knob turn
**What goes wrong:** the shared link restores the untuned card, silently.
**Why:** `encodeStamp` short-circuits to `p<presetId>` whenever `state.preset` is set, and
`normalisePadState` does **not** clear it — the private `withChange` does.
**How to avoid:** reimplement `withChange` and route every knob write through it.
**Warning sign:** a tuned state whose stamp is 7–10 characters and starts with `p`.

### Pitfall 3: `register()` used to swap an engine
**What goes wrong:** the hero blanks for a frame and then stops ticking until the
`IntersectionObserver` fires again.
**Why:** `register` calls `unregister` (which sets `canvas.width = 0`) and re-enters with
`intersecting: false`.
**How to avoid:** `replaceEngine`. If you must use `register`, call `syncHost()` immediately after.

### Pitfall 4: `await` before `clipboard.writeText`
**What goes wrong:** copy silently fails on Safari and iOS with `NotAllowedError`; works everywhere
you tested.
**Why:** Safari expires transient activation across the await.
**How to avoid:** precompute the URL string on every knob change; the handler calls `writeText`
synchronously and attaches `.then`.

### Pitfall 5: `og:image` 404s the build
**What goes wrong:** `vite build` fails with a prerender error naming `/og/aurora.png`.
**Why:** SvelteKit's crawler follows `og:image` `content` (verified in the installed
`postbuild/crawl.js`), and `handleHttpError` rethrows every 404 except three known paths.
**How to avoid:** generate into `static/og/` **before** `vite build`. Do **not** widen
`handleHttpError` — that guard is how a genuinely broken footer link still fails the build.

### Pitfall 6: `replaceState` on a step eats the hash
**What goes wrong:** a stamped link loses its stamp on the first arrow press.
**Why:** `syncAddress()` replaces the URL with `resolve("/c/[id]", …)`, which has no fragment.
**How to avoid:** do not write the hash at all in Phase 5 (SHARE-05 is deferred). Stepping to another
entry *should* drop the stamp — it is a different configuration. Say so in the SUMMARY so it is not
read as a bug later.

### Pitfall 7: a stamp from a different entry decodes cleanly
**What goes wrong:** `/c/aurora/#z.pdial` renders Dial under Aurora's name plate — precisely the
"subtly wrong one" SHARE-03 forbids.
**How to avoid:** the four-step entry-consistency check above; step 4 (`encodeStamp(rebuilt) ===
payload`) is the whole guard.

### Pitfall 8: adding a Playwright project doubles the suite
**What goes wrong:** the e2e count jumps from 21 to 42+ and every count assertion in every plan goes
stale.
**How to avoid:** `grep: /@webkit/` on the WebKit project and tag only the front-door and tuning
specs. Record the observed baseline before the change and state the delta (Phase 8 D-17).

### Pitfall 9: `requestIdleCallback` is undefined on Safari
**What goes wrong:** the formatter never prefetches on iOS, so the first meter reading takes the full
628 KB download at the moment the visitor opens the panel.
**How to avoid:** the `setTimeout(fn, 200)` fallback.

### Pitfall 10: the meters jump on the first knob turn and look broken
**What goes wrong:** Setup goes from 250 to ~256 when the user moves a knob whose value is free.
**Why:** the stamp inside `setupLua` grows from `paurora` (7) to a field dump (12–20).
**How to avoid:** it is real and must not be hidden. Either say it once in the region's copy, or
accept it — but know why before someone files it as a bug.

---

## Code Examples

### Reproducing every measurement in this document

```js
// Any of the probes below. Run with: node probe.mjs
import { createServer } from "vite";
const server = await createServer({
  configFile: "vite.config.ts", server: { middlewareMode: true },
  appType: "custom", logLevel: "warn",
});
const pad = await server.ssrLoadModule("/src/lib/pad/index.ts");
const V   = await server.ssrLoadModule("/src/vendor/botor/_pad.ts");
await pad.padReady();                       // 628 KB WASM, memoised
for (const p of V.PRESETS) {
  const c = V.cost(V.compile(p.state));
  console.log(p.id, c.setup.used, c.timer.used, c.fits, V.encodeStamp(p.state));
}
await server.close();
```

### The over-budget sweep that found nothing (sweep A)

```js
const LOOKS = ["none","breathe","shimmer","scan","wave","swirl","ripple","drift","showpiece"];
const TOUCH = ["none","comet","perFinger","bloom","glow","disturb"];
const SENDS = ["none","xy","zones","faders","trackpad","dial"];
for (const L of LOOKS) for (const T of TOUCH) for (const S of SENDS)
for (const hi of [false,true]) for (const sg of [false,true]) {
  const d = V.defaultState();
  d.enabled = { look: L !== "none", touch: T !== "none", sends: S !== "none" };
  d.look.kind = L; d.touch.kind = T; d.sends.kind = S;
  d.sends.hiRes = hi; d.sends.showGrid = sg; d.sends.fingers = "each";
  d.sends.spring = true; d.sends.bend = "x"; d.sends.dialRadius = true;
  d.sends.scale = "major"; d.sends.toggle = true;
  const c = V.cost(V.compile(V.groundPadState(d)));
  if (!c.fits) console.log("OVER", L, T, S, hi, sg, c.setup.used, c.timer.used);
}
// observed: nothing printed. worst = 906 (none/none/trackpad).
```

### PNG with `node:zlib` only

```js
import { crc32, deflateSync } from "node:zlib";

const chunk = (type, data) => {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const body = Buffer.concat([head.subarray(4), data]);   // type + data
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(body), 0);                     // Node 24: no CRC table needed
  return Buffer.concat([head, data, tail]);
};

export function encodePng(rgb, width, height) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const dst = y * (1 + width * 3);
    raw[dst] = 0;                                          // filter: None
    rgb.copy(raw, dst + 1, y * width * 3, (y + 1) * width * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // colour type: truecolour RGB
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
// measured on a realistic 1200x630 pad frame: IDAT 4,321 bytes, PNG ~4 KB.
```

### The HANGAR Lua stamp codec

```ts
import { STAMP_ALPHABET } from "$lib/tune/model";   // re-exported from the vendored _pad
export const HANGAR_FORMAT_LUA = "x";               // HANGAR claims w, x, y, z

const shapeOf = (knobs: readonly LuaKnob[]) =>
  STAMP_ALPHABET[(knobs.length * 7 +
    knobs.reduce((n, k) => n + k.values.length, 0)) % 32];

export function encodeLuaStamp(entry: CatalogEntry, idx: Record<string, number>): string {
  return HANGAR_FORMAT_LUA + shapeOf(entry.knobs) +
    entry.knobs.map((k) => STAMP_ALPHABET[idx[k.id] ?? k.default]).join("");
}

export function decodeLuaStamp(
  entry: CatalogEntry, payload: string,
): Record<string, number> | undefined {
  if (payload[0] !== HANGAR_FORMAT_LUA) return undefined;
  if (payload.length !== 2 + entry.knobs.length) return undefined;
  if (payload[1] !== shapeOf(entry.knobs)) return undefined;
  const out: Record<string, number> = {};
  for (let i = 0; i < entry.knobs.length; i++) {
    const v = STAMP_ALPHABET.indexOf(payload[2 + i]);
    if (v < 0 || v >= entry.knobs[i].values.length) return undefined;
    out[entry.knobs[i].id] = v;
  }
  return out;
}
```

### The entry-consistency check for compiler stamps

```ts
export function restore(entry: CatalogEntry, payload: string): PadState | "stale" {
  const decoded = decodeStamp(payload);
  if (decoded === undefined) return "stale";
  const knobs = descriptorsFor(entry);
  let rebuilt = baseStateFor(entry);
  for (const k of knobs) rebuilt = k.apply(rebuilt, k.read(decoded));
  // The whole guard: a stamp this entry's knobs cannot produce is not this entry's stamp.
  return encodeStamp(rebuilt) === payload ? rebuilt : "stale";
}
```

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node | build scripts, prerender, Vitest | ✓ | v24.14.0 | — |
| `node:zlib` `crc32` | OG PNG chunks | ✓ | built-in, verified | hand-rolled CRC table |
| `node:zlib` `deflateSync` | OG `IDAT` | ✓ | built-in | — |
| Vite (Node API `ssrLoadModule`) | `scripts/gen-og.mjs` loading TS | ✓ | 8.x (devDependency), measured 135 ms | none acceptable |
| `@intechstudio/grid-protocol` | `compressScript` for the meters | ✓ | pinned `1.20260825.1135` | — |
| `wasmoon` | Lua engine for Lua-entry OG images (Phase 5.1) | ✓ | 1.16.0 | — |
| Playwright Chromium | existing e2e | ✓ | `chromium-1234` | — |
| **Playwright WebKit** | **D-17 / DEGR-01** | **✗** | — | **`npx playwright install webkit` — free, one download** |
| `wrangler dev` | the e2e harness | ✓ | 4.x, 4.6 s cold start | `npx sirv-cli build` |
| Real Discord unfurl | SHARE-04 end-to-end | ✗ | — | **none** — the Basic Auth Worker blocks every crawler until launch day. Verify structurally |
| `@fontsource/quicksand` TTF/WOFF rasterisation in Node | OG name text | ✗ | — | **omit the text**; `og:title` carries the name. Optional hand-authored bitmap wordmark |

**Missing with no fallback:** the production Discord unfurl. Record it as unverifiable in this phase
rather than claiming it.

**Missing with a fallback:** Playwright WebKit (one command), Node text rendering (omit the text).

---

## Validation Architecture

### Test framework

| Property | Value |
|---|---|
| Framework | Vitest 4.1.11, two projects (`server`, `sweep`), config inside `vite.config.ts`; Playwright 1.62.1 over `wrangler dev` |
| Config file | `vite.config.ts` (`test.projects`), `playwright.config.ts` |
| Quick run command | `npm run test:quick` |
| Full suite command | `npm run check && npm run lint && npm run test:quick && npm run test:sweep && npm run test:e2e` |

**Observed baselines, this machine, 2026-09-04 09:39, after the Phase 8 08-07 commit landed:**

| Command | Observed |
|---|---|
| `npm run test:quick` | **42 files, 559 passed + 1 todo (560)**, 4.6 s |
| `npm run test:sweep` | 1 file, 9 tests, ~40 s |
| `npm run test:e2e` | 21 tests as of the Phase 4 SUMMARY; `e2e/catalog.e2e.ts` was added by 08-07 and raises it |
| `npm run check` | 421 files, 0 errors |

The brief quoted 41 files / 556; the tree moved under it. **Per Phase 8 D-17, no plan may carry a
literal total** — re-observe with `npm run test:quick 2>&1 | node scripts/check-counts.mjs <f> <t>`
at the moment of planning and express every assertion as baseline + delta.

### Phase requirements → test map

| Req | Behaviour | Type | Command | Exists? |
|---|---|---|---|---|
| TUNE-01 | every entry exposes 3–6 knobs; descriptor kinds match `presetById(id).knobs` + brightness | unit | `npx vitest run --project server src/lib/tune/knobs.preset.spec.ts` | ❌ Wave 0 |
| TUNE-01 | every `KnobKind` maps to exactly one of the three widgets; the map is total | unit | `… src/lib/tune/view.spec.ts` | ❌ Wave 0 |
| TUNE-01 | a knob turn changes the hero canvas within one tick | e2e `@webkit` | `npx playwright test e2e/tuning.e2e.ts` | ❌ Wave 0 |
| TUNE-02 | `applyKnob` clears `preset` and `soloStream` and grounds the state | unit | `… src/lib/tune/state.spec.ts` | ❌ Wave 0 |
| TUNE-02 | `SimHost.replaceEngine` keeps `intersecting`, `inWindow`, `hero`; repaints; still-frames under reduced motion | unit (node, injected deps) | `… src/lib/sim/host.spec.ts` | ⚠️ extend |
| TUNE-02 | the recompile is debounced and the preview is not | unit (fake timers) | `… src/lib/tune/model.spec.ts` | ❌ Wave 0 |
| TUNE-03 | meter arithmetic: `used/908`, percentage, the four threshold states from `BUDGET_WARN`/`BUDGET_ERROR` | unit | `… src/lib/tune/meter.spec.ts` | ❌ Wave 0 |
| TUNE-03 | the two meters read different numbers and both change on a knob turn | e2e `@webkit` | `npx playwright test e2e/tuning.e2e.ts` | ❌ Wave 0 |
| TUNE-04 | a synthetic over-budget state produces `steps[0].label` and it is rendered verbatim | unit | `… src/lib/tune/ladder.spec.ts` | ❌ Wave 0 |
| TUNE-04 | **no reachable state produces a ladder step** — the finding, pinned | unit (sweep project) | `npm run test:sweep` | ❌ Wave 0 |
| TUNE-05 | over-budget disables `TRY ON DEVICE`, reddens one meter, offers `steps[0].apply` | e2e via `/dev/tune/` | `npx playwright test e2e/tuning.e2e.ts` | ❌ Wave 0 |
| TUNE-05 | the click never reaches the wire: zero `write()` calls recorded | unit (fake transport) | `… src/lib/tune/guard.spec.ts` | ❌ Wave 0 |
| TUNE-06 | double-click resets one knob to `default`; reset-all restores base + `preset` | unit + e2e | both | ❌ Wave 0 |
| TUNE-07 | property test: 2,000 `SURPRISE ME` draws per entry, all `fits()`, all differ from the previous state | unit | `… src/lib/tune/surprise.spec.ts` | ❌ Wave 0 |
| SHARE-01 | `decodeStamp(encodeStamp(s)) === normalisePadState(s)` over the full knob cross-product | unit (sweep) | `npm run test:sweep` | ❌ Wave 0 |
| SHARE-01 | Lua format `x` round-trips every entry's cross-product | unit | `… src/lib/share/stamp.spec.ts` | ❌ Wave 0 |
| SHARE-01 | opening `/c/aurora/#z.<stamp>` restores the knob positions | e2e | `e2e/tuning.e2e.ts` | ❌ Wave 0 |
| SHARE-02 | copy confirms in the control's own state | e2e `@webkit` | `e2e/tuning.e2e.ts` | ❌ Wave 0 |
| SHARE-02 | the copied text equals `shareUrl(id, stamp)` | e2e (chromium only — clipboard permissions) | `e2e/tuning.e2e.ts` | ❌ Wave 0 |
| SHARE-03 | rejects: unknown format, wrong shape char, out-of-range index, truncation, another entry's valid stamp | unit | `… src/lib/share/stamp.spec.ts` | ❌ Wave 0 |
| SHARE-03 | a bad stamp shows the message and the base configuration | e2e | `e2e/tuning.e2e.ts` | ❌ Wave 0 |
| SHARE-04 | PNG signature, IHDR 1200×630, colour type 2, size < 1 MB, ≥1 non-black pixel, one file per routed entry | unit | `… src/lib/og/png.spec.ts` | ❌ Wave 0 |
| SHARE-04 | each `/c/<id>/index.html` carries og:title, og:description, og:url, og:image (absolute), width, height, type, alt, twitter:card | unit over `build/` (guarded on `existsSync`, like `licence-notices.spec.ts`) | `… src/lib/og/head.spec.ts` | ❌ Wave 0 |
| SHARE-04 | the image is served over HTTP from the built site | e2e | `e2e/artifacts.e2e.ts` (extend) | ⚠️ extend |
| DEGR-01 | the front door, choosing, tuning, meters and copy-confirm all work on WebKit at a phone viewport | e2e `@webkit` | `npx playwright test --project webkit-phone` | ❌ Wave 0 |
| DEGR-01 | the formatter prefetch has a `setTimeout` fallback when `requestIdleCallback` is absent | unit | `… src/lib/tune/idle.spec.ts` | ❌ Wave 0 |
| (guard) | no `src/lib/ui/*` file names the vendor, the protocol package or `lib/pad` | unit | `src/lib/config-shape.spec.ts` tests 13/14 | ✅ exists — must stay green |
| (guard) | the built front door still preloads no protocol chunk | unit over `build/` | same | ✅ exists |

### Sampling rate

- **Per task commit:** `npm run test:quick`, plus `npm run lint` when a source file was touched.
- **Per wave merge:** `npm run check && npm run lint && npm run test:quick && npm run test:sweep`.
- **Phase gate:** all of the above plus `npm run test:e2e` (both projects) before `/gsd:verify-work`.

The two new sweep-project members (the reachability proof and the stamp cross-product round-trip) are
the anti-drift mechanism for this phase, exactly as `pad-invariants.test.js` is for the compiler. They
run per wave, never per task, and never partially.

### Wave 0 gaps

- [ ] `npx playwright install webkit` — the browser is not on this machine
- [ ] `playwright.config.ts` gains `projects` with `grep: /@webkit/` on the WebKit project — record
      the e2e baseline first, because this changes the count
- [ ] `src/routes/dev/tune/+page.svelte` — the unlinked probe that makes TUNE-05 e2e-reachable;
      `config-shape.spec.ts`'s "linked from nowhere" rule applies to it
- [ ] `src/lib/tune/view.ts` — the zero-vendor-import type module the UI components may name
- [ ] `SimHost.replaceEngine` + its spec, before any component swaps an engine
- [ ] The UI-SPEC amendment for the `TUNING` region's real height and (if taken) the ninth palette
      token, with `src/lib/ui/identity.spec.ts` updated in the same task
- [ ] `static/og/` in `.gitignore` and `scripts/gen-og.mjs` wired into `npm run build` **before**
      `vite build`
- [ ] `SITE_ORIGIN` hoisted into one module shared by `scripts/deploy.mjs` and the page head

---

## Project Constraints (from CLAUDE.md)

- **GSD workflow enforcement.** No direct repo edits outside a GSD command. This research made none;
  the probe scripts were written to a scratch directory and deleted, and `git status` is clean.
- **Stack, non-negotiable and pinned.** SvelteKit 2 + `adapter-static`, Svelte 5 runes, Vite 8,
  TypeScript 6, Vitest 4, Playwright 1.62, Tailwind 4, `@intechstudio/grid-protocol` **exact-pinned**
  `1.20260825.1135` (never a caret — the version is a firmware datestamp and a bump moves the
  908-character ladder), `wasmoon` 1.16.0.
- **No new runtime dependency is proposed by this research.** Everything Phase 5 needs is present.
- **`src/vendor/` is read-only.** No formatting, no lint-fix, no renaming, no reordering. HANGAR
  reimplements the private `withChange` rather than exporting it upstream-side.
- **Nothing in a Svelte rune that a 100 Hz loop touches.** `$state` deep-proxies; engines, canvases
  and frame buffers stay in plain `Map`s. Knob *indices* are scalars and may be runes.
- **No CSS may author a colour the simulator did not** — applies to the OG renderer too.
- **Copy rules:** mixed case for sentences, wide-tracked uppercase only for the wordmark, button
  labels and captions of at most two words (`COPY LINK`, `SURPRISE ME`, `RESET` all qualify). No
  emojis, no exclamation marks, real `’` and `…`. Never the heading "Error". No string may name a
  control that is not on the screen.
- **Two-colour palette, eight tokens, asserted.** Any third hue is a reviewed spec change.
- **`--font-mono` is reserved** for the firmware version, the page number and these meters.
- **44 px minimum interactive box** on every control, including every knob.
- **GPLv3.** Every new file carries
  `// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.`; a new dependency
  would have to pass `scripts/gen-licenses.mjs`'s `ALLOWED` list (none is proposed).

---

## Open Questions

1. **Does the user accept that TUNE-04 and TUNE-05 are unreachable?**
   - Known: measured across 1,080 kind combinations and 16,645 knob combinations; zero over budget.
     The only live route is Phase 7 passing `reserved` characters for an install marker, which would
     put `tpad` (902) over.
   - Unclear: whether the requirement should be restated, or the branches shipped as guards.
   - Recommendation: ship the guards, prove them with synthetic states and a `/dev/tune/` probe, and
     put the finding in front of the user before the phase closes. Do not fake a ladder.

2. **Does the panel get to grow past the 152 px reserve?**
   - Known: six 44 px knobs cannot fit 96 px; the reserve protects the *primary control* from moving,
     and growth below it does not move it.
   - Recommendation: amend the reserved height in the Phase 5 UI spec to the measured value.

3. **Does TUNE-05 earn the first non-lime token?**
   - Known: `identity.spec.ts` fails on a ninth token or a third hue; 04-UI-SPEC predicted the first
     warning colour would arrive in Phase 7.
   - Recommendation: since the red state is unreachable in the shipped UI, keep the palette at eight
     and colour only the `/dev/tune/` probe — unless the designer wants the token now, in which case
     it is a deliberate, reviewed, same-task change to the spec and the spec's test.

4. **Should a stamped link auto-choose?**
   - Known: `/c/{id}` lands un-chosen, so a stamped link would show a tuned pad with no knobs.
   - Recommendation: yes, via `replaceState("", { chosen: true })`; Phase 4's `unchoose()` already
     handles the not-pushed case. Designer's call on whether that is the right welcome.

5. **What exactly does SHARE-03's message say?**
   - Known: the realistic failure is a corrupted, hand-edited or knob-shape-changed stamp, not an
     "older version" — HANGAR always serves the newest build.
   - Recommendation: wording closer to *"That link was made with a different version of this page, so
     here is the configuration as it ships."* User's call.

6. **Do Lua entries join the front-door row?**
   - Known: they are all in `EXCLUDED_FROM_ROW`; D-18 makes it a curation decision; without it the
     Lua knob path has no visitor-facing surface in this phase.
   - Recommendation: do not change it in Phase 5. Build and test the path; let 5.1 or the user decide.

---

## Sources

### Primary (HIGH confidence — read or measured in this tree)

- `src/vendor/botor/_pad.ts` @ upstream `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` — `KnobKind`
  (4158), `PRESETS` (4214), stamp formats (2466–2503), `encodeStamp` (2632), `decodeStamp` (2789),
  `cost`/`fits` (3064/3078), `EVENT_BUDGET`/`BUDGET_WARN`/`BUDGET_ERROR` (3037–3039), `fit` (4089),
  `LADDER`, `FitStep`/`FitPlan` (3949–3971), private `withChange` (3156), `validate` (3661)
- `src/vendor/botor/pad-sim.ts` — `setState` (351), `rebuild` (355)
- `grid-editor/src/renderer/main/zona/PadPanel.svelte` @ the same SHA — the per-preset knob→field
  semantics (1259–1920, readers 503–519, writers 538–803)
- `src/lib/sim/host.ts`, `engine.ts`, `paint.ts`, `lua-pad-sim.ts`, `ready.ts`; `src/lib/pad/index.ts`,
  `ready.ts`; `src/lib/catalog/{types,index,front-door}.ts`, `entries/*`; `src/lib/ui/*.svelte`;
  `src/lib/config-shape.spec.ts` (guards 13/14), `src/lib/ui/identity.spec.ts`
- `node_modules/@sveltejs/kit/src/core/postbuild/crawl.js` — the crawler's `og:image` allow-list
- `node_modules/@playwright/test` device registry — `iPhone 15` → webkit, 393×659, `isMobile`
- Measured runs on Node v24.14.0, 2026-09-04: `compile()+cost()` timings, `fit()` timing, the two
  over-budget sweeps, stamp round-trip identity, `zlib.crc32` presence, the 4,321-byte IDAT
- `npm run test:quick` observed at 42 files / 559 + 1 todo

### Secondary (MEDIUM confidence — official third-party, cross-checked)

- MDN browser-compat-data, fetched 2026-09-04: `api/Clipboard.json` (`writeText`: Safari 13.1,
  iOS mirrors, user-gesture note), `css/properties/overflow.json` (`clip`: Safari 16),
  `css/properties/image-rendering.json` (`pixelated`: Safari 10)
- MDN `Window.requestIdleCallback` — not Baseline; WebKit ships it behind a feature flag only
- Discord unfurl behaviour: `ogpreview.app/open-graph/discord` and `opengraphplus.com` agree on
  1200×630, absolute `og:image`, and `twitter:card=summary_large_image` as the large-embed trigger.
  Discord publishes no first-party specification, so this stays MEDIUM.
- Safari clipboard activation expiry across `await`: several independent write-ups plus an Apple
  Developer Forums thread describe the identical failure; the BCD note ("must be called within user
  gesture event handlers") is the authoritative half.

### Tertiary (LOW confidence — flagged, nothing depends on it)

- The exact byte ceiling Discord applies to an OG image (sources say 8 MB, others 1 MB "practical").
  Irrelevant here at ~4 KB.

---

## Metadata

**Confidence breakdown**

- Knob model and its recovered semantics: **HIGH** — read from BOTOR's own panel at the pinned SHA
  and cross-checked against `PadPreset.knobs`.
- Budget arithmetic and the unreachability finding: **HIGH** — measured twice, by two independent
  sweeps, with the formatter initialised.
- Stamp codec: **HIGH** — read line by line and round-tripped.
- OG image mechanism: **HIGH** on `node:zlib`, `zlib.crc32`, the measured size and the crawler's
  `og:image` behaviour (read from the installed Kit source); **MEDIUM** on Discord's rendering rules.
- Clipboard and WebKit gaps: **HIGH** (MDN BCD) on support, **MEDIUM** on the activation-expiry
  workaround, which no first-party document states in those words.
- Text rendering in Node: **HIGH** as a negative claim about the *pure-JS, no-native-dep* constraint;
  the disqualifications are properties of the packages, not of my search.

**Research date:** 2026-09-04
**Valid until:** 2026-10-04 for the ecosystem facts. The in-tree measurements are valid only against
this SHA — **re-run the two sweeps after any vendored re-sync or protocol pin bump**, because the
unreachability finding is the load-bearing claim in this document and it is a property of the pinned
compiler, not a law.

---

## RESEARCH COMPLETE

**Phase:** 05 — tuning-budgets-and-shareable-links
**Confidence:** HIGH
**File:** `.planning/phases/05-tuning-budgets-and-shareable-links/05-RESEARCH.md`

Ten lines on what changes how the planner should split the work:

1. **`KnobKind` is a label, not a binding** — the kind→`PadState` field map does not exist in the
   vendored code and must be authored in HANGAR from BOTOR's `PadPanel.svelte`; budget a whole task
   for `knobs.preset.ts` plus the invariant spec that ties it back to `PadPreset.knobs`.
2. **Add a universal brightness knob** — three presets otherwise expose only two knobs, below D-01's
   floor; brightness is in D-01's list, costs zero Lua characters and is already stamped.
3. **Over-budget is unreachable** (measured, 1,080 + 16,645 states, zero over) — TUNE-04 and TUNE-05
   become tested guards plus a `/dev/tune/` probe, not visible features; plan them as one small task,
   not a wave, and put the finding to the user.
4. **The meters carry the phase alone** — `BUDGET_WARN 606` / `BUDGET_ERROR 890` give four honest
   states and `tpad` at 902/908 is real drama; that is where the design effort belongs.
5. **Phase 4's chunk guards dictate the module layout** — `src/lib/tune/view.ts` (zero vendor
   imports, safe to `import type` from a UI file) and `src/lib/tune/model.ts` (dynamic import only);
   getting this wrong is a red spec, not a runtime bug.
6. **Add `SimHost.replaceEngine`** before any component swaps an engine — `register()` tears down the
   canvas and drops the observer state, which is a one-frame blank plus a stall.
7. **Never write the URL hash** — SHARE-05 is deferred, so `COPY LINK` composes a precomputed string
   and nothing navigates; that sidesteps `replaceState` eating the fragment *and* the
   `no-navigation-without-resolve` lint *and* Safari's activation expiry in one decision.
8. **The stamp needs an entry-consistency check**, not just `decodeStamp` — without
   `encodeStamp(rebuilt) === payload`, `/c/aurora/#z.pdial` renders Dial under Aurora's name.
9. **OG images go into `static/og/` before `vite build`** — SvelteKit's crawler follows `og:image`
   and `handleHttpError` rethrows 404s; and the answer to D-15's text question is *no text*, because
   `og:title` carries the name and every Node rasteriser is native.
10. **Sharing and OG are an independent wave** from tuning — a pure codec, a URL helper, a Node
    script and head tags share nothing with the knob model, so they can run in parallel; the only
    serial dependency is that the OG script needs no knobs at all.
