---
phase: 13-gui-overhaul
plan: 03
subsystem: ui
tags:
  [
    identity,
    tokens,
    eleven-tokens,
    contrast,
    d-16,
    d-17,
    type-scale,
    wordmark,
    currentcolor,
    no-radius,
    allowlist,
    decorative-divider,
    three-signal-selection,
    grifter,
    copy-ledger,
  ]
requires:
  - phase: 13-gui-overhaul
    plan: 02
    provides: "PREV_FILES 86 / PREV_TESTS 889 (+1 todo) / e2e 88 titles, 108 runs / BASE_CHECK 583 / sweep 4 19 / catalog 26, observed on the clean tree at 9384a5e"
  - phase: 13-gui-overhaul
    plan: 01
    provides: "the radius gate in three layers with a sixteen-row allowlist (app.css's row cleared here), the scoped Tailwind import and the rounded refusal at the top of app.css (kept), the copy ledger 13-COPY-NEW.md (one row and two questions added here)"
  - phase: 13-gui-overhaul
    plan: context
    provides: "D-01 (ask where not sure; no rounded corner), D-04 (Grifter + Inter, PERSONAL USE unresolved), D-05 (the register), D-10 (the pill goes), D-14 Q14 (the wordmark re-cropped, currentColor, original untouched), D-15 (six circles, none touched here), D-16 (the action colour is #DCFF71), D-17 (36 / 30 / 17 measured, §12 overridden)"
provides:
  - "THE BIBLE'S ELEVEN TOKENS AND NO TWELFTH in src/app.css's @theme, every value §12's, --color-action at #DCFF71 (D-16): workspace #101210, panel #191C18, raised #22261F, divider #383E32, boundary #758168, ink #F0F1E9, ink-quiet #ACB3A2, action #DCFF71, on-action #19200D, error-ink #FFC4AD, error-surface #35211D. --color-glow removed (the one bloom is --action-bloom in :root, the action at 0.18), --color-over renamed --color-error-ink, --color-ink-dim folded into --color-ink-quiet"
  - "src/lib/ui/identity.spec.ts REWRITTEN to eleven tests (7 -> 11): the token list and no twelfth anywhere in the file; every value equal to the Bible's; the contrast table COMPUTED from the file - 24 cells to two decimals plus on-action 14.82 - with text at 4.5:1 and the boundary at 3:1; the divider asserted to FAIL 3:1 (WCAG 1.4.11, decorative only); the boundary rule as a scan over every .svelte and .css with classes resolved against each file's markup; the selection rule (a raised fill as a selected state carries the 3px action left rule and an action label) fixture-proved; the type scale at 36 / 30 / 17 with 11px only as tracked uppercase; the font stacks; every display @font-face; the focus ring at the action colour; the favicon unchanged"
  - "THE TYPE SCALE in src/app.css as eight .type-* roles in two display tiers plus .numerals: display 60 / 0.95, page title 36, panel title 30, group title 17 semibold, base 14 / 1.45, helper 13, micro 11 uppercase tracked 0.12em (the only uppercase on the site), field 15 and 16 under (pointer: coarse). §12's written 28-32 / 20 / 14 recorded in the header as overridden by measurement (D-17)"
  - "THE PILL'S CORNERS REMOVED (D-10, 2026-09-11): border-radius 999px gone from app.css, the class kept as a rectangle with a 1px --color-boundary border and 24px inline padding; app.css's allowlist row cleared in the same commit - fifteen rows, thirty-two declarations remain; the focus ring's border-radius: inherit stays, exempt by name"
  - "THE WORDMARK AS ONE ASSET THAT CAN BE ANY COLOUR: src/lib/assets/wordmark.svg derived from bible/hangar-logo-w.svg by exactly three asserted edits (viewBox re-cropped to the ink box re-measured from the paths, width and height stripped, six fills to currentColor); src/lib/ui/Wordmark.svelte rendering it inline with role=img, size and label props; font-assets.spec.ts +1 re-measuring the ink box from the path data and holding the viewBox to it within 0.01; the supplied file byte-identical (sha256 74491c12... before and after)"
  - "EVERY CONSUMER RENAMED across 40 files, 254 replacements, none left: line-soft -> divider (59), line -> boundary (53), ground -> workspace (28), accent -> action (66), ink-dim -> ink-quiet (16), glow -> action-bloom (3), over -> error-ink (29)"
  - "The accessible name HANGAR ledgered in 13-COPY-NEW.md with two questions recorded: the link's name once the shell composes HANGAR beside FOR ZONA, and the favicon still in the retired #d6ff4e with rx corners"
affects:
  - "13-04: app.css's CRT and lattice blocks still speak the nine-token vocabulary in their comments and carry the last black-at-alpha and mask literals; --crt-scanline, --crt-roll and the body::before halftone (now the action's channels at 0.04) go with them. PadFrame's unlit wash is 15% of the opaque divider, not 25% of a lime alpha; e2e/aesthetic.e2e.ts's 0.2 cap is what forced it and 13-04 deletes that file"
  - "13-05: src/lib/ui/shell/layout.ts does not exist and was NOT created; its header carries the D-17 sentence (36 / 30 / 17, measured off the PDF at 1440; §12's written 28-32 / 20 / 14 overridden by measurement) when 13-05 writes it. The shell mounts Wordmark.svelte and composes HANGAR beside FOR ZONA; the link's accessible name is a ledger question"
  - "13-07 / 13-09: FrontDoor.svelte's h1.wordmark and Splash.svelte's .mark - the tracked Grifter text wordmarks - are still there, now in --color-action; Splash.svelte:66 still carries ACCENT = #d6ff4e for its canvas; 13-07 re-derives the OG image from the eleven tokens (render.ts's two alphas are its own constants until then)"
  - "13-08: TagChip.svelte:136's .chip.disabled border is the one known --color-divider on a control-shaped box (a <label> around a hidden checkbox), outside the boundary scan's control list by name; the chips' active tint rgb(214 255 78 / 0.08) at TagChip.svelte:127 and Knob.svelte:792 is the retired accent as a literal"
  - "13-10: --color-error-surface has no consumer yet; tune-ui.spec.ts's 'alarm red lives in exactly two components' now counts --color-error-ink and moves with the meters. 13-11: TryOnDevice.svelte:480 paints its label color: #000000 on the action fill where --color-on-action exists; the disabled primary's label is now the quiet rung plus install-copy.ts's DisabledReason"
  - "13-18: one ledger row (HANGAR) and one question; 13-20: IDENT-01's ~#D6FF4E clause amended by name to #DCFF71 (D-16) with the retired value's three ratios recorded once below; the allowlist at thirty-two in fifteen files; the terms below carried"
tech-stack:
  added: []
  patterns:
    - "A published figure is asserted by RECOMPUTING it from the source it describes and comparing to two decimals, so the document is the claim and the file is the evidence and a drift in either is a moved ratio"
    - "A known failure is asserted as a failure (the divider under 3:1) so the rule that depends on it (decorative only) has a mechanical anchor rather than a paragraph"
    - "A scan that must tell a control from decoration resolves each class in the selector against the same file's markup, proves itself on fixtures in both directions before reading the tree, and names by file and line the case it cannot see"
    - "A derived asset is held to a measurement the test itself takes from the data (the ink box from the path commands), not to a number copied from the research or from the asset"
key-files:
  created:
    - src/lib/assets/wordmark.svg
    - src/lib/ui/Wordmark.svelte
    - .planning/phases/13-gui-overhaul/13-03-SUMMARY.md
  modified:
    - src/app.css
    - src/lib/ui/identity.spec.ts
    - src/lib/ui/font-assets.spec.ts
    - src/lib/ui/radius-allowlist.ts
    - src/lib/ui/radius.spec.ts
    - src/lib/ui/instrument.spec.ts
    - src/lib/ui/tune-ui.spec.ts
    - src/lib/og/render.ts
    - src/lib/og/render.spec.ts
    - src/lib/ui/PadFrame.svelte
    - src/lib/ui/MixTwo.svelte
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
    - .planning/STATE.md
key-decisions:
  - "identity.spec.ts was REWRITTEN, not amended: its central sentence moved from 'the only third hue is the over-budget alarm' to 'these eleven values and no twelfth', because the idea changed (graphite surfaces, near-white text, one action colour) and not only the count"
  - "--color-action is #DCFF71 by D-16, asserted equal to it and asserted NOT equal to #d6ff4e; the retired value's ratios are recorded once in this document as the evidence behind D-16 and are not carried"
  - "--color-glow did not survive as a token: its two consumers (PadFrame's hero frame, TryOnDevice's hover) point at --action-bloom, the action at 0.18, declared in :root beside --crt-scanline and --crt-roll (the plan's --surface-veil does not exist in this tree)"
  - "The boundary rule (test 5) shipped as the SCAN, not the narrower shorthand assertion: classes are resolved against each file's markup, the classifier is fixture-proved in both directions, and the one thing it cannot see - a <label> wrapping a hidden input, TagChip.svelte:136 - is named in the test header and here rather than silently permitted"
  - "The type scale ships at the PDF's measured 36 / 30 / 17 with §12's 28-32 / 20 / 14 recorded as OVERRIDDEN BY MEASUREMENT (D-17) in app.css's header; layout.ts is 13-05's file and was not created"
  - "The consumers of every replaced token were renamed across 40 files rather than bridged by aliases: an alias outside @theme would be a twelfth --color-* by another name, and a dangling var() would be a silent transparent"
  - "gsd-tools state advance-plan, update-progress and roadmap update-plan-progress were NOT run; requirements mark-complete was not run because IDENT-01 and IDENT-02 are already ticked and are amended by name at 13-20"
patterns-established:
  - "A gate with a documented hole names the hole by file and line in its own header and in the SUMMARY, and hands it to the plan that owns the component"
requirements-completed: []
duration: 45min
completed: 2026-09-11
---

# Phase 13 Plan 03: The Eleven Tokens, the Type Scale and the Wordmark Summary

**The palette is the Bible's eleven values and no twelfth, against `#DCFF71` (D-16), with
`identity.spec.ts` rewritten to eleven tests that recompute §12's contrast table from the file and land
on every published figure to two decimals; the divider is gated decorative-only by asserting that it
fails 3:1, and selection is gated to three signals; the type scale ships at the PDF's measured 36 / 30 /
17 with §12's written figures recorded as overridden (D-17); the pill's corners are gone and `app.css`'s
allowlist row with them; and the supplied wordmark is one `currentColor` asset re-cropped to an ink box
this plan re-measured from the path data, the original proved byte-identical by hash on both sides.
Every consumer of every replaced token was renamed - 254 replacements in 40 files - and the whole tree
is green at `86 / 894 (+1 todo)`, `+0 / +5` on 13-02's `86 / 889`. Nothing here is hardware-verified,
no device was touched, and nothing was deployed.**

## Performance

- **Duration:** about 45 min
- **Started:** 2026-09-11T02:01Z (reading, after 13-02's close at `9384a5e` 02:00Z); first edit 02:12Z
- **Completed:** 2026-09-11T02:45Z
- **Tasks:** 2 of 2
- **Files:** 2 created, 45 modified across the two task commits (plus this document and STATE.md)

## Commits

| Hash      | Message                                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| `e9972c0` | `feat(13-03): the Bible's eleven tokens, the contrast table computed, the two rules that would erode, and the pill's corners removed` (43 files) |
| `b1010bf` | `feat(13-03): the wordmark as one asset that can be any colour, and the supplied file proved untouched` (4 files)     |

Both with `git commit --only <paths> -F <message-file>`, pathspec before the message flag; the two new
files were `git add`ed first because `--only` cannot see an untracked path. No push.

---

## The baseline, carried from 13-02, and this plan's term written out

Tree at `9384a5e`: **86 files / 889 tests (+1 todo) / 88 e2e titles / 108 runs / check 583 / catalog 26
/ sweep `4 19`**. The plan carries `PREV_TESTS 890` and asserts `86 895`; that is 13-01's `-1` offset
(12-10's unlanded `+1`), stated by both predecessors and reconciled by neither, and it is stated here
once and not reconciled: the gate ran at `86 894`. **This plan's term is `+0` files, `+5` tests, `+0`
e2e titles.** Phase 12 stands at 10 of 12 with 12-06 open at a user checkpoint; nothing under
`.planning/phases/12-touch-framework/` was touched.

| Name         | Carried (13-02)   | Term                                             | Observed after 13-03                                                     |
| ------------ | ----------------- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| `PREV_FILES` | **86**            | **+0**                                           | **86**                                                                   |
| `PREV_TESTS` | **889** (+1 todo) | **+5** (`identity` 7 -> 11, `font-assets` 5 -> 6) | **894** passed, 1 todo                                                   |
| sweep        | `4 19`            | +0                                               | **`4 19`**                                                               |
| `BASE_CHECK` | **583**           | +1 (`Wordmark.svelte`), provenance only          | **584** files, 0 errors 0 warnings                                       |
| e2e titles   | **88**            | **+0**                                           | **88** (`grep -c "test("` summed)                                        |
| e2e runs     | **108**           | +0                                               | **108** on the second full run; the first was 103 + 5 transient at the WebKit tail, and `webkit-phone` alone 20 of 20 |
| catalog      | 26                | +0                                               | 26                                                                       |
| radius debt  | 33 in 16 files    | **-1 row, -1 declaration** (the pill)            | **32 in 15 files**; the six circles unmoved                              |

`npm run test:quick 2>&1 | node scripts/check-counts.mjs 86 894`: *matches the expected counts*, after
`npm run build` each time a `.svelte` or `.css` moved (layer B refuses a stale build and was seen red
once between a `cp` restore and the rebuild, which is the guard working). `npm run test:sweep 2>&1 |
node scripts/check-counts.mjs 4 19`: *matches*. `npm run check`: **584 files, 0 errors, 0 warnings**.
`npm run lint`: clean (one `svelte/no-at-html-tags` error on the way, fixed by placing the directive on
the line before the `{@html}` it guards). `npm run build`: green, with `@source not inline(...)` and
`@import "tailwindcss" source(".")` at the top of `app.css` **kept intact** - asserted by the patch's
post-conditions.

---

## Task 1: the eleven tokens, the computed table, and the two rules

### The eleven, as landed (`src/app.css` `@theme`, commit `e9972c0`)

| Token                   | Value     | Role (§12)                                 | Replaced                                                  | Uses renamed |
| ----------------------- | --------- | ------------------------------------------ | --------------------------------------------------------- | -----------: |
| `--color-workspace`     | `#101210` | main background                            | `--color-ground` `#000000` - the ground is no longer black | 28           |
| `--color-panel`         | `#191c18` | rail and inspector                         | new; no consumer yet (13-05)                              | -            |
| `--color-raised`        | `#22261f` | selected rows, secondary surfaces          | new; no consumer yet (13-05, 13-08)                       | -            |
| `--color-divider`       | `#383e32` | **decorative** separation only             | `--color-line-soft`                                       | 59           |
| `--color-boundary`      | `#758168` | every control and every real boundary      | `--color-line`                                            | 53           |
| `--color-ink`           | `#f0f1e9` | main labels and values                     | lime at 0.72                                              | (name kept)  |
| `--color-ink-quiet`     | `#acb3a2` | helper text and metadata                   | lime at 0.55 **and** `--color-ink-dim` at 0.5             | 16           |
| `--color-action`        | `#dcff71` | primary action, active outline, selection  | `--color-accent` `#d6ff4e` (**D-16**)                     | 66           |
| `--color-on-action`     | `#19200d` | labels on the action colour                | new; no consumer yet (13-11)                              | -            |
| `--color-error-ink`     | `#ffc4ad` | validation and transfer errors             | `--color-over` `#ff3b30`                                  | 29           |
| `--color-error-surface` | `#35211d` | error message backgrounds                  | new; no consumer yet (13-10)                              | -            |

Eleven, and test 1 says eleven - inside `@theme` as a set, and **anywhere in the file** as
declarations, so a twelfth in `:root` is red too. Lowercase hex because Prettier lowercases; the test
compares case-insensitively. `--color-glow` is the twelfth candidate and it did not survive (below).

### The contrast table, computed by the test from the file (D-16: against `#DCFF71`)

Printed by `identity.spec.ts` test 3 on the green run, every cell asserted equal to §12's figure to two
decimals, 24 cells plus one:

```
foreground             workspace  panel raised error-surface
--color-ink             16.54  15.13  13.53  13.32
--color-ink-quiet        8.71   7.97   7.12   7.01
--color-action          16.65  15.23  13.62  13.40
--color-error-ink       12.32  11.27  10.07   9.92
--color-boundary         4.57   4.18   3.73   3.68
--color-divider          1.71   1.56   1.39   1.37
on-action on action 14.82; raised on panel 1.12; panel on workspace 1.09
```

Text pairs are asserted at or above 4.5:1 on every surface; `--color-boundary` at or above 3:1 on the
three ordinary surfaces; `--color-divider` is asserted **below** 3:1 on all four (test 4, naming WCAG
1.4.11) - a test that asserts a known failure is how a decorative-only rule stays decorative. Raised on
panel and panel on workspace are asserted under 1.5:1 so the reason selection cannot be a fill is on
the record as a number.

**The one-off `#D6FF4E` comparison, recorded once as the evidence behind D-16 and not carried:** the
retired accent would have given **16.37 / 14.97 / 13.39** on workspace / panel / raised against the
Bible's **16.65 / 15.23 / 13.62**, and `#19200D` on it **14.57** against **14.82** - "every accent changes
by a few points of hue and lightness", and every one of §12's published figures holds only against
`#DCFF71`. `IDENT-01`'s *"a single acid-lime accent (~#D6FF4E)"* clause is amended by name at 13-20 with
this row as its source.

### Every orphaned consumer, and where each went

**`--color-ink-dim` (16 replacements: the token plus 15 uses in 13 components), all to
`--color-ink-quiet`.** Twelve of the fifteen were a **disabled control's label**, which is the case the
warning names; whether each still carries a named reason:

| File and selector                                          | What it was                              | Reason it still carries                                                                                   |
| ---------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `TryOnDevice.svelte` `.primary:disabled`, and the honesty line | the disabled primary's label and its slot | `install-copy.ts`'s `DisabledReason` - the copy names why (no snapshot, over budget, no device)          |
| `KeepOnDevice.svelte` `.control:disabled`                  | KEEP ON DEVICE disabled                  | `DisabledReason` (nothing tried on yet)                                                                   |
| `PutBack.svelte` `.action:disabled`                        | PUT BACK disabled                        | `DisabledReason` (no snapshot to restore)                                                                 |
| `Clear.svelte` `.control:disabled`                         | CLEAR disabled                           | `DisabledReason`                                                                                          |
| `DeviceDetails.svelte` `.disconnect:disabled`              | disconnect while writing                 | the session copy says it is writing                                                                       |
| `DeviceSlot.svelte` `.label[data-tone="dim"]`              | the slot's dim tone                      | a tone, not a control; now the quiet rung                                                                 |
| `NamePlate.svelte` `.name:disabled`                        | the name plate's disabled state          | 13-09 deletes the component                                                                               |
| `MixTwo.svelte` `.mix-two:disabled`                        | MIX TWO disabled                         | never mounted; 13-10 deletes it (D-12)                                                                    |
| `TagChip.svelte` `.chip.disabled .text`                    | a disabled facet chip's word             | **none named** - the chip's disabled signal is now the `disabled` input, `cursor: not-allowed` and its divider border (see the hole below); 13-08 re-does the chips |
| `FacetRow.svelte` two rules (`.count`-class dims and `.dash`) | a facet's zero count and its dash        | information, not a control; now the quiet rung                                                            |
| `CatalogCard.svelte` `.name.unavailable`                   | an unavailable entry's name              | the card's own `unavailable` copy names it                                                                |
| `ColourPicker.svelte` `.join`                              | the picker's separator glyph             | not a control                                                                                             |
| `TuningRegion.svelte` `.action:disabled`                   | a tuning action disabled                 | its own copy; 13-09 re-skins                                                                              |

**`--color-glow` (3: the token plus two consumers, not the "one static box-shadow bloom" the plan and
the old comment said)** -> `--action-bloom: rgb(220 255 113 / 0.18)` declared in `:root` at
`app.css:179`, beside `--crt-scanline` and `--crt-roll`. `PadFrame.svelte:100` (`.pad.hero`'s
`box-shadow: 0 0 40px`) and `TryOnDevice.svelte:489` (`.primary:hover`'s `0 0 24px`) - the light output
and the primary action, which is exactly what §3 reserves glow for. The plan's *"the way `--surface-veil`
already is"* names a property that does not exist in this tree.

**`--color-over` (29: the token, 8 in `BudgetMeter.svelte`, 2 in `BudgetMessage.svelte`, one comment
each in `CatalogCard`, `ColourPicker`, `CopyLink`, `Knob` and `StampNotice`, and the `TOKEN` constants
in `tune-ui.spec.ts` (7), `browse-ui.spec.ts` (2), `device-ui.spec.ts` (2) and
`tune/colour-picker.spec.ts` (1))** -> `--color-error-ink`, by rename. `tune-ui.spec.ts`'s *"the alarm
red lives in exactly two components and on no button"* now counts `--color-error-ink` and is green
without changing what it asserts - the rename reached it through the same pass, so the test count is
unmoved and the assertion points at the new name as the plan asked. `--color-error-surface` has no
consumer until 13-10 re-homes the meters and the message.

**The four straight renames** - `line-soft -> divider` (59), `line -> boundary` (53), `ground ->
workspace` (28), `accent -> action` (66) - reached 40 files including the specs that name tokens in
their assertions, so `instrument.spec.ts`'s `GROUND_EXCEPTIONS`, `tune-ui.spec.ts`'s reserved-list census
and `aesthetic.spec.ts`'s wash checks all read the new names. Zero old names remain anywhere under
`src/`, `e2e/` or `scripts/`, asserted by the rename script.

### The pill, and the allowlist before and after

The plan's `app.css:421` and `:292` are from before 13-01 added its 22-line scanner header; on the tree
this plan read the pill's `border-radius: 999px` was at **`:442`** and the focus ring's `inherit` at
**`:313`**. The pill's radius is gone; `.pill` is now at `:551` as a rectangle with `border: 1px solid
var(--color-boundary)`, `background: transparent`, `padding-inline: 24px` and the 44px floor on both
axes, and its header says the shape was removed under D-10 on 2026-09-11. The focus ring is at `:428`
with `border-radius: inherit` kept, its exemption named in the comment (`EXEMPT_VALUES`: it inherits
from a zero).

| Allowlist        | Rows | Declarations | `src/app.css`                                    |
| ---------------- | ---: | -----------: | ------------------------------------------------ |
| before (13-01)   |   16 |           33 | 1 (`:421` the pill, `clearedBy: "13-03"`)         |
| after (`e9972c0`) |   15 |           32 | **no row** - the file carries no radius above zero |

Layer A's green print: *"40 declarations in 49 files scanned; 32 above zero remaining in 15 allowlisted
files; 6 circles (D-15)"* at their six file:line pairs, unmoved; layer B green against a fresh build with
no `999px` among the tolerated values. `instrument.spec.ts:691` and **`tune-ui.spec.ts:937`** - a second
pill-radius assertion 13-01's note did not name - both asserted `.pill` declares `999px`; both rows were
removed and their messages reworded (Rule 3). D-15's six circles: none touched.

### Test 5 shipped as the scan, and the one hole it names

The classifier: a rule is on a control if its selector carries an element selector `input`, `button`,
`select`, `textarea` or `a`, a `[role` or `[tabindex` attribute selector, **or any class that the same
file's markup puts on such an element** (class attribute or `class:` directive), and the property is
any `border*` or `outline*`. It is proved on fixtures before the tree is read - it fires on
`input.field` and on `.chip` when the markup has `<button class="chip">`, and not on a `span` or an
`hr` - and it scanned **456 rules in 49 files, 6 divider-coloured border declarations, none on a
control**. The narrower "no `border` shorthand" form was not needed.

What it found on the tree: **`MixTwo.svelte:367` `.mix-two:disabled` and `:447` `.child`**, both
buttons, both bordered in the divider; both moved to `--color-boundary` (Rule 2 - the rule this plan
ships), with the consequence written beside each: the disabled state loses its softened-border channel
and `.child:hover` no longer lifts. MixTwo was never mounted and 13-10 deletes it.

What it cannot see, said in the test header and here: a `<label>` is not in the control list, and
**`TagChip.svelte:136` `.chip.disabled { border-color: var(--color-divider) }` is a `<label>` wrapping a
hidden checkbox** - a control-shaped box bounded by the divider. It was left as the one known hole
rather than fixed silently, because fixing it to the boundary would make a disabled chip identical to an
enabled one at rest (the chip's word is already the quiet rung), and the chips are 13-08's (D-11 drops
the FEELS row and 13-08 owns the chip-versus-rail question).

### Test 6, fixture-proved and vacuous on today's tree by design

A selected state is a selector carrying `[aria-selected|current|pressed|checked]`, `:checked`, or
`.selected|.is-selected|.active|.current|.chosen`; if such a rule paints `--color-raised` as its
background, then across the file's rules that carry the same marker there must be a
`border-inline-start` or `border-left` of exactly `3px solid var(--color-action)` and a `color:
var(--color-action)`. Three fixtures - all three signals passes, no rule fails naming the rule, no
label fails naming the label - and then the tree: **0 selected-state fills in `--color-raised`**,
printed so the day the rail lands (13-05, 13-08) the scan is visibly no longer vacuous.

### The type scale, and the file that does not exist

Eight `.type-*` roles in `app.css` (`:230`-`:291`) plus `.numerals` (the mono stack with
`tabular-nums`, a modifier rather than a ninth role). The header carries the D-17 sentence: *36 / 30 /
17, measured off the PDF at 1440; §12's written 28-32 / 20 / 14 overridden by measurement per D-17* -
not a reconciliation. **`src/lib/ui/shell/layout.ts` does not exist and was not created**: the plan asks
for the sentence in its header too, and that is 13-05's to carry when it writes the file. Test 7 reads
the eight roles by class, asserts 36 / 30 / 17 by number, asserts 11px appears only with
`text-transform: uppercase` and a `letter-spacing`, asserts no rule in the file is uppercase except
`.type-micro`, and asserts the `(pointer: coarse)` field at 16px.

**The Grifter sentence, as honest as the tree allows:** Grifter is a bold-only static face at 700 in
this tree (`app.css`'s one `@font-face`), and at `.type-display`'s 60px it will read heavier and
narrower than the PDF's face, which sits around 500-600 - a difference, not a fault. **Nothing renders at
60px yet** (the intro is 13-07's), so this is recorded from the face's metrics and the research's
judgement, not beside a rendered result; 13-07 is where the render happens. Grifter keeps the headline
tier and the 11px micro tier, Inter every sentence, and **the wordmark no longer uses Grifter at all**.
The PERSONAL USE line is in the swap block's comment, dated, marked unresolved, with the two-line cost
of the swap beside it.

### Three negative checks, restored from scratch copies with sha256 either side

| # | Plant                                                                    | Red                                                                                                                   |
| - | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| A | `--color-twelfth: #ff00ff;` after the eleventh token                     | test 1: `expected [ '--color-twelfth' ] to deeply equal []` - **named** (the count assertion was reordered behind the naming one after the first run tripped the count first, Rule 1) |
| B | `.field input`'s border in `BrowseToolbar.svelte` moved to the divider   | test 5: `src/lib/ui/BrowseToolbar.svelte:484 .field input { border: 1px solid var(--color-divider) }` - the selector named |
| C | `.plant-row.selected { background: var(--color-raised) }` with a label rule but no left rule, appended to `app.css` | test 6: `src/app.css:693 .plant-row.selected paints --color-raised as a selected state WITHOUT a 3px solid var(--color-action) left rule` |

`app.css` `997c3b4e…` before and after A and C; `BrowseToolbar.svelte` `f131511e…` before and after B.
No selected-row rule exists in the tree to drop a rule from, so plant C is an added rule missing one
signal - stated rather than pretended.

---

## Task 2: the wordmark, and the file proved untouched

### The ink box, re-measured beside the research's figures

Parsed from the six paths' `d` attributes (15 `M`, 59 `L`, 12 `C`, 9 `Z`), two ways: the hull of every
coordinate including control points, and the exact box with each cubic's extrema solved. **Both give x
54.496, y 361.359, width 698.586, height 86.711 - 8.056 : 1** (the curves' extrema lie inside their
hulls). The research's `54.5 / 361.4 / 698.6 / 86.7` and `8.06 : 1` hold to one decimal; the asset
carries the three-decimal box so no ink is clipped at an edge.

### The three edits, and both hashes

`src/lib/assets/wordmark.svg` is `bible/hangar-logo-w.svg` (3,173 bytes) with exactly three edits,
each asserted by the derivation script before the write: `viewBox="0 0 810 809.999993"` ->
`"54.496 361.359 698.586 86.711"`; ` width="1080"` and ` height="1080"` removed; six
`fill="#ffffff"` -> `fill="currentColor"`. All six `d` attributes byte-identical before and after; no
`<defs>`, `<style>` or `<text>`; no optimiser; 3,187 bytes. `zoomAndPan`, `preserveAspectRatio`,
`version` and `xmlns:xlink` were left as supplied.

```
before: 74491c122b8d20b6e64c9ef48268f9d44b78258373d855786a005e8742505db3  bible/hangar-logo-w.svg
after:  74491c122b8d20b6e64c9ef48268f9d44b78258373d855786a005e8742505db3  bible/hangar-logo-w.svg
```

Identical. The user's working copy at the repository root, `hangar-logo-w.svg`, carries the same hash
and was not touched either.

### `Wordmark.svelte`, and what it replaces

Inline, because an `<img>` cannot take `currentColor`: the asset is imported as a string at build time
(`?raw`) and rendered inside a `<span role="img" aria-label={label}>` whose `block-size` is the `size`
prop (default 22, the header's cap height as the research measured it), so the paths inherit the
parent's `color`. The `{@html}` carries an `eslint-disable-next-line svelte/no-at-html-tags` with its
reason (a repository asset the bundler read, never input) on the line before it - the first placement
before the multi-line `<span>` did not cover the directive after Prettier, and `npm run lint` said so.
The mark is `HANGAR` alone; `FOR ZONA` is text the shell composes (13-05). **Not mounted by this plan.**

What it replaces, so the record says what was there: `FrontDoor.svelte:280` renders
`<h1 class="wordmark"><span data-testid="header-wordmark">HANGAR</span></h1>` at 12px / 600 / 0.18em
uppercase in the display face and the accent, and `Splash.svelte:270` renders `<span class="mark">HANGAR</span>`
at 28px / 600 / 0.5em uppercase in the accent - both wide-tracked Grifter text, both now in
`--color-action`, both deleted at 13-07 and 13-09.

**The favicon is not the wordmark**: it is 8:1 and cannot be an icon, so `favicon.svg` and test 11 are
unchanged and the site has two marks with two jobs - the pad outline at 1:1 for the icon, the wordmark at
8:1 for the header - which is what the PDF shows. What the unchanged favicon still carries is a question
below.

### `font-assets.spec.ts` +1, and two negative checks

The sixth test reads the asset, asserts no `width`/`height`, six paths, six `currentColor` fills, zero
hex colours and nothing added, then **re-measures the ink box from the path data itself** (absolute
M/L/C/Z, cubic extrema) and asserts the viewBox equals it within 0.01 on each edge and the aspect ratio
is 8.06 : 1 within 0.01. The header records why it lives here: it is about an asset's shape, this gate's
subject.

| # | Plant                                  | Red                                                                                          |
| - | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| D | one fill back to `#ffffff`             | `six currentColor fills (got #ffffff, currentColor, ...): expected 5 to be 6` - the count named |
| E | ` width="1080"` put back               | `no width attribute: expected true to be false`                                              |

`wordmark.svg` `35eb29ec…` before and after both.

### The accessible name, as ledgered

`13-COPY-NEW.md` gained one row: the wordmark's accessible name, landed as **_HANGAR_** (the default of
`Wordmark.svelte`'s `label` prop) - the word the mark spells, uppercase because it is the brand as
written and a short label, which D-05 permits; §3 names the pair *HANGAR / for ZONA* and the PDF draws
them as two things. Two questions recorded rather than decided (D-01): whether the link the shell wraps
the mark in (13-05) is named _HANGAR_ alone or the visible pair _HANGAR for ZONA_; and whether the
favicon - still Phase 4's 9x9 outline in the retired `#d6ff4e` with two `rx` corners in its SVG - is
redrawn in `#dcff71`, square, since it now carries an accent the site no longer uses (D-16) and a corner
the site never draws (D-01).

---

## The e2e suite, run although the plan only greps it

The plan's verification asks only for the title count (88, unmoved). Because every component's colours
moved and layer C is a `@webkit` title, the full suite was run with `--workers 3` against a fresh build,
in both projects (WebKit 2336 is installed). **First full run: 103 passed, 5 failed, all five in
`webkit-phone` at the tail of the run** - `install.e2e.ts:2171` (the device slot's `data-hydrated` never
became `"true"` in 5 s) and `tuning-webkit.e2e.ts:295` (the splash still present), then
`tuning-webkit.e2e.ts:367`, `:424` and `:497` each with **`page.goto: Could not connect to server`**. The
`wrangler dev` server on 4173 stopped answering during the WebKit tail; the two earlier ones are the
same event seen as a page that never hydrated. **`webkit-phone` alone, one worker: 20 of 20**, layer C
(`radius.e2e.ts`) included. **Second full run, same command: 108 passed, `check-counts.mjs --playwright
108` matches.** The five are a transient at the server, named as warning 7 asks, not a red in the tree.

---

## Deviations from the plan

### 1. [Rule 3 - blocking] Every consumer renamed across 40 files

The plan's `files_modified` names seven files; removing `--color-ground`, `--color-line`,
`--color-line-soft` and `--color-accent` from `@theme` would have left more than 200 `var()` references
resolving to nothing. Renamed by one script with per-token counts and a zero-leftover assertion
(`e9972c0`).

### 2. [Rule 3] The OG renderer follows D-16 and its two alphas become its own constants

`render.spec.ts:153-155` asserted `--color-accent: #d6ff4e;` in `app.css` and read `--color-line-soft`'s
and `--color-line`'s alphas from it; both tokens are now opaque. `render.ts`'s `ACCENT_RGB` is
`[0xdc, 0xff, 0x71]`, the two flattened hexes were recomputed (`#2c3317`, `#58662d`), the spec asserts
`--color-action: #dcff71;` and the two constants by value, and the `alphaOf` helper is gone. 13-07
re-derives the image from the eleven tokens; the header says so.

### 3. [Rule 3] Two pill-radius assertions removed, not one

`instrument.spec.ts:691` (13-01 named it) and `tune-ui.spec.ts:937` (it did not) both asserted `.pill`
declares `999px`. Both rows removed, messages reworded; `tune-ui.spec.ts:976`'s "MixTwo re-declares no
999px" stays.

### 4. [Rule 3] PadFrame's unlit wash 25% -> 15%

`.dots` mixed `--color-line-soft` at 25% - a lime alpha of 0.2, so 0.05. The divider is opaque, so 25%
of it is a 0.25 alpha and `e2e/aesthetic.e2e.ts:692` caps the wash under 0.2 by the old token's own
alpha. 15% keeps the cap and the "dimmer than the dot" rule; the comment says why and 13-04 re-skins
the frame. The e2e file was not edited.

### 5. [Rule 2] MixTwo's two control borders moved to the boundary token

Found by test 5 on its first run (above).

### 6. [Rule 1] Test 1 reordered so a plant is named before it is counted

The first plant A tripped `expected 12 to be 11` before the naming assertion; the naming assertion now
comes first and the second plant A printed `--color-twelfth`.

### 7. [Rule 2] The two old-lime literals in `app.css` moved to the action's channels

`body::before`'s halftone `rgb(214 255 78 / 0.04)` and `--crt-roll: rgb(214 255 78 / 0.05)` are "an alpha
of the accent" by their own comments; the accent moved, so they did. `--crt-scanline`'s `rgb(0 0 0 /
0.5)` and the lattice's `#000000` mask literals stay (black darkens, a mask is opacity). All of it is
13-04's to delete.

### 8. [Design, in the header] `.numerals` beside the eight roles

The plan's tabular-numeral note became one modifier class rather than a ninth role; test 7 reads it.

### 9. [Process] STATE.md updated with the copy-first discipline; the four destructive commands not run

`record-metric`, four `add-decision`s and `record-session` corrupted **line 5 `status:`** (to 12-11's
paragraph) and **line 11 `completed_phases`** (11 -> 12), both repaired by inverse edit against the copy,
and bumped `completed_plans` 138 -> 139 (the tools' own arithmetic, as for the predecessors; left).
The Concurrent paragraph carries wave 3. `advance-plan`, `update-progress`, `roadmap update-plan-progress`
and `requirements mark-complete` not run; `ROADMAP.md` and `REQUIREMENTS.md` byte-unchanged.

---

## What the plan asserts that the tree does not support

1. **`86 895`** - the tree is `86 894`; the gate ran at 894 (13-01's offset, carried, stated once).
2. **`app.css:421`** (the pill) and **`:292`** (the focus ring) - `:442` and `:313` on the tree this plan
   read, after 13-01's header; now no pill radius, and `:428`.
3. **"`--color-glow` ... exists for one static box-shadow bloom"** - two consumers (PadFrame's hero
   frame, TryOnDevice's hover).
4. **"declared outside `@theme` the way `--surface-veil` already is"** - no `--surface-veil` exists;
   the bloom sits beside `--crt-scanline` and `--crt-roll`.
5. **"and into `src/lib/ui/shell/layout.ts`'s header"** - the file does not exist; 13-05's.
6. **"drop the 3px left rule from a selected-row rule"** - no selected-row rule exists in the tree;
   the plant was an added rule missing the signal.
7. **`instrument.spec.ts:691` ... moves with the pill** (13-01's note) - a second assertion at
   `tune-ui.spec.ts:937` moved with it too.
8. **"the build green with the asset emitted"** - the asset is inlined into the component's chunk by
   `?raw` and the component is not mounted, so nothing is emitted; the build is green and the test
   reads the source asset.
9. **"the SUMMARY records it beside the rendered result"** (Grifter at 60px) - nothing renders at 60px
   until 13-07; recorded beside the face's metrics instead.

---

## Questions recorded for the user rather than answered (D-01)

1. **The link's accessible name** once the shell composes `HANGAR` beside `FOR ZONA` (ledger, 13-05 /
   13-18).
2. **The favicon** - redrawn in `#dcff71` and square, or kept as Phase 4 drew it (ledger; a mark, not a
   string).
3. **TagChip's disabled border** on the divider - the one named hole in the boundary scan (13-08).

Flagged for attention, not asked: `TryOnDevice.svelte:480`'s `color: #000000` on the action fill where
`--color-on-action` now exists (13-11); the retired accent as a literal tint at `TagChip.svelte:127`
and `Knob.svelte:792` (`rgb(214 255 78 / 0.08)`) and as `Splash.svelte:66`'s canvas constant
(13-08 / 13-09 / 13-04); `docs/TESTING.md` still says `identity.spec.ts` has 7 tests (13-20 rewrites).

---

## Not yet wired, by design

`--color-panel`, `--color-raised`, `--color-on-action` and `--color-error-surface` have no consumer in
the tree; they are the surfaces and states 13-05 to 13-11 build, declared now so the gate is watching
before the first component is skinned (13-RESEARCH wave 1's reason). `Wordmark.svelte` is not mounted;
13-05's shell mounts it. Neither is a stub: nothing renders an empty value, and each is named with the
plan that consumes it.

## What was NOT done, and why

- **NOTHING HERE IS HARDWARE-VERIFIED. No device was touched. Nothing was deployed.**
- **`bible/hangar-logo-w.svg` was never edited**; both hashes above. `favicon.svg` unchanged.
- **`src/vendor/` unmoved; `firmware-oracle.spec.ts` unedited and green; `.planning/ROADMAP.md`
  byte-unchanged; CAT-04 stays `[ ]`; nothing under `.planning/phases/12-touch-framework/` touched;
  no sibling repository read.** D-15's six circles untouched at their six lines.
- **`prettier --write .` was not run**; only the files this plan changed were formatted. The three user
  files at the root are untouched.
- **No commit overlapped a suite run**; the docs commit follows the second e2e run.
- The scratch scripts (`rename.mjs`, `patch-app-css.mjs`, `inkbox.mjs`, `contrast.mjs`, the two
  negative-check scripts, `state-13-03.sh`) and every restore copy live in the session scratchpad
  outside the tree; `git status --porcelain` shows only the user's three root files.

## Notes for the next plans

- **Build before a gated quick run** whenever a `.svelte` or `.css` moved, and after any `cp` restore.
- **13-04:** `app.css`'s CRT and lattice comments still say "nine" and "no fourth hue"; delete with the
  blocks. The wash is 15% of the divider.
- **13-05:** `layout.ts` carries the D-17 sentence; mount `Wordmark.svelte`; the first `--color-raised`
  selected row must carry its 3px action rule and action label or test 6 is red naming it.
- **13-08:** `TagChip.svelte:136`. **13-10:** `--color-error-surface`; the alarm census.
  **13-11:** `--color-on-action`. **13-18:** one row, two questions. **13-20:** IDENT-01's clause; the
  allowlist at thirty-two in fifteen.

---

## Self-Check: PASSED

Every file this document names as created or modified exists on disk, both task commits resolve in
`git log --oneline --all`, no stub marker (TODO, FIXME, placeholder) is in any created file, and the
supplied wordmark hashes `74491c122b8d20b6e64c9ef48268f9d44b78258373d855786a005e8742505db3` in `bible/`
and at the repository root after the whole plan, as before it:

```
FOUND  src/lib/assets/wordmark.svg
FOUND  src/lib/ui/Wordmark.svelte
FOUND  src/app.css
FOUND  src/lib/ui/identity.spec.ts
FOUND  src/lib/ui/font-assets.spec.ts
FOUND  src/lib/ui/radius-allowlist.ts
FOUND  src/lib/ui/radius.spec.ts
FOUND  src/lib/og/render.ts
FOUND  src/lib/og/render.spec.ts
FOUND  src/lib/ui/PadFrame.svelte
FOUND  src/lib/ui/MixTwo.svelte
FOUND  .planning/phases/13-gui-overhaul/13-COPY-NEW.md
FOUND  .planning/STATE.md
FOUND  .planning/phases/13-gui-overhaul/13-03-SUMMARY.md
FOUND  commit e9972c0
FOUND  commit b1010bf
```
