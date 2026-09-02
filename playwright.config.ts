// Harness decision, measured on this machine on 2026-09-02:
//   wrangler dev cold start = 4.6s
// (4551 ms from process launch to the first HTTP response, which was a 401 from
// the gate). Well under the ~20s threshold, so the harness is wrangler dev.
// wrangler dev serves ./build from local disk through worker/index.js — byte-identical
// to production, and it makes the Basic Auth gate a regression test. Fallback if this
// ever gets slow or flaky: `npx sirv-cli build --port 4173 --host 127.0.0.1 --single`
// (same assertions, no auth coverage).
//
// NOT the SvelteKit preview server: `vite preview` boots the Node server from
// .svelte-kit/output/server and never reads build/, so it would validate an artifact
// that is not the deployed one. The acceptance check for this file therefore forbids
// `vite preview` in the webServer *command*, not in this comment.
import { readFileSync } from "node:fs";
import { defineConfig } from "@playwright/test";

// Single source of truth for the local gate password: the same .dev.vars that
// wrangler dev reads.
function devVars(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(".dev.vars", "utf8")
        .split(/\r?\n/)
        .filter((l) => l.trim() && !l.startsWith("#"))
        .map((l) => {
          const i = l.indexOf("=");
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
        }),
    );
  } catch {
    return {};
  }
}
const vars = devVars();

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  use: {
    baseURL: "http://127.0.0.1:4173",
    httpCredentials: {
      username: vars.SITE_USER ?? "hangar",
      password: vars.SITE_PASSWORD ?? "",
    },
  },
  webServer: {
    // `npm run preview` === `npm run build && wrangler dev --port 4173 --ip 127.0.0.1`
    command: "npm run preview",
    // `url`, not the deprecated `port`. Playwright's readiness probe accepts a
    // 401, so the auth gate does not break startup detection.
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
