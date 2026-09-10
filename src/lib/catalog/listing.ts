// The browse listing: all sixteen configurations' browse data - name, one-line
// description, feel tags, the Featured flag, and what each pad does with nobody
// touching it.
//
// THE DATE THEY ARRIVED IS NOT ONE OF THEM ANY MORE (D-11, D-b). `addedAt` is
// real provenance and it stays on the CATALOG entry, where catalog.spec.ts
// still holds its format and its parse; what left is the browse PROJECTION of
// it, because the Newest sort was the only thing that ever read it here and a
// field nobody reads is a field that drifts.
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
// up in the catalog and asserts name, description, tags, featured, restsBlack
// and preview are strictly equal, in both directions, so a renamed entry, an
// edited description, a new tag or a dropped entry is red.
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
  /**
   * Verbatim from the catalog entry; the spec asserts deep equality in both
   * directions, which is what makes re-cutting this file alone go red.
   *
   * EXACTLY THREE since D-10: one FOR term then two FEELS, drawn from the
   * closed vocabulary in src/lib/browse/facets.ts - sixteen at 10-06, fourteen
   * after 11-01 and THIRTEEN after 12-04 retired `keys` - whose facets.spec.ts
   * holds
   * every entry here against that vocabulary. Still feel-based and still never
   * a compiler kind (CONT-03), which is amended from four tags to three.
   */
  readonly tags: readonly string[];
  readonly featured: boolean;
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
 * The one sentence a card with a demonstration gesture carries, beneath its
 * description.
 *
 * R-10 RETIRED THE SENTENCE THAT USED TO BE HERE. It read "This pad rests dark.
 * That is the configuration, not a broken picture.", one string shared by the
 * four entries that paint nothing with nobody touching them, and after D-09
 * three of those four are not showing a black square any more: they are showing
 * a scripted touch. The old sentence would have been describing something the
 * visitor cannot see.
 *
 * This is its replacement, and it is doing a job the old one did not. A card
 * that appears to animate on its own, when in truth the pad needs a finger, is
 * a claim about somebody's hardware that is not true. HANGAR supplies the
 * gesture and says so. One string serves all three, for the same reason one
 * served them before: it says only what is true of all three, and what each of
 * them actually DOES is in its own description directly above it.
 */
export const DEMO_TOUCH_NOTE =
  "Nothing on this pad lights up until a finger arrives, so the card is playing one for you.";

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
 * are counting down, they just resolve to black until a finger arrives.
 *
 * THAT IS NOW WHY GHOST HAS A DEMO PATH, rather than why it has a note. Under
 * "any animating -> animated" GHOST classifies as animated, which would have
 * suppressed its quiet line and left the visitor with an unexplained black
 * square; reading restsBlack first (D-14) is what stops that, and listing.spec
 * test 2 pins the trap by name. D-09 then takes the same fact one step further:
 * a configuration whose layers count down to black until a finger arrives is
 * exactly a configuration that should be shown a finger, so `restsBlack` now
 * has a second job. It selects a demonstration gesture in src/lib/sim/demo.ts,
 * and test 3 asserts that selection in both directions. The flag is therefore
 * MORE load-bearing after this phase than before it, which is why R-10 retired
 * the note and kept the fact.
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
      "A band of light crosses the pad, your finger leaves a glowing tail, and the pad sends your position.",
    motion: "animated",
    tags: ["show", "generative", "expressive"],
    featured: true,
    restsBlack: false,
    preview: "padsim",
  },
  {
    id: "pinwheel",
    name: "Pinwheel",
    description:
      "Light turns around the centre, each finger paints in its own colour, and the pad sends your position.",
    motion: "animated",
    tags: ["show", "generative", "expressive"],
    featured: true,
    restsBlack: false,
    preview: "padsim",
  },
  {
    id: "starfield",
    name: "Starfield",
    description:
      "Every light breathes at its own pace, so the pad never repeats itself, and it sends your position.",
    motion: "animated",
    tags: ["show", "generative", "readable"],
    featured: false,
    restsBlack: false,
    preview: "padsim",
  },
  {
    id: "radar",
    name: "Radar",
    description:
      "Rings roll out from the centre, and the pad sends your finger's position to your computer.",
    motion: "animated",
    tags: ["modulation", "generative", "expressive"],
    featured: false,
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
      "Left-right is pitch bend and snaps back straight. Up-down is a mod amount that returns to the middle on lift.",
    tags: ["modulation", "expressive", "still"],
    featured: false,
    restsBlack: false,
    preview: "padsim",
  },
  {
    id: "ninepads",
    // THE NAME STAYS "NINE PADS" AND THE SENTENCE SAYS SIXTEEN (plan 12-05).
    // The card now SHIPS at 4x4, at the user's second asking ("make a 16 pads
    // cause nothing changed"), and a sentence that describes what the visitor
    // will see has to move with it. The NAME does not: it is the card's name,
    // it is the id every stamp, fixture and OG file is keyed by, and the knob
    // still offers nine as its other position. A card called "Nine pads" that
    // opens at sixteen and can be put back to nine in one click is legible;
    // renaming the id is a catalog-membership change and this plan makes none.
    name: "Nine pads",
    description:
      "Sixteen drum pads drawn on the lights, each one a note, with the one you are holding lit up.",
    motion: "static",
    quiet:
      "This one is an instrument rather than a light show. The sixteen zones stay lit and wait for a finger.",
    tags: ["play", "playable", "readable"],
    featured: true,
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
    tags: ["mixing", "readable", "still"],
    featured: false,
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
    tags: ["modulation", "precise", "expressive"],
    featured: false,
    restsBlack: false,
    preview: "padsim",
  },
  {
    id: "tpad",
    name: "Trackpad",
    description:
      "One finger moves the pointer, two fingers scroll, a tap clicks and two fingers tapping right-click.",
    motion: "dark",
    // THE ONE ENTRY A FINGER CANNOT HELP, and it gets its own sentence rather
    // than the shared one because the shared one would be false: nothing is
    // playing a finger for this card. src/vendor/botor/_pad.ts's tpad draft
    // enables no LED layer at all, so no gesture lights a cell - measured at 0
    // of 81 over a drag, a two-finger scroll, taps and 2,000 idle ticks. See
    // DARK_BY_CONSTRUCTION in src/lib/sim/demo.ts, and front-door.ts's own
    // exclusion reason, which has said the same thing since Phase 4.
    quiet:
      "Trackpad writes no lights at all: it is a pointer for your computer, and there is nothing here to light.",
    tags: ["pointing", "precise", "still"],
    featured: false,
    restsBlack: true,
    preview: "padsim",
  },
  {
    id: "euclid",
    name: "EUCLID",
    description:
      "Three Euclidean rings turn at their own speeds and beat against each other; tap a step to change the pattern.",
    motion: "animated",
    tags: ["sequencing", "generative", "playable"],
    featured: true,
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "chorus",
    name: "CHORUS",
    description:
      "Press any of nine pads for a whole chord, and a warm bloom spreads outward from the pad you hit.",
    motion: "animated",
    tags: ["play", "playable", "expressive"],
    featured: true,
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "arc",
    name: "ARC",
    description:
      "Draw a modulation shape with your finger; it keeps sending after you let go, and the swirl shows the rate.",
    motion: "animated",
    tags: ["modulation", "generative", "expressive"],
    featured: true,
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "ghost",
    name: "GHOST",
    description:
      "Drag once and a ghost retraces your path forever, still sending; the red corner takes it back.",
    motion: "dark",
    quiet: DEMO_TOUCH_NOTE,
    tags: ["modulation", "generative", "expressive"],
    featured: false,
    restsBlack: true,
    preview: "lua",
  },
  {
    id: "morph",
    name: "MORPH",
    description:
      "Four macros in the corners; slide between them and each corner’s brightness is its own weight.",
    motion: "dark",
    quiet: DEMO_TOUCH_NOTE,
    tags: ["modulation", "expressive", "still"],
    featured: true,
    restsBlack: true,
    preview: "lua",
  },
  {
    id: "sonar",
    name: "SONAR",
    description:
      "A sweep turns like radar and fires the cells you armed: the ring is the pitch, the angle the time.",
    motion: "animated",
    tags: ["sequencing", "generative", "playable"],
    featured: false,
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "steps",
    name: "STEPS",
    description:
      "Tap a cell to arm it and a bright column sweeps across, playing back the pattern you drew.",
    motion: "animated",
    tags: ["sequencing", "generative", "playable"],
    featured: false,
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
    tags: ["mixing", "precise", "readable"],
    featured: false,
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "strip",
    name: "STRIP",
    description:
      "Slide up the pad for the big fader and along the bottom for the crossfader; each sends its own controller.",
    motion: "static",
    quiet:
      "The bar and the crossfader rest where you left them; nothing here moves on its own.",
    tags: ["mixing", "precise", "still"],
    featured: false,
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "lumen",
    name: "LUMEN",
    description:
      "A colour picker for a lighting desk: hue across, depth down, and the colour goes out as hex over sysex.",
    motion: "static",
    quiet:
      "The whole field stays lit and still, so you read the colour instead of watching it.",
    tags: ["show", "still", "readable"],
    featured: true,
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "stage",
    name: "STAGE",
    description:
      "Nine scenes for your stream: the live one glows and the one you are lining up breathes.",
    motion: "animated",
    tags: ["shortcuts", "playable", "readable"],
    featured: false,
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "cull",
    name: "CULL",
    description:
      "Rate a photo without leaving the keyboard: each rating has its own colour and its own shape.",
    motion: "static",
    quiet:
      "The five bands are a legend, not an animation; only the band you press flashes.",
    tags: ["shortcuts", "precise", "readable"],
    featured: false,
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "snake",
    name: "SNAKE",
    description:
      "Snake on eighty-one lights: steer with a finger, eat, grow, and hear a note for every bite.",
    motion: "animated",
    tags: ["play", "playable", "generative"],
    featured: true,
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "quadrant",
    name: "QUADRANT",
    description:
      "Four targets big enough to hit without looking, each with its own colour and its own fill.",
    motion: "static",
    // Written WITH the entry, not after it: the mechanism ships timer: "" and
    // nothing on this pad moves, so the fixture classifies it static and
    // listing.spec.ts requires a quiet line of every entry whose motion is not
    // animated. Never the shared note - that sentence belongs to a
    // restsBlack: true card and this one paints forty cells. (It used to say
    // "never RESTS_DARK_NOTE"; R-10 retired that export and DEMO_TOUCH_NOTE
    // took its place, and the rule reads the same about either of them.)
    quiet:
      "The four targets and the dark cross between them never move; that is what makes them findable.",
    tags: ["pointing", "precise", "readable"],
    featured: true,
    restsBlack: false,
    preview: "lua",
  },

  {
    id: "pomodoro",
    name: "POMODORO",
    description:
      "A twenty-five minute ring draining around the edge, so the time left is a thing in the room.",
    motion: "animated",
    tags: ["show", "readable", "generative"],
    featured: false,
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "wheels",
    name: "WHEELS",
    description:
      "Pitch on the left springs home the moment you let go; the mod wheel on the right stays where you left it.",
    // STATIC, AND IT IS READ OFF frames.json RATHER THAN DECLARED. This entry
    // stores a Timer, and the received wisdom is that a stored Timer makes a
    // card `animated` whatever its picture is doing. That is true only of an
    // entry whose SETUP arms it and whose Timer re-arms unconditionally; this
    // one does neither - the spring is armed by a lift and stops itself when it
    // lands - so the fixture reports `animating` false at all five sampled
    // ticks. FORGE was the shipped precedent for exactly that shape, and plan
    // 12-04 removed FORGE on the user's bench report - so this entry is now
    // the only one of that shape and the fixture is its only witness.
    motion: "static",
    quiet:
      "Both wheels sit lit and still: the pitch marker at the centre row, the mod bar wherever you left it.",
    tags: ["modulation", "expressive", "precise"],
    featured: false,
    restsBlack: false,
    preview: "lua",
  },
  {
    id: "radar-points",
    name: "RADAR POINTS",
    description:
      "Rings roll out from the centre and play the points you placed: the ring is the time, the direction the pitch.",
    // ANIMATED, read off frames.json: Setup arms the Timer and the body
    // re-arms unconditionally, which is the shape that actually classifies as
    // animating (11-15). Plan 11-14, under the user's answer `new-entry` - the
    // RADAR preset stays where it is and this hand-authored card carries the
    // radar ask beside it.
    motion: "animated",
    tags: ["sequencing", "generative", "playable"],
    featured: false,
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
