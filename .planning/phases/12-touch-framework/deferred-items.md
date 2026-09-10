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
