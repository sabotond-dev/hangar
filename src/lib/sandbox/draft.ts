// The surface as a DRAFT (Bible section 9; KEEP-01): the SandboxRecord shape,
// written through drafts.ts as the surface is edited and read back on return.
// One draft per surface: a sandbox record's `source` is the surface's own id,
// so draftIdFor("sandbox", surface.id) is the one key it lives under and the
// route's `/sandbox/[draftId]/` param names what it opens. A refusing store
// degrades to an unsaved session, not an error - drafts.ts returns false, the
// route keeps editing and the context bar says DRAFT_UNSAVED; nothing here
// throws. The same wiring would serve a Playground draft (drafts.ts is
// kind-generic); who wires it is 13-13's open question 5, not answered here.
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
