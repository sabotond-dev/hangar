#!/usr/bin/env node
/**
 * Record the sha256 of the PRISTINE upstream bytes of every vendored BOTOR file.
 *
 * This is step 6 of the sync procedure in `src/vendor/botor/VENDOR.md`. It reads
 * the sibling grid-editor checkout and writes
 * `src/lib/fidelity/upstream-manifest.json`. It never writes anything outside
 * this repository and never runs a state-changing git command in the sibling:
 * the sibling's `git status --porcelain` is captured before and after and any
 * difference is fatal.
 *
 * The manifest is what lets `src/lib/fidelity/vendored-diff.spec.ts` run on a
 * machine that has no grid-editor checkout. The spec reconstructs the pristine
 * bytes from the vendored copy - strip the provenance header block, invert the
 * recorded intended divergences, then invert the recorded deltas - and compares
 * hashes, so 436 KB of upstream source never has to be committed twice, once
 * here and again in every per-deploy GPLv3 source archive.
 *
 * The delta table below is hard-coded on purpose. It is the D-04 allow-list, not
 * something to be discovered by diffing: a delta that appeared in a file without
 * being added here must turn the suite red, which is exactly what happens when
 * the reconstructed bytes fail to hash back to the recorded value.
 *
 * The intendedDivergence rows (D-02) are NOT in that table and cannot be: they
 * are HANGAR's own deliberate edits, and no upstream checkout knows about them.
 * They are read back out of the existing manifest and carried forward, because a
 * regeneration that dropped them would delete the record in the exact step
 * VENDOR.md tells a re-syncer to run.
 *
 * Copyright (C) 2026 Botond Sandor
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(ROOT, "src", "lib", "fidelity", "upstream-manifest.json");

/** D-01. The commit the vendored bytes were taken from. */
const UPSTREAM_COMMIT = "a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c";
const UPSTREAM_REPOSITORY = "https://github.com/sabotond-dev/botor.git";
const UPSTREAM_BRANCH = "main";

/** The last line of every provenance header block, byte-identical in all six. */
const HEADER_SENTINEL =
  "// Original copyright and licence (GNU GPL v3 or later) retained below.";

const NOTE =
  "sha256 is of the PRISTINE upstream bytes. vendored-diff.spec.ts reconstructs " +
  "them from the vendored file by stripping the provenance header block through " +
  "headerSentinel plus one blank line, then inverting intendedDivergence and " +
  "then deltas - last applied, first inverted. A DELTA is a mechanical rewrite " +
  "forced by vendoring: an import path that cannot resolve in the flat vendor " +
  "layout. An INTENDED DIVERGENCE is a deliberate behaviour change HANGAR chose " +
  "(D-02), and carries the reason, the plan that chose it and a date. Both lists " +
  "are inverted before hashing, so upstream's sha256 still rules: a change that " +
  "is in neither list still moves the hash and still names the file. The field " +
  "is written out as an empty array where there is no divergence, so a reader " +
  "can tell 'none' from 'a field nobody added'.";

/**
 * The complete D-04 allow-list: header block (stripped, not inverted), import
 * path rewrites, and the one RGB type inline. Five delta entries across six
 * files. `pad-sim.ts` and `pad-sim-host.ts` needed no rewrite at all, because
 * the flat vendor layout keeps `./_pad` and `./pad-sim` valid.
 */
const FILES = [
  {
    vendored: "src/vendor/botor/_pad.ts",
    upstream: "src/renderer/main/zona/_pad.ts",
    deltas: [
      {
        vendored: "export type RGB = { r: number; g: number; b: number };",
        upstream: 'import type { RGB } from "../../config-blocks/_screen";',
      },
    ],
  },
  {
    vendored: "src/vendor/botor/pad-sim.ts",
    upstream: "src/renderer/main/zona/pad-sim.ts",
    deltas: [],
  },
  {
    vendored: "src/vendor/botor/pad-sim-host.ts",
    upstream: "src/renderer/main/zona/pad-sim-host.ts",
    deltas: [],
  },
  {
    vendored: "src/vendor/botor/tests/pad.test.js",
    upstream: "src/renderer/tests/pad.test.js",
    deltas: [
      {
        vendored: '} from "../_pad";',
        upstream: '} from "../main/zona/_pad";',
      },
    ],
  },
  {
    vendored: "src/vendor/botor/tests/pad-sim.test.js",
    upstream: "src/renderer/tests/pad-sim.test.js",
    deltas: [
      {
        vendored: '} from "../pad-sim";',
        upstream: '} from "../main/zona/pad-sim";',
      },
      {
        vendored: '} from "../_pad";',
        upstream: '} from "../main/zona/_pad";',
      },
    ],
  },
  {
    vendored: "src/vendor/botor/tests/pad-invariants.test.js",
    upstream: "src/renderer/tests/pad-invariants.test.js",
    deltas: [
      {
        vendored: '} from "../_pad";',
        upstream: '} from "../main/zona/_pad";',
      },
    ],
  },
];

function fail(message) {
  console.error("record-upstream-manifest: " + message);
  process.exit(1);
}

function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
}

// Resolve the sibling checkout from the MAIN repository, never from REPO_ROOT/..
// Under `git worktree` the repo root is .claude/worktrees/<name>/ and its parent
// lands inside .claude/. `git rev-parse --git-common-dir` always names the MAIN
// repository's .git directory, so its grandparent is the directory the sibling
// repos share, in both layouts. Same block as src/lib/format-parity.spec.ts.
let commonDir;
try {
  commonDir = git(["rev-parse", "--git-common-dir"], ROOT).trim();
} catch (error) {
  fail("git rev-parse --git-common-dir failed: " + (error.message || error));
}
const SIBLINGS = resolve(ROOT, commonDir, "..", "..");
const BOTOR = process.env.BOTOR_REPO ?? join(SIBLINGS, "grid-editor");

// Fails, never skips. A recorder that shrugs when its subject is missing would
// leave the previous manifest in place and report success.
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
// checkout is actually sitting on. Recording bytes from a tree that has moved on
// would pin a hash nobody can reproduce.
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
      ". Re-sync deliberately (VENDOR.md) before re-recording.",
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

// Read the upstream files as BUFFERS. The pristine byte stream is the subject:
// pad.test.js is UTF-8 with non-ASCII content and a decode/re-encode round trip
// is exactly the kind of silent change this manifest exists to catch.
// D-02. The intended-divergence rows are CARRIED FORWARD from the existing
// manifest, never re-derived: nothing in an upstream checkout can tell this
// script what HANGAR deliberately changed, and a regeneration that dropped the
// field would delete the whole record in the one step VENDOR.md tells a
// re-syncer to run. That would be worse than the bug the record exists to
// prevent - the next sync would silently revert every recorded fix.
//
// Carrying forward is NOT the same as blessing: step 4 of the sync procedure is
// re-checking each row, which is why every carried row is printed at the end of
// this run as an explicit checklist.
const carried = new Map();
if (existsSync(MANIFEST)) {
  try {
    const previous = JSON.parse(readFileSync(MANIFEST, "utf8"));
    for (const entry of previous.files ?? []) {
      carried.set(entry.vendored, entry.intendedDivergence ?? []);
    }
  } catch (error) {
    fail(
      "the existing manifest at " +
        MANIFEST +
        " could not be parsed, and overwriting it would destroy the " +
        "intendedDivergence record: " +
        (error.message || error),
    );
  }
}

const files = FILES.map((entry) => {
  const from = join(BOTOR, ...entry.upstream.split("/"));
  if (!existsSync(from)) {
    fail("upstream file is missing: " + from);
  }
  const buf = readFileSync(from);
  return {
    vendored: entry.vendored,
    upstream: entry.upstream,
    bytes: buf.length,
    sha256: createHash("sha256").update(buf).digest("hex"),
    deltas: entry.deltas,
    // Always written out, empty array included. "No divergence" and "a field
    // nobody added" must not look the same to a reader or to the spec.
    intendedDivergence: carried.get(entry.vendored) ?? [],
  };
});

const manifest = {
  upstream: {
    repository: UPSTREAM_REPOSITORY,
    branch: UPSTREAM_BRANCH,
    commit: UPSTREAM_COMMIT,
  },
  headerSentinel: HEADER_SENTINEL,
  note: NOTE,
  files,
};

mkdirSync(dirname(MANIFEST), { recursive: true });
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");

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

for (const entry of files) {
  console.log(
    entry.vendored +
      "  " +
      entry.bytes +
      " bytes  sha256 " +
      entry.sha256.slice(0, 12),
  );
}

// The carried rows, printed as a checklist rather than as a summary. VENDOR.md
// step 4 is "re-apply each intendedDivergence, and re-check every one before you
// do" - an upstream fix that lands the same behaviour RETIRES a row, and a
// record that only ever grows is a record nobody trusts.
const rows = files.flatMap((entry) =>
  entry.intendedDivergence.map((row) => ({ file: entry.vendored, row })),
);
if (rows.length === 0) {
  console.log(
    "\nintendedDivergence: no rows carried forward. src/vendor/ is byte-identical " +
      "to upstream apart from the headers and the five deltas.",
  );
} else {
  console.log(
    "\nintendedDivergence: " +
      rows.length +
      " row(s) CARRIED FORWARD, not re-checked. Confirm each is still needed " +
      "(VENDOR.md sync step 4) and delete any that upstream has now fixed:",
  );
  for (const { file, row } of rows) {
    console.log(
      "  " + file + "  [" + row.plan + ", " + row.dated + "]  " + row.reason,
    );
  }
}
