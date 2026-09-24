import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EVENT_SETUP, EVENT_TIMER } from "./constants";
import {
  discardPage,
  fetchConfig,
  fetchLedPreview,
  fetchPageCount,
  fetchSerialNumber,
  hostHeartbeat,
  pageActive,
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
 *
 * AMENDMENT (Phase 7, plan 07-01). Test 4 counted four builders from the day
 * it was written. Phase 7 adds a fifth and last outbound instruction,
 * fetchSerialNumber - SERIALNUMBER/FETCH addressed to the module's own SX/SY,
 * never broadcast - because the durable snapshot behind PUT BACK needs a key
 * that names one module and survives a closed tab (07-CONTEXT D-04 amended),
 * and the browser refuses to expose the USB serial it keys its own grant on.
 * Test 4 is widened to five builders: the class set gains SERIALNUMBER and the
 * instruction set is unchanged at EXECUTE and FETCH. A widening, not a new
 * test; the file stays at five. The set is closed here at five: a sixth builder
 * would make this test fail, which is the point of it.
 *
 * AMENDMENT (Phase 13, plan 13-12; 13-CONTEXT D-06 and D-19). Phase 2's D-06
 * forbade the page-change class "forever" because a page change destroys the
 * module's Lua VM. Phase 13's D-06 - the user's decision, taken knowing that
 * cost - makes the page target SWITCH the hardware page, and D-19 retires
 * every HANGAR-invented capability limit the Editor does not have; the Editor
 * changes pages and discards a page. So three builders join the five and the
 * set is closed again at EIGHT: the page switch, the page-count fetch (Bible
 * section 9: enumerate, never assume four) and the page discard (the
 * firmware-native revert, unproven on hardware, no public control until the
 * bench). WHAT THIS FILE STILL FORBIDS, and why it is not weakened by
 * analogy: the NVM erase and the page clear are named by no shipped module
 * (test 1) - nothing in D-06 or D-19 asked for either, and a plan that wants
 * one must cite D-19 and ask. The page-change and page-discard classes are
 * now permitted in descriptors.ts ALONE (test 2): the one module that
 * encodes a packet is the one place a builder may name them, and every other
 * shipped module reaches them through the builders - so a second encoder or
 * a hand-built frame naming either class anywhere else is still a gate
 * failure, and the envelope (a click, the review, the ACK gate) cannot be
 * bypassed by a module that spells the class name itself. Test 3 is
 * unchanged: TYPE 254, the heartbeat that DISABLES page changes, is still
 * never sent. Test 4 is widened to eight builders; the instruction set is
 * unchanged at EXECUTE and FETCH. The file stays at five tests.
 *
 * AMENDMENT (change 20, 2026-09-24, docs/MIRROR.md). The live mirror asks the
 * module for its lights: LEDPREVIEW/FETCH, addressed to the ZONA, which raises
 * the module's LED change flags and answers with a report of all 81 - no
 * configuration, no page, no layer moves (grid_decode.c:739-756). It is a
 * read, so it joins the set rather than a forbidden list, and test 4 widens to
 * NINE builders: the class set gains LEDPREVIEW, the instruction set is still
 * EXECUTE and FETCH. Everything else the mirror sends is the existing TYPE 255
 * heartbeat; it sends no Lua, so no rx_mode switch exists to forbid. The file
 * stays at five tests.
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
const ERASE_AND_CLEAR = [["NVM", "ERASE"].join(""), ["PAGE", "CLEAR"].join("")];
/**
 * Permitted in the descriptor module ALONE since 13-12 (D-06, D-19). The
 * discard is in this list and not in ERASE_AND_CLEAR because D-06's last
 * clause asks for it by name; it is still forbidden everywhere else.
 */
const DESCRIPTORS_ONLY = [
  ["PAGE", "ACTIVE"].join(""),
  ["PAGE", "DISCARD"].join(""),
];

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

  it("the page-change and page-discard classes are built in the descriptor module and named nowhere else", () => {
    // Phase 2 forbade the page change "forever" because it destroys the
    // module's Lua VM; Phase 13's D-06 (the user, knowing that cost) switches
    // the hardware page, inside an envelope page-target.ts and
    // install.svelte.ts own. The class name may therefore appear in ONE
    // shipped module - the one that encodes packets - and, comments included,
    // in no other: a module that spelled the name itself would be one
    // uncommented line away from a frame that skips the click, the review
    // and the ACK gate. Both directions are asserted, so the test cannot pass
    // on a descriptor module that quietly dropped the builder.
    for (const needle of DESCRIPTORS_ONLY) {
      const naming = shipped()
        .filter((f) => f.source.includes(needle))
        .map((f) => f.rel);
      expect(
        naming,
        `${needle} is named outside the descriptor module`,
      ).toEqual(["src/lib/protocol/descriptors.ts"]);
    }
  });

  it("the heartbeat type that disables page changes is never sent", () => {
    expect(descriptorSource()).not.toMatch(/TYPE:\s*254/);
    expect(descriptorSource()).toMatch(/TYPE:\s*255/);
  });

  it("the builders produce only the nine instructions HANGAR is allowed to send", () => {
    const built = [
      hostHeartbeat(),
      fetchConfig(0, 0, 0, EVENT_SETUP),
      sendConfig(0, 0, 0, EVENT_TIMER, "x"),
      storePage(),
      fetchSerialNumber(0, 0),
      // Phase 13, plan 13-12 (D-06, D-19): the switch, the enumeration, the
      // firmware-native revert. Eight, and closed again.
      pageActive(0, 0, 1),
      fetchPageCount(0, 0),
      discardPage(),
      // Change 20: the mirror's full LED report. Nine, and closed again.
      fetchLedPreview(0, 0),
    ];
    expect([...new Set(built.map((r) => r.descr.class_name))].sort()).toEqual([
      "CONFIG",
      "HEARTBEAT",
      "LEDPREVIEW",
      ["PAGE", "ACTIVE"].join(""),
      "PAGECOUNT",
      ["PAGE", "DISCARD"].join(""),
      "PAGESTORE",
      "SERIALNUMBER",
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
