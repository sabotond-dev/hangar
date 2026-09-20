// Every word the Grid Editor profile export and import show (change 13C, BENCH-2026-09-16.txt
// section 13, suggestion 10 and the user's note), in one module that imports nothing, read by
// the Sandbox and the workspace alike. D-05's register: sentence case, the fact then the way.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** The two controls. */
export const EXPORT_PROFILE = "Export for Grid Editor";
export const IMPORT_PROFILE = "Import a profile";

/** The export's description, as the controls' sr-only text and title. */
export const EXPORT_PROFILE_HELPER =
  "Saves a Grid Editor profile file holding the five strings a Store writes. Drop it into the Editor’s grid-userdata/configs folder and it opens there.";
export const IMPORT_PROFILE_HELPER =
  "Opens a profile file HANGAR exported as a new surface. A profile made elsewhere has no surface to open.";

/** The export while it cannot run: the measure still running, or a string over the budget. */
export const EXPORT_PROFILE_MEASURING =
  "Measuring the surface. Try again in a moment.";
export const EXPORT_PROFILE_OVER =
  "A string is over the budget, so the file would not fit a ZONA page. Remove an element first.";

/** The line the profile file carries in its description, after the name's own sentence. */
export const MADE_IN_HANGAR = "Made in HANGAR";
/** A surface's description: its element count line and the mark. */
export const surfaceDescription = (elements: string): string =>
  `${elements}. ${MADE_IN_HANGAR}.`;
/** A configuration's description: its listing sentence and the mark. */
export const configDescription = (sentence: string): string =>
  `${sentence} ${MADE_IN_HANGAR}.`;

/** The export's outcomes: the Sandbox's line with the file name, the workspace's pinned word. */
export const profileExportedLine = (fileName: string): string =>
  `Exported as ${fileName}.`;
export const PROFILE_EXPORTED = "Exported";

/** The import's outcomes. */
export const importedLine = (name: string): string =>
  `Imported ${name} as a new surface.`;
export const PROFILE_NOT_JSON =
  "This file isn’t JSON, so it can’t be a Grid Editor profile.";
export const PROFILE_NOT_HANGAR_SURFACE =
  "This profile doesn’t hold a HANGAR surface, so there’s nothing to open in the Sandbox.";
