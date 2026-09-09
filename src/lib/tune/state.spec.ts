// The spec for the one function every knob write in this phase goes through.
//
// Test 2 is the reason this file exists. `encodeStamp` short-circuits to
// `p<presetId>` whenever `state.preset` is set, so a tuned state that kept its
// shelf card would encode as the UNTUNED card: the link would look right, open
// right, and quietly discard every knob the visitor moved. That is not a
// rendering bug, it is a data-loss bug that only a stamp assertion can see.
//
// The three fixture knobs below are local on purpose. state.ts's applyKnob and
// readKnob take a binding, not a descriptor, so this spec can prove the
// arithmetic before knobs.preset.ts exists - and it keeps this file honest
// about what it is testing, which is the plumbing rather than the nine tables.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { encodeStamp, type PadState, type RGB } from "../../vendor/botor/_pad";
import { presetById } from "../catalog/presets";
import { byId } from "../catalog";
import {
  applyKnob,
  baseStateFor,
  readKnob,
  resetAll,
  withChange,
  type KnobBinding,
} from "./state";

// HANGAR's shelf (plan 11-05), and here it is load-bearing rather than tidy.
// The first test asserts that withChange does not mutate the object it was
// handed, because the shelf's state is SHARED and a mutation would poison every
// later reader - and after 11-05 the later readers are state.ts's own, which
// resolve through $lib/catalog/presets. Reading the vendored object here would
// have left that guard pointed at a shelf nothing under test touches.
const aurora = () => {
  const preset = presetById("aurora");
  if (!preset) throw new Error("the shelf lost aurora");
  return preset.state;
};

const rgb = (literal: string): RGB => {
  const [r, g, b] = literal.split(",").map((n) => Number.parseInt(n, 10));
  return { r, g, b };
};
const literal = (c: RGB) => `${c.r},${c.g},${c.b}`;

/** A look-sheet knob: aurora's speed detent, 1..8. */
const SPEED: KnobBinding & { options: readonly string[] } = {
  options: ["1", "2", "3", "4", "5", "6", "7", "8"],
  apply: (state, index) =>
    withChange(state, (draft) => {
      draft.look.speed = index + 1;
    }),
  read: (state) => state.look.speed - 1,
};

/** A touch-sheet knob: the joystick's glow colour, pre-quantised. */
const TOUCH_COLOUR: KnobBinding & { options: readonly string[] } = {
  options: ["255,187,0", "0,204,255", "255,85,0"],
  apply: (state, index) =>
    withChange(state, (draft) => {
      draft.touch.colour = rgb(TOUCH_COLOUR.options[index]);
    }),
  read: (state) => {
    const found = TOUCH_COLOUR.options.indexOf(literal(state.touch.colour));
    return found < 0 ? 0 : found;
  },
};

/** A sends-sheet knob: a MIDI channel, 1..16. */
const CHANNEL: KnobBinding & { options: readonly string[] } = {
  options: ["1", "2", "3", "4"],
  apply: (state, index) =>
    withChange(state, (draft) => {
      draft.sends.channel = index + 1;
    }),
  read: (state) => state.sends.channel - 1,
};

describe("the tuning state seam (src/lib/tune/state.ts)", () => {
  it("clears the shelf card and the audition, grounds the result and leaves the input alone", () => {
    const base = aurora();
    const before = JSON.stringify(base);

    const tuned = withChange(base, (draft) => {
      // Out of range on purpose: only a grounded return value clamps it.
      draft.look.speed = 99;
      draft.soloStream = "xy.x";
    });

    expect(base.preset).toBe("aurora");
    expect(tuned.preset).toBeUndefined();
    expect(tuned.soloStream).toBeUndefined();
    expect(tuned.look.speed).toBe(8);
    // The shelf's own state is a shared object; a mutation here would poison
    // every later reader of presetById("aurora").
    expect(JSON.stringify(base)).toBe(before);
  });

  it("makes a tuned stamp a field dump instead of the untuned shelf card", () => {
    // THE PITFALL-2 GUARD. Delete `delete draft.preset` from withChange and
    // the tuned stamp below reads `paurora` - a link that silently restores
    // the card as published and throws the visitor's knob away.
    const untouched = encodeStamp(aurora());
    expect(untouched).toBe("paurora");

    const tuned = encodeStamp(
      withChange(aurora(), (draft) => {
        draft.look.speed = 7;
      }),
    );
    expect(tuned.startsWith("p")).toBe(false);
    expect(tuned.length).toBeGreaterThan(8);
  });

  it("applies a knob purely: same arguments, same state, and the input untouched", () => {
    const base = aurora();
    const before = JSON.stringify(base);

    const once = applyKnob(base, SPEED, 5);
    const twice = applyKnob(base, SPEED, 5);

    expect(once).toEqual(twice);
    expect(once).not.toBe(twice);
    expect(once.look.speed).toBe(6);
    expect(JSON.stringify(base)).toBe(before);
  });

  it("reads back the index it wrote, on all three sheets", () => {
    const cases: { name: string; base: PadState; knob: typeof SPEED }[] = [
      { name: "look", base: aurora(), knob: SPEED },
      {
        name: "touch",
        base: baseStateFor(mustFind("joystick")),
        knob: TOUCH_COLOUR,
      },
      {
        name: "sends",
        base: baseStateFor(mustFind("ninepads")),
        knob: CHANNEL,
      },
    ];

    let checked = 0;
    for (const { name, base, knob } of cases) {
      for (let i = 0; i < knob.options.length; i++) {
        expect(
          readKnob(applyKnob(base, knob, i), knob),
          `${name} knob option ${i}`,
        ).toBe(i);
        checked++;
      }
    }
    // Without this an empty option list would make the loop above vacuous.
    expect(checked).toBe(
      SPEED.options.length +
        TOUCH_COLOUR.options.length +
        CHANNEL.options.length,
    );
  });

  it("resets to the card as published, and refuses to invent a state for a Lua entry", () => {
    const entry = mustFind("aurora");
    const reset = resetAll(entry);

    // `preset` restored is what makes an untouched card encode as the short
    // form again, so a link to the defaults carries nothing after the hash.
    expect(reset.preset).toBe("aurora");
    expect(encodeStamp(reset)).toBe("paurora");
    // A tuned state, reset, is the shelf card again - not a field dump of it.
    expect(encodeStamp(resetAll(entry))).toBe(encodeStamp(aurora()));

    // A Lua entry has no PadState at all; asking for one is a programming
    // error, and a named throw says so instead of returning a default card.
    expect(() => baseStateFor(mustFind("euclid"))).toThrow(/euclid/);
  });
});

function mustFind(id: string) {
  const entry = byId(id);
  if (!entry) throw new Error(`the catalog lost ${id}`);
  return entry;
}
