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
