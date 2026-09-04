// The fast half of D-14's laziness guarantee.
//
// e2e/catalog.e2e.ts is the proof: it watches a real browser load the real
// static build and counts .wasm responses. These three tests are the guards
// that go red in a second instead of forty, and they are what stops a
// regression ever reaching the e2e. Their worth is not assumed - the plan's
// paired negative check adds one static import and observes BOTH this file and
// the e2e cold-load test turn red, which is what makes these guards evidence
// rather than a style rule.
//
// Every regular expression below is deliberately backslash-free, in the
// src/lib/config-shape.spec.ts house style.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repo = (rel: string) =>
  fileURLToPath(new URL(`../../../${rel}`, import.meta.url));

/**
 * Assembled from fragments, the forbidden-instructions.spec.ts trick. This
 * spec's own source must not contain the string it searches for, which is what
 * lets the walk in test 3 exclude specs by file name rather than needing an
 * exception for itself.
 */
const VM_PACKAGE = ["was", "moon"].join("");

/** Comments removed before any structural match: line, block and markup. */
const stripComments = (source: string) =>
  source
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

/** Every file under `dir`, repo-relative, in a stable order. */
function walk(dir: string): string[] {
  const root = repo(dir);
  const out: string[] = [];
  for (const entry of readdirSync(root, { recursive: true })) {
    const rel = String(entry).split(sep).join("/");
    if (!statSync(join(root, String(entry))).isFile()) continue;
    out.push(`${dir}/${rel}`);
  }
  return out.sort();
}

const source = (rel: string) => stripComments(readFileSync(repo(rel), "utf8"));

/** Both import forms, static and dynamic. Backslash-free by construction. */
const SPECIFIER_PATTERNS = [
  /from[ ]*["']([^"']+)["']/g,
  /import[ ]*[(][ ]*["']([^"']+)["'][ ]*[)]/g,
];

function specifiersOf(rel: string): string[] {
  const text = source(rel);
  const out: string[] = [];
  for (const pattern of SPECIFIER_PATTERNS) {
    for (const match of text.matchAll(pattern)) out.push(match[1]);
  }
  return out;
}

describe("the Lua VM stays out of a cold load", () => {
  it("the catalog reaches neither the simulator nor the VM", () => {
    // Specs are excluded by FILE NAME, never by directory. The Phase 3
    // green-and-vacuous lesson: a directory-wide exclusion silently drops real
    // files and the run stays green.
    const files = walk("src/lib/catalog").filter(
      (rel) => rel.endsWith(".ts") && !rel.endsWith(".spec.ts"),
    );
    // types.ts, index.ts, front-door.ts and the eight entry modules. Without
    // this an empty walk would make the assertion below pass vacuously.
    expect(
      files.length,
      "catalog modules were actually read",
    ).toBeGreaterThanOrEqual(10);

    const forbidden = ["sim/", "pad-sim", VM_PACKAGE, "lib/pad"];
    const seen: string[] = [];
    const offenders: string[] = [];
    for (const rel of files) {
      for (const specifier of specifiersOf(rel)) {
        seen.push(specifier);
        if (forbidden.some((needle) => specifier.includes(needle))) {
          offenders.push(`${rel} -> ${specifier}`);
        }
      }
    }
    expect(seen.length, "imports were actually collected").toBeGreaterThan(0);
    expect(
      offenders,
      "a catalog module reaches the simulator or the Lua VM",
    ).toEqual([]);
  });

  it("engine.ts reaches the Lua wrapper only through a dynamic import", () => {
    // A static import of ./lua-pad-sim puts the VM's module graph - and with it
    // the fingerprinted glue.wasm URL - into the chunk of every consumer of
    // engine.ts, including a page of nothing but ported entries.
    const text = source("src/lib/sim/engine.ts");
    expect(text, "the dynamic import of the Lua wrapper is gone").toMatch(
      /import[ ]*[(][ ]*["'][.][/]lua-pad-sim["'][ ]*[)]/,
    );
    expect(text, "engine.ts imports the Lua wrapper statically").not.toMatch(
      /from[ ]*["'][.][/]lua-pad-sim["']/,
    );
  });

  it("one module and one only names the VM package", () => {
    const files = walk("src").filter(
      (rel) =>
        (rel.endsWith(".ts") || rel.endsWith(".svelte")) &&
        !rel.endsWith(".spec.ts") &&
        !rel.startsWith("src/vendor/"),
    );
    expect(files.length, "source modules were actually read").toBeGreaterThan(
      20,
    );
    const namers = files.filter((rel) => source(rel).includes(VM_PACKAGE));
    expect(
      namers,
      "the lazy gate is a one-module rule and has grown an exemption",
    ).toEqual(["src/lib/sim/ready.ts"]);
  });
});
