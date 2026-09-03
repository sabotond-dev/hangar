import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// D-15 property: a file vendored from BOTOR diffs cleanly against BOTOR on the
// next re-sync. That holds if and only if HANGAR's formatter produces the SAME
// BYTES as BOTOR's formatter for the same input — it does not require the
// upstream file to already be Prettier-clean.
//
// Observed 2026-09-02 with grid-editor's own Prettier 3.6.2 (read-only,
// --check): `_pad.ts` is clean; `pad-sim-host.ts` drifts by 1 hunk / 3 lines;
// `_zone-blocks.ts` by 5 hunks; `pad-sim.ts` by 6 hunks / 57 lines (mostly
// Prettier reflowing a hand-laid 256-entry sine table). Upstream simply never
// runs the formatter over parts of that directory. So asserting
// `prettier --check` exit 0 on a copy would assert something about BOTOR's
// hygiene, not about HANGAR's config — and would be permanently red.
//
// This test therefore compares formatter OUTPUTS: HANGAR's Prettier + config
// against BOTOR's Prettier + config, byte for byte. It goes red the moment
// HANGAR's `.prettierrc`, plugin set or Prettier version drifts from
// grid-editor's — which is exactly the failure the vendor sync procedure in
// `src/vendor/botor/VENDOR.md` depends on catching.
//
// Nothing is normalised: a CRLF/LF difference between the two outputs is a real
// parity failure and must stay visible.

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));

// Resolve the sibling checkouts from the MAIN repository, never from this
// working tree. Under `git worktree` the repo root is .claude/worktrees/<name>/
// and REPO_ROOT/.. lands inside .claude/, which would turn this fail-loudly
// canary red for a purely environmental reason. `git rev-parse --git-common-dir`
// always names the MAIN repository's .git directory, so its grandparent is the
// directory the sibling repos share, in both layouts.
const commonDir = execFileSync("git", ["rev-parse", "--git-common-dir"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).trim();
const SIBLINGS = resolve(REPO_ROOT, commonDir, "..", "..");

// The sibling BOTOR checkout. Read-only: this test copies out of it, runs its
// Prettier in stdout mode, and never writes to it. Never pass --write.
const BOTOR = process.env.BOTOR_REPO ?? join(SIBLINGS, "grid-editor");
const UPSTREAM_PRETTIER = join(
  BOTOR,
  "node_modules",
  "prettier",
  "bin",
  "prettier.cjs",
);
// HANGAR's own Prettier binary, resolved once. Invoked through `node` rather
// than `npx` because an `npx` resolution on a cold cache, with six other spec
// files competing for CPU, is slow enough to cross a test timeout on its own -
// observed once during 03-02. Same invocation shape as UPSTREAM_PRETTIER above,
// which keeps the two sides of the comparison symmetrical.
const HANGAR_PRETTIER = join(
  REPO_ROOT,
  "node_modules",
  "prettier",
  "bin",
  "prettier.cjs",
);
const TMP = join(REPO_ROOT, ".tmp-format-parity");

// Two Prettier subprocesses over a 152 KB file is comfortably slower than
// Vitest's 5,000 ms default under parallel load. This is a correctness canary,
// not a performance budget: give it room so a slow machine reports parity
// truthfully instead of reporting a timeout.
const CANARY_TIMEOUT_MS = 30_000;

// Files Phase 3 will vendor (FOUND-02).
const CANARIES = ["_pad.ts", "pad-sim-host.ts"];
const source = (name: string) =>
  join(BOTOR, "src", "renderer", "main", "zona", name);

// _pad.ts is 152 KB and its formatted output is larger still.
const MAX_BUFFER = 16 * 1024 * 1024;

afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("formatting parity with grid-editor (D-15)", () => {
  it("can see the BOTOR checkout", () => {
    // Fails, never skips. A gate that opts out when its subject is missing is
    // not a gate.
    expect(
      existsSync(BOTOR),
      `grid-editor not found at ${BOTOR}. Set BOTOR_REPO to the checkout path.`,
    ).toBe(true);
    expect(
      existsSync(source("_pad.ts")),
      `missing canary source: ${source("_pad.ts")}`,
    ).toBe(true);
    expect(
      existsSync(UPSTREAM_PRETTIER),
      `grid-editor's own Prettier is not installed at ${UPSTREAM_PRETTIER}. ` +
        "Run `npm install` in the grid-editor checkout — this test needs the " +
        "upstream formatter to compare against.",
    ).toBe(true);
  });

  for (const name of CANARIES) {
    it(
      `${name} formats identically under HANGAR's and BOTOR's Prettier`,
      () => {
        const from = source(name);
        expect(existsSync(from), `missing canary source: ${from}`).toBe(true);

        // Copy INSIDE the repo so Prettier resolves .prettierrc from here, and
        // not under node_modules, which Prettier ignores by default.
        mkdirSync(TMP, { recursive: true });
        const to = join(TMP, name);
        copyFileSync(from, to);

        // --ignore-path .prettierignore is load-bearing. Prettier >= 3.0 defaults
        // --ignore-path to [.gitignore, .prettierignore], and .tmp-format-parity/
        // is gitignored — without this flag Prettier silently passes over the file
        // and prints nothing, so the comparison below would compare an empty
        // string against upstream output for a confusing reason (or, with
        // --check, would exit 0 however mangled the file was). Naming
        // .prettierignore explicitly replaces that default list.
        //
        // cwd is the HANGAR root so HANGAR's .prettierrc and HANGAR's
        // node_modules plugin resolve.
        const hangarOut = execFileSync(
          "node",
          [HANGAR_PRETTIER, "--ignore-path", ".prettierignore", to],
          {
            cwd: REPO_ROOT,
            encoding: "utf8",
            maxBuffer: MAX_BUFFER,
          },
        );

        // BOTOR's own Prettier binary, run with cwd = the BOTOR root so
        // grid-editor's config and plugins resolve. Stdout mode only — no
        // --write, no --check, nothing that touches the sibling repository.
        const upstreamOut = execFileSync("node", [UPSTREAM_PRETTIER, from], {
          cwd: BOTOR,
          encoding: "utf8",
          maxBuffer: MAX_BUFFER,
        });

        expect(hangarOut.length).toBeGreaterThan(0);
        expect(hangarOut).toBe(upstreamOut);
      },
      CANARY_TIMEOUT_MS,
    );
  }
});
