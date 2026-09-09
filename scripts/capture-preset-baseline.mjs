#!/usr/bin/env node
/**
 * Capture the nine-preset cost baseline from BOTOR's OWN compiler (D-11a).
 *
 * This script is the reason `src/lib/fidelity/preset-baseline.json` is evidence
 * rather than a restatement: the fixture is produced by the compiler in the
 * sibling grid-editor checkout at the pinned commit, so the HANGAR spec that
 * compares the VENDORED compiler against it is comparing the copy to the
 * original, not the copy to itself.
 *
 * IT READS THE SIBLING'S `pad.PRESETS`, NEVER src/lib/catalog/presets.ts (plan
 * 11-05). HANGAR now declares its own nine, but this script's whole job is to
 * capture the ORIGINAL's shelf and the original's output. Pointing it at
 * HANGAR's values would record the copy's behaviour under the original's name,
 * which is the one failure the fixture exists to make impossible.
 *
 * Read-only in the sibling repository. It runs no state-changing git command
 * there, writes no file there, and asserts the sibling's `git status
 * --porcelain` is byte-identical before and after. `cwd` stays in HANGAR
 * precisely so that no bundler cache can ever be created next door.
 *
 * Three mechanics this depends on, all measured before it was written:
 *
 * 1. Plain `node` is enough. Node 24 strips types on import, and after the RGB
 *    inline the sibling `_pad.ts` has no relative import left to resolve. No
 *    tsx, no vite-node, no bundler. The sibling `pad-sim.ts` is NOT loadable
 *    this way (its extensionless `from "./_pad"` is not resolvable by Node
 *    ESM) - this script only ever needs the compiler.
 * 2. Module resolution crosses the repository boundary by itself. Importing the
 *    sibling file by absolute file:// URL binds `@intechstudio/grid-protocol`
 *    to grid-editor's OWN node_modules, which is what D-11a asks for.
 * 3. The two checkouts hold SEPARATE module instances of the protocol package.
 *    See the comment at the readiness gate below - getting this wrong fails in
 *    a way that looks like a WASM problem and is not.
 *
 * Copyright (C) 2026 Botond Sandor
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "lib", "fidelity", "preset-baseline.json");

/** D-01. The commit the vendored bytes - and this baseline - were taken from. */
const UPSTREAM_COMMIT = "a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c";
const UPSTREAM_REPOSITORY = "https://github.com/sabotond-dev/botor.git";
const UPSTREAM_BRANCH = "main";
const UPSTREAM_COMPILER = "src/renderer/main/zona/_pad.ts";

/** Must equal HANGAR's PROTOCOL_PIN. The minifier lives in this package. */
const PROTOCOL_PIN = "1.20260825.1135";
const PROTOCOL_PACKAGE = "@intechstudio/grid-protocol";

const EXPECTED_PRESET_COUNT = 9;

const NOTE =
  "Captured by running BOTOR's own compiler inside the grid-editor checkout, " +
  "so this fixture is independent of the vendored copy. cost().used is " +
  "max(compressed, raw) + reserved and the raw length wins for all nine " +
  "presets, so it cannot see a minifier regression. The compressed lengths " +
  "are recorded separately and are what the D-11 bump gate asserts.";

function fail(message) {
  console.error("capture-preset-baseline: " + message);
  process.exit(1);
}

function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
}

// Resolve the sibling checkout from the MAIN repository, never from ROOT/..
// Under `git worktree` the repo root is .claude/worktrees/<name>/ and its
// parent lands inside .claude/. `git rev-parse --git-common-dir` always names
// the MAIN repository's .git directory, so its grandparent is the directory the
// sibling repos share, in both layouts. Same block as
// scripts/record-upstream-manifest.mjs and src/lib/format-parity.spec.ts.
let commonDir;
try {
  commonDir = git(["rev-parse", "--git-common-dir"], ROOT).trim();
} catch (error) {
  fail("git rev-parse --git-common-dir failed: " + (error.message || error));
}
const SIBLINGS = resolve(ROOT, commonDir, "..", "..");
const BOTOR = process.env.BOTOR_REPO ?? join(SIBLINGS, "grid-editor");

// Fails, never skips. A capture that shrugs when its subject is missing would
// leave the previous fixture in place and report success.
if (!existsSync(BOTOR)) {
  fail(
    "the grid-editor checkout was not found at " +
      BOTOR +
      ". Set BOTOR_REPO to the checkout path.",
  );
}

// The sibling is READ-ONLY. Capture its working tree state before touching it.
let statusBefore;
try {
  statusBefore = git(["-C", BOTOR, "status", "--porcelain"], ROOT);
} catch (error) {
  fail(
    "could not read the sibling working tree state at " +
      BOTOR +
      ": " +
      (error.message || error),
  );
}

// D-01 gate: the cited SHA must be publicly resolvable AND be what the local
// checkout is actually sitting on. A baseline captured from a tree that has
// moved on pins numbers nobody can reproduce.
let lsRemote;
try {
  lsRemote = git(
    ["ls-remote", UPSTREAM_REPOSITORY, "refs/heads/" + UPSTREAM_BRANCH],
    ROOT,
  ).trim();
} catch (error) {
  fail(
    "git ls-remote " +
      UPSTREAM_REPOSITORY +
      " failed: " +
      (error.message || error),
  );
}
if (!lsRemote.startsWith(UPSTREAM_COMMIT)) {
  fail(
    "refs/heads/" +
      UPSTREAM_BRANCH +
      " of " +
      UPSTREAM_REPOSITORY +
      ' is "' +
      lsRemote +
      '", which does not start with the recorded upstream commit ' +
      UPSTREAM_COMMIT +
      ". Re-sync deliberately (VENDOR.md) before re-capturing.",
  );
}

let head;
try {
  head = git(["-C", BOTOR, "rev-parse", "HEAD"], ROOT).trim();
} catch (error) {
  fail(
    "git rev-parse HEAD failed in " + BOTOR + ": " + (error.message || error),
  );
}
if (head !== UPSTREAM_COMMIT) {
  fail(
    "the checkout at " +
      BOTOR +
      " is at " +
      head +
      ", not the recorded upstream commit " +
      UPSTREAM_COMMIT +
      ". Check it out there yourself - this script never moves a sibling repository.",
  );
}

// The minifier that produces every number below ships inside the protocol
// package. A baseline captured against a different one is worthless, however
// correct the compiler is.
const siblingPkgPath = join(BOTOR, "package.json");
if (!existsSync(siblingPkgPath)) {
  fail("the sibling package.json is missing: " + siblingPkgPath);
}
const siblingPkg = JSON.parse(readFileSync(siblingPkgPath, "utf8"));
const siblingProtocol =
  siblingPkg.dependencies?.[PROTOCOL_PACKAGE] ??
  siblingPkg.devDependencies?.[PROTOCOL_PACKAGE];
if (siblingProtocol !== PROTOCOL_PIN) {
  fail(
    "the checkout at " +
      BOTOR +
      " declares " +
      PROTOCOL_PACKAGE +
      " as " +
      String(siblingProtocol) +
      ", not HANGAR's pin " +
      PROTOCOL_PIN +
      ". The minifier ships in that package, so a baseline captured against a " +
      "different version cannot back the bump gate.",
  );
}

// Import the SIBLING compiler by absolute file:// URL. This is what binds the
// protocol package to grid-editor's own node_modules (mechanic 2 above).
const compilerUrl = pathToFileURL(
  join(BOTOR, ...UPSTREAM_COMPILER.split("/")),
).href;
let pad;
try {
  pad = await import(compilerUrl);
} catch (error) {
  fail(
    "could not import the sibling compiler at " +
      compilerUrl +
      ": " +
      (error.message || error),
  );
}

// Await the SIBLING's readiness gate, on the module just imported.
//
// HANGAR's own copy of the protocol package is a DIFFERENT module instance.
// Calling HANGAR's initLuaFormatter() readies HANGAR's copy and does nothing
// for this one: measured, the sibling's cost() still threw "The Lua formatter
// is not initialised." after HANGAR's initLuaFormatter() had resolved. So this
// script never touches HANGAR's formatter - it awaits the gate exported by the
// module it just imported. Getting this backwards fails in a way that reads as
// a WASM packaging problem and is not one.
await pad.padCompilerReady();

if (
  !Array.isArray(pad.PRESETS) ||
  pad.PRESETS.length !== EXPECTED_PRESET_COUNT
) {
  fail(
    "the sibling compiler exports " +
      (Array.isArray(pad.PRESETS) ? pad.PRESETS.length : "no") +
      " presets, expected " +
      EXPECTED_PRESET_COUNT +
      ". The shelf changed upstream; the fixture, the spec count and the " +
      "acceptance criteria all have to move together.",
  );
}

const presets = {};
for (const p of pad.PRESETS) {
  const built = pad.compile(p.state);
  const c = pad.cost(built);
  presets[p.id] = {
    stamp: built.stamp,
    timerPeriodMs: built.timerPeriodMs,
    setupLua: built.setupLua,
    timerLua: built.timerLua,
    setupRawLength: built.setupLua.length,
    timerRawLength: built.timerLua.length,
    setupCompressedLength: pad.measure(built.setupLua),
    timerCompressedLength: pad.measure(built.timerLua),
    costSetupUsed: c.setup.used,
    costTimerUsed: c.timer.used,
    declaredCost: { setup: p.cost.setup, timer: p.cost.timer },
  };
}

const fixture = {
  capturedAt: new Date().toISOString().slice(0, 10),
  source: {
    repository: UPSTREAM_REPOSITORY,
    branch: UPSTREAM_BRANCH,
    commit: UPSTREAM_COMMIT,
    compiler: UPSTREAM_COMPILER,
    protocolPin: PROTOCOL_PIN,
  },
  note: NOTE,
  presets,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(fixture, null, 2) + "\n", "utf8");

// Re-read the sibling's state. Nothing above writes to it; this proves it.
let statusAfter;
try {
  statusAfter = git(["-C", BOTOR, "status", "--porcelain"], ROOT);
} catch (error) {
  fail(
    "could not re-read the sibling working tree state at " +
      BOTOR +
      ": " +
      (error.message || error),
  );
}
if (statusAfter !== statusBefore) {
  fail(
    "the sibling working tree at " +
      BOTOR +
      " CHANGED during this run. Before:\n" +
      statusBefore +
      "After:\n" +
      statusAfter,
  );
}

for (const [id, p] of Object.entries(presets)) {
  console.log(
    id +
      "  setup " +
      p.setupRawLength +
      "/" +
      p.setupCompressedLength +
      "  timer " +
      p.timerRawLength +
      "/" +
      p.timerCompressedLength,
  );
}
