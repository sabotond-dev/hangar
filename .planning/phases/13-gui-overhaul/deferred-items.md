# Phase 13 - deferred items

Written 2026-09-12 by plan 13-20, the gate, in 12-12's five sections. Every non-delivery with what
closes it, the batch rows the user approved (D-23) that no plan landed - each **approved and owed**
with the exact edit, never re-asked - every question the nineteen SUMMARYs and the orchestrator's
`13-GATE-NOTES.md` filed that D-23 did not answer (collected with the plan that filed it), the
planner errors, the gate holes, and Phase 12's own file walked. **Nothing in Phase 13 is
hardware-verified**: no agent connected to, wrote to or deployed to a device; the two probes of
2026-09-10 were the user's. The bench rows are handed over at 13-20's checkpoint and are the
user's.

## A. Could not do, or did not, with what closes each

| #  | What                                                                                                   | Why not, with the numbers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | What closes it                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | **The Playground draft is never written** (13-13 finding 1; 13-16 confirmed; batch row **J.19, approved, owed**) | The workspace reads its knob vector from the stamp hash (13-09) and calls `writeDraft` nowhere; 13-11 named the wiring as 13-13's, 13-13's files did not include the workspace, 13-16 wrote Sandbox drafts and said the same wiring would serve. The intro's resume card, the `Drafts` count on My configs and the context bar's `Draft` chip read an empty store honestly for the Playground. No plan in the phase owned it; J.19 assigned it to the closing plan, whose term is `+0 / +0` and whose files are documents. | In `src/routes/playground/[id]/+page.svelte`: on a knob change, debounce 250 ms and `writeDraft(local(), "playground:" + entry.id, playgroundRecord(entry, indices, now))` with a `PlaygroundRecord` beside `drafts.ts`'s `SandboxRecord` (one write function, one read function - 13-16's `saveSurfaceDraft` / `readSurfaceDraft` shape); on arrival with no stamp, read the newest draft for the entry and land it as the tuner's vector; `?draft=` optional. One unit test in `local.spec.ts` or a new `draft.spec.ts` (+1), one e2e title extending `first-experience.e2e.ts` 1's resume walk. |
| 2  | **The install column still renders under the workspace's surface** (13-09 Q6, 13-11 Q4, 13-12 Q6; batch row **J.13, approved, owed**; 13-18 deviation 1) | `Apply to ZONA` reads twice on the workspace - the context bar's (13-12) and the column's primary (`try-on-device`), which eighteen `install.e2e.ts` titles click; a state caption reads twice. 13-18 declined the removal by name because the primary is what the suite drives, and the column's other controls (Put back, Store, Reset) have no home until I.6.5 (below). | Remove the column from `src/routes/playground/[id]/+page.svelte`; move `Put back` and `Store on ZONA` under Device actions (or beside the bar's Apply - 13-17's question 3, open), the reset per item 3, the state blocks into the bar's status zone; re-aim the eighteen titles at the bar's `apply-to-zona` and `device-ui.spec.ts` test 10 (the column's structure) at the new homes; the Sandbox's `SurfaceActions.svelte` already has the shape. One plan, run the whole suite. |
| 3  | **`Reset active device page` under Device actions with §16's confirmation** (13-11 Q1; batch row **I.6.5, approved, owed**) | Shipped as A-45 left it: one click, no confirmation, in the install column; `device-ui.spec.ts` test 13 holds that KEEP's is the site's only confirmation. The batch chose the Bible's rule - three writes, three gates, each different: the apply's review (§9), the store's confirmation (SAFE-05), the reset's (§16). | `Clear.svelte` gains a confirmation reading `Reset Page 2 to its firmware default? Your browser draft will remain available.` (§16 verbatim, `clearLine(page)`'s fact kept), mounted under Device actions; A-45 retired by name in test 13's header; `install.e2e.ts:1977`'s "no confirmation" clauses re-pinned to the confirmation. Lands with item 2. |
| 4  | **`36 configurations` while nothing narrows the grid** (13-08 Q3; batch row **E.14, approved, owed**) | The count reads `{n} of {total} configurations.` always; the PDF draws the unfiltered form only. | One `{#if}` in `BrowseToolbar.svelte` (`{total} configurations` when `n === total` and no query, chip or view narrows), `browse-ui.spec.ts` test 6 and `browse.e2e.ts`'s `expectCount` re-pinned. |
| 5  | **The two empty-view lines** (13-08 Q5; batch row **E.15, approved, owed**) | `Favorites` with nothing starred and `Recently used` before any open read §16's search-miss line, which is not true of them. | Thread the library view into `BrowseGrid.svelte` (one prop) and render `Nothing starred yet. Star a configuration and it will be kept here.` / `Nothing opened yet. Configurations you open are kept here.`; one assertion each in `browse-ui.spec.ts`. |
| 6  | **The unreachable two-slot `overLine`** (13-16 Q2; batch row **G.34**: "keep the text; whether the branch is deleted is 13-19/13-20's") | `SLOTS` is 3 in the route, the preview and the landing since 13-17, so `Two events can't hold this mix of element kinds; remove one kind to fit.` can no longer render from the route; `emitSurface`'s parameter default is still 2 (13-17 deviation 9) and `emit.spec.ts` 1 measures both. | Decided at this gate: **keep** the branch and the text - the two-slot measurement is the meter's honest picture of a module whose 255/4 is not written (row H's fallback), and `costOf(s, { slots: 2 })` is what the spec pins. Nothing to do unless row H fails, in which case the route flips back and the line is live. |
| 7  | **`?feels=` still narrows the grid with no chip to show it** (13-08 Q7; batch row **J.10, approved, owed**; 13-19 handed on) | The FEELS row is gone from the rail (D-11); `query.ts`'s `feels` field is read by ten files (`facets`, `filter`, `query` and their specs, `BrowseToolbar.svelte`, both playground routes, `browse.e2e.ts`). | Retire the parameter in `query.ts` (read and dropped, never written; `?tag=`'s legacy mapping kept), delete the `feels` field's readers, re-pin `query.spec.ts` and `filter.spec.ts`; `?for=` unchanged. One plan, the sweep untouched. |
| 8  | **`Favorites` / `Recently used` on My configs land on All configs** (13-13 Q1; batch row **J.23, approved, owed**) | The two rows link to the gallery without a view handoff. | A `sessionStorage` key the gallery reads once on arrival (the browse-return record already works that way, `return.ts`), set by the two links; one e2e clause on `library.e2e.ts` 1. |
| 9  | **A Sandbox record's thumbnail on My configs is unlit** (13-13 stub; 13-16, 13-17 carried; batch row **J.25, approved, owed**) | `preview.ts` builds an engine from a surface since 13-16, but `LibraryTable`'s registration is keyed on a listed catalog entry and the route builds none for a sandbox record; the batch chose a static paint of the regions' colours meanwhile. | About fifteen lines in `src/routes/my-configs/+page.svelte`: paint each region's rectangle in its colour onto the row's canvas (no engine), or register `preview.ts`'s engine per sandbox row; `LibraryRow.live` true for the kind. |
| 10 | **Two collections may share a name** (13-13 Q10; batch row **J.30, approved, owed**) | D-22 wrote no rule on names; the batch chose refusal at Create and Rename. | `collections.ts` refuses a duplicate on both paths with `A collection called {name} already exists.` in H.28's field; `collections.spec.ts` +1. |
| 11 | **A catalog entry writes page-next into 255/4** (13-17 Q1; batch row **J.40, approved, owed**; D-19's consequence) | Since 13-17 every install writes five; a Lua entry or a preset lands the firmware's `gpl(gpn())` default in 255/4, so a module whose owner had a utility script of their own runs page-next under a catalog configuration until Put back, and a store after it stores the default. The batch chose: substitute the snapshot's own utility for a landing's empty string. | One line in `install.svelte.ts`'s `#pageUtility` (the snapshot's 255/4 when the landing's is empty; a surface still writes its runtime there), `install.spec.ts`'s frame assertions re-pinned (the fake's 255/4 body equals the snapshot's under a catalog entry), and `install-copy.ts`'s "the utility script" clauses unchanged. Runbook row M's "utility button does nothing while the surface is installed" is unchanged; row I / K's catalog installs then leave the button as the owner made it. |
| 12 | **The workspace's `▷ Play` reach of PREV-04 has no test** (this gate) | `intro.spec.ts` 4 pins the hero's handlers and `sandbox.e2e.ts` 2 drives the Sandbox's preview; the workspace's `ledPoint()` → `host.touchDown` (13-09) is read by nothing. PREV-04 is ticked on the three reaches with this named. | One `tuning.e2e.ts` title: open a workspace, switch `mode-play`, pointer-down on the surface, assert the pad's pixels changed under the finger (the sandbox title's shape). |
| 13 | **Per-entry inspector headlines** (13-09; batch row F.1 "if you want it, say so") | One constant stands for all twenty-six; D-23 approved the batch as proposed and F.1 proposed nothing, so silence is the answer. | Not owed. An optional entry field if ever wanted. |
| 14 | **The numeric stepper for Playground `@CC` / `@CH`** (D-14 Q5) | Playground knobs stay closed option lists, because every knob being a five-bit index is what makes the stamp, the forecast and the sweep possible (the shape-character consequence: a free-typed literal has no index). Free-typed numerics live in the Sandbox alone. | Not owed. Recorded so nobody adds a stepper to a rack without re-deriving the codec. |
| 15 | **`Follow hardware selection`** (13-16, deliberately absent) | ZONA has one touch element (element 0; the system element is 255): the module never reports "the user touched element 3" because there is no element 3, so §8's optional control could never change anything. Said in `editor.ts` section 3 and both inspector headers. | Not owed. |
| 16 | **The MIDI monitor on preset entries** (D-14 Q4b) | The monitor reads the Lua host's log; the vendored simulator has no log, so a monitor on a preset card is a vendored divergence (a manifest row and a `pad-sim.ts` edit) for a v1 nicety. `midiLogOf` also reads `LuaPadSim.host` through a TypeScript-private field until `lua-pad-sim.ts` gains `get midi()` (13-10 deviation 6). | Not owed in v1. The getter is one line beside `get errors()` and 12.1's next owner of `lua-pad-sim.ts` was named for it. |
| 17 | **A whole-library export** (13-13 fork D) | D-22 D: export carries no membership and an import lands unfiled; a whole-library export was not raised at the fork and no SUMMARY asked for it. | Not owed. |
| 18 | **About ninety prose lines still read `EUCLID`, `RADAR POINTS` and the other uppercase names** (13-19 Q5) | Comments, test titles, `docs/TESTING.md`'s history, `install.e2e.ts`'s `LUMEN` identifier; no rendered effect; left as the record it is. | A mechanical pass if the user wants the tree's prose re-cased; nothing gates it. |
| 19 | **The e2e harness** (13-05 Q6; 13-07 deviation 9; every plan since; `D-11-08.1-b`) | wrangler 4.128.0 dies mid-run under load with an empty `ProxyController` error (its log says "consider upgrading to 4.131.0"); one death at this gate (run 2's chunk 2, a libuv assertion at start-up) against two, two and four at 12.1-09, 13-17 and 13-18; `scripts/` has no chunk runner (the one used lives in the scratchpad); `playwright.config.ts` still spawns the server. | A quick task: pin wrangler at a version that survives, or make `webServer` attach to a server started outside (`reuseExistingServer`), and put the chunk runner under `scripts/` with its log discipline. Not a Phase 13 file. |
| 20 | **`check-counts.mjs` has no direction and misreports a red run** (12-04, 12-12, 12.1-09) | Unchanged; 13-01 proved it correct for a negative delta and named the two real exposures (the file count, the todo). | A `--direction` flag or a stated previous total; a summary parser that reads `N failed \| M passed`. A quick task. |
| 21 | **`install.e2e.ts:1977`'s 50 ms margin on the phone engine** (this gate) | The CLEAR title scripts `delayAckMs: 200` for CONFIG under `executeMs` 250 so CLEARING… is visible; under load on webkit-phone the acknowledgement crosses 250 and the store's bounded retry (SAFE-09) puts one more frame on the fake, read as "6 for 5". Red five times at this gate before green, and in 13-17, 13-18 and 13-19's runs. | Lower the scripted delay (150 ms) or raise the title's tolerance to "at least 5, at most 5 + attempts"; either is one line in the title, neither touches the store. A quick task. |
| 22 | **The fidelity probe on `/dev/fidelity/`** (12.1-09's Rule 1 fix, carried) | It compiles BOTOR's own DIAL state through HANGAR's shelf and reports `shelf: vendored` because every HANGAR preset declares a divergence since 12.1-08b; it proves the WASM build in a browser, not that a HANGAR preset matches the fixture. | Not owed; recorded so nobody reads it as the divergence gate. `preset-baseline.spec.ts` is that gate, in node. |
| 23 | **`docs/SESSION-RUNBOOK.md:14`'s suite counts** (12-03, 12-12, 12.1-09) | Still Phase 6's 724 / 13 / 77; the file is under the append-only band and states no fetch count. | A dated line, whoever next appends to it. |
| 24 | **`DeviceNote.svelte` has no consumer since 13-09** (13-11 named it) | The coverflow mounted it; `DeviceDetails.svelte` mentions it in a comment; `device-ui.spec.ts` and `instrument.spec.ts` still read it. | Delete it with its assertions, or mount it; a quick task. Deleting it moves `svelte-check`'s count and no test count. |
| 25 | **`session.plugged` has no reader** (13-04 Q4; 13-11 did not take it) | A counter of physical plug events kept for the device UI; nothing renders it. | Delete or render; a quick task. |
| 26 | **`TryOnDevice.svelte:499` `color: #000000` where `--color-on-action` exists** (13-03 flagged; 13-11 owned) | The action fill's label is hard-coded black; the token is `#19200d`. `identity.spec.ts`'s census permits `#000000` today. | One line; then decide whether the census should stop permitting it. A quick task. |
| 27 | **`TagChip.svelte`'s `<label>` around a hidden checkbox carries a divider border** (13-03 test 5's one named hole; 13-08 re-skinned the chip) | Outside the boundary scan's control list; the chip is a `<label>` at `:73` with the checkbox inside. | Either a control-list entry in `identity.spec.ts` test 5 or a `--color-boundary` on the label; one line either way. |
| 28 | **The two coarse Knob placements** (13-15 Q2) | A 3 × 3 Knob whose ring includes column 9 or rows 8-9 (one-based) sits inside or on the dead zone on that side under the measured map (6 and 11 raw units against 14 elsewhere); the model admits them and row L asks the finger. | After row L: refuse with a line of their own, or leave to the meter. |
| 29 | **The runbook's checklist intro still says "Seven rows"** (13-02 named it for 13-20) | A one-word edit of an existing line is the reflow the append-only rule forbids; three dated paragraphs after it say eleven, twelve, thirteen, and this gate appends the label map. | Nothing; the paragraphs are the correction. |
| 30 | **The runbook rows name Phase 10's labels** (`TRY ON DEVICE`, `KEEP ON DEVICE`, `PUT BACK`, `CLEAR`, `CONNECT ZONA`, `PLAYING NOW`, `KEPT`, `FACTORY DEFAULT`) | 13-18 rewrote the words under D-05 after rows A-K were written; rows L and M already use the new ones. | The dated label map this gate appends to `docs/INSTALL-RUNBOOK.md`. Done at 13-20. |
| 31 | **The audition table's cost cells and the runbook's rows are gated by nothing** (12-12, 12.1-09) | Unchanged; `audition.spec.ts` pins the row count and the ids, not the costs; `INSTALL-RUNBOOK.md` has no spec. | 12-12's closing shape - `audition.spec.ts` reading `renderLua` - is still not built. |
| 32 | **The Sandbox's `svelte-check` provenance is three files short of the stated terms** (this gate) | The plans' stated check terms plus 12.1's +2 and 12-10's +1 reach 654; the tree reads 657; 13-11 observed 612 where 609 + 2 was expected and named no file. | Nothing; provenance is reported and never asserted. Named so the next gate does not chase it. |

## B. Recorded for the user - not for a plan

1. **Grifter's PERSONAL USE licence** (D-04; 10-14's Open item 2; every gate since). Grifter's
   OpenType name table declares PERSONAL USE. It carries every headline and every small uppercase
   label on the site (`--font-display`, `src/lib/ui/font-assets.spec.ts`). **It blocks a public
   site.** The swap is the one token in `src/app.css`'s `@theme` (`--font-display`) plus the
   `@font-face` block that loads the file - two lines in one file, and `font-assets.spec.ts` will
   name the face it finds. Nothing else in the tree knows the face by name.
2. **12-06's `trail` branch would have re-derived a front-door ring that 13-07 deleted** - 13-07
   read `12-06-SUMMARY.md` before its first edit and the answer was **as-is**: JOYSTICK unchanged,
   no ring re-derived, `front-door.ts` and `front-door.spec.ts` untouched by 12-06. **Nothing was
   spent and nothing was deleted twice**; named because the plan asked for it to be named either
   way.
3. **The look of every screen against the PDF's five pages has not been judged by anyone's eye
   but an agent's**; every claim about the look is a computed style, a screenshot in a scratchpad
   or a source scan. The bench's look rows (13-20's checkpoint) are where it is judged.
4. **The two Rule-1 findings the phase made in shipped code**, for the record: 13-09 found the
   shell bridge (`shell.svelte.ts`, 13-05) had never been reactive - no rail, no inspector, no
   connection control had rendered on a served build since 13-05, and every earlier e2e title
   stayed green because none asserted a slot on a served page; fixed in one module. 13-15 found
   13-14's Sandbox Timer was never armed (`gtt(0,100)` missing), so on a module the sweep would
   never have run and a lost lift would have hung its note; fixed with ten characters. Both are
   the kind of thing a served-build probe or a VM run finds and a source scan does not.
5. **The install column's duplicate `Apply to ZONA`** is what the user will see on every workspace
   until item A.2 lands: the bar's and the column's, both live, both the same write.
6. **Page numbering shows 1 to 4** (I.3.1, D-23) where the module reports 0 to 3; the wire is
   untouched. The runbook's row I asks the user to write down what the select shows.

## C. Retired, closed or moot - pointed at, never edited

- **The two-slot ceiling of three kinds** (13-02's estimate from an unrun sketch): measured at 13-15
  as **two** kinds; moot under the three slots the user bought (D-18), and the re-ask did not fire
  because three slots carry every kind together, which is what they were supposed to buy. 13-02's
  `SLOT-ARITHMETIC.md` is superseded by `runtime.spec.ts` 7 and says so.
- **The research's every cost figure** (1,067 / 1,166 / 861 / 366 / 811 / 697), D-08's 150-200 and
  the research's "PadSpinner deletable": named in `docs/TESTING.md`'s Phase 13 section; none is
  carried.
- **13-14's 922-over finding** (the dearest sixteen 14 over): closed at 13-15 (882 / 897) by the
  per-kind geometry, not by aiming at it; `emit.spec.ts` 1 pins the closure.
- **13-05's inspector floor** (380 does not hold the 402px grid): decided by the user as **reflow**
  (D-21) and built by 13-09 with the breakpoint in `layout.ts`; the floor stands.
- **The address** (`/c/<id>/`): **move-clean** (D-20), executed by 13-08; the thirteen previously
  dead links and every `/c/` and `/browse/` address are the same kind and are counted once in
  `docs/TESTING.md`.
- **The hero as ARC** (the PDF's caption): AURORA, because ARC is a Lua entry excluded from the row
  and would fetch the 271 KB VM on first paint (13-07); the caption reads `AURORA / SHOW`. Filed as
  a user question by 13-07 and never answered; recorded here as the shipped state and in D below.
- **The workspace route's duplicate `type Landing`** (13-13 deferred): fixed at 13-12 (its deviation
  9). Closed.
- **`Coverflow.svelte:520`'s `mapAxis` site** named by 12.1-05 and 12.1-08: the file is gone since
  13-09; the call is the route's `ledPoint()`. Both 12.1 plans found it there. Closed.
- **`ExportFile` gaining `rack`** (13-13, Rule 2) and **`saveCopy` answering "kept" on an existing
  id** (13-06's note for 13-13): shipped; closed.
- **13-12's `PAGEDISCARD`**: source-verified, wire-unproven, shipped as a probe-only action on
  `/dev/install/` until row I says what a module does with it; no visitor-facing control (13-12 Q7
  open on where one would go).
- **The honesty caps** (`HONESTY_CAP` 86 and the rest) and **the measured tune caps**: retired by
  name in the two module headers (13-18, 13-19); the invariants that survived them are asserted
  there.
- **The FEELS filter row** (D-11), **MIX TWO** (D-12), **the CRT, the halftone, the lattice, the
  Splash, the glyph field, the coverflow and the SCREEN switch** (D-09): deleted by name with their
  tests named in each plan and again in `docs/TESTING.md`'s Phase 13 section.

## D. Open for the user - decisions, not gaps, each with its numbers

Every question a Phase 13 SUMMARY or the gate notes filed that D-23 did not answer, with the plan
that filed it. The batch answered forty-three (section J of `13-18-BATCH.md`) and those are not
repeated; these are the ones that reached no batch, or arrived after it.

1. **13-04 Q1 / D-14**: the disabled motion control's words when the OS already asks for less
   motion - a third state-specific string, or the rule stated once (shipped: once). Not in the
   batch by name.
2. **13-04 Q2**: the pad's dot field - kept at 13-07 (the unlit-cell mark, `aesthetic.spec.ts`
   scan 8); the PDF's matrix draws plain dark cells. Drop the dots and keep the wash, or keep?
3. **13-04 Q3**: the hero's 40px frame bloom (`--action-bloom`) under §3 - a reading of "the
   light output's glow", kept at 13-07. Keep or cut?
4. **13-05 Q3 / Q4**: `Device actions` filled at 13-11; `Help & shortcuts` closed by default with
   the motion control under it (shipped) or open?
5. **13-05 Q5**: the lower bands' controls - the rail's collapse at 768-1023 and the drawer and
   bottom sheet below 768 - have labels 13-18's batch wrote (section B); recorded as answered by
   D-23 if those rows were in it, else open.
6. **13-06 Q1**: the favorites drop count has a number (`data-dropped`) and no sentence. Shown or
   not?
7. **13-06 Q2**: recent keeps twelve and shows six; if the rail should show the kept count,
   `RECENT_SHOWN` is one number.
8. **13-06 Q3**: the motion key's stored shape is the bare word; a JSON body would be a `.v2`.
9. **13-06 Q4**: starring writes the pruned list; keep dropped ids until the visitor is told?
10. **13-07**: the hero is AURORA, not the PDF's ARC, and the caption follows (`AURORA / SHOW`
    against `ARC / MODULATION`); `Quick guide` points at the page's own strip; `Import config`
    points at My configs; on a phone the surface stacks below the words - should it come first?;
    the headline renders at the declared 60px where the research measured 62-66.
11. **13-08 Q9**: should `Favorites` and `Recently used` be destinations rather than filters on the
    gallery rail (13-13's page 4 lists them under YOUR LIBRARY too)? J.23 (owed) keeps both.
12. **13-09**: the workspace's rail lists the return set (§6's preserved context; shipped) or
    always the membership? A visitor who filtered to one entry sees a rail of one plus this entry.
13. **13-10 Q2**: Pause freezes the monitor's view and Resume does not replay (shipped); buffer
    while paused is the other reading of §10.
14. **13-10 Q3**: the monitor's timestamp is elapsed since open, not the sim clock.
15. **13-10 Q4**: a MIDI knob's lock button renders though holding it changes nothing under the
    scope rule; hidden would be tidier.
16. **13-11 Q2**: the header's control in S0a / S0b is present and enabled with the reason behind
    one click, not disabled (the plan asked for disabled; `session.e2e.ts:1292` clicks it).
17. **13-11 Q3**: the header's box is 44px against the PDF's 37 (the floor on every control);
    accept, or an inner 37px box?
18. **13-11 Q5**: two openers, one panel - the header's click scrolls the footer panel into view
    rather than opening under the header.
19. **13-11 Q6**: the status dot's three tones by device state against the PDF's one grey dot.
20. **13-12 Q2**: `unverified`'s third way out is the visitor's own `Keep this page` or a new
    request; or clear the line on the module's next report of ANY page?
21. **13-12 Q3**: §9's skip clause ("safe and clearly configured") is declined; D-19 says the review
    can be struck in one word. Strike, keep, or a setting later?
22. **13-12 Q4 / Q5**: the review is not modal and does not trap focus (the tree's rule for every
    confirmation), and it opens inside the context bar so the surface moves down while open.
    Accept, or a real dialog / a popover for the one control that moves hardware?
23. **13-12 Q7**: if row I confirms `PAGEDISCARD`, where its control goes - under Device actions
    beside Reset (§9's D03 row), or beside Put back.
24. **13-13 Q2**: preset-backed thumbnails at the base state. **Q4**: a restored Playground import
    opening at once. **Q6**: Open and Resume through the stamp. **Q7**: `Type` as a third sort.
    **Q8**: rename committing on blur. **Q9**: a record's undo restoring its memberships. **Q11**:
    one undo slot for records and collections. **Q12**: `Add to collection` as a native select.
25. **13-14 Q1**: the adjacency warning states the fact and stops; add "Leave a cell between
    them."? **Q2**: `schema: 1` on the record only, or also on the `Surface`. **Q3**: a region's
    cells rest at phase 48 in the region's colour (twelve characters a Setup) - wanted, and is 48
    right? **Q4**: closed by 13-15 (the sixteen fit at 882).
26. **13-15 Q1**: the Knob's refusal line carries the why ("Its centre can't read a turn, so the
    finger needs a ring of cells around it.") where the other refusals carry the way; keep or cut?
    **Q2**: the two coarse placements (A.28). **Q3**: the knob's start value is 0 and the remainder
    is the knob's across gestures; a `Starts at` field and a reset of the remainder on every press
    (+12) are each one decision. **Q4**: one step of 8 degrees for every knob (45 a turn, 2.84
    turns), or per-size steps (a 5 × 5 clears the dead zone at 4 degrees; about twenty characters
    and one column).
27. **13-16 Q1**: the area-first kind - a Fader or a Button by the box, or a chooser at the region.
    **Q3**: the two mode lines, or one word each. **Q4**: a recolour coalescing until the next edit
    rather than per popover. **Q5**: the surface's rename outside the history. **Q6**: the first
    draft write waiting for the first edit.
28. **13-17 Q2**: "the utility script" as the slot's word. **Q3**: `Store on ZONA` and `Put back` in
    the Sandbox's destination zone or under Device actions. **Q4**: the over line naming the last
    element. **Q5**: a saved copy opening onto a fresh surface.
29. **13-19 Q1**: `SURPRISE_ALL_HELD`'s second sentence ("MIDI settings are never randomized.") -
    true on every entry, informative only on the MIDI-bearing ones; the first sentence alone is one
    string. **Q2**: "setting" against §7's "parameter". **Q3**: the no-clipboard field's name
    `Snapshot link` against Phase 5's `Shareable link`. **Q4**: the lock button's fixed 52px
    (Inter 600 at 13px sets `Locked` at about 47px; 56 if it clips).
30. **13-02 / I.3.12**: which raw message the browser gives when a second HANGAR tab holds the
    port - the words are landed (this gate), the classifier's branch waits for the bench.
31. **12.1's carried question in the gate notes**: GHOST is the one demo-driven card still on
    `x*9//128` for its demo path (re-fit on Q or keep as the uncalibrated example - no Band 2 plan
    named it); D-16 presets (asked at 12.1, unanswered); D-04 KEEP once (row J).
32. **The gate's own**: whether the runbook's rows A-K should be re-written under the new labels
    in a fresh document rather than read through the label map appended at this gate.

## E. Every item the nineteen SUMMARYs and the gate notes recorded, with its state at the gate; and Phase 12's file walked

### Phase 13's items

| Item                                                                                                     | From        | State at the gate                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-15's three glosses off by one row                                                                      | 13-01       | **RECORDED** in `radius-allowlist.ts`'s header; the pairs were right and moved at 13-09 with D-15 amended                                                                                              |
| 13-VALIDATION's "layer B skipped with a named reason"                                                    | 13-01       | **OVERRIDDEN** by 13-01's stricter rule (red unless a flag; a flagged skip is a real skip the count gate refuses)                                                                                     |
| The favicon in the retired accent with rounded corners                                                   | 13-03, notes | **CLOSED at this gate** (J.1): square, `#101210` / `#dcff71`, `identity.spec.ts` 11 re-pinned with no `rx` / `ry`                                                                                    |
| `TagChip.svelte:136`'s label border; `TryOnDevice.svelte:480`'s `#000000`; the retired tint literals   | 13-03       | Tint literals **gone** (only spec fixtures name `214, 255, 78`); the label border and the black label **OPEN**, A.27 and A.26                                                                        |
| `--color-error-surface` unused until 13-10                                                               | 13-03       | **CLOSED at 13-10** (the meters' error ink and surface)                                                                                                                                                |
| The shell link's accessible name once HANGAR sits beside FOR ZONA                                        | 13-03, 13-05 | **ANSWERED by the batch** (section B) under D-23                                                                                                                                                      |
| The runbook's intro "seven rows"                                                                         | 13-02       | **RECORDED**, A.29                                                                                                                                                                                     |
| Row H conditional on 13-15 and 13-17, not on the checkpoint                                              | 13-02       | **BOTH LANDED**; row H is a bench row today, handed over after I, L and M                                                                                                                             |
| The dot field; the hero bloom; `session.plugged`; the disabled motion control's third string             | 13-04       | Dots **KEPT** (13-07, D.2); bloom **KEPT** (D.3); `plugged` **OPEN** (A.25); the string **OPEN** (D.1)                                                                                                 |
| The inspector floor 380 against the 402px grid                                                           | 13-05       | **DECIDED reflow** (D-21), built at 13-09; the floor stands                                                                                                                                            |
| `Device actions` absent until filled; `Help & shortcuts` closed; the lower bands' labels                 | 13-05       | Filled at 13-11; closed by default (D.4); labels from the batch                                                                                                                                       |
| The harness: should `webServer` attach rather than spawn                                                 | 13-05       | **OPEN**, A.19                                                                                                                                                                                         |
| STATE's metrics table has no P04 row                                                                     | 13-05       | **STILL TRUE** (P04, P16, P17, P18 absent; P12 present) - STATE is a record, not a gate                                                                                                                |
| Ten tests not seven; `readJson` requires a validator; four store questions                               | 13-06       | Ten **OBSERVED** (the projection's +7 named wrong); validator **SHIPPED**; questions **OPEN**, D.6-D.9                                                                                                 |
| The hero as AURORA; `Quick guide`; `Import config`; the phone stack; the headline at 60px               | 13-07       | **OPEN**, D.10                                                                                                                                                                                         |
| 12-06's answer as-is; nothing deleted twice                                                              | 13-07       | **CONFIRMED** at the gate, B.2                                                                                                                                                                         |
| `vite.config.ts` ignoring 404s at the three unrouted paths                                               | 13-07       | **CLOSED**: 13-08 (`/playground`), 13-13 (`/my-configs`), 13-16 (`/sandbox`) each removed its own                                                                                                     |
| The allowlist's plan defect: `radius.spec.ts` named as the file that clears rows                         | 13-08..13-13 | **RECORDED** five times; the rows are `radius-allowlist.ts`'s; the list is empty                                                                                                                      |
| `browse.e2e.ts` is twelve titles, not eleven                                                             | 13-08       | **OBSERVED** at the gate (12)                                                                                                                                                                          |
| Favorites / Recently used as destinations vs filters                                                     | 13-08       | **OPEN**, D.11; J.23 owed                                                                                                                                                                              |
| The shell bridge never reactive (Rule 1)                                                                 | 13-09       | **FIXED at 13-09**; every served-build title since is its proof                                                                                                                                       |
| `DeviceSlot` provisional in the connection slot                                                          | 13-09       | **REPLACED at 13-11**                                                                                                                                                                                  |
| The install column shown until 13-11 / 13-12                                                             | 13-09, 13-11 | **STILL SHOWN**, J.13 owed (A.2)                                                                                                                                                                       |
| `PadSpinner` has three consumers (research defect)                                                       | 13-09       | **KEPT**; named in `docs/TESTING.md`                                                                                                                                                                   |
| Term −11 (13-09)                                                                                         | 13-09       | **−9 by its parts**; named by 12.1-09 and this gate; the sentence left standing                                                                                                                       |
| `Coverflow.svelte:520` gone; 12.1's `mapAxis` site is `ledPoint()`                                       | 13-09       | **CLOSED** (12.1-05, 12.1-08 found it there)                                                                                                                                                           |
| `SURPRISE_ALL_HELD`'s wording                                                                            | 13-10, 13-19 | Rewritten at 13-19 with both facts; the second sentence **OPEN**, D.29                                                                                                                                 |
| Pause semantics; the timestamp; the MIDI knob's lock                                                     | 13-10       | **OPEN**, D.13-D.15                                                                                                                                                                                    |
| `midiLogOf` reading a private field                                                                      | 13-10       | **OPEN**, A.16                                                                                                                                                                                         |
| TUNE-07's `SURPRISE ME` wording named for 13-20                                                          | 13-10, 13-19 | **AMENDED** at this gate                                                                                                                                                                               |
| Reset under Device actions; a `Store on ZONA` action; modal dialogs                                      | 13-11       | Reset **OWED** (A.3, I.6.5); Store **SHIPPED** for the Sandbox at 13-17 and open for the workspace (D.28); dialogs **NOT BUILT** by the tree's rule (D.22)                                             |
| S0a / S0b as an enabled summary; 44 vs 37; two openers; the dot's tones                                  | 13-11       | **OPEN**, D.16-D.19                                                                                                                                                                                    |
| `DeviceNote.svelte` with no consumer                                                                     | 13-11       | **OPEN**, A.24                                                                                                                                                                                         |
| 12.1 Band 1's GHOST question; D-16 presets; D-04 KEEP once                                               | notes       | **OPEN**, D.31 (12.1's, carried here so it is not lost)                                                                                                                                                |
| No route writes a Playground draft; twelve questions; the duplicate `type Landing`; `ExportFile.rack`   | 13-13       | Draft **OWED** (A.1, J.19); questions **OPEN** (D.24) or answered by the batch; `Landing` **FIXED at 13-12**; `rack` **SHIPPED**                                                                        |
| Runbook row I; the snapshot key staying v2 (12.1-07 took v3, 13-17 v4); `pageActive()` FETCH not shipped; page numbering 0-3 | 13-12 | Row I **HANDED OVER**; keys **v4**; FETCH **NOT SHIPPED** (the firmware has no case); numbering **1 to 4** (I.3.1, D-23)                                                                     |
| `unverified`'s third way; the review not modal; Apply duplicating TRY for one wave; the discard's control | 13-12     | **OPEN**, D.20-D.23; the duplicate **OWED** (A.2)                                                                                                                                                      |
| 13-15's plan computing the cell as `y*9//128`; the hand-off's `N(x,y)`                                   | 13-14       | **TAKEN** at 13-15 (`M[N(x,y)]`)                                                                                                                                                                       |
| The dearest sixteen at 922 (14 over)                                                                     | 13-14       | **CLOSED at 13-15** (882 / 897)                                                                                                                                                                        |
| The adjacency instruction; `schema: 1` on Surface; the resting phase; colour packing                     | 13-14       | **OPEN**, D.25 (packing moot at 882)                                                                                                                                                                   |
| 13-14's Timer never armed (Rule 2)                                                                       | 13-15       | **FIXED at 13-15** (`gtt(0,100)`)                                                                                                                                                                      |
| The re-ask did not fire; rotary 298; dead zone 10.13 raw; min Knob 3 × 3; row L                          | 13-15       | **RECORDED**; row L **HANDED OVER**                                                                                                                                                                    |
| The refusal line's why; the coarse placements; start value; per-size steps                               | 13-15       | **OPEN**, D.26                                                                                                                                                                                         |
| `SLOTS=2` in the route and the preview's refusal of 3                                                    | 13-16       | **FLIPPED at 13-17**                                                                                                                                                                                   |
| The draft wiring can serve the Playground; unwired                                                       | 13-16       | **OWED**, A.1                                                                                                                                                                                          |
| The sandbox thumbnail can light via `preview.ts`; not wired                                              | 13-16, 13-17 | **OWED**, A.9 (J.25)                                                                                                                                                                                   |
| `[draftId]` prerender false, 404 fallback                                                                | 13-16       | **SHIPPED**, by design                                                                                                                                                                                 |
| Six questions                                                                                            | 13-16       | **OPEN**, D.27 (Q2 the over line answered by G.34 as "keep the text")                                                                                                                                  |
| A catalog TRY writing page-next into 255/4 (Q1); the utility script's word; Store / Put back placement; the over line's element; a copy onto a fresh surface | 13-17 | Q1 **ANSWERED by J.40, OWED** (A.11); the rest **OPEN**, D.28                                                                                                                             |
| `install-copy.ts` at five; `SNAPSHOTTING_BODY` / `identifiedBody` at three                               | 13-17       | **CLOSED at 13-18** (five everywhere)                                                                                                                                                                  |
| The nineteen hand-off rows                                                                               | 13-18, 13-19 | Fourteen **LANDED at this gate** (I.8.1-7 as seven, I.3.12, F.4, G.31, G.36, H.20, H.21, J.1); ten **OWED** (J.13, I.6.5, E.14, E.15, J.10, J.19, J.23, J.25, J.30, J.40 - A.1-A.11); G.34 **DECIDED keep** (A.6) |
| The three requirement rows named for the gate                                                            | 13-19       | **AMENDED** at this gate (TUNE-07, SHARE-02, TUNE-06)                                                                                                                                                  |
| Five questions                                                                                           | 13-19       | **OPEN**, D.29; Q5 (the prose) **RECORDED**, A.18                                                                                                                                                      |
| The harness transients: the WebKit tail's `Could not connect`, wrangler's deaths, `session.e2e.ts:851` / `:1009`, `install.e2e.ts:1977`, `browse:1404` | 13-03..13-19, notes | **RECORDED** with every run in `docs/TESTING.md`'s Phase 13 section; the margin **NAMED** (A.21); the harness **OWED** (A.19)                                                    |
| `docs/TESTING.md` still listing old counts                                                               | 13-03, 13-04, notes | **CLOSED at this gate**: the Phase 13 section appended with "Corrections to earlier sections, by line"                                                                                       |

### Phase 12's file (`12-touch-framework/deferred-items.md`), walked

| Item                                                        | State after Phase 13                                                                                                                                                                          |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A.1 clock sync                                              | **OPEN**, untouched                                                                                                                                                                           |
| A.2 SNAKE                                                   | **OPEN**, untouched (585 / 880 at the corner, 28 free, unmoved)                                                                                                                              |
| A.3 `_coordMax` (`D-11-13-a`)                               | **OPEN**, untouched; the Sandbox's runtime reads both axes through `U` and never met it                                                                                                       |
| A.4 QUADRANT's hung note                                    | **OPEN**, untouched (838 / 70)                                                                                                                                                                |
| A.5 `?for=keys`                                             | **MADE IRRELEVANT in part** by J.10's retirement of `?feels=` (owed); `?for=` is untouched and the dropped-value behaviour stands                                                              |
| A.6 the decay gate blind to `D(`                            | **OPEN**; the Sandbox emits no decay (13-14 test 4)                                                                                                                                           |
| A.7 the dropped function `F`                                | **CONFIRMED gone** by the Sandbox: the finger light is `G` (13-15's correction of its plan)                                                                                                    |
| A.8 `tpad`'s 907 no longer swept                            | **OPEN**, untouched                                                                                                                                                                           |
| A.9 the audition cost table's gate                          | **OPEN**; every cell right at 12.1-09 and unmoved since (18 name literals re-cased in place at 13-19)                                                                                         |
| A.10 the separability licence                               | **OPEN**, untouched                                                                                                                                                                           |
| A.11 JOYSTICK's audition row                                | **OPEN** as declined; row 28 (12.1-08b) widened the scope for the presets under the gradient                                                                                                  |
| A.12 `check-counts.mjs`                                     | **OPEN**, A.20 above                                                                                                                                                                          |
| A.13 `SESSION-RUNBOOK.md:14`                                | **OPEN**, A.23 above                                                                                                                                                                          |
| A.14 the stale Trackpad prose in Phase 13's files           | **CLOSED BY DELETION AND REWRITE**: `PadFrame.svelte` and `CatalogCard.svelte` re-skinned (13-04, 13-08), `c/[id]/` gone (13-08), `browse.e2e.ts` re-aimed; `host.spec.ts:384` and `types.ts:86` unchecked here |
| B (the probe's findings)                                    | **RECORDED**, untouched; the Sandbox's dead zone derives from Probe A Q1's jitter (13-15)                                                                                                     |
| C (retired readings)                                        | **UNCHANGED**                                                                                                                                                                                 |
| D.1-D.11 (the user's decisions)                             | **OPEN**, none touched; D.8's thirteen dead links became "every `/c/` address" under D-20 (move-clean)                                                                                        |
| E's `D-11-08.1-b` (wrangler dying mid-run)                  | **OPEN and worse**: the death is reproducible in any run over about 85 s (13-07); one at this gate; A.19                                                                                     |
| E's `D-11-16-a` (`browse-webkit.e2e.ts:564`)                | Seen as `browse-webkit.e2e.ts:357` (`scrollIntoViewIfNeeded` at 30 s) at 12.1-09 and 13-19; green alone each time; **OPEN**                                                                    |
| E's `D-12-12-a` (`session.e2e.ts:701`)                      | **SEEN twice at this gate** as `session.e2e.ts:851` and `:1009` under load (a doubled identification, six reads for five), green alone; 13-12 made the unplug titles wait for `ready`; **OPEN** as a load transient, not a defect |
| Item 6.6 / 6.7 (Phase 13's Trackpad prose, `front-door.spec.ts`'s vendored `tpad` row) | 6.6 **CLOSED** as A.14 above; 6.7 **MOOT**: `front-door.spec.ts` is 5 tests and the "excluded because it is dark" test reads the fixture as before - not touched by any Phase 13 plan beyond 13-07's and 13-09's deletions |

### Phase 12.1's file (`12.1-gradient-touch/deferred-items.md`), where Phase 13 touched it

Not walked in full - it is 12.1's and 12.1-09 closed it - but three of its items are Phase 13's:
`SNAPSHOTTING_BODY` / `identifiedBody` for 13-18 (**CLOSED at 13-18**, five names);
`arc.ts:207-208`'s prose for 13-19 (**left as the record**, A.18); and the e2e-not-run rule
(**KEPT**: every Phase 13 plan that moved a string or a fixture ran the chunk that reads it).
