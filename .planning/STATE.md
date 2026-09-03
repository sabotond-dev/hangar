---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 03-01-PLAN.md
last_updated: "2026-09-03T09:47:40.931Z"
last_activity: 2026-09-03
progress:
  total_phases: 8
  completed_phases: 1
  total_plans: 11
  completed_plans: 6
  percent: 13
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-02)

**Core value:** Plug in a ZONA, open a URL, and half a minute later the pad is doing something spectacular. If everything else fails, browser-to-hardware install must work.
**Current focus:** Phase 03 — vendor-the-domain

## Current Position

Phase: 03 (vendor-the-domain) — EXECUTING
Plan: 2 of 6
Status: Ready to execute
Last activity: 2026-09-03

Progress: [█░░░░░░░░░] 13%

## Performance Metrics

**Velocity:**

- Total plans completed: 5
- Average duration: 20 min
- Total execution time: 1.7 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | 100 min | 20 min |

**Recent Trend:**

- Last 5 plans: 8, 15, 12, 45, 20 min
- Trend: steady. The two longest carried the most unknowns — 01-04 rebuilt the browser harness onto the real artifact, 01-05 spanned two blocking human checkpoints.

*Updated after each plan completion*
| Phase 01 P01 | 8min | 3 tasks | 22 files |
| Phase 01 P02 | 15min | 3 tasks | 8 files |
| Phase 01 P03 | 12min | 3 tasks | 10 files |
| Phase 01 P04 | 45min | 3 tasks | 9 files |
| Phase 01 P05 | 20min | 3 tasks | 6 files |
| Phase 03 P01 | 9 min | 3 tasks | 12 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Two independent tracks after Phase 1 — hardware (2 → 6) and pure/no-hardware (3 → 4 → 5) — joining at Phase 7. Parallel execution is real, not cosmetic.
- [Roadmap]: The walking skeleton (Phase 2) runs before any framework work because it is the only phase whose failure invalidates the core value; its write is a provable no-op on the user's own hardware.
- [Roadmap]: Snapshot + PUT BACK ships in the same phase as the first real write (Phase 7). Store-to-flash is a step inside that phase, strictly after audition and PUT BACK both work.
- [Roadmap]: The fidelity oracle is established in the vendoring phase (Phase 3), before the simulator is trusted to render anything.
- [Roadmap]: GPLv3 licence and the exact grid-protocol pin land in Phase 1 — free now, miserable to retrofit.
- [Phase 01]: sv@0.17.0 has no --no-git-check and no -C/--cwd flag, and rejects cfTarget for non-Cloudflare adapters; the scaffold command is 'sv create . --template minimal --types ts --no-install --no-dir-check --no-download-check --add prettier eslint tailwindcss=plugins:none playwright vitest=usages:unit sveltekit-adapter=adapter:static'
- [Phase 01]: Kit config lives only in vite.config.ts with FLAT options inside the sveltekit() argument; no svelte.config.js and no kit: {} wrapper anywhere
- [Phase 01]: sv 0.17.0 emits src/routes/layout.css, not src/app.css; HANGAR uses src/app.css imported from +layout.svelte as ../app.css
- [Phase 01]: .planning/ and CLAUDE.md are Prettier-ignored but never gitignored, so npm run lint stays green without rewriting tracked planning documents
- [Phase 01]: The D-15 vendor canary asserts formatter-output parity with grid-editor (HANGAR prettier stdout === grid-editor prettier stdout, byte for byte), not `prettier --check` cleanliness of a copied BOTOR file — Three of the four grid-editor zona files are not Prettier-clean upstream (pad-sim.ts 6 hunks), so the check-based form was permanently red for a reason outside HANGAR control; the D-15 property is a clean re-sync diff, which holds iff the two formatters agree
- [Phase 01]: The canary runs grid-editor own node_modules/prettier/bin/prettier.cjs with cwd = the BOTOR root, in stdout mode only; the sibling repo is never written to — Catches a Prettier version or plugin divergence between the repos instead of assuming parity
- [Phase 01]: THIRD-PARTY.md and licenses/ are committed, not gitignored as research suggested — npm run build must be reproducible from a clean clone without first running the licence checker, the source archive should carry the notices it references, and the staleness spec can then read them directly instead of shelling out
- [Phase 01]: The source archive filename carries the FULL 40-character SHA (the __COMMIT_SHA__ contract) while the archive internal prefix uses the short SHA — The plan-04 footer links at /source-{__COMMIT_SHA__}.tar.gz and __COMMIT_SHA__ is git rev-parse HEAD verbatim; a short-SHA filename would never resolve
- [Phase 01]: scripts/postbuild.mjs deletes any pre-existing build/source-*.tar.gz before writing the current one — Two archives served side by side leaves a visitor unable to tell which source matches the bundle they ran - the precise silent failure GPLv3 section 6(d) exists to prevent
- [Phase 01]: npm uninstall does not restore package-lock.json byte-exactly on this machine (tabs become two spaces), so any npm install/uninstall round trip needs an explicit git checkout of package-lock.json — Plan 05 deploy gate refuses to run on a dirty tree; a reformatted lockfile with an identical dependency set would block a deploy for no real reason
- [Phase 01]: Playwright tests build/ served by wrangler dev through the real Worker, never vite preview; the harness choice is written into playwright.config.ts with its measured cold start (4.6 s) — Kit preview boots the Node server from .svelte-kit/output/server and never reads build/, so sv's generated harness validated an artifact that is not the deployed one; wrangler dev serves the deployed bytes and makes the Basic Auth gate a regression test
- [Phase 01]: The unauthenticated gate assertion uses Node fetch, not Playwright's request API — Both Playwright routes were observed returning 200 where 401 was expected: an explicit httpCredentials undefined in test.use reads as "not specified" and falls back to defineConfig, and a context from the module-level request API picks the same credentials up under the runner
- [Phase 01]: vite.config.ts prerender.handleHttpError suppresses a 404 for exactly /LICENSE, /THIRD-PARTY.md and /source-*.tar.gz and rethrows everything else — scripts/postbuild.mjs writes those three after vite build, so the prerenderer crawling the footer links cannot see them; a global suppression would have silently accepted a genuinely broken internal link
- [Phase 01]: Killing a stray wrangler dev requires killing the whole process tree (npx-cli to wrangler.js to wrangler-dist/cli.js to workerd.exe); killing workerd alone leaves a listener on 4173 that accepts and never answers — cli.js restarts workerd when it dies; the resulting zombie makes every curl hang until its timeout and Playwright's reuseExistingServer would happily attach to it
- [Phase 01]: The deploy is one Node script with six refusing gates and no bypass flag; the clean-tree gate exits before the build because git archive ships HEAD while Vite bundles the working tree, so a dirty deploy would serve an archive that is not the source of the bundle beside it
- [Phase 01]: Worker secrets are set AFTER the first deploy, not before — wrangler secret put targets a Worker that does not exist until an upload creates one, and the fail-closed gate turns the 29-second gap into a 401-to-everything state rather than a window of public exposure
- [Phase 01]: CLAUDE.md is regenerated with gsd-tools generate-claude-md, never hand-edited — its GSD:project block is rendered from PROJECT.md, so a hand edit silently reverts on the next regeneration and re-introduces the public-source claim D-02 contradicts
- [Phase 03]: D-10 fired on measurement: the invariant sweep is 38.8 s wall against 6.5 s for everything else, so pad-invariants.test.js runs as its own Vitest 'sweep' project per wave while 'test:quick' stays the per-task loop — A separate project, not a skip or an env flag, so the sweep is never partially run; and it is excluded from the server project by FILE NAME, never by directory, because a directory-wide vendor exclusion is precisely the failure this task removed
- [Phase 03]: The vendored tree is hidden from svelte-check with a tsconfig exclude of src/vendor/**, not by turning checkJs off — Both give 0 errors (489 without either), but checkJs:false silently lowers the bar for every future first-party HANGAR .js file; the exclude keeps checkJs and still type-checks the three vendored .ts sources the moment HANGAR code imports them, which is where the real risk is
- [Phase 03]: Provenance headers are 7 lines for _pad.ts and 6 for the other five; VENDOR.md records the resulting 8/7 line offset and the rule 'vendored line = upstream line + header lines' — The block shifts every line number in the file, so every HANGAR document citing a vendored line cites the upstream number plus the offset; verified against a real citation - PRESETS is upstream _pad.ts:4206 and vendored _pad.ts:4214
- [Phase 03]: Cross-repo vendoring is a Buffer-level copy with a uniqueness assertion per permitted delta, never a decode/re-encode round trip through a string — pad.test.js is UTF-8 with non-ASCII content and plan 02's sha256 manifest hashes its exact byte stream; a Buffer.indexOf/concat splice that throws on zero or multiple matches also proves 'exactly three deltas' at copy time rather than after the fact

### Pending Todos

- [Botond] Set the embargo date for the first un-gated public deploy (recorded TBD in 01-CONTEXT.md D-03); ask before any deploy that removes the Basic Auth gate.

### Blockers/Concerns

- [Phase 2] MEDIUM confidence that a bare browser page can complete the protocol without the Grid Editor runtime; whether an outbound host heartbeat is required is LOW confidence and needs an A/B inside the phase.
- [Phase 5] The base36 stamp checksum is a known open hole in prior art (a relabelled stamp can decode to a different card) — needs its own design pass before sharing goes public.
- [Phase 7] Flash unplug-during-store ordering: firmware writes Setup before Timer to flash, opposite of the RAM write order; mitigation needs validation against real hardware timing.
- [Phase 5] The 941/908 over-budget preset combination noted in PROJECT.md is known pre-existing compiler debt; it surfaces during the full-range knob sweep.
- All *(hardware)* success criteria require the user personally, with a real ZONA. Web Serial is not automatable.

## Session Continuity

Last session: 2026-09-03T09:47:10.378Z
Stopped at: Completed 03-01-PLAN.md
Resume file: None
