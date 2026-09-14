// Packs the current build into a zip somebody can run without this repository:
//
//   npm run build && node scripts/package-local.mjs [outDir]
//
// The zip holds build/ (the same files the site serves, source archive
// included), a dependency-free server, a Windows launcher and a README. Refuses
// a dirty tree for the reason deploy.mjs does: the archive inside build/ is
// HEAD's, so the bundle beside it must be HEAD's too.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(process.argv[2] || join(ROOT, "dist"));

const dirty = execSync("git status --porcelain", {
  cwd: ROOT,
  encoding: "utf8",
}).trim();
if (dirty) {
  console.error(
    "package-local: the working tree is dirty; commit first.\n" + dirty,
  );
  process.exit(1);
}
const sha = execSync("git rev-parse --short HEAD", {
  cwd: ROOT,
  encoding: "utf8",
}).trim();
if (!existsSync(join(ROOT, "build", "index.html"))) {
  console.error("package-local: no build/ - run npm run build first.");
  process.exit(1);
}

const name = "hangar-local-" + sha;
const stage = join(outDir, name);
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
cpSync(join(ROOT, "build"), join(stage, "build"), { recursive: true });
for (const f of ["serve.mjs", "HANGAR.cmd", "README.md"]) {
  cpSync(join(ROOT, "scripts", "local", f), join(stage, f));
}

const zip = join(outDir, name + ".zip");
rmSync(zip, { force: true });
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${stage}' -DestinationPath '${zip}' -CompressionLevel Optimal"`,
  { stdio: "inherit" },
);
rmSync(stage, { recursive: true, force: true });
console.log("package-local: " + zip);
