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

  // -------------------------------------------------------------------------
  // NINE PADS: "make it selectable to 4x4", then "make a 16 pads cause nothing
  // changed".
  //
  // TWO PLANS AND TWO ANSWERS TO ONE ASK. 11-06 added the fifth knob and left
  // the default where it was, so `knobs` diverged and `state` did not. The user
  // asked again in the imperative, and 12-05 moved the default - so this block
  // now carries a `state` row, which makes `stateDiverges("ninepads")` TRUE and
  // hands the frames gate its expected disagreement with golden-frames.json.
  // The picture really does move: sixteen zones of four cells against nine of
  // nine, and src/lib/catalog/frames.json is regenerated in the same commit.
  //
  // WHAT 12-01 SETTLED FIRST, so this is a presentation change and not a
  // repair: the knob-to-wire path is green at the tuner AND at the module's
  // RAM. The user's "nothing changed" is a two-option `count` knob rendered as
  // a two-dot rail, fifth in a five-knob rack. 12-05's other half is view.ts's
  // widget rule.
  {
    preset: "ninepads",
    path: "knobs.length",
    hangar: 5,
    vendored: 4,
    reason:
      'The user\'s bench note for NINE PADS is "make it selectable to 4x4". sends.grid already accepted "4x4" and already compiled - plan 11-05 measured it emitting note 44 where 3x3 emits 39 - so the ask was never about the compiler. It was that no knob reached it. A fifth declared kind is what makes 4x4 selectable rather than merely reachable.',
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "ninepads",
    path: "knobs[4]",
    hangar: "count",
    vendored: undefined,
    reason:
      'The kind the new Pads knob exposes. "count" is an existing member of the vendored KnobKind union - PINWHEEL\'s arms knob already uses it - so this adds a knob and never a vocabulary. The two positions cost 580 and 550 of 908 setup at 158 timer, so the REQUESTED option is the cheaper one; the sweep costs the whole widened cross-product and reports nothing over budget.',
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "ninepads",
    path: "state.sends.grid",
    hangar: "4x4",
    vendored: "3x3",
    reason:
      'The user asked twice. 11-06 read "make it selectable to 4x4" as a knob and left the card shipping at 3x3; the bench came back with "make a 16 pads cause nothing changed", and 12-01 then proved the knob reaches the module\'s RAM - so what was left was the default itself. The card ships at sixteen zones of four cells. The shape character does not move, because a default index is not a resize: six knobs summing to 4,127 option values either side, so every stamp minted before this plan still decodes restored at the index it carries.',
    plan: "12-05",
    dated: "2026-09-10",
  },
  {
    preset: "ninepads",
    path: "cost.setup",
    hangar: 550,
    vendored: 580,
    reason:
      'The measured price of the row above, and it is a SAVING - 4x4 is the cheaper position, because sixteen zones of four cells need less arithmetic than nine zones of nine. 550 of 908 at the shipped knob positions and 640 at the worst of the reachable cross-product, 268 free. THE 550-VERSUS-556 DISAGREEMENT IS SETTLED HERE BY MEASUREMENT: both figures are right and they measure different states. 550 is cost(compile(state)) on the SHIPPED card, which still carries preset: "ninepads" and therefore the twelve-character #z.pninepads marker; 556 is what 12-01\'s tuner landed, and a tuner landing has been through withChange, which deletes preset and turns the marker into an eighteen-character field dump. Measured at both grids: shipped 580 / 550, tuned 586 / 556, +6 in both directions. No compiler constant moved and nothing was mis-transcribed.',
    plan: "12-05",
    dated: "2026-09-10",
  },
  {
    preset: "ninepads",
    path: "sentence",
    hangar:
      "Sixteen drum pads drawn on the lights, each one a note, with the one you are holding lit up.",
    vendored:
      "Nine drum pads drawn on the lights, each one a note, with the one you are holding lit up.",
    reason:
      'The shipped sentence counts the pads, and the row above changed how many there are. One word, at 91 of the 110 characters a card fits. THE NAME IS DELIBERATELY NOT TOUCHED: "Nine pads" is the card\'s name and its id, every stamp, fixture and OG file is keyed by it, and the knob still offers nine as its other position - so the card opens at sixteen and says so, and going back to nine is one click. The quiet line moves with it in listing.ts and front-door.ts, which is not a preset field for this card and therefore has no row of its own.',
    plan: "12-05",
    dated: "2026-09-10",
  },

  // -------------------------------------------------------------------------
  // JOYSTICK: "should start from the middle by default".
  //
  // A REVERSAL of a design decision the shipped mutator argues for in its own
  // comment, not a tweak. The comment is carried verbatim into presets.ts
  // beside the change, so the argument that was overruled is still readable.
  {
    preset: "joystick",
    path: "state.sends.springTo",
    hangar: "centre",
    vendored: "zero",
    reason:
      'The user\'s bench note for JOYSTICK is "should start from the middle by default". springRestCell moves from 76 to 40 and sendsInit lights cell 40 from power-on. This REVERSES the shipped mutator\'s own argument - "the CC axis falls to zero like a mod amount ... so the stick rests at the bottom-centre cell" - and what the reversal costs is that the Y axis no longer falls to zero on lift, so a held mod amount rests at 64. springTo is one field and not one per axis, so "centre on bend, zero on CC" is not reachable without a compiler change.',
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "joystick",
    path: "cost.setup",
    hangar: 543,
    vendored: 542,
    reason:
      "The measured price of the row above: one character, because the parked CC literal goes from 0 to 64. 543 of 908 at the shipped knob positions and 551 at the worst reachable one, 357 free. invertY was deliberately NOT flipped alongside it - that would save 4 more and reverse a second decision nobody asked about.",
    plan: "11-06",
    dated: "2026-09-09",
  },
  {
    preset: "joystick",
    path: "quiet",
    hangar:
      "Left-right is pitch bend and snaps back straight. Up-down is a mod amount that returns to the middle on lift.",
    vendored:
      "Left-right is pitch bend and snaps back straight. Up-down is a mod amount that falls to zero on lift.",
    reason:
      "The shipped quiet line says the mod amount falls to zero on lift, which the springTo row above made untrue. front-door.spec.ts asserts this string byte-equal against the preset and listing.spec.ts asserts it against the catalog, so it moves in all three files or in none.",
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
