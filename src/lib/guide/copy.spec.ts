// The Quick guide's words (change 26, BENCH-2026-09-16.txt section 26): every export present and
// non-empty; D-05's register over every string (no exclamation mark, none of the three softeners,
// sentence-case headings); the eight sections in the brief's order with their anchors, each short;
// the Sandbox's add keys and every bracketed key held to shortcuts.ts; and each claim the guide
// makes held to the module the tree says it with, so a later change to the app that makes the
// guide untrue turns this file red rather than leaving a stale page.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import {
  CLEAR_LABEL,
  KEEP_LABEL,
  KEEP_REASONS,
  clearLine,
  keepLineEnabled,
  keptCaption,
} from "$lib/device/install-copy";
import { TARGET_LABEL } from "$lib/device/page-target";
import {
  NOTHING_LISTED_STEPS,
  SAFE_NOTE,
  TWO_STEP,
} from "$lib/device/session-copy";
import {
  ADD_MESSAGE_FULL,
  EXPORT_SURFACE,
  KIND_LABELS,
  LATCH,
  LATCH_HELPER,
  TOO_FULL_TO_STORE,
} from "$lib/sandbox/copy";
import { HOTKEYS } from "$lib/sandbox/editor";
import type { ElementKind } from "$lib/sandbox/model";
import { SHORTCUT_GROUPS } from "$lib/sandbox/shortcuts";
import { EXPORT_PROFILE, EXPORT_PROFILE_HELPER } from "$lib/share/profile-copy";
import { failureCopy } from "$lib/transport/transport";
import {
  EDIT_COLOR,
  OUTPUT_ROLE_LABELS,
  PREVIEW_INTERNAL_CLOCK,
  RANDOMIZE,
  RESET_SETTINGS,
  SAVE_COPY,
  SECTION_FEEL,
  SECTION_LOOK,
  SECTION_MIDI,
  SECTION_SOUND,
  SECTION_SYNC,
  SHARE_SNAPSHOT,
  SNAP_HINT,
  UNDO_RANDOMIZE,
  outputSummary,
} from "$lib/tune/inspector-copy";
import { SECTION_ORDER } from "$lib/tune/sections";
import { FIDELITY_LINE } from "$lib/ui/fidelity-line";
import * as copy from "./copy";
import {
  ADD_KEYS,
  FIGURE_CAPTIONS,
  FIGURE_NAMES,
  FIGURE_OUTPUT_PARTS,
  GUIDE_HEADLINE,
  GUIDE_SECTIONS,
  inlineParts,
  type GuideSection,
} from "./copy";

/** Every string reachable from a value, with the path it sits at. */
function stringsOf(value: unknown, path: string): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value))
    return value.flatMap((v, i) => stringsOf(v, `${path}[${i}]`));
  if (typeof value === "object" && value !== null)
    return Object.entries(value).flatMap(([k, v]) =>
      stringsOf(v, `${path}.${k}`),
    );
  return [];
}

const ALL = Object.entries(copy).flatMap(([name, value]) =>
  stringsOf(value, name),
);

/** The section's whole text, keys unbracketed. */
function textOf(section: GuideSection): string {
  return stringsOf(section.blocks, section.id)
    .map(([, s]) => s)
    .join(" ")
    .replace(/\[([^\]]+)\]/g, "$1");
}

/** The words a heading may capitalise after its first: names, acronyms and the controls' own labels. */
const NAMES = new Set(["ZONA", "DAW", "MIDI", "HANGAR", "Store", "USB-C"]);

function sentenceCase(heading: string): boolean {
  const words = heading.split(/\s+/);
  if (!/^[A-Z]/.test(words[0])) return false;
  return words
    .slice(1)
    .every((w) => NAMES.has(w) || w === w.toLowerCase() || /^[A-Z]+$/.test(w));
}

/** Sentences in a run of prose: a full stop, a question mark or a colon's close. */
const sentences = (text: string): number =>
  (text.match(/[.?](\s|$)/g) ?? []).length;

describe("the Quick guide's words (change 26)", () => {
  it("1. every export is present and non-empty, and every string in it has words", () => {
    const exported = Object.keys(copy);
    expect(exported.length, "the module exports its words").toBeGreaterThan(20);
    for (const [name, value] of Object.entries(copy)) {
      if (typeof value === "function") continue;
      if (typeof value === "string") expect(value.trim(), name).not.toBe("");
      else if (Array.isArray(value))
        expect(value.length, `${name} is empty`).toBeGreaterThan(0);
      else if (typeof value === "object" && value !== null)
        expect(Object.keys(value).length, `${name} is empty`).toBeGreaterThan(
          0,
        );
    }
    expect(ALL.length, "strings were walked").toBeGreaterThan(60);
    for (const [path, s] of ALL) expect(s.trim(), path).not.toBe("");
  });

  it("2. D-05's register: no exclamation mark, none of simply / just / easy, the real apostrophe, and every heading in sentence case", () => {
    for (const [path, s] of ALL) {
      expect(s.includes("!"), `${path}: an exclamation mark`).toBe(false);
      expect(
        /\b(simply|just|easy|easily)\b/i.test(s),
        `${path}: a softener`,
      ).toBe(false);
      expect(s.includes("'"), `${path}: a straight apostrophe`).toBe(false);
    }
    const headings = [
      GUIDE_HEADLINE,
      ...GUIDE_SECTIONS.map((s) => s.title),
      ...GUIDE_SECTIONS.flatMap((s) =>
        s.blocks.flatMap((b) =>
          b.kind === "answers" ? b.items.map((i) => i.problem) : [],
        ),
      ),
    ];
    expect(headings.length).toBe(1 + 8 + 6);
    for (const h of headings)
      expect(sentenceCase(h), `"${h}" is not sentence case`).toBe(true);
    // Uppercase only for the short labels (the eyebrow, the breadcrumb, the contents' title).
    for (const label of [
      copy.GUIDE_EYEBROW,
      copy.CONTENTS_TITLE,
      ...copy.GUIDE_BREADCRUMB,
    ]) {
      expect(label, "an uppercase label").toBe(label.toUpperCase());
      expect(label.split(/\s+/).length, `"${label}" is short`).toBeLessThan(5);
    }
  });

  it("3. eight sections in the brief's order, each with its anchor, each short: at most five sentences of prose, at most six items in a list", () => {
    expect(GUIDE_SECTIONS.map((s) => s.id)).toEqual([
      "connect",
      "try",
      "tune",
      "store",
      "build",
      "daw",
      "save",
      "troubleshooting",
    ]);
    expect(new Set(GUIDE_SECTIONS.map((s) => s.title)).size).toBe(8);
    for (const section of GUIDE_SECTIONS) {
      const prose = section.blocks
        .filter((b) => b.kind === "text")
        .map((b) => (b.kind === "text" ? b.text : ""))
        .join(" ");
      expect(sentences(prose), `${section.id}'s prose`).toBeLessThanOrEqual(5);
      expect(
        sentences(textOf(section)),
        `${section.id} says something`,
      ).toBeGreaterThanOrEqual(2);
      for (const block of section.blocks) {
        if (block.kind === "steps" || block.kind === "list")
          expect(block.items.length, section.id).toBeLessThanOrEqual(5);
        if (block.kind === "answers")
          expect(block.items.length, section.id).toBeLessThanOrEqual(6);
      }
    }
    // The four drawings, where the brief asked for them.
    expect(
      GUIDE_SECTIONS.filter((s) => s.figure).map((s) => [s.id, s.figure]),
    ).toEqual([
      ["connect", "zona"],
      ["store", "store"],
      ["build", "plate"],
      ["daw", "output"],
    ]);
    for (const kind of ["zona", "store", "plate", "output"] as const) {
      expect(FIGURE_NAMES[kind].trim()).not.toBe("");
      expect(FIGURE_CAPTIONS[kind].trim()).not.toBe("");
    }
  });

  it("4. the add keys are shortcuts.ts's, in its order, each arming the element the Sandbox names, and every bracketed key is one the sheet lists", () => {
    const addGroup = SHORTCUT_GROUPS.find((g) => g.title === "Add elements");
    expect(addGroup, "the sheet has its Add elements group").toBeDefined();
    const armRows = (addGroup?.rows ?? []).filter((r) =>
      r.what.startsWith("Arm a"),
    );
    expect(armRows.length).toBe(5);
    expect(ADD_KEYS.map((k) => k.key)).toEqual(armRows.map((r) => r.keys[0]));
    const kindOf = (key: string): ElementKind =>
      (Object.keys(HOTKEYS) as ElementKind[]).find(
        (kind) => HOTKEYS[kind] === key.toLowerCase(),
      ) as ElementKind;
    for (const { key, what } of ADD_KEYS)
      expect(what, `${key}`).toBe(KIND_LABELS[kindOf(key)]);

    const sheetKeys = new Set(
      SHORTCUT_GROUPS.flatMap((g) =>
        g.rows.flatMap((r) => r.keys.flatMap((k) => [k, ...k.split("+")])),
      ),
    );
    const bracketed = ALL.flatMap(([, s]) =>
      [...s.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]),
    );
    expect(bracketed.length, "the guide names keys").toBeGreaterThan(0);
    for (const key of bracketed)
      expect(sheetKeys.has(key), `[${key}] is on the sheet`).toBe(true);
  });

  it("5. inlineParts splits a sentence into text and keys and drops nothing", () => {
    expect(inlineParts("Press [?] for every shortcut.")).toEqual([
      { text: "Press " },
      { key: "?" },
      { text: " for every shortcut." },
    ]);
    expect(inlineParts("[Shift]")).toEqual([{ key: "Shift" }]);
    expect(inlineParts("No keys here.")).toEqual([{ text: "No keys here." }]);
    for (const [path, s] of ALL) {
      const joined = inlineParts(s)
        .map((p) => ("key" in p ? `[${p.key}]` : p.text))
        .join("");
      expect(joined, path).toBe(s);
    }
  });

  it("6. every claim is the tree's: the browsers, the port, the rack, the Store sequence, the keys, the exports, the troubleshooting titles", () => {
    const section = (id: string) =>
      textOf(GUIDE_SECTIONS.find((s) => s.id === id) as GuideSection);

    // Connect: the browsers transport.ts names, Firefox's first prompt, the cable, the promise.
    const unsupported = failureCopy("no-web-serial");
    const connect = section("connect");
    for (const name of ["Chrome", "Edge", "Firefox 151", "Safari", "iOS"]) {
      expect(unsupported.detail).toContain(name);
      expect(connect).toContain(name);
    }
    expect(unsupported.detail).toContain("Bluetooth serial ports");
    expect(connect).toContain("Bluetooth serial ports");
    expect(TWO_STEP).toContain("Firefox asks first");
    expect(connect).toContain("Firefox asks first");
    expect(NOTHING_LISTED_STEPS[0]).toContain("charge-only");
    expect(connect).toContain(SAFE_NOTE);
    const busy = failureCopy("port-busy", undefined, "Connect ZONA");
    expect(busy.detail).toContain("Grid Editor");
    expect(busy.steps.join(" ")).toContain("tray icon");
    expect(connect).toContain("tray icon");

    // Try: the fidelity line, verbatim.
    expect(section("try")).toContain(FIDELITY_LINE.replace(".", ""));

    // Tune: the five sections in sections.ts's order, the snap, the controls by their labels.
    const tune = section("tune");
    const names = [
      SECTION_LOOK,
      SECTION_FEEL,
      SECTION_SOUND,
      SECTION_MIDI,
      SECTION_SYNC,
    ];
    expect(SECTION_ORDER.length).toBe(names.length);
    expect(tune).toContain(`${names.slice(0, 4).join(", ")} and ${names[4]}`);
    expect(SNAP_HINT).toContain("snaps to the nearest step");
    expect(tune).toContain("snaps to the nearest step");
    for (const label of [EDIT_COLOR, RESET_SETTINGS, RANDOMIZE, UNDO_RANDOMIZE])
      expect(tune).toContain(label);

    // Store: the labels, the sequence keepLineEnabled describes, the proved caption, Clear's line.
    const store = section("store");
    for (const label of [TARGET_LABEL, KEEP_LABEL, CLEAR_LABEL])
      expect(store).toContain(label);
    expect(keepLineEnabled(0)).toContain("firmware default, then writes");
    expect(store).toContain("returns the page to its firmware default, writes");
    expect(store).toContain(keptCaption(0));
    expect(clearLine(0)).toContain("Your browser draft stays as it is.");
    expect(store).toContain("your browser draft stays as it is");

    // Build: Latch's meaning, three extra messages at most.
    const build = section("build");
    expect(build).toContain(LATCH);
    expect(LATCH_HELPER).toContain("the finger keeps this element");
    expect(ADD_MESSAGE_FULL).toContain("three extra messages at most");
    expect(build).toContain("up to three extra messages");

    // DAW: the output's words, the preview's clock.
    const daw = section("daw");
    for (const word of [
      OUTPUT_ROLE_LABELS.type,
      OUTPUT_ROLE_LABELS.channel,
      OUTPUT_ROLE_LABELS.number,
      OUTPUT_ROLE_LABELS.receive,
    ])
      expect(daw).toContain(word);
    expect(PREVIEW_INTERNAL_CLOCK).toContain("no MIDI clock");
    expect(daw).toContain("has no clock");
    expect(outputSummary(FIGURE_OUTPUT_PARTS)).toBe(
      "Note · Ch 1 · C4 · Receive",
    );
    expect(FIGURE_NAMES.output).toContain(outputSummary(FIGURE_OUTPUT_PARTS));

    // Save: the four controls by their labels, the Editor's folder.
    const save = section("save");
    for (const label of [
      SAVE_COPY,
      SHARE_SNAPSHOT,
      EXPORT_PROFILE,
      EXPORT_SURFACE,
    ])
      expect(save).toContain(label);
    expect(EXPORT_PROFILE_HELPER).toContain("grid-userdata/configs");
    expect(save).toContain("grid-userdata/configs");

    // Troubleshooting: the port's title is failureCopy's, the refusals the store's.
    const trouble = GUIDE_SECTIONS.find((s) => s.id === "troubleshooting");
    const problems = (trouble?.blocks ?? []).flatMap((b) =>
      b.kind === "answers" ? b.items.map((i) => i.problem) : [],
    );
    expect(problems[0]).toBe(busy.title);
    expect(KEEP_REASONS["already-kept"]).toContain("Change something");
    expect(TOO_FULL_TO_STORE).toContain("too full for a ZONA page");
    expect(section("troubleshooting")).toContain("too full for a ZONA page");
  });
});
