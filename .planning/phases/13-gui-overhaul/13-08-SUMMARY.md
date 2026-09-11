---
phase: 13-gui-overhaul
plan: 08
subsystem: ui
tags:
  [
    playground,
    pdf-page-2,
    gallery,
    d-20,
    move-clean,
    address-move,
    rail-derived,
    for-labels,
    one-facet-row,
    catalog-card,
    favorite-star,
    select-sort,
    shell-fill,
    page-data,
    browse-return,
    scroll-container,
    radius-allowlist,
    e2e-re-aim,
    wrangler,
    counts,
    negative-check,
    copy-ledger,
    interrupted,
  ]
requires:
  - phase: 13-gui-overhaul
    plan: 07
    provides: "PREV_FILES 88 / PREV_TESTS 901 (+1 todo) / 78 e2e titles / 94 runs / check 608 / sweep 4 19 / catalog 26 = 8 + 18 / allowlist 13 rows, 28 declarations observed at 485c286; Intro.svelte:77's resolve('/c/[id]') to carry; SECTIONS[n].href; the crawler's /playground/ ignore to remove; the hero is Aurora; the five-chunk harness"
  - phase: 13-gui-overhaul
    plan: 06
    provides: "favorites.ts (readFavorites with a validator argument returning { ids, dropped }, toggleFavorite), recent.ts (twelve kept, listRecent shows six), the guarded store pattern"
  - phase: 13-gui-overhaul
    plan: 05
    provides: "the shell's app variant; Rail.svelte (sections, selected, onselect, note and action snippets, padCount to two digits); Nav and SECTIONS; ContextBar's three zones; layout.ts's numbers; the stacked and narrow bands"
  - phase: 13-gui-overhaul
    plan: 03
    provides: "the eleven tokens; the .type-* roles (page-title 36, micro 11 tracked uppercase)"
  - phase: 13-gui-overhaul
    plan: context
    provides: "D-01 (ask; never a corner), D-03, D-05 (the register; uppercase for short labels only), D-11 (the FOR rail, the FEELS row goes), D-14 Q11c (description on the card, quiet in the workspace), D-15 (six circles, none here), D-20 (move-clean, the user's verbatim answer)"
  - phase: 13-gui-overhaul
    plan: validation
    provides: "D-4: the rail is derived from FOR_TERMS and the count asserted as observed; D-11's eight superseded by 12-04's retirement of keys"
  - phase: 12-touch-framework
    plan: 04
    provides: "the FOR vocabulary as Phase 12 left it - seven terms, keys retired, CHORUS on play, LUMEN on still; catalog 26 = 8 + 18 (read only)"
  - phase: 12-touch-framework
    plan: 10
    provides: "tpad off the cards, trackpad on; /c/tpad/ the thirteenth dead address (read only)"
provides:
  - "THE ADDRESS, DECIDED BY THE USER AND MOVED IN ONE COMMIT (D-20, move-clean): a configuration lives at /playground/<id>/ and the gallery at /playground/; /c/<id>/ and /browse/ are gone with no forwarding page. src/routes/c/[id]/ git-moved to src/routes/playground/[id]/ with its content otherwise untouched (one prefix constant for the two it had); src/routes/browse/+page.svelte git-moved to src/routes/playground/+page.svelte. Every call site listed below moved in d2f38fd"
  - "PDF PAGE 2 AT /playground/ ON 13-05's SHELL: eyebrow, headline, sub, the search row with its 11px label and the PDF's placeholder, SORT BY as a <select>, one Use chip row (All, then one chip per FOR term) with the count at its right, the three-column card grid at the PDF's 390/24 proportions, the fidelity line; the shell filled with variant app, section playground, the breadcrumb PLAYGROUND / CONFIGURATIONS and the status line, both travelling as page data so the prerendered document carries them"
  - "THE RAIL DERIVED: src/lib/browse/rail.ts's railSections() builds YOUR LIBRARY (All configs, Favorites, Recently used with two-digit counts from the stores) and MADE FOR as FOR_TERMS.map() through FOR_LABELS - never a literal; browse-ui.spec test 7 compares member for member and prints the observed count: SEVEN. D-11's 'eight' recorded as superseded by 12-04 (2026-09-10), by name"
  - "FOR_LABELS, PROVISIONAL: src/lib/browse/labels.ts, a Record keyed exhaustively by ForTerm (Modulation, Visuals, Sequencing, Mixing, Playing, Shortcuts, Pointing), read by the rail, the chip row and the card's category line; the seven labels and the chip-versus-rail question ledgered in 13-COPY-NEW.md for 13-18"
  - "ONE FACET ROW: the FEELS row is gone (D-11); the six FEELS terms live on the card. FacetRow keeps its group/checkbox mechanics and its 44px targets, renders once, gains display labels and an All BUTTON (aria-pressed) that clears the row; the row wraps rather than truncating"
  - "THE CARD: square preview, the name as declared (uppercase until 13-19), a favorite star (a sibling button with two ledgered accessible names, writing through favorites.ts, roving with the card), MODULATION · READABLE from tags[0] through FOR_LABELS and tags[1] as itself - tags[2] nowhere, by decision - one sentence from description (D-14 Q11c), and an aria-hidden Explore box. THE ONE ACCESSIBLE NAME IS THE ANCHOR's aria-label; the whole card is the link through the anchor's overlay"
  - "THE WALL NOT REBUILT: BrowseGrid keeps its SimHost, its build observer, its one roving stop, its keyboard model and motionDeps() (line 335 in the diff context); it gained favorites / onfavorite props, section 16's empty line, and the PDF's 300px column floor"
  - "BROWSE CONTEXT SURVIVES THROUGH THE STORE THAT ALREADY DOES IT, with one honest reader: the return record reads and restores the nearest scrolling ancestor of the page (the shell's centre column in the wide and compact bands, the window below 1024) rather than window.scrollY"
  - "THREE ALLOWLIST ROWS CLEARED in the same commit: BrowseToolbar (1), CatalogCard (3), FacetRow (1) - 13 rows / 28 declarations -> 10 rows / 23 declarations; layer A 34 declarations in 58 files, layer B 34 in 10 built stylesheets, 6 of them 50%"
  - "browse-ui.spec.ts 6 -> 9: four re-aimed, one rewritten (the lime ladder -> the eleven tokens), one untouched, three new; instrument.spec.ts scan 5 re-aimed to hold A-42's index form ABSENT and the mono list at six; PILLED loses three rows. Header and Nav wrap below 768px - the app shell's first phone render"
  - "COUNTS: 88 / 904 (+1 todo) = 88 + 0 / 901 + 3 on the tree's observed 901 (the plan's 898 is stale by +3, stated once); e2e 78 titles / 94 runs unchanged, twelve browse titles in and twelve out; check 612 = 608 + 4; sweep 4 19; catalog 26 = 8 + 18 untouched"
affects:
  - "13-09 (rebuilds src/routes/playground/[id]/+page.svelte in place; calls touchRecent on open so Recently used stops reading 00; retires FrontDoor and BrowseLink's BROWSE ALL / BACK TO BROWSE strings; the workspace's og:url already reads /playground/<id>/)"
  - "13-10, 13-12 (remove /sandbox/ and /my-configs/ from vite.config.ts's ignore; the rail's + Build your own already points at SECTIONS[1].href)"
  - "13-11 (fills the shell's connection slot; the session walk's two gallery hops can then assert the slot again)"
  - "13-13 (Favorites and Recently used as a library view here; page 4's rows may want them as destinations - question 4 in the ledger)"
  - "13-18 (the seven labels, the chip-versus-rail question, the star's two names, Clear, Clear filters, the title, and six more questions)"
  - "13-20 (the counts; the thirteen dead /c/<id>/ addresses are dead the same way under /playground/, plus the 26 live /c/ links now dead - counted once here; CAT-02's qualifier: the sort is a select with the same two orders)"
tech-stack:
  added: []
  patterns:
    - "A rail's rows are derived from the vocabulary through one display-label record keyed exhaustively by the term type, so a retired or added term is a type error before it is a wrong row, and the chip row reads the same record"
    - "A page on the shell's frame reads and restores its scroll through the nearest scrolling ancestor, never window.scrollY, and the e2e that measures it reads the same element"
    - "An address move is a table of tokens with per-file counts applied by one script, dry-run first, with regex-escaped forms searched separately afterwards (two were missed by the token pass and found by grep -F)"
    - "The user's checkpoint answer is recorded verbatim with the call sites re-measured at execution and any difference from the orchestrator's numbers named"
key-files:
  created:
    - src/lib/browse/labels.ts
    - src/lib/browse/rail.ts
    - src/routes/playground/+page.ts
    - .planning/phases/13-gui-overhaul/13-08-SUMMARY.md
  modified:
    - src/routes/playground/+page.svelte (git mv from src/routes/browse/+page.svelte, rewritten)
    - src/routes/playground/[id]/+page.svelte (git mv from src/routes/c/[id]/+page.svelte, prefix constant only)
    - src/routes/playground/[id]/+page.ts (git mv from src/routes/c/[id]/+page.ts, comment only)
    - src/lib/ui/CatalogCard.svelte
    - src/lib/ui/BrowseToolbar.svelte
    - src/lib/ui/FacetRow.svelte
    - src/lib/ui/TagChip.svelte
    - src/lib/ui/BrowseGrid.svelte
    - src/lib/ui/BrowseLink.svelte
    - src/lib/ui/Coverflow.svelte
    - src/lib/ui/FrontDoor.svelte
    - src/lib/ui/intro/Intro.svelte
    - src/lib/ui/shell/shell.svelte.ts
    - src/lib/ui/shell/Header.svelte
    - src/lib/ui/shell/Nav.svelte
    - src/routes/+layout.svelte
    - src/lib/share/url.ts
    - src/lib/ui/radius-allowlist.ts
    - src/lib/ui/browse-ui.spec.ts
    - src/lib/ui/instrument.spec.ts
    - src/lib/ui/intro.spec.ts
    - src/lib/ui/shell.spec.ts
    - src/lib/config-shape.spec.ts
    - src/lib/og/build.spec.ts
    - src/lib/share/url.spec.ts
    - src/lib/browse/return.spec.ts
    - src/lib/browse/query.spec.ts
    - vite.config.ts
    - scripts/gen-og.mjs
    - e2e/browse.e2e.ts
    - e2e/browse-webkit.e2e.ts
    - e2e/session.e2e.ts
    - e2e/first-experience.e2e.ts
    - e2e/install.e2e.ts
    - e2e/tuning.e2e.ts
    - e2e/tuning-webkit.e2e.ts
    - e2e/radius.e2e.ts
    - e2e/artifacts.e2e.ts
    - docs/INSTALL-RUNBOOK.md
    - docs/SESSION-RUNBOOK.md
    - docs/TESTING.md
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
    - .planning/STATE.md
    - "and twenty-one files whose only change is a comment naming the new address (listed under 'Every /c/ and /browse/ call site')"
key-decisions:
  - "The user's routing answer, verbatim: move-clean (D-20). Recorded, not re-asked; the call sites re-measured at execution reproduce the orchestrator's 21 / 52 / 1"
  - "The MADE FOR rail is derived from FOR_TERMS at runtime and its count asserted as observed (seven); D-11's eight is superseded by 12-04's retirement of keys"
  - "One facet row; the FEELS terms are card metadata; a FEELS term arriving in the address still filters without a chip, said and ledgered"
  - "The card is the one link (the anchor's aria-label is its one name), the Explore box is aria-hidden, the star is a sibling button with two names that roves with the card, and tags[2] is not shown"
  - "Favorites and Recently used are a library view over the local stores and not in the address; the drop count is read and not rendered; Recently used reads 00 until 13-09"
  - "The return record reads the nearest scrolling ancestor, because the gallery's scroller is the shell's centre column in two of the four bands"
  - "The shell's shape travels as page data with the breadcrumb and the status, so the prerendered document carries the context bar's words"
  - "A-42's index form and the card's metadata block are retired with the Bible; instrument scan 5 holds the form absent and the mono list at six"
  - "The session walk's gallery hops assert the document and not the device slot until 13-11 fills the shell's connection slot"
  - "gsd-tools state commands not run; STATE.md by script against a copy with every touched line asserted"
patterns-established:
  - "labels.ts / rail.ts: one display-label record, one derivation, three readers"
  - "scroller(): the page's nearest scrolling ancestor as the one scroll reader"
requirements-completed: [CAT-01, CAT-02, CAT-03, CONT-03, KEEP-03, SHARE-01]
duration: 151min
completed: 2026-09-11
---

# Phase 13 Plan 08: PDF Page 2 at /playground/, and the Address the User Chose Summary

**The gallery is the Bible's page 2 on the shell, its MADE FOR rail derived from the catalog's own
seven FOR terms through a provisional label record with the count printed rather than typed, one
`Use` chip row where there were two, a card that is still one link with one accessible name and a
favorite star beside it - and a configuration lives at `/playground/<id>/` because the user answered
"move-clean" with the call-site counts in front of them, so every `/c/` and `/browse/` address in the
tree moved in one commit, listed, with `/c/` gone and nothing forwarding.**

## Performance

- **Duration:** 151 min (09:34:18Z to 12:05:00Z), interrupted once by a usage limit and resumed on
  the same tree; see "The interrupted state"
- **Started:** 2026-09-11T09:34:18Z
- **Completed:** 2026-09-11
- **Tasks:** 2 of 2 (task 01 recorded from D-20, task 02 executed)
- **Files:** 65 paths in the task commit (61 modified or renamed, 3 created, 1 rename source), plus
  `13-COPY-NEW.md`, `STATE.md` and this file in the docs commit

## Commits

| Task | Commit    | Files                                                                                                                                                                                                                                                                                    |
| ---- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01   | (none)    | The checkpoint was answered before this plan ran and is recorded in 13-CONTEXT.md D-20; nothing to commit                                                                                                                                                                                 |
| 02   | `d2f38fd` | the two route moves, `labels.ts`, `rail.ts`, `playground/+page.ts`; CatalogCard, BrowseToolbar, FacetRow, TagChip, BrowseGrid, BrowseLink, Coverflow, FrontDoor, Intro, shell.svelte.ts, Header, Nav, +layout; url.ts; radius-allowlist; nine specs; vite.config.ts; gen-og.mjs; nine e2e files; three runbooks; 21 comment-only files |

**Four commits that are not this plan's landed on the tree during it**: `b3ea115`, `91ab755`,
`8ed15ae` and `2d3f904`, all `docs(12.1)` - the other agent planning Phase 12.1 in
`.planning/phases/12.1-gradient-touch/`. None touches a file this plan touches; `.planning/ROADMAP.md`
and `STATE.md` were edited by them (12.1's lines) and by nobody here except the STATE script at the
end. `2d3f904` landed mid-run and is why `artifacts.e2e.ts` went red once (the archive's sha), exactly
as 13-07 saw; rebuilt and rerun alone. The coordinator's resume note described `8ed15ae` as
`BENCH-2026-09-11.txt` only; `git log` shows it as *"docs(12.1): the user takes 255/6 as the library
second slot"* - reported, not reconciled.

## The interrupted state, and what was discarded

The coordinator reported the process cut by a usage limit after the install chunk's first run. The
tree at that moment carried the `git mv` of both routes, ~58 modified files and the three new modules,
all uncommitted; `git status` and `git diff --stat` on resume reconciled every entry against this
transcript - 58 tracked changes plus 3 untracked new modules, every one written here, nothing
unaccounted for. **Nothing was discarded.** The only things added after the cut were the two
regex-escaped `\/c\/aurora` sites in `install.e2e.ts` and `first-experience.e2e.ts` (the token pass
cannot see an escaped form; found with `grep -F`), the second-pass e2e runs, the docs appends and
the ledger.

## The baseline, carried from 13-07, and this plan's term written out

Observed on the clean tree at `485c286` before the first edit: **88 files / 901 tests (+1 todo) / 78
e2e titles / 94 runs / check 608 / catalog 26 = 8 + 18 / sweep `4 19` / radius allowlist 13 rows, 28
declarations**. The plan carries `PREV_TESTS 898`; the tree is 901 - **the plan's figure is stale by
+3, stated once here**; the term is applied to the observed 901.

| Count            | Carried (13-07) | Observed at `485c286` | This plan                                                                                             | Observed at `d2f38fd`                                                                              |
| ---------------- | --------------- | --------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| unit files       | 88              | **88**                | **+0** (no spec file created or deleted; `labels.ts` and `rail.ts` are modules)                       | **88**                                                                                             |
| unit tests       | 898 (plan) / 901 (tree) | **901** (+1 todo) | **+3** (`browse-ui.spec.ts` 6 -> 9; `instrument.spec.ts` re-aimed at 4; `intro.spec.ts` unchanged at 4) | **904** (+1 todo, `firmware-oracle.spec.ts:209`, unmoved) - twice                                  |
| e2e titles       | 78              | **78**                | **+0 / +0** - no title added, none deleted                                                            | **78** (`grep -c "test("` summed; the pair is pasted below)                                        |
| e2e runs         | 94              | **94**                | **+0** (16 `@webkit` before and after)                                                                | **94** (78 chromium + 16 webkit-phone) in five chunks, twice                                        |
| check            | 608             | **608**               | **+4** (`labels.ts`, `rail.ts`, `playground/+page.ts`; the moved route counts once more under its new path) | **612**, 0 errors, 0 warnings                                                                  |
| sweep            | `4 19`          | `4 19`                | unchanged                                                                                             | `4 19`                                                                                             |
| catalog / OG     | 26 = 8 + 18     | 26                    | untouched - no entry file edited (`git diff --stat 485c286 -- src/lib/catalog/entries/` is empty)     | 26 OG images, 26 `build/playground/<id>/` pages                                                    |
| radius allowlist | 13 rows / 28    | 13 / 28               | **-3 rows / -5 declarations**: BrowseToolbar 1, CatalogCard 3, FacetRow 1                             | **10 / 23**; layer A 34 declarations in 58 files; layer B 34 in 10 built stylesheets, 6 of them 50% |

`npm run test:quick 2>&1 | node scripts/check-counts.mjs 88 904`: **matches, twice** (after the final
build). `npm run test:sweep 2>&1 | node scripts/check-counts.mjs 4 19`: matches. `npm run check`:
612 files, 0 / 0. `npm run lint`: clean. `npm run build`: 26 pages under `build/playground/`, no
`build/c/`, no `build/browse/`; the prerendered `build/playground/index.html` carries `<title>Playground —
HANGAR</title>`, `data-variant="app"`, `aria-current="page"` on `data-section="playground"`, the
breadcrumb `PLAYGROUND` / `CONFIGURATIONS`, *Browse. Preview. Make it yours.*, *Preview without
hardware* and the `<h1>` *Find your next gesture.*; `build/playground/aurora/index.html`'s `og:url` is
`https://hangar.sabotond.workers.dev/playground/aurora/`.

## Task 01: the answer, recorded verbatim, with the counts re-measured

The user's answer to the checkpoint (13-CONTEXT.md D-20, given 2026-09-11):

> *"move-clean"*

**Re-measured at execution on `485c286`**, before the first edit: `grep -rn "/c/" src/` returns **78
lines**, of which **21 are code call sites** (the rest are comments naming the route and seven
firmware paths under `common/src/c/`); `grep -rn "/c/" e2e/` returns **67 lines, 52 of them code**;
`stamp.spec.ts` names the address on **1 line** (a comment, `:17`); `static/og/` holds 26 files named
by id, not by route. **No difference from the orchestrator's 21 / 52 / 1.** The three options were not
re-presented and nothing was asked.

**What move-clean cost, counted once for 13-20:** the thirteen dead `/c/<id>/` addresses Phase 12
recorded (nine from 11-01, three from 12-04, `/c/tpad/` from 12-10) are dead the same way under
`/playground/<id>/`; and every `/c/<id>/` for the 26 live ids, plus `/browse/`, is dead too - 27 more
dead addresses of the old family, on a site that has never been public (SHARE-03's own amendment).

### Every `/c/` and `/browse/` call site that moved (all in `d2f38fd`)

Applied by one script from a table of tokens with a dry run first, every file's per-token count
printed (232 hits in 45 files), and the two regex-escaped forms the tokens could not see found
afterwards by `grep -F`. Code sites, by file:

| File                                             | What moved                                                                                                                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/c/[id]/` -> `src/routes/playground/[id]/` | `git mv`; `DETAIL_PREFIX "/c/"` and `BROWSE_PATH "/browse/"` became one `PLAYGROUND_PREFIX "/playground/"` (both exceptions share the prefix now); `ogUrl`'s `${SITE_ORIGIN}/c/` join; the header's first line says when it moved. Otherwise untouched for 13-09 |
| `src/routes/browse/+page.svelte` -> `src/routes/playground/+page.svelte` | `git mv`, then rewritten (task 02); `currentHref` / `writeAddress` / the `beforeNavigate` prefix / `OG_URL`                                                                             |
| `src/lib/ui/CatalogCard.svelte:162`              | `resolve("/c/[id]")` -> `resolve("/playground/[id]")`                                                                                                                                   |
| `src/lib/ui/Coverflow.svelte:340`                | `replaceState(resolve("/c/[id]"))` -> `/playground/[id]`                                                                                                                                |
| `src/lib/ui/intro/Intro.svelte:77`               | the resume card's `resolve("/c/[id]")` (13-07's named site)                                                                                                                             |
| `src/lib/ui/BrowseLink.svelte`                   | `BROWSE_PATH`, `resolve("/browse/")`, `` resolve(`/browse/?${search}`) ``; and `onBrowse` from `startsWith` to an EXACT match, because every workspace now shares the prefix (Rule 1)  |
| `src/lib/ui/FrontDoor.svelte:199`                | `` resolve(`/browse/?for=${term}`) `` -> `/playground/?for=`                                                                                                                             |
| `src/lib/share/url.ts:55`                        | `shareUrl`'s `${SITE_ORIGIN}/c/${id}/` -> `/playground/`                                                                                                                                 |
| `src/lib/share/url.spec.ts`                      | three literals (`/c/aurora/`, `/c/aurora/#z.…`, `/c/euclid/#z.…`)                                                                                                                       |
| `src/lib/ui/shell/shell.svelte.ts:56`            | `SECTIONS[0].href` literal `"/playground/"` -> `resolve("/playground/")` (13-05's hand-off)                                                                                             |
| `src/lib/og/build.spec.ts:345, :347`             | the page path and the `og:url` join; `join(BUILD, "c", …)` -> `"playground"`                                                                                                             |
| `src/lib/config-shape.spec.ts`                   | `FRONT_DOOR_PAGES` (both `[id]` files, plus the gallery's new `+page.ts`), `BROWSE_PAGE`, `build/browse/index.html`, `build/c/aurora/…`, `build/c/euclid/…`                              |
| `src/lib/ui/shell.spec.ts:746`                   | the Rail fixture's `href: "/c/arc/"`                                                                                                                                                    |
| `src/lib/ui/intro.spec.ts:273, :275`             | the regex-escaped `\/c\/aurora` (missed by the tokens, found by hand)                                                                                                                   |
| `src/lib/browse/return.spec.ts`                  | fifteen fixture hrefs                                                                                                                                                                   |
| `src/lib/browse/query.spec.ts:105`               | a title naming the canonical address                                                                                                                                                    |
| `vite.config.ts`                                 | `/playground/` removed from the crawler's 404 ignore (13-07's hand-off); `/sandbox/` and `/my-configs/` stay for 13-10 and 13-12                                                        |
| `scripts/gen-og.mjs:41`                          | the route file it names (it emits no address; its two quoted historical build errors are left as history)                                                                              |
| `e2e/browse.e2e.ts`                              | `BROWSE`, five `/c/${…}` sites, two `/c/euclid/`, eight `\/browse\/` regexes, fifteen `/browse/`                                                                                        |
| `e2e/browse-webkit.e2e.ts`                       | `BROWSE`                                                                                                                                                                                |
| `e2e/session.e2e.ts`                             | eight `/c/${…}`, three `/c/aurora/`, two `\/browse\/` regexes, four `/browse/`                                                                                                           |
| `e2e/first-experience.e2e.ts`                    | nine `/c/${…}`, `/c/ninepads/`, `/c/euclid/`, `/c/aurora/`, the `/c/[id]` route id, and the escaped `\/c\/aurora` at `:204`                                                            |
| `e2e/install.e2e.ts`                             | three `/c/${…}`, `/c/lumen/`, and the escaped `\/c\/aurora\/$` at `:1370` (the one red in the first install run)                                                                       |
| `e2e/tuning.e2e.ts`                              | ten `/c/${…}` (the share-link assertions go through `shareUrl` and followed it)                                                                                                         |
| `e2e/tuning-webkit.e2e.ts`                       | one `/c/${…}`                                                                                                                                                                           |
| `e2e/radius.e2e.ts`                              | `WORKSPACES`, `ROUTES`                                                                                                                                                                  |
| `docs/INSTALL-RUNBOOK.md`, `docs/SESSION-RUNBOOK.md`, `docs/TESTING.md` | one dated line each, appended, nothing re-wrapped                                                                                                                                       |

Comment-only mentions moved in 21 more files (`return.ts`, `facets.ts`, `facets.spec.ts`, `filter.ts`,
`query.ts`, `typographic.ts`, `front-door.ts`, `front-door.spec.ts`, `listing.ts`, `install.svelte.ts`,
`snapshot.ts`, `stamp.ts`, `stamp.spec.ts`, `host.ts`, `model.spec.ts`, `DeviceSlot.svelte`,
`fidelity-line.ts`, `FidelityLine.svelte`, `TuningRegion.svelte`, `Wordmark.svelte`,
`dev/tune/+page.svelte`, `instrument.spec.ts`, `artifacts.e2e.ts`). **Not moved, and why:**
`src/lib/catalog/entries/trackpad.ts:170` (*"`/c/tpad/` is therefore a dead address"*) - an entry
file, forbidden, and true as history; `scripts/gen-og.mjs:19, :38` - quoted build errors from 2026-09-04;
the seven `common/src/c/grid_*.c` firmware paths, which are not addresses.

`grep -rn "/c/" src/ e2e/` **after** (firmware paths excluded): three lines, all this plan's own
history sentences (`trackpad.ts:170`, `playground/+page.svelte:6`, `playground/[id]/+page.svelte:3`).
`grep -rn "/browse/" src/ e2e/` after (`lib/browse/` excluded): three lines, all in
`playground/+page.svelte`'s header saying where it came from.

## Task 02: PDF page 2 on the shell

### The rail, derived, and the observed count

`src/lib/browse/rail.ts` builds the rail: `railSections({ all, favorites, recent })` returns YOUR
LIBRARY (three PDF rows with counts, padded by `Rail.svelte`'s `padCount`) and MADE FOR as
`FOR_TERMS.map(term => ({ id: "for:" + term, label: FOR_LABELS[term], term }))` - no count on those
rows (the PDF shows none), no literal anywhere. `browse-ui.spec.ts` test 7 prints:

```
13-08 MADE FOR: 7 rows derived from FOR_TERMS (modulation -> Modulation, show -> Visuals, sequencing -> Sequencing, mixing -> Mixing, play -> Playing, shortcuts -> Shortcuts, pointing -> Pointing); D-11 said eight, 12-04 retired keys
```

**The observed `FOR_TERMS` count is seven.** 13-CONTEXT D-11 says *"HANGAR's eight FOR terms"*; plan
12-04 retired `keys` on 2026-09-10 (13-VALIDATION D-4 records it), so **D-11's "eight" is superseded
by 12-04, by name**. The test asserts member for member and never the number; if a term returns, the
rail follows and the printed count moves.

**`FOR_LABELS` is provisional** (`src/lib/browse/labels.ts`, a `Record<ForTerm, string>` keyed
exhaustively so a retired or added term is a type error): `Modulation`, `Visuals`, `Sequencing`,
`Mixing`, `Playing`, `Shortcuts`, `Pointing` - the plan's proposals in the vocabulary's order, ledgered
in `13-COPY-NEW.md` with the machine term, the PDF counterpart where one exists (`Modulation` and
`Visuals` on the PDF's rail and chips; `VISUAL` on its card line; `Notes & chords` / `Notes` name
CHORUS's carrier and not `play`'s other two) and the note that the tree rendered an upper-cased
identifier until now (D-05 retires it). **The chip-versus-rail question** - the PDF's `Notes & chords`
on the rail against `Notes` in the chip row - is ledgered as question 1: today one record, one string
per facet; if the batch wants the PDF's shape the record grows a second field. When 13-18 answers,
the change is one table: the rail, the chip row and the card's category line all read it.

### One chip row, the sort, the search row

`BrowseToolbar.svelte` mounts `FacetRow` **once**, for the FOR facet, with `terms={FOR_TERMS}` and
`labels={FOR_LABELS}`; test 7's second clause counts the mount and asserts the toolbar names neither
`FEELS_TERMS` nor `FACETS`. The row opens with the PDF's `All` - a real `<button aria-pressed>` that
clears the FOR row, because "All" is the state in which nothing is active and a checkbox that could
only ever be checked would lie about Space - then one `TagChip` per term (a checkbox as before, now
carrying a `label` beside its machine `tag`), with the count `{n} of {total} configurations.`
right-aligned. It wraps rather than truncating. The FEELS row is gone (D-11); a FEELS term arriving in
the address (`?feels=`, or a mapped legacy `?tag=`) still filters, the count says the truth and
`Clear filters` clears it - no chip shows it, said in the toolbar's header and ledgered (question 7).

The sort is a `<select>` (`SORT BY` over `Featured` / `Name`, driven by `BROWSE_SORTS` through an
exhaustive word table). The search row keeps its real `<label for>` (`SEARCH CONFIGURATIONS`, the
micro role) and gains the PDF's placeholder verbatim; the field is 16px and both the field and the
select declare `border-radius: 0` and `appearance: none` so the user-agent's rounding never reaches
`radius.e2e.ts`. The live region's empty sentence is §16's line verbatim.

### The card, field by field, and the one accessible name

| Element        | Rendered from                                                             |
| -------------- | ------------------------------------------------------------------------- |
| square preview | `PadFrame` + `PadCanvas`, `aria-hidden` wrapper, as before                |
| name           | `entry.name`, uncased (`ARC` until 13-19), in the display face at 24px    |
| favorite       | a `<button class="star">` sibling of the anchor, `☆` / `★` in the action colour, two names |
| category · tag | `forLabel(tags[0])` and `tags[1]` as itself, the micro role (11px tracked uppercase), a middot between |
| sentence       | `typographic(entry.description)` (D-14 Q11c; `quiet` moves to the workspace) |
| action         | `Explore ↗` as a `<span aria-hidden="true">` styled as the PDF's outlined full-width box |

**`tags[2]` is not shown, and that is a decision:** the PDF's line is one category and one tag, the
second FEELS term stays on the entry and in the address. `featured` keeps its field and loses its mark.
The metadata block (id + engine + motion) and the three-tag row are gone.

**The accessible-name decision:** the whole card is still the link - the `<a class="name">` carries
`::after { position: absolute; inset: 0 }` over the `position: relative` card - and **the anchor's
`aria-label` (the name, or `{name} — unavailable`) is the one accessible name**, its `aria-describedby`
the sentence. `Explore` is `aria-hidden` so a screen reader hears one link and not two; a second
anchor would put two entries in the links list for one destination, and a button inside a link is
invalid. Test 8 renders the card with `svelte/server` and proves it: exactly one `<a`, its
`aria-label` the name, its `href` `/playground/fixture`, the Explore box hidden, and the card's
`aria-label` set equal to `[name, "Add FIXTURE to your favorites"]` once PadCanvas's own label inside
the hidden wrapper is discounted by its suffix. Negative check D (Explore as its own `<a>`) went red on
test 8 and on test 5's anchor count.

**The star roves with the card.** It carries the anchor's `tabindex`, so the roving card exposes two
Tab stops - its link, then its star - and every other card exposes none; the arrow keys still move by
card. `browse.e2e.ts`'s keyboard title (unchanged in name) now counts `[tabindex="0"]` at 2 and
`[tabindex="-1"]` at 2 x 25, and crosses the wall in two presses. Ledgered as question 8.

**The favorites drop count against the live catalog** (test 9): the thirteen removed ids - nine from
11-01, three from 12-04, `tpad` from 12-10 - seeded beside one live id read back as `ids: [aurora],
dropped: 13`; printed as `13-08 favorites: 13 of 14 seeded ids dropped against the live catalog of 26`.
The page reads `readFavorites(local(), known)` with `known = (id) => listingById(id) !== undefined`
inside `onMount`, keeps `dropped` and renders no sentence for it (13-06's question 1 stands). Round
trip: star, read, unstar, read; an id the catalog no longer carries cannot be starred. The star
reflects a preset state on mount: `data-favorite`, the glyph and the name all follow `favorite`.

### The library view, the address, and the scroll

`All configs`, `Favorites` and `Recently used` are rail buttons: the first clears the FOR row, the
other two narrow the grid to the store's ids. **The view is not in the address**, deliberately - a
shared `?show=favorites` would show somebody else a different set - and resets to All configs on
arrival (question 4). `Recently used` reads `00` until 13-09's workspace calls `touchRecent` on open
(13-06's note assigned the call to this plan; the workspace page is untouched here by instruction, so
the count is honestly zero - question 6). A MADE FOR row sets the FOR facet to exactly that term; a
chip press moves the rail's selection; two active FOR chips select no row.

**Browse context survives through the store that already does it, with one honest reader.** On
13-05's frame the centre column scrolls its own body in the wide and compact bands (`.centre {
overflow-y: auto }` inside a viewport-height frame) and the window does not move; below 1024 the page
flows. `window.scrollY` would therefore have recorded 0 on every desktop. The page's `scroller()` walks
to the nearest ancestor with `overflow-y: auto | scroll` and reads / writes that, else the window; the
round-trip e2e reads `[data-testid="shell-centre"]` the same way (the layout's `<main>` gained the
test id). Sort, query, chips, the 500 ms projection, the popstate re-seed, the forward-hop record and
its `href` guard are unchanged from `/browse/`.

### The shell fill, and the prerendered document

`playground/+page.ts` declares `{ shell: { variant: "app", section: "playground", breadcrumb:
["PLAYGROUND", "CONFIGURATIONS"], status: "Browse. Preview. Make it yours." } }`; `shellFromData`
was widened to carry the two strings (Rule 2: the prerendered context bar should carry its words, as
13-07's header did), so `build/playground/index.html` ships the header, the nav with PLAYGROUND
current, the breadcrumb and the status. The rail is a snippet and arrives with the effect, as 13-07
said snippets must.

### The wall, not rebuilt

`BrowseGrid.svelte`'s diff is four hunks: the two favorites props threaded to the card, section 16's
line in the filter-miss branch (the Phase 5 `emptyReason` prop and its three sentences retired), and
`minmax(300px, 1fr)` for the PDF's three columns. `host = new SimHost(motionDeps())`, the observer,
the roving index, `nextIndex`, `repaintAll` and `setHero(undefined)` are untouched.

### The nine tests

| #   | Title                                                                                                   | Fate                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | no popularity metric is shown or faked anywhere on the gallery                                          | survives, re-aimed (the select's two words are the same two orders)                                                              |
| 2   | every browse control declares the 44px floor                                                            | survives; `select` joins the control regex; `pill` leaves the not-a-box list                                                     |
| 3   | **the gallery uses the eleven tokens and nothing else**                                                 | **REWRITTEN** from *"the browse screen uses the lime ladder and nothing else"*: the eleven read from `app.css`, every `var(--color-*)` one of them, no hex, no `rgb(`, no error ink; its name changed and its count did not |
| 4   | the search field is at the iOS zoom floor                                                               | survives                                                                                                                         |
| 5   | the grid is a list of links, not a listbox and not a grid                                               | survives, re-aimed (`radiogroup` leaves the kept roles with the select; one anchor per card; the group's derived id)             |
| 6   | the count is said three ways, and only one of them is a live region                                     | survives as written                                                                                                              |
| 7   | the MADE FOR rows equal FOR_TERMS member for member … the count printed … exactly one facet row         | **new**                                                                                                                          |
| 8   | a card shows one category and one tag … tags[2] nowhere, one sentence … exactly one accessible link name | **new**                                                                                                                          |
| 9   | the favorite star round-trips through the store … an id the catalog no longer carries is dropped        | **new**                                                                                                                          |

So the `+3` is unambiguous: test 3 is the one rewritten, tests 7 to 9 are the three added.

### The allowlist, before and after

Before: 13 rows, 28 declarations. After: **10 rows, 23 declarations** - `BrowseToolbar.svelte` (1, the
field's 6px), `CatalogCard.svelte` (3: the plate, the focus ring's 10px, the tag chips) and
`FacetRow.svelte` (1, the link member) cleared; the header comment in `radius-allowlist.ts` says so
with the date. Layer A: `34 declarations in 58 files scanned; 23 above zero remaining in 10
allowlisted files … 6 circles (D-15)`. Layer B on the final build: `34 radius declarations in 10 built
stylesheets; 6 of them 50%; tolerated values from the allowlist: 10px, 1px, 2px, 6px`. Layer C
(`radius.e2e.ts`, `@webkit`) ran over `/playground/` and the two workspaces in both engines, twice.

### The four negative checks, restored from scratch copies with sha256 either side

| Plant                                                              | Expected                     | Observed                                                                                    | Restore                 |
| ------------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------- | ----------------------- |
| A. `rail.ts` mapping a four-item literal                           | test 7 red                   | test 7 red (member for member), 8 green                                                     | `7de98c21` = `7de98c21` |
| B. a second `<FacetRow name="feels">` in the toolbar               | test 7's second clause red   | test 7 red (exactly one facet row), 8 green                                                 | `884b5311` = `884b5311` |
| C. `{entry.tags[2]}` rendered on the card                          | test 8 red                   | test 8 red (`tags[2]` not shown), 8 green                                                   | `65571598` = `65571598` |
| D. `Explore` as its own `<a>`                                      | test 8's name clause red     | test 8 red (one anchor, one name) **and** test 5 red (exactly one anchor per card), 7 green | `65571598` = `65571598` |

Each plant asserted exactly one occurrence of its anchor before replacing it. No `git checkout`,
`restore`, `stash` or `clean` was run at any point.

## The e2e suite, and the harness

`grep -c "test("` over `e2e/*.e2e.ts`, before (`git show 485c286:`) and after, pasted:

```
before: artifacts 3, browse-webkit 4, browse 12, catalog 2, fidelity 2, first-experience 5, install 14,
        radius 1, session 14, skeleton 2, smoke 4, tuning-webkit 5, tuning 10  = 78
after:  artifacts 3, browse-webkit 4, browse 12, catalog 2, fidelity 2, first-experience 5, install 14,
        radius 1, session 14, skeleton 2, smoke 4, tuning-webkit 5, tuning 10  = 78
@webkit titles: 16 before, 16 after
```

**`browse.e2e.ts` has twelve titles, not the orchestrator's eleven - twelve in, twelve out.** The
`@webkit` reduced-motion title 13-04 re-homed is still there and green in both engines.

The suite was run in 13-07's five chunks, each on a fresh detached wrangler killed afterwards, **and
the whole chunked suite was run a second time**; the runner writes each chunk to a file and reads it
through `check-counts.mjs --playwright`, never through `grep` or `head`:

| Chunk                                                                        | Runs | Pass 1                                                                                                                         | Pass 2                                                                                     |
| ---------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| browse + browse-webkit                                                       | 21   | 18 / 21 - three reds, named below; fixed; **21 / 21**                                                                          | **21 / 21**                                                                                |
| install                                                                      | 17   | 16 / 17 - `install.e2e.ts:1289` *"the panel writes on a click, says PLAYING NOW…"*: `toHaveURL(/\/c\/aurora\/$/)`, the escaped form the tokens missed; fixed; rerun alone **1 / 1** | **17 / 17**                                                                                |
| session                                                                      | 16   | **16 / 16**                                                                                                                    | **16 / 16**                                                                                |
| tuning + tuning-webkit                                                       | 20   | **20 / 20**                                                                                                                    | **20 / 20**                                                                                |
| first-experience + smoke + skeleton + fidelity + catalog + artifacts + radius | 20   | **20 / 20**                                                                                                                    | 19 / 20 - `artifacts.e2e.ts` *"the static build is complete"*: HEAD moved to `2d3f904` under the build (the other agent); rebuilt; rerun alone **3 / 3** |

**The three browse reds of pass 1, each named:** (a) *"the browse screen renders on a phone @webkit"*
in both engines - the document scrolled sideways at 375px (`scrollWidth 721`): the app shell's header
(wordmark + nav + the reserved 218px connection box) and the nav's three items had never been rendered
on a phone before this route; fixed in `Header.svelte` and `Nav.svelte` with `flex-wrap` inside the
existing 767.98px band (Rule 3, the plan permits the page and the shell must hold it); (b) *"reduced
motion stills every card"* - the `settled()` predicate read card rectangles against
`window.innerHeight`, blind to the centre column's clip, so a card under the footer counted as on
screen and its engine was never built; the predicate now intersects with `[data-testid="shell-centre"]`
when that element scrolls. None of the three was a transient; every one was rerun green in its chunk.

**The harness, plainly.** wrangler 4.128.0 started detached through PowerShell `Start-Process npx.cmd
wrangler dev --port 4173 --ip 127.0.0.1` with redirected stdout/stderr **did not die in any of the
eleven chunk runs** (zero `ProxyController` lines in every server log). Two things went wrong on the
way and are recorded for the next executor: a hidden `cmd /c "npx … > log"` launch never starts
wrangler at all and reports nothing; and the scratchpad is shared across sessions, so reading
`wrangler.log` there showed 13-07's dead server's tail and read as a live one. The runner (`run-chunk.sh`,
`start-wrangler.ps1`) lives in the scratchpad, as 13-07's did.

The quick-suite transients the orchestrator named (`install.spec.ts`'s connect-snapshot tests,
`config-shape.spec.ts`'s preload) did not appear in either quick run.

## Strings, and the ledger

Every visible string on the gallery that the PDF draws is verbatim and not ledgered: the eyebrow, the
headline, the sub, `SEARCH CONFIGURATIONS`, the placeholder, `SORT BY`, `Featured`, `Use`, `All`,
`Explore`, `YOUR LIBRARY`, the three rows, `MADE FOR`, the two quiet lines, `+ Build your own`,
`PLAYGROUND / CONFIGURATIONS`, *Browse. Preview. Make it yours.*, and §16's *No configurations found.
Try a different search or clear your filters.* (the grid's filter-miss line and the live region's
empty sentence, both verbatim). **Twelve rows landed in `13-COPY-NEW.md`** ("From 13-08"): the seven
`FOR_LABELS` values, the star's two names (*Add {name} to your favorites* / *Remove {name} from your
favorites*), `Clear` with its accessible name *Clear the search*, `Clear filters`, and the title
*Playground — HANGAR*. **Eight questions** follow them: the chip-versus-rail naming; the seven labels
as proposals (`show` -> `Visuals` against the PDF's three forms of the word); the count line's
`{n} of {total}` against the PDF's `36 configurations`; the library view not in the address; the empty
library view's line; `Recently used` at `00` until 13-09; a FEELS term filtering from the address
without a chip; the roving card's two Tab stops.

## Deviations from the plan

### 1. [Rule 3 - blocking] Header and Nav wrap below 768px

`Header.svelte` and `Nav.svelte` are 13-05's and not in the plan's file list; the gallery is the app
shell's first phone render and `browse-webkit.e2e.ts` measures sideways overflow at 375px. One media
query each, inside the band 13-05 already declares.

### 2. [Rule 2 - correctness] `shellFromData` carries the breadcrumb and a string status

Without it the prerendered context bar ships with an empty breadcrumb and grows its words at
hydration; strings can travel as data, snippets cannot. `shell.svelte.ts` and `+layout.svelte`
(`data-testid="shell-centre"`) are outside the plan's list.

### 3. [Rule 1] `BrowseLink`'s `onBrowse` is an exact match

`startsWith("/playground/")` would have hidden the slot on every workspace, since every workspace now
shares the gallery's prefix. A consequence of the move, fixed with it.

### 4. [Rule 2] The return record reads the nearest scrolling ancestor

`window.scrollY` is 0 on the shell's frame at every desktop width; the store the plan says "already
does it" needed one honest reader. The e2e round trip reads the same element.

### 5. [Rule 3 - blocking] Five specs outside the plan's list re-aimed

`instrument.spec.ts` scan 5 (A-42's index form and the mono list of seven, both retired with the
Bible; the card's `.meta` assertions), its `PILLED` table (three rows), `intro.spec.ts` (the escaped
address), `shell.spec.ts` (a fixture href), `config-shape.spec.ts` (roots and build paths),
`og/build.spec.ts`, `url.spec.ts`, `return.spec.ts`, `query.spec.ts` (a title). Left alone they are
red on every run; deleted they move the count.

### 6. [Rule 3 - blocking] Six e2e files outside `browse.e2e.ts` re-aimed, no title moved

`session.e2e.ts` (the walk's two gallery hops assert the document and not the device slot, since the
shell's slot is 13-11's; the wordmark hop through `shell-wordmark`), `browse-webkit.e2e.ts` (the
select), `first-experience`, `install`, `tuning`, `tuning-webkit`, `radius` and `artifacts`
(addresses only).

### 7. [Design, stated] `All` is a button, TagChip gains `label`, FacetRow gains `labels` and `all`

The PDF's `All` chip is the row's clear state; a checkbox that can only be checked would lie about
Space. `TagChip.svelte` (not in the plan's list) needed a display label beside its machine term, and
lost Phase 5's `rgb(214 255 78 / 0.08)` tint (a raw colour; test 3 now forbids it) and the pill class.

### 8. [Plan vs tree] FacetRow's "radiogroup mechanics"

The plan says FacetRow "keeps its radiogroup mechanics, its arrow-key selection". FacetRow was a
`role="group"` of checkboxes; the radiogroup was the SORT row, which the PDF makes a select. FacetRow
keeps its group and its checkboxes.

### 9. [Plan vs tree] `radius.spec.ts` is listed; the rows live in `radius-allowlist.ts`

The spec was not edited; the three rows and the header sentence are in the allowlist module.

### 10. [Process] The scratchpad runner replaced a launch that never launched

See "The harness". The install chunk's first pass ran before the escaped-form fix; its red was the
fix's subject and it was rerun alone, then the whole chunk again.

### 11. [Process] `gsd-tools state` commands not run; STATE.md by script against a copy

`advance-plan`, `update-progress`, `roadmap update-plan-progress`, `requirements mark-complete`,
`record-metric`, `add-decision` and `record-session` were not run. The script asserted `status:
executing`, `completed_phases 11`, `percent 100`, `total_phases 14`, `total_plans 160`, the Phase 12.1
line and Phase 12's plan line unchanged; moved `completed_plans` 143 -> 144; added the P08 metrics
row, ten `[Phase 13]: 13-08:` decisions, a dated clause on the `Concurrent` line, the new `Status:`
with the previous retained as `(13-07)`, and `Last session` / `Stopped at` with the previous stop
retained. Phase 12 (gate landed, bench pending), Phase 12.1 (inserted; its directory now holds nine
plans, none edited) and Phase 13 (8 of 20) are all recorded. `.planning/ROADMAP.md` and
`REQUIREMENTS.md` are untouched by this plan; **CAT-04 stays `[ ]`**.

## What the plan asserts that the tree does not support

1. **`PREV_TESTS 898`** - the tree was 901; stated once above.
2. **"eleven titles in `browse.e2e.ts`"** (the orchestrator's brief) - twelve, before and after.
3. **"FacetRow keeps its radiogroup mechanics, its arrow-key selection"** - it was a checkbox group;
   the radiogroup was the sort's.
4. **"`radius.spec.ts`" as the file that clears rows** - the rows are `radius-allowlist.ts`'s.
5. **"the two facet-row ones shrink"** among the six surviving titles - no existing title was about
   two rows; test 5's group clause was re-aimed from "the two rows must not share a caption" to the
   derived id alone.
6. **"`/browse` becomes … a forward, a deletion, or the same page at a new address"** - the same page
   at a new address AND rewritten; the plan's own task 02 asks for both.
7. **The count line** - the PDF draws `36 configurations`; the tree keeps `{n} of {total}
   configurations.` (test 6, §6); ledgered as a question rather than changed silently.

## Questions for the user, recorded rather than answered (D-01)

The eight in `13-COPY-NEW.md` under "From 13-08" (listed above under "Strings, and the ledger"). And
one here: **should `Favorites` and `Recently used` be destinations rather than filters** - 13-13's
page 4 lists them under YOUR LIBRARY as well, and if that page is where they live, this rail's two
rows become links and the library view here goes.

## Known Stubs

- `Recently used` reads `00` until 13-09's workspace calls `touchRecent` on open - the store is read,
  honestly empty; not a hardcoded value.
- The `dropped` count is read and not rendered (`data-dropped` on the grid wrapper); the sentence is
  13-06's open question, not a blank.
- The shell's connection slot on `/playground/` is empty until 13-11, by 13-05's design.

## Notes for the next plans

- **13-09:** the workspace is at `src/routes/playground/[id]/+page.svelte` with `PLAYGROUND_PREFIX`
  as its one prefix; call `touchRecent(localStorage, id, now)` on open; `quiet` becomes helper text
  there (D-14 Q11c); `BrowseLink`'s `BROWSE ALL` / `BACK TO BROWSE` are Phase 5 strings awaiting the
  page's rewrite; the session walk's gallery hops are 13-11's to restore.
- **13-10 / 13-12:** `vite.config.ts` still ignores `/sandbox/` and `/my-configs/`; remove your own.
- **13-13:** the library rows here; question 4.
- **13-18:** twelve rows and eight questions.
- **13-20:** the counts above; thirteen dead `/c/<id>/` addresses under the new prefix plus the 27 old
  addresses now dead; CAT-02's qualifier for the select.
- **The harness:** `run-chunk.sh` + `start-wrangler.ps1` in the scratchpad; the scratchpad is shared
  across sessions - name your logs.

## Self-Check: PASSED

- `src/lib/browse/labels.ts`, `src/lib/browse/rail.ts`, `src/routes/playground/+page.ts`,
  `src/routes/playground/+page.svelte`, `src/routes/playground/[id]/+page.svelte`,
  `src/routes/playground/[id]/+page.ts`: FOUND. `src/routes/browse/+page.svelte`,
  `src/routes/c/[id]/+page.svelte`: ABSENT, as required.
- Commit `d2f38fd`: FOUND in `git log`.
- `git diff --stat 485c286 -- src/vendor/ src/lib/catalog/entries/ src/lib/catalog/library.ts
  src/lib/sim/lua-host.ts src/lib/fidelity/firmware-oracle.spec.ts`: empty. `.planning/ROADMAP.md`,
  `.planning/REQUIREMENTS.md`, `.planning/phases/12-touch-framework/`,
  `.planning/phases/12.1-gradient-touch/`: untouched by this plan (ROADMAP and 12.1 differ from
  `485c286` only through the other agent's commits).
- No device, no deploy, no push. The three untracked root files and the 12.1 plans are not this
  plan's.
