// The surface's landing: the five strings a Sandbox surface installs, in the
// SAME shape the tuner publishes for a catalog entry (ConfigStrings, keyed as
// sequence.ts's SLOTS keys them), so the install store cannot tell which
// producer it is reading - there is no second write path, and the store sees a
// `name`, never a kind. Write order: 255/6 systemTimer and 255/0 system (the
// library's two halves - the runtime calls E, G, N, U and X by name), 255/4
// systemUtility (the runtime's second slot; the empty string under two slots,
// which the store fills with the firmware's page-next), 0/6 timer, 0/0 setup.
// Measured at the picker corner (cost.ts), canonicalised to the minifier's
// fixed point, refused before the wire when any string is over 908 (TUNE-05).
// Decided at 13-17 (D-18 / D-19, three slots); see .planning/phases/13-gui-overhaul/13-17-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { TOUCH_LIBRARY, TOUCH_LIBRARY_TIMER } from "../catalog/library";
import {
  EVENT_BUDGET,
  atPickerCorner,
  canonical,
  measureSurface,
  type MeasuredSurface,
} from "./cost";
import { emitSurface, type EmitOptions } from "./emit";
import type { Surface } from "./model";

/** The slots a surface lands on since 13-17: the touch Timer and 255/4 (D-18). */
export const LANDING_SLOTS = 3 as const;

/**
 * The tuner's shape, restated here because this module may not import
 * `$lib/tune/model` for a type (a type import is still a specifier, and the
 * Sandbox's chunk must not pull the tuner in). The keys are SLOTS' keys in
 * write order; install.spec.ts asserts they equal the tuner's, key for key.
 */
export type SurfaceConfig = {
  readonly systemTimer: string;
  readonly system: string;
  readonly systemUtility: string;
  readonly setup: string;
  readonly timer: string;
};

/** Which string is over the budget, and by how much: the meter's words and Apply's reason. */
export type SurfaceRefusal = {
  readonly word: "Setup" | "Timer" | "Utility";
  readonly used: number;
  readonly over: number;
};

export type SurfaceLanding = {
  /** The five strings, the surface's own colours, canonical. */
  readonly config: SurfaceConfig;
  /** The surface's name: the store's `name` argument, and nothing else about the surface. */
  readonly label: string;
  /** cost.ts's measurement at the picker corner - what the meters show. */
  readonly measured: MeasuredSurface;
  /** Undefined when every string fits; otherwise which one does not, first in write order. */
  readonly refusal: SurfaceRefusal | undefined;
};

export type LandingOptions = Pick<EmitOptions, "slots">;

/** The first string over the budget in write order, or undefined. */
export function refusalOf(
  measured: MeasuredSurface,
): SurfaceRefusal | undefined {
  const utility = measured.mapmode;
  if (utility !== undefined && utility.used > EVENT_BUDGET) {
    return {
      word: "Utility",
      used: utility.used,
      over: utility.used - EVENT_BUDGET,
    };
  }
  if (measured.timer.used > EVENT_BUDGET) {
    return {
      word: "Timer",
      used: measured.timer.used,
      over: measured.timer.used - EVENT_BUDGET,
    };
  }
  if (measured.setup.used > EVENT_BUDGET) {
    return {
      word: "Setup",
      used: measured.setup.used,
      over: measured.setup.used - EVENT_BUDGET,
    };
  }
  return undefined;
}

/**
 * A surface -> the five strings the one writer sends, measured and
 * canonicalised. Throws only where the emitter throws (an overlapping or
 * off-surface region), which the editor never emits.
 */
export async function landSurface(
  surface: Surface,
  options: LandingOptions = {},
): Promise<SurfaceLanding> {
  const slots = options.slots ?? LANDING_SLOTS;
  const measured = await measureSurface(atPickerCorner(surface), { slots });
  const own = emitSurface(surface, { slots });
  const [setup, timer, utility] = await Promise.all([
    canonical(own.setup),
    canonical(own.timer),
    own.mapmode === undefined ? undefined : canonical(own.mapmode),
  ]);
  return {
    config: {
      systemTimer: TOUCH_LIBRARY_TIMER,
      system: TOUCH_LIBRARY,
      systemUtility: utility?.text ?? "",
      setup: setup.text,
      timer: timer.text,
    },
    label: surface.name,
    measured,
    refusal: refusalOf(measured),
  };
}
