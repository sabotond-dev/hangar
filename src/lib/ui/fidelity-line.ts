// The site's fidelity claim, in one place.
//
// 44 characters since plan 10-03, 231 before it, and asserted
// character-for-character, so two copies of it is one copy too many. It lived
// inside FidelityLine.svelte until plan 05.1-08 put /playground/ on the screen - a second
// page that has to state the same thing beneath its grid (05.1-UI-SPEC.md W-13)
// - and a claim the site makes twice is a claim that can drift.
//
// IT IS A MODULE RATHER THAN A PROP for the reason src/lib/share/url.ts gives:
// a component may name a module statically only if that module names nothing
// under src/vendor/, @intechstudio or the compile surface. This one imports
// NOTHING AT ALL, which is the strongest form of that, and it is why both a
// prerendered browse page and a coverflow component can read it.
//
// IT IS A CONSTANT RATHER THAN MARKUP TEXT. Prettier reflows text inside an
// element and this sentence is measured; Phase 2 lost a load-bearing sentence
// to exactly that (02-05-SUMMARY.md).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/**
 * 10-UI-SPEC Copywriting Contract 13.2, verbatim, with a real U+2019. 44
 * characters, counted by script.
 *
 * RETIRED AT 231 AND REWRITTEN AT 44, plan 10-03 (R-04). THE CLAIM SURVIVED
 * AND THE APOLOGY DID NOT - 187 characters are gone deliberately rather than
 * by accident, so a reader diffing the two forms is not left wondering.
 *
 *  - PREV-03's claim is the first sentence, and it is kept whole: the pads on
 *    this site run the firmware's own code. That is the load-bearing half, it
 *    is the one a visitor can act on, and it is the one the site would be
 *    lying about if it were wrong.
 *  - The retired half listed what a screen cannot show - LED colour,
 *    diffusion, touch feel. Three of the site's clauses spent on pre-empting a
 *    disappointment nobody has had yet, in a paragraph beneath a wall of
 *    animating pads that demonstrates the point better than the sentence
 *    apologised for it (D-08, and the audit rule: retired only when the pixels
 *    beside it already say the same thing).
 *
 * It stays unconditional wherever it appears - a fidelity claim that only
 * turned up beside the pads that flatter it would not be one - and it still
 * appears in both of its two places, the coverflow's FidelityLine.svelte and
 * /playground/'s line beneath the grid.
 */
export const FIDELITY_LINE = "Every pad here runs the firmware’s own code.";
