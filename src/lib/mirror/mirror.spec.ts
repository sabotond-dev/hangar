// The live mirror's store and picture (change 20, docs/MIRROR.md) against a fake session: what it
// writes on the click, while it runs and after it stops; what it reads, and from whom; the quiet
// rule; the serpentine against the vendored simulator's; and the source's closed vocabulary.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { hwToScreen } from "../../vendor/botor/pad-sim";
import { decodeFrame, type DecodedClass } from "$lib/protocol";
import {
  ledPreviewBlock,
  midiBlock,
  moduleFrame,
  type LedRecordSpec,
} from "$lib/transport/fixtures/synthetic";
import {
  applyLedRecords,
  MIRROR_FRAME_BYTES,
  MirrorEngine,
  screenCellOfLed,
} from "./frame";
import {
  MIRROR_HEARTBEAT_MS,
  MIRROR_SILENT_MS,
  MirrorStore,
  type MirrorLink,
} from "./mirror.svelte";

const ZONA = { sx: 0, sy: 0 };

/** Every class in one scanner-shaped frame. */
function classesOf(frame: number[]): DecodedClass[] {
  const decoded = decodeFrame(frame);
  if (!decoded.ok) throw new Error(decoded.reason);
  return decoded.classes;
}

/** A manual clock: timers run only when a test says so, in the order they were set. */
function fakeTimers() {
  let queue: { cb: () => void; ms: number; handle: number }[] = [];
  let next = 1;
  return {
    setTimer: (cb: () => void, ms: number) => {
      const handle = next++;
      queue.push({ cb, ms, handle });
      return handle;
    },
    clearTimer: (handle: unknown) => {
      queue = queue.filter((t) => t.handle !== handle);
    },
    /** Run every timer set so far that is at most `ms` long; the ones they set wait for the next call. */
    async run(ms = MIRROR_HEARTBEAT_MS): Promise<void> {
      const due = queue.filter((t) => t.ms <= ms);
      queue = queue.filter((t) => t.ms > ms);
      for (const t of due) t.cb();
      // Let the beats' awaited writes settle.
      for (let i = 0; i < 10; i++) await Promise.resolve();
    },
    get pending(): number {
      return queue.length;
    },
  };
}

/** A session with a ZONA on it: every write recorded, classes and a close pushed by the test. */
function fakeLink() {
  const writes: Uint8Array[] = [];
  const classSinks = new Set<(cls: DecodedClass) => void>();
  const connectionSinks = new Set<(ev: "connected" | "closed") => void>();
  let failNext = 0;
  const link: { -readonly [K in keyof MirrorLink]: MirrorLink[K] } = {
    phase: "connected",
    identity: { zona: ZONA, activePage: 1 },
    transport: {
      write: async (data: Uint8Array) => {
        if (failNext > 0) {
          failNext--;
          throw new Error("The port is busy: another write is still in flight");
        }
        writes.push(data);
      },
    },
    onClass(cb) {
      classSinks.add(cb);
      return () => classSinks.delete(cb);
    },
    onConnection(cb) {
      connectionSinks.add(cb);
      return () => connectionSinks.delete(cb);
    },
  };
  return {
    link,
    writes,
    /** Each write, decoded: `CLASS/INSTR` and the class, as the fake module would read it. */
    decoded(): { key: string; cls: DecodedClass }[] {
      return writes.map((bytes) => {
        const frame = [...bytes];
        frame.pop();
        const [cls] = classesOf(frame);
        return { key: `${cls.class_name}/${cls.class_instr}`, cls };
      });
    },
    feed(frame: number[]): void {
      for (const cls of classesOf(frame))
        for (const sink of classSinks) sink(cls);
    },
    close(): void {
      link.transport = undefined;
      link.phase = "unplugged-while-connected";
      for (const sink of connectionSinks) sink("closed");
    },
    failWrites(n: number): void {
      failNext = n;
    },
    get listeners(): number {
      return classSinks.size + connectionSinks.size;
    },
  };
}

function harness(quiet: () => boolean = () => false) {
  const timers = fakeTimers();
  const zona = fakeLink();
  const store = new MirrorStore({
    link: zona.link,
    quiet,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
  });
  return { timers, zona, store };
}

/** A distinct colour per hardware index. */
const pattern = (num: number): LedRecordSpec => ({
  num,
  r: (num * 3) % 256,
  g: (200 - num) % 256,
  b: (num * 5) % 256,
});

describe("the live mirror (change 20)", () => {
  it("the click writes one TYPE 255 heartbeat, then one LED report request addressed to the ZONA - and nothing else", async () => {
    const { zona, store } = harness();
    expect(store.available).toBe(true);
    await store.start();
    expect(store.state).toBe("on");
    const sent = zona.decoded();
    expect(sent.map((s) => s.key)).toEqual([
      "HEARTBEAT/EXECUTE",
      "LEDPREVIEW/FETCH",
    ]);
    expect(Number(sent[0].cls.class_parameters.TYPE)).toBe(255);
    expect(sent[0].cls.brc_parameters.DX).toBe(-127);
    expect(sent[0].cls.brc_parameters.DY).toBe(-127);
    expect(sent[1].cls.brc_parameters.DX).toBe(ZONA.sx);
    expect(sent[1].cls.brc_parameters.DY).toBe(ZONA.sy);
    store.stop();
  });

  it("it keeps the module an editor with one heartbeat per period, asks for the full report once, and sends nothing once off", async () => {
    const { timers, zona, store } = harness();
    await store.start();
    for (let i = 0; i < 5; i++) await timers.run();
    expect(zona.decoded().map((s) => s.key)).toEqual([
      "HEARTBEAT/EXECUTE",
      "LEDPREVIEW/FETCH",
      ...Array<string>(5).fill("HEARTBEAT/EXECUTE"),
    ]);
    store.stop();
    expect(store.state).toBe("off");
    expect(timers.pending, "no beat and no silence timer left").toBe(0);
    const before = zona.writes.length;
    await timers.run(MIRROR_SILENT_MS);
    expect(zona.writes.length, "the restore is silence").toBe(before);
    expect(zona.listeners, "both subscriptions released").toBe(0);
  });

  it("the ZONA's lights land in screen order, whole and changed-only alike, and a neighbour's never paint", async () => {
    const { zona, store } = harness();
    let frames = 0;
    store.onFrame(() => frames++);
    await store.start();
    const framesAtStart = frames;
    const all = Array.from({ length: 81 }, (_, num) => pattern(num));
    zona.feed(moduleFrame(ZONA, [ledPreviewBlock("REPORT", all)]));
    const expected = new Uint8Array(MIRROR_FRAME_BYTES);
    applyLedRecords(expected, all);
    expect([...store.engine.frame]).toEqual([...expected]);
    expect(store.lit).toBe(true);
    // An event pass's EXECUTE moves one LED; hardware 0 is the top row's right-hand end.
    zona.feed(
      moduleFrame(ZONA, [
        ledPreviewBlock("EXECUTE", [{ num: 0, r: 1, g: 2, b: 3 }]),
      ]),
    );
    expect([...store.engine.frame.slice(8 * 3, 8 * 3 + 3)]).toEqual([1, 2, 3]);
    expect(frames - framesAtStart).toBe(2);
    // Another module on the cable reports its own LEDs: not ours.
    const snapshot = [...store.engine.frame];
    zona.feed(
      moduleFrame({ sx: 1, sy: 0 }, [
        ledPreviewBlock("REPORT", [{ num: 0, r: 99, g: 99, b: 99 }]),
      ]),
    );
    expect([...store.engine.frame]).toEqual(snapshot);
    expect(frames - framesAtStart).toBe(2);
    store.stop();
  });

  it("the MIDI the ZONA sent is logged; a message it received and a neighbour's are not", async () => {
    const { zona, store } = harness();
    await store.start();
    zona.feed(
      moduleFrame(ZONA, [
        midiBlock({ ch: 0, cmd: 176, p1: 16, p2: 64 }),
        midiBlock({ ch: 1, cmd: 144, p1: 60, p2: 100 }, "REPORT"),
      ]),
    );
    zona.feed(
      moduleFrame({ sx: 1, sy: 0 }, [
        midiBlock({ ch: 5, cmd: 176, p1: 1, p2: 2 }),
      ]),
    );
    expect(store.midi).toEqual([{ ch: 0, cmd: 176, p1: 16, p2: 64, mode: 0 }]);
    const first = store.midi;
    store.stop();
    await store.start();
    expect(store.midi, "a fresh log on every click").not.toBe(first);
    expect(store.midi).toEqual([]);
    store.stop();
  });

  it("while the install store owns the port it sends nothing, and the next free beat sends the heartbeat and the request", async () => {
    let busy = true;
    const { timers, zona, store } = harness(() => busy);
    await store.start();
    await timers.run();
    await timers.run();
    expect(zona.writes).toHaveLength(0);
    busy = false;
    await timers.run();
    expect(zona.decoded().map((s) => s.key)).toEqual([
      "HEARTBEAT/EXECUTE",
      "LEDPREVIEW/FETCH",
    ]);
    store.stop();
  });

  it("a write that fails is dropped and the next beat tries again, the request included", async () => {
    const { timers, zona, store } = harness();
    zona.failWrites(1);
    await store.start();
    expect(zona.writes).toHaveLength(0);
    await timers.run();
    expect(zona.decoded().map((s) => s.key)).toEqual([
      "HEARTBEAT/EXECUTE",
      "LEDPREVIEW/FETCH",
    ]);
    store.stop();
  });

  it("a disconnect switches it off, and nothing is written after", async () => {
    const { timers, zona, store } = harness();
    await store.start();
    const before = zona.writes.length;
    zona.close();
    expect(store.state).toBe("off");
    await timers.run();
    await timers.run(MIRROR_SILENT_MS);
    expect(zona.writes.length).toBe(before);
    expect(store.available).toBe(false);
  });

  it("it cannot start without a connected ZONA, and says so when no report comes", async () => {
    const idle = harness();
    idle.zona.link.phase = "idle";
    await idle.store.start();
    expect(idle.store.state).toBe("off");
    expect(idle.zona.writes).toHaveLength(0);

    const { timers, store } = harness();
    await store.start();
    expect(store.silent).toBe(false);
    await timers.run(MIRROR_SILENT_MS);
    expect(store.silent).toBe(true);
    store.stop();
  });

  it("the serpentine is the vendored simulator's at every index, and the engine keeps its picture through a reset", () => {
    for (let num = 0; num < 81; num++) {
      const { x, y } = hwToScreen(num);
      expect(screenCellOfLed(num), `hardware ${num}`).toBe(y * 9 + x);
    }
    const engine = new MirrorEngine();
    applyLedRecords(engine.frame, [{ num: 40, r: 7, g: 8, b: 9 }]);
    engine.reset();
    engine.run();
    engine.tick();
    expect([...engine.frame.slice(40 * 3, 40 * 3 + 3)]).toEqual([7, 8, 9]);
    expect(engine.animating).toBe(false);
    expect(engine.pendingTouches).toBe(0);
  });

  it("the source sends through two builders only and reaches no heavy module at load", () => {
    const source = readFileSync(
      new URL("./mirror.svelte.ts", import.meta.url),
      "utf8",
    );
    const code = source.replace(/^\s*\/\/.*$/gm, "");
    // What it builds: the heartbeat and the full-report request, nothing that writes a slot.
    for (const needle of [
      "sendConfig",
      "storePage",
      "pageActive",
      "discardPage",
      "fetchConfig",
      "PAGESTORE",
      "grxm",
      "rx_mode",
      "EVALUATE",
      "IMMEDIATE",
    ]) {
      expect(code.includes(needle), `mirror.svelte.ts names ${needle}`).toBe(
        false,
      );
    }
    // Static specifiers: the two permitted device singletons, the zero-import decoder, the picture.
    const specifiers = [...code.matchAll(/^import [^;]*? from "([^"]+)";/gm)]
      .map((m) => m[1])
      .sort();
    expect(specifiers).toEqual([
      "$lib/device/install.svelte",
      "$lib/device/session.svelte",
      "$lib/protocol/preview",
      "./frame",
    ]);
    const frameSource = readFileSync(
      new URL("./frame.ts", import.meta.url),
      "utf8",
    );
    expect(
      [...frameSource.matchAll(/^import (?!type ).*$/gm)],
      "frame.ts imports types only",
    ).toEqual([]);
  });
});
