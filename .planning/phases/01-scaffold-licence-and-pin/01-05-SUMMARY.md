---
phase: 01-scaffold-licence-and-pin
plan: 05
subsystem: infra
tags: [cloudflare-workers, wrangler, deploy, basic-auth, gplv3, github, release-gate]

# Dependency graph
requires:
  - phase: 01-01
    provides: "the scaffold, `wrangler@4.128.0` on disk, and the `__COMMIT_SHA__` build define that the footer and the archive filename both derive from"
  - phase: 01-03
    provides: "`scripts/postbuild.mjs` writing `build/LICENSE`, `build/THIRD-PARTY.md`, `build/licenses/` and `build/source-<40-char-sha>.tar.gz` — the six artefacts the deploy script asserts before it uploads anything"
  - phase: 01-04
    provides: "`worker/index.js` (the fail-closed Basic Auth gate), `wrangler.jsonc` with `run_worker_first: true`, the section 6(d) footer, and the e2e suite proving all of it against the real static build"
provides:
  - "`scripts/deploy.mjs` — the one-command manual deploy (D-08): six gates in a fixed order, nine `process.exit(1)` hard failures, no bypass flag"
  - "`npm run deploy` wired to that script"
  - "`docs/DEPLOY.md` — the deploy procedure, the secret ordering constraint, the never-committed rule, the TBD embargo (D-03) and the exact launch-day gate-removal path"
  - "The D-02 amendment landed in `.planning/REQUIREMENTS.md` and `.planning/PROJECT.md`, with `CLAUDE.md` regenerated (not hand-edited) from the amended PROJECT.md"
  - "The private remote at github.com/sabotond-dev/hangar with `master` pushed"
  - "A live gated preview at https://hangar.sabotond.workers.dev serving commit 503964d, with both Worker secrets set"
affects:
  - 02-walking-skeleton (every later phase ships through this same command; the clean-tree gate is now the definition of shippable)
  - "launch day / D-03 (the gate-removal path is written down in docs/DEPLOY.md and must not be walked before the embargo date exists)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "The deploy is a Node script, not an npm shell chain — `execSync` with `{ stdio: 'inherit' }` behaves identically under PowerShell, cmd and Git Bash, and a refusal is a real `process.exit(1)` rather than a shell truthiness accident"
    - "Every gate refuses rather than warns, and there is deliberately no bypass flag: the property being protected (GPLv3 section 6(d) correspondence between the served bundle and the served archive) has no situation in which shipping out of step is correct"
    - "The clean-tree gate runs before the build, so a refusal costs seconds rather than a full Vite run"
    - "Fail-closed ordering as a safety property: the Worker is created by the first deploy and returns 401 to everything until `SITE_PASSWORD` exists, so deploy-then-set-secrets is never a window of public exposure"

key-files:
  created:
    - scripts/deploy.mjs
    - docs/DEPLOY.md
  modified:
    - package.json
    - .planning/REQUIREMENTS.md
    - .planning/PROJECT.md
    - CLAUDE.md

key-decisions:
  - "The dirty-tree refusal is a hard exit before the build, not a warning — `git archive` ships HEAD while Vite bundles the working tree, so a dirty deploy serves an archive that is not the source of the bundle beside it"
  - "No bypass flag on the deploy script, by design"
  - "The two Worker secrets are set AFTER the first deploy, because `wrangler secret put` targets a Worker that does not exist until something has been deployed; the fail-closed gate makes that ordering safe"
  - "`CLAUDE.md` was regenerated with `gsd-tools generate-claude-md` rather than hand-edited, because its `GSD:project` block is rendered from `PROJECT.md` and would otherwise carry the stale 'public source' wording forever"
  - "The `public source` assertion on `CLAUDE.md` is scoped to the `GSD:project` block with `sed`, because the `GSD:stack` block legitimately discusses a public-source constraint in its GitHub Pages row and a whole-file grep would be unsatisfiable"

patterns-established:
  - "Pattern 1: one command, many refusals — `npm run deploy` cannot ship a non-compliant artefact, so compliance is not a checklist anybody has to remember"
  - "Pattern 2: the negative was observed, not assumed — the clean-tree gate was watched refusing a deliberately dirtied tree before it built anything"
  - "Pattern 3: orchestrator-observed and user-verified evidence are recorded separately and labelled, so a later reader can tell which claims have machine evidence behind them"

requirements-completed: [FOUND-04]

# Metrics
duration: 20 min
completed: 2026-09-02
---

# Phase 01 Plan 05: Deploy and the Live Gated Preview Summary

**`npm run deploy` is one Node script with six refusing gates — clean tree, build, six compliance artefacts,
archive contents, then `wrangler deploy` — and the first run of it put commit `503964d` live at
https://hangar.sabotond.workers.dev behind a fail-closed Basic Auth gate that answers 401 to every
credential-free request, licence files and source archive included.**

## Performance

- **Duration:** ~20 min across two blocking human checkpoints (plan opened ~15:47Z, deploy at 16:02Z, live
  verification at 16:06Z)
- **Started:** 2026-09-02T15:47:00Z
- **Completed:** 2026-09-02T16:07:00Z
- **Tasks:** 3 of 3 (1 auto, 2 blocking human checkpoints)
- **Files modified:** 6 (2 created, 4 modified) in one task commit

## Accomplishments

- **The deploy is one command that cannot ship a non-compliant artefact.** `scripts/deploy.mjs` is 195 lines
  and 9 `process.exit(1)` calls: the SHA resolves, the tree is clean, the build succeeds, six artefacts exist,
  the archive carries `package-lock.json` and no `.planning/` — and only then `npx wrangler deploy`.
- **The clean-tree gate was watched biting.** Not inferred from reading the code: a deliberately dirtied tree
  was refused, by name, before anything was built (see the negative check below).
- **The site is live and gated.** `https://hangar.sabotond.workers.dev` returns **401** to a credential-free
  request, with `WWW-Authenticate: Basic realm="HANGAR preview"` and
  `X-Robots-Tag: noindex, nofollow, noarchive`. Re-confirmed at 2026-09-02T16:06:40Z, *after* the secrets were
  set — so this is the gate working, not the pre-secret fail-closed state.
- **The repository is private and pushed.** `git ls-remote origin refs/heads/master` is
  `503964d70d3156e6105103e89ce6f5f3b81429dc` — identical to local `HEAD`, which is also the deployed commit.
- **The D-02 contradiction is gone from the planning documents.** `REQUIREMENTS.md` and `PROJECT.md` no longer
  say "public source"; they say the corresponding source is served as a per-deploy archive and the repository
  stays private. `CLAUDE.md` was regenerated from the amended `PROJECT.md` rather than hand-edited.

## The live preview, as observed

Two classes of evidence, and the distinction matters. Everything credential-free was run by this session
against the live Worker. Everything requiring the Basic Auth password was run by the user — **the password is
not known to this session and appears nowhere in this repository.**

### Orchestrator-observed (machine evidence, this session)

Re-run fresh at **2026-09-02T16:06:40Z** on a clean tree at `503964d`:

| Check                                                                        | Result  |
| ---------------------------------------------------------------------------- | ------- |
| `curl -s -o /dev/null -w '%{http_code}' https://hangar.sabotond.workers.dev/` | **401** |
| Same, `/LICENSE`, no credentials                                             | **401** |
| Same, `/source-503964d70d3156e6105103e89ce6f5f3b81429dc.tar.gz`, no credentials | **401** |
| `WWW-Authenticate` header on the 401                                         | `Basic realm="HANGAR preview", charset="UTF-8"` |
| `X-Robots-Tag` header on the 401                                             | `noindex, nofollow, noarchive` |
| `Cache-Control` on the 401                                                   | `no-store` |
| Transport                                                                    | HTTPS, `Server: cloudflare`, `CF-RAY: a34dc367bf0f0d50-VIE` |
| `npx wrangler secret list`                                                   | `SITE_PASSWORD` and `SITE_USER`, both `secret_text` |
| `npx wrangler whoami`                                                        | OAuth token for sabotond@gmail.com, account `0abbfbf4ae2161ca314a757e6287e6e9`, scopes account(read) user(read) workers(write) |
| `git ls-remote origin refs/heads/master`                                     | `503964d70d3156e6105103e89ce6f5f3b81429dc` = local `HEAD` |
| `git status --porcelain`                                                     | empty |
| `git grep -i "SITE_PASSWORD=" -- . ':!.dev.vars.example'`                    | four matches, all inside plan documents, **none a real value** |
| `git check-ignore -v .dev.vars`                                              | `.gitignore:9` — the real credentials file is ignored |

The second and third rows are worth stating plainly: `run_worker_first: true` means the licence files and the
source archive are behind the gate too. There is no asset path around it.

`npx wrangler deployments list` (read-only), showing the upload and the two secrets landing after it:

| Created (UTC)            | Source        | Version                                |
| ------------------------ | ------------- | -------------------------------------- |
| 2026-09-02T16:02:58.297Z | Upload        | `b5a9994d-f872-4966-91a7-8de7ed3c0a3c` |
| 2026-09-02T16:03:27.174Z | Secret Change | `cca23f2b-8bcf-4e29-86d6-0a898aaf2ae9` |
| 2026-09-02T16:03:40.151Z | Secret Change | `0e32fa0d-cdeb-4ad1-ae8d-5e9ba0edc2e7` |

That ordering is the plan's design, not an accident. The upload creates the Worker, and the 29 seconds before
the first secret landed were a window in which the Worker returned 401 to **everything**, because
`SITE_PASSWORD` did not exist. The site was never publicly readable at any point.

**Deployed commit = `503964d70d3156e6105103e89ce6f5f3b81429dc`**, equal to local `HEAD` and to the pushed
remote ref. This holds by construction of gate 2: the deploy could not have run against anything else, because
a dirty tree would have been refused before the build.

### User-verified (accepted on the user's report, not machine-observed here)

Everything below needs the Basic Auth credentials, which this session does not hold. The user ran
`npm run deploy`, set both secrets, walked the `docs/DEPLOY.md` checklist and reported "approved":

- The browser showed a sign-in prompt for the realm **HANGAR preview** before any content.
- After signing in, the page renders over HTTPS with the `HANGAR` heading and the footer.
- The footer's 40-character SHA equals the SHA `npm run deploy` printed and `git rev-parse HEAD`.
- The footer `Source` link downloads `source-<that same sha>.tar.gz`, and the archive opens.
- The archive contains `package-lock.json`, `package.json`, `vite.config.ts` and `LICENSE`, and **no
  `.planning/` folder and no `CLAUDE.md`**.
- `/LICENSE` serves the GNU GPL v3 text; `/THIRD-PARTY.md` lists `@intechstudio/grid-protocol` as GPL-3.0 and
  `@wasm-fmt/lua_fmt` as MIT.
- A credentialed request returns 200 and carries `x-robots-tag: noindex, nofollow, noarchive`.

The archive-contents claim additionally has independent machine evidence from plan 01-04, where
`e2e/artifacts.e2e.ts` asserted the same properties over HTTP against a fresh build (`package-lock.json`: 1,
`.planning/`: 0, `CLAUDE.md`: 0, `node_modules/`: 0) — and that test runs on every `npm run test:e2e`.

## The negative check: the clean-tree gate, observed refusing

Run once, deliberately, during Task 1-05-01:

```bash
echo "" >> README.md
npm run deploy        # exited 1
git checkout README.md
```

The script exited **non-zero at step 2 of 6**, before invoking `npm run build`, and its output named the
offending path (`M README.md`). This is the gate the whole plan exists for: `git archive` ships HEAD while Vite
bundles the working tree, so a dirty deploy would serve a source archive that is not the source of the bundle
sitting next to it — exactly the correspondence GPLv3 section 6(d) requires. `README.md` was restored
immediately and `git status --porcelain` confirmed clean.

## Task Commits

1. **Task 1-05-01: The one-command deploy with a clean-tree gate, and the deploy documentation** — `eb9e24e`
   (feat). Also carries the D-02 amendment to `REQUIREMENTS.md` and `PROJECT.md`, the regenerated `CLAUDE.md`,
   and the `git remote add origin`.
2. **Task 1-05-02: Create the private repository, push, confirm the Cloudflare account** — human action, no
   files. The checkpoint pause was recorded in `503964d`.
3. **Task 1-05-03: Run the first deploy and verify the live gated preview** — human action and verification,
   no files. The deploy uploaded `503964d` unchanged.

`CLAUDE.md` was regenerated with:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" generate-claude-md
```

and committed in the same commit as the two document edits, so the tree was clean when Task 1-05-03's deploy
gate ran. It was never hand-edited.

## Files Created/Modified

- `scripts/deploy.mjs` — the deploy. Six gates, nine hard exits, `Copyright (C) 2026 Botond Sandor` in the
  header, no Claude attribution anywhere. Prints the deployed SHA, the URL and the archive path on success.
- `docs/DEPLOY.md` — 128 lines. One-time setup with the post-deploy secret ordering spelled out and the reason
  it is safe; the gate table with a "why it refuses" column; what gets deployed; the preview gate and the
  launch-day removal path; the manual verification checklist; custom domain deferred.
- `package.json` — `"deploy": "node scripts/deploy.mjs"`.
- `.planning/REQUIREMENTS.md` — FOUND-04 now reads "serves a source archive of the deployed commit (GPLv3
  section 6(d) — the repository itself stays private, per D-02)".
- `.planning/PROJECT.md` — the Licensing constraint and the decisions-table cell both amended; the phrase
  "public source" no longer occurs in the file.
- `CLAUDE.md` — regenerated; its `GSD:project` block now carries "per-deploy archive".

## Decisions Made

- **The deploy refuses; it never warns, and there is no bypass.** Every gate corresponds to a failure that is
  otherwise silent — a dirty tree produces a mismatched archive, a missing artefact produces a 404 on a link
  the footer promises, a `.planning/` entry in the archive leaks internal material into what is nominally
  Corresponding Source. None of those announce themselves at deploy time.
- **Secrets after the first deploy, not before.** Not a compromise: `wrangler secret put` targets a Worker that
  does not exist until an upload creates one, so demanding them first would have made the checkpoint's own
  acceptance criterion (`wrangler secret list` naming both) unsatisfiable. The fail-closed gate turns the gap
  into a safe state rather than a risk — 29 seconds during which everything got 401.
- **`CLAUDE.md` is regenerated, never hand-edited.** It is tracked and generated. Hand-editing it would have
  produced a change that silently reverts the next time anybody regenerates it, re-introducing the exact
  "public source" claim D-02 contradicts.
- **The `CLAUDE.md` assertion is block-scoped.** `sed -n '/GSD:project-start/,/GSD:project-end/p'` piped
  through `tr -s '[:space:]' ' '` before grepping: the `tr` flattens the block so a line wrap between
  "per-deploy" and "archive" cannot produce a false negative, and the block scope keeps the `GSD:stack` block's
  legitimate GitHub Pages "public source" row out of scope.

## Deviations from Plan

### Auto-fixed Issues

None. The single auto task executed as written.

### Issues during the human checkpoints

**1. [Checkpoint 1-05-02] The repository was first created under the wrong GitHub account**

- **Found during:** Task 1-05-02, at the push step
- **Issue:** `git push -u origin master` failed with `Repository not found`. The remote is
  `https://github.com/sabotond-dev/hangar.git` (D-01), but the repository had been created under a different
  account, so the URL resolved to nothing the stored credential could see. GitHub returns "not found" rather
  than "forbidden" for a private repository the caller cannot read, which makes a wrong-account mistake look
  identical to a missing repository — worth recording, because the obvious first diagnosis (the repository was
  never created) was wrong here.
- **Resolution:** The user recreated it as **private** under `sabotond-dev`. `git push -u origin master` then
  succeeded (`master -> master`), and `git ls-remote origin refs/heads/master` returned
  `503964d70d3156e6105103e89ce6f5f3b81429dc`.
- **Files modified:** none — the local remote URL was correct throughout and was not touched.

---

**Total deviations:** 0 auto-fixed. One human-checkpoint detour, resolved by the user, with no code impact.
**Impact on plan:** No acceptance criterion was weakened, dropped or rewritten. The Basic Auth gate is
untouched and still in place at the end of the phase, which was itself a success criterion.

## Issues Encountered

- **The wrong-account push failure**, above. The lesson is in the error message: `Repository not found` from
  GitHub over HTTPS means "not found *for this credential*", which covers both "does not exist" and "exists but
  you are not the owner".
- **`npm install` / `npm uninstall` rewrites `package-lock.json` indentation on this machine** (tabs become two
  spaces) even when the dependency set is unchanged. Carried forward from plan 01-03, and it now has teeth: the
  deploy's gate 2 refuses a dirty tree, so a stray lockfile reformat blocks a deploy for no real reason. The
  fix is `git checkout -- package-lock.json` after any install/uninstall round trip, before deploying.
- **Nothing in this plan removed or weakened the gate**, and nothing in it performed an un-gated deploy.

## Standing notes carried forward

Three things a future session must not rediscover the hard way:

1. **The embargo date (D-03) is still TBD.** A public, un-gated deploy is embargoed until a calendar date the
   user sets, and that date does not exist yet. **The Basic Auth gate must never be removed without it.**
   `docs/DEPLOY.md` "The preview gate" documents the removal path — delete the `SITE_PASSWORD` secret, then
   drop or narrow `run_worker_first` in `wrangler.jsonc` — precisely so that nobody has to reverse-engineer it
   under time pressure on launch day. It is written down to be *read*, not to be *executed early*. **Ask
   first.**
2. **The Worker secrets live only in Cloudflare and in the gitignored `.dev.vars`.** `SITE_USER` and
   `SITE_PASSWORD` are Cloudflare Worker secrets; the local `wrangler dev` and Playwright copies live in
   `.dev.vars`, which `.gitignore:9` ignores. `.dev.vars.example` holds placeholders and documents the shape.
   The password is not known to this session, is not in any tracked file, and must never be written into a
   file, a commit message or a planning document.
3. **`npm install` / `npm uninstall` rewrites the lockfile's indentation and will trip the deploy's clean-tree
   gate** until `git checkout -- package-lock.json`.

## User Setup Required

Complete. The user created the private repository at `github.com/sabotond-dev/hangar`, pushed `master`, ran the
first `npm run deploy`, and set both Worker secrets. `npx wrangler secret list` confirms `SITE_USER` and
`SITE_PASSWORD` are present.

Nothing further is required for Phase 1. The one open item is a decision, not a setup step: the D-03 embargo
date.

## Next Phase Readiness

- **All four Phase 1 success criteria are satisfied**, criterion 1 in its D-02-amended form: the deployed site
  serves a source archive of exactly the deployed commit with the SHA shown beside it (user-verified in the
  browser; machine-verified here as gated at the archive URL); `/LICENSE` and `/THIRD-PARTY.md` are served from
  the site root with grid-protocol's own GPLv3 listed; the protocol pin is exact and test-gated (plan 01-02);
  and a developer can build, preview and run both test runners against that build (plan 01-04).
- **Phase 2 and Phase 3 can both start.** They fork from here and are independent of each other; neither needs
  anything from this plan except the ability to deploy, which is now one command.
- **The deploy command is the phase's durable artefact.** Every later phase ships through `npm run deploy`, and
  the compliance obligations it enforces are now automatic rather than remembered.
- **The gate stays.** `run_worker_first` remains `true`, both secrets remain set, and plan 01-04's e2e suite
  turns red if the gate is weakened.

---

_Phase: 01-scaffold-licence-and-pin_
_Completed: 2026-09-02_

## Self-Check: PASSED

- `scripts/deploy.mjs`, `docs/DEPLOY.md` and this SUMMARY all exist on disk.
- Both commits are present in `git log`: `eb9e24e` (Task 1-05-01) and `503964d` (the checkpoint pause).
- `git status --porcelain` was empty before this SUMMARY was written, and `git ls-remote origin refs/heads/master` equals local `HEAD`.
- The credential-free 401, the two response headers and `wrangler secret list` were re-run against the live Worker while writing this document, not copied from the checkpoint report.
- A grep of this SUMMARY for the local `.dev.vars` password returns 0 matches. The Cloudflare secret value is not known to this session at all.
