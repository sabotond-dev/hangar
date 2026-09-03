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
order, and all four items must hold:

1. The vendored compiler and simulator suite is green: `npm run test:quick` reports 176 tests in
   `src/vendor/botor/tests/pad.test.js` and 96 in `pad-sim.test.js`, and `npm run test:sweep` reports 9.
2. Every catalog preset's `compressScript` **length** is byte-identical to
   `src/lib/fidelity/preset-baseline.json`. Not `cost().used`: that is
   `max(compressed, raw) + reserved`, and the raw length wins for all nine presets, so it is blind to
   a minifier that spends or saves a few characters. The gate is the last test in
   `src/lib/protocol-pin.spec.ts`, backed by `src/lib/fidelity/preset-baseline.spec.ts`.
3. All three sources above are edited in **one commit** — `package.json`, `package-lock.json` and
   `PROTOCOL_PIN`. Never one without the others.
4. If any cost moved at all, the bump is a written decision with a reason recorded in the bump log
   below. A moved cost is a change to the budget every preset is calibrated against, not a detail.

Items (1) and (2) are **enforceable as of Phase 3.** The vendored suite lives in
`src/vendor/botor/tests/` and runs under `npm run test:quick` (the compiler and simulator suites) and
`npm run test:sweep` (the 9-test invariant sweep). The recorded baseline is
`src/lib/fidelity/preset-baseline.json`, captured from BOTOR's own compiler at the pinned commit by
`scripts/capture-preset-baseline.mjs`; `src/lib/fidelity/preset-baseline.spec.ts` asserts the vendored
compiler reproduces it character for character, and the last test in `src/lib/protocol-pin.spec.ts`
asserts the `compressScript` lengths against it at whatever version is installed. Run all three before
touching the pin. Item (4) is unchanged and is not automatable: a bump that moves a cost is only
legitimate with a written reason in the bump log below.

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
