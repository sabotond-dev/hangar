---
phase: 10-redesign
plan: 05
subsystem: sim
tags:
  [
    d-09,
    demo-path,
    touch-sampler,
    prev-01,
    ident-02,
    cont-03,
    r-10,
    og-gate,
    reduced-motion,
    measurement,
  ]

requires:
  - phase: 10-redesign
    plan: 04
    provides: PREV_FILES 76 / PREV_TESTS 793 / PREV_E2E 97 / BASE_CHECK 571, and the standing discipline that long content goes through the Write tool
provides:
  - "src/lib/sim/demo.ts - the DemoPath type, a tick-locked driver that queues into the existing TouchSampler, THREE authored paths, and DARK_BY_CONSTRUCTION, the named list of dark entries a finger cannot help"
  - "Four host changes: delivery for demo entries, a widened freeze test with the loop term it actually needs, ONE TouchSampler PER DEMO ENTRY, and stillFrame()'s second branch"
  - "register(id, canvas, engine, options?) - a fourth argument every existing caller ignores, passed from CatalogCard.svelte through BrowseGrid.svelte (V-04)"
  - "R-10: RESTS_DARK_NOTE retired, DEMO_TOUCH_NOTE in its place, and restsBlack kept with a second job that listing.spec asserts in both directions"
  - "gen-og.mjs's non-dark gate with the restsBlack exemption REMOVED by name; static/og/ at 213,919 bytes over 36 files, reproducible across two builds"
  - "e2e/browse.e2e.ts's reduced-motion universal, with the exemption down from four entries to one and read from a reason rather than a flag"
  - "THE FINDING: Trackpad cannot be given a picture by any gesture. Its draft enables no LED layer at all"
  - "PREV_FILES 77, PREV_TESTS 798, PREV_E2E 97, BASE_CHECK 573 - the carry-forward block for 10-06 onward"
affects:
  [10-06, 10-07, 10-13, 10-14, browse, motion, og, catalog-copy]

tech-stack:
  added: []
  patterns:
    - "A demonstration gesture is queued into the SAME sampler a visitor's finger uses, never into the engine: the rate contract is inherited rather than restated, and demo.spec.ts asserts it on the DELIVERED calls rather than on the authored ones"
    - "One sampler per demo entry, not a bigger MAX_CONTACTS: a shared five-slot sampler was measured accepting three of the visitor's five fingers and delivering NONE of them to the hero"
    - "A gate that exempts an entry by a FLAG re-exempts it silently when the thing the flag now selects is removed; an exemption by a NAMED ROW with a reason goes red instead"
    - "A widened browser assertion is vacuous until the cards it was widened for are scrolled into view - engines build on first intersection, and only four of thirty-six cards are on screen at 1280 by 720"

key-files:
  created:
    - src/lib/sim/demo.ts
    - src/lib/sim/demo.spec.ts
  modified:
    - src/lib/sim/host.ts
    - src/lib/sim/host.spec.ts
    - src/lib/ui/CatalogCard.svelte
    - src/lib/ui/BrowseGrid.svelte
    - src/lib/catalog/listing.ts
    - src/lib/catalog/listing.spec.ts
    - src/lib/catalog/copy.spec.ts
    - src/lib/catalog/entries/etch.ts
    - scripts/gen-og.mjs
    - e2e/browse.e2e.ts
  deleted: []

key-decisions:
  - "Trackpad gets no demo path, because it CANNOT have one: its draft sets look.kind and touch.kind to none and disables both, and it lights 0 of 81 cells under every gesture that was tried. The alternative is 10-UI-SPEC 9.3's option (a), which that table rejects by name"
  - "DARK_BY_CONSTRUCTION is a named list with reasons rather than a flag, because gen-og's gate and the browse e2e both read it and a flag-shaped exemption would have re-exempted an entry whose path was deleted"
  - "active() gains a third term - a demo card is active while motion is allowed - because the spec's named term alone stops the loop between two gestures and nothing but a tick can restart it"
  - "DEMO_TOUCH_NOTE is not a smaller version of the retired note; it says a finger is doing this, which is the honesty a card that appears to animate on its own owes the visitor"
  - "The demo pauses while its pad is the hero: two fingers, one of them ours, would fight over one pad"

patterns-established:
  - "A negative check whose two halves are gated in series is observed in series: gen-og fires before the browser ever runs, so the e2e half was taken against a vite-only build"
  - "A helper that times out names the line; a caught wait names the card - the failure message is part of the gate"

requirements-completed: [PREV-01, IDENT-02, CONT-03]

duration: 95min
completed: 2026-09-08
---

# Phase 10 Plan 05: No card rests dark, except the one that cannot be lit Summary

**Three of the four dark configurations are given a demonstration finger — a real gesture, through
the real `TouchSampler`, at the real one-sample-per-contact-per-tick rate — and they light 14, 19 and
5 cells where they lit none. The fourth cannot be lit by anything: `Trackpad`'s draft enables no LED
layer at all, measured at 0 of 81 over a drag, a two-finger scroll, taps and 2,000 idle ticks, and
`front-door.ts:62` has said so since Phase 4. ETCH's 4,192-byte black OG square is now 4,737 bytes,
and the gate that used to permit it was tightened rather than left to pass. 77 files / 798 tests
(+1 / +5), 97 e2e (+0).**

## Performance

- **Duration:** ~95 min
- **Completed:** 2026-09-08
- **Tasks:** 3
- **Files created:** 2 · **Files modified:** 10 · **Files deleted:** 0

---

## THE ELEVEN-NAME BLOCK, CARRIED

| Name              | Carried in | Leaves as  | Note                                                                       |
| ----------------- | ---------- | ---------- | -------------------------------------------------------------------------- |
| `BASE_FILES`      | **74**     | **74**     | frozen at 10-01                                                            |
| `BASE_TESTS`      | **780**    | **780**    | frozen at 10-01                                                            |
| `PREV_FILES`      | **76**     | **77**     | **+1** — `src/lib/sim/demo.spec.ts`                                        |
| `PREV_TESTS`      | **793**    | **798**    | **+5** — `demo.spec.ts` 2, `host.spec.ts` 15 → 18                          |
| `BASE_SWEEP`      | **`4 19`** | **`4 19`** | **run, and unchanged** — see below; a catalog entry file was edited        |
| `BASE_SWEEP_WALL` | **123 s**  | **123 s**  | frozen at 10-01                                                            |
| `PREV_SWEEP_WALL` | **123 s**  | **123 s**  | **not carried forward from this plan** — 10-08 and 10-14 re-measure it      |
| `BASE_E2E`        | **89**     | **89**     | frozen at 10-01                                                            |
| `PREV_E2E`        | **97**     | **97**     | **+0** — no title added or removed, re-measured at `--workers 3`           |
| `BASE_CHECK`      | **571**    | **573**    | **+2**: `demo.ts` and `demo.spec.ts`. Always 0 / 0                         |
| `CH_PER_LINE`     | **43**     | **43**     | spent, not re-measured                                                     |
| `FONT_SRC`        | **(b)**    | **(b)**    | untouched                                                                  |

`npm run check` prints one line:
`COMPLETED 573 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.

**The sweep was run rather than assumed**, because `src/lib/catalog/entries/etch.ts` is a sweep input
and this plan edited it. The edit is inside the file's header comment block and touches no template
string; `npm run test:sweep` reports **4 files / 19 tests passed**, and its wall clock was **131 s**
against `BASE_SWEEP_WALL`'s 123 s. That number is **recorded, not carried**: `PREV_SWEEP_WALL` moves
in 10-08 and 10-14 and nowhere else, and an 8 s difference on a machine that has since run three
Playwright suites is not a finding.

---

## THE FINDING, FIRST, BECAUSE IT CHANGES ONE SENTENCE OF THE APPROVED SPEC

10-UI-SPEC §9.3 describes all four dark entries as configurations "that paint nothing **until they
are touched**". That is true of GHOST, MORPH and ETCH. It is **false of Trackpad**, and no gesture
can make it true.

**Measured on 2026-09-08 against the shipped engine**, through the real sampler, over five separate
attempts on one engine instance:

| Attempt                              | Lit cells |
| ------------------------------------ | --------- |
| one finger crossing the pad, held, lifted | **0 of 81** |
| two fingers scrolling                | **0 of 81** |
| a single tap                         | **0 of 81** |
| two fingers tapping                  | **0 of 81** |
| 2,000 idle ticks afterwards          | **0 of 81** |

`peak lit cells over every gesture: 0`. The reason is in the preset, not in the gesture:
`src/vendor/botor/_pad.ts`'s tpad draft sets `look.kind = "none"`, `touch.kind = "none"` and
`enabled = { look: false, touch: false, sends: true }`. Trackpad is a pointer. It sends, and it has
no LED layer to light.

**The repository already knew.** `src/lib/catalog/front-door.ts:62-63`, written when the row was
drawn in Phase 4, gives tpad's exclusion reason as: *"It writes no LEDs at all, so it is a black
square. It stays in the catalog; the front door is not where it belongs **until a look gives it
lights**."*

### Why this was not brought back as a checkpoint

Because the decision it would ask for **has already been made, by the user, in the approved spec**.
§9.3's own table offers exactly two options and rejects one of them by name:

> **(a) Give the four configurations a non-black resting state** — *Changes what the pad does on
> somebody's hardware, which is the one thing this site must never do quietly.* **Rejected.**

Giving tpad a picture means turning on a look it does not have — which is option (a), on the one
entry where option (b) provably cannot work. And the ruling itself says which of its two promises is
superior when they collide: **"HANGAR supplies the gesture; the firmware supplies every lit pixel.
Motion is never faked."** If the firmware supplies no pixel, HANGAR must not invent one.

So the plan's success criterion 1 — *"no configuration, Lua source, character budget or frame hash
was touched to achieve it"* — is met, and D-09 is met for every card that can be met. **One card is
black, it is black because that is what the configuration is, and it says so in its own sentence.**

**What the user may want to decide, and what it would cost.** Turning `showGrid` on in tpad's look
layer would give it a picture. It is one field on one draft, it changes what the pad does on
hardware, and it re-records `frames.json`, `restsBlack`, the entry's `motion`, its quiet line and its
OG image. The machinery this plan built needs no change either way. That is a configuration decision,
not an execution one, and it is left where it belongs.

---

## What each of the four cards now shows, and how it was verified

Every number below was read from a script's own output in this session: the paths were replayed
through the **real** `TouchSampler` into the **real** engines, built by the **real** `createEngine`,
over three full periods plus a separate still-frame replay.

| Entry        | Gesture                                                    | Samples | Period | Lit cells over a steady-state period | Still frame | OG image        |
| ------------ | ---------------------------------------------------------- | ------- | ------ | ------------------------------------ | ----------- | --------------- |
| **GHOST**    | one drag that leaves a ghost, then a lift                   | **18**  | 600    | **14 at every tick**, min 14 max 14  | **14 lit**  | 5,410 bytes     |
| **MORPH**    | a slide between two corners and back                        | **26**  | 360    | **19 to 21**, never 0                | **19 lit**  | 5,422 bytes     |
| **ETCH**     | a short stroke drawn, a fast sweep that wipes it, a second stroke | **26** | 420 | **0 to 15**, 29 black ticks of 420 (6.9 %) | **5 lit** | **4,737 bytes** |
| **Trackpad** | *none, and none is possible*                                | —       | —      | **0 at every tick of everything tried** | 0 lit    | 4,192 bytes     |

**GHOST's card is the one that proves the design.** Its contact lifts at tick 76 of 600. For the
other 524 ticks nothing is touching the pad at all and the light is entirely the configuration
retracing what the finger did — which is the entry's whole point, and a picture HANGAR could not have
faked even if it wanted to.

**ETCH's third gesture is an authored addition and it is named as one.** §9.3's description is "a
short stroke drawn, then a fast sweep that wipes it". The wipe **works**: the pad measures 0 lit
cells the tick the sweep lands. A path that ended there would leave a black card, a black OG image
and a black reduced-motion still frame — the exact outcome D-09 exists to remove — so the path ends
with a second short stroke, which is also the head of the next loop. The black window was then
measured and shortened from 61 ticks to **29 of 420**.

**Still frames are idempotent**, asserted by replaying each one twice and comparing the full 243-byte
frame: identical for all three.

---

## The four host changes, and the one the spec did not ask for

| # | Change                                                                | Test in `host.spec.ts`                                     |
| - | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1 | delivery gated on `entry.hero` **else** the demo's own sampler          | *"delivers a demo card's own gesture to a pad that is not the hero"* |
| 2 | `active()` widened                                                     | *"keeps a demo card running when its engine has settled"*   |
| 3 | **one `TouchSampler` per demo entry**, on the entry                    | *"cannot starve the visitor's finger"*                      |
| 4 | `stillFrame()`'s second branch — reset, replay once, freeze             | the second half of test 2, including idempotence            |

### The term the spec named would have stopped the loop

`<interfaces>` specifies `active()`'s new term as *"the same `size > 0 || pendingTouches > 0` test"*
widened to demo entries. **That term alone kills the demonstration.** Between two gestures a demo
card's sampler is empty and its engine may have settled — MORPH and ETCH both report
`animating: false` with their picture still on the pad — so `active()` returns false, the rAF is
cancelled, and **nothing can ever restart it**: the only thing that queues a demo sample is a tick.
Two of the three shipped cards would have played their gesture once and frozen.

So `active()` has **three** terms, each with its job written above it: the hero's finger (unchanged
from Phase 4), the spec's named demo-touch term (which is what stops a card freezing *mid-stroke*,
and which survives under reduced motion so a contact already down is always released), and a third —
*a demo card is active while motion is allowed*. Under reduced motion the third term is false and
`stillFrame()`'s single replay holds the picture instead.

### The hero wins

A pad that is both hero and demo card belongs to the visitor. The demo pauses and resumes when the
pad stops being the hero. On the browse grid — where every demo card lives — nothing is ever hero,
which is checked rather than hoped: see the Coverflow section below.

---

## Negative checks — four planned, five observed red

| # | Perturbation                                                     | Test                                   | Exit | Message                                                                                                                                        |
| - | ---------------------------------------------------------------- | -------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | the `else this.driveDemoTick(entry)` delivery term deleted        | `host.spec.ts` delivery                | 1    | *"a browse card is never the hero, so without the demo term it would receive nothing at all: expected [] to deeply equal [['down', 0, 35, 49], …]"* |
| 1b | the same edit, second red                                        | `host.spec.ts` contention              | 1    | *"one: both of its own contacts are down on its own engine: expected +0 to be 2"*                                                               |
| 2 | every demo entry handed the host's shared sampler                 | `host.spec.ts` contention              | 1    | *"two: both of its own contacts are down on its own engine: expected +0 to be 2"* — plus the measurement below                                  |
| 3 | ETCH's `restsBlack` set to false                                  | `frames.spec.ts` test 5                | 1    | *"etch: declared restsBlack false, but the recorded frames say true"*                                                                           |
| 3b | the same edit, second red                                        | `listing.spec.ts` test 3               | 1    | *"etch declares a demonstration gesture but does not rest black; a lit pad needs no finger from us"*                                            |
| 4 | ETCH's demo path removed from `DEMO_PATHS`                        | `scripts/gen-og.mjs` gate 2            | 1    | *"'etch' rendered an entirely dark pad at tick 64, and it is not named in DARK_BY_CONSTRUCTION. Every card paints (D-09): …"*                   |
| 4b | the same edit, second red                                        | `e2e/browse.e2e.ts` reduced motion     | 1    | *"etch rests black and shows nothing: it declares no demonstration gesture, or its gesture ends on a wiped pad"*                                |

**Restoration, byte-identical, stated rather than assumed.** `sha256` before and after each
perturbation, on every file touched:

- `src/lib/sim/host.ts` — `c928f6de47ab463371f43aa80db054a70911a9f05d178f22f8d46e23082aa1de` before and
  after checks 1 and 2.
- `src/lib/catalog/entries/etch.ts` — `0c1a239f3160f3c652a48f2ba288cd5d0f6a407c2f89129563f81fde0a805188`
  and `src/lib/catalog/listing.ts` — `045b4c7e04fb01cfcb16a60c51407f4b401c73183eb4528eee6efad2bc6dd10c`,
  both before and after check 3.
- `src/lib/sim/demo.ts` — `51b887bf1e7acf0fb235c660398def48659360829178c1cae75659316927af23` before and
  after check 4.

No `git checkout`, `restore`, `stash` or `clean` was run at any point in this plan; every
perturbation was undone by its own inverse edit.

### The starved-contact number, which is what makes the one-sampler-per-entry decision concrete

Check 2 was measured directly, not merely observed as a red test: four demo cards holding two
contacts each, plus a visitor putting five fingers on the hero, with every demo entry handed
`this.sampler`.

```
demo contacts per card: one=5 two=0 three=0 four=0
hero fingers accepted:  3 of 5
hero touchDown results: [true,true,true,false,false]
hero slots delivered:   []
```

**Three of the visitor's five fingers were refused outright, and the three that were accepted reached
the hero's engine ZERO times** — every one of them was delivered to the first demo card, because
`deliver()` empties the queue into whichever engine ticks first. Three of the four demo cards
received nothing at all, because their paths reuse pointer ids and `down()` refuses a pointer already
tracked. Three failure modes, all silent: the pointer is simply never captured.

`MAX_CONTACTS` is **5**, unchanged, and asserted unchanged in the contention test with the reason
written beside it — the fix is one sampler per demo entry, not a bigger global.

---

## R-10: the note retired, the fact kept and given a second job

`RESTS_DARK_NOTE` read *"This pad rests dark. That is the configuration, not a broken picture."* It
is gone. `grep -rn "RESTS_DARK_NOTE" src/` finds it in **no declaration** — only in three comments
and one assertion string that record its retirement by name, which is deliberate: the assertion is a
**phrase scan** rather than a missing import, because a missing import is a compile error that a
copy-paste of the sentence back into an entry would not be.

**Two new sentences, because deleting the lines outright was not available.** All four entries keep
`motion: "dark"` (the derivation reads `restsBlack` first, and `restsBlack` survives), and
`listing.spec.ts` test 3 requires a quiet line of every entry whose motion is not `animated`. So:

- **`DEMO_TOUCH_NOTE`**, shared by GHOST, MORPH and ETCH:
  *"Nothing on this pad lights up until a finger arrives, so the card is playing one for you."*
  This is **not** a smaller version of the old note. A card that appears to animate on its own, when
  the pad in truth needs a finger, makes a claim about somebody's hardware that is not true. HANGAR
  supplies the gesture and now says so on the card.
- **Trackpad's own sentence**, because the shared one would be false for it — nothing is playing a
  finger for that card:
  *"Trackpad writes no lights at all: it is a pointer for your computer, and there is nothing here to
  light."*

**The pinning pair, rewritten and strictly stronger:**

| Was                                                          | Is                                                                                                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| every `restsBlack` entry carries `RESTS_DARK_NOTE` verbatim   | no entry carries a resting-dark note (the export is gone AND no `quiet` line says it), **and** every `restsBlack` entry has **exactly one** of a demo path or a row in `DARK_BY_CONSTRUCTION` — never both, never neither |
| —                                                            | every id in `DEMO_PATHS` **is** a listed entry that rests black, and every id in `DARK_BY_CONSTRUCTION` is too — so a path authored for a lit entry is red    |

The word "dark" alone is **not** the test, and that was checked: QUADRANT's quiet line names *"the
dark cross between them"*, which is a picture rather than a note.

`listing.spec.ts` **5**, `copy.spec.ts` **5**, `frames.spec.ts` **5** — no per-file count moved.

---

## The OG gate, tightened, and the numbers that prove it landed

`gen-og.mjs`'s gate 2 read *"non-dark unless the entry declares `restsBlack`"*. After D-09 that is
wrong in exactly one direction, and it is the direction that matters: **a black image for a
`restsBlack` entry would still have passed**, which is precisely the regression the demonstration
touch exists to eliminate. A gate that stays green on the thing a phase was built to prevent is worse
than no gate, because it reads like coverage.

The `restsBlack` exemption is removed **by name**, with the reason in the file. The only exemption
left is a named row in `DARK_BY_CONSTRUCTION` — which is why negative check 4 goes red instead of
quietly re-exempting an entry whose path was deleted.

| Measure                     | 09-VERIFICATION | Now          | Delta      |
| --------------------------- | --------------- | ------------ | ---------- |
| `static/og/` total          | **210,926**     | **213,919**  | **+2,993** |
| files                       | 36              | 36           | 0          |
| **ETCH**                    | **4,192**       | **4,737**    | **+545**   |
| GHOST                       | 4,192           | 5,410        | +1,218     |
| MORPH                       | 4,192           | 5,422        | +1,230     |
| tpad                        | 4,192           | 4,192        | 0          |
| largest image               | —               | 6,957        | —          |

**Determinism held across three generator runs and two full builds**: the 36-file sha256 manifest was
byte-identical every time, which extends 09-VERIFICATION's unplanned finding to the demo path.

`gen-og`'s per-entry log now names the gesture, so the reason a card is bright is legible in the
build output:

```
gen-og: tpad         4192 bytes    0 of 81 cells lit   (no LED layer at all)
gen-og: ghost        5410 bytes   14 of 81 cells lit   (demo: one drag that leaves a ghost, then a lift)
gen-og: morph        5422 bytes   19 of 81 cells lit   (demo: a slide between two corners and back)
gen-og: etch         4737 bytes    5 of 81 cells lit   (demo: a short stroke drawn, then a fast sweep that wipes it)
```

---

## The e2e universal, and the vacuity it nearly shipped with

`browse.e2e.ts`'s reduced-motion test carried an exemption for *"three of the sixteen configurations
declared `restsBlack`"*. It is retired. The assertion is now universal — under reduced motion every
card that has an LED layer at all shows a still frame with a non-zero byte in it — and the one
remaining exemption is read from `DARK_BY_CONSTRUCTION`, which carries a reason, rather than from a
flag.

**The `darkIds` argument survives, and the plan asked whether it should.** It should: the list is one
entry long instead of four, and passing an empty array would make the walk assert something false
about Trackpad.

**The widened assertion was vacuous, and the test said so before a human did.** At 1280 by 720 only
four of thirty-six cards are on screen, and a card's engine builds on first intersection — so
`ghost`, `morph` and `etch` were never built and the universal covered exactly none of the entries it
had been widened for. The first run went red on the non-vacuity assertion with `shown.length` at 0.
The walk now scrolls to each demonstration card and waits for its picture, with the wait caught so
the failure **names the card** rather than a line number.

**No title was added or removed.** `npx playwright test --workers 3` reports **97 passed**, exit 0.

---

## `Coverflow.svelte`, untouched, and the reason it needed no change

```
$ git diff --stat e51db68..HEAD -- src/lib/ui/Coverflow.svelte src/vendor/
(no output)
```

Taken at the plan's base commit against its head, so it covers all three task commits.

**And it is a fact rather than a hope.** No demo card can mount inside the coverflow, because no demo
entry is in the front-door row:

- `tpad` is in `EXCLUDED_FROM_ROW` explicitly, with its reason (PREV-01);
- `ghost`, `morph` and `etch` are all `preview: "lua"`, and `front-door.spec.ts:110-112` asserts
  `entry?.preview === "padsim"` for **every** row member.

`Coverflow.svelte`'s `host.register(id, canvas, engine)` therefore stays a three-argument call, and
§16's "nothing at all" survives D-09 exactly as it survived the CRT.

---

## V-04, recorded by name

10-UI-SPEC §16 gives `PadFrame.svelte` "the `demo` mode". **That row is amended.** `PadFrame.svelte`
holds no engine, issues no draw call and declares `entry: { id: string }` precisely so
`svelte/no-unused-props` stays green; a `demo` prop on it would be an unused prop and a lint failure.
The flag is `SimHost.register`'s **fourth argument**, and `PadFrame.svelte` gained nothing in this
plan — it is not in the modified list. `PadCanvas.svelte` gained nothing either: `CatalogCard` wraps
the callback rather than widening the child's signature, so `onready(entry.id, el)` is byte-for-byte
the shape it already had.

---

## Task Commits

1. **Task 10-05-01: the demonstration finger and the four host changes it needed** — `7021817` (feat).
2. **Task 10-05-02: R-10, the resting-dark note retired and `restsBlack` kept** — `408e993` (refactor).
3. **Task 10-05-03: OG images from the end of the path, and a reduced-motion universal** — `49fbf38` (test).

---

## Verification

| Gate                                                                | Result                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `npm run check 2>&1 \| grep -Ei "error\|warning"`                    | one line: `COMPLETED 573 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`      |
| `npm run lint`                                                      | clean — Prettier and ESLint                                                   |
| `npm run test:quick`                                                | **77 files / 798 passed + 1 todo** — `PREV_FILES` 76 **+1**, `PREV_TESTS` 793 **+5** |
| per-file                                                            | `demo.spec.ts` **2**, `host.spec.ts` **18** (15 + 3), `schedule.spec.ts` and `touch.spec.ts` **unchanged and green at 15 between them** |
| `listing.spec.ts` / `copy.spec.ts` / `frames.spec.ts`               | **5 / 5 / 5** — no count moved                                                |
| `npm run test:sweep`                                                | **4 files / 19 tests** — `BASE_SWEEP` unchanged, 131 s wall                    |
| `npm run build` (twice)                                             | green both times; `static/og/` manifest byte-identical; `source-408e9935….tar.gz` 1,283 KB |
| `npx playwright test --workers 3`                                   | **97 passed**, exit 0, 2.2 min — `PREV_E2E` unchanged                         |
| `npx playwright test e2e/browse.e2e.ts --workers 3`                 | **11 passed**                                                                 |
| `npm run test:quick` after the build                                | 77 / 798 again                                                                |
| `grep -rn "setInterval" src/lib/sim`                                | one comment in `host.ts` and one banned-token string in `demo.spec.ts`; **no call** |
| `git diff --stat e51db68..HEAD -- src/vendor/ src/lib/ui/Coverflow.svelte` | empty                                                                    |
| `git status --porcelain`                                            | empty. `test-results/` removed by hand                                        |

---

## Decisions Made

1. **Trackpad gets no demo path, and `DARK_BY_CONSTRUCTION` says why in source.** Decided by
   measurement — 0 of 81 lit under five different gestures — and by the approved spec's own rejection
   of the only alternative.
2. **The exemption is a named list with reasons, not a flag.** A flag-shaped exemption re-exempts an
   entry the moment the thing the flag selects is removed, which is exactly what negative check 4
   demonstrates.
3. **`active()` takes a third term.** The spec's named term alone stops the loop between two
   gestures, and nothing but a tick can restart it.
4. **The hero wins over the demo.** Two fingers, one of them ours, on one pad is not a picture
   anybody wants.
5. **ETCH's path ends on a third gesture.** The wipe works; a path that ended on it would ship the
   black square this phase exists to remove.
6. **`DEMO_TOUCH_NOTE` says a finger is doing this.** The retired note's job was to explain a black
   square; the new one's job is to keep a moving card honest.
7. **`gen-og`'s exemption and the e2e's exemption read the same list**, so the OG image and the
   reduced-motion still frame cannot disagree about which cards are allowed to be black.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — blocking] Trackpad cannot be given a picture by any gesture, and the plan assumed all four could**

- **Found during:** Task 10-05-01, before a line of `demo.ts` was authored
- **Issue:** §9.3, the plan's objective and this plan's `must_haves` all describe four configurations
  that "paint nothing until they are touched". Trackpad paints nothing when touched either: its
  draft sets `look.kind = "none"`, `touch.kind = "none"` and disables both layers.
- **Fix:** three paths instead of four, plus `DARK_BY_CONSTRUCTION` — a named list carrying the
  measurement and the reason, read by `gen-og.mjs`'s gate, `browse.e2e.ts`'s walk and
  `listing.spec.ts`'s both-directions assertion. Trackpad keeps a quiet line of its own.
- **Why this was not a checkpoint:** the decision it would have asked for is already ruled in the
  approved spec — §9.3 rejects option (a) by name, and the ruling says the firmware supplies every
  lit pixel. See the finding above.
- **Files modified:** `src/lib/sim/demo.ts`, `src/lib/catalog/listing.ts`
- **Committed in:** `7021817`, `408e993`

**2. [Rule 3 — blocking] `register()` is called by `BrowseGrid.svelte`, not by `CatalogCard.svelte`**

- **Found during:** Task 10-05-01
- **Issue:** The plan says CatalogCard "passes it as `register`'s fourth argument". CatalogCard never
  calls `register`; it calls `onready`, and `BrowseGrid.adopt()` is the only browse-side caller of
  `register`. `BrowseGrid.svelte` is not in the plan's file list.
- **Fix:** CatalogCard does the lookup, as V-04 requires, and hands the path through `onready`'s new
  third argument; BrowseGrid records it beside the canvas and forwards it. `PadCanvas.svelte` is
  therefore **completely unchanged** — CatalogCard wraps the callback, so the child's
  `onready(entry.id, el)` shape is untouched and `Coverflow.svelte`'s use of the same component is
  unaffected.
- **Files modified:** `src/lib/ui/BrowseGrid.svelte` (one Map, one signature, one argument)
- **Committed in:** `7021817`

**3. [Rule 2 — missing critical functionality] the spec's `active()` term cannot keep a loop alive**

- **Found during:** Task 10-05-01
- **Issue:** `<interfaces>` widens `active()` on "the same `size > 0 || pendingTouches > 0` test". A
  demo card's sampler is empty between gestures and MORPH and ETCH both report `animating: false`
  with their picture on the pad, so the rAF is cancelled and nothing can restart it.
- **Fix:** a third term — a demo card is active while motion is allowed — with the spec's named term
  kept as the second, because it is what stops a card freezing mid-stroke and what releases a contact
  that is already down when reduced motion turns on.
- **Files modified:** `src/lib/sim/host.ts`
- **Committed in:** `7021817`

**4. [Rule 3 — blocking] the four dark entries could not simply lose their quiet lines**

- **Found during:** Task 10-05-02
- **Issue:** The plan says "the four dark entries lose their note". All four keep `motion: "dark"`
  (the derivation reads `restsBlack` first, and the plan keeps `restsBlack`), and `listing.spec.ts`
  test 3 requires a quiet line of every entry whose motion is not `animated`. Deleting the four lines
  turns that test red.
- **Fix:** `DEMO_TOUCH_NOTE` for the three demonstration cards and a sentence of its own for
  Trackpad. The retirement is real — the export is gone and no line says what it said — and the
  replacement does a job the old one did not.
- **Files modified:** `src/lib/catalog/listing.ts`, `src/lib/catalog/listing.spec.ts`
- **Committed in:** `408e993`

**5. [Rule 1 — bug] a comment in `etch.ts` asserted two things that D-09 made false**

- **Found during:** Task 10-05-02, in the `grep -rn "RESTS_DARK_NOTE"` sweep the plan asks for
- **Issue:** `src/lib/catalog/entries/etch.ts:71` stated that ETCH's quiet line "is `RESTS_DARK_NOTE`
  verbatim" and that "`gen-og.mjs` is allowed to write a black OG image for it". After this plan both
  are false, and the second one is false in the direction that matters.
- **Fix:** the claim is corrected and an amendment paragraph names D-09, the gesture and the removed
  exemption. `etch.ts` is not in the plan's file list; the edit is inside the header comment block
  and changes no template string, which is why the sweep was re-run and is `4 19`.
- **Files modified:** `src/lib/catalog/entries/etch.ts`
- **Committed in:** `408e993`

**6. [Rule 2 — missing critical functionality] the widened e2e universal was vacuous for the three entries it was widened for**

- **Found during:** Task 10-05-03
- **Issue:** Engines build on first intersection and only four of thirty-six cards are on screen, so
  `ghost`, `morph` and `etch` were never built and the universal covered none of them. Observed as a
  red non-vacuity assertion rather than reasoned about.
- **Fix:** the walk scrolls to each demonstration card and waits for its picture, and the wait is
  caught so the failure names the card. `waitForPicture` gained an optional timeout, defaulted to its
  existing 30 s so no other call site changed.
- **Files modified:** `e2e/browse.e2e.ts`
- **Committed in:** `49fbf38`

---

**Total deviations:** 6 auto-fixed — 1 × Rule 1 (bug), 2 × Rule 2 (missing critical functionality),
3 × Rule 3 (blocking).
**Impact on plan:** two files outside the plan's list (`src/lib/ui/BrowseGrid.svelte`,
`src/lib/catalog/entries/etch.ts`) and two files inside it that needed no change
(`src/lib/ui/PadCanvas.svelte`, `src/lib/browse/typographic.ts` — the latter was checked and never
referenced the retired note). Nothing in the objective was dropped except the one thing that is not
achievable without changing a configuration, and that is reported above rather than smoothed.

---

## Issues Encountered

**One test failed once and was not retried into green.** The first full Playwright run reported
`browse, open a configuration, and come back to the same view` failing at
`expect(await renderedIds(page)).toEqual(expectedIds)` — the assertion that races the toolbar's 500 ms
trailing address projection. It passed alone and in **three** subsequent full suites, including the
final one at exit 0 with 97 passed. The test is pre-existing and untouched by this plan; the cause is
almost certainly load, since this plan's reduced-motion test now builds three extra Lua VMs at
`--workers 3`. Recorded rather than dismissed.

**Piping a Playwright run through `grep … | head -N` truncates the run.** Two intermediate runs
reported "77 passed" and "46 passed" with a list of tests that never ran; the runner had been killed
by SIGPIPE. Every count quoted in this document comes from a run whose output was written to a file
or read to completion.

**A scratchpad script cannot `import { createServer } from "vite"`.** The scratchpad is outside the
repository, so Node's resolver finds no `vite`. The probes import it by absolute `file://` URL into
`node_modules/vite/dist/node/index.js`, which is why they could be kept out of the tree entirely.

**The two halves of negative check 4 are gated in series.** `gen-og.mjs` runs before `vite build`, so
a perturbed tree cannot produce a build at all — Playwright's own `webServer` command failed with the
gate's message. The e2e half was therefore observed against a `npx vite build`-only artifact served
by a hand-started `wrangler dev` on 4173, which Playwright reused (`reuseExistingServer`). The server
was stopped parents-first afterwards and the tree rebuilt.

---

## Notes for the plans that follow

- **10-06 onward** inherits `PREV_FILES 77` / `PREV_TESTS 798` / `PREV_E2E 97` / `BASE_CHECK 573`.
- **10-06 amends documents**, and three rows now need it: 10-UI-SPEC §16's `PadFrame.svelte` "demo
  mode" row (V-04, amended here by name); §9.3's sentence grouping all four dark entries as
  "configurations that paint nothing until they are touched"; and `05.1-UI-SPEC.md`'s prose about the
  resting-black note, which R-10 retired.
- **A new entry that rests black must declare a demo path or join `DARK_BY_CONSTRUCTION`**, exactly
  one of the two. `listing.spec.ts` test 3 is red otherwise and names the entry.
- **`gen-og.mjs`'s non-dark gate has no `restsBlack` exemption any more.** An entry that renders
  black and is not in `DARK_BY_CONSTRUCTION` fails the build.
- **`DEMO_TOUCH_NOTE` and Trackpad's sentence are in the copy corpus** through their entries' `quiet`
  fields, so `copy.spec.ts`'s punctuation rules already cover them.
- **The demonstration cards are the interesting members of the reduced-motion walk now**, not the
  exempt ones. Any change to the browse grid's mounting or intersection behaviour will show up there
  first.

## User Setup Required

**One decision is open, and it is a configuration decision rather than an execution one.** Trackpad's
card is black because its configuration writes no LEDs. If it should show something, that means
turning on a look the pad does not currently have — which changes what the pad does on hardware, and
which 10-UI-SPEC §9.3 rejects as option (a). Nothing else in this plan depends on the answer.

No agent connected to a device, opened a serial port, wrote to a module or deployed anything.

## Next Phase Readiness

Wave 5 is complete. D-09 is met for every card that a finger can reach, with the machinery that makes
it true built out of the firmware's own touch queue rather than out of an animation, and the one card
a finger cannot reach is named in source with its measurement, gated in three places, and reported to
the user rather than quietly lit.

---

_Phase: 10-redesign_
_Completed: 2026-09-08_

## Self-Check: PASSED

All twelve files this plan created or modified are on disk, and all three commit hashes resolve in
`git log`: `7021817`, `408e993`, `49fbf38`.

Every measurement, exit code, sha256, byte size, test count and failure message quoted above was read
from a runner's, a build's, a generator's or a probe script's own output in this session. The one
place where this plan's result disagrees with an approved document is stated as a disagreement and
given its reason rather than smoothed: 10-UI-SPEC 9.3 groups Trackpad with three configurations that
"paint nothing until they are touched", and Trackpad paints nothing when touched either - measured at
0 of 81 lit cells over five different gestures, for a reason `front-door.ts` recorded in Phase 4.
