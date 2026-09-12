// /sandbox/[draftId]/ - one surface, edited (plan 13-16).
//
// A DYNAMIC SEGMENT ON A STATIC HOST, ANSWERED HERE RATHER THAN AT DEPLOY.
// The layout says `prerender = true` for the site; this route says
// `prerender = false`, and that is the whole shape:
//
//   - The crawler cannot enumerate surface ids: they are minted in the
//     visitor's browser and live in the visitor's store, so there is no
//     `entries()` to export (contrast /playground/[id]/, whose ids are the
//     catalog's and are prerendered one file each). A route marked
//     prerenderable that the crawler never reaches fails `vite build`
//     (Kit's `handleUnseenRoutes` defaults to "fail"); marking it NOT
//     prerenderable is the honest declaration, and the build emits no file
//     for it.
//   - adapter-static is configured with `fallback: "404.html"`
//     (vite.config.ts), so a route that is not prerendered is served by the
//     fallback page: Cloudflare's static assets return build/404.html with
//     status 404 for any path no file matches (wrangler.jsonc's
//     `not_found_handling: "404-page"`), that document boots the SvelteKit
//     client, the client router matches /sandbox/[draftId]/ and runs THIS
//     load in the browser. It is exactly the path an unknown
//     /playground/<id>/ takes today (e2e/first-experience.e2e.ts asserts
//     the 404 status and the page coming up), so nothing new is asked of
//     the host: the HTTP status is 404 and the page is real.
//   - `ssr = false` because there is no server to render it and the load
//     reads nothing a server could: the surface comes from localStorage in
//     the page's onMount. The fallback document carries the layout's frame
//     (the header, the nav, the footer) and the page fills the rest with
//     its effect, as every app route does since 13-05.
//
// The param is named for what the address opens - the draft - and carries
// the SURFACE's id, which is the draft's `source`; src/lib/sandbox/draft.ts
// spells the store key (`sandbox:{id}`) out of it. A surface id nobody has
// stored opens an EMPTY surface under that id, which is how /sandbox/
// creates one: it mints an id and comes here.
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
