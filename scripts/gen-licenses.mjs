#!/usr/bin/env node
/**
 * Generate THIRD-PARTY.md and licenses/ from the production dependency tree.
 *
 * The dependency that matters most here, @intechstudio/grid-protocol, ships no
 * "license" field in its package.json, so any generator that reads the lockfile
 * silently omits or mislabels it. license-checker-rseidelsohn reads the shipped
 * LICENSE files instead and gets it right; the assertions below exist so that it
 * stays right, loudly, rather than degrading in silence.
 *
 * Copyright (C) 2026 Botond Sandor
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOTICES = join(ROOT, "THIRD-PARTY.md");
const LICENSES_DIR = join(ROOT, "licenses");

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const ROOT_KEY = pkg.name + "@" + pkg.version;

/** The GPL-compatible allowlist. Anything else stops the build. */
const ALLOWED = [
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "GPL-3.0",
  "GPL-3.0-only",
  "GPL-3.0-or-later",
  // The SIL Open Font License is an FSF-approved free licence. The fonts are
  // served as separate static .woff2 assets and are never linked into the
  // JavaScript bundle, so this is aggregation beside the GPLv3 work rather than
  // combination with it. The allowlist's own contract is that it is extended
  // deliberately, in a commit, with a reason - this is that.
  "OFL-1.1",
];

/** HANGAR is a derivative work of this package; it must stay GPLv3. */
const GPL_DEPENDENCY = "@intechstudio/grid-protocol";

function fail(message) {
  console.error("gen-licenses: " + message);
  process.exit(1);
}

function checker(args) {
  return execFileSync("npx", ["license-checker-rseidelsohn", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 64 * 1024 * 1024,
  });
}

/**
 * license-checker marks a licence it inferred from a LICENSE file rather than
 * from a "license" field with a trailing asterisk. Strip it for comparison but
 * remember it: the inference is exactly what makes grid-protocol discoverable.
 */
function tokens(value) {
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((entry) => String(entry).trim())
    .map((entry) => (entry.endsWith("*") ? entry.slice(0, -1) : entry))
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function inferred(value) {
  const list = Array.isArray(value) ? value : [value];
  return list.some((entry) => String(entry).trim().endsWith("*"));
}

// 1. Ask the checker about production dependencies only. The dev toolchain is
//    never conveyed to a visitor, and 400 build-time packages would bury the two
//    that are.
let report;
try {
  report = JSON.parse(checker(["--production", "--json"]));
} catch (error) {
  fail("license-checker-rseidelsohn failed: " + (error.message || error));
}

// 2. Drop the root package; HANGAR's own licence is LICENSE, not a notice.
const packages = Object.entries(report)
  .filter(([key]) => key !== ROOT_KEY && !key.startsWith(pkg.name + "@"))
  .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

if (packages.length === 0) {
  fail("no production dependencies were reported - the checker found nothing");
}

// 3. The load-bearing assertion. If upstream ever adds a "license" field saying
//    something other than GPL-3.0, or if the generator quietly drops the package,
//    this stops everything.
const gpl = packages.find(([key]) => key.startsWith(GPL_DEPENDENCY + "@"));
if (!gpl) {
  fail(
    GPL_DEPENDENCY +
      " is not in the production dependency tree. HANGAR is a derivative work of it; " +
      "its absence means either the dependency was removed or the checker dropped it.",
  );
}
const gplLicence = tokens(gpl[1].licenses).join(" ");
if (!gplLicence.startsWith("GPL-3.0")) {
  fail(
    GPL_DEPENDENCY +
      ' reports licence "' +
      gplLicence +
      '", expected something starting with GPL-3.0. ' +
      "HANGAR ships GPLv3 because of this package; verify before changing anything.",
  );
}

// 4. Every remaining licence must be GPL-compatible, or a dependency that cannot
//    legally be combined with GPLv3 code has slipped in.
const offenders = packages
  .map(([key, meta]) => [key, tokens(meta.licenses)])
  .filter(
    ([, list]) =>
      list.length === 0 || !list.every((entry) => ALLOWED.includes(entry)),
  );
if (offenders.length > 0) {
  for (const [key, list] of offenders) {
    console.error(
      "gen-licenses: " +
        key +
        " has licence " +
        (list.length > 0 ? list.join(" / ") : "(none reported)") +
        " which is outside the GPL-compatible allowlist",
    );
  }
  fail(
    "allowlist is [" +
      ALLOWED.join(", ") +
      "]. Remove the dependency or extend the allowlist deliberately.",
  );
}

// 5. Write THIRD-PARTY.md. Sorted, fixed header, one line per package, so the
//    output is byte-deterministic and a regeneration never dirties the tree.
const header = [
  "# Third-party notices",
  "",
  "<!-- Generated by scripts/gen-licenses.mjs. Do not hand-edit; run `npm run licenses`. -->",
  "",
  "HANGAR is free software licensed under the GNU General Public License v3 or later.",
  'See `LICENSE` for the full text, and the "Source" link in the site footer for the',
  "Corresponding Source of the exact commit this site was built from (GPLv3 section 6(d)).",
  "",
  "Copyright (C) 2026 Botond Sandor",
  "",
  "`@intechstudio/grid-protocol` is itself licensed under the GNU GPL v3. Its `package.json`",
  "declares no `license` field; the licence is stated in its shipped `LICENSE` file.",
  "",
  "`@wasm-fmt/lua_fmt` embeds a WebAssembly build of StyLua (MPL-2.0 upstream,",
  "<https://github.com/JohnnyMorganz/StyLua>). The package's own declared licence is MIT.",
  "",
  "The Quicksand typeface (`@fontsource/quicksand`) is Copyright the Quicksand Project Authors,",
  "designed by Andrew Paglinawan, and is licensed under the SIL Open Font License 1.1. It is",
  "conveyed as separate static font files beside the program rather than linked into it.",
  "",
  "Full licence texts for every package below are in `licenses/`.",
  "",
  "## Production dependencies",
  "",
];

const lines = packages.map(([key, meta]) => {
  const name = key.slice(0, key.lastIndexOf("@"));
  const url =
    meta.repository || "https://www.npmjs.com/package/" + encodeURI(name);
  const licence =
    tokens(meta.licenses).join(" / ") +
    (inferred(meta.licenses)
      ? " (inferred from the shipped LICENSE file)"
      : "");
  return "- [" + key + "](" + url + ") — " + licence;
});

writeFileSync(NOTICES, header.concat(lines, [""]).join("\n"), "utf8");

// 6. Materialise the full licence text of every production dependency. Cleared
//    first so a removed dependency cannot leave a stale notice behind.
rmSync(LICENSES_DIR, { recursive: true, force: true });
mkdirSync(LICENSES_DIR, { recursive: true });
try {
  checker([
    "--production",
    "--files",
    "licenses",
    "--relativeLicensePath",
    "--excludePackages",
    ROOT_KEY,
  ]);
} catch (error) {
  fail("could not materialise licence texts: " + (error.message || error));
}

console.log(
  "gen-licenses: wrote THIRD-PARTY.md and licenses/ for " +
    packages.length +
    " production dependencies (" +
    packages.map(([key]) => key).join(", ") +
    ")",
);
