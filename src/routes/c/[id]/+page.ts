// One address per configuration (CAT-01, 04-CONTEXT D-12).
//
// `entries()` is what makes this a real prerendered page rather than a route
// that only exists once JavaScript has run. vite.config.ts's
// `prerender.entries: ["*"]` expands only routes with no required dynamic
// parameter, so without this export the crawler would never visit /c/anything
// and adapter-static would emit no file. It is generated from FRONT_DOOR, so a
// new row entry gets its own page with no build-config change at all.
//
// This module imports the LIGHT catalog module on purpose.
// src/lib/catalog/front-door.ts deliberately imports nothing - not the vendored
// shelf, not @intechstudio/grid-protocol - because whatever this file imports
// lands in the client bundle of a page whose whole job is to paint quickly.
// src/lib/config-shape.spec.ts test 13 holds that line.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { FRONT_DOOR, frontDoorIndex } from "$lib/catalog/front-door";

export const prerender = true;

/** One page per row entry. Excluded entries get none, by design. */
export function entries() {
  return FRONT_DOOR.map((entry) => ({ id: entry.id }));
}

/**
 * `index` is -1 for an address nobody has heard of. That is not an error: the
 * page renders the shelf centred on its first entry and says so, rather than
 * being a dead end (04-UI-SPEC, Routes and deep links).
 */
export function load({ params }: { params: { id: string } }) {
  return { id: params.id, index: frontDoorIndex(params.id) };
}
