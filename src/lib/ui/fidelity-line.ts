// The site's fidelity claim, in one place: 44 characters, asserted character
// for character, read by FidelityLine.svelte and by /playground/'s line beneath
// the grid, so a claim the site makes twice cannot drift. A module rather than
// a prop because a component may name a module statically only if it names
// nothing under src/vendor/, @intechstudio or the compile surface - this one
// imports NOTHING AT ALL. A constant rather than markup text because prettier
// reflows text inside an element and this sentence is measured.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/**
 * 10-UI-SPEC Copywriting Contract 13.2, verbatim, with a real U+2019. 44
 * characters, counted by script. Retired at 231 and rewritten at 44 at 10-03
 * (R-04): PREV-03's claim - the pads run the firmware's own code - is kept
 * whole, and the apology for what a screen cannot show is gone. Unconditional
 * wherever it appears.
 */
export const FIDELITY_LINE = "Every pad here runs the firmware’s own code.";
