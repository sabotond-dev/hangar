// /sandbox/ - the Sandbox's front door (plan 13-16): it creates or resumes,
// and the surface itself is edited at /sandbox/[draftId]/.
//
// PRERENDERED, LIKE EVERY SECTION ROOT. The nav's SANDBOX and My configs'
// `New surface` both point here; the document carries the header, the nav
// with SANDBOX current and the context bar's breadcrumb as data (13-07's
// pattern), and the page's effect decides where to go: the newest sandbox
// draft in the visitor's store, or a freshly minted surface id. `?new`
// forces a fresh surface (My configs' `New surface`). The decision reads
// the browser store, so it cannot be made here, and a prerendered page
// that then navigates is exactly what /playground/[id]'s unknown-id path
// does - the document is a real page, not a redirect.
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
