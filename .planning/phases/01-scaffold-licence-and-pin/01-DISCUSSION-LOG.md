# Phase 1: Scaffold, Licence and Pin - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-02
**Phase:** 1-scaffold-licence-and-pin
**Areas discussed:** Repository and when it goes public, Hosting/domain/deploy trigger, Pin and bump policy, Scaffold tooling choices

---

## Repository and when it goes public

| Option | Description | Selected |
|--------|-------------|----------|
| github.com/sabotond-dev/hangar | Same account as BOTOR; stored credential already works | ✓ |
| Under the intechstudio org | Official from day one; needs org access; Intech becomes licence-facing publisher | |
| Somewhere else | Different account or host | |

**User's choice:** github.com/sabotond-dev/hangar

| Option | Description | Selected |
|--------|-------------|----------|
| Private until first deploy, then public | No distribution until served; flip public with first deploy | |
| Public from the first push | BOTOR precedent; half-built site documents ZONA capabilities in the open | |
| Private through launch, source as a tarball | Repo private; GPL satisfied by a source archive linked from the site | ✓ |

**User's choice:** Private through launch, source as a tarball

| Option | Description | Selected |
|--------|-------------|----------|
| ZONA is public — no embargo | Launch whenever ready | |
| Embargoed until a date | Public deploy waits; scaffold proceeds privately | ✓ |
| Intech decides — check with them first | No public deploy until confirmed | |

**User's choice:** Embargoed until a date

| Option | Description | Selected |
|--------|-------------|----------|
| Botond Sandor, personal | Matches BOTOR; ported files keep Intech headers plus an origin line | ✓ |
| Intech Studio | Company work from the start | |
| Both, joint | Personal on new code, Intech's on ported code | |

**User's choice:** Botond Sandor, personal

### Follow-ups

| Option | Description | Selected |
|--------|-------------|----------|
| A calendar date I'll give you | Phase 1 deploys to a private preview; public deploy is a dated step | ✓ |
| Intech's public ZONA announcement | Gate is the announcement | |
| Intech's go-ahead on HANGAR itself | Gate is their approval of the site | |

**User's choice:** A calendar date I'll give you — later recorded as **TBD** ("Not fixed yet — record as TBD").

| Option | Description | Selected |
|--------|-------------|----------|
| Tarball during embargo, repo public at launch | Flip public on launch day; Source link to deployed commit | |
| Tarball permanently, repo stays private | Source archive per deploy; criterion rewords to "Source archive at the deployed commit" | ✓ |
| Undecided — tarball now, decide at launch | Keep both paths open | |

**User's choice:** Tarball permanently, repo stays private
**Notes:** Amends ROADMAP Phase 1 success criterion 1 (see CONTEXT.md domain section).

---

## Hosting, domain and deploy trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Cloudflare Workers static assets | Research pick; free unlimited static requests; same platform as zona-docs | ✓ |
| Cloudflare Pages | Simpler but steered away from by Cloudflare for new projects | |
| Something else | Netlify, Vercel, own box | |

**User's choice:** Cloudflare Workers static assets

| Option | Description | Selected |
|--------|-------------|----------|
| Basic Auth in the Worker | zona-docs pattern; run_worker_first; noindex | ✓ |
| Cloudflare Access | Zero-trust email login; redirect dance on every hardware test | |
| Unlisted URL, no auth | Obscurity only | |

**User's choice:** Basic Auth in the Worker

| Option | Description | Selected |
|--------|-------------|----------|
| Manual `wrangler deploy` from this machine | zona-docs workflow; one npm script; no CI secrets | ✓ |
| GitHub Actions on push to main | Needs CF token secret; Actions currently disabled on private repos | |
| Cloudflare Workers Builds | Cloudflare pulls and builds; archive step runs in their env | |

**User's choice:** Manual `wrangler deploy` from this machine

| Option | Description | Selected |
|--------|-------------|----------|
| workers.dev now, custom domain at launch | hangar.sabotond.workers.dev for the embargo period | ✓ |
| Subdomain of sanbotond.com now | Fix the URL early | |
| Dedicated new domain now | Buy HANGAR-branded domain | |

**User's choice:** workers.dev now, custom domain at launch

---

## Pin and bump policy

| Option | Description | Selected |
|--------|-------------|----------|
| Test asserts pin + lockfile + a named constant | Three-way agreement; bump touches all three in one commit | ✓ |
| Lockfile check only | Catches drift; intentional-looking bump slips through | |
| You decide | Claude picks mechanism | |

**User's choice:** Test asserts pin + lockfile + a named constant

| Option | Description | Selected |
|--------|-------------|----------|
| Vendored suite green + cost byte-identical | Every preset's compressScript cost matches baseline exactly | ✓ |
| Suite green + a hardware pass by you | Strictest; slows bumps to hardware availability | |
| Suite green is enough | Costs may drift | |

**User's choice:** Vendored suite green + cost byte-identical

| Option | Description | Selected |
|--------|-------------|----------|
| Shown at connect only | Non-blocking note if module firmware is outside tested range | |
| In the footer, always | Publishes firmware generation on every page | |
| Never shown | Internal documentation only | ✓ |

**User's choice:** Never shown

---

## Scaffold tooling choices

| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind v4 via @tailwindcss/vite | Two-token @theme; utilities for layout discipline | ✓ |
| Plain CSS with custom properties | Two colours barely need a framework | |
| You decide | Claude picks at planning | |

**User's choice:** Tailwind v4 via @tailwindcss/vite

| Option | Description | Selected |
|--------|-------------|----------|
| Set up now with one degrade-path smoke test | Delete navigator.serial, assert page loads | ✓ |
| Install only, no tests yet | Config present, zero tests | |
| Defer to Phase 4 | Rewrite criterion to Vitest only | |

**User's choice:** Set up now with one degrade-path smoke test

| Option | Description | Selected |
|--------|-------------|----------|
| Match grid-editor exactly | Clean diffs for vendored files on re-sync | ✓ |
| sv create defaults | Vendored files may reformat | |
| No formatter enforced | Manual discipline | |

**User's choice:** Match grid-editor exactly

| Option | Description | Selected |
|--------|-------------|----------|
| src/vendor/botor/ + VENDOR.md | Quarantined directory; per-file origin and sync procedure | ✓ |
| src/lib/zona/ as ordinary source | Simpler imports; origin tracking lost | |
| Separate workspace package | Cleanest boundary; most ceremony | |

**User's choice:** src/vendor/botor/ + VENDOR.md

---

## Done check

| Option | Description | Selected |
|--------|-------------|----------|
| I'm ready for context | Source archive recorded as Claude's discretion | ✓ |
| Discuss the source archive | User wants a say in archive contents/name/link placement | |
| Revisit an earlier area | Something wrong or incomplete | |

**User's choice:** I'm ready for context

## Claude's Discretion

- Source archive mechanics (git archive of deployed commit, gzipped, `/source-<sha>.tar.gz`, footer link beside licence; excludes node_modules and build output)
- Commit SHA embedding mechanism
- Basic Auth realm/username/password-file naming
- Node version pin and package manager (npm)
- Playwright target for "the static build"
- ESLint config trimming

## Deferred Ideas

- Custom domain — launch day
- Embargo date — TBD, user will set; add to STATE.md pending todos
- Removing the Basic Auth gate — launch day
- Request-time OG images for tuned stamps — later, via the Worker
- Firmware-range display — none anywhere (user decided never shown)
