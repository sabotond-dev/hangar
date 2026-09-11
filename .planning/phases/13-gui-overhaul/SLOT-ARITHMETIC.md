# Slot arithmetic — what the two answered probes permit, and what it costs (13-02)

Written 2026-09-11 by plan 13-02. **Every character figure in this document is an estimate from an
unrun sketch (`13-RESEARCH.md` §3.1, its Knob left "type 5 — undefined") and is superseded by
13-15's VM-measured runtime.** The label is repeated beside every table because Phase 12's lesson,
quoted in 13-15's objective, is that an unrun sketch measures the wrong thing. Two further removes,
stated before anybody leans on a number:

1. **The research's own sketch is not in the tree.** §3.1 says its scratch scripts were deleted, and
   its `Z` exists only as a prose description (five bullets and a per-kind table). What is measured
   here is a **re-sketch written from that prose on 2026-09-11**, so the figures are one step further
   from the research's `861` than the plan assumed, and §3 says where the two sketches differ.
2. **Nothing here was run.** Every string parses under the pinned minifier's `checkSyntax` (all
   `true`), which says it is Lua, not that it works. 13-15 runs the real runtime in wasmoon.

Measured with `@intechstudio/grid-protocol@1.20260825.1135` after `initLuaFormatter()`;
`cost = max(compressScript(s).length, s.length)`, canonicalised to a fixed point, measured twice.
The runtime carries no colour literal, so the RGB444 picker corner and every other corner give the same
figure; the corner applies to the data half, which is 13-14's to measure.

## 1. What the probes observed, and where it is recorded

Both records are shipped and unedited; this document points at them and rewrites nothing.

| Probe | Procedure | Result, verbatim | Cell | Commit |
| --- | --- | --- | --- | --- |
| 1, D-07 (2026-09-10) | `SLOT-PROBE.md` | *"bottom right corner lits up!"* | **80** | `493a21a` |
| 2, D-18 (2026-09-10) | `SLOT-PROBE-2.md` | *"bottom right corner!"* | **80** | `ff3f7b0` |

**Probe 1** — the touch Setup called the touch Timer's registered body (`s.tim` or `s.timer`) on the
first tap and `P` was defined afterwards. Both halves of the mechanism the research read from
`grid_ui.c:373` hold on hardware: an event body is a callable method on its element, and the globals it
defines persist. **The touch Timer is a library slot HANGAR already writes.**

**Probe 2** — the system element's fourth event (255/4) was written through Grid Editor with
`function P2()return 255 end`; the touch Setup called `ele[#ele]` under four candidate names and `P2`
was defined. The mechanism **holds across elements**, and it holds for the slot the firmware binds to
the utility button. **D-18 is met: three 908-character slots are proved.**

`13-RESEARCH.md`'s *"Unverified — needs the bench"* rows for `self:tim()` and `ele[1]:map()` are
**superseded by observation** (the research at `a61e74a` precedes probe 1 at `eaac143`); 13-VALIDATION
records the correction rather than leaving two documents disagreeing.

## 2. The five-slot budget, as the two probes leave it

| Slot | Address | Holds | Proved | Figure | Label |
| --- | --- | --- | --- | --- | --- |
| system Setup | 255/0 | Phase 12's touch library | written by `writeAll` since 12-02 | **769** of 908, 139 free | **measured**, `12-07-SUMMARY.md` (the research's 884 sketch is superseded) |
| system fourth event | 255/4 | a third library slot | **reachable — probe 2** | 908 | not written by HANGAR until 13-17 (D-19) |
| system Timer | 255/6 | nothing | never asked | 908 | named only so five is not mistaken for four |
| touch Setup | 0/0 | the data half: `G`, `M`, `Y()`, the callback, and the calls that pull the runtime in | written today | 366 at 4 elements, 811 at 16 | **estimate, unrun sketch** (research §3.1); 13-14 measures |
| touch Timer | 0/6 | the expiry sweep call, plus whatever runtime shares the slot | **library slot — probe 1** | `--[[@cb]]X(self,20)` = **19**, 889 usable | measured here, 2026-09-11 |

**Two library slots are proved, not one**, and the library string the research costed at 884 shipped at
769 — the only figure on this page that was run before it was pinned.

### The element addressing, re-read from `12-02-SUMMARY.md`

`SLOT-PROBE.md`'s sentence *"HANGAR does not write element 255 yet"* is **stale as to 255/0 and still
true as to 255/4**. 12-02 (`f08a4a4`, `0041c52`) landed `ELEMENT_SYSTEM = 255` in the descriptor **and
in the response filter**, and `writeAll` writes 255/0 first; `sequence.spec.ts` asserts that no frame
addresses 255/4 or 255/6, and `constants.ts`'s header carries the utility-button reason. Under D-19 that
refusal is a *pending removal* and 13-17 is where the write lands, with PUT BACK restoring the
`gpl(gpn())` default. Two numbering systems meet here and neither is the other: **255 is the wire
address** HANGAR puts in a CONFIG/EXECUTE frame; **`ele[#ele]` is the Lua index** the firmware
registers (`init.lua:46-50`), and it is the spelling that lit cell 80. The research's `ele[1]` is the
same element on a ZONA by that convention, but `ele[1]` was not what ran; 13-14 emits `ele[#ele]`.

## 3. The six figures — estimate, from an unrun sketch (13-RESEARCH §3.1); superseded by 13-15's VM measurement

The runtime re-sketched from §3.1's prose: non-live codes hand the contact to the library's `E`; the
cell is `y*9//128*9+x*9//128` read straight out of the 81-entry map `M`; a contact keeps the region it
landed in (`S[i]`) until a lift or an expiry; `T[i]=C` stamps every live sample so the library's `X`
sweep can expire it; `R` is defined so a Button's 0 fires on every expiry path. Branches are emitted
per kind (dead-branch elimination applies to the runtime because HANGAR emits it per surface). Each row
is cumulative, canonical in one minifier round, a fixed point on the second pass, and its two costs
agree.

| Runtime carrying | Runtime alone | + marker + `X(self,20)` (the Timer) | Fits beside the sweep in 908? | Label |
| --- | ---: | ---: | --- | --- |
| vertical fader only | **405** | 425 | yes, 483 free | estimate, unrun sketch; 13-15 supersedes |
| vertical + horizontal fader | **430** | 450 | yes, 458 free | estimate, unrun sketch; 13-15 supersedes |
| faders + button | **561** | 581 | yes, 327 free | estimate, unrun sketch; 13-15 supersedes |
| faders + button + XY | **738** | 758 | yes, 150 free | estimate, unrun sketch; 13-15 supersedes |
| faders + button + XY + **rotary Knob** | **1,042** | 1,062 | **no, 154 over** | estimate, unrun sketch; 13-15 supersedes |
| **the rotary Knob's own share** | **304** | — | against D-08's 150–200: **104 above the top of the estimate** | the research left the Knob undefined; this is a re-sketch of D-08's description, never run |

**The Knob row, as the plan asked it to be said.** The research's table leaves type 5 *undefined* and
costs nothing for it. D-08 makes it a real rotary — angle around the region's centre, a wrap-safe
accumulator, a per-contact previous-angle table — at an estimated +150–200. The re-sketch of exactly
that description (`math.atan` on doubled coordinates, a ±3.14 wrap, a per-region value in `N` so the
knob keeps its position between gestures, a per-contact previous angle in `K`) costs **304**, and the
difference from the estimate's top is **104**. That is not a measurement of D-08's rotary; it is what one
plausible spelling of it costs under the minifier. 13-15 writes the real one and measures it.

**The research's 861 beside this re-sketch's 738**, four kinds in both: **−123**, and the two are not
reconciled because they are two different sketches. The research's `Z` called `F(i,n,2)` — Phase 12's
finger light — and **`F` left the library at 12-07** (the same 123 characters, which is a coincidence
of number and not an explanation); the research's Button carried a latch flag this sketch does not;
this sketch carries a clamp (`U`) the research's prose does not mention. Neither figure is the other's.

**Every combination, for the ceiling below** (Timer = marker + runtime + `X(self,20)`; `v`/`h` the
fader orientations, `b` Button, `x` XY pad, `k` rotary Knob):

| Fits beside the sweep | Does not |
| --- | --- |
| any one kind (385–558); any two without both `x` and `k` (450–729); `xk` alone 813 | — |
| `vhb` 581, `vhx` 627, `hbx` 729, `vbx` 733, `vhk` 754, `hbk` 856, `vbk` 860 | `bxk` **944** |
| `hxk` 902 (6 free) and `vxk` 906 (2 free) — margins too thin to call fits on an unrun sketch | `vhxk` **931** |
| `vhbx` **758**, `vhbk` **885** (23 free) | `hbxk` 1,033, `vbxk` 1,037, `vhbxk` **1,062** |

## 4. The two-slot ceiling, stated without hedging

**Under the two slots probe 1 proved, a surface may mix any three of the four element kinds.** Fader
(both orientations) + Button + XY pad fits beside the sweep at 758 of 908; Fader + Button + Knob fits at
885; **all four together do not** — 1,062 against 908, 154 over. The measurement produced the second of
the plan's two outcomes: the four-kind runtime does **not** fit beside `X(self,n)` in one slot, so on
two slots the ceiling is **three kinds**, and the rotary Knob is the kind that tips it.

**The PDF's page-3 surface — a 2×6 Fader, an XY pad, a Button and a Knob — is NOT installable under
two slots.** The estimated pair is **1,042 runtime** (1,062 with the marker and the sweep call) beside
**889 usable** in the Timer, and **366** (the research's, unrun) for the four elements' data in Setup.
The data fits; the runtime is 154 over.

**Under the three slots probe 2 proved, it is installable as drawn — with one condition the probe
results did not state.** The five-branch runtime is **1,051 with its marker, which does not fit in 255/4
alone either** (143 over). What the third slot buys is not "the runtime moves to 255/4" but **a second
library slot**, so the runtime spans both: measured here, the four-branch dispatcher with a Knob hook in
**255/4 at 787** (121 free) and the Knob function `J` beside the sweep call in the **touch Timer at
324** (584 free) — **1,111 of 1,816** across the two, with two markers paid. 13-17's table, which puts
only the sweep call in the Timer under the third slot, describes the case the sketch says does not
arise for a four-kind surface; 13-15's measurement decides, and 13-14 emits both pull-in calls
(`ele[#ele]:<name>()` at 15–19 characters by candidate name, `s.tim(s)` or `self:tim()` at 10) so the
Setup reaches both halves. Any three-kind surface still fits in one slot with the other empty.

## 5. The checkpoint, answered before the plan ran — recorded, not re-asked

The plan's Task 02 asks one question: whether Sandbox v1 spends a second bench row on a third slot.
Both halves of the answer exist and are quoted rather than paraphrased.

**D-18, the user's choice** (`13-CONTEXT.md`, `13f35a7`): *"Offered: ship on two (at the risk of
reversing D-08 and deferring the XY pad, neither an executor's call), take the second probe, or write
the row and defer. **The user chose the second probe.**"*

**The probe's answer** (`PROBE-RESULTS-2026-09-10.md`, second section, `ff3f7b0`): *"**Cell 80.** A
**touch** script called the **system** element's fourth slot and the global it defined persisted. The
mechanism the first probe proved between two events of one element **holds across elements too**, and
it holds for the slot the firmware binds to the utility button. **D-18 is met: Sandbox v1 has three
908-character slots.**"* And: *"13-02's checkpoint is **fully answered before the plan runs**: D-18
chose the probe, and the probe said yes. The executor records both and asks nothing."*

**The recorded answer is `three-slots`** — the plan's `third-slot` option, taken and then run. It is
handed to **13-14** (emit against three slots: the runtime pulled in from 255/4 and from the Timer, the
data half unchanged) and **13-15** (the VM measurement is headroom confirmation, not a ceiling decision;
**the re-ask rule stays**: if the measured runtime lands larger than this sketch by more than the slot
gained, it goes back to the user). **13-17** owns the 255/4 write and its PUT BACK under D-19. The
action colour was not asked: D-16 settled it at `#DCFF71` and 13-03 writes against it.

## 6. What the probes did not prove, quoted from their own results

From probe 1: *"Whether a body called this way runs with the **same `self`** it would have on its own
schedule was not distinguished from 'it ran at all'."* And: *"The Timer was **never armed** in this
probe. A library Timer that is also scheduled would re-run its definitions on every tick — harmless for
pure function definitions, and a cost only if the body does work."* **The Sandbox's Timer will do
work**: the sweep call, and under the split above, `J`'s definition beside it.

From probe 2: *"**Which of the four names is the real one** — `map`, `mapmode`, `utility` or `util` —
the probe did not distinguish. 13-15 reads it from `grid-fw`'s system element source now that the
mechanism is certain, and confirms with one tap at the bench. The emitted runtime must call the one
true name, not a fallback chain."* And: *"**HANGAR still does not write 255/4.**"* — 13-17's, under
D-19, with PUT BACK restoring `gpl(gpn())`.

## 7. What the third slot cost, and what its remaining row is

The second bench row was the one the plan priced: ten minutes, the same shape as the first, through
Grid Editor because HANGAR refused 255/4 by 12-02's constant. It has been paid. What remains is one
row in `docs/INSTALL-RUNBOOK.md` (row H, appended by this plan, conditional on 13-15 and 13-17
landing): the name confirmed with one tap on HANGAR's own emitted runtime, and the page-next default
proved back after PUT BACK. Both extra risks the plan named are in the row: the write replaces the
firmware's default until PUT BACK, and the wire address is 255 where the Lua index is `ele[#ele]`.

## 8. The copy finding, filed

Probe 1 recorded a port that had opened once and was refused on a second open because another HANGAR
tab still held it, reported as *"The port would not open"* with no reason. Filed in `13-COPY-NEW.md`
against the open-failure family (`transport.ts:150` `port-busy`, CONN-04, and `:190` the `default`
branch that produced the title), with the observation verbatim and one question for 13-18.
