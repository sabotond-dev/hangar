import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ModuleType, grid } from "@intechstudio/grid-protocol";
import { describe, expect, it } from "vitest";
import { FrameScanner, ZONA_HWCFG, decodeFrame } from "$lib/protocol";
import { STEP_IDS, type Capture } from "../capture";

// The post-checkpoint gate (FOUND-01 criterion 5, D-07).
//
// Every fixture-backed test written before the hardware checkpoint ran against
// synthetic-zona.json - real encode_packet bytes, invented content, invented
// timing - so that the whole phase could be built and proven with no ZONA on
// the desk. That sequencing is deliberate, and it has one cost: a repository
// full of green tests that had never seen a module.
//
// This file is what closes that gap. Test 1 cannot pass until a person has run
// docs/SKELETON-RUNBOOK.md against real hardware and the exported capture has
// been committed. It is the reason the phase cannot ship on synthetic evidence.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

const DIR = new URL("./", import.meta.url);
const DIR_PATH = fileURLToPath(DIR);

interface Fixture {
  file: string;
  capture: Capture;
}

const FIXTURES: Fixture[] = readdirSync(DIR_PATH)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => ({
    file,
    capture: JSON.parse(readFileSync(new URL(file, DIR), "utf8")) as Capture,
  }));

/**
 * The three committed hardware arms, selected by FILENAME rather than by
 * `source`. That is on purpose: the phase's negative check flips `source` to
 * `"synthetic"` in every one of them, and the point of that mutation is to
 * watch test 1 - the provenance gate - fail on its own. Selecting the arms by
 * their declared source here would make tests 2 to 4 iterate nothing, and a
 * vacuous pass or a second red both obscure what the mutation proved.
 */
const HARDWARE = FIXTURES.filter((f) => f.file.startsWith("zona-hardware"));

describe("the committed captures (FOUND-01 criterion 5)", () => {
  it("at least one committed capture came from real hardware", () => {
    expect(
      FIXTURES.length,
      "the fixtures directory is not empty",
    ).toBeGreaterThan(0);
    const real = FIXTURES.filter((f) => f.capture.source === "hardware");
    expect(
      real.map((f) => f.file),
      "no committed capture declares source: hardware - the phase cannot be " +
        "closed on synthetic evidence. Run docs/SKELETON-RUNBOOK.md.",
    ).not.toHaveLength(0);
    // And every one of them is a capture, not something that merely says so.
    for (const f of real) {
      expect(f.capture.schema, `${f.file} schema`).toBe(
        "hangar.skeleton.capture/1",
      );
      expect(f.capture.events.length, `${f.file} events`).toBeGreaterThan(20);
      expect(f.capture.run.protocolPin, `${f.file} pin`).toBe(
        "1.20260825.1135",
      );
    }
    // The synthetic capture is kept deliberately, so the suite still runs on a
    // machine with no ZONA attached. It must never claim to be evidence.
    const synthetic = FIXTURES.find((f) => f.file === "synthetic-zona.json");
    expect(synthetic?.capture.source, "the fallback stays labelled").toBe(
      "synthetic",
    );
  });

  it("the hardware capture identifies a ZONA the way the protocol package does", () => {
    expect(HARDWARE.length).toBeGreaterThan(0);
    for (const { file, capture } of HARDWARE) {
      const identity = capture.identity;
      expect(identity, `${file} records an identity`).toBeDefined();
      if (!identity) continue;
      // A NUMBER, not a string. module_type_from_hwcfg compares against
      // getProperty("HWCFG"), whose values are numeric-coerced at parse time,
      // so module_type_from_hwcfg("161") is undefined while (161) is "ZONA".
      expect(identity.hwcfg, `${file} hwcfg`).toBe(161);
      expect(identity.hwcfg, "and the constant agrees").toBe(ZONA_HWCFG);
      expect(
        grid.module_type_from_hwcfg(identity.hwcfg),
        `${file} is a ZONA by the package's own reckoning`,
      ).toBe(ModuleType.ZONA);
      // TYPE 1 is what a module flips to on USB connect, with no host
      // involvement. A 0 here would mean the frames came from a module
      // reached over the ribbon rather than over the cable.
      expect(identity.heartbeatType, `${file} heartbeat type`).toBe(1);
      expect(typeof identity.activePage, `${file} active page`).toBe("number");
      expect(identity.moduleType, `${file} module type`).toBe("ZONA");
    }
  });

  it("every recorded chunk from the module replays into a frame that decodes", () => {
    expect(HARDWARE.length).toBeGreaterThan(0);
    for (const { file, capture } of HARDWARE) {
      const recorded = capture.events.filter((e) => e.kind === "frame");
      expect(recorded.length, `${file} is worth replaying`).toBeGreaterThan(20);

      const scanner = new FrameScanner();
      const replayed: boolean[] = [];
      for (const event of capture.events) {
        if (event.dir !== "rx" || event.kind !== "chunk") continue;
        const bytes = Uint8Array.from(
          event.hex.match(/../g)?.map((b) => parseInt(b, 16)) ?? [],
        );
        for (const frame of scanner.push(bytes)) {
          replayed.push(decodeFrame(frame).ok);
        }
      }

      expect(
        replayed.length,
        `${file}: every recorded frame is reproduced from the real chunk ` +
          "boundaries a USB CDC link produced",
      ).toBe(recorded.length);
      expect(scanner.buffered, `${file}: nothing is left over`).toBe(0);
      // A recorded ok:false frame stays ok:false. A noisy cable is data, not a
      // bug, so the two arrays are compared rather than all-ok being demanded.
      expect(
        replayed,
        `${file}: the decode verdicts match the recording`,
      ).toEqual(recorded.map((e) => e.kind === "frame" && e.ok));
    }
  });

  it("the capture records the restore heartbeat as its own step", () => {
    expect(HARDWARE.length).toBeGreaterThan(0);
    let armsWithRestore = 0;
    for (const { file, capture } of HARDWARE) {
      expect(capture.steps.length, `${file} has steps`).toBeGreaterThan(0);
      for (const step of capture.steps) {
        expect(STEP_IDS, `${file}: "${step.id}" is a pinned step id`).toContain(
          step.id,
        );
      }
      const writes = capture.steps.filter((s) => s.id === "write-setup");
      const restores = capture.steps.filter(
        (s) => s.id === "restore-page-change",
      );
      // The restore rule, asserted per arm rather than as a closing step. A
      // successful CONFIG/EXECUTE clears page_change_enabled in firmware
      // (grid_decode.c:1279) and ONLY an inbound TYPE 255 heartbeat restores
      // it (:717); the firmware's own timeout restore is commented out. So the
      // invariant is one restore per config write, not one per capture - and
      // an arm that never wrote (the pace-0 probe is identify plus a burst)
      // correctly has neither. This is the same shape synthetic.spec.ts test 3
      // has asserted since wave 2, now pointed at real data.
      expect(
        restores.length,
        `${file}: one restore heartbeat per config write-back`,
      ).toBe(writes.length);
      for (const restore of restores) {
        expect(restore.outcome, `${file}: fire and forget`).toBe("sent");
      }
      if (restores.length > 0) armsWithRestore++;
    }
    expect(
      armsWithRestore,
      "at least one committed hardware arm actually exercised the restore",
    ).toBeGreaterThan(0);
  });
});
