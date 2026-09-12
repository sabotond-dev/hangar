/**
 * THE SHELL'S NUMBERS, WRITTEN ONCE (plan 13-05, 13-CONTEXT.md D-01, D-14 Q9,
 * D-17). Every proportion the frame draws is declared here and imported;
 * no shell component writes any of these numbers itself, and shell.spec.ts
 * reads the frame's resolved values against this module rather than against
 * a retyped table.
 *
 * PROVENANCE, AND THE CONFIDENCE THAT COMES WITH IT. The pixel figures below
 * were taken by 13-RESEARCH.md section 1 off bible/HANGAR for ZONA.pdf pages
 * 2 to 5 READ AS RASTER IMAGES AT A 1500px RENDER WIDTH. They are MEDIUM
 * confidence for that reason - a raster measurement, not a vector one - and
 * should be read as plus or minus 10%. The centre surface on page 3 measures
 * 571 square, just under the specification's "practical maximum around
 * 600px", which is what puts the render at or near 1:1 with a 1500px design
 * viewport rather than the 1440 the specification's section 7 is written for.
 *
 * THE SPECIFICATION'S 200 / FLEXIBLE / 300 IS SUPERSEDED BY D-14 Q9. Section
 * 7 says "start with a 200px rail, a flexible center, and a 300px inspector"
 * at 1440, and section 13's whole responsive table is keyed to a 300-340px
 * inspector. The PDF draws 224 / 820 / 456 at 1500 - an inspector about 50%
 * wider than the specification allows. D-01 makes the PDF primary on look,
 * and the reason is arithmetic rather than taste: the inspector's 2 x 2
 * numeric grid on page 3 is two 190px fields plus a 22px gutter, 402px,
 * which does not fit in 300 and would collapse to one column. So the
 * inspector is a fraction of the viewport, clamped, and section 13's table is
 * re-derived below as fractions with the breakpoints kept.
 *
 * SECTION 13's TWO INSPECTOR BANDS, QUOTED AGAINST THE RIGHT ROWS
 * (bible/HANGAR-ZONA-GUI-design-specification.md:362-363): 300-340px at 1440
 * and above; 268-300px at 1024-1439. At 1440 and above the PDF's fraction
 * wins (about 30%, clamped 380-456) - above the specification's own 300-340
 * for that row, by D-14 Q9. At 1024-1439 the specification's own 268-300
 * IS the band used: the 402px grid does not fit there either, but neither
 * does a 456px inspector beside a usable surface at 1024, so the row keeps
 * the specification's figure and the grid is the inspector's to reflow.
 *
 * THE TYPE SCALE IS THE PDF's MEASURED 36 / 30 / 17 (page title / panel
 * title / group title), taken off the PDF at 1440. Section 12's WRITTEN
 * 28-32 / 20 / 14 is OVERRIDDEN BY MEASUREMENT per D-17 - overridden, not
 * reconciled: the two are about 20% apart and nothing was averaged. D-14 Q9
 * had settled only the inspector width on the PDF's authority; the planner
 * extended that to the type scale and, per D-01, asked rather than assumed,
 * and the user chose the PDF's. 13-03 declares the sizes as the .type-*
 * roles in src/app.css; this header is the single place the decision and
 * its provenance are stated, and TYPE_SCALE below is the one export both
 * identity.spec.ts and shell.spec.ts may read.
 *
 * THE TWO SECTION 13 RULES THAT ARE NOT WIDTHS, because they are the easiest
 * to lose: touch targets are sized by pointer capability - "(pointer:
 * coarse)" raises every target to COARSE_TARGET - and never by viewport
 * width; and an orientation change must not reset work. The first is a test
 * (shell.spec.ts test 6 asserts the media query's own text). The second is
 * not reachable from a unit test and is recorded as untested in
 * 13-05-SUMMARY.md; the e2e suite's viewport work is where it would go.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */

/** The render width every pixel figure below was measured in. */
export const MEASURED_AT = 1500;

/** Header band, y 0 to 76 on PDF pages 2-5. Fixed. */
export const HEADER_H = 76;

/** Context bar, y 76 to 135. Fixed. Breadcrumb left, status centre, destination right. */
export const CONTEXT_H = 59;

/** Footer, about 50 tall: HANGAR / by intech studio left, the two links right. Fixed. */
export const FOOTER_H = 50;

/** Left rail, x 0 to 224 at 1500. Fixed at 1440 and above; RAIL_FR is its provenance. */
export const RAIL_W = 224;

/** The rail as the PDF's fraction of its viewport, about 0.149. Recorded, not used for layout. */
export const RAIL_FR = RAIL_W / MEASURED_AT;

/** The compact rail at 1024-1439: section 7's own 200. */
export const RAIL_COMPACT_W = 200;

/** Right inspector, x 1044 to 1500 at 1500: 456 wide, about 0.304 of the viewport. */
export const INSPECTOR_W = 456;
export const INSPECTOR_FR = INSPECTOR_W / MEASURED_AT;

/** The wide band's clamp (1440 and above): the PDF's fraction, never below 380 nor above the PDF's 456. */
export const INSPECTOR_MIN = 380;
export const INSPECTOR_MAX = INSPECTOR_W;

/** The compact band's clamp (1024-1439): section 13's own 268-300 (:363). */
export const INSPECTOR_COMPACT_MIN = 268;
export const INSPECTOR_COMPACT_MAX = 300;

/**
 * The 2 x 2 numeric grid on PDF page 3: two 190px fields and a 22px gutter,
 * 402px. The arithmetic D-14 Q9 rests on, kept here so it is never re-derived
 * from memory.
 */
export const NUMERIC_FIELD_W = 190;
export const NUMERIC_GUTTER = 22;
export const NUMERIC_GRID_W = NUMERIC_FIELD_W * 2 + NUMERIC_GUTTER;

/** The inspector's inset on PDF page 3, measured at 26 each side. */
export const INSPECTOR_INSET = 26;

/**
 * THE GRID FITS FROM 454, AND THE PLAN'S FLOOR IS 380 - A FINDING, NOT A
 * FIX (13-05, 2026-09-11). 402 plus two 26px insets is 454: the PDF's 456
 * holds the grid with 2px to spare, which is the arithmetic D-14 Q9 rested
 * on and shell.spec.ts test 5 asserts. But the plan's clamp floor of 380
 * does not hold it (380 - 52 = 328), and neither does the fraction at the
 * 1440 breakpoint (0.304 x 1440 = 438, less 52 = 386): the two-column grid
 * fits only from about 1494px of viewport (454 / 0.304). Below that the
 * grid must reflow to one column or its fields must narrow - which is the
 * inspector's schema renderer's (13-09) to do, and the user's to know - or
 * the floor must rise to 454, which makes the wide inspector all but fixed.
 * Recorded here and asserted as a known shortfall in test 5 rather than
 * decided silently (D-01).
 */
export const GRID_FITS_INSPECTOR = NUMERIC_GRID_W + INSPECTOR_INSET * 2;

/**
 * D-21 (13-CONTEXT.md, given 2026-09-11, "reflow"): THE FLOOR STAYS AND THE
 * GRID REFLOWS. The inspector keeps INSPECTOR_MIN at 380; the 2 x 2 numeric
 * grid (page 5's CC number / Channel pair under MIDI output, and any other
 * two-field row the schema renders) is two columns when the INSPECTOR is at
 * least this wide and one column below. This is the arithmetic above under
 * its own name, written once here and read by the inspector's renderer
 * (TuningRegion.svelte, 13-09) through a ResizeObserver rather than as a
 * container-query literal, because a container query cannot read a custom
 * property and D-21 says the number lives here and not in a component.
 * Nothing else in the inspector changes shape at this width.
 */
export const NUMERIC_GRID_REFLOW = GRID_FITS_INSPECTOR;

/** Section 7: "a practical maximum around 600px" for the surface. */
export const SURFACE_MAX = 600;

/**
 * THE SANDBOX'S PLATE (plan 13-16): PDF page 3's outer plate, x 351 to 922
 * and y 347 to 918 at 1500 - 571 square, holding the 9 x 9 lattice at a
 * pitch of 571 / 9 = 63.4. It is the SVG's user-unit square; the element
 * scales down with the centre column and up never (the PDF's figure is the
 * ceiling, under SURFACE_MAX). The handle is the PDF's small filled square
 * on the selected region, about 8 device pixels at 1:1; the label is the
 * 11px uppercase name at the region's top-left.
 */
export const SANDBOX_PLATE = 571;
export const SANDBOX_PITCH = SANDBOX_PLATE / 9;
export const SANDBOX_HANDLE = 8;
export const SANDBOX_LABEL_SIZE = 11;

/** Section 7's 24px centre padding; the PDF measures 24-34. */
export const CENTRE_PAD = 24;

/** Section 12 and 14: 44px effective targets at (pointer: coarse). */
export const COARSE_TARGET = 44;

/** The rail row at 40 on PDF page 2 (pages 3 and 5 pitch 47-50 because their labels are 17px). */
export const RAIL_ROW_H = 40;

/** The connection control's box on pages 2-5: x 1260 to 1478, height about 37. Reserved by Header.svelte for 13-11. */
export const CONNECTION_SLOT = { inline: 218, block: 37 } as const;

/** The primary nav: about 15px, uppercase, about 0.05em tracking, a 2px underline about 2px below the box. */
export const NAV = {
  size: 15,
  tracking: 0.05,
  underline: 2,
  underlineGap: 2,
} as const;

/** The breadcrumb and every micro label: 11px uppercase tracked (app.css .type-micro). */
export const BREADCRUMB_SIZE = 11;

/** Section 13's breakpoints, kept as written: wide at 1440 and above, compact from 1024, stacked from 768, narrow below. */
export const BREAKPOINTS = [1440, 1024, 768] as const;

/**
 * D-17: the PDF's measured type scale. Section 12's written 28-32 / 20 / 14
 * is overridden by measurement, not reconciled with it. See the header.
 */
export const TYPE_SCALE = {
  pageTitle: 36,
  panelTitle: 30,
  groupTitle: 17,
} as const;

/** Section 13's four rows, named. */
export type Band = "wide" | "compact" | "stacked" | "narrow";

export interface Frame {
  band: Band;
  /** A width in px, or how the rail leaves the row: collapsible at 768-1023, a drawer below. */
  rail: number | "collapsible" | "drawer";
  /** A width in px, or where the inspector goes: below the surface at 768-1023, a bottom sheet below. */
  inspector: number | "below" | "sheet";
  /** What is left for the centre once the side regions are taken, in px. */
  centre: number;
  /** The surface's edge: the centre less its padding, never above SURFACE_MAX. */
  surface: number;
}

export function bandOf(width: number): Band {
  if (width >= BREAKPOINTS[0]) return "wide";
  if (width >= BREAKPOINTS[1]) return "compact";
  if (width >= BREAKPOINTS[2]) return "stacked";
  return "narrow";
}

const clamp = (min: number, value: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * The inspector's width at a viewport width, in the two bands where it has
 * one: the PDF's fraction, clamped to the band's limits. In the compact band
 * the fraction is above 300 at every width in the band (0.304 x 1024 = 311),
 * so the clamp resolves to 300 throughout - the band is effectively fixed at
 * the specification's upper figure, and its 268 would only bind below 881px,
 * which is outside the band. Stated rather than hidden.
 */
export function inspectorAt(width: number): number {
  const band = bandOf(width);
  const fr = INSPECTOR_FR * width;
  if (band === "wide") {
    return Math.round(clamp(INSPECTOR_MIN, fr, INSPECTOR_MAX));
  }
  return Math.round(clamp(INSPECTOR_COMPACT_MIN, fr, INSPECTOR_COMPACT_MAX));
}

/** Section 13's table, re-derived as fractions with the breakpoints kept. */
export function frameAt(width: number): Frame {
  const band = bandOf(width);
  if (band === "wide" || band === "compact") {
    const rail = band === "wide" ? RAIL_W : RAIL_COMPACT_W;
    const inspector = inspectorAt(width);
    const centre = width - rail - inspector;
    return {
      band,
      rail,
      inspector,
      centre,
      surface: Math.min(SURFACE_MAX, centre - CENTRE_PAD * 2),
    };
  }
  // Stacked and narrow: the side regions leave the row, so the centre is the
  // viewport. The rail collapses (768-1023) or becomes a drawer (below 768);
  // the inspector sits below the surface or in a bottom sheet.
  return {
    band,
    rail: band === "stacked" ? "collapsible" : "drawer",
    inspector: band === "stacked" ? "below" : "sheet",
    centre: width,
    surface: Math.min(SURFACE_MAX, width - CENTRE_PAD * 2),
  };
}

/**
 * The rail's two-digit count (36, 08, 06 on PDF page 2; 01 to 06 on page 5):
 * a formatter, not a string. Pads to two digits; ABOVE 99 IT STOPS PADDING
 * RATHER THAN TRUNCATING, so a library of 120 reads 120 and never 20. The
 * catalog is 27 today, but "All saved" counts the visitor's own library,
 * which has no ceiling. A negative or non-finite count is a caller's bug and
 * renders as 00 rather than as NaN.
 */
export function padCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "00";
  const whole = Math.floor(n);
  return whole < 100 ? String(whole).padStart(2, "0") : String(whole);
}
