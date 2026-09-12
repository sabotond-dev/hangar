// The surface's landing: the five strings a Sandbox surface installs, in the
// SAME shape the tuner publishes for a catalog entry (plan 13-17; 13-CONTEXT
// D-03, D-18, D-19; BUILD-03, BUILD-05, SAFE-01, SAFE-07, TUNE-05).
//
// THIS IS THE THIRD PRODUCER OF ONE SHAPE, AND THERE IS NO SECOND WRITE PATH.
// `src/lib/tune/model.ts` publishes a `ConfigStrings` on every landing - the
// preset route's and the Lua route's (`landLua`, the summaries' name for
// `measureLuaRoute`'s `land(...)`) - and `src/lib/device/install.svelte.ts`
// consumes exactly that: five strings, keyed as sequence.ts's SLOTS keys them,
// handed to `observeConfig` and `tryOnDevice(config, name)`. A surface lands
// the same five keys in the same order through `landSurface` below, and the
// install store cannot tell which producer it is reading - install.spec.ts
// asserts the consumption path is one path (the same step ids, the same
// frames, the same phases, and no branch on a kind anywhere in the store).
// `sequence.ts`'s writeAll, writeBack, fetchAll, storeToFlash and targetOf are
// not touched; the surface's install is the one writer's fifteen phases,
// four actions and two legs, and its snapshot is the same snapshot.
//
// THE FIVE STRINGS, IN WRITE ORDER (13-15's hand-off; SLOT-ARITHMETIC.md;
// D-18's second probe):
//
//   255/6  systemTimer    TOUCH_LIBRARY_TIMER  the library's second half
//   255/0  system         TOUCH_LIBRARY        the library's first half -
//                                              the runtime calls E, G, N, U
//                                              and X by name, so a surface
//                                              lands the library exactly as
//                                              a Lua entry does
//   255/4  systemUtility  the packer's 255/4   the runtime's head, R, O and
//                                              the branches that fit (three
//                                              slots), pulled in by the
//                                              Setup's `ele[#ele]:map()`
//   0/6    timer          the packed Timer     gtt(0,100), the rest of the
//                                              runtime, the expiry sweep
//   0/0    setup          the data half        J, M, the paint, the pull-ins,
//                                              self.touch_cb=O
//
// Under two slots (`slots: 2`, the emitter's own default) 255/4 is the EMPTY
// STRING and the install store substitutes the firmware's page-next in one
// place (#pageUtility) - 12-03's placement, the shape every catalog entry
// takes - so the module's utility button keeps turning the page. Under three
// slots, the shipped default here, the button runs the runtime's second
// slot while the surface is installed and PUT BACK restores whatever the
// module held. Both are D-19's consequence and constants.ts's header says
// them plainly.
//
// THE LABEL, NOT A KIND. The store takes a `name` beside the config for its
// captions and its live sentences (`liveSettled(name)`); a surface's label is
// its name, and that is the only thing about the surface the store ever
// sees. A field that said "this is a surface" would be the beginning of a
// second write path, so no such field exists in this shape.
//
// MEASURED AT THE PICKER CORNER, CANONICALISED, REFUSED BEFORE THE WIRE
// (TUNE-05, applied to a producer it had never seen). `measured` is cost.ts's
// measurement of the surface with every region at level 15 on all three
// channels, so a colour rail can never push a surface the meter said fitted
// over the budget; the strings that go on the wire are the surface's OWN
// colours, run to the minifier's fixed point. When any string is over 908
// `refusal` names WHICH string and BY HOW MUCH, and the route disables Apply
// on it; the install store refuses a Setup or Timer at the limit on its own
// (`#tryRefusal`), and install.spec.ts asserts the frame count is ZERO. What
// pushed a surface over is an ELEMENT: names are never emitted (the wire
// carries J, M and the paint, not a name) and colours are measured at their
// dearest already, so the sentence the meter shows names the last element
// and offers its removal (copy.ts `overElementLine`). Under three slots the
// runtime fits every combination of kinds (13-15's table), so the only
// string that can go over is the Setup, and only past a dozen elements.
//
// REACHED THROUGH await import(): this module pulls the minifier's gate
// (cost.ts -> pad/ready) and the library into its chunk, and the Sandbox
// route paints its plate before a visitor has touched Apply.
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
