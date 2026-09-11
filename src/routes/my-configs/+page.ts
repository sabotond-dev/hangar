// My configs declares its shell shape as DATA, so the prerendered document
// carries the header, the nav with MY CONFIGS current and the context bar's
// breadcrumb and sentence (plan 13-13; the pattern 13-07 established for /
// and 13-08 for /playground/).
//
// The library itself is never in the prerendered document: it lives in the
// visitor's browser store and is read from onMount. What the server renders
// is the frame, the headline and the empty table's sentence; the rows arrive
// with the effect. prerender and trailingSlash are inherited from +layout.ts.
// This module imports a type and nothing else.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { PageLoad } from "./$types";

export const load: PageLoad = () => ({
  shell: {
    variant: "app" as const,
    section: "my-configs" as const,
    breadcrumb: ["MY CONFIGS", "YOUR LIBRARY"],
    status: "Your configurations, ready for the next session.",
  },
});
