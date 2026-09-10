---
phase: 13
slug: gui-overhaul
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-10
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. `docs/TESTING.md` (rewritten
> by plan 13-20) is the developer-facing companion and deliberately does not duplicate the map below.
>
> Binding upstream, in this order: **`13-CONTEXT.md`** (fourteen decisions, every one binding; where
> a decision and the research disagree, **the decision wins** and this document says so by name),
> `bible/HANGAR-ZONA-GUI-design-specification.md` and `bible/HANGAR for ZONA.pdf` (the Bible - the PDF
> is primary on look, the spec on behaviour), `13-RESEARCH.md` (measured rather than argued; its
> firmware and cost figures are HIGH confidence and its PDF geometry is MEDIUM),
> `12-VALIDATION.md` and the twelve Phase 12 SUMMARYs (the carried counts and the touch library's
> final shape), `ROADMAP.md` Phase 13.

---

## Test Infrastructure

| Property | Value |
|---|---|
| **Framework** | vitest 4.1.11, projects `server` (quick) and `sweep`; @playwright/test 1.62.1 over `wrangler dev` on `./build`, projects `chromium` and `webkit-phone` (grepped on `@webkit`) |
| **Config file** | `vite.config.ts` and `playwright.config.ts` — **neither is edited in this phase.** The Sandbox compiler's cost gate is a **server** spec by 12-07's precedent, so the sweep's member list does not move |
| **Quick run** | `npm run test:quick` (`vitest run --project server`) |
| **Sweep** | `npm run test:sweep` (`vitest run --project sweep`) |
| **Wave run** | `npm run check && npm run lint && npm run test:quick`, plus `npm run test:sweep` for every wave that changes an entry's Lua, a knob's value list, an entry name, or anything under `src/vendor/` (nothing does) |
| **Full suite** | the wave run plus `npm run build` and `npx playwright test --workers 3` |
| **Count gate** | `… 2>&1 \| node scripts/check-counts.mjs <files> <tests>` — carried plus delta, never a literal total. **This phase is the first to hand it a negative delta**, which is why 13-01 proves it against one before any deletion lands |
| **New dependencies** | **none.** `@intechstudio/grid-protocol` stays at the exact pin; `wasmoon` at `1.16.0`; no chart, no icon set, no component kit |
| **Hardware** | **none, to any agent.** Four bench rows exist (D-07's slot probe, D-06's page switch, D-08's Knob, the Sandbox install); 13-02 hands over the first because a branch depends on it, and 13-20 hands over the rest |

---

## Baselines: carried by name from 12-12

Phase 13 asserts nothing against a literal it did not observe. The block below is **12-VALIDATION's
projection of Phase 12's close**, carried here **as a projection, not as a measurement**:

**quick `85 / 888` (+1 todo)** · **sweep `4 19`** · **e2e `87` source titles / `106` runs
(87 chromium + 19 webkit-phone)** · **`svelte-check` 582, 0/0** · **catalog `27`** (9 preset + 18 Lua) ·
**`static/og/` 27 files** · **audition 23 rows**.

**13-01 is the first plan to run the suites and it re-measures the whole block from `12-12-SUMMARY.md`
before it asserts anything.** If Phase 12 closed at different numbers - and it may, because 12-06's
`replace` branch takes the catalog to 26 and its OG and audition chains with it - **the observation is
Phase 13's baseline and the difference is reported, never reconciled.** Every literal in the "Expected
deltas" table below moves with it by the same offset, and 13-20 names the offset once.

### The carry-forward block

| Name | What it is | How it moves |
|---|---|---|
| `PREV_FILES` / `PREV_TESTS` | the `test:quick` file and passing-test counts as the previous plan left the tree | start at 12-12's observed pair; re-measured by every plan; copied verbatim when a plan asserts `+0` |
| `BASE_SWEEP` | `4 19` | **never moves.** The Sandbox's cost gate is a server spec for exactly this reason, and 13-14 says so |
| `PREV_E2E` | titles / runs, with the plan that measured it | starts at 87 / 106; **seven plans move it** - 13-01, 13-04, 13-07, 13-12, 13-13, 13-16 and 13-17 - **and the count of them is asserted at 13-20 against every prose statement of it** |
| `BASE_CATALOG` | 27 | **never moves in this phase.** Twenty-seven names are re-cased at 13-19; no entry is added or removed. Every plan states the running size as a chain of zeros |
| `BASE_OG` | 27 files | unchanged in count; **`ogAlt` moves at 13-19** with the names, so the images are re-rendered and their bytes recorded |
| `BASE_AUDITION` | 23 | unchanged. The phase's bench rows are **runbook** rows (`docs/INSTALL-RUNBOOK.md`) and one probe document, not per-entry audition rows |

`svelte-check`'s file count is provenance only and is reported, never asserted.

---

## The chains, twenty terms each, every zero written out

**One term per plan, twenty plans, twenty terms.** The term count is itself asserted at 13-20 against
every prose statement of it in this document and in that plan.

```
              01  02  03  04  05  06  07  08  09  10  11  12  13  14  15  16  17  18  19  20
tests   888   +2  +0  +5  -9  +6  +7  -1  +3  +2  -1  +3  +6  +8  +9  +7  +6  +3  +0  +0  +0  = 944
files    85   +1  +0  +0  +0  +1  +1  +0  +0  +0  -1  +0  +1  +2  +2  +1  +1  +0  +0  +0  +0  =  94
e2e ttl  87   +1  +0  +0  -4  +0  +0  -6  +0  +0  +0  +0  +1  +1  +0  +0  +2  +1  +0  +0  +0  =  83
e2e run 106   +2  +0  +0  -8  +0  +0  -6  +0  +0  +0  +0  +1  +1  +0  +0  +2  +1  +0  +0  +0  =  99
catalog  27   +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  =  27
og       27   +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  =  27
audition 23   +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  =  23
sweep   4 19   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -   -  = 4 19
```

**Four of these terms are negative, and that has never happened in this project.** `-9` at 13-04,
`-1` at 13-07 and `-1` at 13-10 on tests; `-1` at 13-10 on files; `-4 / -8` at 13-04 and `-6 / -6` at
13-07 on e2e. **Every deleted test title is named in the plan that deletes it and again at the gate.**
The e2e runs move by twice the titles wherever a `@webkit` title is involved and by once elsewhere,
which is the arithmetic 13-20 asserts:

```
titles 87 - 5 (aesthetic.e2e, all @webkit) + 1 (radius, @webkit) + 1 (reduced motion re-homed, @webkit)
          - 7 (first-experience: the splash and coverflow titles) + 1 (the intro)
          + 1 (the page target) + 1 (import validation) + 2 (the Sandbox) + 1 (the Sandbox install) = 83
tagged 19 - 5 + 2 = 16        runs 83 + 16 = 99
```

**The sweep's row is dashes rather than zeros because it is a member list, not a running total.**

---

## Where this document corrects the research, and where a decision overrules it

`13-RESEARCH.md` is measured rather than argued, and its firmware findings are the phase's ground
truth. Six of its recommendations are **overruled by a user decision**, and planning found seven more
things. Each is named here rather than in a SUMMARY, because they are corrections to this document's
own upstream.

### D-1. The research recommended read-only page targeting; D-06 chose switching now

Research Q6 recommends **(a) read-only for v1, (c) as the next step**, and says *"(b) alone is not
acceptable."* **D-06 chose the switch**, inside an envelope that is exactly the research's own (c):
click-only, a destination review naming both pages, ACK-gated on the module's own report, per-page
snapshots, one bench row, `PAGEDISCARD` researched. So the decision is (c), not (b), and the
research's own objection is answered by the envelope rather than overridden. 13-12 builds it.

### D-2. The research recommended deferring Collections; D-13 ships them

Research Q12 recommends **defer to v2** because §11 never mentions them. **D-13 ships them in v1**,
and the plan therefore has to write the specification the Bible never wrote. **Every fork in that
specification is a question**, not a planner's choice: 13-13 carries one `checkpoint:decision` with
four forks - membership, delete-with-undo, the empty state, and the interaction with export.

### D-3. The research recommended a knob be a vertical fader; D-08 made it a rotary

Research Q1 recommends **(a), free, reusing the fader branch**. **D-08 chose (b)** - a real rotary
gesture, angle around the region centre with a wrap-safe accumulator, `math.atan` from the firmware's
own opened `math` library, at an estimated **+150-200 characters**. 13-15 measures the real figure and
the estimate is not carried. **The minimum region size is arithmetic, not taste**, and 13-15 derives
it: touch is continuous 0..127, so a 3x3 region spans ~42 raw units per axis and `atan` is stable
everywhere except within about one cell of the centre - so the constraint is a **centre dead zone**,
not a cell count. The "nine cells of travel" figure in D-08 and in the research is about *visual*
feedback on the LED matrix, not about angular resolution, and 13-15 says so rather than repeating it.

### D-4. The research listed eight FOR terms; Phase 12 retires one, so D-11's rail is seven

**D-11 says "the eight FOR terms" and 12-04 retires `keys`** (CHORUS moves to `play`, LUMEN to
`still`, `harmonic` re-targeted). The research read the tree at `d78e087`, before Phase 12. D-11's
*reason* - *"honest to the catalog, permitted by the spec's own 'the real configuration schema should
determine'"* - is satisfied only by deriving the rail from `FOR_TERMS` at runtime. **13-08 derives it
and asserts the observed count**, records D-11's "eight" as superseded by 12-04 by name and dated, and
does not type a literal anywhere. If Phase 12 closes with `keys` still alive the rail is eight and the
same test passes; that is the point of deriving it.

### D-5. The research's wave order deletes the coverflow at wave 3; it cannot be deleted before wave 9

`FrontDoor.svelte` is imported by **both** `src/routes/+page.svelte` and
`src/routes/c/[id]/+page.svelte`, and `Coverflow`, `NamePlate` and `Splash` live inside it. Deleting
it at wave 3 would break two routes and every e2e title that walks them for six waves. The **global**
half of the deletion - the CRT layers, the halftone, the lattice ground and the SCREEN switch - is
route-independent and **does** land early, at wave 4; the composition half lands at wave 7 (`Splash`,
`glyph-field`) and wave 9 (`FrontDoor`, `Coverflow`, `NamePlate`, `ChosenPanel`, `src/lib/coverflow/`)
as each route stops rendering it. The research's instinct - do not maintain dead code - is kept; its
ordering is not.

### D-6. Persistence must precede the screens that read it, not follow them

The research puts persistence at wave 7, after the intro (3) and the gallery (4). But the intro's
returning-visitor card reads `hangar.intro.v1` and the most recent draft (D-14 Q2), and the gallery's
rail counts Favorites and Recently used (PDF page 2). **The stores land at wave 6, before both.**

### D-7. `front-door.ts`'s ring properties lose their subject, and Phase 12 may spend work on them

`front-door.ts:150-176` asserts three properties of a **row** that the coverflow renders: motion
derived from the golden frames, `restsBlack` agreeing with it, and **no two quiet pads adjacent on the
ring**. The PDF's intro has no row - it has **one** live surface. So the adjacency property loses its
subject and is deleted by name at 13-07; the other two survive, re-aimed at the single hero. **Note
for the user:** if 12-06's answer is `trail`, that plan re-derives the seven-entry ring geometry -
work this phase deletes. It is named here rather than left to be discovered.

### D-8. XY pad needed no question; the firmware settled it

The spec flags the XY pad as *"needs confirmation against the supported element types"*. It is
confirmed and it is not a question: `grid_module.c:455` gives ZONA **exactly two elements** (index 0
touch, index 1 system), and `grid_ui_touch.c:85-97` gives the touch element two events. There is no
firmware "element type" for a fader or an XY pad on a ZONA - **every region is HANGAR's own invention
over one continuous surface**, and the four palette rows are four branches of one dispatcher. The
question the spec asked belongs to Grid's button/encoder modules and does not exist here.

### D-9. `check-counts.mjs` is delta-agnostic; the risk is not where the research put it

The research's Wave 0 gap says the script *"must be checked against a negative delta"*. Read at
`d78e087`, the script compares two integers and rejects only a **negative expected total**, which no
plan produces. The real exposures are two, and 13-01 proves both rather than the one that was named:
(i) a spec file that loses its **last** test disappears from the file count as well as the test count,
so a plan that deletes tests without deleting a file and a plan that does both have different terms;
(ii) `Tests N passed | M todo` - the todo is reported and never asserted, and 13-04 deletes files that
carry none, so the todo must be observed to be unmoved rather than assumed.

### D-10. IDENT-01 is falsified by this phase, in three clauses, and nobody has said so

`REQUIREMENTS.md:86` reads: *"true-black ground, a single acid-lime accent (~#D6FF4E), generative
glyph-field texture as wallpaper, wide-tracked uppercase type, and the 9x9 pad outline as logo,
loading state and card frame."* Under the Bible: the ground becomes `#101210` and three more warm
graphite surfaces, text becomes near-white with the lime reserved for action and selection (D-14's
token table), **the glyph field is deleted** (D-09), **uppercase is confined to short labels and
breadcrumbs** (D-05), and **the logo becomes the supplied wordmark** (D-14 Q14). Four of the five
clauses move. **IDENT-01 is amended by name and dated at 13-20**, not silently re-ticked. IDENT-02's
*"a rack of running machines"* is narrowed by §6's *"animate only the selected or explicitly previewed
card"* and takes a qualifier.

### D-11. PREV-04 has been unticked since v1 and this phase can close it

*"The focused card accepts mouse-as-finger input so the user can play the instrument, not just watch
it."* The PDF's `▷ Play` switch on pages 3 and 5 **is** that, on both routes. 13-10 and 13-16 build it;
13-20 ticks PREV-04 or says exactly what is missing. Nothing else in the phase claims it.

### D-12. Six more requirement rows are moved by the copy change, and none of them is a deletion

`TUNE-07` names `SURPRISE ME` and is **amended** (the label becomes `Randomize`, and §7's scope rule
excludes MIDI destination, channel and routing from the default roll - a real behaviour change to
`surpriseIndices`, not a re-label). `SHARE-02` names `COPY LINK` and is amended to `Share snapshot`.
`TUNE-06` gains the per-field reset affordance beside the double-click. `CAT-02` takes a qualifier
(the sort control becomes a `<select>`; Featured and Name do not move). `SAFE-02` and `SAFE-05` take
the new labels. `CONT-03` takes a qualifier for the title-cased names. 13-20 owns all of it.

### D-13. The address of a configuration is a fork, and it is the user's

The spec says `/playground/:configurationId`; the PDF's breadcrumb says `PLAYGROUND / ARC`; HANGAR's
share stamp, its OG images, `SITE_ORIGIN` joins and a 516-line codec with a 592-line spec all live at
`/c/<id>`. The site has never been public (`SHARE-03`'s own amendment says so), so **no real link
breaks either way** - which is why this is cheap now and expensive later. It is still not a planner's
call: it moves the share codec's address and the unfurl target. **13-08 asks it as a
`checkpoint:decision` with three costed options** before a single card links anywhere.

---

## Why the waves are serial, and which of them can run before Phase 12 closes

No two plans run concurrently, for Phase 11's and Phase 12's two reasons: every acceptance criterion
asserts an exact cumulative count, and several plans regenerate build artefacts. **One plan per wave.**

```
wave  1     2     3     4     5     6     7     8     9     10
plan  13-01 13-02 13-03 13-04 13-05 13-06 13-07 13-08 13-09 13-10
wave  11    12    13    14    15    16    17    18    19    20
plan  13-11 13-12 13-13 13-14 13-15 13-16 13-17 13-18 13-19 13-20
```

**Wave order equals plan order in this phase.** Nothing is renumbered and no plan moves.

### Which waves do not depend on Phase 12

Phase 12 touches `src/lib/catalog/` (the library, the entries, `listing.ts`, `presets.ts`,
`front-door.ts`, `frames.json`), `src/lib/sim/lua-host.ts` and `lua-pad-sim.ts`, `src/lib/tune/model.ts`
and `view.ts`, `src/lib/device/`, `src/lib/transport/`, `src/lib/protocol/`, `e2e/install.e2e.ts` and
`session.e2e.ts`, and `docs/`. It touches **no route, no `src/lib/ui/` component, not `app.css`, and
none of the three copy modules**.

| Waves | Phase 12 | Why |
|---|---|---|
| **1-13 (13-01 … 13-13)** | **may run before Phase 12 closes** | Tokens, the gates, the shell, the deletions, the stores, the intro, the gallery, the workspace, the device band, the page target and My configs touch none of Phase 12's files. Three of them read Phase 12's outputs (`FOR_TERMS`, `listing.ts`, `model.ts`) and none of them writes one - a **soft** conflict, and each of those plans reads the final shape from `12-04-SUMMARY.md`, `12-05-SUMMARY.md` and `12-10/11-SUMMARY.md` at execution time rather than from this document |
| **14-17 (the Sandbox)** | **HARD dependency** | The compiler is built on Phase 12's touch library and its probe constants. **A revision of the Phase 12 plans is in flight and will change 12-07's `Q` (same-id expiry) and its callers; the function set `Q A E X F D` is stable but `F` is dropped and `Q`'s signature and semantics are not final.** Every Sandbox plan names `12-07-SUMMARY.md` as read-first at execution time and consumes the library's **final** shape from it, never from a plan |
| **18-20** | no dependency, but **after 14-17 in the serial order** | Copy written before the screens exist gets written twice; the gate is last by definition |

**If Phase 12 is still in flight while waves 1-13 run**, every Phase 13 plan re-measures `PREV_FILES`
and `PREV_TESTS` at its own start and reports the observation. The **terms** in the chain above stay
true because they are deltas; the **totals** do not, and 13-20 rebuilds them from the observed
baseline and names the offset. That is the mechanism `scripts/check-counts.mjs`'s own header describes
(*"Phases interleave in one tree … every count assertion is an observed baseline plus a stated
delta"*), used deliberately for the first time since Phase 4.

### The checkpoints, and what each one asks

**Five, and no plan invents a sixth.**

| Plan | Wave | Type | What it asks |
|---|---|---|---|
| **13-02** | 2 | `checkpoint:human-verify` | **D-07's slot probe.** Install one probe through `/dev/install/` and report whether `self:tim()` and `ele[1]:map()` execute another event's body. The answer decides the Sandbox's architecture at wave 14. **"Not yet" is an accepted answer** and does not stop waves 3-13; 13-14 then takes the fader-and-button branch, which needs no firmware question at all |
| **13-08** | 8 | `checkpoint:decision` | **The address of a configuration**: `/c/<id>` kept, `/playground/<id>` with a hash-preserving forward, or both. Three costed options; the share codec, the OG target and 1,000 lines of tests follow the answer |
| **13-13** | 13 | `checkpoint:decision` | **Collections' four forks** (D-13): may a configuration be in more than one; is delete undoable and for how long; what the empty state offers; and whether an export carries collection membership |
| **13-18** | 18 | `checkpoint:decision` | **The strings with no §16 line and no PDF equivalent**, in one batch, each with the state it names and the fact it must carry. Roughly forty, accumulated in `13-COPY-NEW.md` by every plan before it |
| **13-20** | 20 | `checkpoint:human-verify` | **The bench rows**: D-06's page switch, D-08's Knob, the Sandbox install, and the runbook re-run |

---

## Expected deltas after each plan

Deltas are the planner's estimate and are **reconciled at 13-20, never asserted**, except where a plan
names a per-file count.

| Plan | Wave | files | tests | sweep | e2e | Notes |
|---|---|---|---|---|---|---|
| 13-01 | 1 | **+1** | **+2** | `4 19` | **+1 / +2** | `radius.spec.ts` created with 2 (source scan, built-CSS scan); one `@webkit` computed-style title. The negative-delta proof writes no test. The two new requirement families are minted here so no later plan claims a row that does not exist |
| 13-02 | 2 | +0 | **+0** | `4 19` | +0 | The probe is a bench document and two Lua strings measured under the pinned minifier; **written out as +0** |
| 13-03 | 3 | +0 | **+5** | `4 19` | +0 | `identity.spec.ts` 7 → 11 (+4: eleven tokens and no twelfth, the contrast table, the boundary-versus-divider rule, the type scale); `font-assets.spec.ts` +1 (the wordmark asset) |
| 13-04 | 4 | +0 | **−9** | `4 19` | **−4 / −8** | `aesthetic.spec.ts` 8 → 1 (**−7**, scan 8 survives in place); `instrument.spec.ts` 6 → 4 (**−2**, the lattice and halftone scans). e2e: five `@webkit` titles deleted (−5 / −10), one `@webkit` reduced-motion title re-homed (+1 / +2) |
| 13-05 | 5 | **+1** | **+6** | `4 19` | +0 | `shell.spec.ts` created with 6 |
| 13-06 | 6 | **+1** | **+7** | `4 19` | +0 | `src/lib/store/local.spec.ts` created with 7 (absent, corrupt, quota, a storage that throws on access, version-beside-version, the cap, the round trip) |
| 13-07 | 7 | +0 | **−1** | `4 19` | **−6 / −6** | `glyph-field.spec.ts` deleted (−1 file, **−5**), `intro.spec.ts` created (+1 file, **+4**). e2e: seven `first-experience` titles deleted, one intro title added, none tagged |
| 13-08 | 8 | +0 | **+3** | `4 19` | +0, suite run | `browse-ui.spec.ts` 6 → 9; the browse e2e titles are re-aimed, not added |
| 13-09 | 9 | +0 | **+2** | `4 19` | +0, suite run | `tune-ui.spec.ts` re-aimed at the inspector, +2 |
| 13-10 | 10 | **−1** | **−1** | `4 19` | +0 | `mix.spec.ts` deleted (−1 file, **−2**); `tune-ui.spec.ts` −2 (the two MIX TWO titles) +3 (randomize scope, undo randomize, the collapsed monitor) |
| 13-11 | 11 | +0 | **+3** | `4 19` | +0 | `device-ui.spec.ts` +3 (the twelve states over fifteen phases, the connection control, the context bar's status zone) |
| 13-12 | 12 | **+1** | **+6** | `4 19` | **+1 / +1** | `page-target.spec.ts` created with 4; `descriptors.spec.ts` +1 (three new requests and their filters); `device-ui.spec.ts` +1 (the review cannot be skipped); one chromium e2e title (a page switch offered, refused without a click, ACK-gated) |
| 13-13 | 13 | **+2** | **+8** | `4 19` | **+1 / +1** | `transfer.spec.ts` (+4: export shape, import refused on schema, on kind, on geometry) and `collections.spec.ts` (+4) created; one chromium title for import validation |
| 13-14 | 14 | **+2** | **+9** | `4 19` **by choice** | +0 | `sandbox/geometry.spec.ts` (+4) and `sandbox/emit.spec.ts` (+5) created; the cost gate is a server spec so the sweep does not move |
| 13-15 | 15 | **+1** | **+7** | `4 19` | +0 | `sandbox/runtime.spec.ts` created with 7, every one in a real Lua VM |
| 13-16 | 16 | **+1** | **+6** | `4 19` | **+2 / +2** | `sandbox-ui.spec.ts` created with 6; two chromium titles (place/select/edit, Edit↔Play) |
| 13-17 | 17 | +0 | **+3** | `4 19` | **+1 / +1** | `install.spec.ts` +3 (a surface through the same writer); one chromium title against the fake ZONA |
| 13-18 | 18 | +0 | **+0** | `4 19` | +0 | The three copy specs are rewritten and their counts held; **written out as +0** |
| 13-19 | 19 | +0 | **+0** | `4 19` faster/slower - report | +0, suite run | Twenty-seven names re-cased; `catalog/copy.spec.ts`, `listing.spec.ts`, `stamp.spec.ts` and the OG alt text move **inside** without changing counts. **The sweep re-walks every entry and must stay `4 19`** |
| 13-20 | 20 | +0 | **+0** | `4 19` | +0, suite run twice | The gate writes no tests — written out, so the term count is the plan count |
| **Phase total** | | **+9** | **+56** | `4 19` unchanged | **−4 / −7** | `2+0+5−9+6+7−1+3+2−1+3+6+8+9+7+6+3+0+0+0 = 56` in **twenty** terms; files `= 9`; e2e titles 87 → 83, runs 106 → 99 |

Per-file counts, asserted absolutely:

| File | Tests | Plan |
|---|---|---|
| `src/lib/ui/radius.spec.ts` | **2** (created) | 13-01 |
| `src/lib/ui/identity.spec.ts` | 7 → **11** | 13-03 |
| `src/lib/ui/font-assets.spec.ts` | +1 | 13-03 |
| `src/lib/ui/aesthetic.spec.ts` | 8 → **1** | 13-04 |
| `src/lib/ui/instrument.spec.ts` | 6 → **4** | 13-04 |
| `src/lib/ui/shell.spec.ts` | **6** (created) | 13-05 |
| `src/lib/store/local.spec.ts` | **7** (created) | 13-06 |
| `src/lib/ui/glyph-field.spec.ts` | 5 → **deleted** | 13-07 |
| `src/lib/ui/intro.spec.ts` | **4** (created) | 13-07 |
| `src/lib/ui/browse-ui.spec.ts` | 6 → **9** | 13-08 |
| `src/lib/ui/tune-ui.spec.ts` | 9 → 11 (13-09) → **12** (13-10, −2 +3) | 13-09, 13-10 |
| `src/lib/tune/mix.spec.ts` | 2 → **deleted** | 13-10 |
| `src/lib/ui/device-ui.spec.ts` | 13 → 16 (13-11) → **17** (13-12) | 13-11, 13-12 |
| `src/lib/protocol/descriptors.spec.ts` | +1 | 13-12 |
| `src/lib/device/page-target.spec.ts` | **4** (created) | 13-12 |
| `src/lib/store/transfer.spec.ts` | **4** (created) | 13-13 |
| `src/lib/store/collections.spec.ts` | **4** (created) | 13-13 |
| `src/lib/sandbox/geometry.spec.ts` | **4** (created) | 13-14 |
| `src/lib/sandbox/emit.spec.ts` | **5** (created) | 13-14 |
| `src/lib/sandbox/runtime.spec.ts` | **7** (created) | 13-15 |
| `src/lib/ui/sandbox-ui.spec.ts` | **6** (created) | 13-16 |
| `src/lib/device/install.spec.ts` | +3 | 13-17 |
| `src/lib/device/install-copy.spec.ts` | unchanged (6, contents replaced) | 13-18 |
| `src/lib/device/session-copy.spec.ts` | unchanged (6, contents replaced) | 13-18 |
| `src/lib/tune/copy.spec.ts` | unchanged (6, contents replaced) | 13-19 |
| `src/lib/catalog/copy.spec.ts` / `listing.spec.ts` / `share/stamp.spec.ts` | unchanged (literals move inside) | 13-19 |

`2+4+1−7−2+6+7−5+4+3+2−2+3−2+3+1+4+4+4+5+7+6+3+1 = 56`. **13-20 derives each chain term from this
table and names any row that was wrong.**

Standing gates that must be green at the phase gate and are **not** edited:
`src/lib/fidelity/firmware-oracle.spec.ts`, `lua-parity.spec.ts`, `preset-baseline.spec.ts` and its
`.json`, `vendored-diff.spec.ts`, `src/lib/format-parity.spec.ts`, `src/lib/protocol-pin.spec.ts`,
`src/lib/catalog/decay-idiom.spec.ts`, `touch-guard.spec.ts`, `e2e/catalog.e2e.ts`,
`e2e/fidelity.e2e.ts`, `e2e/artifacts.e2e.ts`, `e2e/skeleton.e2e.ts`.

---

## The deleted test titles, named in advance

**No plan may delete a title this list does not carry, and no title on this list may vanish without a
plan naming it.** The list is the planner's reading of the tree at `d78e087`; the executing plan
re-reads the file and names any difference as a planner defect.

**13-04 — `src/lib/ui/aesthetic.spec.ts`, seven of eight:**
1. *"scan 1: the CRT vocabulary appears only inside its allowlist of files"*
2. *"scan 2: every CRT layer declares pointer-events: none, and the real elements are aria-hidden"*
3. *"scan 3: no text-bearing element is a descendant of a CRT container"*
4. *"scan 4: Coverflow.svelte's 3D context stays ungrouped and its band keeps its clip and its mask"*
5. *"scan 5: no CRT selector names a canvas"*
6. *"scan 6: the noise tile declares no fill - only the filter's own output colours it"*
7. *"scan 7: .crt-band's geometry is string-equal to .band's, across the two files"*

Surviving: *"scan 8: the unlit cell is drawn as a cell, in the token, and the pad that lights nothing
is still dark"* — kept **in place**, so the file survives and the file term is `+0`.

**13-04 — `src/lib/ui/instrument.spec.ts`, two of six:** *"scan 3: the lattice is monochrome,
gradient-built, data-URI-free, on two roots, and nowhere near the 3D context"* and *"scan 4: the
halftone declares exactly the pitches the measurement licensed, in one file"*. *"scan 6: the lattice is
a ground…"* is **rewritten**, not deleted, because its `:where()` specificity rule outlives the
lattice. *"scan 2: the pill is Primary's radius…"* is **rewritten** by D-10 - the pill becomes a
rectangle and the 44px halves of the assertion survive.

**13-04 — `e2e/aesthetic.e2e.ts`, all five, all `@webkit`:**
*"@webkit reduced motion stops both moving layers, and neither was absent"*,
*"@webkit SCREEN: FLAT turns off all four layers, not the two that move"*,
*"@webkit the SCREEN choice survives a navigation and a reload, and the browse grid keeps Layer G alone"*,
*"@webkit Switch 3 removes only the roll bar, and only on four cores"*,
*"@webkit the lattice is a ground and the unlit cell is a cell - both facts only a browser can check"*.
The **file is deleted**. The first title's subject - reduced motion - survives as a new `@webkit`
title re-homed onto the pad and the gallery, which is the research's own open Wave 0 question and is
answered here: **it lands in `e2e/browse.e2e.ts` beside the existing untagged "reduced motion stills
every card", because that is where the surviving subject lives.**

**13-07 — `src/lib/ui/glyph-field.spec.ts`, all five, file deleted:**
*"is byte-identical across two builds, because the seed is the identity"*,
*"lays out between six and ten blocks and exactly four punched rectangles"*,
*"draws only the five glyphs, each at an alpha inside the declared range"*,
*"punches rectangles that are inside the viewport and inside the size range"*,
*"has a PRNG that stays in [0, 1) and repeats itself for one seed"*.

**13-07 — `e2e/first-experience.e2e.ts`, seven of eleven** (the planner's reading; the plan re-reads
and names any difference): *"the front door animates"*, *"the row steps with the keyboard and wraps"*,
*"the splash opens the front door and clears itself"*, *"any key cuts straight to the dissolve"*,
*"choosing reveals the panel, and Escape and Back both close it"*, *"a deep link lands with that
configuration centred and skips the splash"*, *"the row's painted frames over two seconds are
recorded"*. Surviving and re-aimed: *"a still configuration really is still"*, *"with no Web Serial the
control is present, disabled, and says why"*, *"reduced motion stills the pads and makes stepping
instant"*, *"every configuration is a real file with its own description, and an off-row page is a row
of one"*.

**13-10 — `src/lib/tune/mix.spec.ts`, both, file deleted (D-12):**
*"every child is in range, every held knob is untouched, and at most one position is redrawn"*,
*"the degenerate and boundary cases: every knob held, a equal to b, one knob, and a two-option knob"*.

**13-10 — `src/lib/ui/tune-ui.spec.ts`, two (D-12):** *"MIX TWO offers four real results, changes
nothing until one is clicked, and arrives on opacity alone"* and *"MIX TWO's four results are the last
four canvases in the budget: six on the worst entry, not eight"*.

---

## The no-radius gate, in three layers

D-01 is a **gate**, not a convention, and one layer cannot hold it.

| Layer | Where | Catches | Plan |
|---|---|---|---|
| **A. Source scan** | `src/lib/ui/radius.spec.ts`, server project | every `border-radius` in `src/**/*.svelte` and `src/**/*.css` whose value is not `0`, `0px`, or the literal `50%`; **and any Tailwind `rounded*` utility in a class string** | 13-01 |
| **B. Built-CSS scan** | the same spec, reading `build/_app/immutable/assets/*.css` when a build exists, skipped with a named reason when it does not | anything Tailwind emits that the source cannot show, and any radius arriving from a dependency | 13-01 |
| **C. Computed-style sweep** | one `@webkit`-tagged Playwright title over every route | **the UA stylesheet** - `input[type=search]`, `<button>`, `<select>` and `<meter>` carry non-zero radii by default in WebKit and in some Chromium builds - **and D-10's real rule: any element whose computed `border-radius` is `50%` must be measured square** | 13-01 |

**Layer A ships on the first day with a declared allowlist**, because the tree carries 43 declarations
across `app.css` and fifteen components and a gate that is red for nineteen waves is not a gate. The
allowlist is the `INTENDED_DIVERGENCE` pattern this repository already uses: **a row per file with the
plan that will clear it**, and the gate fails if the list **grows**, if a listed file no longer needs
its row (a stale row is red), or if any file not on the list carries a radius. Every plan that touches
a component clears its row. **13-20 asserts the allowlist is empty**, and that assertion is the phase's
proof of D-01 rather than a promise.

`app.css:421`'s `border-radius: 999px` — the pill — is a rounded rectangle under D-10 and is
**removed**, not allowlisted. The three `border-radius: 50%` in `ColourPicker.svelte` are circles, stay
round, and are the only values above zero the gate permits.

---

## The 908-character budget, per Sandbox request

Every request costed **before** it is designed at the RGB444 picker corner,
`cost = max(GridScript.compressScript(lua).length, lua.length)` after `padReady()`; **a request that
cannot fit is a finding, not a failure.**

| String | Slot | Research's measurement | What this phase asks |
|---|---|---|---|
| Phase 12's touch library | system Setup (908) | **884** at the superseded sketch, **770 raw** at the revised one | **read the measured canonical cost from `12-07-SUMMARY.md`.** Not from the research, not from the plan |
| `Z`, the generic Sandbox runtime | system mapmode (908) — **needs 13-02's answer** | **861** without a rotary Knob | re-measured at 13-15 with D-08's rotary added (+150-200 estimated, and the estimate is not carried) |
| touch Setup: `ele[1]:map()` + `G` + `M` + `Y()` + the callback | touch Setup (908) | **366** at four elements, **811** at sixteen | re-measured at 13-14 for 1, 4, 8, 12 and 16 elements, each figure recorded |
| touch Timer | touch Timer (908) | **19** | unchanged; the sweep window is the caller's, per 12-07 |
| **The fallback branch** (13-02 answers "no") | touch Setup only | **697** for four vertical faders, dead-branch eliminated | fits today with no firmware question and no bench row. XY pad and Knob deferred with the characters they would have cost |

---

## Sampling Rate

- **After every task:** `npm run test:quick`, plus `npm run lint` when a source moved, plus the
  per-file commands the plan names. Free memory beside every run.
- **After every wave:** `npm run check 2>&1 | grep -Ei "error|warning"`, `npm run lint`,
  `npm run test:quick`; plus `npm run test:sweep` for every wave that changes an entry's Lua, a knob's
  value list or an entry name — **13-19 only**, and every other plan proves the member list unmoved.
- **`npm run build`** for any wave that changes a route, a token, an asset or an OG input — 13-01
  (layer B needs a build to read), 13-03, 13-04, 13-05, 13-07, 13-08, 13-16, 13-19, 13-20 — then
  `npm run test:quick` again.
- **e2e runs in nine plans** — 13-01, 13-04, 13-07, 13-08, 13-09, 13-12, 13-13, 13-16, 13-17, and
  13-20 twice. **That is ten runs across nine plans plus the gate**; every other plan proves its zero
  with `grep -c "test("`.
- **Do not commit while the suite is running** (`artifacts.e2e.ts` reads `HEAD`).
- **Max feedback latency:** ~45 s (quick), ~3 min (wave with the sweep), ~6 min (wave with a build
  and e2e).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated command / evidence | File exists | Status |
|---|---|---|---|---|---|---|---|
| 13-01-01 | 01 | 1 | — | tooling | `check-counts.mjs` driven with a **negative** delta on a scratch deletion and restored, sha256 both sides; the todo observed unmoved; the two exposures in D-9 above proved rather than the one the research named | exists | pending |
| 13-01-02 | 01 | 1 | IDENT-01 | unit + build | `radius.spec.ts` 2: the source scan with the declared allowlist (grows → red, stale row → red, unlisted file → red), and the built-CSS scan | **Wave 0 gap — the file does not exist** | pending |
| 13-01-03 | 01 | 1 | IDENT-01 | e2e | one `@webkit` computed-style sweep over every route: no radius above zero, and every `50%` element measured square | exists | pending |
| 13-01-04 | 01 | 1 | BUILD-*, KEEP-* | docs | the two new requirement families minted with fourteen rows, so no later plan claims a row that does not exist | exists | pending |
| 13-02-01 | 02 | 2 | CONT-02 | unit-free, measured | two probe strings written and measured under the pinned minifier, both branches of the Sandbox architecture costed and written down before the answer arrives | created here | pending |
| 13-02-02 | 02 | 2 | — | **checkpoint:human-verify** | the slot probe handed over; "not yet" accepted; the answer recorded verbatim for 13-14 | n/a | pending |
| 13-03-01 | 03 | 3 | IDENT-01 | unit | `identity.spec.ts` rewritten: eleven tokens and no twelfth; every pair's computed ratio against the table; the divider's failure recorded as decorative-only with the boundary rule gated | exists | pending |
| 13-03-02 | 03 | 3 | IDENT-01 | unit | the type scale, two tiers of display, tabular numerals, the Grifter licence token; `font-assets.spec.ts` +1 for the wordmark asset | exists | pending |
| 13-03-03 | 03 | 3 | IDENT-01 | unit + build | the wordmark re-cropped to its ink box with six fills as `currentColor`, `width`/`height` stripped, **the original untouched in `bible/`** proved by sha256 | exists | pending |
| 13-04-01 | 04 | 4 | IDENT-02 | unit | the CRT, halftone and lattice deleted from `app.css`, `PadFrame`, `PadCanvas` and the layout; `aesthetic.spec.ts` 8 → 1 and `instrument.spec.ts` 6 → 4 with every deleted title named | exists | pending |
| 13-04-02 | 04 | 4 | IDENT-02, PREV-05 | e2e | `aesthetic.e2e.ts` deleted (five `@webkit` titles) and the reduced-motion assertion re-homed as one `@webkit` title in `browse.e2e.ts`; the motion control re-homed under Help & shortcuts | exists | pending |
| 13-05-01 | 05 | 5 | IDENT-01 | unit | header, nav with the active item's 2px underline, context bar's three zones, footer; the GPLv3 footer and both `onMount` calls proved verbatim; `SessionAnnouncer`'s document order proved unmoved | exists | pending |
| 13-05-02 | 05 | 5 | IDENT-01 | unit | rail and inspector primitives at the PDF's fractions (D-14 Q9), §13's breakpoints re-derived, `(pointer: coarse)` → 44px, orientation change without losing work | exists | pending |
| 13-06-01 | 06 | 6 | KEEP-01, KEEP-05 | unit | `src/lib/store/local.ts` with `snapshot.ts`'s guard shape (property access inside the `try`), six keys versioned in the key name **and** in the body, 7 tests including a storage that throws on access | **Wave 0 gap — the files do not exist** | pending |
| 13-06-02 | 06 | 6 | KEEP-02, KEEP-03 | unit | drafts, named copies, favorites and recently used over that primitive; the cap; the dedupe; no thumbnail stored | exists | pending |
| 13-07-01 | 07 | 7 | IDENT-01, IDENT-02 | unit + e2e | the intro at `/` with the live hero surface, the returning-user flag changing Card A only (D-14 Q2), no redirect, the OG head block's shape kept | exists | pending |
| 13-07-02 | 07 | 7 | CAT-01 | unit + e2e | `Splash`, `glyph-field` and the ring's adjacency property deleted with every title named; `front-door.ts` reduced to a hero declaration with two properties re-aimed | exists | pending |
| 13-08-01 | 08 | 8 | CAT-01, SHARE-01 | **checkpoint:decision** | the address of a configuration, three costed options | n/a | pending |
| 13-08-02 | 08 | 8 | CAT-01, CAT-02, CONT-03 | unit + build + e2e | `/playground`: the rail **derived** from `FOR_TERMS` with the count asserted as observed (D-4 above), one `Use` chip row, the sort as a `<select>`, cards with one category, one tag, one sentence and a favorite star | exists | pending |
| 13-09-01 | 09 | 9 | CAT-03, TUNE-01 | unit | the workspace and the schema-driven inspector from `widgetFor`'s twelve kinds; the segmented/select boundary at five options; per-field changed marker and reset | exists | pending |
| 13-09-02 | 09 | 9 | TUNE-01 | unit + e2e | the colour swatch popover with the RGB444 picker unchanged inside it and its three circles kept (D-10); `FrontDoor`, `Coverflow`, `NamePlate`, `ChosenPanel` and `src/lib/coverflow/` deleted | exists | pending |
| 13-10-01 | 10 | 10 | TUNE-03, TUNE-04, TUNE-05 | unit | the two 908 meters and the ladder re-homed into the inspector; the collapsed MIDI monitor on Lua entries only (D-14 Q4b) with coalescing and a ring cap | exists | pending |
| 13-10-02 | 10 | 10 | TUNE-07, TUNE-06, PREV-04 | unit | `Randomize` with §7's scope rule excluding MIDI destination and channel, `Undo randomize` as one stored vector, the `▷ Play` switch; **MIX TWO cut (D-12)** with four titles named | exists | pending |
| 13-11-01 | 11 | 11 | CONN-01…08, DEGR-01, DEGR-02 | unit | the header's connection control from `slotStateOf`/`capabilityOf`, the button-vs-summary rule kept; `FORGET` and the disclosure re-homed under Device actions | exists | pending |
| 13-11-02 | 11 | 11 | SAFE-01…09 | unit | the spec's twelve states mapped onto fifteen phases with **the four HANGAR has that the spec does not** kept and named; every disabled control still naming a reason | exists | pending |
| 13-12-01 | 12 | 12 | SAFE-01, SAFE-03 | unit | `pageActive` and `pageCount` descriptors, the ACK gate on the module's own report, a timeout that is *unverified* and never *switched*; `PAGEDISCARD` researched and shipped or recorded | **Wave 0 gap — the descriptors do not exist** | pending |
| 13-12-02 | 12 | 12 | SAFE-01, SAFE-03, SAFE-05 | unit + e2e | the destination review naming both pages; per-page snapshots; PUT BACK naming the page it restores; one e2e proving no write and no switch without a click | exists | pending |
| 13-13-01 | 13 | 13 | KEEP-06 | **checkpoint:decision** | Collections' four forks | n/a | pending |
| 13-13-02 | 13 | 13 | KEEP-02, KEEP-04 | unit + e2e | `/my-configs` as a table with the resume banner; export as a file; import validated **before** opening, reusing the `Landing` vocabulary | exists | pending |
| 13-13-03 | 13 | 13 | KEEP-06 | unit | Collections at the recorded answer, with the empty state and the export interaction the user chose | exists | pending |
| 13-14-01 | 14 | 14 | BUILD-01, BUILD-02 | unit | the region model, one-based in the UI and zero-based in the model behind a named door; off-surface and overlap unrepresentable through `M`; duplicate to a free `w x h` window; the edge-adjacency warning | **Wave 0 gap — the files do not exist** | pending |
| 13-14-02 | 14 | 14 | BUILD-03 | unit (real minifier) | the emitter and its cost at 1, 4, 8, 12 and 16 elements at the picker corner, branch-aware on 13-02's answer, dead-branch elimination proved by a measured pair | exists | pending |
| 13-15-01 | 15 | 15 | BUILD-03, BUILD-04 | unit (**real VM**, wasmoon) | `Z` measured, canonicalised and run: a contact keeps its region for the gesture; `R` fires on every expiry path; both Phase 11 gates green over the emitted string | **Wave 0 gap — the file does not exist** | pending |
| 13-15-02 | 15 | 15 | BUILD-01 | unit (real VM) | the Knob as a real rotary (D-08): wrap-safe accumulation across 359°→1°, the centre dead zone derived rather than chosen, the measured character cost against the 150-200 estimate | exists | pending |
| 13-16-01 | 16 | 16 | BUILD-01, BUILD-06, BUILD-08 | unit + e2e | palette, click-to-place, selection, the element list as a real alternative to the canvas, Edit↔Play keeping selection and history | exists | pending |
| 13-16-02 | 16 | 16 | BUILD-02, BUILD-07 | unit + e2e | geometry validation with the previous valid value preserved, the conflict explained at the region, undo/redo over every structural edit including delete | exists | pending |
| 13-17-01 | 17 | 17 | BUILD-05, SAFE-01…09 | unit | a surface installs through `writeBoth`/`storeToFlash` unchanged — **no new write path** — with the third string and the same acknowledgements | exists | pending |
| 13-17-02 | 17 | 17 | KEEP-04, SHARE-01 | unit + e2e | a surface shares as a file (D-14 Q7), not a link; the Playground stamp untouched and proved untouched | exists | pending |
| 13-18-01 | 18 | 18 | — | **checkpoint:decision** | the accumulated strings with no §16 line, in one batch | n/a | pending |
| 13-18-02 | 18 | 18 | SAFE-02, SAFE-05, CONN-02 | unit | `install-copy.ts` and `session-copy.ts` rewritten under D-05; the honesty caps retired **by name**; the register rules re-asserted | exists | pending |
| 13-19-01 | 19 | 19 | TUNE-07, SHARE-02 | unit | `tune/copy.ts` rewritten; the register rules re-asserted over every new string | exists | pending |
| 13-19-02 | 19 | 19 | CONT-03, SHARE-04 | unit + sweep + build | twenty-seven names in title case (D-14 Q11b), every fixture and `ogAlt` moved, the sweep proved `4 19`, the OG images re-rendered with their bytes recorded | exists | pending |
| 13-20-01 | 20 | 20 | all | phase gate | the twenty-term chains with the term count asserted; the radius allowlist **empty**; the contrast sweep; e2e twice; every wrong projection named | exists | pending |
| 13-20-02 | 20 | 20 | IDENT-01, IDENT-02, TUNE-06, TUNE-07, SHARE-02, CAT-02, CONT-03, PREV-04 | docs | the amendments by name and dated; every claimed requirement qualified; `deferred-items.md` | created here | pending |
| 13-20-03 | 20 | 20 | — | **checkpoint:human-verify** | the bench rows: the page switch, the Knob, the Sandbox install, the runbook re-run | n/a | pending |

*Status: pending / green / red / flaky. Every row starts pending; an executing plan updates only its own rows.*

---

## Wave 0 Requirements

No framework gap: Vitest, Playwright, both browser binaries, `wrangler`, `svelte-check`, ESLint and
Prettier are installed and pinned, and **no dependency moves in this phase**. The gaps are files, one
tooling proof, one hardware answer and one licence.

- [ ] **`scripts/check-counts.mjs` against a negative delta**, and against the two exposures in D-9
      above rather than the one the research named → **13-01-01**
- [ ] `src/lib/ui/radius.spec.ts` and its declared allowlist — **the gate lands before the first
      component is re-skinned, so no new radius is ever authored** → **13-01-02**
- [ ] **The two new requirement families**, minted before any plan claims a row → **13-01-04**
- [ ] `.planning/phases/13-gui-overhaul/13-COPY-NEW.md` — the ledger every screen plan appends to and
      13-18 empties → **13-01-04**
- [ ] **D-07's slot probe**, taken at the bench, deciding the Sandbox's architecture → **13-02-02**,
      consumed at **13-14**. **"Not yet" is an answer** and the fallback branch is fully planned
- [ ] `src/lib/store/local.ts` and its five stores → **13-06-01**
- [ ] `src/lib/device/page-target.ts` and the two new descriptors → **13-12-01**
- [ ] `src/lib/sandbox/{model,geometry,emit,runtime,cost}.ts` → **13-14**, **13-15**
- [ ] **The library's final shape** — `Q`'s signature and semantics after the Phase 12 revision in
      flight — read from `12-07-SUMMARY.md` at execution time, never from `12-07-PLAN.md` → **13-14**
- [ ] `.planning/phases/13-gui-overhaul/deferred-items.md` → **13-20-02**
- [ ] **Grifter's licence** (PERSONAL USE in the name table) — not an agent's to resolve; the swap
      token exists and 13-03 keeps it to two lines. Recorded, not closed
