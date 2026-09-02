---
phase: 01-scaffold-licence-and-pin
plan: 01
subsystem: infra
tags:
  [sveltekit, svelte5, vite, adapter-static, tailwindcss, vitest, playwright, prettier, typescript]

# Dependency graph
requires: []
provides:
  - SvelteKit 2.70.3 + Svelte 5.57 + Vite 8 + TypeScript 6.0.3 static scaffold, built in place over the existing docs-only repo
  - "`npm run build` emitting a real static `build/` with `index.html` and `404.html` (adapter-static, fallback `404.html`)"
  - "`@intechstudio/grid-protocol` installed at the bare exact string `1.20260825.1135` in both `package.json` and `package-lock.json`"
  - Vitest (server project, `passWithNoTests`) and Playwright with Chromium downloaded — both test runners are live for later plans
  - "`__COMMIT_SHA__` / `__BUILD_DIRTY__` Vite defines, typed in `src/app.d.ts` and declared as ESLint globals"
  - grid-editor Prettier parity (`.prettierrc` = single-plugin object, `prettier@3.6.2`, `prettier-plugin-svelte@3.4.0`, no `prettier-plugin-tailwindcss`)
  - "`.prettierignore` and `eslint.config.js` exclusions for `src/vendor/`, `.planning/` and `CLAUDE.md`"
affects:
  - 01-02 (pin gate test, config-shape spec)
  - 01-03 (licence files, .gitattributes, source archive, THIRD-PARTY.md)
  - 01-04 (Worker, wrangler, playwright rewiring, footer)
  - 03-vendor-botor (src/vendor/ quarantine, format/lint exclusions)

# Tech tracking
tech-stack:
  added:
    - "@sveltejs/kit@2.70.3"
    - "@sveltejs/adapter-static@3.0.10"
    - "svelte@5.57.0"
    - "vite@8"
    - "typescript@6.0.3"
    - "svelte-check@4.7.6"
    - "vitest@4.1.11"
    - "@playwright/test@1.62.1"
    - "tailwindcss@4 / @tailwindcss/vite@4"
    - "prettier@3.6.2 (exact)"
    - "prettier-plugin-svelte@3.4.0 (exact)"
    - "@intechstudio/grid-protocol@1.20260825.1135 (exact, runtime dependency)"
    - "@types/w3c-web-serial@1.0.8"
    - "wrangler@4.128.0"
    - "license-checker-rseidelsohn@5.0.1"
  patterns:
    - "Kit configuration lives only in `vite.config.ts`, with Kit options FLAT inside the `sveltekit()` argument — no `svelte.config.js`, no `kit: {}` wrapper"
    - "Build metadata reaches the app through Vite `define`, with the dirty flag kept as a separate boolean so the SHA string stays archive-linkable"
    - "Formatting is grid-editor's Prettier defaults so vendored BOTOR files diff cleanly on re-sync"
    - "Tracked-but-generated documents (`.planning/`, `CLAUDE.md`) are Prettier-ignored, never gitignored"

key-files:
  created:
    - vite.config.ts
    - .prettierrc
    - .nvmrc
    - src/app.css
    - src/routes/+layout.ts
    - package.json
    - package-lock.json
    - eslint.config.js
    - tsconfig.json
    - playwright.config.ts
  modified:
    - .gitignore
    - .prettierignore
    - README.md
    - src/app.d.ts
    - src/routes/+layout.svelte
    - src/routes/+page.svelte
    - static/robots.txt

key-decisions:
  - "sv 0.17.0 has no `--no-git-check` and no `-C/--cwd` flag; `--no-download-check` is the correct non-interactive companion to `--no-dir-check`"
  - "`sveltekit-adapter=...+cfTarget:none` is rejected by sv 0.17.0 — `cfTarget` must be omitted entirely for non-Cloudflare adapters"
  - "sv 0.17.0 emits `src/routes/layout.css`, not `src/app.css`; the file was moved to `src/app.css` to match the plan's target shape and the `../app.css` import the later phases assume"
  - "`.prettierrc` is the two-line grid-editor object and stays that way; `require('./.prettierrc')` cannot work (CommonJS .js loader on an extensionless dotfile) and must never be 'fixed' by editing the file"

patterns-established:
  - "Pattern 1: one config location — `vite.config.ts` — asserted by the absence of `svelte.config.*` and of a `kit: {` wrapper"
  - "Pattern 2: root layout prerenders (`prerender = true`, `trailingSlash = 'always'`) and deliberately does NOT set `ssr = false`, so prerendered pages keep a per-route `<head>` for Discord unfurls"
  - "Pattern 3: exact-pin discipline — grid-protocol, prettier and prettier-plugin-svelte all carry bare version strings, no range operators"

requirements-completed: [FOUND-03]

# Metrics
duration: 8min
completed: 2026-09-02
---

# Phase 01 Plan 01: Scaffold, Licence and Pin — Scaffold Summary

**SvelteKit 2.70.3 + Svelte 5 + Vite 8 static scaffold built in place with `sv@0.17.0`, emitting a real
`build/index.html` and `build/404.html` through adapter-static, with `@intechstudio/grid-protocol`
pinned to the bare string `1.20260825.1135` and grid-editor Prettier parity enforced.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-02T14:21:13Z
- **Completed:** 2026-09-02T14:29:16Z
- **Tasks:** 3 of 3
- **Files modified:** 22 (across three commits)

## Accomplishments

- The repository went from docs-only to a working SvelteKit static site in place, without losing a
  single line of the pre-existing `.gitignore`.
- `npm run build` produces a genuine static `build/` (`index.html`, `404.html`, `robots.txt`,
  `_app/immutable/**`) with no application server involved — the adapter is really `adapter-static`,
  proven by `build/` existing rather than only `.svelte-kit/output`.
- `@intechstudio/grid-protocol` is declared as `"1.20260825.1135"` with no range operator and resolves
  to the same version in the lockfile, satisfying FOUND-03's precondition (the test gate itself is plan 02).
- Vitest and Playwright both run: `npx vitest run` exits 0 on an empty tree via `passWithNoTests`, and
  Chromium 151.0.7922.34 (plus the headless shell, ffmpeg and winldd) is downloaded to
  `%LOCALAPPDATA%\ms-playwright`.
- `npm run check`, `npm run lint`, `npm run build` and `npx vitest run` are all green, and `npm run format`
  leaves `.planning/` and `CLAUDE.md` byte-identical.

## Task Commits

Each task was committed atomically:

1. **Task 1-01-01: Verify sv's real flags, then scaffold in place without losing .gitignore** — `ff4c008` (chore)
2. **Task 1-01-02: Install the exact dependency set, including the grid-protocol pin** — `86bb9ff` (chore)
3. **Task 1-01-03: Apply the four corrections to sv's output and prove the static build** — `d46edb8` (feat)

## `npx sv@0.17.0 create --help` — verbatim output

Run as the mandated first step of Task 1-01-01. Reproduced in full; the Options and Add-Ons sections are
the ground truth the plan asked to be recorded.

```
Usage: sv create [options] [path]

Scaffold a new project (--add to include add-ons)

Arguments:
  path                              where the project will be created

Options:
  --template <type>                 template to scaffold (choices: minimal,
                                    demo, library, addon)
  --[no-]types <lang>               add type checking (choices: ts, jsdoc)
  --no-add-ons                      do not prompt to add add-ons
  --add <addon...>                  add-ons to include (see Add-Ons section
                                    below)
  --from-playground <url>           create a project from the svelte playground
  --no-dir-check                    even if the folder is not empty, no prompt
                                    will be shown
  --no-download-check               skip all download confirmation prompts
  --[no-]install <package-manager>  installs dependencies with a specified
                                    package manager (choices: npm, yarn, pnpm,
                                    pnpm-rush, bun, deno, nub, aube)

Official Add-Ons:
  prettier                          (no options)
  eslint                            (no options)
  vitest                            usages: unit, component (default: unit,
                                    component)
  playwright                        (no options)
  tailwindcss                       plugins: typography, forms (default: none)
  sveltekit-adapter                 adapter: auto, node, static, vercel,
                                    cloudflare, netlify (default: auto)
                                    cfTarget: workers, pages (default: none)
  drizzle                           database: postgresql, mysql, sqlite, d1
                                    (default: sqlite)
                                    client: postgres.js, neon, mysql2,
                                    planetscale, better-sqlite3, libsql, turso
                                    (default: libsql)
                                    docker: yes, no (default: none)
  better-auth                       demo: password, github (default: password)
  mdsvex                            (no options)
  paraglide                         languageTags: <user-input> (default: en, es)
                                    demo: yes, no (default: yes)
  storybook                         (no options)
  ai-tools                          ide: claude-code, cursor, gemini, opencode,
                                    vscode, other (default: none)
                                    delivery: plugin, tools (default: none)
                                    tools: mcp, svelte-code-writer,
                                    svelte-core-bestpractices,
                                    svelte-file-editor (default: none)
                                    mcpSetup: local, remote (default: none)
  experimental                      versions: kit (default: kit)
                                    features: async, remoteFunctions,
                                    explicitEnvironmentVariables,
                                    handleRenderingErrors, forkPreloads
                                    (default: async, remoteFunctions,
                                    explicitEnvironmentVariables,
                                    handleRenderingErrors)

Community Add-Ons:
  Find on: https://www.npmjs.com/search?q=keywords:sv-add

Add-On Syntax:
  <addon>                               add with defaults (may still prompt)
  <addon>=<opt>:<val>                   set a single option
  <addon>=<opt1>:<val1>+<opt2>:<val2>   set multiple options
  <addon>=<opt>:none                    explicitly set no value (for multiselect)
  To skip prompts, explicitly set ALL options (use defaults shown above).

Non-interactive usage:
  Provide --template, --types, --add, and --install (or --no-install) to skip prompts entirely.
  Note: --add and --no-add-ons cannot be used together.

Examples:
  sv create my-app --template minimal --types ts --add prettier eslint --install pnpm
  sv create my-app --template minimal --types ts --add prettier vitest="usages:unit" tailwindcss="plugins:none" --install pnpm
  sv create my-app --template minimal --types ts --add drizzle="database:postgresql+client:postgres.js" --no-install
```

### Flag list: research vs. reality

Research (reading a bundled `dist/engine-*.mjs`) expected:
`--template <type>`, `--types <lang>`, `--no-types`, `--no-add-ons`, `--add <addon...>`, `--no-install`,
`--no-dir-check`, `--no-git-check`, `-C/--cwd <path>`, `--from-playground <url>`, `--no-download-check`.

| Flag                     | Real in sv@0.17.0                                  | Note                                                        |
| ------------------------ | -------------------------------------------------- | ----------------------------------------------------------- |
| `--template <type>`      | present                                             | as expected                                                  |
| `--types <lang>`         | present as `--[no-]types <lang>`                    | covers both `--types ts` and `--no-types`                    |
| `--no-add-ons`           | present                                             | as expected                                                  |
| `--add <addon...>`       | present                                             | as expected                                                  |
| `--no-install`           | present as `--[no-]install <package-manager>`       | `--no-install` works                                         |
| `--no-dir-check`         | present                                             | as expected                                                  |
| `--no-download-check`    | present                                             | as expected                                                  |
| `--from-playground <url>`| present                                             | as expected                                                  |
| **`--no-git-check`**     | **DOES NOT EXIST**                                  | no git check exists in 0.17.0 at all; the flag was dropped   |
| **`-C` / `--cwd <path>`**| **DOES NOT EXIST**                                  | the target directory is the positional `path` argument only  |

Two further add-on facts the help exposed that research did not record:

- `sveltekit-adapter` has a second option, `cfTarget: workers | pages`.
- `tailwindcss`'s `plugins` option defaults to `none`, and the help states "To skip prompts, explicitly
  set ALL options" — hence the explicit `tailwindcss=plugins:none` in the command actually run.

The command that was executed (see Deviation 1 and 2):

```
npx sv@0.17.0 create . --template minimal --types ts --no-install --no-dir-check --no-download-check \
  --add prettier eslint tailwindcss=plugins:none playwright vitest=usages:unit sveltekit-adapter=adapter:static
```

## `git diff --stat -- .planning CLAUDE.md` around `npm run format`

Both captures are empty — the formatter touched neither a planning document nor the generated brief.

```
BEFORE:
(no output)

AFTER:
(no output)
```

`diff` of the two captures reported no differences.

## Files Created/Modified

- `vite.config.ts` — adapter-static with **flat** Kit options inside the `sveltekit()` argument
  (`adapter`, `prerender`), `fallback: "404.html"`, the `__COMMIT_SHA__` / `__BUILD_DIRTY__` defines,
  `optimizeDeps.exclude` on grid-protocol, and the vitest server project with `passWithNoTests` and
  `src/vendor/**` excluded.
- `package.json` — exact grid-protocol dependency, exact prettier pins, `engines.node >= 24.0.0`, and
  the plan's script surface (`test:e2e` no longer runs `playwright install` on every invocation).
- `package-lock.json` — 200+ packages; grid-protocol resolved at `1.20260825.1135`.
- `.gitignore` — union of the pre-existing repo file and sv's template, plus `.dev.vars*`, `.wrangler/`,
  `playwright-report/` and `.tmp-format-parity/`. `CLAUDE.md` is deliberately NOT listed.
- `.prettierrc` — `{ "plugins": ["prettier-plugin-svelte"] }` and nothing else (grid-editor parity).
- `.prettierignore` — sv's entries plus `src/vendor/`, `.planning/`, `CLAUDE.md`.
- `eslint.config.js` — `ignores: ['src/vendor/**']` plus the two Vite define globals as `readonly`.
- `tsconfig.json` — `"types": ["w3c-web-serial", "node"]` (`node` is mandatory once `types` is set).
- `src/app.css` — Tailwind import plus the D-13 placeholder `@theme` tokens (`--color-ground`, `--color-accent`).
- `src/app.d.ts` — `__COMMIT_SHA__: string` and `__BUILD_DIRTY__: boolean` inside `declare global`.
- `src/routes/+layout.ts` — `prerender = true`, `trailingSlash = "always"`; no `ssr = false`.
- `src/routes/+layout.svelte` — import rewired from `./layout.css` to `../app.css`.
- `src/routes/+page.svelte` — minimal `<h1>HANGAR</h1>` page for the plan-04 smoke test to assert on.
- `static/robots.txt` — sv's allow-all content plus a comment pointing at the Worker's `X-Robots-Tag`.
- `README.md` — project README with the D-04 copyright line and the GPLv3 notice, no email, no attribution.
- `.nvmrc` — `24`.
- `playwright.config.ts`, `.npmrc`, `.vscode/*`, `src/app.html`, `src/lib/index.ts` — sv output, kept
  (playwright config is rewired in plan 04).
- Deleted: `prettier.config.js`, `src/routes/layout.css`, `src/routes/demo/**`, `src/lib/vitest-examples/**`.

## Decisions Made

- **Kept the plan's `.gitignore` verbatim** rather than a literal union with sv's template. sv's file
  additionally carried `.output`, `.vercel`, `.netlify`, `.DS_Store`, `Thumbs.db`, `!.env.example`,
  `!.env.test` and `vite.config.js.timestamp-*`. None apply to this project (no Vercel/Netlify/Nitro, no
  `.js` Vite config) and the plan supplied the target file byte-for-byte, so the plan wins.
- **`prettier --check .` does not need `build/` added to `.prettierignore`.** Prettier 3 defaults
  `--ignore-path` to `[".gitignore", ".prettierignore"]`, and `build/` and `.svelte-kit/` are both
  gitignored, so lint stays green after a build.
- **Left `playwright.config.ts` on sv's `npm run build && npm run preview` web server.** Correction 3 is
  explicitly plan 04's job; rewiring it here would have required the Worker and `.dev.vars` that plan 04 owns.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `--no-git-check` does not exist in sv@0.17.0**

- **Found during:** Task 1-01-01 (mandated `sv create --help` verification step)
- **Issue:** The plan's scaffold command passes `--no-git-check`. sv 0.17.0's help lists no such flag;
  commander would have rejected the invocation. Research had read the flag out of a bundled
  `dist/engine-*.mjs`, which is exactly why the plan mandated verifying it first.
- **Fix:** Dropped `--no-git-check` and added `--no-download-check` (which does exist) so the run stays
  fully non-interactive. sv 0.17.0 performs no git-cleanliness check at all, so nothing was lost.
- **Files modified:** none (command-line only)
- **Verification:** `sv create` completed with `Project created` and `Successfully setup add-ons`, and
  the uncommitted `.planning/` tree was untouched.
- **Committed in:** `ff4c008`

**2. [Rule 3 - Blocking] `cfTarget:none` is rejected for a non-Cloudflare adapter**

- **Found during:** Task 1-01-01
- **Issue:** The help says "To skip prompts, explicitly set ALL options", and `sveltekit-adapter` has a
  `cfTarget` option whose default is shown as `none`. Passing
  `sveltekit-adapter=adapter:static+cfTarget:none` failed with
  `Error: Incompatible 'sveltekit-adapter' option specified: 'none'` and `Operation failed.` Nothing was
  written to disk (verified with `git status --short` and `ls -a`).
- **Fix:** Omitted `cfTarget` entirely. `cfTarget` only applies when `adapter:cloudflare` is selected, so
  no prompt appears for `adapter:static`. `tailwindcss=plugins:none` was kept explicit and is accepted.
- **Files modified:** none (command-line only)
- **Verification:** Re-run succeeded non-interactively with stdin closed (`< /dev/null`).
- **Committed in:** `ff4c008`

**3. [Rule 3 - Blocking] sv 0.17.0 generates `src/routes/layout.css`, not `src/app.css`**

- **Found during:** Task 1-01-03
- **Issue:** Research's file list (and the plan's `files_modified` and its `src/app.css` acceptance
  criterion) assume `src/app.css`. sv 0.17.0's Tailwind add-on actually emits `src/routes/layout.css`,
  imported from `+layout.svelte` as `./layout.css`, and points `prettier.config.js`'s
  `tailwindStylesheet` at it. Without a fix the `grep -qi "d6ff4e" src/app.css` criterion could not pass
  and the plan's instruction that `+layout.svelte` "imports `../app.css`" would be false.
- **Fix:** Created `src/app.css` with the plan's exact target content, rewired `+layout.svelte` to
  `import '../app.css'`, and deleted `src/routes/layout.css`. (`prettier.config.js`, which referenced the
  old path, was deleted by Correction 2 anyway.)
- **Files modified:** `src/app.css` (created), `src/routes/+layout.svelte`, `src/routes/layout.css` (deleted)
- **Verification:** `npm run build` emits `build/_app/immutable/assets/0.*.css` containing the Tailwind
  output; `npm run check` and `npm run lint` are green; `grep -qi "d6ff4e" src/app.css` passes.
- **Committed in:** `d46edb8`

**4. [Rule 1 - Bug] Regex literal in `vite.config.ts` lost a backslash on first write**

- **Found during:** Task 1-01-03
- **Issue:** The heredoc used to write `vite.config.ts` collapsed `/[/\\]/` to `/[/\]/`, producing
  `SyntaxError: Unterminated regular expression literal` from Prettier at the first `npm run format`.
- **Fix:** Restored the double backslash so the `runes` predicate reads
  `filename.split(/[/\\]/).includes("node_modules")` exactly as the plan specifies.
- **Files modified:** `vite.config.ts`
- **Verification:** `npm run format` re-ran clean and reported `vite.config.ts (unchanged)`;
  `npm run check` and `npm run build` are green.
- **Committed in:** `d46edb8`

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 bug)
**Impact on plan:** All four were mechanical corrections needed to execute the plan as written. No scope
was added or removed, and no acceptance criterion was weakened. Deviations 1 and 2 are exactly the class
of finding the plan's mandated `--help` step existed to catch.

## Issues Encountered

- The first `npm run format` reported files as changed (sv writes tabs/single-quotes; grid-editor parity
  is spaces/double-quotes). This is the intended D-15 effect, not a problem: `eslint.config.js`,
  `package.json`, `tsconfig.json`, `playwright.config.ts`, `src/app.d.ts`, `src/app.html`,
  `src/routes/+layout.svelte`, `README.md` and `.vscode/*` were all reformatted to Prettier defaults on
  the first pass and are stable on every pass since.
- `npm ls typescript` resolves to `6.0.3` throughout, as research predicted — no `typescript@7`
  intervention was needed.

## Known Stubs

None that block this plan's goal. Two forward-looking placeholders are deliberate and named in the plan:

- `src/app.css` carries only the two D-13 identity tokens. The real design system is Phase 4 (IDENT-01).
- `playwright.config.ts` still uses sv's `npm run build && npm run preview` web server and has no test
  files. Correction 3 (target `build/` through the real Worker) is plan 01-04's task, and the single
  smoke test (D-14) arrives with it.

## User Setup Required

None — no external service configuration was required by this plan. (Cloudflare secrets arrive in plan 04.)

## Next Phase Readiness

- Every later plan in this phase now has a tree to write into: `src/lib/` for the `PROTOCOL_PIN` constant
  and its spec (plan 02), the repo root for `LICENSE`, `.gitattributes` and `THIRD-PARTY.md` (plan 03),
  and a working `build/` for the Worker and Playwright harness (plan 04).
- `licenses/` and `THIRD-PARTY.md` are not yet in `.prettierignore`; plan 03 appends them as specified.
- `src/vendor/` does not exist yet — only its format and lint exclusions do. Phase 3 creates it along
  with `VENDOR.md` (D-16).
- Open item carried forward unchanged: the embargo date (D-03) is still TBD and must be asked before any
  un-gated deploy.

---

_Phase: 01-scaffold-licence-and-pin_
_Completed: 2026-09-02_

## Self-Check: PASSED

All 20 claimed files exist on disk (including `build/index.html` and `build/404.html`), all three task
commits (`ff4c008`, `86bb9ff`, `d46edb8`) are present in `git log`, and both files claimed as deleted
(`prettier.config.js`, `src/routes/layout.css`) are gone.
