---
phase: 10-redesign
plan: 01
subsystem: testing
tags:
  [
    inter,
    fontsource,
    vite,
    wrangler,
    playwright,
    vitest,
    typography,
    licensing,
    source-scan,
  ]

requires:
  - phase: 09-twenty-configurations
    provides: the clean tree the eleven-name block is measured on - quick 74 / 780, sweep 4 19, e2e 89, svelte-check 567, catalog 36
provides:
  - "BASE_FILES 74, BASE_TESTS 780, PREV_FILES 76, PREV_TESTS 786 - the carry-forward block every later plan in this phase asserts against"
  - "BASE_SWEEP 4 19 and BASE_SWEEP_WALL 123 s, taken before 10-08 grows the sweep by a third"
  - "BASE_E2E 89 and PREV_E2E 89, both measured at --workers 3"
  - "CH_PER_LINE = 43, measured in both engines over thirty-six full line boxes, with the nine dependent numbers re-derived"
  - "FONT_SRC proved under vite build AND vite preview, at the probe route's depth and at src/app.css's"
  - "src/lib/ui/font-assets.spec.ts - the gate npm run licenses cannot be"
  - "src/lib/ui/aesthetic.spec.ts - scan 4, Coverflow.svelte asserted in both directions"
affects:
  [
    10-02,
    10-03,
    10-04,
    10-08,
    10-12,
    10-13,
    10-14,
    typography,
    licensing,
    sizing-twins,
  ]

tech-stack:
  added:
    ["@fontsource-variable/inter@5.3.0 (production dependency, OFL-1.1)"]
  patterns:
    - "A source scan matches a CSS rule on the RIGHTMOST COMPOUND of its selector and a declaration on its PROPERTY NAME, never on a body substring"
    - "A spec whose loop can be empty proves its own matcher fires before it trusts it - expect.requireAssertions turns the omission red"
    - "CH_PER_LINE is a line's CAPACITY, measured per line box with a Range per character, not a ragged block average"

key-files:
  created:
    - src/routes/dev/type/+page.svelte
    - src/lib/ui/font-assets.spec.ts
    - src/lib/ui/aesthetic.spec.ts
    - licenses/@fontsource-variable/inter@5.3.0-LICENSE.txt
  modified:
    - package.json
    - package-lock.json
    - THIRD-PARTY.md

key-decisions:
  - "CH_PER_LINE is 43, not the provisional 46, and the premise behind 46 is refuted: Inter is 2.35 per cent WIDER than Quicksand at 16px, not narrower"
  - "FONT_SRC is candidate (b), the relative url() into node_modules, proved at both the probe route's depth and src/app.css's"
  - "Inter is installed as a PRODUCTION dependency, not -D as the plan wrote, because /dev/type/ is prerendered and deployed and license-checker runs --production"
  - "The plan's CH_PER_LINE instrument - floor of chars / getClientRects().length - is broken twice over and was replaced with a per-line-box occupancy measurement"
  - "aesthetic.spec.ts's non-vacuity floor is 10 rules and 25 declarations, not the plan's twenty: the parse finds 12 rules and 32 declarations"

patterns-established:
  - "Proof at both depths: a specifier proved only where a probe sits is not proved where the shipped file will sit"
  - "A negative check may be planted in a file this phase must not change, provided it is restored byte-identical and the sha256 is stated before and after"

requirements-completed: [IDENT-01, IDENT-02, FOUND-02]

duration: 70min
completed: 2026-09-08
---

# Phase 10 Plan 01: Wave 0 measurement Summary

**CH_PER_LINE is 43 and not 46 — Inter is wider than Quicksand, not narrower — the Inter `url()`
specifier resolves and is served 200 at both the probe route's depth and `src/app.css`'s, and the two
gates that had to exist before a component is written are green with three negative checks observed
red.**

## Performance

- **Duration:** ~70 min
- **Completed:** 2026-09-08T09:41:05Z
- **Tasks:** 3
- **Files created:** 4 · **Files modified:** 3

---

## THE ELEVEN-NAME BLOCK

Every later plan in this phase reads this table and asserts a carried name plus a stated delta. All
of it was measured on this machine, on a clean tree, at commit `0c8a18d`, before anything grew.

| Name              | Value              | How it was taken                                                                                 |
| ----------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| `BASE_FILES`      | **74**             | `npm run test:quick`, clean tree, 34 s wall, 4.23 GB free                                          |
| `BASE_TESTS`      | **780** (+1 todo)  | same run; the todo is reported and never asserted                                                  |
| `PREV_FILES`      | **76**             | as this plan leaves the tree: `BASE_FILES + 2`                                                     |
| `PREV_TESTS`      | **786**            | as this plan leaves the tree: `BASE_TESTS + 6`                                                     |
| `BASE_SWEEP`      | **`4 19`**         | `npm run test:sweep`, clean tree                                                                   |
| `BASE_SWEEP_WALL` | **123 s**          | wall clock around the same run; Vitest's own `Duration` 120.81 s, `tests 189.39s` across workers    |
| `PREV_SWEEP_WALL` | **123 s**          | equal to `BASE_SWEEP_WALL`; this plan does not touch the sweep                                     |
| `BASE_E2E`        | **89**             | `npx playwright test --workers 3`, clean tree, 110 s wall, 3.67 GB free at start                    |
| `PREV_E2E`        | **89**             | re-measured on the tree this plan leaves, 95 s wall, 4.61 GB free — measured by 10-01              |
| `BASE_CHECK`      | **567** (0 / 0)    | provenance only. 569 after the probe route, **571** as this plan leaves the tree. Always 0 / 0      |
| `CH_PER_LINE`     | **43**             | measured in `chromium` and `webkit-phone` on `/dev/type/` — the full table is below                 |
| `FONT_SRC`        | candidate **(b)**  | proved under `vite build` and `vite preview` at both depths — the four steps are below              |

**Free memory beside every run:** 4.23 GB (check), 4.52 → 3.54 GB (sweep), 3.51 → 3.54 GB (build),
3.58 GB (quick after build), 3.67 → 3.81 GB (e2e), 4.66 GB (quick at the end), 4.61 → 4.63 GB (e2e at
the end). Nothing came near the 0.8–1.7 GB band the 2026-09-05 timeouts happened in, and no run in
this plan was retried for any reason.

**Reconciliation against 09-VERIFICATION: no disagreement.** Quick `74 / 780 + 1 todo`, sweep
`4 19`, e2e `89`, `svelte-check` `567 / 0 / 0`, catalog `36`. Every one of the seven agrees with what
`09-VERIFICATION.md` observed at `08c285e`. `BASE_SWEEP_WALL` and `PREV_SWEEP_WALL` are new names with
no prior observation to reconcile against.

**Build:** 13 s wall (`npm run build`), at both the clean tree and the delivered one — unchanged, and
within 09-VALIDATION's 12 s figure plus noise. `build/source-0c8a18d…tar.gz` is 1,216 KB,
`build/THIRD-PARTY.md` and `build/licenses/` (5 entries) all present.

### One recorded discrepancy in how `npm run check` is read

`10-VALIDATION.md` says the check is read with `npm run check 2>&1 | grep -Ei "error|warning"` and
that it "must print nothing". It cannot print nothing: `svelte-check`'s own summary line is
`COMPLETED 567 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, which matches the pattern. The grep
prints **exactly one line** and the assertion that means anything is that the line reads `0 ERRORS 0
WARNINGS`. Recorded here rather than smoothed, so a later plan does not read a green run as a failure.

---

## `CH_PER_LINE` = 43

### The instrument, and why the plan's was replaced

The plan specifies: read `element.getClientRects().length` for the line count, divide the code-point
count by it, take the floor of the smallest ratio. That instrument is wrong twice, and both were
observed rather than argued.

1. **`getClientRects()` returns one rectangle per line box only for an INLINE element.** On a
   block-level `<p>` it returns the single border box. Measured that way, all five strings reported
   `lines = 1` and the ratio was the character count itself — `CH_PER_LINE` would have been **101**.
   Fixed by wrapping each sentence in a `<span>` and measuring the span, with the paragraph's
   `clientHeight / 24` carried beside it as an independent second line count. The two agree on every
   row.
2. **Even corrected, `floor(chars / lines)` divides a ragged block by its line count.** The
   101-character string wraps to 3 lines with the last holding 10 characters, so the ratio is **33** —
   and `ceil(101 / 33) × 24 = 96px` would reserve four line boxes for a block that occupies three.
   The number the twins consume is a line's **capacity**, not a block's average.

The instrument shipped instead: each character's own client rect is taken with a `Range` over the
text node and bucketed by its `top`, which gives the exact occupancy of every line box. `CH_PER_LINE`
is the **minimum occupancy of a full line box** — every line except the last of each paragraph, which
is ragged by construction — over both engines.

That definition is what makes a cap a promise rather than a description: if no full line ever holds
fewer than 43 characters, a string of 86 characters is *guaranteed* to fit in two line boxes.

### The measurement — the plan's five strings

`/dev/type/`, 372px column, 16px / 1.5 / 400, served by `wrangler dev` on `./build`.

| String            | n   | chromium rects | chromium occupancy | webkit-phone rects | webkit-phone occupancy |
| ----------------- | --- | -------------- | ------------------ | ------------------ | ---------------------- |
| `measure-1` PUT BACK        | 101 | 3 | `[47,44,10]` | 3 | `[47,44,10]` |
| `measure-2` honesty ready   | 90  | 2 | `[47,43]`    | 2 | `[47,43]`    |
| `measure-3` CLEAR line      | 86  | 2 | `[43,43]`    | 2 | `[43,43]`    |
| `measure-4` KEEP enabled    | 82  | 2 | `[45,37]`    | 2 | `[45,37]`    |
| `measure-5` reconnect offer | 37  | 1 | `[37]`       | 1 | `[37]`       |

Ten full line boxes, occupancy **43..47**, minimum **43**, set by `measure-3` in both engines.

### The measurement — the whole of §13's Body set

The probe route's own column was reused and every Body-role sentence in the copy contract was walked
through it — twenty-eight strings, both engines, both faces. **Inter: thirty-six full line boxes,
occupancy 43..48, minimum 43. Quicksand: thirty-two full line boxes, occupancy 43..50, minimum 43.**
Per-engine minima are 43 for `chromium` and 43 for `webkit-phone` in both faces.

**The two engines agree on every one of the twenty-eight rows, in both faces.** The plan's rule —
"the smaller of the two is `CH_PER_LINE`" — is a non-choice here, and saying so is part of the result.

The three sentences that set the floor at 43 in Inter, in both engines:
`NOTHING_LANDED_AFTER_CLEAR` (96, `[43,45,8]`), `CLEAR_LINE` (86, `[43,43]`) and `UNKNOWN_DEEP_LINK`
(51, `[43,8]`).

### The Quicksand comparison, and §12.1's premise refuted

§12.1 raised the provisional figure from Phase 4's measured 43 to 46 because *"Inter is narrower per
character at the same size"*. Measured directly, on the 86-character CLEAR line, identically in both
engines:

| Face      | Canvas `measureText` width | DOM span width | Average advance | 372 / advance |
| --------- | -------------------------- | -------------- | --------------- | ------------- |
| Inter Variable | **673.39px** | 673.39px | 7.830 px/char | 47.5 |
| Quicksand      | **657.95px** | 657.95px | 7.651 px/char | 48.6 |

**Inter is 2.35 per cent WIDER, not narrower.** Of the twenty-eight Body sentences, Inter takes MORE
line boxes than Quicksand on two — `NOTHING_LANDED_AFTER_CLEAR` (3 against 2) and
`UNKNOWN_DEEP_LINK` (2 against 1) — and fewer on none. The swap does not buy line capacity; it costs
a little. Both faces were confirmed to be really rendering rather than falling back: both report
`loaded` in `document.fonts`, both `document.fonts.check()` calls return true, and the two DOM widths
differ, which a shared fallback could not produce.

### No single `CH_PER_LINE` reproduces every observed line count, and that is a finding

Searching 20..120 for a value where `ceil(n / CH)` equals the observed line count of every one of the
twenty-eight strings returns **the empty set**, for both faces. `SURPRISE_DISABLED` at 53 characters
fits on one line while `UNKNOWN_DEEP_LINK` at 51 takes two, because breaks happen at word boundaries.
So `ceil(longest / CH) × 24` is a **bound, not a prediction**, and the only thing that matters is that
it never falls *below* the truth. It never does at 43: over the twenty-eight strings the formula
predicts the observed line count exactly on twenty-four and over-reserves by one line on four
(`HONESTY_READY` 90, `CLEARED_BODY` 88, `SURPRISE_DISABLED` 53, and the two 44-character lines).

For the record, the largest value that would still never under-reserve on this corpus is **47**, bound
by `NOTHING_LANDED_AFTER_CLEAR` (96 characters over 3 lines). 43 is chosen over 47 because 47 is a
description of twenty-eight strings that happen to exist and 43 is a property of every line box that
was measured — and 10-12 and 10-13 will author new CLEAR copy against these caps.

---

## The nine dependent numbers, re-derived

`ceil(longest / CH_PER_LINE) × 24`, and `n × CH_PER_LINE` for the caps.

| Name             | Formula          | At the provisional **46** | At the measured **43** | Moves? |
| ---------------- | ---------------- | ------------------------- | ---------------------- | ------ |
| header note      | `ceil(37 / CH) × 24`  | 24px  | **24px**  | no |
| honesty slot     | `ceil(90 / CH) × 24`  | 48px  | **72px** → **48px** once `HONESTY_READY` is shortened to its cap | see below |
| `PUT BACK` cell  | `ceil(101 / CH) × 24` | 72px  | **72px**  | no |
| `KEEP` cell      | `ceil(82 / CH) × 24`  | 48px  | **48px**  | no |
| `CLEAR` cell     | `ceil(86 / CH) × 24`  | 48px  | **48px**  | no |
| `HONESTY_CAP`    | `2 × CH`              | 92    | **86**    | **−6** |
| `PUT_BACK_CAP`   | `3 × CH`              | 138   | **129**   | **−9** |
| `KEEP_CAP`       | `2 × CH`              | 92    | **86**    | **−6** |
| `CLEAR_CAP`      | `2 × CH`              | 92    | **86**    | **−6** |

**Four of the five reservations are unchanged from §12.2 and the fifth is only apparently changed.**
At 43 the honesty slot's formula reads 72px against the shipped 90-character `HONESTY_READY`, but the
rule is to shorten the literal rather than raise the cap; once it is ≤ 86 the slot is **48px**, exactly
as §12.2 says. So §12.2's table survives the measurement intact, and what moves is copy, not layout.

**The three caps land on numbers `install-copy.ts` already ships.** `PUT_BACK_CAP` **129** and
`KEEP_CAP` **86** are byte-for-byte the shipped constants — `install-copy.ts:82,84` — so 10-03 changes
neither. Only `HONESTY_CAP` moves, **129 → 86**, which is §12.2's three-lines-to-two collapse arriving
as arithmetic rather than as an edit. `CLEAR_CAP` is new at **86**.

### Every §13 literal that binds at `CH_PER_LINE = 43`

Counted by script over the exact literals; the set held against each cap is `install-copy.spec.ts`'s
own, read from the file.

**HONESTY_CAP = 86 — two literals are over, both by 4:**

| Literal | n | Cap | Over by | Owner |
| ------- | - | --- | ------- | ----- |
| **`HONESTY_READY`** (R-06, §13.3) | **90** | 86 | **4** | **10-03-02 must shorten it. Never raise the cap.** |
| **`tryOnBudgetReason(...)` worst form** (`copy.ts:190-192`, `Setup and Timer`) | **90** | 86 | **4** | **10-03-02 must shorten it.** It is a template, so the shortening is in the sentence around `${events}` |
| `HONESTY_INCAPABLE` | 72 | 86 | — | ok |
| `HONESTY_NO_SESSION` (R-05) | 70 | 86 | — | ok |
| `HONESTY_SNAPSHOTTING` | 68 | 86 | — | ok |

**PUT_BACK_CAP = 129 — nothing binds.** `PUT_BACK_LINE_AFTER_KEEP` 101, `PUT_BACK_LINE` 71,
`PUT_BACK_NEEDS_ZONA` 26.

**KEEP_CAP = 86 — nothing binds.** `KEEP_LINE_ENABLED` 82, and the six `KEEP_REASONS` at 69, 69, 62,
42, 36, 25.

**CLEAR_CAP = 86 — nothing is over, and one sits exactly ON the cap:**

| Literal | n | Cap | Headroom | Owner |
| ------- | - | --- | -------- | ----- |
| **`CLEAR_LINE`** (§13.3) | **86** | 86 | **0** | **10-12/10-13: it fits, and one added character breaks it.** Flagged rather than shortened |
| CLEAR reason — no snapshot | 43 | 86 | 43 | ok |
| CLEAR reason — cannot write | 36 | 86 | 50 | ok |
| CLEAR reason — no session | 26 | 86 | 60 | ok |

**Uncapped, but longer than two line boxes at 43, and named so 10-12 sizes their cells knowingly:**
the confirmation's "what is removed" line at **101**, `nothing-landed` after a clear at **96**, and the
`cleared` body at **88**. None of the four §12.2 caps governs a region-3 block body today; if 10-12
gives any of them a reserved cell, its reservation is `ceil(n / 43) × 24` and that is 72px, 72px and
72px respectively.

Every §13 count in the spec was re-counted by script and **every one agrees**: 101, 90, 86, 82, 37,
70, 68, 72, 53, 43, 26, 36, 101, 58, 88, 96, 29, 44, 35, 32, 53, 44, 51.

---

## `FONT_SRC` — proved, in four steps, at two depths

**`FONT_SRC` is §5.1 candidate (b): a relative `url()` out of the source tree into `node_modules`.**

The exact string **10-02 pastes into `src/app.css`**:

```
src: url("../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")
  format("woff2-variations");
```

The exact string the probe route carries, which differs **only** in its `../` count because
`src/routes/dev/type/` is three levels deeper:

```
src: url("../../../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")
  format("woff2-variations");
```

### The four steps, with what each printed

**1. `npm run build` completes.** 13 s, exit 0, both at the probe's depth and at `src/app.css`'s.

**2. Every `url()` in every built stylesheet resolves to a real file under `build/`.**
`grep -ro "url([^)]*)" build/_app/immutable/assets/*.css` prints five targets and all five exist:

| Target | Bytes | Exists |
| ------ | ----- | ------ |
| `11.Bww6mjmI.css` → `./inter-latin-wght-normal.Dx4kXJAl.woff2` | 48,256 | yes |
| `0.DEKBgCqz.css` → `./quicksand-latin-400-normal.BSDtH9U0.woff2` | 15,776 | yes |
| `0.DEKBgCqz.css` → `./quicksand-latin-400-normal.BqXBKzPR.woff` | 20,040 | yes |
| `0.DEKBgCqz.css` → `./quicksand-latin-600-normal.CkxN0sDw.woff` | 19,896 | yes |
| `0.DEKBgCqz.css` → `./quicksand-latin-600-normal.DTBPeRoM.woff2` | 15,864 | yes |

**No bare package specifier survives into any built stylesheet** — which is the failure this step
exists to catch. The emitted asset is byte-identical to the package's own file:
`sha256 3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62` on both.

**3. `npm run preview` serves it.** `wrangler dev` on `./build`, through the Basic Auth gate:

```
/_app/immutable/assets/inter-latin-wght-normal.Dx4kXJAl.woff2  status=200  content-type=font/woff2  bytes=48256
/dev/type/                                                     status=200  content-type=text/html; charset=utf-8
/_app/immutable/assets/inter-latin-wght-normal.woff2           status=404
```

The last row is deliberate: the **un-fingerprinted** path 404s, so the rewrite is load-bearing rather
than incidental and a hand-written path would not have worked.

**4. The `unicode-range` is valid CSS.** §5.1's draft carries `unicode-range: /* … */;`, a syntax
error that silently drops the descriptor and takes the subsetting with it. The real list, copied from
`@fontsource-variable/inter`'s own `wght.css` and **ready for 10-02 to paste**:

```css
@font-face {
  font-family: "Inter Variable";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")
    format("woff2-variations");
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
    U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193,
    U+2212, U+2215, U+FEFF, U+FFFD;
}
```

It survives the build as
`unicode-range:U+??,U+131,U+152-153,U+2BB-2BC,U+2C6,U+2DA,U+2DC,U+304,U+308,U+329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD`
— the minifier rewrote `U+0000-00FF` to the equivalent wildcard `U+??`, which is valid CSS and the
same range.

### Proved at `src/app.css`'s depth as well, because the depths differ

Proving (b) only from `/dev/type/` would leave the *shipping* location unproven: the `../` count is
different, and `src/app.css` goes through `@tailwindcss/vite` while a component `<style>` does not.
So the block above was planted into `src/app.css` temporarily, built, and reverted.

- Planted: the root stylesheet became `0.CbdFLehh.css` and carried
  `url(./inter-latin-wght-normal.Dx4kXJAl.woff2)` — the same fingerprinted asset.
- Served: `0.CbdFLehh.css` **200**, and its target **200 / `font/woff2` / 48,256 bytes**.
- Reverted with `git checkout -- src/app.css`; `git diff --quiet` exit 0 and
  `sha256 b3c32d222515769a3fdc880e8383c93b4dc3da0f7353dc37c10f3718e9df1851` before and after.

Candidates (a) and (c) were not needed and were not taken. **(c) was not taken, so no tracked binary
was added and `font-assets.spec.ts`'s allowlist stays empty.**

`node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2` is **48,256 bytes**,
exactly as §5.1 records.

---

## The font census, stated as the command printed it

```
$ git ls-files | grep -Ei "\.(woff2?|ttf|otf)$"
(no output, exit 1)
```

**Zero font binaries are tracked.** The only font-shaped tracked path is
`licenses/@fontsource/quicksand@5.3.0-LICENSE.txt`, whose extension is **`.txt`** — it is a licence
text, not a binary, and it is inside `licenses/`, which the gate excludes anyway. §17's phrasing
("`git ls-files` returns exactly one font-shaped path") reads as though that path were a font file;
it is not. `font-assets.spec.ts`'s header carries the correction.

## The `impeccable` record (V-06)

```
$ ls ~/.claude/skills/impeccable
SKILL.md   agents   reference   scripts

$ git status --porcelain -- src static
(empty)

$ npm ls impeccable
hangar@0.0.1 C:\Users\sabot\Documents\Claude\hangar
`-- (empty)
```

Four entries, nothing under `src/` or `static/` came from it, and the repository has no such
dependency. **No plan ran `npx impeccable install`, and this is the record of why.** D-01 is satisfied
by presence and by `10-UI-SPEC.md` having been authored through the skill, exactly as V-06 rules.
`$impeccable teach` and `$impeccable document` were not run.

`git diff --stat 08c285e..HEAD -- src/vendor/` prints **nothing**, both at the start of this plan and
at its end.

## The catalog's shape

| Name | Value |
| ---- | ----- |
| `CATALOG.length` | **36** — 9 preset (`PORTED`) + 27 Lua |
| `LISTING.length` | **36** |
| `FRONT_DOOR.length` | **8** |
| `EXCLUDED_FROM_ROW.length` | **28** (8 + 28 = 36, the partition holds) |
| `KNOWN_TAGS.length` | **55** (`copy.spec.ts:78-132`) |

`kind: "colour"` in `src/lib/catalog/entries/`: **45 occurrences across 25 files**, split
**3 / 14 / 8** — three each in `console.ts`, `forge.ts`, `strip.ts`; two each in `arc`, `ghost`,
`gridlock`, `hold`, `learn`, `life`, `pomodoro`, `shuttle`, `slam`, `snake`, `stage`, `steps`,
`switch`, `table`; one each in `chorus`, `etch`, `euclid`, `keys`, `lattice`, `lumen`, `morph`,
`sonar`. `cull.ts`, `quadrant.ts` and `ported.ts` carry none.
**The planner's figures reconcile exactly.** The presets' colour knob is a factory
(`knobs.preset.ts:197`) referenced by six of the nine at `:680-685` — `aurora`, `pinwheel`,
`starfield`, `radar`, `joystick`, `ninepads` — so the phase-wide figure is **51 colour knobs across
31 colour-bearing entries: 14 with exactly one, 14 with two, 3 with three**, which is §11.2's and
A-10's number.

---

## Task Commits

1. **Task 10-01-01: the eleven-name block** — no commit. This task modifies no file; its whole output
   is the block above.
2. **Task 10-01-02: `FONT_SRC` and `CH_PER_LINE`** — `5e1e72c` (feat)
3. **Task 10-01-03: the two gates** — `4fbe5e5` (test)

## Files Created/Modified

- `src/routes/dev/type/+page.svelte` — the type probe. A 372px column at 16px/1.5/400 in Inter, the
  same five sentences in Quicksand beside it, and the `@font-face` that is the proof surface. Sixth
  unlinked `/dev/` route; declares no page option of its own, imports nothing, reaches no vendor file.
- `src/lib/ui/font-assets.spec.ts` — **5 tests.** No tracked font binary outside `licenses/` without
  an allowlist row carrying a licence record. Allowlist empty; 10-02-03 adds one row.
- `src/lib/ui/aesthetic.spec.ts` — **1 test.** Scan 4, `Coverflow.svelte` in both directions. Seven
  after 10-04.
- `licenses/@fontsource-variable/inter@5.3.0-LICENSE.txt` — the OFL-1.1 text, written by
  `npm run licenses`.
- `package.json`, `package-lock.json` — `@fontsource-variable/inter@5.3.0`, exact pin, production.
- `THIRD-PARTY.md` — one row: `@fontsource-variable/inter@5.3.0 — OFL-1.1`.

---

## The two gates

### `font-assets.spec.ts` — 5 tests

1. Every tracked font-shaped path outside `licenses/` carries an allowlist row. Non-vacuity: `git
   ls-files` read (`> 100` paths), **and the matcher proved to fire** against five font paths and
   three non-font ones.
2. Every allowlist row points at a path that is tracked, on disk and font-shaped. Both directions — a
   retired row is red too.
3. Every row carries a non-empty family, licensee and licence, and the licence is **not** SPDX-shaped.
   The `SPDX_SHAPED` matcher is proved against `OFL-1.1`, `GPL-3.0-or-later`, `BSD-2-Clause` and
   against three licence names.
4. Every allowlisted path is `export-ignore`d in `.gitattributes`, read from the file. The vacuous
   branch is stated in the message and closes at 10-02-03.
5. `scripts/gen-licenses.mjs` names every allowlisted family, read from that file's text.

### `aesthetic.spec.ts` — scan 4, and the trap it had to avoid

The scan matches a rule on the **rightmost compound** of its selector and a declaration on its
**property name**. `Coverflow.svelte:1013-1019` is why: `.stage.measured .slot { transition: transform
…, opacity …, filter … }` has a selector containing `.stage` and a body containing `filter` and
`opacity`, and it is entirely legal. The parse classifies **both** of its occurrences — top level and
inside the `prefers-reduced-motion` block — as `.slot` rules, and the file is green on arrival, so the
trap V-01 exists to prevent is proved avoided rather than argued.

Observed by the same parse: **12 rules, 32 declarations.** `.band`, `.band.chosen`, `.stage`, `.slot`,
`.slot.hero`, `.stage.measured .slot`, `.plate`, `.fidelity`, `.panel`, and inside the reduced-motion
block `.stage.measured .slot`, `.band`, `.band.chosen`. Exactly one rule's rightmost compound is
`.stage`; four are `.band`-shaped.

**The five geometry literals are at the lines the plan names**, confirmed with `grep -n` before the
scan was written: `clamp(260px, 52vmin, 560px)` at **949**, `min(100vw, 1280px)` at **951**,
`overflow-clip-margin: 6px` at **963**, the four-stop `mask-image` at **964-970**, and
`translateY(-24px)` at **980** under `.band.chosen` at **979** (the plan's table says 979 for the
declaration; 979 is the selector line and 980 the declaration — the same rule, and 10-VALIDATION's
`:978-980` is the accurate citation). The slot's inline `opacity` and `filter: brightness(` are at
**841** and **844**.

---

## Negative checks — three observed, two required

| # | Perturbation | Test | Exit | Message |
| - | ------------ | ---- | ---- | ------- |
| 1 | `static/fonts/probe.woff2` created empty and `git add`ed | `font-assets.spec.ts` test 1 | **1** (1 failed, 4 passed) | *"static/fonts/probe.woff2 is a tracked font binary outside licenses/ with no row in ALLOWED_FONTS. npm run licenses cannot see it, so it would reach the source archive unrecorded. Add a row with its family, licensee and licence name, or do not track the file."* |
| 2 | `mask-image` deleted from `Coverflow.svelte`'s `.band` (lines 964-970) | `aesthetic.spec.ts` scan 4 | **1** (1 failed) | *"SOMETHING WAS DELETED: src/lib/ui/Coverflow.svelte's .band no longer declares "mask-image". It is the four-stop edge fade the row is built on; a tidy-up that removed it would leave a forbid-only scan green."* |
| 3 | `opacity: 0.99` added to `.stage` | `aesthetic.spec.ts` scan 4 | **1** (1 failed) | *"SOMETHING WAS ADDED: src/lib/ui/Coverflow.svelte declares "opacity: 0.99" on ".stage". An opacity below 1 groups, and grouping flattens the ladder."* |

Check 3 was not asked for — it is 10-04's row in the register — but it is the only one that exercises
the ABSENT half, and the ABSENT half is where both the property-name rule and the rightmost-compound
rule live. Two minutes now against a scan nobody had watched work.

**Restoration, byte-identical, stated rather than assumed:**

- Both new spec files were `git add`ed **before** anything was perturbed. On an untracked path
  `git checkout --` fails outright and `git diff --quiet` passes vacuously.
- `static/fonts/probe.woff2`: `git rm --cached`, deleted, `static/fonts/` removed. Re-run: **5 passed,
  exit 0**. `static/` holds `og` and `robots.txt` and nothing else.
- `Coverflow.svelte`: `git checkout --` after each perturbation.
  `sha256 a5c4b519cd51a0ada07bf889bc42b549f9f7e8dc0d0fd81c94f96b29965e37e2` before check 2, after
  check 2, and after check 3. `git diff --quiet -- src/lib/ui/Coverflow.svelte` exit 0 both times.
  Re-run after each: **1 passed, exit 0**.
- `src/app.css`: perturbed once for the FONT_SRC proof and restored.
  `sha256 b3c32d222515769a3fdc880e8383c93b4dc3da0f7353dc37c10f3718e9df1851` before and after.

---

## Verification

| Gate | Result |
| ---- | ------ |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | one line: `COMPLETED 571 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run lint` | clean — Prettier and ESLint |
| `npm run test:quick … check-counts.mjs 76 786` | **76 files, 786 tests, 1 todo** — `PREV_FILES 74 + 2 = 76`, `PREV_TESTS 780 + 6 = 786`. Matches |
| per-file | `font-assets.spec.ts` **5 passed**, `aesthetic.spec.ts` **1 passed** |
| `npm run build` | green, 13 s; `/dev/type/index.html` prerendered |
| the built `url()` target | exists under `build/`, served **200 / font/woff2 / 48,256 B** by `npm run preview` |
| `npx playwright test --workers 3` | **89 passed**, 95 s — `PREV_E2E` unchanged at `BASE_E2E` |
| `npm run test:sweep` | **`4 19`**, 123 s — `BASE_SWEEP_WALL`, taken before the sweep grows |
| `git diff --stat HEAD -- src/vendor/` | empty |
| `git status --porcelain` | empty. `test-results/` removed by hand; nothing listens on 4173 or 4174 |

---

## Decisions Made

1. **`CH_PER_LINE` = 43, the minimum full-line-box occupancy, not 47 (the largest value that never
   under-reserves on the measured corpus) and not 33 (the plan's ragged average).** A cap is a promise
   about strings not yet written; 47 is a description of twenty-eight that happen to exist.
2. **Inter is a production dependency.** `/dev/type/` is prerendered and deployed from this commit, so
   the woff2 is in the shipped artefact, and `license-checker-rseidelsohn` runs `--production`.
3. **`FONT_SRC` proved at two depths, one of them by a reverted perturbation of `src/app.css`.**
   A specifier proved only where a probe sits is not proved where the shipped file will sit.
4. **A third negative check was added** for the ABSENT direction of scan 4.
5. **The prose paragraph in `THIRD-PARTY.md` was left naming Quicksand.** It is generated from a
   hardcoded header in `gen-licenses.mjs` and rewriting it is 10-02-03's, in the same commit as the
   uninstall.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — missing critical functionality] Inter installed as a production dependency, not `-D`**

- **Found during:** Task 10-01-02
- **Issue:** The plan writes `npm i -D @fontsource-variable/inter@5.3.0`. `scripts/gen-licenses.mjs`
  runs `license-checker-rseidelsohn --production`, so a devDependency is invisible to
  `npm run licenses`, to `THIRD-PARTY.md` and to `licenses/`. But `/dev/type/` is prerendered and
  deployed, so the 48,256-byte woff2 is in the shipped artefact from this commit onward — a font
  served to visitors by a GPLv3 project that serves its own Corresponding Source, with no licence
  record. `@fontsource/quicksand` is a production dependency for exactly this reason, and
  10-VALIDATION's own note ("OFL-1.1, already allowlisted at `gen-licenses.mjs:41`") only bites on a
  production dependency.
- **Fix:** Installed into `dependencies` at an exact pin (`"5.3.0"`, matching Quicksand's shape, not
  the `^5.3.0` npm wrote), and ran `npm run licenses`.
- **Observed:** `licence-notices.spec.ts` went red first — *"@fontsource-variable/inter@5.3.0 is
  missing — run npm run licenses"* — which is the shipped gate making exactly this argument.
- **Files modified:** `package.json`, `package-lock.json`, `THIRD-PARTY.md`,
  `licenses/@fontsource-variable/inter@5.3.0-LICENSE.txt`
- **Verification:** `npm run test:quick` back to 74 / 780; one row added to THIRD-PARTY.md and nothing
  else in its diff.
- **Committed in:** `5e1e72c`

**2. [Rule 1 — bug] The plan's `CH_PER_LINE` instrument returns the character count, then a ragged
average**

- **Found during:** Task 10-01-02
- **Issue:** `element.getClientRects().length` returns one rect per line box only for an **inline**
  element; on the plan's block-level `<p>` it returns the border box, so every string reported 1 line
  and `CH_PER_LINE` measured **101**. Corrected to an inline span, the plan's `floor(chars / lines)`
  still divides a ragged block by its line count and returns **33**, which would reserve 96px for a
  block occupying 72 and set `HONESTY_CAP` to 66 — every honesty line 20+ characters over.
- **Fix:** Each sentence wrapped in an inline `<span>`; the line count cross-checked against the
  paragraph's `clientHeight / 24` (they agree on every row); and `CH_PER_LINE` redefined as the
  minimum occupancy of a full line box, measured with a `Range` per character bucketed by `top`, over
  the whole §13 Body set in both engines.
- **Files modified:** `src/routes/dev/type/+page.svelte` (the span, and its header explaining why)
- **Verification:** thirty-six full line boxes in Inter, occupancy 43..48, reproduced identically on
  two separate builds and in both engines.
- **Committed in:** `5e1e72c`

**3. [Rule 1 — bug] `aesthetic.spec.ts`'s prescribed non-vacuity floor is false against the file**

- **Found during:** Task 10-01-03
- **Issue:** The plan asks the scan to assert "the parse found more than twenty rules".
  `Coverflow.svelte`'s `<style>` block parses into **12** rules. That floor would have made the
  phase's one Wave 0 gate red on arrival — the exact failure V-01 exists to prevent.
- **Fix:** Floors of **10 rules** and **25 declarations** (observed 12 and 32), each stating the
  observed count in its own failure message, plus two structural floors the plan does not name and
  without which each half of the scan could be vacuous: at least one rule whose rightmost compound is
  `.stage`, and at least one whose rightmost compound is `.band`.
- **Files modified:** `src/lib/ui/aesthetic.spec.ts`
- **Verification:** 1 passed on arrival; red on both perturbations.
- **Committed in:** `4fbe5e5`

**4. [Rule 3 — blocking] Two `font-assets.spec.ts` tests made no assertion against an empty allowlist**

- **Found during:** Task 10-01-03
- **Issue:** `expect.requireAssertions` is on. Tests 3 and 5 loop over `ALLOWED_FONTS`, which is empty
  today, so test 3 failed with *"expected any number of assertion, but got none"*. More than a
  mechanical failure: a matcher that never runs is a gate that is green forever.
- **Fix:** Both matchers are now proved to fire before they are trusted — `FONT_SHAPED` against five
  font paths and three non-font ones (including the `.txt` licence path the census turns on), and
  `SPDX_SHAPED` against three SPDX identifiers and three licence names.
- **Files modified:** `src/lib/ui/font-assets.spec.ts`
- **Verification:** 5 passed; test 1 red on the planted binary.
- **Committed in:** `4fbe5e5`

**5. [Rule 2 — missing critical functionality] `FONT_SRC` proved at `src/app.css`'s depth as well**

- **Found during:** Task 10-01-02
- **Issue:** §5.1's candidate (b) is written as `../node_modules/…`, which is the depth from `src/`.
  The probe route is three levels deeper, so proving it there proves the mechanism and not the string
  10-02 ships — and `src/app.css` additionally goes through `@tailwindcss/vite`, which a component
  `<style>` does not.
- **Fix:** The `@font-face` was planted into `src/app.css` at the shipping depth, built, its emitted
  `url()` target fetched **200 / font/woff2 / 48,256 B**, and the file reverted byte-identical
  (sha256 stated before and after, `git diff --quiet` exit 0).
- **Files modified:** none permanently; `src/app.css` is byte-unchanged.
- **Verification:** the root stylesheet `0.CbdFLehh.css` carried
  `url(./inter-latin-wght-normal.Dx4kXJAl.woff2)` while planted.
- **Committed in:** not committed — the perturbation was reverted. Recorded here and in `5e1e72c`'s
  message.

**6. [Rule 3 — blocking] `wrangler dev` held `build/` open across a rebuild**

- **Found during:** Task 10-01-02
- **Issue:** `npm run build` failed with `EPERM … rmSync … \\?\…\build` because a background
  `wrangler dev` still had the directory locked. Environmental, not a code fault.
- **Fix:** A scratchpad PowerShell script stops the whole `wrangler`/`workerd` tree parents-first and
  reports what is left listening on 4173. Used before every rebuild afterwards.
- **Files modified:** none in the repository.
- **Verification:** `Get-NetTCPConnection -LocalPort 4173/4174` reports 0 listeners at the end.

---

**Total deviations:** 6 auto-fixed — 2 × Rule 1 (bug), 2 × Rule 2 (missing critical functionality),
2 × Rule 3 (blocking).
**Impact on plan:** No scope creep. Two of the six (2 and 3) are corrections to instruments the plan
specified that would have produced a wrong number and a red gate respectively; two (1 and 5) close
holes that would have surfaced in 10-02 as a licence gap and a 404; two (4 and 6) are mechanical.
Nothing in the plan's objective was dropped and nothing outside it was added.

## Issues Encountered

**The `/dev/type/` directory name and `config-shape.spec.ts`.** That spec discovers every directory
under `src/routes/dev/` and fails on any route file outside a probe's own directory that contains the
probe's path. The scan is for the string `dev/type`, not the word `type`, so a new probe called `type`
is safe — checked before the directory was created, because a scan for `type` alone would have been
red against most of the route tree. The probe's header names its siblings in prose rather than
spelling them, which is the convention 05-12 and 06-05 established by going red.

**Nothing else.** No test was retried, no run was flaky, and no measurement was taken twice for a
different answer. Every figure in this document was reproduced on the final build.

## Notes for the plans that follow

- **10-02** pastes the `@font-face` block quoted above verbatim, at `../node_modules/…`. The family
  name is `"Inter Variable"` and `identity.spec.ts` test 3's first-family assertion moves from
  `"Quicksand"` to `"Inter Variable"`. When Quicksand is uninstalled, its prose paragraph in
  `gen-licenses.mjs`'s header goes with it and Grifter's record replaces it — Inter's row in
  `THIRD-PARTY.md` is already there and needs nothing.
- **10-03** applies `CH_PER_LINE = 43`. `PUT_BACK_CAP` stays **129** and `KEEP_CAP` stays **86** —
  both already shipped, so neither literal moves. `HONESTY_CAP` goes **129 → 86**, and **two literals
  must be shortened by 4 characters each**: `HONESTY_READY` and `tryOnBudgetReason`'s worst form.
  Never raise the cap.
- **10-12 / 10-13** author `CLEAR_CAP` at **86**. `CLEAR_LINE` is exactly 86 — it fits with zero
  headroom, and one added character breaks it.
- **10-04** adds scans 1, 2, 3, 5, 6 and 7 to `aesthetic.spec.ts`, taking it from 1 to 7. The parse
  helpers (`parseRules`, `rightmostCompounds`, `targets`, `declarationsOf`, `splitTop`) are already
  there and are the ones the new scans should use.
- **10-02-03** adds the single row to `ALLOWED_FONTS`, which closes test 4's vacuous branch and turns
  test 5's `gen-licenses.mjs` family check from vacuous to real.
- **10-08** compares against `BASE_SWEEP_WALL = 123 s` at `4 19`.

## User Setup Required

None. No agent connected to a device, opened a serial port, wrote to a module or deployed anything in
this plan.

## Next Phase Readiness

Wave 0 is complete. The three assumptions the phase rested on are numbers: `CH_PER_LINE` is 43,
`FONT_SRC` is proved at the depth it will ship from, and `BASE_SWEEP_WALL` is 123 s taken before the
sweep grows. The two gates are green and all three of their directions have been observed red.
**10-02 is unblocked and has one instruction it did not have before: the honesty caps shrink, and two
shipped sentences have to get shorter.**

---

_Phase: 10-redesign_
_Completed: 2026-09-08_

## Self-Check: PASSED

Every file named above is on disk: `src/routes/dev/type/+page.svelte`,
`src/lib/ui/font-assets.spec.ts`, `src/lib/ui/aesthetic.spec.ts`,
`licenses/@fontsource-variable/inter@5.3.0-LICENSE.txt`, `THIRD-PARTY.md`, `package.json`,
`package-lock.json` and this SUMMARY. Both commit hashes resolve in `git log`: `5e1e72c` and
`4fbe5e5`.

Every count, byte size, wall time, pixel width, line-box occupancy, status code, exit code, sha256 and
failure message quoted above was read from a runner's, a build's, a server's or a script's own output
in this session. Nothing was carried from an earlier SUMMARY or from a planning document without being
re-observed, and the two places where the measurement disagrees with the approved spec — `CH_PER_LINE`
43 against 46, and Inter being wider than Quicksand rather than narrower — are stated as
disagreements rather than smoothed.
