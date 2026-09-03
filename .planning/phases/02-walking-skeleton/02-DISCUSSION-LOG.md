# Phase 2: Walking Skeleton - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-02
**Phase:** 2-walking-skeleton
**Areas discussed:** Hardware and module state; Where it lives and what survives; What the run records; Safety rails for the experiment

---

## Hardware and module state

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, on my desk now | Hardware criteria verifiable immediately | ✓ |
| Yes, within days | Build now, checkpoint waits | |
| No, and no date | Plan but do not execute | |

**User's choice:** Yes, on my desk now

| Option | Description | Selected |
|--------|-------------|----------|
| Whatever it has now, then a BOTOR config | Two runs, two configs | |
| Factory config only | One run; static Setup, proof by re-fetch | ✓ |
| A BOTOR config only | One run against an animating preset | |

**User's choice:** Factory config only

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, gated behind its own click | Criterion 3 requires it; Phase 7 depends on it | ✓ |
| Yes, but only in the second run | Store proven once | |
| No — RAM write-back only | Reword criterion 3 | |

**User's choice:** Yes, gated behind its own click

| Option | Description | Selected |
|--------|-------------|----------|
| Detect the open failure and name Grid Editor | CONN-04 recovery order; first real test of that message | ✓ |
| Just tell me to close it first | Raw error acceptable | |

**User's choice:** Detect the open failure and name Grid Editor

---

## Where it lives and what survives

| Option | Description | Selected |
|--------|-------------|----------|
| A `/dev/skeleton/` route in the app | Same harness as /dev/fidelity, behind the gate, HTTPS-testable | |
| Standalone `skeleton/index.html` + vite preview | Research's literal bare page; localhost only | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide — Claude chose the `/dev/skeleton/` route (recorded in CONTEXT D-05).

| Option | Description | Selected |
|--------|-------------|----------|
| Pure parts as tested modules; page is throwaway | protocol/ + transport/ with Vitest; Phase 6 inherits | ✓ |
| All throwaway | Phase 6 rewrites | |
| Everything kept, incl. the page | Page becomes Phase 6's UI seed | |

**User's choice:** Pure parts as tested modules; page is throwaway

---

## What the run records

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — record every frame with timestamps | Hex + decoded JSON fixtures; FakeTransport replays a real ZONA | ✓ |
| Record only the summary numbers | Smaller; synthetic FakeTransport | |

**User's choice:** Record every frame with timestamps

| Option | Description | Selected |
|--------|-------------|----------|
| Committed `docs/SKELETON-RESULTS.md` from the page's JSON | Heartbeat A/B, pacing, ACK latencies, PAGEACTIVE, multi-module, WASM by reference | ✓ |
| Only in the phase SUMMARY | No developer-facing report | |

**User's choice:** Committed `docs/SKELETON-RESULTS.md`

---

## Safety rails for the experiment

| Option | Description | Selected |
|--------|-------------|----------|
| Empty, undecodable, or over-budget fetch → refuse | Write buttons disabled with reason | ✓ |
| Only on decode failure | Empty strings written back | |
| Never refuse; log and proceed | | |

**User's choice:** Empty, undecodable, or over-budget fetch → refuse

| Option | Description | Selected |
|--------|-------------|----------|
| The module's reported active page, never hardcoded 0 | PAGEACTIVE/REPORT; refuse if unknown | ✓ |
| Page 0, with a note | | |

**User's choice:** The module's reported active page

| Option | Description | Selected |
|--------|-------------|----------|
| Timer first, then Setup; each awaits its ACK; store behind a separate confirm | BOTOR's writePad order; one outstanding request; bounded retry | ✓ |
| Setup first | | |
| You decide | | |

**User's choice:** Timer first, then Setup; store behind a separate confirm

| Option | Description | Selected |
|--------|-------------|----------|
| Refuse to store; allow fetch and RAM write-back to the ZONA only | Names other modules; store disabled | ✓ |
| Require a lone ZONA; refuse everything otherwise | | |
| Proceed regardless | | |

**User's choice:** Refuse to store; allow fetch and RAM write-back to the ZONA only

---

## Done check

| Option | Description | Selected |
|--------|-------------|----------|
| I'm ready for context | A/B mechanics to Claude's discretion | ✓ |
| Discuss the A/B and pacing experiments | | |
| Revisit an earlier area | | |

**User's choice:** I'm ready for context

## Claude's Discretion

- `/dev/skeleton/` route location (chosen)
- A/B mechanics (heartbeat toggle, two runs per setting; pacing toggle 10 ms vs 0 ms; definition of "required")
- Honest starting timeouts (1000 / 500 / 3000 ms) revised by measurement
- Identify window / disconnect rule; `requestPort()` before any await
- Diagnostic page layout; Export JSON shape; degrade-path e2e
- Module layout under `src/lib/protocol/` and `src/lib/transport/`; fixture naming

## Deferred Ideas

- Second run against an animating BOTOR config — Phase 7 hardware checklist
- Snapshot persistence, PUT BACK, PAGEDISCARD — Phase 7
- Multi-module warn-and-allow — Phase 7 (SAFE-06)
- Heartbeat loop, `getPorts()` reconnect, `forget()`, firmware-version comparison — Phase 6
