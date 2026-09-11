// The share URL: one origin, one helper, and nothing that navigates.
//
// THIS MODULE IMPORTS NOTHING AT ALL, and that is a requirement rather than a
// coincidence. Phase 4's chunk guard (`src/lib/config-shape.spec.ts` test 13)
// matches the SPECIFIER TEXT of every import in `src/lib/ui/`, so a component
// may name a module statically only if that module names nothing under
// `src/vendor/`, `@intechstudio` or `$lib/pad`. Naming nothing at all is the
// strongest form of that. The price is two restated literals below, each held
// against its real source by `url.spec.ts` - the `src/lib/protocol-pin.ts`
// pattern, used three times already in this repository.
//
// PHASE 5 NEVER WRITES THE URL HASH, and its absence is a gift. SHARE-05 (knob
// drags update the hash) is deferred, so `COPY LINK` composes this string and
// puts it on the clipboard; nothing navigates; `Coverflow`'s route logic is
// untouched exactly as D-13 requires; the `svelte/no-navigation-without-resolve`
// rule is never engaged and needs no suppression; and Safari's transient
// activation window is never crossed by an await. One decision, four problems.
//
// THE CONSEQUENCE, stated so nobody files it as a bug later: STEPPING TO
// ANOTHER ENTRY DROPS THE STAMP, because `Coverflow.svelte`'s `syncAddress()`
// replaces the URL with `resolve("/playground/[id]", ...)`, which has no fragment. That
// is correct. A different entry is a different configuration.
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
