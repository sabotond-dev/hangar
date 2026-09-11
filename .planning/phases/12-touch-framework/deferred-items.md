# Phase 12 — deferred items

Things found while executing that are out of the finding plan's scope. Nothing here is a bug that
ships; each is a measured statement about the tree with a named owner or an explicit "nobody yet".

---

## 1. The reachability sweep's two-pass split under-reports NINE PADS by three characters

**Found by:** plan 12-05, when moving NINE PADS' shipped grid to 4x4.
**Where:** `src/lib/tune/reachability.sweep.spec.ts` — Pass A / Pass B, and the pinned margin at
`:446`.
**Risk:** none today. The true worst is 640 of 908 (268 free) and the sweep reports 637 (271 free);
both are far under the wall, and `over budget 0` is unaffected either way.

`reachability.sweep.spec.ts` splits its cross-product into Pass A (every non-colour knob, with the
colour pinned at the literal Pass B measured dearest) and Pass B (the colour dimension alone, every
other knob at its DEFAULT index). The licence for the split is separability: *a colour contributes to
an event's length only through its three decimal literals*, so the dearest colour is the dearest
colour whatever the other knobs are doing.

**That is false on NINE PADS.** At 3x3 the compiler paints a checkerboard, which emits the chosen
colour AND a dimmed variant of it; at 4x4 it lights one marker cell per zone and emits the chosen
colour once. So the colour's contribution depends on `grid`. Measured directly, all four corners:

| | `102,102,102` (position 1638) | `255,255,255` (position 4095) |
| --- | --- | --- |
| **3x3** | 637 | **640** |
| **4x4** | 627 | 627 |

While the card shipped at 3x3, Pass B ranked `255,255,255` dearest and Pass A found the true 640.
Now that it ships at 4x4 the two literals TIE at 627, Pass B ranks `102,102,102` first, and Pass A
costs the whole cross-product with it — missing the three characters `255,255,255` costs at 3x3.

**What a fix would be:** run Pass B once per position of any knob that changes how many times a
colour is emitted, or pin Pass A's colour at the maximum over Pass B *and* the declared corners.
Both widen a sweep that already runs 45,358 states in ~110 s.

**What is on the record meanwhile:** `src/lib/tune/colour-picker.spec.ts:507-510` independently pins
`NINEPADS_WORST = 640` / `NINEPADS_FREE = 268` and is green, so the TRUE figure is still gated
somewhere. The sweep's own comment at the assertion names all four corners.

**Owner:** nobody yet. A candidate for 12-12's gate pass.

---

## 2. `src/lib/browse/facets.ts:15` still says `precise` is carried by six cards

Carried forward from 12-04, which recorded it and did not touch the file. It has been **seven** since
11-15. Plan 12-05 did not touch `facets.ts` either, so it is still open. Nothing gates the sentence —
the floor test asserts a minimum, and a prose count in a header has no gate at all.

**Owner:** the next plan that edits `facets.ts` for any reason.

---

## 3. QUADRANT hangs a note when a lift is lost, and closing it needs a Timer it does not have

**Found by:** plan 12-08, which re-fitted the four cell-toggling sequencers and read `quadrant.ts`
to decide whether it was a fifth.

**It is a DIFFERENT failure from the other four, and that is why it was not re-fitted with them.**
QUADRANT computes `x*9//128` too, but it acts on ONSETS ONLY — `if e~=4 and e<9 then return end` — so
a MOVE returns before any cell is computed and Q2's one-unit boundary wobble cannot toggle it. The
hysteresis half of the library buys it nothing.

**Its exposure is Q6.5.** It holds one note per contact in `s.k[i]` and releases it only on codes 3
and 5..8. The probe recorded four of five contacts never sending their code 5 after a five-finger
chord, and Q7 recorded a palm leaving phantoms that keep reporting. A contact whose lift is lost
hangs a note with nothing in the entry to reach it — and a hung note is the worst failure a MIDI
instrument has.

**Closing it needs `R` AND a Timer, and QUADRANT has no Timer at all** (`docs/HARDWARE-AUDITION.md`:
`quadrant` is one of six Setup-only entries, and row 1's install rule says to store nothing into
event 6 for any of them).

**The arithmetic, measured at the RGB444 picker corner rather than taken from the audition row**
(`@HUE=255,140,0,0,200,255,0,255,120,255,0,180`, `@FILL=0`, `@NOTE=36`, `@CH=15`), because 11-16 found
nine of twenty audition rows stale:

| Shape | Setup | Free |
| --- | --- | --- |
| as it ships | **838** | 70 |
| `R` added beside `self.k={}`, the existing end branch left alone | 924 | **over** |
| that, plus `gtt(0,100)` to arm the Timer | 935 | **over** |
| `R` added AND the existing end branch rewritten to `if e==3 or e>4 and e<9 then R(s,i)return end` | 863 | 45 |
| that, plus `gtt(0,100)` | **874** | **34** |

A new Timer event would be `--[[@cb]]gtt(0,100)X(self,20)` — **29 characters** against its own 908.

**So it FITS, at 34 free, and it was still not done here.** Three reasons, each a cost this plan is
not licensed to spend:

1. **It needs a release-path refactor on the one entry that handles code 9 explicitly.** QUADRANT
   sends the note-off immediately for a coalesced tap (`if e==9 then s:gms(...)B(q,0) else
   s.k[i]=q end`). Moving the release into `R` changes which path fires for a fast tap, and that is a
   behaviour change on the card whose whole claim is that you can hit it without looking.
2. **The window is not measurable from here.** `X(s,n)` counts the CALLER's Timer calls, and QUADRANT
   has no period — 100 ms above is an illustration, not a decision. 12-07's contract puts the window
   with the caller and 12-12's bench row is what sets it.
3. **It would need its own test and this plan's declared term has no room for one.** The other four
   join one boundary test as subjects; a hung note released by a sweep is a different assertion with
   no existing home, so it cannot be folded in the way SONAR was.

**What the bench is being asked meanwhile:** `docs/HARDWARE-AUDITION.md` row 19 now carries the
observation — press four quadrants, lift them together, report whether anything is still sounding —
so the desk decides whether this is a real failure on the user's own module before a Timer is added
to a card that is documented as deliberately having none.

**Owner:** plan 12-12, with the bench answer to row 19 in hand.

---

## 4. `docs/TESTING.md`'s cost table now has a fourth stale row, and LUMEN is it

**Found by:** plan 12-11, which took LUMEN from 742 / 746 to **704 / 707** at the defaults and at the
RGB444 picker corner.

`docs/TESTING.md:1318` still reads `| lumen | 742 | 746 | 162 | 0 | 0 | 908 | 302 / 908 |`. It is the
fourth row of that table this phase has invalidated without editing: 12-09 left CHORUS (771 / 174 →
796 / 29), CONSOLE (852 → 781) and MORPH (710 → 772) stale for the same reason, and its SUMMARY hands
"the tenth stale cost row" to 12-12 by name.

**Why it was not fixed here.** The plan's `files_modified` does not name `docs/TESTING.md`, 12-09
established the phase's handling of exactly this row, and a one-row edit to a table whose other three
rows are also wrong reads as though the table had been checked. **Nothing gates any number in it** —
that is the standing property that lets it go stale — so the risk is a reader, not a suite.

**What the correct row is, measured on the tree at `ff67efb`:** `| lumen | 704 | 707 | 201 | 0 | 0 |
908 | 302 / 908 |`.

**Owner:** plan 12-12, with the other three.

---

## 5. JOYSTICK's "more led animation" is a named non-delivery, by the user's answer, and three rows record it

**Found by:** plan 12-06, at its blocking checkpoint, answered 2026-09-11.

The checkpoint put six costed options in front of the user (trail 488, shimmer 614, wave 634, swirl
653, ripple 664, as-is 551 - every figure at the RGB444 picker corner, re-measured by 12-06's
handover and reproduced by task 02 at 551 on both the dearest pin `102,102,102` and `255,255,255`,
540 non-colour states each). The answer, verbatim:

> **"as is, selectable tuning options under Trackpad"**

The first half is JOYSTICK's. Nothing in `presets.ts` moves except the comment that records the
table and the answer; `frames.json`, `golden-frames.json`, `front-door.ts` and the OG image are
untouched and proved untouched (regenerated and byte-identical). The second half is TRACKPAD's and is
12-10's; see 12-06-SUMMARY's hand-off.

**Three rows for 12-12, which owns the files they sit in:**

1. **`.planning/phases/11-bench-corrections/deferred-items.md` C.3 "JOYSTICK's trail"** - the row
   12-12's plan already marks *answered (12-06, verbatim)*. The closing sentence is: answered
   **as-is** on 2026-09-11; the trail and the four look layers are costed in JOYSTICK's comment in
   `src/lib/catalog/presets.ts` and none was taken; the "more led animation, trail or something"
   half of the 2026-09-09 note is a named non-delivery with the reason (the trail takes the parked
   dot and the power-on centre; a look layer reverses the dark-field decision and re-points the one
   colour knob from the stick to the background wash).
2. **`docs/HARDWARE-AUDITION.md` has no JOYSTICK row.** 12-06's handover found it; adding one is
   `+1` against 12-06's declared audition `+0`, so 12-06 did not add it. If the bench is to confirm
   the as-is answer on the module, 12-12 adds the row with the expectation sentence "the centre
   cell lit from power-on, one dot following the finger, parked on the centre on lift, no trail".
3. **`docs/TESTING.md`'s cost table, joystick row** - 12-06 did not measure it and did not edit the
   table (item 4 above records the phase's handling). The corner figure to check it against is 551
   / Timer 24 / 357 free; the defaults figure is 543 for the preset state and 547 for a tuned state
   (`withChange` deletes `preset`, `src/lib/tune/state.ts:11`).

**Owner:** plan 12-12.

---

## 6. TRACKPAD replaced the `tpad` preset as the card, and seven things fall to 12-12 or later

**Found by:** plan 12-10, 2026-09-11, acting on the user's "selectable tuning options under Trackpad".

The fold was measured before it was built: the vendored trackpad recipe is 893 of 908 under HANGAR's
marker, every Setup-side flash is over (1113 with everything kept, 942 with the drain, the hold-off,
the finger-centring and the on/off knob all cut), so the flash is painted from the Timer (Setup 903
at every knob state, Timer 488 at the picker corner). The card is `trackpad` / TRACKPAD; the `tpad`
preset stays on the shelf, unlisted, as the compiler's over-budget fixture. What that leaves:

1. **`/c/tpad/` is a dead address** - the fourth this phase, after the three 12-04 removed. The OG
   image `static/og/tpad.png` no longer builds (gitignored either way) and `frames.json` has no
   `tpad` row; `golden-frames.json` keeps its `tpad` row because it regenerates from the VENDORED
   shelf. 12-12 records the dead link where it records the other three.
2. **CONT-01's wording says "the nine ... are in the catalog"**; eight are, and the ninth is on the
   shelf and held by `presets.spec.ts` exactly as before. 12-12 amends the requirement's clause
   (`.planning/REQUIREMENTS.md` is not 12-10's to edit).
3. **The decay gate is blind to a `D(` call, measured on this card.** `decay-idiom.spec.ts` was run
   on a mutant Timer carrying `D(...,1,250)` and stayed green; `library.spec.ts` proves `D`'s
   arithmetic for every multiple of six, and `lua-smoke.spec.ts`'s TRACKPAD test reads the VM to 0.
   12-07 recorded the same for the sketch. A gate clause that resolves `D(n,l,w)` would ALSO have
   to accept a `w` that depends on a loop variable (`@T*(16-k*k)//16*6`), which its evaluator
   refuses today - so the honest clause is "a `D(` call whose `w` is `<expr>*6`", asserted by text.
   12-12 decides whether the gate gains it or the smoke test stays the proof.
4. **`docs/TESTING.md`'s cost table** has no TRACKPAD row and a `tpad` row that is now a shelf
   fixture's; the figures are Setup 903 (every knob state), Timer 488 corner / 486 defaults.
5. **Three `touch-guard.spec.ts` rows** for the recipe's guards (`e==3 or e>=5`, `e>4`,
   `e==4 or e>7`), each right because of the pass around it. The plan asserted "no new row"; that
   was GLIDE's plan, and GLIDE had no tap. 12-12's gate counts four rows, not one.
6. **Stale comments naming Trackpad's old sentence** in files 12-10 did not touch, all prose and
   none load-bearing: `src/lib/ui/PadFrame.svelte:129-133`, `src/lib/ui/CatalogCard.svelte:183-185`,
   `src/routes/c/[id]/+page.ts:10,34`, `src/routes/c/[id]/+page.svelte:63`,
   `e2e/browse.e2e.ts:624-629,678-681`, `src/lib/sim/host.spec.ts:384`, `src/lib/catalog/types.ts:86`.
   Phase 13 owns the UI files' next rewrite; the e2e assertion behind the comment holds at 0 === 0.
7. **`front-door.spec.ts`'s "the excluded entry is excluded because it is dark"** still derives
   `tpad`'s motion from the vendored golden fixture and asserts it dark - true of the preset, no
   longer about any catalog card. Green and untouched; 13-07 dismantles the file.

**Owner:** plan 12-12 for 1-5; Phase 13 for 6-7.
