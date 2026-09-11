---
phase: 13-gui-overhaul
plan: 12
subsystem: device
tags:
  [
    page-target,
    destination-review,
    page-switch,
    ack-gate,
    unverified,
    heartbeat-first,
    pagecount,
    pagediscard,
    per-page-snapshot,
    put-back-names-its-page,
    zero-writes-extended,
    write-clicks-five,
    forbidden-instructions-amended,
    d-06,
    d-19,
    hard-phase-12-band,
    runbook-row-i,
    copy-ledger,
    negative-checks,
    counts,
  ]
requires:
  - phase: 13-gui-overhaul
    plan: 13
    provides: "PREV_FILES 89 / PREV_TESTS 921 (+1 todo) / e2e 79 titles, 95 runs / check 624 / sweep 4 19 / catalog 26 / radius allowlist 0 rows, observed at d2ba520; the workspace route carrying a duplicate `type Landing` named for this plan"
  - phase: 13-gui-overhaul
    plan: 11
    provides: "the destination zone's read-only `Page {n}` label with a comment naming this plan; device-clause.ts; the install column shown until this plan; device-ui.spec.ts at 16; the finding that KeepConfirm does NOT trap focus and test 8 forbids it"
  - phase: 12-touch-framework
    plan: 02
    provides: "the descriptor shape and its response filter; the two-map fixture beside the moduleState factory (eighteen call sites, not re-keyed); the comment-naming-a-gate lesson; the negative-check method with counts asserted before the plant"
  - phase: 12-touch-framework
    plan: 03
    provides: "hangar.snapshot.v2 beside v1, read and never overwritten; the store over three strings; CLEAR resetting both events; the runbook's lettered rows and the append-only rule"
  - phase: 12-touch-framework
    plan: 12
    provides: "the gate's install shape (255/0 -> 0/6 -> 0/0 under writeAll) and rows A-H, the next letter being I"
  - phase: 13-gui-overhaul
    plan: context
    provides: "D-06 (the page target switches the hardware page, inside six clauses), D-19 (Editor parity: the envelope's click, review, ACK gate, per-page snapshot and bench row are safety features and stand; 12-02's 255/4 refusal is 13-17's pending removal and is untouched here), D-01 (ask where not sure), D-05 (the register), D-15 (six circles, untouched)"
provides:
  - "THREE PAGE DESCRIPTORS with offsets read from the pinned package inside the test: pageActive (PAGEACTIVE 0x030, PAGENUMBER at 5/2, addressed, NO filter because firmware answers the EXECUTE with nothing), fetchPageCount (PAGECOUNT 0x031, PAGENUMBER at 5/2, FETCH only, REPORT from the global position), discardPage (PAGEDISCARD 0x063, LASTHEADER at 5/2, the store's shape, UNPROVEN). The plan's fourth - a PAGEACTIVE FETCH - is not shipped because grid_decode.c:312-352's switch has an EXECUTE case and a REPORT case and nothing else"
  - "forbidden-instructions.spec.ts amended by name under D-06 and D-19: the erase and the clear still forbidden everywhere; the page change and the discard permitted in descriptors.ts ALONE and asserted absent from every other shipped module, comments included; eight builders, closed again"
  - "src/lib/device/page-target.ts, zero static specifiers: the four states reported / requested / switching / unverified, canApply() as the ONE condition, request() sending nothing, confirm() sending heartbeat(255) THEN the switch through the one queue's sendImmediate, observeReport() as the ACK gate on the module's own report, a 1500 ms window (PAGE_SWITCH_WINDOW_MS = 6 x MODULE_HEARTBEAT_MS = IDENTIFY_WINDOW_MS) landing `unverified` and never `switched`, enumerate() from PAGECOUNT's answer with the digit four absent from the file; and the words"
  - "install.svelte.ts: ./page-target as the FOURTH static specifier; the mirror (pageStatus, pageReported, pageRequested, pages, applyReady); the report fed from #onClassSeen's microtask off the identity's activePage; the enumeration once per connection as the snapshot's last read (fetch-page-count); requestPage / cancelPage / confirmPage, the last being the only caller of the target's confirm(); pageSettled() read by tryOnDevice, putBack, clearEnabled, openConfirm and keepOnDevice; revertToStored (the discard) reachable from /dev/install/ only"
  - "DestinationReview.svelte: section 16's title and D-06's sentence verbatim, the identity and the configuration beneath, `Switch page` / `Keep this page`, a group that moves focus in and never traps it, no skip and the reason in its header; mounted once in the workspace's destination zone under the Target select and Apply to ZONA, with the switching and unverified lines beside it"
  - "PUT BACK names its page before it acts: putBackPageLine(page) and putBackPageLineAfterKeep(page) as two more sizing twins in PutBack.svelte's 72px cell; TRY ON DEVICE, PUT BACK, CLEAR disabled on install.applyReady while connected"
  - "The by-class zero-writes proof EXTENDED: install.e2e.ts test 1 and session.e2e.ts's onlyReads count the switch and the discard at zero beside the config write, the store and the heartbeat, and PAGECOUNT/FETCH at one per connect; session.spec.ts test 15's needle list at eleven (pageActive); WRITE_CLICKS at five (`Switch page`)"
  - "The synthetic ZONA models the switch (answered by nothing, the page moving as grid_ui.c:1017), the page count (firmware's initial 4 named ONCE, in the fixture), the discard (RAM from flash, acknowledged), page_change_enabled cleared by every accepted write (:1279) and set by a host heartbeat 255 (:717) - so a switch straight after a write is refused by the fake exactly as by a module unless the heartbeat went first; fake-zona.ts hands every class to it and learned all of that with no line of its own"
  - "docs/INSTALL-RUNBOOK.md row I, appended, unanswered; 13-COPY-NEW.md: eight rows and seven questions from 13-12"
affects: [12.1-06, 12.1-07, 12.1-08, 13-14, 13-17, 13-18, 13-20]
tech-stack:
  added: []
  patterns:
    - "A control that moves hardware is a plain class with an onChange mirror into the runes store, so node drives it off the wire against the scripted module and the components read scalars; the ONE gate condition lives in the class and is mirrored, never restated, by the components"
    - "A fire-and-forget instruction whose only confirmation is an unsolicited report is modelled as such: no response filter, sendImmediate, and the state machine's exit is the report the module already sends beside every heartbeat"
    - "A firmware fact that decides whether an instruction is honoured (page_change_enabled) is modelled in the fixture, so a test of call ORDER is a test the fake would fail without the order rather than a test of the code's own sequencing"
    - "A gate that forbade a class by name is amended by name with the decision that supersedes it, narrowed to the one module that may encode it, and the thing still forbidden is restated rather than left to analogy"
key-files:
  created:
    - src/lib/device/page-target.ts
    - src/lib/device/page-target.spec.ts
    - src/lib/ui/DestinationReview.svelte
    - .planning/phases/13-gui-overhaul/13-12-SUMMARY.md
  modified:
    - src/lib/protocol/descriptors.ts
    - src/lib/protocol/descriptors.spec.ts
    - src/lib/protocol/constants.ts
    - src/lib/protocol/write-guard.ts
    - src/lib/protocol/forbidden-instructions.spec.ts
    - src/lib/transport/capture.ts
    - src/lib/transport/fixtures/synthetic.ts
    - src/lib/device/install.svelte.ts
    - src/lib/device/install.spec.ts
    - src/lib/device/install-copy.ts
    - src/lib/device/install-copy.spec.ts
    - src/lib/device/session.spec.ts
    - src/lib/config-shape.spec.ts
    - src/lib/ui/PutBack.svelte
    - src/lib/ui/Clear.svelte
    - src/lib/ui/TryOnDevice.svelte
    - src/lib/ui/shell/ContextBar.svelte
    - src/lib/ui/device-ui.spec.ts
    - src/lib/ui/instrument.spec.ts
    - src/routes/playground/[id]/+page.svelte
    - src/routes/dev/install/+page.svelte
    - e2e/install.e2e.ts
    - e2e/session.e2e.ts
    - e2e/fake-zona.ts
    - docs/INSTALL-RUNBOOK.md
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
key-decisions:
  - "NO PAGEACTIVE FETCH. The plan names four descriptors; three ship. grid_decode.c:302-357 handles the class with a switch over EXECUTE and REPORT only, so a FETCH would be a request that times out on every module, and the report arrives beside every heartbeat anyway. Recorded as a plan assertion the firmware does not support"
  - "NO NEW SNAPSHOT KEY, and that is a finding, not an omission. snapshot.ts has been keyed by module AND page since Phase 7 (its header's rule 2; readSnapshot(store, moduleId, page, ...)), 13-RESEARCH says so in Q6 ('the store is already keyed by page, so this works'), and #pageCheck re-snapshots the new page when the module moves. The key is still `hangar.snapshot.v2`; a pre-plan snapshot reads exactly as 12-03 left it; snapshot.ts is byte-unchanged. 12.1-07's next key is `hangar.snapshot.v3`"
  - "THE REPORT IS THE IDENTITY'S activePage, not a class the store parses itself. D-10's fold already moves it only for a PAGENUMBER riding beside a heartbeat with no EVENTTYPE and no ACTIONLENGTH, so a CONFIG/REPORT can never land in the target; the store reads it one microtask after the heartbeat, where #pageCheck already reads it"
  - "THE ENUMERATION IS THE SNAPSHOT'S LAST READ, once per connection. After the timer fetch and before `ready`, so every existing step-id array gains one trailing id and no id moves; a module that does not answer offers only its reported page and `ready` is not withheld"
  - "canApply() HAS TWO TERMS THAT BACK EACH OTHER UP - at rest, and reported === requested - and the negative check had to plant BOTH to go red: with the machine's invariant (requested follows reported at rest) either term alone catches every reachable state. Left as it is, because a redundancy that costs nothing and catches a future state is not a defect"
  - "THE REVIEW MOVES FOCUS IN AND NEVER TRAPS IT. The plan's '13-11's shared helper' does not exist; 13-11 recorded that KeepConfirm does not trap and test 8 forbids a dialog, aria-modal, inert and a trap. The review is a role=group with tabindex=-1, focus moved to the container on mount, returned to the Target select by the route on close - the tree's one focus contract for a confirmation. Question 4 asks whether the one confirmation that moves hardware should be the exception"
  - "SECTION 9's SKIP CLAUSE IS DECLINED in the component's header with its own condition quoted: nothing configures 'safe and clearly configured', and the review is the one gate between a web page and the ZONA changing what it plays. device-ui.spec.ts asserts no checkbox, no remembered destination, no don't-ask-again on the path, and the header sentence by name"
  - "THE AFFIRMATIVE IS THE FIFTH WRITE CLICK, IN D-05's REGISTER. `Switch page` and `Keep this page` live in install-copy.ts (WRITE_CLICKS imports nothing, so the label had to), sentence case because the review sits in the Bible's bar beside `Apply to ZONA`; install-copy.spec.ts exempts the two from the uppercase rule BY NAME with that reason and 13-18 decides the other nine. Every long string this plan invented lives in page-target.ts, outside install-copy's contract gate"
  - "PAGEDISCARD SHIPS AS A DESCRIPTOR AND A PROBE-ONLY ACTION (revertToStored, the store's shape, landing `restored` or `kept` after a keep), and as NO public control, until runbook row I says what a module does with it. The research supports it from source (:895-915, :872-885); nothing here claims it works"
  - "APPLY TO ZONA DUPLICATES TRY ON DEVICE FOR ONE WAVE. Both are install.tryOnDevice() on the same gate; the column stays because PUT BACK, KEEP ON DEVICE, CLEAR and the install blocks have no home on PDF page 5 and 13-11's question 1 is open. Question 6 asks which plan moves it"
  - "THE FORBIDDEN-INSTRUCTIONS GATE WAS AMENDED, NOT WEAKENED: the erase and the clear are still named by no shipped module, the page change and the discard by descriptors.ts alone. The gate caught this plan's own comments twice (constants.ts, capture.ts, install.svelte.ts) before the run went green - exactly the job 12-02 recorded it doing"
patterns-established:
  - "An unsolicited report as the ACK gate: the state machine's exit is the module's own report, the wait is a window in one constant read from the package's heartbeat interval, and a timeout is a rendered state named for what is known, never a success"
requirements-completed: [SAFE-01, SAFE-03, SAFE-04, SAFE-05, SAFE-07, SAFE-09, CONN-08]
duration: 190min
completed: 2026-09-11
---

# Phase 13 Plan 12: The page target, the one control that moves the hardware, inside D-06's envelope Summary

**The `Target` select is real and the ZONA on the desk moves when it is confirmed - and only then.
Three page descriptors joined the five with their offsets pinned from the package inside the test;
`page-target.ts` holds the four states and the one condition; the affirmative sends the restore
heartbeat and THEN the switch, in an order the scripted ZONA now refuses without (it models
`page_change_enabled` cleared by every write and set only by a heartbeat 255), proved off the frames
in node and in the browser; the module's own page report is the gate that re-enables Apply, and a
1500 ms window without it lands `unverified` - not switched, not failed, a line that says which page
was asked for and which the module last reported. The review names both pages in D-06's sentence on
first use and on every change and cannot be skipped. PUT BACK's line names the page it holds before
the click. The by-class zero-writes proof counts the switch and the discard at zero beside the config
write and the store, in the probe and on the workspace; `WRITE_CLICKS` is five; the session's needle
list is eleven. The discard is written, modelled, unproven, and reachable from the probe alone. No
new snapshot key, because the record has been keyed by page since Phase 7. Counts: `PREV_FILES 89 +
1 = 90`, `PREV_TESTS 921 (+1 todo) + 1 (12.1-08a, concurrent) + 6 = 928 (+1 todo)`, e2e `79 + 1 =
80` titles / `95 + 1 = 96` runs, check 627 / 0 / 0, sweep `4 19`, catalog 26, allowlist 0 rows.
Nothing touched a ZONA, nothing was deployed, and the switch is NOT claimed to work on hardware:
runbook row I is where it would.**

## Performance

- **Duration:** about 190 min, of which about 45 were the five e2e chunks run, rerun and the two
  built negative checks
- **Tasks:** 2 of 2
- **Files:** 3 created (+ this document), 26 modified, across two commits plus this document's own

---

## The four descriptors the plan asked for, and the three that ship

Every offset below was READ from the pinned package's class table inside `descriptors.spec.ts`'s
new test (`grid.getProperty("CLASSES")`), so the test pins the package rather than a number typed
here. The firmware lines are citations, read in `../grid-fw/common/src/c/`, never edited.

| Builder | Class / code | Field | Instruction | Reply | Firmware |
| --- | --- | --- | --- | --- | --- |
| `pageActive(sx, sy, page)` | `PAGEACTIVE` `0x030` | `PAGENUMBER` at offset 5, length 2 | `EXECUTE`, addressed | **none** - no filter, `sendImmediate` | `grid_decode.c:302-357`: returns silently when already on the page (`:310`), when `page_change_enabled` is 0 (`:319`), when a bulk operation runs (`:325`); starts the page load at `:349`; the active page moves at `grid_ui.c:1017`; the report rides beside every type-1 heartbeat (`grid_transport.c:199-203`) |
| `fetchPageCount(sx, sy)` | `PAGECOUNT` `0x031` | `PAGENUMBER` at 5, length 2 | `FETCH`, addressed | `PAGECOUNT/REPORT` from the global position, `PAGENUMBER` = `page_count` | `grid_decode.c:359-385`; `page_count` initialised to 4 at `grid_ui.c:77` - a number that appears in HANGAR's fixture once and in shipped code never |
| `discardPage()` | `PAGEDISCARD` `0x063` | `LASTHEADER` at 5, length 2 | `EXECUTE`, broadcast | `PAGEDISCARD/ACKNOWLEDGE` echoing the id, after the reload | `grid_decode.c:895-915` reloads `grid_ui_page_get_activepage()` from NVM with `grid_protocol_nvm_load_success_callback` (`:872-885`); dropped with no reply under a bulk operation (`:907-909`), like a store. **Unproven on hardware** |
| _the plan's `pageActive()` FETCH_ | - | - | - | - | **not shipped.** The class's decoder is a `switch (instr)` with a `GRID_INSTR_EXECUTE_code` case and a `GRID_INSTR_REPORT_code` case and nothing else (`:312-352`): a FETCH is neither answered nor refused, so a descriptor for it would be a request that times out on every module. It is also unnecessary - the module reports its page four times a second unasked |

The other line numbers the plan cites were verified as it asked: `:1272` `currentpage`, `:1279`
`page_change_enabled = 0` inside the accepted-write branch, `:717` `page_change_enabled = type == 255`,
`:904` / `:976` / `:1048` the three page-less EXECUTEs, `grid_ui.c:471` the inactive-page early
return, `grid_ui.c:77` `page_count = 4`, `grid_ui.c:79` `page_change_enabled = 1` at boot.

**`forbidden-instructions.spec.ts` had to move, and moved by name.** Phase 2's D-06 forbade the
page-change class "forever" and closed the builder set at five; Phase 13's D-06 (the user, knowing the
cost) and D-19 (Editor parity) supersede that. Test 1 still forbids the NVM erase and the page clear in
every shipped module; test 2 now asserts both directions - the page-change and page-discard classes
are named by `src/lib/protocol/descriptors.ts` and by NO other shipped module, comments included - so
a hand-built frame or a comment naming either class outside the one encoder is still a gate failure;
test 3 (TYPE 254 never sent) is unchanged; test 4 counts eight builders. The gate bit this plan three
times on its own comments (`constants.ts`, `capture.ts`, `install.svelte.ts`) before the run went
green, which is what 12-02 said it was for.

## The store: four states, one condition, one window

```
reported    the page the module last REPORTED beside its heartbeat. Rest. requested === reported
requested   the review is open; nothing has been sent
switching   heartbeat(255) and the switch have left; the report is awaited
unverified  the window closed with no report carrying the requested page. NOT switched. NOT failed
```

`canApply()` - the one condition every write reads - is `status === "reported" && reported !==
undefined && requested === reported`. The install store mirrors it as `applyReady` from the same
`onChange` and never recomputes it; `tryOnDevice` (through `#tryRefusal`'s new `page-pending`),
`putBack`, `clearEnabled`, `openConfirm` and `keepOnDevice` refuse on `pageSettled()`; TRY ON DEVICE,
Apply to ZONA, PUT BACK and CLEAR disable on `applyReady` while connected.

**The window is `PAGE_SWITCH_WINDOW_MS = 6 * MODULE_HEARTBEAT_MS` = 1500 ms**, declared in
`constants.ts` beside `IDENTIFY_WINDOW_MS` (the same arithmetic, asserted equal in test 3) and handed
to `page-target.ts` by the install store because that module imports nothing. On a healthy link the
report carrying the new page is at most one heartbeat period away, since the active page moves at the
START of the load.

**The ways out of `unverified`**: the module's report carrying the requested page (the late
confirmation, test 3), a reconnect (`reset()` on every "connected" and "closed"), and - a decision
recorded as question 2 - the visitor's own `Keep this page` (the target snaps to the module's page)
or a new request. A report carrying some OTHER page while unverified updates `reported` and keeps the
state, so the line keeps saying what is known. Never a retry counter, never a second timer.

## The frame order, as test 1 recorded it

`page-target.spec.ts` test 1 first runs `writeAll` against the scripted ZONA, which since this plan
sets its `pageChangeEnabled = false` on every accepted write (`:1279`), and deliberately does NOT send
the install store's own restore heartbeat - so the switch below can succeed only if the target sends
its own. Then `request(3)` (asserted to write nothing), then `confirm()`. The last two frames on the
wire, decoded:

```
HEARTBEAT/EXECUTE    TYPE 255                       (restore-page-change)
PAGEACTIVE/EXECUTE   PAGENUMBER 3, DX 0, DY 0       (switch-page)
```

and the fake ACCEPTED it: `state.activePage === 3`, `pageChangeEnabled === true`. Exactly two frames;
no `CONFIG/`, no `PAGESTORE/`. The negative check dropped the heartbeat and the assertion went red at
`expected [ 'CONFIG/EXECUTE', ... ] to deeply equal [ 'HEARTBEAT/EXECUTE', ... ]` - the fake refused
the switch and the last two frames were the write's. The browser proved the same order off the frames
the page wrote (`writesOf`, decoded in node): `[["HEARTBEAT/EXECUTE"], ["PAGEACTIVE/EXECUTE"]]`.

## The snapshot key that did not change, and what a pre-plan snapshot reads as

The plan says the record "becomes keyed by identity and page" and asks for "a new key beside the old
one". **The tree does not support the premise**: `snapshot.ts`'s header, rule 2 - "THE RECORD IS
KEYED BY PAGE UNDERNEATH THE MODULE" - has been true since Phase 7; `readSnapshot(store, moduleId,
page, systemDefault)` and `persistIfAbsent(store, moduleId, page, ...)` take the page; the install
store's `#pageCheck` re-snapshots the new page when the module's report moves and the record
accumulates a second entry rather than shadowing the first. 13-RESEARCH Q6 says it in one clause:
"the store is already keyed by page, so this works." So:

- **the key that shipped is `hangar.snapshot.v2`, unchanged**; `snapshot.ts` is byte-unchanged
  (`git diff --quiet d2ba520 HEAD -- src/lib/device/snapshot.ts`);
- **a pre-plan snapshot reads exactly as 12-03 left it**: v2 first, then v1 with the caller's default
  and `fromV1: true`;
- **12.1-07 takes `hangar.snapshot.v3`** as "the next key after whatever 13-12 leaves".

What this plan ADDED for D-06's fourth clause is the naming: PUT BACK's line under the control reads
the page the snapshot holds before the click (below). In the browser title, after the switch to Page
3 and the module's report, the store re-snapshotted Page 3 and `put-back-page-line` read `Puts Page 3
back to what it was playing when you connected.` with `PUT BACK` enabled - the page named before it
acts, and the page the visitor is looking at, because the re-snapshot follows the module.

## PUT BACK's sentence, verbatim

> Puts Page 2 back to what it was playing when you connected.

and after a keep this session:

> Puts Page 2 back to what it was playing when you connected, and stores it so it stays.

Both are `page-target.ts`'s (`putBackPageLine`, `putBackPageLineAfterKeep`), rendered by
`PutBack.svelte` as two more sizing twins in the 72px cell beside Phase 10's three (which stay
rendered and are the fallback for a snapshot with no page); the longest of the five is 88 characters,
under the 101 the cell was measured for and under `PUT_BACK_CAP`. Not a confirmation: PUT BACK has
none by Z-04 ("a gate on the escape hatch is the one place a gate does harm"), and D-06 asks that the
copy name the page "before doing it", which the line under the control does.

## The zero-writes proof, before and after

**`session.spec.ts` test 15's needle list** (the session may reach none of these):

| Before (ten, since 10-12) | After (eleven) |
| --- | --- |
| `.write(`, `RequestQueue`, `hostHeartbeat`, `sendConfig`, `storePage`, `fetchConfig`, `storeToFlash`, `writeBack`, `clearToDefault`, `setInterval` | the same ten, plus **`pageActive`** |

**`WRITE_CLICKS`** (install-copy.ts): `["TRY ON DEVICE", "PUT BACK", "KEEP ON DEVICE", "CLEAR"]`,
length 4 -> `[..., "Switch page"]`, **length 5**; `install-copy.spec.ts` asserts the five against the
five labels and the label count at eleven (nine, plus `SWITCH_PAGE_LABEL` and `KEEP_PAGE_LABEL`, the
two exempted from the uppercase rule by name).

**`install.e2e.ts` test 1's by-class list** over a connect-and-snapshot journey: `SERIALNUMBER/FETCH`
1, `CONFIG/FETCH` 3, `CONFIG/EXECUTE` 0, `PAGESTORE/EXECUTE` 0, `HEARTBEAT/EXECUTE` 0, four frames ->
the same plus **`PAGECOUNT/FETCH` 1, `PAGEACTIVE/EXECUTE` 0, `PAGEDISCARD/EXECUTE` 0**, five frames,
and `install-pages` reading `0 1 2 3`. **`session.e2e.ts`'s `onlyReads`** likewise: the switch and
the discard at zero, PAGECOUNT at one per connect, five chunks per connect. Extended; nothing
excepted.

**The new browser title** (`install.e2e.ts`, chromium, untagged): the select lists `Page 0`, `Page 1`,
`Page 2 · on ZONA`, `Page 3` (the fake's firmware-initial four, never a number in the page); focusing
and clicking the select sends nothing; choosing Page 3 opens the review reading `Switch your ZONA to
Page 3? It will stop playing Page 2.` with Apply and TRY ON DEVICE disabled and nothing sent; `Keep
this page` snaps the select back and re-enables Apply, nothing sent; choosing again reviews again;
`Switch page` puts exactly `HEARTBEAT/EXECUTE` then `PAGEACTIVE/EXECUTE` on the wire (the order read
off the frames), the bar reads `Switching to Page 3…`, and Apply, TRY ON DEVICE, the select, PUT BACK
and CLEAR are all disabled; one pushed heartbeat carries the fake's moved page, the target settles,
the select reads `Page 3 · on ZONA`, Apply is live, and PUT BACK's line names Page 3. Whole: one
switch, one heartbeat before it, zero config writes, zero stores, zero discards, one enumeration.

## `PAGEDISCARD`: descriptor, action, no control

Shipped as `discardPage()` and as `install.revertToStored()` - the store's wire shape (a broadcast, an
id-correlated acknowledgement, `pagestoreMs`, a page reload that restarts the VM) under the same lock,
slow line and generation check as a store leg, the restore heartbeat after it, landing `restored` (or
`kept` after a keep this session, because the module then runs what flash holds); refused on the same
gate as a clear. The synthetic ZONA answers it (RAM from flash for both elements, then the ACK) and
`fake-zona.ts`'s acked classes gain it so a test can drop its acknowledgement. **Reachable from
`/dev/install/`'s `Revert to what is stored (unproven)` button and from no public control** until
runbook row I. `DISCARD_LABEL` (_Revert to what’s stored_) is ledgered for the control that ships only
if the bench confirms; if the bench refuses, the action goes and the snapshot restore was never
removed.

## Runbook row I, as written (appended after H; no existing row re-wrapped; prettier clean)

> **I** | The page switch, a switch after an Apply, the discard (D-06; 13-12) | On `/playground/aurora/`,
> connected, module on **Page 1**. Open the bar's `Target` select; read it; choose `Page 3`; **read the
> review**; click `Switch page`; watch the pad. At `Page 3 · on ZONA` click `Apply to ZONA`. Read the
> line under `PUT BACK`; click it. Go back to `Page 1`. Then `Apply to ZONA` on Page 1 and **at once**
> switch to `Page 3`. Then, on `/dev/install/` after `Try on device`, click the discard button. | The
> select lists exactly the pages the module reports - **write down how many, and whether they start
> at 0 or 1** - and opening it does nothing to the pad. The review reads `Replace the configuration on
> ZONA · Page 3?` over `Switch your ZONA to Page 3? It will stop playing Page 1.` with `Switch page` and
> `Keep this page`; nothing has happened yet. On `Switch page` the pad changes to what Page 3 holds
> within about a heartbeat; the bar reads `Switching to Page 3…` then `Page 3 · on ZONA`; `Apply to
> ZONA`, `TRY ON DEVICE`, `PUT BACK` and `CLEAR` are disabled until that report and live after it. **If
> the bar reads `Your ZONA hasn’t confirmed Page 3. It last reported Page 1, and nothing was applied.`,
> that is `unverified`: record it, what the pad did, and whether the line cleared on the next
> heartbeat.** After `Apply to ZONA` the pad plays Aurora on Page 3 and the line under `PUT BACK` reads
> `Puts Page 3 back to what it was playing when you connected.` - **the page named before the click**;
> `PUT BACK` brings Page 3's own back. The switch back reviews again and Page 1 is as you found it.
> **The switch straight after an Apply must succeed exactly as the first did** - the restore heartbeat
> precedes every switch, so the write's `page_change_enabled = 0` is undone; **record whether it did,
> and how long the bar read `Switching…`.** The discard: the pad returns to what Page 3's flash holds
> (your own, unless a row E keep stored) and the probe's `install phase` reads `restored` (`kept`
> after a keep); **record whether the acknowledgement arrived, how long it took, and whether the pad
> restarted.** | _(the why-a-machine-cannot column: firmware answers the switch with nothing; the
> page_change_enabled reading is the fake's because it was told to; PAGEDISCARD is source-verified and
> wire-unproven; nothing in plan 13-12 claims the switch works on hardware - this row is where it
> would)_

12.1-08 takes J and K.

## The focus-trap finding

The plan: "It traps focus and returns it (13-11's shared helper)." The tree: there is no shared
helper; 13-11-SUMMARY.md records that `KeepConfirm.svelte`'s header forbids a dialog role,
`aria-modal`, an inert background and a focus trap, that `device-ui.spec.ts` test 8 asserts it is an
inline group and never modal, and that 13-11 did not build the trap test the plan wanted "because it
would assert something the tree rules out". `DestinationReview.svelte` follows the one focus contract
the tree has for a confirmation: `role="group"`, `tabindex="-1"`, focus moved to the container on
mount (the title and the sentence are read before either button), Escape inside dismisses, and the
route returns focus to the Target select on close. A trap was not built; the header says why and
question 4 asks whether the one confirmation that moves hardware should be the exception.

## The strings, ledgered (13-COPY-NEW.md, "From 13-12")

The three the plan names, verbatim as landed:

- the `unverified` line: _Your ZONA hasn’t confirmed Page 3. It last reported Page 1, and nothing was
  applied._ (and _Your ZONA hasn’t confirmed Page 3. Nothing was applied._ if the module never
  reported);
- PUT BACK's page-naming line: _Puts Page 2 back to what it was playing when you connected._ (and its
  after-keep form);
- `PAGEDISCARD`'s label: _Revert to what’s stored_ - conditional on the bench.

Plus five more rows the plan did not foresee: `switchingLine` (_Switching to Page 3…_),
`SWITCH_PAGE_LABEL` (_Switch page_), `KEEP_PAGE_LABEL` (_Keep this page_), the select's `· on ZONA`
marker, and the review's detail line (_ZONA · fw 1.5.5 · Arc will be applied to Page 3_). Taken
verbatim and not ledgered: `Target`, `Apply to ZONA`, the PDF's `Page 1` shape, section 16's _Replace
the configuration on ZONA · Page 2?_ and D-06's sentence. Seven questions for the user follow the
rows; they are restated at the end of this document.

---

## Deviations from the plan

### 1. [Rule 3 - Blocking] `forbidden-instructions.spec.ts` forbade the classes the plan adds

Not in the plan's file list. Test 1 scanned every shipped module for `PAGEDISCARD`, test 2 forbade
`PAGEACTIVE` in `descriptors.ts` "forever", test 4 closed the builders at five. Amended by name under
D-06 and D-19 as described above; the erase and the clear stay forbidden; the two classes are
permitted in `descriptors.ts` alone with both directions asserted. **Commit:** `53649bc`.

### 2. [Rule 3 - Blocking] `capture.ts`'s `STEP_IDS` gained three ids

`RequestQueue.request` / `sendImmediate` take a `StepId`; `switch-page`, `fetch-page-count` and
`discard` were added beside the fourteen, none of which moved (12-02's precedent). **Commit:**
`53649bc`.

### 3. [Rule 1 - Bug, in the plan's premise] The fake ZONA is `synthetic.ts`, not `fake-zona.ts`

The plan says `fake-zona.ts` "learns an active page ... NACKs a CONFIG write whose page is not active
(which ... the fake has never modelled)". `fake-zona.ts` hands every class to `synthetic.ts`'s
`zonaResponder` (its header's thing 1), which has NACKed an off-page write since Phase 7. The
modelling landed where the responder is: the switch, the count, the discard, `pageChangeEnabled`
cleared by writes and set by heartbeat 255. `fake-zona.ts` gained the `PAGEDISCARD` acked class and a
header paragraph saying what it learned and where. **Commit:** `53649bc`.

### 4. [Rule 3 - Blocking] `install.svelte.ts` needed a fourth static specifier, and three lists knew three

`./page-target` joined `./install-copy`, `./snapshot` and `./session.svelte`. `install.spec.ts` test 8
(exactly three, now four), `config-shape.spec.ts`'s `PERMITTED_SPECIFIERS` (the chunk guard walks it
and marker-checks its imports - none) and `device-ui.spec.ts`'s copy of the list were widened by name.
**Commit:** `26320fd`.

### 5. [Rule 2 - Missing critical functionality] `install-copy.ts` and its spec carry the fifth write click

The affirmative's label had to live where `WRITE_CLICKS` lives (a zero-import module); `install-copy.ts`
is 13-18's module and was touched for two labels and one array entry only, the labels in D-05's
register and exempted from the uppercase rule by name in `install-copy.spec.ts` (eleven labels, five
clicks). Every long string this plan invented is in `page-target.ts`, outside install-copy's contract
gate. **Commit:** `26320fd`.

### 6. [Rule 1 - Bug] Three `session.e2e.ts` tests unplugged the cable while the snapshot was still in flight

Their `onlyReads` at the end assumes each snapshot ran to its last chunk; `connected` does not imply
that (its own header says so) and the unplug used to race the snapshot's tail - rarely lost at four
chunks, lost on the first run at five (`PAGECOUNT` expected 2, received 1: the first connect's count
never went out). The three tests now wait for the probe's `install-phase` to read `ready` before the
unplug, the causal signal `onlyReads` itself describes. `onlyReads` polls `PAGECOUNT/FETCH` as the last
chunk and counts five per connect. **Commit:** `26320fd`.

### 7. [Rule 3 - Blocking] `instrument.spec.ts`'s pilled-control list gained the review's affirmative

Scan 2 derives the pilled controls from the directory and holds them against a hand list; the
affirmative wears `.pill` as KeepConfirm's does and the list says so with the reason. Its first draft
also overrode the pill's 24px inline padding, which the same scan refused; the override went.
**Commit:** `26320fd`.

### 8. [Rule 1 - Bug] `clearReason()` would have called a pending target "no session"

With a session and a snapshot in hand and the target pending, the closed three-word record had no
honest word; `clearReason` now returns "no-session" only when there is no session and `Clear.svelte`
disables on `applyReady` and holds its last reason exactly as it does through a write. The record was
not widened (it is 13-18's, and a fourth reason was refused by name in 10-12). **Commit:** `26320fd`.

### 9. [Rule 1 - Bug] The workspace route's duplicate `type Landing` (13-13's deferred item)

Named for this plan; the local copy is gone and `stamp.ts`'s union is imported as a type (erased;
`config-shape.spec.ts` test 13 exempts `import type` and the module still arrives through the awaited
import). **Commit:** `26320fd`.

### Not deviations, but plan assertions the tree does not support (each above in its own section)

- the fourth descriptor (a `PAGEACTIVE` FETCH): the firmware has no case for it;
- the new snapshot key: the record has been keyed by page since Phase 7;
- "13-11's shared helper" for a focus trap: it does not exist and the tree forbids what it would do;
- "`descriptors.ts` exports ... and nothing else" (true) but the plan's "the fake has never modelled"
  the off-page NACK (false since Phase 7).

---

## The negative checks - six plants, six reds, every one reverted from a scratch copy with sha256 either side

| # | Task | Plant | Where | Observed | Exit |
| --- | --- | --- | --- | --- | --- |
| 1 | 01 | the restore heartbeat dropped from `confirm()` | `page-target.ts`, 1 replacement | test 1 red: `expected [ 'CONFIG/EXECUTE', ... ] to deeply equal [ 'HEARTBEAT/EXECUTE', ... ]` - the fake refused the switch | 1 |
| 2 | 01 | the window's expiry lands `reported` and snaps `requested` (a timeout as success) | `page-target.ts`, 1 replacement | test 3 red: `expected 'reported' to be 'unverified'` | 1 |
| 3 | 01 | `pages = [0, 1, 2, 3]` regardless of the answer | `page-target.ts`, 1 replacement | test 4 red: `expected [ +0, 1, 2, 3 ] to deeply equal [ +0, 1 ]` | 1 |
| 4 | 02 | `confirm()`'s guard (`status !== "requested"`) removed - a switch without the review | `page-target.ts`, 1 replacement | `device-ui.spec.ts` test 17 red naming the guard line | 1 |
| 5 | 02 | Apply enabled while `reported !== requested` | `page-target.ts` | **green on either term alone** - the two terms of `canApply()` back each other up (see key decisions); **red with both planted**: test 2 `a review is open: expected true to be false`, test 3 the same for `unverified` | 0 then 1 |
| 6 | 02 | a probe frame (`pageActive`) sent on the menu's request, in the BUILT site | `install.svelte.ts`, 1 replacement, `npm run build`, the one title on a fresh server | the extended proof red naming the class count: `"switches": 0` expected, `"switches": 1` received | 1 |

The first draft of plant 6 also confirmed the review away, and the title went red one line EARLIER
(`destination-review` not visible) - suspected as the warning says and re-planted so the count
assertion was the one to fire. Checksums, every planted file, identical before and after:

```
page-target.ts     (task 1)  9d030eafbfe039ea85fe2c6d2d01bdeb697949981f95d34dc7f8bdc8573e2149
page-target.ts     (task 2)  f8171b114d1fb61726c4171697a9400c6986d540a5e956ed23ed0e215fed2fcc
install.svelte.ts  (task 2)  b09ec318828f6fa3639a0af9d63495048ea4112888fb72fc80bf198165f1f8f6
```

The build was re-made from the clean tree afterwards (`postbuild: 15fca3e…`), radius layer B green on
it, and the new title and test 1 green on a fresh server against it.

---

## Counts, as carried names plus deltas

Measured at this plan's start on `d2ba520`, as the orchestrator stated them; **12.1-08a landed
concurrently** (`1eb90ae`..`15fca3e`, five commits between this plan's two) at `+0 / +1`
(`lua-smoke.spec` 36 -> 37), so the observed totals carry both terms.

| Name | Carried from | 12.1-08a (concurrent) | This plan's term | Observed |
| --- | --- | --- | --- | --- |
| `PREV_FILES` | **89** (13-13) | +0 | **+1** (`page-target.spec.ts`) | **90** |
| `PREV_TESTS` | **921** (+1 todo) | +1 | **+6** = `descriptors.spec` +1 (13 -> 14), `page-target.spec` 4, `device-ui.spec` +1 (16 -> 17) | **928** passed, 1 todo |
| `BASE_SWEEP` | `4 19` | +0 | +0 | `4 19` |
| e2e titles | **79** | +0 | **+1** (`install.e2e.ts`, chromium, untagged: 14 -> 15) | **80** (`grep -c "test("` summed) |
| e2e runs | **95** | +0 | **+1** | **96** = 34 + 21 + 20 + 10 + 11 over five chunks |
| `BASE_CHECK` | 624 | (files moved) | provenance | **627 files, 0 ERRORS 0 WARNINGS** |
| catalog | 26 | +0 | +0 | 26 (`LISTING.length`; untouched) |
| radius allowlist | 0 rows | - | +0 | 0 rows; layers A and B green on a fresh build |
| runbook rows | A-H (8) | - | **+1** | A-I (9) |

`check-counts.mjs 90 928` and `check-counts.mjs 4 19` both report "matches the expected counts".
`protocol-pin.spec.ts` green (5) and byte-unchanged; `sequence.ts` byte-unchanged (`git diff --quiet
d2ba520 HEAD -- src/lib/transport/sequence.ts`, exit 0 - the one writer did not move);
`src/vendor/`, `.planning/ROADMAP.md`, `12-touch-framework/`, `12.1-gradient-touch/` and
`firmware-oracle.spec.ts` untouched by this plan; CAT-04 stays `[ ]`.

### The suites, as run

| Command | Result |
| --- | --- |
| `npm run check` | 627 files, 0 errors, 0 warnings |
| `npm run lint` | clean (prettier + eslint) |
| `npm run test:quick` | 90 files / 928 passed / 1 todo |
| `npm run test:sweep` | 4 files / 19 passed |
| `npm run build` | clean, `postbuild: 15fca3e…`, source archive 1954 KB |
| e2e chunk 1 (`install`, `session`), fresh server, 3 workers | 34 runs: **32 passed, 2 red** on each of three whole runs - a different pair each time (`session:878` replug and the webkit CLEAR; then `session:847` unplug and the webkit CLEAR, while the quick suite ran alongside; then the try-on trace with `write-system ok 2` and the workspace not visible in 5 s) - **every red green alone** (`reds1` 4 passed, `reds2` 2 passed); a fourth whole run died mid-chunk on wrangler's known fatal (`ERR_CONNECTION_REFUSED`) and is not counted |
| e2e chunk 2 (`browse`, `browse-webkit`) | 21 passed |
| e2e chunk 3 (`tuning`, `tuning-webkit`) | 20 passed |
| e2e chunk 4 (`catalog`, `fidelity`, `first-experience`, `library`) | 10 passed |
| e2e chunk 5 (`artifacts`, `radius`, `skeleton`, `smoke`) | 11 passed |
| the new title and test 1 alone on the clean final build | 2 passed; "the report needed 1 heartbeat(s)" |

The chunk-1 reds are the load transients the orchestrator listed (a retried write counted twice, a
page not painted in 5 s, the snapshot's tail racing an unplug - the last now waited on, deviation 6),
each named and each green alone; no red named a page target, a review, a switch or a count this plan
wrote.

---

## What 12.1 Band 2 will find

- **`sequence.ts` byte-unchanged** since `d2ba520`; `restorePageChange` and `targetOf` read, not
  edited. `writeAll` is still the three-`writeOne` function; `SLOTS` is 12.1-06's to introduce.
- **`snapshot.ts` byte-unchanged**; the key is `hangar.snapshot.v2`; the next key is
  `hangar.snapshot.v3`; `readSnapshot` still takes one `systemDefault` (12.1-07 widens it to two).
- **`constants.ts`**: `PAGE_SWITCH_WINDOW_MS` added beside `IDENTIFY_WINDOW_MS` (14 lines); the
  "WHY EVENTS 4 AND 6" header is untouched and is 12.1-06's to rewrite; 12-02's 255/4 refusal is
  neither restated nor removed here (D-19: 13-17's pending removal).
- **`install.svelte.ts`**: `ConfigStrings` is still three keys; `#snapshot` gained the enumeration
  after `fetchAll` and before the guard (so 12.1-07's "four reads" becomes five chunks with the count
  last); `tryOnDevice` / `putBack` / `clearToDefault` / `keepOnDevice` / `openConfirm` each gained a
  `pageSettled()` refusal; `revertToStored` is new; the plan's line citations (`:759-770`, `:905-925`,
  `:975-1045`, `:630-700`, `:1241-`) have all moved down - search by name.
- **`install.spec.ts`**: the connect step arrays end in `fetch-page-count`; the disconnect fault sits
  at `afterTxFrames: 6`; five chunks at connect; four specifiers.
- **`install.e2e.ts`**: `moduleState` is still at its eighteen call sites plus one (`moduleState(19)`,
  the new title), not re-keyed; test 1 counts five frames and the three page classes; the put-back
  lines are page-named through `putBackPageLine(ACTIVE_PAGE)`.
- **`e2e/session.e2e.ts`**: `onlyReads` counts five chunks per connect and PAGECOUNT at one; three
  tests wait for `ready` before their unplug.
- **`fake-zona.ts`**: `AckedClass` gained `PAGEDISCARD`; the fixture's model of the switch lives in
  `synthetic.ts` (`pageCount`, `pageChangeEnabled`, four new branches).
- **`docs/INSTALL-RUNBOOK.md`**: rows A-I; the two letters after this plan's are J and K.

## Questions for the user (D-01), also in 13-COPY-NEW.md

1. **Page numbers**: HANGAR shows the module's own 0-3 (as the header's control and 13-11's label
   already did); Grid Editor shows 1-4 over the same wire values (`Pages.svelte:9-14`). Under D-19 the
   Editor is the reference; one constant plus the header's identity line changes it. Which?
2. **`unverified`'s third way out** is the visitor's own `Keep this page` or a new request (a live
   module that silently refused would otherwise leave Apply disabled with no way back but the cable).
   Keep it, or clear the line on the module's next report of ANY page?
3. **Section 9's skip clause is declined** (nothing configures "safe and clearly configured"; D-19 says
   the user can strike the review in one word). Strike, keep, or a setting later?
4. **The review is not modal and does not trap focus**, by the tree's rule for every confirmation.
   Accept for the one control that moves hardware, or make it a real dialog?
5. **The review opens inside the context bar** under the select and the bar grows to hold it; the
   surface moves down while it is open. Accept, or anchor it as a popover?
6. **Apply to ZONA in the bar duplicates TRY ON DEVICE** under the surface for one wave. Which plan
   moves or removes the column - 13-18 with the words, or 13-20?
7. **If row I confirms the discard**, where does its control go - under Device actions beside Reset
   (section 9's D03 row), or beside PUT BACK?

## What was NOT done, and why

- **No device was touched and nothing was deployed.** Every ZONA in this plan is `synthetic.ts`'s
  responder in node or in a Playwright worker; the firmware facts are a source reading of
  `../grid-fw`, cited by line and never edited. **The switch is not claimed to work on hardware**; the
  page_change_enabled ordering is the case most likely to be refused on a module, and row I is where
  it meets one.
- **`gsd-tools state` commands not run**; STATE.md by script against a copy with `status`,
  `completed_phases 11`, `percent 100` asserted unchanged; `roadmap update-plan-progress` skipped;
  REQUIREMENTS.md untouched (the phase's convention; SAFE-03/05/07 were amended by 12-12 and are
  12.1-09's to amend again).
- **`prettier --write .` not run**; `app.css`'s `@source not inline(...)` untouched.
- **The install column stays** under the surface (question 6).
- **A concurrent agent (12.1-08a) ran alongside** despite "no other agent is running": five commits
  landed between this plan's two, `STATE.md` already carried "Phase 13 at 12 of 20 with 13-12 in
  flight on its own files" and its test counts measured this plan's uncommitted files. Its edits to
  `ghost.ts`, `demo.ts` and `lua-smoke.spec.ts` were never touched here; the one lua-smoke red seen
  mid-plan was its in-flight GHOST re-fit and went green when it committed. Reported, not reconciled.

---

## Commits

| Commit | What |
| --- | --- |
| `53649bc` | `feat(13-12): three page descriptors with the package's offsets, the page target with reported, requested, switching and unverified, the heartbeat-first switch asserted off the wire, the enumeration from PAGECOUNT, and the fake ZONA modelling the switch and the write that disables it` - 10 files, +1257 / -28 |
| `26320fd` | `feat(13-12): the destination review naming both pages and unskippable, the Target select and Apply to ZONA in the bar over the module's own enumeration, every write gated on the page target's one condition, PUT BACK naming its page before the click, the zero-writes proof extended to the switch and the discard, the discard as a probe-only action, and runbook row I` - 20 files, +1526 / -118 |

`1eb90ae`, `eedf056`, `0cc9248`, `72eb6c3` and `15fca3e` sit between them and are 12.1-08a's, not
this plan's.

## Self-Check: PASSED

`src/lib/device/page-target.ts`, `src/lib/device/page-target.spec.ts`,
`src/lib/ui/DestinationReview.svelte` FOUND on disk; commits `53649bc` and `26320fd` FOUND in
`git log --oneline --all`; `page-target.spec.ts` 4 green, `device-ui.spec.ts` 17 green,
`descriptors.spec.ts` 14 green; quick suite 90 / 928 (+1 todo) green whole; sweep 4 19; check 627 /
0 / 0.
