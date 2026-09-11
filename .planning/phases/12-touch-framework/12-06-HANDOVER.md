# 12-06 — the JOYSTICK question, and what was measured before asking it

Plan 12-06 is **open at its blocking checkpoint**. Nothing was written, nothing
committed, every count unmoved (85 / 887, e2e 87 / 106, check 581, catalog 26,
sweep `4 19`). This file is task 01's pre-checkpoint report; there is no SUMMARY
because the plan is not complete. **12-11 ran ahead of this plan with all-`+0`
terms; 12-10 and 12-12 wait behind it.**

## The six options, re-measured 2026-09-11 at the RGB444 picker corner

Every figure is `max(compressScript(lua).length, lua.length)` after
`padReady()`, over the full reachable knob cross-product (Pass B: 4,096 lattice
colours; Pass A: `send` 12 × `bend` 3 × `spring` 3 × `brightness` 5 at the
dearest pin **and** at 255,255,255 — the two agree on all six).

| Option | Setup at defaults | **Setup at the corner** | Timer | Free of 908 |
|---|---|---|---|---|
| **trail** (`touch.kind="comet"`) | 479 | **488** | 24 | 420 |
| **shimmer** | 603 | **614** | 55 | 294 |
| **wave** | 621 | **634** | 55 | 274 |
| **swirl** | 641 | **653** | 55 | 255 |
| **ripple** | 652 | **664** | 55 | 244 |
| **as-is** | 543 | **551** | 24 | 357 |

Corrections to the plan's own table: **as-is is 543, not 532; the trail is 479,
not 468** — 11-06 measured both and the plan quoted an older draft. None of the
plan's six numbers was a corner figure; every look layer also moves the Timer
24 → 55, which the plan's table did not show. The four look-layer figures have
not moved by a character since 11-06.

## The picture, re-derived from the simulator at the golden ticks

| Variant | nonZeroBytes at rest | `animating` | Derived motion |
|---|---|---|---|
| as-is | 2 | false ×5 | `static` |
| **trail** | **0** | false ×5 | **`dark`** |
| shimmer / wave / swirl / ripple | 127–160 | **true ×5** | `animated` |

11-06's central claim reproduces exactly: the comet takes JOYSTICK to zero lit
bytes at rest, because the compiler emits the power-on centre cell only when the
spring renders as a glow.

## The front door under each branch, re-derived from the tree today

Ring: aurora · pinwheel · **ninepads** · starfield · **joystick (index 4)** ·
radar · **faders** · dial — quiet pads at 2, 4, 6.

| Branch | opening window | quiet pads | two quiet adjacent? |
|---|---|---|---|
| as-is (8) | 5,6,7,0,1,2,3 | 2, 4, 6 | none |
| look layer (8) | 5,6,7,0,1,2,3 | 2, 6 | none |
| trail (7, joystick out) | the whole row | 2, 5 | none |

**All three asserted properties hold in all three branches** — the plan's
warning that a property might fail and force a card to move does not
materialise. And one thing nobody had written down: **index 4 is the only slot
outside the opening window**. A look layer puts the requested motion on the one
card a visitor scrolls to reach; the trail removes the one card whose departure
costs the row nothing.

## The finding that changes how task 02 can be written

**`golden-frames.json` cannot move for a HANGAR-side JOYSTICK change.**
`golden-frames.spec.ts` imports `PRESETS` from `src/vendor/botor/_pad` and
regenerates from the **vendored** shelf; `front-door.spec.ts:174` derives motion
from that fixture. The two shelves already disagree on JOYSTICK's hash since
11-06 and both happen to read `static` today — the only reason the gate is green.

- **Look layer:** `frames.json` says `animating: true`, `golden-frames.json`
  stays `false`. Declaring `animated` reddens `front-door.spec.ts:174`;
  declaring `static` is a lie. `UPDATE_GOLDEN=1` cannot help — only an edit under
  `src/vendor/` moves that row.
- **Trail:** `frames.spec.ts` test 5 demands `restsBlack: true`;
  `front-door.spec.ts`'s vendored-derived cross-check demands `false`. **Two live
  gates demanding opposite values of one field.**
- **as-is:** the only branch with no conflict.

The honest repair is the one `frames.spec.ts` and `catalog.spec.ts` already ship:
compare all entries and consult `divergence.ts`'s `stateDiverges` only on
disagreement, counting compared and excused. A strengthening, not a weakening —
but spec work the plan does not budget. **It belongs to task 02, whichever
branch is chosen except as-is.**

## Four consequences the plan's file list does not carry

1. **A look layer breaks the `still` floor.** `facets.spec.ts:225` requires six
   carriers; `still` has exactly six, JOYSTICK among them. An animated JOYSTICK
   cannot honestly keep it: re-home a card or retire the term. Neither
   `facets.ts` nor `ported.ts` is in the plan.
2. **A look layer silently re-points the colour knob.** `colourTargetFor`
   returns `"look"` once a look is enabled, so the card's one colour knob stops
   colouring the stick dot and starts colouring the background wash.
   `knobs.preset.spec.ts:305` and `knobs.preset.ts:7` both move. **The user
   should know before choosing** — the no-new-knob rule does not cover a knob
   changing what it does.
3. **A look layer's motion is untunable** — JOYSTICK has no speed knob and the
   rules forbid adding one; the rate is fixed at the state's default.
4. **The trail makes JOYSTICK a demonstration card** — `listing.spec.ts`
   requires a `DEMO_PATHS` gesture or a `DARK_BY_CONSTRUCTION` name for every
   `restsBlack` entry; `demo.ts` is not in the plan; the shelf sentence 11-06
   authored is replaced by the shared touch note.

## Three smaller things

- `static/og/joystick.png` is gitignored — the `files_modified` row is
  unsatisfiable (12-05 recorded the same for ninepads).
- `docs/HARDWARE-AUDITION.md` has **no JOYSTICK row**; adding one is `+1` against
  this plan's declared audition `+0` and moves 12-12's chain.
- D-19 checked against every sentence: nothing here argues against a capability
  on Editor grounds; nothing struck.

## The TRACKPAD half

GLIDE (12-10) is built **beside** the `tpad` preset by default. Replacing would
remove a preset (nine → eight) and its two-finger scroll, tap-to-click and
right-click, which the note did not ask to lose — and would take `pointing`
(two carriers) and `still` (six) each down by one; GLIDE animates, so it can
take `pointing` but not `still`.

---

## The checkpoint, verbatim

> ### Decision
> Which visual JOYSTICK gets, from the six costed options; and whether
> TRACKPAD's edge-flash entry is built **beside** the preset (the default) or
> **replaces** it.
>
> **1. Trail (comet) — 488 at the corner.** *For:* the word your first note used;
> the cheapest of the six. *Against:* no parked dot and no lit centre at rest — a
> black card. JOYSTICK leaves the front page (the seven-entry ring keeps all its
> properties with no card moved). It becomes a "needs a finger" demonstration
> card needing a demo gesture, and two gates would demand opposite values of
> `restsBlack` until the fixture source is repaired.
>
> **2. Shimmer — 614.** *For:* keeps the dot and centre; the field breathes.
> *Against:* JOYSTICK becomes animated on the front page (quiet pads 2 and 6);
> the `still` chip loses a carrier against a floor of six; **your colour knob
> stops colouring the stick and starts colouring the background**; the motion
> has no speed knob.
>
> **3. Wave — 634.** As shimmer, with a direction that can follow the stick.
>
> **4. Swirl — 653.** As shimmer; closest to PINWHEEL and DIAL, which already
> swirl.
>
> **5. Ripple — 664.** As shimmer; rings from the centre, the most stick-like;
> the most expensive.
>
> **6. Leave it — 551.** Nothing moves; the only branch with no fixture
> conflict. The note stays open as a named non-delivery with this reason.
>
> **TRACKPAD:** "beside" (default) or "replace".
>
> Select one of **trail, shimmer, wave, swirl, ripple, as-is**, then **beside** or
> **replace**.
