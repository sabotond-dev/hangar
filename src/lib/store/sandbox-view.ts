// The plate's view toggles (change 13C, BENCH-2026-09-16.txt section 13, suggestion 12): whether
// the controller numbers and the names are drawn on the surface, per viewer. One envelope under
// SANDBOX_VIEW_KEY (schema.ts's SandboxView), read whole and validated whole - a corrupt or
// foreign envelope reads as the plate as it was, both shown. The store is an ARGUMENT and every
// function is a no-op on undefined (local.ts's three rules). Not a surface edit: nothing here is
// in the history, and a draft never carries it.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readJson, writeJson, type LocalStore } from "./local";
import {
  DEFAULT_VIEW,
  SANDBOX_VIEW_KEY,
  isSandboxView,
  type SandboxView,
} from "./schema";

export { DEFAULT_VIEW };

/** The stored toggles, or both on for an absent, corrupt or refusing store. */
export function readSandboxView(store: LocalStore | undefined): SandboxView {
  return readJson(store, SANDBOX_VIEW_KEY, isSandboxView) ?? DEFAULT_VIEW;
}

/** Write the envelope whole. `false` when the store refused. */
export function writeSandboxView(
  store: LocalStore | undefined,
  view: SandboxView,
): boolean {
  return writeJson(store, SANDBOX_VIEW_KEY, view);
}
