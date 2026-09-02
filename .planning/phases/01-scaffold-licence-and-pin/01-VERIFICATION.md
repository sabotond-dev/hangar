---
phase: 01-scaffold-licence-and-pin
verified: 2026-09-02T16:17:17Z
status: passed
score: 25/25 must-haves verified
---

# Phase 1: Scaffold, Licence and Pin Verification Report

**Phase Goal:** The repository exists as a deployable static site whose licence and dependency
obligations are already satisfied, so both tracks can start from it without retrofitting anything.
**Verified:** 2026-09-02T16:17:17Z
**Status:** passed

**Verified at:** local `HEAD` = `cd67a0852d85554b7151c7a9c14786f2ac8aa9cc`, working tree clean.
**Deployed commit:** `503964d70d3156e6105103e89ce6f5f3b81429dc` — equal to `git ls-remote origin
refs/heads/master`. Local `HEAD` is one commit ahead, and `git diff --stat 503964d cd67a08` shows it
touches only `.planning/ROADMAP.md`, `.planning/STATE.md` and `01-05-SUMMARY.md`. No source, config,
licence or build file differs between the deployed commit and the tree verified here.

## Goal Achievement

### Observable Truths

Twenty-five truths across the five plans' `must_haves`, mapped to the four ROADMAP success criteria.

#### Plan 01-01 — scaffold, pin, formatter parity (criteria 3, 4)

| #   | Truth                                                                                                       | Status     | Evidence                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `npm run build` produces `build/index.html` and `build/404.html` with no application server involved         | ✓ VERIFIED | Ran `npm run build`: "Using @sveltejs/adapter-static / Wrote site to build". `build/` contains `index.html`, `404.html`, `_app/`, `robots.txt`. No SSR entrypoint is shipped.          |
| 2   | `@intechstudio/grid-protocol` is declared in package.json as the bare string `1.20260825.1135`               | ✓ VERIFIED | `package.json` `dependencies` = `"1.20260825.1135"` — no caret, tilde, `x`, hyphen or `\|\|`.                                                                                          |
| 3   | `npx vitest run` exits 0 and the Playwright browsers are installed                                           | ✓ VERIFIED | `npx vitest run`: 4 files, **18 passed, 1 todo**, exit 0, 3.94s. `npm run test:e2e`: Chromium launched, 6 passed.                                                                     |
| 4   | Formatting does not reorder Tailwind class attributes and uses Prettier defaults, matching grid-editor       | ✓ VERIFIED | `.prettierrc` is exactly `{"plugins":["prettier-plugin-svelte"]}` — no `prettier-plugin-tailwindcss`, no option overrides. `prettier@3.6.2` / `prettier-plugin-svelte@3.4.0`, both exact. |
| 5   | `npm run lint` is green on a tree containing planning markdown and CLAUDE.md, and `npm run format` rewrites neither | ✓ VERIFIED | `npm run lint` (= `prettier --check . && eslint .`) exits 0, "All matched files use Prettier code style". `.prettierignore` lists `.planning/`, `CLAUDE.md`, `src/vendor/`, `THIRD-PARTY.md`, `licenses/`. |

#### Plan 01-02 — the pin gate, config shape, format-parity canary (criterion 3)

| #   | Truth                                                                                                   | Status     | Evidence                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | A test goes red if package.json, package-lock.json and `PROTOCOL_PIN` ever disagree                      | ✓ VERIFIED | `protocol-pin.spec.ts` asserts all three. Mutation spot-check (below): lock bumped alone → `lockEqPin:false`; declared bumped alone → `declEqPin:false`.                                     |
| 7   | A test goes red if the declared version gains any range operator                                        | ✓ VERIFIED | `expect(declared).toMatch(/^\d+\.\d+\.\d+$/)`. Spot-check: `^`, `~` and `1.20260825.x` all yield `noRange:false`.                                                                            |
| 8   | A test goes red if the pin literal is bumped, so `npm update` cannot pass quietly                        | ✓ VERIFIED | Fourth assertion hard-codes `"1.20260825.1135"`. Spot-check: a coherent three-way bump still yields `pinEqLiteral:false`.                                                                    |
| 9   | A test goes red if a `svelte.config.js`/`.ts` reappears and shadows the Vite config                      | ✓ VERIFIED | `config-shape.spec.ts` asserts both `existsSync` false, forbids `kit: {` and requires `adapter: adapter(`. Neither file exists; `vite.config.ts` passes Kit options flat.                    |
| 10  | A test goes red if HANGAR's formatter stops producing byte-identical output to grid-editor's own formatter | ✓ VERIFIED | `format-parity.spec.ts` runs HANGAR's Prettier and `grid-editor/node_modules/prettier/bin/prettier.cjs` over `_pad.ts` and `pad-sim-host.ts` and compares stdout byte for byte. Green in the run above; it fails (never skips) if the sibling checkout is missing. Sibling repo touched read-only — no `--write`. |

#### Plan 01-03 — licence, notices, source archive (criteria 1, 2)

| #   | Truth                                                                                          | Status     | Evidence                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | `npm run build` produces `build/LICENSE`, `build/THIRD-PARTY.md`, `build/licenses/` and `build/source-<sha>.tar.gz` | ✓ VERIFIED | All four present after the build. `postbuild: cd67a085… — LICENSE, THIRD-PARTY.md and licenses/ copied into build/; source-cd67a085….tar.gz is 103 KB`. `build/LICENSE` line 1 is "GNU GENERAL PUBLIC LICENSE", 696 lines. |
| 12  | THIRD-PARTY.md lists grid-protocol with a GPL-3.0 token and `@wasm-fmt/lua_fmt` with MIT        | ✓ VERIFIED | Both listed, plus the StyLua/MPL-2.0 provenance note. `licenses/` carries both full texts (grid-protocol's is the GPLv3 text; lua_fmt's is the MIT text).                                     |
| 13  | The source archive contains `package-lock.json` and no `.planning/` entry                       | ✓ VERIFIED | `tar -tzf build/source-cd67a08….tar.gz`: 59 entries; `package-lock.json`, `vite.config.ts`, `LICENSE`, `licenses/*` present; `.planning/` 0, `CLAUDE.md` 0, `node_modules/` 0. Re-checked for the **deployed** commit by streaming `git archive 503964d \| tar -t`: 59 entries, lockfile 1, `.planning/` 0, `CLAUDE.md` 0. |
| 14  | A test goes red if a production dependency is added without regenerating THIRD-PARTY.md         | ✓ VERIFIED | `licence-notices.spec.ts` walks every non-dev `package-lock.json` entry and requires its name in the notices. Spot-check: the two real prod deps are present; a hypothetical new one is not.  |
| 15  | A generator gate goes red if a production licence falls outside the GPL-compatible allowlist    | ✓ VERIFIED | `scripts/gen-licenses.mjs` lines 96–137: hard `process.exit(1)` if grid-protocol is absent, if its licence stops starting with `GPL-3.0`, or if any package's tokens leave `ALLOWED`.        |

#### Plan 01-04 — the gate, the footer, the harness (criteria 1, 2, 4)

| #   | Truth                                                                                             | Status     | Evidence                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 16  | A request with no credentials returns 401 with `WWW-Authenticate: Basic` and `X-Robots-Tag: noindex` | ✓ VERIFIED | Live: `curl https://hangar.sabotond.workers.dev/` → **401**, `WWW-Authenticate: Basic realm="HANGAR preview", charset="UTF-8"`, `X-Robots-Tag: noindex, nofollow, noarchive`, `Cache-Control: no-store`, `Server: cloudflare`, HTTPS. Local: `smoke.e2e.ts` "the preview gate (D-07)" green against `wrangler dev`. |
| 17  | With credentials the page renders and its footer shows a Source link, a LICENSE link and the full commit SHA | ✓ VERIFIED | Local, machine-observed: `smoke.e2e.ts` reads `data-testid="commit-sha"`, asserts `/^[0-9a-f]{40}$/`. `build/index.html` carries `/LICENSE`, `/THIRD-PARTY.md`, `/source-cd67a085….tar.gz` and the 40-char SHA. Live-with-credentials confirmed by the user (see Human Verification). |
| 18  | `/LICENSE`, `/THIRD-PARTY.md` and `/source-<sha>.tar.gz` all return 200 from the static build      | ✓ VERIFIED | `smoke.e2e.ts` asserts 200 for all three over HTTP through the real Worker, plus GPLv3 text in `/LICENSE` and grid-protocol in `/THIRD-PARTY.md`. Green.                                          |
| 19  | The page still renders when `navigator.serial` has been removed from `Navigator.prototype`         | ✓ VERIFIED | `smoke.e2e.ts` init script deletes the prototype accessor, asserts `"serial" in navigator === false` as a precondition, then asserts the `h1` visible. Green.                                    |
| 20  | Both test runners execute against `build/`, served with no application server                      | ✓ VERIFIED | Playwright's `webServer` is `npm run preview` = `npm run build && wrangler dev --port 4173`, serving `./build` through `worker/index.js` — no `vite preview`, no Node SSR server. Vitest's `licence-notices.spec.ts` asserts `build/LICENSE` and `build/THIRD-PARTY.md` when a build is present (it was, this run). |

#### Plan 01-05 — deploy and the live gated preview (criteria 1, 2)

| #   | Truth                                                                                                    | Status     | Evidence                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 21  | `npm run deploy` refuses to run when the working tree is dirty                                            | ✓ VERIFIED | `scripts/deploy.mjs` step 2: `git status --porcelain`, prints the offending paths, `process.exit(1)` before `npm run build`. No `--force` path exists. Observed biting during execution (01-05-SUMMARY: dirtied `README.md` → exit 1 at step 2 of 6). Not re-run here — success would deploy. |
| 22  | `npm run deploy` builds, verifies the compliance artefacts exist, then runs `wrangler deploy`              | ✓ VERIFIED | Six ordered gates, nine `process.exit(1)`: SHA → clean tree → `npm run build` → six artefacts in `build/` → `tar -tzf` shows a lockfile and no `.planning/` → `npx wrangler deploy` last. |
| 23  | A visitor loading `https://hangar.sabotond.workers.dev` over HTTPS is challenged by Basic Auth             | ✓ VERIFIED | Live, credential-free, this session: 401 with the `HANGAR preview` realm. `/LICENSE`, `/THIRD-PARTY.md` and `/source-503964d….tar.gz` are **also 401** — `run_worker_first: true` leaves no asset path around the gate. |
| 24  | After signing in, the footer Source link downloads an archive whose filename SHA matches the deployed commit | ✓ VERIFIED | User-verified behind the credential (01-05-SUMMARY §User-verified). Corroborated without the credential: deployed commit = pushed ref = `503964d`; the footer link is `/source-{__COMMIT_SHA__}.tar.gz` with `__COMMIT_SHA__` = `git rev-parse HEAD`; `postbuild.mjs` names the archive from the same SHA and deletes stale ones; the clean-tree gate makes bundle and archive the same commit by construction; and the identical mechanism is asserted end-to-end over HTTP by `smoke.e2e.ts` + `artifacts.e2e.ts` locally. |
| 25  | Responses carry `X-Robots-Tag: noindex`                                                                    | ✓ VERIFIED | Live on the 401: `noindex, nofollow, noarchive`. `worker/index.js` sets the same header on the authenticated 200 path (line 71); the user confirmed it on a credentialed response.      |

**Score:** 25/25 truths verified

### ROADMAP Success Criteria

| #   | Criterion (criterion 1 in its CONTEXT-amended form)                                                                                             | Status     | Evidence                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------- |
| 1   | A visitor can load the deployed site over HTTPS and download, from a visible Source link, a source archive of exactly the deployed commit, with the commit SHA shown beside it | ✓ VERIFIED | Truths 16, 17, 18, 23, 24, 25. Private repo (D-02) never required to be public. |
| 2   | A GPLv3 `LICENSE` and a third-party notices file are served from the site root, with grid-protocol's own GPLv3 listed                             | ✓ VERIFIED | Truths 11, 12, 18                                   |
| 3   | grid-protocol pinned to `1.20260825.1135` (no caret), and a check fails if the pin is loosened or bumped without a test gate                     | ✓ VERIFIED | Truths 2, 6, 7, 8 + `docs/PIN-POLICY.md`            |
| 4   | A developer can produce a static build and preview it with no server running, and both test runners execute against that build                   | ✓ VERIFIED | Truths 1, 3, 20                                     |

### Required Artifacts

| Artifact                        | Expected                                                     | Status                 | Details                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                  | Exact pin + script surface                                   | ✓ EXISTS + SUBSTANTIVE | `"@intechstudio/grid-protocol": "1.20260825.1135"`; `build` = `vite build && node scripts/postbuild.mjs`; `preview`, `deploy`, `licenses`, `test:unit`, `test:e2e`. |
| `package-lock.json`             | Resolved at the pinned version                               | ✓ EXISTS + SUBSTANTIVE | `packages["node_modules/@intechstudio/grid-protocol"].version` = `1.20260825.1135`; root declaration identical.             |
| `vite.config.ts`                | Flat adapter, `__COMMIT_SHA__`, optimizeDeps, vitest project | ✓ EXISTS + SUBSTANTIVE | `adapter({pages:"build",assets:"build",fallback:"404.html"})` flat inside `sveltekit()`; `define` for SHA + dirty flag; `optimizeDeps.exclude`; scoped `handleHttpError` for the three postbuild paths only. |
| `src/lib/protocol-pin.ts`       | `PROTOCOL_PIN` constant                                      | ✓ EXISTS + SUBSTANTIVE | Exports the literal; comment routes bumps to `docs/PIN-POLICY.md`; D-12 non-display note.                                   |
| `src/lib/protocol-pin.spec.ts`  | D-10 three-way gate + D-11 placeholder                       | ✓ EXISTS + SUBSTANTIVE | 4 assertions + `it.todo` for the cost baseline. 46 lines.                                                                   |
| `src/lib/config-shape.spec.ts`  | Build-shape gate                                             | ✓ EXISTS + SUBSTANTIVE | svelte.config absence, flat-Kit shape, optimizeDeps, Prettier parity.                                                       |
| `src/lib/format-parity.spec.ts` | D-15 vendor canary                                           | ✓ EXISTS + SUBSTANTIVE | Byte-for-byte stdout comparison against grid-editor's own Prettier; worktree-safe sibling resolution; fails rather than skips. |
| `src/lib/licence-notices.spec.ts` | Notices staleness + content gate                           | ✓ EXISTS + SUBSTANTIVE | GPLv3 text, §6(d) phrase, grid-protocol GPL-3.0, lua_fmt MIT + StyLua, per-dependency staleness, `licenses/`, `.gitattributes`, `build/` foothold. |
| `LICENSE`                       | Verbatim GPLv3 + D-04 copyright                              | ✓ EXISTS + SUBSTANTIVE | 696 lines; header "GNU GENERAL PUBLIC LICENSE / Version 3, 29 June 2007"; `Copyright (C) 2026 Botond Sandor` at line 679.   |
| `THIRD-PARTY.md`                | FOUND-04 notices file                                        | ✓ EXISTS + SUBSTANTIVE | Generated, deterministic, both prod deps with licence tokens and links to `licenses/`.                                      |
| `licenses/`                     | Full licence texts                                           | ✓ EXISTS + SUBSTANTIVE | Two files: grid-protocol (GPLv3 text) and lua_fmt (MIT text).                                                               |
| `.gitattributes`                | export-ignore rules                                          | ✓ EXISTS + SUBSTANTIVE | `.planning/`, `.claude/`, `CLAUDE.md`, `.gitattributes` export-ignored; `* text=auto eol=lf`.                               |
| `scripts/gen-licenses.mjs`      | Notices generation + GPL assertion + allowlist                | ✓ EXISTS + SUBSTANTIVE | `fail()` = `process.exit(1)`; GPL assertion on grid-protocol; allowlist filter; byte-deterministic output.                  |
| `scripts/postbuild.mjs`         | Copies licences, writes the archive                          | ✓ EXISTS + SUBSTANTIVE | Fatal on unresolvable/short SHA; copies `LICENSE`, `THIRD-PARTY.md`, `licenses/`; deletes stale `source-*.tar.gz`; `git archive` with a short-SHA prefix; re-asserts the four outputs. |
| `scripts/deploy.mjs`            | One-command deploy with the clean-tree gate                   | ✓ EXISTS + SUBSTANTIVE | 6 gates, 9 hard exits, `status --porcelain`, `wrangler deploy` last.                                                        |
| `worker/index.js`               | Fail-closed Basic Auth gate                                   | ✓ EXISTS + SUBSTANTIVE | Unauthorized unless `SITE_PASSWORD` exists; length-independent compare; both user and password always evaluated; security headers on both paths. |
| `wrangler.jsonc`                | Static-assets config with `run_worker_first`                  | ✓ EXISTS + SUBSTANTIVE | `assets.directory ./build`, `binding ASSETS`, `run_worker_first: true`, `not_found_handling: "404-page"`.                   |
| `playwright.config.ts`          | Harness pointed at `build/` through the real Worker            | ✓ EXISTS + SUBSTANTIVE | `webServer.command` = `npm run preview`; `url` readiness probe (accepts the 401); credentials read from the same `.dev.vars` wrangler reads. |
| `e2e/smoke.e2e.ts`              | D-14 degrade smoke + licence/source assertions                 | ✓ EXISTS + SUBSTANTIVE | 4 tests. Deliberate expansion beyond D-14's "exactly one", justified in 01-04-SUMMARY.                                       |
| `e2e/artifacts.e2e.ts`          | Archive-content assertions against a fresh build               | ✓ EXISTS + SUBSTANTIVE | 2 tests: six build artefacts; archive carries the lockfile and no `.planning/`, `CLAUDE.md` or `node_modules/`.             |
| `src/routes/+layout.svelte`     | GPLv3 §6(d) persistent footer                                  | ✓ EXISTS + SUBSTANTIVE | Three `rel="external"` links + `<code data-testid="commit-sha">`; separate `__BUILD_DIRTY__` marker so the SHA never gains a `-dirty` suffix. |
| `src/routes/+layout.ts`         | Prerender                                                     | ✓ EXISTS + SUBSTANTIVE | `export const prerender = true` (+ `trailingSlash = "always"`).                                                             |
| `.prettierrc` / `.prettierignore` | grid-editor parity                                          | ✓ EXISTS + SUBSTANTIVE | Single-plugin object; ignores `.planning/`, `CLAUDE.md`, `src/vendor/`, generated licence artefacts.                        |
| `src/vendor/botor/VENDOR.md`    | D-16 sync-document skeleton                                    | ✓ EXISTS + SUBSTANTIVE | Upstream repo/branch, empty per-file table, header template quoting GPLv3 §5(a)/(b), 8-step sync procedure with the read-only rule for the sibling repo. |
| `docs/PIN-POLICY.md`            | D-11 bump rule + D-12 internal firmware range                  | ✓ EXISTS + SUBSTANTIVE | Three-source table, four-item bump checklist, empty bump log, "never rendered to visitors" note. `TBD` values are Phase 2/3 by design. |
| `docs/DEPLOY.md`                | Deploy + secret procedure + gate-removal note                  | ✓ EXISTS + SUBSTANTIVE | Post-deploy secret ordering with the fail-closed justification, the six-gate table, the no-`--force` rationale.             |

**Artifacts:** 26/26 verified

### Key Link Verification

| From                                | To                             | Via                                                    | Status   | Details                                                                                                     |
| ----------------------------------- | ------------------------------ | ------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------- |
| `vite.config.ts`                    | `@sveltejs/adapter-static`     | flat `adapter:` inside `sveltekit()`                   | ✓ WIRED  | Build log: "Using @sveltejs/adapter-static / Wrote site to build". Guarded by `config-shape.spec.ts`.        |
| `src/routes/+layout.ts`             | prerender                      | `export const prerender = true`                        | ✓ WIRED  | Static `index.html` + `404.html` produced.                                                                  |
| `protocol-pin.spec.ts`              | `package-lock.json`            | `packages['node_modules/…'].version`                   | ✓ WIRED  | Reads the real lockfile; passes on the real value, fails on a mutated one.                                   |
| `protocol-pin.spec.ts`              | `src/lib/protocol-pin.ts`      | `import { PROTOCOL_PIN } from "./protocol-pin"`        | ✓ WIRED  | Real import, not a duplicated literal, plus a separate hard-coded-literal assertion.                         |
| `format-parity.spec.ts`             | grid-editor's own Prettier     | stdout-vs-stdout byte comparison                       | ✓ WIRED  | Resolves `grid-editor/node_modules/prettier/bin/prettier.cjs`; green on both canaries.                        |
| `package.json` `build`              | `scripts/postbuild.mjs`        | `vite build && node scripts/postbuild.mjs`             | ✓ WIRED  | Postbuild line printed at the end of every build.                                                            |
| `scripts/postbuild.mjs`             | `build/source-<sha>.tar.gz`    | `git archive --format=tar.gz --prefix=hangar-<sha7>/`  | ✓ WIRED  | Archive written and re-asserted; 103 KB, 59 entries.                                                         |
| `.gitattributes`                    | the source archive             | `export-ignore`                                        | ✓ WIRED  | 0 `.planning/` and 0 `CLAUDE.md` entries at both `cd67a08` and the deployed `503964d`.                       |
| `src/routes/+layout.svelte`         | `build/source-<sha>.tar.gz`    | `href="/source-{__COMMIT_SHA__}.tar.gz"`               | ✓ WIRED  | `build/index.html` carries `source-cd67a085….tar.gz`, and that exact file exists in `build/`.                |
| `worker/index.js`                   | `build/`                       | `env.ASSETS.fetch(request)` after the auth check       | ✓ WIRED  | Authenticated e2e requests return 200 for `/`, `/LICENSE`, `/THIRD-PARTY.md`, the archive; unknown path 404. |
| `playwright.config.ts`              | `wrangler dev` over `./build`  | `webServer.command = npm run preview`                  | ✓ WIRED  | Suite ran against `http://127.0.0.1:4173`; no `vite preview` anywhere in the command.                        |
| `scripts/deploy.mjs`                | `git status --porcelain`       | hard `exit(1)` when non-empty                          | ✓ WIRED  | Step 2, ahead of the build; observed refusing during execution.                                              |
| `scripts/deploy.mjs`                | `wrangler deploy`              | `execSync` after the artefact + archive assertions     | ✓ WIRED  | Step 6, last. Live Worker at `hangar.sabotond.workers.dev` serving `503964d`.                                |
| `wrangler.jsonc` `run_worker_first` | every asset path               | Worker-first routing                                   | ✓ WIRED  | Live: `/LICENSE` and `/source-503964d….tar.gz` both 401 without credentials.                                 |

**Wiring:** 14/14 connections verified

### Data-Flow Trace (Level 4)

| Artifact                    | Data variable    | Source                                              | Produces real data | Status     |
| --------------------------- | ---------------- | --------------------------------------------------- | ------------------ | ---------- |
| `src/routes/+layout.svelte` | `__COMMIT_SHA__` | Vite `define` ← `execSync("git rev-parse HEAD")`     | Yes                | ✓ FLOWING  |
| `src/routes/+layout.svelte` | `__BUILD_DIRTY__`| Vite `define` ← `git status --porcelain` length      | Yes                | ✓ FLOWING  |
| Source link target          | archive filename | `postbuild.mjs` `git archive` on the same `HEAD` SHA | Yes                | ✓ FLOWING  |
| `THIRD-PARTY.md`            | dependency list  | `license-checker-rseidelsohn` over the prod tree     | Yes                | ✓ FLOWING  |
| `worker/index.js`           | `env.SITE_PASSWORD` | Cloudflare Worker secret / `.dev.vars` locally    | Yes                | ✓ FLOWING  |

No hollow props, no hardcoded empties. The footer's SHA in `build/index.html`
(`cd67a0852d85554b7151c7a9c14786f2ac8aa9cc`) equals `git rev-parse HEAD` exactly, and the archive
sitting beside it carries the same 40 characters in its filename.

### Behavioral Spot-Checks

| Behavior                                              | Command                                                                    | Result                                                     | Status |
| ----------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------- | ------ |
| Unit gates green                                      | `npx vitest run`                                                           | 4 files, 18 passed, 1 todo, exit 0                          | ✓ PASS |
| Static build produced                                 | `npm run build`                                                            | adapter-static wrote `build/`; postbuild reported 103 KB archive | ✓ PASS |
| Formatting + lint green                               | `npm run lint`                                                             | "All matched files use Prettier code style", eslint silent  | ✓ PASS |
| Types green                                           | `npm run check`                                                            | 336 files, 0 errors, 0 warnings                             | ✓ PASS |
| Both runners against the build                        | `npm run test:e2e`                                                         | 6 passed in 10.6s through `wrangler dev` over `./build`     | ✓ PASS |
| Archive is Corresponding Source (local HEAD)          | `tar -tzf build/source-cd67a08….tar.gz`                                    | 59 entries; lockfile yes; `.planning/` 0; `CLAUDE.md` 0; `node_modules/` 0 | ✓ PASS |
| Archive is Corresponding Source (**deployed** commit) | `git archive 503964d \| tar -t`                                            | 59 entries; lockfile 1; `.planning/` 0; `CLAUDE.md` 0       | ✓ PASS |
| Live gate, credential-free                            | `curl -s -o /dev/null -w '%{http_code}' https://hangar.sabotond.workers.dev/` | **401**, HTTPS                                            | ✓ PASS |
| Live gate headers                                     | `curl -D -` on the same URL                                                | `WWW-Authenticate: Basic realm="HANGAR preview", charset="UTF-8"`; `X-Robots-Tag: noindex, nofollow, noarchive` | ✓ PASS |
| No asset bypasses the gate                            | `curl` on `/LICENSE`, `/THIRD-PARTY.md`, `/source-503964d….tar.gz`         | 401, 401, 401                                               | ✓ PASS |
| Deployed commit = pushed commit                       | `git ls-remote origin refs/heads/master`                                   | `503964d70d3156e6105103e89ce6f5f3b81429dc`                  | ✓ PASS |
| Pin gate is a real gate (mutation spot-check)         | in-memory replay of the four assertions against mutated inputs             | caret / tilde / `x`-range → range assertion red; lock-only bump → lock assertion red; coherent three-way bump → literal assertion red | ✓ PASS |
| Notices staleness gate is a real gate                 | in-memory replay of the per-dependency containment check                   | both real prod deps present; an unlisted package is not found → red | ✓ PASS |
| Clean-tree deploy gate                                | not re-run (success would deploy)                                          | code inspected; observed refusing during execution (01-05-SUMMARY) | ? SKIP |

Post-run hygiene: nothing is LISTENING on 4173 (only `TIME_WAIT` client sockets), no `wrangler` or
`workerd` process survives, `.tmp-format-parity/` was cleaned up by the test's `afterAll`, and
`git status --porcelain` is empty — the whole verification left the tracked tree untouched.

## Requirements Coverage

| Requirement                                                                                                                                                        | Source plans     | Status      | Evidence                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | ----------- | --------------------------------------------------------------------------------- |
| **FOUND-03**: grid-protocol pinned to the exact version BOTOR's cost baseline was measured against, and any bump is a test-gated change                              | 01-01, 01-02     | ✓ SATISFIED | Truths 2, 6, 7, 8; `docs/PIN-POLICY.md`; mutation spot-check. The D-11 cost-baseline half is an explicit `it.todo` deferred to Phase 3 and documented as "until then the pin does not move". |
| **FOUND-04**: GPLv3 licence, a third-party notices file (grid-protocol itself GPLv3), and the deployed site serves a source archive of the deployed commit (§6(d); the repository stays private per D-02) | 01-03, 01-04, 01-05 | ✓ SATISFIED | Truths 11–13, 16–18, 23–25; deployed-commit archive verified by streamed `git archive`. |

No orphaned requirements: `REQUIREMENTS.md` maps exactly FOUND-03 and FOUND-04 to Phase 1, both are
claimed by plan frontmatter, and both are marked Complete in the coverage table. The D-02 amendment is
carried in the requirement text itself, so `REQUIREMENTS.md` no longer contradicts the private-repo
decision.

## Anti-Patterns Found

| File                | Line | Pattern                                                             | Severity | Impact                                                                                                              |
| ------------------- | ---- | ------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `scripts/deploy.mjs`| ~150 | Step 5 checks the archive for `.planning/` but not for `CLAUDE.md`   | ℹ️ Info  | Not a hole in practice: `.gitattributes` export-ignores `CLAUDE.md` and `e2e/artifacts.e2e.ts` asserts it is absent, verified at both `cd67a08` and `503964d`. Noted only because the deploy gate is the last line of defence and the two checks are asymmetric. |
| `docs/PIN-POLICY.md`| —    | "Tested firmware range: TBD"                                         | ℹ️ Info  | By design — Phase 2 supplies a real ZONA firmware version. Internal-only (D-12), never rendered.                     |
| `src/vendor/botor/VENDOR.md` | — | Empty vendored-files table, "Recorded upstream SHA: TBD"           | ℹ️ Info  | By design — the file exists to create the seam; Phase 3 (FOUND-02) fills it. Explicitly stated in its own §Status.   |
| `.planning/STATE.md`| —    | Embargo date (D-03) recorded as TBD                                  | ℹ️ Info  | By design and by user decision. Nothing in Phase 1 depends on the date, only on the gate existing — and the gate is live. |

Zero `TODO`, `FIXME`, `XXX`, `HACK`, `PLACEHOLDER`, "coming soon" or "not yet implemented" markers in
`src/`, `e2e/`, `scripts/` or `worker/`. Zero stub returns, zero empty handlers. The single
`it.todo` in `protocol-pin.spec.ts` is a deliberate, documented Phase 3 seam, not an unfinished test.
No Claude or Anthropic attribution appears in any source file, header, doc or commit message.

**Anti-patterns:** 4 found (0 blockers, 0 warnings, 4 info)

### Deliberate, recorded deviations (not gaps)

- **D-14 "exactly one smoke test" became six Playwright tests.** Expanded with written justification in
  01-04-SUMMARY. The D-14 test itself is present and intact (`the page renders with the capability
  removed`, asserting its own precondition); the other five cover criteria 1, 2 and 4, which otherwise
  had no machine assertion.
- **D-15's canary was reformulated from "vendored file survives `prettier --check`" to "HANGAR's and
  BOTOR's formatters emit identical bytes".** User checkpoint decision B, recorded in 01-02-SUMMARY and
  the amended plan. The reformulation is strictly stronger for the stated motive (clean re-sync diffs) —
  the original form would have asserted upstream's hygiene and been permanently red, as the summary
  documents with per-file drift counts.
- **Local `HEAD` is one docs-only commit ahead of the deployed commit.** `git diff --stat` confirms
  only `.planning/` files differ. The deployed artifact and the verified tree are the same code.

## Human Verification Required

None outstanding. Three items are behind the Basic Auth credential, which this session does not hold
and must not obtain. All three were performed and reported by the user during 01-05 and are recorded in
01-05-SUMMARY §User-verified. The credential-free evidence gathered here is consistent with every one
of them and contradicts none:

1. **Sign-in and page render** — the browser challenges for realm `HANGAR preview`, then the page
   renders with the `HANGAR` heading and the footer.
   _Credential-free corroboration:_ live 401 carries exactly that realm; the identical build renders and
   passes the same assertions through the identical Worker locally.
2. **Footer SHA and Source download** — the 40-character SHA equals `git rev-parse HEAD`, and the Source
   link downloads `source-<that sha>.tar.gz`, which opens and contains `package-lock.json` but no
   `.planning/` or `CLAUDE.md`.
   _Credential-free corroboration:_ deployed SHA = pushed ref = `503964d`; streaming `git archive
   503964d` shows 59 entries with the lockfile and neither excluded path; `artifacts.e2e.ts` asserts the
   same properties over HTTP on every `npm run test:e2e`.
3. **`/LICENSE` and `/THIRD-PARTY.md` bodies, and `x-robots-tag` on a 200** — GPLv3 text and the
   grid-protocol GPL-3.0 / lua_fmt MIT rows.
   _Credential-free corroboration:_ both files are byte-identical in `build/`, are asserted over HTTP by
   `smoke.e2e.ts`, and `worker/index.js` sets `X-Robots-Tag` on the authenticated response path.

## Gaps Summary

**No gaps found.** Phase goal achieved.

The repository is a deployable static site: `npm run build` alone produces a complete,
GPLv3-compliant `build/` — bundle, `LICENSE`, `THIRD-PARTY.md`, `licenses/` and a source archive of
exactly the commit that produced the bundle — with no application server anywhere in the path. The
licence obligations are discharged at the artifact level rather than by repository visibility, which is
what D-02 requires. The pin is exact and defended by a gate that goes red on loosening, on a silent
`npm update` and on a deliberate bump alike. Both runners execute against the real build through the
real Worker, so the preview gate is itself a regression test. Phases 2 and 3 can start from this
without retrofitting anything: `src/vendor/botor/VENDOR.md` and the `it.todo` cost-baseline assertion
are the two seams they fill, and both are documented rather than implied.

## Verification Metadata

**Verification approach:** Goal-backward, from the four ROADMAP success criteria (criterion 1 in its
CONTEXT-amended, private-repo form) back through the five plans' `must_haves` to the files on disk.
**Must-haves source:** `must_haves` frontmatter in 01-01 through 01-05-PLAN.md (25 truths, 26
artifacts, 14 key links), cross-checked against ROADMAP §Phase 1 and 01-CONTEXT.md D-01..D-17.
**Automated checks:** 13 passed, 0 failed, 1 skipped (the clean-tree deploy gate — re-running it on a
clean tree would deploy).
**Human checks required:** 0 outstanding (3 credential-gated items already performed and reported by
the user).
**Read-only discipline:** no tracked file was modified, no commit, no push, no deploy, no secret read
or guessed, no sibling repository written to. Only `build/`, `.svelte-kit/` and Playwright's
`test-results/` changed, all gitignored; `git status --porcelain` is empty.
**Total verification time:** ~9 min

---

_Verified: 2026-09-02T16:17:17Z_
_Verifier: gsd-verifier_
