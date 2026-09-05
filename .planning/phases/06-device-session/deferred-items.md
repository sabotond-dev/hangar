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

**Second site (found by 06-11).** In 06-11's first full run (`.tmp-e2e/06-11-suite-w3.log`)
"every configuration is a real file with its own description, and an off-row page is a row of
one" (`first-experience.e2e.ts:467`) failed once at line 535: `band.press("ArrowLeft")` on
`/c/aurora/` landed on a band reading `data-ready="false"` for the first two polls, so
`aria-activedescendant` stayed `slot-aurora` where `slot-dial` was expected. Same mechanism,
no splash on that route, and every assertion before the press is satisfied by the prerendered
document. The window widened as predicted: the deep-link route now hydrates the header slot
and the note as well. Run 2 at `--workers 3` passed 71. The fix is the same one-line wait
(`await expect(band).toHaveAttribute("data-ready", "true")`) before the press, at both sites.

## 9. `/` is horizontally scrollable by 6px at 320px, and it is the coverflow, not the header (found by 06-11)

Measured on the served build at a 320px viewport in S1, S3 and S4: `document.documentElement.scrollWidth`
is 326, and `window.scrollTo(100, 0)` lands at `scrollX` 6. The boxes past the viewport's edge
are the coverflow's pads (`pad-pinwheel` 252..436, `pad-dial` -116..68) under `.band { overflow:
clip; overflow-clip-margin: 6px; }` in `src/lib/ui/Coverflow.svelte` - Phase 4's full-bleed
row, whose 6px clip margin contributes exactly the 6px of scrollable overflow (900 reads 906,
640 reads 646, 1024 reads 1030). The header block's widest right edge at 320 is 296, inside the
24px gutter, and `/browse/` reads 320 at 320.

**Pre-existing, and not fixed here.** The pre-plan build (`cae767d`'s `FrontDoor.svelte`,
`browse/+page.svelte` and `DeviceSlot.svelte`) reads the same 326 at 320, so 06-11's header
neither introduced nor changed it; the plan's "no horizontal scrollbar at 320px" holds for
everything the plan built and fails for a row it did not touch. `Coverflow.svelte` is not in
06-11's `files_modified`, and whether the right fix is `overflow-clip-margin: 0`, an
`overflow-x: clip` on the page, or accepting a 6px scroll on a full-bleed row is Phase 4's
design call (the pads falling off the edges is "the picture the brief asks for").

**Owner:** unowned. Whoever next edits `Coverflow.svelte`'s `.band` should measure
`scrollWidth` at 320 before and after, and 06-13's phone-viewport e2e could assert
`scrollWidth === clientWidth` on `/browse/` today and on `/` once this is decided.

## 10. The panel's TRY ON DEVICE is enabled in S5 while the header slot is a summary (found by 06-12)

Plan 06-12's interface block disables the panel's button in `starting`, the three S3 phases,
`connected`, `unsupported`, `insecure` and over budget - and in no other state. So in
`unplugged-while-connected` (S5) the panel's `TRY ON DEVICE` is a live connect control while the
header's slot for the same phase is a summary that opens the drawer (06-10's `EXPANDS`), and the way
out the spec names for S5 is the replug offer, not a click. A click on the panel's button in S5 calls
`session.connect()`, which takes the adopted-port path (`#port` set, no transport) and tries to open
the unplugged port - landing, by `classifyOpenError`, in `unplugged-at-open` with the cable and hub
steps. Not wrong, but the two controls offer different affordances for one state, and the panel's
click can only produce a second failure block about the cable the visitor already knows is out.

**Not changed here, deliberately.** The disabled expression is the plan's, verbatim, and 06-UI-SPEC's
TryOnDevice table is silent on S5; whether the panel should disable (with which honesty string -
the slot's three are reserved and this phase adds no fourth) or stay a connect that will fail
honestly is a design ruling. This was reasoned from the source, not driven on the served build.

**Owner:** unowned. 06-13 walks the shipped chrome through unplug and replug and is the natural
place to observe it; Phase 7 retires the panel's promise literals and could rule on the slot then.

## Resolved

### Item 6 - resolved by 06-10

`src/lib/ui/device-ui.spec.ts` test 2 now scans all seven device components,
comment-stripped, for a hex literal (the `/#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])/g`
matcher with its lookahead and a non-vacuity check) and for `--color-over`. The
06-08 mutation (a hex in `DeviceMark`'s connected shape) was re-run under this
gate as one of task 3's negatives and observed red, then restored. The
component-level hex scan the item asked for exists.

## Notes appended by 06-13

Three standing items were read, exercised or extended by plan 06-13; nothing here is a new
item, and nothing above is edited in place.

### Item 5 - `test-results/` after a GREEN run too

A green Playwright run writes `test-results/.last-run.json` (the runner's record of the last
run's status and failed ids), so the directory is present after every run, not only after a
failing one. It was removed by hand after each of this plan's eight runs. The item's remedy is
unchanged: `outputDir: ".tmp-e2e/results"` in `playwright.config.ts`, which no plan in this phase
names in `files_modified`.

### Item 8 - read, not fixed, and the lesson applied

06-13-PLAN.md does not name `e2e/first-experience.e2e.ts` in `files_modified` and its standing
rules say no file outside `e2e/session.e2e.ts` is edited for the plan's checks, so the two
pre-hydration key-press sites (lines 156 and 535) are **left as they are**. In this plan's three
runs that included the file (two of the whole `session.e2e.ts` file did not; the full suite at
`--workers 3` did, once) neither site fired: `.tmp-e2e/06-13-suite-w3.log` is 77 passed with no
retry. The five new tests apply the one-line fix the item names on their own side: every key
press in `session.e2e.ts` on a band is preceded by
`await expect(band).toHaveAttribute("data-ready", "true")`, and every click on the header slot
by a wait on `data-hydrated="true"` and, on `/`, by the splash's removal. The item stays open with
its owner now **06-14 or whoever edits that file first**; 06-14 re-measures `docs/TESTING.md`
and is the last plan of the phase to run the suite.

### Item 10 - not driven

06-13's five tests reach S2, S3, S4, S6 and S0a on the shipped chrome and never unplug a
connected module, so S5 was not driven on a real route and the panel's enabled button in S5 was
not observed. The item stays as written, owner unchanged (unowned; Phase 7 is the natural place
to rule on it).

## 11. A second HANGAR tab is told to quit Grid Editor (found by 06-RESEARCH, recorded by 06-14)

A second HANGAR tab that clicks `CONNECT ZONA` while the first tab holds the port gets the identical
`NetworkError` from `open()` that Grid Editor produces, so `classifyOpenError` lands it in `port-busy`
and the visitor reads `Another program is holding the port` naming Grid Editor - an app that is not
the problem - with six steps of which the first (quit Grid Editor from its tray) does nothing for
them. The honest fix is a `BroadcastChannel` on this origin: a session that holds a port announces it,
and a second tab that hears the announcement renders "HANGAR is already connected in another tab"
instead of the Grid Editor block.

**Not built in Phase 6, deliberately.** The taxonomy is nine named states (06-UI-SPEC Y-21) and a
tenth would reopen the approved contract; the detector is a cross-tab protocol with its own failure
modes (a tab that crashed without announcing its release); and in Phase 6 the cost of the misdirection
is a confused visitor, not a corrupted module. In Phase 7 a second tab contending for the port during
a write is a much worse event, and that is where the detector earns a state.

**Owner:** Phase 7. The reasoning is recorded here so Phase 7 inherits it rather than rediscovering
it: the two causes are indistinguishable at the `open()` rejection, so the signal has to come from
HANGAR's own other tab, and `BroadcastChannel` is the same-origin primitive for exactly that.

## 12. No idle-timeout close on a hidden tab (found by 06-RESEARCH PITFALLS C1, recorded by 06-14)

Phase 4's `TryOnDevice` closed the port when the tab was hidden (`closeOnHide`). The session does not:
it holds the port for the whole visit, so a visitor who tabs away for an hour keeps Grid Editor locked
out for an hour. An idle timeout - close after N minutes hidden, offer to reconnect on return - would
return the port without a click.

**Not built in Phase 6, deliberately.** The behaviour change from Phase 4 is recorded as a safety
posture (06-VALIDATION, standing hazards; 06-UI-SPEC open question 5), the header's `DISCONNECT ZONA`
is one click away, and `docs/SESSION-RUNBOOK.md` states the consequence in its second warning. An
idle close interacts with an in-flight write - a tab hidden mid-`CONFIG/EXECUTE` must not close the
port before the acknowledgement or the restore heartbeat - and that interaction cannot be designed
before the write exists.

**Owner:** Phase 7, which owns the write and therefore owns when a port may be closed underneath one.

## 13. No staleness signal for a silent module on an attached port (found by 06-04, recorded by 06-14)

The watchdog reaches `unplugged-while-connected` on exactly one condition: silent for `MODULE_GONE_MS`
(750 ms, three missed heartbeats) **and** `portIsAttached()` returning `false`. A module that goes
silent while the operating system still reports the port attached - a hung firmware, a module mid-
bulk-NVM, a cable with power but no data - leaves the session `connected` with a frozen identity, and
06-04 test 12 asserts that as its own case. Nothing on screen says the module has stopped answering.

**Not published in Phase 6, deliberately.** The taxonomy is nine; a published `stale` flag that nothing
renders is a tenth state in everything but name, and a rendered one would need a slot state the
approved spec does not have. In Phase 6 a stale connection costs nothing: nothing is written, so a
module that stopped answering is a module that is left alone.

**Owner:** Phase 7. A write to a module that has stopped answering is where the signal matters - the
`PAGESTORE` dropped without acknowledgement during a bulk NVM operation (SKELETON-RESULTS (c)) is
exactly this shape - and the private `#lastSeen` the watchdog already keeps is the field to publish
when a write control needs to disable on it.

## 14. Measurements this phase recorded rather than gated (collected by 06-14)

Numbers that were observed and written down in a SUMMARY but are asserted by no test, so nobody
reads them as a gate. Each names the plan that measured it.

- **Identification needs 3 of the capture's 119 rx chunks** (06-07, 06-12, 06-13): the count of
  `zona-hardware-a-hb-on-pace-0.json` chunks fed before the session read `connected`. Recorded as a
  fact about the capture; a firmware or pin change would move it.
- **The header note is 152px** in S1, S2 and S3 and absent in S0a and S0b (06-09, 06-11), with the
  headline at 124px hydrated and 276px in the prerendered layout with the note (06-13).
  06-UI-SPEC open question 7 names the 72px one-paragraph alternative; a design call, not a gate.
- **The hydration window on `/`** (06-09, 06-11): the layout chunk pulls the session's chunk before
  hydration, and the window grew twice in this phase; the two pre-hydration key presses in
  `first-experience.e2e.ts` (item 8) are the shipped tests exposed to it.
- **The full suite at `--workers 3` is 1.1 m of runner time** (06-13, 06-14), against two deaths of
  `wrangler dev` at the default worker count (item 7). The number is dated and asserted nowhere.
- **The degrade test's ordering negative passed 1870 ms early** with the hydration waits removed
  (06-13): a false green, recorded in the shape of 06-05 mutation 1, and the reason every
  shipped-chrome test waits on a published attribute before reading prose.
- **Row F's timing** - how long Firefox's two prompts take end to end - is a measurement the runbook
  asks the user to take; 06-RESEARCH Pattern 6 wanted a threshold set from it and the shipped copy
  went unconditional instead (D-04 amended), so the number, when it arrives, informs copy and gates
  nothing.

**Owner:** none needed. This item exists so a later reader can tell a recorded number from an
asserted one.

## Notes appended by 06-14

The phase's last plan read every open item above; nothing is edited in place.

### Item 1 - resolved by 06-14

`docs/TESTING.md` was re-measured end to end against the production build at `aca8227`: the
"How to run it" table carries 69 files / 724 tests, `3 13`, 77 e2e (67 + 10), 533 svelte-check
files, each with its wall time from a sequential run; the per-file Playwright table gained
`session.e2e.ts` at 14 / 2 / 16 and totals 67 / 10 / 77; the skeleton and front-door tables carry
`transport.spec.ts` 9 and `try-on.spec.ts` 7 with the phase that moved them; and a new section, "The
device session's test surface", holds the phase's three files, the two widenings, the fake serial's
role and its limits, and the one line naming `docs/SESSION-RUNBOOK.md` as the hardware half.

### Item 5 - `test-results/` removed by hand again

The gate run at `--workers 3` was green and left `test-results/.last-run.json` behind, as 06-13
recorded. Removed by hand. `docs/TESTING.md` now says so under "Before an e2e run", so the next
person learns it from the document rather than from `git status`. The remedy is unchanged and still
unowned: `outputDir: ".tmp-e2e/results"` in `playwright.config.ts`.

### Item 7 - three workers, first time green

The phase gate ran once, at `npm run test:e2e -- --workers 3`: `77 passed (1.1m)`, no
`ProxyController` error, no `Network connection lost.` in the log. `docs/TESTING.md` now instructs the
flag. The config still does not pin it; owner unchanged.

### Item 8 - read, decided, left; owner passes to Phase 7

06-14 is the last plan of the phase and its `files_modified` is three documents; its standing rule is
that no source file is edited by this plan and that anything the gate finds is a finding for a gap
plan. `e2e/first-experience.e2e.ts:156` and `:535` are therefore **not edited here**. In the one full
run of this plan neither site fired (`.tmp-e2e/06-14-suite-w3.log`, 77 passed, no retry), which makes
four consecutive full runs at `--workers 3` (06-11, 06-13, 06-14 and 06-13's file-level runs) with no
recurrence - the race is real, recorded twice, and quiet at three workers. The fix is still the
one-line wait the item names, at both sites. **Owner:** Phase 7's first plan that touches
`e2e/first-experience.e2e.ts`, or 07-01 as the plan that re-measures the baselines and would notice a
flake first; whoever it is should apply both waits and run the file ten times.

### Item 9 - not measured again

The 6px horizontal overflow at 320px is Phase 4's coverflow and was not re-measured; no plan in this
phase touched `Coverflow.svelte`. Owner unchanged.

### Item 10 - not driven, and the runbook warns about it

S5 was not driven on a real route by any test in the phase. `docs/SESSION-RUNBOOK.md` carries the
consequence as a note beneath its table so the user does not report it as a fault during row B: the
panel's `TRY ON DEVICE` is a live control in the unplugged state and a click lands in
`The ZONA is not there any more`. Owner unchanged; Phase 7 rules on it.

### Two spec tallies that are stale, recorded rather than changed

Both were found by earlier plans and re-checked here; neither is a code change and no plan in the
phase may change the approved contract, so they are errata for the next revision of 06-UI-SPEC.

- `SAFE_PROMISE` is **126 characters**, not the 125 06-UI-SPEC and 06-02-PLAN state; the string is
  verbatim from the contract and `session-copy.spec.ts` asserts 126 (06-02 decision).
- `session-copy.ts`'s comment on `FAILURE_COPY_STATES` says the six states "are exactly the six
  branches failureCopy has". Since 06-01 `failureCopy` has **seven** branches: the six plus
  `already-open`, which renders through the `unknown` row and is deliberately not a named state.
  The count of named states (nine) is right; the sentence about the transport's branch count is not.
  **Owner:** whoever next edits `session-copy.ts`; a comment fix, one line, and `session-copy.spec.ts`
  test 6's engine-name scan does not care.
