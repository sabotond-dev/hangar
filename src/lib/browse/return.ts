// The way back: one record, under one key, holding where the visitor was on
// /playground/ (W-20, D-08). /playground/ writes it before navigating to a
// /playground/<id>/ route; the detail page reads it to decide BACK TO BROWSE
// against BROWSE ALL; /playground/ consumes it on arrival. Four rules: (1) it is
// a SESSION store - the caller passes sessionStorage, so a new tab gets no back
// control; (2) the href is written from the page's live state, never read from
// the address bar (the address trails by 500 ms); (3) returning is a `goto` with
// the scroll restored, never `history.back()`; (4) the record is consumed on
// arrival. The store is an argument and this module imports nothing (every
// function a no-op on undefined - the pages are prerendered); nothing throws.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** Where the visitor was on `/playground/`, and how far down it. */
export type BrowseReturn = {
  /** The full browse URL including its query string. */
  readonly href: string;
  readonly scrollY: number;
};

/**
 * Anything with the three methods. In the browser this is the session store; in
 * a test it is three closures over a Map; during prerender it is `undefined`.
 */
export type ReturnStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** One key, namespaced, so nothing else in the origin can collide with it. */
export const BROWSE_RETURN_KEY = "hangar:browse-return";

/**
 * The recorded way back, or `undefined` if there is not one worth offering.
 *
 * Never throws. A `JSON.parse` that fails, a value that is not an object, a
 * missing or non-string `href`, and a `scrollY` that is not a finite number all
 * read as `undefined`. THE SHAPE IS CHECKED RATHER THAN TRUSTED: a record with
 * no `scrollY` would otherwise reach the caller and be restored against, and
 * `window.scrollTo(0, undefined)` scrolls to the top - the visitor's position
 * lost silently, which is exactly the failure D-08 exists to prevent.
 *
 * An empty `href` is rejected too. It is falsy, it would render a control that
 * navigates nowhere, and no correct writer produces one.
 *
 * A `scrollY` of zero IS a record: the visitor was at the top of the catalog and
 * that is where they should land.
 */
export function readBrowseReturn(
  store: ReturnStore | undefined,
): BrowseReturn | undefined {
  if (typeof store === "undefined") return undefined;

  let raw: string | null;
  try {
    raw = store.getItem(BROWSE_RETURN_KEY);
  } catch {
    // A browser refusing storage is not an error a catalog page reports.
    return undefined;
  }
  if (raw === null) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Somebody else's data under our key, or a half-written value.
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null) return undefined;

  const record = parsed as { href?: unknown; scrollY?: unknown };
  if (typeof record.href !== "string" || record.href === "") return undefined;
  if (typeof record.scrollY !== "number") return undefined;
  if (!Number.isFinite(record.scrollY)) return undefined;

  return { href: record.href, scrollY: record.scrollY };
}

/**
 * Record where the visitor is, immediately before leaving browse.
 *
 * Two fields and no more. A previous record is replaced rather than merged:
 * there is one way back at a time, and it is the most recent one.
 *
 * A non-finite `scrollY` that somehow reaches here is written as JSON `null` by
 * `JSON.stringify` and is refused on the way back out, so a bad number can never
 * reach a scroll even though the type says it cannot happen.
 */
export function writeBrowseReturn(
  store: ReturnStore | undefined,
  record: BrowseReturn,
): void {
  if (typeof store === "undefined") return;
  try {
    store.setItem(
      BROWSE_RETURN_KEY,
      JSON.stringify({ href: record.href, scrollY: record.scrollY }),
    );
  } catch {
    // Over quota, or a private window that refuses to store. The visitor loses
    // the back control and keeps the page.
  }
}

/**
 * Forget the way back.
 *
 * Called on arrival at `/playground/` once the record has been consumed, and by the
 * detail page when the visitor leaves for anything that is not browse. Clearing
 * something that was never written is a no-op, so no caller has to check first.
 */
export function clearBrowseReturn(store: ReturnStore | undefined): void {
  if (typeof store === "undefined") return;
  try {
    store.removeItem(BROWSE_RETURN_KEY);
  } catch {
    // As above: a store that refuses is not a failure the page reports.
  }
}
