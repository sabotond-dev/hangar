// Every word the Quick guide says (change 26, BENCH-2026-09-16.txt section 26), in one module that
// imports nothing, so the page, the header's link, the Help panel, the shortcut sheet and the
// device drawer read one source and copy.spec.ts can hold all of it to D-05's register: sentence
// case, second person, the action and its result together, no exclamation mark and none of the
// three softeners. Every claim was read off the tree on 2026-09-30, not off the brief: the browser
// matrix from transport.ts's UNSUPPORTED_DETAIL, the port and the empty list from failureCopy and
// NOTHING_LISTED_STEPS, the five sections from tune/sections.ts, the Store sequence from
// install.svelte.ts's keepOnDevice, the keys from sandbox/shortcuts.ts (the spec holds ADD_KEYS and
// every bracketed key to it), the export from share/profile-copy.ts, the utility button from
// change 22. A key is written in brackets, `[F]`, and the page draws it as a kbd (inlineParts).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// ---------------------------------------------------------------------------
// The page's frame.

/** The document title, in the house form (`Playground — HANGAR`). */
export const GUIDE_TITLE = "Quick guide — HANGAR";
/** The page's description for the head and the link preview. */
export const GUIDE_DESCRIPTION =
  "Connect your ZONA, try and tune a configuration, store it, build your own surface and play it with your DAW.";
/** The eyebrow above the headline: a short uppercase label (D-05). */
export const GUIDE_EYEBROW = "HOW HANGAR WORKS";
/** The one h1. */
export const GUIDE_HEADLINE = "Quick guide";
/** The lede under it. */
export const GUIDE_LEDE =
  "From the cable to your DAW in eight short sections. Browsing, tuning and building work without a ZONA; storing needs one connected.";
/** The context bar's breadcrumb and sentence, as the Playground index and My configs carry theirs. */
export const GUIDE_BREADCRUMB: readonly string[] = [
  "QUICK GUIDE",
  "GETTING STARTED",
];
export const GUIDE_STATUS = "Eight short sections, from the cable to your DAW.";

/** The table of contents: its landmark's name and its visible title. */
export const CONTENTS_NAME = "On this page";
export const CONTENTS_TITLE = "ON THIS PAGE";

// ---------------------------------------------------------------------------
// The links into the page from the rest of the site.

/** The link's text in the header and on the intro. */
export const GUIDE_LINK = "Quick guide";
/** The Help & shortcuts panel's link. */
export const HELP_GUIDE_LINK = "Open the Quick guide";
/** The Sandbox's shortcut sheet, at its foot: to the Build section. */
export const SHEET_GUIDE_LINK = "More on building in the Quick guide";
/** The connection control's drawer, where this browser cannot store or HTTPS is missing: to the Connect section. */
export const DEVICE_GUIDE_CONNECT = "How to connect, in the Quick guide";
/** The same drawer after a connection failed: to the troubleshooting section. */
export const DEVICE_GUIDE_TROUBLE = "More fixes in the Quick guide";

// ---------------------------------------------------------------------------
// The illustrations: each one's name for a screen reader, and the quiet caption under it.

export type FigureKind = "zona" | "store" | "plate" | "output";

export const FIGURE_NAMES: Readonly<Record<FigureKind, string>> = {
  zona: "ZONA from above: the USB-C cable on one side, the utility button on the opposite side.",
  store:
    "The controls at the top right with a ZONA connected: Clear, ZONA connected, then Target set to Page 1 and Store on ZONA.",
  plate: "A Sandbox surface with a fader, a button and an XY pad.",
  output:
    "An output block’s head: Ring 1, with the line Note · Ch 1 · C4 · Receive.",
};

export const FIGURE_CAPTIONS: Readonly<Record<FigureKind, string>> = {
  zona: "The utility button sits on the side opposite the USB-C socket.",
  store: "Target and Store on ZONA, under the connection control.",
  plate: "A fader, a button and an XY pad on the 9 × 9 surface.",
  output:
    "One line sums up each output: its Type, Channel and Number, and whether it receives.",
};

/** The Store figure's Target: the page's mark as DestinationZone.svelte draws it after the page the module reports. */
export const FIGURE_ON_ZONA = " · on ZONA";

/** The output figure's block: its name and the four parts its summary line is built from (inspector-copy's outputSummary). */
export const FIGURE_OUTPUT_NAME = "Ring 1";
export const FIGURE_OUTPUT_PARTS = {
  type: "Note",
  channel: "1",
  number: "C4",
  receive: true,
} as const;

// ---------------------------------------------------------------------------
// The eight sections.

/** One key and the element it arms, as the Sandbox's shortcut sheet lists them. */
export interface AddKey {
  readonly key: string;
  readonly what: string;
}

/** One problem and its way out. */
export interface Answer {
  readonly problem: string;
  readonly fix: string;
}

/** A section's body: a paragraph, numbered steps, a plain list, the add keys, or problems with their fixes. */
export type Block =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "steps"; readonly items: readonly string[] }
  | { readonly kind: "list"; readonly items: readonly string[] }
  | { readonly kind: "keys"; readonly rows: readonly AddKey[] }
  | { readonly kind: "answers"; readonly items: readonly Answer[] };

export interface GuideSection {
  /** The anchor: `/guide/#connect`. */
  readonly id: string;
  /** The h2 and the contents' row. */
  readonly title: string;
  readonly figure?: FigureKind;
  readonly blocks: readonly Block[];
}

/** The Sandbox's five add keys, in the sheet's order (editor.ts's HOTKEYS); copy.spec.ts holds them to shortcuts.ts. */
export const ADD_KEYS: readonly AddKey[] = [
  { key: "F", what: "Fader" },
  { key: "B", what: "Button" },
  { key: "X", what: "XY pad" },
  { key: "K", what: "Knob" },
  { key: "L", what: "Blank" },
];

export const GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    id: "connect",
    title: "Connect your ZONA",
    figure: "zona",
    blocks: [
      {
        kind: "steps",
        items: [
          "Plug your ZONA into the computer with a USB-C cable that carries data. A charge-only cable fits the socket and leaves the browser’s list empty.",
          "Quit Grid Editor from its tray icon and close any other HANGAR tab. Only one program can hold the port at a time.",
          "Click Connect ZONA at the top right and pick your ZONA in the browser’s list. Firefox asks first whether this site may use serial ports; allow it and the list appears.",
        ],
      },
      {
        kind: "text",
        text: "Storing works in Chrome, Edge and desktop Firefox 151 and newer. Safari, every browser on iOS and Chrome on Android can browse, tune and build here but can’t store: Chrome on Android reaches only Bluetooth serial ports, not a ZONA on a cable.",
      },
      {
        kind: "text",
        text: "Nothing is written to your ZONA without a click. Browsing and previewing never touch it.",
      },
    ],
  },
  {
    id: "try",
    title: "Try a configuration",
    blocks: [
      {
        kind: "text",
        text: "Open the Playground and pick a card. Every pad here runs the firmware’s own code, so you can see what a configuration does before your ZONA is anywhere near.",
      },
      {
        kind: "text",
        text: "Switch the card to Play and touch the surface with the mouse or a finger; in Configure the surface ignores a touch.",
      },
    ],
  },
  {
    id: "tune",
    title: "Tune it",
    blocks: [
      {
        kind: "text",
        text: "A card’s settings sit in up to five sections: Look, Feel, Sound, MIDI and Sync. It shows only the ones it uses.",
      },
      {
        kind: "text",
        text: "Step a value or type one; a typed value snaps to the nearest step the setting offers. Edit color opens a picker with a red, a green and a blue rail, and Brightness under Look sets the whole light output from 1 to 255.",
      },
      {
        kind: "text",
        text: "Reset beside a setting puts it back, and Reset settings puts them all back. Randomize changes every setting you haven’t locked and never a MIDI setting; Undo randomize takes it back.",
      },
    ],
  },
  {
    id: "store",
    title: "Store it on your ZONA",
    figure: "store",
    blocks: [
      {
        kind: "steps",
        items: [
          "Connect your ZONA and open a card, or your surface in the Sandbox. Target and Store on ZONA appear at the top right.",
          "Pick a page under Target. It lists the pages your ZONA reports, and your ZONA switches to the one you pick.",
          "Click Store on ZONA. HANGAR returns the page to its firmware default, writes this configuration, stores it and reads it back; Stored on ZONA · Page 1 means the page read back as it was sent.",
        ],
      },
      {
        kind: "text",
        text: "The utility button on the side of your ZONA steps to the next page. Clear returns the Target page to its firmware default and stores it; your browser draft stays as it is.",
      },
    ],
  },
  {
    id: "build",
    title: "Build your own",
    figure: "plate",
    blocks: [
      {
        kind: "text",
        text: "Open the Sandbox, press a key to arm an element, then click a cell to place it:",
      },
      { kind: "keys", rows: ADD_KEYS },
      {
        kind: "text",
        text: "Drag an element to move it and drag its handles to resize it. The arrow keys move the selection one cell, and [Shift] with an arrow resizes it.",
      },
      {
        kind: "text",
        text: "Select an element to shape it in the inspector: its MIDI output, Latch, which keeps a finger on the element it landed on, and up to three extra messages.",
      },
      {
        kind: "text",
        text: "Switch to Play to touch the surface as you would the pad. Press [?] for every shortcut.",
      },
    ],
  },
  {
    id: "daw",
    title: "Play with your DAW",
    figure: "output",
    blocks: [
      {
        kind: "text",
        text: "Your ZONA sends its MIDI over the same USB cable. Pick ZONA as a MIDI input in your DAW, and as an output when the DAW should move things back.",
      },
      {
        kind: "text",
        text: "Every output has a Type and a Channel, and most have a Number. Turn on Receive and the element takes the value when your DAW sends that message.",
      },
      {
        kind: "text",
        text: "A card that keeps time has a Sync section: External follows your DAW’s MIDI clock from its Start to its Stop, and Division sets the step to an 8th, a 16th or a 32nd. The preview in the browser has no clock and runs at the card’s own tempo.",
      },
    ],
  },
  {
    id: "save",
    title: "Save, share, export",
    blocks: [
      {
        kind: "list",
        items: [
          "Save copy keeps this version in My configs, in this browser.",
          "Share snapshot copies a link that opens the card with your settings.",
          "Export for Grid Editor saves a profile file. Drop it into the Editor’s grid-userdata/configs folder and it opens there.",
          "A Sandbox surface has no link: Export as a file saves it, and Import config on My configs opens it again in any browser.",
        ],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "If something goes wrong",
    blocks: [
      {
        kind: "answers",
        items: [
          {
            problem: "Another program is holding the port",
            fix: "Quit Grid Editor completely from its tray icon and close any other HANGAR tab. Then unplug your ZONA, plug it back in, reload the page and connect again.",
          },
          {
            problem: "The browser’s list is empty",
            fix: "Try a different USB cable: a charge-only cable is the most common reason. Plug your ZONA straight into the computer rather than through a hub or a dock.",
          },
          {
            problem: "Store on ZONA is greyed out",
            fix: "The line under it says why: connect your ZONA, change something to store it again, or remove an element when a surface is too full for a ZONA page.",
          },
          {
            problem: "No MIDI reaches your DAW",
            fix: "Check that ZONA is on as a MIDI input in your DAW, and that the output’s Channel is the channel your DAW listens on.",
          },
          {
            problem: "You want the factory page back",
            fix: "Pick the page under Target and click Clear. It returns the page to its firmware default and stores it.",
          },
          {
            problem: "The utility button doesn’t change pages",
            fix: "A page stored from the Sandbox before 27 September 2026 lost its page switch. Store that page again or Clear it, and the button steps through the pages again.",
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// The one piece of markup the copy carries.

/** A run of text, or a key to draw as a kbd. */
export type InlinePart = { readonly text: string } | { readonly key: string };

/** `Press [?] for every shortcut.` -> text, the key `?`, text. Empty runs are dropped. */
export function inlineParts(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const pattern = /\[([^\]]+)\]/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) parts.push({ text: text.slice(last, at) });
    parts.push({ key: match[1] });
    last = at + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
