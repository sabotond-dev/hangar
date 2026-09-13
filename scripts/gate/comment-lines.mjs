// Phase 13.2 comment-line record: for every .ts / .svelte under src/ outside src/vendor/ and outside
// *.spec.ts, the audit's line classes (13.2-RESEARCH A.0: a comment line starts with //, *, /* or
// <!-- or sits inside a block; the header is the leading comment run - for .svelte the <!-- --> block
// before <script> plus the leading comment inside it).
//
//   node scripts/gate/comment-lines.mjs --out F         write { files, totals, perFile } to F
//   node scripts/gate/comment-lines.mjs --against OLD.json
//                                                        a markdown table of every file whose numbers moved
//   node scripts/gate/comment-lines.mjs --todo <paths...>
//                                                        every file whose header, less the copyright line and
//                                                        one provenance line, exceeds ten lines (13.2-CONTEXT
//                                                        D-17's "not yet at the rule" test)
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const H = fileURLToPath(new URL("../../", import.meta.url))
  .replace(/\\/g, "/")
  .replace(/\/$/, "");
const HEADER_MAX = 10;
const COPYRIGHT = /Copyright \(C\) 2026 Botond Sandor/;
const PROVENANCE = /^\s*(\/\/|\*|<!--)?\s*Decided at\b/;
/** A comment line carrying no text: a bare //, a bare *, or a block fence - not counted against the ten. */
const EMPTY_COMMENT = /^\s*(\/\/|\*|\/\*\*?|\*\/|<!--|-->)?\s*$/;

const argv = process.argv.slice(2);
const outIdx = argv.indexOf("--out");
const againstIdx = argv.indexOf("--against");
const todoIdx = argv.indexOf("--todo");

const files = [];
(function walk(d) {
  for (const n of readdirSync(d).sort()) {
    const f = join(d, n);
    if (statSync(f).isDirectory()) {
      if (!f.replace(/\\/g, "/").endsWith("src/vendor")) walk(f);
    } else if (/\.(ts|svelte)$/.test(n) && !/\.spec\.ts$/.test(n))
      files.push(f);
  }
})(join(H, "src"));

/** One kind per line: c comment, b blank, x code. The audit's classifier, verbatim in its rules. */
function classify(text) {
  const lines = text.split("\n");
  const kinds = [];
  let inBlock = false;
  let inHtml = false;
  for (const raw of lines) {
    const l = raw.trim();
    let kind;
    if (inBlock) {
      kind = "c";
      if (l.includes("*/")) {
        inBlock = false;
        const rest = l.slice(l.indexOf("*/") + 2).trim();
        if (rest && !rest.startsWith("//")) kind = "x";
      }
    } else if (inHtml) {
      kind = "c";
      if (l.includes("-->")) {
        inHtml = false;
        const rest = l.slice(l.indexOf("-->") + 3).trim();
        if (rest) kind = "x";
      }
    } else if (l === "") kind = "b";
    else if (l.startsWith("//")) kind = "c";
    else if (l.startsWith("/*")) {
      kind = "c";
      if (!l.includes("*/")) inBlock = true;
      else {
        const rest = l.slice(l.indexOf("*/") + 2).trim();
        if (rest) kind = "x";
      }
    } else if (l.startsWith("<!--")) {
      kind = "c";
      if (!l.includes("-->")) inHtml = true;
      else {
        const rest = l.slice(l.indexOf("-->") + 3).trim();
        if (rest) kind = "x";
      }
    } else kind = "x";
    kinds.push(kind);
  }
  return { lines, kinds };
}

/** The audit's header: the leading comment run (blank lines after a comment included). */
function auditHeader(lines, kinds, isSvelte) {
  let headerLen = 0;
  let i = 0;
  if (isSvelte) {
    let j = 0;
    while (j < kinds.length && kinds[j] !== "x") {
      if (kinds[j] === "c") headerLen++;
      j++;
    }
    while (j < kinds.length && !/^<script/.test(lines[j].trim())) j++;
    i = j < kinds.length ? j + 1 : kinds.length;
  }
  let seenComment = false;
  for (; i < kinds.length; i++) {
    if (kinds[i] === "c") {
      headerLen++;
      seenComment = true;
    } else if (kinds[i] === "b") {
      if (seenComment) headerLen++;
    } else break;
  }
  return headerLen;
}

/**
 * The rule's header: the comment lines of the leading run, ending at the copyright line where the
 * file has one (it is the header's last line in this tree), less the copyright line, at most one
 * provenance line, and the lines that carry no text (a bare // or *, a block fence). For .svelte the
 * <!-- --> block before <script> and the leading comment inside it.
 */
function ruleHeader(lines, kinds, isSvelte) {
  const runs = [];
  let i = 0;
  if (isSvelte) {
    let j = 0;
    while (j < kinds.length && kinds[j] !== "x") j++;
    runs.push([0, j]);
    while (j < kinds.length && !/^<script/.test(lines[j].trim())) j++;
    i = j < kinds.length ? j + 1 : kinds.length;
  }
  let k = i;
  while (k < kinds.length && kinds[k] !== "x") k++;
  runs.push([i, k]);
  let count = 0;
  let provenance = 0;
  for (const [a, b] of runs) {
    for (let n = a; n < b; n++) {
      if (kinds[n] !== "c") continue;
      const line = lines[n];
      if (COPYRIGHT.test(line)) break;
      if (EMPTY_COMMENT.test(line)) continue;
      if (PROVENANCE.test(line) && provenance === 0) {
        provenance = 1;
        continue;
      }
      count++;
    }
  }
  return count;
}

function measure(f) {
  const text = readFileSync(f, "utf8");
  const isSvelte = f.endsWith(".svelte");
  const { lines, kinds } = classify(text);
  const code = kinds.filter((k) => k === "x").length;
  const comment = kinds.filter((k) => k === "c").length;
  const blank = kinds.filter((k) => k === "b").length;
  const header = auditHeader(lines, kinds, isSvelte);
  const rule = ruleHeader(lines, kinds, isSvelte);
  return { lines: lines.length, code, comment, blank, header, rule };
}

const rel = (f) => relative(H, f).replace(/\\/g, "/");

if (todoIdx >= 0) {
  const wanted = argv.slice(todoIdx + 1);
  const targets = wanted.length > 0 ? wanted.map((p) => join(H, p)) : files;
  let n = 0;
  for (const f of targets) {
    let m;
    try {
      m = measure(f);
    } catch {
      console.log(`${rel(f)}  (missing)`);
      n++;
      continue;
    }
    if (m.rule > HEADER_MAX) {
      console.log(`${rel(f)}  header ${m.rule} (rule ${HEADER_MAX})`);
      n++;
    }
  }
  console.log(`${n} file(s) not yet at the rule`);
  process.exit(0);
}

const perFile = files.map((f) => ({ file: rel(f), ...measure(f) }));
const totals = { lines: 0, code: 0, comment: 0, blank: 0, header: 0 };
for (const p of perFile) for (const k of Object.keys(totals)) totals[k] += p[k];
const out = { files: perFile.length, totals, perFile };

if (outIdx >= 0) writeFileSync(argv[outIdx + 1], JSON.stringify(out, null, 1));
console.log(
  `${out.files} files; ${totals.lines} lines, ${totals.code} code, ${totals.comment} comment, ${totals.blank} blank, ${totals.header} header`,
);

if (againstIdx >= 0) {
  const old = JSON.parse(readFileSync(argv[againstIdx + 1], "utf8"));
  const before = new Map(old.perFile.map((p) => [p.file, p]));
  const rows = [];
  for (const p of perFile) {
    const b = before.get(p.file);
    if (!b) {
      rows.push(
        `| ${p.file} (new) | - | ${p.lines} | - | ${p.comment} | - | ${p.header} |`,
      );
      continue;
    }
    if (b.lines === p.lines && b.comment === p.comment && b.header === p.header)
      continue;
    rows.push(
      `| ${p.file} | ${b.lines} | ${p.lines} | ${b.comment} | ${p.comment} | ${b.header} | ${p.header} |`,
    );
  }
  for (const b of old.perFile) {
    if (!perFile.some((p) => p.file === b.file)) {
      rows.push(
        `| ${b.file} (gone) | ${b.lines} | - | ${b.comment} | - | ${b.header} | - |`,
      );
    }
  }
  console.log("");
  console.log(
    "| file | lines before | after | comment before | after | header before | after |",
  );
  console.log("|---|--:|--:|--:|--:|--:|--:|");
  for (const r of rows) console.log(r);
  const t = old.totals;
  console.log(
    `| **totals (${old.files} -> ${out.files} files)** | ${t.lines} | ${totals.lines} | ${t.comment} | ${totals.comment} | ${t.header} | ${totals.header} |`,
  );
  console.log(`\n${rows.length} file(s) moved`);
}
