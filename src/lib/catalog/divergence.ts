// The record of every place HANGAR's nine deliberately disagree with the
// vendored nine, and the ONE place that record lives.
//
// WHY IT IS A MODULE AND NOT A CONST INSIDE presets.spec.ts, WHICH IS WHERE
// PLAN 11-05 LANDED IT. Three gates need to read it, not one:
//
//   src/lib/catalog/presets.spec.ts  - the field-by-field diff, which fails on
//                                      any difference no row declares.
//   src/lib/catalog/catalog.spec.ts  - holds every ported entry's name and
//                                      description against the VENDORED
//                                      shelf's name and sentence. Three
//                                      sentences diverge from 11-06 onward.
//   src/lib/catalog/frames.spec.ts   - cross-checks each ported entry's frames
//                                      against src/lib/fidelity/
//                                      golden-frames.json, whose hashes were
//                                      sampled over the VENDORED states. A
//                                      HANGAR state change that moves the
//                                      picture moves those frames apart.
//
// A spec file cannot be imported by another spec file without its `describe`
// blocks registering twice, so the table had to leave presets.spec.ts for any
// second reader to exist at all. The alternative was a hand-copied allowance
// list in each of the three, which is this phase's own warning 3 - a
// hand-declared list that a walk iterates can pass having read nothing - three
// times over.
//
// WHAT A ROW COSTS AND WHAT IT BUYS. Until plan 11-05 the nine preset values
// lived in src/vendor/, so a bench correction to one of them was an edit inside
// a GPLv3 vendored tree that D-02 grants only for fidelity fixes. HANGAR owns
// the values now, and the price of that is this file: a divergence nobody wrote
// down is a FAILURE rather than a silence, at all three gates above.
//
// A ROW THAT DESCRIBES NO DIFFERENCE FAILS (presets.spec.ts test 2), so rows
// cannot be written ahead of the change they describe and cannot rot into an
// amnesty for a change that was reverted or that a re-sync brought upstream.
//
// This module imports NOTHING. It is pure data, read only by specs.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/**
 * A deliberate difference between HANGAR's declared preset and the vendored one
 * it was taken from. Same shape as upstream-manifest.json's intendedDivergence
 * and preset-baseline.spec.ts's own table, and for the same reason: the record
 * has to say WHY, or it is a diff a reader could have got from git.
 *
 * `path` is the full field path as presets.spec.ts test 1 reports it -
 * `state.sends.grid`, never `state`. `hangar` and `vendored` are BOTH required
 * and are compared against the real values, so a row cannot suppress a field it
 * does not actually describe.
 */
export interface PresetDivergence {
  preset: string;
  path: string;
  hangar: unknown;
  vendored: unknown;
  reason: string;
  plan: string;
  dated: string;
}

/**
 * EMPTY WHEN PLAN 11-05 LANDED IT; PLAN 11-06 IS WHAT SPENT IT.
 *
 * Every row below answers one of the user's own bench notes, taken on real
 * hardware on 2026-09-09, and every reason quotes the note verbatim. Nothing
 * here is hardware-verified: HANGAR never writes to a device, so each of these
 * is a change made to what the user asked for and measured through the vendored
 * compiler, awaiting their bench to confirm it.
 */
export const INTENDED_DIVERGENCE: readonly PresetDivergence[] = [
  // -------------------------------------------------------------------------
  // AURORA, PINWHEEL, STARFIELD: "send MIDI".
  //
  // One field each, and `planLayers` was measured before and after on all
  // three: `sends` goes true, `layer1` and `layer2` do not move, and the five
  // sampled frames hash IDENTICALLY either side. An xy stream claims no LED
  // layer, so the picture is untouched - asserted rather than argued, because
  // src/lib/catalog/frames.json is regenerated in the same commit and a moved
  // hash would have been the finding.
  {
    preset: "aurora",
    path: "state.sends.kind",
    hangar: "xy",
    vendored: "none",
    reason:
      'The user\'s bench note for AURORA is "send MIDI". An xy stream is what the shelf already gives RADAR for the same words, it claims no LED layer, and the five sampled frames are byte-identical either side. Measured 250 -> 415 of 908 setup at the shipped knob positions.',
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "aurora",
    path: "state.sends.fingers",
    hangar: "first",
    vendored: "any",
    reason:
      'The finger policy that comes with the xy stream, and it is the EXPENSIVE reading taken on purpose. "first" claims one contact and streams one position, which is what a host expects from an XY pad and what the shelf itself already gives RADAR and JOYSTICK. Both alternatives measure 320 against "first"\'s 415, so 95 characters were spent rather than saved: under the vendored default "any" every contact writes the same CC pair, so a second finger fights the first for one stream.',
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "aurora",
    path: "cost.setup",
    hangar: 415,
    vendored: 250,
    reason:
      "The measured price of the two rows above, and it is a row rather than a silent edit because presets.spec.ts test 4 re-measures all nine byte-exact against the compiler. 415 of 908 at the shipped knob positions and 429 at the WORST of the 19,502 reachable ones the sweep costs, so 479 characters stay free where it matters. The worst figure is stated because it is the one that can go over, and because plan 11-04 found four rows of upstream-manifest.json labelling 908 minus the DEFAULT as a worst-position figure.",
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "aurora",
    path: "sentence",
    hangar:
      "A band of light crosses the pad, your finger leaves a glowing tail, and the pad sends your position.",
    vendored:
      "A band of light crosses the pad, and your finger leaves a glowing tail behind it.",
    reason:
      "The shipped sentence describes a card that sends nothing, which stopped being true in the row above. Extended by one clause echoing RADAR's shipped wording rather than reinventing it, at 100 of the 110 characters a card fits.",
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "pinwheel",
    path: "state.sends.kind",
    hangar: "xy",
    vendored: "none",
    reason:
      'The user\'s bench note for PINWHEEL is "make this send MIDI". Same one field as AURORA, same measured non-effect on the picture. Measured 312 -> 477 of 908 setup at the shipped knob positions.',
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "pinwheel",
    path: "state.sends.fingers",
    hangar: "first",
    vendored: "any",
    reason:
      'The finger policy that comes with the xy stream, chosen for the same reason as AURORA\'s and at the same measured price: 477 against 382 for either alternative. PINWHEEL paints per finger on the LEDs, which is a LOOK; the wire still carries one position, because a DAW reading five contacts fighting over one CC pair is not what "make this send MIDI" asks for.',
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "pinwheel",
    path: "cost.setup",
    hangar: 477,
    vendored: 312,
    reason:
      "The measured price of the two rows above. 477 of 908 at the shipped knob positions and 486 at the worst reachable one, 422 free. The largest of the three xy additions, because the swirl look already carries the most arithmetic of the three.",
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "pinwheel",
    path: "sentence",
    hangar:
      "Light turns around the centre, each finger paints in its own colour, and the pad sends your position.",
    vendored:
      "Light turns around the centre, and each finger paints in its own colour.",
    reason:
      "The shipped sentence describes a card that sends nothing, which stopped being true in the row above. Extended by one clause echoing RADAR's shipped wording, at 101 of the 110 characters a card fits.",
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "starfield",
    path: "state.sends.kind",
    hangar: "xy",
    vendored: "none",
    reason:
      'The user\'s bench note for STARFIELD is "should send midi". The same one field again, which is why the roadmap\'s "three of the eight need no new behaviour" is four. STARFIELD\'s hard half was the stuck colour, and plan 11-04 fixed that at its source in the decay start. Measured 238 -> 403 of 908 setup at the shipped knob positions.',
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "starfield",
    path: "state.sends.fingers",
    hangar: "first",
    vendored: "any",
    reason:
      "The finger policy that comes with the xy stream, chosen for the same reason as AURORA's and PINWHEEL's. Both alternatives measure 308 against \"first\"'s 403; a saving nobody asked for is still a behaviour nobody asked for, and 505 characters remain free at the shipped knob positions either way.",
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "starfield",
    path: "cost.setup",
    hangar: 403,
    vendored: 238,
    reason:
      "The measured price of the two rows above. 403 of 908 at the shipped knob positions and 422 at the worst reachable one, 486 free. The cheapest of the three, because the shimmer look is the cheapest of the three looks.",
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "starfield",
    path: "sentence",
    hangar:
      "Every light breathes at its own pace, so the pad never repeats itself, and it sends your position.",
    vendored:
      "Every light breathes at its own pace, so the pad never repeats itself.",
    reason:
      "The shipped sentence describes a card that sends nothing, which stopped being true in the row above. The identity clause is kept verbatim and one clause is added, at 98 of the 110 characters a card fits.",
    plan: "11-06",
    dated: "2026-09-09",
  },
];

/** The row declaring this exact field path on this preset, or undefined. */
export function declaredDivergence(
  preset: string,
  path: string,
): PresetDivergence | undefined {
  return INTENDED_DIVERGENCE.find(
    (row) => row.preset === preset && row.path === path,
  );
}

/**
 * Whether HANGAR declares any divergence in this preset's compiled STATE.
 *
 * The frames gate is what needs this. src/lib/fidelity/golden-frames.json was
 * sampled from a PadSim over the VENDORED states, so once HANGAR's state for a
 * card differs the two fixtures are measuring two different configurations and
 * a hash disagreement is expected rather than a regression. Everything else
 * still has to agree, which is why the gate compares first and consults this
 * second.
 */
export function stateDiverges(preset: string): boolean {
  return INTENDED_DIVERGENCE.some(
    (row) => row.preset === preset && row.path.startsWith("state."),
  );
}
