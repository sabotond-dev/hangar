# Phase 7 - deferred items

Out-of-scope discoveries, logged rather than fixed, each with who owns it. Created by 07-01.

## Inherited from Phase 6 (`.planning/phases/06-device-session/deferred-items.md`)

Carried by pointer, not copied; that file keeps the reasoning.

- **Item 8** - `e2e/first-experience.e2e.ts:156` and `:535` press keys before any hydration marker.
  Neither site fired in 07-01's clean-tree run (`first-experience.e2e.ts` 11 passed at `--workers 3`).
  **Owner:** 07-11, the first Phase 7 plan that edits that file. The fix is the one-line wait
  `await expect(band).toHaveAttribute("data-ready", "true")` before the first press at both sites.
- **Item 5** - a Playwright run writes `test-results/`. Removed by hand after 07-01's run; every plan
  that runs e2e removes it by hand.
- **Item 7** - e2e runs at `--workers 3` (`npm run test:e2e -- --workers 3`), because
  `playwright.config.ts` does not pin it and this phase does not edit that file. 07-01 ran it so and
  it passed first time.
- **Items 10 to 13** - the panel's `TRY ON DEVICE` live in S5 (10, which this phase's 07-10 resolves
  by making the button write), a second HANGAR tab told to quit Grid Editor (11), no idle-timeout
  close on a hidden tab (12), no staleness signal for a silent module on an attached port (13). None
  is 07-01's; the owners are as 06-14 recorded them.

## 1. `ROADMAP.md` ticked `07-01-PLAN.md` before the plan ran (found by 07-01)

At `145f85d`, the commit Phase 6 closed on, `.planning/ROADMAP.md` line 214 already read
`- [x] 07-01-PLAN.md — ... (completed 2026-09-05)` while the progress row beneath still read
`7. Install Flow | 0/TBD | Not started | -`. The tick was premature at that commit and is true now;
07-01 left the line and corrected the progress row by hand. Whoever ticks 07-02 onward should check
the line they tick was not already ticked, and the roadmap's Phase 7 row should be read from the
SUMMARY files on disk rather than from the checklist.

**Owner:** each later plan's roadmap update; no code.

## 2. `storeToFlash`'s `id` parameter is unread and carries a lint directive (found by 07-02)

07-02 removed the `storeAllowed` throw (D-18), which was the only reader of `id` inside
`storeToFlash(q, id)`. The plan keeps the parameter for provenance and symmetry, so the function now
carries `// eslint-disable-next-line @typescript-eslint/no-unused-vars` above it. The first plan
that reads `id` in the store path (07-07's `KEEP ON DEVICE`, which re-fetches on `id.activePage`
after the ACK, or any plan that stamps the step with the module's address) should delete the
directive in the same edit; a stale disable directive is reported by eslint and would fail
`npm run lint`.

**Owner:** 07-07, or the first plan that reads `id` in `storeToFlash`; one line.

## 3. `/dev/skeleton/+page.svelte` still greys its store button on `storeAllowed` (noted by 07-02)

Phase 2's skeleton page reads `Identity.storeAllowed` to disable its store control on a rig. The
field still exists and is still computed, so the page works exactly as Phase 2 built it; but the
rule it renders is the one SAFE-06 superseded. 07-02 edits no route by design. Whether the skeleton
page should follow SAFE-06 (store allowed, other modules named) or keep Phase 2's rule as a record
of what the hardware run was measured under is a call for whoever next touches that page; the
shipped install surface is not affected.

**Owner:** none assigned; not a Phase 7 requirement. Recorded so nobody reads the skeleton page as
the current rule.

## 4. `07-UI-SPEC.md` disagrees with itself by two words on the `unconfirmed` step (found by 07-03)

The I11 section (`### I11 — unconfirmed`) gives step 1 as `Click KEEP ON DEVICE and confirm to send
the store again`; the Copywriting Contract table beneath it gives the same row as
`Click KEEP ON DEVICE to send the store again`. The plan names the table as the source, so the
table's form is what `install-copy.ts`'s `unconfirmedBlock` carries and what `install-copy.spec.ts`
test 2 matches against the document. The two say the same thing; the section's form is the more
precise one (the click opens the confirmation, and the confirmation sends the store). If the
contract's owner prefers the section's wording, the table row and the literal change together and
test 2 stays green by construction.

**Owner:** the contract's owner, at the next revision of 07-UI-SPEC; no code until then.

## 5. `SNAPSHOT_SESSION_LINE` is authored, unseen by the UI checker, and has no contract row (found by 07-04)

07-CONTEXT D-04 (amended) requires an honest session-only sentence for the header disclosure when
the module's serial went unanswered and the copy is held only until the tab closes. 07-UI-SPEC's
Copywriting Contract has a row for the durable form (`Header disclosure — the snapshot line`) and
none for this one, so 07-04 authored it: `A copy of your ZONA’s own Setup and Timer is held until
this tab closes, so it can be put back while you are here.` - 114 characters, under the same 129 cap
as its sibling, names no control, real apostrophe. It lives in `src/lib/device/session-copy.ts`
beside `SNAPSHOT_DURABLE_LINE` (both are header-disclosure strings read by DeviceDetails), and
`session-copy.spec.ts` tests 5 and 6 hold its literal, its length and its typography. It is NOT in
`install-copy.ts`: that module's spec test 2 matches every literal over 40 characters against the
contract on disk, and a sentence the contract does not carry would be red there by construction.

If the contract's owner adds the row (and, if preferred, wants the literal beside the install
sentences), the row and a one-line move change together and either spec can hold it.

**Owner:** the contract's owner, at the next revision of 07-UI-SPEC; no code until then.

## 6. `TryOnDevice.svelte` carries a `svelte/no-unused-props` directive for a prop nothing reads yet (found by 07-05)

07-05 threads the tuner's compiled pair to `TryOnDevice.svelte` as `config?: { setup: string; timer: string }`
and the plan says the component "reads it nowhere yet" - 07-10 is its consumer. An unread prop fails lint from
either side: bound in the destructure, `@typescript-eslint/no-unused-vars` fires; declared in the props type and
left unbound, `svelte/no-unused-props` fires on the destructure line. 07-05 chose the unbound form (one rule, not
two) with `// eslint-disable-next-line svelte/no-unused-props -- ...` and its reason directly above `let {`, the
form `Coverflow.svelte` and `BrowseGrid.svelte` already carry for `prefer-svelte-reactivity`. Inventing a read (a
data attribute, say) to satisfy the linter would have shipped behaviour the plan did not ask for.

**Owner:** 07-10, which binds `config`, hands it to the install store and must remove the directive - eslint
reports an unused directive as a warning the moment the prop is read, so it cannot be forgotten silently.

## 7. The D-03 gate sits before the durable record is consulted (named by 07-06, deferred to 07-13)

`install.svelte.ts`'s `#snapshot` runs `canWriteBack` on the fetched pair BEFORE `readSnapshot` consults the
durable record, as 07-06's interfaces block orders it. Consequence: a module this browser remembers, whose
RAM reads empty on the page it is on (a factory-blank element, or a fetch answered from a page that is not
active), lands `snapshot-failed` and is NOT offered its own recorded original for `PUT BACK`, although the
record exists and would be the right thing to offer. The store's header names this; `install.spec.ts`
test 3 pins the shipped order (nothing persisted, nothing offered, on an empty fetch).

The reorder is a few lines - consult the record first and let a valid entry stand in for an empty fetch -
and a test-3 inversion, but it waits on the Z-16 versus D-03 question 07-VALIDATION leaves open (the UI
spec reads "non-empty" as "both fetches ACK'd"; the user's D-03 says "present and non-empty"; the plans
implement D-03). Whoever rules on that question rules on this.

**Owner:** 07-13's deferred items and the user's D-03 ruling; no code until then.

## 8. Negative check "set `armed` from `partial`" is unobservable as a `#recomputeArmed` widening (found by 07-07)

07-07's plan lists seven negative checks, the fourth being "set `armed` from `partial` (test 13's reason)".
Read as widening `#recomputeArmed`'s phase test to `settled || unconfirmed || partial`, the mutation
cannot turn test 13 red: `armed` also requires `lastWritten` to equal the tuner's pair, and a try-on that
lands `partial` never sets `lastWritten` (only a settled `tryOnDevice` does), so `armed` stays false under
the mutation and test 13 passed (observed: `1 passed | 17 skipped`). Nor can the reason row go red on its
own: `keepReason()`'s table places the `partial` row above the armed row, so `after-partial` is returned
whatever `armed` says. The literal reading - `this.armed = true` in `#classify`'s partial branch - WAS
observed red on test 13's `armed` assertion (`never armed from partial: expected true to be false`), and
is what the SUMMARY records. Two guards stand between `partial` and a live `KEEP ON DEVICE` (the phase test
and `lastWritten`), plus the table order; none is a gap.

If a later plan wants the *reason* itself under a mutation, the mutation is a row reorder in
`keepReason()` (the live row above the `partial` row) together with a `lastWritten` that survives a
partial - two edits, not one, and the second would itself be a bug worth its own test.

**Owner:** none required; recorded so the fourth check is not read as skipped. No code.

## 9. After a connect on a module that answers, the session's connected sentence is never rendered (found by 07-08)

The install store takes its snapshot the moment the session is connected (D-03) and speaks
`LIVE_SNAPSHOT_SAVED` on `ready`. On a module that answers - the Node responder, and by every Phase 2
measurement a real ZONA too - that is tens of milliseconds after the session queued its own
`ZONA connected. Firmware …` line, inside the same 500 ms trailing window, and the announcer keeps the LAST
line (Y-16, 06-UI-SPEC). So the connected sentence is queued and never rendered; the region reads the
snapshot sentence once. Observed in `e2e/session.e2e.ts` test 14 the moment `+layout.svelte` started the
store: `after connect: session="Your ZONA's own Setup and Timer are saved. Nothing has been written."`.
07-UI-SPEC's live-region section assumed the two were "mutually exclusive in time"; on a fast link they are
not. The test now asserts what the announcer does and says so; nothing about the announcer was changed
(07-11 says it has no logic to gain), and whether the snapshot line should be the one a visitor hears at
connect is a copy question, not a test one.

**Owner:** 07-11 (the snapshot line is its subject) or 07-13's runbook, which can record what a screen
reader actually says at connect on hardware. No code in 07-08.

## 10. The 07-08 plan's testid table names the readout and the button `install-put-back` (found by 07-08)

The interfaces block lists `install-put-back` twice: as the readout of `putBackState()` and as the PUT
BACK button. Playwright's `getByTestId` is strict and resolved to two elements, so all six tests failed
on their first run. The readout keeps the name (07-12's tests will read it); the button is
`install-put-back-click`. Recorded so 07-12 reads the probe, not the plan's table, for the click.

**Owner:** none required. Fixed in 07-08 (commit 3 of this plan).

## 11. The confirmation's fade OUT belongs to the panel's `{#if}`, not to the leaf (found by 07-09)

07-UI-SPEC's Motion Contract gives the confirmation block 160ms of opacity "appearing or leaving".
`KeepConfirm.svelte` fades IN with a CSS animation on mount (instant under reduced motion), but a leaf
cannot fade itself OUT in CSS alone: it is unmounted by the panel's `{#if install.confirmOpen}` and is
gone the same frame. A Svelte `transition:` directive on the mount point would do it, at the cost of
a JS-orchestrated leave and a reduced-motion read the leaf has no business making. Whether the leave
should fade at all is also open: NOT NOW re-renders the row's `KEEP ON DEVICE` in the block's place
and moves focus to it, and a 160ms ghost of the block under a control that already has focus may be
worse than an instant swap.

**Owner:** 07-10, which owns the `{#if}` and the focus return; a decision, then at most one directive.

## 12. `lua-entries.spec.ts` test 6 breaches Vitest's 5000 ms default under the parallel quick run (found by 07-09)

`src/lib/catalog/lua-entries.spec.ts` > "stays canonical and in budget across the whole knob
cross-product" (Phase 8's, last edited by `5e230ec`) took 5333 ms and then 6143 ms inside two full
`npm run test:quick` runs on 2026-09-05 and was reported failed by timeout both times, while the same
file run alone passes in 1.68 s (6 passed, 2.20 s). The machine was also running two heavyweight
desktop applications at the time. Nothing in 07-09 touches the catalog, the Lua entries, wasmoon or
the vitest configuration; the quick run's other 773 tests passed, which is 07-08's 772 plus this
plan's 2. The test is a whole cross-product and is the natural candidate for an explicit
`{ timeout }` argument, or the fix is a quieter machine.

**Owner:** the next plan that edits `lua-entries.spec.ts` (Phase 8's gate), or whoever runs the
quick suite on a quiet machine and observes 73 / 774 - 07-10 should re-measure first.

## 13. After `connected`, a rig's other modules reach the identity only on the ZONA's next heartbeat (noted by 07-09)

`session.svelte.ts` `#startFold` begins a FRESH `IdentifyState` at `connected`, so `identify(fold)`
returns undefined - and nothing republishes - until that fold has seen a type-1 ZONA heartbeat and a
page. A test that pushes EN16 and BU16 heartbeats after connect and reads `identity.otherModules`
straight away sees none; one ZONA beat later it sees both (observed on the served build through the
temporary probe mount). A real module beats at 4 Hz, so nothing on hardware is affected; recorded so
07-12's rig test (`delayAckMs` / `rig`, `zona.script()`) pushes a ZONA heartbeat after the rig's.

**Owner:** 07-12's test authoring; no code.

## 14. The panel's `DISCONNECT ZONA` is disabled while `writing` with no inline reason (found by 07-10)

07-UI-SPEC I3 rule 10 and Z-15 lock the HEADER's `DISCONNECT ZONA` and `FORGET THIS ZONA` while
`writing`, with `WRITE_LOCK_REASON` inline; they say nothing about the panel's `DISCONNECT ZONA`, which
Phase 4 put at the end of region 3's connected block and which calls the same `session.disconnect()`,
a method with no write-lock guard of its own. Pulling the port from the panel under a RAM write is the
same hazard as from the header, so 07-10 made the panel's control a real `disabled` while
`install.phase === "writing"` (Rule 2) - but WITHOUT a reason line, because I3 rule 4 says nothing in
region 3 changes during a write beyond `aria-busy`, and the write settles inside two frames. DEGR-02's
letter (a disabled control has its reason adjacent) is therefore not met for this one control for the
duration of a write.

**Owner:** 07-11, which owns the header lock, decides whether the panel's control gets the same inline
reason or stays protective-only, and records the decision; one attribute either way.

## 15. Negative check "the `space-between` row shows two sentences side by side" is unobservable with Phase 5's exact rule at 372px (found by 07-10)

07-10's plan asks to "leave the row as `space-between` and observe the two sentences side by side at
about twenty characters a line". With Phase 5's exact rule (`display: flex; flex-wrap: wrap; gap: 8px;
justify-content: space-between`) at the 372px column, the cells did NOT sit side by side: `flex-wrap`
engages before `flex-shrink`, because each cell's max-content width (its 71-, 82- or 68-character
sentence) exceeds the line, so `KEEP ON DEVICE` (top 1384.39) and `COPY LINK` (top 1492.39) stacked
and the keep cell was 370px wide - Z-03's "column pretending to be a row", observed. The reading the
plan wanted needed `flex-wrap: nowrap`: then both controls sat on one line (tops 1384.39 and 1384.39),
the keep cell was 200px wide and 96px tall - four Body lines of 24px for an 82-character sentence,
about twenty characters a line. Both readings are in 07-10-SUMMARY.md; the shipped column is unchanged.
Re-observed by the executor that completed the plan, on a second mutated build with a snapshot in hand so
all three cells were in the row: wrapping, the three stacked at 0 / 132 / 240 from the row's top with the
keep cell 370px wide and 48px tall; forced `nowrap`, all three sat on one line (`PUT BACK` 108.8,
`KEEP ON DEVICE` 110.1, `COPY LINK` 101.9 wide) and the 82-character keep line ran to seven Body lines,
168px - about twelve characters a line. The same defect with one cell more.

**Owner:** none; no code. Recorded so the check is not read as skipped, and so the next plan that
reasons about the row knows which of the two defects Phase 5's rule actually had at 372px (stacking
with an 8px rhythm, not side-by-side crowding).

## 16. Items 6, 11 and 12 closed by 07-10 (noted by 07-10)

Item 6: `TryOnDevice.svelte` binds `config`, observes it into the install store (untracked) and the
`svelte/no-unused-props` directive is gone; `npm run lint` exit 0. Item 11: the confirmation leaves
INSTANTLY, by decision - a leaving fade would keep `keep-confirm-yes` on the screen for 160ms beside
the re-rendered `keep-on-device` (the never-both rule broken for exactly the interval a speech command
could land in) and would put a ghost of the block under a control that already has focus; no
`transition:` directive was added. Item 12: `npm run test:quick` on the clean tree before any edit read
73 files / 774 passed / 1 todo in 29.6 s with no timeout (`lua-entries.spec.ts` test 6 included), and
73 / 775 in 32.9 s after this plan; the timeout did not reproduce on a quiet machine. The item's owner
is unchanged should it recur under load.

**Owner:** none; closed.
