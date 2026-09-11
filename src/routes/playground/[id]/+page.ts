// One address per configuration (CAT-01, 04-CONTEXT D-12; widened by D-07;
// moved under /playground/ by D-20; the workspace since 13-09).
//
// `entries()` is what makes this a real prerendered page rather than a route
// that only exists once JavaScript has run. vite.config.ts's
// `prerender.entries: ["*"]` expands only routes with no required dynamic
// parameter, so without this export the crawler would never visit /playground/anything
// and adapter-static would emit no file.
//
// AMENDMENT (D-07, plan 05.1-05). This used to generate one page per FRONT_DOOR
// entry - eight - so the seven hand-authored Lua configurations and Trackpad
// had no address at all. It now generates one page per CATALOG entry, read as
// LISTING/ROUTED from src/lib/catalog/listing.ts. Trackpad is included
// deliberately (D-11): its page renders the dark pad honestly, with the
// resting-black sentence beneath it, rather than being hidden.
//
// The routed set has exactly ONE declaration - `ROUTED` in listing.ts - because
// four files need it (this one, scripts/gen-og.mjs, src/lib/og/build.spec.ts
// and e2e/artifacts.e2e.ts) and three files deciding it for themselves is three
// chances to disagree. Widening this file alone would ship eight pages whose
// og:image 404s with nothing red anywhere.
//
// THE SHELL'S SHAPE TRAVELS AS DATA (plan 13-07's pattern, 13-08's for the
// gallery): the prerendered document carries the header, the nav with
// PLAYGROUND current and the context bar's breadcrumb - PDF page 5's
// `PLAYGROUND / ARC`, the entry's name upper-cased because a breadcrumb is a
// short label (D-05). The status zone is left to 13-10 and 13-11, whose
// draft and device sentences it carries on the PDF; the rail and the
// inspector are snippets and arrive with the page's effect.
//
// This module still imports the LIGHT catalog module on purpose.
// src/lib/catalog/listing.ts imports nothing at runtime - its one specifier is
// an `import type` of ./front-door - exactly as front-door.ts does, because
// whatever this file imports lands in the client bundle of a page whose whole
// job is to paint quickly. src/lib/config-shape.spec.ts test 13 (source) and
// test 14 (built artefact) both hold that line.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { LISTING, listingIndex } from "$lib/catalog/listing";

export const prerender = true;

/** One page per routed entry. Trackpad included (D-11): its page renders the dark pad honestly. */
export function entries() {
  return LISTING.map((entry) => ({ id: entry.id }));
}

/**
 * `index` is -1 for an address nobody has heard of. That is not an error: the
 * page renders the rail and says so, rather than being a dead end
 * (04-UI-SPEC, Routes and deep links).
 */
export function load({ params }: { params: { id: string } }) {
  const index = listingIndex(params.id);
  const listed = index === -1 ? undefined : LISTING[index];
  return {
    id: params.id,
    index,
    shell: {
      variant: "app" as const,
      section: "playground" as const,
      breadcrumb:
        listed === undefined
          ? ["PLAYGROUND"]
          : ["PLAYGROUND", listed.name.toUpperCase()],
    },
  };
}
