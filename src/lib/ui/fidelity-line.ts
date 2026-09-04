// The site's fidelity claim, in one place.
//
// 231 characters, and they are asserted character-for-character by more than
// one suite, so two copies of it is one copy too many. It lived inside
// FidelityLine.svelte until plan 05.1-08 put /browse/ on the screen - a second
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
 * 04-UI-SPEC Copywriting Contract, verbatim, with a real U+2019.
 *
 * What the simulator matches exactly, and what a screen cannot show. It is
 * unconditional wherever it appears - a fidelity claim that only turned up
 * beside the pads that flatter it would not be one.
 */
export const FIDELITY_LINE =
  "Every pad here runs the firmware’s own code, compiled exactly as it would be written to a ZONA. What a screen cannot show: the real colour of the lights, the way they bleed into each other, and how the surface feels under a finger.";
