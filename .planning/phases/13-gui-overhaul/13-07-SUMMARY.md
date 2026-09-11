---
phase: 13-gui-overhaul
plan: 07
subsystem: ui
tags:
  [
    intro,
    pdf-page-1,
    hero,
    sim-host,
    returning-visitor,
    d-14-q2,
    no-redirect,
    og-head,
    prerender,
    page-data,
    splash-deleted,
    glyph-field-deleted,
    d-09,
    front-door,
    ring-orphaned,
    e2e-re-aim,
    wrangler,
    counts,
    negative-check,
    copy-ledger,
    prev-04,
  ]
requires:
  - phase: 13-gui-overhaul
    plan: 06
    provides: "PREV_FILES 88 / PREV_TESTS 899 as the plan carried them; the tree at f065c73 measured 903 (13-06 landed +10 not +7, 12-10 and 12-12 +1 with comments moved) - the offset stated once below; intro.ts (hasSeenIntro, markIntroSeen), drafts.ts (newestDraft), local.ts (probe: absent / corrupt / refused), schema.ts (IntroFlag, Draft)"
  - phase: 13-gui-overhaul
    plan: 05
    provides: "the shell's intro variant (Header.svelte with a secondary snippet and a reserved connection slot), shell.svelte.ts's fillShell, layout.ts's numbers, the unfilled shape the layout renders until every route fills it"
  - phase: 13-gui-overhaul
    plan: 04
    provides: "the CRT deletion; FrontDoor.svelte already -317 lines; PadFrame's dot field kept with the question left for this plan; motionDeps() as the host's reduced-motion input"
  - phase: 13-gui-overhaul
    plan: 03
    provides: "the eleven tokens, the eight .type-* roles (display 60 / 0.95, micro 11 tracked uppercase), Wordmark.svelte, the copy ledger's rule"
  - phase: 12-touch-framework
    plan: 06
    provides: "the hard-band condition: 12-06-SUMMARY.md exists and was read - the answer was as-is, no ring re-derived, front-door.ts and front-door.spec.ts untouched by 12-06; nothing to carry to 13-20"
  - phase: 13-gui-overhaul
    plan: context
    provides: "D-01 (ask; never a corner), D-05 (the register), D-09 (the splash and the glyph field go), D-14 Q2 (/ stays the intro, a flag changes Card A, no redirect), D-15 (six circles, none here), D-20 (move-clean: 13-08 executes the /playground/<id> move; this plan goes through the tree's address helper)"
provides:
  - "PDF PAGE 1 AT /: src/lib/ui/intro/Intro.svelte, StartCard.svelte, HeroSurface.svelte and card.ts, rendered by src/routes/+page.svelte inside the shell's intro variant - eyebrow, two-line headline (second line in the action colour), two sub-lines, two stacked start cards with 48x48 SQUARE affordances (D-01), the import line, the bulleted line, the hero panel with TRY THE SURFACE / BROWSER PREVIEW / the caption pair, and the three-step strip; every visible string the PDF's verbatim with real apostrophes; no allowlist row for any of the four files"
  - "THE HERO, DERIVED: heroOf(row) and FRONT_DOOR_HERO in src/lib/catalog/front-door.ts - the first FRONT_DOOR member that is not dark, in list order; a row of nothing but dark throws rather than opening on a black square. RESOLVED TO AURORA (Aurora, animated), NOT THE PDF's ARC - ARC is a hand-authored Lua entry excluded from the list, and the front page may not fetch the VM on first paint. Asked in 13-COPY-NEW.md"
  - "ONE LIVE, INTERACTIVE PAD through HANGAR's SimHost with motionDeps(): the engine and the catalog arrive by dynamic import inside onMount, the canvas registers through PadCanvas/PadFrame like every other pad, the observer's 200px wake margin is the host's own, pointer down/move/up map through mapAxis onto the engine's range and deliver through the host (PREV-04's first half - not ticked; 13-09 carries the row)"
  - "THE RETURNING VISITOR CHANGES ONE CARD AND NOTHING ELSE (D-14 Q2): introCardFor(store, now) answers resume only when the flag is set AND a draft exists; every failure - absent, refused, throwing on access, corrupt - reads as a first visit (the safe direction, stated as a decision); the route reads storage in onMount, writes the flag after the read, and performs zero navigations, proved by a source scan that catches a plant first"
  - "THE OG HEAD BLOCK KEEPS ITS SHAPE: thirteen tags, the same SITE_ORIGIN join, the same ogAlt call; the description is now the PDF's three sentences, the image and alt are the hero's (aurora - the same entry as the ring's opening centre, by consequence)"
  - "THE PRERENDERED DOCUMENT CARRIES THE INTRO HEADER: src/routes/+page.ts declares { shell: { variant: 'intro' } } as page data and shellFromData() in shell.svelte.ts lets the layout render the frame from it when no effect has filled the shell - because fillShell runs from an effect and the layout's if-fill is evaluated before the page's script on the server. build/index.html shows data-variant='intro' and one <main class='centre intro'>; the Quick guide snippet arrives with the effect"
  - "Splash.svelte, glyph-field.ts and glyph-field.spec.ts DELETED with all five titles named and no todo; FrontDoor.svelte lost the Splash import, the splash prop, the opening/covered state, the speech hold and the .covered rule - the component itself stays for /c/{id}/ until 13-09; /c/[id]/+page.svelte dropped splash={false}; instrument.spec.ts lost its Splash row"
  - "front-door.spec.ts 8 -> 7: 'no two quiet pads are adjacent on the ring' deleted by its own title; the motion-derivation and restsBlack tests re-aimed at the hero as well as the list, still reading golden-frames.json; the two opening-window titles kept with 13-09 named"
  - "e2e: first-experience.e2e.ts 11 -> 5 (seven deleted by name, none @webkit; four re-aimed; one added, untagged); five titles in session.e2e.ts, tuning.e2e.ts and tuning-webkit.e2e.ts re-aimed off / because the shelf's header and panel now live on /c/{id}/ only (deviation 1)"
  - "13-COPY-NEW.md: three rows (the resume line, the resume eyebrow, the hero's accessible description) and four questions from 13-07"
  - "vite.config.ts: the crawler ignores a 404 at exactly /playground/, /sandbox/ and /my-configs/ until 13-08, 13-10 and 13-12 land them, each removing its own path"
affects:
  - "13-08 (the Playground gallery; removes /playground/ from vite.config.ts's ignore; moves resolve('/c/[id]') in Intro.svelte with every other call site under D-20; the intro's Explore Playground and Resume draft point at its routes)"
  - "13-09 (deletes FrontDoor, Coverflow, NamePlate, ChosenPanel, slots.ts, the two opening-window tests in front-door.spec.ts, the ring order's meaning in front-door.ts, the three surviving row titles in first-experience.e2e.ts, and the 'stepping' half of the reduced-motion title; carries PREV-04)"
  - "13-10, 13-12 (remove /sandbox/ and /my-configs/ from the ignore list)"
  - "13-11 (fills the intro header's connection slot; the three header e2e titles re-aimed to /c/{id}/ here can come back to / then)"
  - "13-18 (the three ledgered strings and four questions)"
  - "13-20 (the counts; IDENT-01's glyph-field clause is now false in the tree; PREV-04; the note that 12-06 answered as-is so nothing was re-derived and nothing was deleted twice)"
tech-stack:
  added: []
  patterns:
    - "A route that needs its shell frame in the prerendered document declares the shape as page data; the layout reads page.data through a guard for the one render outside a Kit request (shell.spec.ts); snippets arrive with the effect and the frame does not move"
    - "An intro card is a pure function of the store and the clock (introCardFor), so the onMount path is one call and the branch is testable in node without a browser"
    - "A hero is derived from the membership list by a rule with a throw for the empty case, never chosen by index"
    - "A negative check whose expected outcome is 'nothing goes red' is run anyway and its greenness is the finding: a rule with no subject cannot be gated"
    - "When the harness's server dies mid-run, the suite is run in file chunks on a fresh server each and the counts are summed, twice, rather than one partial red being read as the suite"
key-files:
  created:
    - src/lib/ui/intro/Intro.svelte
    - src/lib/ui/intro/StartCard.svelte
    - src/lib/ui/intro/HeroSurface.svelte
    - src/lib/ui/intro/card.ts
    - src/lib/ui/intro.spec.ts
    - src/routes/+page.ts
    - .planning/phases/13-gui-overhaul/13-07-SUMMARY.md
  modified:
    - src/routes/+page.svelte
    - src/routes/+layout.svelte
    - src/lib/ui/shell/shell.svelte.ts
    - src/lib/catalog/front-door.ts
    - src/lib/catalog/front-door.spec.ts
    - src/lib/ui/FrontDoor.svelte
    - src/lib/ui/Wordmark.svelte
    - src/lib/ui/instrument.spec.ts
    - src/routes/c/[id]/+page.svelte
    - vite.config.ts
    - e2e/first-experience.e2e.ts
    - e2e/session.e2e.ts
    - e2e/tuning.e2e.ts
    - e2e/tuning-webkit.e2e.ts
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
    - .planning/STATE.md
  deleted:
    - src/lib/ui/Splash.svelte
    - src/lib/ui/glyph-field.ts
    - src/lib/ui/glyph-field.spec.ts
key-decisions:
  - "The hero is derived (first non-dark FRONT_DOOR member) and resolves to aurora, not the PDF's ARC; the difference is asked, not taken, because ARC is a Lua entry and / may not fetch the VM on first paint"
  - "Resume draft needs the flag AND a draft; every storage failure is a first visit; zero navigations on mount"
  - "The intro's shape travels as page data so the prerendered document carries the header; the layout falls back to it only when no effect has filled the shell"
  - "The ring order, slots.ts and the two opening-window tests stay until 13-09; the adjacency test alone lost its subject and was deleted"
  - "PadFrame's dot field is KEPT on the hero: it is the pad's unlit-cell mark, not texture; the PDF's matrix shows unlit cells with a visible pitch"
  - "Five e2e titles outside the plan's file were re-aimed to /c/{id}/ (Rule 3) rather than left red or deleted; their titles and tags did not move, so the e2e term stayed -6 / -6"
  - "The crawler's 404 ignore for the three not-yet-routed paths is exact-path and dated, and each landing plan removes its own"
patterns-established:
  - "Page data as the server's half of a shell fill (shellFromData)"
  - "introCardFor: the returning-visitor branch as a pure function"
requirements-completed: [IDENT-02, PREV-01]
duration: 50min
completed: 2026-09-11
---

# Phase 13 Plan 07: PDF Page 1 at /, and the End of the Coverflow's Ground Summary

**/ is the Bible's intro - flat, solid, typographic, with one live 9 x 9 surface running the real
simulator beside the words - and the returning visitor is never redirected: the local flag turns the
first card into `Resume draft` and nothing else moves. The splash, the glyph field and the ring's
adjacency property are deleted with every title named; the hero is derived from the front door's
membership list and resolves to Aurora, not the PDF's ARC, which is asked rather than taken.**

## Performance

- **Duration:** 50 min (08:31Z to about 09:21Z, the docs commit)
- **Started:** 2026-09-11T08:31:06Z
- **Completed:** 2026-09-11
- **Tasks:** 2 of 2
- **Files:** 24 in the two task commits (12 in task 1, 13 in task 2, `front-door.ts` in both), plus
  `STATE.md` and this file

## Commits

| Task | Commit    | Files                                                                                                                                                                                                                                                                        |
| ---- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01   | `d35a19d` | `src/lib/ui/intro/{Intro,StartCard,HeroSurface}.svelte`, `src/lib/ui/intro/card.ts`, `src/lib/ui/intro.spec.ts`, `src/routes/+page.svelte`, `src/routes/+page.ts`, `src/routes/+layout.svelte`, `src/lib/ui/shell/shell.svelte.ts`, `src/lib/catalog/front-door.ts`, `vite.config.ts`, `13-COPY-NEW.md` |
| 02   | `ed7926c` | `Splash.svelte`, `glyph-field.ts`, `glyph-field.spec.ts` (deleted); `FrontDoor.svelte`, `c/[id]/+page.svelte`, `instrument.spec.ts`, `Wordmark.svelte`, `front-door.ts`, `front-door.spec.ts`, `e2e/first-experience.e2e.ts`, `e2e/session.e2e.ts`, `e2e/tuning.e2e.ts`, `e2e/tuning-webkit.e2e.ts` |

**Two commits that are not this plan's landed between them**: `c303f4a docs(12): the third bench
round, verbatim` (`BENCH-2026-09-11.txt`) and `42bc5c6 docs(12.1): Gradient touch inserted after
Phase 12` (`.planning/ROADMAP.md`, one line in `.planning/STATE.md`). The tree is shared; neither
touches a file this plan touches; both are untouched here. The build embeds HEAD's sha, so the build
was redone at `42bc5c6` before the e2e passes (it is why `artifacts.e2e.ts` went red in the first
full run: the archive was stamped `d35a19d` while HEAD had moved). An untracked
`.planning/phases/12.1-gradient-touch/` also appeared and is somebody else's.

## The hard-band condition, and 12-06

`12-06-SUMMARY.md` exists and was read before the first edit. The answer was **as-is**: JOYSTICK
unchanged, no ring re-derived, `front-door.ts` and `front-door.spec.ts` untouched by 12-06. Since
then 12-10 moved one exclusion slot (`tpad` to `trackpad`, still out of the list) and 12-12 closed the
gate. Both front-door files were re-read immediately before editing: `git diff --stat f065c73` on
them showed only this plan's task-1 addition (29 lines, the hero). **The note for 13-20: nothing to
carry** - 12-06 spent no work on the ring, so this plan deleted nothing twice.

**Differences from the plan's reading of the files, named:**

- The plan says "`front-door.ts:150-176` asserts three properties". The file's header *prose* about
  the ring sat at `:150-166` (12-06 already said so); the *assertions* are in `front-door.spec.ts`,
  at `:229-268` on the tree read - and there are **three window/ring titles**, not one: *"no dark pad
  is in the opening window"*, *"the three largest pads at the opening all move"* and *"no two quiet
  pads are adjacent on the ring"*. The plan names only the last for deletion; the first two keep a
  live subject (the ring on `/c/{id}/`) until 13-09. A title the plan's list does not name stops the
  deletion, so they stay, and 13-09 is named in both files. See "The three titles quoted".
- The plan says `front-door.ts` exports "a ring order and a derivation table". The ring order is
  `FRONT_DOOR`'s own array order (no separate export) and the derivation table is the spec's
  `deriveMotion`, not the module's. Nothing to delete under either name; the header now says what
  the order still means and for whom.
- `front-door.ts:77 id: "arc"` is a row of `EXCLUDED_FROM_ROW`, not of `FRONT_DOOR`; see the hero.

## The baseline, carried from 13-06, and this plan's term written out

Observed on the clean tree at `f065c73` before the first edit: **88 files / 903 tests (+1 todo) /
84 e2e titles / 100 runs / check 604 / catalog 26 = 8 + 18 / sweep `4 19` / radius allowlist 13 rows,
28 declarations**. The plan carries `PREV_TESTS 899`; the tree is 903 because 13-06 landed `+10` not
`+7`, and 12-10 and 12-12 added `+1` with comments moved - **the offset is +4, stated once here**;
the term is applied to the observed 903.

| Count            | Carried (13-06) | Observed at `f065c73` | This plan                                                                                   | Observed at `ed7926c`                                    |
| ---------------- | --------------- | --------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| unit files       | 88              | **88**                | **+0** (`glyph-field.spec.ts` -1, `intro.spec.ts` +1)                                       | **88**                                                   |
| unit tests       | 899             | **903** (+1 todo)     | **-2** = `-5` (glyph-field) `+4` (intro) `-1` (front-door 8 -> 7)                           | **901** (+1 todo, `firmware-oracle.spec.ts:209`, unmoved) |
| e2e titles       | 84              | **84**                | **-6** = `-7` (first-experience) `+1` (the returning visitor)                               | **78** (`grep -c "test("` summed over `e2e/`)            |
| e2e runs         | 100             | **100**               | **-6** = `-7 +1`; none of the seven and not the added one is `@webkit`, so the halves are equal | **94** (78 chromium + 16 webkit-phone), green twice       |
| check            | 604             | **604**               | **+4** (+7 in task 1: four intro files, the spec, `+page.ts`, one more; -3 deleted in task 2) | **608**, 0 errors, 0 warnings                            |
| sweep            | `4 19`          | `4 19`                | unchanged                                                                                   | `4 19` (119 s)                                           |
| catalog / OG     | 26 / 26         | 26 / 26               | untouched                                                                                   | 26 OG images written by the build                        |
| radius allowlist | 13 rows / 28    | 13 / 28               | **+0**: the four intro files carry no radius; `Splash.svelte` had no row                    | 13 / 28; layer A 36 declarations in 58 files; layer B 36 in 10 built stylesheets, 6 of them 50% |

`npm run test:quick 2>&1 | node scripts/check-counts.mjs 88 901`: **matches, twice** (901 passed, 1
todo, 42.7 s the first time). `npm run test:sweep 2>&1 | node scripts/check-counts.mjs 4 19`:
matches. `npm run check`: 608 files, 0 / 0. `npm run lint` (prettier --check . and eslint .): clean.
**13-VALIDATION's `-2` and its per-file rows are what the tree measured; no document defect.**

## Task 1: PDF page 1, with the returning visitor changing one card

### What was built

- **`Intro.svelte`** - two columns at the PDF's measured proportions (638 : 619 across a 96 gutter,
  72 inset, 57 under the header, the eyebrow 37 lower), the cards at 108, the strip under a full-width
  divider in three equal columns; the headline is the one `<h1>` on the page (`smoke.e2e.ts` reads
  it). Below 1024 the columns stack. Every string is the PDF's: the eyebrow, `Make ZONA` / `your
  own.`, the two sub-lines, both cards' eyebrows / titles / bodies, `Already have a configuration?`
  / `Import config`, the bulleted line with its real apostrophe, `01 Explore` / `02 Shape` / `03
  Apply` and their sentences.
- **`StartCard.svelte`** - one link, two variants: `ruled` (raised surface, 3px action left rule, a
  48 x 48 filled action square with an arrow) and `bounded` (panel surface, 1px boundary, a 48 x 48
  outlined square with a plus). Both squares are squares (D-01). The `href` is typed
  `ResolvedPathname` so `svelte/no-navigation-without-resolve` accepts it - the rule is type-aware,
  which is why `Nav.svelte`'s typed literals pass and a `string` prop did not.
- **`HeroSurface.svelte`** - the panel: `TRY THE SURFACE`, the filled `BROWSER PREVIEW` chip (a
  rectangle, D-10), the pad through `PadFrame`/`PadCanvas`, the caption pair `AURORA / SHOW` and
  *"Drag across the surface to preview"*. One `SimHost(motionDeps())`, engine and catalog by dynamic
  import in `onMount`, `register` + `setHero` once the host, the engine and the canvas exist,
  pointer handlers on the wrapper mapping through `mapAxis`. The canvas keeps `pad-canvas-<id>` and
  `pad-<id>`, so the e2e helpers read it unchanged.
- **`card.ts`** - `introCardFor(store, now)`, `relativeTime`, `resumeLine`, `RESUME_EYEBROW`,
  `heroDescription`.
- **`+page.svelte`** - the OG block's thirteen tags with `SITE_ORIGIN` and `ogAlt` as before; the
  store read in `onMount` through a guarded accessor (the property access inside the try), the card
  set from the read, the flag marked after it; `$effect(() => fillShell({ variant: "intro",
  secondary }))` with the `Quick guide` snippet pointing at `#quick-guide`, the strip.
- **`+page.ts`, `shellFromData`, the layout's `declared()`** - see "The prerendered header".
- **`vite.config.ts`** - the three exact paths.

### The hero: aurora, not ARC

`heroOf(FRONT_DOOR)` is the first member whose motion is not `dark`, in list order; a row of nothing
but dark throws (*"every front-door member rests black: there is no hero to open with"*), and the
spec proves both the skip and the throw on rows this list does not have. **It resolved to `aurora`
(Aurora, animated) - not ARC.** `intro.spec.ts` test 4 prints `intro hero: aurora (Aurora), motion
animated; ARC on the PDF, not ARC here`, and `front-door.spec.ts` prints `front-door hero: aurora,
motion animated`. ARC is in `EXCLUDED_FROM_ROW` (a hand-authored Lua entry, `preview: "lua"`);
making it the hero would put the 271 KB Lua VM on the first paint of `/`, which `e2e/tuning.e2e.ts`
forbids in words and `front-door.spec.ts` requires `padsim` of every member for. The caption
therefore reads `AURORA / SHOW` (the hero's name and its FOR term, `listingById(id).tags[0]`)
where the PDF reads `ARC / MODULATION`. **Recorded as question 1 in the ledger** (D-01).

### The OG alt text, and the head

`og:image:alt` reads **"The Aurora configuration running on a ZONA’s 9 by 9 pad."** - `ogAlt(HERO.name)`,
unchanged in content because the hero is the same entry the ring opened on. `og:image` is
`/og/aurora.png`. The `description` and `og:description` changed content: from *"A shelf of ZONA
configurations..."* to the PDF's **"Make ZONA your own. Find a gesture you love. Build a surface that
works the way you do."** Shape: thirteen tags, the same order, read back from `build/index.html`.

### The prerendered header

`fillShell()` runs from an effect, which never runs on the server, and the layout's `{#if fill}` is
evaluated before the page's script (the page renders as the layout's children). So an effect alone
ships `/` without a header and grows one at hydration - a 76px shift on the first impression. The
intro therefore declares `{ shell: { variant: "intro" } }` from `+page.ts`; `shellFromData(data)`
validates it (variant, optional section); the layout's `fill` is `shell.fill ?? declared()`, where
`declared()` reads `page.data` inside a try because `$app/state`'s `page` throws outside a Kit
request - `shell.spec.ts`'s `render(Layout)` is that one place, and there it reads as no shape.
`intro.spec.ts` test 1 proves the server path by rendering the layout with a `__request__` context
carrying the data (header with `data-variant="intro"`, `<main class="centre intro">`, no `<nav>`)
and with empty data (no header). `build/index.html` carries the header; `quick-guide` is absent
from it (the snippet arrives with the effect) - stated, not hidden.

### The returning visitor

`resume` only when `hasSeenIntro(store)` **and** `newestDraft(store)` both answer - a flag with no
draft is a visitor who looked and left, and `Explore Playground` is still right for them. The
resume card: eyebrow `PICK UP WHERE YOU LEFT OFF`, title `Resume draft`, body
`Draft · Aurora, my way · Last edited 12 minutes ago`, `href` through **`resolve("/c/[id]", { id:
draft.source })`** - the address helper `CatalogCard.svelte` uses today, so 13-08's move-clean
(D-20) carries `Intro.svelte:77` with every other call site. A Sandbox draft points at `/sandbox/`.
`Explore Playground` -> `SECTIONS[0].href` (`/playground/`), `Build in Sandbox` -> `SECTIONS[1].href`
(`/sandbox/`), `Import config` -> `SECTIONS[2].href` (`/my-configs/`): the nav's one declaration.
**None of the three routes exists yet** (13-08, 13-10, 13-12); the e2e suite walks none of them
(`fidelity.e2e.ts` asserts only that no `/dev/` link is on `/`); the prerender crawler would have
failed the build on the 404s, so `vite.config.ts` ignores exactly those three paths with each plan
named to remove its own. `build/` contains no `playground/`, `sandbox/` or `my-configs/` directory.

### Storage, the safe direction

`introCardFor` never throws: `undefined` (the server), a store that throws on property access (a
Proxy - the fake asserted non-vacuous), a store that throws on use, a corrupt flag and a corrupt
drafts envelope all read `explore`; `markIntroSeen` on the refusing store returns `false`. The flag
is written once - `intro.spec.ts` and the new e2e title both check the moment does not move on a
second visit.

### The four tests, and the uppercase rule

1. Structure: every PDF string present; one `<h1>`; `.own { color: var(--color-action) }`; **the
   uppercase set is exactly six**: the eyebrow, the two card eyebrows, the panel label, the chip -
   the plan's five - **and the hero's caption**, which the PDF sets in uppercase too
   (`ARC / MODULATION`) and the plan's list omitted. Plus the server-render half above.
2. First visit `explore`, flag-only `explore`, flag+draft `resume` with name and "12 minutes ago";
   `relativeTime` at eight ages; **zero navigations**: the scan (`goto(`, `$app/navigation`,
   `location.*`, `pushState(`, `replaceState(`, `redirect(`, `http-equiv`, `window.open(`) catches
   a plant first, then reads all six route files clean; the store is named once, inside the guarded
   accessor, called once, inside `onMount`, after which the flag is written.
3. The throwing store, four ways, renders the first-visit page.
4. The hero: `heroOf` on the list, on a dark-first row and on an all-dark row; `restsBlack` false and
   `preview` `padsim` from the catalog; one `pad-canvas-<id>` with its name and description; the
   source carries `new SimHost(motionDeps())`, `register`, `setHero`, the dynamic imports and no
   static one of the compile surface, the three pointer handlers, `touchDown/Move/End` and
   `mapAxis`; `host.ts` carries `rootMargin: "200px"` and `threshold: 0`.

### Three negative checks, restored from scratch copies with sha256 either side

| Plant                                                                                            | Expected      | Observed                     | Restore |
| ------------------------------------------------------------------------------------------------ | ------------- | ---------------------------- | ------- |
| `goto("/playground/")` in `onMount` when the card is `resume`, with the import                    | test 2 red    | test 2 red, 3 green          | `065f705c` = `065f705c` |
| a refused store assumed seen: `introCardFor` returns a resume card for a draft never made         | test 3 red    | test 3 red, 3 green          | `fd6b4ec9` = `fd6b4ec9` |
| `FRONT_DOOR_HERO` pointed at `{ id: "trackpad", motion: "dark" }`                                | test 4 red    | test 4 red, 3 green          | `c8525329` = `c8525329` |

Each plant asserted exactly one occurrence of its from-string before replacing it; 4 green after
every restore.

## Task 2: the splash, the glyph field and the orphaned property

### Proved before deletion

`grep` for `Splash.svelte` imports: `FrontDoor.svelte:115` only. `grep` for `glyph-field`:
`Splash.svelte:33` and the spec only. `it.todo` / `test.todo` in `glyph-field.spec.ts`: **0**.
`grep -c "^  it("` in `front-door.spec.ts`: **8**. `@webkit` in `first-experience.e2e.ts`: none on
any title (the one hit after the rewrite is this SUMMARY's own sentence in the file header).

### The five unit titles deleted, verbatim (`src/lib/ui/glyph-field.spec.ts`, whole file)

- *"is byte-identical across two builds, because the seed is the identity"*
- *"lays out between six and ten blocks and exactly four punched rectangles"*
- *"draws only the five glyphs, each at an alpha inside the declared range"*
- *"punches rectangles that are inside the viewport and inside the size range"*
- *"has a PRNG that stays in [0, 1) and repeats itself for one seed"*

### The three `front-door.spec.ts` property titles, quoted from the file

- *"no dark pad is in the opening window"* - **kept**; its subject, the seven-wide window of the ring
  the coverflow renders on `/c/{id}/`, survives until 13-09.
- *"the three largest pads at the opening all move"* - **kept**, for the same reason; 13-09 named in
  the file.
- *"no two quiet pads are adjacent on the ring"* - **deleted**, by name, with a comment where it stood.

The two the plan calls "re-aimed at the hero" are the derivation pair, retitled and widened, still
reading the fixture (aurora has a golden row; nothing weaker was needed):

- *"the declared motion is what the golden frames record"* -> *"..., for every member and for the
  hero"*: the hero's declared motion equals `deriveMotion(hero.id)`, is not dark, and is
  `heroOf(FRONT_DOOR)`; the id is printed.
- *"the excluded entry is excluded because it is dark, and the catalog agrees"* -> *"..., the catalog
  agrees, and the hero does not rest black"*: `byId(hero.id).restsBlack === false` and
  `preview === "padsim"`; the `tpad` fixture row is still read as before.

### `FrontDoor` lost the prop, not the file

`FrontDoor.svelte` lost the `Splash` import, the `splash` prop, `opensWithSplash`, the `opening` and
`covered` state, the speech hold (`session.holdSpeech()` stays on the store with its own spec and no
caller), the `{#if opening}` block, `data-splash`, `class:covered`, the `.wordmark.covered` rule and
the wordmark's opacity transition; `BrowseLink`, `DeviceSlot` and `DeviceNote` take `covered`'s
default. The header says when and why. The component itself stays for `/c/{id}/` until 13-09
(13-VALIDATION D-5); `c/[id]/+page.svelte` dropped `splash={false}`; `instrument.spec.ts`'s
`FRONT_DOOR_ONLY` lost its Splash row (the walk subtracts from the directory, so a deleted file needs
none); `Wordmark.svelte`'s comment follows. `Coverflow`, `NamePlate`, `ChosenPanel`, `PadSpinner`,
the ring order and `slots.ts` are untouched.

### The seven e2e titles deleted, verbatim (`e2e/first-experience.e2e.ts`), none `@webkit`

- *"the front door animates"*
- *"the row steps with the keyboard and wraps"*
- *"the splash opens the front door and clears itself"*
- *"any key cuts straight to the dissolve"*
- *"choosing reveals the panel, and Escape and Back both close it"*
- *"a deep link lands with that configuration centred and skips the splash"*
- *"the row's painted frames over two seconds are recorded"*

**Four re-aimed, titles unchanged:**

- *"a still configuration really is still"* -> `/c/ninepads/`, the shelf centred on the static entry.
- *"with no Web Serial the control is present, disabled, and says why"* -> `/c/aurora/`'s panel; the
  intro's connection slot is 13-11's, so the controls that degrade are the workspace's.
- *"reduced motion stills the pads and makes stepping instant"* -> the **stilling half on the intro's
  hero** (the plan's "re-aim the first at the hero"), the **stepping half on the shelf** at
  `/c/aurora/`, which is where stepping exists until 13-09; both halves under `emulateMedia`.
- *"every configuration is a real file with its own description, and an off-row page is a row of
  one"* -> **unchanged**: it never visited `/`; its subject (`/c/<id>/` for every routed entry, the
  row of one, the unknown id) is alive until 13-08 moves the address and 13-09 removes the row.
  Not moved to `browse.e2e.ts` and not re-aimed at a gallery that does not exist yet; said here.

**One added, untagged, chromium only:** *"a first visit sees the intro with its hero running, a
returning visitor is offered their draft, and neither is redirected"* - the intro with
`start-explore`, one pad canvas, the hero's backing store changing over 400 ms, the flag written as
`{ schema: 1, seen: true, at }`; a planted Playground draft twelve minutes old; after `reload`
`start-resume` with *Resume draft*, the name and *Last edited 12 minutes ago*, `href` at
`/c/aurora`, `framenavigated` on the main frame counted at exactly one (the reload) after settling,
the path still `/`, the hero still live, the flag's `at` unchanged.

### The re-aims outside the plan's file (deviation 1)

The tree had five more titles that opened `/` for the shelf's header, its splash or its panel, which
`/` no longer renders; each was re-aimed with its title and tag unchanged, so the e2e term did not
move:

| File                     | Title                                                                                                        | What changed                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session.e2e.ts`         | *"the header shows the module a visitor connected to"*                                                       | `goto("/")` -> `goto("/c/aurora/")`; the header with the device slot lives there                                                                                                                                                             |
| `session.e2e.ts`         | *"one connection survives the front door, a configuration and the catalog"*                                  | the walk starts on `/c/aurora/` and still ends on `/` through the browse page's wordmark, asserting the same document, one open and zero requests on the intro (which has no slot until 13-11); the fresh-document half reloads `/` (stamp gone, opens 0) then opens `/c/aurora/` as a second fresh document for S2 |
| `session.e2e.ts`         | *"@webkit the header names the browsers that can install and offers nothing to press @webkit"*               | `goto("/c/aurora/")`; `waitForFrontDoor`'s splash count stays as a zero that can only be trivially true, said in its comment                                                                                                                 |
| `tuning.e2e.ts`          | *"a knob turn changes the pad"* - the `/` no-WebAssembly assertion                                           | **kept on `/`**: waits for the intro and the hero's picture (`FRONT_DOOR_HERO.id`), then asserts no `.wasm` was fetched                                                                                                                      |
| `tuning-webkit.e2e.ts`   | *"the front door opens and a pad is animating @webkit"*, and the `choose()` helper                           | measured on the intro's one pad (`count === 1`), **scrolled into view first** - on the phone the columns stack and the hero sits below the fold, where the host never ticks an off-screen pad (measured: lit and unchanging for the whole 10 s poll without the scroll); `choose()` opens `/c/aurora/` |

`smoke.e2e.ts` (an `<h1>` on `/`), `fidelity.e2e.ts` (no `/dev/` link on `/`) and `radius.e2e.ts`
(layer C over `/`) needed nothing: the intro's headline is the h1, it links to no probe, and it
computes no radius.

### The e2e suite, and the harness

`npx playwright test --workers 3` was run three ways. The first, on a wrangler started from this
session in the background: the server died 272 s in, 30 of 32 reds were connection refusals, and
the other two were `install.e2e.ts` `waitForPicture` timeouts (the family the orchestrator named).
The second, on a wrangler started detached through PowerShell with two agent variables cleared and
no agent banner: the server died 85 s in, 14 of 17 reds were refusals, one was `artifacts.e2e.ts`
*"the static build is complete"* because HEAD had moved under the build (see Commits), and the last
two refusals. Both deaths are the same empty `ProxyController` error 13-05 recorded, in wrangler's
own log with `durationMs` and *"consider upgrading to 4.131.0"*; the pin is not this plan's to bump.

So the suite was run in **five file chunks, each on a fresh detached server killed afterwards**
(install 17; session 16; tuning + tuning-webkit 20; browse + browse-webkit 21; first-experience +
smoke + skeleton + fidelity + catalog + artifacts + radius 20): **94 runs**. The first pass had one
red - the re-aimed phone-engine title above, before the scroll - and the tuning chunk was rerun
alone twice green after the fix (20 / 20, 20 / 20). Then the **whole chunked suite was run a
second time: 94 / 94 green, every chunk**, on the rebuilt `build/` at `42bc5c6`. `radius.e2e.ts`
layer C (`@webkit`, over `/` among its routes) ran in both passes in both engines; the WebKit
browser is present. No red was accepted on one reading.

### Two negative checks, restored from scratch copies with sha256 either side

| Plant                                                                                               | Expected                                             | Observed                                                                                       | Restore                 |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------- |
| `starfield` and `joystick` swapped so `ninepads` and `joystick` (both quiet) sit side by side, with the adjacency rule gone | **nothing red** - the point                          | `front-door.spec.ts` 7 + `intro.spec.ts` 4 = **11 green**                                      | `6b7fc6fe` = `6b7fc6fe` |
| `FRONT_DOOR_HERO` pointed at `euclid` (excluded, Lua)                                              | the re-aimed motion test red                         | **both** re-aimed front-door tests red (no golden row for `euclid`; `preview` `lua`) and intro test 4 red; 8 green | `6b7fc6fe` = `6b7fc6fe` |

The first is worth its sentence: a rule with no subject cannot be gated, and the greenness is the
finding, not a miss.

### `grep -rn "glyph\|Splash" src/`, pasted

```
src/lib/browse/typographic.ts:34: * glyph, so the one character this file is about cannot be lost to an encoding
src/lib/tune/copy.spec.ts:389:      // how a copy contract loosens one glyph at a time, so the scope is a
src/lib/tune/copy.spec.ts:466:    // worth more than one that prints two glyphs a reader has to tell apart.
src/lib/tune/copy.spec.ts:484:    // Exactly one occurrence of the glyph in the CODE of the whole of src/,
src/lib/tune/copy.ts:31:// loosens one glyph at a time.
src/lib/tune/copy.ts:136: * contract exists to prevent - and it is also the wrong glyph: U+002D is a
src/lib/ui/FrontDoor.svelte:11:  and `covered` state, the speech hold and the Splash layer left with it;
src/lib/ui/FrontDoor.svelte:12:  Splash.svelte and glyph-field.ts were deleted in the same commit. The
src/lib/ui/instrument.spec.ts:247: * have to be able to demand an edit to it. Splash.svelte, the arrival
src/lib/ui/instrument.spec.ts:248: * ceremony, was the third row until 13-07 deleted the file with the glyph
src/lib/ui/intro/Intro.svelte:11:  it; so does this file. There is no splash, no dissolve, no glyph field and
src/lib/ui/intro/StartCard.svelte:14:  and the square is decorative (aria-hidden): the glyph repeats what the title
src/lib/ui/intro/StartCard.svelte:51:  const glyph = $derived(variant === "ruled" ? "↗" : "+");
src/lib/ui/intro/StartCard.svelte:60:  <span class="square" aria-hidden="true">{glyph}</span>
src/lib/ui/TagChip.svelte:10:  checkbox already is - so there is no x, no glyph and no second control per
```

Not empty, and the plan's "returns nothing" was never reachable: "glyph" is an ordinary word in five
files that were never about the field (a card's arrow is a glyph), and the four `Splash` hits are
the comments that say the file was deleted. **No import, no module and no component named either
remains**; the e2e files carry the same kind of sentence.

## The dot field, decided

**Kept.** 13-04 kept `PadFrame`'s dot field and left the question to this plan. The hero renders
through `PadFrame`, so the intro's pad has the dots and the gutter grid. The reason: it is the pad's
unlit-cell mark, not a texture - `aesthetic.spec.ts` scan 8 asserts it, and the PDF's own matrix
draws its unlit cells as dark cells with a visible pitch, which is exactly what the two CSS layers
give an unlit cell. The Bible's section 3 declines texture on the intro and nothing was added: the
panel and the chip are solid, and the one light is the light output's own bloom on the hero frame.
`Splash.svelte:318`'s halftone `.grain` - the last "halftone" in `src/` - left with the file.

## Strings, and the ledger

Every visible string on the intro is the PDF's verbatim and is not ledgered. **Three rows landed**
(the plan says two; the third is a case change, said so): `resumeLine` - *Draft · {name} · Last
edited {edited}* with the eight age forms; `RESUME_EYEBROW` - *PICK UP WHERE YOU LEFT OFF* (the
Bible's sentence as a label); `heroDescription` - *A live simulation of {name} running in your
browser. Drag across it to play it; nothing is sent to a ZONA.* Uppercase on the page: the six
labels test 1 asserts, and nowhere else.

## PREV-04

**PREV-04 is now half-reached and is not being ticked.** The intro's hero takes mouse-as-finger
input through the host (this plan); 13-09 builds the workspace's `Configure` / `Play` switch and
13-16 the Sandbox's; **13-09 carries the row in its frontmatter**, not 13-10; 13-20 decides whether
the three close it. `REQUIREMENTS.md` is untouched; **CAT-04 stays `[ ]`**.

## Deviations from the plan

### 1. [Rule 3 - blocking] Five e2e titles in three files outside the plan's list re-aimed off `/`

`session.e2e.ts` (three), `tuning.e2e.ts` (one, kept on `/` against the hero) and
`tuning-webkit.e2e.ts` (one plus the `choose()` helper) opened `/` expecting the splash, the
coverflow, the front door's header or its panel. Left alone they are red on every run; deleted they
would move the e2e term. Re-aimed with titles and tags unchanged; listed above.

### 2. [Rule 2 - correctness] The intro's shape as page data, and the layout reading it

`+page.ts`, `shellFromData` in `shell.svelte.ts`, and `declared()` in `+layout.svelte` are not in the
plan's file list. Without them the prerendered `/` has no header and grows one at hydration; the
plan's own "the prerendered HTML ... survive[s]" needs the header in it. The unfilled shape 13-05
left is unchanged for the routes that still draw their own.

### 3. [Rule 3 - blocking] `vite.config.ts` ignores a 404 at the three not-yet-routed paths

The plan permits the links; the prerender crawler would have failed the build on them. Exact paths,
each plan named to remove its own.

### 4. [Plan vs tree] Two window titles kept; the plan's "three properties" are five ring titles

Named in "The hard-band condition". Deletion list obeyed to the letter.

### 5. [Plan vs tree] The uppercase set is six, not five

The PDF's caption `ARC / MODULATION` is uppercase and the plan's list omitted it; test 1 asserts six
and names the sixth.

### 6. [Plan vs tree] `card.ts` is a fifth intro file; three strings ledgered, not two

The card derivation and the relative time are pure and live beside the components rather than
inside `+page.svelte`, so test 2 can drive the mount path in node. The resume eyebrow is the third
row.

### 7. [Rule 1] The phone-engine hero title scrolls the surface into view

Below the fold on a 393x659 viewport the host never ticks the pad, by design; the test now scrolls
first. Recorded as a question too: whether the surface should come before the words on a phone.

### 8. [Process] `npm run build` twice more than the plan's two

Once after the task-1 negative checks restored mtimes (radius layer B is red on a stale build), once
because HEAD moved under the build (`artifacts.e2e.ts` reads the archive's sha).

### 9. [Process] The e2e suite run in five chunks on fresh servers, twice

Because wrangler 4.128.0 dies mid-run however it is started; every chunk green in both passes.

### 10. [Process] `gsd-tools state` commands not run; STATE.md by script against a copy

`advance-plan`, `update-progress`, `roadmap update-plan-progress`, `requirements mark-complete`,
`record-metric`, `add-decision` and `record-session` were not run. The script asserted `status:
executing`, `completed_phases 11`, `percent 100`, `total_phases 14`, `total_plans 160` unchanged and
the Phase 12.1 line `42bc5c6` added present, moved `completed_plans` 142 -> 143, added the P07
metrics row, six `[Phase 13]: 13-07:` decisions, a dated clause on the `Concurrent` line, the new
`Status:` with the previous retained as `(12-12)`, and `Last session` / `Stopped at` with the
previous stop retained. Phase 12's `Plan:` line and status are as 12-12 left them (gate landed,
bench pending). The `last_updated` value follows the file's own convention (local clock, `Z`
suffix) so it stays monotonic. `.planning/ROADMAP.md` and `REQUIREMENTS.md` are untouched by this
plan; `.planning/phases/12-touch-framework/` untouched.

## What the plan asserts that the tree does not support

1. **`PREV_TESTS 899`** - the tree was 903; offset +4 stated once above.
2. **"`front-door.ts:150-176` asserts three properties"** - the assertions are in the spec, and there
   are five ring-related titles; the two the plan does not name were kept.
3. **"a ring order and a derivation table" as exports** - neither exists as a separate export.
4. **"`grep -rn "glyph\|Splash" src/` returns nothing"** - unreachable; pasted above.
5. **"the only uppercase strings ... the eyebrow, the two card eyebrows, the chip and the panel
   label"** - the PDF's caption is a sixth.
6. **"the header carries ... an outlined `Connect ZONA`"** - 13-05 reserved the connection slot for
   13-11 and built nothing in it so two plans cannot build one control; this plan built nothing in it
   either. The intro header today carries the wordmark, `FOR ZONA`, `Quick guide` and the empty
   reserved box.
7. **"Two strings ledgered"** - three (the eyebrow is a case change of a Bible sentence).
8. **"`npx playwright test --workers 3` at 94" as one run** - unreachable on this machine with the
   pinned wrangler; 94 twice in chunks.
9. **The headline at "62-66px"** - rendered with 13-03's `.type-display` at 60px / 0.95 (D-17's
   measured scale as declared); a local override was not written. Said, not hidden.

## Questions recorded for the user rather than answered (D-01)

Four in `13-COPY-NEW.md`'s "From 13-07": the hero is Aurora not ARC (and the caption follows);
`Quick guide` points at the page's own strip; `Import config` points at My configs; the resume
eyebrow is a case change of a Bible sentence. And two here: on a phone the stacked layout puts the
live surface below the words - should it come first?; and the headline is 60px by the declared role
where the research measured 62-66.

## Known Stubs

None that prevent the plan's goal. The three card links point at routes that 13-08, 13-10 and 13-12
land (recorded, dated, ignored by the crawler by exact path); the intro header's connection slot is
empty by 13-05's design until 13-11. Neither is a hardcoded empty value flowing to the UI.

## Notes for the next plans

- **13-08:** remove `/playground/` from `vite.config.ts`'s ignore in the commit that lands the route;
  `Intro.svelte:77` is a `resolve("/c/[id]")` call site for the move-clean; the returning-visitor e2e
  title asserts the resume `href` matches `/c/aurora` and moves with it.
- **13-09:** `FrontDoor.svelte`, `Coverflow`, `NamePlate`, `ChosenPanel`, `slots.ts`; delete
  `front-door.spec.ts`'s two window titles by name and the ring-order meaning in `front-door.ts`'s
  header; the three row titles in `first-experience.e2e.ts` and the stepping half of the
  reduced-motion title; the `waitForFrontDoor` helpers in `session.e2e.ts` and `tuning-webkit.e2e.ts`
  still count a splash that cannot exist; `session.holdSpeech()` has no caller. PREV-04's row.
- **13-11:** the intro header's connection slot; the three header titles re-aimed to `/c/aurora/` can
  return to `/`.
- **13-18:** three rows and four questions.
- **13-20:** the counts above; IDENT-01's "generative glyph-field texture" clause is false in the tree
  since `ed7926c`; 12-06 answered as-is, so nothing was re-derived and nothing deleted twice.
- **The harness:** wrangler 4.128.0's empty `ProxyController` death is reproducible in any run over
  about 85 s; `scripts/` has no chunk runner - the one used lives in the scratchpad and is described
  above.

## Self-Check: PASSED

- `src/lib/ui/intro/Intro.svelte`, `StartCard.svelte`, `HeroSurface.svelte`, `card.ts`,
  `src/lib/ui/intro.spec.ts`, `src/routes/+page.ts`: FOUND.
- `src/lib/ui/Splash.svelte`, `src/lib/ui/glyph-field.ts`, `src/lib/ui/glyph-field.spec.ts`: ABSENT,
  as required.
- Commits `d35a19d`, `ed7926c`: FOUND in `git log`.
- `git diff --stat HEAD -- src/vendor/`: empty. `git diff --quiet -- .planning/ROADMAP.md`: exit 0.
  `firmware-oracle.spec.ts`: unedited. `.planning/phases/12-touch-framework/`: untouched.
- No device, no deploy, no push. The three untracked root files and
  `.planning/phases/12.1-gradient-touch/` are not this plan's.
