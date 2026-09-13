// TUNE-04 and TUNE-05, against a genuinely over-budget measurement.
//
// THIS SPEC HAS NO MODULE OF ITS OWN. It is the guard over model.ts, fitState
// and copy.ts together - the fit-ladder line and the over-budget block are made
// of all three and of none of them alone - which is why it is a spec without a
// source file beside it.
//
// > Over budget is unreachable for anything a visitor can produce. These five
// > tests are what make TUNE-04 and TUNE-05 real code rather than a claim, and
// > they reach the branch the only honest way - by passing the compiler a real
// > `reserved`, which is exactly what Phase 7's install marker will do.
//
// THE RESERVES ARE MEASURED, NOT GUESSED, and there are two of them because one
// number cannot do both jobs. Measured here on 2026-09-04:
//
//   tpad at its defaults costs Setup 902 of 908 - the tightest card on the
//   shelf. The smallest round reserve that puts it over with a margin of at
//   least ten characters is 20: Setup 922, free -14. That is TEST 1's reserve.
//
//   But tpad can never produce a LADDER. Its only sheet is `sends`, and the
//   compiler refuses to shed sends - "a fader bank quietly becoming three
//   faders is the silent lie this product exists to prevent" - so fit() returns
//   `{ fits: false, steps: [], blocked: "sends" }` at every reserve, 400
//   included. The researcher's { setup: 400, timer: 0 } therefore reaches the
//   over-budget branch and not the ladder branch. The measurement wins: tests 2
//   to 5 use `dial` at { setup: 300, timer: 0 } - Setup 946, free -38, four
//   ladder steps, plan.fits true - which is the only pairing on this shelf that
//   exercises TUNE-04 and TUNE-05 at once.
//
// THE OVER-BUDGET SENTENCE IS READ, NEVER RESTATED. It is the vendored
// compiler's own wording and this file does not contain a copy of it; the
// assertion checks the shape it must have and the number it must carry.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { EVENT_BUDGET, type PadReserved } from "../../vendor/botor/_pad";
import { byId, portedEntry, type CatalogEntry } from "../catalog";
import {
  compileState,
  costOf,
  fitState,
  padReady,
  validateCompiled,
} from "../pad";
import { ladderLine, lowerFirst } from "./copy";
import { presetKnobs } from "./knobs.preset";
import { buildTuner, type LadderView, type OverBudgetView } from "./model";
import { resetAll } from "./state";
import { stripComments } from "../../test-support/source";

/** The tightest card on the shelf, and the smallest round reserve that tips it. */
const TPAD_RESERVE: PadReserved = { setup: 20, timer: 0 };

/**
 * The only pairing that reaches the over-budget block AND a real ladder.
 * 300 -> 354 at plan 12.1-08b: DIAL's Setup went 646 -> 592 when its comet
 * became the library's K, and 592 + 354 = 946 is the same -38 the header
 * measured on 2026-09-04, so the four steps and every figure below reproduce.
 */
const DIAL_RESERVE: PadReserved = { setup: 354, timer: 0 };

function mustEntry(id: string): CatalogEntry {
  // `tpad` is a shelf preset and not a catalog card since plan 12-10 (the
  // hand-authored TRACKPAD replaced it as the card); it is still the tightest
  // budget on the shelf and the only one blocked on `sends`, so this file
  // keeps measuring it through the shelf.
  const entry = byId(id) ?? portedEntry(id);
  if (!entry) throw new Error(`no catalog entry: ${id}`);
  return entry;
}

const repo = (rel: string) =>
  fileURLToPath(new URL(`../../../${rel}`, import.meta.url));

/** Every file directly under src/lib/tune/, repo-relative, in a stable order. */
function tuneFiles(): string[] {
  const root = repo("src/lib/tune");
  return readdirSync(root)
    .map(String)
    .filter((name) => statSync(join(root, name)).isFile())
    .map((name) => `src/lib/tune/${name}`)
    .sort();
}

describe("the fit ladder and the over-budget block (TUNE-04, TUNE-05)", () => {
  beforeAll(async () => {
    await padReady();
  });

  it("a real reserve puts the tightest card over 908, in the compiler's own words", async () => {
    const state = resetAll(mustEntry("tpad"));
    const built = await compileState(state);

    const inside = await costOf(built);
    expect(inside.fits, "tpad ships inside its own budget").toBe(true);
    expect(inside.setup.limit).toBe(EVENT_BUDGET);

    const over = await costOf(built, TPAD_RESERVE);
    expect(over.fits, "the measured reserve did not push it over").toBe(false);
    expect(over.setup.free).toBeLessThan(0);
    // The margin the reserve was chosen for: at least ten characters clear of
    // the boundary, so this never becomes a test about rounding.
    expect(-over.setup.free).toBeGreaterThanOrEqual(10);

    const diagnostics = await validateCompiled(built, TPAD_RESERVE);
    const budget = diagnostics.find((each) => each.code === "over-budget");
    expect(budget, "the compiler said nothing about the budget").toBeDefined();
    expect(budget!.severity).toBe("error");
    expect(budget!.event).toBe("setup");
    // Read from the diagnostic, never restated: the message must carry the
    // compiler's own overrun figure, and this file contains no copy of the
    // sentence itself.
    expect(budget!.message).toContain(String(-over.setup.free));
    expect(budget!.message.length).toBeGreaterThan(24);
  });

  it("the ladder's own sentence is what the line renders, byte for byte", async () => {
    const state = resetAll(mustEntry("dial"));
    const plan = await fitState(state, { reserved: DIAL_RESERVE });

    expect(
      plan.steps.length,
      "the ladder proposed nothing to turn down",
    ).toBeGreaterThanOrEqual(1);
    const label = plan.steps[0].label;
    expect(label.length, "a ladder step with no words").toBeGreaterThan(0);

    const line = ladderLine(1, label);
    expect(
      line,
      "the line does not carry the compiler's own sentence",
    ).toContain(lowerFirst(label));
    // Only the FIRST character is lower-cased. The rest is the compiler's, and
    // a toLowerCase() would flatten every proper noun in it.
    expect(line).toContain(label.slice(1));
    expect(lowerFirst(label).slice(1)).toBe(label.slice(1));
    expect(lowerFirst(label)[0]).toBe(label[0].toLowerCase());
  });

  it("the first step saves exactly what it says it saves, per event", async () => {
    const entry = mustEntry("dial");
    const state = resetAll(entry);
    const plan = await fitState(state, { reserved: DIAL_RESERVE });
    expect(plan.steps.length).toBeGreaterThanOrEqual(1);

    const step = plan.steps[0];
    const before = await costOf(await compileState(state), DIAL_RESERVE);
    const after = await costOf(
      await compileState(step.apply(state)),
      DIAL_RESERVE,
    );

    expect(
      before.setup.used - after.setup.used,
      "the step's own Setup saving is not what applying it saves",
    ).toBe(step.saves.setup);
    expect(
      before.timer.used - after.timer.used,
      "the step's own Timer saving is not what applying it saves",
    ).toBe(step.saves.timer);
  });

  it("the compiler never proposes degrading the control the hand is on", async () => {
    const entry = mustEntry("dial");
    const state = resetAll(entry);

    const free = await fitState(state, { reserved: DIAL_RESERVE });
    const sheets = new Set(free.steps.map((step) => step.feature));
    expect(sheets.size, "the unpinned plan proposed nothing").toBeGreaterThan(
      0,
    );

    // The pinned sheet is a REAL knob's sheet, and one the unpinned plan
    // proposes a step on - pinning a sheet nothing was going to touch would
    // prove nothing at all.
    const pinned = presetKnobs("dial").find((knob) => sheets.has(knob.sheet));
    expect(
      pinned,
      "no dial knob sits on a sheet the ladder would trim",
    ).toBeDefined();

    const plan = await fitState(state, {
      reserved: DIAL_RESERVE,
      pinned: pinned!.sheet,
    });
    expect(
      plan.steps.map((step) => step.feature),
      "the compiler proposed degrading the sheet the visitor's hand is on",
    ).not.toContain(pinned!.sheet);
    expect(
      plan.steps.length,
      "pinning silenced the ladder entirely",
    ).toBeGreaterThan(0);
  });

  it("the over-budget block is complete, and nothing in the tuning model can reach a port", async () => {
    let ladder: LadderView | undefined;
    let over: OverBudgetView | undefined;
    const tuner = await buildTuner({
      entryId: "dial",
      reserved: DIAL_RESERVE,
      onview: () => {},
      onpreview: () => {},
      onladder: (view) => {
        ladder = view;
      },
      onover: (view) => {
        over = view;
      },
    });
    // The first measurement is a promise chain, not a timer: flush it.
    for (let hop = 0; hop < 64; hop++) await Promise.resolve();
    tuner.destroy();

    expect(over, "the tuner never reported the overrun").toBeDefined();
    expect(over!.events).toBe("setup");
    for (const [name, text] of [
      ["line", over!.line],
      ["backOff", over!.backOff],
      ["reason", over!.reason],
      ["live", over!.live],
    ] as const) {
      expect(text.length, `the over-budget ${name} is empty`).toBeGreaterThan(
        0,
      );
    }
    // Every one of them is copy.ts's, so every one of them ends as a sentence.
    expect(over!.line.endsWith(".")).toBe(true);
    expect(over!.backOff.endsWith(".")).toBe(true);
    expect(over!.reason.endsWith(".")).toBe(true);
    expect(over!.live.endsWith(".")).toBe(true);
    // No knob moved, so no knob is blamed, and TURN IT DOWN offers the ladder's
    // first step instead - which is the sentence the block carries.
    expect(ladder, "the ladder line never arrived").toBeDefined();
    expect(over!.backOff).toContain(ladder!.label);

    // The line, the label and the savings are the compiler's, checked against
    // the plan this spec asks for itself rather than against a number typed
    // here. No knob moved, so the tuner's plan is the unpinned one.
    const plan = await fitState(resetAll(mustEntry("dial")), {
      reserved: DIAL_RESERVE,
    });
    expect(ladder!.label, "the line does not carry steps[0]'s own words").toBe(
      plan.steps[0].label,
    );
    expect(ladder!.line).toBe(ladderLine(plan.steps.length, ladder!.label));
    expect(ladder!.saves).toEqual({
      setup: plan.steps[0].saves.setup,
      timer: plan.steps[0].saves.timer,
    });

    // The other half of success criterion 3, asserted the way
    // src/lib/device/try-on.spec.ts asserts an absence: not that this cycle
    // wrote nothing, but that no cycle can. The needle is assembled from
    // fragments so this file does not contain the thing it forbids.
    const files = tuneFiles();
    expect(
      files.length,
      "the tuning modules were actually read",
    ).toBeGreaterThanOrEqual(6);
    const write = [".", "write("].join("");
    const reach = (name: string) => ["lib", name].join("/");
    const offenders: string[] = [];
    for (const rel of files) {
      const source = stripComments(readFileSync(repo(rel), "utf8"));
      for (const needle of [
        write,
        reach("transport"),
        reach("protocol"),
        reach("device"),
      ]) {
        if (source.includes(needle)) offenders.push(`${rel} -> ${needle}`);
      }
    }
    expect(offenders, "a tuning module can reach the wire").toEqual([]);
  });
});
