// /sandbox/[draftId]/ - one surface, edited (13-16). A dynamic segment on a static host, answered
// here: `prerender = false` because the crawler cannot enumerate surface ids (minted in the visitor's
// browser; no `entries()` to export, and a prerenderable route the crawler never reaches fails
// `vite build` under Kit's `handleUnseenRoutes`); adapter-static's `fallback: "404.html"` serves the
// route as the 404 page, which boots the client, matches this route and runs THIS load in the browser -
// the path an unknown /playground/<id>/ takes (first-experience.e2e.ts asserts the 404 and the page).
// `ssr = false` because the load reads nothing a server could: the surface comes from the browser
// store in the page's onMount. The param carries the SURFACE's id (the draft's `source`; draft.ts
// spells the store key `sandbox:{id}`); an id nobody has stored opens an EMPTY surface under it.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { PageLoad } from "./$types";

export const prerender = false;
export const ssr = false;

export const load: PageLoad = ({ params }) => ({
  draftId: params.draftId,
  shell: {
    variant: "app" as const,
    section: "sandbox" as const,
    breadcrumb: ["SANDBOX"],
  },
});
