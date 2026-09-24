// Mirror ZONA's interface (change 20, docs/MIRROR.md section 6): the toggle exists only while a
// ZONA is connected and says its state through aria-pressed; the status line's three forms; the
// two monitors' labels while they read the module; and the two routes' wiring - the plate handed
// to the mirror's engine and back, the pointer refused, the mirror ended on leaving.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import { session } from "$lib/device/session.svelte";
import {
  MIRROR_CANNOT,
  MIRROR_HELPER,
  MIRROR_LABEL,
  MIRROR_MONITOR_SOURCE,
  MIRROR_MONITOR_STATUS,
  MIRROR_PLAY_MONITOR,
  mirrorStatus,
} from "$lib/mirror/copy";
import { mirror } from "$lib/mirror/mirror.svelte";
import { MONITOR_SOURCE, MONITOR_STATUS } from "$lib/tune/inspector-copy";
import MidiMonitor from "./MidiMonitor.svelte";
import MirrorToggle from "./MirrorToggle.svelte";
import PlayMonitor from "./sandbox/PlayMonitor.svelte";

const root = (rel: string) => new URL(`../../../${rel}`, import.meta.url);
const text = (rel: string) => readFileSync(root(rel), "utf8");

describe("Mirror ZONA's interface (change 20)", () => {
  it("the toggle exists only while a ZONA is connected, is one outlined box, and says its state through aria-pressed", () => {
    const was = session.phase;
    try {
      for (const phase of ["starting", "idle", "detected", "unsupported"]) {
        session.phase = phase as typeof session.phase;
        expect(render(MirrorToggle).body, phase).not.toContain(
          'data-testid="mirror-toggle"',
        );
      }
      session.phase = "connected";
      const off = render(MirrorToggle).body;
      expect(off).toContain('data-testid="mirror-toggle"');
      expect(off).toContain('aria-pressed="false"');
      expect(off).toContain(MIRROR_LABEL);
      expect(off).toContain(`title="${MIRROR_HELPER}"`);
      mirror.state = "on";
      const on = render(MirrorToggle).body;
      expect(on).toContain('aria-pressed="true"');
      expect(on, "the words do not change with the state").toContain(
        MIRROR_LABEL,
      );
    } finally {
      mirror.state = "off";
      session.phase = was;
    }
    const source = text("src/lib/ui/MirrorToggle.svelte");
    expect(source).not.toMatch(/border-radius|rounded/);
  });

  it("the status line counts pages from one and says when the lights have not come", () => {
    expect(mirrorStatus(1, true, false)).toBe("Mirroring ZONA · page 2");
    expect(mirrorStatus(0, false, false)).toBe(
      "Mirroring ZONA · page 1 · waiting for its lights",
    );
    expect(mirrorStatus(3, false, true)).toBe(
      "Mirroring ZONA · page 4 · no lights reported",
    );
    expect(mirrorStatus(undefined, true, false)).toBe("Mirroring ZONA");
    expect(MIRROR_CANNOT).toContain("does not report where your fingers are");
  });

  it("the monitors name the ZONA as their source while mirroring, and the preview otherwise", () => {
    const zona = [{ ch: 0, cmd: 176, p1: 16, p2: 64, mode: 0 }];
    const bar = render(MidiMonitor, {
      props: {
        source: () => zona,
        sourceLabel: MIRROR_MONITOR_SOURCE,
        status: MIRROR_MONITOR_STATUS,
      },
    }).body;
    expect(bar).toContain(MIRROR_MONITOR_STATUS);
    expect(bar).not.toContain(MONITOR_STATUS);
    const plain = render(MidiMonitor, { props: { source: () => [] } }).body;
    expect(plain).toContain(MONITOR_STATUS);
    // The source column renders only with rows, which a server render never samples; the prop is
    // what the row's cell prints (MidiMonitor.svelte), read from the source.
    expect(text("src/lib/ui/MidiMonitor.svelte")).toContain(
      "<td>{sourceLabel}</td>",
    );
    expect(text("src/lib/ui/MidiMonitor.svelte")).toContain(
      "sourceLabel = MONITOR_SOURCE",
    );
    expect(MONITOR_SOURCE).not.toBe(MIRROR_MONITOR_SOURCE);
    const play = render(PlayMonitor, {
      props: { source: () => [], title: MIRROR_PLAY_MONITOR },
    }).body;
    expect(play).toContain(MIRROR_PLAY_MONITOR);
  });

  it("both routes hand the plate to the mirror's engine and back, refuse the pointer, and end the mirror on leaving", () => {
    for (const [route, id] of [
      ["src/routes/playground/[id]/+page.svelte", "listed.id"],
      ["src/routes/sandbox/[draftId]/+page.svelte", "PREVIEW_ID"],
    ] as const) {
      const source = text(route);
      expect(source, route).toContain("<MirrorToggle />");
      expect(source, route).toContain(`replaceEngine(${id}, mirror.engine)`);
      expect(source, route).toContain("mirroring ? mirror.engine : engine");
      expect(source, route).toMatch(/invalidate\((listed\.id|PREVIEW_ID)\)/);
      expect(source, route).toContain("|| mirroring) return;");
      expect(source, route).toContain("mirror.stop();");
      expect(source, route).toContain('data-testid="mirror-status"');
      expect(source, route).toContain("data-mirror={mirror.state}");
    }
    // The Sandbox's toggle is Play's alone: Edit's plate is the editor.
    expect(text("src/routes/sandbox/[draftId]/+page.svelte")).toMatch(
      /\{#if play\}\s*<MirrorToggle \/>\s*\{\/if\}/,
    );
  });
});
