/**
 * THE SHELL'S NUMBERS, WRITTEN ONCE (13-CONTEXT D-01, D-14 Q9, D-17). Every
 * proportion the frame draws is declared here and imported; no shell
 * component writes any of these numbers, and shell.spec.ts reads the frame's
 * resolved values against this module. The pixel figures were taken off the
 * PDF's pages 2 to 5 as raster images at a 1500px render width (plus or minus
 * 10%). The PDF's 224 / 820 / 456 supersedes the specification's 200 /
 * flexible / 300 (D-14 Q9: the inspector's 2 x 2 grid is 402px and does not
 * fit in 300), so the inspector is a fraction of the viewport, clamped, and
 * section 13's table is re-derived as fractions with the breakpoints kept. The
 * type scale is the PDF's measured 36 / 30 / 17 (D-17; app.css's .type-* roles).
 * Decided at 13-05; see .planning/phases/13-gui-overhaul/13-05-SUMMARY.md
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

/** Left rail, x 0 to 224 at 1500. Fixed at 1440 and above. */
export const RAIL_W = 224;

/** The compact rail at 1024-1439: section 7's own 200. */
export const RAIL_COMPACT_W = 200;

/** Right inspector, x 1044 to 1500 at 1500: 456 wide, about 0.304 of the viewport. */
const INSPECTOR_W = 456;
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
 * The grid fits from 454 (402 plus two 26px insets); the PDF's 456 holds it
 * with 2px to spare (shell.spec.ts). The clamp floor of 380 does not, and the
 * fraction at 1440 (438 less 52 = 386) does not either: the two-column grid
 * fits only from about 1494px of viewport. A finding, not a fix (13-05);
 * D-21 answers it below with a reflow rather than a higher floor.
 */
export const GRID_FITS_INSPECTOR = NUMERIC_GRID_W + INSPECTOR_INSET * 2;

/**
 * D-21 ("reflow"): the floor stays at 380 and the 2 x 2 numeric grid is two
 * columns when the inspector is at least this wide, one column below. Written
 * once here and read by TuningRegion.svelte through a ResizeObserver (a
 * container query cannot read a custom property; tune-ui.spec.ts asserts the
 * number is written in no component). Nothing else changes shape at this width.
 */
export const NUMERIC_GRID_REFLOW = GRID_FITS_INSPECTOR;

/** Section 7: "a practical maximum around 600px" for the surface. */
export const SURFACE_MAX = 600;

/**
 * THE INTRO FITS THE SCREEN (13.1-CONTEXT D-01: "always fit on the screen").
 * The numbers the intro's fit arithmetic reads, handed to Intro.svelte as
 * UNITLESS custom properties. The centre is the height the viewport leaves
 * after the header and footer AS THEY RENDER (a 100dvh flex column, never a
 * calc on FOOTER_H - the footer renders taller than its minimum); INTRO_UNIT
 * is one PDF pixel at the current height, min(1px, 100cqh / INTRO_FIT_H); the
 * TYPE scales with the unit down to its floors (headline 34, sub-lines 15,
 * card titles 18), the SPACING on a steeper ramp that reaches zero at
 * INTRO_SQUEEZE_FROM, so gaps give before words do; the hero's square takes
 * the smaller of its column's width and its row's height. Below the compact
 * band the columns stack and the phone may scroll. INTRO_FIT_H is measured
 * off the tree (937 at any wide viewport, chromium 2026-09-12), 21 taller than
 * the PDF's 916 because 13-07 stacks the strip's number above its word.
 * Decided at 13.1-01; see .planning/phases/13.1-bench-corrections-four/13.1-01-SUMMARY.md
 */
export const INTRO_FIT_H = 937;

/** The intro's block padding at the PDF's 1500 render: 57 under the header, 48 above the strip's foot (13-07). */
export const INTRO_PAD_TOP = 57;
export const INTRO_PAD_BOTTOM = 48;

/** The gap between the columns and the strip: 44 (13-07). */
export const INTRO_GAP = 44;

/**
 * The strip's padding between its rule and the numbers. The strip's height is
 * its content's, never fixed, so a font change cannot clip it.
 */
export const INTRO_STRIP_PAD = 32;

/**
 * The spacing ramp's foot: the fraction of INTRO_FIT_H at which every
 * spacing in the intro has shrunk to zero. Chosen so the four desktop
 * viewports the bench names (1920 x 1080, 1440 x 900, 1366 x 768, 1280 x
 * 720) all fit and the words column fills its row at the tightest of them
 * (0.45 left 99px of slack at 1280 x 720 with the headline at its floor;
 * 0.3 leaves about 16), and stated so a later measurement can move it by
 * name. Type is floored separately and does not read this.
 */
export const INTRO_SQUEEZE_FROM = 0.3;

/**
 * The words column's floor, in px. The PDF's two columns are 638 : 619
 * across a 96 gutter, and at the compact band's foot (1024 wide) the
 * proportional share is 398px, at which the two start cards' bodies wrap
 * onto a second line and the column runs 16px into the strip at 1024 x 768
 * (measured 2026-09-12). At 460 the bodies hold one line. The hero's column
 * gives the width: at every compact height its square is height-bound and
 * its column has room to spare. Read by Intro.svelte's .columns as the
 * first track's minimum; it never binds above about 1150px of viewport.
 */
export const INTRO_WORDS_MIN_W = 460;

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
/**
 * The invisible hit square under each drawn handle (13.1-03, D-03): 8 is the
 * PDF's drawn size; a fingertip's target is 44, but the plate's cell pitch
 * is 63 and a 44 square over a corner would swallow most of the four cells
 * around it - the click-to-select and the area start must stay reachable
 * beside a handle. 16 keeps the cell clickable and doubles the target.
 */
export const SANDBOX_HANDLE_HIT = 16;
export const SANDBOX_LABEL_SIZE = 11;
/**
 * The plate's delete icon (change 10A): a small square in the action colour
 * off the selection's top-right corner, its hit the 44px target of section 14
 * (it sits off the region, so it swallows no handle and no cell of its own).
 */
export const SANDBOX_DELETE_ICON = 20;
export const SANDBOX_DELETE_HIT = 44;

/** The lock glyph on a locked element (change 13A): a 12px padlock inside the region's top-right corner. */
export const SANDBOX_LOCK_ICON = 12;

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
