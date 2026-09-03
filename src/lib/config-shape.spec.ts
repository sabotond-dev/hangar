import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = (file: string) => new URL(`../../${file}`, import.meta.url);

const SKELETON_PAGE = "src/routes/dev/skeleton/+page.svelte";
/** D-05: the page must be able to answer "what does it import" with two names. */
const ALLOWED_SPECIFIERS = ["svelte", "$lib/protocol", "$lib/transport"];
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

  it("runs the vendored BOTOR suites instead of quarantining them out of the run", () => {
    // Measured: with the vendored tree in the server project's exclude and all
    // six BOTOR files in place, `npx vitest run` reported 4 files / 18 tests and
    // never mentioned the three ported suites. The run was green and vacuous.
    const config = code("vite.config.ts");
    expect(config).toMatch(/name:\s*"server"/);
    expect(config).not.toContain("src/vendor/**");
  });

  it("runs the invariant sweep as its own Vitest project", () => {
    // D-10: 38.6 s of the 39.9 s whole run. Excluded from `server` by file
    // name, included by `sweep`, so it appears exactly twice.
    const config = code("vite.config.ts");
    expect(config).toMatch(/name:\s*"sweep"/);
    expect(config.match(/pad-invariants\.test\.js/g) ?? []).toHaveLength(2);
  });

  it("keeps the vendored tree out of svelte-check", () => {
    // checkJs: true turns the three untyped BOTOR test files into 489 errors.
    // Excluding them is the only fix that does not edit a vendored file (D-04).
    expect(JSON.parse(code("tsconfig.json")).exclude).toContain(
      "src/vendor/**",
    );
  });

  it("exposes the quick and sweep test scripts", () => {
    const scripts = JSON.parse(text("package.json")).scripts;
    expect(scripts["test:quick"]).toBe("vitest run --project server");
    expect(scripts["test:sweep"]).toBe("vitest run --project sweep");
  });

  it("pins the vendored tree out of end-of-line normalisation", () => {
    // Last matching pattern wins, so this must sit after `* text=auto eol=lf`.
    const attrs = text(".gitattributes");
    expect(attrs).toMatch(/^src\/vendor\/\*\* -text$/m);
    expect(attrs.indexOf("src/vendor/** -text")).toBeGreaterThan(
      attrs.indexOf("* text=auto"),
    );
  });

  // D-05's "bare" rule, as three structural guards rather than as a promise in
  // a comment. All three read the RAW source, not the comment-stripped form:
  // the page forbids these tokens outright, comments included, so raw matching
  // is both simpler and stricter - it also catches a token hidden in a comment.
  // The quote class is `["']` throughout: Prettier writes double quotes, but a
  // structural guard should not break the day that changes.

  it("the walking skeleton page imports nothing outside the protocol and transport surfaces", () => {
    const source = text(SKELETON_PAGE);
    const specifiers = new Set<string>();
    for (const re of [
      /from\s*["']([^"']+)["']/g,
      /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    ]) {
      for (const match of source.matchAll(re)) specifiers.add(match[1]);
    }
    expect(specifiers.size, "the page imports something").toBeGreaterThan(0);
    // "Bare" is a discipline the page must be able to answer with two names.
    expect([...specifiers].sort()).toEqual(
      [...specifiers].filter((s) => ALLOWED_SPECIFIERS.includes(s)).sort(),
    );
  });

  it("the walking skeleton page never reaches the compile surface or the vendored tree", () => {
    // The skeleton never needs the Lua formatter: it echoes back the exact
    // strings the module handed over, so nothing on this path compiles,
    // minifies or costs anything. $lib/pad would pull 628 KB of WASM into a
    // page whose whole point is that it is bare.
    const source = text(SKELETON_PAGE);
    expect(source).not.toContain(["$lib", "/pad"].join(""));
    expect(source).not.toContain(["src", "/vendor"].join(""));
  });

  it("the walking skeleton route is linked from nowhere", () => {
    // fidelity.e2e.ts already asserts site-wide that no anchor points into
    // /dev/, which covers the rendered page. This covers the source: a route
    // that nothing references cannot be reached by a visitor who did not type
    // the path.
    const routes = root("src/routes");
    const mentions: string[] = [];
    const scanned: string[] = [];
    for (const entry of readdirSync(routes, { recursive: true })) {
      const rel = String(entry).split(sep).join("/");
      if (rel.startsWith("dev/skeleton/")) continue;
      const file = join(fileURLToPath(routes), String(entry));
      if (!statSync(file).isFile()) continue;
      scanned.push(rel);
      if (readFileSync(file, "utf8").includes("dev/skeleton")) {
        mentions.push(rel);
      }
    }
    // Without this the assertion below would pass on an empty walk.
    expect(scanned.length, "routes were actually read").toBeGreaterThan(0);
    expect(mentions).toEqual([]);
  });
});
