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
