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
 * roles in src/app.css (36 / 30 / 17); this header is the single place the
 * decision and its provenance are stated.
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
 * THE INTRO FITS THE SCREEN (plan 13.1-01; 13.1-CONTEXT.md D-01; bench line
 * 1, 2026-09-12, verbatim: "I dont want the index page to be scrollable,
 * always fit on the screen"). The numbers the intro's fit arithmetic reads,
 * declared here like every other shell number and handed to Intro.svelte as
 * UNITLESS custom properties, because the CSS multiplies them by a length.
 *
 * HOW THE FIT WORKS, in one paragraph. src/routes/+layout.svelte makes the
 * intro's centre the height the viewport leaves after the header and the
 * footer AS THEY RENDER (a 100dvh flex column, never an arithmetic on
 * FOOTER_H: the footer is min-block-size FOOTER_H and renders taller - its
 * licence row is a second 44px line - so a calc on the constant would leave
 * 71px of document scroll). The centre is a size container and the intro
 * reads its height as 100cqh. INTRO_UNIT, in CSS, is one PDF pixel at the
 * current height: min(1px, 100cqh / INTRO_FIT_H). Every vertical measure in
 * the intro is the PDF's number times a scale: the TYPE scales with the unit
 * and is floored (the headline never below 34px, the sub-lines 15, the card
 * titles 18; the micro and helper roles never scale); the SPACING scales with
 * a steeper ramp that reaches zero at INTRO_SQUEEZE_FROM of the PDF's height,
 * so gaps give before words do; the hero's square is the smaller of its
 * column's width and the height its row leaves (HeroSurface.svelte, cq units
 * on the square's own stage). Below the compact band (1024) none of this
 * applies: the columns stack (13-07) and the phone may scroll - D-01 is the
 * user's rule about the desktop, and deferred-items D.10 (surface first on a
 * phone) is still open.
 *
 * WHAT GIVES WHEN THE VIEWPORT IS SHORT, in order: the spacings (the intro's
 * paddings and gap, the words column's margins, the cards' padding, the
 * strip's padding) along the ramp; the type down to its floors; the hero's
 * surface, which takes whatever height the row leaves. Nothing 13-07 pinned
 * is hidden at any height. Below a centre of about INTRO_SQUEEZE_FROM x
 * INTRO_FIT_H (about 280px, a desktop viewport under about 480px tall with
 * the shell's header and footer) the spacings are zero and the type is at its
 * floors, and the intro overflows its box and is clipped by the centre's
 * overflow: hidden - a desktop that short is not one the bench named, and it
 * is stated here rather than promised away. At a centre TALLER than
 * INTRO_FIT_H the strip stays at the foot and the columns row grows: the
 * hero panel stretches with it and its square, width-bound by then, sits
 * centred in the room the panel's two text rows leave.
 *
 * INTRO_FIT_H IS MEASURED OFF THE TREE, NOT THE PDF, and the difference is
 * stated: PDF page 1 at the 1500px render is 1042 tall and its centre (less
 * the 76 header and the PDF's 50 footer) is 916; the intro as 13-07 built it
 * at the PDF's numbers renders 937 tall at any wide viewport (measured in
 * chromium, 2026-09-12: pad 57 + the hero's 681 + gap 44 + the strip's 107
 * + pad 48), 21 taller than the PDF's page because 13-07 stacks the strip's
 * number above its word where the PDF sets it beside, and the hero's two
 * rows are a few pixels taller than the PDF's. At a centre of 937 or more
 * nothing scales and the intro is exactly 13-07's. MEDIUM confidence, a
 * raster-and-DOM measurement like every other figure here.
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
