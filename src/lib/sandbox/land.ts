// The surface's landing: the five strings a Sandbox surface installs, in the
// SAME shape the tuner publishes for a catalog entry (ConfigStrings, keyed as
// sequence.ts's SLOTS keys them), so the install store cannot tell which
// producer it is reading - there is no second write path, and the store sees a
// `name`, never a kind. Write order: 255/6 systemTimer and 255/0 system (under
// five slots, change 10B, the TRIMMED library halves carrying runtime parts -
// library-trim.ts; the full halves under two or three), 255/4 systemUtility
// (a runtime slot; the empty string under two slots, which the store fills
// with the firmware's page-next), 0/6 timer, 0/0 setup. Measured at the picker
// corner (cost.ts), canonicalised, refused before the wire when any string is over 908 (TUNE-05).
// Decided at 13-17 (D-18 / D-19, three slots); see .planning/phases/13-gui-overhaul/13-17-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { TOUCH_LIBRARY, TOUCH_LIBRARY_TIMER } from "../catalog/library";
import {
  EVENT_BUDGET,
  atPickerCorner,
  canonical,
  measureSurface,
  type Budget,
  type MeasuredSurface,
} from "./cost";
import { emitSurface, type EmitOptions } from "./emit";
import type { Surface } from "./model";

/** The slots a surface lands on since change 10B: the touch Timer, 255/4 and the two trimmed system halves (answer 12). */
export const LANDING_SLOTS = 5 as const;

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

/** Which string is over the budget, and by how much - the first in write order; the Sandbox's sentence carries no number (change 10A). */
export type SurfaceRefusal = {
  readonly word: "System timer" | "System" | "Utility" | "Timer" | "Setup";
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
  const inOrder: readonly [SurfaceRefusal["word"], Budget | undefined][] = [
    ["System timer", measured.systemTimer],
    ["System", measured.system],
    ["Utility", measured.mapmode],
    ["Timer", measured.timer],
    ["Setup", measured.setup],
  ];
  for (const [word, b] of inOrder) {
    if (b !== undefined && b.used > EVENT_BUDGET) {
      return { word, used: b.used, over: b.used - EVENT_BUDGET };
    }
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
  const text = async (lua: string | undefined) =>
    lua === undefined ? undefined : (await canonical(lua)).text;
  const [setup, timer, utility, systemTimer, system] = await Promise.all([
    text(own.setup),
    text(own.timer),
    text(own.mapmode),
    text(own.systemTimer),
    text(own.system),
  ]);
  return {
    config: {
      // Under five slots the halves are the trimmed library with the runtime
      // parts the packer gave them; under fewer, the full library verbatim.
      systemTimer: systemTimer ?? TOUCH_LIBRARY_TIMER,
      system: system ?? TOUCH_LIBRARY,
      systemUtility: utility ?? "",
      setup: setup as string,
      timer: timer as string,
    },
    label: surface.name,
    measured,
    refusal: refusalOf(measured),
  };
}
