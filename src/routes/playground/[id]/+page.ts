// One address per configuration (CAT-01; 04-CONTEXT D-12; under /playground/ by D-20; the workspace
// since 13-09). `entries()` is what makes this a real prerendered page: vite.config.ts's
// `prerender.entries: ["*"]` expands only routes with no required parameter, so without it the crawler
// would never visit /playground/anything. One page per CATALOG entry, read as LISTING / ROUTED from
// src/lib/catalog/listing.ts (D-07); Trackpad included (D-11). ROUTED has exactly one declaration,
// because four files need it. The shell's shape travels as data (13-07's pattern): the breadcrumb
// is `PLAYGROUND / <NAME>` upper-cased (D-05); the rail and the inspector arrive with the page's effect.
// This module imports the LIGHT catalog module only - listing.ts imports nothing at runtime - because
// whatever it imports lands in the client bundle; config-shape.spec.ts tests 13 and 14 hold that line.
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
