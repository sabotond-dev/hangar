import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = (file: string) => new URL(`../../${file}`, import.meta.url);
const text = (file: string) => readFileSync(root(file), "utf8");
// Line comments are stripped before the structural matches below. The config's
// own comments legitimately describe the wrapper this test forbids, and a
// comment must never be able to fail (or pass) a structural check.
const code = (file: string) => text(file).replace(/^\s*\/\/.*$/gm, "");

describe("build configuration shape", () => {
  it("has no svelte.config file to shadow the Vite config", () => {
    // Kit >= 2.62.0 silently IGNORES options passed to sveltekit() in
    // vite.config.ts when a svelte.config.{js,ts} exists. The build still
    // succeeds; build/ is wrong.
    expect(existsSync(root("svelte.config.js"))).toBe(false);
    expect(existsSync(root("svelte.config.ts"))).toBe(false);
  });

  it("passes Kit options flat, not wrapped in a Kit object", () => {
    // split_config() only recognises keys in Object.keys(defaults.kit); a
    // wrapper object is forwarded to vite-plugin-svelte and leaves Kit on
    // adapter-auto.
    const config = code("vite.config.ts");
    expect(config).not.toMatch(/\bkit\s*:\s*\{/);
    expect(config).toMatch(/adapter\s*:\s*adapter\(/);
  });

  it("excludes grid-protocol from dependency pre-bundling", () => {
    // Keeps @wasm-fmt/lua_fmt's new URL("lua_fmt_bg.wasm", import.meta.url)
    // resolving against the real module URL.
    // grid-editor/renderer.vite.config.mjs:38-39.
    expect(code("vite.config.ts")).toMatch(
      /optimizeDeps[\s\S]*@intechstudio\/grid-protocol/,
    );
  });

  it("keeps Prettier at grid-editor parity", () => {
    // D-15: a vendored BOTOR file must survive `npm run format` byte-unchanged.
    expect(existsSync(root("prettier.config.js"))).toBe(false);
    expect(JSON.parse(text(".prettierrc"))).toEqual({
      plugins: ["prettier-plugin-svelte"],
    });
    expect(text(".prettierignore")).toContain("src/vendor/");
  });
});
