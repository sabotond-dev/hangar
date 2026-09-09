# Phase 11 — decisions

Answers given by the user on 2026-09-09, after `11-RESEARCH.md` measured the
options. Each records what was chosen **and what it costs**, because three of the
four override something this project had previously locked.

---

## D-01 [user] The facet vocabulary loses two FOR terms rather than its rule

The nine removals drop `play`, `drums` and `clips` to exactly one entry each,
against a spec that asserts **zero singletons** — "the one number D-10 was raised
about". Chosen: **retire two of the three thin FOR terms and re-home `ninepads`
and `stage`** onto surviving terms, landing at **eight FOR terms with every one
carrying two or more entries**.

The rule survives untouched, which is the point: it was raised deliberately and a
phase that removes entries is exactly when it would be most tempting to weaken.

**Costs, which the planner owns:** a facet rename in browse copy; the migration
path for any shared link carrying a retired term (Phase 10 already built a
`?for=`/`?feels=` migration, so there is precedent to follow rather than invent);
and re-tagging two entries in a way that still describes how they *feel*, per
CONT-03, not merely to satisfy arithmetic.

**Also recorded:** `precise` and `still` land at exactly **6**, the FEELS floor. A
tenth removal ever breaks a FEELS rule as well. Nobody should discover that
during a later phase.

---

## D-02 [user] `src/vendor/` may be edited, and the byte-pin is dropped

AURORA's residual glow and STARFIELD's stuck colour come from the decay defect
inside the **vendored compiler's** `comet` / `bloom` codegen, where residue
reaches **125**. The user chose to edit the vendored tree rather than convert
those two presets to hand-authored Lua or leave them broken.

**This reverses a constraint that several things lean on**, and the boundary
matters more than the permission:

### What may change

**The compiler's emitted constants** — the start/rate pairs `comet`, `perFinger`,
`bloom` and `disturb` generate. A pair whose timeout does not divide 252 exactly
can never reach zero, and emitting one is a **codegen bug**.

### What may NOT change, and this is the load-bearing half

**The simulator's phase walk is not the bug and must not be "fixed".**
`pad-sim.ts:883-891` reproduces `grid_led.c:190-211` line for line: `pha += fre`
on a `uint8_t`, which **wraps**. That wrap is the firmware's real behaviour. The
simulator is correct; the configs were choosing pairs that firmware semantics can
never land on zero. Changing the walk would make the preview *less* faithful
while appearing to fix the symptom — and firmware fidelity is most of why this
project vendored the simulator at all.

### What the planner must add, because the pin is what protected it

Dropping the byte-pin without a replacement means the next BOTOR re-sync silently
reverts these fixes or conflicts opaquely. **The divergence must become a record,
not an absence:** the `vendored-diff` suite (14 tests) and `VENDOR.md` currently
assert `git diff --stat HEAD -- src/vendor/` is empty, and that assertion has to
be replaced by an *enumerated, justified* diff — every edited hunk named, with
its reason — so a re-sync is a merge rather than an archaeology exercise.

Licensing is unaffected: HANGAR already ships GPLv3 as a derivative work, so
editing vendored GPL sources changes nothing about the obligations.

---

## D-03 [user] RADAR and SONAR both get built, overlap accepted

RADAR's bench note is near word for word SONAR's — a sweep that fires note-on and
note-off as it crosses user-placed points. The user chose **both**, knowing they
will resemble each other.

The planner does not get to quietly differentiate them to make the catalog tidier.
If a difference emerges from the geometry — rings from the centre versus a line
sweeping across — that is a fine reason for them to look different, but neither
may be given a job the user did not ask for.

---

## D-04 [user] SHUTTLE is redesigned, not explained

"Don't understand how it works, rework" is a verdict on the **behaviour**, not on
its discoverability. SHUTTLE is thrown out and re-authored from scratch, the same
treatment GHOST gets.

Both are therefore blank-page entries in a phase that is otherwise corrections,
and both should be planned as authoring work with the budget costed up front
rather than as fixes.

---

## Still open, and not decided here

Carried from `11-RESEARCH.md` for the planner to raise at the right moment rather
than guess:

- **ARC** — "press the centre it stops" describes behaviour the source does not
  have. Either the user is describing something else, or an entry is doing
  something unintended.
- **STAGE** — "lining up breathing is missing" has two readings: a broadcast
  preview, or corners deliberately out of phase.
- **LUMEN** — "the colour depth / opacity doesn't work" is not yet reproduced.
- **Clock sync** (EUCLID, SONAR, STEPS, RADAR) is blocked twice over:
  `docs/MIDI-IN-PROBE.md` still reads "Results: None yet", and even a yes leaves
  those cards **unpreviewable**, because HANGAR's Lua host has no MIDI in at all.
- **`gmss` (sysex) is not among the fifteen host globals**, so LUMEN's
  hex-over-sysex needs a `lua-host.ts` addition. `gmms` / `gmbs` / `gks` are the
  template.
- **Nine dead `/c/<id>/` links** after the removals — prerendered routes and OG
  images keyed by id.
- **DIAL is exactly symmetric in the simulator** (192 messages each way, values 65
  and 63). The strong hypothesis is signed-bit relative mode, where 63 reads as
  **+63** — one bench question the user can answer in a minute.
- **Four faders was never tested.** No verdict is invented for it anywhere.

## One thing to rescue before it is deleted

The correct decay idiom — *the decay length divides 252* — is documented in
`life.ts`, **one of the nine files being removed**. Move that comment somewhere
permanent before the deletion wave runs.
