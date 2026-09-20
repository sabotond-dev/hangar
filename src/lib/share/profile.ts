// The Grid Editor profile file (change 13C, BENCH-2026-09-16.txt section 13, suggestion 10 and
// the user's note): the five strings a Store writes - a tuned configuration's or a surface's -
// as the `.json` the desktop Editor lists from `grid-userdata/configs` and loads onto a page.
// The shape is the Editor's own (a profile-cloud profile): id, name, description, type "ZONA",
// the Editor's version as strings, configType "profile", one entry per element the module has
// with every event it owns, createdAt / modifiedAt, virtualPath "". The element and event lists
// are read from @intechstudio/grid-protocol - for a ZONA the pad (0: setup, timer) and the
// system element (255: setup, utility, timer), which are exactly the five slots - and a HANGAR
// payload rides under one extra top-level key the Editor's loader never reads (`hangar`: a
// transfer.ts ExportFile), so the Sandbox can open the file again. Pure; the routes download.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { ModuleType, grid } from "@intechstudio/grid-protocol";
import {
  ELEMENT_SYSTEM,
  ELEMENT_TOUCH,
  EVENT_SETUP,
  EVENT_TIMER,
  EVENT_UTILITY,
} from "../protocol/constants";
import type { Surface } from "../store/schema";
import { classifyImport, type ExportFile } from "../store/transfer";
import { PROFILE_NOT_HANGAR_SURFACE, PROFILE_NOT_JSON } from "./profile-copy";

/** The five strings, keyed as sequence.ts's SLOTS key them (install.svelte.ts's ConfigStrings, restated: a type import is a specifier). */
export type ProfileStrings = {
  readonly systemTimer: string;
  readonly system: string;
  readonly systemUtility: string;
  readonly setup: string;
  readonly timer: string;
};

/** The module type word the file carries and the Editor matches against a connected module. */
export const PROFILE_MODULE_TYPE = ModuleType.ZONA;

/** The file's configType: a whole page, never a preset or a snippet. */
export const PROFILE_CONFIG_TYPE = "profile" as const;

/**
 * The desktop Editor's version, as the reference files in grid-userdata/configs carry it -
 * three STRINGS - read from the Editor's package.json (1.6.8) on 2026-09-21. The loader does
 * not compare it; the panel shows it.
 */
export const EDITOR_VERSION = {
  major: "1",
  minor: "6",
  patch: "8",
} as const;

/** The top-level key the HANGAR payload rides under; the Editor's loader reads no such key. */
export const HANGAR_KEY = "hangar" as const;

/**
 * The Editor's spelling for an event nobody touched (`4 Virtual Pages.json`). Unreachable on a
 * ZONA - the module's five events are the five slots, profile.spec.ts holds it - and kept so
 * the builder is total over the package's list.
 */
export const INIT_PLACEHOLDER = "--[[@cb]] --[[Init]]";

/** The name the file falls back to when the surface's or the card's name sanitises to nothing. */
export const FALLBACK_FILE_NAME = "ZONA profile";

export type ProfileEvent = {
  readonly event: number;
  readonly config: string;
};

export type ProfileElement = {
  readonly controlElementNumber: number;
  readonly events: readonly ProfileEvent[];
};

export type GridProfile = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: typeof PROFILE_MODULE_TYPE;
  readonly version: typeof EDITOR_VERSION;
  readonly configType: typeof PROFILE_CONFIG_TYPE;
  readonly configs: readonly ProfileElement[];
  readonly createdAt: string;
  readonly modifiedAt: string;
  readonly virtualPath: "";
  readonly [HANGAR_KEY]?: ExportFile;
};

/** One element the module has, by index, with the event numbers it owns in the package's order. */
export type ZonaElement = {
  readonly index: number;
  readonly events: readonly number[];
};

/** The ZONA's elements and their events, read from the package. */
export function zonaElements(): readonly ZonaElement[] {
  const list = grid.get_module_element_list(PROFILE_MODULE_TYPE);
  const out: ZonaElement[] = [];
  list.forEach((type, index) => {
    if (type === undefined || type === null) return;
    out.push({
      index,
      events: grid.get_element_events(type).map((e) => Number(e.value)),
    });
  });
  return out;
}

/** The string a slot holds, by element and event; undefined for an event HANGAR does not write. */
export function slotString(
  strings: ProfileStrings,
  element: number,
  event: number,
): string | undefined {
  if (element === ELEMENT_SYSTEM) {
    if (event === EVENT_SETUP) return strings.system;
    if (event === EVENT_UTILITY) return strings.systemUtility;
    if (event === EVENT_TIMER) return strings.systemTimer;
    return undefined;
  }
  if (element === ELEMENT_TOUCH) {
    if (event === EVENT_SETUP) return strings.setup;
    if (event === EVENT_TIMER) return strings.timer;
  }
  return undefined;
}

export type ProfileInput = {
  readonly name: string;
  readonly description: string;
  readonly strings: ProfileStrings;
  /** The moment, ISO: createdAt and modifiedAt both. */
  readonly at: string;
  /** A uuid v4; minted by the caller (crypto.randomUUID) so this module stays pure. */
  readonly id: string;
  /** The HANGAR payload: what Export as a file would write for the same thing. */
  readonly hangar?: ExportFile;
};

/** The file for one configuration: every element, every event, the five strings verbatim. */
export function buildProfile(input: ProfileInput): GridProfile {
  const configs = zonaElements().map(
    (el): ProfileElement => ({
      controlElementNumber: el.index,
      events: el.events.map(
        (event): ProfileEvent => ({
          event,
          config:
            slotString(input.strings, el.index, event) ?? INIT_PLACEHOLDER,
        }),
      ),
    }),
  );
  const profile: GridProfile = {
    id: input.id,
    name: input.name,
    description: input.description,
    type: PROFILE_MODULE_TYPE,
    version: EDITOR_VERSION,
    configType: PROFILE_CONFIG_TYPE,
    configs,
    createdAt: input.at,
    modifiedAt: input.at,
    virtualPath: "",
  };
  return input.hangar === undefined
    ? profile
    : { ...profile, [HANGAR_KEY]: input.hangar };
}

/** Four-space JSON, as the Editor's own writer indents a saved profile. */
export function serialiseProfile(profile: GridProfile): string {
  return JSON.stringify(profile, null, 4);
}

/**
 * `My performance` -> `My performance.json`: the name kept as the Editor names its own files,
 * less the characters no filesystem takes (`< > : " / \ | ? *`, controls), runs of space folded,
 * the ends trimmed, and a dot the end of a Windows name refuses.
 */
export function profileFileName(name: string): string {
  const clean = [...name]
    .map((c) => (c.charCodeAt(0) < 32 ? " " : c))
    .join("")
    .replace(/[<>:"/\\|?*]+/g, " ")
    .replace(/ +/g, " ")
    .trim()
    .replace(/\.+$/, "");
  return `${clean.length > 0 ? clean : FALLBACK_FILE_NAME}.json`;
}

/** What an import found: a surface to open as a new draft, or the line that refuses. */
export type ProfileRead =
  | { readonly kind: "surface"; readonly surface: Surface }
  | { readonly kind: "refused"; readonly reason: string };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Read a profile file back: the HANGAR payload under `hangar` through transfer.ts's own six
 * steps (the cap, the bounds, the overlap), and only a Sandbox one - a foreign profile, or a
 * HANGAR configuration's, has no surface and is refused with the one line. The profile's
 * strings are never read: the surface is the source, the strings its product.
 */
export function readProfile(text: string, at: string): ProfileRead {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { kind: "refused", reason: PROFILE_NOT_JSON };
  }
  if (!isObject(parsed)) return { kind: "refused", reason: PROFILE_NOT_JSON };
  const payload = parsed[HANGAR_KEY];
  if (!isObject(payload) || payload.kind !== "sandbox") {
    return { kind: "refused", reason: PROFILE_NOT_HANGAR_SURFACE };
  }
  const found = classifyImport(JSON.stringify(payload), () => undefined, at);
  if (found.record === undefined || found.record.kind !== "sandbox") {
    return {
      kind: "refused",
      reason: found.reason ?? PROFILE_NOT_HANGAR_SURFACE,
    };
  }
  return { kind: "surface", surface: found.record.surface };
}
