// The brightness setting: one integer 1..255 per configuration, applied to the COLOURS HANGAR
// writes - the firmware has no global LED intensity (grid_protocol.h:236-287 lists glc, glx, gld,
// gln, glp, glf, gls, glpfs, glt; grid_led.c:408-463 mixes each layer's colour by its phase and
// nothing scales the sum). Pure string arithmetic: every colour argument of a painter call in the
// emitted Lua (`glc gld glx gln`, the library's `G` and `K`, an entry's declared painter) and every
// declared palette table is scaled at landing by `scaleLua`; a channel `v` becomes `max(1,
// floor(v*b/255))` (0 stays 0, so a dim colour never vanishes), a linear form's coefficient
// `floor(v*b/255)`. At 255 the output is byte-identical, and no number ever gains a digit, so no
// string grows. The Sandbox scales its region rows in emit.ts through `scaleChannel` instead;
// `colourSites` is the coverage gate brightness.spec.ts runs over every entry and every preset.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** The range the field accepts; 255 is today's full output and the value an absent record field means. */
export const BRIGHTNESS_MIN = 1;
export const BRIGHTNESS_MAX = 255;
export const BRIGHTNESS_FULL = 255;

/** True for an integer inside the range. */
export function isBrightness(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= BRIGHTNESS_MIN &&
    value <= BRIGHTNESS_MAX
  );
}

/** A record's field, absent meaning full: the older records' reading. */
export function brightnessOf(value: number | undefined): number {
  return isBrightness(value) ? value : BRIGHTNESS_FULL;
}

/** The field's text -> a value, or the refusal's kind: not a whole number, or one outside 1..255. */
export function parseBrightness(
  text: string,
): { ok: true; value: number } | { ok: false; reason: "number" | "range" } {
  const trimmed = text.trim();
  if (!/^-?[0-9]+$/.test(trimmed)) return { ok: false, reason: "number" };
  const value = Number.parseInt(trimmed, 10);
  return isBrightness(value)
    ? { ok: true, value }
    : { ok: false, reason: "range" };
}

/** One channel: 0 stays 0; anything lit stays lit (never below 1); 255 is the identity. */
export function scaleChannel(value: number, brightness: number): number {
  if (value <= 0) return 0;
  return Math.max(1, Math.floor((value * brightness) / BRIGHTNESS_MAX));
}

/**
 * A coefficient in a linear colour form (`255-j*40`, `f*80`, `lo+d*x//8`): plain floor, no floor
 * of 1, so a form that never went negative over its variable's range still never does.
 */
export function scaleCoefficient(value: number, brightness: number): number {
  return Math.floor((value * brightness) / BRIGHTNESS_MAX);
}

/** Where a Lua text's colours are: the painters with their colour argument positions, the palette tables, the names allowed bare. */
export type ColourSites = {
  /** Painter name -> the 0-based argument positions that carry a channel. */
  readonly painters: Readonly<Record<string, readonly number[]>>;
  /** Table names whose `{...}` constructor of integer literals is a palette. */
  readonly palettes: readonly string[];
  /** Names a colour argument may be as a bare variable: a declared painter's own parameters, or a palette's channels. */
  readonly bare: readonly string[];
};

/**
 * The painters every emitted string may call: the firmware's four colour writers (grid_protocol.h;
 * `glc(a,l,r,g,b[,m])`, the min/mid/max trio the same shape) and the library's two
 * (`G(s,i,e,x,y,l,r,g,b)`, `K(x,y,l,w,r,g,b)` with the colour optional).
 */
export const LIBRARY_PAINTERS: Readonly<Record<string, readonly number[]>> = {
  glc: [2, 3, 4],
  gld: [2, 3, 4],
  glx: [2, 3, 4],
  gln: [2, 3, 4],
  G: [6, 7, 8],
  K: [4, 5, 6],
};

/**
 * The hand-authored entries whose colours are not all literal arguments of a library painter,
 * declared by id - brightness.spec.ts asserts every other entry needs nothing here, and that
 * every name declared is found.
 */
export const ENTRY_SITES: Readonly<Record<string, Partial<ColourSites>>> = {
  // `local C={...}` fifteen channels, read as `C[i+1],C[i+2],C[i+3]` and `C[i+1]*@DIM//6`.
  cull: { palettes: ["C"] },
  // `local H={...}` twenty-seven channels; F derives `r g b` from H and hands them to glc.
  lumen: { palettes: ["H"], bare: ["r", "g", "b"] },
  // `local C={@HUE}` and the fill's own twelve, both constructors.
  quadrant: { palettes: ["C"] },
  // `local function P(k,r,g,b)` is the painter; its callers hand the knob's triplet or zeros.
  snake: { painters: { P: [1, 2, 3] }, bare: ["r", "g", "b"] },
  // `local function I(p,q,w)` washes the field; `I(@RINGC)` is its one caller.
  pomodoro: { painters: { I: [0, 1, 2] }, bare: ["p", "q", "w"] },
  // `local c={@R1C,@R2C,@R3C,@R4C}` in the Timer, twelve channels read as `c[d*3-2],c[d*3-1],c[d*3]`.
  orbit: { palettes: ["c"] },
};

/** The sites for one entry (or none: a preset, whose compiled output calls the library painters alone). */
export function sitesFor(entryId?: string): ColourSites {
  const own = entryId === undefined ? undefined : ENTRY_SITES[entryId];
  return {
    painters: { ...LIBRARY_PAINTERS, ...(own?.painters ?? {}) },
    palettes: own?.palettes ?? [],
    bare: own?.bare ?? [],
  };
}

/** How one colour argument was read. Anything `other` is a colour the scaler cannot reach: the gate fails on it. */
export type ArgumentClass =
  | "literal"
  | "linear"
  | "palette"
  | "bare"
  | "token"
  | "other";

export type ColourSite = {
  readonly painter: string;
  readonly position: number;
  readonly text: string;
  readonly kind: ArgumentClass;
};

type Span = { readonly start: number; readonly end: number };

type Call = { readonly name: string; readonly args: readonly Span[] };

const NAME = /[A-Za-z_][A-Za-z0-9_]*/y;

/** Every call of a painter in the text, with the spans of its top-level arguments. */
function calls(
  lua: string,
  painters: Readonly<Record<string, readonly number[]>>,
): Call[] {
  const out: Call[] = [];
  let at = 0;
  while (at < lua.length) {
    NAME.lastIndex = at;
    const match = NAME.exec(lua);
    if (match === null) {
      at += 1;
      continue;
    }
    const name = match[0];
    const start = match.index;
    const end = start + name.length;
    at = end;
    if (!(name in painters)) continue;
    if (lua[end] !== "(") continue;
    // Not a member call, not a field, and not a definition's parameter list.
    const before = lua[start - 1];
    if (before !== undefined && /[A-Za-z0-9_.:]/.test(before)) continue;
    if (/function\s+$/.test(lua.slice(Math.max(0, start - 9), start))) continue;
    const args = argumentSpans(lua, end);
    if (args === undefined) continue;
    out.push({ name, args });
  }
  return out;
}

/** The top-level argument spans of the call whose `(` is at `open`; undefined when the call never closes. */
function argumentSpans(lua: string, open: number): Span[] | undefined {
  const spans: Span[] = [];
  let depth = 0;
  let from = open + 1;
  let quote: string | undefined;
  for (let i = open; i < lua.length; i += 1) {
    const c = lua[i];
    if (quote !== undefined) {
      if (c === "\\") i += 1;
      else if (c === quote) quote = undefined;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") {
      depth += 1;
      continue;
    }
    if (c === ")" || c === "]" || c === "}") {
      depth -= 1;
      if (depth === 0) {
        if (i > from || spans.length > 0) spans.push(trimSpan(lua, from, i));
        return spans;
      }
      continue;
    }
    if (c === "," && depth === 1) {
      spans.push(trimSpan(lua, from, i));
      from = i + 1;
    }
  }
  return undefined;
}

function trimSpan(lua: string, start: number, end: number): Span {
  let s = start;
  let e = end;
  while (s < e && lua[s] === " ") s += 1;
  while (e > s && lua[e - 1] === " ") e -= 1;
  return { start: s, end: e };
}

const INTEGER = /^[0-9]+$/;
const IDENT = "[A-Za-z_][A-Za-z0-9_]*";
/** One term of a linear form: a constant, or a coefficient times a name (either order), with an optional integer divisor. */
const TERM = `(?:[0-9]+(?:\\*${IDENT}(?://[0-9]+)?)?|${IDENT}\\*[0-9]+(?://[0-9]+)?)`;
const LINEAR = new RegExp(`^[+-]?${TERM}(?:[+-]${TERM})*$`);
const TERM_G = new RegExp(`([+-]?)(${TERM})`, "g");

function classify(text: string, sites: ColourSites): ArgumentClass {
  if (INTEGER.test(text)) return "literal";
  if (LINEAR.test(text)) return "linear";
  const indexed = /^([A-Za-z_][A-Za-z0-9_]*)\[/.exec(text);
  if (indexed !== null && sites.palettes.includes(indexed[1])) return "palette";
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(text) && sites.bare.includes(text)) {
    return "bare";
  }
  if (/^@[A-Z][A-Z0-9_]*$/.test(text)) return "token";
  return "other";
}

/** A linear form with every magnitude scaled: a lone constant through the channel rule, a coefficient through the coefficient rule, a divisor untouched. */
function scaleLinear(text: string, brightness: number): string {
  return text.replace(TERM_G, (whole, sign: string, term: string) => {
    if (INTEGER.test(term))
      return sign + number(term, scaleChannel(Number(term), brightness));
    const parts = /^([0-9]+)\*([A-Za-z_][A-Za-z0-9_]*)((?:\/\/[0-9]+)?)$/.exec(
      term,
    );
    if (parts !== null) {
      return (
        sign +
        number(parts[1], scaleCoefficient(Number(parts[1]), brightness)) +
        "*" +
        parts[2] +
        parts[3]
      );
    }
    const flipped =
      /^([A-Za-z_][A-Za-z0-9_]*)\*([0-9]+)((?:\/\/[0-9]+)?)$/.exec(term);
    if (flipped !== null) {
      return (
        sign +
        flipped[1] +
        "*" +
        number(flipped[2], scaleCoefficient(Number(flipped[2]), brightness)) +
        flipped[3]
      );
    }
    return whole;
  });
}

/** The scaled number's text, or the source text when the value did not move (the identity keeps every byte). */
function number(source: string, scaled: number): string {
  return scaled === Number(source) ? source : String(scaled);
}

/** Every palette constructor `NAME={int,int,...}` in the text, as the span of its list. */
function paletteSpans(lua: string, palettes: readonly string[]): Span[] {
  const out: Span[] = [];
  for (const name of palettes) {
    const opener = new RegExp(`(?<![A-Za-z0-9_.:])${name}=\\{`, "g");
    for (const match of lua.matchAll(opener)) {
      const start = match.index + match[0].length;
      const close = lua.indexOf("}", start);
      if (close === -1) continue;
      const body = lua.slice(start, close);
      if (!/^[0-9]+(?:,[0-9]+)*$/.test(body)) continue;
      out.push({ start, end: close });
    }
  }
  return out;
}

/** Every colour argument of every painter call, classified - the coverage gate's input. */
export function colourSites(
  lua: string,
  sites: ColourSites = sitesFor(),
): ColourSite[] {
  const out: ColourSite[] = [];
  for (const call of calls(lua, sites.painters)) {
    for (const position of sites.painters[call.name]) {
      const span = call.args[position];
      if (span === undefined) continue;
      const text = lua.slice(span.start, span.end);
      out.push({
        painter: call.name,
        position,
        text,
        kind: classify(text, sites),
      });
    }
  }
  return out;
}

/** How many palette constructors the text holds per declared name - so a declaration that finds nothing is a red test, not a silent one. */
export function paletteCount(
  lua: string,
  sites: ColourSites,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const name of sites.palettes) {
    out[name] = paletteSpans(lua, [name]).length;
  }
  return out;
}

/**
 * The text with every colour scaled to `brightness`. Identity at 255; never longer than its input.
 * A `palette` or `bare` argument is left as it is - its colour comes through the palette table
 * scaled here, or through a declared painter's own scaled caller.
 */
export function scaleLua(
  lua: string,
  brightness: number,
  sites: ColourSites = sitesFor(),
): string {
  if (brightness === BRIGHTNESS_FULL) return lua;
  const edits: { span: Span; text: string }[] = [];
  for (const call of calls(lua, sites.painters)) {
    for (const position of sites.painters[call.name]) {
      const span = call.args[position];
      if (span === undefined) continue;
      const text = lua.slice(span.start, span.end);
      const kind = classify(text, sites);
      if (kind === "literal") {
        edits.push({
          span,
          text: number(text, scaleChannel(Number(text), brightness)),
        });
      } else if (kind === "linear") {
        edits.push({ span, text: scaleLinear(text, brightness) });
      }
    }
  }
  for (const span of paletteSpans(lua, sites.palettes)) {
    const body = lua.slice(span.start, span.end);
    edits.push({
      span,
      text: body
        .split(",")
        .map((v) => number(v, scaleChannel(Number(v), brightness)))
        .join(","),
    });
  }
  edits.sort((a, b) => a.span.start - b.span.start);
  let out = "";
  let at = 0;
  for (const edit of edits) {
    if (edit.span.start < at) continue;
    out += lua.slice(at, edit.span.start) + edit.text;
    at = edit.span.end;
  }
  return out + lua.slice(at);
}
