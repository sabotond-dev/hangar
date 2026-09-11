// The intro declares its shell shape as DATA, so the prerendered document
// carries the header (plan 13-07).
//
// WHY THIS FILE EXISTS. src/routes/+layout.svelte renders the shell's chrome
// from shell.svelte.ts's fill, and a route fills it from an effect - which
// runs in the browser and never on the server. On the server the layout's
// `{#if fill}` is evaluated BEFORE the page's script runs (the page is
// rendered as the layout's children, after that branch), so a fill set by
// the page could never reach the prerendered HTML: `/` would ship without a
// header and grow one at hydration, a 76px shift on the site's first
// impression. `page.data` is the one channel a page has that the layout can
// read during the same server render, so the intro's shape goes through it.
// The snippets the fill carries (the Quick guide link) cannot travel as data
// and arrive with the effect; the frame itself does not move.
//
// prerender and trailingSlash are inherited from +layout.ts. This module
// imports nothing.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { PageLoad } from "./$types";

export const load: PageLoad = () => ({
  shell: { variant: "intro" as const },
});
