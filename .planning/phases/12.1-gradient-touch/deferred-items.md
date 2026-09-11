# Phase 12.1 - deferred items

Out-of-scope discoveries logged by executors, not fixed in the plan that found them. Each names the
plan that found it and the plan expected to take it.

## From 12.1-08a (2026-09-11)

- **`src/lib/catalog/library.ts` section 5 - the caller lists for `N` and `G` are now incomplete.**
  `N`'s reads "Callers: ARC's stop tap (12.1-03, `N(x,y)==40`) and 13-15's region lookup, named in
  advance"; `G`'s reads "Callers, each named: EUCLID, STEPS, RADAR POINTS, SONAR (12.1-03), CHORUS,
  MORPH, CONSOLE, LUMEN (12.1-04) - eight". GHOST calls `N` twice (the erase key in the Setup, the
  comet / ghost cell in the Timer) and `G` once since 12.1-08a. Not edited by 12.1-08a because the
  run's brief forbade touching `library.ts` short of a Rule-1 bug. **For 12.1-08b**, which rewrites
  `N`'s paragraph when it moves `N` to 255/0 (R-20) and can add GHOST to both lists in the same edit.
- **`src/lib/catalog/entries/arc.ts:207-208` - "ARC is `N`'s one caller today and the reason it
  ships; 13-15's region lookup is the named second."** GHOST is a second caller since 12.1-08a.
  `arc.ts` is not in 12.1-08a's file set. **For 12.1-08b** (or 13-19, which re-cases entry names and
  touches every entry header).

## From 12.1-08b (2026-09-11)

- **12.1-08a's first item is resolved.** `library.ts` section 5 was rewritten by 12.1-08b: `N`'s
  paragraph names ARC, GHOST (twice), the vendored compiler's zone and fader emission and 13-15;
  `G`'s names the eight hand-authored callers, GHOST and the compiler's glow emission. **12.1-08a's
  second item stands**: `src/lib/catalog/entries/arc.ts:207-208` ("ARC is `N`'s one caller today")
  is still stale - `arc.ts` was not in 12.1-08b's file set either, and it is a comment. **For
  13-19**, which re-cases entry names and touches every entry header.
- **FOUR FADERS' level stays the raw sensor value (12.1-CONTEXT D-14, extended by 12.1-VALIDATION
  R-22).** The calibrated form `local v=127-U(y,KY)*127//512` for `local v=127-y` measures **540
  against 525** at the defaults (+15, the compiler's own Setup with the needle substituted, pinned
  minifier, `checkSyntax` true), 368 free. Not taken: what a DAW receives from an instrument is not
  changed silently. `docs/HARDWARE-AUDITION.md` row 28(d) asks the user whether the raw top and
  bottom bother them; a "yes" is one emission site in `_pad.ts`'s fader branch (a declared manifest
  row) and its mirror in `pad-sim.ts`'s `fadersBody`, plus the FOUR FADERS cost row. **For the gate
  (12.1-09) to carry as a bench answer.**
- **`reachability.sweep.spec.ts`'s NINE PADS margin literal moved 271 -> 260** with the reason
  beside it. The reporting weakness 12-05 recorded (Pass B ranks the dearest colour at the 4x4
  default and misses the three characters 255,255,255 costs at 3x3) is unchanged: the true worst
  NINE PADS state is 651 of 908 (640 + 11), 257 free, and the sweep reports 648. Still nothing at
  risk; still not a hole in the guard. Recorded so the next reader of that comment does not take
  "260" for the true figure.

## From the gate (12.1-09, 2026-09-12) - the phase's work list, in 12-12's five sections

The two dated sections above are left as written; where an item there is closed or carried it is
said here by name. Every figure below was measured at the gate or is quoted from the SUMMARY that
measured it, with the plan named. **Nothing in this phase has been hardware-verified since Probe C
of 2026-09-11, which was the user's; the bench rows are handed over by the gate's checkpoint and are
unanswered.**

### A. What this phase could not do, with what would close each

| # | What | Why not, with the numbers | What closes it |
| --- | --- | --- | --- |
| 1 | **The presets uncalibrated (D-16) - CLOSED, and the manifest route was taken** | D-16 stood as "the presets stay uncalibrated, the route is a declared manifest row" until the user answered "yes" on 2026-09-11 (D-26 item 2) and "mirror" to 12.1-08b's question (D-27). 12.1-08b edited `_pad.ts` and `pad-sim.ts` under **sixteen** `intendedDivergence` rows (eight per file, 22 -> 38 in `src/lib/fidelity/upstream-manifest.json`, each with its reason, generated from the diff and verified exactly-once on both sides), one optional `PadState.touchLibrary` field read by both engines, the nine states carrying `{ kx: KX, ky: KY }`, the eight costs re-measured (361 / 413 / 349 / 391 / 491 / 565 / 525 / 592; tpad 902), `ledTick` at the same sha256 either side, `lua-parity` test 6 holding the mirror over 36,936 records. | Closed. What remains is row 28 on the desk. |
| 2 | **A calibrated `A`** (LUMEN's CC pair, D-14) | `A` sends raw `x` and `127-y`; raw reaches 0 and 127 a third of an LED inside the outer LEDs (a finger dead on LED 8 reads 126, on LED 0 reads 1). The calibrated form `U(x,KX)*127//512` is about **+25** in 255/6, which has **35 free** after 12.1-08b - it fits, barely, and it changes what a DAW receives from the one entry that sends a position. | Row 26(d)'s answer. A "yes" is one part of one string, re-measured, and LUMEN's smoke test re-aimed. |
| 3 | **The square-law `G`** (D-12) | Linear weights ship; the firmware's phase curve is already convex. The square-law alternative read 71 / 56 at the midpoint against the linear 135 / 119 (12.1-02's T3-1) and cost +15 on D-11's shape (728 in 255/6 then). On 12.1-08b's shape `G` goes through `Y`, so the change is inside `Y` or `G`'s weight line and **255/6 has 35 free** - re-measure before promising it fits. | Row 25(e)'s answer ("too bright"). |
| 4 | **The second Probe C pass** (row 24) | The tables are frozen from run 1 (`runs: 1`, target 10 discarded, `KY[0]` from the corners, which can only say `KY[0] <= about 2`). A five-minute re-run gives target 10 directly. | Row 24. A knot moving by more than 2 edits `calibration.ts`'s two arrays and the provenance record beside them, `UPDATE_FRAMES=1` regenerates `frames.json`, one commit. |
| 5 | **`scripts/` still has no chunk runner** | The e2e suite runs in five file chunks on fresh detached servers because wrangler 4.128.0 dies mid-run (13-07 deviation 9); the runner is a scratch script, and 12.1-08 found the original's `taskkill /F /T` flags rewritten to `F:/` and `T:/` by Git Bash path conversion from a Claude shell, so its servers never stopped and held `build/` (`EPERM`). `e2e-chunks-1208.sh` (PowerShell `Stop-Process`, `MSYS_NO_PATHCONV=1`, free memory per chunk) is the record; this gate ran a copy of it with a `WORKERS` variable for the reruns. At the gate wrangler died twice more mid-chunk (chunk 2 of run 1, chunk 4's first rerun). | A committed `scripts/e2e-chunks.*` with the PowerShell stop, or a `playwright.config.ts` `webServer` that survives; whoever next touches the e2e harness. |
| 6 | **`docs/TOUCH-PROBE.md`** (the research's Wave 0) | Never existed; nothing in the tree needs it. `docs/CALIBRATION-PROBE.md` (12.1-01) is the probe document. | Nothing. |
| 7 | **GHOST's expiry alternative** (12.1-08a; D-26 item 1) | GHOST keeps its own contact model: no `Q`, no `X`, no `R`, because the library's expiry would end a STILL finger's recording after n Timer ticks (a motionless contact sends nothing under the firmware's change gate). The alternative - `R=function(s,i)s.h=nil end`, `Q(s,i,e,x,y)` before `G`, `X(s,150)` in the Timer - measures **Setup 530 / Timer 417** at the picker corner and was not taken. | Row 27(d)'s answer. A "yes" is one commit at the price of a still finger's recording ending after three seconds. |
| 8 | **FOUR FADERS' calibrated level** (12.1-08b; D-14 extended, R-22) | `local v=127-y` stays raw; the calibrated `local v=127-U(y,KY)*127//512` measures **540 against 525** at the defaults (+15, 368 free). Not taken: what a DAW receives is not changed silently. | Row 28(d)'s answer. A "yes" is one emission site in `_pad.ts`'s fader branch (a declared manifest row), its mirror in `pad-sim.ts`'s `fadersBody`, and the FOUR FADERS cost row. |
| 9 | **The decay gate is blind to `D(` and, since 12.1-08b, to `K(`** | `decay-idiom.spec.ts` reads literal `glpfs` / `glt` pairs; a decay through `D(n,l,w)` from the library or through `K` (which quantises each start to a multiple of 6 and calls `D`) from the library and the compiler's comet is invisible to it. What proves the landings is `library.spec.ts` test 6 (121 stamps at 102 points, every one observed at 0), `lua-smoke.spec.ts` 38 and `lua-parity.spec.ts` 6. The honest clause is textual - a `D(` or `K(` call whose `w` is `<expr>*6` or `//6*6` - and more than one assertion. | A plan that widens the gate with its own negative check; not this one. |
| 10 | **The audition cost table still has no gate** | Eleven rows moved this phase, every one carried by the plan that moved it, and the gate found no stale row - the first gate to find none. Twelve stale rows in three phases before it is still the argument for `audition.spec.ts` reading `renderLua`. The paragraph above the table that describes TRACKPAD as "903 / 486 ... 488 at the picker corner" is 12-10's prose and is history; the table reads 903 / 508. | The spec reading `renderLua` at the defaults for every hand-authored row. |
| 11 | **`SNAPSHOTTING_BODY` and `identifiedBody` still name three scripts** (12.1-08) | "Taking a copy of the Setup and Timer scripts already on your ZONA's touch element, and the page's own init script." and "... and the page's own init script, so PUT BACK can undo anything you try." - true by omission of the timer the snapshot also copies. 12.1-08 changed `CONFIRM_REPLACES` only, as written; the spec's table names 13-18 as the owner of the other two. | 13-18's rewrite under 13-CONTEXT D-05, which must carry the four-string fact. |
| 12 | **`arc.ts:207-208`'s "ARC is `N`'s one caller today"** (12.1-08a's second item, carried by 12.1-08b) | GHOST calls `N` twice and the compiler emits it for NINE PADS and FOUR FADERS. `arc.ts` was in no 12.1 plan's file set and the line is a comment. | 13-19, which re-cases entry names and touches every entry header; or a one-line quick fix. |
| 13 | **The vendored headers' `Modified for HANGAR:` lines** (12.1-08b's question 2) | Left at 11-04's wording, which names the manifest as the authority and says the line is not a second copy of it; the sentinel must stay within the first twelve lines. | One line per file inside the stripped header block if the user wants the sixteen sites named there; no hash moves. |
| 14 | **The panel's "the record predates the timer slot" line** (12.1-07's question 1, 12.1-08's answer) | `snapshotFromV1` and `snapshotFromV2` are published and rendered by nothing yet; the probe renders them as ` v1` / ` v2` after the four lengths. The panel's sentence should fire on `snapshotFromV1 \|\| snapshotFromV2`, because both restore the 22-character 255/6 default. | 13-17 / 13-18, where the line is written. |
| 15 | **The skeleton's "Fetched strings" panel renders two of four** (12.1-06's question 2) | It renders the two touch strings only, as 12-03 left it (it did not render the system setup either); the readout line and the store proof cover four. | A two-`<pre>` edit if wanted. |
| 16 | **The e2e suite was not run at 12.1-08b, and `fidelity.e2e.ts` was red from `dbfb3e7` to this gate** | 12.1-08b put `state.touchLibrary` on all nine presets, so `stateDiverges("dial")` became true and the WASM probe's fixture comparison read as a broken build; 12.1-08b proved its e2e zero by `grep -c "test("`. Fixed at the gate under Rule 1 (the probe compiles BOTOR's own DIAL state through `$lib/pad` and reports `shelf: "vendored"`). | Closed. The rule recorded in `docs/TESTING.md`'s "The gate holes": a plan that changes what a preset compiles to, or any state an e2e fixture compares against, runs the chunk that reads it. |
| 17 | **`check-counts.mjs` has no direction and misreports a red run** (12-04, 12-12) | Unchanged. | Whoever next touches the script. |
| 18 | **`docs/SESSION-RUNBOOK.md:14`'s suite counts** (12-03, 12-12) | Still 724 / 13 / 77 against 936 / 19 / 80; under Phase 13's append-only band. | 13-20 or the band's owner. |
| 19 | **`D-11-13-a` (one `_coordMax` for two axes) and the zero-period `gtt` deadline (11-15)** | Carried from Phase 12's A.3; no 12.1 plan touched `lua-host.ts`'s coordinate handling (12.1-02 and 12.1-08b touched the pair and the name lists only). | As Phase 12 recorded. |
| 20 | **The hold band on a ring seam, the alert layer's heal, the floor** (D-18, D-11, R-14) | Designs, not gaps - each is a bench clause: 25(g) the seam, 25(j) the alert layer after a page switch and after the power cycle, 25(f) the dark pad with no floor (`glc(...,1)` zeroes the min). | Rows 25(f), (g), (j). |
| 21 | **The 12.1 / Phase 13 ladders disagree by two** | 13-09's SUMMARY states `-1 / -11`; its parts sum to `-9` and the per-file diff from `91ab755` agrees, because 12.1-01's observed baseline (906) already held two of 13-09's uncommitted `tune-ui.spec.ts` tests. Both ends meet at 936 with 13-09 at -9. | 13-20 reconciles Phase 13's chain; the sentence is 13-09's and is pointed at, not edited. |

### B. Hardware findings for the production unit, from Probe C - recorded for the user, not for a plan

1. **The sensor saturates inside the outer LED on the high side of both axes and compresses on the
   low side.** LED 7 to LED 8 is 6 raw units in x and 11 in y; LED 0 to LED 1 is 12 and 14; the
   middle is about 17 per LED (KX steps 12, 16, 17, 18, 21, 15, 20, 6; KY steps -, 14, 22, 20, 15,
   14, 18, 11). A finger dead on LED 8 reads 126, on LED 0 reads 1 - so a raw sender (LUMEN's `A`,
   the faders' level, RADAR's and DIAL's CCs) reaches 0 and 127 a third of an LED inside the outer
   LEDs, and every naive `x*9//128` reading put a finger on LED 7 in column 8. This is the finding
   the phase answers with the map; on another unit the knots may differ, and the calibration row
   asks for the LED pitch in millimetres (D-20) as the one sanity check.
2. **The outer-segment hold band is about three raw values.** The hysteresis is 45/64 of a pitch
   either side of the LED (D-18), so between LED 7 and 8 in x (pitch 6) the band is 122..124 -
   three values - against eight between LED 4 and 5 and six between LED 2 and 3. On the outer ring
   a finger has less room to wobble before the cell flips; row 25(g) asks whether a finger resting
   on a ring seam ever toggles both.
3. **`KY[0]` is inferred, not read.** Target 10 was a re-tap after a dropped lift at target 9 and is
   discarded; the corners say `KY[0] <= about 2`. Only the row 0 / row 1 blend moves with it.
4. Phase 12's four findings (dropped single taps, palm ghosting, five-finger lag, the centre four
   low - its section B) still stand for the production unit and are not this phase's to close.

### C. Retired by the probe and by the measurements - pointed at, never edited

- **The research's hypothesis knots** (`12.1-RESEARCH.md` §1.2, B.5's `MEASURED = false`): Probe C
  ran before planning; the measured tables shipped at 12.1-01 and the hypothesis values appear
  nowhere in the tree.
- **The research's seven-value hold band, 69..75, "the same width 12-07 measured"**: eight, three
  and six values on three segments of the measured map (R-2, D-18); the band is a fraction of the
  pitch. **12-07's `<11` window and its 68..74 band** were correct on the wrong divisor and are
  superseded by `U` and `W` over the knots.
- **The `(116, 15)` bench case and its naive cell 17**: `(120, 12)` and 8 on the measured map.
- **The research's byte-6 floor paragraph** (section C): `glc(...,1)`'s trailing `1` forces the
  layer's min to 0 (`l_grid_led_layer_color`, nargs 6); there was never a floor, and a cell `V`
  clears is dark (R-14). Row 25(f) asks the opposite question.
- **"A reduced gradient with no expiry clear"** (the brief's no-branch): research variant H at 1,043,
  135 over; the honest one-slot branch was calibration-only at 882 (D-03, not taken).
- **The research's "wire-pin and tune/model free now"** (F.2): Band 2's and 12.1-08b's (R-7).
- **The brief's expectation that JOYSTICK's rest frame would move in `golden-frames.json`**: its
  parked dot is `springRestCell`, a compile-time constant; the fixture did not move (R-18).
- **The brief's path `src/vendor/upstream-manifest.json`**: the file is
  `src/lib/fidelity/upstream-manifest.json`.
- **The brief's premise that the library is present on the module under a preset**: it was the
  firmware default until 12.1-08b (R-16); every card lands the library since.
- **The plan-check's "`G`'s end test is the blessed spelling `e~=1 and e~=4 and e<9`"**: that is
  `Q`'s; `G` draws nothing on a code 9 (12.1-03).
- **The research's and the plans' callback order `G` then `Q`**: `Q` first (12.1-02, measured).
- **"`frames.json`'s resting and demo frames move for the ten"** (plans 03, 04, 05): byte-identical
  at 12.1-05, 12.1-08a and 12.1-08b.

### D. Open for the user - decisions, not gaps, each with its numbers

Left this section since the planner wrote it: **D-04** (answered "yes", 2026-09-11 - one KEEP during
the bench; runbook row J is written as agreed) and **D-16** (answered "yes", 2026-09-11, D-26 item 2;
landed by 12.1-08b under D-27 "mirror" - section A.1).

1. **One colour everywhere, or the entry's own** (D-13). Four colours ship: white on EUCLID, STEPS,
   CHORUS and CONSOLE; `@SWEEPC` on RADAR POINTS and SONAR; `@TRAILC` on MORPH; `@CURSORC` on LUMEN;
   `@RECC` on GHOST; and the presets' own touch colour on JOYSTICK and the comet's on the four comet
   cards. A literal costs nothing in shape to change; a knob would move every shape character. Row
   25 asks by looking; 12.1-08a's third question (does the live gradient beside GHOST's comet read
   as one thing or two) is the same question on one card.
2. **The dim end** (D-12): linear, or square-law at about +15 (A.3). Row 25(e).
3. **LUMEN's CC pair raw or calibrated** (D-14, +25, A.2). Row 26(d).
4. **GHOST's paused drag** (12.1-08a, A.7): keep recording through a still finger (shipped), or end
   the loop three seconds after a lost lift (530 / 417). Row 27(d).
5. **FOUR FADERS' level raw or calibrated** (12.1-08b, A.8, 540 / 525). Row 28(d).
6. **The LED pitch in millimetres** (D-20): a clause in row 24; nothing waits on it.
7. **If the page-load row (J) fails - which fallback.** The failure signature is
   `attempt to call a nil value (global 'G')` on the first finger after the power cycle, with the
   module's LEDs showing the alert flash only. Three fallbacks, in the order to take them:
   - **(a) the one with no new doubt** - drop `self:tim()` from 255/0 (-10) and open every Setup
     that calls the library with `ele[#ele]:tim()` (+15 each; a touch script calling a system
     method is exactly what probe 2 proved on this ZONA). D-04 costed it on D-11's shape for eight
     re-fits (EUCLID 741, STEPS 435, CHORUS 837, CONSOLE 822, MORPH 829, LUMEN 748, RADAR POINTS 607,
     SONAR 587, all inside 908) **and the tree has grown since**: on today's picker-corner figures
     the same +15 gives EUCLID 741, STEPS 435, RADAR POINTS 607, SONAR 587, CHORUS 837, MORPH 829,
     CONSOLE 822, LUMEN 748 and **GHOST 506** (12.1-08a), every one inside 908; **TRACKPAD's Setup at
     903 / 5 cannot take it** and would carry the call in its Timer (510 + 15 = 525, or guarded
     `if not D then ele[#ele]:tim()end` at about +30 = 540, 368 free - the Timer is where TRACKPAD
     calls `U` and `D` anyway); ARC (528) calls `N` from 255/0 and needs nothing; and **the eight
     preset cards** (12.1-08b) call `K`, `G` and `N` from their compiled Setups, so the vendored
     compiler would emit the call under one more declared manifest row (AURORA 376, PINWHEEL 428,
     STARFIELD 364, RADAR 406, JOYSTICK 506, NINE PADS 580, FOUR FADERS 540, DIAL 607 - inside 908;
     tpad reaches no library site and needs nothing). Write (a) first; it is about twelve needles,
     one manifest row and one `library.ts` edit, every figure to be re-measured.
   - **(b)** 255/6's functions carried in 255/4 - the same unproved link (a system `ini` reaching a
     system method on a page load), and 255/4 is 13-17's slot.
   - **(c)** the firmware side.
8. Carried from Phase 12's section D, untouched by this phase: the expiry window as five callers'
   window (row 7(e)); LUMEN's y inversion; `featured` on TRACKPAD; STRIP as three; the thirteen dead
   `/c/<id>/` addresses (moved under 13-08's `/playground/`); whether the `tpad` preset should also
   leave the shelf (it now carries `touchLibrary` and reaches no library site); TRACKPAD's six
   questions; QUADRANT after row 19(b).

### E. Every item the SUMMARYs recorded, and Phase 12's items this phase touched, by name

Phase 12's `deferred-items.md`, the items 12.1 touched:

- **A.3 `D-11-13-a`**: untouched (A.19 above).
- **A.6 the decay gate blind to `D(`**: widened in scope, not closed - now `K(` too (A.9 above).
- **A.7 the library's dropped function `F`**: still gone; `G` is the finger light 12-07 dropped,
  with a layer and a colour, and `K` is its decaying twin.
- **A.9 the audition cost table's gate**: still not built; eleven rows moved and none went stale
  (A.10 above).
- **A.10 the reachability sweep's separability licence on NINE PADS**: still open; the sweep
  reports 648 / 260 and the true worst is 651 / 257 since 12.1-08b (the margin literal moved 271 ->
  260 with the reason).
- **A.11 JOYSTICK's audition row**: JOYSTICK has a row now, inside row 28 (the eight preset cards)
  under a dated scope line that widens the document's title in writing - 12.1-08b, R-11's rule.
- **A.12 `check-counts.mjs`**, **A.13 `SESSION-RUNBOOK.md:14`**: carried (A.17, A.18).
- **D.9 whether `tpad` should leave the shelf**: carried; the preset now carries the knots field and
  reaches no library site.
- **D-12-12-a (`session.e2e.ts`'s granted-ZONA title)**: green in both runs at 12.1-08, in both at
  13-12's three whole runs' reruns, and in both runs here; not seen since 12-12.
- **The bench-note trace**: `BENCH-2026-09-11.txt`'s lines attribute to this phase whole - the
  finding to D-01 and the eleven re-fits, Probe C's triples to 12.1-01, the decision to D-03 and
  12.1-06..08; "rows 2-12 of the gate's bench were not run this round" to the checkpoint's item 6.

This phase's own SUMMARYs, every open item with its state at the gate:

- **12.1-01**: D-04 (now answered, row J written); the midpoint tolerance `ceil(32/d)` (a finding,
  in the test); the second pass (A.4).
- **12.1-02**: `Q` first then `G` (landed in every re-fit and handed to 13-14); D-12 (A.3, D.2);
  fifteen host sites; the 683 / 682 canonical note (section C).
- **12.1-03**: `G`'s code-9 end test (landed); `frames.spec.ts` never red (section C); D-13 askable
  (D.1).
- **12.1-04**: MORPH's split around the two calls (landed, handed to 13-14); row 26(d) (D.3); the
  colour path asserted through the knob.
- **12.1-05**: GHOST's question (answered, D-26 item 1, landed by 12.1-08a); `Coverflow.svelte` gone
  (12.1-08's third file a no-op).
- **12.1-08a**: `library.ts`'s caller lists (closed by 12.1-08b); `arc.ts:207-208` (A.12); row 27(d)
  (A.7, D.4); the third question on the comet beside the gradient (D.1).
- **12.1-06**: the fetch order is the write order (landed; nobody objected); the skeleton's panel
  (A.15); the escaped-quote lesson (in `docs/TESTING.md`'s gate holes).
- **12.1-07**: `fromV1 || fromV2` (A.14); the two older partial sentences (rewritten by 12.1-08).
- **12.1-08**: `SNAPSHOTTING_BODY` / `identifiedBody` (A.11); row J's wording as agreed (stands);
  the chunk script's stop (A.5).
- **12.1-08b**: row 28(d) (A.8, D.5); the vendored headers (A.13); `arc.ts` (A.12); the e2e suite
  not run (A.16, closed at the gate); "44,078" in its SUMMARY is the sweep's 44,846 (a transcription,
  pointed at).
- **12.1-09 (this gate)**: the fidelity probe fix (A.16); the ladders' two (A.21); the amendments
  dated 2026-09-12 where the plan wrote 2026-09-11; task 02's fifteen moved lines where the plan
  counted eight.
