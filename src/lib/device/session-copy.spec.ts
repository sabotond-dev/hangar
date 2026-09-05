// The session's copy contract, made executable.
//
// 06-UI-SPEC.md's Copywriting Contract, its table of nine slot states and its
// nine-state failure taxonomy ARE the specification. These six tests exist so
// that a reflow, a smart-quote regression, a hard-coded button name, a phase
// added without a slot state, or an import creeping into an import-free module
// is a red run naming the thing rather than a surprise in front of a visitor.
//
// Two habits from the house, both load-bearing here:
//
// - NON-VACUITY FIRST. Every scan proves it read something before it asserts
//   what it did not find (src/lib/ui/identity.spec.ts).
// - NEEDLES ASSEMBLED FROM FRAGMENTS, so this file's own source does not
//   contain the strings it forbids and cannot fail itself
//   (src/lib/protocol/forbidden-instructions.spec.ts).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as copy from "./session-copy";
import {
  AUTHORED_STATES,
  CHOOSER_NEVER_APPEARED_BODY,
  CONNECT_LABEL,
  FAILURE_COPY_STATES,
  NAMED_STATES,
  NOTHING_LISTED_STEPS,
  PICKER_EXPLAINER,
  RECONNECT_OFFER,
  REPLUG_OFFER,
  REVOKE_EXPLANATION,
  SAFE_PROMISE,
  type SessionPhase,
  type SlotState,
  TWO_STEP,
  notZonaBlock,
  silentBlock,
  slotStateOf,
} from "./session-copy";

const sessionCopySource = () =>
  readFileSync(
    fileURLToPath(new URL("./session-copy.ts", import.meta.url)),
    "utf8",
  );

/** The house comment stripper (src/lib/config-shape.spec.ts), backslash-free. */
const strip = (text: string) =>
  text
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

/** Assembled, never written: the engine name that appears in no string and no comment. */
const ENGINE = ["Chrom", "ium"].join("");
/** Assembled: the label of the OTHER surface, which no string in the module may hard-code. */
const PANEL_LABEL = ["TRY ON ", "DEVICE"].join("");
/** Assembled: Phase 4's step 1, which named a control that is not on the screen. */
const OFF_SCREEN_CONTROL = ["Dis", "connect"].join("");
/** Assembled: the scheme of the page the managed-computer sentence would send people to. */
const INTERNAL_SCHEME = ["about", ":"].join("");
/** Assembled: the export name the managed-computer sentence would have. */
const MANAGED = ["MAN", "AGED"].join("");

/**
 * The seventeen-row table of 06-02-PLAN.md's interfaces block, transcribed.
 *
 * It is a Record over SessionPhase rather than a list of pairs, so a phase
 * added to the union without a row here is a TYPE error in this file as well as
 * in the switch it describes. Seventeen phases, nine slot states, four rows
 * many-to-one.
 */
const TABLE: Record<SessionPhase, SlotState> = {
  starting: "S1",
  unsupported: "S0a",
  insecure: "S0b",
  idle: "S1",
  detected: "S2",
  choosing: "S3",
  opening: "S3",
  identifying: "S3",
  connected: "S4",
  "unplugged-while-connected": "S5",
  cancelled: "S6",
  "port-busy": "S6",
  "not-zona": "S6",
  silent: "S6",
  "unplugged-at-open": "S6",
  unknown: "S6",
  forgotten: "S7",
};

const ALL_SLOT_STATES: readonly SlotState[] = [
  "S0a",
  "S0b",
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "S7",
];

const FW = { major: 1, minor: 5, patch: 5 };

/**
 * One sample input per exported function, so test 6 puts every builder's OUTPUT
 * through the copy rules rather than only the constants. A function with no
 * entry here fails test 6 by name, so a sentence added later cannot quietly
 * escape the rules.
 */
const SAMPLES: Readonly<Record<string, readonly unknown[]>> = {
  slotStateOf: ["idle"],
  notZonaBlock: ["EN16", CONNECT_LABEL],
  silentBlock: [1.5, CONNECT_LABEL],
  unpluggedWhileConnectedBlock: [],
  firmwareText: [FW],
  moduleTail: [["EN16", "BU16"]],
  identitySentence: [FW, 3],
  identityDescription: [FW, 3],
  multiModuleLine: [["EN16", "BU16"]],
  liveConnected: [FW, 3],
  capabilityOf: [{ hasSerial: true, secure: true }],
};

/**
 * Every string the module can produce, named, by WALKING ITS OWN EXPORTS rather
 * than a hand-written list - so a string added later is covered on the day it
 * is added. Arrays and block objects are walked into, because the steps and the
 * failure details are exactly where a hard-coded label would hide.
 */
const everyString = () => {
  const out: { name: string; text: string }[] = [];
  const push = (name: string, value: unknown) => {
    if (typeof value === "string") {
      out.push({ name, text: value });
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => push(`${name}[${i}]`, item));
    } else if (value !== null && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) {
        push(`${name}.${key}`, item);
      }
    }
  };

  for (const [name, value] of Object.entries(copy)) {
    if (typeof value === "function") {
      const args = SAMPLES[name];
      expect(args, `no sample input is declared for ${name}`).toBeDefined();
      const build = value as (...a: readonly unknown[]) => unknown;
      push(name, build(...args));
    } else {
      push(name, value);
    }
  }
  return out;
};

describe("the session's copy contract (06-UI-SPEC)", () => {
  it("imports nothing at all, so any component may name it on the first paint", () => {
    // Phase 4's chunk guard matches specifier TEXT, so the header note's module
    // has to be free of the compiler entirely - not lightly loaded, free.
    const raw = sessionCopySource();
    expect(raw.length, "the source was actually read").toBeGreaterThan(4000);

    const source = strip(raw);
    expect(
      source.length,
      "the stripped source is still the module and not only its comments",
    ).toBeGreaterThan(4000);

    expect(source.includes('from "'), "session-copy.ts imports").toBe(false);
    expect(
      source.includes("import("),
      "session-copy.ts imports dynamically",
    ).toBe(false);
    expect(source.includes("import "), "session-copy.ts imports").toBe(false);
  });

  it("maps all seventeen phases onto the nine slot states, and starting is S1", () => {
    const rows = Object.entries(TABLE) as [SessionPhase, SlotState][];
    expect(rows.length, "seventeen phases, four rows many-to-one").toBe(17);

    for (const [phase, expected] of rows) {
      expect(slotStateOf(phase), `${phase} renders as ${expected}`).toBe(
        expected,
      );
    }

    // The row a reader is most likely to assume is missing. `starting` is the
    // value the session is initialised to and therefore the slot state of every
    // PRERENDERED page: S1 is the resting state, so hydration on a capable
    // browser moves nothing.
    expect(
      slotStateOf("starting"),
      "the prerendered page ships the resting slot",
    ).toBe("S1");

    const produced = new Set(rows.map(([phase]) => slotStateOf(phase)));
    expect(
      [...produced].sort(),
      "every one of the nine slot states is reachable",
    ).toEqual([...ALL_SLOT_STATES].sort());
  });

  it("names nine states, partitioned six and three, all of them terminal-looking", () => {
    expect(FAILURE_COPY_STATES.length, "the six failureCopy branches").toBe(6);
    expect(AUTHORED_STATES.length, "the three HANGAR authors").toBe(3);
    expect(NAMED_STATES.length, "six plus three is nine (Y-21)").toBe(9);

    const failure = new Set<string>(FAILURE_COPY_STATES);
    for (const state of AUTHORED_STATES) {
      expect(
        failure.has(state),
        `${state} cannot be both authored and rendered from failureCopy`,
      ).toBe(false);
    }

    expect([...FAILURE_COPY_STATES, ...AUTHORED_STATES]).toEqual([
      ...NAMED_STATES,
    ]);
    expect(new Set(NAMED_STATES).size, "the nine are distinct").toBe(9);

    // Every named state is a real phase, and every one of them lands in a slot
    // state that says something went wrong or never started.
    for (const state of NAMED_STATES) {
      expect(
        ["S0a", "S0b", "S5", "S6"],
        `${state} is a failure the visitor can see`,
      ).toContain(slotStateOf(state));
    }
  });

  it("interpolates the rendering surface's label and hard-codes no control name", () => {
    expect(notZonaBlock("EN16", CONNECT_LABEL).steps).toEqual([
      "Plug in a ZONA",
      `Click ${CONNECT_LABEL} again`,
    ]);
    expect(silentBlock(1.5, PANEL_LABEL).steps[1]).toBe(
      `Click ${PANEL_LABEL} again and pick a different port`,
    );

    // The same two blocks, from the other surface, so neither step can be a
    // literal that happens to match one caller.
    expect(notZonaBlock("EN16", PANEL_LABEL).steps[1]).toBe(
      `Click ${PANEL_LABEL} again`,
    );
    expect(silentBlock(1.5, CONNECT_LABEL).steps[1]).toBe(
      `Click ${CONNECT_LABEL} again and pick a different port`,
    );

    // Y-14, as a gate. Phase 4 hard-coded the panel's label into `silent` step
    // 2 and told `not-zona` to click a control the closed session had already
    // removed from the screen.
    const source = strip(sessionCopySource());
    expect(source.length, "the source was actually read").toBeGreaterThan(4000);
    expect(
      source.includes(PANEL_LABEL),
      "session-copy.ts hard-codes the panel's label",
    ).toBe(false);
    expect(
      source.includes(OFF_SCREEN_CONTROL),
      "session-copy.ts names a control that is not on the screen",
    ).toBe(false);
  });

  it("holds the long sentences character for character", () => {
    // The two counted in 06-UI-SPEC's reservation arithmetic, and the one the
    // plan asked to be measured rather than assumed.
    expect(PICKER_EXPLAINER.length, "the 130-character pre-click line").toBe(
      130,
    );
    expect(SAFE_PROMISE.length, "SAFE-01, measured").toBe(126);
    expect(RECONNECT_OFFER.length, "the reconnect offer, measured").toBe(88);

    expect(PICKER_EXPLAINER).toBe(
      "The browser opens its own list of ports — that prompt is the browser, not HANGAR, and nothing here sees a port until you pick one.",
    );
    expect(TWO_STEP).toBe(
      "Some browsers ask for permission before they show the list. If you were asked twice, the list appears after the second prompt.",
    );
    expect(SAFE_PROMISE).toBe(
      "HANGAR never writes to your ZONA on its own. Nothing reaches the module without a click, and this release cannot write at all.",
    );
    expect(RECONNECT_OFFER).toBe(
      "ZONA detected on this computer. One click connects it, and nothing is sent until you do.",
    );
    expect(REPLUG_OFFER).toBe(
      "Plug it back in and this offers to connect again — the permission you already gave is still there.",
    );
    expect(REVOKE_EXPLANATION).toBe(
      "Removes this site’s permission to see your ZONA. You can give it again from the picker whenever you like.",
    );

    expect(NOTHING_LISTED_STEPS).toEqual([
      "Try a different USB cable. A charge-only cable fits the socket and carries no data, and it is the most common reason a list comes up empty.",
      "Plug the ZONA straight into the computer rather than through a hub or a dock.",
      "A ZONA needs no driver. If every cable and every port gives an empty list, the module is not showing up to the computer at all, which is a hardware question rather than a browser one.",
    ]);
    expect(CHOOSER_NEVER_APPEARED_BODY).toBe(
      "Your browser may be blocking serial ports for this site. Check the site’s permissions — in Chrome, chrome://settings/content/serialPorts — and try again.",
    );
  });

  it("obeys the typography rules, names one browser on purpose, and names no engine", () => {
    const strings = everyString();
    expect(
      strings.length,
      "the export walk found the module's strings",
    ).toBeGreaterThan(30);

    const APOSTROPHE = String.fromCharCode(39);
    const emoji = /\p{Extended_Pictographic}/u;

    for (const { name, text } of strings) {
      expect(text.includes(ENGINE), `${name} names an engine`).toBe(false);
      expect(text.includes(APOSTROPHE), `${name} has a typewriter quote`).toBe(
        false,
      );
      expect(text.includes("!"), `${name} shouts`).toBe(false);
      expect(text.includes("..."), `${name} has three full stops`).toBe(false);
      expect(text.includes(" -- "), `${name} has a hyphen for a dash`).toBe(
        false,
      );
      expect(emoji.test(text), `${name} has an emoji`).toBe(false);

      // The MANAGED_POLICY deviation, half one: no sentence sends anyone to a
      // browser-internal page. See .planning/phases/06-device-session/
      // deferred-items.md item 2.
      expect(
        text.includes(INTERNAL_SCHEME),
        `${name} points at a browser-internal page`,
      ).toBe(false);
    }

    // The MANAGED_POLICY deviation, half two: the export does not exist under
    // any casing of its name.
    for (const name of Object.keys(copy)) {
      expect(
        name.toUpperCase().includes(MANAGED),
        `${name} reinstates the managed-computer sentence`,
      ).toBe(false);
    }

    // The real punctuation is present, so the rules above are not vacuously
    // satisfied by a module that simply has no punctuation.
    const all = strings.map((s) => s.text).join(" ");
    expect(all.includes(String.fromCharCode(0x2019)), "a real apostrophe").toBe(
      true,
    );
    expect(all.includes(String.fromCharCode(0x2026)), "a real ellipsis").toBe(
      true,
    );
    expect(all.includes(String.fromCharCode(0x2014)), "a real em dash").toBe(
      true,
    );

    // EXACTLY ONE string names a browser, and it is named here so the one
    // deviation from "never a browser name outside UNSUPPORTED_DETAIL" is a
    // recorded exception rather than a hole. A settings path is worthless
    // without the browser it belongs to.
    const named = strings
      .filter(({ text }) =>
        ["Chrome", "Edge", "Firefox", "Safari", ENGINE].some((browser) =>
          text.includes(browser),
        ),
      )
      .map(({ name }) => name);
    expect(named, "one string names a browser, and only one").toEqual([
      "CHOOSER_NEVER_APPEARED_BODY",
    ]);

    // And the engine appears nowhere in the file at all, comments included -
    // the invariant src/lib/transport/transport.spec.ts test 6 already holds
    // over the transport, and which it caught a comment breaking in 06-01.
    const raw = sessionCopySource();
    expect(raw.length, "the source was actually read").toBeGreaterThan(4000);
    expect(raw.includes(ENGINE), "session-copy.ts names an engine").toBe(false);
  });
});
