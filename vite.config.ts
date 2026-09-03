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
        handleHttpError: ({ status, path, message }) => {
          const writtenByPostbuild =
            path === "/LICENSE" ||
            path === "/THIRD-PARTY.md" ||
            (path.startsWith("/source-") && path.endsWith(".tar.gz"));
          if (status === 404 && writtenByPostbuild) return;
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
          name: "sweep",
          environment: "node",
          include: ["src/vendor/botor/tests/pad-invariants.test.js"],
        },
      },
    ],
  },
});
