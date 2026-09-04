// The browse listing's agreement gate.
//
// listing.ts restates all sixteen entries' browse data instead of reading it
// from the catalog, because reading it would pull the vendored compiler and
// @intechstudio/grid-protocol (131,101 bytes, measured in 04-RESEARCH) onto the
// first paint of a page whose entire job is to list names. This file is what
// keeps the two honest - the same shape as front-door.spec.ts and
// src/lib/protocol-pin.ts: the duplication is deliberate, and it is asserted.
//
// It also pins the one entry the shipped derivation gets wrong. front-door.ts's
// rule is "any animating -> animated", and frames.json records GHOST as
// animating at every sampled tick with zero lit bytes at every sampled tick, so
// that rule calls GHOST animated - and FidelityLine.svelte then suppresses the
// quiet line, leaving a visitor with an unexplained black square. The listing
// reads restsBlack FIRST (D-14), and test 2 below holds both derivations side
// by side so the difference is a named test rather than a comment.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  EXCLUDED_FROM_ROW,
  FRONT_DOOR,
  type PreviewMotion,
} from "./front-door";
import { byId, CATALOG } from "./index";
import {
  LISTING,
  listingById,
  listingIndex,
  RESTS_DARK_NOTE,
  ROUTED,
} from "./listing";

const SOURCE_PATH = fileURLToPath(new URL("./listing.ts", import.meta.url));
const FRAMES_URL = new URL("./frames.json", import.meta.url);

interface FrameRecord {
  tick: number;
  sha256: string;
  nonZeroBytes: number;
  animating: boolean;
}

interface FramesFixture {
  note: string;
  ticks: number[];
  entries: Record<string, FrameRecord[]>;
}

const FRAMES: FramesFixture = JSON.parse(readFileSync(FRAMES_URL, "utf8"));

function records(id: string): FrameRecord[] {
  const found = FRAMES.entries[id];
  if (!found || found.length === 0) {
    throw new Error(`frames.json records no frames for: ${id}`);
  }
  return found;
}

/**
 * The listing's derivation, in this order and no other:
 *
 *   restsBlack            -> "dark"
 *   else some(animating)  -> "animated"
 *   else some(lit > 0)    -> "static"
 *   else                  -> "dark"
 */
function deriveMotion(id: string, restsBlack: boolean): PreviewMotion {
  if (restsBlack) return "dark";
  return naiveMotion(id);
}

/**
 * front-door.spec.ts's rule, implemented here ONLY so test 2 can show what the
 * listing would have said about GHOST if it had reused it. Nothing ships on it.
 */
function naiveMotion(id: string): PreviewMotion {
  const frames = records(id);
  if (frames.some((frame) => frame.animating)) return "animated";
  if (frames.some((frame) => frame.nonZeroBytes > 0)) return "static";
  return "dark";
}

// Deliberately backslash-free, matching every other structural scan in this
// repository: inside a shell-quoted node -e a backslash is eaten and a pattern
// silently stops matching.
const strip = (text: string): string =>
  text
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

describe("the browse listing (src/lib/catalog/listing.ts)", () => {
  it("restates the catalog exactly, field by field", () => {
    // Non-vacuity first: a listing that lost half the catalog, or a catalog
    // that arrived empty, would otherwise satisfy every loop below.
    expect(LISTING.length, "the listing is not empty").toBeGreaterThan(0);
    expect(
      LISTING.length,
      "the listing holds one record per catalog entry",
    ).toBe(CATALOG.length);
    expect(
      new Set(LISTING.map((entry) => entry.id)).size,
      "listed ids are unique",
    ).toBe(LISTING.length);

    for (const listed of LISTING) {
      const entry = byId(listed.id);
      expect(entry, `${listed.id} resolves in CATALOG`).toBeDefined();
      expect(entry?.name, `${listed.id}: name disagrees with the catalog`).toBe(
        listed.name,
      );
      expect(
        entry?.description,
        `${listed.id}: description disagrees with the catalog`,
      ).toBe(listed.description);
      expect(
        entry?.tags,
        `${listed.id}: tags disagree with the catalog`,
      ).toEqual(listed.tags);
      expect(
        entry?.featured,
        `${listed.id}: the Featured flag disagrees with the catalog`,
      ).toBe(listed.featured);
      expect(
        entry?.addedAt,
        `${listed.id}: addedAt disagrees with the catalog`,
      ).toBe(listed.addedAt);
      expect(
        entry?.restsBlack,
        `${listed.id}: restsBlack disagrees with the catalog`,
      ).toBe(listed.restsBlack);
      expect(
        entry?.preview,
        `${listed.id}: preview disagrees with the catalog`,
      ).toBe(listed.preview);
    }

    // Both directions, so a dropped entry is as red as an invented one.
    expect(
      [...LISTING.map((entry) => entry.id)].sort(),
      "the listed ids and the catalog's ids are the same set",
    ).toEqual([...CATALOG.map((entry) => entry.id)].sort());

    // The two lookups, including the answer for an id nobody claims.
    expect(listingById("aurora")?.id, "listingById finds a listed entry").toBe(
      "aurora",
    );
    expect(
      listingById("no-such-configuration"),
      "an unknown id resolves to undefined",
    ).toBeUndefined();
    LISTING.forEach((listed, index) => {
      expect(
        listingIndex(listed.id),
        `${listed.id}: listingIndex disagrees with its position`,
      ).toBe(index);
    });
    expect(
      listingIndex("no-such-configuration"),
      "an unknown id is -1, never 0",
    ).toBe(-1);
  });

  it("derives motion from restsBlack first, then from the recorded frames", () => {
    expect(LISTING.length, "there is something to derive").toBeGreaterThan(0);
    for (const listed of LISTING) {
      expect(
        FRAMES.entries[listed.id],
        `${listed.id}: frames.json records it`,
      ).toBeDefined();
      expect(
        listed.motion,
        `${listed.id}: declared motion disagrees with the restsBlack-first ` +
          "derivation over frames.json",
      ).toBe(deriveMotion(listed.id, listed.restsBlack));
    }

    // THE TRAP, pinned by name. GHOST's layers are counting down at every
    // sampled tick and resolve to black at every sampled tick, so the shipped
    // front-door rule would call it animated and FidelityLine.svelte would then
    // hide the one sentence that explains the black square.
    const ghost = records("ghost");
    expect(
      ghost.every((frame) => frame.animating),
      "ghost reports animating at every sampled tick",
    ).toBe(true);
    expect(
      ghost.every((frame) => frame.nonZeroBytes === 0),
      "ghost lights zero bytes at every sampled tick",
    ).toBe(true);
    expect(
      naiveMotion("ghost"),
      "the front-door derivation would have called ghost animated",
    ).toBe("animated");
    expect(
      listingById("ghost")?.motion,
      "the listing reads restsBlack first, so ghost is dark",
    ).toBe("dark");

    // Without this the loop above could be satisfied by sixteen constants.
    const motions = new Set(LISTING.map((listed) => listed.motion));
    expect(
      [...motions].sort(),
      "all three motions occur in the listing",
    ).toEqual(["animated", "dark", "static"]);
  });

  it("gives every unmoving entry a sentence, and never a second copy of one", () => {
    const quiet = LISTING.filter((listed) => listed.motion !== "animated");
    expect(quiet.length, "some pads are honestly still").toBeGreaterThan(0);
    for (const listed of quiet) {
      expect(typeof listed.quiet, `${listed.id}: a still pad says so`).toBe(
        "string",
      );
      expect(
        listed.quiet?.trim().length,
        `${listed.id}: the line is not empty`,
      ).toBeGreaterThan(0);
      expect(listed.quiet, `${listed.id}: the line is one line`).not.toContain(
        String.fromCharCode(10),
      );
    }

    // Byte-equal to the row's, for every id the row carries - so the two files
    // cannot drift apart, and an entry the row leaves silent stays silent here.
    expect(FRONT_DOOR.length, "the row is not empty").toBeGreaterThan(0);
    expect(
      FRONT_DOOR.filter((row) => row.quiet !== undefined).length,
      "some row entry actually carries a quiet line",
    ).toBeGreaterThan(0);
    for (const row of FRONT_DOOR) {
      expect(
        listingById(row.id)?.quiet,
        `${row.id}: the listing rewrote the row's own quiet line`,
      ).toBe(row.quiet);
    }

    // One sentence, three entries. Three variants would be three chances to say
    // the same thing differently.
    const dark = LISTING.filter((listed) => listed.restsBlack);
    expect(dark.length, "some entry rests black").toBeGreaterThan(0);
    for (const listed of dark) {
      expect(
        listed.quiet,
        `${listed.id}: a resting-black card carries the shared note verbatim`,
      ).toBe(RESTS_DARK_NOTE);
    }
    expect(
      RESTS_DARK_NOTE.trim().length,
      "the shared note is a real sentence",
    ).toBeGreaterThan(0);
  });

  it("the listed ids partition into the row and the excluded list, and ROUTED is all of them", () => {
    const rowIds = FRONT_DOOR.map((entry) => entry.id);
    const excludedIds = EXCLUDED_FROM_ROW.map((entry) => entry.id);
    const listedIds = LISTING.map((entry) => entry.id);

    // The same partition front-door.spec.ts asserts against CATALOG, restated
    // against the listing so an entry that lands in neither is red twice. Never
    // a count: both sides grow, and a literal size would go red for a reason
    // that is not a regression.
    expect(listedIds.length, "there is something to partition").toBeGreaterThan(
      0,
    );
    expect(
      [...rowIds, ...excludedIds].sort(),
      `${rowIds.length} in the row plus ${excludedIds.length} excluded must ` +
        `be exactly the ${listedIds.length} listed`,
    ).toEqual([...listedIds].sort());
    expect(
      rowIds.filter((id) => excludedIds.includes(id)),
      "no id is both in the row and excluded from it",
    ).toEqual([]);

    // ROUTED is the ONE declaration of "the entries with an address", read by
    // the route, the OG generator, its build gate and the artefact e2e. The
    // sequence, not the set: the four read it in order.
    expect(
      ROUTED.map((entry) => entry.id),
      "ROUTED is every listed entry, in listing order",
    ).toEqual(listedIds);
    for (const routed of ROUTED) {
      expect(
        listingById(routed.id),
        `${routed.id}: a routed entry is a listed entry`,
      ).toBeDefined();
    }
  });

  it("imports nothing at runtime", () => {
    const source = readFileSync(SOURCE_PATH, "utf8");
    const stripped = strip(source);

    // Three guards against a vacuous pass: a walk that read the wrong file, a
    // scan that collected nothing, and a stripper that ate the whole source.
    expect(
      source.length,
      "the scan read a real module, not an empty file",
    ).toBeGreaterThan(2000);
    expect(
      stripped,
      "the one permitted import declaration was seen by the scan",
    ).toContain("import type");

    const specifiers = [...stripped.matchAll(/from[ ]+["']([^"']+)["']/g)].map(
      (match) => match[1],
    );
    const erased = [
      ...stripped.matchAll(/import[ ]+type[^;]*?from[ ]+["']([^"']+)["']/g),
    ].map((match) => match[1]);

    expect(
      specifiers.length,
      "specifiers were actually collected",
    ).toBeGreaterThan(0);
    // An import that is not `import type` - or an `export ... from`, which is
    // not erased either - collects into `specifiers` and not into `erased`.
    expect(
      specifiers,
      "every specifier in listing.ts sits on an import type line",
    ).toEqual(erased);

    const forbidden = [
      "vendor",
      "intechstudio",
      "lib/pad",
      "./index",
      "./entries",
      "sim/",
      "pad-sim",
      "wasmoon",
      "$lib/catalog",
    ];
    for (const specifier of specifiers) {
      for (const bad of forbidden) {
        expect(
          specifier.includes(bad),
          `listing.ts imports ${specifier}, which drags the compiler in`,
        ).toBe(false);
      }
    }
  });
});
