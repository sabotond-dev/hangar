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

/**
 * The front door's static import graph, for the D-21 guard at the end of this
 * file. `src/lib/ui/` is walked whole rather than listed, so a component added
 * later is covered without anyone remembering to add it here.
 */
const FRONT_DOOR_PAGES = [
  "src/routes/+page.svelte",
  "src/routes/c/[id]/+page.svelte",
  "src/routes/c/[id]/+page.ts",
];
const UI_DIR = "src/lib/ui";
/** Anything that would drag @intechstudio/grid-protocol onto the first paint. */
const COMPILER_MARKERS = ["vendor", "intechstudio", "lib/pad"];
/** The symbol that identifies the chunk carrying the protocol package. */
const PROTOCOL_SYMBOL = "GRID_PARAMETER_ELEMENT_POTMETER";

/**
 * Comments removed before a structural match, in the one uniform form used
 * across this phase: line, block and markup. Deliberately backslash-free.
 * The components below name the vendored tree and the protocol package in
 * their own comments - correctly, since explaining why they are absent is the
 * point - so a scan over raw source would go red on correct code.
 */
const stripComments = (source: string) =>
  source
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

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

  // D-21 and 04-RESEARCH §Pitfall 9, as two independent guards: one over the
  // source, one over the built artefact. Both exist because neither catches
  // what the other does - the source scan goes red the moment someone writes
  // the import, before any build has run, and the artefact scan goes red if a
  // future bundler or a transitive re-export puts the chunk on the page by a
  // route no source scan would recognise.

  it("the front door never reaches the compiler at module scope", () => {
    // MEASURED REASON, not a preference. src/vendor/botor/_pad.ts imports
    // @intechstudio/grid-protocol at module scope, the package declares no
    // sideEffects, and the resulting chunk is 131,101 bytes. A static import
    // from any of these files puts all of it on the critical path of a page
    // whose entire job is to paint in under two seconds.
    //
    // The matcher is anchored to the `from` form on purpose. Coverflow.svelte
    // reaches the simulator through import("../../vendor/botor/pad-sim") inside
    // onMount, and that dynamic import is the rule being obeyed rather than a
    // violation of it - a matcher that saw any occurrence of the specifier
    // would forbid the correct implementation.
    const files = [
      ...FRONT_DOOR_PAGES,
      ...readdirSync(root(UI_DIR))
        .map(String)
        .filter((name) => !name.endsWith(".spec.ts"))
        .map((name) => `${UI_DIR}/${name}`),
    ];

    const specifiers: { file: string; specifier: string }[] = [];
    for (const file of files) {
      const source = stripComments(text(file));
      for (const match of source.matchAll(/from\s*["']([^"']+)["']/g)) {
        specifiers.push({ file, specifier: match[1] });
      }
    }

    // Both guards against a silently broken matcher: an empty walk and an
    // empty match set would each make the assertion below pass vacuously.
    expect(files.length, "front-door files were listed").toBeGreaterThan(3);
    expect(
      specifiers.length,
      "static imports were actually collected",
    ).toBeGreaterThan(0);

    const offenders = specifiers.filter(({ specifier }) =>
      COMPILER_MARKERS.some((marker) => specifier.includes(marker)),
    );
    expect(
      offenders.map((o) => `${o.file} -> ${o.specifier}`),
      "a front-door file imports the compiler at module scope",
    ).toEqual([]);
  });

  it("the built front door does not preload the protocol chunk", () => {
    // In the style of licence-notices.spec.ts's last test: guarded on build/
    // existing, and asserting in BOTH branches because requireAssertions is on.
    const chunks = root("build/_app/immutable/chunks");
    if (!existsSync(chunks)) {
      expect(existsSync(chunks)).toBe(false);
      return;
    }

    const dir = fileURLToPath(chunks);
    const carriers = readdirSync(dir)
      .map(String)
      .filter((name) => name.endsWith(".js"))
      .filter((name) =>
        readFileSync(join(dir, name), "utf8").includes(PROTOCOL_SYMBOL),
      );

    // If the probe stops finding the chunk it has gone blind, and a blind guard
    // must fail rather than pass. The symbol is the one 04-RESEARCH measured
    // the 131,101-byte chunk by.
    expect(
      carriers.length,
      `no chunk contains ${PROTOCOL_SYMBOL} — this guard can no longer see the protocol package and is not proving anything`,
    ).toBeGreaterThan(0);

    // The deep-link route is held to the same line as the front door: a shared
    // link must open as light as the shelf does.
    //
    // AMENDMENT (D-07, plan 05.1-05), in two parts.
    //
    // FIRST: build/c/euclid/index.html joins the list. It is a page that did not
    // exist before D-07 and it is the one that proves the widening did not make
    // the deep-link route heavy: aurora is a ROW entry, so its page is the one
    // Phase 4 already shipped, while euclid is an OFF-ROW entry whose page reads
    // the listing and renders a row of one.
    //
    // SECOND, and it is a correction rather than a widening. This test used to
    // ask only whether the page's HTML NAMED a carrying chunk, and that is not
    // the same question as whether the page pulls it. MEASURED on 2026-09-04
    // with this plan's own negative check: a static
    // `import { CATALOG } from "$lib/catalog"` in src/routes/c/[id]/+page.svelte
    // put the 131,101-byte protocol chunk in the page's static graph -
    // node 3 -> C4ys7kig.js -> BFIKf6sX.js -> C1rLf53t.js, every edge a real
    // `import ... from` - and this test STAYED GREEN, because Kit's <head>
    // preloads eleven modules and none of the three new ones was among them.
    // Test 13 could not see it either: COMPILER_MARKERS matches specifier TEXT
    // and "$lib/catalog" contains none of vendor, intechstudio or lib/pad. So
    // the page is walked TRANSITIVELY through its static imports now, which is
    // the graph the browser actually fetches before first paint. Dynamic
    // imports are correctly invisible to this walk: Vite emits them as
    // __mapDeps string tables, never as import statements, which is exactly why
    // Coverflow's `await import()` of the simulator does not trip it.
    //
    // Nothing else in this file moves in plan 05.1-05, and the test count stays
    // 14. TEST 13 IS DELIBERATELY NOT TOUCHED HERE: it is widened in plan
    // 05.1-08 together with the /browse/ page whose absence makes the widening
    // necessary, because widening it twice in two waves is two chances to
    // disagree about what the rule is. build/browse/index.html joins the list
    // below there, with the page.

    /** Every `import`/`export ... from "x"` specifier, dynamic imports excluded. */
    const staticSpecifiers = (source: string): string[] =>
      [
        ...source.matchAll(
          /(?:^|[;}\s])(?:import|export)\s*(?:[^'"]*?from\s*)?["']([^"']+)["']/g,
        ),
      ].map((match) => match[1]);

    /** A relative specifier resolved against the importing module's own path. */
    const resolveFrom = (from: string, specifier: string): string => {
      const stack: string[] = [];
      const parts = (
        from.slice(0, from.lastIndexOf("/")) +
        "/" +
        specifier
      ).split("/");
      for (const part of parts) {
        if (part === "" || part === ".") continue;
        else if (part === "..") stack.pop();
        else stack.push(part);
      }
      return stack.join("/");
    };

    for (const page of [
      "build/index.html",
      "build/c/aurora/index.html",
      "build/c/euclid/index.html",
    ]) {
      const html = text(page);
      const queue = [
        ...new Set(
          [...html.matchAll(/_app\/immutable\/[^"'\s]+\.js/g)].map(
            (match) => match[0],
          ),
        ),
      ];
      expect(
        queue.length,
        `${page} names the modules it loads`,
      ).toBeGreaterThan(0);

      const seen = new Set<string>();
      const reached: string[] = [];
      let edges = 0;
      while (queue.length > 0) {
        const rel = queue.shift() as string;
        if (seen.has(rel)) continue;
        seen.add(rel);
        const file = root(`build/${rel}`);
        if (!existsSync(file)) continue;
        if (carriers.includes(rel.slice(rel.lastIndexOf("/") + 1))) {
          reached.push(rel);
        }
        for (const specifier of staticSpecifiers(readFileSync(file, "utf8"))) {
          if (!specifier.startsWith(".") || !specifier.endsWith(".js"))
            continue;
          edges++;
          queue.push(resolveFrom(rel, specifier));
        }
      }

      // Non-vacuity, and it is the whole reason the walk is trustworthy: a
      // matcher that silently stopped matching would visit only the modules the
      // <head> names and report a clean graph for a page that pulls the world.
      expect(
        edges,
        `${page}: no static import was resolved at all - this walk has gone blind`,
      ).toBeGreaterThan(0);
      expect(
        reached,
        `${page} reaches the chunk carrying the protocol package through a static import`,
      ).toEqual([]);
    }
  });
});
