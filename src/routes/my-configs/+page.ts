// My configs declares its shell shape as DATA so the prerendered document carries the header, the nav
// with MY CONFIGS current, the breadcrumb and the sentence (13-13; 13-07's pattern). The library is
// never in the prerendered document: it lives in the visitor's browser store and is read from onMount;
// the server renders the frame, the headline and the empty table's sentence. This module imports a type.
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
