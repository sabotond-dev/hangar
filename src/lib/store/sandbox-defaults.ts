// The Sandbox's sticky defaults (change 13B, BENCH-2026-09-16.txt section 13, suggestion 8): the
// settings the user last gave each kind, so the next new element of that kind starts from them.
// One envelope under SANDBOX_DEFAULTS_KEY, one record per kind (schema.ts's KindDefaults), read
// whole and validated whole - a corrupt or foreign envelope reads as empty and is replaced by
// the next write. The store is an ARGUMENT and every function is a no-op on undefined (local.ts's
// three rules). The editor keeps the same shape in memory and hands it here on every change;
// the reset removes the key. Not a surface edit: nothing here is in the history.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readJson, removeKey, writeJson, type LocalStore } from "./local";
import {
  NO_DEFAULTS,
  SANDBOX_DEFAULTS_KEY,
  isSandboxDefaults,
  type SandboxDefaults,
} from "./schema";

export { NO_DEFAULTS };

/** The stored defaults, or the empty envelope for an absent, corrupt or refusing store. */
export function readSandboxDefaults(
  store: LocalStore | undefined,
): SandboxDefaults {
  return (
    readJson(store, SANDBOX_DEFAULTS_KEY, isSandboxDefaults) ?? NO_DEFAULTS
  );
}

/** Write the envelope whole. `false` when the store refused. */
export function writeSandboxDefaults(
  store: LocalStore | undefined,
  defaults: SandboxDefaults,
): boolean {
  return writeJson(store, SANDBOX_DEFAULTS_KEY, defaults);
}

/** Reset defaults: the key removed. `true` when the store accepted the removal. */
export function resetSandboxDefaults(store: LocalStore | undefined): boolean {
  return removeKey(store, SANDBOX_DEFAULTS_KEY);
}
