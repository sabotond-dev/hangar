// The Sandbox's clipboard (change 13A, BENCH-2026-09-16.txt section 13): the regions Ctrl+C or
// Ctrl+X took, as clones with their settings and colour, so Ctrl+V lands them on THIS surface or
// another one opened later in the same tab. Two homes, one reader: the module's own slot (the
// route navigates inside the app, so it outlives a surface) and, when the caller hands one in,
// the SESSION store under CLIPBOARD_KEY (a reload keeps the clipboard; a new tab starts empty -
// browse/return.ts's precedent, the namespaced `hangar:` key family). The store is an ARGUMENT
// and every function is a no-op on undefined (local.ts's three rules); the content is validated
// on the way back in through schema.ts's own isRegion, so a foreign value reads as empty. Ids are
// the originals' and are re-minted by the editor's paste; nothing here names a surface.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readJson, writeJson, type LocalStore } from "../store/local";
import { isRegion, type Region } from "../store/schema";

/** What the clipboard holds: the regions as they were, in surface order. */
export type ClipboardContent = {
  readonly regions: readonly Region[];
};

/** The session store's key, namespaced like `hangar:browse-return`. */
export const CLIPBOARD_KEY = "hangar:sandbox-clipboard";

/** The in-memory home: the last content written in this page's life. */
let held: ClipboardContent | undefined;

export function isClipboardContent(value: unknown): value is ClipboardContent {
  if (typeof value !== "object" || value === null) return false;
  const regions = (value as { regions?: unknown }).regions;
  return (
    Array.isArray(regions) && regions.length > 0 && regions.every(isRegion)
  );
}

/** Hold the content in memory and, when a store is given, in the session. */
export function writeClipboard(
  store: LocalStore | undefined,
  content: ClipboardContent,
): void {
  held = content;
  writeJson(store, CLIPBOARD_KEY, content);
}

/** The content, memory first, then the session store; undefined when neither holds one. */
export function readClipboard(
  store: LocalStore | undefined,
): ClipboardContent | undefined {
  if (held !== undefined) return held;
  const stored = readJson(store, CLIPBOARD_KEY, isClipboardContent);
  if (stored !== undefined) held = stored;
  return stored;
}

/** Forget the in-memory content (a test's reset; the session key is the caller's to remove). */
export function clearClipboard(): void {
  held = undefined;
}
