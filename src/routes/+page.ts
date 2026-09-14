// The intro declares its shell shape as DATA so the prerendered document carries the header (13-07):
// the layout's `{#if fill}` is evaluated on the server before the page's script runs, and page.data is
// the one channel the layout can read during the same render; the snippets (the Quick guide link)
// arrive with the effect. prerender and trailingSlash are +layout.ts's. This module imports a type.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { PageLoad } from "./$types";

export const load: PageLoad = () => ({
  shell: { variant: "intro" as const },
});
