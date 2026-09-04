#!/usr/bin/env node
/**
 * Generate one 1200x630 Open Graph PNG per routed configuration, from the same
 * simulator the site runs, into `static/og/<id>.png`.
 *
 * WHY THIS RUNS BEFORE `vite build`, AND NOT AS A `prebuild` HOOK.
 * SvelteKit's prerender crawler follows `og:image`:
 * `node_modules/@sveltejs/kit/src/core/postbuild/crawl.js` carries `og:image`
 * in its meta-property allow-list and calls `push_href(content)` for it. So an
 * `og:image` pointing at a file that does not exist yet FAILS the build, naming
 * `/og/aurora.png`. The images therefore have to be on disk first. It is spelled
 * out in `package.json`'s `build` as one visible chain rather than hidden in a
 * lifecycle hook, because a hook does not run for a bare `npx vite build` and the
 * failure would then be a prerender 404 with no clue attached.
 *
 * WHICH ENTRIES GET AN IMAGE: the ones with an address. `src/routes/c/[id]/+page.ts`
 * generates `entries()` from FRONT_DOOR, so `/c/euclid/` does not exist and has no
 * <head> to carry an og:image. This script reads THE SAME SOURCE, so widening the
 * row gives those entries images with no change here. Eight of the sixteen catalog
 * entries deliberately have no image because they have no address.
 *
 * WHY VITE RATHER THAN PLAIN NODE. `scripts/capture-preset-baseline.mjs` records
 * that plain `node` can import `_pad.ts` (Node 24 strips types) but CANNOT import
 * `pad-sim.ts`, whose extensionless `from "./_pad"` is not resolvable by Node's ESM
 * loader. Vite's own Node API resolves `$lib`, extensionless TS and the pinned
 * protocol package correctly, and Vite is already a devDependency, so this adds no
 * dependency at all.
 *
 * `static/og/` is a build artefact and is gitignored. A clean checkout regenerates
 * it, and `scripts/deploy.mjs`'s clean-tree gate stays satisfiable because an
 * ignored path is never a dirty one.
 *
 * Copyright (C) 2026 Botond Sandor
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import {
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "static", "og");

/** Discord's practical ceiling. The measured files are 4-7 KB, so this is a tripwire. */
const MAX_BYTES = 1024 * 1024;

function fail(message) {
  console.error("gen-og: " + message);
  process.exit(1);
}

const server = await createServer({
  configFile: join(ROOT, "vite.config.ts"),
  root: ROOT,
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "warn",
});

try {
  const { FRONT_DOOR } = await server.ssrLoadModule(
    "/src/lib/catalog/front-door.ts",
  );
  const { byId } = await server.ssrLoadModule("/src/lib/catalog/index.ts");
  const { createEngine } = await server.ssrLoadModule("/src/lib/sim/engine.ts");
  const { renderOgPixels, OG_WIDTH, OG_HEIGHT, OG_TICK } =
    await server.ssrLoadModule("/src/lib/og/render.ts");
  const { encodePng } = await server.ssrLoadModule("/src/lib/og/png.ts");

  // Rebuilt from empty, so an id that leaves the row cannot leave a stale
  // picture behind for a later `og:image` to keep resolving against.
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  for (const row of FRONT_DOOR) {
    const entry = byId(row.id);
    if (entry === undefined) {
      fail('the row names "' + row.id + '", which is in no catalog entry');
    }

    // GATE 1: an entry whose engine cannot be built. A skipped entry would ship
    // a page whose og:image 404s the next build instead of failing this one.
    let engine;
    try {
      engine = await createEngine(entry);
    } catch (error) {
      fail(
        'could not build an engine for "' +
          row.id +
          '": ' +
          (error && error.message ? error.message : String(error)),
      );
    }

    engine.run(OG_TICK);
    const frame = engine.frame;
    let litCells = 0;
    for (let n = 0; n < frame.length / 3; n++) {
      if (
        frame[n * 3] !== 0 ||
        frame[n * 3 + 1] !== 0 ||
        frame[n * 3 + 2] !== 0
      ) {
        litCells++;
      }
    }

    // GATE 2: a frame that is entirely zero. Read against the entry's OWN
    // declaration rather than against a constant: `restsBlack` (D-19) exists so
    // that "the picture went black" and "this one is meant to be black" are
    // distinguishable. Every current row entry declares false, so a dark frame
    // here means the simulator broke; a row widened to admit a dark entry keeps
    // working without weakening the gate for the others.
    if (litCells === 0 && entry.restsBlack !== true) {
      fail(
        '"' +
          row.id +
          '" rendered an entirely dark pad at tick ' +
          OG_TICK +
          ", and the entry does not declare restsBlack. " +
          "The simulator produced nothing rather than the card being dark.",
      );
    }

    const png = Buffer.from(
      encodePng(renderOgPixels(frame), OG_WIDTH, OG_HEIGHT),
    );

    // GATE 3: over a megabyte. Nothing plausible reaches it, which is exactly
    // why crossing it means something is wrong rather than something is big.
    if (png.length > MAX_BYTES) {
      fail(
        '"' +
          row.id +
          '" encoded to ' +
          png.length +
          " bytes, over the " +
          MAX_BYTES +
          "-byte ceiling",
      );
    }

    writeFileSync(join(OUT_DIR, row.id + ".png"), png);
    console.log(
      "gen-og: " +
        row.id.padEnd(10) +
        String(png.length).padStart(7) +
        " bytes   " +
        String(litCells).padStart(2) +
        " of 81 cells lit" +
        (entry.restsBlack ? "   (restsBlack)" : ""),
    );
  }

  const written = readdirSync(OUT_DIR).map(String);
  const largest = written.reduce(
    (max, name) => Math.max(max, statSync(join(OUT_DIR, name)).size),
    0,
  );
  console.log(
    "gen-og: " +
      written.length +
      " images in static/og/ at " +
      OG_WIDTH +
      "x" +
      OG_HEIGHT +
      ", tick " +
      OG_TICK +
      ", largest " +
      largest +
      " bytes",
  );
} finally {
  await server.close();
}
