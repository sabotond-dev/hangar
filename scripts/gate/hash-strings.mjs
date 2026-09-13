// Phase 13.2 string census: the multiset of every string literal in comment-stripped source under
// src/ (not src/vendor/, not specs), the copy modules' export names, and the e2e/spec-facing
// data-testid values. A refactor that moves a literal keeps the census; one that edits a literal moves it.
//
//   node scripts/gate/hash-strings.mjs [--out F] [--diff OLD.json]
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
// The repo root, resolved from scripts/gate/; the records go under the phase's gate/ directory.
const H = fileURLToPath(new URL("../../", import.meta.url))
  .replace(/\\/g, "/")
  .replace(/\/$/, "");
const SP = `${H}/.planning/phases/13.2-readability/gate`;
const require = createRequire(H + "/package.json");
const ts = require("typescript");
const head = execSync("git rev-parse --short HEAD", { cwd: H })
  .toString()
  .trim();
const outIdx = process.argv.indexOf("--out");
const diffIdx = process.argv.indexOf("--diff");
const OUT =
  outIdx >= 0 ? process.argv[outIdx + 1] : `${SP}/hash-strings.${head}.json`;

const files = [];
(function walk(d) {
  for (const n of readdirSync(d).sort()) {
    const f = join(d, n);
    if (statSync(f).isDirectory()) {
      // src/vendor/ is not the tree's; src/test-support/ is spec-side (13.2-CONTEXT D-13), outside the census.
      const dir = f.replace(/\\/g, "/");
      if (!dir.endsWith("src/vendor") && !dir.endsWith("src/test-support"))
        walk(f);
    } else if (/\.(ts|svelte)$/.test(n) && !/\.spec\.ts$/.test(n))
      files.push(f);
  }
})(join(H, "src"));

const sha = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const literals = new Map(); // text -> count
const exportsByModule = {};
const testids = new Map();
const add = (map, k) => map.set(k, (map.get(k) ?? 0) + 1);

function scanTs(text, rel) {
  const sf = ts.createSourceFile(
    rel,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const names = [];
  function visit(n) {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      if (n.text.length >= 2) add(literals, n.text);
    } else if (ts.isTemplateExpression(n)) {
      const parts = [
        n.head.text,
        ...n.templateSpans.map((s) => s.literal.text),
      ];
      const t = parts.join("${}");
      if (t.replace(/\$\{\}/g, "").length >= 2) add(literals, t);
    }
    if (ts.isImportDeclaration(n)) return; // module specifiers are not copy
    if (
      (ts.isVariableStatement(n) || ts.isFunctionDeclaration(n)) &&
      n.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if (ts.isFunctionDeclaration(n) && n.name) names.push(n.name.text);
      if (ts.isVariableStatement(n))
        for (const d of n.declarationList.declarations)
          names.push(d.name.getText(sf));
    }
    ts.forEachChild(n, visit);
  }
  visit(sf);
  return names;
}

for (const f of files) {
  const rel = relative(H, f).replace(/\\/g, "/");
  let text = readFileSync(f, "utf8");
  if (f.endsWith(".svelte")) {
    // script blocks through the TS scanner; the template's text nodes and attribute values by regex, comments removed
    const scripts = [...text.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
    for (const m of scripts) scanTs(m[1], rel);
    let tpl = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
      .replace(/<!--[\s\S]*?-->/g, "");
    for (const m of tpl.matchAll(/data-testid="([^"]+)"/g)) add(testids, m[1]);
    // attribute string values and text nodes with at least one letter
    for (const m of tpl.matchAll(/=\s*"([^"{}]*[A-Za-z][^"{}]*)"/g))
      add(literals, m[1]);
    for (const m of tpl.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)) {
      const t = m[1].replace(/\s+/g, " ").trim();
      if (t.length >= 2) add(literals, t);
    }
    for (const m of tpl.matchAll(/\{[^{}]*?"([^"]{2,})"[^{}]*?\}/g))
      add(literals, m[1]);
    for (const m of tpl.matchAll(/\{[^{}]*?'([^']{2,})'[^{}]*?\}/g))
      add(literals, m[1]);
  } else {
    const names = scanTs(text, rel);
    if (
      /(copy|words|labels)\.ts$/.test(rel) ||
      /inspector-copy|install-copy|session-copy/.test(rel)
    )
      exportsByModule[rel] = names.sort();
  }
}
const sortedLits = [...literals.entries()].sort((a, b) =>
  a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
);
const census = sortedLits
  .map(([k, v]) => `${v}\t${JSON.stringify(k)}`)
  .join("\n");
const copyExports = Object.entries(exportsByModule)
  .sort()
  .map(([m, n]) => `${m}\t${n.join(",")}`)
  .join("\n");
const ids = [...testids.entries()]
  .sort()
  .map(([k, v]) => `${v}\t${k}`)
  .join("\n");
const out = {
  head,
  files: files.length,
  literals: literals.size,
  literalOccurrences: [...literals.values()].reduce((a, b) => a + b, 0),
  copyModules: Object.keys(exportsByModule).length,
  testidCount: testids.size,
  hashes: {
    literalCensus: sha(census),
    copyExports: sha(copyExports),
    testids: sha(ids),
  },
  census: sortedLits,
  copyExports: exportsByModule,
  testids: [...testids.entries()].sort(),
};
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(
  `${files.length} files; ${literals.size} distinct literals (${out.literalOccurrences} occurrences); ${out.copyModules} copy modules; ${testids.size} data-testids`,
);
console.log(`literal census sha256 ${out.hashes.literalCensus}`);
console.log(`copy exports   sha256 ${out.hashes.copyExports}`);
console.log(`data-testids   sha256 ${out.hashes.testids}`);
console.log(`-> ${OUT}`);
if (diffIdx >= 0) {
  const old = JSON.parse(readFileSync(process.argv[diffIdx + 1], "utf8"));
  const a = new Map(old.census),
    b = new Map(sortedLits);
  for (const [k, v] of a)
    if (b.get(k) !== v)
      console.log(`- ${v} -> ${b.get(k) ?? 0}\t${JSON.stringify(k)}`);
  for (const [k, v] of b)
    if (!a.has(k)) console.log(`+ 0 -> ${v}\t${JSON.stringify(k)}`);
}
