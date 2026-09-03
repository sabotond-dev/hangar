#!/usr/bin/env node
/**
 * Regenerate src/lib/transport/fixtures/synthetic-zona.json.
 *
 * Plain Node ESM cannot import the .ts sources the builders live in, so the
 * generator lives inside the spec that reads the fixture - the pattern
 * src/lib/fidelity/golden-frames.spec.ts established. This wrapper exists so
 * the command is discoverable without a reader having to know the environment
 * variable that drives it.
 *
 * The spec regenerates at module scope and then THROWS, on purpose: a
 * regenerated fixture must never be mistaken for a passing run. That makes the
 * Vitest exit code 1 the EXPECTED outcome here, which is why this wrapper
 * translates it rather than propagating it.
 *
 * Copyright (C) 2026 Botond Sandor
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC = "src/lib/transport/fixtures/synthetic.spec.ts";
const FIXTURE = join(ROOT, "src/lib/transport/fixtures/synthetic-zona.json");

const before = existsSync(FIXTURE) ? statSync(FIXTURE).mtimeMs : 0;

// One command string rather than an argv array: with `shell: true` Node warns
// (DEP0190) that array arguments are concatenated unescaped. Nothing here is
// user input, but the warning would be printed on every regeneration.
spawnSync(`npx vitest run --project server ${SPEC}`, {
  cwd: ROOT,
  env: { ...process.env, UPDATE_SYNTHETIC: "1" },
  stdio: "inherit",
  shell: true,
});

if (!existsSync(FIXTURE) || statSync(FIXTURE).mtimeMs === before) {
  console.error(
    "\nsynthetic-zona.json was NOT rewritten. The run above failed for a real reason.",
  );
  process.exit(1);
}

console.log(
  [
    "",
    "synthetic-zona.json regenerated and formatted.",
    "The failing run above is by design - it is what stops a regeneration",
    "being reported as a pass.",
    "",
    "Next: review `git diff` on the fixture, then run",
    "  npx vitest run --project server " + SPEC,
    "with no environment variable set.",
  ].join("\n"),
);
