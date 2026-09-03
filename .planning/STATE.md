---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: verifying
stopped_at: Completed 03-06-PLAN.md
last_updated: "2026-09-03T11:11:48.524Z"
last_activity: 2026-09-03
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 11
  completed_plans: 11
  percent: 13
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-02)

**Core value:** Plug in a ZONA, open a URL, and half a minute later the pad is doing something spectacular. If everything else fails, browser-to-hardware install must work.
**Current focus:** Phase 03 — vendor-the-domain

## Current Position

Phase: 4
Plan: Not started
Status: Phase complete — ready for verification
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
| Phase 03 P02 | 11 min | 2 tasks | 4 files |
| Phase 03 P03 | 11 min | 3 tasks | 7 files |
| Phase 03 P04 | 19 min | 3 tasks | 4 files |
| Phase 03 P05 | 12 min | 2 tasks | 3 files |
| Phase 03 P06 | 11 min | 3 tasks | 4 files |

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
- [Phase 03]: D-04 is enforced by hash, not by prose: upstream-manifest.json pins the pristine upstream sha256 and byte length of all six vendored BOTOR files at a0fb69d5, and vendored-diff.spec.ts reconstructs those bytes from each vendored copy — A 1 KB hash manifest asserts exactly the property a committed second copy would assert, without duplicating 436 KB in the repository and again inside every per-deploy GPLv3 source archive. The five inverse deltas are the D-04 allow-list in executable form, so an unrecorded fourth change fails to reconstruct instead of being absorbed.
- [Phase 03]: The fidelity suite reads nothing outside the repository, so it is green on a machine with no grid-editor checkout; format-parity.spec.ts stays the one deliberate sibling-dependent canary — A gate that cannot run on a fresh clone is not a gate. The spec asserts mechanically that no executable line mentions grid-editor, git-common-dir or BOTOR_REPO. The header block is stripped through its sentinel rather than by a fixed line count, so plan 01 per-file offsets never enter the comparison and a future header edit cannot silently shift a delta out of the hashed region.
- [Phase 03]: The preset baseline records FOUR lengths per preset - setup/timer raw and setup/timer compressed - plus both cost().used values, and the D-11 bump gate asserts the COMPRESSED pair — cost().used is max(compressed, raw) + reserved, and measured on live data compressed is exactly one character shorter than raw for all nine presets in both events - so cost().used IS the raw length everywhere. A grid-protocol bump whose minifier spent five more characters would move compressScript(...).length and leave cost().used untouched, and a gate recording only cost would stay green through precisely the change it exists to catch.
- [Phase 03]: The fixture is captured by running BOTOR's OWN compiler inside the sibling checkout, imported by absolute file:// URL with cwd staying in HANGAR, awaiting the SIBLING's padCompilerReady() — Module resolution crosses the repository boundary by itself, so the import binds grid-protocol to grid-editor's own node_modules without moving cwd - and keeping cwd in HANGAR is what guarantees no bundler cache can ever be created next door. HANGAR's copy of the protocol package is a DIFFERENT module instance: readying HANGAR's formatter leaves the imported compiler's cost() throwing "The Lua formatter is not initialised.", a failure that reads as a WASM packaging problem and is not one. The fixture being produced by the original is what makes the criterion-3 spec evidence rather than a tautology.
- [Phase 03]: protocol-pin.spec.ts measures with GridScript.compressScript directly rather than through the vendored measure() — The pin gate is about the installed package. Routing it through the vendored compiler would make it fail for reasons that belong to preset-baseline.spec.ts, and would make it unrunnable while the vendored copy is mid-resync.
- [Phase 03]: docs/PIN-POLICY.md's bump checklist names commands and counts (test:quick 176 + 96, test:sweep 9, the two spec files) instead of describing a property — "The vendored suite is green" cannot rot. A checklist item that names a command and its expected count stops being runnable the moment it stops being true, which is the point of a checklist a human follows before moving a pin.
- [Phase 03]: The oracle spec honours ORACLE.LED_LOOKUP_DIRECTION as declared and never tries the inverse; the ZONA table is self-inverse, so the 81-cell agreement confirms the DATA independently but cannot confirm the DIRECTION — LED_LOOKUP[LED_LOOKUP[i]] === i for all 81 entries, so both readings produce identical numbers and a spec that tried both directions until one passed would be fitting the oracle to the simulator - the exact failure mode the two-author design exists to prevent. The direction rests on the isolated author's derivation from grid_led.c:171-183 plus grid_lua_api.c:1301-1336, recorded in 03-04-SUMMARY.md so no reviewer mistakes numeric agreement for confirmation of it.
- [Phase 03]: The expiry tick order is asserted through the vendored public API alone - defaultState() with look and sends disabled decays to animating false at tick 42 - and the oracle's phaseAdvanceOffsetAtExpiry INDEXES the expected frame rather than being restated in the spec — The settled frame at expiry+1 is compared against hashes[expiry-1+offset], so flipping the oracle constant flips the expectation and the test goes red - observed. The spec also asserts hashes[expiry-1] !== hashes[expiry], without which the offset would be vacuously satisfied. rateZeroedOnExpiry is asserted the same observable way: movedAfterExpiry === !rateZeroedOnExpiry. The plan's weaker static-preset fallback was not needed and 03-VALIDATION.md's "if the fallback fires" row stands unfired.
- [Phase 03]: Golden-frame regeneration lives inside the spec behind UPDATE_GOLDEN, shells out to npx prettier --write on the fixture, and fails the run by design; the fixture is git added the moment it first exists, before any perturbation — Plain Node ESM cannot import pad-sim.ts at all, so a standalone generator would need Vite anyway. JSON.stringify puts the primitive ticks array on five lines and Prettier collapses it onto one, and src/lib/fidelity/ is not prettier-ignored, so without the normalising pass npm run lint fails on a file no human wrote - and the pass being idempotent is what keeps two consecutive regenerations byte-identical. Staging first matters because on an untracked path git checkout -- fails outright and git diff --quiet passes vacuously, so every restore-and-compare check would have measured nothing.
- [Phase 03]: The FOUND-05 WASM gate attaches to HANGAR's COMPILE SURFACE (src/lib/pad/index.ts), never to the app root; PadSim is not re-exported from that surface at all — CONTEXT says the app root awaits the gate before first render of anything that compiles and CLAUDE.md says never call initLuaFormatter() at boot - both hold, because nothing calls padReady() until something asks for a cost, and what a page shows while that resolves is Phase 4's concern. Leaving PadSim out of the barrel entirely (a consumer imports src/vendor/botor/pad-sim directly) makes "the simulator is outside the gate" enforceable by grep on the import graph rather than by a comment nobody re-reads; gating it would make the catalog wait on a 628 KB WASM download for a picture that takes a PadState and never Lua.
- [Phase 03]: In a spec whose test ORDER is load-bearing, a pre-init assertion must be the FIRST gate-crossing call in the file - ready.spec.ts test 3 builds with the VENDORED compile, not compilePreset — As the plan drafted it, test 3 opened with await compilePreset("aurora"), which awaits the gate - so by the time costOf ran the formatter was already initialised, and deleting costOf's own await left the whole spec green (exit 0, 5 passed). The plan's negative check found this, which is exactly what a negative check is for. compile() needs no formatter (test 1 proves it in the same file), so building with the vendored compile makes costOf the first call to cross the gate and the perturbation goes red naming test 3. Corollary recorded in the spec: compilePreset's and compileState's own awaits are belt-and-braces and unobservable by ANY test, because compile() never touches the formatter - the four load-bearing gates are costOf, fitsIn, measureLua and validateCompiled.
- [Phase 03]: The D-12 browser probe compiles and costs through $lib/pad rather than the vendored compiler, from a dynamic await import inside onMount, and never at module scope — At module scope the SERVER build resolves @wasm-fmt/lua_fmt through its "node" export condition and reads the wasm off disk during prerender, which proves nothing about a browser. Going through $lib/pad rather than the vendored functions makes the run exercise HANGAR's own FOUND-05 gate against the deployed artifact, not just grid-protocol's packaging. Measured: aurora's seven recorded numbers reproduced in Chromium in 1.0 s on a cold wrangler, empty console.
- [Phase 03]: worker/index.js sets NO Content-Security-Policy header, and any CSP added later MUST include 'wasm-unsafe-eval' in script-src; e2e/fidelity.e2e.ts asserts the wasm response is application/wasm — Captured live: the wasm asset returns exactly seven headers (200, Content-Length 628148, Content-Type application/wasm, Cache-Control private no-store, ETag, CF-Cache-Status, Referrer-Policy, X-Robots-Tag) and no CSP. Without 'wasm-unsafe-eval' a future CSP breaks instantiation with a symptom indistinguishable from "the formatter never initialised". A WRONG MIME is worse than a missing one: @wasm-fmt/lua_fmt falls back from instantiateStreaming to WebAssembly.instantiate with only a console warning and then runs the slow path forever, which is why the MIME is asserted rather than assumed.
- [Phase 03]: Playwright output is captured into the gitignored .tmp-e2e/, never under test-results/ or playwright-report/, and no Playwright test title may contain the word failed — Playwright deletes its outputDir (default test-results/) at the start of every run, so a redirect target inside it is unlinked mid-run and any grep over it reads a path that no longer exists. The gate asserts an exact passed total AND the absence of the word failed, because "N passed" also appears in a partly-failing run - which in turn makes a test title containing that word a permanent false negative. .tmp-format-parity/ established the convention; .tmp-e2e/ sits beside it in .gitignore.

### Pending Todos

- [Botond] Set the embargo date for the first un-gated public deploy (recorded TBD in 01-CONTEXT.md D-03); ask before any deploy that removes the Basic Auth gate.

### Blockers/Concerns

- [Phase 2] MEDIUM confidence that a bare browser page can complete the protocol without the Grid Editor runtime; whether an outbound host heartbeat is required is LOW confidence and needs an A/B inside the phase.
- [Phase 5] The base36 stamp checksum is a known open hole in prior art (a relabelled stamp can decode to a different card) — needs its own design pass before sharing goes public.
- [Phase 7] Flash unplug-during-store ordering: firmware writes Setup before Timer to flash, opposite of the RAM write order; mitigation needs validation against real hardware timing.
- [Phase 5] The 941/908 over-budget preset combination noted in PROJECT.md is known pre-existing compiler debt; it surfaces during the full-range knob sweep.
- All *(hardware)* success criteria require the user personally, with a real ZONA. Web Serial is not automatable.

## Session Continuity

Last session: 2026-09-03T11:01:24.520Z
Stopped at: Completed 03-06-PLAN.md
Resume file: None
