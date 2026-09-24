// The other route's spec: a Lua entry's knobs, in the shape a preset's knobs
// already arrive in.
//
// TEST 2 IS A TRIPWIRE, not a description of today. The stamp encodes a knob
// position as ONE base-32 character (D-13), so a knob with a 33rd option would
// silently truncate: the link would decode, land on a plausible position, and
// nobody would find out. Today's widest knob is 16 options, on both routes, so
// there is a full doubling of headroom - which is exactly when a tripwire is
// cheap to install.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
// HANGAR's nine, not the vendored shelf's (plan 11-05). This loop only ever
// reads `preset.id`, and the two id lists are held identical by
// src/lib/catalog/presets.spec.ts test 3 - so this is flat today. It is flipped
// anyway because the thing it EXAMINES is presetKnobs(), which resolves through
// HANGAR's shelf: a walk driven by a list its subject no longer uses is exactly
// the shape that passes having read nothing.
import { PRESETS } from "../catalog/presets";
import { CATALOG } from "../catalog";
import type { CatalogEntry } from "../catalog/types";
import { COLOUR_LATTICE_SIZE, presetKnobs } from "./knobs.preset";
import { roleOfKnob } from "./midi";
import {
  luaKnobs,
  STAMP_OPTION_CEILING,
  STAMP_WIDE_CEILING,
} from "./knobs.lua";
import { swatchOf, widgetFor, type KnobWidget } from "./view";

const LUA_ENTRIES: readonly CatalogEntry[] = CATALOG.filter(
  (entry) => entry.source.kind === "lua",
);

/** The hand-authored cards' colour knobs on the lattice (change 19, card by card): ORBIT's four. */
const LUA_COLOUR_KNOBS = 24;

describe("the Lua-entry knob descriptors (src/lib/tune/knobs.lua.ts)", () => {
  it("carries every declared knob across without transforming it", () => {
    expect(LUA_ENTRIES.length).toBeGreaterThan(0);
    let checked = 0;
    for (const entry of LUA_ENTRIES) {
      const descriptors = luaKnobs(entry);
      expect(descriptors.length, `${entry.id} knob count`).toBe(
        entry.knobs.length,
      );
      // Change 17: the knobs a MIDI output names are its block's and do not count.
      const outputKnobs = roleOfKnob(entry).size;
      // The floor counts every knob (change 17B: LUMEN keeps two outside its outputs).
      expect(
        descriptors.length,
        `${entry.id} knob count`,
      ).toBeGreaterThanOrEqual(3);
      // ORBIT carries fourteen by the user's word (change 8, 2026-09-18), and the three cards that
      // took its clock idiom at change 12 carry Sync and Division past six; the cap holds elsewhere.
      expect(
        descriptors.length - outputKnobs,
        `${entry.id} knob count`,
      ).toBeLessThanOrEqual(
        { orbit: 14, steps: 8, "radar-points": 7, ghost: 7 }[entry.id] ?? 6,
      );

      for (let i = 0; i < descriptors.length; i++) {
        const from = entry.knobs[i];
        const to = descriptors[i];
        const where = `${entry.id}.${from.id}`;
        expect(to.id, where).toBe(from.id);
        expect(to.label, where).toBe(from.label);
        expect(to.kind, where).toBe(from.kind);
        // The same array contents, in the same order: a rename, never a
        // transformation. `token` is the one field dropped - it belongs to
        // renderLua and to nothing else.
        expect(to.options, where).toEqual(from.values);
        expect("token" in to, `${where} still carries its token`).toBe(false);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(30);
  });

  it("keeps every knob on both routes inside the stamp's one base-32 character, or names the wide ones that ride two", () => {
    let widest = 0;
    let examined = 0;
    const over: string[] = [];
    // THE WIDE KNOBS (change 8, 2026-09-18): a knob past the one-character
    // ceiling rides TWO base-32 characters (stamp.ts's `fieldChars`), and the
    // guard it keeps is `STAMP_WIDE_CEILING`, 1,024. Named here by entry and
    // knob so a knob cannot go wide unannounced: ORBIT's four ring notes, 128
    // options each (C-2 to G8), and since change 17 every output's Number,
    // 0..127 (ARC's CC first).
    const WIDE = [
      "orbit.note1 (128)",
      "orbit.note2 (128)",
      "orbit.note3 (128)",
      "orbit.note4 (128)",
      "arc.cc (128)",
      "ghost.cc (128)",
      "ghost.yCc (128)",
      "morph.cc1 (128)",
      "morph.cc2 (128)",
      "morph.cc3 (128)",
      "morph.cc4 (128)",
      "steps.note (128)",
      "steps.note2 (128)",
      "steps.note3 (128)",
      "steps.note4 (128)",
      "steps.note5 (128)",
      "steps.note6 (128)",
      "steps.note7 (128)",
      "steps.note8 (128)",
      "console.cc (128)",
      "strip.cc (128)",
      "strip.crossCc (128)",
      "lumen.cc (128)",
      "lumen.yCc (128)",
      "snake.note (128)",
      "snake.deathNote (128)",
      "quadrant.note (128)",
      "quadrant.note2 (128)",
      "quadrant.note3 (128)",
      "quadrant.note4 (128)",
      "pomodoro.note (128)",
      "pomodoro.transportNote (128)",
      "wheels.cc (128)",
      "wheels.pitchCc (128)",
      "radar.send (128)",
      "radar.yCc (128)",
      // Change 17C: FOUR FADERS, a Lua card now, its four faders' Numbers.
      "faders.send (128)",
      "faders.cc2 (128)",
      "faders.cc3 (128)",
      "faders.cc4 (128)",
      // Change 17C: NINE PADS, a Lua card now, its Pads bank's Number (the lowest pad's note).
      "ninepads.notes (128)",
      // Change 17C: the wrapped presets' output Numbers (entries/ported-midi.ts), token knobs on a
      // preset entry that ride HANGAR's index format once they move (stamp.ts).
      "aurora.xCc (128)",
      "aurora.yCc (128)",
      "pinwheel.xCc (128)",
      "pinwheel.yCc (128)",
      "starfield.xCc (128)",
      "starfield.yCc (128)",
      "joystick.send (128)",
      "joystick.yCc (128)",
      "dial.send (128)",
    ];

    // THE COLOUR EXEMPTION IS BY FORMAT, NOT BY A RAISED CEILING (10-08).
    // A lattice colour knob carries 4,096 positions and does not ride the
    // base-32 payload at all: a compiler entry's colour field is already RGB444
    // inside BOTOR's own formats a/b/c, and a Lua entry's colour rides format
    // w's 12 raw bits. Raising STAMP_OPTION_CEILING to admit it would silently
    // remove the guard from EVERY OTHER KNOB, which is the one thing this
    // tripwire exists to prevent. So the ceiling stays 32, the exemption is
    // named here, and the exempted knobs are held to their own domain below so
    // the carve-out is not a hole.
    const exempt = (kind: string): boolean => kind === "colour";
    let colourKnobs = 0;

    for (const preset of PRESETS) {
      for (const knob of presetKnobs(preset.id)) {
        if (exempt(knob.kind)) {
          colourKnobs += 1;
          expect(
            knob.options.length,
            `${preset.id}.${knob.id} is exempt by format and must be the whole lattice`,
          ).toBe(COLOUR_LATTICE_SIZE);
          continue;
        }
        widest = Math.max(widest, knob.options.length);
        examined++;
        if (knob.options.length > STAMP_OPTION_CEILING) {
          over.push(`${preset.id}.${knob.id} (${knob.options.length})`);
        }
      }
    }
    // Change 19: a hand-authored card's colour knob is a lattice too (its own colours first), exempt
    // by the same format - format w's three characters carry its cell - and held to the lattice.
    let luaColourKnobs = 0;
    for (const entry of LUA_ENTRIES) {
      for (const knob of luaKnobs(entry)) {
        if (exempt(knob.kind) && knob.options.length > STAMP_OPTION_CEILING) {
          luaColourKnobs += 1;
          expect(
            knob.options.length,
            `${entry.id}.${knob.id} is exempt by format and must be the whole lattice`,
          ).toBe(COLOUR_LATTICE_SIZE);
          continue;
        }
        widest = Math.max(widest, knob.options.length);
        examined++;
        if (knob.options.length > STAMP_OPTION_CEILING) {
          over.push(`${entry.id}.${knob.id} (${knob.options.length})`);
        }
      }
    }
    // A wrapped preset's output knobs (change 17C) are token knobs on the entry, beside its
    // compiler knobs above.
    for (const entry of CATALOG.filter((e) => e.source.kind === "preset")) {
      for (const knob of luaKnobs(entry)) {
        widest = Math.max(widest, knob.options.length);
        examined++;
        if (knob.options.length > STAMP_OPTION_CEILING) {
          over.push(`${entry.id}.${knob.id} (${knob.options.length})`);
        }
      }
    }

    expect(STAMP_OPTION_CEILING).toBe(32);
    expect(STAMP_WIDE_CEILING).toBe(1024);
    // The exemption is real work rather than a blanket: six preset colour
    // knobs, and every one of them the full lattice.
    expect(colourKnobs, "the exempted colour knobs").toBe(6);
    expect(
      luaColourKnobs,
      "the hand-authored cards' colour knobs, change 19",
    ).toBe(LUA_COLOUR_KNOBS);
    expect(
      over,
      "a knob has more options than one stamp character and is not a named wide knob",
    ).toEqual(WIDE);
    // Non-vacuity, and it covers BOTH routes: neither list may quietly empty.
    expect(examined, "knobs examined across both routes").toBeGreaterThan(40);
    expect(widest).toBeGreaterThan(1);
    expect(widest, "a wide knob still fits two characters").toBeLessThanOrEqual(
      STAMP_WIDE_CEILING,
    );
  });

  it("resolves the default from the entry's own table and never disagrees with the knob", () => {
    let fromEntry = 0;
    let fromKnob = 0;
    for (const entry of LUA_ENTRIES) {
      const descriptors = luaKnobs(entry);
      for (const knob of entry.knobs) {
        const descriptor = descriptors.find((d) => d.id === knob.id);
        expect(descriptor, `${entry.id}.${knob.id} is missing`).toBeDefined();
        if (!descriptor) continue;

        const declared = entry.defaults[knob.id];
        if (typeof declared === "number") {
          expect(descriptor.default, `${entry.id}.${knob.id}`).toBe(declared);
          // The two sources exist independently in the catalog, so a mismatch
          // is a catalog defect this spec has to name rather than resolve.
          expect(knob.default, `${entry.id}.${knob.id} disagrees`).toBe(
            declared,
          );
          fromEntry++;
        } else {
          expect(descriptor.default, `${entry.id}.${knob.id}`).toBe(
            knob.default,
          );
          fromKnob++;
        }
        expect(descriptor.default).toBeGreaterThanOrEqual(0);
        expect(descriptor.default).toBeLessThan(descriptor.options.length);
      }
    }
    expect(fromEntry + fromKnob).toBeGreaterThan(30);
  });

  it("renders: every shipped Lua knob gets a widget, and none falls through on malformed data", () => {
    // Five since change 16: a worded knob is segmented to four options and a
    // select above, an integer ladder past two rungs is a stepper.
    const WIDGETS: readonly KnobWidget[] = [
      "colour",
      "swatch",
      "words",
      "select",
      "stepper",
    ];
    let colours = 0;
    let words = 0;
    let steppers = 0;

    for (const entry of LUA_ENTRIES) {
      for (const knob of luaKnobs(entry)) {
        const widget = widgetFor(knob.kind, knob.options, knob.id);
        const where = `${entry.id}.${knob.id}`;
        expect(WIDGETS, `${where} resolved to ${widget}`).toContain(widget);

        if (knob.kind === "colour") {
          // A colour that reaches a rail is a malformed value set, not a
          // rendering choice: the fall-through would hide a broken literal.
          // Since plan 10-10 the widget is the PICKER, chosen by kind alone
          // (X-05 / X-06 as that plan amends them) - and inside it a
          // hand-authored palette like this one is still shown as the shipped
          // swatch row, because three sixteen-detent rails cannot travel
          // between five arbitrary literals. So the widget moved and the
          // requirement on the LITERALS did not.
          expect(widget, `${where} is not the colour picker`).toBe("colour");
          for (const option of knob.options) {
            expect(swatchOf(option), `${where} value ${option}`).toBeDefined();
          }
          colours++;
        } else if (knob.kind === "scale") {
          // An unlisted semitone set would rail too, and then a visitor would
          // pick "position 3" instead of "Dorian". Worded either way: a row
          // up to four options, a select from five (13-09, the 4/5 boundary).
          expect(["words", "select"], `${where} is not worded`).toContain(
            widget,
          );
          words++;
        } else if (knob.kind === "note" && knob.options.length <= 24) {
          expect(["words", "select"], `${where} is not worded`).toContain(
            widget,
          );
          words++;
        } else if (widget === "stepper") {
          steppers++;
        }
      }
    }

    expect(colours).toBeGreaterThan(0);
    expect(words).toBeGreaterThan(0);
    expect(steppers).toBeGreaterThan(0);
  });
});
