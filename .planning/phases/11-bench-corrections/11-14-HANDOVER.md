# RADAR — the question, and what was measured before asking it

Plan 11-14 is **open at its blocking checkpoint**. Nothing was built, nothing was
committed, every carried count is unmoved. This file is task 01's reported
answer; there is no SUMMARY because the plan is not complete.

---

## Does option (d) exist? Yes — and the plan's reasoning about it was wrong

The front-door ring requires `preview === "padsim"`. The plan expected this to be
a stale rule: the comment beside it says *"'lua' entries have no simulator engine
until plan 08-03 lands one"*, and 08-03 landed that engine two phases ago.

**The comment is stale. The assertion is not.**

It picked up a **second, live purpose in Phase 10** that the plan never mentions.
`Coverflow.svelte` calls `createEngine` for every ring entry unconditionally, so
a `lua` entry dynamic-imports the Lua VM — and `e2e/tuning.e2e.ts:318-328`
asserts, for `/` specifically:

> *"a visitor who only browses the front door downloads no WebAssembly: not the
> 628 KB formatter, not the 271 KB Lua VM"*

So a hand-authored RADAR in the ring puts **271,581 bytes on the front page's
first paint** and turns that test red.

**The answer is therefore neither outcome the plan anticipated: the rule is live,
for a different reason than the one written next to it.**

## Three assertions gate a Lua entry in the ring, not one

Measured by planting SONAR into ring position 5 and keeping the partition exact
(scratch copy, sha256 `0feaa0ca…9e762b` identical either side, restored, re-run
green):

```
:113  an engine exists for it        expected 'lua' to be 'padsim'
:168  golden-frames.json records it  expected undefined to be defined
:311  resolves on the vendored shelf expected undefined to be defined
```

**And walls 2 and 3 are satisfied by *id*.** A hand-authored RADAR keeping the id
`radar` would sail past both while `deriveMotion("radar")` went on reading the
**ported preset's** frames forever — a gate that keeps passing about the wrong
card. That is this phase's standing warning in its purest form, and it makes
option (d) quietly *wrong* rather than merely costly unless it is fixed.

## Option (a) is not re-derivable, and that changes what choosing it means

The plan says the quiet-pad spacing is *"re-derived and its header sentence
rewritten"*. Brute-forced instead: **0 of 5,040 orderings** of a seven-card ring
satisfy both asserted properties. At eight, 720 of 40,320 do.

Geometry read from `golden-frames.json` at run time, not quoted:

| index | id | motion |
|---|---|---|
| 0 | aurora | animated |
| 1 | pinwheel | animated |
| 2 | ninepads | **static** |
| 3 | starfield | animated |
| 4 | joystick | **static** |
| 5 | **radar** | animated |
| 6 | faders | **static** |
| 7 | dial | animated |

Quiet pads at 2, 4, 6 — the header's literal still holds, and 11-06's comet trail
did **not** move joystick. RADAR sits between two quiet pads, so removing it
makes them neighbours.

**Choosing (a) means choosing which of the two front-page rules to abandon.**

## One measured fact the user should have

D-03 stands and is not being narrowed: RADAR and SONAR both get built and the
overlap is accepted. But **SONAR as it ships today already does every clause of
the radar note** — a sweep rotates, taps arm and disarm cells, any number can be
armed, each gets a note-on when the sweep crosses it and a note-off on the
following step. The only clause it lacks is the word *radar*, and the honest
difference between the two is geometry: a sweep of angle versus rings rolling out
from the centre.

That is why option (c) exists. It is not the recommended answer and it is not the
planner's call.

## The four options, with their measured costs

**(a) `ring-seven`** — build it; the front page shows seven cards. Catalog stays
27, audition 23, previews 27, one test added. **Cost:** one of the two front-page
rules must be abandoned; no arrangement keeps both.

**(b) `new-entry`** — build it as a second card, leave RADAR alone. Front page
untouched. **Cost:** catalog 27 → 28 now and 29 after the wheels; audition 23 →
24 then 25; a 28th preview image; `front-door.ts` still changes, because a card
kept off the ring must be registered as deliberately excluded; and a third
overlapping card lands beside SONAR.

**(c) `fold-into-sonar`** — do not build it. Nothing moves anywhere. **Cost:** the
radar asked for by name is not built; the note is recorded as a decision with its
reason rather than a gap.

**(d) `ring-eight-lua`** — build it and keep it on the front page. Ring keeps its
eight and its arrangement; catalog 27, audition 23, previews 27. **Cost:** every
front-page visitor downloads 271 KB of Lua VM on arrival; the test forbidding
exactly that goes red and must be rewritten; the motion check must be re-pointed
or it keeps passing about the old card; and it opens the parked question of
growing the ring past eight.

## Five more things the plan asserts that the tree does not support

1. The `padsim` rule is not merely historical (above).
2. Three assertions gate it, not one (above).
3. Walls 2 and 3 pass by id (above).
4. Option (a) is not re-derivable (above).
5. **The branch table mixes this plan's figures with post-11-15 totals in
   adjacent columns** — "catalog 28", "split 8 + 20", "`static/og/` 28" are all
   *after* the wheels. The tree today reads **27**, **9 + 18**, **27**. The
   table's "28, unmoved" describes nothing currently true, which is the exact
   confusion it was written to prevent.
6. `front-door.ts`'s header table would go stale under (a) and (d) in a place
   nothing scans — the `| 5 | radar | animated |` row is prose.
7. 10-07's parked item quotes *"twenty-seven of thirty-six"*, which predates
   11-01's removal. The live figure is **eighteen of twenty-seven**.

## To resume

Answer with one of **`ring-seven`**, **`new-entry`**, **`fold-into-sonar`**,
**`ring-eight-lua`**. The resuming agent should read this file as task 01's
answer and must not re-run the option-(d) check.
