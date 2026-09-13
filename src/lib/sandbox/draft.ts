// The surface as a DRAFT (plan 13-16; Bible section 9; KEEP-01): the record
// shape 13-13 defined, written through 13-06's drafts.ts as the surface is
// edited and read back on return.
//
// ONE DRAFT PER SURFACE. A sandbox record's `source` is the surface's own
// id, so `draftIdFor("sandbox", surface.id)` is the one key it lives under
// and opening the same surface twice finds the same draft. The route's
// address carries the surface id (`/sandbox/[draftId]/`, the param named
// for what it opens), and this module spells the store key out of it.
//
// A REFUSING STORE DEGRADES TO AN UNSAVED SESSION, NOT AN ERROR. drafts.ts
// returns false when the store declined the read or the write; the route
// keeps editing the surface it holds and the context bar says so
// (DRAFT_UNSAVED) - the honest line, not a dialog. Nothing here throws.
//
// THE SAME WIRING WOULD SERVE A PLAYGROUND DRAFT. drafts.ts is already
// kind-generic (`playground:{entry}` beside `sandbox:{surface}`); what the
// workspace lacks is a caller that writes its knob vector through
// writeDraft on change and reads it back on open, which is the shape of
// `saveSurfaceDraft` and `readSurfaceDraft` below with a PlaygroundRecord in
// place of a SandboxRecord. 13-13's question 5 (who wires it) stands; this
// module does not answer it for the Playground, only shows the wiring is
// one function each way.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { draftIdFor, readDraft, writeDraft } from "../store/drafts";
import type { LocalStore } from "../store/local";
import { SCHEMA_VERSION, type SandboxRecord } from "../store/schema";
import type { Surface } from "./model";

/** A surface id nobody else has: the moment in base 36 and a little entropy. */
export function mintSurfaceId(now: number = Date.now()): string {
  const entropy = Math.floor(Math.random() * 36 * 36 * 36).toString(36);
  return `s-${now.toString(36)}-${entropy}`;
}

/** The store key a surface's draft lives under. */
const surfaceDraftId = (surfaceId: string): string =>
  draftIdFor("sandbox", surfaceId);

/** The draft's surface, or undefined when none is stored or the store refused. */
export function readSurfaceDraft(
  store: LocalStore | undefined,
  surfaceId: string,
): Surface | undefined {
  const draft = readDraft(store, surfaceDraftId(surfaceId));
  if (draft === undefined || draft.kind !== "sandbox") return undefined;
  return draft.surface;
}

/** The record the surface travels as. `createdAt` is kept by drafts.ts when one exists. */
function surfaceRecord(surface: Surface, at: string): SandboxRecord {
  return {
    schema: SCHEMA_VERSION,
    id: surfaceDraftId(surface.id),
    name: surface.name,
    kind: "sandbox",
    source: surface.id,
    surface,
    createdAt: at,
    editedAt: at,
  };
}

/** Write the surface as its draft. False when the store refused - the caller says so. */
export function saveSurfaceDraft(
  store: LocalStore | undefined,
  surface: Surface,
  at: string,
): boolean {
  return writeDraft(store, surfaceRecord(surface, at), at);
}
