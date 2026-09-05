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
