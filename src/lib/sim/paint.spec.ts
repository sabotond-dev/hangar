// The painter, proven by a recording stub rather than by a promise.
//
// The four prohibitions in 04-UI-SPEC "The pad" are the kind of rule that a
// header comment cannot enforce: a later hand adds a clearRect "to be safe" or a
// drawImage "to scale it", and nothing goes red. Test 4 therefore iterates a
// counter object, so a technique added later is caught without this spec being
// edited.
//
// Runs in node with no canvas: paintPad takes a context, so a plain object with
// the right five methods is a complete test double.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { GRID_SIDE, createScratch, paintPad } from "./paint";

const CELLS = GRID_SIDE * GRID_SIDE;

type Stub = CanvasRenderingContext2D & {
  calls: Record<string, number>;
  puts: ImageData[];
};

/** A 2D context that records what was asked of it and draws nothing. */
function stubCtx(): Stub {
  const calls: Record<string, number> = {
    putImageData: 0,
    drawImage: 0,
    fillRect: 0,
    strokeRect: 0,
    clearRect: 0,
    createPattern: 0,
    createImageData: 0,
  };
  const puts: ImageData[] = [];
  const ctx = {
    calls,
    puts,
    createImageData: (w: number, h: number) => {
      calls.createImageData++;
      return {
        width: w,
        height: h,
        data: new Uint8ClampedArray(w * h * 4),
      } as ImageData;
    },
    putImageData: (data: ImageData) => {
      calls.putImageData++;
      puts.push(data);
    },
    drawImage: () => {
      calls.drawImage++;
    },
    fillRect: () => {
      calls.fillRect++;
    },
    strokeRect: () => {
      calls.strokeRect++;
    },
    clearRect: () => {
      calls.clearRect++;
    },
    createPattern: () => {
      calls.createPattern++;
      return null;
    },
  };
  return ctx as unknown as Stub;
}

/** A PadSim frame: 243 bytes, screen order, RGB, all cells dark. */
function darkFrame(): Uint8Array {
  return new Uint8Array(CELLS * 3);
}

function light(frame: Uint8Array, cell: number, rgb: [number, number, number]) {
  frame[cell * 3] = rgb[0];
  frame[cell * 3 + 1] = rgb[1];
  frame[cell * 3 + 2] = rgb[2];
}

describe("the pad painter (src/lib/sim/paint.ts)", () => {
  it("writes an unlit cell at alpha 0 so the dot field shows through", () => {
    const ctx = stubCtx();
    const scratch = createScratch(ctx);
    paintPad(ctx, darkFrame(), scratch);
    // Layer 1 of the pad is a CSS dot field and layer 3 is a CSS gutter grid.
    // An opaque black cell would hide both, and the pad would still look
    // plausible on screen - which is why this is a test and not an eyeball.
    for (let n = 0; n < CELLS; n++) {
      expect(scratch.data[n * 4 + 3], "cell " + n + " is dark").toBe(0);
    }
  });

  it("writes a lit cell with its exact colour at alpha 255", () => {
    const ctx = stubCtx();
    const scratch = createScratch(ctx);
    const frame = darkFrame();
    light(frame, 0, [214, 255, 78]);
    light(frame, 80, [1, 0, 0]);
    paintPad(ctx, frame, scratch);
    expect(Array.from(scratch.data.slice(0, 4)), "cell 0").toEqual([
      214, 255, 78, 255,
    ]);
    // One non-zero channel of three is still lit: the simulator emitted it.
    expect(
      Array.from(scratch.data.slice(80 * 4, 80 * 4 + 4)),
      "cell 80",
    ).toEqual([1, 0, 0, 255]);
  });

  it("maps cell n to pixel n, with no transposition and no offset", () => {
    const ctx = stubCtx();
    const scratch = createScratch(ctx);
    const frame = darkFrame();
    light(frame, 40, [10, 20, 30]);
    paintPad(ctx, frame, scratch);
    const lit: number[] = [];
    for (let n = 0; n < CELLS; n++) {
      if (scratch.data[n * 4 + 3] !== 0) lit.push(n);
    }
    expect(lit, "exactly the centre cell is opaque").toEqual([40]);
    expect(Array.from(scratch.data.slice(40 * 4, 40 * 4 + 3))).toEqual([
      10, 20, 30,
    ]);
  });

  it("issues exactly one draw call and none of the forbidden ones", () => {
    const ctx = stubCtx();
    const scratch = createScratch(ctx);
    // createScratch legitimately calls createImageData once, so the counters
    // are zeroed after it: what is being measured is one paint, not the setup.
    for (const key of Object.keys(ctx.calls)) ctx.calls[key] = 0;
    paintPad(ctx, darkFrame(), scratch);
    expect(ctx.calls.putImageData, "one putImageData per pad per paint").toBe(
      1,
    );
    for (const [name, count] of Object.entries(ctx.calls)) {
      if (name === "putImageData") continue;
      expect(count, "paintPad called " + name).toBe(0);
    }
  });

  it("reuses one ImageData across paints instead of allocating per frame", () => {
    const ctx = stubCtx();
    const scratch = createScratch(ctx);
    paintPad(ctx, darkFrame(), scratch);
    paintPad(ctx, darkFrame(), scratch);
    expect(ctx.calls.createImageData, "created once, at setup").toBe(1);
    expect(ctx.puts).toHaveLength(2);
    expect(ctx.puts[1], "the same object both times").toBe(ctx.puts[0]);
    expect(ctx.puts[0], "and it is the caller's scratch").toBe(scratch);
  });
});
