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
