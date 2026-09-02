---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 1 context gathered
last_updated: "2026-09-02T14:19:53.647Z"
last_activity: 2026-09-02 -- Phase 01 execution started
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 5
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-02)

**Core value:** Plug in a ZONA, open a URL, and half a minute later the pad is doing something spectacular. If everything else fails, browser-to-hardware install must work.
**Current focus:** Phase 01 — scaffold-licence-and-pin

## Current Position

Phase: 01 (scaffold-licence-and-pin) — EXECUTING
Plan: 1 of 5
Status: Executing Phase 01
Last activity: 2026-09-02 -- Phase 01 execution started

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Two independent tracks after Phase 1 — hardware (2 → 6) and pure/no-hardware (3 → 4 → 5) — joining at Phase 7. Parallel execution is real, not cosmetic.
- [Roadmap]: The walking skeleton (Phase 2) runs before any framework work because it is the only phase whose failure invalidates the core value; its write is a provable no-op on the user's own hardware.
- [Roadmap]: Snapshot + PUT BACK ships in the same phase as the first real write (Phase 7). Store-to-flash is a step inside that phase, strictly after audition and PUT BACK both work.
- [Roadmap]: The fidelity oracle is established in the vendoring phase (Phase 3), before the simulator is trusted to render anything.
- [Roadmap]: GPLv3 licence and the exact grid-protocol pin land in Phase 1 — free now, miserable to retrofit.

### Pending Todos

- [Botond] Set the embargo date for the first un-gated public deploy (recorded TBD in 01-CONTEXT.md D-03); ask before any deploy that removes the Basic Auth gate.

### Blockers/Concerns

- [Phase 2] MEDIUM confidence that a bare browser page can complete the protocol without the Grid Editor runtime; whether an outbound host heartbeat is required is LOW confidence and needs an A/B inside the phase.
- [Phase 5] The base36 stamp checksum is a known open hole in prior art (a relabelled stamp can decode to a different card) — needs its own design pass before sharing goes public.
- [Phase 7] Flash unplug-during-store ordering: firmware writes Setup before Timer to flash, opposite of the RAM write order; mitigation needs validation against real hardware timing.
- [Phase 5] The 941/908 over-budget preset combination noted in PROJECT.md is known pre-existing compiler debt; it surfaces during the full-range knob sweep.
- All *(hardware)* success criteria require the user personally, with a real ZONA. Web Serial is not automatable.

## Session Continuity

Last session: 2026-09-02T12:11:59.928Z
Stopped at: Phase 1 context gathered
Resume file: .planning/phases/01-scaffold-licence-and-pin/01-CONTEXT.md
