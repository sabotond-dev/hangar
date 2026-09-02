---
phase: 1
slug: scaffold-licence-and-pin
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-02
reconciled: 2026-09-02
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Reconciled against the real plan task IDs on 2026-09-02, and again after checker iteration 1
> (wave restructure: 01-03 now depends on 01-02, shifting 03 to wave 3, 04 to wave 4 and 05 to wave 5)
> and checker iteration 2 (lint scope; see "Lint scope is a sampling precondition" below).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x (node env, `server` project inside `vite.config.ts`) + @playwright/test 1.6x against `build/` |
| **Config file** | `vite.config.ts` -> `test.projects[0]`; `playwright.config.ts` (`testDir: 'e2e'`, `testMatch: '**/*.e2e.ts'`) |
| **Browser harness** | `npm run preview` === `npm run build && wrangler dev --port 4173 --ip 127.0.0.1` — the real `build/` through the real Worker. Fallback `sirv-cli` only if the measured cold start exceeds ~20 s (Task 1-04-03 decides, with the number written into the config) |
| **Quick run command** | `npm run test:unit -- --run` (pure filesystem reads, sub-second) |
| **Full suite command** | `npm run check && npm run lint && npm run test:unit -- --run && npm run test:e2e` |
| **Estimated runtime** | ~60-90 seconds (the build plus `wrangler dev` startup dominate) |

**Deliberate split (changed during planning):** the exhaustive assertions that require a completed
`build/` live in the Playwright suite (`e2e/artifacts.e2e.ts`), not in Vitest. The Playwright `webServer`
always builds first, whereas a Vitest file asserting on `build/` would turn the per-task inner loop red on
a clean tree for the wrong reason. Vitest therefore stays sub-second and always runnable.

**Lint scope is a sampling precondition (added in checker iteration 2):** `npm run lint` is
`prettier --check . && eslint .`, and it appears in the per-wave sampling command and in the
`npm run lint` acceptance criterion of plans 01, 03, 04 and 05. It walks the whole repository, which
includes tracked, hand-written markdown: `.planning/` is not gitignored, and `CLAUDE.md` is tracked and
generated. Task 1-01-03 therefore appends `.planning/` and `CLAUDE.md` to `.prettierignore` alongside
`src/vendor/`, and adds `__COMMIT_SHA__`/`__BUILD_DIRTY__` to `eslint.config.js` as `languageOptions`
globals (sv's flat config keeps `no-undef` on for `.svelte` files, and plan 04's footer references both
in markup). Without those two edits, every SUMMARY.md an executor writes re-reds the next plan's lint
criterion, and `npm run format` would rewrite the PLAN.md files being executed. If a lint sample goes red
on a file under `.planning/`, the fix is `.prettierignore` — never `npm run format`.

**One deliberate exception (added in checker iteration 1):** `src/lib/licence-notices.spec.ts` carries a
single `existsSync('build')`-guarded assertion — when a build is present it asserts `build/LICENSE` and
`build/THIRD-PARTY.md` exist, and when it is absent it asserts that and returns. This exists so that
success criterion 4's "**both** test runners execute against that build" is literally true rather than
reinterpreted: without it, Vitest never touches `build/` at all. The guard keeps the inner loop
build-independent. `requireAssertions` is on, so the no-build branch asserts too.

---

## Sampling Rate

- **After every task commit:** `npm run test:unit -- --run`
- **After every plan wave:** `npm run check && npm run lint && npm run test:unit -- --run && npm run test:e2e`
- **Before `/gsd:verify-work`:** full suite green, then the manual checks in Task 1-05-03
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement / Decision | Test Type | Automated Command | Test File | Status |
|---------|------|------|------------------------|-----------|-------------------|-----------|--------|
| 1-01-01 | 01 | 1 | scaffold | CLI assertion | `test -f vite.config.ts && test ! -e svelte.config.js && test ! -e src/routes/demo && grep -q "^dist/$" .gitignore` | n/a (infrastructure) | ⬜ pending |
| 1-01-02 | 01 | 1 | FOUND-03 (D-09) | CLI assertion | `node -e "…package.json + package-lock.json both === 1.20260825.1135…" && npx playwright --version` | n/a (infrastructure) | ⬜ pending |
| 1-01-03 | 01 | 1 | criterion 4a | build artefact | `npm run check && npm run lint && npm run build && test -f build/index.html && test -f build/404.html` | n/a (infrastructure) | ⬜ pending |
| 1-02-01 | 02 | 2 | FOUND-03 (3a/3b/3c), D-10 | unit | `npx vitest run src/lib/protocol-pin.spec.ts` | `src/lib/protocol-pin.spec.ts` | ⬜ pending |
| 1-02-02 | 02 | 2 | criterion 4b, D-11, D-12, D-15, D-16 | unit | `npx vitest run src/lib/config-shape.spec.ts` | `src/lib/config-shape.spec.ts` | ⬜ pending |
| 1-02-03 | 02 | 2 | D-15 (vendor canary) | unit | `npx vitest run src/lib/format-parity.spec.ts` | `src/lib/format-parity.spec.ts` | ⬜ pending |
| 1-03-01 | 03 | 3 | FOUND-04 (2a), criterion 1c | CLI assertion | `head -n 1 LICENSE \| grep -q "GNU GENERAL PUBLIC LICENSE" && git ls-files --error-unmatch .gitattributes && tar -tzf build/source-*.tar.gz \| grep -c '\.planning/'` = 0 | n/a + `e2e/artifacts.e2e.ts` | ⬜ pending |
| 1-03-02 | 03 | 3 | FOUND-04 (2b/2c) | CLI assertion | `npm run licenses && grep -q "@intechstudio/grid-protocol" THIRD-PARTY.md && git diff --quiet -- THIRD-PARTY.md licenses && npm run lint` | n/a (generator gate) | ⬜ pending |
| 1-03-03 | 03 | 3 | FOUND-04 (2c/2d), criteria 4a and 4c | unit + build artefact | `npm run build && npx vitest run src/lib/licence-notices.spec.ts` (7 tests; the 7th is the `existsSync('build')`-guarded criterion-4c assertion) | `src/lib/licence-notices.spec.ts` | ⬜ pending |
| 1-04-01 | 04 | 4 | D-07 | CLI assertion | `grep -q "if (!expectedPass) return unauthorized();" worker/index.js && git check-ignore -q .dev.vars`; live: `curl` returns 401 | covered by `e2e/smoke.e2e.ts` | ⬜ pending |
| 1-04-02 | 04 | 4 | criterion 1b | build artefact | `npm run build && test -f "build/$(grep -oE 'source-[0-9a-f]{40}\.tar\.gz' build/index.html \| head -1)"` | covered by `e2e/smoke.e2e.ts` | ⬜ pending |
| 1-04-03 | 04 | 4 | criteria 1b, 1c, 2a, 2b, 4b, 4c; D-07, D-14 | e2e | `npm run test:unit -- --run && npm run test:e2e` | `e2e/smoke.e2e.ts`, `e2e/artifacts.e2e.ts` | ⬜ pending |
| 1-05-01 | 05 | 5 | criterion 1d (gate, not test); D-02 doc amendment | CLI assertion | `node -e "…scripts.deploy === 'node scripts/deploy.mjs'…" && grep -q "status --porcelain" scripts/deploy.mjs`; negative check: dirty tree makes `npm run deploy` exit non-zero; doc amendment: `grep -q "public source" .planning/PROJECT.md` FAILS and `sed -n '/GSD:project-start/,/GSD:project-end/p' CLAUDE.md \| tr -s '[:space:]' ' ' \| grep -q "per-deploy archive"` succeeds after `generate-claude-md` | n/a (deploy gate) | ⬜ pending |
| 1-05-02 | 05 | 5 | D-01, D-02 setup | manual (checkpoint) | `git ls-remote origin \| grep -q "refs/heads/master"`; `npx wrangler whoami` | n/a | ⬜ pending |
| 1-05-03 | 05 | 5 | criteria 1a, 1b, 2a, 2b live; D-07 secrets | manual (checkpoint) | `curl -s -o /dev/null -w '%{http_code}' https://hangar.sabotond.workers.dev/` = 401; `npx wrangler secret list` names both secrets (after the first deploy — the Worker does not exist before it) | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

### Success criteria coverage

| # | Criterion (criterion 1 in its CONTEXT-amended form) | Covered by |
|---|---|---|
| 1a | Deployed site loads over HTTPS behind Basic Auth | 1-05-03 (manual) + `e2e/smoke.e2e.ts` "the preview gate" (401 locally) |
| 1b | Visible Source link downloads an archive of exactly the deployed commit, SHA shown beside it | 1-04-02, 1-04-03 (`e2e/smoke.e2e.ts`), 1-05-03 (manual, live) |
| 1c | The archive carries the lockfile and no internal planning docs | 1-03-01, 1-04-03 (`e2e/artifacts.e2e.ts`) |
| 1d | The deployed archive matches the deployed bundle | 1-05-01 — a gate, not a test: `scripts/deploy.mjs` exits 1 on a dirty tree |
| 2a | GPLv3 `LICENSE` served from the site root | 1-03-01, 1-04-03 (`e2e/smoke.e2e.ts`) |
| 2b | A third-party notices file served from the site root | 1-03-02, 1-04-03 |
| 2c | `@intechstudio/grid-protocol`'s own GPLv3 is listed | 1-03-03 (`src/lib/licence-notices.spec.ts`) |
| 2d | The notices file is not stale | 1-03-03 (staleness test over `package-lock.json`) |
| 3a | Pinned exact, no range operator | 1-02-01 |
| 3b | package.json, lockfile and `PROTOCOL_PIN` all agree (D-10) | 1-02-01 |
| 3c | A bump cannot pass silently | 1-02-01 (the hard-coded literal assertion) |
| 3d | A bump must clear the cost-baseline gate (D-11) | 1-02-01 `it.todo` + `docs/PIN-POLICY.md` — deferred to Phase 3 |
| 4a | A static build is produced | 1-01-03, 1-03-03, `e2e/artifacts.e2e.ts` |
| 4b | It previews with no application server | 1-02-02 (no `svelte.config`, no `kit:` wrapper) + the `wrangler dev` harness in 1-04-03 |
| 4c | Both runners execute against that build | 1-04-03 (Playwright: `e2e/artifacts.e2e.ts` + `e2e/smoke.e2e.ts` against `build/` through the Worker) **and** 1-03-03 (Vitest: the `existsSync('build')`-guarded assertion in `licence-notices.spec.ts` that `build/LICENSE` and `build/THIRD-PARTY.md` exist). Recorded reinterpretation: the criterion says "both", and the deliberate Vitest/Playwright split above otherwise leaves every `build/` assertion in Playwright. The single guarded Vitest assertion makes "both" literal without making the sub-second inner loop depend on a build having been run |
| D-14 | Degrade path: `navigator.serial` removed from `Navigator.prototype`, precondition asserted | 1-04-03 (`e2e/smoke.e2e.ts`) |
| D-15 | Formatting parity with grid-editor (vendor canary) | 1-02-03 |
| D-07 | The gate actually gates (401 + `WWW-Authenticate` + `X-Robots-Tag`) | 1-04-01, 1-04-03, 1-05-03 |

---

## Wave 0 Requirements

Wave 0 is plan 01 in its entirety — this is the first phase and there is no test infrastructure at all.

- [ ] Framework install: `npx sv@0.17.0 create … --add … vitest=usages:unit playwright …` then `npm install` — **Task 1-01-01 / 1-01-02**
- [ ] `npx playwright install chromium` — browsers are NOT on this machine (~150 MB) — **Task 1-01-02**
- [ ] `vite.config.ts` `test.projects[0]` server project (sv generates it; verify, don't rewrite) — **Task 1-01-03**
- [ ] `playwright.config.ts` — rewrite sv's `webServer`/`port` to the `build/` harness + `url` — **Task 1-04-03**
- [ ] `.dev.vars` + `.gitignore` entry — the harness needs the gate password — **Task 1-01-01 (ignore rule) / 1-04-01 (file)**
- [ ] `src/lib/protocol-pin.ts` + `src/lib/protocol-pin.spec.ts` — **Task 1-02-01**
- [ ] `src/lib/config-shape.spec.ts` — **Task 1-02-02**
- [ ] `src/lib/format-parity.spec.ts` — **Task 1-02-03**
- [ ] `src/lib/licence-notices.spec.ts` — **Task 1-03-03**
- [ ] `e2e/smoke.e2e.ts` + `e2e/artifacts.e2e.ts` — **Task 1-04-03**
- [ ] `scripts/gen-licenses.mjs` — **Task 1-03-02**; `scripts/postbuild.mjs` — **Task 1-03-03**; `scripts/deploy.mjs` — **Task 1-05-01**
- [ ] Delete `src/routes/demo/**` and `src/lib/vitest-examples/**` before they are prerendered — **Task 1-01-01**
- [ ] `.prettierignore` (`src/vendor/`, `.planning/`, `CLAUDE.md`) + `eslint.config.js` `languageOptions.globals` — `npm run lint` is in every sampling command and is otherwise red for tracked planning markdown and for the footer's `define` constants — **Task 1-01-03**

---

## Negative checks (a gate never observed failing is not a gate)

Each is run once during its task, reverted, and the observed result recorded in that plan's SUMMARY.

| Check | Task | Expected |
|---|---|---|
| Inject a caret into the grid-protocol version | 1-02-01 | `protocol-pin.spec.ts` goes red |
| Install a WTFPL package (`left-pad`) | 1-03-02 | `npm run licenses` exits non-zero, naming the package |
| Add a production dependency without regenerating notices (`nanoid`) | 1-03-03 | `licence-notices.spec.ts` staleness test goes red |
| Deploy with a dirty working tree | 1-05-01 | `npm run deploy` exits non-zero **before** building, naming the dirty path |
| Run `npm run format` and diff the planning tree | 1-01-03 | `git diff --stat -- .planning CLAUDE.md` is byte-identical before and after — the formatter rewrote no planning document and not the generated `CLAUDE.md`. Both outputs recorded in the SUMMARY |
| Mangle a copy of a BOTOR canary file into `.tmp-format-parity/` and run `prettier --check` on it | 1-02-03 | Non-zero **with** `--ignore-path .prettierignore`; **zero without it** — `.tmp-format-parity/` is gitignored and Prettier >= 3.0 defaults `--ignore-path` to `[.gitignore, .prettierignore]`, so without the flag the whole D-15 canary passes vacuously. Both exit codes recorded in the SUMMARY |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Deployed site loads over HTTPS behind Basic Auth | FOUND-04, criterion 1a | Requires a real deploy to the real Cloudflare account; `wrangler dev` proves the Worker logic, only a deploy proves the account, the subdomain and the secret | Task 1-05-03: `npm run deploy`, open `https://hangar.sabotond.workers.dev`, expect the `HANGAR preview` prompt, sign in, page renders |
| Source link downloads the archive for the deployed commit and it opens | FOUND-04, criterion 1b | Playwright proves the 200 and the byte length; "opens in the user's archive tool" is a human check | Task 1-05-03: click Source; the filename SHA matches the footer SHA and `git rev-parse HEAD`; the archive opens and contains no `.planning/` |
| `X-Robots-Tag: noindex` present on live responses | D-07 | Header inspection on the live host | `curl -I -u user:pass https://hangar.sabotond.workers.dev/` shows `x-robots-tag: noindex` |
| `npx wrangler secret put SITE_PASSWORD` succeeded | D-07 | Interactive prompt; the value must never reach a file or a log. It targets a Worker that does not exist until the first `wrangler deploy`, so it cannot be done in the earlier checkpoint | Task 1-05-03 step 2 (immediately after the first `npm run deploy`): `npx wrangler secret list` shows both secrets |
| The private GitHub repository exists and `master` is pushed | D-01, D-02 | No `gh` CLI on this machine; repository creation is a web-UI action | Task 1-05-02: `git ls-remote origin` lists `refs/heads/master`; the repo page shows the Private badge; `npx wrangler whoami` names the account |

---

## Validation Sign-Off

- [x] All tasks have an `<automated>` verify command or an explicit Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without an automated verify
- [x] Wave 0 covers all MISSING references (plan 01 creates the infrastructure; every later spec names its creating task)
- [x] No watch-mode flags (`test:unit` is invoked with `--run` everywhere in the sampling commands)
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** reconciled with the plan task list 2026-09-02; pending execution.
