// The knob census (change 16, 2026-09-21): every configuration's knobs as the panel receives them -
// id, label, kind, rung count, the rungs, the default and the preview hold - printed as Markdown
// rows, the raw material of docs/TUNING-REVIEW.md. Reads the tree through the gate's extension
// hook and writes nothing:
//
//   node --import ./scripts/gate/ts-ext-register.mjs scripts/knob-census.mjs [--json]
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { fileURLToPath, pathToFileURL } from "node:url";

const H = fileURLToPath(new URL("../", import.meta.url))
  .replace(/[\\]/g, "/")
  .replace(/[/]$/, "");
const imp = (rel) => import(pathToFileURL(`${H}/${rel}`).href);
const gp = await imp("node_modules/@intechstudio/grid-protocol/dist/index.js");
await gp.initLuaFormatter();
const { CATALOG } = await imp("src/lib/catalog/index.ts");
const { stampKnobs } = await imp("src/lib/share/stamp.ts");
const view = await imp("src/lib/tune/view.ts");
const { isControllerNumber, isMidiDestination } = await imp(
  "src/lib/tune/surprise.ts",
);
const { sectionOf } = await imp("src/lib/tune/sections.ts");

const JSON_OUT = process.argv.includes("--json");
const rows = [];
for (const entry of [...CATALOG].sort((a, b) => a.id.localeCompare(b.id))) {
  const knobs = stampKnobs(entry);
  const declared = new Map(entry.knobs.map((k) => [k.id, k]));
  for (const knob of knobs) {
    const own = declared.get(knob.id);
    const n = knob.options.length;
    const kind =
      knob.kind === "note" && isControllerNumber(knob) ? "amount" : knob.kind;
    const named = view.splitUnit(knob.label);
    const shown =
      n > 16
        ? `${knob.options.slice(0, 3).join(" ")} … ${knob.options.slice(-2).join(" ")}`
        : knob.options.join(" ");
    rows.push({
      entry: entry.id,
      name: entry.name,
      source: entry.source.kind,
      rollable: entry.rollable !== false,
      id: knob.id,
      label: knob.label,
      kind: knob.kind,
      n,
      rungs: shown,
      defaultIndex: knob.default,
      defaultRung: knob.options[knob.default],
      previewIndex: own?.previewIndex,
      widget: view.widgetFor(kind, knob.options, knob.id),
      section: sectionOf(knob),
      unit: named.unit ?? "",
      midi: isMidiDestination(knob),
      integers: knob.options.every((v) => /^-?[0-9]+$/.test(v)),
      sorted:
        knob.options.every((v) => /^-?[0-9]+$/.test(v)) &&
        knob.options.every(
          (v, i) => i === 0 || Number(v) > Number(knob.options[i - 1]),
        ),
      words: knob.options.map((v) => view.wordFor(kind, v, knob.id)),
    });
  }
}
if (JSON_OUT) {
  console.log(JSON.stringify(rows, null, 1));
} else {
  console.log(
    "| Card | Knob | Label | Kind | Rungs | Values | Default | Section | Widget | Unit | Words |",
  );
  console.log("|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    const words = r.words.every((w) => w !== undefined)
      ? r.words.slice(0, 6).join(" / ") + (r.words.length > 6 ? " …" : "")
      : "";
    const held =
      r.previewIndex === undefined ? "" : ` (preview holds ${r.previewIndex})`;
    console.log(
      `| ${r.name} | \`${r.id}\` | ${r.label} | ${r.kind} | ${r.n} | ${r.rungs} | ${r.defaultRung} [${r.defaultIndex}]${held} | ${r.section} | ${r.widget} | ${r.unit} | ${words} |`,
    );
  }
  console.log(`\n${rows.length} knobs on ${CATALOG.length} cards`);
}
