// The share URL: one origin, one helper, and nothing that navigates. IMPORTS
// NOTHING AT ALL, as a requirement: the chunk guard (config-shape.spec.ts)
// matches the specifier text of every import under src/lib/ui/, so a component
// may name a module statically only if that module names nothing under
// src/vendor/, @intechstudio or $lib/pad, and naming nothing is the strongest
// form of that. The price is two restated literals, each held against its
// source by url.spec.ts (the protocol-pin.ts pattern). COPY LINK composes this
// string and puts it on the clipboard; nothing navigates, so no activation
// window is crossed by an await. Stepping to another entry drops the stamp -
// the workspace route replaces the URL without a fragment - and that is correct.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/**
 * The deployed origin. Held against `scripts/deploy.mjs` by `url.spec.ts`.
 *
 * A shared link has to name an absolute origin: it is going into somebody
 * else's chat window, not into this page's address bar.
 */
export const SITE_ORIGIN = "https://hangar.sabotond.workers.dev";

/**
 * The vendored `STAMP_PREFIX`. Held against `_pad.ts` by `url.spec.ts`.
 *
 * The stamp lives in the fragment and never in the query string (D-12).
 */
export const STAMP_PREFIX = "z.";

/**
 * The link a visitor copies.
 *
 * The trailing slash is canonical: `trailingSlash = "always"` in
 * `src/routes/+layout.ts`, so `/playground/aurora/` is the real address and the
 * slash-less form Kit's `resolve()` returns is not what a shared link carries.
 *
 * `undefined` means the defaults, and the defaults get NO fragment - a URL with
 * no fragment IS the base configuration, which is both prettier and exactly
 * what SHARE-01 restores.
 */
export function shareUrl(id: string, stamp: string | undefined): string {
  const fragment =
    typeof stamp === "undefined" ? "" : `#${STAMP_PREFIX}${stamp}`;
  return `${SITE_ORIGIN}/playground/${id}/${fragment}`;
}
