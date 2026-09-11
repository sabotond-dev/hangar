---
phase: 13-gui-overhaul
plan: 13
subsystem: ui
tags:
  [
    my-configs,
    pdf-page-4,
    library-table,
    resume-banner,
    two-words-two-objects,
    live-thumbnails,
    export,
    import,
    six-steps,
    landing,
    rack,
    blob-download,
    collections,
    d-22,
    many-session-bare-no,
    session-undo,
    reconciliation,
    drop-on-read,
    keep-01,
    keep-02,
    keep-03,
    keep-04,
    keep-05,
    keep-06,
    share-03,
    negative-checks,
    counts,
    copy-ledger,
  ]
requires:
  - phase: 13-gui-overhaul
    plan: 11
    provides: "PREV_FILES 87 / PREV_TESTS 913 (+1 todo) / e2e 78 titles, 94 runs / check 613 / sweep 4 19 / catalog 26 / radius allowlist 0 rows, observed on the clean tree at 36ccd2d; the shell as it stands - the header's control and Device actions on every page, the context bar's `draft` prop existing and set by no route; the five-chunk e2e harness in the scratchpad"
  - phase: 13-gui-overhaul
    plan: 06
    provides: "the stores as landed: local.ts's probe (absent / corrupt / refused), readJson requiring a validator, every record an envelope { schema: 1, ... }, drafts.ts and library.ts sharing StoredRecord, favorites.ts's drop-on-read rule with the count returned and the validator an argument, recent.ts at twelve kept / six shown, hangar.collections.v1 reserved as COLLECTIONS_KEY_RESERVED, library.ts never overwriting a source"
  - phase: 13-gui-overhaul
    plan: 05
    provides: "Rail.svelte's counted rows (count, index, meta, href) and layout.ts's padCount; the shell's fillShell bridge"
  - phase: 13-gui-overhaul
    plan: 08
    provides: "the gallery's YOUR LIBRARY rows as a library view over the stores (favorites, recent) with the view kept out of the address; rail.ts's LIBRARY_ROWS and YOUR_LIBRARY; the question whether Favorites and Recently used are destinations or filters, left for this plan; /my-configs/ in vite.config.ts's crawler-404 ignore"
  - phase: 13-gui-overhaul
    plan: 09
    provides: "Save copy writes copy:{id}:{moment} records named `{name} copy` through library.ts; the workspace reads its knob vector from the stamp hash and nothing else; touchRecent on open"
  - phase: 13-gui-overhaul
    plan: 07
    provides: "card.ts's relativeTime and newestDraft's use for the intro's Resume draft card; the pattern of a route declaring its shell shape as page data"
  - phase: 13-gui-overhaul
    plan: context
    provides: "D-01 (ask where not sure; never a corner), D-05 (the register), D-13 (collections ship in v1; where the specification forks, the plan asks), D-14 Q4 (the sixteen cap) and Q7 (a surface shares as a file), D-15 (six circles), D-20 (a configuration lives at /playground/<id>), D-22 (the four answers, verbatim)"
  - phase: 05-share
    plan: stamp
    provides: "src/lib/share/stamp.ts's Landing union - none | restored | older | unreadable - with a landing behaviour and a test behind each; stampKnobs and encodeFor; stamp.spec.ts's 'lands older on a resized knob and never restored on a changed rack' (read and imported, never edited)"
provides:
  - "MY CONFIGS AT /my-configs/ AS PDF PAGE 4 (src/routes/my-configs/+page.ts, +page.svelte): the rail with four counted rows (All saved, Drafts as views; Favorites, Recently used as links to the gallery) and a COLLECTIONS section; the eyebrow, the headline, the sub, Import config and New surface; the resume banner over the newest draft; the search row with its Last edited / Name sort; the count line; the table. The shell shape travels as page data; the rows arrive with the effect. MY CONFIGS in the nav is a resolve() call and /my-configs/ has left the crawler's 404 ignore"
  - "THE TABLE (src/lib/ui/library/LibraryTable.svelte): CONFIGURATION / TYPE / LAST EDITED / STATUS over a 1px rule, 78px rows, a 56x56 LIVE thumbnail, the name over ZONA · Personal configuration, the type in sentence case, the moment in words, a RECTANGULAR chip saying Draft in the action colour or Saved neutral - two words for two objects - beside Open, and a headless fifth column with Rename (inline), Export, Delete, Add to collection and, inside a collection's view, Remove"
  - "THE RESUME BANNER (src/lib/ui/library/ResumeBanner.svelte): the 3px-ruled raised surface with a 96x96 live thumbnail, CONTINUE EDITING, the name at 28px and `Draft · {type} · Last edited {edited}`, Resume draft filled at the right; shown only when a draft exists"
  - "THE WORDS (src/lib/ui/library/words.ts): STATUS_WORDS { draft: Draft, saved: Saved }, typeLabel, editedInWords (Today, HH:MM / Yesterday / 8 Sep 2026), countLine"
  - "EXPORT AND IMPORT (src/lib/store/transfer.ts): ExportFile { schema, kind, exportedAt, app: hangar, record, rack? }; downloadExport via Blob + object URL + <a download> with the URL revoked after the click and the two browser doors injectable; classifyImport as six ordered steps returning the codec's Landing (imported as a type) plus the step and a sentence from IMPORT_REASONS; importText writing through saveCopy only after the whole validation passes, a taken id re-minted rather than overwritten or dropped; KnobsOf as the caller's argument (13-06's rule); SURFACE_SIZE 9 and SURFACE_ELEMENT_CAP 16 in schema.ts for step 5"
  - "COLLECTIONS (src/lib/store/collections.ts) under the spent hangar.collections.v1 (COLLECTIONS_KEY, owned): readCollections with the drop count, createCollection, renameCollection, deleteCollection returning the undo vector, restoreCollection, setMember, collectionsOf, removeFromAll - the header carrying D-22 verbatim as the specification the Bible never wrote"
  - "EIGHT TESTS: transfer.spec.ts 4 (the byte-for-byte round trip and the revoke; unreadable writes nothing over eleven shapes; older matched by name against stamp.spec.ts's resized-knob test under the same entry, resize and vector; regions off the surface / overlapping / over the cap and a knob past its list refused with the name) and collections.spec.ts 4 (the round trip and the throwing store; fork A's many-membership with the orphan named; fork B's vector, no trace, a reload, the restore, the session's end; fork D's export without membership, an import unfiled, a claiming file creating nothing)"
  - "ONE E2E TITLE (e2e/library.e2e.ts, +1 / +1, chromium): nothing saved, a planted draft as the banner and a Draft row with a painting canvas, a refused import explained with nothing written, a good import opened at its stamp, Saved beside Draft, a real download of the envelope, delete and undo, the search miss, and collections bare / create / file / view / remove / delete / undo; two fixtures under e2e/fixtures/library/"
  - "COUNTS: 87 / 913 (+1 todo) at 36ccd2d -> 89 / 921 (+1 todo) on the term +2 / +8 (transfer.spec 4, collections.spec 4); e2e 78 / 94 -> 79 / 95 on +1 / +1; check 613 -> 624 / 0 / 0; sweep 4 19 unchanged; radius allowlist 0 rows (18 declarations in 60 files, 12 exempt, 6 circles); catalog 26; the codec byte-identical"
affects:
  - "13-14 (SURFACE_SIZE and SURFACE_ELEMENT_CAP live in schema.ts - import them into model.ts rather than re-declaring; transfer.ts's step 5 is the import-side bounds / overlap / cap check and should become model.ts's own once it exists, so the two sentences ledgered by both plans are one)"
  - "13-16 (the Sandbox route: New surface and a sandbox record's Open link both point at SECTIONS[1].href; remove /sandbox/ from vite.config.ts's ignore; Sandbox drafts land in drafts.ts and appear here as Draft rows; a surface engine for the unlit sandbox thumbnail is 13-15's)"
  - "13-17 (the Sandbox's export goes through transfer.ts unchanged: exportFile(record, at) with no knobsOf writes no rack for kind sandbox, importText validates the regions at step 5; fork D means no membership field - do not add one)"
  - "13-18 (the twenty-six ledgered rows and twelve questions under 'From 13-13' in 13-COPY-NEW.md)"
  - "13-20 (the counts above; KEEP-01..06 and SHARE-03 in this plan's frontmatter - none ticked here, by the phase's convention; the codec proof; the Playground workspace still writes no draft)"
  - "12.1 Band 2 (12.1-06..08 wait for 13-12, not for this plan; nothing here touches a Phase 12 file)"
tech-stack:
  added: []
  patterns:
    - "An import outcome is the stamp codec's Landing, imported as a type and never re-declared; a fourth word is a type error at npm run check (negative check B)"
    - "A file has room for the shape a stamp compresses into one character: a playground export carries its rack (knob id + option count) on the ENVELOPE, so the record round-trips byte-for-byte and a resized knob still lands older"
    - "Nothing writes until the whole validation passes: classifyImport is pure and importText is the one writer; the test asserts the store's setItem log, not the return value"
    - "A screen's live thumbnails share the page's one SimHost; components hand canvases up through onready and the route registers engines built through the same dynamic imports the gallery uses"
    - "A session-only undo is a module-level variable holding the store's own return value; no tombstone key, no expiry rule"
    - "A specification the design never wrote is written into the module header as the user's dated answers, each with what it cost and what was refused"
key-files:
  created:
    - src/routes/my-configs/+page.ts
    - src/routes/my-configs/+page.svelte
    - src/lib/ui/library/LibraryTable.svelte
    - src/lib/ui/library/ResumeBanner.svelte
    - src/lib/ui/library/words.ts
    - src/lib/store/transfer.ts
    - src/lib/store/transfer.spec.ts
    - src/lib/store/collections.ts
    - src/lib/store/collections.spec.ts
    - e2e/library.e2e.ts
    - e2e/fixtures/library/euclid-copy.hangar.json
    - e2e/fixtures/library/somebody-elses.json
  modified:
    - src/lib/store/schema.ts
    - src/lib/store/local.spec.ts
    - src/lib/ui/shell/shell.svelte.ts
    - vite.config.ts
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
    - .planning/STATE.md
key-decisions:
  - "The checkpoint was answered before this plan ran (D-22, 'many session bare no') and was recorded, not re-asked; the four answers are collections.ts's header, dated 2026-09-11"
  - "Favorites and Recently used on page 4 are destinations (links to the gallery), not filters over this table - a favorite is a catalog entry, this table is personal configurations, and a filter would show a count the table cannot match; ledgered as question 1 because the gallery cannot yet arrive with the view selected"
  - "The ExportFile carries `rack` on the envelope: without a shape a resized knob whose old indices still fit would restore silently wrong, exactly what SHARE-03 forbids; the record itself stays byte-for-byte"
  - "Step 4's classification is the codec's row for row - rack disagrees -> older; rack agrees, index past its list -> unreadable, the knob named; an added / removed knob is older by count where the codec says unreadable by length, and the header says why"
  - "Open and Resume draft reach the workspace through the stamp (`/playground/{source}/#z.…` encoded with encodeFor) because that is the one way the workspace takes a knob vector today; a draft resumes at its positions"
  - "A restored Playground import opens the workspace; older and sandbox imports stay with their sentence; unreadable stays with the reason and no row"
  - "Thumbnails: a Lua entry's engine takes the record's knob indices (createEngine's second argument) so a variation shows as saved; a preset-backed entry shows the base; a sandbox record is unlit until 13-15"
  - "Delete is undoable for the session for records AND collections in one held slot; a record's undo restores its memberships because the delete removed them (fork A)"
  - "gsd-tools state and requirements commands not run; STATE.md by script against a copy with every touched line asserted; REQUIREMENTS.md untouched by the phase's convention"
patterns-established:
  - "src/lib/ui/library/ is the third component directory under src/lib/ui/ (after intro/ and shell/); config-shape.spec.ts's walk covers it automatically"
  - "e2e/fixtures/<area>/ beside the test that reads it; a real export as a fixture is a shape pin the way wild-stamps.json is"
requirements-completed: []
requirements-touched: [KEEP-01, KEEP-02, KEEP-03, KEEP-04, KEEP-05, KEEP-06, SHARE-03]
duration: 70min
completed: 2026-09-11
---

# Phase 13 Plan 13: My configs, export and import, and Collections - Summary

**One-liner:** PDF page 4 at `/my-configs/` as a live-thumbnail table over both record stores with a
resume banner and two words for two objects; export as a Blob download whose envelope carries the rack;
import as six ordered steps that write nothing until all pass and answer in the stamp codec's own
`Landing` words with the knob or region named; and Collections built at the user's four verbatim answers
- "many session bare no" - with those answers written into the module as the specification the Bible
never wrote.

## Performance

- **Duration:** about 70 min
- **Started:** 2026-09-11T16:19Z (the baseline quick suite's first line)
- **Completed:** 2026-09-11T17:30Z
- **Tasks:** 3 of 3 (task 01 recorded from D-22, not re-asked; tasks 02 and 03 executed)
- **Files:** 12 created, 4 modified in the two task commits; STATE.md and this file in the third

## Commits

| Hash      | Message                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `6673a01` | `feat(13-13): My configs as a live table with a draft banner, export as a Blob download, import refused in six steps before it opens` (15 files, +3,229 / -31) |
| `b0dc77d` | `feat(13-13): collections at the user's four answers - many, session, bare, no - with the answers as the module's specification` (6 files, +1,267 / -25)         |

## Task 01: the four answers, recorded verbatim and not re-asked

The checkpoint was put to the user by the orchestrator before this plan ran, with each fork's storage
and code cost, and answered on 2026-09-11; 13-CONTEXT D-22 records it and this plan **asked nothing**.
The answer, verbatim:

> **many session bare no**

| Fork | Answer      | What it cost                                                                                                                                                                                                                                                                         | What was refused                                                                                              |
| ---- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| A    | **many**    | one `members: string[]` per collection (never a field on the record); `removeFromAll` as the delete reconciliation, called beside `removeDraft` / `deleteCopy`; `readCollections` dropping an id the library no longer carries and counting it (favorites' rule); the record's undo restoring its memberships | one collection per record - cheaper, and refused because `Live set` and `Studio experiments` are the pair a thing belongs to both of |
| B    | **session** | `deleteCollection` returns the removed collection; the route holds it in a module-level variable (`held`) for the tab's life; `restoreCollection` writes it back; no second record shape, no expiry rule; collections.spec.ts test 3 asserts the store carries no trace              | a tombstone with an expiry (survives a reload; a second shape and a sweep rule); a confirmation instead of undo (section 11 asks for undo where practical) |
| C    | **bare**    | nothing in the module; the rail's COLLECTIONS section is every collection then `+ New collection`, and with none it is that one row - never hidden, nothing pre-named                                                                                                              | a suggested first collection; hiding the section until one exists                                             |
| D    | **no**      | nothing: `ExportFile` has no collections field and transfer.ts's header says so and why; an import lands unfiled; collections.spec.ts test 4 imports a file hand-edited to CLAIM a collection and asserts none is created and the key is never written                                | membership travelling and the collection created on import (one file could create something the visitor never made) |

The answers are `src/lib/store/collections.ts`'s header, dated, with the sentence that these are
decisions and not conventions and that a reader who finds them inconvenient changes D-22 first.

## The baseline, carried from 13-11, and this plan's term written out

Observed on the clean tree at `36ccd2d` before the first edit: **87 files / 913 tests (+1 todo) / 78
e2e titles / 94 runs / check 613 / catalog 26 / sweep `4 19` / radius allowlist 0 rows**. The first
baseline run read 894 passed / 19 failed with every red in `install.spec.ts` (the known connect-snapshot
transient under load); the file alone read 23 / 23, and 894 + 19 = 913. The plan's carried `86 / 896`
and its `88 904` literal are stale (13-06 to 13-11 and 12.1's plans landed after it was written).

| Count            | Carried (13-11) | This plan                                                     | Observed                                                                    |
| ---------------- | --------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| unit files       | **87**          | **+2** (`transfer.spec.ts`, `collections.spec.ts`)            | **89**                                                                      |
| unit tests       | **913**         | **+8** = `transfer.spec` **4** + `collections.spec` **4**     | **921** (+1 todo, `firmware-oracle.spec.ts:209`, unchanged)                 |
| e2e titles       | **78**          | **+1** (`library.e2e.ts`)                                     | **79** (`grep -c "test("` summed over `e2e/`)                               |
| e2e runs         | **94**          | **+1** (chromium only, no `@webkit` tag)                      | **95** in five chunks: 23 + 19 + 20 + 20 + 13 (see below)                   |
| check            | **613**         | **+11** (two routes, three components, two stores, two specs, two fixtures) | **624**, 0 errors, 0 warnings                                    |
| sweep            | `4 19`          | unchanged                                                     | `4 19` (`check-counts.mjs 4 19` matches)                                    |
| radius allowlist | 0 rows          | **+0** - three `border-radius: 0` declarations, all exempt    | 0 rows; layer A 18 declarations in 60 files, 12 exempt, 6 circles at D-15's lines; layer B 20 in 12 built stylesheets, 6 at 50% |
| catalog          | 26              | not touched                                                   | 26                                                                          |

`npm run test:quick 2>&1 | node scripts/check-counts.mjs 89 921`: **89 files, 921 tests passed, 1 todo -
matches**, on the committed tree after a fresh build. `npm run test:sweep 2>&1 | node
scripts/check-counts.mjs 4 19`: matches. `npm run check`: 624 files, 0 errors, 0 warnings. `npm run
lint` (prettier --check over the tree, then eslint): clean. `npm run build`: green three times (after
task 2, after the e2e's collections walk, and on the committed tree for the final runs). `git diff
--stat 36ccd2d -- src/vendor/`: empty. `git diff --quiet 36ccd2d -- .planning/ROADMAP.md`: silent.
**CAT-04 stays `[ ]`.** `firmware-oracle.spec.ts` green and unedited.

## The codec proof

```
$ git diff --quiet 36ccd2d -- src/lib/share/stamp.ts src/lib/share/stamp.spec.ts && echo "identical"
identical
```

`stamp.ts` and `stamp.spec.ts` are byte-identical to the tree this plan started from; the sweep reads
`4 19` as before; no format letter was added (`w x y z` as 10-08 left them). `Landing` is **imported as
a type** into `transfer.ts` (`import type { Landing } from "$lib/share/stamp"`) and never re-declared
there; the route reaches `encodeFor` and `stampKnobs` through a dynamic import and uses them, never
edits them. (The workspace route carries its own `type Landing = ...` copy from 13-09 - pre-existing,
not this plan's, named under "Deferred".)

## The `ExportFile` shape, as shipped

```
ExportFile {
  schema: 1,                       // the body's version (13-06's rule spent)
  kind: "playground" | "sandbox",  // repeated at the top so a reader need not open the record
  exportedAt: string,              // ISO-8601
  app: "hangar",                   // step 1's first check
  record: StoredRecord,            // drafts.ts's / library.ts's record, byte-for-byte
  rack?: { id: string; options: number }[]   // playground files only: the entry's rack at export time
}
```

**One field the plan's sketch did not have: `rack`.** A Playground record holds one index per knob and
nothing about the knobs. The codec's `older` is reachable only because format `x` carries a shape
character that trips when a knob is RESIZED - the case where every old index still fits the new list and
a restore would be silently wrong. A record has no shape character, so without one the honest test 3
could not be written: the same tuned vector as stamp.spec.ts against the same resized entry would have
landed `restored`. A file has room for more than one character, so a playground export carries the rack
it was encoded against (each knob's id and option count) on the ENVELOPE, and the record itself still
round-trips byte-for-byte (test 1 asserts `JSON.stringify` equality). A sandbox file has no rack; a
playground file without one is refused at step 3. **No collections field, by fork D**, and the header
says so rather than leaving a reader to assume it was forgotten. Whether the record was a draft or a
saved copy does not travel either - the two share one shape and an import lands as a saved copy.

The file name is `{slug}.hangar.json` (`euclid-copy.hangar.json`); the input accepts
`application/json,.json`; the text is two-space JSON with a trailing newline.

## The six validation steps, in order, and what each returns

| Step | Check                                                                                                   | On failure                                                                                                                         | Sentence (ledgered)                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1    | the text parses; `app === "hangar"`; `schema` is `1` or in `READABLE_OLDER_SCHEMAS`                     | **unreadable**                                                                                                                     | `notJson`, `notHangar`, `schemaUnknown(schema)`                                                  |
| 2    | `schema` is a readable OLDER version                                                                    | **older**, landing on the base configuration - unreachable today: `READABLE_OLDER_SCHEMAS` is empty; the door for the first `.v2` | `schemaOlder(schema)`                                                                            |
| 3    | `kind` is `playground` or `sandbox`; `record` passes `isStoredRecord` and its `kind` agrees; a playground file carries a valid `rack` whose length is the record's | **unreadable**                                                                                                                     | `kindUnknown`, `recordMalformed`                                                                 |
| 4    | playground: the entry exists; the rack agrees knob by knob (id and option count); every index is inside its knob's list | entry gone -> **unreadable**; rack differs -> **older**, the record landed at the entry's defaults, `editedAt` re-dated; rack agrees and an index past its list -> **unreadable**, the knob named | `entryGone(source)`, `knobCount(name, filed, now)`, `rackChanged(name, knob)`, `knobRange(knob, index, count)` |
| 5    | sandbox: at most 16 regions; every region inside the 9x9 (`w, h >= 1`, `col + w <= 9`, `row + h <= 9`); no two regions share a cell (an 81-cell owner map) | **unreadable**, the region named                                                                                                   | `tooMany(count)`, `offSurface(region)`, `overlap(a, b)`                                          |
| 6    | otherwise                                                                                               | **restored** with `indices` (knob id -> index for playground; `{}` for sandbox)                                                    | -                                                                                                |

`classifyImport(text, knobsOf, at)` is pure: reads nothing, writes nothing, never throws.
`importText(store, text, knobsOf, at)` calls it and writes only on `restored` or `older`, through
`saveCopy`; an id the library already holds gets the moment appended (a second import is a second copy,
never a silent no-op and never an overwrite). **`none` is never returned** - a chosen file is always
something - and the header says so rather than inventing a fourth word.

**One divergence from the codec, stated in the header:** an added or removed knob is `unreadable` in the
stamp (its payload LENGTH moves before the shape character is read, and a wrong length might be
corruption) and `older` here (the rack is a list with names, the record has already passed
`isStoredRecord`, and a count that differs is legibly the rack having moved). Every other row is the
codec's: shape disagrees -> older; shape agrees, index out of range -> unreadable; shape agrees, every
index in range -> restored.

## The `stamp.spec.ts` test matched by name

**`lands older on a resized knob and never restored on a changed rack`** (`stamp.spec.ts:197`).
transfer.spec.ts test 3 uses the SAME entry (`euclid`), the SAME resize (the first knob loses its last
option: `values.slice(0, length - 1)`) and the SAME tuned vector (every knob one past its default,
stamp.spec.ts's `tunedOf`), asserts first that `decodeFor(resized, encodeFor(each, indices))` is `{ kind:
"older" }` - the stamp's own verdict - and then that a file written against the catalog's rack and read
against the resized rack lands `older` at step 4 with `rackChanged("euclid", <first knob's label>)`, the
stored record at every default (`encodeFor(resized, atBase)` is `undefined`: a URL with no fragment IS
the base configuration), the name kept and `editedAt` re-dated. The test also asserts the tuned index
still FITS the resized list (`tuned[0] < resizedKnobs[0].options.length`), which is the whole reason a
rack is needed. The removed-knob half is cross-checked too: the stamp says `unreadable` (length), the
import says `older` (count), both asserted side by side.

## What the table shows

| Column        | Source                                                                                                           | As shipped                                                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CONFIGURATION | PadFrame + PadCanvas at 56x56, registered by the route with the page's one SimHost; the name at 19px in the display face over `ZONA · Personal configuration` | live: a Lua entry's engine is built with the record's knob indices (`createEngine(entry, indices)`), a preset entry's at the base; a sandbox record's face is unlit (stub) |
| TYPE          | `typeLabel(kind, forLabel(entry.tags[0]))`                                                                       | `Modulation`, `Visuals`, `Playing`, `Custom surface`; `Playground` when the entry has left the catalog                                                                       |
| LAST EDITED   | `editedInWords(editedAt, now)`                                                                                   | `Today, 18:46` / `Yesterday` / `8 Sep 2026`, sans face with tabular numerals; `earlier` for an unreadable moment                                                             |
| STATUS        | drafts.ts's record -> `Draft` in the action colour; library.ts's -> `Saved` neutral                              | a rectangle (D-01), `data-status` on the chip; the words live in `words.ts`, not in a store (local.spec.ts test 9's scan)                                                    |
| (headless)    | Rename (inline field, Enter / blur commit, Escape cancels), Export, Delete, Add to collection (a select offering only collections the record is not in), Remove (inside a collection's view) | 13px quiet text buttons at 44px hit areas; every one named with the record                                                          |

`All saved` counts both stores (the PDF's `All saved 12` over a table carrying a `Draft` row); `Drafts`
narrows to the first. The count line is the PDF's `{n} saved configurations` (singular ledgered). The
search narrows by name and type; the miss is section 16's own sentence. The sort offers `Last edited`
(PDF) and `Name` (ledgered).

## The Favorites / Recently used decision

13-08 left it: *"should Favorites and Recently used be destinations rather than filters"*. Decided
from the PDF: **destinations**. Both pages draw the same YOUR LIBRARY rows with the same counts (08,
06), and both lists are lists of CATALOG ENTRIES - a favorite is a starred Playground configuration and a
recent is one the workspace opened - while this table lists PERSONAL configurations. Narrowing the table
by either would show a count the table cannot match (eight favorites, two copies made from them), the coy
state D-05 forbids. So on page 4 the two rows are `href` rows pointing at the gallery and their counts
are the stores' own (`readFavorites(...).ids.length`, `listRecent(...).length`). The gap - the gallery
cannot yet arrive WITH the view selected, because 13-08 keeps the library view out of the address so a
shared link never shows somebody else's favorites - is question 1 for the user, with a session handoff
(the browse-return record's mechanism) named as the alternative. The gallery's own two rows are untouched.

## Collections: the module's header specification

`src/lib/store/collections.ts` opens with THE SPECIFICATION THE BIBLE NEVER WROTE: that section 11 lists
drafts, copies, favorites and export/import and never mentions collections; that the PDF draws them and
the user chose them for v1 (D-13); that the four forks were put to the user with their costs on
2026-09-11 and answered verbatim `"many session bare no"` (D-22); then A, B, C and D each as a paragraph
naming the answer, what it costs in this module and what was refused and why; then the record shape
(`{ schema: 1, collections: Collection[] }`, each `Collection { schema: 1, id, name, createdAt,
members }`), the note that the key was reserved at 13-06 and is spent here, 13-06's primitive rules
(probe before write, refused declines, corrupt replaced whole, a malformed collection hides no
neighbour, reading never writes) and the validator-as-argument rule.

The API: `readCollections(store, isKnown) -> { list, dropped }`; `createCollection(store, id, name, at)`
(`"kept"` on an existing id); `renameCollection(store, id, name)` (createdAt and members untouched);
`deleteCollection(store, id) -> Collection | undefined` (the undo vector; no tombstone);
`restoreCollection(store, collection)` (`"kept"` if the id has reappeared); `setMember(store,
collectionId, recordId, on)` (never unfiles elsewhere; a no-op change writes nothing);
`collectionsOf(list, recordId)`; `removeFromAll(store, recordId) -> string[] | undefined` (the
reconciliation; returns the ids an undo needs).

On the page: the COLLECTIONS rail section (every collection, then `+ New collection`); a create form
above the table (one field, Create disabled while empty, Cancel, Enter / Escape); the selected
collection's head with its name at 24px, inline Rename and `Delete collection`; the table narrowed to
members with `Remove` on every row; `Add to collection` on every row in the other views; the empty
state `Nothing in {name} yet. Add a configuration from All saved.`; one session undo slot shared by
records and collections (`held`, a module-level variable), with a record's undo restoring its
memberships because the delete removed them.

## Every ledgered string

Appended to `13-COPY-NEW.md` under "From 13-13" (task 2's table and task 3's), all in D-05's register -
sentence case, action and result, no exclamation marks, real apostrophes:

**The route:** `TITLE` _My configs — HANGAR_; `SORT_NAME` _Name_; `EMPTY_LIBRARY` _Nothing saved yet.
Save a copy from the Playground or build a surface in the Sandbox, and it will be kept here._;
`EMPTY_DRAFTS` _No drafts. A draft is kept here while you're still working on it._;
`importRefused(file, reason)` _Couldn't import {file}. {reason}_; `importedLine(name, reason?)`
_Imported {name}._ / _Imported {name}. {reason}_; `deletedLine(name)` _Deleted {name}._; `UNDO`
_Undo_; `restoredLine(name)` _{name} is back._; `STORE_REFUSED` _Your browser refused to store the
change._; `COLLECTION_NAME` _Collection name_; `CREATE` / `CANCEL`; `RENAME_COLLECTION` _Rename_ (name
_Rename {name}_); `DELETE_COLLECTION` _Delete collection_ (name _Delete the collection {name}_);
`emptyCollection(name)` _Nothing in {name} yet. Add a configuration from All saved._

**transfer.ts's `IMPORT_REASONS`:** `notJson` _This file isn't JSON, so it can't be a HANGAR export._;
`notHangar` _This file wasn't exported by HANGAR._; `schemaUnknown` _This file was made by a newer
HANGAR (format {schema}). This version reads format 1._; `schemaOlder` _This file was made by an
earlier HANGAR (format {schema}). It opens on the base configuration._; `kindUnknown` _This file
doesn't hold a configuration or a surface._; `recordMalformed` _The configuration inside this file is
incomplete._; `entryGone` _The Playground configuration this file was made from, {source}, isn't in the
Playground any more._; `knobCount` _This file sets {filed} knobs and {name} now has {now}. It opens on
the base configuration._; `rackChanged` _The {knob} knob of {name} has changed since this file was
made. It opens on the base configuration._; `knobRange` _{knob} has {count} positions and this file
asks for position {index + 1}._; `tooMany` _This surface has {count} elements. A surface holds at most
16._; `offSurface` _{region} lies outside the 9 × 9 surface._; `overlap` _{a} overlaps {b}._

**The table:** `RENAME` / `EXPORT` / `DELETE` with names _Rename {name}_, _Export {name} as a file_,
_Delete {name}_; `ADD_TO_COLLECTION` _Add to collection_ (name _Add {name} to a collection_); `REMOVE`
_Remove_ (name _Remove {name} from {collection}_); `HEAD_ACTIONS` _Actions_ (screen-reader only).

**words.ts:** `typeLabel`'s fallback _Playground_; `editedInWords`'s _earlier_; `countLine(1)` _1 saved
configuration_.

Not ledgered because verbatim from the PDF or section 16: every string listed at the head of the
ledger's 13-13 section (the eyebrow, the headline, the sub, the four rail rows, `COLLECTIONS`, `+ New
collection`, the column heads, `Import config`, `New surface`, `Resume draft`, `CONTINUE EDITING`,
`Open`, `Saved`, `Draft`, `ZONA · Personal configuration`, `Custom surface`, the three timestamp forms,
`SEARCH MY CONFIGURATIONS`, the placeholder, `SORT BY`, `Last edited`, `{n} saved configurations`, the
breadcrumb and the context bar's sentence, and section 16's search-miss line).

## The e2e result, in full

Five chunks on fresh detached servers (13-07..11's `run-chunk.sh`), on the build of the committed tree
`b0dc77d`:

| Chunk | Files                                                                  | Result                                                                                                                                                                                                        |
| ----- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | browse, browse-webkit, catalog                                         | **22 passed, 1 failed**: `browse.e2e.ts:1404 browse, open a configuration, and come back to the same view` (the search fill plus a tag click left 26 cards after 5 s under three workers) - **rerun alone: 1 passed (11.0 s)**; 23 |
| 2     | install, skeleton                                                      | **19 passed** (1.2 m)                                                                                                                                                                                         |
| 3     | session, smoke                                                         | **20 passed** (25.1 s)                                                                                                                                                                                        |
| 4     | tuning, tuning-webkit                                                  | **20 passed** (26.1 s)                                                                                                                                                                                        |
| 5     | artifacts, fidelity, first-experience, radius, library                 | first run **10 passed, 3 failed** - the server died mid-chunk (`wrangler` stderr `fatal error`; `first-experience.e2e.ts:380` read a 500, `radius.e2e.ts:301` both engines `ERR_CONNECTION_REFUSED` / `Could not connect`) - **rerun whole on a fresh server: 13 passed (32.2 s)** |

**23 + 19 + 20 + 20 + 13 = 95 runs, 79 titles**, every red rerun alone or as its chunk and green;
`library.e2e.ts`'s one title green in every run it was in (three times on its own during development,
5.5 s / 7.3 s, and in chunk 5's rerun). The plan's `npx playwright test --workers 3 -g "import"`
selects that title (its name carries the word).

## Negative checks

Every check mutated the shipped file by a string replacement asserted to match exactly once
(`1313-neg.mjs` in the scratchpad), ran the spec or the type check, restored from the pristine copy and
printed sha256 either side - identical each time (`06c9de1e…` for transfer.ts, `a5353b25…` for
collections.ts). No `git checkout` / `restore` / `stash` / `clean` was run.

| Check | Mutation                                                                                                     | Expected red     | Result                                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | `importText` writes the library key BEFORE `classifyImport` runs                                             | test 2           | **RED, all four** (the write log is asserted in each); test 2's message: `not JSON: NOTHING IS WRITTEN UNTIL THE WHOLE VALIDATION PASSES: expected [ 'hangar.library.v1' ] to deeply equal []` |
| B     | `const OLDER: Landing = { kind: "outdated" }` - a fourth outcome word                                        | `npm run check`  | **RED**: `transfer.ts 280:26 Type '"outdated"' is not assignable to type '"none" | "restored" | "older" | "unreadable"'` - 1 error where there were 0 |
| C     | `removeFromAll` leaves the FIRST collection holding the deleted record                                       | collections test 2 | **RED, test 2**: `copy:arc:1 was deleted and is still filed in: Live set: expected [ 'Live set' ] to deeply equal []` - the orphan named              |

The plan's own checks were A and B (task 2) and C (task 3); all three earned their red.

## Deviations from Plan

### 1. [Rule 2 - correctness] `ExportFile` gains `rack`

**Found during:** Task 2, writing test 3. **Issue:** the plan's shape `{ schema, kind, exportedAt, app,
record }` cannot land a resized knob `older` when the old indices still fit the new list - the exact
case the codec's shape character exists for and SHARE-03's "never a subtly wrong one" forbids; the test
the plan asked to match by name would have read `restored`. **Fix:** the entry's rack (id + option count
per knob) on the envelope for playground files; step 3 requires it; step 4 compares it. The record is
untouched. **Files:** `transfer.ts`, `transfer.spec.ts`. **Commit:** `6673a01`.

### 2. [Design, stated] `exportFile` takes `knobsOf`

Consequence of 1: `exportFile(record, at, knobsOf?)`; without it a playground file has no rack and is
refused on the way back in. 13-17's sandbox export passes nothing and is unaffected.

### 3. [Plan stale] The carried counts

The plan's `PREV_FILES 86 / PREV_TESTS 896` and `check-counts.mjs 88 904` predate 13-06..13-11 and
Phase 12.1 Band 1; the observed baseline is 87 / 913 and the term lands at 89 / 921. The term itself
(`+2 / +8`, e2e `+1 / +1`) is exactly as written.

### 4. [Design, stated] The row's three extra actions and the collection select

The PDF's row draws `Open` only; section 11 requires named copies, export and deletion with undo, and
D-13's collections need a way to file a record. Four quiet controls in a headless fifth column, every
word ledgered (question 12 asks whether the select is the right shape).

### 5. [Design, stated] Thumbnails at the record's knobs for Lua entries only

`createEngine(entry, knobs)` applies indices on the Lua route and ignores them on the compiler route
by its own contract; compiling per row would put the tuner's WASM on this page twelve times. The
preset-backed thumbnails show the base; ledgered as question 2.

### 6. [Rule 3 - blocking] `local.spec.ts` test 1's reservation assertion

13-06's test asserted `COLLECTIONS_KEY_RESERVED` is NOT in `OWNED_KEYS`; spending the key made it
owned. Test 1 now asserts `COLLECTIONS_KEY` IS owned and `OWNED_KEYS.length` is 7; the count of tests is
unchanged. Landed in task 2's commit with `schema.ts` because `transfer.ts` needed `SURFACE_SIZE` and
`SURFACE_ELEMENT_CAP` from the same file; the message says the key is spent ahead of `collections.ts`.

### 7. [Design, stated] The e2e's one title grew with task 3

The plan's `+1 / +1` is one title; rather than a second title for collections, the one title walks
them too (bare, create, file, view, remove, delete, undo, and the export carrying no membership).

### 8. [Process] `gsd-tools state` and `requirements` commands not run

STATE.md by script against a copy with every touched line asserted and `status`, `completed_phases 11`,
`percent 100`, `total_phases 14`, `total_plans 160` and `completed_plans 152` unchanged; Phase 13 to
12 of 20 beside Phase 12 (gate landed, bench pending) and Phase 12.1 (Band 1 complete, 5 of 9).
REQUIREMENTS.md untouched by the phase's convention (13-06 to 13-11 ticked nothing; 13-20 reconciles);
KEEP-01 and KEEP-04 name 13-16 and 13-17 as co-owners anyway.

## What the plan asserts that the tree does not support

1. **"the resume banner is the newest draft"** - true, and `newestDraft`'s rule is applied - but **no
   route writes a Playground draft**: the workspace reads its knob vector from the stamp hash (13-09)
   and calls `writeDraft` nowhere; 13-11 named the wiring as 13-13's and this plan's files do not
   include the workspace; 13-16 writes Sandbox drafts; no plan in the phase writes a Playground draft.
   The banner, the `Drafts` count and the `Draft` chip render whatever the store holds (the e2e plants
   one by hand) and are honestly empty for the Playground until a plan owns that wiring - question 5.
2. **`PREV_FILES 86 / PREV_TESTS 896` and `88 904`** - stale; see deviation 3.
3. **"a `playground` record with a knob index outside its option list is refused with the knob named"**
   - true, and the refusal is `unreadable` (the codec's row for an index past the end); the plan's step
   4 reads as if every mismatch were `older`. With the rack, `older` is the rack having moved and
   `unreadable` is a file no export can write; both name the knob.
4. **"Sandbox surfaces ... the format and the validator are built here so that plan has nothing to
   invent"** - built; but `src/lib/sandbox/model.ts` (13-14) does not exist yet, so step 5's bounds /
   overlap / cap check is transfer.ts's own 30 lines over `SURFACE_SIZE` and `SURFACE_ELEMENT_CAP` in
   `schema.ts`. 13-14 should import those two and may replace the check with model.ts's.
5. **`src/lib/ui/radius.spec.ts` in the plan's file lists** - not edited: the allowlist was already
   empty at 13-11 and no row was needed; the spec is green as it stands (0 rows, 18 declarations).
6. **"the one feature in the PDF with no specification behind it ... Four forks, one stop, task 01"** -
   the stop happened before this plan (D-22); nothing was asked.
7. Nothing else. The plan's `bible/HANGAR-ZONA-GUI-design-specification.md` and the PDF were read from
   `.planning/phases/13-gui-overhaul/bible/`; neither was edited.

## Known Stubs

- **A sandbox record's thumbnail is unlit**: PadFrame draws the frame and the dot field, no canvas is
  registered, because no surface engine exists until 13-15. `LibraryRow.live` is false for the kind;
  the route's header and the table's header both say so. Not a hardcoded value - the record is real
  and the picture is absent.
- **The collections drop count is read and not rendered** (`data-dropped` on the count line), the same
  shape as the gallery's favorites count: the sentence is 13-06's open question.
- **The Playground workspace writes no draft** (see above); the banner renders a real record when one
  exists and nothing otherwise.

## Questions for the user, recorded rather than answered (D-01)

Twelve, in `13-COPY-NEW.md` under "From 13-13": (1) Favorites / Recently used as links to the gallery
without a view handoff; (2) preset-backed thumbnails at the base; (3) the unlit sandbox thumbnail; (4) a
restored Playground import opening at once; (5) who wires Playground drafts into the workspace; (6)
Open and Resume through the stamp; (7) `Type` as a third sort; (8) rename committing on blur; (9) a
record's undo restoring its memberships; (10) duplicate collection names allowed; (11) one undo slot
for records and collections; (12) `Add to collection` as a native select.

## Deferred (out of scope, not fixed)

- `src/routes/playground/[id]/+page.svelte:246-251` declares its own `type Landing` identical to
  stamp.ts's rather than importing it (13-09's). This plan's rule - the union is imported, never
  re-declared - is applied to transfer.ts; the workspace's copy is pre-existing and is 13-20's to
  reconcile or 13-12's to fix while it edits that file.

## Notes for the next plans

- **13-14:** `SURFACE_SIZE` and `SURFACE_ELEMENT_CAP` are in `schema.ts`; `transfer.ts`'s `cellsOf` /
  `checkSurface` are the import-side geometry check - fold them into model.ts when it exists so the
  two ledgered off-surface / cap sentences become one at 13-18.
- **13-16:** `SECTIONS[1].href` is where `New surface` and a sandbox row's `Open` go; remove
  `/sandbox/` from `vite.config.ts`'s ignore in the commit that lands the route; write Sandbox drafts
  through `writeDraft` and they appear here as `Draft` rows with the banner.
- **13-17:** `exportFile(record, at)` for a surface writes no rack; `importText` validates regions at
  step 5 with the region named; `downloadExport` is the download; nothing to add for fork D.
- **13-18:** twenty-six rows and twelve questions under "From 13-13".
- **13-20:** the counts above; the codec proof; KEEP-01..06 and SHARE-03 untouched in REQUIREMENTS.md;
  the workspace's duplicate `Landing` type.
- **The harness:** a hand-started wrangler died once mid-chunk with `fatal error` in its stderr (chunk
  5's first run) - the whole chunk rerun on a fresh server was green; `run-chunk.sh` and
  `start-wrangler.ps1` are unchanged in the scratchpad.

## Self-Check: PASSED

- `src/routes/my-configs/+page.ts`, `+page.svelte`, `src/lib/ui/library/LibraryTable.svelte`,
  `ResumeBanner.svelte`, `words.ts`, `src/lib/store/transfer.ts`, `transfer.spec.ts`, `collections.ts`,
  `collections.spec.ts`, `e2e/library.e2e.ts`, `e2e/fixtures/library/euclid-copy.hangar.json`,
  `somebody-elses.json`: FOUND.
- `src/lib/store/schema.ts`, `local.spec.ts`, `src/lib/ui/shell/shell.svelte.ts`, `vite.config.ts`,
  `13-COPY-NEW.md`: modified in `6673a01` / `b0dc77d`.
- Commits `6673a01` and `b0dc77d`: FOUND in `git log`.
- Counts: 89 / 921 (+1 todo); e2e 79 / 95; check 624 / 0 / 0; sweep 4 19; allowlist 0 rows.
- `git diff --quiet 36ccd2d -- src/lib/share/stamp.ts src/lib/share/stamp.spec.ts`: silent.
- No device, no deploy, no push. The three untracked root files are the user's.
