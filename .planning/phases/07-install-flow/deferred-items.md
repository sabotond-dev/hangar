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
