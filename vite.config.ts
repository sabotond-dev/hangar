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
      prerender: { entries: ["*"] },
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
          exclude: ["src/**/*.svelte.{test,spec}.{js,ts}", "src/vendor/**"],
        },
      },
    ],
  },
});
