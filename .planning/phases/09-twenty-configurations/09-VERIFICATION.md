---
phase: 09-twenty-configurations
verified: 2026-09-07T22:05:00Z
status: human_needed
score: 5/5 success criteria have every automatable half verified; 4/5 close outright (1, 2, 4, 5), 1/5 human_needed (criterion 3, on the "a capability the simulator cannot render" half — five entries send keystrokes the simulator records and never renders). Requirements: CONT-02, CONT-03 and TUNE-01 all close. The thirty-two-row hardware audition is presented and unanswered; nothing about the twenty configurations is claimed as hardware-verified
human_verification:
  - test: "HARDWARE-AUDITION rows 13, 19, 26 — the latch family (HOLD, CONSOLE, FORGE)"
    expected: "Work each latch fast and repeatedly in different places, dozens of gestures. The latched cell / mute / bank always follows the finger and never sticks. FORGE's fifteen-second watchdog is observed dropping the bank back to A"
    why_human: "Firmware advances prev_* before the writability check, so a dropped release leaves a permanently stuck contact, and src/vendor/botor/pad-sim.ts:270-271 states in its own words that the simulator runs the watchdog semantics and cannot manufacture the stuck contact. A green frames.spec.ts over a latch is a statement about a pad that does not have the bug"
  - test: "HARDWARE-AUDITION row 32 — POMODORO across the 655 s glt ceiling"
    expected: "Start it, leave the module alone for the full interval. The inner breathe still moves at the end, the ring reaches zero, and the drift against a wall clock is recorded"
    why_human: "The rate re-issue that carries the animation past the ceiling has been checked over 160,020 simulated ticks on a clock that is exact. The module's Timer fires on the next 100 Hz cycle after its countdown and drifts under load over 1,500 of them"
  - test: "HARDWARE-AUDITION rows 23 and 24 — the keystroke family (STAGE, SHUTTLE)"
    expected: "With OBS and a video editor in front of the module, the keystrokes arrive at all and arrive as the right keys, with and without a modifier, and SHUTTLE's top speed is not dropped by the 256-byte per-cycle buffer"
    why_human: "gks resolves in src/lib/sim/lua-host.ts, is recorded into hidLog, and lua-host.ts:429 says nothing in HANGAR consumes it. This verifier measured it directly: STAGE, SHUTTLE, CULL, FORGE and SWITCH each produce 0 MIDI and 2 HID under the scripted gesture. Every usage id was checked by hand against the USB HID Usage Tables and by nothing else"
  - test: "ADDED BY THIS VERIFICATION — CULL and SWITCH also send keystrokes, and their rows do not ask whether the right key arrives"
    expected: "While running rows 25 and 27, also bind CULL's five rating keys and SWITCH's nine app keys to something visible and press them. Record whether each arrives and as which key"
    why_human: "Five configurations send gks, not two. Rows 23 and 24 cover STAGE and SHUTTLE and row 26 exercises FORGE's macros incidentally; rows 25 (colour-blindness) and 27 (legibility at two metres) are perception rows and ask nothing about output. A wrong usage id in CULL or SWITCH is invisible to every gate in this repository and to the checklist as written"
  - test: "ADDED BY THIS VERIFICATION — a dropped release hangs a note, not only a latch"
    expected: "While working rows 3, 7, 14, 15, 16 and 31, listen for a stuck note. CHORUS, LATTICE, KEYS, SLAM and QUADRANT all send note-off (command 128) from the e>=5 / e>4 branch; a dropped release leaves the note sounding"
    why_human: "The same firmware stuck-contact bug the six named rows are built around, in its audible rather than its visual form. The audition's latch-and-time family names four rows and the note-off senders are five more entries. Nothing in the checklist asks a tester to listen for a hanging note"
  - test: "HARDWARE-AUDITION row 11 (optional) — the MIDI-IN probe"
    expected: "With grxm(0,2) and a midirx_cb, does an inbound CC from the DAW move a bar, and what instr does it carry? docs/MIDI-IN-PROBE.md holds the script"
    why_human: "This is the answer that unblocks or permanently drops the whole clock-locked family D-04 deferred. Firmware source shows the path; nothing shows the traffic arriving"
  - test: "The remaining twenty-six audition rows"
    expected: "docs/HARDWARE-AUDITION.md, thirty-two rows, results recorded under a dated Results heading"
    why_human: "Perceived polyrhythm, LED diffusion, physical brightness after the divide-by-512 with no gamma anywhere in the WS2812 path, felt latency of a steer, whether a target is hittable without looking. None is a number"
---

# Phase 9: Twenty Configurations Verification Report

**Phase Goal:** The catalog stops being a demo of what a ZONA can look like and becomes a library of
what a ZONA is for — twenty configurations, each one useful to a named person in a named application
and worth watching on a card.

**Verified:** 2026-09-07T22:05:00Z, at `08c285e`, on a clean working tree
**Status:** human_needed
**Re-verification:** No — initial verification

Read before verifying: `ROADMAP.md`'s five success criteria, `09-CONTEXT.md` including the
**Amended after planning** section (D-06 reversed, D-07 widened, D-09 corrected), `09-VALIDATION.md`,
all ten PLANs and SUMMARYs, `deferred-items.md`, the three research documents,
`docs/HARDWARE-AUDITION.md`, `docs/TESTING.md`, `docs/PIN-POLICY.md`, and the shipped catalog, sim,
browse, share, og, script and e2e files the brief names.

One correction to the brief: **there is no `vitest.config.ts`.** The two Vitest projects (`server`
and `sweep`) are declared in `vite.config.ts`'s `test.projects` block. `09-VALIDATION.md` says this
correctly, and the file was read there.

---

## Gates, run by this verifier (observed, not copied)

Every number below was produced on this machine, at `08c285e`, during this verification. Nothing on
port 4173/4174 was held at the start and no build directory was locked.

| Gate | Command | Observed | Expected by 09-10 |
| ---- | ------- | -------- | ----------------- |
| Type check | `npm run check` | `COMPLETED 567 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` | 567 / 0 / 0 | ✓ |
| Lint | `npm run lint` | `All matched files use Prettier code style!`, eslint silent, exit 0 | clean | ✓ |
| Quick | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 74 780` | `observed 74 files, 780 tests passed, 1 todo` / `matches the expected counts` | 74 / 780 | ✓ |
| Sweep | `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 4 19` | `observed 4 files, 19 tests passed, 0 todo` / `matches the expected counts` | `4 19` | ✓ |
| E2E | `npx playwright test --workers 3` | **89 passed (2.0m)**, both projects present in the log (chromium and webkit-phone), exit 0 | 89 | ✓ |
| Vendor tree | `git diff --stat 34d0fd6..HEAD -- src/vendor/` | empty | empty | ✓ |

**On memory, because 09-10 asked for it.** Free memory was 0.72 GB when this verification started and
1.56 GB when the Playwright run was launched. **The e2e suite passed on the first attempt** — no red
run to report, and therefore no false red either. Free memory dipped to 0.38 GB mid-run and recovered
to 1.74 GB at exit. `docs/TESTING.md:29` records the same suite at 93 s wall at 1.3 GB free and 162 s
at 0.43 GB, which is consistent with what happened here. `test-results/` was removed afterwards; the
tree is byte-clean (`git status --porcelain` empty).

A second observation the run produced for free: `npm run preview` re-ran `scripts/gen-og.mjs`, which
regenerated all 36 PNGs into the gitignored `static/og/`. They came back at **210,926 bytes over 36
files**, byte-for-byte the total 09-09 recorded — an unplanned determinism check on the OG generator
at thirty-six entries.

---

## Goal Achievement

### Observable Truths (the five ROADMAP success criteria)

| # | Truth | Status | Evidence |
| - | ----- | ------ | -------- |
| 1 | Twenty new configurations are in the catalog, sixteen → thirty-six, each with name, description, feel tags and default state, declared in all three places and gated in both directions | ✓ VERIFIED | `CATALOG` 36 / `LISTING` 36 / `FRONT_DOOR` 8 + `EXCLUDED_FROM_ROW` 28, partition exact with zero overlap and zero extras; all 20 slate ids present; 0 field mismatches across name, description, tags, featured, addedAt, restsBlack, preview |
| 2 | Every new configuration fits both 908 budgets at defaults and at every corner of its knob cross-product, and every hand-authored one runs in a real Lua VM without error with a recorded golden frame set | ✓ VERIFIED | Sweep green at 4/19; independently recomputed **701 combinations / 1,402 measured events over 27 Lua entries**, zero over budget; `lua-smoke.spec.ts` runs all 27 in a real Lua 5.4 VM with 0 errors and non-empty output; `frames.json` holds 36 × 5 recorded ticks and `frames.spec.ts` test 3 is green |
| 3 | No configuration depends on inbound host MIDI, on Grid Editor running, or on a capability the simulator cannot render; the clock-locked family stays deferred behind docs/MIDI-IN-PROBE.md | ? HUMAN NEEDED | Inbound-MIDI half **verified**: zero occurrences of `midirx_cb` or `rtmrx_cb` anywhere; **no entry calls `grxm`** at all; row 11 keeps MIRROR optional and unshipped. Grid Editor half **verified** (D-05, nothing in the slate needs it). The **"capability the simulator cannot render" half is where this strains**: five entries (STAGE, SHUTTLE, CULL, FORGE, SWITCH) send `gks`, which `lua-host.ts:429` records and nothing consumes — measured here as 0 MIDI / 2 HID each |
| 4 | A call the Lua host does not register is refused by a gate before it can reach an entry | ✓ VERIFIED | `host-surface.spec.ts`, 4 tests, is a **classifier** over `HOST_GLOBALS` / `HOST_SELF_METHODS` imported from the host rather than a blocklist; test 3 asserts `findTraps` reports nothing for a `gln` body **and** that the classifier refuses exactly `["gln"]`; the seven Phase 8 entries passed **unedited** (proved by diff) |
| 5 | The front-door ring is unchanged at eight, and the browse page, the catalog gates and the budget sweep stay green at thirty-six | ✓ VERIFIED | The `FRONT_DOOR` literal block is **byte-identical** to `34d0fd6` (2,390 bytes both sides, `diff` silent); `front-door.ts` diffstat over the whole phase is `80 insertions, 0 deletions`, all into `EXCLUDED_FROM_ROW`; browse e2e counts against `LISTING.length` are green at 36; quick and sweep green |

**Score:** 4/5 verified outright, 1/5 (criterion 3) human_needed on one of its three halves.

---

### The arithmetic the brief asked for, recomputed from the shipped modules

Every number below was produced by importing the shipped TypeScript directly, not by reading a
SUMMARY.

| Quantity | Expected | Observed |
| -------- | -------- | -------- |
| `CATALOG.length` | 36 | **36** ✓ |
| `source.kind === "preset"` | 9 | **9** ✓ |
| `source.kind === "lua"` | 27 | **27** ✓ |
| `source.kind === "state"` | 0 | **0** ✓ |
| `LISTING.length` | 36 | **36** ✓ |
| `FRONT_DOOR.length` | 8 | **8** ✓ |
| `EXCLUDED_FROM_ROW.length` | 28 | **28** ✓ |
| partition sum / overlap | 36 / 0 | **36 / 0** ✓ |
| `frames.json` entries | 36 | **36** (5 ticks each: 0, 37, 101, 500, 1009) ✓ |
| `static/og/*.png` | 36 | **36** ✓ |
| `build/c/*` pages | 36 | **36** ✓ |
| Phase 9 slate ids present | 20 | **20/20** ✓ |
| Phase 9 entries with exactly four tags | 20 | **20** (tag histogram: 9 entries × 3 tags, 27 × 4) ✓ |
| Longest description | ≤ 110 | **109** (`euclid`); 36 distinct descriptions ✓ |
| One `addedAt` for the twenty | `2026-09-07` | **2026-09-07**, single value; three date blocks overall (9 / 7 / 20) ✓ |
| Distinct tags (`KNOWN_TAGS`) | 55 | **55** (28 chips at count ≥ 2, 27 singletons) ✓ |
| Quiet line on every non-animated entry | 19 of 19 | **19 of 19**, no newlines, 16 distinct non-dark lines ✓ |
| `restsBlack` entries carrying `RESTS_DARK_NOTE` verbatim | 4 | **4** — `tpad`, `ghost`, `morph`, `etch` ✓ |

`dial` is the one animated entry that also carries a quiet line; `listing.ts:79-84` documents that
deliberately and `listing.spec.ts` test 3 gates it.

---

### Budget, at every knob corner — the sweep is the oracle, and it was re-derived

`lua-entries.sweep.spec.ts` test 6 enumerates, per entry, **every value of every knob plus both
extreme corners** — not the full Cartesian product. That is licensed by test 5, which proves the
**separability identity per event**: moving one knob changes that event's length by exactly
(occurrences in that event) × (value-length difference), for every knob and every value, with a
matching assertion that no knob *value* can itself look like a token. Pure literal arithmetic with no
interaction means the maximum over the whole cross-product is the all-longest corner, and that corner
is measured directly. The bound is sound.

Recomputed independently (canonical form means `cost = max(raw, compressed) = raw.length`, and
canonicality is asserted by tests 1 and 6 through the pinned WASM minifier):

- **27 Lua entries, 701 combinations, 1,402 measured events.** Matches 09-09 and 09-10 exactly.
- **Zero events over 908 at any enumerated combination.**
- **Tightest Setup: QUADRANT — 838 characters at the all-longest corner, 70 free.** The least
  headroom in the catalog, as 09-09 said.
- **Tightest Timer: SNAKE — 872 characters at the all-longest corner, 36 free.**
- 14 entries carry a Timer; 13 are Setup-only. `docs/HARDWARE-AUDITION.md` names the same thirteen.

The audition's twenty-seven-row cost table was checked row by row against these defaults: **all 27
Setup values, all 27 Timer values and all 27 knob counts match**, and the three `dark at rest` yeses
(GHOST, MORPH, ETCH) match `restsBlack`.

---

### The declarations against the fixture — 09-09's claim re-checked, not trusted

09-09 claimed a phase-wide sweep found **zero disagreements** between a declared `motion` or
`restsBlack` and `frames.json`. This verifier re-derived both from the fixture over all 36 entries,
using `listing.ts`'s own documented order (`restsBlack` first, then `animating`, then lit bytes):

**0 disagreements.** `restsBlack` equals "all five sampled ticks have `nonZeroBytes === 0`" for every
entry in both directions, and every `motion` equals the derivation. Motions resolve to
**17 animated / 15 static / 4 dark**. The claim holds.

---

### The trap gate — is it real, and did anything bend to it

| Question | Answer | Evidence |
| -------- | ------ | -------- |
| Does it refuse a call the host does not register? | **Yes**, by construction | `resolveCalls` has three prefix rules — `:` must be in `HOST_SELF_METHODS`, `.` must be `math.<version-stable>`, bare must be in `HOST_GLOBALS`, `LUA_BASE` or a local declared in the same event. Everything else falls to `ok: false`. It is a classifier, not a blocklist, so a name nobody has thought of is refused |
| Is it gated against the registration itself? | **Yes** | `HOST_GLOBALS` and `HOST_SELF_METHODS` are **imported** from `src/lib/sim/lua-host.ts`, never restated. Test 1 also reads the live VM's `_G` and fails in *both* directions: a listed name missing from `_G`, and a Grid-shaped `_G` key missing from the list |
| Is the disagreement with `findTraps` proved in both directions? | **Yes** | Test 3 asserts (a) `findTraps("--[[@cb]]for a=0,80 do gln(a,2,0,0,0)end")` reports **nothing** containing `gln` — the vendored scanner's silence is asserted, with a message saying that if it ever stops being silent the test should be re-read rather than deleted — and (b) the classifier refuses **exactly** `["gln"]`. Test 4 does the same for the two asymmetries: bare `gms` refused / `self:gms` accepted, `gmms`/`gmbs`/`gks` required to stay callable bare |
| Was any shipped entry edited to satisfy it? | **No** | `71d66c0` (the gate) touched three files: `host-surface.spec.ts`, `lua-host.spec.ts`, `lua-host.ts`. No entry file. The only entry edits in 09-01/09-02 are in `be7c004`, and printing every changed line shows **seven one-line comment renames** of `lua-entries.spec.ts` → `lua-entries.sweep.spec.ts`. Not one character of Lua moved |
| Is the corpus non-vacuous? | **Yes** | Test 2 scans all 27 entries × 3 renderings × 2 events and requires ≥ 2 call sites per non-empty event; test 4 requires ≥ 6 entries and ≥ 40 call sites at the defaults |

---

### D-04 — nothing rests on inbound host MIDI or on an unrenderable capability

| Check | Result |
| ----- | ------ |
| `midirx_cb` anywhere under `src/` | **0 occurrences** |
| `rtmrx_cb` anywhere under `src/` | **0 occurrences** |
| Any entry calling `grxm` (the routing-mode call the inbound path needs) | **none** — `grxm` is registered by the host and used by no configuration in the catalog |
| MIRROR / the clock-locked family | Row 11 of the audition, marked **optional**, ships nothing, and points at `docs/MIDI-IN-PROBE.md`. `audition.spec.ts` test 2 gates "names only real configurations, and MIRROR only as an optional row" |
| Every entry produces observable output under a real VM | **27/27**, measured directly with `SMOKE_REPORT=1` |

The per-entry output, run by this verifier through the real Lua VM (MIDI / HID counts under the
scripted gesture): euclid 76/0, chorus 18/0, arc 109/0, ghost 218/0, lattice 14/0, morph 28/0,
sonar 8/0, hold 16/0, steps 28/0, slam 4/0, keys 4/0, gridlock 4/0, table 16/0, console 7/0,
strip 8/0, learn 7/0, lumen 16/0, **stage 0/2, shuttle 0/2, cull 0/2, forge 0/2, switch 0/2**,
snake 3/0, etch 16/0, life 22/0, quadrant 2/0, pomodoro 4/0.

**The five zeroes on the MIDI column are the reservation on criterion 3, and they are the honest
reading of it.** STAGE, SHUTTLE, CULL, FORGE and SWITCH have no output the simulator renders at all;
their pictures animate and their keystrokes are recorded into a log nothing reads. The phase does not
hide this — it is `deferred-items.md` item 2, it is `lua-host.ts:429`, it is stated in each entry
file, it is stated on the cards, and it has bench rows. It is nevertheless the one place where the
letter of "no configuration depends on a capability the simulator cannot render" is strained, and it
is why this report is `human_needed` rather than `passed`.

---

### Front-door ring — byte-untouched at eight

```
FRONT_DOOR literal block, 34d0fd6:  2,390 bytes
FRONT_DOOR literal block, HEAD:     2,390 bytes
diff: silent  ->  BYTE-IDENTICAL

git diff --numstat 34d0fd6..HEAD -- src/lib/catalog/front-door.ts
80      0       src/lib/catalog/front-door.ts
```

Eighty insertions, zero deletions, every one of them an `EXCLUDED_FROM_ROW` record carrying the same
sentence — *"The front door is a curated row; new configurations join it deliberately, not by
arriving in the catalog."* The ring is `aurora, pinwheel, ninepads, starfield, joystick, radar,
faders, dial`: eight, all `preview === "padsim"`, unchanged.

A note on a number that looks like it moved and did not: `featured` went 8 → 15 (seven of the twenty
are featured). That is the browse FEATURED **sort flag**, not the ring; `FRONT_DOOR` is a separate
declaration in a separate file and is what `/` and `Coverflow.svelte` render. D-02 is about the ring
and the ring did not move.

---

### Requirements Coverage

| Requirement | Source plans | Status | Evidence |
| ----------- | ------------ | ------ | -------- |
| **CONT-02** | 09-01 … 09-10 | ✓ SATISFIED | 27 hand-authored configurations, all canonical, all in budget on both events at defaults and at every corner (701 combinations / 1,402 events, re-derived here), all running in a real Lua 5.4 VM without error, every call site classified against the registered host surface |
| **CONT-03** | 09-02 … 09-09 | ✓ SATISFIED | Every entry's name, one-line description, feel tags, Featured flag and arrival date declared in the entry file and restated in `LISTING`, gated field by field in both directions; `copy.spec.ts` (5 tests) counts the copy rather than reading it, gates `KNOWN_TAGS` at 55 in both directions, and protects the aurora and ghost search anchors |
| **TUNE-01** | 09-03 … 09-09 | ✓ SATISFIED | Knob counts across the 27 Lua entries range **4 – 6**, inside the stated 3 – 6; no knob has fewer than two values; every token live in at least one event (sweep test 5); the whole cross-product measured |

No orphaned requirements: `REQUIREMENTS.md` maps CONT-02 to this phase and CONT-03 / TUNE-01 as
re-confirmations, and all three appear in the plans' `requirements` fields.

---

### Data-flow trace (Level 4)

| Artifact | Data | Source | Real data? | Status |
| -------- | ---- | ------ | ---------- | ------ |
| `src/lib/catalog/index.ts` `CATALOG` | 36 frozen entries | 28 entry modules + `PORTED` | Yes — 36 imported, none stubbed, min Setup 298 chars, none with 0 knobs | ✓ FLOWING |
| `src/lib/catalog/listing.ts` `LISTING` | 36 browse records | literals, gated against `CATALOG` in both directions | Yes — 0 mismatches | ✓ FLOWING |
| `src/routes/browse/+page.svelte` | card grid | `LISTING` | Yes — e2e asserts `toHaveCount(LISTING.length)` = 36 against the built site | ✓ FLOWING |
| `src/lib/catalog/frames.json` | golden frames | recorded from the simulator | Yes — 36 × 5 ticks, hashes green | ✓ FLOWING |
| `scripts/gen-og.mjs` → `static/og/` | 36 PNGs | `ROUTED` + the simulator | Yes — regenerated during this verification at 210,926 B, `build.spec.ts` test 3 proves real LEDs are painted | ✓ FLOWING |
| `src/lib/share/stamp.ts` `compilerKnobs` | knob descriptors | `preset` sources only | **By design returns `[]` for `state`** — verified verbatim, and it is exactly what deferred item 6 half two claims | ✓ FLOWING (and the claim about it is true) |

---

### Behavioural Spot-Checks

| Behaviour | Command | Result | Status |
| --------- | ------- | ------ | ------ |
| All 27 Lua entries run in a real VM and emit something | `SMOKE_REPORT=1 npx vitest run --project server src/lib/sim/lua-smoke.spec.ts --disable-console-intercept` | 3 passed; 27 report lines, 0 errors, none silent | ✓ PASS |
| The whole budget sweep at 36 entries | `npm run test:sweep \| check-counts 4 19` | matches | ✓ PASS |
| The built site serves 36 configuration pages | `find build/c -maxdepth 1 -type d` | 36 | ✓ PASS |
| The site renders and animates 36 cards through `wrangler dev` | `npx playwright test --workers 3` | 89 passed, both projects | ✓ PASS |
| WASM assets did not grow with twenty entries | `find build -name "*.wasm"` | glue **271,581**, lua_fmt_bg **628,148** — byte-identical to 09-10 | ✓ PASS |
| `gen-og` is deterministic at 36 | rebuild during `npm run preview` | 36 PNGs, 210,926 B total, same as 09-09 | ✓ PASS |
| No serial port opened, no device written, no deploy | — | Nothing in this verification ran `wrangler deploy`, `scripts/deploy.mjs` or any serial path | ✓ PASS |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `.planning/.../09-09-SUMMARY.md` | 908 | **A SUMMARY claim contradicted by the shipped artifact.** "its 6,562 bytes is the largest image in `static/og/`". Measured here: `starfield.png` **6,957** and `lumen.png` **6,835** are both larger; POMODORO's 6,562 is the largest **among the twenty**, and lumen (landed 09-06) beats it even inside the phase | ℹ️ Info | Prose only. Nothing gates on it; the 6,562 figure itself is exact. It is the only SUMMARY/code contradiction this verification found in ten SUMMARYs |
| `src/lib/catalog/listing.ts` | 1 | "The browse listing: **all sixteen** configurations' browse data" | ℹ️ Info | Stale quoted fact in the header of the file that now holds thirty-six |
| `src/lib/browse/query.ts` | 41 | "a page whose whole job is to list **sixteen names**" | ℹ️ Info | Same |
| `src/lib/browse/sort.ts` | 12 | "a page whose entire job is to list **sixteen names** (D-12)" | ℹ️ Info | Same |
| `src/lib/browse/sort.ts` | 70 | "Only **two distinct dates** exist across the sixteen, so a date tie-break there would be a coin toss dressed as an order" | ⚠️ Warning | The **justification has expired**: three distinct dates now exist across thirty-six, and all three are inside the featured group (aurora 09-02, euclid 09-04, hold 09-07). The *behaviour* is unchanged and correctly gated by `sort.spec.ts` against `catalog.byFeatured()`; only the stated reason is now false. This is exactly the class of stale sentence 09-10 corrected six of in `05.1-UI-SPEC.md` |
| `e2e/browse.e2e.ts` | 245 | assertion message `"sixteen cards were read"` beside `toBe(LISTING.length)` | ℹ️ Info | A failure would print a misleading count. The assertion itself is derived and correct |
| `src/routes/c/[id]/+page.svelte` | 62 | "It now exists for **all sixteen**" | ℹ️ Info | Same class |
| `src/lib/tune/model.ts` | 169 | The brief asked that nothing under `src/lib/tune/` be modified. **One line was**, in `be7c004` | ℹ️ Info | Comment-only: `lua-entries.spec.ts` → `lua-entries.sweep.spec.ts`, part of D-08's rename. No behaviour, no type, no export changed. `git diff 34d0fd6..HEAD -- src/lib/tune/` is that one line and nothing else |

No `TODO`, `FIXME`, `HACK` or `placeholder` in any shipped catalog, browse or sim file (the two
matches are `audition.spec.ts:60`'s *"before it reads as a placeholder"* and `copy.spec.ts:186`'s
`U+XXXX`). No `return null` / `return []` / `=> {}` stub in any entry. **No `setInterval(` call
anywhere in `src`, `e2e` or `scripts`** — every match is a comment forbidding it. **No Claude or
Anthropic attribution** in `src`, `e2e`, `docs` or `.planning/phases/09-twenty-configurations`
outside the standing-rule sentences in the ten PLANs, the `$HOME/.claude/...` GSD workflow paths, the
user's own `C:\Users\sabot\Documents\Claude\` directory in a path, and two specs that assert
`CLAUDE.md` is `export-ignore`d and absent from the archive. All 42 phase commits are authored
`Botond Sandor <botond.sandor@intech.studio>` with no co-author trailer.

---

## The eight deferred items — is any of them a gap rather than a note

| # | Item | Verdict |
| - | ---- | ------- |
| 1 | Mackie Control not attempted (CONSOLE ships as plain CC) | **Note.** D-04 scopes MCU out for the same reason as the whole clock-locked family, the entry says so on its card, and `docs/MIDI-IN-PROBE.md` is the named unblock. Verified: CONSOLE emits plain `176` controller messages (7 under the gesture) |
| 2 | Keystroke configurations animate correctly and prove nothing about their output | **The one with real product risk, and it is not a gap in the phase — it is a hardware unknown that already carries bench rows.** Measured here: five entries, 0 MIDI / 2 HID each. It is the reason criterion 3 is `human_needed`. Its one *incompleteness* is that the checklist covers two of the five (see the added human-verification row) |
| 3 | Nothing checks that a per-cell picture is distinguishable from itself | **Note, and an unusually honest one.** 09-07 proved the gap by breaking two of SWITCH's nine glyphs and watching the whole quick suite stay green at 74/780 once the fixture was re-taken. Three carriers exist (CULL, SWITCH, QUADRANT); the fix is one small spec. Bench rows 25, 27 and 31 cover the claim in the meantime |
| 4 | Determinism proved per entry by hand, not by a gate | **Note.** `math.random` is statically refused by sweep test 4; SNAKE and LIFE were each run twice by hand to a byte-identical tick-1009 hash. The proposed sixth `frames.spec.ts` test is cheap and correctly deferred |
| 5 | No tune widget for a multi-colour palette | **Note.** QUADRANT ships `kind: "mode"` and renders as a four-position rail. The entry bent, not the gate, which is 09-01's rule. Cost is one card's panel |
| 6 | `kind: "state"` preferred (D-06) and used zero times | **Note, and the reversal is evidenced.** Verified independently: `state` count is **0**, and `src/lib/share/stamp.ts:115-119` really does return `[]` for any non-`preset` source, with its own comment saying so. The amended D-06 in `09-CONTEXT.md` is a correction made with evidence, not a retreat |
| 7 | `planLayers`'s exclusions do not bind a hand-authored entry | **Note.** D-09 corrected in `09-CONTEXT.md` for the right reason; what actually binds (two layers, 49.6 % each) is written down for the next phase |
| 8 | A spec's cost grows with the catalog and no gate notices | **Note, and the sharpest of the eight.** Three tests crossed a wall-clock limit at the gate and all three were found by running commands, not by a gate. The proposed fix — print the combination total and per-entry worst case rather than assert a cap — is the right shape, because D-08/D-10's rule is that a sweep is never trimmed to fit. This verification is a data point for it: the sweep is now 701 combinations and the e2e suite failed three times in 09-10 purely on free memory |

**None of the eight blocks the phase goal.** Item 2 is the only one with a hardware consequence, and
it is already on the bench.

---

## Are the six bench rows the right six?

The six are **13 (HOLD), 19 (CONSOLE), 26 (FORGE), 32 (POMODORO)** — the latch-and-time family — and
**23 (STAGE), 24 (SHUTTLE)** — the keystroke family. The split is stated with its mechanism
(`prev_*` advancing before the writability check; `pad-sim.ts:270-271` saying in its own words that it
cannot manufacture the stuck contact) and with the difference in what a failure means (a firmware
behaviour to survive versus a number in an entry file). That is a good document.

**Two honest gaps in the *selection*, both raised as human-verification items above rather than as
phase gaps:**

1. **The keystroke family has five members, not two.** `gks` is called by STAGE, SHUTTLE, CULL, FORGE
   and SWITCH — verified by grep and by the smoke report's five 0-MIDI/2-HID lines. The audition's own
   prose says exactly this ("Five configurations in this catalog send keystrokes… every usage id in
   all five was checked by hand… and by nothing else"), but the **checklist** covers STAGE (23),
   SHUTTLE (24) and FORGE incidentally (26 runs three macros). CULL's row 25 is a colour-blindness
   row and SWITCH's row 27 is a legibility row; neither asks whether the right key arrives. A wrong
   usage id in CULL or SWITCH survives every gate in the repository **and** the checklist as written.
2. **A dropped release hangs a note, not only a latch.** CHORUS, LATTICE, KEYS, SLAM and QUADRANT all
   send note-off (`128`) out of the `e>=5` / `e>4` branch — verified in the shipped Lua. Under the
   same firmware bug the six rows are built around, a dropped release leaves a note **sounding**.
   Rows 3, 7, 14, 15, 16 and 31 exist for those entries but ask about touch reliability, the watchdog,
   perceived motion and legibility. None asks a tester to listen for a stuck note. The visual family
   was chosen correctly; the audible half of the same bug has no row.

Neither changes any success criterion. Both are one sentence each in the checklist.

---

## Does anything in the phase's own SUMMARYs contradict the shipped code?

Ten SUMMARYs were read and every load-bearing number that could be recomputed was recomputed. **One
contradiction, and it is cosmetic:**

- **09-09-SUMMARY.md:908** — "its 6,562 bytes is the largest image in `static/og/`". False:
  `starfield.png` is 6,957 B and `lumen.png` is 6,835 B. POMODORO's 6,562 is the largest among the
  twenty this phase authored. The lit-cell half of the sentence (74 of 81) is not contradicted by
  anything measured here.

Everything else reconciles, including the ones that *look* like discrepancies:

- **`static/og/` "292 KB" (09-10) vs "210,926 bytes" (09-09)** — not a contradiction. 09-10 writes
  both in the same cell: 292 KB is the allocated size (`du -sk` reports exactly `292`), 210,926 B is
  the byte total. Verified both.
- **Browse HTML 61,673 B (09-10) vs 61,672 B measured here** — one byte, and `vite.config.ts` injects
  `__BUILD_DIRTY__` as `true`/`false` (five characters versus four). The build 09-10 measured was on a
  dirty tree; mine was clean.
- **`BASE_TESTS` chain** — 776 − 1 (09-01) + 5 (09-02) + 0×7 = 780. Observed 780. The chain closes.
- **All 27 audition cost-table rows, all 27 knob counts, and every per-entry Setup/Timer/free/combination
  figure in 09-03 through 09-09** — recomputed from the shipped entry modules; **every one matches**.

---

## Gaps Summary

**No gaps.** All five ROADMAP success criteria are met on every half a machine can check, and the
five gates 09-10 named reproduce exactly on this machine at `08c285e`: check 567/0/0, lint clean,
quick 74/780, sweep `4 19`, e2e 89 at `--workers 3` — the last of those on the **first** attempt, at
1.56 GB free, which is itself a data point for 09-10's memory finding.

The phase's central claim survives goal-backward verification rather than task-forward reading.
Twenty configurations exist, are real (min Setup 298 characters, 4–6 knobs each, none with an empty
event, none with a stub), fit both budgets at every corner of their cross-product with the tightest
margin at QUADRANT's 70 characters of Setup and SNAKE's 36 of Timer, run in a real Lua VM and emit
real MIDI or real HID, carry declarations that agree with the recorded fixture in both directions,
and are refused by a gate the moment they call a name the host does not register. The front-door
ring's literal is byte-identical to the tree the phase started on.

What is **not** verified — and what the phase itself says is not verified — is everything that
happens on a module. Five configurations' entire output is keystrokes the simulator records and
never renders; three latch on a firmware bug the simulator deliberately does not model; one runs past
a 655-second ceiling on a clock that is exact here and drifts there. Those are the six rows the
audition names, plus the two the audition should probably add, and they belong to the user.

`status: human_needed`, on the same reading `06-VERIFICATION.md` and `07-VERIFICATION.md` used: every
automatable half is green, and the hardware half is nobody's but the bench's.

---

_Verified: 2026-09-07T22:05:00Z_
_Verifier: Claude (gsd-verifier). No file outside this report was modified; no git command beyond reads was run; no serial port was opened and nothing was deployed._
