// The words My configs puts beside a record (plan 13-13, PDF page 4): the
// TYPE column's sentence-case label, the LAST EDITED column's timestamp in
// words, and the two status words - Draft and Saved - for the two objects
// section 9 keeps apart. Pure functions, no browser, no catalog: the type
// label takes the entry's first tag from the caller, who has the listing.
//
// TWO WORDS FOR TWO OBJECTS, NEVER ONE FOR THREE. `Draft` is drafts.ts's
// object and `Saved` is library.ts's; the third object - what is on the
// device - is the install store's and never appears in this table. The
// literal "Saved" lives HERE and not in a store module, because
// local.spec.ts test 9 scans the 13-06 stores for it and this is a screen's
// word, not a record's.
//
// THE TIMESTAMP IS THE PDF'S THREE FORMS: `Today, 10:42` (the day the page
// is read), `Yesterday`, and `8 Sep 2026` for anything earlier - one
// formatter, 24-hour, English month abbreviations, no locale call so the
// e2e title and the prerendered document agree. The resume banner's
// `Last edited 12 minutes ago` is the intro card's relativeTime
// (src/lib/ui/intro/card.ts) and is not duplicated here.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

import type { RecordKind } from "$lib/store/schema";

/** Section 9's two words, as the STATUS chip shows them. PDF page 4, verbatim. */
export const STATUS_WORDS = {
  draft: "Draft",
  saved: "Saved",
} as const;

export type Status = keyof typeof STATUS_WORDS;

/** The PDF's second line under every name. Verbatim. */
export const RECORD_SUBLINE = "ZONA · Personal configuration";

/** The PDF's type for a Sandbox record. Verbatim. */
export const CUSTOM_SURFACE = "Custom surface";

/**
 * The TYPE column: `Custom surface` for a surface, the entry's category for
 * a Playground record - the caller hands over the FOR label it already
 * derives (13-08's FOR_LABELS through forLabel), or nothing when the entry
 * has left the catalog, in which case the kind is said plainly.
 */
export function typeLabel(kind: RecordKind, category?: string): string {
  if (kind === "sandbox") return CUSTOM_SURFACE;
  return category ?? "Playground";
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * `Today, 10:42` / `Yesterday` / `8 Sep 2026`, in the reader's local time.
 * An unreadable moment reads `earlier`, the same word relativeTime uses,
 * rather than `Invalid Date`.
 */
export function editedInWords(editedAt: string, now: Date): string {
  const then = new Date(editedAt);
  if (Number.isNaN(then.getTime())) return "earlier";
  if (sameDay(then, now)) {
    return `Today, ${pad2(then.getHours())}:${pad2(then.getMinutes())}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(then, yesterday)) return "Yesterday";
  return `${then.getDate()} ${MONTHS[then.getMonth()]} ${then.getFullYear()}`;
}

/** `12 saved configurations` - the PDF's count line; one reads in the singular. */
export function countLine(n: number): string {
  return n === 1 ? "1 saved configuration" : `${n} saved configurations`;
}
