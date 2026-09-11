import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// D-04, asserted rather than promised. VENDOR.md can say what was changed in a
// vendored file; it cannot fail. This spec reconstructs the PRISTINE upstream
// bytes from each vendored copy - strip the provenance header block, invert the
// recorded import/type rewrites, invert the recorded intended divergences - and
// compares a sha256 against the manifest. A change that is in NEITHER list moves
// the hash and names the file.
//
// D-02 (11-CONTEXT.md) dropped the byte-pin: src/vendor/ MAY now be edited, and
// the compiler's emitted decay constants are the thing being edited. The pin was
// what stopped a BOTOR re-sync silently reverting a local fix, so it was not
// deleted, it was REPLACED: "the divergence must become a record, not an
// absence". The record is upstream-manifest.json's intendedDivergence, and the
// gate did not get weaker, it got more SPECIFIC - it now names which hunks are
// allowed and why, instead of allowing none.
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
// as step 6 of the sync procedure in src/vendor/botor/VENDOR.md. It carries the
// intendedDivergence rows forward rather than re-deriving them, because nothing
// in an upstream checkout can tell it what HANGAR deliberately changed.

const root = (file: string) => new URL(`../../../${file}`, import.meta.url);
const text = (file: string) => readFileSync(root(file), "utf8");

// D-01. Repeated here as a literal rather than read from the manifest: a test
// that took the expected value from the file under test would assert nothing.
const PINNED_BOTOR_SHA = "a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c";

// A DELTA is a mechanical rewrite forced by vendoring - an import specifier that
// cannot resolve in the flat vendor layout. It is not a decision; it is the cost
// of moving a file.
interface Delta {
  vendored: string;
  upstream: string;
}

// An INTENDED DIVERGENCE is a deliberate behaviour change HANGAR chose. It sits
// BESIDE deltas and never inside them, because conflating "we had to" with "we
// decided to" would lose the only distinction that makes the record worth
// keeping: a re-syncer must re-check a decision and need not re-check a path.
interface IntendedDivergence {
  vendored: string;
  upstream: string;
  reason: string;
  plan: string;
  dated: string;
}

interface FileEntry {
  vendored: string;
  upstream: string;
  bytes: number;
  sha256: string;
  deltas: Delta[];
  // Declared OPTIONAL on purpose. The field is REQUIRED by policy, and typing it
  // as required would make a manifest that lost the field a type error in a file
  // nobody type-checks on the way past. Optional here means the loss shows up as
  // a RED TEST naming the file - see "every intended divergence is justified".
  intendedDivergence?: IntendedDivergence[];
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

describe("vendored BOTOR files (D-04, D-02)", () => {
  it.each(vendoredPaths)(
    "%s is byte-identical to upstream once the recorded deltas and divergences are inverted",
    (vendored) => {
      const entry = entryFor(vendored);
      let body = splitHeader(vendored).body;

      // THE INVERSION ORDER, DERIVED - not chosen for symmetry.
      //
      // The vendored file is built as: upstream bytes -> apply the deltas ->
      // apply the intended divergences. That order is not a convention, it is
      // the physical order of the sync procedure: VENDOR.md's step 3 re-applies
      // the deltas to a freshly copied upstream file, and a divergence is
      // applied afterwards by a plan editing the file that step produced. So a
      // divergence's `vendored` text is quoted from the DELTA-ERA file, and a
      // delta's `vendored` text is quoted from the UPSTREAM file.
      //
      // Reconstruction is the inverse of a composition, so it runs LAST APPLIED,
      // FIRST INVERTED: divergences first, then deltas. Within one file the rows
      // are applied in array order, so they invert in REVERSE array order.
      //
      // The order is only OBSERVABLE where a divergence's text overlaps a
      // delta's, and it is proved there rather than argued: 11-03-SUMMARY.md
      // negative check 4 builds exactly that overlap and records that this order
      // reconstructs green while the swapped order reports the delta occurring
      // ZERO times.
      const divergences = entry.intendedDivergence ?? [];
      for (const divergence of [...divergences].reverse()) {
        // Exactly once, for the same reason deltas are. A divergence that
        // matched twice means the edit reached a site nobody recorded, and the
        // second site is then a silent, unjustified change to a GPLv3 file.
        expect(
          body.split(divergence.vendored).length - 1,
          `${vendored}: expected the intended divergence to occur exactly once. Recorded by plan ${divergence.plan} (${divergence.dated}), because: ${divergence.reason}\n  ${divergence.vendored}`,
        ).toBe(1);
        body = body.replace(divergence.vendored, divergence.upstream);
      }

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
        `${vendored}: reconstructed ${buf.length} bytes, upstream ${entry.upstream} is ${entry.bytes}. A change of ${buf.length - entry.bytes} bytes is in neither the delta list nor the intended-divergence list.`,
      ).toBe(entry.bytes);

      expect(
        createHash("sha256").update(buf).digest("hex"),
        `${vendored}: the reconstructed bytes do not hash to the recorded upstream sha256 for ${entry.upstream} at ${manifest.upstream.commit}. Something outside the provenance header, the recorded deltas and the recorded intended divergences was changed. D-02 permits editing this tree; it does not permit editing it SILENTLY. Either revert the change, or record it in upstream-manifest.json's intendedDivergence with a reason, a plan and a date. A fidelity bug is still a BOTOR bug (D-08): prefer fixing it upstream and re-syncing.`,
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
    //
    // Intended divergences are NOT capped by a count and deliberately so: a
    // delta is allowed by being on a closed list, a divergence is allowed by
    // carrying its own justification. Counting them would invite a reader to
    // bump the number instead of writing the sentence.
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

  it("every intended divergence is justified - VACUOUS over the rows while the table is empty, and not vacuous about the field", () => {
    // READ THIS BEFORE TRUSTING A GREEN RUN. The table is EMPTY as of plan
    // 11-03, which built the record and spent none of it; 11-04 is what puts
    // rows in it. The row loop at the bottom of this test therefore checks
    // NOTHING today, and a green run here is not evidence that the divergences
    // are justified - it is evidence that there are none.
    //
    // What IS checked at zero rows is the field's PRESENCE on every entry. That
    // is the half that cannot be vacuous, and it is the half that matters: a
    // manifest regenerated by a tool that does not know the field exists would
    // silently delete the whole record, and the next re-sync would revert every
    // recorded fix with nothing to say so.
    for (const entry of manifest.files) {
      expect(
        Array.isArray(entry.intendedDivergence),
        `${entry.vendored}: intendedDivergence must be written out as an array, empty if there is no divergence. A missing field is indistinguishable from a lost record. If scripts/record-upstream-manifest.mjs dropped it, that script is the bug.`,
      ).toBe(true);
    }

    const rows = manifest.files.flatMap((entry) =>
      (entry.intendedDivergence ?? []).map((row) => ({
        file: entry.vendored,
        row,
      })),
    );

    for (const { file, row } of rows) {
      const where = `${file}: intended divergence "${row.vendored.slice(0, 60)}"`;

      expect(
        row.vendored,
        `${where}: vendored text must not be empty`,
      ).not.toBe("");
      expect(
        row.upstream,
        `${where}: upstream text must not be empty`,
      ).not.toBe("");
      expect(
        row.vendored,
        `${where}: vendored and upstream text are identical, so this row records no divergence at all. Delete the row - the record is not a place to note that nothing changed.`,
      ).not.toBe(row.upstream);

      // A row that says only WHAT changed is a diff, and git already has that.
      // The whole value of the record is that a future re-syncer learns WHY,
      // and can therefore judge whether an upstream fix has retired the row.
      expect(
        row.reason?.trim().length ?? 0,
        `${where}: reason must be a sentence saying what behaviour changed and why. Got: ${JSON.stringify(row.reason)}`,
      ).toBeGreaterThan(20);

      // Narrow on purpose: every divergence this table could hold was chosen
      // inside phase 11 until plan 12.1-08b. A later phase that adds one
      // WIDENS this regex deliberately, in its own plan, rather than
      // inheriting a pattern loose enough that a typo passes. This is that
      // widening, by name and not by pattern: 12.1-08b's sixteen rows on
      // _pad.ts and pad-sim.ts (the touch handler emitting into HANGAR's
      // library and the simulator's mirror; 12.1-CONTEXT D-26 item 2, D-27).
      expect(
        row.plan,
        `${where}: plan must name the plan that chose this divergence, as "11-NN" or "12.1-08b". Got: ${JSON.stringify(row.plan)}`,
      ).toMatch(/^11-[0-9]{2}$|^12.1-08b$/);

      expect(
        row.dated,
        `${where}: dated must be an ISO calendar date (GPLv3 5(a) "a relevant date"). Got: ${JSON.stringify(row.dated)}`,
      ).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("VENDOR.md names the same upstream, lists every vendored file, and describes a merge", () => {
    const doc = text("src/vendor/botor/VENDOR.md");

    expect(doc).toContain("sabotond-dev/botor");
    expect(doc).toContain(manifest.upstream.commit);

    for (const entry of manifest.files) {
      const basename = entry.vendored.split("/").pop() as string;
      expect(doc, `VENDOR.md does not mention ${basename}`).toContain(basename);
    }

    // The sync procedure is now a MERGE against an enumerated divergence, not a
    // copy over an empty one. A VENDOR.md that stopped naming the record would
    // send a re-syncer through the old copy-and-verify procedure and revert
    // every recorded fix.
    expect(
      doc,
      "VENDOR.md must name upstream-manifest.json's intendedDivergence as the single authority on what HANGAR changed",
    ).toContain("intendedDivergence");

    // A placeholder left in the one document a re-syncer follows is worse than
    // no document at all.
    expect(doc).not.toContain("TBD");
  });
});
