# HANGAR — First Experience (design brief)

**Source:** Botond, 2026-09-04, from a reference frame he sent plus four answers. This document is the
user's picture of the site, recorded verbatim in intent so the UI phases start from it rather than
from the roadmap's earlier "catalog of cards" wording. It overrides that wording wherever they differ.

## The frame

A black screen. A short mixed-case headline at the top in a rounded geometric sans, quiet:

> You've got to start somewhere…

Below it, **a coverflow of ZONA pads**: one 9×9 pad large and centred, its neighbours receding to
the left and right with real depth — smaller, dimmer, overlapping, falling off the edges of the
viewport. Each pad is drawn as the identity motif: rounded-square outline in acid lime on black,
dotted grid face, cells picked out at the intersections, glowing.

**Every pad in the row is alive.** Each runs its own configuration's live simulation — the centre
one at full size and full fidelity, the side ones smaller but still moving. You arrive and the
machines are already running.

**The pad is the card.** No title block, no description, no chrome around it. The only other text on
the screen is a lime-outlined name plate under the centre pad with solid lime triangle arrows:

> ◀  LFO default  ▶

Name and navigation are one element; the arrows step the row.

## The four answers

1. **The coverflow is only the front door.** It exists so a visitor has a wow moment and can choose
   an initial configuration. The real catalog behind it is "much more sophisticated" and is a
   separate screen for a later phase — not this one.
2. **Choosing the centre pad makes `TRY ON DEVICE` appear.** "That's the whole point." A store
   button (`KEEP ON DEVICE`) must exist somewhere, secondary, per the SAFE-02 split. Nothing
   appears until the visitor has chosen.
3. **Knobs and the two 908-character meters — placement is Claude's to figure out.** Working
   assumption: they belong to the *chosen* pad, not to the coverflow — once chosen, the row can
   recede and the hero gets its knobs beside it. Show before building.
4. **Splash: the glyph-field HANGAR wordmark dissolves into the coverflow.** No click-through.

## Identity, restated for this screen

- Ground is true black. One accent, acid lime (~#D6FF4E). A third colour has to earn itself.
- The glyph-field texture (dense `x o + □ ◦` mosaics with lime rectangles punched through, halftone
  grain) is the **splash**, not the coverflow's background — the coverflow is calm black so the
  pads read as light.
- Wide-tracked uppercase for the wordmark; the coverflow's headline is mixed-case and quiet.
- Motion-forward: the pads move constantly; `prefers-reduced-motion` stills them to a
  representative frame.

## Engineering consequences (for the planner)

- Phase 4's deliverable is **splash → coverflow → choose → `TRY ON DEVICE`**, not a grid. The
  render budget is 5–7 visible pads at once, which fits the shared-rAF / `ImageData` plan; side
  pads may run at reduced tick or frame rate, the centre pad runs the full simulator with
  mouse-as-finger.
- The name plate carries the config's name and is the only navigation on the first screen; deep
  links (CAT-01) still resolve to a config, landing with that config centred.
- The "sophisticated catalog" (sort, search, tags, detail view — CAT-02/03, D2/D3/D6/D7) is
  **deferred to its own later phase**; Phase 4 ships the front door.
- `TRY ON DEVICE` appears on choose, wired to the Phase 2 transport, but the real install flow
  (snapshot, PUT BACK, KEEP ON DEVICE) is Phase 7 with its hardware checkpoint — until then the
  control exists and explains what it will do.
- New configurations (Phase 8) appear in the row as they land; the row is the catalog data file
  (CAT-04) in coverflow order, featured first.
