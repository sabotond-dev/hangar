// Resolve extensionless relative imports to .ts (or /index.ts) so the tree's modules load in plain Node.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
export async function resolve(specifier, context, next) {
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !/\.(ts|js|mjs|json|svelte|wasm)$/.test(specifier) &&
    context.parentURL
  ) {
    const base = new URL(specifier, context.parentURL);
    const p = fileURLToPath(base);
    for (const cand of [
      p + ".ts",
      p + ".svelte.ts",
      p + "/index.ts",
      p + ".js",
      p + ".mjs",
    ]) {
      if (existsSync(cand))
        return next(specifier + cand.slice(p.length), context);
    }
  }
  return next(specifier, context);
}
