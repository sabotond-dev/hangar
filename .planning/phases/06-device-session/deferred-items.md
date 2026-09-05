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
