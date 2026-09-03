# Phase 3 deferred items

Out-of-scope discoveries logged during execution. Not fixed by the plan that found them.

## 1. `src/lib/format-parity.spec.ts` is timeout-flaky in a loaded parallel run — RESOLVED

**Resolved:** 03-03, commit `72b79f1`, as an authorised Rule-3 deviation. The two canary tests now
carry an explicit `CANARY_TIMEOUT_MS = 30_000` per-test timeout, and HANGAR's Prettier is resolved
once as `node_modules/prettier/bin/prettier.cjs` and invoked through `node` instead of through `npx`
— the same invocation shape the upstream binary already uses, so both sides of the comparison are
now symmetrical. What the spec asserts is unchanged. `npx vitest run --project server
src/lib/format-parity.spec.ts` reports 3 passed.

**Found during:** 03-02, Task 2 (first `npm run test:quick` after the 7th spec file landed).

**Observed:** one run of `npm run test:quick` reported
`Test Files 1 failed | 6 passed (7)` / `Tests 1 failed | 308 passed | 1 todo (310)`, failing inside
`format-parity.spec.ts` at the `_pad.ts formats identically ...` test. Three immediately subsequent
full runs, and the spec run in isolation (`3 passed`), were all green.

**Cause (unconfirmed, not investigated):** that spec spawns two Prettier subprocesses — `npx prettier`
plus grid-editor's own `prettier.cjs` — over a 152 KB file, inside Vitest's default 5,000 ms test
timeout. `npx` resolution on a cold cache plus six other spec files competing for CPU is enough to
cross it. Nothing about the failure implicates formatter parity itself.

**Why deferred:** pre-existing spec, untouched by 03-02, and the fix is a judgement call about that
spec's design (raise `testTimeout` for the file, resolve the Prettier binary path once instead of
through `npx`, or mark the file `sequential`). Out of scope under the executor's scope boundary.

**Suggested fix when someone touches it:** give the two canary tests an explicit
`{ timeout: 30_000 }` and drop `npx` in favour of HANGAR's own
`node_modules/prettier/bin/prettier.cjs`, mirroring how the upstream binary is already invoked.
