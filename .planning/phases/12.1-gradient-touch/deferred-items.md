# Phase 12.1 - deferred items

Out-of-scope discoveries logged by executors, not fixed in the plan that found them. Each names the
plan that found it and the plan expected to take it.

## From 12.1-08a (2026-09-11)

- **`src/lib/catalog/library.ts` section 5 - the caller lists for `N` and `G` are now incomplete.**
  `N`'s reads "Callers: ARC's stop tap (12.1-03, `N(x,y)==40`) and 13-15's region lookup, named in
  advance"; `G`'s reads "Callers, each named: EUCLID, STEPS, RADAR POINTS, SONAR (12.1-03), CHORUS,
  MORPH, CONSOLE, LUMEN (12.1-04) - eight". GHOST calls `N` twice (the erase key in the Setup, the
  comet / ghost cell in the Timer) and `G` once since 12.1-08a. Not edited by 12.1-08a because the
  run's brief forbade touching `library.ts` short of a Rule-1 bug. **For 12.1-08b**, which rewrites
  `N`'s paragraph when it moves `N` to 255/0 (R-20) and can add GHOST to both lists in the same edit.
- **`src/lib/catalog/entries/arc.ts:207-208` - "ARC is `N`'s one caller today and the reason it
  ships; 13-15's region lookup is the named second."** GHOST is a second caller since 12.1-08a.
  `arc.ts` is not in 12.1-08a's file set. **For 12.1-08b** (or 13-19, which re-cases entry names and
  touches every entry header).

## From 12.1-08b (2026-09-11)

- **12.1-08a's first item is resolved.** `library.ts` section 5 was rewritten by 12.1-08b: `N`'s
  paragraph names ARC, GHOST (twice), the vendored compiler's zone and fader emission and 13-15;
  `G`'s names the eight hand-authored callers, GHOST and the compiler's glow emission. **12.1-08a's
  second item stands**: `src/lib/catalog/entries/arc.ts:207-208` ("ARC is `N`'s one caller today")
  is still stale - `arc.ts` was not in 12.1-08b's file set either, and it is a comment. **For
  13-19**, which re-cases entry names and touches every entry header.
- **FOUR FADERS' level stays the raw sensor value (12.1-CONTEXT D-14, extended by 12.1-VALIDATION
  R-22).** The calibrated form `local v=127-U(y,KY)*127//512` for `local v=127-y` measures **540
  against 525** at the defaults (+15, the compiler's own Setup with the needle substituted, pinned
  minifier, `checkSyntax` true), 368 free. Not taken: what a DAW receives from an instrument is not
  changed silently. `docs/HARDWARE-AUDITION.md` row 28(d) asks the user whether the raw top and
  bottom bother them; a "yes" is one emission site in `_pad.ts`'s fader branch (a declared manifest
  row) and its mirror in `pad-sim.ts`'s `fadersBody`, plus the FOUR FADERS cost row. **For the gate
  (12.1-09) to carry as a bench answer.**
- **`reachability.sweep.spec.ts`'s NINE PADS margin literal moved 271 -> 260** with the reason
  beside it. The reporting weakness 12-05 recorded (Pass B ranks the dearest colour at the 4x4
  default and misses the three characters 255,255,255 costs at 3x3) is unchanged: the true worst
  NINE PADS state is 651 of 908 (640 + 11), 257 free, and the sweep reports 648. Still nothing at
  risk; still not a hole in the guard. Recorded so the next reader of that comment does not take
  "260" for the true figure.
