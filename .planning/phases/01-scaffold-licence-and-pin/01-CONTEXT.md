# Phase 1: Scaffold, Licence and Pin - Context

**Gathered:** 2026-09-02
**Status:** Ready for planning

<domain>
## Phase Boundary

A deployable static SvelteKit site that exists as the shared prerequisite for both tracks: GPLv3
obligations satisfied from the first deploy, `@intechstudio/grid-protocol` pinned to the exact version
BOTOR's cost baseline was measured against and guarded by a test, Vitest and Playwright both running
against the static build, and a preview deploy on Cloudflare behind Basic Auth. No product features —
no compiler, no simulator, no catalog, no serial code. Those begin in Phases 2 and 3.

**Success criterion 1 is amended by this discussion.** ROADMAP.md says "follow a visible Source link to
the public repository at the deployed commit". The repository is now private permanently (D-02), so
the criterion reads: *A visitor can load the deployed site over HTTPS and download, from a visible
Source link, a source archive of exactly the deployed commit, with the commit SHA shown beside it.*
The other three criteria stand as written.

</domain>

<decisions>
## Implementation Decisions

### Repository and publicity
- **D-01:** The repository lives at `github.com/sabotond-dev/hangar`, the same personal account as
  BOTOR. Push with the stored `sabotond-dev` credential; no `gh` CLI on this machine.
- **D-02:** The repository stays **private permanently**. GPLv3 corresponding-source is satisfied by a
  **source archive built per deploy** and served from the site, not by a public repo. Never flip it
  public as a shortcut; that is a separate decision the user has not made.
- **D-03:** A public (un-gated) deploy is **embargoed until a calendar date the user will set**.
  Recorded as TBD; nothing in Phase 1 depends on the day, only on the gate existing. Until then every
  deploy is a gated preview (D-07).
- **D-04:** Copyright line is **Botond Sandor, personal**, on `LICENSE` and on every new file header.
  Ported files (Phase 3) keep Intech's original headers and gain an origin line (repo, path, commit).
  No Claude attribution anywhere, in commits or headers — a standing user rule.

### Hosting, domain and deploy
- **D-05:** Served from **Cloudflare Workers static assets** (not Pages, not GitHub Pages — a private
  repo rules the latter out on the free tier). A Worker sits in front so it can gate the preview now
  and render OG images for tuned stamps later.
- **D-06:** Preview URL is **`hangar.sabotond.workers.dev`**. The account's Workers subdomain is
  `sabotond`, the personal domain is `sanbotond.com` — different spellings, do not conflate. A custom
  domain is a launch-day decision and is out of scope for Phase 1.
- **D-07:** The preview is gated by **Basic Auth in the Worker**, the zona-docs pattern:
  `run_worker_first: true` so no asset bypasses the gate, password in a gitignored file and stored as a
  Worker secret via `npx wrangler secret put`, responses carry `X-Robots-Tag: noindex`. Username and
  password wording are Claude's discretion. The gate is removed on launch day, not before.
- **D-08:** Deploys are **manual `wrangler deploy` from this machine** via one npm script that builds,
  embeds the deployed commit SHA into the page, produces the source archive (D-02), and deploys. No
  GitHub Actions, no Cloudflare Git integration — consistent with Actions being disabled on the user's
  other private repos.

### Pin and bump policy
- **D-09:** `@intechstudio/grid-protocol` is pinned to **`1.20260825.1135`** — the exact version
  grid-editor@redesign uses and BOTOR's cost baseline was measured against — as an exact string in
  `package.json` (no caret, no tilde).
- **D-10:** The gate is a **Vitest test asserting three things agree**: the `package.json` string, the
  lockfile's resolved version, and a `PROTOCOL_PIN` constant exported from source. Any mismatch is red.
  An accidental `npm update` cannot pass; a deliberate bump must touch all three in one commit.
- **D-11:** A legitimate bump must additionally pass: the vendored compiler/simulator suite green AND
  every catalog preset's `compressScript` cost **byte-identical** to a recorded baseline. If a bump
  moves a single cost, it is a reviewed decision with a written reason, never a routine update. (The
  baseline file and the suite arrive in Phase 3; Phase 1 leaves the hook and documents the rule.)
- **D-12:** The tested firmware range is **never shown to visitors** — not in a footer, not at connect.
  It is internal documentation only (a note in `VENDOR.md` or the pin test).

### Scaffold tooling
- **D-13:** **Tailwind CSS v4 via `@tailwindcss/vite`** is in the scaffold. The `@theme` block carries
  the two identity tokens (true black, acid lime ~#D6FF4E) as placeholders; the real design system is
  Phase 4's job.
- **D-14:** **Playwright is set up in Phase 1** with exactly one smoke test: an init script deletes
  `navigator.serial`, the page loads, and something visible asserts. It proves the harness runs against
  the static build; the real degrade-path tests come in Phase 5.
- **D-15:** **Prettier and its plugin set match grid-editor exactly** (copy its config), so files
  vendored in Phase 3 diff cleanly against BOTOR on every re-sync. ESLint uses the `sv create` flat
  config default.
- **D-16:** Vendored BOTOR code will live in **`src/vendor/botor/`** with a **`VENDOR.md`** recording,
  per file, the source repo, path and commit SHA plus the sync procedure. Phase 1 creates the
  directory and the doc skeleton (headings, empty table); Phase 3 fills it.

### Stack (from research, confirmed by this discussion)
- **D-17:** SvelteKit 2.70.x + `@sveltejs/adapter-static` 3.0.x, Svelte 5, Vite 8, TypeScript **6.x
  (not 7 — Kit and svelte-check reject it)**, Vitest 4, `@types/w3c-web-serial`, `wrangler` 4. Scaffold
  with `npx sv create`. Vite config includes `optimizeDeps: { exclude: ["@intechstudio/grid-protocol"] }`
  (the proven grid-editor incantation) even though Phase 1 does not yet import it.

### Claude's Discretion
- Source archive mechanics: `git archive` of the deployed commit, gzipped, served as
  `/source-<sha>.tar.gz` (or equivalent), linked from the footer beside the licence link. Excludes
  `node_modules` and build output. Exact naming and whether a `THIRD-PARTY.md` is included inline or
  generated is Claude's call — but a third-party notices file **must** exist and must list
  `@intechstudio/grid-protocol` (GPLv3) and `@wasm-fmt/lua_fmt` (its own licence, check it).
- How the commit SHA reaches the page (Vite `define`, env at build, generated module).
- Basic Auth realm text, username, and how the password file is named/ignored.
- Node version pin (`.nvmrc`/`engines`) and package manager (npm, matching the sibling repos).
- How Playwright targets "the static build" (wrangler dev vs vite preview) — pick what also works for
  the future degrade tests.
- Whether `sv create`'s ESLint config is kept verbatim or trimmed.

</decisions>

<specifics>
## Specific Ideas

- "Match grid-editor exactly" for formatting — the motive is clean diffs when re-syncing vendored files
  against BOTOR, not aesthetics. Anything that reformats a ported file on first save defeats it.
- The zona-docs Worker is the reference implementation for the preview gate; reuse its shape rather
  than inventing one. It lives outside this repo at `C:\Users\sabot\Documents\Claude\zona-docs\src\index.js`.
- The user tests hardware personally and deploys personally; Phase 1 has no hardware criteria at all.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and requirements
- `.planning/PROJECT.md` — Constraints (Licensing, Hosting, Dependency) and Key Decisions rows for GPLv3 and the standalone-site choice
- `.planning/REQUIREMENTS.md` — FOUND-03 (exact pin, test-gated bump) and FOUND-04 (GPLv3, notices file, source link); the Out of Scope table
- `.planning/ROADMAP.md` §Phase 1 — goal and four success criteria (criterion 1 amended above)

### Research that decides this phase
- `.planning/research/STACK.md` §Decision 1 (framework), §Decision 4 (grid-protocol: browser-safety,
  WASM trap, `optimizeDeps.exclude`), §Decision 5 (Cloudflare Workers static assets), §Decision 6
  (Vitest node env; Web Serial not automatable; Playwright for the degrade path), §Installation,
  §Version Compatibility (TypeScript 6 vs 7)
- `.planning/research/PITFALLS.md` §C13 "GPLv3 without corresponding source" (what "ship the source"
  means for a static site: LICENSE at root, notices file, origin headers, `@wasm-fmt/lua_fmt` licence)
  and §C15 "grid-protocol pin vs firmware version" (pin policy, tested-range documentation)
- `.planning/research/ARCHITECTURE.md` §port strategy — vendor-and-adapt into a quarantined directory
  with a sync doc (why `src/vendor/botor/` exists)
- `.planning/research/SUMMARY.md` — phase-order consequences (licence + pin in the first phase)

### Reference implementations outside this repo (read-only, never modify)
- `C:\Users\sabot\Documents\Claude\zona-docs\src\index.js` — Basic Auth gate, `run_worker_first`,
  `X-Robots-Tag: noindex`; the pattern D-07 copies
- `C:\Users\sabot\Documents\Claude\zona-docs\wrangler.toml` (or `.jsonc`) — Workers static-assets config
  already working on this account
- `C:\Users\sabot\Documents\Claude\grid-editor\.prettierrc` and its `package.json` prettier plugins —
  the formatting config D-15 copies
- `C:\Users\sabot\Documents\Claude\grid-editor\renderer.vite.config.mjs` — the
  `optimizeDeps.exclude` incantation for grid-protocol
- `C:\Users\sabot\Documents\Claude\grid-editor\package.json` — the exact grid-protocol version string
  `1.20260825.1135` to pin
- `C:\Users\sabot\Documents\Claude\profile-cloud\package.json`, `svelte.config.js`, `vite.config.ts` —
  the SvelteKit + adapter-static + grid-protocol combination already proven in this ecosystem

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None in this repo yet — `hangar/` contains only `.planning/`, `.gitignore` and `CLAUDE.md`. The
  repo is initialised with a per-repo git identity (`Botond Sandor <botond.sandor@intech.studio>`);
  there is no global identity on this machine.
- zona-docs Worker (sibling repo): Basic Auth gate and static-assets deploy, copy the shape.
- grid-editor and profile-cloud (sibling repos): Prettier config, Vite `optimizeDeps` exclusion,
  SvelteKit static setup, exact dependency versions.

### Established Patterns
- Sibling repos are all Svelte 5 + Vite + npm; HANGAR matches so idioms port both ways.
- The user's other private repos have GitHub Actions disabled; deploys are manual from this machine.
- Repo files are LF in the index; CRLF warnings on commit are normal on this Windows checkout.
- `.gitignore` already excludes `node_modules/`, `dist/`, `build/`, `.svelte-kit/`, `.env*`, and
  `.claude/` session artifacts.

### Integration Points
- `src/vendor/botor/` is the seam Phase 3 fills; Phase 1 only creates it and `VENDOR.md`.
- The `PROTOCOL_PIN` constant (D-10) is the seam Phase 6's connect-time firmware comparison will read
  internally (never displayed, per D-12).
- The Worker in front of the static assets is the seam a later OG-image renderer would use.

</code_context>

<deferred>
## Deferred Ideas

- **Custom domain** — launch-day decision; the preview runs on `hangar.sabotond.workers.dev`.
- **Embargo date** — the user will set it; recorded as TBD. Add to STATE.md pending todos so it is
  asked before any un-gated deploy.
- **Removing the Basic Auth gate** — launch day, gated on the embargo date.
- **OG images for tuned stamps at request time** — the Worker makes it possible later; not Phase 1
  (per-preset build-time OG images are Phase 5, SHARE-04).
- **Firmware-range comparison at connect** — Phase 6 reads `PROTOCOL_PIN` internally; the user
  decided the range is never shown to visitors (D-12), so there is no display work anywhere.

</deferred>

---

*Phase: 01-scaffold-licence-and-pin*
*Context gathered: 2026-09-02*
