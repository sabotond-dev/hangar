---
phase: 10
slug: redesign
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-08
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is the Nyquist contract. `docs/TESTING.md` (updated by plan 10-14) is the developer-facing
> companion and deliberately does not duplicate the map below. There is no `docs/VALIDATION.md`.
>
> Binding upstream: `10-UI-SPEC.md` (**approved 2026-09-08 at `c9f8ab7`**, three checker passes),
> `10-CONTEXT.md` (D-01 to D-14) and `10-RESEARCH.md`. Where this document adds a number it is
> measured on this machine and said so; where it amends the spec it is in **Where this document
> amends the approved spec**, by name, with its reason.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x (node env, `expect.requireAssertions`, `passWithNoTests`), two projects — `server` (quick) and `sweep` — plus @playwright/test 1.62.1 over `wrangler dev` on `./build`, two projects: `chromium` and `webkit-phone` grepped on `@webkit` |
| **Config file** | `vite.config.ts` (Vitest) and `playwright.config.ts` — **neither is edited in this phase.** Every new sweep member is named `*.sweep.spec.ts`, which the shipped file-name rule already routes |
| **Quick run** | `npm run test:quick` (= `vitest run --project server`) |
| **Sweep** | `npm run test:sweep` (= `vitest run --project sweep`) — **restructured in 10-08, never re-membered** |
| **Wave run** | `npm run check && npm run lint && npm run test:quick`, plus `npm run test:sweep` for any wave that touches knobs, the stamp, the colour lattice or `src/vendor/` |
| **Full suite** | the wave run plus `npm run build` and `npm run test:e2e -- --workers 3` |
| **Count gate** | `… 2>&1 \| node scripts/check-counts.mjs <files> <tests>` — **baseline + delta only, never a literal total (D-17)** |
| **New dependencies** | **two, both in 10-01/10-02**: `@fontsource-variable/inter@5.3.0` (OFL-1.1, already allowlisted at `gen-licenses.mjs:41`) installed; `@fontsource/quicksand@5.3.0` **uninstalled**. No other package is added, and **`impeccable` is not installed by any plan** — see the D-01 note below |
| **Hardware** | **none, to any agent.** Nothing opens a serial port and nothing deploys. `INSTALL-RUNBOOK.md` row H joins rows A–G, all awaiting the user |

### D-01, resolved without an install task

`impeccable` is **already present on this machine**, at `~/.claude/skills/impeccable/` (`SKILL.md`,
`agents/`, `reference/`, `scripts/`). `10-UI-SPEC.md` §0 was authored through it and its six gates are
answered in that document. `npm ls impeccable` in this repository returns empty and must stay empty:
the skill is a **user-scoped tool**, not a project dependency, and `.claude/` is `export-ignore`d
(`.gitattributes:5`), so it never enters the source archive either way.

> **No plan runs `npx impeccable install`.** The npm package was published 2026-09-06 and the
> registry `latest` is a moving target; re-installing mid-phase would change the instrument the
> approved spec was authored against, for no gain. 10-01 **records** the installed file list and
> asserts that nothing under `src/` or `static/` came from it. `$impeccable teach` and
> `$impeccable document` are **not** run (A-36, Open item 16).

---

## Baselines are NOT known at planning time

Phase 9 closed on 2026-09-07 and nothing has re-measured the tree since. **Task 10-01-01 measures the
block on the clean tree** and reconciles it against 09-VERIFICATION's observations. No number in this
document is asserted anywhere in a plan; every plan asserts a carried name plus a stated delta.

For provenance only, `09-VERIFICATION.md` observed at `08c285e`:
quick **74 / 780 + 1 todo**, sweep **`4 19`**, e2e **89 (2.0m, `--workers 3`)**, `svelte-check`
**567 / 0 / 0**, catalog **36** (9 preset, 27 Lua), `FRONT_DOOR` **8**, `EXCLUDED_FROM_ROW` **28**,
`static/og/` **210,926 bytes over 36 files**. If 10-01 observes something else, **the observation is
the phase's** and every plan quotes it.

### The seven-name carry-forward block, plus four names this phase adds

Phase 9 established the seven. This phase carries all seven verbatim and adds four, because four
numbers in this phase are load-bearing arithmetic that a later plan must not re-derive by eye.

| Name | What it is | How it moves |
|---|---|---|
| `BASE_FILES` | the `test:quick` **file** count on the clean tree Phase 9 closed, measured once in 10-01 | **never moves.** Only 10-14 writes an arithmetic against it |
| `BASE_TESTS` | the `test:quick` **passing test** count on that same clean tree | **never moves.** The todo count is reported and never asserted |
| `PREV_FILES` | the `test:quick` **file** count **as that plan left the tree** | starts equal to `BASE_FILES`; re-measured by every plan that changes it; copied verbatim otherwise |
| `PREV_TESTS` | the `test:quick` **passing test** count as that plan left the tree | moves the way `PREV_FILES` does |
| `BASE_SWEEP` | the literal the sweep printed on the clean tree | **moves once, in 10-08.** If it moves twice, something was misfiled |
| `BASE_E2E` | the Playwright total on the clean tree Phase 9 closed, measured once in 10-01 | **never moves.** 10-14's phase gate asserts against it |
| `PREV_E2E` | the **last measured** Playwright total, with the plan that measured it named beside it | starts equal to `BASE_E2E`; re-measured by 10-04, 10-05, 10-07, 10-13 and 10-14 |
| **`CH_PER_LINE`** | characters per line of Body (16px Inter Variable at line-height 1.5) in the 372px panel content column, **measured in both engines** in 10-01-02 | **never moves after 10-01.** Every reservation and every cap in §12 of the spec is this number's arithmetic. Provisionally 46; the measurement rules |
| **`FONT_SRC`** | which of §5.1's three `url()` candidates was proved under `vite build` **and** `vite preview`, quoted verbatim | **never moves after 10-01.** 10-02 ships exactly the string 10-01 proved |
| **`BASE_SWEEP_WALL`** | the `npm run test:sweep` wall-clock on the clean tree, **before it grows**, with free memory beside it | **never moves.** 10-08 and 10-14 compare against it |
| **`PREV_SWEEP_WALL`** | the last measured sweep wall-clock | re-measured by 10-08 and 10-14 |

Any plan that finds a name missing from the SUMMARY it reads **stops rather than guessing**.
`BASE_CHECK` (the `svelte-check` file count) is provenance only; only `0 errors, 0 warnings` is
asserted, and it is read with `npm run check 2>&1 | grep -Ei "error|warning"` rather than off the
count line.

---

## Facts the map depends on

Read from this repository on 2026-09-08 by the planner, from the sources, not estimated.

- **`src/app.css` declares no `@font-face` today.** It `@import`s two Quicksand static stylesheets
  (`:9-10`) and declares nine `--color-*` tokens, `--font-sans` and `--font-mono` in one `@theme`
  block. There is **no `body::before`** and no halftone anywhere on the page ground — the only
  halftone in the tree is `Splash.svelte:318`, inside the splash. **Layer G is new, not a
  re-parameterisation of something shipped.**
- **`identity.spec.ts` reads `src/app.css` and nothing else**, strips comments first, and its fifth
  test loops every `rgb()` in the file against `^214 255 78 / [0-9.]+$` and every hex against
  `^(#000000|#d6ff4e|#ff3b30)$`. Its third test asserts `--font-sans`'s **first family is
  `"Quicksand"`** and that at least four named fallbacks follow. The token-count regex is
  `(--color-[a-z-]+)\s*:` **scoped to the `@theme` block**, so `--crt` and `--crt-scanline` are
  invisible to it — which is what makes G-01's widening a two-line change rather than a rewrite.
  **Consequence the plans must honour: the `feTurbulence` noise data-URI must not live in
  `src/app.css`**, because a `%23`-encoded hex inside it would be read as a fourth hue. It lives in
  `PadFrame.svelte` (§8.3 puts Layer S there anyway).
- **`Coverflow.svelte`'s five geometry literals are where the spec says.** `.band` at `:948-971`
  carries `--pad-hero: clamp(260px, 52vmin, 560px)`, `position: relative`,
  `inline-size: min(100vw, 1280px)`, `max-inline-size: 100%`, `margin-inline: auto`,
  `overflow: clip`, `overflow-clip-margin: 6px` and the four-stop `mask-image`; `.band.chosen` at
  `:978-980` carries `transform: translateY(-24px)`; the reduced-motion block at `:1036-1047` drops
  both transitions and the chosen transform. `.stage` at `:983-990` is the only element carrying
  `perspective` and `transform-style: preserve-3d`. **All five literals for source-scan 7 exist and
  are quotable today.**
- **`PadFrame.svelte` renders no text at all** and declares its prop as `entry: { id: string }` with a
  comment saying `svelte/no-unused-props` fails an unused declared property. It is 120 lines, three
  absolutely-positioned layers at `inset: 6px` inside a 10px radius. **Layer S's `::after` has a
  clean home; a `demo` prop on this component does not** — see the amendments below.
- **`SimHost.register(id, canvas, engine)` is a three-argument method** (`host.ts:219`). Delivery is
  `if (entry.hero)` at `:415`; `active()`'s `touchActive` term is `entry.hero && (…)` at `:447`; the
  host holds **one** `private readonly sampler = new TouchSampler()` at `:188`; `stillFrame(entry)`
  is private at `:467` and is called from `:244`, `:274` and `:480`. All four line references in the
  spec are correct.
- **All four `restsBlack` entries are browse-only.** `tpad` is excluded from the row by PREV-01;
  `ghost`, `morph` and `etch` are Lua and `front-door.spec.ts:110-112` requires
  `preview === "padsim"` for every row member. **So no demo card ever mounts inside
  `Coverflow.svelte`, and §16's "Coverflow.svelte — nothing at all" survives D-09 as well as the
  CRT.** This is the single most useful fact in this document and it was not in the spec.
- **Tag arrays live in twenty-eight files, not one.** `listing.ts` restates all thirty-six, and
  `listing.spec.ts` asserts `tags` deep-equal to the catalog entry in both directions. The sources are
  twenty-seven `src/lib/catalog/entries/<id>.ts` files (one `tags:` each) and
  `entries/ported.ts` (ten `tags:` occurrences covering the nine presets). **A re-cut that edits only
  `listing.ts` goes red on arrival.**
- **Forty-five `colour` knobs across twenty-five hand-authored entries**, counted by script:
  `console`, `forge` and `strip` carry **three**; fourteen entries carry **two**; eight carry
  **one**; `cull` and `quadrant` carry none. Six of the nine presets carry one
  (`knobs.preset.ts:680-685`); `faders`, `dial` and `tpad` carry none. **31 colour-bearing entries:
  14 with exactly one (no selector), 14 with two, 3 with three.** Every figure in §11.2 and A-10
  checks out.
- **`STAMP_OPTION_CEILING = 32`** (`knobs.lua.ts:34`) and **`HANGAR_FORMAT_LETTERS = ["w","x","y","z"]`**
  (`stamp.ts:92`) — `w` is already reserved and needs no allocation, only an implementation.
- **`install-copy.spec.ts` counts labels by the `_LABEL` suffix** (`:355-358`), failure builders and
  distinct titles at `:403` and `:416`, and utterances as five fixed strings plus the seven announced
  titles at `:428`. Adding `CLEAR_LABEL` and `CLEAR_BUSY_LABEL` moves 7 → 9; adding `LIVE_CLEARED`
  moves 12 → 13. **Both are arithmetic the existing tests already do; only the literals move.**
- **`device-ui.spec.ts:278-306` derives its control list from the presence of a control** and
  requires `min-block-size: 44px` **and** `min-inline-size: 44px` on every interactive class it finds.
  The Bare tier's `auto` width fails it. Confirmed by reading the test.
- **`parseBrowseQuery` drops an unknown `?tag=` silently, on purpose** (`query.ts:104-110`, W-12, with
  a paragraph explaining why). §9.4 reverses that ruling and **the amendment register does not list
  it.** See the amendments below.
- **`git ls-files` returns zero font binaries today.** The only font-shaped tracked path is
  `licenses/@fontsource/quicksand@5.3.0-LICENSE.txt`, which is a `.txt`. §17's phrasing is loose; the
  gate it asks for is still exactly right and 10-01 states the census correctly.
- **The source archive is made by `scripts/postbuild.mjs:82-89`** (`git archive HEAD`), not by
  `scripts/deploy.mjs`. `deploy.mjs` step 5 (`:135-175`) **lists** the archive and refuses on a
  missing lockfile or any `.planning/` leak. The D-13 exclusion mechanism is therefore a
  `.gitattributes export-ignore` line plus a **two-sided** addition to `deploy.mjs` step 5.
- **`e2e/browse.e2e.ts:514-520`'s reduced-motion `dark` exemption reads `restsBlack` from `LISTING`**,
  and `:519` filters on it. Retiring `restsBlack` as a *rendering* input does not touch this line;
  retiring the *exemption* does, and A-18 replaces it with a universal.
- **`reachability.sweep.spec.ts:225-227`** asserts `costed === expected` and
  `costed >= 16000`; `stamp-roundtrip.sweep.spec.ts:151` and `:206` carry `> 16000` and `> 100000`.
  All four are the non-vacuity floors §11.4 re-derives.

---

## Where this document amends the approved spec

The spec is approved and is the contract. Five places need a planner ruling because the spec's own
words cannot be executed in the order it gives them. Each is an amendment by name, with its reason,
and each is carried into the plan that owns it.

| # | Spec text | Why it cannot execute as written | The amendment |
|---|---|---|---|
| **V-01** | §17: `src/lib/ui/aesthetic.spec.ts` — the **seven** source scans — lands in Wave 0, "before a component is written" | Six of the seven scan for `.crt-band`, `body::before`, the pad frame `::after` and the noise tile, **none of which exists on a Wave 0 tree**. Each carries a non-vacuity floor (`expect(count).toBeGreaterThan(0)`), so all six are red on arrival. 09-VALIDATION already named this failure mode: *"an assertion that cannot be true yet is not a gate"* | **The file lands in 10-01 carrying scan 4 only** — the both-directions `Coverflow.svelte` scan, which is **green today and is the one that protects the fragile thing before anything touches it**. Scans 1, 2, 3, 5, 6 and 7 land in **the same commit as the layer each one gates** (10-04), written red-first with the red observed and recorded. §17's intent — "without it the silent-green contrast hole ships" — is satisfied by *same commit*, never by *later* |
| **V-02** | §17 / §8.5: measure Layer S on `/browse/` at thirty-six entries "with Layer S and with `SCREEN: FLAT`", in Wave 0 | `SCREEN: FLAT` is `ScreenToggle.svelte`, and Layer S is `PadFrame.svelte`'s `::after`. Neither exists in Wave 0. The measurement as written requires the thing it is supposed to decide | **The measurement moves to 10-04 task 1, before Layer S's selector is written**, and is taken with a **throwaway injected stylesheet**: a Playwright `addStyleTag` carrying the exact two background layers §8.3 specifies, against the shipped `/browse/`. The "`SCREEN: FLAT`" arm is the same run with no injection. The 2 ms 95th-percentile threshold and its one-line fallback are unchanged. 10-04 task 3 re-takes the reading against the real control and reconciles |
| **V-03** | §17 / §11.4: restructure `reachability.sweep.spec.ts` into two passes "**before** the picker is built", with Pass B costing **all 4,096** colours | Pass B enumerates the colour knob's option list. Today that list is the card's own colour plus a five-member palette. Enumerating 4,096 colours **before** the lattice knob exists would be enumerating unreachable states | **The restructure splits in two, both before the picker.** 10-08 task 1 restructures into Pass A + Pass B **at today's option counts**, re-derives both non-vacuity floors as the two passes' own sum, and records the wall clock. 10-08 task 2 lands the lattice knob and Pass B becomes 4,096 per colour knob; the totals become 19,502 / 24,576 / **44,078** and the wall clock is re-recorded. The picker (10-10) is still downstream of both |
| **V-04** | §16: `src/lib/ui/PadFrame.svelte` gains "the `demo` mode" | `PadFrame` holds no engine, issues no draw call and declares `entry: { id: string }` precisely so `svelte/no-unused-props` stays green. A `demo` prop on it would be an unused prop and a lint failure, and the component it would have to reach is `PadCanvas` → `SimHost.register` | **The `demo` flag is a fourth argument to `SimHost.register(id, canvas, engine, options?)`**, passed from `CatalogCard.svelte` (the only surface that mounts a dark entry — see the facts above). `PadFrame.svelte` gains **Layer S and its header amendment only**. §16's row is amended by name in 10-05's SUMMARY |
| **V-05** | §9.4: an unmapped `?tag=` "becomes the search query" | `query.ts:104-110` drops an unknown tag **on purpose**, under 05.1's W-12, with a written argument. §3.2's nine gate amendments **do not list `query.spec.ts`**, so the register under-counts by one | **W-12 is a tenth gate amendment, G-10**, rewritten rather than deleted, in 10-07. The precedence the spec leaves open is ruled here: **an explicit `?q=` always wins.** An unmapped `?tag=` becomes `q` only when `q` is empty; two unmapped tags join with a single space in address order. A *mapped* value becomes its facet chip and never touches `q` |

Three further discrepancies are **recorded, not amended**, because nothing depends on them:
`git ls-files`'s "one font-shaped path" is a `.txt` (§17); the archive is written by
`postbuild.mjs`, not `deploy.mjs` (§16, §18); and `05.1-UI-SPEC.md:94-95,154` still lists `MORE TAGS`
as a shipped control that `BrowseToolbar.svelte:44-52` says was never built — A-20 already rules on it
and 10-06 corrects the document in passing.

---

## Why the waves are serial

No two plans in this phase run concurrently, for the arithmetic reason Phases 5.1, 6, 7 and 9 gave:
every acceptance criterion asserts an exact cumulative count, and two plans landing in the same wave
would both compute the wrong total. There is a second reason here and it is stronger than Phase 9's:
**`src/app.css` is touched by four plans, `install-copy.ts` by three, `listing.ts` by two, and
`device-ui.spec.ts` by four.** The `wave` numbers in the frontmatter are dependency groupings, one
plan each; `depends_on` names the previous plan explicitly.

---

## Expected deltas after each plan

Deltas are the planner's estimate and are **reconciled, never asserted**, except where a plan names a
per-file count. The `test:quick` file column counts spec files added or removed.

| Plan | Wave | `test:quick` files | `test:quick` tests | `test:sweep` | `test:e2e` | Notes |
|---|---|---|---|---|---|---|
| 10-01 | 1 | **+2** | **+6** | `BASE_SWEEP` (measured) | unchanged (measured) | `aesthetic.spec.ts` (1), `font-assets.spec.ts` (5) |
| 10-02 | 2 | +0 | **+1** | unchanged | unchanged | `identity.spec.ts` 6 → 7 |
| 10-03 | 3 | +0 | **+0** | unchanged | unchanged | every count held; strings and caps move inside |
| 10-04 | 4 | +0 | **+6** | unchanged | **+8** | `aesthetic.spec.ts` 1 → 7; `aesthetic.e2e.ts` 4 titles × 2 projects |
| 10-05 | 5 | **+1** | **+5** | unchanged | unchanged (measured) | `demo.spec.ts` (2), `host.spec.ts` +3 |
| 10-06 | 6 | **+1** | **+4** | unchanged | unchanged | `facets.spec.ts` (4) |
| 10-07 | 7 | +0 | **−1** | unchanged | **−2** | `sort.spec.ts` loses the NEWEST date-block test; the browse sort walk drops one option in both projects |
| 10-08 | 8 | +0 | **+0** | **moves once** | unchanged | three sweep files restructured inside; counts held |
| 10-09 | 9 | +0 | **+3** | unchanged | unchanged | `tune-ui.spec.ts` +2, `surprise.spec.ts` +1 |
| 10-10 | 10 | **+1** | **+6** | unchanged | unchanged | `colour-picker.spec.ts` (6) |
| 10-11 | 11 | +0 | **+2** | unchanged | unchanged | `tune-ui.spec.ts` +2 |
| 10-12 | 12 | +0 | **+4** | unchanged | unchanged | `install.spec.ts` +3, `session.spec.ts` +1 |
| 10-13 | 13 | +0 | **+3** | unchanged | **+4** | `device-ui.spec.ts` +3; `install.e2e.ts` +2 × 2 projects |
| 10-14 | 14 | +0 | +0 | unchanged | unchanged (measured) | the gate |
| **Phase total** | | **+5** | **+39** | **+1 restructure** | **+10** | reconciled at 10-14, never asserted before it |

**A wave asserts against `PREV_FILES` / `PREV_TESTS`**, the tree the previous plan left. **Only 10-14
asserts against `BASE_FILES` / `BASE_TESTS`**, and its number is the phase total written out as a
chain, not as a total alone.

Per-file counts, which **are** asserted absolutely:

| File | Tests | Plan |
|---|---|---|
| `src/lib/ui/aesthetic.spec.ts` | **1**, then **7** | 10-01 (created), 10-04 |
| `src/lib/ui/font-assets.spec.ts` | **5** | 10-01 (created) |
| `src/lib/ui/identity.spec.ts` | 6 → **7** | 10-02 |
| `e2e/aesthetic.e2e.ts` | **4** titles, both projects | 10-04 (created) |
| `src/lib/sim/demo.spec.ts` | **2** | 10-05 (created) |
| `src/lib/sim/host.spec.ts` | +3 | 10-05 |
| `src/lib/browse/facets.spec.ts` | **4** | 10-06 (created) |
| `src/lib/browse/sort.spec.ts` | 6 → **5** | 10-07 |
| `src/lib/browse/filter.spec.ts` | **6**, unchanged (rewritten inside) | 10-06, 10-07 |
| `src/lib/catalog/copy.spec.ts` | **5**, unchanged (`KNOWN_TAGS` re-cut) | 10-06 |
| `src/lib/tune/colour-picker.spec.ts` | **6** | 10-10 (created) |
| `src/lib/ui/tune-ui.spec.ts` | 5 → **9** | 10-03, 10-09, 10-11 |
| `src/lib/ui/device-ui.spec.ts` | 11 → **14** | 10-03, 10-13 |
| `src/lib/device/install-copy.spec.ts` | **6**, unchanged (four caps, nine labels, thirteen utterances) | 10-03, 10-12 |
| `src/lib/device/install.spec.ts` | 18 → **21** | 10-12 |
| `src/lib/device/session.spec.ts` | **21**, unchanged (test 15's needles 9 → 10) | 10-12 |
| `src/lib/device/session-copy.spec.ts` | **6**, unchanged (tests 5 and 6 rewritten) | 10-03 |
| `src/lib/catalog/listing.spec.ts` | **5**, unchanged (the note test rewritten, one field dropped) | 10-05, 10-07 |
| `src/lib/tune/reachability.sweep.spec.ts` | **2**, unchanged (two passes inside) | 10-08 |
| `src/lib/share/stamp-roundtrip.sweep.spec.ts` | unchanged (two passes inside, format `w`) | 10-08 |
| `src/lib/catalog/lua-entries.sweep.spec.ts` | **6**, unchanged (27-literal colour sample) | 10-08 |

Standing gates that must be green at the phase gate and are **not** edited:
`src/lib/fidelity/vendored-diff.spec.ts` (**14**), `src/lib/fidelity/lua-parity.spec.ts` (**5**),
`src/lib/fidelity/preset-baseline.spec.ts`, `src/lib/protocol-pin.spec.ts`,
`src/lib/sim/paint.spec.ts` (**the four painter prohibitions, untouched, and they are what forbids
`hue-rotate` in the glitch**), `src/lib/catalog/front-door.spec.ts` (**8**),
`src/lib/catalog/frames.spec.ts` (**5**), `src/lib/sim/lazy.spec.ts` (**3**),
`e2e/catalog.e2e.ts` (**2**), `e2e/fidelity.e2e.ts`.

---

## The new cost

| Suite | Threshold | If exceeded |
|---|---|---|
| `src/lib/tune/reachability.sweep.spec.ts` | **32,852 → 44,078 states, +34%.** Already past 05-VALIDATION's 60 s threshold at 32,852. The 600,000 ms timeout is **unchanged** | record `BASE_SWEEP_WALL` in 10-01 **before it grows**, the restructured figure in 10-08 task 1, and the lattice figure in 10-08 task 2. **Do not trim what it covers** |
| `src/lib/share/stamp-roundtrip.sweep.spec.ts` | compiler half 32,852 → **44,078**; Lua half 276,160 → **234,784** (−15%, pure index arithmetic, no minifier) | the Lua half gets *cheaper*; if it does not, the two passes were cross-producted |
| `src/lib/catalog/lua-entries.sweep.spec.ts` | 701 → **1,728** combinations, 1,402 → **3,456** minifier-backed measurements. **Not 184,833** — the colour dimension is a 27-literal, length-complete sample, justified at `:358-384` | if it approaches the enumeration figure, the sample was replaced by a cross-product |
| `npm run build` | 12 s at sixteen entries, projected 16–20 s at thirty-six (09-VALIDATION). 10-05 adds a demo-path replay per dark entry to `gen-og.mjs` | record it in 10-05 and 10-14 |
| `npm run test:e2e -- --workers 3` | 89 titles / 2.0 min at 1.56 GB free. **+10 titles** this phase | record the wall time and the free memory beside every e2e run |
| `test:quick` memory | the 2026-09-05 timeouts happened at 0.8–1.7 GB free | record free memory beside every quick run |

---

## Requirement ownership

`.planning/ROADMAP.md` maps **TBD** to Phase 10. This document fixes the list. Every requirement below
is either extended, amended or closed by a named plan, and 10-14 writes each qualifier.

| Requirement | Owned by | Ruling |
|---|---|---|
| **IDENT-01** | 10-02, 10-04 | **Extended.** Nine tokens, three hexes, no tenth and no fourth hue — through a font swap, two texture members outside the ladder and four CRT layers. `--font-display` is added and asserted equal to **every** display `@font-face` family in the file |
| **IDENT-02** | 10-04, 10-05 | **Extended.** The reduced-motion contract now covers a compositor-level overlay the canvas-backing-store assertions cannot see, and a demo path that replays once and freezes |
| **SAFE-01** | 10-03, 10-12 | **Kept whole, mechanism changed** (35 characters on the control) **and extended to a fourth click.** `REQUIREMENTS.md:169` amended by name and dated, twice: the `SAFE_PROMISE` closure record and "one of three clicks" → four, with `WRITE_CLICKS` replacing the word |
| **SAFE-02** | 10-13 | **Kept verbatim.** D-04's sequence is a caption, DOM order and enablement; CLEAR takes a fourth tier that is neither Primary nor Quiet |
| **SAFE-03 / SAFE-04** | 10-12, 10-13 | **Extended.** CLEAR refuses without a snapshot; `PUT BACK` is offered after it; the snapshot key is read and never written |
| **SAFE-05** | 10-13 | **Extended.** A second confirmation block naming what is removed and what a power cycle brings back |
| **SAFE-07** | 10-12 | **Kept verbatim.** `cleared` means both `CONFIG/ACKNOWLEDGE` frames arrived, never a resolved writer promise |
| **PREV-03** | 10-03 | **Closed at 44 characters instead of 231.** It is `Pending` today; the shorter line is what closes it |
| **CONN-03** | 10-03 | **Amended.** The pre-click explanation is retired; `SAFE_NOTE` plus the browser's own prompt satisfy the intent |
| **CAT-02** | 10-07 | **Amended.** Three sorts become two |
| **CAT-03 / CAT-04** | 10-06, 10-07 | **Amended.** Fifty-five terms become sixteen in two facets; OR within, AND across |
| **TUNE-01** | 10-10 | **Amended by one clause.** "Three to six knobs" counts knobs, not controls |
| **TUNE-05** | 10-08 | **Stays proven-unreachable, for a stronger reason.** The worst state on the shelf is `tpad` at 907 of 908 and `tpad` has no colour knob; the dearest colour-bearing preset leaves **268** characters free |
| **SHARE-01 / SHARE-03** | 10-08 | **Extended.** Format `w`; format `x` keeps decoding forever |
| **DEGR-02** | 10-13 | **Extended.** CLEAR joins the present-but-disabled set with its reason inline |
| **CONT-03** | 10-06 | **Amended.** "Four feel tags" becomes exactly three: one `FOR`, two `FEELS` |

---

## Sampling Rate

- **After every task:** `npm run test:quick`, plus `npm run lint` when the task touched a source file,
  plus the per-file gate commands the plan names. Free memory recorded beside every quick run.
- **After every wave:** `npm run check 2>&1 | grep -Ei "error|warning"`, `npm run lint`,
  `npm run test:quick`. Add `npm run test:sweep` for 10-08 and 10-14 only. Add `npm run build` for
  any wave that touches `src/app.css`, `static/`, `scripts/` or a prerendered page — then
  **`npm run test:quick` again**, because `config-shape.spec.ts` test 14 and `og/build.spec.ts` read
  `build/`.
- **e2e runs in five waves only** — 10-04, 10-05, 10-07, 10-13 and 10-14 — at `--workers 3`, with
  `test-results/` removed by hand afterwards and `git status --porcelain` confirmed empty. No other
  wave runs e2e, because no e2e title moves in it and a two-minute run buys nothing.
- **Max feedback latency:** ~35 s (quick), ~2 min (wave with a build), ~5 min (wave with e2e),
  ~10 min (10-08 and 10-14, with the sweep).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command / evidence | File Exists | Status |
|---------|------|------|-------------|-----------|------------------------------|-------------|--------|
| 10-01-01 | 01 | 1 | all | precondition + baseline | Phase 9 closed; the eleven-name block measured on a clean tree; `BASE_SWEEP_WALL` and free memory recorded; `impeccable` file list recorded and nothing under `src/`/`static/`; `git ls-files` font census stated; `git status --porcelain` empty | n/a | pending |
| 10-01-02 | 01 | 1 | IDENT-01 | measured + build | `FONT_SRC` proved under `vite build` **and** `vite preview` with the asset fetched 200; `CH_PER_LINE` measured in `chromium` and `webkit-phone`; the five reservations and four caps re-derived and tabulated | `/dev/type/` created here | pending |
| 10-01-03 | 01 | 1 | IDENT-01, IDENT-02 | unit (source scan) | `font-assets.spec.ts` **5**; `aesthetic.spec.ts` **1** (Coverflow both directions); two negative checks red with both files named | created here | pending |
| 10-02-01 | 02 | 2 | IDENT-01 | unit + build | `src/app.css` carries the Inter face at `FONT_SRC`, the one swappable Grifter block and `--font-display`; `--crt-scanline` declared; `npm run build` green; the woff2 served 200 from `/fonts/` | exists | pending |
| 10-02-02 | 02 | 2 | IDENT-01 | unit | `identity.spec.ts` **7**: nine tokens, three hexes, the widened `rgb()` regex, `--font-sans` leads `"Inter Variable"`, `--font-display`'s first family equals **every** display `@font-face` family; three negative checks red | exists | pending |
| 10-02-03 | 02 | 2 | FOUND-02 | unit + script | Quicksand uninstalled, `npm run licenses` clean and the stale `licenses/` file gone; the Grifter record present; `.gitattributes export-ignore` plus the replacement note; `deploy.mjs` step 5 asserts the archive **omits** the binary and **carries** the note; `font-assets.spec.ts` still **5** and now allowlisting exactly one path | exists | pending |
| 10-03-01 | 03 | 3 | SAFE-01, CONN-03 | unit | R-01, R-02, R-03, R-08 landed; `SAFE_NOTE` **35** on both primary surfaces in every state; `session-copy.spec.ts` **6**; `REQUIREMENTS.md:169` amended and dated; negative check red | exists | pending |
| 10-03-02 | 03 | 3 | PREV-03, SHARE-01 | unit | R-04 at **44**, R-05 at **70**, R-06 at **90**, R-07 removed, R-09 at **53**; `HONESTY_CAP` **92**, `PUT_BACK_CAP` **138**, `KEEP_CAP` **92**; `install-copy.spec.ts` **6**; every string counted by script with its number stated | exists | pending |
| 10-03-03 | 03 | 3 | SAFE-02 | unit | header note **24px**, honesty slot **48px**, `PUT BACK` **72px**, `KEEP` **48px**; the meters block **56px** and the region **152px** untouched; `device-ui.spec.ts` and `tune-ui.spec.ts` green; two negative checks red | exists | pending |
| 10-04-01 | 04 | 4 | IDENT-01 | measured + unit | the Layer S A/B measurement recorded for both engines with the 2 ms verdict stated; Layer G, Layer S and the `--crt` gate shipped; `aesthetic.spec.ts` **5**; the `PadFrame` header amended | exists | pending |
| 10-04-02 | 04 | 4 | IDENT-01, IDENT-02 | unit + source | `.crt-band` in `FrontDoor.svelte` with all five literals string-equal to `.band`'s; Layers R and T; `ScreenToggle.svelte`; `aesthetic.spec.ts` **7**; `git diff -- src/lib/ui/Coverflow.svelte` **empty** | exists | pending |
| 10-04-03 | 04 | 4 | IDENT-02 | e2e | `e2e/aesthetic.e2e.ts` **4** titles, both projects, each with its non-vacuity assertion first, `SCREEN: TEXTURED` selected and `hardwareConcurrency` forced; e2e `PREV_E2E + 8` | created here | pending |
| 10-05-01 | 05 | 5 | IDENT-02, PREV-01 | unit | `demo.ts` with four paths; `host.ts`'s three plumbing changes plus `stillFrame()`'s second branch; `host.spec.ts` **+3**; `demo.spec.ts` **2**; the rate contract asserted unchanged | created here | pending |
| 10-05-02 | 05 | 5 | CONT-03 | unit | R-10 retired; `restsBlack` kept as a recorded fact and gone as a rendering input; `listing.spec.ts` **5**; `copy.spec.ts` **5**; negative check red | exists | pending |
| 10-05-03 | 05 | 5 | PREV-01 | e2e + build | `gen-og.mjs` runs each demo path to its end; ETCH's OG is no longer a black square and its byte count is stated; `browse.e2e.ts`'s `dark` exemption replaced by the universal; e2e `PREV_E2E` | exists | pending |
| 10-06-01 | 06 | 6 | CAT-03 | unit + source | `facets.ts` with sixteen terms, two facets, OR/AND, the legacy map; **imports nothing at runtime**, scanned; `facets.spec.ts` **4** including both health rules | created here | pending |
| 10-06-02 | 06 | 6 | CONT-03 | unit | all thirty-six tag arrays re-cut in **twenty-eight source files** and in `listing.ts`; exactly one `FOR` and two `FEELS` each; `listing.spec.ts` both directions green; the 36 / 72 slot sums stated | exists | pending |
| 10-06-03 | 06 | 6 | CAT-03 | unit + docs | `KNOWN_TAGS` **16**; both `RECORDED` blocks re-cut; `05.1-UI-SPEC.md`'s census and its `MORE TAGS` rows amended by name; two negative checks red | exists | pending |
| 10-07-01 | 07 | 7 | CAT-02 | unit | Newest removed: `BROWSE_SORTS` **2**, `newestOrder` and `orderFor`'s middle branch gone, `sort.spec.ts:82`'s literal and `:179`'s date-block test retired by name; `sort.spec.ts` **5**; `addedAt` out of `ListingEntry` | exists | pending |
| 10-07-02 | 07 | 7 | CAT-03, CAT-04 | unit | `?for=` / `?feels=`; **G-10**: an unmapped `?tag=` becomes `q` only when `q` is empty, in address order, space-joined; a mapped one becomes its chip; `?sort=newest` falls back silently; `query.spec.ts` green | exists | pending |
| 10-07-03 | 07 | 7 | CAT-03 | unit + e2e | two facet rows, three chips per card, the outsider-chip branch and the count-derived row retired, `disabledTags()` kept; the `FOR` link row on `/` with `front-door.ts` still import-free and the ring still **8**; e2e `PREV_E2E − 2` | exists | pending |
| 10-08-01 | 08 | 8 | TUNE-05 | sweep | the two-pass restructure at today's option counts in all three sweep files; both non-vacuity floors re-derived as the passes' own sums; `PREV_SWEEP_WALL` recorded; negative check red on a shrunken enumeration | exists | pending |
| 10-08-02 | 08 | 8 | TUNE-01, TUNE-05 | unit + sweep | the lattice colour knob: `read(apply(state, i)) === i` by construction over all 4,096; Pass A **19,502**, Pass B **24,576**, total **44,078**; `ninepads` **640 of 908**, 268 free; zero Pass B states over 908; the wall clock re-recorded | exists | pending |
| 10-08-03 | 08 | 8 | SHARE-01, SHARE-03 | unit + sweep | format `w` emits and decodes; **a format `x` stamp made before this plan still lands `restored`**, asserted with a captured literal; the Lua half **234,784**, the compiler half **44,078**; `lua-entries.sweep` **1,728** combinations on the 27-literal sample | exists | pending |
| 10-09-01 | 09 | 9 | TUNE-04 | unit | `HOLD` / `HELD` per knob, `aria-pressed`, 44px both axes, the held default marker as a 2px `--color-line` bar; `SURPRISE ME` disabled when every knob is held with its **53**-character reason; `surprise.spec.ts` +1 covering the newly reachable twelve-draw exhaustion | exists | pending |
| 10-09-02 | 09 | 9 | TUNE-02 | unit | the forecast: `cost()` only, memoised on the index vector, `@media (hover: hover)` and focus-visible, never on touch; the ghost fill unanimated; the signed delta in `--font-mono` with U+2212; the hidden expansion at **44**; `--color-over` still exactly three uses | exists | pending |
| 10-10-01 | 10 | 10 | TUNE-01 | unit | `ColourPicker.svelte`: three 16-detent rails on the existing detent-track widget, one result pad, the knob selector on the seventeen multi-colour entries and **not rendered** on the fourteen single ones; `colour-picker.spec.ts` **6** | created here | pending |
| 10-10-02 | 10 | 10 | TUNE-01, IDENT-01 | unit + source | A-09's fence asserted by name: no HSV field, no hue ring, no SV square, no CSS gradient on a rail, no `<input type="color">`, no `filter` anywhere in the file; every filled pixel a flat stored RGB444; the cheap-step ticks; the unaffordable-detent guard proven on a synthetic over-budget knob and **measured as never firing** on the shelf | exists | pending |
| 10-11-01 | 11 | 11 | TUNE-04 | unit | `MixTwo.svelte`: two parents, four children, `child[k] = coin() ? a[k] : b[k]` plus one `surpriseIndices` mutation, held knobs never crossed and never mutated, taking one makes the previous state `THAT ONE`; zero new reachable states | created here | pending |
| 10-11-02 | 11 | 11 | TUNE-04 | unit | six canvases on the worst entry, every one `IntersectionObserver`-gated; the 160 ms opacity-only arrival; **no tear on the tune panel**, asserted by `aesthetic.spec.ts` scan 3's allowlist staying closed | exists | pending |
| 10-12-01 | 12 | 12 | SAFE-03, SAFE-07 | unit | `InstallAction` **4**, `cleared` the fifteenth phase, `WRITABLE_PHASES` gains it, two `CONFIG/EXECUTE` frames and **no `PAGESTORE`**; `cleared` from both ACKs only; enablement exactly `phase ∈ WRITABLE_PHASES && snapshot != null && capability.canWrite`; `install.spec.ts` **21** | exists | pending |
| 10-12-02 | 12 | 12 | SAFE-01 | unit | `install-copy.ts`: **9** labels, **13** utterances, **7** failure builders unchanged, **4** caps; `WRITE_CLICKS` length 4 and equal to the four control labels; `install-copy.spec.ts` **6**; `session.spec.ts` test 15's needles **10**; `install.spec.ts` test 4 counts CLEAR's class | exists | pending |
| 10-13-01 | 13 | 13 | SAFE-02, SAFE-05 | unit | `Clear.svelte` Bare tier at `letter-spacing: 0.28em` — **grep-proved unique** — with both 44px axes, its 48px cell and its three reasons; `ClearConfirm.svelte` replacing the control that opened it; `device-ui.spec.ts` **14** | created here | pending |
| 10-13-02 | 13 | 13 | SAFE-02, DEGR-02 | unit | the `NEXT` caption, the second hairline at 24 / 1px / 24, the `CLEARED` block, CLEAR's details on the three reused failure states; DEGR-02 present-but-disabled with the reason inline; SAFE-02's weights unchanged | exists | pending |
| 10-13-03 | 13 | 13 | SAFE-03, DEGR-02 | e2e + docs | `install.e2e.ts` +2 titles across both projects walking clear → `cleared` → `PUT BACK` → `restored` against the fake; `INSTALL-RUNBOOK.md` **row H**; `docs/TESTING.md:840` "the three clicks" → four; e2e `PREV_E2E + 4` | exists | pending |
| 10-14-01 | 14 | 14 | all | measured + docs | every projection in this document replaced by an observation; `docs/TESTING.md` re-measured; `deferred-items.md` written; ROADMAP's `Requirements: TBD` replaced by the owned list | exists | pending |
| 10-14-02 | 14 | 14 | all | phase gate | quick `BASE_FILES + 5` / `BASE_TESTS + 39` written as a chain, sweep restructured, e2e `BASE_E2E + 10`, against a fresh production build; `git diff --stat HEAD -- src/vendor/` empty; the archive listed and the font absent from it | exists | pending |
| 10-14-03 | 14 | 14 | SAFE-03, SAFE-05 (hardware) | **checkpoint:human-verify** | not automatable — `INSTALL-RUNBOOK.md` row H on a real ZONA, plus the three Open-for-the-user reversals restated with their measured costs | n/a | pending |

*Status: pending / green / red / flaky. Every row starts pending; an executing plan updates only its own rows.*

---

## Wave 0 Requirements

None is a framework gap. Vitest, Playwright, both browser binaries, `wrangler`, `svelte-check`, ESLint
and Prettier are installed and pinned. The gaps are two measurements, one proof and two files.

- [ ] **Phase 9 closed and the eleven-name block measured** → **10-01-01** (a precondition, not a file)
- [ ] **`FONT_SRC` proved** — one of §5.1's three candidates, under `vite build` **and**
      `vite preview`, with the built stylesheet's `url()` fetched and its status stated → **10-01-02**
- [ ] **`CH_PER_LINE` measured** in both engines and the nine dependent numbers re-derived →
      **10-01-02**
- [ ] **`BASE_SWEEP_WALL` recorded before the sweep grows** → **10-01-01**
- [ ] `src/lib/ui/font-assets.spec.ts` — no tracked `.woff|.woff2|.ttf|.otf` outside `licenses/`
      without an allowlist entry carrying a licence record → **10-01-03** (created)
- [ ] `src/lib/ui/aesthetic.spec.ts` — **scan 4 only**, both directions on `Coverflow.svelte`
      (V-01) → **10-01-03** (created); scans 1, 2, 3, 5, 6, 7 → **10-04**, in the layers' own commits
- [ ] `e2e/aesthetic.e2e.ts` → **10-04-03** (created), with the Layer S measurement taken at
      **10-04-01** by injected stylesheet (V-02)
- [ ] The two-pass sweep restructure → **10-08-01** at today's option counts, **10-08-02** at the
      lattice (V-03), both before the picker at 10-10

---

## What the fixtures and gates prove

**`src/lib/ui/aesthetic.spec.ts` scan 4 is the phase's most valuable single assertion, and it lands
first.** It asserts `Coverflow.svelte` in **both** directions: `.stage` declares none of `filter`,
`mix-blend-mode`, an `opacity` below 1, `mask-image` or `contain: paint`; and `.band` **still
declares** `overflow: clip` and `mask-image` while a slot **still declares** inline `opacity` and
`filter: brightness(`. A scan that only forbade would go green on a tidy-up that deleted the band's
mask. Landing it in Wave 0 means every later plan is working with a net under the one file the phase
promises not to touch.

**`e2e/aesthetic.e2e.ts` exists because the shipped reduced-motion assertions would lie.**
`browse.e2e.ts:140-148` and `first-experience.e2e.ts:87` read the 9×9 canvas **backing store**. A CSS
overlay painted above the canvas by the compositor never touches it. A sweeping bar over the pads
would leave every existing reduced-motion assertion green.

**`identity.spec.ts` computes contrast from the declared alpha, and after this phase that is still a
true statement about rendered pixels** — not because the computation changed, but because §8.3 makes
the overlay structurally unable to reach a text node, and `aesthetic.spec.ts` scan 3 asserts that
structurally. The honesty of the number is a property of the source rather than of somebody's care.

**`font-assets.spec.ts` catches what `npm run licenses` cannot see.** `gen-licenses.mjs` runs
`license-checker-rseidelsohn --production` and inspects the npm tree only. A hand-committed `.woff2`
sails through `npm run licenses`, `npm run build` and `npm run deploy` and lands in the public source
tarball. After 10-02 there is exactly one allowlisted font path and its record is D-13's: family,
licensee and licence name, **not** an SPDX identifier and **not** a redistributable file.

**The sweeps are budget gates valid only at the current protocol pin.** Canonical compressed form is a
property of a specific minifier version. `docs/PIN-POLICY.md` item 4 carries that, and this phase
raises its stake again: after 10-08 the pin also decides whether 4,096 lattice literals fit.

**`lua-entries.sweep.spec.ts`'s colour sample is a sample and says so.** Twenty-seven literals — the
3 × 3 × 3 combinations of a one-, two- and three-digit channel — are **length-complete**: every
reachable literal length (3 to 9 digits) and every per-channel digit count in every position appears,
including the all-longest corner the budget claim rests on. The justification is already written at
`:358-384`; 10-08 quotes it rather than restating it.

---

## Manual-Only Verifications

`docs/INSTALL-RUNBOOK.md` gains **row H** — clear, verify dark, `PUT BACK`, verify restored — joining
Phase 6's A–F and Phase 7's A–G, all still awaiting the user. Row H is not a formality:

| row | Why a test is not evidence |
|---|---|
| **H** | The fake acknowledges what it is told to acknowledge. Only a module can show that two empty `CONFIG/EXECUTE` frames leave the touch element **actually dark** rather than merely acknowledged, that a power cycle brings back whatever is stored, and that `PUT BACK` after a clear restores what was there at connect. It is also the first row that asks a person to make their own hardware do nothing on purpose |

Everything in `docs/HARDWARE-AUDITION.md` (thirty-two rows) remains the user's and unanswered.

> **No agent connects to or writes to a device in this phase, and no agent deploys.**

---

## Negative checks (observe red before trusting)

Every one is reverted with `git checkout --` and every one is recorded in its plan's SUMMARY with both
exit codes and the failing message. **`git add` any new file before perturbing it**: on an untracked
path `git checkout --` fails outright and `git diff --quiet` passes vacuously. Every restored file is
confirmed byte-identical with `git diff --quiet -- <path>`.

| Plan | Perturbation | Expected red |
|---|---|---|
| 10-01 | add `static/fonts/probe.woff2` (empty file), `git add` it | `font-assets.spec.ts` test 1, naming the path and saying it is not allowlisted |
| 10-01 | delete `mask-image` from `Coverflow.svelte`'s `.band` rule | `aesthetic.spec.ts` scan 4, naming `.band` and `mask-image` — **the direction the first spec pass had backwards** |
| 10-02 | change `--font-display`'s first family to `"Archivo"` while leaving the `@font-face` at `"Grifter"` | `identity.spec.ts` test 3, naming both strings |
| 10-02 | add `--color-crt: rgb(0 0 0 / 0.5)` inside `@theme` | `identity.spec.ts` test 1 on the tenth token — proving the widened `rgb()` regex did **not** widen the ladder |
| 10-02 | move `--crt-scanline` out of `app.css` into `PadFrame.svelte`'s `<style>` | `identity.spec.ts` green and `aesthetic.spec.ts` red — **and the difference is the finding** §7.1 predicts |
| 10-03 | lengthen `HONESTY_READY` by three characters | `install-copy.spec.ts`'s cap test naming `HONESTY_CAP` and 92 |
| 10-03 | restore `SAFE_PROMISE`'s 88-character literal | `session-copy.spec.ts` test 5, and the header-note twin at 24px |
| 10-04 | set `opacity: 0.99` on `.stage` | `aesthetic.spec.ts` scan 4, naming `.stage` and `opacity` |
| 10-04 | change `.crt-band`'s `clamp(260px, 52vmin, 560px)` to `clamp(260px, 50vmin, 560px)` | `aesthetic.spec.ts` scan 7, naming **both** files |
| 10-04 | add a `<p>` inside `.crt-band` | `aesthetic.spec.ts` scan 3, naming `FrontDoor.svelte` and quoting its allowlist condition |
| 10-04 | remove `navigator.hardwareConcurrency`'s forcing from `aesthetic.e2e.ts` test 1 | the test's own non-vacuity assertion, on a four-core runner — run it under a forced `4` to observe |
| 10-05 | delete the `entry.demo` term from `host.ts:415`'s delivery gate | `host.spec.ts`'s demo-delivery test, naming the entry |
| 10-05 | give a demo entry the host's shared sampler again | the contention test: five contacts exhausted with a hero finger down |
| 10-05 | set ETCH's `restsBlack` to `false` | `frames.spec.ts` test 5, naming `etch` — proving `restsBlack` survived as a **recorded fact** |
| 10-06 | give one entry two `FOR` terms | `facets.spec.ts` health rule 1, naming the entry and both terms |
| 10-06 | drop `still` to five carriers | `facets.spec.ts` health rule 2, naming the term and the floor of six |
| 10-06 | re-cut `listing.ts` only, leaving `entries/arc.ts` alone | `listing.spec.ts`'s both-directions equality, naming `arc` and `tags` |
| 10-07 | restore `"newest"` to `BROWSE_SORTS` | `sort.spec.ts:125`'s comparator sweep **self-adjusts and passes**, while the toolbar walk and `:82`'s list go red — **the asymmetry is the finding** |
| 10-07 | make an unmapped `?tag=looper` drop instead of landing in `q` | `query.spec.ts`'s G-10 test, naming `looper` |
| 10-08 | remove one preset from Pass A's enumeration | `reachability.sweep.spec.ts`'s `costed === expected`, naming the shortfall |
| 10-08 | emit format `w` for a stamp the fixture captured as `x` | the wild-link test: the captured `x` literal must still land `restored` |
| 10-09 | hold every knob and leave `SURPRISE ME` enabled | `tune-ui.spec.ts`'s exhaustion test |
| 10-10 | put a `linear-gradient` on a picker rail | `colour-picker.spec.ts`'s A-09 fence, naming the declaration |
| 10-10 | give one detent a colour that is not a multiple of 17 | the lattice test, naming the index and the channel |
| 10-11 | let a held knob be crossed | `MixTwo`'s crossover test, naming the knob |
| 10-12 | resolve `cleared` from the writer promise instead of the ACKs | `install.spec.ts`'s SAFE-07 test |
| 10-12 | export `clear` as a `clear.bind`-shaped view | `session.spec.ts` test 15, tenth needle |
| 10-13 | give `Clear.svelte` an `auto` inline size | `device-ui.spec.ts:278-306`, naming `Clear.svelte -> .clear` |
| 10-13 | add `letter-spacing: 0.28em` to a second control | the uniqueness grep in `device-ui.spec.ts`, naming both |
| 10-14 | raise a non-vacuity floor by one | its own floor test, naming the observed count |

---

## Standing hazards carried into this phase

- **`src/app.css` is the most-touched file in the phase** — 10-02, 10-04 and (through `--crt`) 10-09
  — and `identity.spec.ts` reads it whole. Every edit runs that spec in the same turn.
- **`identity.spec.ts`'s hex loop covers the whole file.** A `%23`-encoded hex inside a data-URI in
  `app.css` reads as a fourth hue. The noise tile stays in `PadFrame.svelte`.
- **Memory during `test:quick`.** Timeouts were observed at 0.8–1.7 GB free on an unchanged tree.
  Record free memory beside every quick run.
- **`gen-og.mjs` runs before `vite build`**, because `vite build` copies `static/` into `build/`. And
  `test:quick` must be run **after** a build, because three specs read `build/`.
- **The sweep is already past 60 s and grows a third.** Its 600,000 ms timeout is unchanged and must
  not be raised to hide a cross-product.
- **Format `x` links are in the wild.** 10-08 captures a real `x` stamp as a literal fixture *before*
  format `w` is emitted, and asserts it lands `restored` forever after. This is the one change in the
  phase with a user-visible failure mode.
- **`hangar.snapshot.v1` is read by CLEAR and never written by it.** A returning visitor's record
  predates the feature; `PUT BACK` must still work from it.
- **Two `CLEAR`s ship on purpose** — the browse search field's and the device panel's — and they never
  appear on the same screen. If a later change puts a search field on `/c/{id}/`, that stops being
  true.
- **`prefers-reduced-motion` reaches only two of the four CRT layers.** The other two are turned off
  by a control, not by a preference. Every assertion about "the CRT is off" must say which switch it
  means.
- **Switch 3 removes Layer R on a four-core machine.** Any browser assertion about Layer R must force
  `navigator.hardwareConcurrency` first or it passes on an element that was never mounted.

---

## Open questions the plans could not resolve from the documents

1. **Grifter's redistribution permission** (Open item 2). The plans ship D-14 as written — the font
   serves from the site, the binary is `export-ignore`d, `gen-licenses.mjs` records family, licensee
   and licence name — and 10-02 states the reversal's exact cost in its own SUMMARY: **two lines in
   `src/app.css`, one line in `.gitattributes`, one allowlist row, one `npm i`, and `npm run licenses`.**
   Nothing else moves, which is the entire point of D-14's one-token requirement.
2. **`SAFE_PROMISE`'s replacement** (Open item 1). The plans ship form 1, `SAFE_NOTE` at 35
   characters. The reversal to form 2 is one render site; to form 3 it is a dated `REQUIREMENTS.md`
   note and the deletion of one constant. 10-03 states both.
3. **The front-door ring** (Open item 3). The plans keep it at eight and add the `FOR` link row. The
   reversal — growing the ring — is blocked by `front-door.spec.ts:110-112`'s
   `preview === "padsim"` requirement, which twenty-seven of thirty-six entries fail. That is a
   separate decision and 10-07 records it as a deferred item rather than pre-empting it.
4. **Whether the CRT should ever cover text** (Open item 8). Ruled against; the four mitigations and
   the new gate class are recorded by 10-14 as a deferred item.
5. **Whether the unaffordable-detent guard should be built at all** (Open item 9). Built, because the
   sweep then records the 268-character margin as a number that can move.

---

## Validation Sign-Off

- [ ] Phase 9 confirmed closed and the eleven-name block measured on a clean tree (10-01-01)
- [ ] `FONT_SRC` proved under both `vite build` and `vite preview`; `CH_PER_LINE` measured in both
      engines and every dependent number re-derived from it (10-01-02)
- [ ] The font-asset gate exists and is red on an unallowlisted binary; `Coverflow.svelte` is
      protected in both directions before anything touches it (10-01-03)
- [ ] The type settlement ships behind one token, the licence pipeline is clean, and the archive
      omits the binary while carrying its note (10-02)
- [ ] Ten copy retirements landed, every replacement counted by script, and all five reservations
      re-derived from the measured `CH_PER_LINE` (10-03)
- [ ] Four CRT layers, two switches, seven source scans and four browser gates — and
      `Coverflow.svelte` byte-untouched (10-04)
- [ ] No card rests dark, motion is never faked, and the rate contract is byte-for-byte what Phase 4
      signed off (10-05)
- [ ] Sixteen terms in two facets, exactly three per entry, re-cut in all twenty-eight source files
      (10-06)
- [ ] Two sorts, two facet rows, and no shared link dropped on the floor (10-07)
- [ ] The sweep restructured into two passes before the picker, the honest total recorded as a rise,
      and format `x` still landing `restored` (10-08)
- [ ] Locks and the live forecast ship; the accent list is still eight and `--color-over` still three
      (10-09, 10-10, 10-11)
- [ ] CLEAR is a fourth click that extends the never-writes proof rather than denting it, with its
      own confirmation and its own runbook row (10-12, 10-13)
- [ ] The phase gate green against a production build; every projection in this document replaced by
      an observation (10-14)
- [ ] Row H handed to the user, unanswered, with no agent having touched a device (10-14-03)
