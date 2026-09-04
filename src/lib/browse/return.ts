// The way back: one record, under one key, holding where the visitor was.
//
// W-20 and D-08 in three functions. `/browse/` writes this immediately before it
// navigates to a `/c/<id>/` route; the detail page reads it to decide whether its
// header slot says BACK TO BROWSE or BROWSE ALL; `/browse/` consumes it on
// arrival.
//
// FOUR RULES THE PAGE RELIES ON. They are decisions, not implementation details.
//
//  1. IT IS A SESSION STORE. In the browser the argument is `sessionStorage`,
//     never the persistent one, so a middle-click into a new tab correctly gets
//     no back control: in a new tab there is nothing to go back to and offering
//     it would be a lie. It also means the record dies with the tab rather than
//     greeting a visitor next week with a browse view they have forgotten.
//
//  2. THE RECORD IS WRITTEN FROM THE PAGE'S OWN STATE, NOT FROM THE ADDRESS BAR.
//     The browse address is projected on a 500 ms trailing timer (see
//     `./query.ts`), so a card clicked 200 ms after a chip toggle would record a
//     view that is one toggle stale. Composing the href out of the live state at
//     the moment of leaving - `"/browse/?" + serialiseBrowseQuery(state)` -
//     removes that race instead of racing it. The href is therefore an
//     ARGUMENT here: this module never reads an address of its own.
//
//  3. RETURNING IS A `goto`, NEVER A `history.back()`. Phase 4's
//     `Coverflow.choose()` pushes a history entry, so a visitor who arrived from
//     browse and then tapped the pad is two entries deep, and a back-by-one
//     lands them on the un-chosen detail page rather than on browse. The control
//     calls `goto(record.href, { noScroll: true })` and then restores
//     `record.scrollY` explicitly - deterministic however many entries the
//     detail page collected. 05.1-UI-SPEC.md adds `replaceState: true` to that
//     same call so the round trip does not grow the history; both are the page's
//     to make in wave 9, and neither of them is `history.back()`, which stays
//     reserved for the browser's own Back button.
//
//  4. THE RECORD IS CONSUMED ON ARRIVAL AT `/browse/`. Kit's own back-button
//     restoration already targets the offset this record holds, so the two
//     cannot disagree; the record exists for the FORWARD hop, which gets no
//     restoration at all. It survives a reload of the detail page - the way back
//     is still there, which is a virtue - and the detail page clears it when the
//     visitor leaves for anything that is not browse.
//
// THE STORE IS AN ARGUMENT AND THIS MODULE IMPORTS NOTHING. `/browse/` is
// prerendered, so the component that calls these functions renders on a server
// where no storage of any kind exists; every function is a no-op on `undefined`
// rather than making each caller remember a guard. That is the same injection
// `HostDeps` uses in `src/lib/sim/host.ts`, for the same reason: it is what makes
// the module testable in node with no jsdom. `return.spec.ts` scans this file
// with its comments removed and fails on any specifier at all, or on the name
// above appearing in code rather than in this header.
//
// NOTHING HERE THROWS. A malformed record, a browser refusing storage in a
// private window, a quota that is full: all of them degrade to "no way back
// offered". This runs on a page whose job is to paint, and a way back is a
// courtesy - it may never be the reason a catalog fails to render.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** Where the visitor was on `/browse/`, and how far down it. */
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
 * Called on arrival at `/browse/` once the record has been consumed, and by the
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
