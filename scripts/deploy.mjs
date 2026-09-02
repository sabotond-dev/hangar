#!/usr/bin/env node
/**
 * The one-command manual deploy (D-08).
 *
 *   npm run deploy
 *
 * Six steps, each a hard failure. Every one of them exists because the
 * corresponding failure is silent.
 *
 * The clean-tree gate is the load-bearing one. `git archive HEAD` archives the
 * commit, while Vite bundles the working tree; deploying with uncommitted
 * changes therefore serves a source archive that is not the source of the
 * bundle sitting next to it — which is exactly the correspondence GPLv3
 * section 6(d) requires. It is a refusal, not a warning, and the fix is to
 * commit rather than to bypass it.
 *
 * A Node script rather than an npm shell chain because this is a Windows
 * machine: `SHA=$(...)` and `&&`-chained assignment behave differently in
 * PowerShell, cmd and Git Bash. `execSync` with `{ stdio: 'inherit' }` sidesteps
 * that whole class of problem and makes each refusal a real `process.exit(1)`
 * rather than a shell truthiness accident.
 *
 * Deploys are manual, from this machine. No CI, no host-side Git integration.
 *
 * Copyright (C) 2026 Botond Sandor
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://hangar.sabotond.workers.dev";

function step(n, message) {
  console.log("");
  console.log("deploy: [" + n + "/6] " + message);
}

// 1. The commit being deployed. The archive filename, the footer link and the
//    banner at the end all derive from it, so failing to resolve it is fatal
//    rather than a fallback to "unknown".
step(1, "resolving HEAD");
let sha;
try {
  sha = execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
} catch (error) {
  console.error(
    "deploy: could not resolve HEAD (" + (error.message || error) + ")",
  );
  process.exit(1);
}
if (!/^[0-9a-f]{40}$/.test(sha)) {
  console.error(
    'deploy: git rev-parse HEAD returned "' +
      sha +
      '", which is not a 40-character SHA',
  );
  process.exit(1);
}
console.log("deploy: " + sha);

// 2. Refuse a dirty working tree. See the header comment: this is the gate the
//    whole script exists for.
step(2, "checking the working tree is clean");
const dirty = execSync("git status --porcelain", {
  cwd: ROOT,
  encoding: "utf8",
}).trim();
if (dirty) {
  console.error("");
  console.error("deploy: the working tree is dirty. Refusing to deploy.");
  console.error("");
  for (const line of dirty.split(/\r?\n/)) {
    console.error("    " + line);
  }
  console.error("");
  console.error(
    "  git archive ships HEAD while Vite bundles the working tree, so the source",
  );
  console.error(
    "  archive served beside the bundle would not be the source of that bundle.",
  );
  console.error(
    "  Commit (or stash) the paths above and run again. The fix is to commit —",
  );
  console.error("  never to bypass this gate.");
  process.exit(1);
}
console.log("deploy: clean");

// 3. Build. `npm run build` is `vite build` followed by scripts/postbuild.mjs,
//    which is what writes the licence artefacts and the source archive, so
//    nothing compliance-related is invented here.
step(3, "building");
try {
  execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
} catch {
  console.error("");
  console.error("deploy: npm run build failed. Nothing was deployed.");
  process.exit(1);
}

// 4. The compliance artefacts have to be on disk before anything is shipped.
const archive = "source-" + sha + ".tar.gz";
step(4, "verifying the compliance artefacts");
const required = [
  "index.html",
  "404.html",
  "LICENSE",
  "THIRD-PARTY.md",
  "licenses",
  archive,
];
const missing = required.filter(
  (name) => !existsSync(join(ROOT, "build", name)),
);
if (missing.length > 0) {
  console.error("");
  console.error(
    "deploy: build/ is missing " +
      missing.map((name) => "build/" + name).join(", ") +
      ". Nothing was deployed.",
  );
  process.exit(1);
}
console.log("deploy: " + required.length + " artefacts present");

// 5. And the archive has to be the Corresponding Source and nothing else: the
//    lockfile is what makes the build reproducible (GPLv3 section 1, "scripts
//    to control those activities"), and internal planning material must never
//    ship. `export-ignore` fails silently from an uncommitted .gitattributes,
//    so this listing is the real gate rather than a restatement of one.
step(5, "verifying the source archive contents");
let entries;
try {
  entries = execSync('tar -tzf "build/' + archive + '"', {
    cwd: ROOT,
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .filter(Boolean);
} catch (error) {
  console.error("");
  console.error(
    "deploy: could not list build/" +
      archive +
      " (" +
      (error.message || error) +
      ")",
  );
  process.exit(1);
}
const hasLockfile = entries.some((entry) =>
  entry.endsWith("package-lock.json"),
);
const leaked = entries.filter((entry) => entry.includes(".planning/"));
if (!hasLockfile || leaked.length > 0) {
  console.error("");
  if (!hasLockfile) {
    console.error(
      "deploy: " +
        archive +
        " carries no package-lock.json — it is not Corresponding Source.",
    );
  }
  for (const entry of leaked) {
    console.error(
      "deploy: " + archive + " carries internal material: " + entry,
    );
  }
  console.error("deploy: nothing was deployed.");
  process.exit(1);
}
console.log(
  "deploy: " +
    entries.length +
    " entries, lockfile present, no .planning/ material",
);

// 6. Ship it.
step(6, "deploying");
try {
  execSync("npx wrangler deploy", { cwd: ROOT, stdio: "inherit" });
} catch {
  console.error("");
  console.error("deploy: wrangler deploy failed. See the output above.");
  process.exit(1);
}

console.log("");
console.log("Deployed " + sha + " to " + SITE);
console.log("Source archive: /" + archive);
console.log("The preview is gated by Basic Auth (D-07).");
