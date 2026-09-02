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

1. The vendored compiler and simulator suite (`src/vendor/botor/`, Phase 3) is green against the new
   version.
2. Every catalog preset's `compressScript` cost is **byte-identical** to the recorded baseline.
3. All three sources above are edited in **one commit** — `package.json`, `package-lock.json` and
   `PROTOCOL_PIN`. Never one without the others.
4. If any cost moved at all, the bump is a written decision with a reason recorded in the bump log
   below. A moved cost is a change to the budget every preset is calibrated against, not a detail.

Items (1) and (2) are **not enforceable yet.** The vendored suite and the recorded cost baseline both
arrive in Phase 3 (FOUND-02); until they exist there is no way to prove a bump is safe, so **until then
the pin does not move.** `src/lib/protocol-pin.spec.ts` carries an `it.todo` marking exactly where the
cost-baseline assertion lands.

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
