---
phase: 13-gui-overhaul
plan: 17
subsystem: device, transport, protocol, sandbox, ui, store
tags: [sandbox-install, one-writer, fifth-string, 255-4, system-utility, slots, d-18, d-19, d-03, d-14-q7, landing, label-not-kind, over-budget-zero-frames, snapshot-v4, classifier-over-five, apply-to-zona, store-on-zona, put-back, export-as-file, codec-untouched, runbook-row-m, build-03, build-05, safe-01, safe-02, safe-03, safe-07, safe-09, keep-04, share-01]

# Dependency graph
requires:
  - phase: 13-gui-overhaul
    plan: 16
    provides: "SLOTS = 2 in the route and preview.ts's refusal of slots 3 to flip together; the bar's destination zone empty for Apply to ZONA; saveCopy's Open landing on /sandbox/; emitSurface reached from the route only through await import()"
  - phase: 13-gui-overhaul
    plan: 15
    provides: "five strings under three slots - systemTimer, system, mapmode (255/4, the packer's), setup, timer - written 255/6, 255/0, 255/4, 0/6, 0/0; measureSurface / fits over three; the PDF's page 3 at 574 + 706"
  - phase: 13-gui-overhaul
    plan: 13
    provides: "transfer.ts's ExportFile with kind: sandbox and the six import steps; the library's sandbox record; fork D: no membership"
  - phase: 13-gui-overhaul
    plan: 12
    provides: "the page target: canApply() / applyReady, requestPage / confirmPage / cancelPage, the destination review, pageActive's heartbeat ordering; runbook row I"
  - phase: 12.1-gradient-touch
    plan: 08
    provides: "the exact shape of adding a string to the wire - SLOTS, defaultFor, the closed unions, landLua's fields, the snapshot key beside the old with a flag, synthetic.ts's ZonaState.system, the e2e counts by title, wire-pin's frames, the probe's textarea first in write order"
  - phase: 12.1-gradient-touch
    plan: 07
    provides: "#pageInit and #pageTimer as the one place a landing's empty system strings become firmware defaults; the classifier reading the landed prefix of SLOTS; hangar.snapshot.v3 with fromV2 beside fromV1"
  - phase: 12.1-gradient-touch
    plan: 06
    provides: "SLOTS as the ordered slot list with element, event, key, label and three step ids per row; the three reasons for the order; the 255/4 refusal named as 13-17's pending removal under D-19"
provides:
  - "THE FRAME COUNT: FIVE, recorded with the arithmetic and continued on - D-18's three slots (touch Setup 0/0, touch Timer 0/6, the system utility 255/4) over Phase 12.1's two library halves (255/6, 255/0); D-19 retired 12-02's refusal to write 255/4"
  - "sequence.ts: 255/4 as ONE ROW of SLOTS (systemUtility, 'System utility', write-/fetch-/refetch-system-utility) in write order 255/6, 255/0, 255/4, 0/6, 0/0, with its key on ConfigSet and FetchedSet and the comments the row makes true; writeAll, writeBack, fetchAll, storeToFlash, targetOf and WriteTarget unchanged (45 / 28 numstat, every line of it the row, its two keys or a comment)"
  - "constants.ts: EVENT_UTILITY and SYSTEM_DEFAULT_UTILITY (gpl(gpn()), 19 characters) read through defaultFor as 12.1-06 did for the Timer; the refusal header rewritten under D-19 with the utility-button sentence kept as the reason it was once refused and the consequence said plainly"
  - "install.svelte.ts: #pageUtility beside #pageInit and #pageTimer as the ONE place an empty utility becomes the firmware's page-next; TRY, PUT BACK and CLEAR over five; the classifier over four partials as one table indexed by the landed prefix; snapshotFromV3"
  - "snapshot.ts: hangar.snapshot.v4 beside v3, v2 and v1 - older read, never written; ConfigQuint; a v3 record read with the caller's utility default and fromV3"
  - "model.ts: ConfigStrings.systemUtility, published EMPTY by both routes (a catalog entry has no utility body); TunerOptions.systemUtility for the probe's fifth textarea"
  - "install-copy.ts: the closed unions over five with 'the utility script' third (four partials), the KEEP confirmation naming init, timer and utility scripts, the step saying all five - the sentences ledgered for 13-18"
  - "src/lib/sandbox/land.ts: landSurface - the third producer of the tuner's five-key shape: TOUCH_LIBRARY_TIMER, TOUCH_LIBRARY, the packer's 255/4, the packed Timer, the data-half Setup, measured at the picker corner and canonicalised, the surface's name as the label and no kind; refusalOf naming which string is over and by how much"
  - "src/lib/ui/sandbox/SurfaceActions.svelte: zone=destination (13-12's Target select and Apply to ZONA, section 9's Store on ZONA opening KeepConfirm in its place, PutBack mounted whole, the review / switching / unverified lines, the over-budget refusal describing a disabled Apply) and zone=share (Export as a file through 13-13's transfer.ts, the one-clause no-link explanation, the exported line)"
  - "the route: SLOTS = 3 with preview.ts's PREVIEW_SLOTS (the ele[#ele]:map() stand-in runtime.spec.ts uses), the landing observed with the meter and withdrawn while measuring, the over line naming the element, /sandbox/?from=<record id> opening a saved copy onto a fresh surface; My configs' Open on a sandbox copy"
  - "install.spec.ts +3: the shape and the consumption path (identical steps, frames and phases to an entry's; no 'surface', 'sandbox' or '.kind' in the store; land.ts reaching no protocol, transport or device module), the write order and the classifier over a surface with the impossible partial still impossible, over budget as ZERO frames with Apply rendered disabled"
  - "e2e/sandbox.e2e.ts +1: the whole loop on the fake - build, export, re-import, open, connect, apply as five acknowledged writes with 255/4 carrying 706 characters of runtime, Store on ZONA's confirmation, PUT BACK - and the codec's four letters with y and z unclaimed, by letter and by source"
  - "docs/INSTALL-RUNBOOK.md row M (the surface bench row, after H), unanswered; 13-COPY-NEW.md 'From 13-17' with seven rows and five questions"
  - "COUNTS: 94 / 958 (+1 todo) at 02f275f -> 94 / 961 (+1 todo) on the term +0 / +3 (install.spec +3), green whole on the first run at --maxWorkers=2; e2e 82 / 98 -> 83 / 99 on +1 / +1 (chromium), 99 runs green across the chunks, the reruns and the reruns alone; check 655 -> 657 / 0 / 0; sweep 4 19 unmoved; runbook A-L -> A-M; library 842 + 873 untouched"
affects: [13-18 (seven ledger rows and five questions under From 13-17; install-copy.ts's five-string sentences and the two bodies still naming three), 13-20 (the Phase 13 offset +0 / +3, e2e +1 / +1, check +2; BUILD-03 / 05, SAFE-01 / 02 / 03 / 07 / 09, KEEP-04, SHARE-01 evidenced and ticked nowhere; row M handed over; the fifth string's D-19 consequence for catalog entries as a question), the bench (rows H then M)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A new producer of an install joins the one shape and never the writer: it publishes the same keys the tuner publishes, carries a label where the store needs a word, and a test asserts the store's consumption path (steps, frames, phases) is identical to an existing producer's and that the store's code names no kind"
    - "A slot added to the wire is one row of the ordered list, one key on the two sets, one substitution beside the others, one row in each closed union, the next snapshot key beside the old with a flag, and every count moved by one - 12.1-06 / 07 / 08's shape, run in one plan"
    - "Over budget is refused as a number: the route disables the control on the landing's refusal and describes it by the sentence, and the store refuses on its own so the test can assert the transport heard nothing"
    - "A codec proved untouched is a diff AND an assertion on its source: the letters equal, the emitted formats named, and no literal of a reserved letter in the code"

key-files:
  created:
    - src/lib/sandbox/land.ts
    - src/lib/ui/sandbox/SurfaceActions.svelte
  modified:
    - src/lib/transport/sequence.ts
    - src/lib/transport/sequence.spec.ts
    - src/lib/transport/capture.ts
    - src/lib/transport/fixtures/synthetic.ts
    - src/lib/protocol/constants.ts
    - src/lib/protocol/constants.spec.ts
    - src/lib/protocol/write-guard.ts
    - src/lib/tune/model.ts
    - src/lib/tune/model.spec.ts
    - src/lib/device/install.svelte.ts
    - src/lib/device/install.spec.ts
    - src/lib/device/snapshot.ts
    - src/lib/device/snapshot.spec.ts
    - src/lib/device/install-copy.ts
    - src/lib/device/install-copy.spec.ts
    - src/lib/device/wire-pin.spec.ts
    - src/lib/device/page-target.spec.ts
    - src/lib/ui/TryOnDevice.svelte
    - src/lib/ui/TuningRegion.svelte
    - src/lib/ui/InstallState.svelte
    - src/lib/ui/shell/device-clause.ts
    - src/lib/ui/tune-ui.spec.ts
    - src/lib/ui/sandbox/SurfaceEditor.svelte
    - src/lib/sandbox/preview.ts
    - src/lib/sandbox/copy.ts
    - src/lib/sandbox/emit.ts
    - src/lib/sandbox/runtime.ts
    - src/routes/sandbox/[draftId]/+page.svelte
    - src/routes/sandbox/+page.svelte
    - src/routes/my-configs/+page.svelte
    - src/routes/playground/[id]/+page.svelte
    - src/routes/dev/install/+page.svelte
    - src/routes/dev/skeleton/+page.svelte
    - e2e/install.e2e.ts
    - e2e/session.e2e.ts
    - e2e/sandbox.e2e.ts
    - docs/INSTALL-RUNBOOK.md
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md

key-decisions:
  - "The frame count is FIVE and was recorded, not asked: D-18's three slots over 12.1's two library halves. 255/4 is one row of SLOTS after 255/0 and before the touch pair - the Setup's ele[#ele]:map() needs the body registered before it runs, SLOTS' reason one an event over - and the row's key on ConfigSet and FetchedSet is part of the row (a row whose key is not on the set does not compile); nothing else in sequence.ts moved but the comments the row made untrue"
  - "A catalog entry publishes the EMPTY utility and the store substitutes SYSTEM_DEFAULT_UTILITY in one place (#pageUtility): 12-03's placement one slot over, and D-19's consequence - a TRY of a Lua entry writes page-next into 255/4, so the module's utility button keeps turning the page under a catalog configuration, and a KEEP after it stores the default there (recorded, and asked as question 1)"
  - "The landing is the tuner's shape with a label and no kind: five keys in the tuner's key order (setup before timer, as ConfigStrings orders them; the writer owns the wire order), the library's two halves verbatim as a Lua entry's, and the surface's name as tryOnDevice's `name` - the only thing about the surface the store ever sees"
  - "'the utility script' is HANGAR's word for 255/4 in the partial sentences and the confirmation; the classifier's four pairings are one table indexed by the landed prefix, so a sixth row is a type error"
  - "Over budget under three slots names the last element as the way, because an element is the only cause this tree admits: names are never emitted and colours are measured at their dearest; the plan's 'a colour or a name' cannot push a surface over. 13-16's two-slot over line (kinds) is kept for slots 2 and is unreachable from the route"
  - "SLOTS flipped to 3 in the route and preview.ts together; emit.ts's PARAMETER default stays 2 because emit.spec.ts pins the two-slot figures against the bare call, and its header says every shipped caller passes three"
  - "Store on ZONA and PUT BACK sit in the Sandbox's destination zone beside Apply to ZONA because the Sandbox has no install column; Store on ZONA is install.openConfirm() and KeepConfirm renders in its place - the site still has one confirmation"
  - "A saved copy opens onto a fresh surface (/sandbox/?from=<record id> mints an id and loads the copy's surface under it) so the copy stays a copy and its edits become a draft of their own"
  - "The codec's proof is the diff and an assertion: HANGAR_FORMAT_LETTERS equals w, x, y, z, the two emitted formats are x and w, and stamp.ts's code carries no literal of y or z - a constant allocating one is red by letter (negative check run)"
  - "The plate's focus carries preventScroll: a 13-16 defect (a programmatic focus scrolled a partly visible plate into view between press and release, the release landed on another cell, and the drag accelerator read it as a second click) surfaced by this plan's taller tools row and fixed under Rule 1"

patterns-established:
  - "A producer joins the one shape, never the writer; the proof is the consumption path, not the payload"
  - "The fifth string moved every count of four to five in one commit, by 12.1-06/07/08's shape"

requirements-completed: []
requirements-touched: [BUILD-03, BUILD-05, SAFE-01, SAFE-02, SAFE-03, SAFE-07, SAFE-09, KEEP-04, SHARE-01]

# Metrics
duration: about 130 min of execution (04:20Z-06:10Z: the baseline run, the fifth string across twenty-six files, the landing, the actions, the route, three tests, three negative checks, the e2e title with a defect found and fixed, two more negative checks, the quick suite, the sweep, the check, three builds, five e2e chunks and their reruns) plus this document and STATE.md
completed: 2026-09-12
---

# Phase 13 Plan 17: The Sandbox Install - The Loop Closed Through the One Writer Summary

**A surface the visitor built reaches the fake ZONA through machinery that was never changed for it:
`land.ts` publishes the tuner's own five-key shape - the library's two halves, the runtime's second
slot in 255/4, the packed Timer, the data-half Setup - with the surface's name as the label and no
kind, and `install.spec.ts` asserts the store consumes it by the one path an entry takes. The frame
count is FIVE, as D-18 and D-19 decided, recorded with the arithmetic and continued on: 255/4 is one
row of `SLOTS` after the two library halves and before the touch pair, `SYSTEM_DEFAULT_UTILITY` is
read from the package with 12-02's refusal header rewritten under D-19, a catalog entry lands the
firmware's page-next there through the store's one substitution, the classifier names four partials,
the snapshot is `hangar.snapshot.v4`, and every count of four became five. Over budget is a frame
count of zero. A surface shares as a file through 13-13's `transfer.ts` with no new code path and
the codec proved byte-identical with `y` and `z` unclaimed. Term **`+0 / +3`** on 94 / 958: **94 /
961 (+1 todo)** green whole on the first run; e2e **83 / 99** on `+1 / +1`. Runbook row M written and
unanswered. **No device was touched.**

## The baseline, observed at start and at close

HEAD `02f275f` (13-16's summary). Observed before an edit was made, at `--maxWorkers=2`: **94 files
/ 958 tests (+1 todo)**, 46.2 s, no transient; e2e 82 titles by `grep -c "test("`; runbook 12 rows
(A-L); check 655 / 0 / 0 (13-16's close). The plan's `93 / 932` and `93 935` literals are stale, as
the brief says.

| Count | Start (observed) | Close | Delta |
| --- | --- | --- | --- |
| quick suite | **94 / 958** (+1 todo) at `02f275f` | **94 / 961** (+1 todo), `check-counts 94 961` matches, green whole on the first run at `--maxWorkers=2` | **`+0 / +3`**: `install.spec` 24 -> 27 |
| check | 655 / 0 / 0 | **657** / 0 / 0 | +2 files (`land.ts`, `SurfaceActions.svelte`) |
| lint | clean | clean (prettier and eslint over the tree) | - |
| e2e | 82 titles / 98 runs | **83 / 99** - `sandbox.e2e.ts` 2 -> 3 (chromium, untagged); 99 runs green across the chunks, the reruns and the reruns alone (below) | **`+1 / +1`** |
| sweep | `4 19` | `4 19` RUN once at close, 92.7 s, 19 green | 0 |
| runbook | rows A-L (12) | rows A-**M** (13) | +1 |
| library | 842 + 873 | `git diff --quiet 02f275f -- src/lib/catalog/library.ts src/lib/sim/lua-host.ts` holds | read, never edited |
| codec | - | `git diff --quiet 02f275f -- src/lib/share/stamp.ts src/lib/share/stamp.spec.ts src/lib/share/stamp-roundtrip.sweep.spec.ts` holds | byte-identical |
| vendor, oracle, protocol-pin, forbidden-instructions, ROADMAP, 12-touch-framework/, 12.1-gradient-touch/ | - | `git diff --quiet` holds on all | untouched |

## Commits

| Hash | Message |
| --- | --- |
| `6e4f13b` | `feat(13-17): the fifth string on the wire - 255/4 as one row of SLOTS after the two library halves and before the touch pair, SYSTEM_DEFAULT_UTILITY read from the package with the refusal header rewritten under D-19, the tuner publishing an empty utility that the store substitutes in one place, TRY / PUT BACK / CLEAR over five, the classifier over four partials, the snapshot under hangar.snapshot.v4 with a v3 record restoring page-next and saying so, and every count of four moved to five` |
| `6599c9f` | `feat(13-17): the surface lands through the one writer - land.ts as the third producer of the tuner's five-string shape with the label and no kind, the Sandbox's destination zone with Apply to ZONA, Store on ZONA and PUT BACK on the existing store and page target, over budget refused before the wire with the cause named, SLOTS flipped to 3 in the route and the preview, the export as a file beside Save copy, three install.spec tests, runbook row M and the ledger` |
| `cbac25d` | `feat(13-17): the whole loop in one e2e title on a fake ZONA - a two-element surface exported as a file through transfer.ts, re-imported on My configs, opened onto a fresh surface, applied as five acknowledged writes with 255/4 carrying the runtime and put back, the codec asserted untouched by letter and by source, and the plate's focus no longer scrolling the page under a pressed pointer` |

`git commit --only <paths> -F <message-file>`, pathspec before the flag; the two new files `git add`ed
first. No push, no attribution, no trailer. Three commits, not two: the fifth string is a
prerequisite of task 01 and is its own atomic change across twenty-six files (the plan's task 01 and
task 02 are the second and third).

## The frame count: five, with the arithmetic

Counted before any code was written, from `sequence.ts`'s `SLOTS` at `02f275f` (four rows: 255/6,
255/0, 0/6, 0/0), 13-15's hand-off ("five strings under three slots ... written in the order 255/6,
255/0, 255/4, 0/6, 0/0") and 13-16's `SLOTS = 2` with `preview.ts`'s refusal of `slots: 3`:

| Slot | What it carries for a surface | Since |
| --- | --- | --- |
| 255/6 | `TOUCH_LIBRARY_TIMER` (873) - the library's second half | 12.1-06 |
| 255/0 | `TOUCH_LIBRARY` (842) - the library's first half; the runtime calls `E`, `G`, `N`, `U`, `X` by name | 12-03 / 12-07 |
| **255/4** | **the packer's 255/4** - the runtime's guarded head, `R`, `O` and the branches that fit, pulled in by the Setup's `ele[#ele]:map()` | **13-17** |
| 0/6 | the packed Timer - `gtt(0,100)`, the rest of the runtime, `X(self,20)` | 13-15 |
| 0/0 | the data half - `J`, `M`, the paint, `self:tim()ele[#ele]:map()`, `self.touch_cb=O` | 13-14 |

Four plus one is **five**. The plan's "if it is four, stop and ask" and the hand-off's "the stop-and-ask
fires on five" were both written before the user decided: **D-18** (the second probe, 2026-09-10,
lit cell 80 from 255/4 - the third slot is bought) and **D-19** ("HANGAR can do anything the Editor
can" - 12-02's refusal to write 255/4 is retired and its constant's header is this plan's pending
removal). Five is the recorded design; the count was recorded and the plan continued, as the brief
instructed. Under two slots (the emitter's parameter default, unreachable from the route) the count
is four with 255/4 empty - and the store lands the firmware default there, as for a catalog entry.

## The `SLOTS` row and the write order

`sequence.ts`, one row inserted after 255/0:

```ts
  {
    element: ELEMENT_SYSTEM,
    event: EVENT_UTILITY,
    key: "systemUtility",
    label: "System utility",
    write: "write-system-utility",
    fetch: "fetch-system-utility",
    refetch: "refetch-system-utility",
  },
```

Write order **255/6, 255/0, 255/4, 0/6, 0/0** - the two library halves first (SLOTS' reasons one and
three, unchanged), then the utility (its body calls the library, so after 255/0; the touch Setup's
`ele[#ele]:map()` calls the body, so before 0/0 - reason one, one event over), then the touch pair
(reason two, unchanged). `sequence.spec.ts` asserts the row, its place (third), the property (the
utility after the system setup and before the touch element) and the frames: 255/4 written exactly
once per install and third (12-02's refusal loop, halved by 12.1-06, now inverted by name), the
fetcher reading five in SLOTS order, and the caller's key order changing nothing over a sampled 24 of
the 120 permutations with the sample's coverage asserted (every key in every position at least
once) - 120 rigs took 9.6 s and the quick suite cannot afford it; 24 took 2.5 s as before.

**What moved in `sequence.ts` beyond the row (the brief's "stop and report" clause).** `git diff
--numstat` reads 45 / 28: the nine-line row; `systemUtility: string` on `ConfigSet` and
`systemUtility: FetchedEvent` on `FetchedSet` (the row's `key` is typed `keyof ConfigSet`, so a row
whose key is not on the set does not compile - the key is part of the row, as 12.1-06's `systemTimer`
was); and the comments the row made untrue ("WHAT IS NOT IN THE LIST. 255/4 ...", "255/4 is NOT
fetched", "Four writes per install, not five", "All FOUR strings", "which quarters landed"). **The
bodies of `writeAll`, `writeBack`, `fetchAll`, `storeToFlash`, `targetOf` and `WriteTarget` are
byte-identical** to `02f275f`'s. This is reported here rather than stopped on, because the brief's
"satisfied by this one-row addition" cannot be met without the row's key on the set; if the two
type lines and the comment lines exceed the mandate, the diff is small enough to read whole. Every
other file the fifth string reached is listed under "Every file outside the plan's list".

## The refusal header, as rewritten, and the utility-button consequence

`constants.ts`'s header reads **"TWO ELEMENTS, FIVE OF THEIR SIX EVENTS"** and then **"EVENT 4 OF THE
SYSTEM ELEMENT IS WRITTEN SINCE 13-17, UNDER D-19"**: the utility-button sentence is kept in full as
the reason it was once refused (event 4 is the module's physical utility button; its firmware default
is `gpl(gpn())` - load the page that page_next names - so writing it changes what a button the
visitor paid for does; `grid_protocol.h:354` / `:366`, `grid_lua_api.c:1676-1714`), then: D-19
retired the refusal as a rule (2026-09-10: the Editor writes 255/4, so HANGAR may). **THE CONSEQUENCE,
SAID PLAINLY** in the header, in `land.ts`, in the SUMMARY here: **while a Sandbox surface is
installed, the module's utility button runs the runtime's second slot and NO LONGER TURNS THE PAGE.**
A Lua entry or a preset lands the firmware default there (the store substitutes it for the empty
string in one place, as it does for the other two system slots), so under a catalog configuration
the button still turns the page. **PUT BACK restores whatever the module held** - the snapshot covers
every slot HANGAR writes - and **CLEAR writes the default**, page-next. `SYSTEM_DEFAULT_UTILITY =
defaultFor(ELEMENT_SYSTEM, EVENT_UTILITY)` beside the four; `constants.spec.ts` pins the package's
value (19 characters, printable, canonical, distinct from the other four - the two Timer defaults are
the same debug print as each other, which is the package's business) and asserts the comment-stripped
source types no `gpl(` call.

**D-19's second consequence, recorded and asked (ledger question 1).** Every TRY ON DEVICE / Apply of
a catalog entry now writes page-next into 255/4 - a module whose owner had a utility script of their
own runs page-next under a catalog configuration until PUT BACK, and a KEEP after it stores the
default (cfg_default_flag deletes the file). The brief said the store substitutes the default; the
alternative (substituting the SNAPSHOT's own utility for a landing's empty string - one line in
`#pageUtility`, still no branch on a kind) is one decision for the user.

## The classifier over five, and `landLua`'s five fields

`install.svelte.ts`'s `#classify` walks `SLOTS` for the landed prefix as 12.1-07 wrote it and reads
the words from one table indexed by the prefix length (a sixth row is a type error against
`install-copy.ts`'s closed unions, which gained a row each):

| Landed prefix | `landed` | `failed` | `landedSlots` / `failedSlots` |
| --- | --- | --- | --- |
| 1 | The system timer | the page init, the utility script, the Timer and the Setup | `[System timer]` / `[System, System utility, Timer, Setup]` |
| 2 | The system timer and the page init | the utility script, the Timer and the Setup | `[System timer, System]` / `[System utility, Timer, Setup]` |
| 3 | The system timer, the page init and the utility script | the Timer and the Setup | `[System timer, System, System utility]` / `[Timer, Setup]` |
| 4 | The system timer, the page init, the utility script and the Timer | the Setup | `[System timer, System, System utility, Timer]` / `[Setup]` |

"A later slot landed and an earlier one did not" is still impossible with this writer and is asserted
on the list over five refusals in `install.spec.ts`'s classifier test and over three in the new
surface test. `install-copy.spec.ts`'s `SLOT_NAMES_IN_WRITE_ORDER` holds five (`system timer`, `page
init`, `utility script`, `Timer`, `Setup`) and asserts every row names them in write order and that
the landed prefix and the rest partition them; the step says "all five"; `CONFIRM_REPLACES` names
"the page's own init, timer and utility scripts" as an insertion on the contract, held from both sides
by `AMENDED_BY_THE_FIFTH_SCRIPT`. `SNAPSHOTTING_BODY` and `identifiedBody` still name three scripts,
as 12.1-08 left them - 13-18's.

`model.ts`'s `ConfigStrings` is **five keys** - `systemTimer`, `system`, `systemUtility`, `setup`,
`timer` - and both routes (`measurePadsim` and `measureLuaRoute`, the summaries' `landLua`) publish
`systemUtility: ""` beside the library's two halves: no catalog entry has a utility body, and
`#pageUtility` is the ONE place the empty string becomes page-next (12-03's placement, one slot over).
`model.spec.ts` asserts the five keys on a Lua entry and on a preset with the fifth empty, and that
`model.ts` names none of the three firmware defaults. `wire-pin.spec.ts` pins the fifth frame's bytes:
through `writeAll` alone (no store) a catalog entry's 255/4 frame carries the empty string at length
0 - the proof that `writeAll` substitutes nothing and the store does.

## The v4 key, and how a v3 record reads

`snapshot.ts`: `SNAPSHOT_KEY_V4 = "hangar.snapshot.v4"` beside v3, v2 and v1, **older read, never
written** (12-03's two rules, one version on again); `ConfigQuint`; `SnapshotDefaults` with
`systemUtility`; `ReadEntry` with `fromV3` beside `fromV1` and `fromV2`. Read from the store's side
with the three package defaults passed in:

| Key | Holds | `systemUtility` | `systemTimer` | `system` | flags | Store publishes |
| --- | --- | --- | --- | --- | --- | --- |
| `hangar.snapshot.v4` | five | the record's | the record's | the record's | none | - |
| `hangar.snapshot.v3` (12.1) | four | **`gpl(gpn())`** | the record's | the record's | **`fromV3`** | `snapshotFromV3` |
| `hangar.snapshot.v2` (12) | three | `gpl(gpn())` | `print("tick")` | the record's | `fromV2` | `snapshotFromV2` |
| `hangar.snapshot.v1` (7) | two | `gpl(gpn())` | `print("tick")` | the 24-character default | `fromV1` | `snapshotFromV1` |

`persistIfAbsent` writes v4 ONLY and answers `kept` on a valid v3, v2 or v1 entry for the page (never
shadowed). `snapshot.spec.ts` stays at nine tests: the v3 half of the precedent (a hand-written v3
record reads with the caller's utility default and `fromV3`, is never overwritten, its raw
byte-unchanged through a kept and through a write for another page, all four keys at once each with
their own flags, a v4 entry missing `systemUtility` absent and replaced) was folded into test 9 and
its title. `install.spec.ts` test 6 connects on a v3 record: `snapshot` is the record's four plus
`SYSTEM_DEFAULT_UTILITY`, `snapshotFromV3` true, no v4 entry written beside it, PUT BACK writes
page-next into 255/4 and the record's own into 255/6 and 255/0, the v3 raw byte-unchanged. The
probe's `install-snapshot` reads five lengths plus ` v1` / ` v2` / ` v3`.

## The landing, beside `landLua`'s and the preset's

| Field | `landLua` (a Lua entry) | the preset route | **`landSurface` (a surface)** |
| --- | --- | --- | --- |
| `systemTimer` | `TOUCH_LIBRARY_TIMER` | `TOUCH_LIBRARY_TIMER` | `TOUCH_LIBRARY_TIMER` (873) |
| `system` | `TOUCH_LIBRARY` | `TOUCH_LIBRARY` | `TOUCH_LIBRARY` (842) |
| `systemUtility` | `""` (the store lands page-next) | `""` (the same) | **the packer's 255/4** (page 3: 706) |
| `setup` | `renderLua(...).setup` | the compiled Setup | the data half, own colours, canonical (page 3: 466 at the corner) |
| `timer` | `renderLua(...).timer` | the compiled Timer | the packed Timer (page 3: 574) |
| the word the store gets | the entry's name | the entry's name | **the surface's name** - `tryOnDevice(config, name)`'s `name`, the label |

`land.ts` exports `landSurface(surface, { slots })` -> `{ config, label, measured, refusal }`: the
five strings (own colours, run to the minifier's fixed point), the name, cost.ts's measurement at the
picker corner, and `refusalOf(measured)` - which string is over 908 and by how much, first in write
order. The key order is the tuner's (`setup` before `timer`, as `ConfigStrings` orders them; the writer
owns the wire order and `sequence.spec.ts`'s permutation test is why that is safe), asserted equal to
`PAIR`'s and to `model.spec.ts`'s five. The shape carries **no field that says what produced it**;
the store's code (comment-stripped) contains no `surface`, `Surface`, `sandbox` or `.kind`, and
`tryOnDevice`'s signature is `(config, name)`. `land.ts` reaches no `lib/protocol`, `lib/transport`
or `lib/device` module (ladder.spec's line for the tuner, held here for the landing). Reached from the
route through `await import()`, like `cost.ts` and `preview.ts`.

**The consumption path, asserted** (`install.spec.ts` test 25): two rigs, one handed the surface's
landing and one an entry-shaped config; the same step ids in the same order, the same six frames in
SLOTS order (`ramLegFrames(config)` on each), the same phases from `ready` on, both `settled`, both
armed, both with `keepReason` undefined; the fake's two RAMs holding the surface's five and PUT BACK
restoring the module's own five, the utility included.

## The five measured strings at the picker corner - the PDF's page 3 (three slots)

Printed by the new test from `landSurface(PAGE3)` (a 2 x 6 Fader, a 3 x 3 XY pad, a 3 x 3 Knob, a 2
x 2 Button; every region at level 15 on all three channels):

| Slot | String | Used | Free |
| --- | --- | --- | --- |
| 255/6 | `TOUCH_LIBRARY_TIMER` | 873 | 35 |
| 255/0 | `TOUCH_LIBRARY` | 842 | 66 |
| 255/4 | the runtime's second slot (head, `R`, `O`, `I[1]`, `I[3]`) | **706** | 202 |
| 0/6 | `gtt(0,100)`, `I[4]`, `I[5]`, `X(self,20)` | **574** | 334 |
| 0/0 | `J`, `M`, the paint, both pull-ins, the callback | **466** | 442 |

574 + 706 is 13-15's figure for page 3 on three slots, unmoved; 466 is the data half of four regions
at the corner. Every string is canonical (rounds 0). **The over-budget frame count: zero** - the same
surface under two slots lands a Timer of **1,248 (340 over)**, `refusal` names the Timer, the
rendered `SurfaceActions` carries a real `disabled` on Apply described by *"Timer is 1248 of 908, 340
over. Remove the last element to fit."*, and `tryOnDevice` on that landing puts no frame on the
transport (the store's `#tryRefusal` refuses a Timer at 908 on its own; `fake.writes.length` unmoved,
CONFIG/EXECUTE 0, HEARTBEAT/EXECUTE 0, phase `ready`, the steps still the snapshot's seven).

**What can push a surface over, in this tree.** Only an element: names are never emitted (the wire
carries `J`, `M` and the paint) and colours are measured at their dearest already (cost.ts section 2),
so the plan's "an element, a colour or a name" has one live branch. Under three slots every
combination of kinds fits (13-15's table) and the dearest sixteen measure 897, so the Setup past
908 is reachable only in principle; the sentence exists, is ledgered, and question 4 asks whether it
should name which element.

## Apply to ZONA, Store on ZONA, PUT BACK - the existing store, the existing page target

`SurfaceActions.svelte` `zone="destination"` is the Sandbox's context-bar destination zone while a
ZONA is connected (13-12's rule, the workspace's own): `Target` over the module's enumerated pages,
`Apply to ZONA` enabled on `install.applyReady`, a measured landing and no refusal - the click is
`install.tryOnDevice(config, name)`, the same write as TRY ON DEVICE; the review, the switching line
and the unverified line as the workspace renders them; **`Store on ZONA`** (section 9's verbatim word
for the store) is `install.openConfirm()` - the same click as KEEP ON DEVICE, its seven disabled
reasons `KEEP_REASONS` unchanged, and `KeepConfirm` renders IN ITS PLACE so the site still has one
confirmation; **PUT BACK** is `PutBack.svelte` mounted whole. No new confirmation, phase or action;
`WRITABLE_PHASES` and the fifteen-phase union are pinned as 13-12 left them. The route observes the
landing with every measurement (`install.observeConfig(config)`, withdrawn to `undefined` while
measuring and on an over-budget landing - 07-RESEARCH Pitfall 5, the tuner's own discipline) and
passes `destination` to `fillShell` only with a reported page.

**The `SLOTS` flip**: the route's `SLOTS = 3` and `preview.ts`'s `PREVIEW_SLOTS = 3` in one commit;
the preview's refusal of `slots: 3` is gone with its reason, and the `ele={{map=function(s)...end}}`
stand-in `runtime.spec.ts` uses is the preview's `mapStandIn`. 13-16's two-slot `overLine` ("Two
events can't hold this mix of element kinds; remove one kind to fit") is **kept for `slots: 2`** in
`copy.ts` and unreachable from the route; the route's meter line under three slots is
`overElementLine`. `emit.ts`'s parameter default stays 2 (its header says why: emit.spec.ts pins the
two-slot figures against the bare call; every shipped caller passes three).

## The export path, and the codec's proof

`Export as a file` (`zone="share"`, beside Save copy) builds the sandbox record 13-13 defined and
calls `downloadExport(exportFile(record, at))` - **no new code path**: `transfer.ts` is not edited
(it is in the plan's file list; nothing was needed - `ExportFile` already covers `kind: "sandbox"`
and `checkSurface` already validates regions). The one-clause explanation, *"A surface isn't a
variation of a catalog entry, so there's no link to share; export it as a file and import it on My
configs."*, sits under the control by `aria-describedby`; the outcome line reads *"Exported as
loop.hangar.json."* for four seconds. Re-import is My configs' own six steps; a corrupted region is
refused by 13-13's validator with the region named (negative check: `Hold lies outside the 9 x 9
surface.`, `Hold overlaps Filter.`, both step 5). A saved copy's `Open` goes to `/sandbox/?from=<record
id>`; `/sandbox/` mints a fresh surface id and carries the query; the route loads the copy's surface
under the new id, so the copy stays a copy and the first edit writes a draft of its own (question 5).

**The codec:** `git diff --quiet 02f275f -- src/lib/share/stamp.ts src/lib/share/stamp.spec.ts
src/lib/share/stamp-roundtrip.sweep.spec.ts` holds - byte-identical, all three. The codec's own spec
asserts only that the four letters are outside the payload alphabet and contain `x` and `w`, so the
assertion the plan asks for was written in the e2e title (not a fourth unit test, to hold the term at
`+3`): `HANGAR_FORMAT_LETTERS` equals `["w","x","y","z"]`; the two emitted formats are `x` and `w`;
`y` and `z` are claimed by neither; and stamp.ts's comment-stripped code, with the reservation
line removed, contains no `"y"` or `"z"` literal. **`y` and `z` were left deliberately**, unclaimed,
because D-14 Q7 decided a surface shares as a file - a fixed sixteen-region envelope would be some 420
characters of hash - and the playground's `/playground/<id>#z.<stamp>` share is unchanged.

## The e2e title: the whole loop on a fake

`e2e/sandbox.e2e.ts`, chromium, with the fake ZONA exposed and granted before the page loads
(install.e2e.ts's `openReal`): the template's Fader and Button (page 3's `Filter` and `Hold`), the
surface renamed `Loop`; `Export as a file` -> the browser's download `loop.hangar.json`, parsed
(`app: hangar`, `kind: sandbox`, two regions by name and kind); My configs, `import-file` fed the same
bytes, `2 saved configurations`, the saved row's `Open` -> `/sandbox/s-.../?from=...` with `Loop` and
both regions; the header's slot clicked, six heartbeats to S4, `ZONA IDENTIFIED` in the bar, five
CONFIG/FETCH and zero writes, the destination zone at `reported` on page 2, Store on ZONA disabled,
PUT BACK visible; `Apply to ZONA` -> `PLAYING NOW`, five CONFIG/EXECUTE, one restore heartbeat, no
store; the fake's RAMs: 255/6 and 255/0 the library, **255/4 a body of 706 characters carrying
`R=function`** (not the module's own), the Setup calling `ele[#ele]:map()`, `self:tim()` and
installing `self.touch_cb=O` (387), the Timer `gtt(0,100)` ... `X(self,20)` (29 - the whole runtime
fits 255/4 for two elements, so the Timer is the arm and the sweep), the flash untouched; Store on
ZONA opens the confirmation in its place and NOT NOW closes it with nothing stored; PUT BACK ->
`RESTORED`, ten CONFIG/EXECUTE, every slot the module's own again (the owner's utility script back on
their button). No console error on the whole loop.

## Row M, as written

> **M** | The Sandbox surface installed (D-03, D-18, D-19; 13-17) _(after H)_ | **After row H.** In
> the Sandbox build the PDF's page 3: a 2 × 6 Fader, a 3 × 3 XY pad, a 3 × 3 Knob, a 2 × 2 Button.
> Connect, read `Target`, click `Apply to ZONA`, wait for the bar's applied clause, open a MIDI
> monitor. Play each region; drag a finger off the fader's end; press the button and lift cleanly,
> then press and roll off its edge; press the module's utility button. Then click `PUT BACK`. |
> Report: does each region respond only within its own rectangle (a press on the seam between two
> lands on one of them, never both); does a finger dragged off a fader's end keep driving that fader
> (a contact keeps its region for the whole gesture - 13-15 test 1); does the button's note stop when
> you lift, **and when you lift badly** (the four release paths; within two seconds at worst, the
> Timer's expiry sweep); does the pad light where your finger is, in the region's colour; **does the
> module's utility button do nothing while the surface is installed** (255/4 holds the runtime's
> second slot, not page-next - D-19's consequence, said in constants.ts); and does `PUT BACK` bring
> your own configuration back on all five slots, the utility button turning the page again if it did
> before. **Write down which of the five questions fail, and for the button, which lift.** | Every
> string in this row is a VM-measured text (13-15) sent to a fake ZONA (13-17) that acknowledges
> whatever it is given. Whether the firmware registers a 255/4 body written by CONFIG/EXECUTE and runs
> it from the touch Setup's `ele[#ele]:map()` at install time (the second probe lit cell 80 through
> Grid Editor, never through HANGAR's writer - row H), whether the utility button is really silent
> under the surface, whether the runtime feels right under a finger, and whether `PUT BACK`'s five
> writes leave the module exactly as it was are module facts. Nothing in plan 13-17 claims the install
> works; this row is where it would. |

Appended after row L at the table's widths in code points (7 / 72 / 426 / 1732 / 1062 / 6), no row
re-wrapped (`git diff --numstat` 5 / 0: the row and a four-line dated paragraph), prettier clean;
thirteen lettered rows. The plan's fallback clause ("or, on the fallback branch, four faders and a
button") is not written: the branch was decided (three slots). Unanswered; handed over at 13-20,
after row H.

## Every ledgered string

Seven rows under "From 13-17" in `13-COPY-NEW.md`: `CONFIRM_REPLACES` (five scripts), `LandedWords` /
`FailedWords` (four rows each, `the utility script` third), `partialBlock(...).steps[0]` (all five),
`overElementLine(word, used, over)`, `EXPORT_SURFACE`, `NO_LINK_EXPLANATION`, `exportedLine(fileName)`.
**Verbatim and not ledgered:** `Apply to ZONA` (page-target.ts's, 13-12's), `Store on ZONA`
(`STORE_LABEL`, section 9's state machine), `Target`; the Store on ZONA reasons are `KEEP_REASONS`,
unchanged. Five questions follow (below).

## The negative checks

Every one from a scratch copy of the shipped file, restored by copy-back with sha256 compared either
side (identical each time); the second task's codec check planted in `stamp.ts` and restored to the
same hash, `git diff --quiet` on it after. No `git checkout`, `git restore`, `git stash` or `git
clean` was run.

| # | Task | Plant | Red on |
| --- | --- | --- | --- |
| N1 | 01 | a branch on a kind in the store: a landing with a utility body of its own takes `cleared` instead of `settled` | test 25 `expected 'cleared' to be 'settled'` (the phases differ between the surface's rig and the entry's); test 27 behind it |
| N2 | 01 | a frame on the refusal path (a heartbeat sent before `#tryRefusal` returns) | test 27 `frames the refusal produced: expected 8 to be 7` - the count, by name |
| N3 | 01 | the utility row swapped before 255/0 in `SLOTS` | test 26 `the refused utility never reached the module: expected '--[[@cb]]S=S or{}...' to be '--[[@cb]]function M:map()return 5 end'` (refusing the third write refused 255/0 and the utility landed); test 25 on the frames |
| N4 | 02 | `y` allocated for a surface (`export const HANGAR_FORMAT_SURFACE = "y"` in `stamp.ts`) | the e2e title `stamp.ts claims y somewhere: expected false, received true` - by letter, on the source, with the diff not consulted |
| N5 | 02 | one region corrupted in the exported file and re-imported (`Hold` at col 8; `Hold` at col 1) | 13-13's validator refuses at step 5 with the region named: `Hold lies outside the 9 × 9 surface.` / `Hold overlaps Filter.` (run through `classifyImport` in a scratch spec, deleted after) |

## The full chunked e2e result

Five chunks on fresh detached servers (`e2e-chunks-1208.sh`), on the build of the committed tree
`cbac25d`, with **0.04-0.29 GB of memory free** on the machine for most of the run (the earlier
plans ran at 0.2-1.3 GB; two chunks lost their wrangler to it):

| Chunk | Files | Result |
| --- | --- | --- |
| 1 | install, session | first run 8 + 26: **wrangler died mid-chunk** (`ERR_CONNECTION_REFUSED` on twenty tests) after the gate's own two "retried under three workers" reds (`install:436` CONFIG/FETCH 11 for 10, `:547` `write-system-timer ok 3`); **rerun whole 30 + 4**: `install:651` (FETCH 21 for 20, a retried fetch), `install:1813` (EXECUTE 11 for 10, a retried write), `session:1099` (identification timeout), `install:1948` webkit-phone CLEAR (the brief's transient) - **all four green alone at `--workers 1`**, the CLEAR title in both projects (5 runs) |
| 2 | browse, browse-webkit | **21 passed** (1.2 m) |
| 3 | tuning, tuning-webkit | first run 20 failed: **wrangler died at the chunk's start** (`Could not connect to server`, `ERR_CONNECTION_REFUSED` on every title); **rerun whole 20 passed** (1.0 m) |
| 4 | catalog, fidelity, first-experience, library, **sandbox** | first run 10 + 3 at 0.26 GB: `first-experience:323` (waitForFunction 30 s), `library:55` (the opened page's hash not yet in the URL), `sandbox:105` (My configs' `library-count` not found in 5 s on the cold page - past the area-first step the focus fix cleared); **rerun whole 13 passed** (26.4 s) including all three sandbox titles |
| 5 | artifacts, radius, skeleton, smoke | **11 passed** (45.0 s) |

34 + 21 + 20 + 13 + 11 = **99 runs, 83 titles**, every red rerun whole or alone and green. Before the
chunks, `sandbox.e2e.ts` ran alone three times: red on its first title (below), green 3 / 3 after the
fix, and the loop title alone once more red by name under the codec's negative check.

## Deviations from the plan

**1. [The brief's mandate; Rule 3 - Blocking] The fifth string across twenty-six files, in its own
commit (`6e4f13b`).** The plan names eight files; the brief says the fifth string will move more and
names 12.1-07's list. Every file is listed with its rule below. `sequence.ts` moved by the row, its
two keys and the comments the row made untrue - reported above under the "stop and report" clause.

**2. [Rule 1 - Bug, in 13-16's plate] `SurfaceEditor.svelte`'s `plate.focus()` on pointerdown
scrolled the page under a pressed pointer.** A programmatic focus scrolls a partly visible element
into view; the release then landed on another cell, and the drag accelerator read it as the second
click - one click placed an element AND started an area (`e2e/sandbox.e2e.ts:105` red on
`Fader 1, Fader, selected` where `Click the far corner` was expected, deterministically). This plan's
taller tools row (the share control) put the plate partly below the fold at click time, which 13-16's
layout had not. `focus({ preventScroll: true })`; the pointer is already on the plate. Commit
`cbac25d`. `sandbox-ui.spec`'s scans of the plate (the click path from `onpointerdown`, no `onclick(`
in `onpointermove`) unchanged and green.

**3. [Rule 3 - Blocking] `tune-ui.spec.ts`'s error-ink census widened by one** to admit
`SurfaceActions.svelte` on section 12's own row ("Validation and transfer errors" - the transfer half):
the over-budget refusal under a disabled Apply is a transfer refused before it starts, in the ink, on
a sentence and never on the button. Commit `6599c9f`.

**4. [Design, inside the plan's words] `SurfaceActions.svelte` carries two zones.** The plan names one
component for Apply / Store (task 01) and for the share control (task 02); the two live in different
places on the page (the bar's destination zone; the tools row), so the component takes
`zone="destination" | "share"` rather than exporting a snippet.

**5. [Design] Store on ZONA and PUT BACK in the destination zone.** The Sandbox has no install column
and the runbook's row M needs PUT BACK reachable where the visitor applied; both are the existing
controls (`install.openConfirm()` with `KeepConfirm` in the control's place; `PutBack.svelte`), no
new confirmation, phase or action. Question 3 asks whether they should live under Device actions.

**6. [Design] The permutation test samples 24 of 120.** `sequence.spec.ts`'s "the caller's key order
changes nothing" ran all 24 permutations of four; all 120 of five cost 9.6 s of queue timers (the test
timed out at 5 s), so every fifth is run - twenty-four rigs as before - with the sample's coverage
ASSERTED (every key at every position at least once) rather than assumed.

**7. [Design] A saved copy opens onto a fresh surface** (`/sandbox/?from=<id>`) - 13-16's hand-off
asked for "a way back onto a surface"; the alternative (editing the copy in place under the copy's
id) would shadow the original draft on the same browser. Question 5.

**8. [Scope, additive] `src/routes/my-configs/+page.svelte`**: a sandbox copy's `Open` goes to the
front door with `?from`; the unused `SANDBOX` constant went with it (lint).

**9. [Design] `emit.ts`'s parameter default stays 2**; 13-15's hand-off said "the `slots` default flips
to 3 there". The route, the preview and the landing all pass 3 (`SLOTS`, `PREVIEW_SLOTS`,
`LANDING_SLOTS`); flipping the emitter's default would move `emit.spec.ts`'s two-slot pins for
nothing. The header says so.

**10. [Scope] BUILD-03 / 05, SAFE-01 / 02 / 03 / 07 / 09, KEEP-04 and SHARE-01 are evidenced and not
ticked** - every plan of this phase has left REQUIREMENTS.md to the gate; `requirements mark-complete`
was not run for the reason `gsd-tools state` was not. CAT-04 stays `[ ]`.

**11. [Process] `gsd-tools state` commands not run.** STATE.md by script against a copy with every
touched line asserted and `status`, `completed_phases 11`, `percent 100`, `total_plans 160`,
`completed_plans 152` unchanged; Phase 13 to 17 of 20 beside Phase 12 and Phase 12.1 (both gate
landed, bench pending).

**12. [Process] Three commits, not two.** The fifth string is a prerequisite of task 01 and is one
atomic change across twenty-six files; task 01 and task 02 follow it.

## Every file outside the plan's list, with its rule

The plan lists `land.ts`, `install.spec.ts`, `install.svelte.ts`, `transfer.ts` (unchanged - nothing
was needed), `SurfaceActions.svelte`, `sandbox.e2e.ts`, `INSTALL-RUNBOOK.md`, `13-COPY-NEW.md`.

| File | Rule | What |
| --- | --- | --- |
| `src/lib/transport/sequence.ts` | the hand-off's row; the brief's mandate | the 255/4 row, its key on `ConfigSet` / `FetchedSet`, the comments the row made untrue |
| `src/lib/transport/sequence.spec.ts` | Rule 3 (12.1-06's shape) | five everywhere; 255/4 written once and third; the row's place; 24 of 120 permutations with coverage asserted |
| `src/lib/transport/capture.ts` | Rule 3 (12.1-06 deviation 1) | `fetch-/write-/refetch-system-utility` pinned |
| `src/lib/protocol/write-guard.ts` | Rule 3 (12.1-06) | `FetchedEvent.label` admits `System utility` |
| `src/lib/protocol/constants.ts` | the brief's mandate (D-19's pending removal) | `EVENT_UTILITY`, `SYSTEM_DEFAULT_UTILITY`, the header rewritten |
| `src/lib/protocol/constants.spec.ts` | Rule 3 | the fifth default pinned against the package, exported, distinct, canonical; no `gpl(` in code |
| `src/lib/transport/fixtures/synthetic.ts` | comment only | `ramRead`'s comment: 255/4 answered by the same fall-through since 13-17; no line of code moved |
| `src/lib/tune/model.ts`, `model.spec.ts` | Rule 3 (12.1-07's shape) | `ConfigStrings.systemUtility` published empty by both routes; five keys asserted |
| `src/lib/device/snapshot.ts`, `snapshot.spec.ts` | Rule 3 (12.1-07's shape) | v4 beside v3; `fromV3`; the spec's nine tests over v4 with the v3 half in test 9 |
| `src/lib/device/install-copy.ts`, `install-copy.spec.ts` | Rule 2 (12.1-07 deviation 1; 12.1-08) | the unions over five, the confirmation, the step; `AMENDED_BY_THE_FIFTH_SCRIPT` |
| `src/lib/device/wire-pin.spec.ts` | Rule 3 (12.1-07 deviation 3; 12.1-08) | five frames; the fifth's bytes pinned (empty, length 0, through `writeAll` alone) |
| `src/lib/device/page-target.spec.ts` | Rule 3 (12.1-07) | one key |
| `src/lib/ui/TryOnDevice.svelte`, `TuningRegion.svelte`, `src/routes/playground/[id]/+page.svelte` | Rule 3 (12.1-07 deviation 2) | `systemUtility: string` on the three structural types |
| `src/lib/ui/InstallState.svelte`, `src/lib/ui/shell/device-clause.ts` | Rule 3 (12.1-08 deviation 1) | the union literals they name |
| `src/lib/ui/tune-ui.spec.ts` | Rule 3 | the error-ink census admits `SurfaceActions.svelte` |
| `src/lib/ui/sandbox/SurfaceEditor.svelte` | Rule 1 | `focus({ preventScroll: true })` |
| `src/routes/dev/install/+page.svelte` | Rule 3 (12.1-08's shape) | the fifth textarea `install-system-utility`, third on the page; `pair()` over five; `install-snapshot` five lengths plus ` v3` |
| `src/routes/dev/skeleton/+page.svelte` | Rule 3 (12.1-06's R-15) | the D-09 guard, the readout, the write-back status and the store proof over five |
| `src/lib/sandbox/preview.ts` | 13-16's hand-off | three slots with the `map` stand-in; the refusal gone |
| `src/lib/sandbox/copy.ts` | the plan's ledger rule | `STORE_LABEL`, `overElementLine`, `EXPORT_SURFACE`, `NO_LINK_EXPLANATION`, `exportedLine` |
| `src/lib/sandbox/emit.ts`, `runtime.ts` | comments only | where the slot flip landed and why the parameter default stayed |
| `src/routes/sandbox/[draftId]/+page.svelte`, `src/routes/sandbox/+page.svelte` | 13-16's hand-off | `SLOTS = 3`, the landing observed, the destination snippet, the export, `?from` |
| `src/routes/my-configs/+page.svelte` | Rule 3 (13-16's hand-off: a copy's way back) | a sandbox copy's `Open` |
| `e2e/install.e2e.ts`, `e2e/session.e2e.ts` | Rule 3 (12.1-08's needle table) | every count of four to five; `MODULE_SYSTEM_UTILITY`; the fifth textarea read; `afterTxFrames` 8; the partial's drops 5, 6, 7 |

`e2e/fake-zona.ts`, `library.ts`, `lua-host.ts`, `firmware-oracle.spec.ts`, `protocol-pin.spec.ts`,
`forbidden-instructions.spec.ts` (255/4 is a `CONFIG` class the eight-builder gate already admits; no
forbidden needle is named - green and unedited), `src/vendor/`, `.planning/ROADMAP.md`,
`12-touch-framework/`, `12.1-gradient-touch/`, `docs/TESTING.md`: untouched.

## Anything the plan or the hand-off asserts that the tree does not support

- The plan's `PREV_FILES 93 / PREV_TESTS 932` and `check-counts 93 935`: the tree stood at 94 / 958;
  `94 961` was asserted.
- The plan's "three strings ... the classifier that names which of the three landed" and the
  hand-off's "four is the base case; the stop-and-ask fires on five": five is the recorded design
  (D-18, D-19); recorded with the arithmetic and continued, as the brief instructed.
- The plan's "`sequence.ts` is not edited": the row needs its key on the two sets (above).
- The plan's "an element, a colour or a name pushed it over": only an element can, in this tree.
- The plan's key_link "`writeBoth`, `storeToFlash` and `writeBack` unchanged": `writeBoth` left the
  tree at 12-03 (`sequence.spec.ts` asserts its absence by name); `writeAll`, `writeBack`,
  `storeToFlash` are unchanged.
- The plan's key_link pattern `landLua`: the tuner has no export by that name; it is the summaries'
  name for `measureLuaRoute`'s `land(...)`, and `land.ts`'s header names it as such.
- The plan's `bible/HANGAR-ZONA-GUI-design-specification.md:438`: the Bible sits at the repository
  root, untracked (the user's), not under `bible/`; §9's state machine (its line 267) is where `Store
  on ZONA` is.
- The plan's "the codec's own assertion ... if none exists, write one": the codec's spec holds the
  letters outside the payload alphabet and containing `x` and `w`, not that `y` and `z` are unclaimed;
  the assertion was written in the e2e title rather than as a fourth unit test.
- 13-15's hand-off "the `slots` default flips to 3 there": flipped in the route, the preview and the
  landing; the emitter's parameter default stays (deviation 9).
- 13-16's hand-off "PUT BACK exists" as a condition of the flip: PUT BACK existed in the store since
  Phase 7; what this plan added is its mount on the Sandbox and the fifth slot in its snapshot.
- The plan's negative check "reorder the three writes - expect test 2 red": the writes are five, and
  a reorder can only be planted in `SLOTS` (the store cannot reorder them); the test reads the order
  off the list, so it went red on the classifier's state assertion rather than on the frames.
- The plan's e2e verify `npx playwright test --workers 3 | check-counts --playwright 99`: the suite
  cannot run in one process on this machine (13-07's chunks; two wrangler deaths under 0.3 GB free
  this run); 99 is the sum over five chunks and the reruns.
- The plan's "`install.e2e.ts`'s counts of four become five where a surface is installed": every
  count moved, because every install writes five - a Lua entry lands the firmware default at 255/4
  and the fake sees a CONFIG/EXECUTE carrying `gpl(gpn())` there (19 characters); a surface's carries
  the runtime's second slot (706 for page 3, 706 for the template's two elements).

## Known Stubs

- **My configs' sandbox thumbnail is still unlit** (13-13's, carried through 13-16): not this plan's;
  `deferred-items.md` carries it for 13-20.
- **The destination zone renders in the Sandbox only with a session** (13-12's rule); without one
  the bar says "Preview without hardware" as before - not a stub, the same rule.

## Questions for the user

Five, in `13-COPY-NEW.md` under "From 13-17": (1) whether a catalog entry should write page-next into
255/4 (D-19's consequence as shipped) or leave the slot as the snapshot found it; (2) `the utility
script` as the slot's word; (3) Store on ZONA and PUT BACK in the destination zone or under Device
actions; (4) the over line naming the last element; (5) a saved copy opening onto a fresh surface.

## For 13-18, 13-20

- **13-18**: seven rows and five questions under "From 13-17"; `install-copy.ts`'s sentences now name
  five (`CONFIRM_REPLACES`, four partials, "all five") and `SNAPSHOTTING_BODY` / `identifiedBody` still
  name three scripts (12.1-08's hand-off, unmoved here); the panel's "the record predates the
  utility slot" line would fire on `snapshotFromV1 || snapshotFromV2 || snapshotFromV3` and is not
  written.
- **13-20**: the Phase 13 offset's term from this plan is `+0 / +3`, e2e `+1 / +1`, check +2 (655 ->
  657); row M handed over after H; BUILD-03 (a surface installs) and BUILD-05 (over budget refused
  before the wire) evidenced by `install.spec.ts` tests 25-27 and the loop title; SAFE-01 / 02 / 03 /
  07 / 09 by the same tests over five; KEEP-04 by the export; SHARE-01 by the codec's proof;
  `deferred-items.md` should carry D-19's consequence for catalog entries (question 1) beside the
  unlit thumbnail.

## The runbook and the bench

No device was connected to, written to or deployed to by this plan. Nothing was installed. **Nothing
here is claimed to work on hardware: the 255/4 write has never left a fake, and row M says so.**
CAT-04 stays `[ ]`. `.planning/ROADMAP.md`, `12-touch-framework/`, `12.1-gradient-touch/`,
`src/vendor/` untouched; `library.ts` and `lua-host.ts` read, never edited; `firmware-oracle.spec.ts`,
`protocol-pin.spec.ts` and `forbidden-instructions.spec.ts` green and unedited; no `git checkout`,
`git restore`, `git stash` or `git clean` was run; every restore was a copy back with the hash
compared. The three untracked root files are the user's.

## Self-Check: PASSED

- `src/lib/sandbox/land.ts` (contains `system`, `landLua`, `landSurface`) - FOUND
- `src/lib/ui/sandbox/SurfaceActions.svelte` (contains `apply-to-zona`, `store-on-zona`, `export-surface`) - FOUND
- `src/lib/sandbox/land.ts` -> `src/lib/transport/sequence.ts` via the five keys `SLOTS` names, through `install.tryOnDevice` -> `writeAll` - FOUND (install.spec.ts test 25)
- `src/lib/sandbox/land.ts` -> `src/lib/tune/model.ts` via the same `ConfigStrings` shape (`landLua`) - FOUND
- `docs/INSTALL-RUNBOOK.md` contains `| **M** |` - FOUND; thirteen lettered rows
- `.planning/phases/13-gui-overhaul/13-COPY-NEW.md` contains `## From 13-17` - FOUND
- commits `6e4f13b`, `6599c9f`, `cbac25d` - FOUND in `git log`
- `+0 / +3` observed as 94 / 961 (+1 todo); e2e 83 / 99; sweep 4 19; check 657 / 0 / 0; codec byte-identical
