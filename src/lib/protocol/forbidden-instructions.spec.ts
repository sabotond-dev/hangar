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
 * The shipped library source: every .ts under src/lib that ends up in the
 * bundle, minus the specs (which must be able to NAME what they forbid) and
 * minus recorded fixtures (which are captured wire bytes, not authored code).
 *
 * AMENDMENT (Phase 6, plan 06-05). This scan covered src/lib/protocol and
 * src/lib/transport only, from the day it was written. src/lib/device/ - the
 * directory that would do the writing if this site were ever wrong about
 * itself - has been outside it since Phase 4 wrote try-on.ts, and
 * 04-first-experience/deferred-items.md carried that gap forward from plans
 * 04-04 and 04-07. A phase whose whole promise is "this never writes" is where
 * it ends: the scan reads all of src/lib now, which takes it from 16 files to
 * 65 at this commit with no new match (descriptors.ts is still the only file
 * naming encode_packet, and no file names an erase or clear instruction).
 * src/vendor/ is not under src/lib and is unaffected. Read comments and all,
 * on purpose: the subject is the vocabulary the codebase may contain, and a
 * forbidden name in a comment is one uncomment away from being revived.
 * Components are .svelte and are not read here - a stated limit rather than
 * an exemption, recorded in the phase's deferred items.
 */
const SCANNED_DIRS = ["src/lib"];

const shipped = (): { rel: string; source: string }[] => {
  const out: { rel: string; source: string }[] = [];
  for (const dir of SCANNED_DIRS) {
    const root = repo(dir);
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
