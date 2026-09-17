import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { stripComments } from "../test-support/source";

const root = (file: string) => new URL(`../../${file}`, import.meta.url);

const SKELETON_PAGE = "src/routes/dev/skeleton/+page.svelte";
/** Every directory under here is an unlinked probe route (Phase 6, 06-05). */
const DEV_ROUTES = "src/routes/dev";
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
  "src/routes/playground/[id]/+page.svelte",
  "src/routes/playground/[id]/+page.ts",
  // Plan 13-08: the gallery's load, which declares the shell's shape as data
  // and imports a type and nothing else. Walked so a later import there is
  // held to the same line as the page beside it.
  "src/routes/playground/+page.ts",
  // Phase 6 (plan 06-05): the layout renders on every route including `/`,
  // and it is where the device session is started and the one session live
  // region is mounted (06-09) - the file most likely to hold the session's own
  // static import, and so the one this rule can least afford not to read.
  "src/routes/+layout.svelte",
];
const UI_DIR = "src/lib/ui";
/** Plan 05.1-08's page, and the pure modules it and its toolbar are built on. */
const BROWSE_PAGE = "src/routes/playground/+page.svelte";
const BROWSE_DIR = "src/lib/browse";
/** Anything that would drag @intechstudio/grid-protocol onto the first paint. */
const COMPILER_MARKERS = [
  "vendor",
  "intechstudio",
  "lib/pad",
  // Widened in Phase 6 (plan 06-05). The session's neighbours all reach the
  // package at module scope: constants.ts, decode.ts, descriptors.ts and
  // sequence.ts each import it, and device/try-on.ts imports both barrels.
  // None of those three strings matched before, so a header component could
  // have imported the whole 131,101-byte chunk with this gate green. OBSERVED,
  // not assumed: a static `from "$lib/transport"` in a src/lib/ui/ component
  // left this file at 14 passed before the widening and is red after it.
  "lib/transport",
  "lib/protocol",
  "lib/device",
];

/*
  AMENDMENT (Phase 6, plan 06-05). The device session renders in the header on
  the first paint of `/` (06-CONTEXT D-02, D-05), so the modules a header
  component names statically have to be free of the protocol package. Every
  one of them lives in a directory COMPILER_MARKERS now forbids, which is why
  the rule is markers PLUS an allow-list of exact paths - never a prefix, per
  05.1-08's lesson - and why the allow-list is itself CHECKED rather than
  trusted: test 13 walks what these five modules import, and a walk that
  marker-checked its own allow-list would be red on its first step, so the
  walk FOLLOWS an exactly matching permitted specifier and marker-checks every
  other. `$lib/protocol` is not `$lib/protocol/usb`; a barrel import inside a
  permitted module is an offender on the walk. The test count stays 14.

  AMENDMENT (Phase 7, plan 07-08). The install store is reachable from the
  first paint: the root layout starts it beside the session (07-08) and the
  install panel on `/playground/{id}/` binds it (07-10). Its three static specifiers
  are two zero-import modules (install-copy, snapshot) and the session, and
  all three are under the `lib/device` marker, so the allow-list gains exactly
  those three paths - never a prefix - and the walk follows all three and
  marker-checks what they import, exactly as it does the session's four. The
  mutations that prove the widening bites are planted in plan 07-09, once a
  component under src/lib/ui/ exists to plant them in; this plan proves the
  walk READ them (the visited-module guard below rises from four to seven).
  The test count stays 14.
*/

/**
 * The nine modules (eight before 13-12) a first-paint component MAY name, by exact path and never
 * by prefix (05.1-08's lesson: the allowance is a list of paths, not a
 * namespace). Each one is verified light below rather than trusted.
 */
const PERMITTED_SPECIFIERS = [
  "$lib/device/session.svelte",
  "$lib/device/session-copy",
  "$lib/protocol/usb",
  "$lib/transport/ports",
  // Fifth, and the least obvious: src/lib/transport/transport.ts has ZERO
  // imports. Verified by reading it - its only exports are GridTransport,
  // OpenFailure, FailureCopy, classifyOpenError and failureCopy, and the
  // DOMException and SerialPort it names are globals, not specifiers. So the
  // session can hold the failure taxonomy and its copy STATICALLY, which is
  // what makes failureFor() synchronous for all nine states and lets a
  // capability failure render its sentence in the first hydrated frame.
  "$lib/transport/transport",
  // Phase 7 (plan 07-08): the install store and its two zero-import
  // neighbours. install.svelte.ts reaches the protocol and transport barrels
  // only through erased `import(...)` types and awaited imports inside its
  // actions; install.spec.ts test 8 counts its static specifiers at three.
  "$lib/device/install.svelte",
  "$lib/device/install-copy",
  "$lib/device/snapshot",
  // Phase 13 (plan 13-12): the page target - the install store's fourth
  // static specifier and a zero-import module like its two neighbours. The
  // walk follows it and marker-checks what it imports, which is nothing.
  "$lib/device/page-target",
];

/*
  AMENDMENT (plan 05.1-08). COMPILER_MARKERS matches the TEXT of a specifier,
  which is exactly right for a direct import of the vendored tree and blind to
  every module that reaches it TRANSITIVELY - which is most of the ones a browse
  component would plausibly reach for. Each of the three below was read, not
  guessed: catalog/entries/ported.ts:13, sim/engine.ts:41-42 and
  tune/model.ts:67-70 all import src/vendor/botor/_pad at module scope, and
  tune/model.ts pulls 628 KB of WASM behind it.

    $lib/catalog      -> no marker matches, 131,101-byte protocol chunk
    $lib/sim/engine   -> no marker matches, the same chunk
    $lib/tune/model   -> no marker matches, the same chunk plus the formatter
    $lib/pad          -> "lib/pad" matches, so it was already covered

  src/lib/ui/tune-ui.spec.ts test 1 recorded the hole in 2026-09 and closed it
  for seven components with a named-versus-awaited count. This is the same fix
  generalised into a rule, so it covers the browse files too and so the next
  transitive module is added in ONE place rather than two.

  THREE CATALOG SPECIFIERS ARE PERMITTED, and they are the whole reason this is a
  rule rather than a ban: src/lib/catalog/front-door.ts and
  src/lib/catalog/listing.ts import NOTHING at runtime - their own specs assert
  it - which is what lets a prerendered page carry sixteen names without carrying
  the compiler; src/lib/catalog/brightness.ts (change 5, 2026-09-17) imports
  nothing at all - brightness.spec.ts test 5 asserts it - and BrightnessField.svelte
  names it for the field's parse. The allowance is exactly those three paths,
  never a prefix, so $lib/catalog/index is an offender.
*/
const COMPILE_SURFACE = [
  "$lib/catalog",
  "$lib/sim/engine",
  "$lib/tune/model",
  "$lib/pad",
];
const COMPILE_SURFACE_ALLOWED = [
  "$lib/catalog/front-door",
  "$lib/catalog/listing",
  "$lib/catalog/brightness",
];
/** The symbol that identifies the chunk carrying the protocol package. */
const PROTOCOL_SYMBOL = "GRID_PARAMETER_ELEMENT_POTMETER";

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

  it("every probe route under /dev/ is linked from nowhere", () => {
    // fidelity.e2e.ts already asserts site-wide that no anchor points into
    // /dev/, which covers the rendered page. This covers the source: a route
    // that nothing references cannot be reached by a visitor who did not type
    // the path.
    //
    // AMENDMENT (Phase 6, plan 06-05). This used to name dev/skeleton and
    // cover nothing else. The probe directories are DISCOVERED now, so the
    // catalog, fidelity and tune probes came under the rule the day it was
    // widened and the next probe is protected the day it is created rather
    // than the day someone remembers - with one honest limit: a directory
    // that does not exist yet cannot be discovered, which is why the plan that
    // creates a probe re-runs the mutation against it. The test count stays 14.
    //
    // THIS SCAN READS COMMENTS DELIBERATELY, and it is a plain substring scan.
    // The probe pages therefore describe their siblings in prose rather than
    // naming them - 05-12 recorded that spelling a sibling route turned this
    // test red, and 06-05 found three more pages spelling the fidelity one,
    // which is what the widening was for. The property it guards is worth
    // more than the convenience of a path in a comment.
    const routes = root("src/routes");
    const probes = readdirSync(root(DEV_ROUTES), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `dev/${entry.name}`)
      .sort();
    const mentions: string[] = [];
    const scanned: string[] = [];
    for (const entry of readdirSync(routes, { recursive: true })) {
      const rel = String(entry).split(sep).join("/");
      const file = join(fileURLToPath(routes), String(entry));
      if (!statSync(file).isFile()) continue;
      scanned.push(rel);
      const source = readFileSync(file, "utf8");
      for (const probe of probes) {
        // A probe may name itself; only its OWN directory is exempt.
        if (rel.startsWith(`${probe}/`)) continue;
        if (source.includes(probe)) mentions.push(`${rel} mentions ${probe}`);
      }
    }
    // Both non-vacuity guards, because the assertion below would pass on an
    // empty walk of either kind: no routes read, or no probes discovered.
    expect(scanned.length, "routes were actually read").toBeGreaterThan(0);
    expect(
      probes.length,
      "at least two probe directories were discovered",
    ).toBeGreaterThan(1);
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
    // would forbid the correct implementation. The same anchoring is what
    // exempts an `await import(...)` from the compile-surface rule below: Vite
    // emits a dynamic import as its own chunk, which is the whole point.
    //
    // AMENDMENT (plan 05.1-08), in two parts. The walk gained /playground/ and the
    // pure modules under src/lib/browse/, and the file gained the
    // COMPILE_SURFACE rule declared at the top - see the block there for what
    // COMPILER_MARKERS could not see and why two catalog specifiers are
    // permitted. The test count stays 14.
    //
    // AMENDMENT (Phase 6, plan 06-05). The walk gained src/routes/+layout.svelte
    // through FRONT_DOOR_PAGES, COMPILER_MARKERS gained the session's three
    // directories, and the collection below became a WALK: every specifier is
    // resolved, an exact match for one of PERMITTED_SPECIFIERS is followed
    // into the file it names, and everything else is marker-checked. The five
    // permitted modules are seeded into the walk themselves, so the allowance
    // is verified today, before any component has imported it. The test count
    // still stays 14.
    const files = [
      ...FRONT_DOOR_PAGES,
      BROWSE_PAGE,
      // The whole of src/lib/ui/, subdirectories included: since 13-05 the
      // layout imports the shell's components from src/lib/ui/shell/, so
      // they are roots of the front door's static import graph like every
      // component beside them. A flat listing read the directory as a file
      // and threw EISDIR on 2026-09-11.
      ...((): string[] => {
        const out: string[] = [];
        const walk = (dir: string) => {
          for (const entry of readdirSync(root(dir), { withFileTypes: true })) {
            const rel = `${dir}/${entry.name}`;
            if (entry.isDirectory()) walk(rel);
            else if (!entry.name.endsWith(".spec.ts")) out.push(rel);
          }
        };
        walk(UI_DIR);
        return out;
      })(),
      ...readdirSync(root(BROWSE_DIR))
        .map(String)
        .filter((name) => name.endsWith(".ts") && !name.endsWith(".spec.ts"))
        .map((name) => `${BROWSE_DIR}/${name}`),
    ];

    /**
     * A specifier as one repo-relative path, so RELATIVE FORMS COUNT.
     *
     * Without this a component that writes `../sim/engine` walks straight
     * through the rule the `$lib/` alias closes, and `../catalog` from
     * src/lib/browse/ resolves to the same module `$lib/catalog` names. A
     * bare package name is returned unchanged and never matches the surface.
     */
    const normalise = (file: string, specifier: string): string => {
      if (specifier.startsWith("$lib/")) return `src/lib/${specifier.slice(5)}`;
      if (!specifier.startsWith(".")) return specifier;
      const stack: string[] = [];
      const parts = (
        file.slice(0, file.lastIndexOf("/")) +
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

    const asPath = (specifier: string) => `src/lib/${specifier.slice(5)}`;
    const SURFACE = COMPILE_SURFACE.map(asPath);
    const ALLOWED = COMPILE_SURFACE_ALLOWED.map(asPath);
    const PERMITTED = PERMITTED_SPECIFIERS.map(asPath);
    const reaches = (path: string) =>
      SURFACE.some((entry) => path === entry || path.startsWith(`${entry}/`));

    /** A resolved module path to its file on disk: `.ts` first, then `/index.ts`. */
    const fileOf = (path: string): string | undefined =>
      [`${path}.ts`, `${path}/index.ts`].find((candidate) =>
        existsSync(root(candidate)),
      );

    // A permitted path that resolves to no file is an allowance for nothing,
    // and the walk below would "verify" it by never reading it.
    expect(
      PERMITTED.filter((path) => fileOf(path) === undefined),
      "a permitted specifier names no file on disk",
    ).toEqual([]);

    // THE WHOLE STATEMENT IS COLLECTED, not only the specifier, because the
    // `import type` exemption below is a property of the statement. Every
    // `from` specifier is collected FIRST, exemptions and all, and only then
    // subtracted - that ordering is what makes the non-vacuity check possible.
    const imports: {
      file: string;
      statement: string;
      specifier: string;
      path: string;
    }[] = [];

    // THE WALK. The worklist starts with the front-door set AND the five
    // permitted modules, so the allowance is verified today rather than on
    // the day a component first imports it. Each permitted module the walk
    // reads is recorded, and so is every permitted edge it follows, because
    // a matcher that had gone blind inside a .ts file would otherwise report
    // the allow-list clean for the wrong reason.
    const seen = new Set<string>();
    const walked: string[] = [];
    const followed: string[] = [];
    const queue = [
      ...files,
      ...PERMITTED.map((path) => fileOf(path) as string),
    ];
    while (queue.length > 0) {
      const file = queue.shift() as string;
      if (seen.has(file)) continue;
      seen.add(file);
      if (PERMITTED.some((path) => fileOf(path) === file)) walked.push(file);
      const source = stripComments(text(file));
      for (const match of source.matchAll(
        /(?:^|[;}\s])((?:import|export)[^;]*?from\s*["']([^"']+)["'])/g,
      )) {
        const specifier = match[2];
        const path = normalise(file, specifier);
        // THE BRANCH THAT MAKES THE ALLOW-LIST MORE THAN A COMMENT. An EXACT
        // match for a permitted path is FOLLOWED - the file it names joins the
        // walk and its own imports are read - and it is never marker-checked,
        // because all five permitted paths contain a marker substring and a
        // check here would go red on the allowance itself. Everything else is
        // collected and marker-checked below. Exact, never prefix: $lib/protocol
        // is not $lib/protocol/usb, so a barrel import inside a permitted
        // module is an offender on the walk, named with the file that wrote it.
        if (PERMITTED.includes(path)) {
          followed.push(`${file} -> ${specifier}`);
          queue.push(fileOf(path) as string);
          continue;
        }
        imports.push({
          file,
          statement: match[1].trim(),
          specifier,
          path,
        });
      }
    }

    // Guards against a silently broken matcher: an empty front-door list, an
    // empty match set and a silent walk would each make the assertions below
    // pass vacuously. The walk must have read at least seven of the eight
    // permitted modules (Phase 7, plan 07-08: four of five before the install
    // store's three joined the list) and followed at least one permitted edge.
    expect(files.length, "front-door files were listed").toBeGreaterThan(3);
    expect(
      imports.length,
      "static imports were actually collected",
    ).toBeGreaterThan(0);
    expect(
      walked.length,
      `the walk read ${walked.length} permitted module(s) - it has gone silent`,
    ).toBeGreaterThanOrEqual(7);
    expect(
      followed.length,
      "the walk followed no permitted specifier - the matcher has gone blind inside the permitted modules",
    ).toBeGreaterThan(0);

    const offenders = imports.filter(({ specifier }) =>
      COMPILER_MARKERS.some((marker) => specifier.includes(marker)),
    );
    expect(
      offenders.map((o) => `${o.file} -> ${o.specifier}`),
      "a front-door file, or a permitted module the walk followed, statically imports the compiler, the protocol package, the transport or the device path at module scope",
    ).toEqual([]);

    // The compile-surface rule, in three lines and one more non-vacuity guard.
    const reaching = imports.filter(({ path }) => reaches(path));
    expect(
      reaching.length,
      "not one collected specifier resolves onto the compile surface - the normaliser has stopped recognising anything, and the offender list below would be empty for the wrong reason",
    ).toBeGreaterThan(0);

    // `import type` IS EXEMPT, and it is not a loophole - it is a fact about
    // the build. A type import is erased and costs nothing, and it already
    // exists in shipped, correct code: Coverflow.svelte and TuningRegion.svelte
    // both carry `import type { SimEngine } from "$lib/sim/engine"`, and six
    // components carry `import type { FrontDoorEntry }`. A rule that did not
    // exempt it would go red on two signed-off components.
    const transitive = reaching
      .filter(({ path }) => !ALLOWED.includes(path))
      .filter(({ statement }) => !statement.startsWith("import type"));
    expect(
      transitive.map((o) => `${o.file} -> ${o.specifier}`),
      "a file on a light page statically imports a module that reaches @intechstudio/grid-protocol transitively - the specifier carries none of COMPILER_MARKERS' three needles, which is exactly why this second rule exists",
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
    // FIRST: build/playground/euclid/index.html joins the list. It is a page that did not
    // exist before D-07 and it is the one that proves the widening did not make
    // the deep-link route heavy: aurora is a ROW entry, so its page is the one
    // Phase 4 already shipped, while euclid is an OFF-ROW entry whose page reads
    // the listing and renders a row of one.
    //
    // SECOND, and it is a correction rather than a widening. This test used to
    // ask only whether the page's HTML NAMED a carrying chunk, and that is not
    // the same question as whether the page pulls it. MEASURED on 2026-09-04
    // with this plan's own negative check: a static
    // `import { CATALOG } from "$lib/catalog"` in src/routes/playground/[id]/+page.svelte
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
    // 05.1-08 together with the /playground/ page whose absence makes the widening
    // necessary, because widening it twice in two waves is two chances to
    // disagree about what the rule is. build/playground/index.html joins the list
    // below there, with the page.
    //
    // AMENDMENT (plan 05.1-08). build/playground/index.html is now in the list, and
    // it is the entry that matters most: without it a 131 KB regression on the
    // one page in the site whose entire job is to list sixteen names ships with
    // every guard green. Test 13's source scan goes red first and needs no
    // build; this one is the backstop for a transitive re-export or a future
    // bundler putting the chunk on the page by a route no source scan would
    // recognise. The test count still stays 14.

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
      "build/playground/index.html",
      "build/playground/aurora/index.html",
      "build/playground/euclid/index.html",
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
