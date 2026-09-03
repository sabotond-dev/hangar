import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EVENT_SETUP, EVENT_TIMER } from "./constants";
import {
  fetchConfig,
  hostHeartbeat,
  sendConfig,
  storePage,
} from "./descriptors";

const repo = (rel: string) =>
  fileURLToPath(new URL(`../../../${rel}`, import.meta.url));

/**
 * The shipped protocol and transport source: every .ts that ends up in the
 * bundle, minus the specs (which must be able to NAME what they forbid) and
 * minus recorded fixtures (which are captured wire bytes, not authored code).
 */
const SCANNED_DIRS = ["src/lib/protocol", "src/lib/transport"];

const shipped = (): { rel: string; source: string }[] => {
  const out: { rel: string; source: string }[] = [];
  for (const dir of SCANNED_DIRS) {
    const root = repo(dir);
    // src/lib/transport/ arrives in a later plan of this phase.
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root, { recursive: true })) {
      const rel = String(entry).split(sep).join("/");
      if (!rel.endsWith(".ts")) continue;
      if (rel.endsWith(".spec.ts")) continue;
      if (rel.split("/").includes("fixtures")) continue;
      out.push({
        rel: `${dir}/${rel}`,
        source: readFileSync(join(root, String(entry)), "utf8"),
      });
    }
  }
  return out;
};

// Assembled from fragments so this spec's own source does not contain the
// literals it forbids - a future rule can scan this file without excluding it.
const ERASE_AND_CLEAR = [
  ["NVM", "ERASE"].join(""),
  ["PAGE", "CLEAR"].join(""),
  ["PAGE", "DISCARD"].join(""),
];
const PAGE_CHANGE = ["PAGE", "ACTIVE"].join("");

const descriptorSource = () =>
  readFileSync(repo("src/lib/protocol/descriptors.ts"), "utf8");

describe("forbidden instructions (D-06)", () => {
  it("no shipped module names an erase or clear instruction", () => {
    const files = shipped();
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      for (const needle of ERASE_AND_CLEAR) {
        expect(
          file.source.includes(needle),
          `${file.rel} names a forbidden instruction`,
        ).toBe(false);
      }
    }
  });

  it("the descriptor module cannot build a page change", () => {
    // A page change destroys the module's Lua VM. It is forbidden forever, and
    // the name must not appear even in a comment, so nothing can be revived by
    // uncommenting it.
    expect(descriptorSource().includes(PAGE_CHANGE)).toBe(false);
  });

  it("the heartbeat type that disables page changes is never sent", () => {
    expect(descriptorSource()).not.toMatch(/TYPE:\s*254/);
    expect(descriptorSource()).toMatch(/TYPE:\s*255/);
  });

  it("the builders produce only the four instructions this phase is allowed to send", () => {
    const built = [
      hostHeartbeat(),
      fetchConfig(0, 0, 0, EVENT_SETUP),
      sendConfig(0, 0, 0, EVENT_TIMER, "x"),
      storePage(),
    ];
    expect([...new Set(built.map((r) => r.descr.class_name))].sort()).toEqual([
      "CONFIG",
      "HEARTBEAT",
      "PAGESTORE",
    ]);
    expect([...new Set(built.map((r) => r.descr.class_instr))].sort()).toEqual([
      "EXECUTE",
      "FETCH",
    ]);
  });

  it("only the descriptor module encodes a packet", () => {
    const encoders = shipped().filter((f) =>
      f.source.includes("encode_packet"),
    );
    expect(encoders.map((f) => f.rel)).toEqual([
      "src/lib/protocol/descriptors.ts",
    ]);
  });
});
