// The gallery declares its shell shape as DATA so the prerendered document carries the header, the nav
// with PLAYGROUND current and the breadcrumb (13-08; the pattern 13-07 established): the layout's
// `{#if fill}` is evaluated on the server before the page's script runs, and page.data is the one
// channel the layout can read during the same render; the rail snippet arrives with the effect.
// This load reads nothing from the URL: Kit disables url.search while prerendering, so the page reads
// the query once at component init behind a `browser` guard. This module imports a type.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { PageLoad } from "./$types";

export const load: PageLoad = () => ({
  shell: {
    variant: "app" as const,
    section: "playground" as const,
    breadcrumb: ["PLAYGROUND", "CONFIGURATIONS"],
    status: "Browse. Preview. Make it yours.",
  },
});
