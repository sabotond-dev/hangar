# Phase 13.1 - deferred items

Opened 2026-09-12 by plan 13.1-01 (the third in the phase's serial order), walked and closed into the A-E form by the gate (13.1-08) on the same day, for what an executor
found outside its own plan's files and did not touch; every plan of the phase appends here, and
the gate (13.1-08) walks it with `13-gui-overhaul/deferred-items.md`. Shape: 12-12's sections, as
Phase 13's file uses them. Nothing here is a plan's deviation - a deviation is fixed in the plan
that met it and named in its SUMMARY; this file is for what was seen and left.

## A. Found, not touched, with what closes each

| #   | What                                                                                                                                                            | The numbers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Whose, and what closes it                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Every app page scrolls 71px: the frame's height is a calc on `FOOTER_H` (50) and the footer renders 121** (13.1-01, found while measuring the intro's fit) | `src/routes/+layout.svelte` `.frame { block-size: calc(100dvh - var(--header-h) - var(--context-h) - var(--footer-h)) }` with `--footer-h` 50 (`layout.ts` `FOOTER_H`, "about 50 tall" off the PDF). `Footer.svelte` is `min-block-size: var(--footer-h)` and its content is two 44px rows (the brand line and the GPLv3 licence row, section 6(d)) plus 12px padding either side and a hairline: **121px** at every desktop width. Measured 2026-09-12 in chromium at 1280 x 720 against the fresh build: `/playground/` document 791 / 720, `/sandbox/` 791 / 720 (the frame 535, the footer 121, 791 = 76 + 59 + 535 + 121); `/playground/aurora/` 930 / 720 (the install column below the frame adds the rest - J.13, 13.1-06's). Section 7's "the surface and the context bar's primary action stay put" holds only if the document does not scroll. | Not 13.1-01's: its file is `+layout.svelte` but its plan is the intro's centre, and the frame is every app page's. 13.1-01 sized the intro's centre by flex from the header and the footer AS THEY RENDER (a 100dvh column) rather than by the calc, and that shape - `.site` a 100dvh flex column, the shell `flex: 1 1 0`, the frame `flex: 1 1 0; min-block-size: 0` with its `block-size` calc dropped - would close this for the app pages in the same file with no new number. Alternatively `FOOTER_H` becomes the footer's real height (121) and `shell.spec.ts` 5's table moves with it. **For 13.1-08 to decide or to hand on**; the user's bench never named it. |
| 2   | **With no ZONA ever connected, the header's Clear reads `Needs a copy of what is on your ZONA first.` rather than `Needs your ZONA connected.`** (13.1-05, seen on every page once the control moved into the header) | `install.svelte.ts` `clearReason()`: `if (!capable) return "incapable"; if (this.snapshot === undefined) return "no-snapshot"; ... return "no-session"` - the snapshot is tested before the session, so a Chromium visitor at `idle` (Web Serial present, nothing connected) is told about the copy before being told to connect. Phase 10's precedence (10-UI-SPEC 10.5's table order), unchanged since; it rendered the same line at the foot of the install column, where few eyes fell. Now it is in the top right of every page. | Not 13.1-05's: `install.svelte.ts` is untouched by the phase's standing rule and the order is a store rule with a spec (`install.spec.ts`). One line to swap the two tests, one spec row to move, one register question (does a visitor with no ZONA need to hear about the snapshot at all?). **For 13.1-08's bench row, beside question 1 (the label).** |
| 3   | **At 768 to about 790 wide the header's Clear box and the connection control together are 9 to 23px wider than the row's reserved 218** (13.1-05, measured on the served build) | The row at 768: mark 71 (its minimum), nav 343 (its minimum), two 48px gaps, 20px padding each side, the zone exactly `CONNECTION_SLOT.inline` 218. The pair is 68 + 12 + 147 = 227 in chromium and 68 + 12 + 161 = 241 in webkit (`Not in this browser` is the control's widest S0a caption), so it overflows the zone leftward by 9 / 23px into the 48px gap before the nav until the row gains that much slack (about 776 / 790). Nothing collides and nothing scrolls sideways; the gap is what it eats. DeviceSlot's caption is nowrap since 13.1-05, so WebKit no longer folds it instead. | Not 13.1-05's to close without a number the Bible does not give: 13-05's `CONNECTION_SLOT` is the PDF's 218 and the stacked band's row has no slack left. Either the zone's floor grows to the pair (a layout.ts number) or the nav's 40px item gap tightens at the stacked band. **For 13.1-08 to record; the user's bench is at a desktop width.** |
| 4   | **A.1, walked at the gate (13.1-08): NOT FIXED - recorded with the exact edit.** Re-measured on the served build at `d21249e` in chromium at 1280 x 720: `/` 720 / 720 (13.1-01's fit holds); `/playground/`, `/sandbox/?new`, `/my-configs/` **791 / 720**; `/playground/arc/` **1012 / 720**; the footer **121** on every page; the frame 535. | The fix is not one number in `layout.ts`: the footer's height is its content's (two 44px rows, 12px padding either side, a hairline, a 4px row gap), so `FOOTER_H = 121` would be a guess that it never wraps to three rows, and `layout.ts`'s own comment (13.1-01) says the constant is a minimum the footer renders past. | **The exact edit, in `src/routes/+layout.svelte` alone**, the shape 13.1-01 gave the intro: (1) `.site.intro { display: flex; flex-direction: column; block-size: 100dvh }` and `.site.intro .shell { flex: 1 1 0; min-block-size: 0 }` lose their `.intro` qualifier so the app variant is the same 100dvh column (`.site` stops being `display: contents` at the wide and compact bands); (2) `.frame`'s `block-size: calc(100dvh - var(--header-h) - var(--context-h) - var(--footer-h))` becomes `flex: 1 1 0` with the `min-block-size: 0` it already has - the grid keeps its columns; (3) in the stacked band (`max-width: 1023.98px`) `.site.intro { display: contents }` becomes `.site { display: contents }` and `.frame { block-size: auto }` stays. Consequences: `intro.spec.ts` 5 reads `.site.intro` by selector - two selector strings move to `.site`; `shell.spec.ts` 5's literal scan is unchanged (no number is added); `FOOTER_H` keeps its one reader (`Footer.svelte`'s `min-block-size`). Proof: one e2e title at 1280 x 720 asserting `document.scrollingElement.scrollHeight <= clientHeight` on `/playground/`, `/sandbox/?new` and `/my-configs/`; `sandbox.e2e.ts`'s drag title can then drop its 900-tall viewport. **The workspace's extra 221px** (`/playground/arc/` 1012 against 791) is a second thing: content below the frame's fixed 535, measured here and not diagnosed. A quick task. |
| 5   | **A lost write's failure block has no screen after an unplug** (13.1-07 deviation 5, the finding; the live-region title `install.e2e.ts:1855` asserts the block's ABSENCE by name) | `DestinationZone.svelte` renders the seven failure-shaped phases' blocks under `install-failure`, and the workspace hands the destination snippet to the shell only while `install.pageReported !== undefined` - so an unplug that ends a session takes the zone, and the lost block's detail and steps ("Plug the ZONA back in", "Apply to ZONA again", "Then click Clear if you want the firmware default back"), with it. The bar's device clause keeps the lost title; the header's Clear reads `Needs your ZONA connected.` | The user's question T (the runbook's fourth-bench section). If the block should survive: mount the zone (or the failure block alone) whenever `install.phase` is failure-shaped regardless of the session, in the workspace route's snippet condition and the Sandbox's - one condition each - and re-aim `:1855` to read the block. SAFE-09's amendment at this gate names the gap. |
| 6   | **`Knob.svelte:785` - the track rail's circle - mounts on no route** (13.1-07 deviation 4; `radius.e2e.ts`'s `UNREACHABLE_CIRCLES = ["knob:thumb"]`; this gate's probe: NOT MEASURED in either engine) | With the sixteen-value `channel` and the twelve-value `send` lists rendered by `MidiField.svelte`, no list in the tree has nine or more values (13.1-07 measured every entry and `knobs.preset.ts`), so the track rail - and D-15's sixth circle, declared 12 x 12 - is code no configuration reaches. Layer A still counts six; layer C measures five kinds (79 circles). | **Left declared at this gate**, deliberately: `Knob.svelte` is untouchable in this phase and D-15 names six by file and line. The user's question U. If retired: delete the track rail branch from `Knob.svelte`, amend D-15 to FIVE circles by name (13-CONTEXT), `radius-allowlist.ts`'s `CIRCLES` to five, `radius.spec.ts`'s count to five, `radius.e2e.ts`'s `UNREACHABLE_CIRCLES` to empty - one plan, one negative check (a planted seventh). |
| 7   | **The forecast machinery has no caller** (13.1-07 SUMMARY "What 13.1-08 finds"; TUNE-02's qualifier at this gate) | Since 13.1-07 `TuningRegion.svelte` hands no `forecast` to any rack; `Knob.svelte` and `KnobRack.svelte` keep their `forecast` / `onforecast` props, `model.ts` its `onforecast` option and the structural `Tuner` type its `forecast`, `tune/copy.ts` its `forecastDelta` / `forecastExpansion` pair (read by `Knob.svelte`; `copy.spec.ts` pins the pair for U+2212's one scope). | Qualified by the user's word, not retired: retiring is a `Knob.svelte` edit. **The exact edit**: drop `forecast` / `onforecast` from `Knob.svelte`'s props and its `.delta` rendering, from `KnobRack.svelte`'s pass-through, from `model.ts`'s options and the `Tuner` type; retire `forecastDelta` and `forecastExpansion` by name and dated in `tune/copy.ts`'s header (D-12's rule) and re-pin `copy.spec.ts`'s U+2212 scope to `meterExpansion`; `tune-ui.spec.ts`'s ghost / delta assertions go with them. Together with row 6 if the user retires the track rail - the same file. |
| 8   | **The browse hydration race** - `browse.e2e.ts:299`, `:343`, `:1404` (13-13, 13-20, 13.1-01, 13.1-07; this gate: five reds across two whole runs, three titles, every one green alone, two on the second solo attempt) | Each title gestures (sorts, fills the search, clicks a chip) the moment the prerendered cards are counted; under three workers the gesture lands before hydration and the grid never narrows (`toHaveCount` 5 for 26, 3 for 5). The browse code is untouched by the phase. | A `waitForFunction` on a hydration marker (the sort select's bound value, or a `data-hydrated` on the grid) before the first gesture in the three titles; a quick task. Not a store defect. |
| 9   | **The Phase 13 hand-over's rows 6, 7, 8 and 9** (the favicon, the wordmark, the six circles by eye, rows C and E again) | The fourth bench answered rows 1-4 (pass) and the look rows by naming what differs (the nine lines); these four were not answered and are not re-handed in the fourth-bench section. | They stand in the runbook's Phase 13 section as written; the user's, whenever. Row 9's `Put back` step no longer exists (D-07) - substitute `Clear` or the probe. |
| 10  | **`ColourPicker.svelte:66`'s header still says "opens this block in a `<dialog>`"** (13.1-04's hand-off to the gate) | Prose in the one file 13.1-04 could not edit; over code the tree has no `<dialog`, `showModal` or `colour-popover` (`tune-ui.spec.ts` asserts it on comment-stripped source; `e2e/` has none). | A one-line comment edit in `ColourPicker.svelte` - the untouchable file; its three circle lines would move by zero (one line replaced by one). Not done at the gate for the same reason as rows 6 and 7; the next plan that may touch the file. |
| 11  | **The runbook's rows A-M name `PUT BACK` steps that no longer exist** (rows C, F, I, H, M and the Recovery list) | 13-20's dated paragraph mapped the labels; this gate's dated paragraph says `PUT BACK` has no control and `CLEAR` is `Clear` in the header, and the fourth-bench section says a re-run substitutes `Clear` or the probe. The rows themselves are under the append-only rule. | Nothing to do beyond the dated paragraphs; whoever rewrites the runbook for a Phase 14 bench writes the rows against the tree. |

## B. Questions filed for the user, collected by plan

- **13.1-01**, three: the Explore arrow's colour (the PDF's is `--color-ink`; the tree keeps
  `--color-action`, the plan's word); the Explore box's hairline (the PDF draws `--color-divider`;
  kept; the plan wrote transparent); the 1440 x 900 intro (the headline 45px, the sub-lines and
  the card titles at their floors, the surface 396 - the PDF's page at 1440 presumes 1000 of
  height; the user's rule presumes none). Each is in `13.1-01-SUMMARY.md` with its numbers.
- **13.1-05**, three: the label (`Clear`, the user's word, or section 9's `Reset active device
  page` - 13.1-CONTEXT question 1); the gate (one click, A-45, or section 16's confirmation -
  I.6.5, declined; question 2); and the caption's precedence above (A.2). One more to note for the
  eye: the playground's search field also reads `Clear` (batch E.11, accessible name `Clear the
  search`) - two controls on one page with one visible word. Each is in `13.1-05-SUMMARY.md`.
- **13.1-02**, three: row 5 on hardware with the keyboard (ArrowDown on the focused closed select
  switches; the second press swallowed by the disabled select); `unverified`'s way back as the select
  (13.1-CONTEXT question 8); the probe's fourth button `Switch (one call)` as HANGAR's own label.
- **13.1-04**, three: the open `Close` toggle in the accent colour; the hairline above the inline
  block (`--color-boundary`); Escape on the toggle itself doing nothing.
- **13.1-03**, eight: the palette's amber and violet (question 4); the unselected tint (0.24 or the
  page's 0.14); the unselected boundary's strength; a teal region's name and readout in ink or the
  page's pale teal; the plate's hairline lattice or the page's raised cells; the fader's rest at
  0.62; the XY pad's dot at the centre; the footer over the plate at 720 (A.1).
- **13.1-06**, four: the way back after an Apply and the rewritten steps' wording (question 9); the
  failure block's place beneath the bar; the honesty line painted nowhere; `Page 2 put back` as the
  probe's clause.
- **13.1-07**, five: channel numbering on a Lua entry (question 5); `CC base` / `Send` as the label
  (question 6); the Sandbox's meters and room line (question 3); the zone after an unplug (A.5);
  the track rail's circle (A.6).
- **13.1-01**, two more beside its three: the strip's number beside the word rather than above it;
  very short desktops clipping rather than scrolling.
- **13.1-08 (the gate)**: none of its own; the twenty-three above are put to the user as questions
  A-W in `docs/INSTALL-RUNBOOK.md`'s fourth-bench section, each shipped as stated.

## C. Retired, closed or moot - pointed at, never edited

- **Batch row J.13 (the install column)**: LANDED by 13.1-06 (D-06) - the column deleted whole;
  `13-gui-overhaul/deferred-items.md` A.2 is closed by this phase.
- **Batch row I.6.5 (the reset's §16 confirmation)**: DECLINED by 13.1-05 under D-04 (one click, the
  user's word "a button"); `13-gui-overhaul/deferred-items.md` A.3 is closed as declined, and the
  user's question G asks once more whether a confirmation is wanted.
- **Batch rows J.18, J.20, J.21 (the review)**: reversed / moot under D-05 (13.1-02).
- **Batch rows I.3.2-I.3.5, I.5.8, I.5.10 (Put back's words)**: retired under D-07 (13.1-06), every
  replacement ledgered in `13.1-COPY-NEW.md`.
- **13-CONTEXT D-06 clause 2 and D-19's flag**: struck by D-05 (the user said otherwise).
- **13-CONTEXT D-14 Q5 (no free-typed numerics in the Playground)**: overridden by D-09 for `cc`
  and `channel` only; `13-gui-overhaul/deferred-items.md` A.14 (the numeric stepper) is answered in
  part - two fields, not a stepper, and only those two.
- **`13-gui-overhaul/deferred-items.md` A.26 (`TryOnDevice.svelte:499`'s `#000000`)**: moot -
  the file is deleted (13.1-06); the zone's Apply reads `--color-on-action`.
- **`13-gui-overhaul/deferred-items.md` A.29 and A.30 (the runbook's "Seven rows" and Phase 10's
  labels)**: unchanged; this gate's dated paragraph re-maps the labels once more (`Clear`; no
  `PUT BACK`).
- **The Phase 13 hand-over's rows 1-4**: ANSWERED - pass - and recorded (the first hardware-verified
  rows of Phases 12, 12.1 and 13).
- **13.1-VALIDATION's first-draft terms** (05 +1, 06 −4, check 652): corrected at the plan-check and
  named at this gate; not a live item.

## D. Open for the user - decisions, not gaps, each with its numbers

The ten from `13.1-CONTEXT.md` and the thirteen the seven SUMMARYs filed, as one list of
twenty-three in `docs/INSTALL-RUNBOOK.md` ("The open questions you can answer by looking", A-W).
By source:

| # | Question | Shipped as | Filed by |
| --- | --- | --- | --- |
| 1 | `Clear`'s label: `Clear` or `Reset active device page` | `Clear` (the user's word) | CONTEXT 1; 13.1-05 |
| 2 | `Clear`'s gate: one click or §16's confirmation | one click (A-45; I.6.5 declined) | CONTEXT 2; 13.1-05 |
| 3 | The Sandbox's room line and two meters | kept | CONTEXT 3; 13.1-07 |
| 4 | The palette's third and fourth colours | amber `15,10,3`, violet `10,7,15` proposed | CONTEXT 4; 13.1-03 |
| 5 | Channel numbering on a Lua entry | the firmware's `0`-`15` with `LUA_CHANNEL_CUE` | CONTEXT 5; 13.1-07 |
| 6 | The MIDI field's label on `ccBase` / `send` | the knob's own word | CONTEXT 6; 13.1-07 |
| 7 | The intro on a phone | may scroll; D.10's surface-first stack open | CONTEXT 7; 13.1-01 |
| 8 | `unverified`'s way back | the select itself; no button | CONTEXT 8; 13.1-02 |
| 9 | The way back after an Apply | `Clear` or Grid Editor; "Or click Clear to return Page N to its firmware default" | CONTEXT 9; 13.1-06 |
| 10 | The Explore fill | `--color-panel` (`#191c18`, measured to the byte - CONTEXT's "raised" was the planner's guess) | CONTEXT 10; 13.1-01 |
| 11 | The Explore arrow's colour | `--color-action`; the PDF's is `--color-ink` | 13.1-01 |
| 12 | The Explore box's hairline | `--color-divider` (the PDF draws it) | 13.1-01 |
| 13 | The intro at 1440 x 900; the strip's number beside the word; very short desktops | the floors 34 / 15 / 18; above; clipped | 13.1-01 |
| 14 | The arrow key on the closed select | a switch per press until the select disables | 13.1-02 |
| 15 | The probe's `Switch (one call)` label | HANGAR's own, not ledgered | 13.1-02 |
| 16 | The open `Close` toggle in lime; the hairline above the block; Escape on the toggle | lime; `--color-boundary`; nothing | 13.1-04 |
| 17 | The unselected tint; the unselected boundary; a teal region's ink; the plate's cells; the fader's rest; the XY dot | 0.24; full; ink; lattice; 0.62; centre | 13.1-03 |
| 18 | `Clear`'s caption precedence with no ZONA | the copy before the connection (A.2) | 13.1-05 |
| 19 | `Clear`'s caption at the compact band; two `Clear`s on the playground page; `Clear` on the intro | description alone below 480px of zone; yes; yes | 13.1-05 |
| 20 | The failure block's place; the honesty line painted nowhere; `Page 2 put back` | beneath the bar's right zone; the description alone; the probe's | 13.1-06 |
| 21 | The zone after an unplug (A.5) | leaves with the session | 13.1-07 |
| 22 | The track rail's circle (A.6) | declared, mounted nowhere | 13.1-07 |
| 23 | PROJECT.md:114's "always recoverable" - a Safety constraint falsified by D-07 | named at SAFE-03 and IDENT-01; not edited by an agent | 13.1-08 |

## E. Every item the seven SUMMARYs filed, with its state at the gate; and the Phase 13 file walked

**13.1-02**: deviations 1-3 (the comment naming the page-change class; the unused import; the W-04
case the tree can produce) - fixed in its commits; the chunk script name - moot (this gate made the
`-1308` copy); two server deaths - not reproduced at this gate (fifteen chunk runs, none died).
**13.1-04**: deviation 1 (`--color-boundary` not `--color-divider`) - fixed; `ColourPicker.svelte:66`'s
prose - A.10; `radius.e2e.ts:354`'s wait - closed there.
**13.1-01**: deviations 1-3 (the flex centre; the PDF's hairline; the 460 floor) - fixed; the app
frame's 71px - A.1, re-measured and recorded with the exact edit at this gate; five questions - D.
**13.1-03**: deviations 1-6 (the same-box guard; the palette on a refused placement; the refusal held
raw; the marks at the page's numbers; the 900-tall viewport; the rx / ry assertion in the spec) -
fixed; eight questions - D; the raw `grep border-radius` the plan asked for - moot (prose hits since
13-16; the spec is the assertion).
**13.1-05**: deviations 1-5 (ConnectionControl's host; DeviceSlot's nowrap; instrument's QUIET row;
12px not 11; the container query and the label span) - fixed; A.2 and A.3 - recorded, unchanged;
six questions - D; the runbook's stale `CLEAR` reading - this gate's dated paragraph.
**13.1-06**: deviations 1-7 (`observeConfig` kept in the route; the tune probe; two specs re-aimed;
`RESTORED_STORED_LINE`; `STORE_LABEL`; the import fix and twelve swaps; instrument's index-form list)
- fixed; the 17 red titles - 15 by 13.1-07's count, all green; four questions - D; SAFE-03 / 04 / 09
- amended at this gate.
**13.1-07**: deviations 1-7 (`literals` / `typedIndex`; `BudgetMeter` kept; the zone's focus rule;
the sweep's thumb; two assertions corrected by the run; `CLEAR_REASONS` imported; index 2 not 1) -
fixed; the forecast pair and the track rail - A.6, A.7, D; the zone after an unplug - A.5, D; five
questions - D; `browse:299` / `:343` - A.8, seen again at this gate.
**13.1-08**: no code deviation; one executor mishap (a whole-suite run started by a mis-typed chunk
name, killed after about a minute, nothing read from it) named in `docs/TESTING.md`; the plan's
wrong assertions named there and in its SUMMARY.

**`13-gui-overhaul/deferred-items.md`, walked**: A.2 (the install column, J.13) CLOSED by 13.1-06;
A.3 (I.6.5) CLOSED as declined by 13.1-05 (question G re-asks); A.14 (the stepper) answered in part
by D-09; A.26 (`TryOnDevice.svelte:499`) MOOT, the file deleted; A.21 (`install:1977`'s 50 ms
margin) - did not recur in four c1 runs at this gate; A.19 (the wrangler harness) - no death at
1.7-2.3 GB free; A.29 / A.30 (the runbook's intro and labels) - re-mapped by this gate's paragraph;
A.1 (the Playground draft, J.19), A.4, A.5, A.7-A.13, A.15-A.18, A.20, A.22-A.25, A.27, A.28,
A.31, A.32 - unchanged and still owed or recorded as they were; B (Grifter's licence) - unchanged and
named again in the runbook's fourth-bench section; D's thirty-two questions - the fourth bench
answered the ones it answered by naming the nine changes, and none is re-asked here.
