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
