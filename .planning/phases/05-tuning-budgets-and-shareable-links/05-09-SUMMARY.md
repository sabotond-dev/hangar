---
phase: 05-tuning-budgets-and-shareable-links
plan: 09
subsystem: ui
tags:
  [
    svelte5,
    accessibility,
    budget-meters,
    clipboard,
    web-share,
    reduced-motion,
    wcag-1-4-1,
  ]

# Dependency graph
requires:
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-02's src/lib/tune/view.ts - MeterView, MeterState, meterView() and percentOf(), which settle `over` and the four states before a component sees them; and src/lib/tune/copy.ts - every sentence these four components render, including MEASURING, meterNumerals, meterPercent, meterExpansion, emptyTimerExpansion, TURN_IT_DOWN, COPY_LINK, LINK_COPIED, the two share lines, the field name and the three stamp landings"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-04's model.ts LadderView and OverBudgetView, including the empty-backOff corner that decides whether a back-off control exists at all"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-05's src/lib/share/stamp.ts Landing union, restated structurally as StampNotice's prop"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-06's src/lib/share/url.ts shareUrl(), which composes the string CopyLink receives as a finished prop"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-08's ninth token --color-over: #ff3b30 in src/app.css, and Knob/KnobRack as the house style for a component in this region"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-07's quick baseline of 57 files / 641 tests (1 todo), sweep 3 / 13, e2e 24"
  - phase: 04-first-experience
    provides: "The secondary button treatment (KeepOnDevice, TryOnDevice), the Body/Micro type roles, the :focus-visible ring, NamePlate's prefersReducedMotion + fade pattern, and config-shape.spec.ts test 13, the chunk guard over src/lib/ui/"
provides:
  - "src/lib/ui/BudgetMeter.svelte - one meter: caption, numerals, percentage, bar, the four states, the hidden expansion, no ARIA role and no tab stop"
  - "src/lib/ui/BudgetMessage.svelte - message slot B: the fit-ladder line, the over-budget block, TURN IT DOWN, and the corner where no control is rendered at all"
  - "src/lib/ui/StampNotice.svelte - message slot A: the three landings under role=status"
  - "src/lib/ui/CopyLink.svelte - the button, the 2000 ms confirmed state, and the select-and-copy fallback, with zero awaits in the file"
  - "MEASURED: one meter renders at exactly 26px and a two-meter block at exactly 56px in Chromium, against BudgetMeter's own shipped style block"
  - "OBSERVED: the over-budget state is fully legible with --color-over replaced by --color-ink - WCAG 1.4.1 holds with the red removed entirely"
affects: [05-10, 05-11, 05-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A component names the fields it renders and no more: LadderView and OverBudgetView are declared STRUCTURALLY inside BudgetMessage rather than imported from $lib/tune/model, which D-18 keeps behind a dynamic import - the src/lib/sim/host.ts HostEngine pattern, with assignability checked at the region's call site"
    - "Appearance transitions that must be opacity-only use svelte/transition's fade, whose css function emits `opacity:` and nothing else and whose default easing is linear - a property of the function rather than a CSS declaration a later edit could widen to `all`"
    - "A source-level acceptance scan is written as a scan of DECLARATION VALUES, not of words: collecting every transition/animation value and asserting none names a height catches `transition: all` and does not fire on the legitimate line-height and min-block-size beside it"
    - "The colour-removed legibility check is performed by rendering the component's OWN style block (read out of the .svelte file, never retyped) into a throwaway page with the token overridden, and screenshotting both columns side by side"

key-files:
  created:
    - src/lib/ui/BudgetMeter.svelte
    - src/lib/ui/BudgetMessage.svelte
    - src/lib/ui/StampNotice.svelte
    - src/lib/ui/CopyLink.svelte
  modified: []

key-decisions:
  - "BudgetMessage and StampNotice declare their prop shapes STRUCTURALLY instead of importing LadderView, OverBudgetView and Landing. All three live in modules that reach the vendored compiler, and D-18 keeps model.ts behind a dynamic import; a narrow structural type names only the fields the component renders, and the compiler still checks the real types are assignable to it at the wave-10 call site"
  - "aria-busy is set on EACH meter rather than on the meters block. 05-UI-SPEC words it as the block; a meter is what knows its own feed, and the block above is free to be busy when either of its two is"
  - "While measuring, the `measuring…` word is left READABLE rather than aria-hidden with a hidden expansion beside it. There is no expansion to write - there is no measurement - and a caption with an aria-hidden word and nothing else would announce as a bare `SETUP`"
  - "The over-budget explanation line is rendered only when the back-off control is. model.ts hands over an empty backOff string in the corner where fit() is blocked and no knob moved; the quiet line describes what a click will do, so with no click there is nothing true to say. The over-budget line itself still states the configuration is over 908"
  - "CopyLink's handler is an if/else rather than the plan's `clipboard?.writeText(url).then(...) ?? fellBack()`. That form is an expression statement and @typescript-eslint/no-unused-expressions rejects it - observed, exit 1. The semantics are identical and the file still contains zero awaits and zero asyncs"
  - "document.execCommand(\"copy\") is not used at all, not even behind a capability check. It is deprecated, the select-and-copy reveal is the honest fallback, and three lines no test in this repository can reach are three lines of decoration"

patterns-established:
  - "Pattern: geometry derived in a comment AND measured in a browser in the same wave. The (14 + 4 + 8) x 2 + 4 = 56 derivation is in BudgetMeter's header; a throwaway Chromium render of that file's own CSS reported 26px and 56px, so the arithmetic is evidence rather than intent"
  - "Pattern: when an acceptance scan's own regex is wrong, fix the SCAN and say so. Two of this plan's scans reported false on correct code (a $props destructure with a type annotation, and a setTimeout body containing a semicolon); both were regex faults and both are recorded below"

requirements-completed: []
requirements-contributed: [TUNE-03, TUNE-04, TUNE-05, SHARE-02, SHARE-03]

# Metrics
duration: 19min
completed: 2026-09-04
---

# Phase 5 Plan 09: The Four Leaf Components Summary

**The phase's whole story is now four small files — two meters that read `702 / 908` and `77%` in tabular numerals with no ARIA role and no tab stop, two message slots that never author a sentence, and a `COPY LINK` whose clipboard call has nothing in front of it — and the suite totals did not move by a single test, exactly as the plan predicted.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-09-04T12:41Z
- **Completed:** 2026-09-04T13:00Z
- **Tasks:** 3 of 3
- **Files modified:** 4 (4 created, 0 modified)

## Observed totals

Baseline is `05-08-SUMMARY.md`: quick **57 files / 641 tests (1 todo)**, sweep **3 / 13**, e2e **24**.
The quick suite was **re-measured on a clean tree at `3faeb93`, before any file in this plan existed**,
and the baseline reproduced exactly.

| Suite        | Baseline (05-08)              | After 05-09                       | Delta         |
| ------------ | ----------------------------- | --------------------------------- | ------------- |
| `test:quick` | 57 files / 641 tests (1 todo) | **57 files / 641 tests (1 todo)** | **unchanged** |
| `test:sweep` | 3 files / 13 tests            | **3 files / 13 tests**            | **unchanged** |
| `test:e2e`   | 24 passed                     | 24 (carried, **not re-measured**) | **unchanged** |

Final, on the tree as committed:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 57 641
check-counts: observed 57 files, 641 tests passed, 1 todo (todo is reported, never asserted)
check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
check-counts: matches the expected counts

npm run check 2>&1 | tail -2
COMPLETED 490 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint                                            ->  exit 0
npx vitest run --project server src/lib/config-shape.spec.ts   ->  14 passed
npx vitest run --project server src/lib/ui/identity.spec.ts    ->   6 passed
```

`svelte-check` moved from 486 files to **490** — the four new components, and no new error or warning.

**e2e was not re-measured.** Nothing in the routed tree imports any of these four files yet;
`TuningRegion.svelte` (05-10) is what mounts them. Running Playwright would have re-observed 24
against an artifact these components cannot reach. `PREV_E2E` for 05-10 onward remains **24**.

### The baseline measurement found a flake worth recording

The **first** clean-tree run of `test:quick` reported `1 failed | 640 passed`, and the failure was
`src/lib/format-parity.spec.ts` — the D-15 cross-repo canary that shells out to `grid-editor`'s own
`prettier` under the sibling repo's cwd. Re-run in isolation it passed `3 passed` in 1.9 s, and the
next full run passed `57 files / 641 tests`. Nothing in HANGAR had been touched between the two runs.

The canary spawns a Node process in another repository while 56 other files are running, so it is the
one test in the suite whose result depends on machine load. **It is a flake, not a regression**, and
it is recorded here rather than smoothed over because the next executor who sees `640 passed` on a
clean tree should re-run rather than start debugging the vendor gate. If it recurs, its timeout
(`CANARY_TIMEOUT_MS`) is the thing to look at first.

## The sampling gap, said out loud

**This plan's test delta is zero, and that is unusual enough to state plainly rather than let a reader
infer it from a table.** No `.svelte.spec.ts` may exist in this repository and there is no browser
Vitest project, so **nothing in this wave is proven by a test written in this wave**. What actually
ran against these four files today:

- `npm run check` — 490 files, 0 errors, 0 warnings
- `npm run lint` — exit 0, and it **caught a real defect** (see the deviation below)
- `src/lib/config-shape.spec.ts` test 13 — the chunk guard, walking every non-spec file in
  `src/lib/ui/`, which now includes all four
- `src/lib/ui/identity.spec.ts` — 6 passed, unchanged: no new hue entered the palette
- six source-level scans written and run as throwaway `.mjs`, pasted in full below
- one Chromium render of `BudgetMeter.svelte`'s own style block, for the height arithmetic and the
  colour-removed legibility check

What is **not** proven until later: that the four components mount, that a knob change moves a meter,
that `TURN IT DOWN` applies, that the stamp notice disappears on first change, and that the clipboard
path behaves on a real engine. Those arrive **structurally in wave 10** (`src/lib/ui/tune-ui.spec.ts`)
and **in a real browser in waves 11 and 12** (`e2e/tuning.e2e.ts`, `e2e/tuning-webkit.e2e.ts`). That
is a gap of one to three waves between writing and observing. It is accepted deliberately, it is why
every acceptance criterion in this plan was a source-level scan, and it is the honest reason the delta
is zero.

## Task Commits

1. **Task 5-09-01: BudgetMeter.svelte — two numbers that never lie and never jitter** — `30494b3` (feat)
2. **Task 5-09-02: BudgetMessage.svelte and StampNotice.svelte — the two message slots** — `4f115af` (feat)
3. **Task 5-09-03: CopyLink.svelte — copy without awaiting** — `a669050` (feat)

## Files Created

- `src/lib/ui/BudgetMeter.svelte` (261 lines) — one `MeterView` in, four states out. Nothing is
  re-derived: `over` and `state` arrive settled from `meterView()`.
- `src/lib/ui/BudgetMessage.svelte` (197 lines) — at most one of the two shapes, over budget winning.
- `src/lib/ui/StampNotice.svelte` (101 lines) — three landings and a fourth that renders nothing.
- `src/lib/ui/CopyLink.svelte` (231 lines) — the button, the confirmed state, the fallback field.

## Acceptance criteria, with the output

### Task 1 — BudgetMeter

**The caption is not monospaced.** `--font-mono` occurs exactly once in the comment-stripped source,
in one rule, and the caption is not in its selector list:

```
.numerals, .percent { font-family: var(--font-mono); font-size: 12px; font-weight: 400;
  line-height: 14px; font-variant-numeric: tabular-nums; text-align: end;
  color: var(--color-ink); transition: color 100ms linear; }
```

The caption's own rule is Quicksand 600 at 12px/14px with `letter-spacing: 0.18em` and
`text-transform: uppercase`, in `--color-ink-quiet` — the Micro role, unchanged.

**No role, no tabindex, over comment-stripped source:**

```
raw length: 9146  stripped length: 3118
non-vacuity - stripping removed something: true
stripped occurrences of role= : 0
stripped occurrences of tabindex : 0
RAW occurrences of role= : 0
RAW occurrences of tabindex : 1
stripped occurrences of --font-mono : 1
grep -c tabular-nums : 2
grep -c meter- : 1
56px derivation present in raw: true | absent from code: true
```

**A note on that, because the plan predicted otherwise.** The plan expected a raw `grep -c "role="` to
go red on the comment that documents *why* there is no `role="meter"`, and it did **not**: the header
explains the rule in prose ("WHY THERE IS NO ARIA ROLE HERE AT ALL") without ever writing the
attribute form. The stripping was genuinely load-bearing for `tabindex` (1 raw, 0 stripped) and
merely correct for `role=`. The scan is the right shape either way; the prediction is what was
slightly off, and it is recorded rather than quietly satisfied.

**The 56px derivation is in a comment, and it is also measured.** The comment carries

```
14 (the region's fixed line box) + 4 (gap) + 8 (bar) = 26
(14 + 4 + 8) x 2 + 4 = 56
```

and a throwaway Chromium render of that file's own `<style>` block reported:

```
measured one meter: 26 px
measured two meters + 4px gap: 56 px
```

Exact, with no fractional pixel. This is the first time the region's 56px half has been observed
rather than asserted.

### The colour-removed legibility check — performed, and the result

Rendered `BudgetMeter.svelte`'s **own** style block (read out of the file, never retyped) over markup
matching its output, in two columns: the shipped `--color-over: #ff3b30`, and the same markup with
the token overridden to `--color-ink` so the red is removed entirely. All four states in both columns.

**Result: the over-budget state is fully legible with the red gone.** With the token neutralised, the
Setup meter still reads:

1. a bar filled to **100%** of its track, unmistakable beside Timer's 71% directly beneath it
2. the **2px outline at 2px offset** around that track — the strongest single signal in the block, and
   it survives the colour change intact because it is a shape, not a hue
3. **`941 / 908`** — numerals above the limit, in a column that also prints the limit
4. **`104%`** — a percentage above 100

Four independent signals in this component alone, none of which is colour. The remaining two of
X-01's six — a disabled `TRY ON DEVICE` with a written reason, and a sentence naming the knob — live
in `TryOnDevice.svelte` and `BudgetMessage.svelte`. **WCAG 1.4.1 is satisfied with `--color-over`
deleted**, which is the test that makes introducing a third hue safe. The token was restored
immediately; the check was performed against an override in a throwaway page, so `src/app.css` and
the component were never edited for it.

**One observation for wave 10 while the render was up.** At the shipped 4px separation between the two
meters, the over meter's outline extends 4px past its track (2px offset + 2px width) and therefore
*exactly meets* the neighbouring meter's caption line box. It overlaps no glyph, and an outline
changes no layout, so the block stays 56px — but the region should not reduce that 4px gap without
looking at the over state again.

### Task 2 — the two message slots

**No sentence is authored in either component.** Over the comment-stripped source, with every module
specifier removed and every attribute value removed:

```
src/lib/ui/BudgetMessage.svelte: 0 string literal(s) over 24 chars outside an attribute value
src/lib/ui/StampNotice.svelte:   0 string literal(s) over 24 chars outside an attribute value
```

**The back-off label is right, over comment-stripped source** — and here the stripping *was*
load-bearing, exactly as the plan predicted:

```
"TURN IT DOWN": raw 1, stripped 0
"PUT IT BACK":  raw 1, stripped 0
"PUT BACK":     raw 1, stripped 0
the label arrives as the imported symbol TURN_IT_DOWN: true
```

All three raw occurrences are in the header paragraph explaining why the control is `TURN IT DOWN`
and deliberately not `PUT IT BACK` — the explanation a raw grep would have punished.

**The transition is opacity only, scanned as declaration values rather than as a word:**

```
declarations collected: 2 (non-vacuity: must be > 0)
  src/lib/ui/BudgetMessage.svelte  transition: border-color 140ms ease-out, color 140ms ease-out
  src/lib/ui/BudgetMessage.svelte  transition: none
declarations naming a height property: 0
declarations naming 'all': 0
(for contrast: the same four words appear 5 times in these style blocks - line-height,
 min-block-size and the like - which is why a bare grep would be the wrong shape)
```

The two collected declarations are the back-off button's hover and its reduced-motion counterpart.
The **slot's own 160 ms appearance is not a CSS declaration at all** — it is
`transition:fade={{ duration: fadeMs }}` from `svelte/transition`, and that is stronger rather than
weaker. `fade` is four lines in `node_modules/svelte/src/transition/index.js`:

```js
export function fade(node, { delay = 0, duration = 400, easing = linear } = {}) {
  const o = +getComputedStyle(node).opacity;
  return { delay, duration, easing, css: (t) => `opacity: ${t * o}` };
}
```

Its `css` function emits `opacity:` and **nothing else**, and its default easing is `linear` — so
"opacity only, 160 ms linear" is a property of the function rather than a declaration a later edit
could widen to `all`. `fadeMs` is 0 under `prefersReducedMotion`, matching NamePlate's pattern.

**`role="status"` is in one file and not the other, over comment-stripped source:**

```
src/lib/ui/BudgetMessage.svelte: stripped 0, raw 0
src/lib/ui/StampNotice.svelte:   stripped 1, raw 1
```

**The three test ids:** `budget-message` and `turn-it-down` in `BudgetMessage.svelte`, `stamp-notice`
in `StampNotice.svelte`.

### Task 3 — CopyLink

**No `await` precedes the clipboard call.** There is no `await` and no `async` anywhere in the file:

```
occurrences of await in the whole comment-stripped file: 0
occurrences of async in the whole comment-stripped file: 0

--- the handler, comment-stripped ---
{
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(copied, fellBack);
    } else {
      fellBack();
    }
}

awaits inside the handler: 0
writeText is followed by .then: true
writeText occurrences in the handler: 1
```

**The URL is a prop, not computed:**

```
shareUrl in comment-stripped source: 0 | in raw source: 0
url is declared in the $props destructure: true
```

Note the plan expected `shareUrl` to appear in the *raw* source (in the comment naming what composed
the string upstream) and therefore expected the stripping to matter here. It does not appear at all:
the header explains the rule without naming the function. The criterion — zero in the stripped
source — is met the stronger way.

**The fallback field is 16px**, and the reason is in the rule beside it:

```
.field { inline-size: 100%; min-block-size: 44px; margin-block-start: 8px; padding-inline: 12px;
  border: 1px solid var(--color-line); border-radius: 2px; background: transparent;
  font-family: var(--font-mono); font-size: 16px; font-weight: 400; color: var(--color-ink); }
```

> 16px is the iOS zoom floor, not a type choice: iOS Safari zooms the viewport when a field under
> 16px takes focus, and this one is `select()`ed the instant it appears. Monospace because a URL is
> machine text.

**The confirm duration is 2000 ms and is a named constant:**

```
declaration: const CONFIRM_MS = 2000;
the constant is what the timer is given: true
bare 2000 elsewhere in code: 0
```

**Both test ids** `copy-link` and `copy-link-fallback` are present.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] The plan's own clipboard handler does not pass `npm run lint`**

- **Found during:** Task 3
- **Issue:** The plan specifies the handler verbatim as
  `navigator.clipboard?.writeText(url).then(confirmed, fellBack) ?? fellBack();`. Shipped as written,
  `npx eslint .` reports
  `CopyLink.svelte 117:5 error Expected an assignment or function call and instead saw an expression
  @typescript-eslint/no-unused-expressions`, and `npm run lint` exits 1. Observed, not predicted: a
  `??` chain is an expression statement, and the rule does not admit it.
- **Fix:** The same three operations as an `if`/`else` — property test, call, `.then` with both
  continuations. Zero awaits, zero asyncs, `writeText` still textually followed by `.then`, and the
  call is still the first thing in its branch with nothing held up in front of it. The plan's own
  four-line comment is preserved verbatim above it, with a fifth paragraph recording why the shape
  differs from the plan.
- **Files modified:** `src/lib/ui/CopyLink.svelte`
- **Commit:** `a669050`

**2. [Rule 3 — Blocking] `LadderView`, `OverBudgetView` and `Landing` cannot be imported by a
component**

- **Found during:** Task 2
- **Issue:** The plan's task 2 specifies `BudgetMessage.svelte`'s props as
  `LadderView | undefined` and `OverBudgetView | undefined`. Both types live in `src/lib/tune/model.ts`,
  which D-18 keeps behind `await import()` because it statically imports `../../vendor/botor/_pad`,
  `../pad` and the Lua engine. `Landing` is in `src/lib/share/stamp.ts`, which imports the vendored
  tree the same way. The standing rule for this wave is that these components may name
  `$lib/tune/view`, `$lib/tune/copy` and `$lib/share/url` and nothing else from the model side.
- **Fix:** All three shapes are declared **structurally** inside the components, narrowed to exactly
  the fields each renders — `{ line }` for a ladder, `{ line, backOff, apply }` for over budget, and
  the four-member `LandingKind` string union. A real `LadderView`, `OverBudgetView` and
  `Landing["kind"]` are each assignable to them, so the compiler checks the shapes agree at wave 10's
  call site, and a renamed field in `model.ts` fails to compile there. This is the established
  `src/lib/sim/host.ts` `HostEngine` pattern (Phase 4): a structural declaration, no import either
  way, no shared file. `config-shape.spec.ts` test 13 passes with all four files in its walk.
- **Files modified:** `src/lib/ui/BudgetMessage.svelte`, `src/lib/ui/StampNotice.svelte`
- **Commit:** `4f115af`

### Interpretations recorded rather than fixed

**3. `aria-busy` is set per meter, not on the meters block.** The UI spec's states table says
"`aria-busy="true"` on the meters block". `BudgetMeter.svelte` is one meter and the block is the
region's (05-10). Setting it here is strictly more precise — each meter has its own feed and they can
differ — and the region remains free to mirror it on the block. The choice is written into the
component's own comment so wave 10 does not set it twice.

**4. Two acceptance scans reported false on correct code; the scans were wrong.**
`url is declared in the $props destructure` was checked with `let[ ]*[{][^}]*url[^}]*[}]`, which
cannot match a destructure carrying a type annotation (the annotation contains `}` before `= $props()`).
`the constant is what the timer is given` was checked with `setTimeout[(][^;]*CONFIRM_MS`, which
cannot match a `setTimeout` whose body contains a statement. Both regexes were fixed and both
criteria then passed. Recorded because the failure mode — a scan that reads red on correct code — is
the one that wastes the most time when it is not written down.

### Not done, deliberately

- **No `.svelte.spec.ts` was created.** The standing rule forbids it and there is no browser Vitest
  project to run one in.
- **`document.execCommand("copy")` was not shipped**, not even behind a capability check. See the
  key decisions.
- **e2e was not re-measured.** Nothing routed imports these files yet.

## Known Stubs

None. Every branch in all four components renders real content from `$lib/tune/copy` or renders
nothing for a documented reason:

- `BudgetMessage` renders nothing when handed neither a ladder nor an over-budget view — the state
  every visitor actually reaches, and the state a Lua entry is always in (D-10).
- `BudgetMessage` renders **no back-off control** when `model.ts` hands over an empty `backOff`
  string. That is the corner where `fit()` is blocked and no knob moved, and there is genuinely
  nothing to turn down; the over-budget line still states the configuration is over 908. This is the
  contract, not a stub.
- `StampNotice` renders nothing for the `none` landing — a URL with no stamp has nothing to explain.
- `CopyLink`'s fallback field is absent until a write fails or `navigator.clipboard` is missing.

None of the four is wired to data yet; `TuningRegion.svelte` (05-10) mounts them. That is the plan's
declared wave order, not an unfinished seam.

## Self-Check: PASSED

```
FOUND: src/lib/ui/BudgetMeter.svelte
FOUND: src/lib/ui/BudgetMessage.svelte
FOUND: src/lib/ui/StampNotice.svelte
FOUND: src/lib/ui/CopyLink.svelte
FOUND: .planning/phases/05-tuning-budgets-and-shareable-links/05-09-SUMMARY.md
FOUND: 30494b3
FOUND: 4f115af
FOUND: a669050
```

Every file this SUMMARY claims was created exists on disk, and every commit hash it cites is in the
log. Nothing was left in the repository by the four throwaway scans or the screenshot: all of them
ran from the scratchpad outside the tree, and `git status --short` is empty apart from this file.
