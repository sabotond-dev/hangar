// Phase 13.2's CSS term (13.2-CONTEXT D-21). src/app.css:1 is `@import "tailwindcss" source(".")`,
// so Tailwind's scanner reads every file under src/ - comments included - and emits a utility for
// every token that spells one; the raw stylesheet hash is therefore a function of the comment
// vocabulary this phase rewrites. This script, over every stylesheet under build/_app/immutable/assets/
// in filename order:
//   RAW CSS sha256      the concatenation as built (recorded for the reader; expected to move)
//   SCOPED CSS sha256   the same with the `@layer properties{...}` and `@layer utilities{...}` blocks
//                       removed brace-balanced - equal after every plan (a .svelte rename still moves it)
//   UTILITIES           the utilities layer's sorted class list, written to --out F one per line as
//                       `utility <name>`, with the markup-named subset (`class="..."`, `class:<name>`,
//                       `@apply` tokens in src/**/*.svelte and src/app.html) as `markup <name>`
//   --against OLD.txt   every class that appeared (+) or disappeared (-) by name; exit 1 if a class the
//                       markup names is no longer emitted
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { createHash } from "node:crypto";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const H = fileURLToPath(new URL("../../", import.meta.url))
  .replace(/\\/g, "/")
  .replace(/\/$/, "");
const ASSETS = `${H}/build/_app/immutable/assets`;
const argv = process.argv.slice(2);
const outIdx = argv.indexOf("--out");
const againstIdx = argv.indexOf("--against");
const sha = (s) => createHash("sha256").update(s, "utf8").digest("hex");

if (!existsSync(ASSETS)) {
  console.error(
    `css-terms: ${ASSETS} does not exist - run npm run build first`,
  );
  process.exit(1);
}
const sheets = readdirSync(ASSETS)
  .filter((n) => n.endsWith(".css"))
  .sort();

/** Remove every `@layer <name>{...}` block, brace-balanced, from one minified stylesheet. */
function removeLayer(css, name) {
  const marker = `@layer ${name}{`;
  let out = css;
  for (;;) {
    const at = out.indexOf(marker);
    if (at < 0) return out;
    let depth = 0;
    let i = at + marker.length - 1;
    for (; i < out.length; i++) {
      if (out[i] === "{") depth++;
      else if (out[i] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) throw new Error(`css-terms: unbalanced ${marker}`);
    out = out.slice(0, at) + out.slice(i + 1);
  }
}

/** The body of every `@layer <name>{...}` block, brace-balanced. */
function layerBodies(css, name) {
  const marker = `@layer ${name}{`;
  const bodies = [];
  let from = 0;
  for (;;) {
    const at = css.indexOf(marker, from);
    if (at < 0) return bodies;
    let depth = 0;
    let i = at + marker.length - 1;
    for (; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    bodies.push(css.slice(at + marker.length, i));
    from = i + 1;
  }
}

/** Every class selector at a selector position (after `{`, `}`, `,` or at the start), unescaped. */
function classesIn(body) {
  const found = new Set();
  const re = /(?<=^|[{},])\.((?:\\.|[A-Za-z0-9_-])+)/g;
  for (const m of body.matchAll(re)) found.add(m[1].replace(/\\(.)/g, "$1"));
  return found;
}

let raw = "";
let scoped = "";
const utilities = new Set();
for (const n of sheets) {
  const css = readFileSync(join(ASSETS, n), "utf8");
  raw += css;
  scoped += removeLayer(removeLayer(css, "properties"), "utilities");
  for (const body of layerBodies(css, "utilities"))
    for (const c of classesIn(body)) utilities.add(c);
}

/** Every token a template names as a class: class="..." (expressions removed), class:name, @apply. */
function markupTokens() {
  const tokens = new Set();
  const files = [];
  (function walk(d) {
    for (const n of readdirSync(d).sort()) {
      const f = join(d, n);
      if (statSync(f).isDirectory()) {
        if (!f.replace(/\\/g, "/").endsWith("src/vendor")) walk(f);
      } else if (n.endsWith(".svelte")) files.push(f);
    }
  })(join(H, "src"));
  files.push(join(H, "src/app.html"));
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    for (const m of text.matchAll(/\bclass\s*=\s*"([^"]*)"/g)) {
      for (const t of m[1].replace(/\{[^}]*\}/g, " ").split(/\s+/))
        if (t) tokens.add(t);
    }
    for (const m of text.matchAll(/\bclass\s*=\s*'([^']*)'/g)) {
      for (const t of m[1].replace(/\{[^}]*\}/g, " ").split(/\s+/))
        if (t) tokens.add(t);
    }
    for (const m of text.matchAll(/\bclass:([A-Za-z0-9_-]+)/g))
      tokens.add(m[1]);
    for (const m of text.matchAll(/@apply\s+([^;]+);/g)) {
      for (const t of m[1].split(/\s+/)) if (t) tokens.add(t);
    }
  }
  return tokens;
}

const sortedUtilities = [...utilities].sort();
const named = [...markupTokens()].filter((t) => utilities.has(t)).sort();

console.log(`${sheets.length} stylesheets under build/_app/immutable/assets/`);
console.log(`RAW CSS sha256 ${sha(raw)}`);
console.log(`SCOPED CSS sha256 ${sha(scoped)}`);
console.log(
  `UTILITIES ${sortedUtilities.length} classes, ${named.length} named by markup: ${named.join(" ")}`,
);

const lines = [
  ...sortedUtilities.map((c) => `utility ${c}`),
  ...named.map((c) => `markup ${c}`),
];
if (outIdx >= 0) writeFileSync(argv[outIdx + 1], lines.join("\n") + "\n");

let failed = false;
if (againstIdx >= 0) {
  const old = readFileSync(argv[againstIdx + 1], "utf8").split(/\r?\n/);
  const oldUtilities = new Set(
    old
      .filter((l) => l.startsWith("utility "))
      .map((l) => l.slice("utility ".length)),
  );
  const oldNamed = old
    .filter((l) => l.startsWith("markup "))
    .map((l) => l.slice("markup ".length));
  const appeared = sortedUtilities.filter((c) => !oldUtilities.has(c));
  const disappeared = [...oldUtilities].filter((c) => !utilities.has(c)).sort();
  for (const c of disappeared) console.log(`- ${c}`);
  for (const c of appeared) console.log(`+ ${c}`);
  console.log(
    `UTILITIES DELTA ${oldUtilities.size} -> ${sortedUtilities.length}: ${disappeared.length} disappeared, ${appeared.length} appeared`,
  );
  const missing = oldNamed.filter((c) => !utilities.has(c));
  if (missing.length > 0) {
    console.log(`MARKUP-NAMED MISSING ${missing.join(" ")}`);
    failed = true;
  } else {
    console.log(`MARKUP-NAMED intact: ${oldNamed.join(" ")}`);
  }
  if (outIdx >= 0) {
    const delta = [
      ...disappeared.map((c) => `disappeared ${c}`),
      ...appeared.map((c) => `appeared ${c}`),
    ];
    writeFileSync(argv[outIdx + 1], [...lines, ...delta].join("\n") + "\n");
  }
}
process.exit(failed ? 1 : 0);
