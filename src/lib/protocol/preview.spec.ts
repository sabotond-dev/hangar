// Change 20's decoders (docs/MIRROR.md sections 1-4) against frames printed the way firmware prints
// them: a module header off the pinned encoder, class blocks from grid_led.c's record format,
// grid_ui.c's EVENTVIEW and grid_lua_api.c's MIDI, spliced as one event pass splices them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { grid } from "@intechstudio/grid-protocol";
import { describe, expect, it } from "vitest";
import {
  eventViewBlock,
  ledPreviewBlock,
  midiBlock,
  moduleFrame,
  setLeds,
  zonaResponder,
  type LedRecordSpec,
  type ZonaState,
} from "../transport/fixtures/synthetic";
import { decodeFrame, type DecodedClass } from "./decode";
import { encodeRequest, fetchLedPreview, hostHeartbeat } from "./descriptors";
import {
  LED_RECORD_CHARS,
  ZONA_LED_COUNT,
  ledPreviewRecords,
  sentMidi,
} from "./preview";

const ZONA = { sx: 0, sy: 0 };

/** Every class of one frame, through the shipped guard. */
function classesOf(frame: number[]): DecodedClass[] {
  const decoded = decodeFrame(frame);
  if (!decoded.ok) throw new Error(decoded.reason);
  return decoded.classes;
}

/** A distinct colour per hardware index, so a record landing on the wrong LED is visible. */
const pattern = (num: number): LedRecordSpec => ({
  num,
  r: (num * 3) % 256,
  g: (255 - num) % 256,
  b: (num * 7) % 256,
});

/** An outbound request as the fake module receives it: the bytes the page would write, decoded. */
function received(bytes: Uint8Array): DecodedClass {
  const frame = [...bytes];
  frame.pop(); // the terminator: the scanner hands frames on without it
  return classesOf(frame)[0];
}

describe("the mirror's decoders (change 20)", () => {
  it("a full LED report decodes to all 81 records, by hardware index, the package's first-record fields agreeing", () => {
    const leds = Array.from({ length: ZONA_LED_COUNT }, (_, num) =>
      pattern(num),
    );
    const [cls] = classesOf(
      moduleFrame(ZONA, [ledPreviewBlock("REPORT", leds)]),
    );
    expect(cls.class_name).toBe("LEDPREVIEW");
    expect(cls.class_instr).toBe("REPORT");
    expect(Number(cls.class_parameters.LENGTH)).toBe(
      ZONA_LED_COUNT * LED_RECORD_CHARS,
    );
    expect(ledPreviewRecords(cls)).toEqual(leds);
    // The package's table names the first record's four fields; the run is ours.
    expect(Number(cls.class_parameters.NUM)).toBe(leds[0].num);
    expect(Number(cls.class_parameters.RED)).toBe(leds[0].r);
    expect(Number(cls.class_parameters.GRE)).toBe(leds[0].g);
    expect(Number(cls.class_parameters.BLU)).toBe(leds[0].b);
  });

  it("one event pass's message - EVENTVIEW, a sent MIDI message, a LED EXECUTE - decodes class by class", () => {
    const changed = [pattern(8), pattern(40), pattern(80)];
    const classes = classesOf(
      moduleFrame(ZONA, [
        eventViewBlock({ page: 1, element: 0, event: 6, name: "" }),
        midiBlock({ ch: 0, cmd: 176, p1: 16, p2: 64 }),
        ledPreviewBlock("EXECUTE", changed),
      ]),
    );
    expect(classes.map((c) => `${c.class_name}/${c.class_instr}`)).toEqual([
      "EVENTVIEW/EXECUTE",
      "MIDI/EXECUTE",
      "LEDPREVIEW/EXECUTE",
    ]);
    expect(ledPreviewRecords(classes[2])).toEqual(changed);
    expect(sentMidi(classes[1])).toEqual({ ch: 0, cmd: 176, p1: 16, p2: 64 });
    expect(ledPreviewRecords(classes[0])).toBeUndefined();
    expect(sentMidi(classes[0])).toBeUndefined();
    expect(sentMidi(classes[2])).toBeUndefined();
  });

  it("a MIDI message the module RECEIVED (a REPORT) is not one it sent", () => {
    const [cls] = classesOf(
      moduleFrame(ZONA, [
        midiBlock({ ch: 2, cmd: 144, p1: 60, p2: 100 }, "REPORT"),
      ]),
    );
    expect(cls.class_name).toBe("MIDI");
    expect(cls.class_instr).toBe("REPORT");
    expect(sentMidi(cls)).toBeUndefined();
  });

  it("a record run is bounded by the bytes present, and an index past 81 or a non-hex record is never painted", () => {
    const [cls] = classesOf(
      moduleFrame(ZONA, [
        ledPreviewBlock("EXECUTE", [pattern(1), pattern(2), pattern(3)]),
      ]),
    );
    const raw = cls.raw ?? [];
    // A LENGTH that claims more than the block holds: only the whole records that are there.
    expect(
      ledPreviewRecords({
        ...cls,
        class_parameters: { ...cls.class_parameters, LENGTH: 9999 },
      }),
    ).toEqual([pattern(1), pattern(2), pattern(3)]);
    // A truncated block: two and a half records present, two read.
    expect(
      ledPreviewRecords({ ...cls, raw: raw.slice(0, 8 + 20) }),
    ).toHaveLength(2);
    // Index 0x51 (81) and a non-hex record dropped; the good one kept.
    const text = (s: string) => [...s].map((c) => c.charCodeAt(0));
    const doctored = {
      ...cls,
      raw: [
        ...raw.slice(0, 8),
        ...text("51ffffff"),
        ...text("zz000000"),
        ...text("05010203"),
      ],
      class_parameters: { ...cls.class_parameters, LENGTH: 24 },
    };
    expect(ledPreviewRecords(doctored)).toEqual([{ num: 5, r: 1, g: 2, b: 3 }]);
    // No raw block (a class built by hand) is not a picture; an empty report is an empty one.
    expect(ledPreviewRecords({ ...cls, raw: undefined })).toBeUndefined();
    const [empty] = classesOf(
      moduleFrame(ZONA, [ledPreviewBlock("REPORT", [])]),
    );
    expect(ledPreviewRecords(empty)).toEqual([]);
  });

  it("the protocol carries no touch coordinate: EVENT, EVENTVIEW and EVENTPREVIEW declare none", () => {
    // What the pinned package decodes for each class a touch could have ridden on. The firmware
    // reading is docs/MIRROR.md section 2; this pins the package's side of it.
    const [view] = classesOf(
      moduleFrame(ZONA, [
        eventViewBlock({ page: 0, element: 0, event: 6, name: "" }),
      ]),
    );
    expect(Object.keys(view.class_parameters).sort()).toEqual(
      [
        "ELEMENT",
        "EVENT",
        "LENGTH",
        "MAX1",
        "MIN1",
        "NAME",
        "PAGE",
        "VALUE1",
      ].sort(),
    );
    for (const name of ["EVENT", "EVENTVIEW", "EVENTPREVIEW"]) {
      const encoded = grid.encode_packet({
        brc_parameters: { DX: 0, DY: 0 },
        class_name: name,
        class_instr: "REPORT",
        class_parameters: {},
      });
      const frame = [...(encoded?.serial as number[])];
      const [cls] = classesOf(frame);
      for (const key of Object.keys(cls.class_parameters)) {
        expect(key, `${name} declares ${key}`).not.toMatch(
          /^(X|Y|TOUCH|CONTACT|ID)/,
        );
      }
    }
  });

  it("the full-report request is the Editor's FETCH, addressed to the ZONA, with no body and no filter", () => {
    const req = fetchLedPreview(0, 0);
    expect(req.filter).toBeUndefined();
    const { bytes } = encodeRequest(req);
    expect(bytes).toHaveLength(33);
    const cls = received(bytes);
    expect(cls.class_name).toBe("LEDPREVIEW");
    expect(cls.class_instr).toBe("FETCH");
    expect(cls.brc_parameters.DX).toBe(0);
    expect(cls.brc_parameters.DY).toBe(0);
    expect(String.fromCharCode(...(cls.raw ?? []))).toBe("042f");
  });

  it("the fake ZONA answers the FETCH with all 81 and a later editor heartbeat with only what moved", () => {
    const state: ZonaState = { ...ZONA, activePage: 0, configs: {} };
    setLeds(state, [pattern(4), pattern(76)]);
    const answer = zonaResponder(state);
    const heartbeat = received(encodeRequest(hostHeartbeat()).bytes);
    // The first heartbeat reports what moved since boot, then nothing is pending.
    const first = answer(heartbeat, 1).flatMap(classesOf);
    expect(first.flatMap((c) => ledPreviewRecords(c) ?? [])).toEqual([
      pattern(4),
      pattern(76),
    ]);
    expect(state.editorConnected).toBe(true);
    expect(answer(heartbeat, 2)).toEqual([]);
    const full = answer(received(encodeRequest(fetchLedPreview(0, 0)).bytes), 3)
      .flatMap(classesOf)
      .flatMap((c) => ledPreviewRecords(c) ?? []);
    expect(full).toHaveLength(ZONA_LED_COUNT);
    expect(full[4]).toEqual(pattern(4));
    expect(full[5]).toEqual({ num: 5, r: 0, g: 0, b: 0 });
    setLeds(state, [{ num: 5, r: 9, g: 9, b: 9 }]);
    expect(
      answer(heartbeat, 4)
        .flatMap(classesOf)
        .flatMap((c) => ledPreviewRecords(c) ?? []),
    ).toEqual([{ num: 5, r: 9, g: 9, b: 9 }]);
  });

  it("preview.ts imports nothing at runtime, so the mirror reaches it without the protocol package", () => {
    const source = readFileSync(
      new URL("./preview.ts", import.meta.url),
      "utf8",
    );
    const imports = [...source.matchAll(/^import .*$/gm)].map((m) => m[0]);
    expect(imports).toEqual([`import type { DecodedClass } from "./decode";`]);
  });
});
