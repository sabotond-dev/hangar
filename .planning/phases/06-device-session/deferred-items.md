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
