import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// D-04, asserted rather than promised. VENDOR.md can say the vendored files
// were not touched; it cannot fail. This spec reconstructs the PRISTINE upstream
// bytes from each vendored copy - strip the provenance header block, invert the
// recorded import/type rewrites - and compares a sha256 against the manifest.
// A fourth change of any kind (a reformat, a reorder, a local bug fix) moves the
// hash and names the file.
//
// It deliberately reads NOTHING outside this repository. The upstream bytes are
// pinned by the committed hash manifest, so the suite is green on a machine that
// has never checked out the sibling BOTOR repository. That is the whole reason
// the manifest exists instead of a second committed copy of 436 KB of source,
// which would be duplicated again in every per-deploy GPLv3 source archive.
// src/lib/format-parity.spec.ts DOES require the sibling checkout - that is a
// separate, deliberate canary about formatter parity, and it stays that way.
//
// scripts/record-upstream-manifest.mjs regenerates the manifest, read-only,
// as step 5 of the sync procedure in src/vendor/botor/VENDOR.md.

const root = (file: string) => new URL(`../../../${file}`, import.meta.url);
const text = (file: string) => readFileSync(root(file), "utf8");

// D-01. Repeated here as a literal rather than read from the manifest: a test
// that took the expected value from the file under test would assert nothing.
const PINNED_BOTOR_SHA = "a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c";

interface Delta {
  vendored: string;
  upstream: string;
}

interface FileEntry {
  vendored: string;
  upstream: string;
  bytes: number;
  sha256: string;
  deltas: Delta[];
}

interface Manifest {
  upstream: { repository: string; branch: string; commit: string };
  headerSentinel: string;
  note: string;
  files: FileEntry[];
}

const MANIFEST_PATH = "src/lib/fidelity/upstream-manifest.json";
const manifest = JSON.parse(text(MANIFEST_PATH)) as Manifest;

const entryFor = (vendored: string): FileEntry => {
  const entry = manifest.files.find((f) => f.vendored === vendored);
  if (!entry) throw new Error(`no manifest entry for ${vendored}`);
  return entry;
};

// The header block runs from the first line to the sentinel inclusive, and is
// followed by exactly one blank line. Because the block is stripped whole and
// the deltas are inverted in place, line offsets never matter to this spec.
const splitHeader = (vendored: string) => {
  const lines = text(vendored).split("\n");
  const sentinelIndex = lines.indexOf(manifest.headerSentinel);

  expect(
    sentinelIndex,
    `${vendored}: the provenance header sentinel was not found. Expected a line exactly equal to:\n  ${manifest.headerSentinel}`,
  ).toBeGreaterThan(-1);

  // A sentinel found deep in the file means the header was not written as
  // VENDOR.md specifies - the longest real block is 7 lines (_pad.ts).
  expect(
    sentinelIndex,
    `${vendored}: the header sentinel is at line ${sentinelIndex + 1}, which is too deep to be the provenance block.`,
  ).toBeLessThan(12);

  expect(
    lines[sentinelIndex + 1],
    `${vendored}: the provenance header must be followed by exactly one blank line.`,
  ).toBe("");

  return {
    header: lines.slice(0, sentinelIndex + 1),
    body: lines.slice(sentinelIndex + 2).join("\n"),
  };
};

const vendoredPaths = manifest.files.map((f) => f.vendored);

describe("vendored BOTOR files (D-04)", () => {
  it.each(vendoredPaths)(
    "%s is byte-identical to upstream once the permitted deltas are inverted",
    (vendored) => {
      const entry = entryFor(vendored);
      let body = splitHeader(vendored).body;

      for (const delta of entry.deltas) {
        // Exactly once. A delta that matched twice would mean the rewrite hit a
        // site nobody recorded, and a blind replace-all would hide it.
        expect(
          body.split(delta.vendored).length - 1,
          `${vendored}: expected the permitted delta to occur exactly once:\n  ${delta.vendored}`,
        ).toBe(1);
        body = body.replace(delta.vendored, delta.upstream);
      }

      const buf = Buffer.from(body, "utf8");

      // Length before hash: a length mismatch is a far more readable failure
      // than a hash mismatch, and it is what catches a lossy decode.
      expect(
        buf.length,
        `${vendored}: reconstructed ${buf.length} bytes, upstream ${entry.upstream} is ${entry.bytes}. A change of ${buf.length - entry.bytes} bytes is not one of the three permitted deltas.`,
      ).toBe(entry.bytes);

      expect(
        createHash("sha256").update(buf).digest("hex"),
        `${vendored}: the reconstructed bytes do not hash to the recorded upstream sha256 for ${entry.upstream} at ${manifest.upstream.commit}. Something other than the provenance header and the recorded deltas was changed. Fix it upstream and re-sync (D-03/D-08); never patch a vendored file locally.`,
      ).toBe(entry.sha256);
    },
  );

  it.each(vendoredPaths)(
    "%s carries a provenance header naming the repository, path, commit and sync date",
    (vendored) => {
      const entry = entryFor(vendored);
      const { header } = splitHeader(vendored);

      // GPLv3 section 5(a) wants the modification and a relevant date; 5(b)
      // wants the licence notice. D-02 wants the repository that actually
      // contains the cited commit.
      expect(header[0], `${vendored}: unexpected first line`).toBe(
        "// Vendored from sabotond-dev/botor",
      );
      expect(
        header,
        `${vendored}: header must name the upstream path`,
      ).toContain(`//   path:   ${entry.upstream}`);
      expect(header, `${vendored}: header must name the D-01 commit`).toContain(
        `//   commit: ${manifest.upstream.commit}`,
      );

      const syncedPrefix = "//   synced: ";
      const synced = header.find((line) => line.startsWith(syncedPrefix));
      expect(
        synced,
        `${vendored}: header must carry a "${syncedPrefix.trim()}" line (GPLv3 5(a) "a relevant date")`,
      ).toBeDefined();
      expect(
        synced?.slice(syncedPrefix.length),
        `${vendored}: the synced date must be an ISO calendar date`,
      ).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      expect(
        header.some((line) => line.startsWith("// Modified for HANGAR: ")),
        `${vendored}: header must state what was modified, even when the answer is nothing`,
      ).toBe(true);

      expect(
        header[header.length - 1],
        `${vendored}: the block must close on the sentinel`,
      ).toBe(manifest.headerSentinel);
    },
  );

  it("the manifest pins the D-01 upstream commit", () => {
    expect(manifest.upstream.commit).toBe(PINNED_BOTOR_SHA);
    expect(manifest.upstream.repository).toContain("sabotond-dev/botor");
    expect(manifest.upstream.branch).toBe("main");

    // Six files, and exactly five inverse rewrites across them: one RGB type
    // inline and four import specifiers. That count IS the D-04 allow-list, so
    // a sixth appearing without a decision turns this red.
    expect(manifest.files).toHaveLength(6);
    expect(manifest.files.reduce((n, f) => n + f.deltas.length, 0)).toBe(5);

    for (const entry of manifest.files) {
      expect(entry.sha256, `${entry.vendored}: malformed sha256`).toMatch(
        /^[0-9a-f]{64}$/,
      );
      expect(
        entry.bytes,
        `${entry.vendored}: implausible upstream byte length`,
      ).toBeGreaterThan(0);
    }
  });

  it("VENDOR.md names the same upstream and lists every vendored file", () => {
    const doc = text("src/vendor/botor/VENDOR.md");

    expect(doc).toContain("sabotond-dev/botor");
    expect(doc).toContain(manifest.upstream.commit);

    for (const entry of manifest.files) {
      const basename = entry.vendored.split("/").pop() as string;
      expect(doc, `VENDOR.md does not mention ${basename}`).toContain(basename);
    }

    // A placeholder left in the one document a re-syncer follows is worse than
    // no document at all.
    expect(doc).not.toContain("TBD");
  });
});
