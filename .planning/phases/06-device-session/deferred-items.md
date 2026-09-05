# Phase 6 — deferred items

Out-of-scope discoveries logged during execution. Nothing here is fixed by the
plan that found it.

## 1. `docs/TESTING.md` carries a stale `test:quick` literal (found by 06-01)

`docs/TESTING.md` line 22 reads `66 files, 691 passed + 1 todo (692); 25 s wall
(22.7 s)`. Plan 06-01 took the tree to **66 files / 694 tests + 1 todo (695)**,
so the line is stale from this commit onwards, and every later plan in the phase
moves it again.

**Not fixed here, deliberately.** `06-14-PLAN.md` names `docs/TESTING.md` in its
`files_modified` and its task 2 re-measures the whole document end to end
against a fresh production build. Editing it fourteen times on the way would be
churn against a number that is wrong again by the next commit, and no spec reads
the file, so nothing is green-and-vacuous in the meantime.

**Owner:** plan 06-14, task 2.

## 2. The managed-computer sentence has no honest trigger (found by 06-02)

`06-UI-SPEC.md`'s `unsupported` row lists one more sentence than
`src/lib/device/session-copy.ts` writes: *"On a managed computer a policy may
have switched this off — check about:policies."* It is true, and on the one
browser it describes it is the most useful sentence in the block.

**Not written, deliberately.** `about:policies` exists only in Gecko, so showing
it in every `unsupported` state would send a Safari or an iOS visitor to a page
that does not exist for them, and showing it only where it applies needs a
signal that the browser is desktop Firefox 151+. This phase's standing rule
forbids reading the user agent in any file, and a capability sniff aimed at one
engine is a user-agent read wearing a different name: it would exist for no
reason except to identify that engine, and it would rot the first time another
engine grew the same shape.

**The missing thing is the signal, not the string.** Revisit if Firefox ever
exposes a non-user-agent way to know that an enterprise policy has disabled Web
Serial — a `navigator.serial` that is present but whose `getPorts()` rejects
with a policy-shaped error would be enough, and nothing like it exists today.
The sentence itself is transcribed in `06-02-SUMMARY.md` so nobody has to
retype it from the spec.

`session-copy.spec.ts` test 6 is the guard: no exported string may contain
`about:` and no export name may contain `MANAGED`, so reinstating the sentence
without reopening this question is a red test rather than a shipped
misdirection.

**Owner:** unowned. Blocked on a browser capability that does not exist.

## 3. No lint rule bans `setInterval` (found by 06-04)

Plan 06-04's negative check for the watchdog says "implement the watchdog with
`setInterval` and watch the lint rule or the source scan catch it". There is no
such lint rule: `eslint.config.js` has no `no-restricted-globals` entry, and
04-UI-SPEC's "`setInterval`: zero, anywhere" is enforced today only by
per-file source scans (`tune-ui.spec.ts`, `BrowseToolbar.svelte`'s own note,
and now `session.spec.ts` test 15's ninth needle).

**Not added here, deliberately.** An ESLint rule is a tree-wide change with its
own review (the vendored tree and the e2e fixtures would need exemptions), and
06-04's `files_modified` does not include the config. The session's scan
caught the mutation, which is what the plan needed.

**Owner:** unowned. A one-line `no-restricted-globals: ["setInterval"]` with
`src/vendor/**` and `e2e/**` exempted would make the contract a lint error
rather than a convention; whoever next touches `eslint.config.js` should add it.

## 4. The forbidden-instruction scan does not read .svelte components (found by 06-05)

Plan 06-05 widened `src/lib/protocol/forbidden-instructions.spec.ts`'s `SCANNED_DIRS`
from `["src/lib/protocol", "src/lib/transport"]` to `["src/lib"]`, which took the scan from 16
files to 65 and finally covers `src/lib/device/`. The scan reads `.ts` only, so the two
`.ts` files under `src/lib/ui/` are now inside it and the twenty-three `.svelte` components
beside them are not. The Phase 4 deferred item that this closes named `src/lib/ui/` as a
gap alongside `src/lib/device/`, and for the components it is only half closed.

**Not widened here, deliberately.** The plan's whole subject is the device path, which is
`.ts` end to end (`session.svelte.ts`, `session-copy.ts`, `try-on.ts`), and adding a second
extension to a shipped gate is a change to what the scan IS rather than to where it looks. A
component that named an erase or clear instruction would have to reach a descriptor to send
it, and test 5 already holds `encode_packet` to `descriptors.ts` alone over every `.ts` file;
but the vocabulary rule ("the name must not appear even in a comment") is not enforced over
markup today, and the spec's header says so.

**Owner:** unowned. A one-line change (`if (!rel.endsWith(".ts") && !rel.endsWith(".svelte")) continue;`)
plus a read of the failure list is all it takes; 06-10's structural gate over the device
components is the natural place to decide whether the components join this scan or get a
needle of their own.

## 5. A failing Playwright run writes `test-results/`, not `.tmp-e2e/` (found by 06-06)

The standing rule for this phase says Playwright results go under the gitignored
`.tmp-e2e/` and never `test-results/`. `playwright.config.ts` sets no `outputDir`, so the
rule is met only by the `tee` in the command line. Every run creates the directory: a
green run leaves `test-results/.last-run.json` in it, and the first failing run - plan
06-06's deliberate bubble negative - wrote Playwright's default
`test-results/<title>/error-context.md` beside it. Both are gitignored and both were
removed by hand, twice.

**Not fixed here, deliberately.** `06-VALIDATION.md` says `playwright.config.ts` is not
edited in this phase, and a one-line `outputDir: ".tmp-e2e/results"` is a config change
with its own review (the `.gitignore` line, and whether the log and the artefacts should
share a directory).

**Owner:** unowned. Whoever next edits `playwright.config.ts` should add `outputDir` so
the rule is enforced by the tool rather than remembered by the executor.

## 6. No shipped spec scans `src/lib/ui/*.svelte` for a hex literal (found by 06-08)

Plan 06-08's second negative check says: hard-code a hex into `DeviceMark.svelte`'s
connected shape, run `identity.spec.ts`, "and watch it go red on the hex scan". It does
not go red. With `#d6ff4e` in place of `var(--color-accent)` in the lit cell's gradient,
`identity.spec.ts` stayed at **6 passed** and the whole `src/lib/ui/` + `config-shape`
selection at **36 passed**. `identity.spec.ts` reads exactly two files - `src/app.css` and
`src/lib/assets/favicon.svg` - and its hex assertion is about the token ladder, not about
the components. The only component-level hex scan in the tree is `browse-ui.spec.ts`'s,
and it walks the browse files alone; `tune-ui.spec.ts` checks the seven Phase 5 components
for `--color-over` and never for a hex. So today a device component may spell a fourth
colour by hand and every gate stays green.

**Not fixed here, deliberately.** 06-08 adds no test by design - `device-ui.spec.ts`
arrives in 06-10 when all seven device components exist and the list it holds is
complete - and a hex scan over components is a new rule, not a widening of an existing
one. The mutation was observed and restored byte-identical; the guard that would have
caught it does not exist yet.

**Owner:** plan 06-10, `device-ui.spec.ts`. Lift `browse-ui.spec.ts`'s hex rule - the
`/#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])/g` matcher with its lookahead, which exists so `{#each`
is not read as `#eac`, plus the `--color-over` absence - over the device components,
comment-stripped, with a non-vacuity check on the matcher. Then re-run this exact
mutation and record it red.

## 7. `wrangler dev` under eight Playwright workers died twice with `Network connection lost.` (found by 06-08)

Two consecutive `npm run test:e2e` runs on 2026-09-05 (04:04 and 04:07 UTC) ended with the
WebServer printing `X [ERROR]` and every remaining test refusing to connect: 2 passed / 69
failed, then 29 passed / 42 failed. Both wrangler logs carry the same cause, `Error in
ProxyController: Error inside ProxyWorker … Network connection lost.`, at +7 s and +25 s
after startup. No test that reached the page failed on an assertion about the page; the
06-07 runs three hours earlier left 5-7 KB wrangler logs with no error. The third run, at
`npx playwright test --workers 3`, passed **71** in 1.5 m with no error in the log.

**Not fixed here, deliberately.** `06-VALIDATION.md` keeps `playwright.config.ts` out of
this phase's edits (the same reason item 5 stands), and whether the right knob is
`workers`, a `retries` value for the webServer, or a warm-up request before the first test
is a harness decision with its own review. The plan's files touch no worker, no route and
no build shape, so the failure is recorded as the harness's rather than absorbed as a
flake.

**Owner:** unowned, beside item 5. Whoever next edits `playwright.config.ts` should decide
the worker count against a cold `wrangler dev` on this machine and write the measured
number into the config's header, as the 4.6 s cold start already is.

## 8. `first-experience.e2e.ts:156` presses keys before any hydration marker (found by 06-09)

In this plan's first full e2e run (`.tmp-e2e/06-09-suite.log`) "a still configuration really
is still" failed once: two `ArrowRight` presses moved the band one step (`aria-activedescendant`
read `slot-pinwheel`, not `slot-ninepads`) and the band still read `data-ready="false"` for the
first four polls of the assertion. The test asserts `toBeVisible()` and
`aria-activedescendant="slot-aurora"` first - both of which the PRERENDERED document already
satisfies - and then presses two keys with no hydration marker in between, without the file's
own `waitForFrontDoor()` helper, whose comment describes exactly this race against the splash's
window-level `keydown` skip listener (`src/lib/ui/Splash.svelte:209`). A press that lands before
the band's `onkeydown` is attached is lost. The file re-ran 11 passed and the `--workers 3` full
run passed it; the 06-08 log's failure of the same title was the wrangler death, not this race,
so this run is the first record of it.

This plan widens the window slightly and by design: `src/routes/+layout.svelte` now statically
imports the session, so the layout chunk (`nodes/0.*.js`, 5,878 bytes) pulls the session's chunk
(6,987 bytes) before hydration can begin on every route. That is the permitted, chunk-guarded
import 06-05 allow-listed (`config-shape.spec.ts` test 13 is green), not a defect - but the
pre-hydration window on `/` is longer than when the test was written, and it will grow again
when 06-11 mounts the header slot and the note.

**Not fixed here, deliberately.** `e2e/first-experience.e2e.ts` is not in this plan's
`files_modified`. The fix is a one-line wait for a hydration marker before the first press:
`waitForFrontDoor(page)` as the file's other tests do, or
`await expect(band).toHaveAttribute("data-ready", "true")`.

**Owner:** plan 06-13, which re-measures `PREV_E2E` and owns the shipped-chrome e2e changes;
or whoever edits that file first.

## Resolved

### Item 6 - resolved by 06-10

`src/lib/ui/device-ui.spec.ts` test 2 now scans all seven device components,
comment-stripped, for a hex literal (the `/#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])/g`
matcher with its lookahead and a non-vacuity check) and for `--color-over`. The
06-08 mutation (a hex in `DeviceMark`'s connected shape) was re-run under this
gate as one of task 3's negatives and observed red, then restored. The
component-level hex scan the item asked for exists.
