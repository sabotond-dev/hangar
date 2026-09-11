// The gallery declares its shell shape as DATA, so the prerendered document
// carries the header, the nav with PLAYGROUND current and the context bar's
// breadcrumb (plan 13-08, the pattern 13-07 established for /).
//
// The layout renders the shell's chrome from shell.svelte.ts's fill, and a
// route fills it from an effect - which never runs on the server, while the
// layout's `{#if fill}` is evaluated before the page's script runs at all.
// `page.data` is the one channel a page has that the layout can read during
// the same server render, so the frame's shape goes through it; the rail
// snippet cannot travel as data and arrives with the effect, and the frame
// itself does not move when it does.
//
// THIS LOAD READS NOTHING FROM THE URL, DELIBERATELY. The page's own header
// records why: Kit disables `url.search` and `url.searchParams` while
// prerendering, and this route is prerendered. The query string is read by
// the page, once, at component init, behind a `browser` guard.
//
// prerender and trailingSlash are inherited from +layout.ts. This module
// imports a type and nothing else.
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
