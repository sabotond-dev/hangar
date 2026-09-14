// /sandbox/ - the Sandbox's front door (13-16): creates or resumes; the surface is edited at
// /sandbox/[draftId]/. Prerendered like every section root: the document carries the header, the nav
// with SANDBOX current and the breadcrumb as data (13-07's pattern), and the page's effect decides
// where to go - the newest sandbox draft in the visitor's store, or a freshly minted surface id (`?new`
// forces a fresh one). The decision reads the browser store, so it cannot be made here.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { PageLoad } from "./$types";

export const prerender = true;

export const load: PageLoad = () => ({
  shell: {
    variant: "app" as const,
    section: "sandbox" as const,
    breadcrumb: ["SANDBOX"],
    status: "Build a surface. Every element is yours to shape.",
  },
});
