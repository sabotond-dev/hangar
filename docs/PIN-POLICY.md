# grid-protocol pin policy

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

## The pin

`@intechstudio/grid-protocol` is pinned to the exact version:

`1.20260825.1135`

No caret, no tilde, no `x`, no hyphen range, no `||`. A bare literal version string, and nothing else.

## Why this exact version

`1.20260825.1135` is the version `grid-editor@redesign` declares, and it is the version BOTOR's
`compressScript` cost baseline was measured against.

The protocol package carries the minifier. Every 908-character budget decision in Phases 5, 7 and 8 —
the fit ladder, the per-preset cost table, the "does this knob still fit" answer the visitor sees — is
calibrated against this exact minifier. A minifier that saves two characters somewhere, or spends two
more, does not break the build. It makes the budget meter subtly wrong, which is far worse: it surfaces
as a config that compiles in the browser and is rejected by the module.

## The three sources that must agree (D-10)

| Source                                                                               | Value                              |
| ------------------------------------------------------------------------------------ | ---------------------------------- |
| `package.json` → `dependencies["@intechstudio/grid-protocol"]`                       | the declared string                |
| `package-lock.json` → `packages["node_modules/@intechstudio/grid-protocol"].version` | the resolved, installed version    |
| `src/lib/protocol-pin.ts` → `PROTOCOL_PIN`                                           | the constant the application reads |

`src/lib/protocol-pin.spec.ts` is the gate. It goes red if any two of the three disagree, if the
declared string gains a range operator, or if the `PROTOCOL_PIN` literal itself is bumped. An
accidental `npm update` cannot pass it quietly: after a silent bump the first three assertions would
still agree with each other, and the hard-coded-literal assertion would not.

## The bump gate (D-11)

Moving the pin is a reviewed decision, never a routine update. A human follows this checklist, in
order, and all six items must hold:

1. The vendored compiler and simulator suite is green: `npm run test:quick` reports 176 tests in
   `src/vendor/botor/tests/pad.test.js` and 96 in `pad-sim.test.js`, and
   `src/vendor/botor/tests/pad-invariants.test.js` reports 9 inside a `npm run test:sweep` run of
   4 files / 19 tests.
2. Every catalog preset's `compressScript` **length** is byte-identical to
   `src/lib/fidelity/preset-baseline.json`. Not `cost().used`: that is
   `max(compressed, raw) + reserved`, and the raw length wins for all nine presets, so it is blind to
   a minifier that spends or saves a few characters. The gate is the last test in
   `src/lib/protocol-pin.spec.ts`, backed by `src/lib/fidelity/preset-baseline.spec.ts`.
3. All three sources above are edited in **one commit** — `package.json`, `package-lock.json` and
   `PROTOCOL_PIN`. Never one without the others.
4. **Every hand-authored catalog entry is re-measured, not only the nine presets:**
   `npx vitest run --project sweep src/lib/catalog/lua-entries.sweep.spec.ts` reports **6 passed**. Why
   this
   is its own item: HANGAR's hand-authored configurations are stored in **canonical compressed form**,
   and canonical form is a property _of a specific minifier version_ — a bump can turn a stored string
   non-canonical, and its budget wrong, without changing a single character of HANGAR's source. A red
   canonical-form or budget test after a bump means the minifier moved: re-canonicalise every affected
   entry with the new `compressScript`, re-commit the entry modules, and record the move in the bump
   log. Item (2) cannot see any of this — it covers the nine shelf presets only.
5. If any cost moved at all, the bump is a written decision with a reason recorded in the bump log
   below. A moved cost is a change to the budget every preset is calibrated against, not a detail.
6. **The reachability sweep is re-run:** `npm run test:sweep` reports **4 files / 19 tests**. The
   unreachability finding behind TUNE-04 and TUNE-05 — no knob state any visitor can produce goes
   over 908, measured across all 32,852 of them — is a property of the pinned compiler, not a law.
   `src/lib/tune/reachability.sweep.spec.ts` is what turns a bump that moves the 908-character ladder
   into a red test instead of a silent behaviour change, and it is the only gate that would notice.

Items (1), (2) and (4) are **enforceable as of Phase 8** — (1) and (2) since Phase 3, (4) since the
catalog gate landed. Item (6) is enforceable as of Phase 5. The vendored suite lives in
`src/vendor/botor/tests/` and runs under `npm run test:quick` (the compiler and simulator suites) and
`npm run test:sweep`, whose 19 tests are the 9-test invariant sweep, the two Phase 5 sweeps item
(6) is about (4 tests), and the 6 tests of `src/lib/catalog/lua-entries.sweep.spec.ts` item (4) is
about, which joined the project in plan 09-01. The recorded baseline is
`src/lib/fidelity/preset-baseline.json`, captured from BOTOR's own compiler at the pinned commit by
`scripts/capture-preset-baseline.mjs`; `src/lib/fidelity/preset-baseline.spec.ts` asserts the vendored
compiler reproduces it character for character, and the last test in `src/lib/protocol-pin.spec.ts`
asserts the `compressScript` lengths against it at whatever version is installed. Run all three before
touching the pin. Item (5) is unchanged and is not automatable: a bump that moves a cost is only
legitimate with a written reason in the bump log below.

**The Lua VM is a separate pin with a different rationale, and it is not gated by this checklist.**
`wasmoon` is pinned exactly because HANGAR's fidelity and preview results are measured against one
Lua implementation, not because of a datestamp. A wasmoon bump is gated by
`npx vitest run --project server src/lib/fidelity/lua-parity.spec.ts` (5 passed) plus
`src/lib/catalog/frames.spec.ts`, and it moves no character budget at all. Neither pin implies the
other; bump them separately and re-measure separately.

## Bump log

| Date | From | To  | Costs moved | Reason |
| ---- | ---- | --- | ----------- | ------ |

## Tested firmware range

**Internal documentation only. This is never rendered to visitors** (D-12) — not in a footer, not on a
card, not at connect, not in an error message. Phase 6 reads `PROTOCOL_PIN` internally to compare
against a connected module's reported firmware version; what the visitor sees is the consequence of
that comparison, never the version numbers themselves.

Current value:

`TBD — filled when Phase 2 identifies a real ZONA's firmware version`
