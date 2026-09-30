// The Quick guide declares its shell shape as DATA so the prerendered document carries the header,
// the breadcrumb and the sentence (13-07's pattern, as /playground/ and /my-configs/ do), and its
// eight sections are in that document too: a deep link (/guide/#store) lands on prerendered HTML.
// A content page: the context bar and the full footer, no `fit`. The contents' rail arrives with
// the effect. prerender is declared here as well as in +layout.ts, so the page stays static if
// the layout's default ever moves (change 26). This module reads the copy and imports a type.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { GUIDE_BREADCRUMB, GUIDE_STATUS } from "$lib/guide/copy";
import type { PageLoad } from "./$types";

export const prerender = true;

export const load: PageLoad = () => ({
  shell: {
    variant: "app" as const,
    section: "guide" as const,
    breadcrumb: GUIDE_BREADCRUMB,
    status: GUIDE_STATUS,
  },
});
