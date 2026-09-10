# Deferred items found during phase 11

Out-of-scope discoveries. Logged rather than fixed, per the executor's scope
boundary: only issues directly caused by a task's own changes are auto-fixed.

---

## D-11-08.1-a — `install.e2e.ts:1765` asserts an exact write count with no wait

**Found:** plan 11-08.1, full-suite run 5 of 5 at `--workers 3`.

```
[chromium] install.e2e.ts:1713 "@webkit CLEAR sends on the click with no
confirmation, the panel reads FACTORY DEFAULT, and PUT BACK brings the
visitor's own back @webkit"

  expect(zona.seen("CONFIG", "EXECUTE") - configBefore).toBe(2);
  Expected: 2   Received: 3
```

**Why it is the same family as the bug 11-08.1 fixed, and why it is not the
same bug.** `session.e2e.ts`'s `onlyReads` asserted exact totals against a
fire-and-forget sequence and 11-08.1 gave it a wait that implies completion.
This is the same shape - an exact count taken with no wait - but on the WRITE
path in a file 11-08.1 does not touch, and the observed value is HIGHER than
expected rather than lower, so it is a *third* write arriving rather than a
second one not yet having gone out. That is a different question and it wants
its own diagnosis, not a copy of the fix.

**Scope:** `e2e/install.e2e.ts` is byte-untouched since 11-04
(`git diff --quiet 7faa93c HEAD -- e2e/install.e2e.ts` exits 0). It shares no
helper with anything 11-08.1 edited: it imports `./fake-serial` and
`./fake-zona` and defines its own counters. Nothing this plan changed can
reach it.

**Frequency:** once in five full-suite runs at `--workers 3` on 2026-09-09.
Runs 1, 3 and 4 were 105 passed.

**Suggested owner:** 11-16, alongside the other exact-count call sites.

**CLOSED 2026-09-10 by plan 12-03**, at `e2e/install.e2e.ts`'s CLEAR title, in the
same commit as the literal it guards (`df71d0b`). The literal moved from 2 to 3
because CLEAR now writes three firmware defaults, and the wait landed first.

**And the diagnosis was the other way round from the one recorded above.** This
note read the failure as "a third write arriving rather than a second one not
yet having gone out", because the observed value was HIGHER than expected. It
is the same arithmetic seen from the other end: `configBefore` is read with no
wait immediately after `tryOnPage`, which returns as soon as `PLAYING NOW` is
on screen - and that caption is published by the store in the BROWSER, while
the try-on's last frame may still be crossing the CDP hop to the Node fake that
owns the counter. So the BASELINE was read one short and the delta came out one
long. No third write of the old shape existed, and the fix is a wait on the
COUNTER rather than on the panel: the counter is what the assertion reads, so
the counter is what has to have settled.

---

## D-11-08.1-b — `wrangler dev` died mid-run, and eight tests reported it as their own failure

**Found:** plan 11-08.1, full-suite run 2 of 5 at `--workers 3`.

The web server logged `X [ERROR]` and stopped. Eight subsequent titles failed
with `page.goto: Could not connect to server`, and a ninth
(`browse-webkit.e2e.ts` search field, 27 cards where 1 was expected) failed at
the same moment as the server was going down.

Nothing in the report says "the server is gone" until you read the `[WebServer]`
lines, which are interleaved with test output. Combined with
`reuseExistingServer: !process.env.CI`, the failure mode after this is worse
than the failure itself: the next run silently starts a fresh server and passes,
so the incident looks like a flake in nine tests rather than one death in one
process.

`playwright.config.ts` is not editable in this phase, so nothing was done. Worth
a `webServer` health assertion or a run-level check in a later wave.

**Frequency:** once in five full-suite runs on 2026-09-09.

---

## D-11-10-a — nothing in HANGAR validates seven-bit sysex data

**Found:** plan 11-10, task 02, negative check 2.

`gmss` joined `HOST_GLOBALS` in this wave, and the host records what a
configuration asked to send byte for byte with **no range check and no mask**
(`lua-host.ts`, `recordSysex` — deliberately, so a bad byte is visible rather
than silently corrected). Measured: a planted `gmss(240,125,r,g,b,247)` on
LUMEN's top-left cell recorded `240, 125, 255, 90, 0, 247` and **nothing in the
tree objected**. A sysex data byte above 127 is a status byte on the wire and
would end the message where it stands.

The vendored trap scanner cannot help either: `gmss` is absent from `_pad.ts`'s
`OUT_CALLS` (`:3563`), because no compiled recipe sends sysex.

So the only guard that exists is clause 4 of `lua-smoke.spec.ts`'s
`"sends LUMEN's colour as framed seven-bit hex over sysex"`, and it covers
**LUMEN only**. A second sysex-sending entry would ship unguarded.

Two shapes were considered and neither was built here, because both are wider
than one entry's plan: a general clause in `lua-smoke.spec.ts` asserting the
seven-bit rule over `host.sysex` for **every** entry after the standard scripted
gesture (cheap, and vacuous until a second entry sends sysex — which is an
argument for it, not against); or a static clause in `host-surface.spec.ts`
refusing a `gmss` call site whose literal arguments are out of range (catches
constants only, not `r` computed at run time).

**Suggested owner:** the first wave that adds a second sysex entry, or 11-16.

---

## D-11-10-b — `docs/HARDWARE-AUDITION.md`'s cost table is eighteen unchecked measurements

**Found:** plan 11-10, task 02, while moving LUMEN's row from 604 to 742.

The table at `docs/HARDWARE-AUDITION.md:83` says "measured at their default knob
positions with the pinned minifier" and sources each row to the wave that landed
that entry. **Seventeen of the eighteen rows have never been re-measured since**,
and phase 11 has since changed the Lua of ARC, MORPH, CONSOLE, STEPS, POMODORO,
STAGE and LUMEN. `audition.spec.ts` gates the document's SHAPE — its rows, its
numbering, its reasons — and asserts nothing about the numbers, so every one of
them could be stale and the suite would stay green.

LUMEN's row was corrected in this wave because this wave moved it. The other
seventeen were left, deliberately, rather than re-measured under a plan that did
not ask for it.

**AMENDED BY PLAN 11-11, AND THE AMENDMENT MAKES THIS ITEM WORSE RATHER THAN
SMALLER.** GHOST's row was moved to 475 / 418 because 11-11 re-authored the
entry. It had read **305 / 333**, and 305 was **already wrong before 11-11
touched anything**: plan 11-02 took GHOST's Setup from 305 to 320 with two
touch-guard repairs and did not move this table. So the table is not merely
"unchecked" — one of the two rows anybody has looked at was **demonstrably
stale**, by an amount produced by a plan in this same phase. **Sixteen rows
remain unchecked**, and the base rate for staleness among the checked ones is
now one in two.

**Suggested owner:** 11-16, alongside the entry-header corner sweep. The two are
the same job done twice: an entry header quoting a wrong corner and this table
quoting a wrong default are both a number nothing gates.

**AMENDED AGAIN BY PLAN 11-12.** SHUTTLE's row moved from 663 / 201 to
540 / 538, and unlike GHOST's it was **accurate for the entry that carried it**
— checked against the pre-rewrite file before it was replaced. Three rows have
now been examined across three waves and **one of the three was stale**.
**Fifteen rows remain unchecked.**

---

## D-11-12-a — nothing catches a Timer that re-arms itself with a period of zero

**Found:** plan 11-12, task 01, running the negative check the plan asked for.

`gtt(0, 0)` is a no-op in firmware and in `lua-host.ts:679-683` alike — a Timer
that re-arms with a period of zero does not run fast, it **stops permanently**,
with no error, no raise and nothing in the picture to say so. SHUTTLE carries a
`math.max(..., 20)//1` floor **because this exact thing happened to it once**,
and the floor is the only thing standing between the catalog and a silent stop.

**Measured, not supposed.** The floor was removed from `shuttle.ts` and the
period driven to zero at every knob value. The Timer fired once, stopped, and
the pad went on showing a speed it was no longer sending — a fast tap in the
other direction changed nothing at all. **Every gate stayed green**: 105 server
tests, six sweep tests, `frames.spec.ts` included. The fixture could not see it
because SHUTTLE's resting picture is the same whether the Timer repaints it or
not, and no other test drives a Timer entry long enough to notice it stop.

**Why no gate exists.** The failure is dynamic and entry-specific: a static scan
would have to prove a period expression is non-zero over every knob value, which
is exactly the arithmetic `decay-idiom.spec.ts` already does for phases and
could plausibly do for `gtt` — every `gtt` in a Timer whose argument resolves
statically must resolve above zero, and one that does not must be floored. That
is a real, cheap, catalog-wide clause and nobody has written it. **Nine of the
eighteen hand-authored entries store a Timer.**

**Suggested owner:** 11-16, or the next wave that touches `decay-idiom.spec.ts`.

---

## D-11-12-b — no gate asserts that a card is legible, and regenerating the fixture hides it

**Found:** plan 11-12, task 02, running the second negative check.

The bench note behind the whole of 11-12 was *"SHUTTLE: don't understand how it
works"*. The rewrite's entire answer is legibility — direction as colour and
position, zero as a painted mark, the stop as a red row — and **not one of those
claims is checkable by anything in this repository.**

**Measured.** SHUTTLE's forward and reverse palettes were made identical, which
produces a pad on which the direction of travel cannot be read at all. The only
thing that reddened was `frames.spec.ts`, on a **pixel hash** — a change
detector, not a legibility gate. Regenerating `frames.json`, which is what an
author does when a picture legitimately moves, made the whole tree green again:
23 files, 133 tests, plus the six sweep tests. **An illegible card is fully
green and indistinguishable from a legible one.**

This is the same shape as 11-11's finding that no test asserts what a demo path
DEPICTS, and it is the more general statement of it: every gate in the catalog
reads well-formedness, budget, arithmetic and change. None reads meaning.

**It is not obvious this SHOULD be gated** — that is why it is a deferred item
and not a bug. The honest answer may be that legibility belongs on a bench and
nowhere else, in which case the deliverable is the bench row rather than a test.
Row 18(b) of `docs/HARDWARE-AUDITION.md` is that row and it was added by 11-12.

**Suggested owner:** 11-16, to decide between a gate and an acceptance that
there cannot be one.

**AMENDED by plan 11-13.** STRIP's independence test now asserts one legibility
claim, and it is the first in the repository: at rest, the fader must draw a
solid block of *uniform rows* growing from the bottom of its region, and the
crossfader must draw a row with *exactly one* cell brighter than eight visible
neighbours. **The claim is about SHAPE and it names no colour**, which is the
only way it can survive two colour knobs a visitor may set to the same value.
That is a narrow gate — it proves the two controls draw *different* pictures, it
does not prove either picture is *readable* — so D-11-12-b stands. It is
recorded here because it is a worked example of the shape such a gate could
take, and because a future wave should widen it rather than reinvent it.

---

## D-11-13-a — the Lua host keeps ONE coordinate maximum for BOTH axes, and firmware does not

**Found:** plan 11-13, task 01, deciding whether STRIP's ten-bit unlock survives.

Firmware has two independent calls, `touch_x_max` and `touch_y_max`, and a
configuration may legally unlock one axis and leave the other at its 0..127
default. **HANGAR's preview cannot represent that.**
`src/lib/sim/lua-host.ts:713-719` is a single `axisMax` handler behind both
names, writing a single `_coordMax` field:

```
private axisMax(v: unknown): void {
  this._coordMax = f2i(num(v)) > 127 ? 1023 : 127;
}
```

— one field, set by whichever call arrives last, and `enqueue` clamps **both**
`x` and `y` against it. The typed comment above it is honest about the narrowing
(`127 | 1023` "because those are the only two values any compiled or
hand-authored configuration uses") but it says nothing about the two axes being
collapsed into one.

**The consequence is a silent divergence, not an error.** An entry that wrote
`self:tyma(1023)` alone would be driven in the browser with x running 0..1023
and on the module with x running 0..127, so every `x*9//1024` in it would map
the whole pad into the leftmost column on real hardware while looking perfect in
the preview. Nothing raises, nothing goes red, and the entry would pass every
gate in the tree.

**STRIP dodged it by paying fifteen characters** — it unlocks both axes although
only y needs it, so the simulator and the firmware agree. That is the right
answer for one entry and it is not a fix.

**Why no gate exists.** The check is cheap and catalog-wide: an entry whose Lua
contains exactly one of `txma` / `tyma` is either wrong on hardware or wrong in
the preview, and either way it should have to say which. The deeper fix is two
fields in the host, which is perhaps ten lines including the `enqueue` clamp and
the accessor, plus a decision about what `host.coordMax` means afterwards —
`lua-smoke.spec.ts` reads it in several places and would need an axis argument.

**Suggested owner:** 11-16, or the next wave that touches `lua-host.ts`.
STRIP is the only entry in the catalog that unlocks either axis today, so
nothing is currently broken by it.

---

# The phase gate's work list (plan 11-16, 2026-09-10)

Everything below is written to be WORKED, not wished for: each row names what
would close it. The seven items above this line are carried into it by name
rather than restated, and the ones the gate closed are marked closed with the
commit that closed them. Nothing here is hardware-verified; no agent in this
phase connected to a device.

## A. What this phase could not do — NINE named non-deliveries, with the branch stated

The plan's table carried six unconditional rows and five conditional ones. The
branch is now decided: **rows 9 and 10 (MORPH's "mapping mode", ARC's stop and
resume) are DELETED because 11-09.1 shipped both; rows 7, 8 and 11 (FORGE,
LATTICE, LUMEN) STAY because 11-07's two sweeps found nothing to fix and 11-09.2
delivered a measurement and shipped no change.** Six plus three is nine, and
the count is nine rather than "six".

| # | What | Why not, with the numbers | What would close it |
|---|---|---|---|
| 1 | **Clock sync** — EUCLID (line 4, *"MIDI sync the circles"*), SONAR (line 29, *"include synchronization, clock sync"*), STEPS (line 31, *"same as SONAR or EUCLID"*) and RADAR's original grouping (line 25) | Blocked twice. `docs/MIDI-IN-PROBE.md` has never been run, so whether a ZONA can receive MIDI clock at all is unknown; and even a yes leaves the cards unpreviewable — HANGAR's Lua host has no inbound MIDI, `grxm` is a recorded no-op, and `midirx_cb` / `rtmrx_cb` appear nowhere under `src/` | Ten minutes at a bench for the probe (its two scripts are written and budget-checked), **then** a synthetic MIDI source and clock in `src/lib/sim/` — a phase, not a task. A **no** from the probe closes all four notes rather than redirecting them |
| 2 | **DIAL's counter-clockwise rate** (line 18) | The simulator says the two directions are exactly symmetric: 192 messages each way, values 65 and 63, at 64 and at 128 samples per turn. The compiler emits binary-offset relative CC; `DialMode` offers only `relative` and `absolute` and the convention is hard-coded at `_pad.ts:2043`, so it is not descriptor-reachable. **Strong hypothesis:** the user's host reads the control in signed-bit mode, where 63 is +63 — violent in exactly the one direction reported | One bench question — what relative-CC mode is the control set to in the host? — then either a documented "set your host to binary offset" or a hand-authored dial |
| 3 | **TRACKPAD's animation** (line 35) | Blocked twice. `normalisePadState` forces `look.kind` and `touch.kind` to `"none"` for a trackpad state — measured: a `breathe`/`comet` variant normalises straight back and compiles to the identical 902 characters. And at its worst reachable knob position tpad costs **907 of 908, one free** (the reachability sweep, re-observed at this gate) | A hand-authored trackpad re-implementing a 902-character compiled handler that drains the firmware touch queue with `touch_pop`/`tid`/`tev`/`txv`/`tyv`. A wave of its own, and it may be an honest never |
| 4 | **SNAKE** (line 14) | **Deferred by the user in their own words** — *"not right now"* — with design notes attached: pathfinding to placed food, follow-the-finger, one note per movement and a higher note when it eats. Recorded, acted on by nothing. And the deferral was right rather than convenient: SNAKE's Timer is **870 of 908 at the defaults and 880 at the RGB444 picker corner, 28 free** — not the 36 its header quoted until this gate (the eighth header found quoting the wrong corner, `snake.ts`) — so "one note per movement" does not fit as the card stands | The user un-deferring it, and a Timer with room, which means restructuring the card rather than adding to it |
| 5 | **Four faders** | **Never tested.** The bench sheet has no line for it, no verdict is invented anywhere in this phase and none should be | A bench run |
| 6 | **`bloom` and `disturb`'s residue** | Left alone by 11-04 deliberately: both need a **shape** change rather than a constant change, no preset selects either, and `touch.kind` is not a knob, so neither is reachable from any catalog entry at any knob position. 11-05 and 11-06 turned that into a standing rule (a HANGAR-owned preset never selects either) held by a header comment | A preset that needs one, plus a decision on whether the compiler's emitted shape may change as well as its constants — and a gate for the rule (row B.5 below) |
| 7 | **FORGE's precision** (line 20, *"waay not precise enough"*) — conditional row, KEPT | 11-07 swept FORGE's whole travel through the real Lua host and found **nothing arithmetic**: all 27 macros reachable with both endpoints present; columns 15/14/14/14/15/14/14/14/14 raw units wide and bands 43/43/42 tall — one part in fifteen, not a defect; macro 26's strip is **392 raw units against 588 for its band-mates and 645 for the largest**, a fact of the bank's geometry; and **the press is final** — a finger that lands one column off and slides to the macro it wanted sends the wrong macro once and never corrects (down at column 0, slid to column 2, lift: one keystroke, column 0's). Firing on MOVE was refused with a reason; committing on **release** is a coherent alternative that changes the feel. FORGE has **183 free at the picker corner on the Setup (725 of 908) and 528 on the Timer (380)**, so budget is not what is missing | A bench answer about what "precise" meant — the target geometry, macro 26's smaller strip, or the press-is-final gesture. If the last, commit-on-release is the costed change (Open-for-the-user item C.2) |
| 8 | **LATTICE's "clamp it better"** (line 7) — conditional row, KEPT | The first two clauses were answered by 11-02's +8 fast-tap fix, which took LATTICE from **0 messages on a fast tap against 2 on a slow one** to parity. The third was swept in 11-07: **16,384 presses, every raw coordinate**, 49 distinct notes from 36 to 84, every coordinate inside some cell, no value truncated, and the note map's cell boundaries are the picture's (0, 15, 29, 43, 57, 72, 86, 100, 114). There is no clamp to improve. **282 free at the picker corner (626 / 172)** | A bench answer about what "clamp" meant, or a value the sweep can be pointed at |
| 9 | **LUMEN's depth** (line 9, *"the color depth / opacity doesn't work"*) — conditional row, KEPT | 11-09.2 established that the knob **does** reach a LED write, in emitted frame bytes: across `@DEPTH` 1..4 the bottom-left cell walks **`196,69,0` to `27,9,0`** while row 0 does not move at all, and the ramp is already at the full travel the arithmetic permits (`{1, 2, 3, 4}` is the only four-element set the subtrahend admits). Two deepening routes are costed in `lumen.ts`'s header — move the default (zero characters, rewrites eighty of eighty-one cells in `frames.json`) or subtrahend and divisor both 32 (608 at the picker corner as measured then, the bottom row reaching exact black) — and **neither shipped**, because the bench said *"we observed no difference in the LEDs"* and the simulator says the difference is large. The two have not been reconciled and cannot be from this side. (The sysex half of the same line shipped in 11-10) | **The one bench observation that settles it:** install LUMEN at `@DEPTH` index 0 and again at index 3 and compare the **BOTTOM row** rather than the pad as a whole. If it moves on the module, the question becomes which of the two routes was wanted; if it does not, something between HANGAR's rendered Lua and the pad's LEDs is losing the knob and the finding is about the install path, not the entry |

**Deleted from the plan's table, with the delivery named:**

- **MORPH's "mapping mode"** (line 10, third clause): answered at 11-09's checkpoint with a fourth reading none of the three costed options carried — *"when you tap morphs corners it should only send one MIDI message"* — and built in **11-09.1 task 02**: the corner tap IS the selection, `self.k = {0,7,63,70}` already declared the four corner blocks, and the test asserts exactly one message and it the right one. MORPH's three clauses are therefore all closed, by three different plans: the stuck colours by 11-02 (class A and class B), the suppression by 11-08, the mapping mode by 11-09.1.
- **ARC's stop and resume** (line 1): the note read *"if you press the center it stops, pressing it again resumes, not intuitive enough"*, ARC had no stop, no resume and no toggle, and the live question was whether the preview was lying about a shipped card. **It was not**: *"i meant to add stopping and resuming tap as a feature"*. Built in **11-09.1 task 01** as an emitted sequence. A simulator cleared of suspicion is a result, and it is recorded as one.

## B. The gates that do not exist — seven, each with what would close it

None of these is a bug. Each is a class of failure this phase watched pass green.

| # | Missing gate | Found by | What it lets through | What would close it |
|---|---|---|---|---|
| 1 | **Nothing asserts that a card is legible** (`D-11-12-b`, amended by 11-13, 11-15 and 11-14, never closed) | 11-12, negative check 3 | SHUTTLE's forward and reverse palettes made identical — a pad on which direction cannot be read — reddened only `frames.spec.ts`'s pixel hash, and regenerating the fixture made the tree green. *"Don't understand how it works"* could not have been caught by this suite | Either a decision that legibility lives on a bench and nowhere else (then the deliverable is audition row 18(b), which exists), or a widening of the four narrow shape claims 11-13, 11-15 and 11-14 left behind into a rule a new card inherits — each names no colour and proves two pictures differ, not that either reads |
| 2 | **Nothing catches a Timer that stops silently on a zero period** (`D-11-12-a`), and 11-15 found the neighbouring hole: `lua-host.ts` returns early on `gtt(index, 0)` **without clearing the deadline**, so a card that stopped itself that way stops on the module and keeps running in the preview | 11-12, negative check 1; 11-15 | SHUTTLE's `math.max(..., 20)//1` floor removed and the period driven to zero: the Timer fired once and stopped, the pad kept showing a speed it no longer sent, 105 server tests and six sweep tests green. Nine of the twenty hand-authored entries store a Timer | A static clause in `decay-idiom.spec.ts`'s idiom: every `gtt` in a Timer whose argument resolves statically must resolve above zero, and one that does not must be floored; plus the one-line host fix (clear the deadline on the zero-period early return) with a `lua-host.spec.ts` test |
| 3 | **No test asserts what a demo path DEPICTS** | 11-11 | GHOST's old demo path left in place produced a plausible OG image that never pressed the erase key the whole redesign is about, with every gate green. Corollary from 11-12: an entry that does not rest black cannot carry a demo path at all, so SHUTTLE's stop row, STRIP's second control in motion and WHEELS' spring are invisible in their previews by construction | A per-entry expectation in `demo.spec.ts` naming the cells or the message a demo path must reach — a claim about meaning, which every gate in the catalog currently lacks — or an accepted statement that an OG image shows a resting picture and nothing else |
| 4 | **Nothing validates seven-bit sysex data** (`D-11-10-a`) | 11-10, negative check 2 | A planted `gmss(240,125,r,g,b,247)` recorded `240, 125, 255, 90, 0, 247` and nothing objected; 255 is a status byte on the wire. The only guard is clause 4 of LUMEN's own `lua-smoke` test, and `gmss` is absent from `_pad.ts`'s `OUT_CALLS` | A general clause in `lua-smoke.spec.ts` asserting the seven-bit rule over `host.sysex` for **every** entry after the scripted gesture — vacuous until a second sysex entry exists, which is the argument for it |
| 5 | **`bloom` and `disturb` are forbidden by a header comment, not a gate** | 11-05, 11-06 | A future preset change that selects either would compile, fit, and leave a residue no test measures — 11-04's residue probe iterates Lua entries only | One assertion in `presets.spec.ts` over HANGAR's nine: `touch.kind` is never `bloom` or `disturb`, with the reason in its message |
| 6 | **Nothing asserts that a card's whole travel is reachable** | 11-07 | CONSOLE's clamp was a real ceiling at 111 of 127 and was found by a hand-written sweep; FORGE and LATTICE were swept the same way and the three sweeps left behind are per-card assertions rather than a rule any future card inherits | A shared helper in `lua-smoke.spec.ts` that presses every raw coordinate of an entry and asserts both endpoints of every stream it declares — with the declaration being the cost, because no entry currently states what it emits |
| 7 | **A knob's value list can be re-cut without any test noticing what existing links now render** | 11-02, 11-09, 11-10 | EUCLID `@TRAIL`, MORPH `@DECAY` and CHORUS `bloomSpeed` (11-02), SHUTTLE `rest` (11-12) and STRIP's crossfader palette (11-13) were all re-cut in place; every link to them still decodes `restored` and renders something different from what its author saw. `stamp.spec.ts` compares indices, and the only guard built this phase is POMODORO's four captured payload literals | A per-entry captured-literal fixture that records what each `wild-stamps.json` payload RENDERS (the substituted Lua's hash), so a re-cut is a visible choice. **And the second-entry rule**: a second entry appearing in `stamp.spec.ts`'s `older` branch beside `pomodoro` is a signal that somebody is resizing knobs casually — every knob resize on any entry demotes that entry's existing links |

## C. Open for the user — decisions, not gaps, each with its numbers

1. **The nine dead `/c/<id>/` addresses.** HOLD, KEYS, LEARN, SWITCH, ETCH, GRIDLOCK, LIFE, SLAM and TABLE fall through to `404.html` when this deploys, and anyone who shared one gets a 404. Shipped as the honest default. Reversal: a prerendered stub per removed id, or one redirect rule at the Worker — the second possible only because the site is on Cloudflare Workers rather than GitHub Pages (a live consequence of Phase 1's hosting decision).
2. **FORGE commit-on-release.** The press is final (row A.7). Committing on release lets a finger correct before the key lands, interacts with the code-9 tap that carries no lift of its own, and changes the feel of the card. 183 free on the Setup at the picker corner.
3. **JOYSTICK's trail.** The `comet` trail is exclusive with the centre dot: `springLed` returns `comet` the moment `touch.kind` is `comet`, so the power-on lit cell is not emitted and the card measures **zero lit bytes at rest** — a black square, which would flip `restsBlack`, move `motion` to `dark` and take it out of the front-door row, for a note that asked to *improve* the visual aspect. The alternatives that keep the dot are look layers behind the stick: **shimmer 603, wave 621, swirl 641, ripple 652** of 908, all animating, all fitting — and each moves JOYSTICK to `animated`, which moves the front door's quiet-pad geometry. Costed in `presets.ts`, chosen by nobody.
4. **STRIP as two controls, not three.** 11-13 read *"two faders, one crossfader at the bottom and the big one"* as a count followed by an apposition. The three-control reading was **costed rather than argued away: 1,088 of 908 at the picker corner, 180 over**, in a Setup-only architecture; making it fit means a Timer, and a Timer means `animated`.
5. **The `touch.ts` code-9 gap** (`TOUCH-CODE-9.md`). `src/lib/sim/touch.ts` never emits event code 9, so a visitor with a mouse can never perform the coalesced fast tap that five waves of this phase fixed — every class-B fix is right for the module and invisible in the browser, and 11-09.1 retired a whole class of gesture design because of it. Three options: (1) teach `touch.ts` to coalesce a same-tick down and up into one `9` — the one that closes the gap, and the one with blast radius over every fixture that samples a gesture; (2) record it and ship as is; (3) assert it deliberately as a declared property with the reason. Nobody decided; it belongs to whoever owns the fidelity contract.
6. **The RADAR / SONAR / RADAR POINTS overlap**, accepted twice by the user (D-03, then `new-entry` at 11-14's checkpoint): three cards with a rotating sweep and armed points now sit in one catalog, two of them hand-authored beside one preset at ring position 5.
7. **POMODORO's shape character.** Four sentences, and they are the user-facing half of the gate rather than a footnote. **What happened:** appending `1` and `5` to `@MINS` (line 26, the user's own ask) is a resize, `stamp.ts`'s `shapeOf` sums a rack's option counts, so POMODORO's shape character moved `n` to `p`, and a POMODORO link shared before this phase now opens with the panel at its defaults and an "older link" notice instead of restoring the knobs it was minted with — `wild-stamps.json`'s captured `xn33333` is the first payload in the tree to land `older`. **Why it is honest rather than wrong:** `older` is an apology, not a wrong interval; the failure the design refuses is a link silently rendering a *different* configuration under the same name, and that cannot happen here because the indices were appended, never inserted — indices 0..3 still name 15, 20, 25 and 50, proved by four payload literals captured before the change. **Why the cost is zero in practice:** the site has never been public; no real POMODORO link is in anybody's hands. **What it costs next time:** the tripwire is spent per entry, not per phase, and every future knob resize on any entry demotes that entry's existing links the same way — which is why 11-09.1 and 11-09.2 were both written under an explicit no-new-knob rule and prove it with a before-and-after count of every knob's values.
8. **SONAR's armed cells** (11-08): should they fade? More attractive after 11-08 than before it, because a swipe now arms nine cells where a tap armed one. Costed in prose in `sonar.ts`.
9. **EUCLID's swipe as set-rather-than-toggle** (11-08), with 11-07's measured 37-character saving beside it, in `euclid.ts`.
10. **CONSOLE's dark body cell at full scale** (11-07): a layout change rather than a constant, roughly +9, and it costs the ability to set a fader to exactly zero from the pad.

## D. Everything else the eighteen SUMMARYs recorded, with its state at the gate

| Item | From | State at the gate | What would close it |
|---|---|---|---|
| The four mislabelled "free at its worst knob position" rows in `upstream-manifest.json` (pinwheel 596, radar 463, joystick 366, faders 388 — all defaults figures) | 11-04, carried by sixteen waves | **CLOSED at this gate.** Each row now carries the DEFAULTS figure, the worst reachable position from the reachability sweep (pinwheel 486 → 422 free after 11-06's xy stream; radar 458 → 450; joystick 551 → 357; faders 524 → 384) and the correction's provenance | — |
| Entry headers quoting a corner other than the RGB444 picker corner | 11-07 onward, eight found across the phase | **CLOSED at this gate.** The seven headers no plan had checked — EUCLID, CHORUS, LATTICE, SONAR, CULL, QUADRANT, SNAKE — were measured at four corners; six are right (CULL and QUADRANT by construction, having no colour knob; the other four by the accident of already declaring `255,255,255`), and **SNAKE was the eighth wrong one**, 581 / 872 declared against 585 / 880 at the picker corner, corrected in `snake.ts`. The full table is in `docs/TESTING.md` | A gate: `lua-entries.sweep.spec.ts` already measures the picker corner; asserting each header's quoted figure against it would end the class |
| `D-11-10-b` — the audition cost table unchecked | 11-10, amended by 11-11, 11-12, 11-13, 11-14 | **CLOSED at this gate:** all twenty rows re-measured from the entries; **nine were stale**, every one smaller than the entry costs (EUCLID, CHORUS, ARC, LATTICE, MORPH, SONAR, STEPS, CONSOLE, STAGE). The closing SHAPE is not built | `audition.spec.ts` asserting the cost table's numbers against `renderLua` at the defaults, so the table cannot go stale again |
| `lua-smoke.spec.ts`'s "Thirteen tests" header; `front-door.spec.ts:110-112`'s stale comment | 11-09 to 11-14, left for the gate deliberately | **CLOSED at this gate** — 25 tests counted from the runner's report; the front-door rule's live reason (the 271,581-byte Lua VM on first paint) written where the Phase 8 reason stood | — |
| The five-versus-four disagreement over suite-running plans | 11-15 | **CLOSED:** five — 11-01, 11-05, 11-08.1, 11-15, 11-16. 11-15's own verification line said four and omitted 11-08.1 | — |
| `D-11-08.1-a` — `install.e2e.ts:1765` exact write count with no wait, observed 3 for 2 once in five runs | 11-08.1 | **OPEN.** Not observed in this gate's one run (105 passed) | A diagnosis of the third write, then either a wait that implies completion or an assertion on the sequence rather than the count |
| `D-11-08.1-b` — `wrangler dev` died mid-run and nine titles reported it as their own failure | 11-08.1 | **OPEN.** Not observed at this gate | A `webServer` health assertion or a run-level check; `playwright.config.ts` was not editable in this phase |
| `D-11-13-a` — the Lua host keeps ONE `_coordMax` for both axes where firmware has two | 11-13 | **OPEN.** STRIP is the only entry unlocking either axis and pays fifteen characters to unlock both | Two fields in the host plus an axis argument on `host.coordMax`; and a cheap catalog-wide clause refusing an entry whose Lua contains exactly one of `txma` / `tyma` |
| `D-11-15-a` — `host-surface.spec.ts` cannot express an entry-installed `self:` method | 11-15 | **OPEN.** The gate refuses a call that works and that every entry already relies on through `self.touch_cb` | The widening 11-15 proposed: a per-entry declared-method list the scan admits |
| NINEPADS' fast tap sends nothing where a slow tap sends a note pair (0 / 2 across all eight reachable value variants) | 11-04, 11-05, 11-06 | **OPEN, upstream.** A shape change D-02 does not grant; a BOTOR bug under D-08 | Fix in BOTOR and re-sync |
| `phaseCond`'s PRESS arm carries the same class-B defect | 11-04 | **OPEN, upstream, unreachable** from any HANGAR state (all nine presets are `held`) | Fix in BOTOR |
| `preset-baseline.json` predates 11-04 and is stale for pinwheel (305 / 312), radar (438 / 445), joystick (535 / 542) and faders (513 / 520); `preset-baseline.spec.ts` is green over them only through its own substitution table | 11-06 | **OPEN, by design.** The fixture is BOTOR's own compiler's output and D-08 forbids editing it; anything reading it directly (as `fidelity.e2e.ts` did) has to pick a preset clean on two axes | BOTOR taking the 11-04 fix upstream, then a re-capture in BOTOR's own tree |
| The vacuous-fidelity-spec failure mode: a fidelity spec pointed at HANGAR's nine goes red and blames the port for a catalog decision, seen in node (11-05) and in a browser (11-06) | 11-05, 11-06 | **Recorded**, repaired at both sites | A comment at each fidelity spec's import naming which nine it compares |
| Whether WebKit ever emits `contextlost` for a 2D canvas | 11-08.1 | **NAMED UNKNOWN.** 0 trusted events counted in both engines across a full run; not observed is not "never emits". The paint-time guard is why the fix does not depend on it | A bench-adjacent observation under real memory pressure; not a test |
| The LUMEN depth discrepancy | 11-09.2 through 11-15 | Row A.9 | The bench observation in A.9 |
| `D-11-12-b` amended four times (11-13, 11-15, 11-14 each added a narrow legibility claim) | — | Row B.1 | Row B.1 |
| Install runbook row C — CLEAR's half | Phase 10 (10-13), still open | **OPEN**, no plan in this phase touched the device path | The user's bench |
| **Tooling defect:** `gsd-tools state advance-plan` and `roadmap update-plan-progress` destroyed the plan's Status line in thirteen consecutive waves | thirteen consecutive waves, each reporting it | **OPEN.** Both commands were skipped by this gate on instruction; STATE.md and ROADMAP.md were not advanced by the tool | A fix in the state tool, outside this repository |

---

## D-11-16-a — `browse-webkit.e2e.ts:618` reads the pad once more, without a wait, right after its poll succeeds

**Found:** plan 11-16, the post-commit gate run (run 2 of 3) at `--workers 3`, 1,651 MB free at start.

```
[webkit-phone] browse-webkit.e2e.ts:564 "a pad whose backing store dies gets its
picture back where it sits @webkit"  (17.5s)

  Error: ninepads is lit before anything is done to it
  expect(received).toBeDefined()   Received: undefined
    616 |       before,
  > 618 |     ).toBeDefined();
```

**What the shape says.** Lines 604–613 `expect.poll` `litCells(page, "ninepads")` until it is a
number above zero, with a 30 s timeout; line 615 then calls `litCells` **once more, un-waited**, and
`countOf` turns any non-number (a `null` from a canvas that is momentarily not 9 wide or has no 2D
context, or a string from `describeThrow`) into `undefined`. The poll saw a number; the very next
read did not. That is the family `D-11-08.1-a` names — an exact read taken with no wait beside a
poll that implies one — in 11-08.1's own title, which is the one title in the suite that exists to
exercise a dropped backing store.

**What it is not.** Nothing this gate committed reaches it: `git diff --stat 721e5fa HEAD -- e2e/
src/` is four comment-only hunks. Run 1 on the same code passed 105 / 105 at 6.3 GB free; run 3,
started immediately after run 2 at 2.2 GB free, passed 105 / 105 in 2.1 m. Once in three runs, at
the lowest memory of the three, on the WebKit project.

**Whether WebKit actually dropped the store is not known** — 11-08.1's named unknown stands. The
test does not print what the second read returned, which is the first thing to change: `before`
should be asserted with the raw value in its message, so the next occurrence says `null` or names a
throw.

**Suggested owner:** the next wave that touches `e2e/browse-webkit.e2e.ts` or `e2e/poll.ts`,
together with `D-11-08.1-a`; the two want one idiom (read inside the poll and keep the value) rather
than two fixes.
