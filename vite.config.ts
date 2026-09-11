import { execSync } from "node:child_process";
import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

const git = (cmd: string) => {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};
const COMMIT_SHA = git("git rev-parse HEAD") || "unknown";
const BUILD_DIRTY = git("git status --porcelain").length > 0;

export default defineConfig({
  define: {
    __COMMIT_SHA__: JSON.stringify(COMMIT_SHA),
    __BUILD_DIRTY__: JSON.stringify(BUILD_DIRTY),
  },
  plugins: [
    tailwindcss(),
    sveltekit({
      // Svelte-level option — flat, as sv generated it.
      compilerOptions: {
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },
      // Kit-level options — ALSO flat. Wrapping these in a `kit` object here is
      // silently forwarded to vite-plugin-svelte and leaves Kit on adapter-auto.
      adapter: adapter({
        pages: "build",
        assets: "build",
        fallback: "404.html",
        precompress: false,
      }),
      prerender: {
        entries: ["*"],
        // scripts/postbuild.mjs copies LICENSE, THIRD-PARTY.md and the
        // source-<sha>.tar.gz archive into build/ AFTER `vite build` has run, so
        // the prerenderer cannot see them while it crawls the footer's GPLv3
        // section 6(d) links. Ignore a 404 for exactly those three paths and
        // rethrow everything else, so a genuinely broken link still fails the
        // build. The e2e suite asserts all three really are served, over HTTP,
        // from the finished build/.
        //
        // ONE MORE, FOR ONE WAVE (plan 13-07; three until 13-08 landed
        // /playground/ and removed its own, two until 13-13 landed
        // /my-configs/ and removed its own). The intro at / links to the
        // primary nav's destinations before the routes exist: 13-16 lands
        // /sandbox/ and removes this path in the commit that lands the
        // route, so the crawler goes back to failing the build on a dead
        // link the day the link stops being dead by design. Exact path, no
        // prefix: nothing else under it is excused.
        handleHttpError: ({ status, path, message }) => {
          const writtenByPostbuild =
            path === "/LICENSE" ||
            path === "/THIRD-PARTY.md" ||
            (path.startsWith("/source-") && path.endsWith(".tar.gz"));
          const notYetRouted = path === "/sandbox/";
          if (status === 404 && (writtenByPostbuild || notYetRouted)) return;
          throw new Error(message);
        },
      },
    }),
  ],
  // Proven grid-editor incantation (renderer.vite.config.mjs:38-39). Nothing
  // imports grid-protocol yet; adding it now removes a debugging session from
  // Phase 3.
  optimizeDeps: { exclude: ["@intechstudio/grid-protocol"] },
  test: {
    // Plan 01 deletes sv's demo specs and the first real spec arrives in plan
    // 02; without this an empty run exits 1 on "No test files found".
    passWithNoTests: true,
    expect: { requireAssertions: true },
    projects: [
      {
        extends: "./vite.config.ts",
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
          // The vendored tree is deliberately NOT excluded here. Phase 1 added a
          // blanket vendor exclusion as quarantine hygiene before there was
          // anything to quarantine, and once the six BOTOR files landed it made
          // `npx vitest run` skip all three ported suites while still reporting
          // green: 4 files / 18 tests instead of 7 / 300, with no warning. The
          // sweep below is excluded by FILE NAME, not by directory.
          exclude: [
            "src/**/*.svelte.{test,spec}.{js,ts}",
            "src/vendor/botor/tests/pad-invariants.test.js",
            // The naming convention IS the rule. A `*.sweep.spec.ts` anywhere
            // under src/ belongs to the sweep project below and must not also
            // run here - by FILE NAME, never by directory, for the reason the
            // comment above gives.
            "src/**/*.sweep.spec.ts",
          ],
        },
      },
      {
        extends: "./vite.config.ts",
        test: {
          // D-10 fired. Measured on this machine: the whole run is 39.9 s and
          // pad-invariants.test.js is 38.6 s of it, because its sweep is 4,860
          // labelled states (1,620 kind combinations x 3 brightness levels).
          // The other two ported suites are 2.9 s and 0.6 s. The sweep is the
          // anti-drift mechanism, so it runs less OFTEN (per wave, not per
          // task) and never less FULLY.
          //
          // Phase 5 adds two HANGAR members, and the reason is the same one.
          // TUNE-04 and TUNE-05 ship as guards rather than as live features
          // because no state a visitor can reach is over 908 - a measured
          // finding, and the whole thing that licenses the shape of two
          // requirements. A claim that load-bearing belongs in the suite, in
          // the project whose entire purpose is anti-drift, and it is a
          // property of THE PINNED COMPILER rather than a law.
          //
          // The convention is a FILE-NAME rule, never a directory rule:
          // `*.sweep.spec.ts` anywhere under src/ joins this project and is
          // excluded from `server` above by the same glob.
          name: "sweep",
          environment: "node",
          include: [
            "src/vendor/botor/tests/pad-invariants.test.js",
            "src/**/*.sweep.spec.ts",
          ],
        },
      },
    ],
  },
});
