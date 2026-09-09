# Deferred items found during phase 11

Out-of-scope discoveries. Logged rather than fixed, per the executor's scope
boundary: only issues directly caused by a task's own changes are auto-fixed.

---

## D-11-08.1-a — `install.e2e.ts:1765` asserts an exact write count with no wait

**Found:** plan 11-08.1, full-suite run 5 of 5 at `--workers 3`.

```
[chromium] install.e2e.ts:1713 "@webkit CLEAR sends on the click with no
confirmation, the panel reads FACTORY DEFAULT, and PUT BACK brings the
visitor's own back @webkit"

  expect(zona.seen("CONFIG", "EXECUTE") - configBefore).toBe(2);
  Expected: 2   Received: 3
```

**Why it is the same family as the bug 11-08.1 fixed, and why it is not the
same bug.** `session.e2e.ts`'s `onlyReads` asserted exact totals against a
fire-and-forget sequence and 11-08.1 gave it a wait that implies completion.
This is the same shape - an exact count taken with no wait - but on the WRITE
path in a file 11-08.1 does not touch, and the observed value is HIGHER than
expected rather than lower, so it is a *third* write arriving rather than a
second one not yet having gone out. That is a different question and it wants
its own diagnosis, not a copy of the fix.

**Scope:** `e2e/install.e2e.ts` is byte-untouched since 11-04
(`git diff --quiet 7faa93c HEAD -- e2e/install.e2e.ts` exits 0). It shares no
helper with anything 11-08.1 edited: it imports `./fake-serial` and
`./fake-zona` and defines its own counters. Nothing this plan changed can
reach it.

**Frequency:** once in five full-suite runs at `--workers 3` on 2026-09-09.
Runs 1, 3 and 4 were 105 passed.

**Suggested owner:** 11-16, alongside the other exact-count call sites.

---

## D-11-08.1-b — `wrangler dev` died mid-run, and eight tests reported it as their own failure

**Found:** plan 11-08.1, full-suite run 2 of 5 at `--workers 3`.

The web server logged `X [ERROR]` and stopped. Eight subsequent titles failed
with `page.goto: Could not connect to server`, and a ninth
(`browse-webkit.e2e.ts` search field, 27 cards where 1 was expected) failed at
the same moment as the server was going down.

Nothing in the report says "the server is gone" until you read the `[WebServer]`
lines, which are interleaved with test output. Combined with
`reuseExistingServer: !process.env.CI`, the failure mode after this is worse
than the failure itself: the next run silently starts a fresh server and passes,
so the incident looks like a flake in nine tests rather than one death in one
process.

`playwright.config.ts` is not editable in this phase, so nothing was done. Worth
a `webServer` health assertion or a run-level check in a later wave.

**Frequency:** once in five full-suite runs on 2026-09-09.
