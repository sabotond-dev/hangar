// The session's copy contract, made executable.
//
// 06-UI-SPEC.md's table of nine slot states and its nine-state failure
// taxonomy ARE the specification of the STATES. The WORDS changed hands at
// 13-18: under 13-CONTEXT D-05 the register is the Bible's and under D-23
// (2026-09-12) every line the Bible never wrote is the one 13-18-BATCH.md
// proposed and the user approved, so test 5 reads the Bible, the batch and
// D-23 from disk and holds every string against them - Phase 6's measured
// lengths (35, 37, 143, 108, 114) retired with Phase 10's register; the
// mechanism that replaced them is containment in the documents that author
// the words. These six tests exist so that a reflow, a smart-quote
// regression, a hard-coded button name, a phase added without a slot state,
// or an import creeping into an import-free module is a red run naming the
// thing rather than a surprise in front of a visitor.
//
// THE TWO SNAPSHOT LINES WERE REWORDED AT 13.1-06 (13.1-CONTEXT D-07: Put
// back removed by the user's word). "so it can be put back" promised a
// control that no longer exists; the copy is still kept and the lines say
// so. They are in 13.1-COPY-NEW.md, this phase's ledger, which test 5 reads
// as its FOURTH document beside the Bible, the batch and D-23.
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
  LIVE_DETECTED,
  NAMED_STATES,
  NOTHING_LISTED_STEPS,
  RECONNECT_OFFER,
  REPLUG_OFFER,
  REVOKE_EXPLANATION,
  SAFE_NOTE,
  SNAPSHOT_DURABLE_LINE,
  SNAPSHOT_SESSION_LINE,
  type SessionPhase,
  type SlotState,
  TWO_STEP,
  UNPLUGGED_WHILE_CONNECTED,
  UNPLUGGED_WHILE_WRITING,
  WRITE_LOCK_REASON,
  identityDescription,
  identitySentence,
  liveConnected,
  notZonaBlock,
  pageName,
  silentBlock,
  slotStateOf,
  unpluggedWhileConnectedBlock,
} from "./session-copy";
import { stripComments } from "../../test-support/source";

const sessionCopySource = () =>
  readFileSync(
    fileURLToPath(new URL("./session-copy.ts", import.meta.url)),
    "utf8",
  );

/** Assembled, never written: the engine name that appears in no string and no comment. */
const ENGINE = ["Chrom", "ium"].join("");
/** Assembled: the label of the OTHER surface, which no string in the module may hard-code. */
const PANEL_LABEL = ["Apply to ", "ZONA"].join("");
/** Assembled: Phase 4's step 1, which named a control that is not on the screen. Since 13-18 the disconnect control's own label carries the word, so the rule is asserted over the STEPS, where Phase 4 broke it. */
const OFF_SCREEN_CONTROL = ["Dis", "connect"].join("");
/** Assembled: Phase 10's register, which no string may carry any more. */
const RETIRED_LABELS = [
  ["NO ", "ZONA"].join(""),
  ["CONNECT ", "ZONA"].join(""),
  ["FORGET THIS ", "ZONA"].join(""),
  ["DISCONNECT ", "ZONA"].join(""),
];

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

/** The four documents that author the words (install-copy.spec.ts reads the same four). */
const DOCUMENTS: readonly { path: string; heading: string; atLeast: number }[] =
  [
    {
      path: "../../../.planning/phases/13-gui-overhaul/bible/HANGAR-ZONA-GUI-design-specification.md",
      heading: "## 16. Copy examples",
      atLeast: 30_000,
    },
    {
      path: "../../../.planning/phases/13-gui-overhaul/13-18-BATCH.md",
      heading: "### I.2 Connecting",
      atLeast: 60_000,
    },
    {
      path: "../../../.planning/phases/13-gui-overhaul/13-CONTEXT.md",
      heading: "## D-23 [user] The copy batch approved as proposed",
      atLeast: 20_000,
    },
    {
      path: "../../../.planning/phases/13.1-bench-corrections-four/13.1-COPY-NEW.md",
      heading: "### Retired and rewritten by 13.1-06 (D-06, D-07)",
      atLeast: 10_000,
    },
  ];
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
  pageName: [2],
  notZonaBlock: ["EN16", CONNECT_LABEL],
  silentBlock: [1.5, CONNECT_LABEL],
  unpluggedWhileConnectedBlock: [],
  firmwareText: [FW],
  moduleTail: [["EN16", "BU16"]],
  identitySentence: [FW, 2],
  identityDescription: [FW, 2],
  multiModuleLine: [["EN16", "PBF4"]],
  liveConnected: [FW, 2],
  capabilityOf: [{ hasSerial: true, secure: true }],
};

/**
 * The OTHER branch of a two-form builder, walked beside its primary sample so
 * both sentences go through the rules (plan 07-04): the unplugged block's
 * writing form is a different literal from Phase 4's, and a rule it broke
 * would otherwise hide behind the default.
 */
const MORE_SAMPLES: Readonly<Record<string, readonly (readonly unknown[])[]>> =
  {
    unpluggedWhileConnectedBlock: [[true]],
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
      for (const extra of MORE_SAMPLES[name] ?? []) {
        push(`${name}(${extra.join(",")})`, build(...extra));
      }
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

    const source = stripComments(raw);
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
    // removed from the screen. The panel's label is absent from the whole
    // source; the disconnect's word is absent from every STEP (its own label
    // carries it since 13-18, and a label is not a step).
    const source = stripComments(sessionCopySource());
    expect(source.length, "the source was actually read").toBeGreaterThan(4000);
    expect(
      source.includes(PANEL_LABEL),
      "session-copy.ts hard-codes the panel's label",
    ).toBe(false);
    const steps = [
      ...notZonaBlock("EN16", CONNECT_LABEL).steps,
      ...silentBlock(1.5, CONNECT_LABEL).steps,
      ...unpluggedWhileConnectedBlock(true).steps,
    ];
    expect(steps.length, "the steps were walked").toBeGreaterThan(3);
    for (const step of steps) {
      expect(
        step.includes(OFF_SCREEN_CONTROL),
        `a step names a control that is not on the screen: ${step}`,
      ).toBe(false);
    }
  });

  it("holds every string against the documents that authored it: the Bible verbatim, the batch as approved", () => {
    const docs = DOCUMENTS.map(({ path }) => read(path));
    docs.forEach((doc, i) => {
      expect(
        doc.length,
        `${DOCUMENTS[i].path} was actually read`,
      ).toBeGreaterThan(DOCUMENTS[i].atLeast);
      expect(
        doc,
        `${DOCUMENTS[i].path} is not the document it claims to be`,
      ).toContain(DOCUMENTS[i].heading);
    });
    const [bible, batch, context, ledger] = docs;
    const d23 = context.slice(context.indexOf(DOCUMENTS[2].heading));
    expect(d23, "D-23 records the answer").toContain('> *"approve"*');

    // THE LINES TAKEN VERBATIM: the PDF's connect control (section 9's own
    // main action for No connection), section 9's Ready and Disconnected
    // labels, and section 16's Disconnected line as the resting slot's hidden
    // description.
    const verbatim: readonly [string, string][] = [
      ["CONNECT_LABEL", "Connect ZONA"],
      ["CONNECTED_LABEL", "ZONA connected"],
      ["CAPTION_UNPLUGGED", "Disconnected · draft retained"],
      ["HIDDEN_NAME_IDLE", "Preview only. Connect ZONA when you’re ready."],
    ];
    const produced = new Map(
      everyString().map(({ name, text }) => [name, text]),
    );
    for (const [name, line] of verbatim) {
      expect(bible, `the Bible gives ${name}'s line`).toContain(line);
      expect(produced.get(name), `${name} is the Bible's line, verbatim`).toBe(
        line,
      );
    }

    // EVERY OTHER STRING IS IN THE BATCH, as proposed and as approved (section
    // I.2). The two formatters are grammar, not copy, and are excused by name;
    // the page name is the two-word form the batch writes in every row; the
    // interpolated label folds back to the batch's placeholder.
    const excused = new Set([
      "firmwareText",
      "moduleTail",
      "pageName",
      // Machine identifiers, not copy.
      "FAILURE_COPY_STATES",
      "AUTHORED_STATES",
      "NAMED_STATES",
      // Batch row I.2.21 approves the three steps by reference ("the three
      // steps as shipped") rather than by quotation; this test pins them by
      // value below.
      "NOTHING_LISTED_STEPS",
    ]);
    const templated = (text: string) =>
      text
        .split(`Click ${CONNECT_LABEL} again`)
        .join("Click {label} again")
        .split("reported itself as EN16")
        .join("reported itself as {type}")
        .split("within 1.5 seconds")
        .join("within {n} seconds");
    const strings = everyString().filter(
      ({ name }) => !excused.has(name.split(/[.[(]/)[0]),
    );
    expect(
      strings.length,
      "enough strings were found to be checking anything",
    ).toBeGreaterThan(40);
    const misses = strings
      .filter(
        ({ text }) =>
          !batch.includes(templated(text)) &&
          !bible.includes(text) &&
          !ledger.includes(text),
      )
      .map(({ name, text }) => `${name}: ${templated(text)}`);
    expect(
      misses,
      "strings neither the Bible, the batch nor the 13.1 ledger carries",
    ).toEqual([]);
    // The ledger is not a blanket: the strings only it carries are the two
    // snapshot lines 13.1-06 reworded, and no other.
    expect(
      strings
        .filter(
          ({ text }) =>
            !batch.includes(templated(text)) && !bible.includes(text),
        )
        .map(({ name }) => name)
        .sort(),
      "the strings only the 13.1 ledger carries",
    ).toEqual(["SNAPSHOT_DURABLE_LINE", "SNAPSHOT_SESSION_LINE"]);

    // THE FOURTH FACT, SAFE-01: nothing is written without a click. The
    // sentence changed register at 13-18 (batch row I.2.9) and the fact did
    // not - both clauses of it are asserted, so a later shortening cannot drop
    // the promise while keeping the sentence.
    expect(SAFE_NOTE).toBe(
      "Nothing is written to your ZONA without a click. Browsing and previewing never touch it.",
    );
    expect(SAFE_NOTE).toContain("without a click");
    expect(SAFE_NOTE).toContain("Nothing is written");
    expect(RECONNECT_OFFER).toBe("ZONA detected. One click connects it.");
    // The offer and the announcer's detected sentence are ONE literal since
    // R-08 shortened the first onto the second (session-copy.ts says why).
    expect(LIVE_DETECTED, "the shown line and the spoken line are one").toBe(
      RECONNECT_OFFER,
    );

    // A NAMED AMENDMENT ASSERTS THE ABSENCE AS WELL AS THE PRESENCE. Without
    // these, a later reader who found a retired sentence in an older document
    // could re-add its export and every test here would stay green while the
    // site said the same thing twice, in two registers, in two places.
    for (const retired of [
      "PICKER_EXPLAINER",
      "SAFE_PROMISE",
      "NO_ZONA_LABEL",
    ]) {
      expect(
        Object.keys(copy),
        `${retired} came back - it is retired by name (R-02, R-03; D-23 for the resting label)`,
      ).not.toContain(retired);
    }

    // THE SECOND FACT, the snapshot, in the panel: both forms say what is
    // kept (the page, five scripts since 13-17), where, and that it is kept
    // on record; the session form says until when. Since 13.1-06 neither
    // promises a put-back (D-07: the control is gone; the copy is not).
    const PUT_BACK = ["put", " back"].join("");
    for (const line of [SNAPSHOT_DURABLE_LINE, SNAPSHOT_SESSION_LINE]) {
      expect(line).toContain("A copy of the page your ZONA was on");
      expect(line).toContain("kept on record");
      expect(line.includes(PUT_BACK), "the line offers a put-back").toBe(false);
    }
    expect(SNAPSHOT_DURABLE_LINE).toContain("kept in this browser");
    expect(SNAPSHOT_SESSION_LINE).toContain("until this tab closes");
    // The revoke line carries its three facts (Z-13; I.2.14).
    expect(REVOKE_EXPLANATION).toContain("can no longer see it");
    expect(REVOKE_EXPLANATION).toContain("Nothing on the module changes");
    expect(REVOKE_EXPLANATION).toContain("the copy of its own page stays");

    // The two forms of one event (Z-11): the writing form only when asked
    // for, the resting sentence by default and when asked for nothing.
    expect(unpluggedWhileConnectedBlock(true).detail).toBe(
      UNPLUGGED_WHILE_WRITING,
    );
    expect(unpluggedWhileConnectedBlock(false).detail).toBe(
      UNPLUGGED_WHILE_CONNECTED,
    );
    expect(unpluggedWhileConnectedBlock().detail).toBe(
      "Your ZONA was unplugged. Nothing was written.",
    );
    expect(unpluggedWhileConnectedBlock(true).steps).toEqual([]);
    expect(WRITE_LOCK_REASON).toBe("Not while HANGAR is writing to your ZONA.");
    expect(REPLUG_OFFER).toBe(
      "Plug it back in and you’ll be offered the connection again; the permission you gave still stands.",
    );

    expect(NOTHING_LISTED_STEPS).toEqual([
      "Try a different USB cable. A charge-only cable fits the socket and carries no data, and it is the most common reason a list comes up empty.",
      "Plug the ZONA straight into the computer rather than through a hub or a dock.",
      "A ZONA needs no driver. If every cable and every port gives an empty list, the module is not showing up to the computer at all, which is a hardware question rather than a browser one.",
    ]);
    expect(CHOOSER_NEVER_APPEARED_BODY).toBe(
      "Your browser may be blocking serial ports for this site. Check the site’s permissions — in Chrome, chrome://settings/content/serialPorts — and try again.",
    );

    // PAGES ARE NUMBERED FROM ONE (D-23, batch row I.3.1): wire 0 is Page 1,
    // the identity line says "on Page N" with the visitor's number, and the
    // description names the panel a click opens as the panel is labelled.
    expect(pageName(0)).toBe("Page 1");
    expect(identitySentence(FW, 0)).toBe("Firmware 1.5.5, on Page 1.");
    expect(identityDescription(FW, 2)).toBe(
      "Firmware 1.5.5, on Page 3. Opens Device actions.",
    );
    expect(liveConnected(FW, 2)).toBe(
      "ZONA connected. Firmware 1.5.5, on Page 3.",
    );
    const source = stripComments(sessionCopySource());
    expect(source.split("page + 1").length - 1, "the offset, once").toBe(1);
  });

  it("obeys the register mechanically, names two browsers on purpose, and names no engine", () => {
    const strings = everyString();
    expect(
      strings.length,
      "the export walk found the module's strings",
    ).toBeGreaterThan(30);

    const APOSTROPHE = String.fromCharCode(39);
    const emoji = /\p{Extended_Pictographic}/u;
    /** Uppercase runs of two or more letters: names and initialisms only, never a shouted word. */
    const ACRONYMS = new Set([
      "ZONA",
      "HANGAR",
      "USB",
      "HTTPS",
      "EN",
      "BU",
      "PBF",
    ]);

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
      expect(text, `${name} says Error`).not.toMatch(/error/i);
      expect(text, `${name} says loading`).not.toMatch(/loading/i);
      // NO UPPERCASE PARAGRAPHS (D-05), and none of Phase 10's shouted labels.
      for (const run of text.match(/[A-Z]{2,}/g) ?? []) {
        expect(ACRONYMS.has(run), `${name} shouts "${run}"`).toBe(true);
      }
      for (const label of RETIRED_LABELS) {
        expect(
          text.includes(label),
          `${name} carries Phase 10's "${label}"`,
        ).toBe(false);
      }

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

    // THE REAL PUNCTUATION IS PRESENT - a POSITIVE test since D-05: the Bible
    // writes `you’re`, and the register is contractions with real apostrophes,
    // not the absence of typewriter ones.
    const all = strings.map((s) => s.text).join(" ");
    const contractions = all.match(/[a-z]’(?:t|s|ll|re|ve)\b/g) ?? [];
    expect(
      contractions.length,
      "real apostrophes in real contractions",
    ).toBeGreaterThanOrEqual(4);
    expect(all.includes(String.fromCharCode(0x2026)), "a real ellipsis").toBe(
      true,
    );
    expect(all.includes(String.fromCharCode(0x2014)), "a real em dash").toBe(
      true,
    );

    // EXACTLY TWO strings name a browser, and they are named here so the two
    // deviations from "never a browser name outside UNSUPPORTED_DETAIL" are
    // recorded exceptions rather than holes: a settings path is worthless
    // without the browser it belongs to, and Firefox's two-step prompt is
    // Firefox's alone (batch row I.2.8). CONN-02 permits the names and forbids
    // the engine.
    const named = strings
      .filter(({ text }) =>
        ["Chrome", "Edge", "Firefox", "Safari", ENGINE].some((browser) =>
          text.includes(browser),
        ),
      )
      .map(({ name }) => name)
      .sort();
    expect(named, "two strings name a browser, and only two").toEqual([
      "CHOOSER_NEVER_APPEARED_BODY",
      "TWO_STEP",
    ]);
    expect(TWO_STEP).toContain("Firefox");
    expect(TWO_STEP).toContain("nothing is being installed");

    // NO CONTROL LABEL PARAPHRASED IN PROSE, as the narrower thing that can be
    // asserted: every sentence that tells the visitor to click something
    // names the label the surface handed in, exactly as it reads.
    let clicks = 0;
    for (const { name, text } of strings) {
      for (const match of text.matchAll(/[C]lick /g)) {
        clicks += 1;
        const rest = text.slice((match.index ?? 0) + match[0].length);
        expect(
          rest.startsWith(CONNECT_LABEL),
          `${name} tells the visitor to click "${rest.split(/[,.]/)[0]}", which is not the control as it reads`,
        ).toBe(true);
      }
    }
    expect(clicks, "the steps do name the control").toBeGreaterThanOrEqual(2);

    // And the engine appears nowhere in the file at all, comments included -
    // the invariant src/lib/transport/transport.spec.ts test 6 already holds
    // over the transport, and which it caught a comment breaking in 06-01.
    const raw = sessionCopySource();
    expect(raw.length, "the source was actually read").toBeGreaterThan(4000);
    expect(raw.includes(ENGINE), "session-copy.ts names an engine").toBe(false);
  });
});
