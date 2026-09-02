#!/usr/bin/env node
/**
 * Postbuild: make `build/` a complete, GPLv3-compliant artifact.
 *
 * Copies the licence, the third-party notices and the full licence texts next to
 * the bundle, and writes a source archive of exactly the commit the bundle was
 * built from. GPLv3 section 6(d) is discharged by offering that archive from the
 * same place as the object code, which is why this runs in `build` rather than
 * in `deploy`: a plain `npm run build` must already produce the complete thing.
 *
 * The archive filename carries the FULL 40-character SHA because the footer
 * links at `/source-{__COMMIT_SHA__}.tar.gz` and `__COMMIT_SHA__` is
 * `git rev-parse HEAD` verbatim. The archive's internal directory prefix uses
 * the short SHA, which is the conventional shape for a released tarball.
 *
 * Copyright (C) 2026 Botond Sandor
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { execSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = join(ROOT, "build");

function fail(message) {
  console.error("postbuild: " + message);
  process.exit(1);
}

// A build with no SHA cannot produce a footer link that resolves, so this is
// fatal rather than a fallback to "unknown".
let SHA;
try {
  SHA = execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
} catch (error) {
  fail(
    "could not resolve HEAD (" +
      (error.message || error) +
      "). The source archive and the footer link both depend on it.",
  );
}
if (!/^[0-9a-f]{40}$/.test(SHA)) {
  fail('git rev-parse HEAD returned "' + SHA + '", which is not a 40-char SHA');
}

if (!existsSync(BUILD)) {
  mkdirSync(BUILD, { recursive: true });
}

for (const file of ["LICENSE", "THIRD-PARTY.md"]) {
  if (!existsSync(join(ROOT, file))) {
    fail(file + " is missing from the repository root");
  }
  copyFileSync(join(ROOT, file), join(BUILD, file));
}

if (!existsSync(join(ROOT, "licenses"))) {
  fail("licenses/ is missing - run `npm run licenses`");
}
rmSync(join(BUILD, "licenses"), { recursive: true, force: true });
cpSync(join(ROOT, "licenses"), join(BUILD, "licenses"), { recursive: true });

// Drop archives of earlier commits. Serving two of them would leave a visitor
// guessing which one corresponds to the bundle they just ran.
const archive = "source-" + SHA + ".tar.gz";
for (const entry of readdirSync(BUILD)) {
  if (entry.startsWith("source-") && entry.endsWith(".tar.gz")) {
    rmSync(join(BUILD, entry), { force: true });
  }
}

execSync(
  'git archive --format=tar.gz --prefix="hangar-' +
    SHA.slice(0, 7) +
    '/" -o "build/' +
    archive +
    '" HEAD',
  { cwd: ROOT, stdio: "inherit" },
);

const required = [
  join(BUILD, "LICENSE"),
  join(BUILD, "THIRD-PARTY.md"),
  join(BUILD, "licenses"),
  join(BUILD, archive),
];
const missing = required.filter((path) => !existsSync(path));
if (missing.length > 0) {
  fail("missing build outputs: " + missing.join(", "));
}

const bytes = statSync(join(BUILD, archive)).size;
console.log(
  "postbuild: " +
    SHA +
    " - LICENSE, THIRD-PARTY.md and licenses/ copied into build/; " +
    archive +
    " is " +
    Math.round(bytes / 1024) +
    " KB",
);
