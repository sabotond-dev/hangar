import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { byId } from "../catalog";
import { FRONT_DOOR } from "../catalog/front-door";
import { SITE_ORIGIN } from "../share/url";
import { ogAlt } from "../tune/copy";
import { FRAME_RGB, OG_HEIGHT, OG_WIDTH, UNLIT_DOT_RGB } from "./render";

// The gate over the two artefacts nothing else can see: `static/og/`, written by
// scripts/gen-og.mjs before every `vite build`, and `build/`, written by the
// build itself. Both are gitignored, so both may be absent on a clean checkout -
// every test below is guarded on `existsSync` and ASSERTS IN BOTH BRANCHES, the
// shape src/lib/licence-notices.spec.ts established, because `requireAssertions`
// is on and a silently skipped test is a guard that has stopped guarding.
//
// The images and the heads are asserted from THE ROW rather than from a list of
// ids, so a widened FRONT_DOOR is covered here without anyone editing this file.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

const root = (path: string) =>
  fileURLToPath(new URL(`../../../${path}`, import.meta.url));
const OG_DIR = root("static/og");
const BUILD = root("build");

/** Discord's practical ceiling; scripts/gen-og.mjs refuses at the same number. */
const MAX_BYTES = 1024 * 1024;

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** The eleven tags every routed page and the shelf must carry. */
const OG_TAGS = [
  "og:type",
  "og:site_name",
  "og:title",
  "og:description",
  "og:url",
  "og:image",
  "og:image:type",
  "og:image:width",
  "og:image:height",
  "og:image:alt",
  "twitter:card",
];

function pngs(): string[] {
  return readdirSync(OG_DIR).map(String);
}

/**
 * IHDR, read out of the file rather than out of the encoder: width, height, bit
 * depth and colour type, at their fixed offsets after the signature.
 */
function ihdr(png: Buffer) {
  // 8 signature bytes, then the chunk's own 4-byte length, and only then the
  // type - so the first chunk's name starts at 12 and its data at 16.
  expect(
    png.subarray(12, 16).toString("ascii"),
    "the first chunk is IHDR",
  ).toBe("IHDR");
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
    bitDepth: png[24],
    colourType: png[25],
  };
}

/**
 * Every IDAT inflated and de-filtered back to RGB triples. The encoder writes
 * filter type 0 on every scanline, and this asserts that rather than assuming
 * it - a filtered row would decode as noise and the colour counts below would
 * be meaningless.
 */
function pixels(png: Buffer, width: number, height: number): Uint8Array {
  const idat: Buffer[] = [];
  let at = 8;
  while (at < png.length) {
    const length = png.readUInt32BE(at);
    const type = png.subarray(at + 4, at + 8).toString("ascii");
    if (type === "IDAT") idat.push(png.subarray(at + 8, at + 8 + length));
    at += 12 + length;
  }
  expect(idat.length, "the file carries at least one IDAT").toBeGreaterThan(0);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 3;
  expect(
    raw.length,
    "the inflated stream is one filter byte per row plus RGB",
  ).toBe((stride + 1) * height);
  const out = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    expect(raw[y * (stride + 1)], `row ${y} uses filter type 0`).toBe(0);
    out.set(
      raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)),
      y * stride,
    );
  }
  return out;
}

/** The content of a `<meta property="x">` or `<meta name="x">`, or undefined. */
function meta(html: string, key: string): string | undefined {
  const pattern = new RegExp(
    `<meta[^>]*(?:property|name)=["']${key}["'][^>]*>`,
    "i",
  );
  const tag = pattern.exec(html)?.[0];
  if (tag === undefined) return undefined;
  // The closing delimiter is a BACKREFERENCE to the opening one, never a
  // character class: three of the row's descriptions carry an apostrophe, and
  // ["'] would truncate "your finger's position" at the apostrophe and then
  // compare two equally truncated strings for a green test that proved nothing.
  const content = /content=(["'])(.*?)\1/i.exec(tag)?.[2];
  if (content === undefined) return undefined;
  return content
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function pageTitle(html: string): string | undefined {
  return /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1];
}

/** Every tag present, and the two URLs absolute against the one origin. */
function assertCompleteHead(
  html: string,
  where: string,
  image: string,
  url: string,
) {
  for (const tag of OG_TAGS) {
    expect(meta(html, tag), `${where} carries ${tag}`).toBeDefined();
  }
  expect(meta(html, "og:type"), where).toBe("website");
  expect(meta(html, "og:site_name"), where).toBe("HANGAR");
  // summary_large_image is what makes Discord render the big embed rather than
  // an 80x80 thumbnail. Nothing here is about Twitter.
  expect(meta(html, "twitter:card"), where).toBe("summary_large_image");
  expect(meta(html, "og:image:type"), where).toBe("image/png");
  expect(meta(html, "og:image:width"), where).toBe(String(OG_WIDTH));
  expect(meta(html, "og:image:height"), where).toBe(String(OG_HEIGHT));
  // Absolute, and absolute against SITE_ORIGIN specifically: a crawler resolves
  // nothing relative, and the origin has exactly one definition in this repo.
  expect(meta(html, "og:image"), `${where} og:image is absolute`).toBe(image);
  expect(meta(html, "og:url"), `${where} og:url is absolute`).toBe(url);
  // MEASURED, and it is why this assertion exists at all. SvelteKit's crawler
  // does carry og:image in CRAWLABLE_META_NAME_ATTRS, and a RELATIVE bad path
  // really does fail the build - observed as
  // `Error: 404 /og/nope.png (linked from /c/aurora/)`. But an ABSOLUTE og:image
  // is a different origin from the prerender base, so the crawler never follows
  // it, and the same bad path spelled absolutely builds green. An absolute URL
  // is not optional (a crawler resolves nothing relative), so the build cannot
  // be the guard here and this is: the file the head names must really be in the
  // artifact. `vite build` copies `static/` into `build/`, which is the other,
  // sufficient reason scripts/gen-og.mjs has to run first.
  expect(
    image.startsWith(SITE_ORIGIN),
    `${where} og:image names this site`,
  ).toBe(true);
  const asset = join(BUILD, image.slice(SITE_ORIGIN.length));
  expect(existsSync(asset), `${where} og:image resolves to ${asset}`).toBe(
    true,
  );
  // Held against what the page already told a visitor, so the head cannot say
  // one thing to a reader and another to a crawler.
  expect(meta(html, "og:title"), where).toBe(pageTitle(html));
  expect(meta(html, "og:description"), where).toBe(meta(html, "description"));
}

describe("the OG images and the heads that point at them (SHARE-04)", () => {
  it("holds exactly one image per routed configuration", () => {
    if (!existsSync(OG_DIR)) {
      expect(
        existsSync(OG_DIR),
        "static/og/ is generated by npm run build",
      ).toBe(false);
      return;
    }
    const wanted = FRONT_DOOR.map((entry) => `${entry.id}.png`).sort();
    // Sets, not a hand-written list: the row grows and this stays true.
    expect(pngs().sort()).toEqual(wanted);
    // Eight of the sixteen catalog entries have no page and therefore no head to
    // carry an og:image, which is what "one per routed configuration" means.
    expect(wanted.length).toBeGreaterThanOrEqual(8);
  });

  it("writes 1200 x 630 truecolour PNGs under a megabyte", () => {
    if (!existsSync(OG_DIR)) {
      expect(existsSync(OG_DIR)).toBe(false);
      return;
    }
    const files = pngs();
    expect(files.length, "there were images to check").toBeGreaterThan(0);
    for (const file of files) {
      const png = readFileSync(join(OG_DIR, file));
      expect([...png.subarray(0, 8)], `${file} signature`).toEqual(SIGNATURE);
      expect(ihdr(png), file).toEqual({
        width: OG_WIDTH,
        height: OG_HEIGHT,
        bitDepth: 8,
        colourType: 2,
      });
      expect(png.length, `${file} is under 1 MB`).toBeLessThan(MAX_BYTES);
    }
  });

  it("paints real LEDs, not just the dot field and the frame", () => {
    if (!existsSync(OG_DIR)) {
      expect(existsSync(OG_DIR)).toBe(false);
      return;
    }
    // 05-06's measured finding, and the correction it wrote down for this test:
    // tpad rests at 243 ZERO bytes and still encodes to 4,192 bytes, because the
    // dot field and the frame stroke are in every image whatever the pad is
    // doing. "At least one non-black pixel" is therefore VACUOUS - it passes on
    // a renderer that dropped every LED. So count the pixels that are none of
    // the three structural colours, and exempt a dark entry by its own declared
    // restsBlack (D-19) rather than by a guess.
    const black = "0,0,0";
    const dot = [...UNLIT_DOT_RGB].join(",");
    const frame = [...FRAME_RGB].join(",");

    const files = pngs();
    expect(files.length, "there were images to check").toBeGreaterThan(0);
    for (const file of files) {
      const id = file.replace(/\.png$/, "");
      const png = readFileSync(join(OG_DIR, file));
      const px = pixels(png, OG_WIDTH, OG_HEIGHT);
      let led = 0;
      let structure = 0;
      for (let i = 0; i < px.length; i += 3) {
        const rgb = `${px[i]},${px[i + 1]},${px[i + 2]}`;
        if (rgb === frame || rgb === dot) structure++;
        else if (rgb !== black) led++;
      }
      // The frame stroke is in every image whatever the pad is doing, so this
      // is the one structural claim that holds for a fully lit pad as well -
      // ninepads lights all 81 cells and therefore has no dot field at all.
      // Without it the LED count below could pass on a buffer of noise.
      expect(structure, `${file} carries the frame stroke`).toBeGreaterThan(0);

      const entry = byId(id);
      expect(entry, `${id} resolves in the catalog`).toBeDefined();
      if (entry?.restsBlack === true) {
        // Declared dark: there is nothing to assert about LEDs, and saying so
        // is the assertion. requireAssertions is on in this branch too.
        expect(led).toBeGreaterThanOrEqual(0);
      } else {
        expect(
          led,
          `${file} lit no LED at all - the simulator produced nothing`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("gives every prerendered configuration page a complete Open Graph head", () => {
    if (!existsSync(BUILD)) {
      expect(existsSync(BUILD), "build/ is written by npm run build").toBe(
        false,
      );
      return;
    }
    for (const entry of FRONT_DOOR) {
      const file = join(BUILD, "c", entry.id, "index.html");
      expect(existsSync(file), `${entry.id} has a prerendered page`).toBe(true);
      const html = readFileSync(file, "utf8");
      assertCompleteHead(
        html,
        `/c/${entry.id}/`,
        `${SITE_ORIGIN}/og/${entry.id}.png`,
        `${SITE_ORIGIN}/c/${entry.id}/`,
      );
      expect(meta(html, "og:title"), entry.id).toBe(`${entry.name} — HANGAR`);
      expect(meta(html, "og:description"), entry.id).toBe(entry.description);
      // The alt string has one author - src/lib/tune/copy.ts - and this is what
      // stops a second copy of it appearing in a Svelte head.
      expect(meta(html, "og:image:alt"), entry.id).toBe(ogAlt(entry.name));
    }
  });

  it("gives the shelf itself the same head, on the opening centre's picture", () => {
    if (!existsSync(BUILD)) {
      expect(existsSync(BUILD)).toBe(false);
      return;
    }
    const html = readFileSync(join(BUILD, "index.html"), "utf8");
    const opening = FRONT_DOOR[0];
    assertCompleteHead(
      html,
      "/",
      `${SITE_ORIGIN}/og/${opening.id}.png`,
      `${SITE_ORIGIN}/`,
    );
    // The shelf's own words, not a configuration's: a bare link to the site
    // unfurls as the site rather than as whatever happens to sit at index 0.
    expect(pageTitle(html)).toBe("HANGAR");
    expect(meta(html, "og:title")).toBe("HANGAR");
    expect(meta(html, "og:description")).toBe(meta(html, "description"));
    expect(meta(html, "og:image:alt")).toBe(ogAlt(opening.name));
  });
});
