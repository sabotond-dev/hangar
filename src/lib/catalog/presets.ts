// The nine shelf presets, DECLARED BY HANGAR.
//
// WHAT MOVED AND WHAT DID NOT. `PadPreset`, `PadState` and `KnobKind` are still
// vendored types and are imported, never restated: HANGAR owns the nine VALUES
// and never the shapes. The factory below is a re-implementation of the
// twenty-line module-private `preset()` at src/vendor/botor/_pad.ts:4189-4211 -
// `defaultState()`, apply the mutator, stamp `state.preset`, normalise - and it
// calls the vendored `defaultState` and `normalisePadState` directly, so the
// nine states are still built by the vendored compiler's own rules.
//
// WHY. Reading the nine out of `PRESETS` made every bench correction to a
// preset an edit inside src/vendor/, which D-02 grants only for fidelity fixes
// with a manifest row and a written reason. Eight of the user's bench notes are
// preset-definition changes - a colour, a knob, a grid size - and none of them
// is a fidelity fix. They were unfixable here for a STRUCTURAL reason, not a
// technical one. This module is what removes that.
//
// THE VENDORED `PRESETS` ARRAY IS NOT DELETED AND IS NOT SHRINKING. It is still
// exported from src/vendor/botor/_pad.ts, it is still what
// src/lib/fidelity/preset-baseline.spec.ts and golden-frames.spec.ts measure,
// and it is still what scripts/capture-preset-baseline.mjs captures. Those are
// the PORT's gate, not the CATALOG's, and pointing them here would make them
// compare HANGAR against HANGAR.
//
// WHAT HOLDS THE TWO TOGETHER. src/lib/catalog/presets.spec.ts diffs every one
// of the nine against the vendored one field by field - `id`, `name`,
// `sentence`, `category`, `knobs`, `exclusive`, `quiet` and the whole of
// `state`, deeply - and fails on any difference not written down in its
// `INTENDED_DIVERGENCE` table with a reason, a plan and a date. Before this
// module existed, src/lib/catalog/entries/ported.ts read `name` and `sentence`
// through `presetById` so a BOTOR rename could not silently disagree. That was
// two strings. This is everything, and the price is that a divergence now has
// to be DECLARED rather than merely made.
//
// STANDING RULE, INHERITED FROM PLAN 11-04: A HANGAR-OWNED PRESET MUST NEVER
// SELECT `bloom` OR `disturb` AS ITS `touch.kind`.
// Both carry the worst cases of the class-A decay defect 11-04 repaired for the
// comet family: measured residue up to 125 of 255 on every cell a finger
// crossed, against comet's 1 to 7. Repairing them needs a per-cell timeout
// derived from a per-cell start - a change to the EMITTED SHAPE - and D-02
// grants the emitted constants, not the emitted shape. Neither is reachable
// today, because `touch.kind` is exposed as no knob on any of the nine; this
// header is what keeps that true the day somebody adds one. None of the nine
// below selects either, and presets.spec.ts holds every `state` field against
// the vendored shelf, so a change here that reached for one would have to be
// declared in writing first.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  defaultState,
  normalisePadState,
  type KnobKind,
  type PadPreset,
  type PadState,
} from "../../vendor/botor/_pad";

export type { KnobKind, PadPreset, PadState };

/**
 * The vendored `preset()` factory, re-implemented over the vendored helpers.
 *
 * The ids are the short stamp payload, so they are permanent: renaming one
 * orphans every pad that carries it. Every declared cost is asserted in
 * presets.spec.ts against the compiler's own output, because without that one
 * edit to a shared codegen helper leaves every published capacity number stale
 * with no device-free way to catch it.
 */
function preset(
  id: string,
  name: string,
  sentence: string,
  category: PadPreset["category"],
  knobs: KnobKind[],
  change: (d: PadState) => void,
  cost: { setup: number; timer: number },
  extra?: { exclusive?: boolean; quiet?: string },
): PadPreset {
  const state = defaultState();
  change(state);
  state.preset = id;
  return {
    id,
    name,
    sentence,
    category,
    knobs,
    state: normalisePadState(state),
    cost,
    ...(extra ?? {}),
  };
}

export const PRESETS: readonly PadPreset[] = [
  preset(
    "aurora",
    "Aurora",
    "A band of light crosses the pad, your finger leaves a glowing tail, and the pad sends your position.",
    "looks",
    ["colour", "speed", "direction", "size"],
    (d) => {
      // The default state was this card until plan 11-06. The user's bench
      // note is "send MIDI", and an xy stream is the one field that answers
      // it - the same field RADAR already ships for the same words.
      //
      // `fingers` is "first" and not "each" on purpose. "each" measures 320
      // against "first"'s 415, so the cheaper option was the one NOT taken:
      // a per-finger stream reads at the host as several controllers at
      // once, and the user asked for MIDI rather than for a finger policy.
      d.sends.kind = "xy";
      d.sends.fingers = "first";
    },
    { setup: 415, timer: 55 },
  ),
  preset(
    "pinwheel",
    "Pinwheel",
    "Light turns around the centre, each finger paints in its own colour, and the pad sends your position.",
    "looks",
    ["colour", "speed", "count"],
    (d) => {
      d.look.kind = "swirl";
      d.look.colour = { r: 0, g: 110, b: 255 };
      d.touch.kind = "perFinger";
      // "make this send MIDI" (bench, 2026-09-09). The per-finger paint above
      // is a LOOK; the wire policy below is deliberately "first", for the
      // reason written out on aurora.
      d.sends.kind = "xy";
      d.sends.fingers = "first";
    },
    { setup: 477, timer: 55 },
  ),
  preset(
    "starfield",
    "Starfield",
    "Every light breathes at its own pace, so the pad never repeats itself, and it sends your position.",
    "looks",
    ["colour", "feel"],
    (d) => {
      d.look.kind = "shimmer";
      d.look.colour = { r: 119, g: 153, b: 255 };
      d.touch.kind = "comet";
      // "should send midi" (bench, 2026-09-09). Same one field as aurora and
      // pinwheel, which is why the roadmap's "three of the eight need no new
      // behaviour" is four: STARFIELD's stuck colour was the hard half and
      // plan 11-04 fixed it at its source in the decay start.
      d.sends.kind = "xy";
      d.sends.fingers = "first";
    },
    { setup: 403, timer: 55 },
  ),
  preset(
    "radar",
    "Radar",
    "Rings roll out from the centre, and the pad sends your finger's position to your computer.",
    "instruments",
    ["colour", "speed", "note"],
    (d) => {
      d.look.kind = "ripple";
      d.look.colour = { r: 255, g: 68, b: 0 };
      d.touch.kind = "comet";
      d.sends.kind = "xy";
      d.sends.fingers = "first";
    },
    { setup: 445, timer: 55 },
  ),
  preset(
    "joystick",
    "Joystick",
    "Push the pad like a synth stick: left-right bends pitch, and letting go snaps everything home.",
    "instruments",
    // bend is the per-axis message switch, spring the return-on-lift
    // three-way. Colour and the CC number matter more here than speed, so
    // the look stays an Adjust-sheet edit.
    ["colour", "note", "bend", "spring"],
    (d) => {
      // Dark field, one glow dot: the dot is the stick's position, parks
      // on the home cell on lift, and the home cell is lit from power-on.
      //
      // THE TRAIL THE SAME BENCH NOTE ASKS FOR IS NOT REACHABLE BESIDE THE
      // SENTENCE ABOVE, and plan 11-06 measured that rather than assuming it.
      // The note reads "should start from the middle by default and should
      // improve the visual aspect on ZONA, maybe more led animation, trail or
      // something", and the two halves fight each other at one line of the
      // compiler: `sendsInit` emits the power-on `glp(glag(0,cell),1,255)`
      // only when `springLed` returns "glow" (_pad.ts:1951), and `springLed`
      // returns "comet" the moment `touch.kind` is "comet". So
      // `touch.kind = "comet"` buys a trail and costs BOTH the parked dot and
      // the lit-from-power-on cell. Measured over five sampled ticks with no
      // finger on the pad: glow lights 2 bytes, comet lights ZERO - the card
      // becomes a black square, which is the one property front-door.ts cites
      // for keeping tpad out of the row entirely.
      //
      // So the definite half of the note ships and the tentative half does
      // not, with the numbers on the record: comet alone 478, comet with the
      // centre rest 479, against 543 here - it is cheaper, and cheaper is not
      // the question. What IS reachable and keeps the dot is a look layer
      // behind it - ripple 652, shimmer 603, wave 621, swirl 641 of 908, all
      // animating - but that reverses the "dark field" decision above without
      // being asked to, so it is costed for the user's next bench pass rather
      // than taken here.
      //
      // ASKED AND ANSWERED AT PLAN 12-06'S CHECKPOINT, 2026-09-11. The six
      // options were re-measured at the RGB444 picker corner - the worst of
      // the 540 reachable non-colour knob states at the dearest of the 4,096
      // lattice colours, which is how reachability.sweep.spec.ts costs a card
      // - and put to the user with the front-door consequence of each:
      //
      //   option          Setup at the corner   what it moves
      //   trail (comet)   488                   the dot and the centre go;
      //                                         restsBlack; leaves the row
      //   shimmer         614                   motion -> animated
      //   wave            634                   motion -> animated
      //   swirl           653                   motion -> animated
      //   ripple          664                   motion -> animated
      //   as-is           551                   nothing
      //
      // The 543 in the paragraph above and in `cost` below is this preset
      // state at its defaults; 551 is the corner (the tuned state costs four
      // more than the preset state because withChange deletes `preset`, see
      // src/lib/tune/state.ts), and every look layer also moves the Timer
      // 24 -> 55. The answer, verbatim:
      //
      //   "as is, selectable tuning options under Trackpad"
      //
      // The first half is this card's. JOYSTICK stays exactly as 11-06 left
      // it, and the "more led animation, trail or something" half of the
      // 2026-09-09 bench note is a NAMED NON-DELIVERY with the reason on the
      // record: every option that adds motion either takes the parked dot and
      // the power-on centre away (the trail) or reverses the dark-field
      // decision above and re-points the one colour knob from the stick to a
      // background wash (the four look layers - colourTargetFor returns
      // "look" once a look is enabled), and the user chose neither. The
      // second half is TRACKPAD's and is handed to plan 12-10 by name;
      // nothing here acts on it. Re-measured 2026-09-11 at 551 of 908 at the
      // corner, 357 free, Timer 24; nothing regenerated.
      d.look.kind = "none";
      d.enabled.look = false;
      d.touch.kind = "glow";
      d.touch.colour = { r: 255, g: 187, b: 0 };
      d.sends.kind = "xy";
      d.sends.fingers = "first";
      d.sends.spring = true;
      d.sends.bend = "x";
      // THE SHIPPED ARGUMENT, KEPT VERBATIM BECAUSE PLAN 11-06 REVERSES IT
      // AND A REVERSAL NEEDS THE THING IT REVERSED STILL READABLE:
      //
      //   "The classic pitch/mod stick: the bend axis centres by definition,
      //    and the CC axis falls to zero like a mod amount. Up is more, like
      //    the fader cards, so the stick rests at the bottom-centre cell."
      //
      // The user's bench note overrules it: "should start from the middle by
      // default". springTo = "centre" moves springRestCell from 76 to 40, and
      // sendsInit lights that cell from power-on, which is the whole of the
      // ask. WHAT IT COSTS, stated rather than glossed: the Y axis no longer
      // falls to zero on lift, so a held mod amount now rests at 64 instead
      // of 0. `springTo` is ONE field on the state and not one per axis
      // (_pad.ts:312, `SpringTo = "centre" | "zero"`), so "centre on the bend
      // axis, zero on the CC axis" is not reachable in this descriptor - it
      // would be a compiler change, which D-02 does not grant here.
      d.sends.springTo = "centre";
      // invertY IS DELIBERATELY LEFT ALONE, against the plan, which pairs
      // this change with invertY = false for a saving of 4 characters.
      // springRestCell never reads invert once springTo is "centre" (both
      // axes return 4), so flipping it buys nothing for the ask and reverses
      // a SECOND decision the user did not mention - "up is more". 543 with
      // it true, 539 with it false; the extra 4 characters are the price of
      // not changing something nobody asked to change.
      d.sends.invertY = true;
    },
    { setup: 543, timer: 24 },
    {
      quiet:
        "Left-right is pitch bend and snaps back straight. Up-down is a mod amount that returns to the middle on lift.",
    },
  ),
  preset(
    "ninepads",
    "Nine pads",
    "Sixteen drum pads drawn on the lights, each one a note, with the one you are holding lit up.",
    "instruments",
    // "count" IS THE FIFTH, ADDED BY PLAN 11-06. The user's bench note is
    // "make it selectable to 4x4", and `sends.grid` already accepted "4x4" -
    // what was missing was a knob that reached it. "count" is an existing
    // member of the vendored KnobKind union (PINWHEEL's arms knob uses it), so
    // this adds a knob and never a vocabulary, and knobs.preset.spec.ts holds
    // this array against the descriptors in src/lib/tune/knobs.preset.ts.
    ["colour", "note", "scale", "amount", "count"],
    (d) => {
      d.look.kind = "none";
      d.enabled.look = false;
      d.touch.kind = "none";
      d.enabled.touch = false;
      d.sends.kind = "zones";
      // THE DEFAULT MOVES, AND 12-05 IS THE PLAN THAT MOVED IT. 11-06 read
      // "make it selectable to 4x4" as a knob and left the card shipping at
      // 3x3; the user came back with "make a 16 pads cause nothing changed",
      // which is the same ask twice and the second time in the imperative.
      //
      // WHAT 12-01 SETTLED, READ FROM ITS SUMMARY RATHER THAN ASSUMED. The
      // knob-to-wire path is GREEN at both levels: the tuner lands a different
      // pair for grid index 0 and 1 (580 and 556 characters, different bytes),
      // and a rail turned in a browser puts the TUNED Setup in the module's
      // own RAM through TRY ON DEVICE. No seam was found and nothing was
      // fixed there. So the user's report is not a wiring bug - it is that
      // `grid` is a two-option `count` knob, and a two-dot rail fifth in a
      // five-knob rack is the least legible control on the panel. Nobody read
      // it as a control. 12-05 answers that in two halves: the default moves
      // here, and view.ts's widget rule gives a two-valued integer knob a word
      // row so the next person can see it.
      //
      // 550 AGAINST 556, SETTLED BY MEASUREMENT AND NOT BY CHOICE. Both are
      // right and they measure DIFFERENT STATES. 550 is `cost(compile(state))`
      // on the SHIPPED card, which still carries `preset: "ninepads"`, so its
      // marker is the twelve-character `#z.pninepads`. 556 is what 12-01's
      // tuner landed, and a tuner landing has been through `withChange`, which
      // deletes `preset` - so the marker becomes an eighteen-character field
      // dump and the Setup gains exactly six characters. Measured both ways at
      // both grids: shipped 580 / 550, tuned 586 / 556, +6 in both directions.
      // Nothing was mis-transcribed and no compiler constant moved; the two
      // figures were never the same measurement. The number below is the
      // shipped one, because that is what presets.spec.ts test 4 re-measures.
      //
      // THE SHAPE CHARACTER DOES NOT MOVE. A default index is not a resize:
      // `shapeOf` sums knob count and option counts, and this card is still six
      // knobs summing to 4,127 values either side. Every NINE PADS stamp minted
      // before this plan still decodes `restored` at the index it was minted
      // with, and a stamp minted at grid index 0 now restores 3x3 on a card
      // that defaults to 4x4 - which is correct, because a stamp carries a
      // position and not a difference from a default.
      d.sends.grid = "4x4";
      d.sends.showGrid = true;
      d.sends.fingers = "each";
    },
    { setup: 550, timer: 158 },
  ),
  preset(
    "faders",
    "Four faders",
    "Four faders side by side, each with a white rail and a coloured level you can see across the room.",
    "instruments",
    ["note", "amount"],
    (d) => {
      d.look.kind = "none";
      d.enabled.look = false;
      d.touch.kind = "none";
      d.enabled.touch = false;
      d.sends.kind = "faders";
      d.sends.faders = 4;
      d.sends.layout = "rails";
      d.sends.showGrid = true;
      d.sends.phase = "held";
    },
    { setup: 520, timer: 24 },
  ),
  preset(
    "dial",
    "Dial",
    "Circle your finger and the pad becomes an endless knob, sending how far you turned.",
    "instruments",
    // note is the CC, feel the sensitivity detent, mode the
    // relative/absolute switch, amount the distance-from-centre stream.
    // Colour and speed stay Adjust-sheet edits: the preset cap is four
    // knobs and the mapping knobs matter more on this card.
    ["note", "feel", "mode", "amount"],
    (d) => {
      // Amber swirl: the rotational look matches the gesture, and colour
      // plus the comet response distinguish it from Pinwheel's blue swirl.
      // No new visual vocabulary, zero new LED budget.
      d.look.kind = "swirl";
      d.look.colour = { r: 255, g: 170, b: 0 };
      d.look.arms = 3;
      d.look.speed = 2;
      d.touch.kind = "comet";
      // Brings fingers "first" and hiRes off through normalise.
      d.sends.kind = "dial";
    },
    { setup: 646, timer: 55 },
    {
      quiet:
        "Clockwise raises, counter-clockwise lowers. The middle of the pad stays quiet.",
    },
  ),
  preset(
    "tpad",
    "Trackpad",
    "One finger moves the pointer, two fingers scroll, a tap clicks and two fingers tapping right-click.",
    "computer",
    ["feel", "amount"],
    (d) => {
      d.look.kind = "none";
      d.enabled.look = false;
      d.touch.kind = "none";
      d.enabled.touch = false;
      d.sends.kind = "trackpad";
    },
    { setup: 902, timer: 146 },
    {
      exclusive: true,
      quiet:
        "The pad has no pressure sensing, so this cannot tell a firm press from a light one.",
    },
  ),
];

/** The shelf card with this id, or undefined. Same signature as the vendored one. */
export function presetById(id: string): PadPreset | undefined {
  return PRESETS.find((p) => p.id === id);
}
