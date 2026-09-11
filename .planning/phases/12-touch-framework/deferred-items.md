# Phase 12 — deferred items

Things found while executing that are out of the finding plan's scope. Nothing here is a bug that
ships; each is a measured statement about the tree with a named owner or an explicit "nobody yet".

---

## 1. The reachability sweep's two-pass split under-reports NINE PADS by three characters

**Found by:** plan 12-05, when moving NINE PADS' shipped grid to 4x4.
**Where:** `src/lib/tune/reachability.sweep.spec.ts` — Pass A / Pass B, and the pinned margin at
`:446`.
**Risk:** none today. The true worst is 640 of 908 (268 free) and the sweep reports 637 (271 free);
both are far under the wall, and `over budget 0` is unaffected either way.

`reachability.sweep.spec.ts` splits its cross-product into Pass A (every non-colour knob, with the
colour pinned at the literal Pass B measured dearest) and Pass B (the colour dimension alone, every
other knob at its DEFAULT index). The licence for the split is separability: *a colour contributes to
an event's length only through its three decimal literals*, so the dearest colour is the dearest
colour whatever the other knobs are doing.

**That is false on NINE PADS.** At 3x3 the compiler paints a checkerboard, which emits the chosen
colour AND a dimmed variant of it; at 4x4 it lights one marker cell per zone and emits the chosen
colour once. So the colour's contribution depends on `grid`. Measured directly, all four corners:

| | `102,102,102` (position 1638) | `255,255,255` (position 4095) |
| --- | --- | --- |
| **3x3** | 637 | **640** |
| **4x4** | 627 | 627 |

While the card shipped at 3x3, Pass B ranked `255,255,255` dearest and Pass A found the true 640.
Now that it ships at 4x4 the two literals TIE at 627, Pass B ranks `102,102,102` first, and Pass A
costs the whole cross-product with it — missing the three characters `255,255,255` costs at 3x3.

**What a fix would be:** run Pass B once per position of any knob that changes how many times a
colour is emitted, or pin Pass A's colour at the maximum over Pass B *and* the declared corners.
Both widen a sweep that already runs 45,358 states in ~110 s.

**What is on the record meanwhile:** `src/lib/tune/colour-picker.spec.ts:507-510` independently pins
`NINEPADS_WORST = 640` / `NINEPADS_FREE = 268` and is green, so the TRUE figure is still gated
somewhere. The sweep's own comment at the assertion names all four corners.

**Owner:** nobody yet. A candidate for 12-12's gate pass.

---

## 2. `src/lib/browse/facets.ts:15` still says `precise` is carried by six cards

Carried forward from 12-04, which recorded it and did not touch the file. It has been **seven** since
11-15. Plan 12-05 did not touch `facets.ts` either, so it is still open. Nothing gates the sentence —
the floor test asserts a minimum, and a prose count in a header has no gate at all.

**Owner:** the next plan that edits `facets.ts` for any reason.

---

## 3. QUADRANT hangs a note when a lift is lost, and closing it needs a Timer it does not have

**Found by:** plan 12-08, which re-fitted the four cell-toggling sequencers and read `quadrant.ts`
to decide whether it was a fifth.

**It is a DIFFERENT failure from the other four, and that is why it was not re-fitted with them.**
QUADRANT computes `x*9//128` too, but it acts on ONSETS ONLY — `if e~=4 and e<9 then return end` — so
a MOVE returns before any cell is computed and Q2's one-unit boundary wobble cannot toggle it. The
hysteresis half of the library buys it nothing.

**Its exposure is Q6.5.** It holds one note per contact in `s.k[i]` and releases it only on codes 3
and 5..8. The probe recorded four of five contacts never sending their code 5 after a five-finger
chord, and Q7 recorded a palm leaving phantoms that keep reporting. A contact whose lift is lost
hangs a note with nothing in the entry to reach it — and a hung note is the worst failure a MIDI
instrument has.

**Closing it needs `R` AND a Timer, and QUADRANT has no Timer at all** (`docs/HARDWARE-AUDITION.md`:
`quadrant` is one of six Setup-only entries, and row 1's install rule says to store nothing into
event 6 for any of them).

**The arithmetic, measured at the RGB444 picker corner rather than taken from the audition row**
(`@HUE=255,140,0,0,200,255,0,255,120,255,0,180`, `@FILL=0`, `@NOTE=36`, `@CH=15`), because 11-16 found
nine of twenty audition rows stale:

| Shape | Setup | Free |
| --- | --- | --- |
| as it ships | **838** | 70 |
| `R` added beside `self.k={}`, the existing end branch left alone | 924 | **over** |
| that, plus `gtt(0,100)` to arm the Timer | 935 | **over** |
| `R` added AND the existing end branch rewritten to `if e==3 or e>4 and e<9 then R(s,i)return end` | 863 | 45 |
| that, plus `gtt(0,100)` | **874** | **34** |

A new Timer event would be `--[[@cb]]gtt(0,100)X(self,20)` — **29 characters** against its own 908.

**So it FITS, at 34 free, and it was still not done here.** Three reasons, each a cost this plan is
not licensed to spend:

1. **It needs a release-path refactor on the one entry that handles code 9 explicitly.** QUADRANT
   sends the note-off immediately for a coalesced tap (`if e==9 then s:gms(...)B(q,0) else
   s.k[i]=q end`). Moving the release into `R` changes which path fires for a fast tap, and that is a
   behaviour change on the card whose whole claim is that you can hit it without looking.
2. **The window is not measurable from here.** `X(s,n)` counts the CALLER's Timer calls, and QUADRANT
   has no period — 100 ms above is an illustration, not a decision. 12-07's contract puts the window
   with the caller and 12-12's bench row is what sets it.
3. **It would need its own test and this plan's declared term has no room for one.** The other four
   join one boundary test as subjects; a hung note released by a sweep is a different assertion with
   no existing home, so it cannot be folded in the way SONAR was.

**What the bench is being asked meanwhile:** `docs/HARDWARE-AUDITION.md` row 19 now carries the
observation — press four quadrants, lift them together, report whether anything is still sounding —
so the desk decides whether this is a real failure on the user's own module before a Timer is added
to a card that is documented as deliberately having none.

**Owner:** plan 12-12, with the bench answer to row 19 in hand.

---

## 4. `docs/TESTING.md`'s cost table now has a fourth stale row, and LUMEN is it

**Found by:** plan 12-11, which took LUMEN from 742 / 746 to **704 / 707** at the defaults and at the
RGB444 picker corner.

`docs/TESTING.md:1318` still reads `| lumen | 742 | 746 | 162 | 0 | 0 | 908 | 302 / 908 |`. It is the
fourth row of that table this phase has invalidated without editing: 12-09 left CHORUS (771 / 174 →
796 / 29), CONSOLE (852 → 781) and MORPH (710 → 772) stale for the same reason, and its SUMMARY hands
"the tenth stale cost row" to 12-12 by name.

**Why it was not fixed here.** The plan's `files_modified` does not name `docs/TESTING.md`, 12-09
established the phase's handling of exactly this row, and a one-row edit to a table whose other three
rows are also wrong reads as though the table had been checked. **Nothing gates any number in it** —
that is the standing property that lets it go stale — so the risk is a reader, not a suite.

**What the correct row is, measured on the tree at `ff67efb`:** `| lumen | 704 | 707 | 201 | 0 | 0 |
908 | 302 / 908 |`.

**Owner:** plan 12-12, with the other three.

---

## 5. JOYSTICK's "more led animation" is a named non-delivery, by the user's answer, and three rows record it

**Found by:** plan 12-06, at its blocking checkpoint, answered 2026-09-11.

The checkpoint put six costed options in front of the user (trail 488, shimmer 614, wave 634, swirl
653, ripple 664, as-is 551 - every figure at the RGB444 picker corner, re-measured by 12-06's
handover and reproduced by task 02 at 551 on both the dearest pin `102,102,102` and `255,255,255`,
540 non-colour states each). The answer, verbatim:

> **"as is, selectable tuning options under Trackpad"**

The first half is JOYSTICK's. Nothing in `presets.ts` moves except the comment that records the
table and the answer; `frames.json`, `golden-frames.json`, `front-door.ts` and the OG image are
untouched and proved untouched (regenerated and byte-identical). The second half is TRACKPAD's and is
12-10's; see 12-06-SUMMARY's hand-off.

**Three rows for 12-12, which owns the files they sit in:**

1. **`.planning/phases/11-bench-corrections/deferred-items.md` C.3 "JOYSTICK's trail"** - the row
   12-12's plan already marks *answered (12-06, verbatim)*. The closing sentence is: answered
   **as-is** on 2026-09-11; the trail and the four look layers are costed in JOYSTICK's comment in
   `src/lib/catalog/presets.ts` and none was taken; the "more led animation, trail or something"
   half of the 2026-09-09 note is a named non-delivery with the reason (the trail takes the parked
   dot and the power-on centre; a look layer reverses the dark-field decision and re-points the one
   colour knob from the stick to the background wash).
2. **`docs/HARDWARE-AUDITION.md` has no JOYSTICK row.** 12-06's handover found it; adding one is
   `+1` against 12-06's declared audition `+0`, so 12-06 did not add it. If the bench is to confirm
   the as-is answer on the module, 12-12 adds the row with the expectation sentence "the centre
   cell lit from power-on, one dot following the finger, parked on the centre on lift, no trail".
3. **`docs/TESTING.md`'s cost table, joystick row** - 12-06 did not measure it and did not edit the
   table (item 4 above records the phase's handling). The corner figure to check it against is 551
   / Timer 24 / 357 free; the defaults figure is 543 for the preset state and 547 for a tuned state
   (`withChange` deletes `preset`, `src/lib/tune/state.ts:11`).

**Owner:** plan 12-12.

---

## 6. TRACKPAD replaced the `tpad` preset as the card, and seven things fall to 12-12 or later

**Found by:** plan 12-10, 2026-09-11, acting on the user's "selectable tuning options under Trackpad".

The fold was measured before it was built: the vendored trackpad recipe is 893 of 908 under HANGAR's
marker, every Setup-side flash is over (1113 with everything kept, 942 with the drain, the hold-off,
the finger-centring and the on/off knob all cut), so the flash is painted from the Timer (Setup 903
at every knob state, Timer 488 at the picker corner). The card is `trackpad` / TRACKPAD; the `tpad`
preset stays on the shelf, unlisted, as the compiler's over-budget fixture. What that leaves:

1. **`/c/tpad/` is a dead address** - the fourth this phase, after the three 12-04 removed. The OG
   image `static/og/tpad.png` no longer builds (gitignored either way) and `frames.json` has no
   `tpad` row; `golden-frames.json` keeps its `tpad` row because it regenerates from the VENDORED
   shelf. 12-12 records the dead link where it records the other three.
2. **CONT-01's wording says "the nine ... are in the catalog"**; eight are, and the ninth is on the
   shelf and held by `presets.spec.ts` exactly as before. 12-12 amends the requirement's clause
   (`.planning/REQUIREMENTS.md` is not 12-10's to edit).
3. **The decay gate is blind to a `D(` call, measured on this card.** `decay-idiom.spec.ts` was run
   on a mutant Timer carrying `D(...,1,250)` and stayed green; `library.spec.ts` proves `D`'s
   arithmetic for every multiple of six, and `lua-smoke.spec.ts`'s TRACKPAD test reads the VM to 0.
   12-07 recorded the same for the sketch. A gate clause that resolves `D(n,l,w)` would ALSO have
   to accept a `w` that depends on a loop variable (`@T*(16-k*k)//16*6`), which its evaluator
   refuses today - so the honest clause is "a `D(` call whose `w` is `<expr>*6`", asserted by text.
   12-12 decides whether the gate gains it or the smoke test stays the proof.
4. **`docs/TESTING.md`'s cost table** has no TRACKPAD row and a `tpad` row that is now a shelf
   fixture's; the figures are Setup 903 (every knob state), Timer 488 corner / 486 defaults.
5. **Three `touch-guard.spec.ts` rows** for the recipe's guards (`e==3 or e>=5`, `e>4`,
   `e==4 or e>7`), each right because of the pass around it. The plan asserted "no new row"; that
   was GLIDE's plan, and GLIDE had no tap. 12-12's gate counts four rows, not one.
6. **Stale comments naming Trackpad's old sentence** in files 12-10 did not touch, all prose and
   none load-bearing: `src/lib/ui/PadFrame.svelte:129-133`, `src/lib/ui/CatalogCard.svelte:183-185`,
   `src/routes/c/[id]/+page.ts:10,34`, `src/routes/c/[id]/+page.svelte:63`,
   `e2e/browse.e2e.ts:624-629,678-681`, `src/lib/sim/host.spec.ts:384`, `src/lib/catalog/types.ts:86`.
   Phase 13 owns the UI files' next rewrite; the e2e assertion behind the comment holds at 0 === 0.
7. **`front-door.spec.ts`'s "the excluded entry is excluded because it is dark"** still derives
   `tpad`'s motion from the vendored golden fixture and asserts it dark - true of the preset, no
   longer about any catalog card. Green and untouched; 13-07 dismantles the file.

**Owner:** plan 12-12 for 1-5; Phase 13 for 6-7.

---

# The phase gate's work list (plan 12-12, 2026-09-11)

Everything below is written to be WORKED, not wished for: each row names what would close it. Items
1 to 6 above are folded in by name rather than restated, and the ones the gate closed are marked
closed with the commit or the plan that closed them. Nothing here is hardware-verified; no agent in
this phase connected to a device, wrote to one or deployed, and the bench rows are handed over
unanswered at the gate's checkpoint.

## A. What this phase could not do, with what would close each

| #  | What                                                                                               | Why not, with the numbers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | What would close it                                                                                                                                                                                                                                                                                       |
| -- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | **Clock sync** (EUCLID, SONAR, STEPS, RADAR POINTS' grouping)                                       | Still blocked twice, exactly as Phase 11's row A.1: `docs/MIDI-IN-PROBE.md` has never been run, and the Lua host has no inbound MIDI. No plan in this phase touched it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Ten minutes at a bench for the probe, then a phase                                                                                                                                                                                                                                                       |
| 2  | **SNAKE** (bench line "nothing changed")                                                            | Still deferred by the user (Phase 11 A.4). Re-measured at this gate: Timer 870 at the defaults, **880 at the picker corner, 28 free**; "one note per movement" does not fit as the card stands.                                                                                                                                                                                                                                                                                                                                                                                                                                              | The user un-deferring it, and a Timer with room                                                                                                                                                                                                                                                          |
| 3  | **The `_coordMax` two-axis fix** (`D-11-13-a`)                                                      | 12-07 touched `lua-host.ts` (the `system` option, `globalSize()`) and **chose not to widen its scope**: the fix wants two fields, an axis argument on `host.coordMax` and a catalog-wide clause, none of which the library needed. STRIP still pays fifteen characters to unlock both axes so the preview and the module agree.                                                                                                                                                                                                                                                                                                             | Two fields in the host plus the axis argument, and a clause refusing an entry whose Lua contains exactly one of `txma` / `tyma`                                                                                                                                                                             |
| 4  | **QUADRANT's hung note** (12-08's finding, item 3 above, carried verbatim)                          | Onset-only (`if e~=4 and e<9 then return end`), so Q2's boundary wobble cannot reach it; exposed to Q6.5 through the note it holds in `s.k[i]`, released only on codes 3 and 5..8. Closing it needs `R` AND a Timer it does not have. Measured at the picker corner: as it ships **838** (70 free); `R` beside `self.k={}` with the end branch left alone 924 (over); plus `gtt(0,100)` 935 (over); `R` with the end branch rewritten to `if e==3 or e>4 and e<9 then R(s,i)return end` 863 (45 free); plus `gtt(0,100)` **874 (34 free)**; a new Timer `--[[@cb]]gtt(0,100)X(self,20)` is 29 characters. So it FITS and was not done: a release-path refactor on the one entry that handles code 9 explicitly, a period nobody has chosen, and a test with no home. | Bench row 19(b)'s answer first (does the note really hang on the user's module?), then `R`, a Timer with a chosen period, and its own test                                                                                                                                                                 |
| 5  | **The `?for=keys` address** (12-04's finding)                                                       | `keys` shipped as a chip after 10-06 and was never one of the fifty-five retired tags, so `LEGACY_TAG_MAP` cannot carry it and `RETIRED_VOCABULARY` may not grow; `query.ts` drops an unknown `?for=` value silently under W-12 and the visitor lands on the full catalog - not a 404, not the search field. Recorded under CAT-01 as a decided cost.                                                                                                                                                                                                                                                                                       | A `query.ts` change and a new mechanism (a `?for=` migration table, or an apology), which no plan was licensed to add                                                                                                                                                                                   |
| 6  | **The decay gate is blind to a `D(` call** (12-07 recorded, 12-10 measured, item 6.3 above)         | `decay-idiom.spec.ts` reads literal `glpfs` / `glt` pairs and resolves their arguments to integers; a decay through the library's `D(n,l,w)` is invisible to it. 12-10 planted a literal `250` through `D` in TRACKPAD's Timer and the gate stayed green (3 passed). What proves the phase-0 landing today is `library.spec.ts` (every multiple of six from 6 to 252 lands, `w = 7` strands) plus the TRACKPAD smoke test reading every cell to 0. **Not widened at the gate**: the honest clause is textual - a `D(` call whose `w` is `<expr>*6` - because the evaluator refuses a `w` that depends on a loop variable, which is exactly TRACKPAD's shape, and that is more than one assertion. | A `D(` arm in `decay-idiom.spec.ts` that accepts `*6` by text and pairs the site with `library.spec.ts`'s proof, or an accepted statement that the smoke test is the gate for library-routed decays                                                                                                        |
| 7  | **The library's dropped function**                                                                  | Nothing was dropped under 12-07's fallback order - `A` and `D` both shipped, 139 free. What did not ship is `F`, the probe's rule 5 ("the finger lights its cell"): no entry in the phase calls it because every card lights its own cells (armed cells, faders, trails, cursors, edges), so it was dropped for having no caller rather than shipped inert, with `O` and `L`. The user's bench snippet shipped as `A`, called by LUMEN.                                                                                                                                                                                                       | Nothing; recorded so the next reader does not look for it                                                                                                                                                                                                                                                 |
| 8  | **`tpad`'s 907 of 908 is no longer swept**                                                          | 12-10 took the `tpad` rack out of `reachability.sweep.spec.ts` with the card (9 racks to 8, 45,358 to 44,846 states), so the shelf's dearest state - the one that straddles 908 with a reserve of 3 - is now pinned only by `ladder.spec.ts` test 1 and `/dev/tune/` through `portedEntry`.                                                                                                                                                                                                                                                                                                                                                  | A sweep row over shelf-only presets, or an accepted statement that `ladder.spec.ts` is the pin                                                                                                                                                                                                             |
| 9  | **The audition cost table still has no gate**                                                       | Twelve stale rows over three phases, every one smaller than the entry costs: nine found by 11-16, ARC (520 for 538, 12-05's +18 moved the header and not the table) and TRACKPAD (486 for 488, wrong from the file's first commit, its header also short by two at the corner) found by this gate. `audition.spec.ts` gates the document's SHAPE and nothing gates these numbers.                                                                                                                                                                                                                                                             | `audition.spec.ts` asserting the cost table against `renderLua` at the defaults, and `lua-entries.sweep.spec.ts` asserting each header's quoted corner figure against the corner it measures                                                                                                               |
| 10 | **The reachability sweep's separability licence on NINE PADS** (item 1 above)                       | Still open; the sweep reports 637 / 271 and the true worst is 640 / 268, pinned by `colour-picker.spec.ts`. Nobody yet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Pass B once per position of any knob that changes how many times a colour is emitted                                                                                                                                                                                                                       |
| 11 | **JOYSTICK's audition row** (item 5.2 above)                                                        | Not added. `docs/HARDWARE-AUDITION.md` covers, by its own title, every HAND-AUTHORED configuration in the catalog; JOYSTICK is a preset, so a row for it is a widening of the document's scope, and it is also `+1` against a table 12-12's plan fixes at 23 with `ROW_COUNT` pinned. The as-is check ("the centre cell lit from power-on, one dot following the finger, parked on the centre on lift, no trail") is in the gate's checkpoint list instead.                                                                                                                                                                                  | A decision to widen the document to presets, then the row and `ROW_COUNT` 24                                                                                                                                                                                                                              |
| 12 | **`check-counts.mjs` has no direction, and reports a red run as no summary**                         | 12-04 recorded the first: `874` after a deletion and `877` after an addition are the same equality, so the guard against a silently shrinking suite is the plan's declared term. This gate found the second: a summary reading `Test Files  1 failed \| 87 passed` is reported as _"no Vitest summary lines found on stdin"_ because the regular expressions expect `passed` to follow the first number; the exit code is 1 either way, the message says the wrong thing.                                                                                                                                                                       | Read `FILES_FAILED` / `TESTS_FAILED` when the passed pattern misses, and name the failed count; direction stays with the declared term                                                                                                                                                                       |
| 13 | **`docs/SESSION-RUNBOOK.md:14`'s suite counts** (12-03's finding)                                   | Still 724 / 13 / 77 (Phase 6's figures) against the gate's 903 / 19 / 84. The file states no fetch count, so 12-03 left it; it is under Phase 13's append-only band (13-02, 13-15, 13-17), so this gate names it and does not edit it.                                                                                                                                                                                                                                                                                                                                                                                                       | One appended sentence by whichever Phase 13 plan next touches the file                                                                                                                                                                                                                                    |
| 14 | **The stale Trackpad prose in Phase 13's files and `front-door.spec.ts`'s vendored `tpad` row** (items 6.6, 6.7) | Phase 13's, as 12-10 recorded: `PadFrame.svelte`, `CatalogCard.svelte`, `c/[id]/+page.ts`, `+page.svelte`, `browse.e2e.ts`, `host.spec.ts:384`, `types.ts:86`; and `front-door.spec.ts`'s "excluded because it is dark" test reading the vendored golden fixture's `tpad` row - true of the preset, about no card. **13-07 dismantles the front-door ring to a single hero after this gate; `front-door.ts` and `front-door.spec.ts` are handed to it as-is** (12-04 moved three exclusion blocks, 12-10 one slot and one line), and nothing about the ring's eight entries, its opening window or its quiet-pad spacing is claimed here as durable. | 13-07 and Phase 13's UI rewrites                                                                                                                                                                                                                                                                          |

## B. Hardware findings for the production unit, from the probe - recorded for the user, not for a plan

1. **Dropped single taps** (Q3): _"i dont think that all my taps recorded but that can be a hardware
   calibration issue, this is a prototype after all."_ A touch-threshold matter on the prototype; no
   configuration can address it, and no plan in this phase pretended to.
2. **Palm ghosting** (Q7): a flat palm wiped across the pad and lifted left phantom contacts that
   kept jittering and sending MIDI. A known behaviour of that class of touch controller, not damage;
   the recovery is `PUT BACK` and a power cycle. The library's expiry paths cannot see a phantom
   that keeps reporting as anything but live, and `library.ts` says so.
3. Beside them, from the same probe: five fingers are tracked on channels 1 to 5 but _"super laggy"_
   (Q6), four of five lifts were lost after the five-finger chord (Q6.5, the answer the library's
   expiry rule exists for), and the centre reads y four low (Q5) - a physical offset or where a
   finger naturally lands, inside the middle cell either way.

## C. Retired by the probe - pointed at, never edited

- **`TOUCH-CODE-9.md`'s framing** ("the preview cannot produce the gesture five waves fixed"): code 9
  does not occur for a human tap - every tap arrives as 4, at least one 1, then 5 - so `touch.ts` is
  faithful here, the class-B fixes of 11-02, 11-04, 11-08, 11-09 and 11-09.1 were correct for the
  firmware and harmless, and Phase 11's open decision C.5 is answered by evidence: **option 2, record
  and ship as is.** The document stands as written and is pointed at.
- **The sRGB-gamma hypothesis for LUMEN** (12-RESEARCH): Probe B read four distinct brightness steps,
  27 clearly lit against a dark neighbour. The LEDs render what they are sent; the report was the
  knob-to-install path (cleared by 12-01) and which row the user compared (answered by 12-11).
- **The fast-tap reading of "not precise"**: it was Q2 the whole time - a one-unit cell boundary at
  71 / 72 - which the library's hysteresis answers with a seven-value band, 68..74.

## D. Open for the user - decisions, not gaps, each with its numbers

1. **The expiry window.** Bench row 7(e) decides it: hold a chord still for ten seconds. **It is five
   callers' window, not CHORUS's alone**, because 12-08 put `X(s,20)` in EUCLID, STEPS, RADAR POINTS
   and SONAR at their own Timer periods: twenty calls is **2.0 s** in CHORUS (`gtt(0,100)`, the release
   landing on call 21 at 2.1 s), **2.2 s** in EUCLID (110 ms; 1.4 to 4.8 s across its knob), **2.4 s**
   in STEPS (120 ms; 1.2 to 4.0), **2.8 s** in RADAR POINTS (140 ms; 1.6 to 5.6) and **1.4 s** in
   SONAR (70 ms; 0.8 to 3.2). One bench number moves all five; only CHORUS's can cut a sound.
2. **CHORUS's two seconds** specifically - the one caller holding a note - if a real hold lasts
   longer than the window on the desk.
3. **LUMEN's y inversion on `@CC + 1`** (12-11): the user's own snippet inverts y
   (`map_saturate(y, 0, 127, 127, 0)`) where LUMEN sent raw y until 12-11; it is a wire change, and
   row 15 asks whether it is what was wanted.
4. **Whether TRACKPAD earns `featured`** - it ships `featured: false`, as the plan wrote GLIDE.
5. **JOYSTICK as-is** - answered on 2026-09-11 in the user's words; the trail (488) and the four look
   layers (614 / 634 / 653 / 664 at the corner) stay costed in `presets.ts`'s comment if the answer
   is ever reopened.
6. **Whether LUMEN belongs on `still`** - 12-04 did NOT stop on it: taken, with three reasons written
   into `facets.ts`; recorded here as the user's to reverse, with CONSOLE, STRIP, CULL and QUADRANT
   the named alternatives.
7. **STRIP as three** - still 1,088 of 908 (Phase 11 C.4).
8. **The thirteen dead `/c/<id>/` addresses** - nine from 11-01, three from 12-04, and `/c/tpad/`
   from 12-10 - with the same costed reversal (a stub per id, or one Worker redirect rule).
9. **Should the `tpad` preset also leave the shelf?** 12-10's question 5, carried and not decided: it
   would force the over-budget probe and `ladder.spec.ts` test 1 onto another card, and no other
   shelf card has a band that straddles 908.
10. **TRACKPAD's six other questions from 12-10**, carried verbatim in its SUMMARY: the on/off knob
    shows the Lua literals `true` / `false`; two-finger scroll does not flash (420 characters of Timer
    room if wanted); the preset's three tunables are not knobs on the card (5 free in the Setup); the
    flash trails the finger by up to 20 ms and its dead band is one raw unit (row 23); a finger that
    rests a quarter of a second loses its first three samples (the recipe's idle reset and hold-off,
    unchanged from the preset and now visible).
11. **QUADRANT's re-fit** - it fits at 874 / 34 (A.4), after row 19(b) says whether the note hangs.

## E. Every item the SUMMARYs recorded, with its state at the gate

Phase 11's file first (`11-bench-corrections/deferred-items.md`), then this phase's six items.

| Item                                                                                       | From                       | State at the gate                                                                                                                                                                                                                                                                                                                                                                                                                      | What would close it                                                                                          |
| ------------------------------------------------------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `D-11-08.1-a` - `install.e2e.ts`'s CLEAR title, an exact write count with no wait          | 11-08.1                    | **CLOSED by 12-03** at `df71d0b`, in the same commit as the literal it guards (2 to 3); the diagnosis was the other way round - the BASELINE was read one short, no third write of the old shape existed - and the fix is a poll on the counter, not on the panel                                                                                                                                                                       | -                                                                                                            |
| `D-11-08.1-b` - `wrangler dev` dying mid-run                                                | 11-08.1                    | **OPEN.** Not seen in this gate's two runs; what was seen instead is the same server answering two requests with a 500 without dying (`tuning-webkit.e2e.ts:497`, run 1), the same family                                                                                                                                                                                                                                              | A `webServer` health assertion                                                                               |
| `D-11-10-a` - nothing validates seven-bit sysex                                             | 11-10                      | **OPEN.** LUMEN is still the only sysex emitter; 12-11 moved its two CCs behind `A` and widened the tap-parity probe to record sysex, which found the probe blind to the channel, not the data                                                                                                                                                                                                                                         | A general seven-bit clause over `host.sysex`                                                                 |
| `D-11-10-b` - the audition cost table unchecked                                             | 11-10                      | **CLOSED at 11-16 and stale again twice by this gate** (ARC, TRACKPAD); row A.9 above                                                                                                                                                                                                                                                                                                                                                  | The gate in A.9                                                                                              |
| `D-11-12-a` - a Timer stopping silently on a zero period; the host's uncleared deadline    | 11-12, 11-15               | **OPEN.** Nothing in this phase touched it; TRACKPAD's Timer runs at `gtt(0,20)` and the library's `X` counts calls, so a stopped Timer would also stop the sweep silently                                                                                                                                                                                                                                                             | The static `gtt` clause and the one-line host fix                                                            |
| `D-11-12-b` - no gate asserts a card is legible                                             | 11-12                      | **OPEN.** Row 21(c) and 22's legibility questions still the only instrument; MORPH's wider corners and TRACKPAD's edge flash are two more claims about reading that nothing gates                                                                                                                                                                                                                                                       | Row B.1 of Phase 11's list                                                                                   |
| `D-11-13-a` - one `_coordMax` for two axes                                                  | 11-13                      | **OPEN**, with 12-07's choice recorded: `lua-host.ts` was touched and the scope not widened (A.3)                                                                                                                                                                                                                                                                                                                                       | A.3                                                                                                          |
| `D-11-15-a` - `host-surface.spec.ts` cannot express an entry-installed `self:` method       | 11-15                      | **OPEN**, and met again: TRACKPAD's `self.z=function(s)` became `local function z(s)` because the gate refuses a method the host does not install                                                                                                                                                                                                                                                                                       | The per-entry declared-method list 11-15 proposed                                                            |
| `D-11-16-a` - `browse-webkit.e2e.ts:564` re-reads the pad without a wait                    | 11-16                      | **OPEN.** Not seen in 12-01's, 12-03's two, 12-04's, 12-05's, 12-10's or this gate's two runs                                                                                                                                                                                                                                                                                                                                             | The one idiom for it and `D-11-08.1-a`                                                                       |
| A.1 clock sync                                                                             | 11-16                      | **OPEN**, A.1 above                                                                                                                                                                                                                                                                                                                                                                                                                    | A.1                                                                                                          |
| A.2 DIAL's counter-clockwise rate                                                          | 11-16                      | **OPEN**; not on the second bench sheet and not touched                                                                                                                                                                                                                                                                                                                                                                                | One bench question about the host's relative-CC mode                                                         |
| A.3 TRACKPAD's animation                                                                   | 11-16                      | **DELIVERED as TRACKPAD, by the fold** (12-10): not "beside the preset" as 12-12's plan wrote and not "replaced" either - one hand-authored card carrying the recipe whole plus the flash as a tune option, painted from the Timer because no Setup-side shape fits (942 at best); the preset still on the shelf                                                                                                                         | Row 23 on the desk                                                                                           |
| A.4 SNAKE                                                                                  | 11-16                      | **OPEN**, deferred by the user; A.2 above                                                                                                                                                                                                                                                                                                                                                                                              | A.2                                                                                                          |
| A.5 four faders                                                                            | 11-16                      | **OPEN**, never tested, not on the second sheet either                                                                                                                                                                                                                                                                                                                                                                                 | A bench run                                                                                                  |
| A.6 `bloom` / `disturb`'s residue                                                          | 11-16                      | **OPEN**, unreachable from any entry; no preset selects either (12-06's as-is kept it so)                                                                                                                                                                                                                                                                                                                                              | B.5 of Phase 11's list                                                                                       |
| A.7 FORGE's precision                                                                      | 11-16                      | **CLOSED BY REMOVAL** - the user's bench line was "FORGE: remove" (12-04); commit-on-release (C.2) is moot with it                                                                                                                                                                                                                                                                                                                       | -                                                                                                            |
| A.8 LATTICE's "clamp it better"                                                            | 11-16                      | **CLOSED BY REMOVAL** - "LATTICE: remove" (12-04)                                                                                                                                                                                                                                                                                                                                                                                      | -                                                                                                            |
| A.9 LUMEN's depth                                                                          | 11-16                      | **DELIVERED (12-11) with 12-01's verdict attached**: the knob reaches the module's RAM (proved at the tuner and in the fake's RAM), Probe B saw four steps, the bench compared the row that cannot move; the 32/32 re-cut takes the bottom row to exact black at the deepest index at zero character cost, and the card's own copy names the anchor row. Row 15 is the observation that settles it on the desk                                | Row 15                                                                                                       |
| B.1 to B.7 the seven missing gates                                                         | 11-16                      | **OPEN, all seven**; this phase built none and found two more classes (A.6's `D(` blindness, A.9's header-versus-corner)                                                                                                                                                                                                                                                                                                              | As listed there                                                                                              |
| C.1 the nine dead links                                                                    | 11-16                      | **Thirteen now** (D.8 above)                                                                                                                                                                                                                                                                                                                                                                                                           | The user's                                                                                                   |
| C.3 JOYSTICK's trail                                                                       | 11-16                      | **ANSWERED (12-06, verbatim): "as is, selectable tuning options under Trackpad."** Answered as-is on 2026-09-11; the trail and the four look layers are costed in JOYSTICK's comment in `src/lib/catalog/presets.ts` and none was taken; the "more led animation, trail or something" half of the 2026-09-09 note is a named non-delivery with the reason - the trail takes the parked dot and the power-on centre, and a look layer reverses the dark-field decision and re-points the one colour knob from the stick to the background wash | -                                                                                                            |
| C.4 STRIP as three                                                                         | 11-16                      | **OPEN** (D.7)                                                                                                                                                                                                                                                                                                                                                                                                                         | The user's                                                                                                   |
| C.5 the `touch.ts` code-9 gap                                                              | 11-16                      | **RETIRED BY THE PROBE** - option 2 chosen by evidence (C above); `touch.ts` is faithful for a human tap                                                                                                                                                                                                                                                                                                                               | -                                                                                                            |
| C.6 to C.10                                                                                | 11-16                      | **OPEN** as recorded there; C.2 moot with FORGE                                                                                                                                                                                                                                                                                                                                                                                        | As listed there                                                                                              |
| Section D: the manifest's four figures; the wrong-corner headers; the tooling defect; NINEPADS' fast tap upstream; `phaseCond`; `preset-baseline.json`; WebKit `contextlost`; runbook row C | 11-16 | Manifest **CLOSED** and re-verified (22 rows, red on an emptied reason); headers: **one more found wrong** (TRACKPAD's Timer, corrected); tooling: **OPEN** - every plan since 12-04 skipped `advance-plan`, `update-progress`, `roadmap update-plan-progress` and `requirements mark-complete` and updated STATE by script against a copy; the three upstream items **OPEN, upstream**; `contextlost` still a **NAMED UNKNOWN**; **runbook row C OPEN**, now three frames per click and CLEAR resetting both elements | As listed there                                                                                              |
| **Item 1** - the reachability separability licence on NINE PADS                            | 12-05                      | **OPEN**, A.10                                                                                                                                                                                                                                                                                                                                                                                                                         | A.10                                                                                                         |
| **Item 2** - `facets.ts:15` "still says `precise` is at six"                                | 12-05                      | **CLOSED BEFORE IT WAS WRITTEN**: 12-04 rewrote that sentence (the file reads "`precise` is at 7 and has one to spare" and names the drift), so 12-05's SUMMARY and this item recorded a staleness that was already fixed. What WAS stale two lines below - the `still` carriers listed with TPAD after 12-10 moved the tags to TRACKPAD - is corrected at this gate, every term recounted from `LISTING`                                     | -                                                                                                            |
| **Item 3** - QUADRANT's hung note                                                          | 12-08                      | **OPEN**, A.4, waiting on row 19(b)                                                                                                                                                                                                                                                                                                                                                                                                    | A.4                                                                                                          |
| **Item 4** - `docs/TESTING.md`'s stale cost rows (LUMEN, CHORUS, CONSOLE, MORPH)            | 12-11                      | **CLOSED at this gate**: the Phase 12 section carries all eighteen entries at three corners (LUMEN 704 / 707 / 201, CHORUS 796 / 29, CONSOLE 781, MORPH 772), and the Phase 11 table is left standing as history with its corrections listed by line                                                                                                                                                                                    | -                                                                                                            |
| **Item 5** - JOYSTICK's three rows                                                         | 12-06                      | 5.1 C.3's closing sentence **applied above**; 5.2 the audition row **not added, with the reason** (A.11); 5.3 the `docs/TESTING.md` joystick row **written**: 551 / 357 at the corner, 543 / 24 at the defaults (547 tuned), re-observed at this gate                                                                                                                                                                                | A.11                                                                                                         |
| **Item 6** - TRACKPAD's seven rows                                                         | 12-10                      | 6.1 `/c/tpad/` **recorded** under CAT-01 as the thirteenth dead address; 6.2 CONT-01 **amended** by name and dated; 6.3 the `D(` blindness **recorded, the gate not widened** (A.6); 6.4 the `docs/TESTING.md` row **written** at 903 / 490 corner / 488 defaults - 12-10's 488 / 486 were two short and its header is corrected; 6.5 the four `touch-guard` rows **recorded**; 6.6 and 6.7 **Phase 13's** (A.14)                                | A.6, A.14                                                                                                    |

## The bench-note trace - every line of `BENCH-2026-09-10.txt`

| Line                                | Note                                                                                    | Where it went                                                                                                                                                                                                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 to 12, the user's snippet         | "minden xy mukodesre hasznaljon szeparaciot" - per-axis send-on-change, y inverted      | **12-07's `A`** (150 characters, per contact, `e<4`, a DOWN primes silently, `127-y`), called by **LUMEN in 12-11** - `A`'s only caller. `A` was NOT dropped under 12-07's fallback order, which never fired at 139 free; the snippet's shape shipped in the library, not inlined |
| 14 ARC                              | MIDI stops reliably but the visual on ZONA doesn't                                      | **12-05** (+18: `if s.s>0 then F(s.f)end` inside the rate branch, the wobble that re-armed the swirl); row 5 of the checkpoint                                                                                                                                                       |
| 15 CHORUS                           | one chord at a time, exclusive pads                                                     | **12-09** (`s.z`, `s.c`, `R(s,i)`, `X(self,20)`; the pair 945 to 825); rows 7(b) to (e)                                                                                                                                                                                             |
| 16 EUCLID                           | still not precise                                                                       | **12-08** (`Q` in place of the inlined guard, `X(s,20)`); row 3(b), first in the checkpoint                                                                                                                                                                                          |
| 17 LATTICE                          | remove                                                                                  | **12-04**, removed                                                                                                                                                                                                                                                                  |
| 18 LUMEN                            | seems like nothing changed                                                              | **12-01** (the verdict: the knob reaches the wire) and **12-11** (exact black at the deepest, the anchor row named); row 15                                                                                                                                                          |
| 19 MORPH                            | random lighting in the middle; bigger single-channel corner zones                       | **12-09** (3x3 corners at +0, the dead margin at +56, the trail cell from `Q` at +6); row 8(b) to (d)                                                                                                                                                                                |
| 20 NINE PADS                        | make a 16 pads cause nothing changed                                                    | **12-01** (the knob reaches the module) and **12-05** (ships at 4x4, a two-valued knob as a word row); row 8 of the checkpoint                                                                                                                                                       |
| 21 SNAKE                            | nothing changed                                                                         | **Deferred**, by the user's own earlier words; A.2                                                                                                                                                                                                                                   |
| 22 CONSOLE                          | a framework for finger-LED interaction; muted faders move but send nothing              | **12-05** (muted faders move and repaint in silence, 11-07's inert reading reversed on the record) and **12-09** (the cell from `Q`, 852 to 781); rows 13(b), (c) and 6 of the checkpoint                                                                                            |
| 23 FORGE                            | remove                                                                                  | **12-04**, removed                                                                                                                                                                                                                                                                  |
| 24 GHOST                            | good                                                                                    | Untouched; nothing to do                                                                                                                                                                                                                                                             |
| 25 JOYSTICK                         | didn't improve the visuals                                                              | **12-06**, the answer: as-is. A named non-delivery with the reason (C.3 above)                                                                                                                                                                                                       |
| 26 RADAR POINTS                     | nice but needs the touch detection framework                                            | **12-08**; row 22(d)                                                                                                                                                                                                                                                                |
| 27 POMODORO                         | nice                                                                                    | Untouched; nothing to do                                                                                                                                                                                                                                                             |
| 28 SHUTTLE                          | REMOVE                                                                                  | **12-04**, removed                                                                                                                                                                                                                                                                  |
| 29 STEPS                            | same as the other sequencers                                                            | **12-08**; row 12(b)                                                                                                                                                                                                                                                                 |
| 30 Trackpad                         | still no animation; the edges should flash, rounded, toward the motion                  | **12-10**, under the user's "selectable tuning options under Trackpad" at 12-06; row 23                                                                                                                                                                                              |
| 32 the bigger-scope decision        | a finger-LED interaction framework that works on a real ZONA                            | **12-07** (the library) on **12-02** and **12-03** (the system element reachable and written as the third string), designed against the probe of 2026-09-10; every entry above that sits on it                                                                                       |

Every line has a plan, a removal, a deferral or the user's own answer. **No line closes on a claim**:
the bench rows that would close each are the checkpoint's, and none has been run.

## D-12-12-a - `session.e2e.ts:701` has failed in two of the last four full runs, with two different messages

**Found:** this gate's run 1 at `--workers 3`, 573 MB available; first seen by 12-10's one run.

```
[chromium] e2e/session.e2e.ts:701 "the session with a granted ZONA on the cable
› a granted ZONA is offered on load and one click connects it with no picker"

  Error: the module named itself once per connect
  expect(received).toBe(expected)   Expected: 1   Received: 2
  Call Log: - Test timeout of 30000ms exceeded
    at onlyReads (e2e/session.e2e.ts:324:6)
```

12-10 saw the same title fail as a 30 s `page.evaluate` timeout; this gate saw `onlyReads` poll for
thirty seconds and read **two** `SERIALNUMBER/FETCH` frames for one connect. Both runs were on a
machine with very little memory (this gate: a tenth of it), both reruns alone were green, and run 2
of this gate was 100 / 100. Two shapes for one title suggests the title's wait, not the store: the
granted-port offer connects on load, and a second connect reaching the fake before the poll settles
is the same read-before-the-round-trip family as `D-11-08.1-a` and `D-11-16-a`. No Phase 12 plan
after 12-03 touched the file, and 12-03's edit there was five counts.

**Suggested owner:** the next plan that touches `e2e/session.e2e.ts` - Phase 13's connection-slot
band (13-11, 13-12) - together with `D-11-16-a`; print the raw frames the poll saw in the message, so
the next occurrence says which connect was the second.
