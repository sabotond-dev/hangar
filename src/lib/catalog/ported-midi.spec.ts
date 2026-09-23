// The wrap's exactness (change 17C, BENCH-2026-09-16.txt section 17): a wrapped preset's compiled
// pair is rewritten on HANGAR's side (entries/ported-midi.ts), and a rewrite that quietly missed a
// send would put the shelf's controller on the wire under a Type the visitor changed. So the claim is
// held over EVERY compiler knob state each wrapped card can reach - the whole non-colour
// cross-product, the colour at the sweep's 27 lattice literals and the card's own - at the outputs'
// defaults and at their dearest literals: every find occurs exactly as often as the template says
// (it throws otherwise), the one send left is `M`'s and no token survives; and, on the product's
// first and last state (the minifier is the slow half, and what it reads is the inserted text, which
// no knob but a literal moves), the text keeps the compiled string's one-character-per-action rule
// under the pinned minifier (wire-pin.spec.ts's pin, so the wire and the meter stay one number).
// What the rewritten pair SENDS, receives and paints is lua-smoke.spec.ts's "change 17C" block,
// card by card; the budget over the whole space is reachability.sweep.spec.ts's.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { GridScript } from "@intechstudio/grid-protocol";
import { beforeAll, describe, expect, it } from "vitest";
import { compile, type PadState } from "../../vendor/botor/_pad";
import { padReady } from "../pad";
import { compilerKnobs } from "../share/stamp";
import { colourIndexOf, type PresetKnob } from "../tune/knobs.preset";
import { applyKnob, baseStateFor } from "../tune/state";
import { CATALOG, type CatalogEntry } from "./index";
import {
  PRESET_MIDI,
  WrapMissError,
  isWrapped,
  presetWire,
} from "./entries/ported-midi";

/** The sweep's colour sample: channels 0, 17 and 255 in every position. */
const COLOUR_SAMPLE = [0, 17, 255].flatMap((r) =>
  [0, 17, 255].flatMap((g) => [0, 17, 255].map((b) => ({ r, g, b }))),
);

/** Every compiler knob state of a card: the whole non-colour product, the colour sampled. */
function* states(entry: CatalogEntry): Generator<PadState> {
  const knobs = compilerKnobs(entry);
  const lists = knobs.map((knob: PresetKnob) =>
    knob.kind === "colour"
      ? [
          ...new Set([
            knob.default,
            ...COLOUR_SAMPLE.map((colour) => colourIndexOf(colour)),
          ]),
        ]
      : knob.options.map((_, at) => at),
  );
  const at = lists.map(() => 0);
  for (;;) {
    let state = baseStateFor(entry);
    knobs.forEach((knob, j) => {
      state = applyKnob(state, knob, lists[j][at[j]]);
    });
    yield state;
    let k = lists.length - 1;
    while (k >= 0) {
      at[k] += 1;
      if (at[k] < lists[k].length) break;
      at[k] = 0;
      k -= 1;
    }
    if (k < 0) return;
  }
}

/** Every output knob at its longest literal: the dearest corner. */
function dearest(entry: CatalogEntry): Record<string, number> {
  const out: Record<string, number> = {};
  for (const knob of entry.knobs) {
    out[knob.id] = knob.values.reduce(
      (best, value, at) =>
        value.length > knob.values[best].length ? at : best,
      0,
    );
  }
  return out;
}

const count = (haystack: string, needle: string): number =>
  haystack.split(needle).length - 1;

const wrappedEntries = (): CatalogEntry[] => CATALOG.filter(isWrapped);

beforeAll(async () => {
  await padReady();
});

describe("the wrapped presets (change 17C, entries/ported-midi.ts)", () => {
  it("rewrites every compiler knob state of every wrapped card exactly: each find as often as the template says, the one send left M's, no token left, canonical under the pinned minifier, and a moved send a thrown error", () => {
    const entries = wrappedEntries();
    expect(
      entries.map((entry) => entry.id),
      "the wrapped cards, in catalog order",
    ).toEqual(Object.keys(PRESET_MIDI));
    let examined = 0;
    for (const entry of entries) {
      const all = [...states(entry)];
      for (const [n, state] of all.entries()) {
        const minified = n === 0 || n === all.length - 1;
        const compiled = compile(state);
        for (const at of [undefined, dearest(entry)]) {
          const wired = presetWire(entry, compiled, at);
          for (const [event, text] of [
            ["setup", wired.setupLua],
            ["timer", wired.timerLua],
          ] as const) {
            expect(
              /@[A-Z]/.test(text),
              `${entry.id}/${event}: a token survived`,
            ).toBe(false);
            // Canonical: the compiled string's rule - shorter under the minifier by exactly one
            // character per action marker, the space after each `]]` - holds after the rewrite.
            if (minified)
              expect(
                text.length - GridScript.compressScript(text).length,
                `${entry.id}/${event}: the rewrite is not canonical`,
              ).toBe(count(text, "--[[@"));
          }
          expect(
            count(wired.setupLua, "gms(") + count(wired.timerLua, "gms("),
            `${entry.id}: a send outside M`,
          ).toBe(1);
          expect(wired.setupLua).toContain("local function M(t,c,n,o)");
          // Every card assigns its receive callback, or nil.
          expect(
            wired.setupLua.includes("self.midirx_cb=") ||
              wired.timerLua.includes("self.midirx_cb="),
            `${entry.id}: no midirx_cb assignment`,
          ).toBe(true);
          examined += 1;
        }
      }
      // A send the template does not know is a thrown error, never a silent pass.
      const shipped = compile(baseStateFor(entry));
      expect(() =>
        PRESET_MIDI[entry.id].template(
          shipped.setupLua.replace("gms(", "gms(1+"),
          shipped.timerLua,
        ),
      ).toThrow(WrapMissError);
    }
    expect(examined, "the states examined").toBeGreaterThan(entries.length);
  }, 120000);
});
