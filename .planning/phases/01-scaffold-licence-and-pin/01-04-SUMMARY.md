---
phase: 01-scaffold-licence-and-pin
plan: 04
subsystem: infra
tags:
  [cloudflare-workers, wrangler, basic-auth, playwright, gplv3, adapter-static, web-serial]

# Dependency graph
requires:
  - phase: 01-01
    provides: "the scaffold, adapter-static emitting a real `build/`, the `__COMMIT_SHA__` / `__BUILD_DIRTY__` Vite defines with their `app.d.ts` types and ESLint globals, `wrangler@4.128.0` and `@playwright/test` on disk with Chromium already downloaded, and the `.dev.vars` / `!.dev.vars.example` gitignore rules"
  - phase: 01-02
    provides: "`src/lib/config-shape.spec.ts`, which guards the shape of `vite.config.ts` that this plan edits"
  - phase: 01-03
    provides: "`LICENSE`, `THIRD-PARTY.md`, `licenses/` and `scripts/postbuild.mjs` writing `build/source-<40-char-sha>.tar.gz` — the three targets the footer links at and the e2e suite asserts over HTTP"
provides:
  - "`worker/index.js` — the fail-closed Basic Auth gate (D-07), copied from the proven zona-docs shape, observed returning 401 with no secret configured even when correct credentials are presented"
  - "`wrangler.jsonc` — Workers static assets over `./build` with `run_worker_first: true` (no asset bypasses the gate) and `not_found_handling: \"404-page\"`"
  - "`.dev.vars.example` — the committed shape of the local credentials; the real `.dev.vars` is gitignored and was never printed into a tracked file"
  - "`npm run preview` === `npm run build && wrangler dev --port 4173 --ip 127.0.0.1` — one definition of how the static build is served, shared by the human and by Playwright"
  - "The GPLv3 section 6(d) footer in `src/routes/+layout.svelte`: /LICENSE, /THIRD-PARTY.md, a Source link at `/source-{__COMMIT_SHA__}.tar.gz`, and the full 40-character SHA in `<code data-testid=\"commit-sha\">`"
  - "`playwright.config.ts` pointed at `build/` through the real Worker, with the harness choice backed by a measured cold-start figure written into the file"
  - "`e2e/smoke.e2e.ts` and `e2e/artifacts.e2e.ts` — six passing tests covering the D-14 degrade path, the three licence/source URLs, a real 404, the unauthenticated gate, and the archive contents"
affects:
  - 01-05 (deploy: the gate, the secrets and the wrangler config are the thing being deployed; `wrangler deploy` is that plan's, not this one's)
  - 02-walking-skeleton (the e2e harness, the baseURL and the credentials plumbing are reused for every later browser test)
  - 04 (IDENT-01 owns the footer's visual design; only its structure is fixed here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "The artifact under test is the artifact that gets deployed: Playwright's webServer serves `build/` through `worker/index.js` with `wrangler dev`, never through `vite preview`"
    - "One definition of how the build is served — `npm run preview` — consumed by both the human and the test harness, so the two can never drift"
    - "The auth gate is a regression test, not a deployment detail: removing or weakening it turns the e2e suite red"
    - "A degrade test asserts its own precondition before asserting anything about the UI"
    - "Prerender link-crawl errors are suppressed per-path, never globally, so a genuinely broken link still fails the build"

key-files:
  created:
    - worker/index.js
    - wrangler.jsonc
    - .dev.vars.example
    - e2e/smoke.e2e.ts
    - e2e/artifacts.e2e.ts
  modified:
    - playwright.config.ts
    - src/routes/+layout.svelte
    - vite.config.ts
    - package.json

key-decisions:
  - "Harness is `wrangler dev`, on a measurement: 4.6 s (4551 ms) from process launch to first HTTP response. The ~20 s sirv-cli fallback threshold was not approached, so the gate assertions stay in the e2e suite rather than moving to plan 05's manual checklist."
  - "The unauthenticated gate assertion uses Node's `fetch`, because neither Playwright route sends a genuinely credential-free request: `test.use({ httpCredentials: undefined })` reads as \"not specified\" and falls back to defineConfig, and a context from the module-level `request` API picks the same credentials up under the runner. Both were observed returning 200 where 401 was expected."
  - "`vite.config.ts` gained `prerender.handleHttpError` scoped to exactly the three paths `scripts/postbuild.mjs` writes after `vite build`; everything else still rethrows, so a real broken link keeps failing the build."
  - "`rel=\"external\"` on the three footer links is semantic, not a lint workaround: none of the targets is a SvelteKit route, so the client router must not handle them."

patterns-established:
  - "Pattern 1: fail-closed by construction — the gate is one early return driven by the presence of the secret, so removing it on launch day means deleting the secret and the `run_worker_first` flag, not rewriting the Worker"
  - "Pattern 2: build metadata that the page displays is also the thing the test reads — the smoke test derives the archive URL from the rendered SHA, so link and artifact can never drift"
  - "Pattern 3: every negative property in this plan was observed, not assumed (fail-closed with no secret, wrong password, wrong username, unknown path, unauthenticated request)"

requirements-completed: [FOUND-04]

# Metrics
duration: 45 min
completed: 2026-09-02
---

# Phase 01 Plan 04: The Preview Gate, the Footer and a Harness That Tests the Real Artifact Summary

**A fail-closed Basic Auth Worker in front of `./build` with `run_worker_first: true`, a GPLv3 section 6(d)
footer carrying the full 40-character commit SHA beside a Source link that resolves to the archive for
exactly that commit, and Playwright rewired off sv's `vite preview` onto `wrangler dev` — measured cold
start 4.6 s — so all six tests run against the bytes that actually get deployed.**

## Performance

- **Duration:** 45 min
- **Started:** 2026-09-02T15:00:00Z
- **Completed:** 2026-09-02T15:43:00Z
- **Tasks:** 3 of 3 (Task 3 executed RED then GREEN)
- **Files modified:** 9 (5 created, 4 modified) across four commits

## Accomplishments

- The gate is real and was watched behaving. Six status codes observed against a running `wrangler dev`,
  including the one that matters most: with the secret removed entirely, correct credentials still get 401.
- `run_worker_first: true` means there is no asset path around the gate — `/LICENSE`, `/THIRD-PARTY.md` and
  the 94 KB source archive are all behind it, and all three answer 200 once authenticated.
- Every page now carries the section 6(d) "clear directions": the full SHA `cd2670f...` is rendered in the
  page and the Source link points at `source-cd2670f8f9dab844c57015538c808148cb2bea85.tar.gz`, which exists
  in `build/`. The build asserts there is no unsubstituted `__COMMIT_SHA__` token left in the HTML.
- Playwright no longer tests an artifact that is not the deployed one. sv's generated harness ran
  `npm run build && npm run preview`, and Kit's preview server boots the Node server from
  `.svelte-kit/output/server` — confirmed again on this tree at
  `node_modules/@sveltejs/kit/src/exports/vite/preview/index.js:32`, `join(svelte_config.kit.outDir, 'output/server')`.
  It never reads `build/`.
- Whole suite green on a clean tree at `cd2670f`: `npm run build`, `npm run test:unit -- --run`
  (4 files, 18 passing, 1 todo), `npm run test:e2e` (6 passing, 9.0 s), `npm run lint`, `npm run check`.

## The measured `wrangler dev` cold start, and the harness decision it produced

| Measurement                                                     | Value                              |
| --------------------------------------------------------------- | ---------------------------------- |
| `wrangler dev --port 4173 --ip 127.0.0.1`, launch to first HTTP response | **4551 ms (4.6 s)**        |
| Status of that first response                                    | 401 (the gate, answering correctly) |
| Threshold in the plan for falling back to `sirv-cli`             | ~20 s                              |
| **Decision**                                                     | **`wrangler dev`**                 |

**So the sirv-cli fallback was not taken**, the `the preview gate (D-07)` describe block stays in
`e2e/smoke.e2e.ts`, and no assertion was moved out to plan 05's manual deploy checklist. The number and the
decision are both written into the comment block at the top of `playwright.config.ts`.

Two notes on what that figure does and does not include:

- It is process-launch to first response for `wrangler dev` alone. It excludes `npm run build`, which
  `npm run preview` runs first; a full `npm run test:e2e` from cold — build plus server plus six tests — was
  observed at 9.0 s once and 10.4 s once, and at 55.1 s on the very first run of the day when Vite had no
  warm cache.
- `workerd` is not downloaded on demand here. It arrives as the `@cloudflare/workerd-windows-64` npm package
  with `wrangler@4.128.0`, installed in plan 01, so the plan's "first run downloads workerd" caveat does not
  apply on this machine and the 4.6 s is representative of every run.

## The gate, observed

All against `wrangler dev` serving `./build` through `worker/index.js`. The local password is not reproduced
anywhere in this document.

| Request                                                        | Status  |
| --------------------------------------------------------------- | ------- |
| No credentials                                                  | **401** |
| Wrong password (`hangar` + a wrong string)                      | **401** |
| Wrong username, correct password                                | **401** |
| Correct credentials                                             | **200** |
| Correct credentials, with `SITE_PASSWORD` removed from the environment entirely | **401** |
| `/this-path-does-not-exist`, authenticated                      | **404** |
| `/LICENSE`, `/THIRD-PARTY.md`, `/source-<sha>.tar.gz`, authenticated | **200** each |

Headers on the 401:

```
HTTP/1.1 401 Unauthorized
Content-Type: text/plain; charset=utf-8
Cache-Control: no-store
WWW-Authenticate: Basic realm="HANGAR preview", charset="UTF-8"
X-Robots-Tag: noindex, nofollow, noarchive
```

Headers on an authenticated asset:

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: private, no-store
Referrer-Policy: no-referrer
X-Robots-Tag: noindex, nofollow, noarchive
```

The fifth row is the load-bearing one. `.dev.vars` was moved outside the repo, `wrangler dev` restarted with
no `SITE_PASSWORD` bound at all, and the correct credentials still got 401 — `if (!expectedPass) return
unauthorized();` doing exactly its job. A mis-deploy that forgets `npx wrangler secret put SITE_PASSWORD`
serves nothing rather than serving everything. `.dev.vars` was restored immediately afterwards and
`git status --porcelain` confirmed clean.

## D-14 says "exactly one smoke test". This plan writes six.

**The expansion is deliberate and the D-14 test itself is untouched.** D-14 locks a single Playwright smoke
test: an init script removes `navigator.serial` and the page must still render. That test exists here,
written exactly as locked, as `the page renders with the capability removed` — with the one correction the
plan mandated: `serial` is an accessor on `Navigator.prototype`, so `delete navigator.serial` on the instance
returns `true` and removes nothing. The test deletes it from the prototype and then asserts
`"serial" in navigator === false` **before** asserting anything about the UI, because a degrade test that
does not verify its own precondition passes for the wrong reason.

The other five exist because five phase-01 success criteria have no other automated home, and folding them
into the one degrade test would have made a single red result ambiguous across five unrelated obligations:

| Test                                                             | File               | Obligation with no other automated home |
| ----------------------------------------------------------------- | ------------------ | --------------------------------------- |
| `the page renders with the capability removed`                    | `smoke.e2e.ts`     | **This is D-14, verbatim.**             |
| `licence, notices and source archive are served from the site root` | `smoke.e2e.ts`   | criteria 1b / 1c — GPLv3 §6(d) is only discharged if the three URLs actually resolve over HTTP |
| `an unknown path returns a real 404`                              | `smoke.e2e.ts`     | criterion 2a — `not_found_handling: "404-page"` paired with adapter-static's `fallback: "404.html"` |
| `refuses a request with no credentials and asks robots to stay away` | `smoke.e2e.ts`   | criterion 2b — D-07, the preview gate as a regression test rather than a deploy detail |
| `the static build is complete`                                    | `artifacts.e2e.ts` | criterion 4c — `build/` really carries index, 404, LICENSE, notices, `licenses/` and the archive |
| `the source archive is the Corresponding Source and nothing else` | `artifacts.e2e.ts` | criterion 4c — the lockfile ships, `.planning/` and `CLAUDE.md` do not |

Nothing in the D-14 smoke test was changed, weakened or merged into anything else.

## The freshly built archive, as asserted

Measured at `cd2670f`, produced by `scripts/postbuild.mjs` during the e2e `webServer` build:

| Measurement                       | Value                                                            |
| ---------------------------------- | ---------------------------------------------------------------- |
| Archive                            | `build/source-cd2670f8f9dab844c57015538c808148cb2bea85.tar.gz`   |
| Size                               | 100,164 bytes (98 KB)                                            |
| Entries                            | 57                                                               |
| `package-lock.json`                | 1                                                                |
| `.planning/`                       | **0**                                                            |
| `CLAUDE.md`                        | **0**                                                            |
| `node_modules/`                    | **0**                                                            |
| `worker/index.js`, `wrangler.jsonc`, `e2e/` | present (this plan's own source is Corresponding Source) |

## Task Commits

1. **Task 1-04-01: The fail-closed Basic Auth Worker and the wrangler static-assets config** — `bb4df1f` (feat)
2. **Task 1-04-02: The persistent footer — GPLv3 section 6(d) clear directions** — `65442b7` (feat)
3. **Task 1-04-03: Point Playwright at the real static build** — `2410b8c` (test, RED) then `cd2670f` (feat, GREEN)

## Files Created/Modified

- `worker/index.js` — the gate. `safeEqual`, both header sets and the fail-closed branch copied verbatim
  from `zona-docs/src/index.js`; only the realm (`HANGAR preview`), the default username
  (`env.SITE_USER || "hangar"`) and the D-04 header comment differ. No Claude attribution anywhere.
- `wrangler.jsonc` — exactly the file the plan specified. `assets.directory` `./build`, binding `ASSETS`,
  `run_worker_first: true`, `not_found_handling: "404-page"`, `observability.enabled`.
- `.dev.vars.example` — two placeholder lines. The real `.dev.vars` holds a 16-character base64url password
  generated with `crypto.randomBytes(12)`, is confirmed ignored by `git check-ignore -q`, and never appears
  in `git status --porcelain`.
- `src/routes/+layout.svelte` — the footer, plus a comment explaining why `__BUILD_DIRTY__` is a separate
  constant and why the three links carry `rel="external"`. Minimal Tailwind utilities only; Phase 4 owns the
  design system. Nothing about the protocol pin or the firmware range appears (D-12).
- `playwright.config.ts` — replaced entirely. `testDir: "e2e"`, `testMatch: "**/*.e2e.ts"`, `baseURL` and
  `httpCredentials` parsed out of `.dev.vars`, `webServer.url` instead of the deprecated `port`,
  `command: "npm run preview"`, `timeout: 180_000`. The comment block carries the measurement and the
  decision, and deliberately still names `vite preview` to record why it is the wrong harness.
- `e2e/smoke.e2e.ts` — four tests in two describe blocks.
- `e2e/artifacts.e2e.ts` — the two build/archive tests, here rather than in Vitest because this suite's
  `webServer` always produces a fresh build first.
- `vite.config.ts` — `prerender.handleHttpError` (see deviation 1).
- `package.json` — `preview` rewired. `test:e2e` was already `playwright test`; `playwright install` was
  not added back in front of it.

## Decisions Made

- **`wrangler dev`, on the measurement.** 4.6 s is nowhere near the ~20 s fallback line, so the harness
  serves exactly what production serves and the auth gate earns its regression test. Recorded in the config
  file itself so the next person does not have to re-derive it.
- **The unauthenticated request is a Node `fetch`.** Explained under deviation 2. The alternative —
  asserting that *empty* credentials are rejected — would have proved a different and weaker property than
  "a request with no `Authorization` header at all".
- **`prerender.handleHttpError` is scoped to three paths, not switched off.** Suppressing all HTTP errors, or
  setting `handleHttpError: "warn"`, would have silently accepted a genuinely broken internal link. The three
  suppressed paths are precisely the ones `scripts/postbuild.mjs` writes after `vite build` has finished, and
  the e2e suite asserts all three really are served from the finished `build/`.
- **`rel="external"` rather than an ESLint disable comment.** `svelte/no-navigation-without-resolve` fired on
  the three footer links. None of them is a SvelteKit route — they are files postbuild drops into `build/` —
  so telling the client router to stay out of them is the correct annotation, and the rule then passes on its
  own terms without being weakened.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The prerenderer crawls the new footer links and 404s on all three**

- **Found during:** Task 1-04-02
- **Issue:** `npm run build` exited 1 with `Error: 404 /LICENSE (linked from /)`, and the same for
  `/THIRD-PARTY.md` and `/source-<sha>.tar.gz`. SvelteKit's prerenderer crawls `<a href>` in the emitted HTML
  and fails the build on a 404. All three files are written into `build/` by `scripts/postbuild.mjs`, which
  runs *after* `vite build`, so the prerenderer cannot possibly see them. The plan required
  `npm run build` to exit 0 with these exact links present, so this blocked the task outright.
- **Fix:** Added `prerender.handleHttpError` to `vite.config.ts`, scoped to exactly `"/LICENSE"`,
  `"/THIRD-PARTY.md"` and any path starting `"/source-"` and ending `".tar.gz"`, and only for status 404.
  Everything else rethrows.
- **Files modified:** `vite.config.ts`
- **Verification:** `npm run build` exits 0; `src/lib/config-shape.spec.ts` (the plan-02 guard over this same
  file) still passes; the e2e suite proves all three URLs really do return 200 from the finished build.
- **Committed in:** `65442b7`

**2. [Rule 1 - Bug] The plan's gate test sent credentials and got 200 where it asserted 401**

- **Found during:** Task 1-04-03 (GREEN)
- **Issue:** The plan specifies `test.use({ httpCredentials: undefined })` on the D-07 describe block. An
  explicit `undefined` in `test.use` reads as "not specified", so Playwright falls back to the value in
  `defineConfig` and the request still carries the credentials. Observed: 200, with
  `cache-control: private, no-store` and `referrer-policy: no-referrer` in the response — headers the Worker
  only sets on the *authenticated* asset path, which is how the diagnosis was confirmed rather than guessed.
  A second attempt, building a context from the module-level `request` API, returned 200 as well; the runner
  applies the same options to it. Both attempts were observed failing.
- **Fix:** The test now uses Node's global `fetch` against `baseURL`, which inherits nothing and therefore
  genuinely sends no `Authorization` header. The assertions are unchanged in substance (401,
  `WWW-Authenticate: Basic`, `X-Robots-Tag: noindex`) and the reasoning is recorded in a comment in the test
  file so nobody "simplifies" it back.
- **Files modified:** `e2e/smoke.e2e.ts`
- **Verification:** 6 of 6 passing; the same request via `curl` with no credentials independently returns 401.
- **Committed in:** `cd2670f`

**3. [Rule 3 - Blocking] `svelte/no-navigation-without-resolve` failed `npm run lint` on the footer**

- **Found during:** Task 1-04-02
- **Issue:** `npm run lint` exited 1 with three `Unexpected href link without resolve()` errors, one per
  footer link. `npm run lint && npm run check` exiting 0 is an acceptance criterion of that task.
- **Fix:** Added `rel="external"` to the three anchors, which the rule exempts by design. This is the
  semantically correct annotation — none of the three is a SvelteKit route — not a suppression: the rule
  stays fully enabled and no `eslint-disable` comment was added.
- **Files modified:** `src/routes/+layout.svelte`
- **Verification:** `npm run lint` exits 0; the acceptance greps for `href="/LICENSE"`,
  `href="/THIRD-PARTY.md"` and `href="/source-{__COMMIT_SHA__}.tar.gz"` all still pass.
- **Committed in:** `65442b7`

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** No acceptance criterion was weakened, dropped or rewritten, and nothing was added to
scope. Deviations 1 and 3 are consequences of the footer the plan asked for meeting tooling the plan did not
model; deviation 2 is a real bug in the plan's test code that would have shipped a gate test which passes
whether or not the gate exists — the single most valuable thing this plan's verification caught.

## Issues Encountered

- **Stray `wrangler dev` processes hold port 4173 after a partial kill.** The process tree is
  `npx-cli → wrangler.js → wrangler-dist/cli.js → workerd.exe`, and `cli.js` restarts `workerd` when it dies.
  Killing only `workerd.exe` therefore leaves a listener on 4173 that accepts connections and never answers,
  which makes every subsequent `curl` hang until its `--max-time`. Three such zombies accumulated during the
  Task 1 smoke work before the pattern was recognised. The whole tree must be killed
  (`taskkill /F /T` on the top PID). Worth knowing for plan 05 and for anyone debugging the harness — a
  hanging e2e run is far more likely to be a leftover server than a broken test. Playwright's own
  `reuseExistingServer` would happily attach to such a zombie.
- **Prettier adds trailing commas to `wrangler.jsonc`.** `"not_found_handling": "404-page",` and
  `"observability": { "enabled": true },` both end with a comma after `npm run format`. This is valid JSONC
  and `wrangler dev` parses it without complaint, so it was left alone rather than fighting the formatter.
- **The first cold-start measurement was wrong and was thrown away.** The readiness loop used
  `curl ... || echo 000`, and since curl both prints `000` and exits non-zero on a connection failure, the
  captured value was `000000` — which is not `000`, so the loop broke out on the very first attempt and
  "measured" 2.8 s of nothing. The loop was rewritten to test curl's output alone, and the 4.6 s figure comes
  from that corrected run.
- **`DEP0190`** continues to appear from plan 02's and plan 03's `execFileSync(..., { shell: true })` calls.
  Cosmetic, unchanged, and untouched by this plan.

## Known Stubs

None. Every artefact this plan claims is committed and asserted by a test that was watched failing first.

Two deliberate forward references, both named in the plan:

- The footer carries no design system — minimal Tailwind utilities only. IDENT-01 in Phase 4 owns that.
- `run_worker_first` is `true` (all routes). Its array form (`["/og/*"]`) is the launch-day path, where the
  gate is removed but the Worker survives to render OG images. That is D-03 territory and not this plan's.

## User Setup Required

None for this plan. One thing to be aware of before plan 05: the gate is fail-closed, so the deploy is
useless until `npx wrangler secret put SITE_PASSWORD` (and optionally `SITE_USER`) has been run against the
deployed Worker. Locally the same two values live in `.dev.vars`, whose shape is documented in the committed
`.dev.vars.example`.

## Next Phase Readiness

- FOUND-04 is now observable behaviour rather than files on disk: the licence, the notices and the source
  archive for the exact deployed commit are all reachable over HTTP from the artifact that gets deployed, and
  a test proves it on every run.
- Plan 01-05 has everything it needs: the Worker, the config, and a green suite. `wrangler deploy` was
  deliberately **not** run — deploying is that plan's step and the user's action. `wrangler dev` was the only
  wrangler command used here.
- Plan 01-05's deploy gate can additionally lean on this plan's harness: `npm run test:e2e` exercises the
  gate, the 404 behaviour and the archive contents in one command against a fresh build.
- Open item carried forward unchanged: the embargo date (D-03) is still TBD and must be asked before any
  un-gated deploy. Until then `run_worker_first` stays `true` and the secret stays set.

---

_Phase: 01-scaffold-licence-and-pin_
_Completed: 2026-09-02_

## Self-Check: PASSED

All ten claimed files exist on disk, all four task commits (`bb4df1f`, `65442b7`, `2410b8c`, `cd2670f`) are
present in `git log`, `git diff --stat -- .planning CLAUDE.md` is empty after `npm run format`, and a grep
for the local `.dev.vars` password across this SUMMARY returns 0 matches.
