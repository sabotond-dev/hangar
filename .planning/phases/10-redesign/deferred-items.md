<!-- Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later. -->

# Phase 10 — deferred items

Out-of-scope discoveries, logged rather than fixed. Nothing here is red.

## From 10-02

**`/dev/type/`'s Quicksand column now renders Inter.** `src/routes/dev/type/+page.svelte:150`
declares `.quicksand { font-family: var(--font-sans); }`, and `--font-sans` became Inter Variable
in 10-02-01, so the probe's two columns are now the same face and its comparison is degenerate.
Nothing is red: no spec and no e2e test reads the probe (`grep -rn "measure-column\|dev/type"` over
`e2e/` and `src/` outside the file itself returns nothing), the route is unlinked, and the
measurement it produced is recorded in `10-01-SUMMARY.md` and is not re-taken. The probe was an
instrument for one measurement that is finished. Not fixed here because the file is outside
10-02's `files_modified` and the plan's delta is `+0 files`. Whoever next touches `/dev/`
should either retire the route or point `.quicksand` at a real second face.

**`gen-licenses.mjs` deprecation warning.** `npm run licenses` prints
`[DEP0190] DeprecationWarning: Passing args to a child process with shell option true`. It comes
from `checker()`'s `execFileSync(..., { shell: process.platform === "win32" })` at
`scripts/gen-licenses.mjs:52-59`, which predates this phase. Exit code is 0 and the output is
correct. Pre-existing, not caused by 10-02, not fixed here.

## From 10-03

**`src/lib/tune/copy.spec.ts` asserts no exhaustiveness over its module's exports, and the whole
quick suite is blind to a re-added tuning string.** 10-03's third negative check proved it rather
than argued it: `SHARE_QUIET_LINE` was restored as an export with no render site and no assertion,
and `npm run test:quick` was **76 files / 787 tests / 0 failures**. The mechanical-rules walk
(`everyString()`) applies the copy rules to whatever it finds and its non-vacuity floor is
`>= 25`, a floor rather than an equality, so an added string passes every rule by satisfying them.
`install-copy.spec.ts` has the same shape and the same hole.

10-03 closed it for the one string it retired, by asserting the absence by name. It did **not**
close the general case, which would be an enumeration of every export in both copy modules held to
an exact list - the shape `session-copy.spec.ts`'s `NAMED_STATES` and `install-copy.spec.ts`'s
closed sets already use for their taxonomies but not for their strings. That is worth doing and it
is not this plan's: it would move test counts, which 10-03's contract fixes at `+0 / +0`, and the
right moment is 10-12, which adds `CLEAR`'s strings to both modules and will be enumerating them
anyway.

**`src/routes/dev/type/+page.svelte:81` carries the contract's 90-character `HONESTY_READY`.**
Z-08's site-wide scan names it as an expected row rather than an offender: it is the unlinked type
probe's measurement sample, and the line-box occupancies in `10-01-SUMMARY.md` were taken against
exactly that string. Rewriting it to the shipped 85-character form would falsify the record of what
was measured. Logged with the row above about retiring the probe: whoever retires `/dev/type/`
removes this row from `install-copy.spec.ts` test 3 in the same commit.

## From 10-04

**Layer G's halftone still costs about 22 ms at p95 on headless WebKit at a phone viewport.**
Measured on `/browse/` at thirty-six entries, p95 of `requestAnimationFrame` deltas over a full
scroll, median of three runs per arm, against a `SCREEN: FLAT` baseline of 78-79 ms:

| Layer G's technique | p95 over baseline |
| ------------------- | ----------------- |
| `box-shadow: inset 0 0 26vmax 9vmax` (the first spelling, no longer shipped) | **+105 ms** |
| the 3px-pitch halftone gradient | **+22 ms** |
| the vignette as a `radial-gradient` (what ships) | **+10 ms** |

The blur was fixed in 10-04-03 and is recorded in `src/app.css`'s own comment. The residual is not
fixed, and the reasons are stated rather than assumed. Chromium measures **0.00 ms** in every one
of these arms, so this is one engine. The absolute baseline is 78 ms - about 13 fps - on a harness
running thirty-six animating canvases in headless WebKit on Windows, which is not Safari and not
iOS, so the number is a lower bound on the harness rather than a measurement of a device. And
10-UI-SPEC 8.5's 2 ms threshold and its declared fallback are written about **Layer S**; there is
no declared rule for Layer G, and inventing one to scope the site's ground texture off its busiest
page on a harness artefact would be a design change made by a benchmark.

Whoever picks this up has two cheap levers and one honest option: enlarge the halftone tile so
fewer tiles are drawn (it changes the picture), drop Layer G on `/browse/` alone (one selector),
or leave it - the visitor already has a one-click `SCREEN: FLAT` that removes it entirely, which is
the whole reason that control exists.

**The `data-screen` attribute is not on the first painted frame of a cold arrival.** Every route is
prerendered and the static HTML carries no attribute, so `ScreenToggle.svelte`'s module scope
writes it when the layout's JavaScript loads - before hydration, but after the prerendered markup
has painted. A visitor who chose `FLAT` therefore sees a frame or two of texture. Caught by
`e2e/aesthetic.e2e.ts`, whose single read of the attribute after a reload came back `null` on
webkit-phone and `"flat"` on chromium purely on timing; that assertion is now a poll and says "once
this page has hydrated". Closing the window means a blocking inline script in `src/app.html`
carrying a SECOND copy of the default rule (recorded choice, else reduced motion, else textured) in
a file no test reads. That is the drift hazard this phase has refused three times elsewhere, so it
is recorded here instead. It is also written into `ScreenToggle.svelte`'s own header.

## From 10-07

**The front door's ring cannot grow, and the blocker is a data fact rather than a layout one.**
A-22 answers Open item 3 by adding a `FOR` link row and leaving `FRONT_DOOR.length` at **8**. The
reversal — growing the ring so more of the thirty-six are reachable from `/` without a click — is
blocked by `src/lib/catalog/front-door.spec.ts:110-112`, which requires every row member to declare
`preview === "padsim"`. **Twenty-seven of the thirty-six entries fail that**, because they are Lua
configurations and a ring member that loaded `wasmoon` would put a 271,581-byte WASM asset on the
front door's first paint — the one thing `e2e/catalog.e2e.ts` proves a cold load never fetches.
Growing the ring therefore means either a second engine on the opening screen or a relaxation of
that requirement, and both are phase-sized decisions. Recorded rather than pre-empted.

**The `FOR` row sits BELOW the fidelity line, and 10-UI-SPEC 9.1 puts it above.** The spec's order
for `/` is name plate, `FOR` row, fidelity line. Both the name plate and the fidelity line are
rendered by `Coverflow.svelte` — `.plate` and `.fidelity` are its own top-level fragments, which
become children of `FrontDoor.svelte`'s `.row` — and `Coverflow.svelte` is a file this phase
promises not to edit. There is no seam between them to insert into from outside it. The row
therefore follows the coverflow block at the same 32px rhythm. Closing this means either editing
`Coverflow.svelte` (which costs the promise and the file's own header forbids it) or giving it a
snippet prop, which is the same edit wearing a different name. Everything else about the row is the
spec's: ten links, `FOR` caption, 44px on both axes, static markup in `build/index.html`.

**`e2e/` is outside every type gate this repository runs, and 10-07 found it by measurement.**
`npm run check` stayed green — `COMPLETED 576 FILES 0 ERRORS` — with `e2e/browse-webkit.e2e.ts`'s
`orderOf` reverted to the retired three-member literal union `"featured" | "newest" | "name"`.
`.svelte-kit/tsconfig.json`'s `include` globs are `src/**`, `test/**`, `tests/**` and
`vite.config.*`; `e2e/**` is in none of them, and ESLint's type-aware config is scoped to
`**/*.svelte`. A direct `npx tsc --ignoreConfig --noEmit --strict e2e/browse-webkit.e2e.ts` DOES
report it —
`error TS2345: Argument of type '"featured" | "name" | "newest"' is not assignable to parameter of
type 'BrowseSort'` — and is clean once narrowed, so the gate exists and is simply not wired.
Playwright transpiles with esbuild and never type-checks, so a stale annotation in `e2e/` fails
silently: `orderOf("newest")` would have fallen through `orderFor()` to the NAME comparator and the
assertion would have passed against the wrong order. Wiring it means adding `../e2e/**/*.ts` to the
include set (which pulls `@playwright/test` into `svelte-check`'s program) or a second `tsconfig`
and a `check:e2e` script. Neither is a 10-07 change; both are cheap.
