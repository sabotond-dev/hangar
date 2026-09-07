---
quick_id: 260907-gs0
type: quick
subsystem: docs
tags: [midi, hardware-audition, zona, lua, bench-procedure, mirror, d-04]

requires:
  - phase: 08
    provides: docs/HARDWARE-AUDITION.md and its row 11, and audition.spec.ts as the gate that parses it
  - phase: 07
    provides: docs/SESSION-RUNBOOK.md and docs/INSTALL-RUNBOOK.md as the house shape for a bench checklist
provides:
  - "docs/MIDI-IN-PROBE.md: two paste-ready Setup scripts, machine-checked at 264 and 328 characters against 908, that answer whether host MIDI and MIDI clock reach a ZONA touch element"
  - "Row 11 of docs/HARDWARE-AUDITION.md now points at a script instead of naming a test it does not supply"
  - "The inbound-MIDI gap in src/lib/sim/lua-host.ts recorded as the thing the next phase inherits"
affects: [next catalog phase, MIRROR, any clock-locked or MIDI-lit configuration, src/lib/sim]

tech-stack:
  added: []
  patterns:
    - "A bench probe document carries its scripts verbatim from a machine check, and states the measured character count in the prose so a later edit cannot silently drift"

key-files:
  created:
    - docs/MIDI-IN-PROBE.md
  modified:
    - docs/HARDWARE-AUDITION.md

key-decisions:
  - "Part A carries no grxm call at all: the MIDIVOICE default is set at every VM start, so the call row 11 suggested is not load-bearing"
  - "Part A does not filter on MIDI channel, unlike the reference implementation, so a DAW on any channel cannot produce a false negative on the one question the next phase waits on"
  - "The audition's grxm(0,2) is documented as NOT the default spelled out - the default is mode 3 and mode 2 clears FORWARD - which is a correction to the plan's own verified_facts block"

requirements-completed: []

duration: 12min
completed: 2026-09-07
---

# Quick 260907-gs0: the ZONA inbound MIDI probe

**Row 11 of the audition named a bench test and handed the reader nothing to run; it now links to two paste-ready Setup scripts, machine-checked at 264 and 328 characters against the 908 budget, that answer whether plain host MIDI and MIDI clock reach a ZONA touch element.**

## Performance

- **Duration:** about 12 minutes, measured from the plan file's write at 12:13:52 local to the docs commit. No start stamp was taken.
- **Tasks:** 2 of 2
- **Files modified:** 2, both under `docs/`. No source file, no test file, no sibling repository.

## What was built

### `docs/MIDI-IN-PROBE.md` (new, 198 lines)

The eleven-part shape the plan specified, in the runbooks' voice:

1. Title, the GPL line naming Botond Sandor, and an opening that states the two questions and says row 11 named the test without writing it.
2. **What a yes unblocks** - Part A: MIRROR, which `src/lib/catalog/audition.spec.ts` blocks under D-04 on exactly this answer, plus the clip grid, VU meter and mixer-feedback family. Part B: the clock-locked family, and why a no closes it rather than redirecting it (`gts` is dead on ZONA).
3. **Before you start**, with capture-and-restore as item 1, then the paste route, the DAW, clock output enabled, and somewhere to write two answers.
4. **Neither probe has a Timer**, with the reason the audition's Timer-first rule does not bite spelled out in terms of `gtt` being a no-op until the Timer event holds a stored action.
5. **Part A**, the script fenced with its measured count beside the budget, how the callback reads, the no-`grxm`-needed correction and the no-channel-filter decision.
6. **Part B**, the same, plus both spellings of the routing call and the 24-clocks-to-a-quarter arithmetic, and why only Part B carries the `w` guard.
7. **The two rows** - a four-column table, `Do this` / `Passes when` / `Why a machine cannot check it` / `Pass`, rows A and B.
8. **If Part A shows nothing** - the one diagnostic variant, deleting `h[1]~=13 or`, and how to read the INSTR 14 outcome as a different answer from silence.
9. **What to hand back** - two yes-or-no answers, the unpredicted, and the original configuration confirmed restored.
10. **What a yes still does not buy** - the simulator finding, necessary and not sufficient.
11. **Results** - `None yet. This probe has not been run.`

### `docs/HARDWARE-AUDITION.md` (two sentences appended)

Row 11's What-to-check cell, appended after `If not, MIRROR stays unshipped.`:

> The script is now written out in `docs/MIDI-IN-PROBE.md`, which covers MIDI clock as well.

The What-to-record bullet for row 11, appended after `That single answer is what unblocks or permanently drops MIRROR.`:

> `docs/MIDI-IN-PROBE.md` holds the script for this row, and it names the two answers it wants — inbound CC, and MIDI clock — and where to write them.

Prettier re-padded the whole checklist table when the cell grew, which is the only other diff in the file (17 insertions, 15 deletions for two sentences).

## The two scripts, as measured by this executor

Both were run through the pinned `@intechstudio/grid-protocol` minifier from the repository root, not copied from the plan's claim:

| Part | What it answers                         | `checkSyntax` | Fixed point of `compressScript` | Characters | Budget |
| ---- | --------------------------------------- | ------------- | ------------------------------- | ---------- | ------ |
| A    | Does plain host MIDI reach the element  | true          | yes                             | **264**    | 908    |
| B    | Does MIDI clock reach the pad           | true          | yes                             | **328**    | 908    |

The checker's own line, run twice - once before `npm run format` and once after, because Prettier touches the new document:

```
MIDI-IN-PROBE ok: 264, 328 characters
```

Both numbers are stated in the document's prose, which the checker also asserts.

## The firmware citations, confirmed rather than taken on trust

The plan required its two citations be re-read before any prose leaned on them. Both were read directly, read-only, in the sibling repositories.

**`grid-fw/common/src/lua/decode.lua:43-44`** says exactly what the plan claims. Lines 42 to 46 read:

```
pass_rtm = function(el, x)
  if el.rtmrx_cb then
    el:rtmrx_cb({ x[1], x[2], x[3] }, x[4])
  end
end
```

So `rtmrx_cb` takes a header triple and one byte, not a table of four, which is what makes Part B's `function(s,h,b)` correct and Part A's `function(s,h,v)` different.

**`grid-fw/common/src/lua/init.lua:10-19`** says what the plan claims, and one detail more. Line 10 is `rx_type = { MIDIVOICE = 0, MIDISYSEX = 1, MIDIRTM = 2, EVENTVIEW = 3 }`, line 11 is `rx_feat = { FORWARD = 0x01, HANDLE_EXTERNAL = 0x02, HANDLE_INTERNAL = 0x04 }`, and lines 13 to 19 are the four `grxm` calls, with `grxm(rx_type.MIDIRTM, 0)` at line 15. So `grxm(2,3)` is `MIDIRTM` with `FORWARD | HANDLE_EXTERNAL`, exactly as the plan says.

`zona-docs/docs/ZONA_REFERENCE.md:1255-1312` was read for Part A and confirms INSTR 13 for host MIDI and 14 for the module's own echo, the four-element `event` row, `midirx_register` / `gmrr` being broken on a touch element, and the reference example's `v[1]~=0` channel test at 1284-1290.

## Deviations from plan

### Auto-fixed

**1. [Rule 1 - Bug] The plan's claim that `grxm(0,2)` is the MIDIVOICE default spelled out is wrong, and the document says the accurate thing instead**

- **Found during:** Task 1, while re-reading `init.lua` as the plan instructed.
- **Issue:** `<verified_facts>` and the `<action>` block both state that row 11's `grxm(0,2)` is "numerically that exact default", and instruct the document to say so. It is not. `init.lua:13` sets `rx_feat.FORWARD | rx_feat.HANDLE_EXTERNAL`, which is `0x01 | 0x02` = **3**. Mode **2** is `HANDLE_EXTERNAL` alone: it keeps the bit that delivers a host message to the Lua callback and **clears** `FORWARD` (forward-from-USB). So `grxm(0,2)` is the default minus one bit, not the default. Writing "that default spelled out" into a bench document would have put a false claim in front of the one person who cannot check it.
- **Fix:** The document keeps the plan's conclusion, which is unaffected - Part A needs no `grxm` call, because `HANDLE_EXTERNAL` is already on before the Setup runs - and states the arithmetic honestly: the default is mode 3, mode 2 keeps `HANDLE_EXTERNAL` while clearing `FORWARD`, so the call is at best redundant for this test and at worst a change to something the test did not intend to change, which is why the script omits it.
- **Files modified:** `docs/MIDI-IN-PROBE.md` only. Neither script changed, so both character counts stand.
- **Commit:** 4e392df

### Deliberate shape choices inside the plan's latitude

- The plan's `<interfaces>` said "exactly the shape of `docs/SESSION-RUNBOOK.md`" for the table. That runbook's table has a `Row` column between `#` and `Do this`; this document's has four columns as the acceptance criterion names them, because two rows do not need a name column when the row letter is the name.
- The `decode.lua` quotation is in an unlabelled fenced block rather than a ` ```lua ` one, deliberately: the plan's own checker asserts **exactly two** `lua` blocks, and both are the pasteable scripts. A third would have failed the gate and, more to the point, would have put a block on the page that looks pasteable and is not.
- "Before you start" gained an item the plan did not list: neither probe is in HANGAR's catalog, so the paste route is Grid Editor or BOTOR's shelf and not `TRY ON DEVICE`. Without it a reader who knows the site would look for the probe in the catalog.

## Verification

Both `<automated>` checkers were run, and re-run after `npm run format`.

**Task 1 checker:**

```
MIDI-IN-PROBE ok: 264, 328 characters
```

It asserts, and passed on: no `Claude` or `Anthropic` anywhere; no exclamation mark; no straight apostrophe; no spaced hyphen used as a dash; no emoji; the GPL line present verbatim; exactly two `lua` blocks; each accepted by `GridScript.checkSyntax`; each a fixed point of `GridScript.compressScript`; 264 and 328 characters; both counts stated in the prose; both inside 908; and eleven required claims present by substring, including `midirx_cb`, `rtmrx_cb`, `grxm(2,3)`, `rx_feat.HANDLE_EXTERNAL`, `248`, `250`, `252`, `176`, `lua-host.ts`, `audition.spec.ts` and `gtt`.

**Task 2 checker:**

```
audition row 11 ok, 12 rows
```

The checklist still parses to exactly twelve four-cell numbered rows. Row 11's What-to-check cell names `docs/MIDI-IN-PROBE.md`, the What-to-record section names it too, and the word `optional` still survives the lower-cased join of row 11's Config and What-to-check cells.

**The gate:**

| Command                                                  | Result                                    |
| -------------------------------------------------------- | ----------------------------------------- |
| `npm run format`                                          | ran twice, exit 0                         |
| `npm run lint`                                            | exit 0                                    |
| `npm run test:quick -- src/lib/catalog/audition.spec.ts`  | 1 file, **4 tests passed**, 534 ms        |

**No test file changed, so no test-count delta is claimed.** The four `audition.spec.ts` tests are the same four that were there before this task, and they are green.

`npm run check`, `npm run build` and the e2e suite were not run, per the plan: no source file, route or component was touched.

`git diff --stat HEAD~2` reads two files under `docs/` and nothing else: `docs/HARDWARE-AUDITION.md` (+17 / -15, of which two sentences are the edit and the rest is Prettier's table padding) and `docs/MIDI-IN-PROBE.md` (+198).

## What the next phase inherits

**A hardware yes on either part opens a documentation door and a hardware door, and not yet a site one.** All three halves of the finding were re-confirmed in this repository:

- `src/lib/sim/lua-host.ts` binds `grxm` as `(_slot, mode) => this.grxm(mode)`, discarding the slot argument entirely, so the host cannot tell MIDIVOICE from MIDIRTM even in the value it stores.
- The private `grxm` it calls assigns `this._rxMode` and does nothing else. Its own comment says so: "Recorded; the host has no MIDI input to route, so no behaviour."
- `midirx_cb` and `rtmrx_cb` appear **nowhere** under `src/` except one sentence of prose in `src/lib/catalog/audition.spec.ts:248`. Grepped, one hit, that one.

So a card lit by inbound MIDI, or one breathing on a host clock, would install and run on a real ZONA and would sit motionless in its catalog card on the site. Shipping one needs a synthetic MIDI source and a synthetic clock in `src/lib/sim/` that drive `midirx_cb` and `rtmrx_cb` on the simulated element on a schedule a preview can loop. That is a piece of work, it is not written, and it begins only once one of these two answers comes back yes.

## Safety

No device was connected to, looked for, or written to. No row of the new document was run by an executor; the person with the ZONA runs it. Nothing under `src/vendor/` was touched, no source or test file was changed, and every read in `zona-docs`, `grid-fw` and `grid-editor` was read-only with no git command issued outside `hangar`.

## Self-Check: PASSED

- `docs/MIDI-IN-PROBE.md` — FOUND (198 lines)
- `docs/HARDWARE-AUDITION.md` — FOUND, row 11 and the What-to-record bullet both name the probe
- Commit `4e392df` — FOUND
- Commit `5a4ef57` — FOUND
