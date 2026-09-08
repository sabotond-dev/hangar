#!/usr/bin/env node
/**
 * Generate one 1200x630 Open Graph PNG per routed configuration, from the same
 * simulator the site runs, into `static/og/<id>.png`.
 *
 * WHY THIS RUNS BEFORE `vite build`, AND NOT AS A `prebuild` HOOK.
 *
 * The plain, sufficient reason: `vite build` COPIES `static/` INTO `build/`. An
 * image written after it would sit in `static/og/` forever and never reach the
 * artifact, and every `og:image` would 404 on the deployed site with nothing red
 * anywhere. Ordering is not an optimisation here; it is the whole mechanism.
 *
 * The second reason, MEASURED rather than assumed, and it turned out to be
 * narrower than 05-07-PLAN expected. SvelteKit's prerender crawler does follow
 * `og:image` - `node_modules/@sveltejs/kit/src/core/postbuild/crawl.js` carries
 * it in CRAWLABLE_META_NAME_ATTRS - and a RELATIVE `og:image` naming a missing
 * file really does fail the build:
 *
 *     Error: 404 /og/nope.png (linked from /c/aurora/)
 *
 * But HANGAR's `og:image` is ABSOLUTE, because a crawler resolves nothing
 * relative, and an absolute URL is a different origin from the prerender base -
 * so the crawler never follows it and the same missing file builds green. The
 * build is therefore NOT the guard for this repository's heads.
 * `src/lib/og/build.spec.ts` is: it asserts the file each absolute `og:image`
 * names really exists under `build/`, and `e2e/artifacts.e2e.ts` asserts the
 * deployed artifact serves it.
 *
 * It is spelled out in `package.json`'s `build` as one visible chain rather than
 * hidden in a lifecycle hook, because a hook does not run for a bare
 * `npx vite build` and the failure would then be eight silent 404s in
 * production.
 *
 * WHICH ENTRIES GET AN IMAGE: the ones with an address, and there is now exactly
 * ONE declaration of which those are.
 *
 * AMENDMENT (D-07, plan 05.1-05). This script used to read FRONT_DOOR, because the
 * row WAS the routed set: `/c/euclid/` did not exist, so it had no <head> to carry
 * an og:image and needed no picture. D-07 made the catalog the routed set - sixteen
 * pages, not eight - and `ROUTED` in `src/lib/catalog/listing.ts` is the single name
 * for it. Four files need that set: `src/routes/c/[id]/+page.ts` generates the
 * pages, this script renders one image per page, `src/lib/og/build.spec.ts` asserts
 * each page's og:image resolves under `build/`, and `e2e/artifacts.e2e.ts` asserts
 * the deployed site serves it. Widen one alone and eight pages ship an og:image that
 * 404s with NOTHING RED ANYWHERE - observed on this machine on 2026-09-04, between
 * this plan's two commits: the sixteen-page build left eight images missing and the
 * whole 685-test unit suite stayed green. All four read `ROUTED` for that reason.
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
  const { ROUTED } = await server.ssrLoadModule("/src/lib/catalog/listing.ts");
  const { byId } = await server.ssrLoadModule("/src/lib/catalog/index.ts");
  const { createEngine } = await server.ssrLoadModule("/src/lib/sim/engine.ts");
  const { renderOgPixels, OG_WIDTH, OG_HEIGHT, OG_TICK } =
    await server.ssrLoadModule("/src/lib/og/render.ts");
  const { encodePng } = await server.ssrLoadModule("/src/lib/og/png.ts");
  // D-09's demonstration finger, and the same driver and sampler the browser
  // uses. An entry with a demo path is captured from the END of its gesture
  // rather than from tick 64, which makes this image byte-identical in spirit
  // to what SimHost.stillFrame() paints under reduced motion - the same reset,
  // the same period, the same one-sample-per-contact-per-tick delivery.
  const { demoPathFor, driveDemo, isDarkByConstruction } =
    await server.ssrLoadModule("/src/lib/sim/demo.ts");
  const { TouchSampler } = await server.ssrLoadModule("/src/lib/sim/touch.ts");

  // Rebuilt from empty, so an id that leaves the routed set cannot leave a
  // stale picture behind for a later `og:image` to keep resolving against.
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  for (const listed of ROUTED) {
    const entry = byId(listed.id);
    if (entry === undefined) {
      fail(
        'the listing names "' + listed.id + '", which is in no catalog entry',
      );
    }

    // GATE 1: an entry whose engine cannot be built. A skipped entry would ship
    // a page whose og:image 404s the next build instead of failing this one.
    let engine;
    try {
      engine = await createEngine(entry);
    } catch (error) {
      fail(
        'could not build an engine for "' +
          listed.id +
          '": ' +
          (error && error.message ? error.message : String(error)),
      );
    }

    const demo = demoPathFor(listed.id);
    if (demo === undefined) {
      engine.run(OG_TICK);
    } else {
      // Replayed to the END of the path, tick by tick, because the samples are
      // delivered by the sampler one per tick and engine.run() would skip past
      // all of them. The picture is therefore the picture the card rests on.
      const sampler = new TouchSampler();
      for (let t = 0; t < demo.periodTicks; t++) {
        driveDemo(demo, t, sampler, engine.coordMax);
        sampler.deliver(engine);
        engine.tick();
      }
    }
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

    // GATE 2: a frame that is entirely zero.
    //
    // THE restsBlack EXEMPTION WAS REMOVED HERE BY NAME, AND D-09 IS WHY. This
    // gate used to read "non-dark unless the entry declares restsBlack", which
    // was right while a resting-black card really did ship a black square. It
    // is now wrong in exactly one direction, and it is the direction that
    // matters: a black image for a restsBlack entry would still PASS, which is
    // precisely the regression the demonstration touch exists to eliminate. A
    // gate that stays green on the thing a phase was built to prevent is worse
    // than no gate, because it reads like coverage.
    //
    // So: every entry's OG image is non-dark, full stop - with one exemption,
    // and it is not a flag on the entry but a named row in
    // src/lib/sim/demo.ts's DARK_BY_CONSTRUCTION, which carries the reason. The
    // difference is not cosmetic: removing a demo path from ghost, morph or
    // etch turns this gate RED naming the entry, where under the old rule it
    // would have quietly re-exempted it.
    if (litCells === 0 && !isDarkByConstruction(listed.id)) {
      fail(
        '"' +
          listed.id +
          '" rendered an entirely dark pad' +
          (demo === undefined
            ? " at tick " + OG_TICK
            : " at the end of its demo path") +
          ", and it is not named in DARK_BY_CONSTRUCTION. " +
          "Every card paints (D-09): either the simulator produced nothing, or " +
          "this entry needs a demonstration gesture and has none.",
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
          listed.id +
          '" encoded to ' +
          png.length +
          " bytes, over the " +
          MAX_BYTES +
          "-byte ceiling",
      );
    }

    writeFileSync(join(OUT_DIR, listed.id + ".png"), png);
    console.log(
      "gen-og: " +
        listed.id.padEnd(10) +
        String(png.length).padStart(7) +
        " bytes   " +
        String(litCells).padStart(2) +
        " of 81 cells lit" +
        (demo === undefined ? "" : "   (demo: " + demo.gesture + ")") +
        (isDarkByConstruction(listed.id) ? "   (no LED layer at all)" : ""),
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
