// The ported presets' MIDI outputs, RX and latch, WRAPPED ON HANGAR'S SIDE (change 17C,
// BENCH-2026-09-16.txt section 17; docs/MIDI.md section 8). The vendored compiler
// (src/vendor/botor/_pad.ts) is read-only and knows one controller per axis on one channel, so a
// wrapped card keeps its `preset` source and its PadSim preview - it stays on the front door's
// ring - and its compiled pair is rewritten HERE, after the compile and before the brightness
// scaling, on the way to the meters and the wire:
//
//   compile(state) -> template(setup, timer) -> the output knobs' literals for their tokens -> scale
//
// A template finds each send the compiler wrote for the card's shipped Send and Channel (both
// superseded, so the compiler always writes the shelf's 16 / 17 on channel 0) and puts the
// output's tokens in its place through one Setup local `M` - the Lua recipe of docs/MIDI.md
// section 5 - then appends the card's `self.midirx_cb`, guarded on the touch callback it was made
// beside. Every find is EXACT: it names the whole call it replaces and throws unless it occurs
// exactly the expected number of times, and no `gms(` may survive the rewrite, so a compiler
// change that moves a send is a thrown error in ported-midi.spec.ts and the sweeps, never a
// silently unrewritten wire. The inserted text is canonical (compressScript leaves it alone), so a
// wrapped Setup keeps the compiled string's one-character-per-action rule (wire-pin.spec.ts).
//
// WHAT THE PREVIEW SHOWS: the vendored PadSim runs the PadState, not this Lua, so the browser
// paints exactly what the compiled preset paints - which is what the module paints, because the
// rewrite touches no LED call: a wrapped card's picture under every gesture is the preset's. Its
// sends differ only in their bytes, and a compiler-driven preview keeps no MIDI log (the monitor
// bar is absent, sim/monitor.ts), so nothing on the page claims a message. The receive is the
// module's alone: no MIDI reaches any browser preview. The five wrapped cards were already
// latched (the first finger claims `s.f`), so the latch is not a preview question here; the two
// cards whose latch changes what a slide does (FOUR FADERS, NINE PADS) are rebuilt as Lua cards
// instead (entries/faders.ts, entries/ninepads.ts), where the preview runs the real Lua.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { CatalogEntry, LuaKnob, MidiOutput } from "../types";
import {
  CHANNEL_VALUES,
  CONTINUOUS_STATUSES,
  RECEIVE_ON_INDEX,
  RECEIVE_VALUES,
  numberValues,
} from "../../tune/midi";

/** A compiled pair in, the same pair with the output tokens in place out. Throws on a miss. */
export type WrapTemplate = (
  setup: string,
  timer: string,
) => { setup: string; timer: string };

/** One wrapped card: its output knobs, its outputs, the shelf knobs they take over, its template. */
export type PresetMidi = {
  readonly knobs: readonly LuaKnob[];
  readonly outputs: readonly MidiOutput[];
  readonly supersedes: readonly string[];
  readonly template: WrapTemplate;
};

/** The rewrite's one error: which card, which find, how many were found. */
export class WrapMissError extends Error {
  constructor(card: string, find: string, found: number, wanted: number) {
    super(
      `${card}: the wrap expected ${wanted} of ${JSON.stringify(find)} in the compiled Lua and found ${found}`,
    );
    this.name = "WrapMissError";
  }
}

const count = (haystack: string, needle: string): number =>
  haystack.split(needle).length - 1;

/** `find` replaced where it occurs, which must be exactly `wanted` times. */
function exactly(
  card: string,
  text: string,
  find: string,
  replace: string,
  wanted = 1,
): string {
  const found = count(text, find);
  if (found !== wanted) throw new WrapMissError(card, find, found, wanted);
  return text.split(find).join(replace);
}

/** No compiled send may survive a card's rewrite: the one `gms(` left is `M`'s own. */
function noSendLeft(card: string, setup: string, timer: string): void {
  const left = count(setup, "gms(") + count(timer, "gms(");
  if (left !== 1) throw new WrapMissError(card, "gms(", left, 1);
}

/**
 * The send, a Setup local every rewritten call goes through: `t` the output's status byte, `c` its
 * channel, `n` its number, `o` the value - a controller `n, o`, a pitch bend `0, o` (7-bit: 64 the
 * centre), a channel pressure `o, 0` (docs/MIDI.md section 2). RADAR's `M`, byte for byte.
 */
const M =
  "local function M(t,c,n,o)self:gms(c,t,t==208 and o or t>223 and 0 or n,t==208 and 0 or o)end ";

/** Where `M` goes: right before the touch callback it serves, which the compiler writes once. */
const TOUCH = "self.touch_cb=function(";

/**
 * The matcher of a receiving pair (RADAR's, docs/MIDI.md section 5): `f(r,t,c,n)` is the value when
 * the message is the host's (`e[1]` the header's INSTR, the Receive knob's literal) on the output's
 * type, channel and - a controller - number, else false. `v[t//16%3+2]`: the second data byte for a
 * controller or a pitch bend, the first for a channel pressure.
 */
const MATCH =
  "local function f(r,t,c,n)return e[1]==r and v[2]==t and v[1]==c and(t>207 or v[3]==n)and v[t//16%3+2]end ";

/**
 * A receiving X / Y pair, appended to the Setup: the callback is made beside this landing's touch
 * callback (`k`) and answers only while that is still the element's, so a later landing's module
 * never reaches it. A host value on an axis's output sets that axis of the held pair (`s.u`, `s.w`,
 * the centre until one arrives) and `draw` shows the pair; nothing is sent back.
 */
const pairReceive = (draw: string): string =>
  "local k=self.touch_cb self.u=64 self.w=64 self.midirx_cb=function(s,e,v)" +
  MATCH +
  "if s.touch_cb==k then local a,b=f(@XR,@XT,@CH,@XCC),f(@YR,@YT,@YCH,@YCC)" +
  "if a then s.u=a end if b then s.w=b end if a or b then " +
  draw +
  "end end end";

/**
 * The shelf's Send rungs (knobs.preset.ts `SEND_OPTIONS`), restated as RADAR restates them: the
 * Number that takes a Send's place keeps its twelve first, in their order, so a saved copy's index
 * lands on the controller it was (ported-midi.spec.ts holds the two lists equal).
 */
export const SEND_RUNGS: readonly string[] = [
  "16",
  "20",
  "24",
  "28",
  "32",
  "36",
  "40",
  "44",
  "48",
  "52",
  "64",
  "80",
];

/** The X axis's Number: a fresh 0..127 at 16 (`xCc`), or the shelf's Send taken over (`send`). */
const FRESH_X = { id: "xCc", values: numberValues(), default: 16 };
const SEND_X = { id: "send", values: numberValues(SEND_RUNGS), default: 0 };

/**
 * The same receive, made by the TIMER once per install instead (RADAR's route, docs/MIDI.md section
 * 6) for a card whose Setup has no room: keyed on the touch callback it was made beside (`s.j`),
 * and pulled into the landing by `self:tim()` at the end of the Setup - the Timer body run once as
 * a method (17B's pull-in), because a compiled card's first timed run is five minutes away.
 */
const timerPairReceive = (draw: string): string =>
  "local s=self if s.j~=s.touch_cb then s.j=s.touch_cb s.u=64 s.w=64 local k=s.j s.midirx_cb=function(s,e,v)" +
  MATCH +
  "if s.touch_cb==k then local a,b=f(@XR,@XT,@CH,@XCC),f(@YR,@YT,@YCH,@YCC)" +
  "if a then s.u=a end if b then s.w=b end if a or b then " +
  draw +
  "end end end end";

/** The pull-in, appended to a Setup whose receive the Timer makes. */
const PULL_IN = "self:tim()";

/** The X and Y axes' eight knobs, RADAR's shape (entries/radar.ts): X on 16 and Y on 17, channel 1, both receiving. */
function axisKnobs(
  xType: string,
  xNumber: { id: string; values: readonly string[]; default: number },
  yType: string,
): LuaKnob[] {
  return [
    {
      id: "xType",
      label: "X MIDI type",
      kind: "mode",
      token: "@XT",
      values: CONTINUOUS_STATUSES,
      default: CONTINUOUS_STATUSES.indexOf(xType),
    },
    {
      id: "channel",
      label: "X MIDI channel",
      kind: "amount",
      token: "@CH",
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: xNumber.id,
      label: "X controller",
      kind: "amount",
      token: "@XCC",
      values: xNumber.values,
      default: xNumber.default,
    },
    {
      id: "xReceive",
      label: "X MIDI receive",
      kind: "mode",
      token: "@XR",
      values: RECEIVE_VALUES,
      default: RECEIVE_ON_INDEX,
    },
    {
      id: "yType",
      label: "Y MIDI type",
      kind: "mode",
      token: "@YT",
      values: CONTINUOUS_STATUSES,
      default: CONTINUOUS_STATUSES.indexOf(yType),
    },
    {
      id: "yChannel",
      label: "Y MIDI channel",
      kind: "amount",
      token: "@YCH",
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "yCc",
      label: "Y controller",
      kind: "amount",
      token: "@YCC",
      values: numberValues(),
      default: 17,
    },
    {
      id: "yReceive",
      label: "Y MIDI receive",
      kind: "mode",
      token: "@YR",
      values: RECEIVE_VALUES,
      default: RECEIVE_ON_INDEX,
    },
  ];
}

/** The X and Y outputs over `axisKnobs`' tokens. */
const AXIS_OUTPUTS: readonly MidiOutput[] = [
  {
    id: "x",
    name: "X axis",
    kind: "continuous",
    tokens: { type: "@XT", channel: "@CH", number: "@XCC", receive: "@XR" },
  },
  {
    id: "y",
    name: "Y axis",
    kind: "continuous",
    tokens: { type: "@YT", channel: "@YCH", number: "@YCC", receive: "@YR" },
  },
];

/**
 * The compiler's first-finger xy stream (`sends.kind "xy"`, `fingers "first"`): the raw pair on 16
 * and 17, channel 0, on every live sample of the claiming finger - the one send site of AURORA,
 * PINWHEEL and STARFIELD at every knob position (the shelf gives them no Send and no Channel).
 */
const XY_SENDS = "s:gms(0,176,16,x,0)s:gms(0,176,17,y,0)";

/**
 * The template of a first-finger xy card: `M` before the callback, the pair through the two
 * outputs, the receive appended, drawing with `draw`. The Timer carries no send and is untouched.
 */
const xyTemplate =
  (card: string, draw: string): WrapTemplate =>
  (setup, timer) => {
    let out = exactly(card, setup, TOUCH, M + TOUCH);
    out = exactly(card, out, XY_SENDS, "M(@XT,@CH,@XCC,x)M(@YT,@YCH,@YCC,y)");
    out += pairReceive(draw);
    noSendLeft(card, out, timer);
    return { setup: out, timer };
  };

/**
 * AURORA (change 17C): the band of light, the finger's comet, the first finger's position as two
 * outputs. The receive draws the library's comet at the held pair, `K(s.u,s.w,1,252)` - the call
 * the finger itself makes, so the DAW's position looks like a finger there (RADAR's decision).
 */
const AURORA: PresetMidi = {
  knobs: axisKnobs("176", FRESH_X, "176"),
  outputs: AXIS_OUTPUTS,
  supersedes: [],
  template: xyTemplate("aurora", "K(s.u,s.w,1,252)"),
};

/**
 * PINWHEEL (change 17C): each finger paints in its own colour (`K(x,y,1,252,255-i*60,i*60,128)`,
 * `i` the contact), and the first finger's position is the two outputs. The receive draws the
 * comet at the held pair in the FIRST finger's colour - contact 0's 255,0,128, the colour a single
 * finger on the pad draws - so the DAW's position reads as the finger the card sends for.
 */
const PINWHEEL: PresetMidi = {
  knobs: axisKnobs("176", FRESH_X, "176"),
  outputs: AXIS_OUTPUTS,
  supersedes: [],
  template: xyTemplate("pinwheel", "K(s.u,s.w,1,252,255,0,128)"),
};

/**
 * STARFIELD (change 17C): every light breathes at its own pace, the finger's comet, the first
 * finger's position as two outputs. The receive draws AURORA's comet at the held pair - the call the
 * finger itself makes (`K(x,y,1,252)` in the layer-1 colour the Setup sets, 255,170,34).
 */
const STARFIELD: PresetMidi = {
  knobs: axisKnobs("176", FRESH_X, "176"),
  outputs: AXIS_OUTPUTS,
  supersedes: [],
  template: xyTemplate("starfield", "K(s.u,s.w,1,252)"),
};

/**
 * The compiler's joystick sends at the shelf's Send (16) and Bend (x), both superseded: the X axis a
 * pitch bend of the raw x, the Y axis controller 17 of `127-y` (invertY is pinned), on every live
 * sample of the claiming finger; and, while the spring is on, the rests on the claimer's lift - the
 * bend's 64 always, the controller's 64 (On lift Centre) or 0 (Zero).
 */
const JOY_LIVE = "s:gms(0,224,0,x,0)s:gms(0,176,17,127-y,0)";
const JOY_REST_CENTRE = "s:gms(0,224,0,64,0)s:gms(0,176,17,64,0)";
const JOY_REST_ZERO = "s:gms(0,224,0,64,0)s:gms(0,176,17,0,0)";

/**
 * JOYSTICK (change 17C): the stick's two axes as outputs. The shelf's Bend (which axis is the pitch
 * bend) is superseded by the two Types - Bend left-right is X Pitch bend, the card's default; Bend
 * up-down is Y Pitch bend; No bend is two controllers - and its Send by the X axis's Number. A rest
 * follows its output's Type: a pitch bend rests on 64, the centre, whatever On lift says (the
 * compiler's rule for the bend axis), anything else on On lift's 64 or 0. The receive moves the
 * parked dot - the stick's position light - to the cell of the held pair (`N`, the Y value turned
 * back through `127-`), so the DAW's position shows where the finger would be; the next touch
 * clears it as it clears the parked dot, and a lift re-parks it at the rest cell. THE RECEIVE IS
 * THE TIMER'S: the Setup with it measured 942 at the defaults, so the Timer (24) makes it and the
 * Setup pulls the Timer in.
 */
const JOYSTICK: PresetMidi = {
  knobs: axisKnobs("224", SEND_X, "176"),
  outputs: AXIS_OUTPUTS,
  supersedes: ["send", "bend"],
  template: (setup, timer) => {
    const card = "joystick";
    let out = exactly(card, setup, TOUCH, M + TOUCH);
    out = exactly(
      card,
      out,
      JOY_LIVE,
      "M(@XT,@CH,@XCC,x)M(@YT,@YCH,@YCC,127-y)",
    );
    const centre = count(out, JOY_REST_CENTRE);
    const zero = count(out, JOY_REST_ZERO);
    // On lift Off writes no rest; Centre and Zero write one, exactly once.
    if (centre + zero > 1)
      throw new WrapMissError(card, "a spring rest", centre + zero, 1);
    out = out
      .split(JOY_REST_CENTRE)
      .join("M(@XT,@CH,@XCC,64)M(@YT,@YCH,@YCC,64)")
      .split(JOY_REST_ZERO)
      .join(
        "M(@XT,@CH,@XCC,@XT>223 and 64 or 0)M(@YT,@YCH,@YCC,@YT>223 and 64 or 0)",
      );
    out += PULL_IN;
    const made =
      timer +
      timerPairReceive(
        "if s.l then glp(glag(0,s.l),1,0)end s.l=N(s.u,127-s.w)glp(glag(0,s.l),1,255)",
      );
    noSendLeft(card, out, made);
    return { setup: out, timer: made };
  },
};

/** The wrapped cards by catalog id. A card joins by one row here; ported.ts reads its knobs and outputs. */
export const PRESET_MIDI: Readonly<Record<string, PresetMidi>> = {
  aurora: AURORA,
  pinwheel: PINWHEEL,
  starfield: STARFIELD,
  joystick: JOYSTICK,
};

/** The selected literal of one output knob: the asked index when it is one, else the entry's default. */
function literalOf(
  entry: CatalogEntry,
  knob: LuaKnob,
  indices: Readonly<Record<string, number>> | undefined,
): string {
  const asked = indices?.[knob.id] ?? entry.defaults[knob.id] ?? knob.default;
  const inRange =
    Number.isInteger(asked) && asked >= 0 && asked < knob.values.length;
  return knob.values[inRange ? asked : knob.default];
}

/**
 * The wire of a compiled preset under an entry: the identity for an entry that wraps nothing, else
 * the card's template with every output token replaced by its knob's selected literal (renderLua's
 * plain `replaceAll`: a token is data). Pure and synchronous - no VM, no formatter - so the meters,
 * the gate and the sweeps all call this one function on the compiled pair.
 */
export function presetWire<T extends { setupLua: string; timerLua: string }>(
  entry: CatalogEntry,
  compiled: T,
  indices?: Readonly<Record<string, number>>,
): T {
  const wrap = PRESET_MIDI[entry.id];
  if (wrap === undefined || entry.source.kind !== "preset") return compiled;
  let { setup, timer } = wrap.template(compiled.setupLua, compiled.timerLua);
  for (const knob of entry.knobs) {
    const value = literalOf(entry, knob, indices);
    setup = setup.replaceAll(knob.token, value);
    timer = timer.replaceAll(knob.token, value);
  }
  return { ...compiled, setupLua: setup, timerLua: timer };
}

/** True for an entry whose compiled pair is wrapped here. */
export const isWrapped = (entry: CatalogEntry): boolean =>
  entry.source.kind === "preset" && PRESET_MIDI[entry.id] !== undefined;
