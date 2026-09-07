// The browse listing: all sixteen configurations' browse data - name, one-line
// description, feel tags, the Featured flag, the date they arrived, and what
// each pad does with nobody touching it.
//
// WHY THIS FILE RESTATES THE CATALOG INSTEAD OF READING IT.
// This is the fourth use of the pattern src/lib/protocol-pin.ts introduced and
// src/lib/catalog/front-door.ts named: a literal held against another source by
// a spec, rather than an import that costs a chunk. The measured reason is one
// line of one file - src/lib/catalog/entries/ported.ts:13 reaches the vendored
// shelf, which imports @intechstudio/grid-protocol at module scope, and that is
// a 131,101-byte chunk (measured in 04-RESEARCH, Bundle facts). A prerendered
// page needs sixteen names, descriptions, tags and dates IN ITS HTML at first
// paint, so the module carrying them must be reachable without dragging the Lua
// compiler and its WASM formatter along behind it.
//
// So this module imports NOTHING at runtime. The single `import type` line
// below is erased at build time and is the only permitted specifier; the
// direction of that import matters too, because importing FROM front-door.ts
// leaves that file byte-untouched and its own "declares no imports" test green.
// listing.spec.ts's last test scans this source and fails on anything else.
//
// The duplication is deliberate and it is GATED: listing.spec.ts looks every id
// up in the catalog and asserts name, description, tags, featured, addedAt,
// restsBlack and preview are strictly equal, in both directions, so a renamed
// entry, an edited description, a new tag or a dropped entry is red.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { FrontDoorEntry, PreviewMotion } from "./front-door";

/**
 * One listed configuration: the front door's four fields plus the four a browse
 * screen needs and a coverflow does not.
 *
 * `preview` is carried because a card has to know which engine will play it
 * before it mounts one - a "lua" entry loads the VM lazily on first
 * intersection, a "padsim" entry never loads it at all.
 */
export type ListingEntry = FrontDoorEntry & {
  /** Feel-based, verbatim from the catalog entry; the spec asserts deep equality. */
  readonly tags: readonly string[];
  readonly featured: boolean;
  /** "YYYY-MM-DD". Drives the Newest sort. */
  readonly addedAt: string;
  /** A recorded fact, asserted against frames.json in both directions. */
  readonly restsBlack: boolean;
  /** DERIVED from the entry's source kind in the catalog; restated, not guessed. */
  readonly preview: "padsim" | "lua";
};

/**
 * Re-exported so a browse component reads one module rather than two. It is a
 * type, so this costs nothing at runtime and adds no specifier to this file.
 */
export type { PreviewMotion };

/**
 * The one sentence a resting-black card carries, beneath its description.
 *
 * One string serves all three of them because it says only what is true of all
 * three: with nothing touching it, the pad is black. What each of them actually
 * DOES is already in its own description directly above the note, so three
 * variants would be three chances to say the same thing differently.
 * 05.1-UI-SPEC.md's "The resting-black note" is the source of these words.
 */
export const RESTS_DARK_NOTE =
  "This pad rests dark. That is the configuration, not a broken picture.";

/**
 * What a pad does when nobody is touching it, DERIVED IN THIS ORDER:
 *
 *   restsBlack             -> "dark"
 *   else some(animating)   -> "animated"
 *   else some(lit bytes)   -> "static"
 *   else                   -> "dark"
 *
 * The first line is not a tidy-up of front-door.ts's rule, it is the fix for a
 * case that rule gets wrong. GHOST reports `animating` at EVERY sampled tick in
 * frames.json and lights ZERO bytes at every sampled tick - its layers really
 * are counting down, they just resolve to black until a finger arrives. Under
 * "any animating -> animated" GHOST classifies as animated, FidelityLine.svelte
 * suppresses the quiet line for animated entries, and the visitor gets an
 * unexplained black square. Reading restsBlack first (D-14) is what stops that,
 * and listing.spec.ts test 2 pins the trap by name so a later reader can see
 * both derivations and why this one is the shipped one.
 *
 * The values below are literals, gated in the spec against frames.json. They
 * are not computed here: this module has no access to that fixture and must not
 * gain one, because reading a JSON file is a runtime edge.
 *
 * The order is CATALOG order. No sort lives in this file - sorting is
 * src/lib/browse/sort.ts's job - so a caller that wants Featured, Newest or
 * Name asks for it there and this array stays the one stable reference order.
 */
export const LISTING: readonly ListingEntry[] = [
  {
    id: "aurora",
    name: "Aurora",
    description:
      "A band of light crosses the pad, and your finger leaves a glowing tail behind it.",
    motion: "animated",
    tags: ["ambient", "flowing", "colour"],
    featured: true,
    addedAt: "2026-09-02",
    restsBlack: false,
    preview: "padsim",
  },
  {
    id: "pinwheel",
    name: "Pinwheel",
    description:
      "Light turns around the centre, and each finger paints in its own colour.",
    motion: "animated",
    tags: ["rotating", "multi-touch", "colour"],
    featured: true,
    addedAt: "2026-09-02",
    restsBlack: false,
    preview: "padsim",
  },
  {
    id: "starfield",
    name: "Starfield",
    description:
      "Every light breathes at its own pace, so the pad never repeats itself.",
    motion: "animated",
    tags: ["ambient", "generative", "calm"],
    featured: false,
    addedAt: "2026-09-02",
    restsBlack: false,
    preview: "padsim",
  },
  {
    id: "radar",
    name: "Radar",
    description:
      "Rings roll out from the centre, and the pad sends your finger's position to your computer.",
    motion: "animated",
    tags: ["rippling", "xy-control", "hypnotic"],
    featured: false,
    addedAt: "2026-09-02",
    restsBlack: false,
    preview: "padsim",
  },
  {
    id: "joystick",
    name: "Joystick",
    description:
      "Push the pad like a synth stick: left-right bends pitch, and letting go snaps everything home.",
    motion: "static",
    quiet:
      "Left-right is pitch bend and snaps back straight. Up-down is a mod amount that falls to zero on lift.",
    tags: ["expressive", "pitch-bend", "sprung"],
    featured: false,
    addedAt: "2026-09-02",
    restsBlack: false,
    preview: "padsim",
  },
  {
    id: "ninepads",
    name: "Nine pads",
    description:
      "Nine drum pads drawn on the lights, each one a note, with the one you are holding lit up.",
    motion: "static",
    quiet:
      "This one is an instrument rather than a light show. The nine zones stay lit and wait for a finger.",
    tags: ["drums", "playable", "grid"],
    featured: true,
    addedAt: "2026-09-02",
    restsBlack: false,
    preview: "padsim",
  },
  {
    id: "faders",
    name: "Four faders",
    description:
      "Four faders side by side, each with a white rail and a coloured level you can see across the room.",
    motion: "static",
    quiet: "Four rails, lit and still. They move when you move them.",
    tags: ["mixing", "readable", "rails"],
    featured: false,
    addedAt: "2026-09-02",
    restsBlack: false,
    preview: "padsim",
  },
  {
    id: "dial",
    name: "Dial",
    description:
      "Circle your finger and the pad becomes an endless knob, sending how far you turned.",
    motion: "animated",
    quiet:
      "Clockwise raises, counter-clockwise lowers. The middle of the pad stays quiet.",
    tags: ["endless", "gestural", "precise"],
    featured: false,
    addedAt: "2026-09-02",
    restsBlack: false,
    preview: "padsim",
  },
  {
    id: "tpad",
    name: "Trackpad",
    description:
      "One finger moves the pointer, two fingers scroll, a tap clicks and two fingers tapping right-click.",
    motion: "dark",
    quiet: RESTS_DARK_NOTE,
    tags: ["desktop", "pointer", "utility"],
    featured: false,
    addedAt: "2026-09-02",
    restsBlack: true,
    preview: "padsim",
  },
  {
    id: "euclid",
    name: "EUCLID",
    description:
      "Three Euclidean rings turn at their own speeds and beat against each other; tap a step to change the pattern.",
    motion: "animated",
    tags: ["polyrhythm", "generative", "drums", "playable"],
    featured: true,
    addedAt: "2026-09-04",
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "chorus",
    name: "CHORUS",
    description:
      "Press any of nine pads for a whole chord, and a warm bloom spreads outward from the pad you hit.",
    motion: "animated",
    tags: ["chords", "harmonic", "blooming", "playable"],
    featured: true,
    addedAt: "2026-09-04",
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "arc",
    name: "ARC",
    description:
      "Draw a modulation shape with your finger; it keeps sending after you let go, and the swirl shows the rate.",
    motion: "animated",
    tags: ["modulation", "hands-free", "hypnotic", "gestural"],
    featured: true,
    addedAt: "2026-09-04",
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "ghost",
    name: "GHOST",
    description:
      "Drag once and a ghost retraces your path forever, still sending, in a colour that is not your finger’s.",
    motion: "dark",
    quiet: RESTS_DARK_NOTE,
    tags: ["looper", "automation", "gestural", "generative"],
    featured: false,
    addedAt: "2026-09-04",
    restsBlack: true,
    preview: "lua",
  },
  {
    id: "lattice",
    name: "LATTICE",
    description:
      "The whole pad tuned in fourths, so every chord shape is the same shape in every key.",
    motion: "animated",
    tags: ["isomorphic", "playable", "still", "instrument"],
    featured: true,
    addedAt: "2026-09-04",
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "morph",
    name: "MORPH",
    description:
      "Four macros in the corners; slide between them and each corner’s brightness is its own weight.",
    motion: "dark",
    quiet: RESTS_DARK_NOTE,
    tags: ["macros", "blend", "readable", "expressive"],
    featured: true,
    addedAt: "2026-09-04",
    restsBlack: true,
    preview: "lua",
  },
  {
    id: "sonar",
    name: "SONAR",
    description:
      "A sweep turns like radar and fires the cells you armed: the ring is the pitch, the angle the time.",
    motion: "animated",
    tags: ["radial", "sequencer", "polar", "hypnotic"],
    featured: false,
    addedAt: "2026-09-04",
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "hold",
    name: "HOLD",
    description:
      "A latching effect pad: lift your finger and the value stays where you left it, lit and breathing.",
    motion: "animated",
    tags: ["latching", "hands-free", "expressive", "xy-control"],
    featured: true,
    addedAt: "2026-09-07",
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "steps",
    name: "STEPS",
    description:
      "Tap a cell to arm it and a bright column sweeps across, playing back the pattern you drew.",
    motion: "animated",
    tags: ["sequencer", "playable", "drums", "grid"],
    featured: false,
    addedAt: "2026-09-07",
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "slam",
    name: "SLAM",
    description:
      "Nine drum pads where how high you hit is how hard it plays, and the bloom shows the velocity.",
    motion: "static",
    quiet:
      "The nine zone outlines sit still until you hit one; every bloom is a hit you made.",
    tags: ["drums", "playable", "expressive", "blooming"],
    featured: false,
    addedAt: "2026-09-07",
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "keys",
    name: "KEYS",
    description:
      "Every note of one key across the pad: roots bright, the scale dim, and the wrong notes dark.",
    motion: "static",
    quiet:
      "The key sits on the pad whether or not anyone is playing it; the light is the map, not the motion.",
    tags: ["harmonic", "in-key", "playable", "readable"],
    featured: true,
    addedAt: "2026-09-07",
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "gridlock",
    name: "GRIDLOCK",
    description:
      "Eighty-one clips under one hand, and a ring rolls out from the one you fired so you know it took.",
    motion: "static",
    quiet:
      "The nine track blocks stay put until you fire a cell; every ring on this pad is one you started.",
    tags: ["clips", "launcher", "rippling", "playable"],
    featured: false,
    addedAt: "2026-09-07",
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "table",
    name: "TABLE",
    description:
      "Slide across to change the wave and down to filter it, and the grid draws the shape you land on.",
    motion: "static",
    quiet:
      "The plot holds the shape you last landed on; move across the pad and it redraws.",
    tags: ["wavetable", "sound-design", "xy-control", "gestural"],
    featured: false,
    addedAt: "2026-09-07",
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "console",
    name: "CONSOLE",
    description:
      "Nine strips with rails: slide anywhere in a column to set its level, tap the top cell to mute it.",
    motion: "static",
    quiet:
      "The nine levels hold where you left them; this pad only moves when your hand does.",
    tags: ["mixing", "rails", "readable", "latching"],
    featured: false,
    addedAt: "2026-09-07",
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "strip",
    name: "STRIP",
    description:
      "The whole pad is one long fader, with a fine row along the bottom for the last few numbers.",
    motion: "static",
    quiet:
      "The bar rests at the number you last sent; nothing here moves on its own.",
    tags: ["precise", "readable", "modulation", "hands-free"],
    featured: false,
    addedAt: "2026-09-07",
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "learn",
    name: "LEARN",
    description:
      "Mapping helper: it sends one axis at a time and lights the row or column it is sending on.",
    motion: "static",
    quiet:
      "The lit row or column is the legend, and it stays lit until you change the mode.",
    tags: ["utility", "readable", "xy-control", "precise"],
    featured: true,
    addedAt: "2026-09-07",
    restsBlack: false,
    preview: "lua",
  },
];

/**
 * The entries that have an address - the ones with a real /c/<id>/ page.
 *
 * Today that is every listed entry, and the point of the name is not the value
 * but the SINGLE DECLARATION. Four files need this set and each of them used to
 * decide it for itself: src/routes/c/[id]/+page.ts generates the pages,
 * scripts/gen-og.mjs renders one image per page, src/lib/og/build.spec.ts
 * asserts each page's og:image resolves, and e2e/artifacts.e2e.ts asserts the
 * deployed site serves it. Widen one of the four alone and the site ships pages
 * whose og:image 404s with nothing red anywhere, because the other three are
 * still looping the old set. Reading one name makes that disagreement
 * impossible rather than merely unlikely.
 *
 * It is a separate export from LISTING because the two answer different
 * questions - "what does the browse grid show" and "what has a URL" - and a
 * later curation decision could separate them again.
 */
export const ROUTED: readonly ListingEntry[] = LISTING;

/** Position in the listing, or -1 for an id no entry claims. Never 0 for unknown. */
export function listingIndex(id: string): number {
  return LISTING.findIndex((entry) => entry.id === id);
}

/** The one lookup. Returns undefined for an id no entry claims. */
export function listingById(id: string): ListingEntry | undefined {
  return LISTING.find((entry) => entry.id === id);
}
