# Phase 1: Scaffold, Licence and Pin - Research

**Researched:** 2026-09-02
**Domain:** SvelteKit static scaffold, Cloudflare Workers static assets, GPLv3 corresponding-source for a browser-delivered bundle, exact-pin enforcement
**Confidence:** HIGH

## Summary

This was a confirmation pass, not discovery. `.planning/research/STACK.md` already chose the stack and
`01-CONTEXT.md` locked seventeen decisions. Every version in STACK.md re-verified clean against the npm
registry today — nothing has moved. The pinned `@intechstudio/grid-protocol@1.20260825.1135` exists on the
public registry and was installed into a scratch project to confirm the lockfile shape the pin test must read.

Three findings change how the plan must be written, and none of them are guessable:

1. **`sv@0.17.0` no longer generates a `svelte.config.js`.** Kit options are passed *flattened* into the
   `sveltekit()` call inside `vite.config.ts`. Since Kit 2.62.0, if a `svelte.config.js` also exists it is
   **silently ignored** (one console warning) in favour of the Vite-config object. A plan that says "write
   `svelte.config.js` with adapter-static" against an sv 0.17 scaffold produces a site built with
   `adapter-auto`, and the failure looks like "the build works but `build/` is wrong".
2. **`vite preview` is not the static build.** SvelteKit's preview server boots the Node server bundle from
   `.svelte-kit/output/server` (it throws `Server files not found` if you haven't built). It does not serve
   `build/`. The Playwright config `sv` generates points at `npm run preview`, so the smoke test would
   validate the wrong artifact and success criterion 4 ("preview it with no server running") would be claimed
   on the strength of a running server.
3. **GPLv3 §6(d) is the exact clause D-02 satisfies, and it is quoted verbatim below.** "Offer equivalent
   access to the Corresponding Source in the same way through the same place at no further charge." A source
   archive served from the same site as the JS bundle is a textbook §6(d) discharge. The private repository is
   not a problem for the licence — §6 has no publish-your-repo requirement.

Plus one licence trap verified empirically: `@intechstudio/grid-protocol`'s `package.json` has **no `license`
field at all**, only a `LICENSE` file. Its `package-lock.json` entry therefore carries no `license` key, while
`@wasm-fmt/lua_fmt`'s does (`MIT`). Any notices generator that reads the lockfile omits or mislabels the one
package that most needs listing. `license-checker-rseidelsohn@5.0.1` was run against a real install of the
pinned tree and does get it right — it reads the LICENSE file and reports `GPL-3.0*` (the `*` meaning
"inferred").

**Primary recommendation:** Scaffold with `sv@0.17.0` non-interactively, then make four deliberate corrections
to its output (kit config location, prettier config, Playwright harness, demo routes), and build the deploy
path as a single `node scripts/deploy.mjs` rather than shell scripts — Windows plus environment variables plus
`git archive` in one npm script is exactly where cross-platform shell breaks.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Repository and publicity**
- **D-01:** The repository lives at `github.com/sabotond-dev/hangar`, the same personal account as BOTOR. Push
  with the stored `sabotond-dev` credential; no `gh` CLI on this machine.
- **D-02:** The repository stays **private permanently**. GPLv3 corresponding-source is satisfied by a **source
  archive built per deploy** and served from the site, not by a public repo. Never flip it public as a
  shortcut; that is a separate decision the user has not made.
- **D-03:** A public (un-gated) deploy is **embargoed until a calendar date the user will set**. Recorded as
  TBD; nothing in Phase 1 depends on the day, only on the gate existing. Until then every deploy is a gated
  preview (D-07).
- **D-04:** Copyright line is **Botond Sandor, personal**, on `LICENSE` and on every new file header. Ported
  files (Phase 3) keep Intech's original headers and gain an origin line (repo, path, commit). No Claude
  attribution anywhere, in commits or headers — a standing user rule.

**Hosting, domain and deploy**
- **D-05:** Served from **Cloudflare Workers static assets** (not Pages, not GitHub Pages — a private repo
  rules the latter out on the free tier). A Worker sits in front so it can gate the preview now and render OG
  images for tuned stamps later.
- **D-06:** Preview URL is **`hangar.sabotond.workers.dev`**. The account's Workers subdomain is `sabotond`,
  the personal domain is `sanbotond.com` — different spellings, do not conflate. A custom domain is a
  launch-day decision and is out of scope for Phase 1.
- **D-07:** The preview is gated by **Basic Auth in the Worker**, the zona-docs pattern:
  `run_worker_first: true` so no asset bypasses the gate, password in a gitignored file and stored as a Worker
  secret via `npx wrangler secret put`, responses carry `X-Robots-Tag: noindex`. Username and password wording
  are Claude's discretion. The gate is removed on launch day, not before.
- **D-08:** Deploys are **manual `wrangler deploy` from this machine** via one npm script that builds, embeds
  the deployed commit SHA into the page, produces the source archive (D-02), and deploys. No GitHub Actions,
  no Cloudflare Git integration — consistent with Actions being disabled on the user's other private repos.

**Pin and bump policy**
- **D-09:** `@intechstudio/grid-protocol` is pinned to **`1.20260825.1135`** — the exact version
  grid-editor@redesign uses and BOTOR's cost baseline was measured against — as an exact string in
  `package.json` (no caret, no tilde).
- **D-10:** The gate is a **Vitest test asserting three things agree**: the `package.json` string, the
  lockfile's resolved version, and a `PROTOCOL_PIN` constant exported from source. Any mismatch is red. An
  accidental `npm update` cannot pass; a deliberate bump must touch all three in one commit.
- **D-11:** A legitimate bump must additionally pass: the vendored compiler/simulator suite green AND every
  catalog preset's `compressScript` cost **byte-identical** to a recorded baseline. If a bump moves a single
  cost, it is a reviewed decision with a written reason, never a routine update. (The baseline file and the
  suite arrive in Phase 3; Phase 1 leaves the hook and documents the rule.)
- **D-12:** The tested firmware range is **never shown to visitors** — not in a footer, not at connect. It is
  internal documentation only (a note in `VENDOR.md` or the pin test).

**Scaffold tooling**
- **D-13:** **Tailwind CSS v4 via `@tailwindcss/vite`** is in the scaffold. The `@theme` block carries the two
  identity tokens (true black, acid lime ~#D6FF4E) as placeholders; the real design system is Phase 4's job.
- **D-14:** **Playwright is set up in Phase 1** with exactly one smoke test: an init script deletes
  `navigator.serial`, the page loads, and something visible asserts. It proves the harness runs against the
  static build; the real degrade-path tests come in Phase 5.
- **D-15:** **Prettier and its plugin set match grid-editor exactly** (copy its config), so files vendored in
  Phase 3 diff cleanly against BOTOR on every re-sync. ESLint uses the `sv create` flat config default.
- **D-16:** Vendored BOTOR code will live in **`src/vendor/botor/`** with a **`VENDOR.md`** recording, per
  file, the source repo, path and commit SHA plus the sync procedure. Phase 1 creates the directory and the
  doc skeleton (headings, empty table); Phase 3 fills it.

**Stack**
- **D-17:** SvelteKit 2.70.x + `@sveltejs/adapter-static` 3.0.x, Svelte 5, Vite 8, TypeScript **6.x (not 7 —
  Kit and svelte-check reject it)**, Vitest 4, `@types/w3c-web-serial`, `wrangler` 4. Scaffold with
  `npx sv create`. Vite config includes `optimizeDeps: { exclude: ["@intechstudio/grid-protocol"] }` (the
  proven grid-editor incantation) even though Phase 1 does not yet import it.

### Claude's Discretion
- Source archive mechanics: `git archive` of the deployed commit, gzipped, served as `/source-<sha>.tar.gz`
  (or equivalent), linked from the footer beside the licence link. Excludes `node_modules` and build output.
  Exact naming and whether a `THIRD-PARTY.md` is included inline or generated is Claude's call — but a
  third-party notices file **must** exist and must list `@intechstudio/grid-protocol` (GPLv3) and
  `@wasm-fmt/lua_fmt` (its own licence, check it).
- How the commit SHA reaches the page (Vite `define`, env at build, generated module).
- Basic Auth realm text, username, and how the password file is named/ignored.
- Node version pin (`.nvmrc`/`engines`) and package manager (npm, matching the sibling repos).
- How Playwright targets "the static build" (wrangler dev vs vite preview) — pick what also works for the
  future degrade tests.
- Whether `sv create`'s ESLint config is kept verbatim or trimmed.

### Deferred Ideas (OUT OF SCOPE)
- **Custom domain** — launch-day decision; the preview runs on `hangar.sabotond.workers.dev`.
- **Embargo date** — the user will set it; recorded as TBD. Add to STATE.md pending todos so it is asked
  before any un-gated deploy.
- **Removing the Basic Auth gate** — launch day, gated on the embargo date.
- **OG images for tuned stamps at request time** — the Worker makes it possible later; not Phase 1 (per-preset
  build-time OG images are Phase 5, SHARE-04).
- **Firmware-range comparison at connect** — Phase 6 reads `PROTOCOL_PIN` internally; the user decided the
  range is never shown to visitors (D-12), so there is no display work anywhere.

### Amended success criterion
Criterion 1 as written in ROADMAP.md ("follow a visible Source link to the public repository") is superseded by
CONTEXT.md: *A visitor can load the deployed site over HTTPS and download, from a visible Source link, a source
archive of exactly the deployed commit, with the commit SHA shown beside it.*
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-03 | `@intechstudio/grid-protocol` is pinned to the exact version BOTOR's cost baseline was measured against, and any bump is a test-gated change | §The Pin Gate — verified registry existence of `1.20260825.1135`, verified `npm i --save-exact` writes a bare exact string, verified lockfileVersion 3 path `packages["node_modules/@intechstudio/grid-protocol"].version`; concrete Vitest test given; `optimizeDeps.exclude` requirement carried forward from grid-editor |
| FOUND-04 | The repository carries a GPLv3 licence, a notices file for third-party licences (grid-protocol is itself GPLv3), and the deployed site links to its source | §GPLv3 Corresponding Source — GPLv3 §1 and §6(d) quoted verbatim from gnu.org; `git archive` mechanism tested against this repo; §Third-Party Notices — `license-checker-rseidelsohn@5.0.1` run against a real install of the pinned tree, output shown; `@wasm-fmt/lua_fmt` licence confirmed **MIT** from its shipped `package.json` and `LICENSE` |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

`hangar/CLAUDE.md` (the repo-local one — not the marketing-dashboard `CLAUDE.md` one directory up) carries
these actionable directives:

| Directive | Source section | Effect on this phase |
|-----------|----------------|----------------------|
| Hosting is **static only**; Cloudflare is the established host | Constraints | No server-rendered routes, no adapter other than `adapter-static` |
| `grid-editor` is GPLv3, so **HANGAR ships GPLv3 with public source** | Constraints | GPLv3 `LICENSE` is a Phase 1 deliverable, not deferrable. CONTEXT D-02 defines "public source" as the served archive, not a public repo |
| `@intechstudio/grid-protocol` version tracks firmware; **HANGAR pins it** | Constraints | Exact pin, no range |
| Detect the capability (`"serial" in navigator && isSecureContext`), **never the browser** | Constraints | The Phase 1 smoke test must remove the capability, not spoof a user-agent |
| Do **not** use Moment.js / Apps Script / an ORM / hosting infra beyond Cloudflare | Stack §What NOT to Use | No new runtime dependencies in Phase 1 beyond `@intechstudio/grid-protocol` |
| **GSD Workflow Enforcement**: no direct repo edits outside a GSD command | Workflow | Executors work from the plan; no ad-hoc edits |
| No Claude attribution in commits or headers (also D-04) | CONTEXT / standing rule | Commit trailers and file headers must not name Claude |

Nothing in CLAUDE.md contradicts any locked decision.

---

## Standard Stack

Every version below was re-verified against `registry.npmjs.org` on 2026-09-02 with `npm view <pkg> version`.
The registry agrees with STACK.md on every line. **No version drift since the project-level research.**

### Core

| Package | Registry latest (2026-09-02) | Use | Why |
|---------|------------------------------|-----|-----|
| `sv` | 0.17.0 | Scaffolder | Current Svelte CLI. Templates and add-ons read directly out of the published tarball for this research |
| `@sveltejs/kit` | 2.70.3 | Framework | sv's minimal template requests `^2.63.0`; resolves to 2.70.3 |
| `svelte` | 5.57.0 | Runtime | sv requests `^5.56.1` |
| `vite` | 8.2.2 | Bundler | sv requests `^8.0.16` |
| `@sveltejs/vite-plugin-svelte` | 7.3.0 | Svelte/Vite bridge | `engines.node: ^20.19 \|\| ^22.12 \|\| >=24`. Local Node is 24.14.0 — in range |
| `@sveltejs/adapter-static` | 3.0.10 | Static output | sv's adapter add-on requests exactly `^3.0.10` for `adapter:static` |
| `typescript` | **6.0.3** (latest tag is 7.0.2 — do not use) | Types | `@sveltejs/kit@2.70.3` peer is `^5.3.3 \|\| ^6.0.0`; `svelte-check@4.7.6` peer is `^5.0.0 \|\| ^6.0.0`. **Neither admits 7.** Verified from the live packuments today |
| `svelte-check` | 4.7.6 | `.svelte` type-check | sv requests `^4.6.0` |
| `vitest` | 4.1.11 | Unit tests | sv's vitest add-on requests `^4.1.8` |
| `@playwright/test` | 1.62.1 | Browser tests | sv's playwright add-on requests `^1.60.0` |
| `tailwindcss` / `@tailwindcss/vite` | 4.3.3 / 4.3.3 | Styling | sv requests `^4.3.0` for both |
| `wrangler` | 4.128.0 | Deploy | zona-docs already deploys with wrangler from this account |
| `@intechstudio/grid-protocol` | **pin `1.20260825.1135`** (registry latest is `1.20260828.1315`) | Protocol + Lua minifier | D-09. Existence on the public registry verified today; tarball and integrity hash recorded below |

### Supporting

| Package | Version | Purpose | When |
|---------|---------|---------|------|
| `@types/w3c-web-serial` | 1.0.8 | `navigator.serial` typings | Add now (`"types": ["w3c-web-serial"]` in tsconfig) so Phase 2/6 inherit it. Zero cost |
| `license-checker-rseidelsohn` | 5.0.1 | Generate the notices file | devDependency; see §Third-Party Notices for the verified output |
| `prettier` | **3.6.2 (exact)** | Formatter | D-15 parity — grid-editor's resolved version. sv wants `^3.8.3` |
| `prettier-plugin-svelte` | **3.4.0 (exact)** | Svelte formatting | D-15 parity — grid-editor's resolved version. sv wants `^4.1.0` |
| `sirv-cli` | 3.0.1 | Fallback static server for Playwright | Only if `wrangler dev` proves flaky as the test harness |

### Deliberately NOT installed in Phase 1

| Package | Why not |
|---------|---------|
| `@sveltejs/adapter-auto` | The `sveltekit-adapter=adapter:static` add-on deletes it from `devDependencies` automatically. Confirm it is gone |
| `@sveltejs/adapter-cloudflare` | D-05 is Workers **static assets** with a hand-written Worker, not the Cloudflare adapter. The adapter would produce a `_worker.js` and take over the routing that the Basic Auth gate needs to own |
| `@cloudflare/workers-types` | Only needed if the Worker is TypeScript. Keeping `worker/index.js` as plain JS (the zona-docs shape) avoids the dependency entirely |
| `prettier-plugin-tailwindcss` | sv adds it automatically when Tailwind + Prettier are both selected (`^0.8.0`). **It reorders class attributes** — it is not in grid-editor's plugin list, so D-15 says remove it. See Pitfall 4 |
| `@vitest/browser-playwright`, `vitest-browser-svelte` | Only installed if you pick vitest's `component` usage. Pick `usages:unit` only |
| `cross-env` | Not needed if the deploy script is a Node script rather than a shell one-liner |

### Installation

```bash
# 1. Scaffold in place. hangar/ is non-empty (.git, .planning, CLAUDE.md, .gitignore),
#    hence --no-dir-check; the tree has an uncommitted file, hence --no-git-check.
#    IMPORTANT: back up the existing .gitignore first — the template ships its own.
npx sv@0.17.0 create . --template minimal --types ts --no-install --no-dir-check --no-git-check \
  --add prettier eslint tailwindcss playwright vitest=usages:unit sveltekit-adapter=adapter:static

# 2. Runtime dependency — EXACT pin, no caret (D-09).
npm i --save-exact @intechstudio/grid-protocol@1.20260825.1135

# 3. Dev dependencies sv does not add.
npm i -D --save-exact prettier@3.6.2 prettier-plugin-svelte@3.4.0   # D-15 parity, overrides sv's ^3.8.3 / ^4.1.0
npm i -D @types/w3c-web-serial@1.0.8 wrangler@4.128.0 license-checker-rseidelsohn@5.0.1

# 4. Remove what sv added that D-15 forbids.
npm uninstall prettier-plugin-tailwindcss

# 5. Browsers for Playwright (NOT installed on this machine — ~150 MB download).
npx playwright install chromium
```

**Verified version facts (`npm view`, 2026-09-02):**

```
@intechstudio/grid-protocol@1.20260825.1135
  tarball   https://registry.npmjs.org/@intechstudio/grid-protocol/-/grid-protocol-1.20260825.1135.tgz
  integrity sha512-aRucpaz8XBMze1s3Vhx8lhpMsSwvsxjrs8MpB7yXkT+kcKItfrOY2/Qd1CqFubu2xJI0YI73UxyZM8IDDkyWrQ==
  license   (no `license` field — LICENSE file only, GPLv3)
  deps      @wasm-fmt/lua_fmt ^0.2.0  ->  resolves 0.2.0, MIT
```

### Add-on option syntax (read out of sv 0.17.0's bundled CLI)

`--add` is variadic and each add-on takes `addon=option1:value1+option2:value2`. Verified ids: `prettier`,
`eslint`, `vitest` (options: `usages` in {`unit`,`component`}), `playwright`, `tailwindcss` (option:
`plugins`), `sveltekit-adapter` (alias `adapter`; options: `adapter` in {`auto`,`node`,`static`,`vercel`,
`cloudflare`,`netlify`}), `drizzle`, `better-auth`, `mdsvex`, `paraglide`, `storybook`, `ai-tools`,
`experimental`. Flags verified present: `--template <type>`, `--types <lang>` (`ts`|`jsdoc`), `--no-types`,
`--no-add-ons`, `--add <addon...>`, `--no-install`, `--no-dir-check`, `--no-git-check`, `-C/--cwd <path>`,
`--from-playground <url>`, `--no-download-check`.

> The plan should still run `npx sv@0.17.0 create --help` as the first command and diff it against this list.
> These flags were read out of a bundled `dist/engine-*.mjs`, which is one indirection from ground truth.

---

## What `sv create` Actually Produces

Read directly from the published `sv@0.17.0` tarball (`dist/templates/minimal/*`, `dist/shared.json`,
`dist/engine-B7chsCPG.mjs`). Confidence: **HIGH** — this is the shipped code, not documentation.

### File list (minimal + ts + the five add-ons)

```
.gitignore              # from the template — WILL CLOBBER the existing hangar .gitignore
.npmrc                  # engine-strict=true
.prettierignore         # from the prettier add-on
.vscode/extensions.json # svelte.svelte-vscode, esbenp.prettier-vscode, bradlc.vscode-tailwindcss
.vscode/settings.json   # files.associations *.css -> tailwindcss
README.md
eslint.config.js        # flat config: includeIgnoreFile(.gitignore), js/ts/svelte recommended
package.json
playwright.config.ts
prettier.config.js      # DELETE THIS — see Correction 2
tsconfig.json
vite.config.ts          # <-- the Kit config lives HERE. There is no svelte.config.js.
src/app.css             # @import 'tailwindcss';
src/app.d.ts
src/app.html
src/lib/index.ts
src/lib/assets/favicon.svg
src/lib/vitest-examples/greet.ts
src/lib/vitest-examples/greet.spec.ts
src/routes/+layout.svelte
src/routes/+page.svelte
src/routes/demo/+page.svelte
src/routes/demo/playwright/+page.svelte
src/routes/demo/playwright/page.svelte.e2e.ts
static/robots.txt
```

### `package.json` after the add-ons

```jsonc
{
  "name": "hangar", "private": true, "version": "0.0.1", "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "prepare": "svelte-kit sync || echo ''",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "format": "prettier --write .",
    "lint": "prettier --check . && eslint .",
    "test:unit": "vitest",
    "test:e2e": "playwright install && playwright test",
    "test": "npm run test:unit -- --run && npm run test:e2e"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.10",
    "@sveltejs/kit": "^2.63.0",
    "@sveltejs/vite-plugin-svelte": "^7.1.2",
    "svelte": "^5.56.1",
    "vite": "^8.0.16",
    "typescript": "^6.0.3",
    "svelte-check": "^4.6.0",
    "prettier": "^3.8.3",
    "prettier-plugin-svelte": "^4.1.0",
    "prettier-plugin-tailwindcss": "^0.8.0",
    "eslint": "...", "eslint-plugin-svelte": "^3.19.0", "@eslint/js": "^10.0.1",
    "typescript-eslint": "^8.60.1", "eslint-config-prettier": "^10.1.8",
    "globals": "^17.6.0", "@types/node": "...",
    "vitest": "^4.1.8",
    "@playwright/test": "^1.60.0",
    "tailwindcss": "^4.3.0", "@tailwindcss/vite": "^4.3.0"
  }
}
```

**Note `typescript: "^6.0.3"`.** STACK.md warned "sv may install 7.x". It does not — sv 0.17.0 already pins the
caret range that excludes 7. The TypeScript trap is closed by the scaffolder itself. Verify anyway
(`npm ls typescript` must show a 6.x), because it is one `npm update` away from re-opening and both
`@sveltejs/kit@2.70.3` (`^5.3.3 || ^6.0.0`) and `svelte-check@4.7.6` (`^5.0.0 || ^6.0.0`) reject 7.

### The generated `vite.config.ts` (before corrections)

```ts
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
      },
      adapter: adapter()
    })
  ],
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
        }
      }
    ]
  }
});
```

Note the vitest add-on rewrites the `defineConfig` import from `vite` to `vitest/config`. Keep that.

---

## The Four Corrections to sv's Output

### Correction 1 — Kit config lives in `vite.config.ts`, flattened, and there must be no `svelte.config.js`

Verified from three independent sources:

- `@sveltejs/kit@2.70.3` `src/exports/vite/index.js`: *"Since version 2.62.0 you can pass configuration
  directly, in which case `svelte.config.js` is ignored."* When a config object is passed **and** a
  `svelte.config.{js,ts}` exists, Kit logs `"<file> is ignored when options are passed via your Vite config"`
  and proceeds with the Vite-config object.
- `@sveltejs/kit@2.70.3` `src/core/config/index.js` `split_config()`: keys are matched against
  `kit_options = Object.keys(defaults.kit)` and placed under `kit`. **Anything unrecognised is forwarded to
  vite-plugin-svelte.** So `sveltekit({ kit: { adapter } })` puts a key called `kit` into vite-plugin-svelte
  and leaves SvelteKit on `adapter-auto`. Options are **flat**: `adapter`, `prerender`, `alias`, `files`,
  `paths`, `env`, `router`, `typescript`, ... `compilerOptions`, `preprocess`, `extensions`, `vitePlugin`,
  `onwarn` are Svelte-level and also sit flat.
- `@sveltejs/sv-utils@0.3.3` `src/svelte-config.ts`: resolution order is `svelte.config.js` →
  `svelte.config.ts` → `vite.config.ts` → `vite.config.js`, and a `svelte.config` with a default export
  **wins**. `SVELTE_LEVEL_OPTIONS` is exactly the five names above; everything else is routed under `kit`.

**Plan directive:** do not create a `svelte.config.js`. Edit the `sveltekit()` argument in `vite.config.ts`.
If a `svelte.config.js` gets created anyway (habit, or a later `sv add`), it will silently take over and the
Vite-config adapter/prerender settings become dead code.

### Correction 2 — `prettier.config.js` must go; `.prettierrc` must match grid-editor byte for byte (D-15)

sv's prettier add-on generates:

```js
/** @type {import("prettier").Config} */
const config = {
  useTabs: true, singleQuote: true, trailingComma: 'none', printWidth: 100,
  plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
  overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
  tailwindStylesheet: './src/app.css'
};
export default config;
```

grid-editor's `.prettierrc` is, in its entirety:

```json
{ "plugins": ["prettier-plugin-svelte"] }
```

— i.e. **Prettier defaults**: 2-space indent, double quotes, `trailingComma: "all"`, `printWidth: 80`, no
class reordering. Every one of sv's five settings differs. Formatting a vendored BOTOR file under sv's config
would rewrite essentially every line, which is exactly the outcome D-15 exists to prevent.

**Plan directive:**

1. Delete `prettier.config.js`.
2. Write `.prettierrc` containing exactly `{ "plugins": ["prettier-plugin-svelte"] }`. (`.prettierrc` also
   outranks `prettier.config.js` in Prettier's resolution order, but leaving both is a trap for the next
   reader — delete it.)
3. Uninstall `prettier-plugin-tailwindcss`.
4. Pin `prettier@3.6.2` and `prettier-plugin-svelte@3.4.0` exactly — the versions resolved in grid-editor's
   `node_modules`. Prettier ships formatting changes in minor releases, so a caret range re-opens the drift
   D-15 closes. (`prettier-plugin-svelte@3.4.0` peer: `svelte ^3.2.0 || ^4 || ^5` — Svelte 5.57 is in range.
   v4's changelog shows the major was for removing `svelteBracketNewLine`/`svelteStrictMode` and requiring
   Svelte 5, not for output changes — so v4 would probably be fine too, but "exactly" is cheaper to guarantee
   than to argue.)
5. Extend `.prettierignore` with `src/vendor/` and add the same path to `eslint.config.js` `ignores`.
   ARCHITECTURE.md §4.2 is explicit that vendored files must be excluded from lint and format entirely.
   Matching the config protects against a deliberate format; ignoring protects against an accidental one.

**Parity is testable** — see §Validation Architecture, the "vendor canary" check.

### Correction 3 — Playwright must target `build/`, not `vite preview`

`@sveltejs/kit@2.70.3` `src/exports/vite/preview/index.js` opens with:

```js
const dir = join(svelte_config.kit.outDir, 'output/server');
if (!fs.existsSync(dir)) throw new Error(`Server files not found at ${dir}, did you run \`build\` first?`);
const { Server } = await import(pathToFileURL(join(dir, 'index.js')).href);
```

It boots the SvelteKit **Node server** from `.svelte-kit/output/server` and serves requests through it. It
never reads `build/`. So sv's generated
`webServer: { command: 'npm run build && npm run preview', port: 4173 }` tests an artifact that is not the
deployed one, and success criterion 4's "preview it with **no server running**" is not met by it.

**Recommended harness: `wrangler dev`.** It serves the assets directory from local disk, honours
`run_worker_first`, runs the real Worker, and reads `.dev.vars` for the Basic Auth secret. It is therefore
byte-identical to production and — a bonus — it makes the auth gate itself a regression test. Playwright's
`webServer.url` readiness probe **explicitly accepts a 401**, so the gate does not break startup detection.
Note `port` is deprecated in Playwright; use `url`.

Fallback if `wrangler dev` proves slow or flaky in the loop:
`npx sirv-cli build --port 4173 --host 127.0.0.1 --single`. Same assertions, no auth coverage.

### Correction 4 — delete the demo scaffolding before it ships

sv writes `src/routes/demo/+page.svelte`, `src/routes/demo/playwright/+page.svelte`,
`src/routes/demo/playwright/page.svelte.e2e.ts` and `src/lib/vitest-examples/`. With `prerender = true` these
become real pages in `build/` on the deployed site. Delete all of them; move the Playwright test to `e2e/` and
set `testDir: 'e2e'`.

Also merge, don't replace, `.gitignore`. sv's template version has `/.svelte-kit`, `/build`, `.wrangler`,
`.env.*`, `vite.config.ts.timestamp-*` but **lacks** the existing repo's `.claude/worktrees/`,
`.claude/settings.local.json` and `dist/`. The union of both, plus `.dev.vars*`, `test-results/`,
`playwright-report/` and `licenses/` is what Phase 1 should end with.

---

## GPLv3 Corresponding Source for a Private-Repo Static Site

Quoted verbatim from `https://www.gnu.org/licenses/gpl-3.0.txt`. Confidence: **HIGH — primary source.**

**§1, Corresponding Source:**

> "The Corresponding Source for a work in object code form means all the source code needed to generate,
> install, and (for an executable work) run the object code and to modify the work, including scripts to
> control those activities."

**§6(d) — the clause D-02 discharges:**

> "Convey the object code by offering access from a designated place (gratis or for a charge), and offer
> equivalent access to the Corresponding Source in the same way through the same place at no further charge.
> You need not require recipients to copy the Corresponding Source along with the object code. If the place to
> copy the object code is a network server, the Corresponding Source may be on a different server (operated by
> you or a third party) that supports equivalent copying facilities, provided you maintain clear directions
> next to the object code saying where to find the Corresponding Source."

**§5(a)/(b) — notices on modified source:**

> (5a) "prominent notices stating that you modified it, and giving a relevant date"
> (5b) "prominent notices stating that it is released under this License and any conditions added under
> section 7"

### What this means concretely

1. **A public repository is not required.** §6 offers five alternatives; none of them says "publish your VCS".
   §6(d) is satisfied by serving the Corresponding Source from the same site that serves the bundle. D-02 is
   licence-correct as written, and PITFALLS §C13's "publish the repo" is *one* way, not *the* way.
2. **"Clear directions next to the object code."** The practical requirement beyond the archive itself is the
   pointer. The footer Source link, present on every page of the site that ships the bundle, next to a link to
   `/LICENSE`, is the directions. Keep it in the persistent layout chrome, not on an About page only.
3. **"Scripts to control those activities" means the lockfile is not optional.** `package.json` alone does not
   reproduce a build; `package-lock.json` does. `git archive HEAD` includes it automatically as long as it is
   committed — which it must be. Same for `vite.config.ts`, `tsconfig.json`, `wrangler.jsonc`, the deploy
   script and the postbuild script.
4. **`node_modules` does not go in the archive.** GPLv3 §1 excludes "System Libraries" and general-purpose
   tools, and each dependency is separately available under its own licence from a public registry that the
   lockfile pins by integrity hash. Shipping the lockfile plus `npm ci` instructions is the standard and
   defensible position. (This is judgement, not a quotation — flagged as such.)
5. **Sourcemaps are a cheap good-faith extra**, not a requirement once the archive exists. Vite emits them
   with `build.sourcemap: true`. Optional; note it, don't mandate it.
6. **§5's "prominent notices ... and a relevant date"** is what makes Phase 3's per-file origin headers a
   licence obligation rather than a nicety. Phase 1 should put the header template into `VENDOR.md` so Phase 3
   has no room to improvise.

### The archive mechanism — tested against this repository

```bash
SHA=$(git rev-parse HEAD)
git archive --format=tar.gz --prefix="hangar-${SHA:0:7}/" -o "build/source-${SHA}.tar.gz" HEAD
```

Verified on this machine (git 2.53.0.windows.2) against `hangar` at `45dd692`: produced a 138 KB gzip with a
`hangar-45dd692/` prefix and 20 entries. `node_modules/`, `build/` and `.svelte-kit/` are excluded **by
construction** — `git archive` only emits tracked paths, and all three are gitignored.

Two things the plan must handle:

- **`git archive HEAD` archives the commit, not the working tree.** A build from a dirty tree ships an archive
  that does not match the bytes served. The deploy script must refuse to run when `git status --porcelain` is
  non-empty. This is the single most likely way to ship a non-compliant deploy without noticing.
- **`.planning/` is currently tracked and would be published.** The archive as tested contains the entire
  roadmap, requirements, research and the discussion log — including the un-set embargo date and internal
  notes about unreleased hardware. Since planning markdown is not "source code needed to generate, install or
  run the object code", excluding it is licence-safe. Add a committed `.gitattributes`:

  ```gitattributes
  .planning/ export-ignore
  .claude/   export-ignore
  CLAUDE.md  export-ignore
  ```

  and verify with `tar tzf` that the resulting archive contains no `.planning/` entry. **Do not skip the
  verification** — `export-ignore` silently does nothing if the `.gitattributes` is not committed.

### Getting the SHA onto the page

Recommended: **Vite `define`**, computed in `vite.config.ts`.

```ts
import { execSync } from 'node:child_process';

function git(cmd: string) {
  try { return execSync(cmd, { encoding: 'utf8' }).trim(); } catch { return ''; }
}
const COMMIT_SHA = git('git rev-parse HEAD') || 'unknown';
const BUILD_DIRTY = git('git status --porcelain').length > 0;
// ... define: { __COMMIT_SHA__: JSON.stringify(COMMIT_SHA), __BUILD_DIRTY__: JSON.stringify(BUILD_DIRTY) }
```

with `declare const __COMMIT_SHA__: string; declare const __BUILD_DIRTY__: boolean;` inside the
`declare global` block of `src/app.d.ts`.

Why this over the alternatives:

- It works identically in `vite dev`, `vite build` and under Vitest — no environment plumbing, no `cross-env`,
  nothing that breaks between PowerShell and Git Bash on this Windows machine.
- `$env/static/public` (`PUBLIC_COMMIT_SHA`) is the more "SvelteKit-idiomatic" answer, but a missing
  `PUBLIC_*` variable is a hard build error, so a plain `npm run build` outside the deploy script would fail.
  It is a valid alternative **if** the plan makes the variable's presence unconditional.
- **Keep the dirty flag separate from the SHA string.** If `-dirty` is appended to `__COMMIT_SHA__`, the
  footer link points at `source-<sha>-dirty.tar.gz`, which never exists, and the smoke test fails on every
  developer machine with an unsaved file. With two constants, the link always resolves, the page can say
  "built from uncommitted changes" in dev, and the deploy gate guarantees `__BUILD_DIRTY__` is false in
  production.

### Where the licence files live and how they reach `build/`

Canonical copies at the repo root (`LICENSE`, `THIRD-PARTY.md`, `licenses/`) so the source archive and any
future repo browser see them. A postbuild step copies them into `build/`:

```jsonc
"build": "vite build && node scripts/postbuild.mjs"
```

`scripts/postbuild.mjs` copies `LICENSE`, `THIRD-PARTY.md` and `licenses/` into `build/`, and writes
`build/source-<sha>.tar.gz`. Doing it in `build` rather than `deploy` means a plain `npm run build` produces a
complete artifact, so the Playwright assertions on `/LICENSE` and `/source-<sha>.tar.gz` are meaningful
locally and identical in CI-less deploys.

The alternative — putting the files in `static/` — also works and is one fewer script, but duplicates
`LICENSE` in two places in the repo and puts the generated `THIRD-PARTY.md` inside a directory the formatter
already ignores. Either is defensible; the postbuild copy keeps a single canonical copy of each file.

---

## Third-Party Notices

`@wasm-fmt/lua_fmt` is **MIT** — verified two ways: `"license": "MIT"` in its shipped `package.json`, and its
`LICENSE` file is the MIT text, `Copyright (c) 2024 wasm-fmt`. (Its README credits StyLua, which is MPL-2.0
upstream; the WASM binary is a StyLua build. The package's own declared licence is MIT and that is what the
notices file reports. Worth one line of attribution to StyLua in the notices header — cheap, honest, and MPL
attribution is the kind of thing that costs nothing now and is embarrassing later.)

### The trap: grid-protocol has no machine-readable licence

Verified empirically. `@intechstudio/grid-protocol@1.20260825.1135`'s `package.json` has **no `license`
field**. Consequently its `package-lock.json` entry has no `license` key either:

```jsonc
"node_modules/@intechstudio/grid-protocol": {
  "version": "1.20260825.1135",
  "resolved": "https://registry.npmjs.org/@intechstudio/grid-protocol/-/grid-protocol-1.20260825.1135.tgz",
  "integrity": "sha512-aRucpaz8XBMze1s3Vhx8lhpMsSwvsxjrs8MpB7yXkT+kcKItfrOY2/Qd1CqFubu2xJI0YI73UxyZM8IDDkyWrQ==",
  "dependencies": { "@wasm-fmt/lua_fmt": "^0.2.0" }
},
"node_modules/@wasm-fmt/lua_fmt": { "version": "0.2.0", "...": "...", "license": "MIT" }
```

A notices generator that reads the lockfile — the obvious hand-rolled approach — would omit or blank the one
entry FOUND-04 names explicitly. Its GPLv3 status is only discoverable by reading
`node_modules/@intechstudio/grid-protocol/LICENSE` (confirmed: "GNU GENERAL PUBLIC LICENSE Version 3").

### Recommendation: `license-checker-rseidelsohn@5.0.1`

It reads LICENSE files, not just the `license` field, and it gets the load-bearing case right. Run against a
real install of the pinned tree in a scratch project today:

```
$ npx license-checker-rseidelsohn@5.0.1 --production --json
{
  "@intechstudio/grid-protocol@1.20260825.1135": {
    "licenses": "GPL-3.0*",                       <-- '*' means "inferred from the LICENSE file"
    "repository": "https://github.com/intechstudio/grid-protocol",
    "publisher": "intech studio",
    "licenseFile": ".../node_modules/@intechstudio/grid-protocol/LICENSE"
  },
  "@wasm-fmt/lua_fmt@0.2.0": { "licenses": "MIT", "repository": "https://github.com/wasm-fmt/lua_fmt", ... }
}

$ npx license-checker-rseidelsohn@5.0.1 --production --markdown --relativeLicensePath --excludePackages hangar
- [@intechstudio/grid-protocol@1.20260825.1135](https://github.com/intechstudio/grid-protocol) - GPL-3.0*
- [@wasm-fmt/lua_fmt@0.2.0](https://github.com/wasm-fmt/lua_fmt) - MIT
```

Useful flags (verified from `--help`): `--production`, `--json`, `--markdown`, `--out <file>`,
`--files <dir>` (copies every licence file out as `name@version-LICENSE.txt`), `--relativeLicensePath`,
`--excludePackages <list>`, `--onlyAllow <semicolon-list>` (exits non-zero on a licence outside the list —
tested, it correctly rejected `GPL-3.0*` when only `MIT` was allowed), `--failOn`, `--summary`.

The production tree is exactly two packages, so the notices file is short. Do **not** use `--development`: the
dev toolchain is not conveyed to visitors and listing 400 build-time packages buries the two that matter.

**Wrap it in `scripts/gen-licenses.mjs`** — about 40 lines — that:

1. runs the checker with `--production --json`,
2. drops the root package,
3. asserts `@intechstudio/grid-protocol` is present and its licence string starts with `GPL-3.0` (fail loudly
   if upstream ever adds a `license` field that says something else),
4. asserts every remaining licence is in an allowlist (`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`,
   `ISC`, `GPL-3.0*`) so a GPL-incompatible dependency cannot slip in unnoticed,
5. writes `THIRD-PARTY.md` with a fixed header (project name, "HANGAR is GPLv3; see LICENSE",
   "`@intechstudio/grid-protocol` is itself GPLv3", the StyLua attribution) followed by the generated list,
6. runs the checker again with `--production --files licenses` to materialise the full licence texts.

Exposed as `"licenses": "node scripts/gen-licenses.mjs"`. Regenerate whenever dependencies change; a fast
Vitest test (§Validation Architecture) catches staleness without shelling out.

### Alternatives considered

| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| `license-checker-rseidelsohn` | `npm ls --json` + own script | No new devDependency, but you must reimplement LICENSE-file sniffing — which is precisely the part that grid-protocol needs and that is easy to get wrong |
| `license-checker-rseidelsohn` | `rollup-plugin-license@3.7.1` | Only sees what ends up in the bundle. Accurate for the conveyed object code, but needs Rollup-plugin wiring inside a Vite/SvelteKit build and misses the `.wasm` asset's provenance. Revisit in Phase 3 when the bundle actually contains grid-protocol |
| `license-checker-rseidelsohn` | `license-report@6.8.5` | HTML/markdown output oriented at reporting, weaker LICENSE-file inference |
| A generated `/licenses` route | A static `THIRD-PARTY.md` at the root | A route means the notices participate in prerendering and layout; a file is one line of script and is directly linkable from the footer. Phase 1 wants the cheapest correct thing — take the file, add the route in Phase 4 if the design calls for it |

---

## The Pin Gate (FOUND-03, D-09/D-10/D-11)

### Verified facts

- `1.20260825.1135` exists on the public registry (tarball + integrity above) and is what
  `grid-editor/package.json` declares.
- `npm i --save-exact @intechstudio/grid-protocol@1.20260825.1135` writes
  `"@intechstudio/grid-protocol": "1.20260825.1135"` into `dependencies` — a bare exact string with no range
  operator. Confirmed by running it.
- `package-lock.json` is `lockfileVersion: 3`. The resolved version lives at
  `packages["node_modules/@intechstudio/grid-protocol"].version`. Confirmed by running it.

### `src/lib/protocol-pin.ts`

```ts
/**
 * The exact @intechstudio/grid-protocol version BOTOR's cost baseline was measured against.
 * Changing this is a reviewed decision, never a routine bump — see docs/PIN-POLICY.md.
 * Never displayed to visitors (D-12); Phase 6 reads it internally to compare firmware versions.
 */
export const PROTOCOL_PIN = '1.20260825.1135';
```

### `src/lib/protocol-pin.spec.ts`

Lands inside the scaffold's server project glob (`src/**/*.{test,spec}.{js,ts}`, `environment: 'node'`), so no
config change is needed. Reads the files rather than importing them, so it is independent of
`resolveJsonModule` and of the Vite fs allow-list.

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PROTOCOL_PIN } from './protocol-pin';

const PKG = '@intechstudio/grid-protocol';
const root = (file: string) => new URL(`../../${file}`, import.meta.url);
const json = (file: string) => JSON.parse(readFileSync(root(file), 'utf8'));

describe('grid-protocol pin', () => {
  const declared: string | undefined = json('package.json').dependencies?.[PKG];
  const resolved: string | undefined =
    json('package-lock.json').packages?.[`node_modules/${PKG}`]?.version;

  it('is declared in package.json with no range operator', () => {
    expect(declared, `${PKG} is missing from dependencies`).toBeDefined();
    // ^ ~ > < = * x, hyphen ranges and || are all forbidden. Only a literal version passes.
    expect(declared).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('declares exactly the pinned version', () => {
    expect(declared).toBe(PROTOCOL_PIN);
  });

  it('is installed at exactly the pinned version', () => {
    expect(resolved, 'run `npm ci` — the lockfile has no entry for the package').toBeDefined();
    expect(resolved).toBe(PROTOCOL_PIN);
  });

  it('pins the version BOTOR measured its cost baseline against', () => {
    // Hard-coded on purpose. A bump must edit this literal, package.json and the lockfile in one commit.
    expect(PROTOCOL_PIN).toBe('1.20260825.1135');
  });
});
```

The fourth test is the one that makes an `npm update` impossible to pass quietly: the first three would all
agree with each other after a bump, the fourth would not.

**D-11 hook (Phase 3 fills it).** Add to the same file:

```ts
// The cost-baseline half of the bump gate arrives with the vendored compiler in Phase 3.
it.todo('every catalog preset compressScript cost is byte-identical to the recorded baseline');
```

and write `docs/PIN-POLICY.md` stating the rule in prose: the pin only moves when (a) the vendored suite is
green and (b) every preset's `compressScript` cost is byte-identical to the baseline, and a moved cost is a
written decision. Also record the tested firmware range there or in `VENDOR.md` — internal only, never
rendered (D-12).

### `optimizeDeps.exclude` — add it now, even though nothing imports the package

```ts
optimizeDeps: { exclude: ['@intechstudio/grid-protocol'] }
```

Lifted from `grid-editor/renderer.vite.config.mjs:38-39` (confirmed present on disk). It keeps
`@wasm-fmt/lua_fmt`'s `new URL('lua_fmt_bg.wasm', import.meta.url)` resolving against the real module URL so
Vite emits the 628 KB `.wasm` as a hashed asset. Adding it in Phase 1 costs nothing and removes a debugging
session from Phase 3. The escape hatch, if it still misresolves under Vite 8:
`resolve: { alias: { '@wasm-fmt/lua_fmt': '@wasm-fmt/lua_fmt/vite' } }` — the package ships that subpath
(`"./vite": "./lua_fmt_vite.js"`, confirmed in its `exports` map).

---

## Architecture Patterns

### Recommended structure at the end of Phase 1

```
hangar/
├── .dev.vars                  # gitignored — SITE_USER / SITE_PASSWORD for wrangler dev + playwright
├── .gitattributes             # .planning/ export-ignore  (keeps internals out of the source archive)
├── .prettierrc                # {"plugins":["prettier-plugin-svelte"]}  — grid-editor parity (D-15)
├── .prettierignore            # sv's + src/vendor/
├── LICENSE                    # GPLv3 text, "Copyright (C) 2026 Botond Sandor"  (D-04)
├── THIRD-PARTY.md             # generated by scripts/gen-licenses.mjs
├── licenses/                  # generated: full licence text per dependency
├── docs/PIN-POLICY.md         # D-11 rule in prose; tested firmware range (internal, D-12)
├── e2e/
│   └── smoke.e2e.ts           # the one Playwright test (D-14)
├── scripts/
│   ├── gen-licenses.mjs
│   ├── postbuild.mjs          # copy LICENSE + THIRD-PARTY.md + licenses/ into build/, write source archive
│   └── deploy.mjs             # clean-tree gate -> build -> wrangler deploy  (D-08)
├── src/
│   ├── app.css                # @import 'tailwindcss'; + @theme with the two identity tokens (D-13)
│   ├── app.d.ts               # declare const __COMMIT_SHA__ / __BUILD_DIRTY__
│   ├── app.html
│   ├── lib/
│   │   ├── protocol-pin.ts
│   │   └── protocol-pin.spec.ts
│   ├── vendor/botor/          # empty but present (D-16); ignored by prettier + eslint
│   │   └── VENDOR.md          # skeleton: headings, empty per-file table, sync procedure, header template
│   └── routes/
│       ├── +layout.svelte     # footer: Source link + SHA + LICENSE link  (GPLv3 §6(d) "clear directions")
│       ├── +layout.ts         # export const prerender = true;
│       └── +page.svelte       # an <h1> for the smoke test to assert on
├── static/
├── worker/index.js            # Basic Auth gate, adapted from zona-docs  (D-07)
├── wrangler.jsonc
├── vite.config.ts             # kit config lives here — no svelte.config.js
├── playwright.config.ts
├── tsconfig.json
└── package.json               # grid-protocol pinned exact
```

**Naming conflict to resolve:** `ARCHITECTURE.md` §4.2 calls the sync document `src/vendor/BOTOR-SYNC.md`;
CONTEXT D-16 says `src/vendor/botor/` with a `VENDOR.md`. CONTEXT is locked and wins. Flagging so the executor
does not "fix" it back.

### Pattern 1 — `svelte.config`-free Kit configuration

```ts
// vite.config.ts
import { execSync } from 'node:child_process';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

const git = (cmd: string) => { try { return execSync(cmd, { encoding: 'utf8' }).trim(); } catch { return ''; } };
const COMMIT_SHA = git('git rev-parse HEAD') || 'unknown';
const BUILD_DIRTY = git('git status --porcelain').length > 0;

export default defineConfig({
  define: {
    __COMMIT_SHA__: JSON.stringify(COMMIT_SHA),
    __BUILD_DIRTY__: JSON.stringify(BUILD_DIRTY)
  },
  plugins: [
    tailwindcss(),
    sveltekit({
      // Svelte-level option — stays flat, as sv generated it.
      compilerOptions: {
        runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
      },
      // Kit-level options — ALSO flat. No `kit: { ... }` wrapper in a Vite config.
      adapter: adapter({ pages: 'build', assets: 'build', fallback: '404.html', precompress: false }),
      prerender: { entries: ['*'] }
    })
  ],
  optimizeDeps: { exclude: ['@intechstudio/grid-protocol'] },
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/vendor/**']
        }
      }
    ]
  }
});
```

`adapter-static@3.0.10`'s option surface, read from its shipped `index.d.ts`, is exactly
`{ pages?, assets?, fallback?, precompress?, strict? }` with `pages` defaulting to `'build'` and `assets`
defaulting to `pages`. `fallback: '404.html'` pairs with `not_found_handling: '404-page'` in wrangler: an
unknown path returns a real 404 status and still boots the client router. (`fallback: 'index.html'` +
`not_found_handling: 'single-page-application'` is the alternative, but it returns 200 for everything, which
is wrong for a prerendered catalog and bad for the Discord unfurls SHARE-04 needs.)

Note `adapter-static` also auto-detects Vercel/Netlify/CF-Pages and warns *"Please remove adapter-static
options to enable zero-config mode"*. That detection does not fire for Workers static assets, so passing
explicit options is correct here.

### Pattern 2 — root layout: prerender yes, `ssr: false` **no**

```ts
// src/routes/+layout.ts
export const prerender = true;
export const trailingSlash = 'always';
```

STACK.md §Installation suggests adding `export const ssr = false`. **Do not do that in Phase 1.** With SSR off,
prerendered pages are an empty shell that fills in on the client — which means per-entry `<head>` content is
not in the HTML a crawler or Discord's unfurler sees. STACK.md §Decision 1's third argument for choosing
SvelteKit at all ("prerendered per-config HTML is how a Discord link gets a preview") and requirement SHARE-04
both depend on SSR being on during prerender. Phase 1 has no browser-only module-scope code, so there is
nothing to gain and a requirement to lose. If a later phase hits a `window is not defined` during prerender,
the fix is `onMount`/`browser` guards in that component, not a global `ssr = false`.

### Pattern 3 — the Basic Auth Worker (adapted from zona-docs)

`C:\Users\sabot\Documents\Claude\zona-docs\src\index.js` is the reference and its shape should be copied
essentially verbatim. Its load-bearing properties, in order:

1. **Fail closed.** `if (!expectedPass) return unauthorized();` — with no secret configured, nothing is
   reachable. This is what makes a mis-deploy safe rather than a public leak.
2. **Length-independent comparison** (`safeEqual`) so response time does not leak the secret, and both user and
   password are evaluated so a wrong username costs the same as a wrong password.
3. **`X-Robots-Tag: noindex, nofollow, noarchive`** on both the 401 and the served asset.
4. `Cache-Control: private, no-store` and `Referrer-Policy: no-referrer` on served assets.
5. `WWW-Authenticate: Basic realm="...", charset="UTF-8"`.

Adaptation for HANGAR: realm string `"HANGAR preview"`, `env.SITE_USER || 'hangar'` as the default username.
Everything else copies. Keep it as `worker/index.js` (plain JS) so no `@cloudflare/workers-types` dependency is
needed, and add the D-04 copyright header.

**One thing to add that zona-docs does not have:** the gate is removed on launch day (D-07), and the way to
make that a one-line change rather than a refactor is to put the whole check behind a single early return
driven by the presence of the secret — which the fail-closed pattern already gives you. Removing the gate then
means deleting the secret and the `run_worker_first` flag, not rewriting the Worker.

### Pattern 4 — `wrangler.jsonc`

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "hangar",
  "main": "worker/index.js",
  "compatibility_date": "2026-09-02",
  "assets": {
    "directory": "./build",
    "binding": "ASSETS",
    "run_worker_first": true,
    "not_found_handling": "404-page"
  },
  "observability": { "enabled": true }
}
```

Confirmed against Cloudflare's current docs (2026-09-02): `run_worker_first` is still the correct key, still
lives inside `assets`, defaults to `false`, and now accepts **either a boolean or an array of route patterns**
(globs with `*`, exceptions with `!`). The boolean is what D-07 wants — every request through the gate. The
array form is what launch day will use if the Worker survives the gate's removal to render OG images
(`"run_worker_first": ["/og/*"]`). `binding` exposes `env.ASSETS`; `not_found_handling` accepts
`"single-page-application"`, `"404-page"` or `"none"` (default). No deprecation of `run_worker_first` is
documented, and current docs make no mention of `experimental_serve_directly` at all.

Secrets: `.dev.vars` for local (`wrangler dev` reads it; assets are served from local disk during dev),
`npx wrangler secret put SITE_PASSWORD` for production. Cloudflare's docs are explicit that `.dev.vars*` and
`.env*` must be gitignored, and that you should use one or the other but not both.

### Pattern 5 — the deploy script (D-08)

```
npm run deploy   ->   node scripts/deploy.mjs
```

```js
// scripts/deploy.mjs — sketch
// 1. refuse a dirty tree: git status --porcelain must be empty
//    (otherwise the archive is of HEAD but the bundle is of the working tree)
// 2. refuse if git rev-parse HEAD fails
// 3. npm run build     (vite build + scripts/postbuild.mjs -> LICENSE, THIRD-PARTY.md, source-<sha>.tar.gz)
// 4. assert build/LICENSE, build/THIRD-PARTY.md and build/source-<sha>.tar.gz all exist
// 5. npx wrangler deploy
// 6. print the URL and the SHA
```

A Node script rather than an npm-script shell chain because this machine is Windows: `SHA=$(...)` and
`&&`-chained env assignment behave differently in PowerShell, cmd and Git Bash, and D-08 asks for *one* script
that works when the user runs it. `execSync` with `{ stdio: 'inherit' }` sidesteps the whole class of problem
and makes step 1's refusal a real `process.exit(1)` rather than a shell truthiness accident.

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Licence inference across the dependency tree | A lockfile walker | `license-checker-rseidelsohn@5.0.1` | The one package that matters has no `license` field. LICENSE-file sniffing with SPDX inference is the whole job, and it is already written and verified working against this exact tree |
| Producing the source archive | A tar/zip of a filtered file list | `git archive --format=tar.gz HEAD` | Exclusion by construction (only tracked paths), `export-ignore` support, deterministic, ships with git, tested on this repo today |
| Basic Auth in front of static assets | Your own base64 + comparison | Copy `zona-docs/src/index.js` | Timing-safe comparison, fail-closed on a missing secret, correct `WWW-Authenticate` and `X-Robots-Tag` headers. It is already deployed and working on this Cloudflare account |
| Serving `build/` for the browser test | A hand-rolled Node static server | `wrangler dev` (or `sirv-cli` as fallback) | `wrangler dev` serves the *same* thing production does, through the *same* Worker. A hand-rolled server would not exercise `run_worker_first`, `not_found_handling`, or the auth gate |
| Getting the SHA into the bundle | A generated-and-committed module | Vite `define` | A committed generated file is a permanently dirty tree, which then trips the deploy script's own clean-tree gate |
| A prerendered static site with per-route `<head>` | Your own HTML templating over Vite | SvelteKit + `adapter-static` | Already decided (STACK.md §Decision 1) and already proven with grid-protocol in `profile-cloud` |
| Cross-platform env vars in npm scripts | `cross-env` chains | A `.mjs` script invoked by one npm script | Fewer dependencies, no shell dialect, and the failure modes are `throw` instead of a silently-empty variable |

**Key insight:** every custom solution in this phase would be a solution to a *distribution-compliance*
problem, and compliance bugs are silent. The archive that quietly excluded the lockfile, the notices file that
quietly dropped the GPL dependency, the deploy that quietly shipped a working tree — none of them produce an
error. That is why the plan needs the assertions in §Validation Architecture more than it needs clever tooling.

---

## Common Pitfalls

### Pitfall 1: A `svelte.config.js` silently wins over the Vite config
**What goes wrong:** Someone writes `svelte.config.js` with `adapter-static` (the pattern in `profile-cloud`
and in every SvelteKit tutorial). Kit uses it and *ignores* the `sveltekit()` argument, or the other way round
depending on which one has the adapter. The build succeeds; `build/` is wrong or missing.
**Why it happens:** sv 0.17 dropped `svelte.config.js` from its templates and Kit's dual-source resolution is
recent (2.62.0). The prior art on this disk — `profile-cloud/svelte.config.js` — uses the old shape.
**How to avoid:** One config location. `vite.config.ts` only. Assert in a test that `svelte.config.js` and
`svelte.config.ts` do not exist.
**Warning signs:** Console line `svelte.config.js is ignored when options are passed via your Vite config`.
`build/` missing after `npm run build`. `.svelte-kit/output` present but no `build/`.

### Pitfall 2: `sveltekit({ kit: { ... } })`
**What goes wrong:** Kit options are silently forwarded to vite-plugin-svelte and the adapter stays
`adapter-auto`.
**Why it happens:** In a `svelte.config.js` the options *do* live under `kit`. In a Vite config they are flat.
**How to avoid:** Flat. `sveltekit({ adapter, prerender, alias, ... })`. `split_config()` only recognises keys
in `Object.keys(defaults.kit)` and passes everything else through without complaint.

### Pitfall 3: `delete navigator.serial` does nothing
**What goes wrong:** The degrade-path smoke test (D-14) runs
`addInitScript(() => { delete navigator.serial })`, the page still sees `'serial' in navigator === true`, and
the test passes for the wrong reason — or the install control stays enabled and nobody notices until Phase 5.
**Why it happens:** `serial` is an accessor on `Navigator.prototype`, not an own property of the `navigator`
instance. `delete navigator.serial` returns `true` and removes nothing.
**How to avoid:** delete it from the prototype (WebIDL attributes are `configurable: true`):

```ts
await context.addInitScript(() => {
  delete (Navigator.prototype as unknown as Record<string, unknown>).serial;
});
```

and **assert the removal worked** — `expect(await page.evaluate(() => 'serial' in navigator)).toBe(false)` —
before asserting anything about the UI. A degrade test that does not verify its own precondition is worse than
no test.
**Warning signs:** the test passes identically with and without the init script.

### Pitfall 4: `prettier-plugin-tailwindcss` reorders class attributes
**What goes wrong:** sv installs it automatically when Tailwind and Prettier are both selected. It rewrites
`class="..."` attribute ordering on every format. Applied to a vendored `.svelte` file, every class attribute
diverges from BOTOR permanently.
**How to avoid:** uninstall it, and keep `.prettierrc` to grid-editor's single-plugin list.

### Pitfall 5: `vite preview` is claimed as "the static build"
Covered in Correction 3. The specific trap for the verifier: `npm run build && npm run preview` **works** and
serves a site that looks right, so a manual check passes while criterion 4 is unmet.

### Pitfall 6: a dirty working tree at deploy time
**What goes wrong:** `git archive HEAD` archives the commit; Vite bundles the working tree. The served archive
does not correspond to the served bundle — which is exactly the thing §6(d) requires.
**How to avoid:** `scripts/deploy.mjs` exits non-zero when `git status --porcelain` is non-empty. Do not make
this a warning.

### Pitfall 7: the source archive publishes `.planning/`
**What goes wrong:** the archive as tested contains the entire roadmap, the embargo discussion and internal
notes about unreleased hardware. On launch day that becomes a public download.
**How to avoid:** committed `.gitattributes` with `export-ignore`, plus a test that lists the archive and
asserts no `.planning/` entry. `export-ignore` fails silently if the `.gitattributes` is uncommitted.

### Pitfall 8: the scaffolder overwrites the existing `.gitignore`
**What goes wrong:** `.claude/worktrees/`, `.claude/settings.local.json` and `dist/` disappear from the ignore
list and Claude session artifacts start showing up in `git status` — and, worse, in the source archive.
**How to avoid:** copy the current `.gitignore` aside before running `sv create`, then write the union.

### Pitfall 9: sv's demo routes ship
`src/routes/demo/` and `src/lib/vitest-examples/` prerender into `build/` and get deployed. Delete them in the
same task that runs the scaffolder, not "later".

### Pitfall 10: `engine-strict=true`
sv writes `.npmrc` with `engine-strict=true`. If the plan also adds `"engines": { "node": ">=24" }`, then
`npm install` **hard-fails** on any other Node. That is probably what you want on a one-machine project (it
makes the Node pin real), but it must be a deliberate choice, not a surprise. Local Node is 24.14.0;
`@sveltejs/vite-plugin-svelte@7.3.0` requires `^20.19 || ^22.12 || >=24`. Recommend
`"engines": { "node": ">=24.0.0" }` plus a `.nvmrc` containing `24`.

### Pitfall 11: `static/robots.txt` allows everything
sv's template ships `User-agent: * / Disallow:` — allow all. Harmless while the Worker gate returns 401 to
everything and sets `X-Robots-Tag: noindex`, and correct after launch. But it is worth one line in the plan so
nobody assumes the site is noindexed by robots.txt when it is actually noindexed by the Worker header.

---

## Code Examples

### `playwright.config.ts` — against the real static build, through the real Worker

```ts
import { readFileSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// Single source of truth for the local gate password: the same .dev.vars wrangler dev reads.
function devVars(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync('.dev.vars', 'utf8')
        .split(/\r?\n/)
        .filter((l) => l.trim() && !l.startsWith('#'))
        .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
  } catch { return {}; }
}
const vars = devVars();

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    httpCredentials: {
      username: vars.SITE_USER ?? 'hangar',
      password: vars.SITE_PASSWORD ?? ''
    }
  },
  webServer: {
    // wrangler dev serves ./build from disk through worker/index.js, exactly as production does.
    command: 'npm run build && npx wrangler dev --port 4173 --ip 127.0.0.1',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
```

Three facts that make this work, all verified against current docs:

- Playwright's `webServer.url` readiness probe accepts **2xx, 3xx, 400, 401, 402 or 403**. The Basic Auth 401
  is explicitly an acceptable "server is up" signal, so the gate does not need a bypass.
- `port` is deprecated in favour of `url`; sv generates `port: 4173`, so this is a rewrite, not an addition.
- `--ip 127.0.0.1` rather than the default `localhost` avoids the Node-17+ IPv6 resolution trap that
  `profile-cloud/vite.config.ts` already documents in a comment on this same machine.

### `e2e/smoke.e2e.ts` — D-14, plus the licence assertions

```ts
import { expect, test } from '@playwright/test';

test.describe('static build, no Web Serial', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      // `serial` is an accessor on Navigator.prototype — deleting it off the instance is a no-op.
      delete (Navigator.prototype as unknown as Record<string, unknown>).serial;
    });
  });

  test('the page renders with the capability removed', async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => 'serial' in navigator)).toBe(false); // precondition, asserted
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('licence, notices and source archive are served from the site root', async ({ page, request }) => {
    await page.goto('/');
    const sha = await page.getByTestId('commit-sha').innerText();
    expect(sha).toMatch(/^[0-9a-f]{40}$/);

    for (const path of ['/LICENSE', '/THIRD-PARTY.md', `/source-${sha}.tar.gz`]) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
    expect(await (await request.get('/LICENSE')).text()).toContain('GNU GENERAL PUBLIC LICENSE');
    expect(await (await request.get('/THIRD-PARTY.md')).text()).toContain('@intechstudio/grid-protocol');
  });
});
```

This is one Playwright spec covering criterion 1's archive, criterion 2's files and criterion 4's harness at
once, and it is the same harness the Phase 5 degrade tests will extend.

### The Worker (shape, adapted from zona-docs — read-only reference, do not modify that repo)

```js
// worker/index.js
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
//
// Every request runs through here first (assets.run_worker_first = true), so no asset
// bypasses the gate.  SITE_USER / SITE_PASSWORD are Worker secrets:
//   npx wrangler secret put SITE_PASSWORD
// Locally they come from .dev.vars (gitignored).

function unauthorized() {
  return new Response('Authentication required.\n', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="HANGAR preview", charset="UTF-8"',
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow, noarchive'
    }
  });
}

// Length-independent comparison, so response time does not leak the secret.
function safeEqual(a, b) { /* copy zona-docs verbatim */ }

export default {
  async fetch(request, env) {
    const expectedUser = env.SITE_USER || 'hangar';
    const expectedPass = env.SITE_PASSWORD;
    if (!expectedPass) return unauthorized();               // fail closed
    // ...parse Authorization: Basic, evaluate BOTH comparisons, then:
    const asset = await env.ASSETS.fetch(request);
    const res = new Response(asset.body, asset);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.headers.set('Cache-Control', 'private, no-store');
    res.headers.set('Referrer-Policy', 'no-referrer');
    return res;
  }
};
```

### Footer — GPLv3 §6(d) "clear directions next to the object code"

```svelte
<!-- src/routes/+layout.svelte (fragment) -->
<footer>
  <a href="/LICENSE">GPLv3</a>
  <a href="/THIRD-PARTY.md">Third-party notices</a>
  <a href="/source-{__COMMIT_SHA__}.tar.gz" download>Source</a>
  <code data-testid="commit-sha">{__COMMIT_SHA__}</code>
  {#if __BUILD_DIRTY__}<span>(built from uncommitted changes)</span>{/if}
</footer>
```

`data-testid="commit-sha"` exists so the smoke test can read the SHA and derive the archive URL rather than
hard-coding it.

---

## State of the Art

| Old approach (still in prior art on this disk) | Current approach | When it changed | Impact here |
|---|---|---|---|
| `svelte.config.js` holds `kit: { adapter, prerender }` (`profile-cloud/svelte.config.js`) | Kit options passed flat to `sveltekit()` in `vite.config.ts`; `svelte.config.js` ignored if both exist | `@sveltejs/kit` 2.62.0; `sv` 0.17 templates stopped emitting `svelte.config.js` | The whole of Correction 1. Do not copy `profile-cloud`'s config shape |
| `create-svelte` | `sv create` | sv replaced create-svelte | Already reflected in STACK.md |
| Separate `vitest.config.ts` | `test.projects` inside `vite.config.ts`, `defineConfig` imported from `vitest/config` | Vitest 3 -> 4 projects rework; sv's add-on writes it this way | The pin test needs no config of its own — it lands in the existing `server` project glob |
| Cloudflare **Pages** for a static site | Cloudflare **Workers static assets** | Cloudflare's own docs steer new projects to Workers | Already decided (D-05) |
| Playwright `webServer.port` | `webServer.url` | `port` now documented as deprecated | Rewrite sv's generated config |
| `experimental_serve_directly` | `assets.run_worker_first` (boolean **or** array of route patterns) | Workers static assets GA | D-07's boolean is current; the array form is the launch-day path |
| TypeScript 7 is `latest` | Svelte toolchain still caps at 6 | TS 7.0.2 published 2026-07-08 | Do not `npm i typescript@latest`. sv already pins `^6.0.3` |

**Deprecated / do not use:**

- `@sveltejs/adapter-static@4.0.0-next.*` — for Kit 3, which is prerelease.
- `@sveltejs/kit@3.0.0-next.*` — prerelease.
- `prettier-plugin-tailwindcss` in this project — conflicts with D-15.
- The `CLAUDE.md` one directory up (`C:\Users\sabot\Documents\Claude\CLAUDE.md`) describes a different project
  (Intech Studio Marketing Dashboard — Next.js, Recharts, Google Sheets). None of it applies to HANGAR. Use
  `hangar/CLAUDE.md`.

---

## Environment Availability

Probed on this machine, 2026-09-02.

| Dependency | Required by | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | everything | ✓ | 24.14.0 | — (satisfies `>=24`) |
| npm | everything | ✓ | 11.9.0 | — |
| git | source archive, SHA embed | ✓ | 2.53.0.windows.2 | — (`--format=tar.gz` verified working) |
| npm registry reachable | install, pin verification | ✓ | — | — |
| `@intechstudio/grid-protocol@1.20260825.1135` | FOUND-03 | ✓ | published; tarball + integrity confirmed | — |
| Cloudflare account auth | `wrangler deploy` | ✓ | OAuth config present at `%APPDATA%/xdg.config/.wrangler/config/default.toml` | Verify with `npx wrangler whoami` before the first deploy |
| `wrangler` binary | deploy + Playwright harness | ✗ (not installed) | — | Installs as a devDependency in step 3 |
| **Playwright browsers** | D-14 smoke test | **✗** | `%LOCALAPPDATA%/ms-playwright` does not exist | **`npx playwright install chromium` — ~150 MB, must be an explicit plan task** |
| `gh` CLI | GitHub remote | ✗ | — | Not needed. D-01 says push with the stored credential; `git credential.helper = manager` (Windows Credential Manager) is configured |
| git remote `origin` | D-01 | ✗ (`git remote -v` is empty) | — | `git remote add origin https://github.com/sabotond-dev/hangar.git` is a plan task. The repo must already exist and be **private** on GitHub |
| Sibling reference repos | copying configs | ✓ | `zona-docs`, `grid-editor`, `profile-cloud` all present | Read-only |

**Missing with no fallback:** none.
**Missing with fallback:** Playwright browsers (one command, but a large download — budget time for it);
wrangler (devDependency); the GitHub remote (one command, but the remote repo must exist first).

**Repo state notes for the planner:**

- Branch is `master`, not `main`. HEAD is `45dd692`. Committer identity is per-repo:
  `Botond Sandor <botond.sandor@intech.studio>`. D-04 says the copyright line is **personal** — so the
  `LICENSE` header should read `Copyright (C) 2026 Botond Sandor` with no Intech email. Worth confirming with
  the user rather than inferring (see Open Questions).
- The tree currently has one modified file (`.planning/config.json`). The deploy script's clean-tree gate will
  refuse until it is committed — which is correct behaviour, not a bug.

---

## Validation Architecture

Nyquist validation is enabled (`workflow.nyquist_validation: true` in `.planning/config.json`).

### Test Framework

| Property | Value |
|----------|-------|
| Unit framework | Vitest 4.1.11 (sv requests `^4.1.8`) |
| Unit config file | `vite.config.ts` -> `test.projects[0]` (`name: 'server'`, `environment: 'node'`) — **no separate `vitest.config.ts`** |
| Unit include glob | `src/**/*.{test,spec}.{js,ts}` |
| Browser framework | Playwright 1.62.1 (sv requests `^1.60.0`) |
| Browser config file | `playwright.config.ts` (`testDir: 'e2e'`, `testMatch: '**/*.e2e.ts'`) |
| Browser harness | `npm run build && npx wrangler dev --port 4173 --ip 127.0.0.1` serving `./build` through `worker/index.js` |
| Quick run (per task commit) | `npm run test:unit -- --run` — the unit project only, sub-second |
| Full suite (per wave merge) | `npm run test:unit -- --run && npm run test:e2e` |
| Type/lint gate | `npm run check && npm run lint` |

### Success Criteria -> Verification Map

| # | Criterion (as amended by CONTEXT.md) | Type | Automated command | Exists? |
|---|---|---|---|---|
| 1a | The deployed site loads over HTTPS behind Basic Auth | **manual** | — | Human: open `https://hangar.sabotond.workers.dev`, expect a 401 challenge, enter the credential, page renders |
| 1b | A visible Source link downloads an archive of exactly the deployed commit, with the SHA shown beside it | integration | `npx playwright test e2e/smoke.e2e.ts` — reads `[data-testid=commit-sha]`, then `GET /source-<sha>.tar.gz` expecting 200 | ❌ Wave 0 |
| 1c | The archive contains the lockfile and no internal planning docs | unit | `npm run test:unit -- --run` — a test that shells `tar tzf build/source-*.tar.gz` and asserts `package-lock.json` present, no `.planning/` entry | ❌ Wave 0 |
| 1d | The deployed archive matches the deployed bundle | **gate, not test** | `scripts/deploy.mjs` exits 1 when `git status --porcelain` is non-empty | ❌ Wave 0 |
| 2a | GPLv3 `LICENSE` served from the site root | integration | Playwright: `GET /LICENSE` is 200 and body contains `GNU GENERAL PUBLIC LICENSE` | ❌ Wave 0 |
| 2b | A third-party notices file served from the site root | integration | Playwright: `GET /THIRD-PARTY.md` is 200 | ❌ Wave 0 |
| 2c | `@intechstudio/grid-protocol`'s own GPLv3 is listed | unit | `npm run test:unit -- --run` — asserts `THIRD-PARTY.md` contains `@intechstudio/grid-protocol` with a `GPL-3.0` token, and `@wasm-fmt/lua_fmt` with `MIT` | ❌ Wave 0 |
| 2d | The notices file is not stale | unit | Same test file: every production package in `package-lock.json` appears in `THIRD-PARTY.md` | ❌ Wave 0 |
| 3a | Pinned exact, no caret | unit | `npm run test:unit -- --run` — `src/lib/protocol-pin.spec.ts`, `expect(declared).toMatch(/^\d+\.\d+\.\d+$/)` | ❌ Wave 0 |
| 3b | package.json, lockfile and `PROTOCOL_PIN` all agree (D-10) | unit | same file, three assertions | ❌ Wave 0 |
| 3c | A bump cannot pass silently | unit | same file, the hard-coded `expect(PROTOCOL_PIN).toBe('1.20260825.1135')` | ❌ Wave 0 |
| 3d | A bump must clear the cost-baseline gate (D-11) | **deferred to Phase 3** | `it.todo(...)` placeholder + `docs/PIN-POLICY.md` | ❌ Wave 0 (placeholder only) |
| 4a | A static build is produced | unit | `npm run build` then a test asserting `build/index.html`, `build/404.html`, `build/LICENSE`, `build/THIRD-PARTY.md`, `build/source-<sha>.tar.gz` all exist | ❌ Wave 0 |
| 4b | It previews with no application server | integration | The Playwright `webServer` is `wrangler dev` over `./build` — no SvelteKit runtime, no Node server. **Also assert `svelte.config.js` and `svelte.config.ts` do not exist**, so nobody re-introduces the ignored-config trap | ❌ Wave 0 |
| 4c | Both runners execute against that build | integration | `npm run test:unit -- --run && npm run test:e2e` both green | ❌ Wave 0 |
| D-14 | Degrade path: no `navigator.serial` | integration | Playwright with `delete Navigator.prototype.serial` in `addInitScript`, asserting `'serial' in navigator === false` **and then** that the page renders | ❌ Wave 0 |
| D-15 | Formatting parity with grid-editor ("vendor canary") | unit | Copy one BOTOR file (e.g. `grid-editor/src/renderer/main/zona/_pad.ts`) to a temp path, run `npx prettier --check <temp>`, assert zero diff, delete. Proves a Phase 3 vendored file survives `npm run format` unchanged | ❌ Wave 0 |
| D-07 | The gate actually gates | integration | Playwright request without credentials returns 401 with `WWW-Authenticate: Basic` and `X-Robots-Tag: noindex` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:unit -- --run` (pin, licence-file, archive-content, build-artifact and
  config-shape assertions — all pure filesystem reads, well under a second)
- **Per wave merge:** `npm run check && npm run lint && npm run test:unit -- --run && npm run test:e2e`
- **Phase gate:** full suite green, then the two manual checks (deployed HTTPS URL behind Basic Auth; Source
  link actually downloads a valid gzip) before `/gsd:verify-work`

### Manual-only, and why

| Check | Why it cannot be automated here |
|---|---|
| The deployed `https://hangar.sabotond.workers.dev` loads behind Basic Auth | Requires a real deploy against the real Cloudflare account. `wrangler dev` proves the Worker logic; only a deploy proves the account, the subdomain and the secret |
| The Source link, clicked in a browser, downloads a file that opens | Playwright proves the 200 and the byte length; "opens in the user's archive tool" is a human check, once |
| `npx wrangler secret put SITE_PASSWORD` succeeded | Interactive prompt; verify with `npx wrangler secret list` |

### Wave 0 Gaps

Everything is a gap — this is the first phase and there is no test infrastructure at all.

- [ ] Framework install: `npx sv@0.17.0 create ... --add ... vitest=usages:unit playwright ...` then `npm install`
- [ ] `npx playwright install chromium` — browsers are not on this machine
- [ ] `vite.config.ts` — `test.projects[0]` server project (sv generates it; verify, don't rewrite)
- [ ] `playwright.config.ts` — rewrite sv's `webServer`/`port` to `wrangler dev` + `url`, `testDir: 'e2e'`
- [ ] `.dev.vars` + `.gitignore` entry — the Playwright harness needs the gate password
- [ ] `src/lib/protocol-pin.ts` + `src/lib/protocol-pin.spec.ts` — covers 3a, 3b, 3c, and the 3d placeholder
- [ ] `src/lib/build-artifacts.spec.ts` (or similar) — covers 1c, 2c, 2d, 4a, 4b
- [ ] `src/lib/format-parity.spec.ts` — the D-15 vendor canary
- [ ] `e2e/smoke.e2e.ts` — covers 1b, 2a, 2b, 4c, D-14, D-07
- [ ] `scripts/postbuild.mjs`, `scripts/gen-licenses.mjs`, `scripts/deploy.mjs`
- [ ] Delete `src/routes/demo/**` and `src/lib/vitest-examples/**` before they are prerendered

---

## Open Questions

1. **Copyright attribution string on `LICENSE` and file headers.**
   - What we know: D-04 says "Botond Sandor, personal". The repo's committer identity is
     `Botond Sandor <botond.sandor@intech.studio>` (an Intech address).
   - What's unclear: whether the header should carry an email at all, and if so which one.
   - Recommendation: `Copyright (C) 2026 Botond Sandor` with no email — unambiguous, matches "personal", and
     avoids implying Intech ownership of a personal project. Confirm in one line before writing 20 files.

2. **`static/` vs postbuild copy for `LICENSE` / `THIRD-PARTY.md`.**
   - What we know: both work. Postbuild keeps one canonical copy per file; `static/` is one fewer script.
   - Recommendation: postbuild, because the archive should contain the root copies and the generated notices
     file should not live inside a directory the formatter already ignores. Low stakes either way.

3. **Does the archive need `.claude/` excluded as well as `.planning/`?**
   - What we know: `.gitignore` already excludes `.claude/worktrees/` and `.claude/settings.local.json`, so
     nothing under `.claude/` is currently tracked. `export-ignore` on it is belt-and-braces.
   - Recommendation: add it to `.gitattributes` anyway; it costs one line and survives someone committing a
     `.claude/` file later.

4. **`wrangler dev` startup time in the Playwright loop.**
   - What we know: assets are served from local disk, so steady-state is fast. First run downloads workerd.
   - What's unclear: whether the 120 s webServer timeout is enough on a cold cache on this machine.
   - Recommendation: run `npx wrangler dev` once by hand during the phase before wiring it into Playwright, and
     keep `sirv-cli` documented as the fallback in `playwright.config.ts` comments.

5. **`sv create` flag names.**
   - What we know: `--template`, `--types`, `--add`, `--no-install`, `--no-dir-check`, `--no-git-check` were
     read out of sv 0.17.0's bundled CLI code. `--install <agent>` appears in the CLI's own "to skip prompts
     next time" output but is not visibly registered as an option in the same file.
   - Recommendation: first command of the first task is `npx sv@0.17.0 create --help`; treat this document's
     invocation as a strong prior, not gospel.

6. **`prettier@3.6.2` exact vs sv's `^3.8.3`.**
   - What we know: Prettier ships formatting changes in minor releases; grid-editor resolves 3.6.2.
   - What's unclear: whether 3.6.2 -> 3.9.6 actually changes output for these file types.
   - Recommendation: pin 3.6.2/3.4.0 exactly *and* keep the vendor canary test. If the canary passes on newer
     versions later, the pin can be relaxed as a deliberate change with the canary as the gate — the same shape
     as the grid-protocol pin policy.

---

## Sources

### Primary (HIGH confidence)

**Published package source, read directly from registry tarballs (downloaded and extracted today):**

- `sv@0.17.0` — `dist/templates/minimal/{package.json,meta.json,files.types=typescript.json,assets/*}`,
  `dist/shared.json`, `dist/engine-B7chsCPG.mjs` (the bundled add-on definitions for prettier, eslint, vitest,
  playwright, tailwindcss, sveltekit-adapter, and the `create` command's option table)
- `@sveltejs/kit@2.70.3` — `src/exports/vite/index.js` (the `sveltekit(config)` doc comment and the
  `svelte.config.js is ignored` branch), `src/core/config/index.js` (`split_config`),
  `src/exports/vite/preview/index.js` (preview serves `.svelte-kit/output/server`)
- `@sveltejs/sv-utils@0.3.3` — `src/svelte-config.ts` (`SVELTE_CANDIDATES`, `VITE_CANDIDATES`,
  `SVELTE_LEVEL_OPTIONS`, `locate`/`edit`)
- `@sveltejs/adapter-static@3.0.10` — `index.d.ts` (option surface), `index.js` (defaults, strict-mode error)
- `prettier-plugin-svelte@4.1.1` — `package.json` peer ranges

**npm registry (`npm view`), queried 2026-09-02:** exact versions and peer ranges for `sv`, `@sveltejs/kit`,
`@sveltejs/adapter-static`, `@sveltejs/vite-plugin-svelte`, `svelte`, `vite`, `vitest`, `@playwright/test`,
`wrangler`, `typescript` (7.0.2 latest / 6.0.3 last 6.x), `tailwindcss`, `@tailwindcss/vite`, `svelte-check`,
`prettier`, `prettier-plugin-svelte`, `@types/w3c-web-serial`, `license-checker-rseidelsohn`,
`rollup-plugin-license`, `license-report`, `sirv-cli`, and `@intechstudio/grid-protocol@1.20260825.1135`
(existence, tarball URL, integrity hash).

**Empirical, run on this machine today:**

- `npm i --save-exact @intechstudio/grid-protocol@1.20260825.1135` in a scratch project — produced the exact
  `package.json` string and the lockfileVersion-3 entry shapes quoted above, and confirmed
  `@wasm-fmt/lua_fmt@0.2.0` / `MIT` as the only transitive dependency
- `license-checker-rseidelsohn@5.0.1 --production --json` / `--markdown` / `--onlyAllow` against that tree —
  outputs quoted verbatim
- `git archive --format=tar.gz --prefix=... -o ... HEAD` against `hangar@45dd692` — 138 KB, 20 entries,
  `.planning/` present (hence the `export-ignore` recommendation)
- `node --version` 24.14.0, `npm --version` 11.9.0, `git --version` 2.53.0.windows.2, `gh` absent,
  `%LOCALAPPDATA%/ms-playwright` absent, `%APPDATA%/xdg.config/.wrangler/config/default.toml` present

**GNU (`https://www.gnu.org/licenses/gpl-3.0.txt`)** — GPLv3 §1 "Corresponding Source", §5(a)/(b), §6(a)–(e);
§6(d) quoted verbatim.

**Cloudflare Workers docs (`developers.cloudflare.com`), 2026-09-02** —
`workers/static-assets/routing/worker-script/` (`run_worker_first` boolean or route array, `binding`, pairing
with `not_found_handling`), `workers/wrangler/configuration/` (`assets` key definitions and accepted values,
`main`, `compatibility_date`), `workers/wrangler/commands/workers/` (`wrangler dev --port/--ip`,
`wrangler deploy`, `wrangler secret put`), `workers/local-development/environment-variables/` (`.dev.vars`,
gitignore guidance, assets served from local disk in dev).

**Playwright docs (`playwright.dev/docs/test-webserver`)** — `webServer` options; `port` deprecated in favour
of `url`; readiness accepts 2xx/3xx/400/401/402/403.

**Sibling repositories on disk (read-only):**

- `zona-docs/src/index.js` and `zona-docs/wrangler.jsonc` — the Basic Auth gate, `run_worker_first: true`,
  `binding: "ASSETS"`, `not_found_handling: "404-page"`, `.password` gitignored, `observability.enabled`
- `grid-editor/.prettierrc` (`{"plugins":["prettier-plugin-svelte"]}`), `.prettierignore`, no `.editorconfig`;
  `package.json` (`prettier ^3.5.3`, `prettier-plugin-svelte ^3.3.3`,
  `@intechstudio/grid-protocol 1.20260825.1135`, `vitest ^4.1.0`, `"test": "vitest run"`,
  `"format": "prettier --write ."`); `node_modules/prettier` 3.6.2, `node_modules/prettier-plugin-svelte`
  3.4.0; `renderer.vite.config.mjs:38-39` (`optimizeDeps.exclude`);
  `node_modules/@intechstudio/grid-protocol/{package.json,LICENSE}` (no `license` field; GPLv3 file);
  `node_modules/@wasm-fmt/lua_fmt/{package.json,LICENSE}` (MIT, `exports` map with `./vite` and `node`)
- `profile-cloud/{svelte.config.js,vite.config.ts,package.json}` — the *old* `svelte.config.js` shape, and the
  IPv6/`localhost` comment that motivates `--ip 127.0.0.1`

**Project planning documents:** `.planning/phases/01-scaffold-licence-and-pin/01-CONTEXT.md`,
`.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/config.json`,
`.planning/research/{STACK.md, PITFALLS.md §C13 §C15, ARCHITECTURE.md §4.2}`, `hangar/CLAUDE.md`.

### Secondary (MEDIUM confidence)

- `prettier-plugin-svelte` CHANGELOG via `raw.githubusercontent.com` — v4.0.0 was a major for removing
  `svelteBracketNewLine`/`svelteStrictMode` and requiring Svelte 5, "not substantial changes to how code is
  formatted". Fetched summary rather than read line by line.
- `sv create` CLI flag names — read out of a bundled `dist/engine-*.mjs`, one indirection from source. Verify
  with `--help`.

### Tertiary (LOW confidence — flagged for validation)

- The judgement that `node_modules` need not be in the source archive. Standard practice, consistent with
  GPLv3 §1's System Libraries carve-out and with dependencies being separately available under their own
  licences, but it is an interpretation, not a quotation.
- `wrangler dev` cold-start time on this machine — never measured. Validate in-phase.

---

## Metadata

**Confidence breakdown:**

- Standard stack / versions: **HIGH** — every version re-queried from the registry today; every peer range read
  from live packuments
- Scaffolder output: **HIGH** — read out of the published `sv@0.17.0` tarball, not from documentation or memory
- Kit config location trap: **HIGH** — three independent primary sources (kit's plugin source, kit's
  `split_config`, sv-utils' resolver) agree
- `vite preview` is not `build/`: **HIGH** — the `throw new Error('Server files not found at ...')` line is in
  kit's shipped preview server
- GPLv3 obligations: **HIGH** for the quoted clauses; **MEDIUM** for the `node_modules` judgement call
- Licence tooling: **HIGH** — `license-checker-rseidelsohn` was run against a real install of the pinned tree
- Pin gate: **HIGH** — registry existence, `--save-exact` behaviour and lockfile shape all verified by running
  them
- Cloudflare Worker config: **HIGH** — current docs plus a working deployed reference implementation on the
  same account
- Playwright harness: **MEDIUM-HIGH** — config API confirmed from docs; `wrangler dev` as the webServer is a
  reasoned recommendation that has not been executed end to end on this machine
- Formatting parity: **HIGH** on what the configs are; **MEDIUM** on whether prettier 3.6.2 vs 3.9.6 changes
  output — which is exactly why the vendor canary test exists

**Research date:** 2026-09-02
**Valid until:** 2026-10-02 (30 days). `sv`, `vite` and `wrangler` all move quickly; re-verify the scaffolder
output if the phase is planned more than a month from now.
