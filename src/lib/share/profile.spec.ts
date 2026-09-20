// The Grid Editor profile file (change 13C, BENCH-2026-09-16.txt section 13, suggestion 10 and
// the user's note): seven tests. The element and event list from the package is the five slots;
// the file's shape is the reference file's (`Documents/grid-userdata/configs/4 Virtual Pages.json`
// and `New VSN1L Profile 1.json`, read 2026-09-20 - their key set and value shapes are pinned here
// as literals because the folder is not the repository's); the five strings are byte-identical to
// what land.ts writes for a surface and survive the Editor's own parse-and-send path; the
// desktop Editor's loader, mirrored read for read from `grid-editor/src/renderer/runtime/runtime.ts`
// (`GridProfileData.createFromCloudData`, `GridPresetData`, `GridAction.parse`) and
// `src/electron/src/profiles.ts` (`loadConfigsFromDirectory`), is satisfied; the HANGAR payload
// round-trips a surface and refuses everything else with its line; the file name; the download door.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { ModuleType, grid } from "@intechstudio/grid-protocol";
import { beforeAll, describe, expect, it } from "vitest";
import { padReady } from "../pad/ready";
import {
  ELEMENT_SYSTEM,
  ELEMENT_TOUCH,
  EVENT_SETUP,
  EVENT_TIMER,
  EVENT_UTILITY,
} from "../protocol/constants";
import { canonical } from "../sandbox/cost";
import { SandboxEditor } from "../sandbox/editor";
import { landSurface } from "../sandbox/land";
import { emptySurface } from "../sandbox/model";
import { SURFACE_ELEMENT_CAP, type SandboxRecord } from "../store/schema";
import { downloadText, exportFile } from "../store/transfer";
import { SLOTS } from "../transport/sequence";
import {
  EDITOR_VERSION,
  FALLBACK_FILE_NAME,
  HANGAR_KEY,
  INIT_PLACEHOLDER,
  PROFILE_CONFIG_TYPE,
  PROFILE_MODULE_TYPE,
  buildProfile,
  profileFileName,
  readProfile,
  serialiseProfile,
  slotString,
  zonaElements,
  type GridProfile,
  type ProfileStrings,
} from "./profile";
import {
  MADE_IN_HANGAR,
  PROFILE_NOT_HANGAR_SURFACE,
  PROFILE_NOT_JSON,
  configDescription,
  surfaceDescription,
} from "./profile-copy";

const T0 = "2026-09-21T06:00:00.000Z";
const ID = "9b4cf01f-dae7-41e8-81c1-6c209ecac7eb";

/** Five distinct strings, one per slot, so a misplaced one is visible by name. */
const STRINGS: ProfileStrings = {
  systemTimer: "--[[@cb]]print(1)",
  system: "--[[@cb]]print(2)",
  systemUtility: "--[[@cb]]print(3)",
  setup: "--[[@cb]]print(4)",
  timer: "--[[@cb]]print(5)",
};

/** The reference files' top-level keys (both files carry exactly these ten). */
const REFERENCE_KEYS = [
  "id",
  "name",
  "description",
  "type",
  "version",
  "configType",
  "configs",
  "createdAt",
  "modifiedAt",
  "virtualPath",
].sort();

/**
 * The Editor's action parser, verbatim from `GridAction.parse` (runtime.ts): whitespace runs
 * folded, then one action per `--[[@short]]` marker with the body up to the next marker.
 */
function editorParse(script: string): { short: string; body: string }[] {
  const actionString = script.replace(/\s{2,10}/g, " ");
  return [
    ...actionString.matchAll(/--\[\[@(.*?)\]\]\s*(.*?)(?=(--\[\[@|$))/gs),
  ].map(([, meta, code]) => ({
    short: meta.split(/#(.*)/)[0],
    body: code.trim(),
  }));
}

/** The Editor's `ActionData.toLua`: the marker, ONE space, the body - and the string the send path minifies. */
const editorToLua = (a: { short: string; body: string }): string =>
  `--[[@${a.short}]] ${a.body}`;

const config = (profile: GridProfile, element: number, event: number) =>
  profile.configs
    .find((c) => c.controlElementNumber === element)
    ?.events.find((e) => e.event === event)?.config;

/** A two-element surface through the editor, as the Sandbox builds one. */
function twoElementSurface() {
  const editor = new SandboxEditor(emptySurface("s-13c", "Loop"));
  editor.template();
  return editor.surface;
}

function sandboxRecord(surface: ReturnType<typeof twoElementSurface>) {
  const record: SandboxRecord = {
    schema: 1,
    id: surface.id,
    name: surface.name,
    kind: "sandbox",
    source: surface.id,
    surface,
    createdAt: T0,
    editedAt: T0,
  };
  return record;
}

describe("the Grid Editor profile file (src/lib/share/profile.ts)", () => {
  beforeAll(async () => {
    await padReady();
  });

  it("1. the ZONA's elements and events, read from the package, are the pad (0: setup, timer) and the system element (255: setup, utility, timer) - exactly sequence.ts's five slots, so no Init placeholder is ever written", () => {
    expect(PROFILE_MODULE_TYPE).toBe("ZONA");
    expect(ModuleType.ZONA).toBe("ZONA");
    const elements = zonaElements();
    expect(elements).toEqual([
      { index: ELEMENT_TOUCH, events: [EVENT_SETUP, EVENT_TIMER] },
      {
        index: ELEMENT_SYSTEM,
        events: [EVENT_SETUP, EVENT_UTILITY, EVENT_TIMER],
      },
    ]);
    expect([ELEMENT_TOUCH, ELEMENT_SYSTEM]).toEqual([0, 255]);
    expect([EVENT_SETUP, EVENT_UTILITY, EVENT_TIMER]).toEqual([0, 4, 6]);
    // The package's own list, read directly, agrees with the reader.
    const list = grid.get_module_element_list(ModuleType.ZONA);
    expect(list.length).toBe(256);
    expect(list[0]).toBe("touch");
    expect(list[255]).toBe("system");
    expect(list.filter((t) => t !== undefined && t !== null)).toHaveLength(2);
    // Every (element, event) pair the profile lists is one SLOTS writes, and the other way round.
    const listed = elements.flatMap((el) =>
      el.events.map((event) => `${el.index}/${event}`),
    );
    const written = SLOTS.map((s) => `${s.element}/${s.event}`);
    expect([...listed].sort()).toEqual([...written].sort());
    // So every event holds a slot's string and the placeholder is unreachable.
    for (const el of elements) {
      for (const event of el.events) {
        expect(slotString(STRINGS, el.index, event)).toBeDefined();
      }
    }
    expect(slotString(STRINGS, 1, EVENT_SETUP)).toBeUndefined();
    expect(slotString(STRINGS, ELEMENT_SYSTEM, 3)).toBeUndefined();
    const profile = buildProfile({
      id: ID,
      name: "Five",
      description: "d",
      strings: STRINGS,
      at: T0,
    });
    for (const c of profile.configs) {
      for (const e of c.events) expect(e.config).not.toBe(INIT_PLACEHOLDER);
    }
    // The placeholder's spelling is the Editor's own, kept for a module whose list is wider.
    expect(INIT_PLACEHOLDER).toBe("--[[@cb]] --[[Init]]");
  });

  it("2. the file's shape is the reference file's: the ten keys, type ZONA, the Editor's version 1.6.8 as three strings, configType profile, ISO moments, an empty virtualPath, a v4 id, every element with every event, and four-space JSON with no trailing newline", () => {
    const profile = buildProfile({
      id: ID,
      name: "My performance",
      description: surfaceDescription("2 elements"),
      strings: STRINGS,
      at: T0,
    });
    expect(Object.keys(profile).sort()).toEqual(REFERENCE_KEYS);
    expect(profile.type).toBe("ZONA");
    expect(profile.configType).toBe(PROFILE_CONFIG_TYPE);
    expect(profile.configType).toBe("profile");
    expect(profile.version).toEqual({ major: "1", minor: "6", patch: "8" });
    expect(EDITOR_VERSION).toEqual(profile.version);
    for (const part of Object.values(profile.version)) {
      expect(typeof part).toBe("string");
    }
    expect(profile.createdAt).toBe(T0);
    expect(profile.modifiedAt).toBe(T0);
    expect(new Date(profile.createdAt).toISOString()).toBe(T0);
    expect(profile.virtualPath).toBe("");
    expect(profile.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(profile.name).toBe("My performance");
    expect(profile.description).toBe("2 elements. Made in HANGAR.");
    expect(MADE_IN_HANGAR).toBe("Made in HANGAR");
    expect(configDescription("A pad that sings.")).toBe(
      "A pad that sings. Made in HANGAR.",
    );
    // The elements in index order, each with its events in the package's order.
    expect(profile.configs.map((c) => c.controlElementNumber)).toEqual([
      0, 255,
    ]);
    expect(profile.configs[0].events.map((e) => e.event)).toEqual([0, 6]);
    expect(profile.configs[1].events.map((e) => e.event)).toEqual([0, 4, 6]);
    expect(config(profile, 0, 0)).toBe(STRINGS.setup);
    expect(config(profile, 0, 6)).toBe(STRINGS.timer);
    expect(config(profile, 255, 0)).toBe(STRINGS.system);
    expect(config(profile, 255, 4)).toBe(STRINGS.systemUtility);
    expect(config(profile, 255, 6)).toBe(STRINGS.systemTimer);
    // The Editor's writer: JSON.stringify(config, null, 4), no newline after.
    const text = serialiseProfile(profile);
    expect(text.startsWith('{\n    "id": ')).toBe(true);
    expect(text.endsWith("}")).toBe(true);
    expect(JSON.parse(text)).toEqual(profile);
    // A crypto v4 id, as the routes mint one, passes the same shape.
    expect(crypto.randomUUID()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("3. a surface's five strings in the file are byte-identical to what land.ts hands the store, and each survives the Editor's own path - parsed into one @cb action, re-serialised with its one space, minified - as the same bytes", async () => {
    const surface = twoElementSurface();
    const landed = await landSurface(surface, { slots: 5 });
    expect(landed.refusal).toBeUndefined();
    const profile = buildProfile({
      id: ID,
      name: surface.name,
      description: surfaceDescription("2 elements"),
      strings: landed.config,
      at: T0,
    });
    expect(config(profile, 0, 0)).toBe(landed.config.setup);
    expect(config(profile, 0, 6)).toBe(landed.config.timer);
    expect(config(profile, 255, 0)).toBe(landed.config.system);
    expect(config(profile, 255, 4)).toBe(landed.config.systemUtility);
    expect(config(profile, 255, 6)).toBe(landed.config.systemTimer);
    // The Editor's parse (GridAction.parse) reads each as ONE code-block action whose body is
    // the string past the marker; ActionData.toLua puts one space after the marker; the send
    // path (GridEvent.sendToGrid: GridScript.compressScript(this.toLua())) minifies - and the
    // minifier's fixed point is HANGAR's canonical string, so the module receives the same bytes.
    for (const c of profile.configs) {
      for (const e of c.events) {
        expect(e.config.startsWith("--[[@cb]]")).toBe(true);
        const actions = editorParse(e.config);
        expect(actions, `${c.controlElementNumber}/${e.event}`).toHaveLength(1);
        expect(actions[0].short).toBe("cb");
        const sent = await canonical(editorToLua(actions[0]));
        expect(sent.text, `${c.controlElementNumber}/${e.event}`).toBe(
          e.config,
        );
      }
    }
  });

  it("4. the desktop Editor's loader, mirrored: the folder reader keeps a .json whose configType is truthy; createFromCloudData finds every element of the module's list in configs and reads only configs, type, name, description and id; every event listed is one its element owns, so GridPresetData skips none; and the hangar key is nothing the loader reads", () => {
    const profile = buildProfile({
      id: ID,
      name: "Loop",
      description: "d",
      strings: STRINGS,
      at: T0,
      hangar: exportFile(sandboxRecord(twoElementSurface()), T0),
    });
    // profiles.ts loadConfigsFromDirectory: `if (obj.configType)` is the whole gate.
    expect(Boolean(profile.configType)).toBe(true);
    // runtime.ts GridProfileData.createFromCloudData, read for read.
    const LOADER_READS = ["configs", "type", "name", "description", "id"];
    for (const key of LOADER_READS) expect(profile).toHaveProperty(key);
    expect(LOADER_READS).not.toContain(HANGAR_KEY);
    expect(HANGAR_KEY).toBe("hangar");
    const list = grid.get_module_element_list(profile.type);
    let elements = 0;
    for (const [index, type] of Object.entries(list)) {
      if (type === undefined || type === null) continue;
      elements += 1;
      const found = profile.configs.find(
        (e) => e.controlElementNumber === Number(index),
      );
      // `data.find(...).events` - a missing element would throw in the Editor.
      expect(found, `element ${index}`).toBeDefined();
      const owned = grid.get_element_events(type).map((e) => Number(e.value));
      for (const event of found?.events ?? []) {
        // GridPresetData: `element.findEvent(type)` undefined is skipped - none is.
        expect(owned, `element ${index} event ${event.event}`).toContain(
          event.event,
        );
        expect(editorParse(event.config).length).toBeGreaterThan(0);
      }
    }
    expect(elements).toBe(2);
    // ProfileLoadOverlay's isCompatible(module.type, config.type): equality outside the VSN1 pair.
    expect(profile.type).toBe(ModuleType.ZONA);
  });

  it("5. the HANGAR payload: a surface's profile carries its Export-as-a-file envelope under hangar and reads back as the same surface; a configuration's payload, a profile without the key, a foreign JSON, a broken file and a payload transfer.ts refuses each read as their line", () => {
    const surface = twoElementSurface();
    const envelope = exportFile(sandboxRecord(surface), T0);
    const profile = buildProfile({
      id: ID,
      name: surface.name,
      description: "d",
      strings: STRINGS,
      at: T0,
      hangar: envelope,
    });
    expect(profile[HANGAR_KEY]).toBe(envelope);
    expect(Object.keys(profile).sort()).toEqual(
      [...REFERENCE_KEYS, HANGAR_KEY].sort(),
    );
    const back = readProfile(serialiseProfile(profile), T0);
    expect(back.kind).toBe("surface");
    if (back.kind !== "surface") throw new Error("refused");
    expect(back.surface).toEqual(surface);
    expect(back.surface.regions.map((r) => [r.name, r.kind])).toEqual([
      ["Filter", "fader"],
      ["Hold", "button"],
    ]);
    // A configuration's profile (a playground payload) has no surface.
    const playground = buildProfile({
      id: ID,
      name: "Arc",
      description: "d",
      strings: STRINGS,
      at: T0,
      hangar: exportFile(
        {
          schema: 1,
          id: "copy:arc:1",
          name: "Arc",
          kind: "playground",
          source: "arc",
          knobIndices: [],
          createdAt: T0,
          editedAt: T0,
        },
        T0,
        () => [],
      ),
    });
    expect(readProfile(serialiseProfile(playground), T0)).toEqual({
      kind: "refused",
      reason: PROFILE_NOT_HANGAR_SURFACE,
    });
    // A profile without the key - the Editor's own export, or a hand-made one.
    const foreign = buildProfile({
      id: ID,
      name: "Theirs",
      description: "d",
      strings: STRINGS,
      at: T0,
    });
    expect(readProfile(serialiseProfile(foreign), T0)).toEqual({
      kind: "refused",
      reason: PROFILE_NOT_HANGAR_SURFACE,
    });
    expect(readProfile('{"hangar": 5}', T0).kind).toBe("refused");
    expect(readProfile("[]", T0)).toEqual({
      kind: "refused",
      reason: PROFILE_NOT_JSON,
    });
    expect(readProfile("{", T0)).toEqual({
      kind: "refused",
      reason: PROFILE_NOT_JSON,
    });
    // A payload transfer.ts refuses (its cap) refuses with transfer.ts's line.
    const crowded = {
      ...surface,
      regions: Array.from({ length: SURFACE_ELEMENT_CAP + 1 }, (_, i) => ({
        ...surface.regions[1],
        id: `b-${i}`,
        name: `B ${i}`,
        col: i % 9,
        row: Math.floor(i / 9),
        w: 1,
        h: 1,
      })),
    };
    const over = readProfile(
      serialiseProfile(
        buildProfile({
          id: ID,
          name: "Over",
          description: "d",
          strings: STRINGS,
          at: T0,
          hangar: exportFile(sandboxRecord(crowded), T0),
        }),
      ),
      T0,
    );
    expect(over.kind).toBe("refused");
    if (over.kind === "refused") {
      expect(over.reason).toContain(
        `a page holds at most ${SURFACE_ELEMENT_CAP}`,
      );
    }
    // A payload whose envelope is not HANGAR's is refused by the same door.
    expect(
      readProfile(
        JSON.stringify({
          ...foreign,
          hangar: { ...envelope, app: "elsewhere" },
        }),
        T0,
      ).kind,
    ).toBe("refused");
  });

  it("6. the file name is the Editor's own spelling - the name kept with its spaces and case - less the nine characters no filesystem takes and the controls, runs of space folded, a trailing dot dropped, and the fallback for a name that leaves nothing", () => {
    expect(profileFileName("My performance")).toBe("My performance.json");
    expect(profileFileName("Loop")).toBe("Loop.json");
    expect(profileFileName('a<b>:c"d/e\\f|g?h*i')).toBe(
      "a b c d e f g h i.json",
    );
    expect(profileFileName("  spaced   out \t name ")).toBe(
      "spaced out name.json",
    );
    expect(profileFileName("ends with a dot.")).toBe("ends with a dot.json");
    expect(profileFileName("tab\tandcontrol")).toBe("tab and control.json");
    expect(profileFileName("   ")).toBe(`${FALLBACK_FILE_NAME}.json`);
    expect(profileFileName("***")).toBe("ZONA profile.json");
    expect(profileFileName("Ünïcode ok")).toBe("Ünïcode ok.json");
  });

  it("7. the download door: downloadText hands the browser one Blob of the text under the name, clicks once, removes the anchor and revokes the URL after the click - the same path Export as a file takes", async () => {
    const created: Blob[] = [];
    const revoked: string[] = [];
    let clicked = 0;
    let removed = 0;
    let appended = 0;
    const anchor = {
      href: "",
      download: "",
      rel: "",
      style: { display: "" },
      click: () => {
        clicked += 1;
      },
      remove: () => {
        removed += 1;
      },
    };
    const name = downloadText("My performance.json", '{"a":1}', {
      document: {
        createElement: () => anchor as unknown as HTMLAnchorElement,
        body: {
          append: () => {
            appended += 1;
          },
        } as unknown as HTMLElement,
      },
      url: {
        createObjectURL: (blob: Blob | MediaSource) => {
          created.push(blob as Blob);
          return "blob:hangar/13c";
        },
        revokeObjectURL: (href: string) => {
          revoked.push(href);
        },
      },
      defer: (run) => run(),
    });
    expect(name).toBe("My performance.json");
    expect(anchor.download).toBe("My performance.json");
    expect(anchor.href).toBe("blob:hangar/13c");
    expect(anchor.rel).toBe("noopener");
    expect([clicked, removed, appended]).toEqual([1, 1, 1]);
    expect(revoked).toEqual(["blob:hangar/13c"]);
    expect(created).toHaveLength(1);
    expect(created[0].type).toBe("application/json");
    expect(await created[0].text()).toBe('{"a":1}');
  });
});
