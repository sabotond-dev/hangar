// The tuning model: descriptors, indices, the immediate preview, the debounced compile, the two
// meters, the fit-ladder line and the over-budget block. Reached ONLY through
// `await import("$lib/tune/model")`: it imports the vendored compiler and `$lib/pad`, and nothing
// under `src/lib/ui/` may name it in a static import, not even `import type` (config-shape.spec.ts
// test 13 matches the specifier text); a component names `tune/view.ts` instead, which imports nothing.
// The PadSim preview is built here from `../../vendor/botor/pad-sim` (the one place this module
// reaches past `$lib/pad`, which re-exports only the measuring surface); the Lua wrapper and the
// touch library arrive by dynamic import. `fitsAfterGate` is the one synchronous vendored measurement
// in HANGAR, called only after `padReady()`. Nothing here goes into a Svelte rune: plain objects and
// plain engines; the engine a component receives goes straight to `SimHost`.
// Decided at 05-04 (05-CONTEXT D-18) / 10-10 / 12.1-08b; see .planning/phases/12.1-gradient-touch/12.1-08b-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  compile as vendorCompile,
  fits as vendorFits,
  type CompileResult,
  type FitPlan,
  type PadCost,
  type PadReserved,
  type PadSheet,
  type PadState,
} from "../../vendor/botor/_pad";
import { PadSim } from "../../vendor/botor/pad-sim";
import { byId, portedEntry, type CatalogEntry } from "../catalog";
import {
  BRIGHTNESS_FULL,
  brightnessOf,
  isBrightness,
  scaleLua,
  sitesFor,
} from "../catalog/brightness";
import { isWrapped, presetWire } from "../catalog/entries/ported-midi";
import { cellOf } from "../catalog/lattice";
import { compileState, costOf, fitState, measureLua, padReady } from "../pad";
import { compilerKnobs, encodeFor, stampKnobs } from "../share/stamp";
import { createEngine, dimmed, type SimEngine } from "../sim/engine";
import {
  backOffKnob,
  backOffLadder,
  ladderLine,
  liveOverBudget,
  overBudgetArrived,
  overBudgetArrivedBoth,
  overBudgetKnob,
  overBudgetKnobBoth,
  tryOnBudgetReason,
  type BudgetEvents,
  type EventWord,
} from "./copy";
import type { KnobDescriptor, PresetKnob } from "./knobs.preset";
import { MIDI_STATUS, resolveOutputs, type OutputRole } from "./midi";
import { applyKnob, baseStateFor, resetAll } from "./state";
import { isControllerNumber, rollable, surpriseIndices } from "./surprise";
import {
  integerReadout,
  integerRun,
  isColourLattice,
  meterView,
  positionText,
  splitUnit,
  swatchName,
  swatchOf,
  widgetFor,
  wordFor,
  type KnobKindName,
  type KnobValueView,
  type KnobView,
  type KnobWidget,
  type MeterFeed,
  type TuneView,
} from "./view";

/**
 * The recompile debounce. Measured: `compile() + cost()` is 1.1-4.0 ms in node and `cost()` crosses
 * the WASM boundary twice; a slider drag emits thirty changes a second. The preview is not debounced:
 * `PadSim` takes a `PadState` and rebuilds in microseconds (D-05, D-06).
 */
export const COMPILE_DEBOUNCE_MS = 120;

/** The TUNE-04 line: what the compiler would turn down, in its own words. */
export type LadderView = {
  /** The compiler's own sentence, verbatim. Never rewritten here. */
  label: string;
  /** That sentence rendered through copy.ladderLine. */
  line: string;
  saves: { setup: number; timer: number };
};

/** The TUNE-05 block, complete. Every string comes from copy.ts. */
export type OverBudgetView = {
  events: "setup" | "timer" | "both";
  /** The knob case or the arrived case, decided by whether a knob moved. */
  line: string;
  /** The quiet line under TURN IT DOWN, saying what the click will do. */
  backOff: string;
  /** The reason beside a disabled TRY ON DEVICE. Names the budget, nothing else. */
  reason: string;
  /** The one live-region utterance for the transition. */
  live: string;
  /** The back-off itself: the knob's previous index, or the ladder's first step. */
  apply(): void;
};

/**
 * What a choice WOULD cost, published before it is made (TUNE-02, T2): both events, both deltas,
 * measured against the SAME function that measured the forecast, never against the published meters.
 */
export type ForecastView = {
  knobId: string;
  /** The KNOB POSITION this forecast is for, never a window slot. */
  position: number;
  setup: number;
  timer: number;
  setupDelta: number;
  timerDelta: number;
};

export type Tuner = {
  readonly knobs: readonly KnobDescriptor[];
  readonly indices: Readonly<Record<string, number>>;
  set(knobId: string, index: number): void;
  /**
   * Ask for the forecast of one candidate position, or withdraw it with
   * `undefined`. Fire-and-forget: the answer arrives on `onforecast`, either
   * on this tick from the memo or after the same debounce a recompile takes.
   */
  forecast(knobId: string, position: number | undefined): void;
  reset(knobId: string): void;
  resetAll(): void;
  /**
   * The roll. `held` names the knobs the visitor has locked (T1) and is the caller's ephemeral state -
   * never stored here, so it can never reach `encodeFor`. Resolves to a copy of every index as it stood
   * before the draw (13-10, "Undo randomize"), or undefined when nothing was rolled; not a history.
   */
  surprise(
    held?: ReadonlySet<string>,
  ): Promise<Readonly<Record<string, number>> | undefined>;
  /**
   * Every knob to the position the vector names, in one move and one recompile; a position outside a
   * knob's range, or a knob the vector does not name, is that knob's default (as a decoded stamp is).
   */
  restore(indices: Readonly<Record<string, number>>): void;
  /** Undefined at the defaults: a URL with no fragment IS the base configuration. */
  stamp(): string | undefined;
  /**
   * The brightness (1..255) every landed colour is scaled to (catalog/brightness.ts). Not a knob:
   * never in `knobs`, never in the stamp, never rolled. A value outside 1..255 is ignored.
   */
  readonly brightness: number;
  setBrightness(brightness: number): void;
  destroy(): void;
};

/**
 * The exact bytes a write would put on the wire, beside the numbers that measured them (07-CONTEXT
 * D-17), in write order (sequence.ts SLOTS; the writer owns that order). Never compressed on the way
 * out: `cost()` budgets `Math.max(measure(lua), lua.length) + reserved`, and with the shipped reserve
 * `setup.length === cost().setup.used` on every preset (D-10; wire-pin.spec.ts holds it). `system`
 * (255/0), `systemTimer` (255/6) and `systemUtility` (255/4) are metered by nothing and move with no
 * knob: every card lands the touch library's two halves since 12.1-08b, and no catalog entry has a
 * utility body, so the empty string is published there and the install store's `#systemStringOr`
 * substitutes the firmware default in one place per slot, keyed by the event number (this module may
 * not know a firmware default: ladder.spec.ts refuses `lib/protocol` to every file under `src/lib/tune/`).
 * A Sandbox surface (`sandbox/land.ts`) is the third producer of this shape; wire-pin.spec.ts tests 1-3 pin what lands.
 */
export type ConfigStrings = {
  readonly systemTimer: string;
  readonly system: string;
  readonly systemUtility: string;
  readonly setup: string;
  readonly timer: string;
};

export type TunerOptions = {
  entryId: string;
  indices?: Readonly<Record<string, number>>;
  /** The brightness to open at; absent or out of range is 255 (a record without the field). */
  brightness?: number;
  /** Phase 7's install marker, and the only way a test or /dev/tune/ reaches over budget. */
  reserved?: PadReserved;
  onview(view: TuneView): void;
  onpreview(engine: SimEngine): void;
  onladder(ladder: LadderView | undefined): void;
  onover(over: OverBudgetView | undefined): void;
  /**
   * The compiled pair, emitted with every settled measurement, and UNDEFINED the instant the feed goes
   * stale - so the debounce cannot land a new compile between the click and the write (07-RESEARCH Pitfall 5).
   */
  onconfig?(config: ConfigStrings | undefined): void;
  /**
   * The page-init string this entry wants (255/0), published verbatim and metered by nothing. Absent
   * means "none of its own": both routes then land `TOUCH_LIBRARY` (the Lua route since 12-07, the
   * preset route since 12.1-08b). An explicit value wins, for the install probe's textarea - the site's
   * only route for pasting an arbitrary page init at a module.
   */
  systemSetup?: string;
  /**
   * The system timer string this entry wants (255/6; 12.1-07), under `systemSetup`'s rules: absent
   * lands `TOUCH_LIBRARY_TIMER` on both routes; an explicit value wins, for the install probe's textarea.
   */
  systemTimer?: string;
  /**
   * The utility string this entry wants (255/4; 13-17), under `systemSetup`'s rules with one difference:
   * no catalog entry has one, so absent publishes the empty string and the install store substitutes
   * the firmware's page-next. The Sandbox publishes its five keys itself (`sandbox/land.ts`).
   */
  systemUtility?: string;
  /**
   * The forecast, or `undefined` the moment it is withdrawn or invalidated.
   * Optional, so every existing caller and every existing test is unchanged.
   */
  onforecast?(forecast: ForecastView | undefined): void;
};

/**
 * The single decision point for whether the ladder runs at all: `fit()` compiles once per ladder step
 * (N+1 minifier calls) and must never run on a knob change; never true in practice
 * (reachability.sweep.spec.ts), which is why it is one named function with one call site.
 */
export function needsLadder(cost: PadCost): boolean {
  return !cost.fits;
}

/**
 * The synchronous fit test, and the ONE place HANGAR calls a vendored measuring function without an
 * await in front of it. PRECONDITION: `padReady()` has resolved; every caller awaits it through `$lib/pad` first.
 * `wire` is a wrapped preset's rewrite (change 17C): the fit is the wire's, not the bare compile's.
 */
function fitsAfterGate(
  state: PadState,
  reserved: PadReserved | undefined,
  wire: (compiled: CompileResult) => CompileResult = (compiled) => compiled,
) {
  return vendorFits(wire(vendorCompile(state)), reserved);
}

/** An engine that owns something it has to give back. Only the Lua route does. */
type Closable = { close(): void };

function closeEngine(engine: SimEngine | undefined): void {
  const maybe = engine as Partial<Closable> | undefined;
  if (typeof maybe?.close === "function") maybe.close();
}

/** An asked-for index, or the knob's default when it is not a position at all. */
function positionOf(
  asked: number | undefined,
  count: number,
  fallback: number,
): number {
  if (typeof asked !== "number") return fallback;
  return Number.isInteger(asked) && asked >= 0 && asked < count
    ? asked
    : fallback;
}

/**
 * One option, resolved for display - total, as `widgetFor` is: a word if the kind has one, a swatch
 * name for a colour, the raw integer if every option is one, a position otherwise. Never a Lua literal.
 */
function valueView(
  kind: KnobKindName,
  widget: KnobWidget,
  options: readonly string[],
  index: number,
  id?: string,
  role?: OutputRole,
): KnobValueView {
  const literal = options[index];
  const count = options.length;
  if (widget === "swatch" || widget === "colour") {
    const name = swatchName(literal, index, count);
    return {
      label: name ?? positionText(index, count),
      swatch: swatchOf(literal),
      name,
    };
  }
  const word = wordFor(kind, literal, id, role);
  if (typeof word === "string") return { label: word };
  const integer = integerReadout(options, index);
  return { label: integer ?? positionText(index, count) };
}

/**
 * The 4,096 resolved colour views, built ONCE PER LIST and shared: every colour-bearing preset offers
 * the same 4,096 literals in the same order (`knobs.preset.ts`), a Lua card's lattice knob its own
 * list (its colours first, change 19; ORBIT's four rings share one), and resolving them per emit would
 * run `swatchName`'s HSL arithmetic 4,096 times on every knob turn. The two-swatch window,
 * `KnobView.positions` and `SWATCH_ROW_MAX` went with ColourPicker.svelte's forty-eight detents (10-10).
 */
const latticeViews = new WeakMap<readonly string[], readonly KnobValueView[]>();

function colourViews(options: readonly string[]): readonly KnobValueView[] {
  let views = latticeViews.get(options);
  if (views === undefined) {
    views = Object.freeze(
      options.map((_, at) => valueView("colour", "colour", options, at)),
    );
    latticeViews.set(options, views);
  }
  return views;
}

/** Each index's RGB444 cell, or null where the index IS the cell (the presets' lattice). Cached per list. */
const latticeCells = new WeakMap<readonly string[], readonly number[] | null>();

/** `cells` for a lattice knob whose order is not the lattice's own (change 19), nothing for the presets'. */
function latticeFields(options: readonly string[]): {
  cells?: readonly number[];
} {
  let cells = latticeCells.get(options);
  if (cells === undefined) {
    const each = options.map((literal) => cellOf(literal) ?? -1);
    cells = each.every((cell, at) => cell === at) ? null : Object.freeze(each);
    latticeCells.set(options, cells);
  }
  return cells === null ? {} : { cells };
}

function knobViews(
  knobs: readonly KnobDescriptor[],
  indices: Readonly<Record<string, number>>,
  roles: ReadonlyMap<string, { role: OutputRole; output: string }> = new Map(),
): readonly KnobView[] {
  // Change 17C (17B's question 6, decided): an output's Number is worded by the output's Type. Each
  // output's Type knob, by output id, so a Number can read the status its Type stands at.
  const typeKnobOf = new Map<string, KnobDescriptor>();
  for (const [id, part] of roles) {
    if (part.role !== "type") continue;
    const typeKnob = knobs.find((each) => each.id === id);
    if (typeKnob !== undefined) typeKnobOf.set(part.output, typeKnob);
  }
  return knobs.map((knob) => {
    // Change 17: a knob in a MIDI output's block is worded by its role there (Type, Receive).
    const part = roles.get(knob.id);
    // A MIDI destination over CC numbers reads as an amount whatever kind it was declared under
    // (change 16, surprise.ts's isControllerNumber): the preset's Send is `note` over 16..80.
    // An output's Number follows its Type instead (change 17C): a note name under Note, the
    // number under CC or Program change - and under Pitch bend or Channel pressure, where the
    // panel hides the row, the number too.
    const typeKnob =
      part?.role === "number" ? typeKnobOf.get(part.output) : undefined;
    const status =
      typeKnob === undefined
        ? undefined
        : typeKnob.options[indices[typeKnob.id]];
    const kind: KnobKindName =
      status !== undefined
        ? status === MIDI_STATUS.note
          ? "note"
          : "amount"
        : knob.kind === "note" && isControllerNumber(knob)
          ? "amount"
          : knob.kind;
    // Change 17B (section 17's decision, 2026-09-23): a card's MIDI channel READS 1..16, the
    // DAW's numbering, as the Sandbox's does; the literal written to the wire stays the firmware's
    // 0..15. The words, the readout and the typed field's literals read `shown`; the index is the
    // knob's own, so the stamp and the Lua do not move.
    const shown =
      (knob.id === "channel" || part?.role === "channel") &&
      integerRun(knob.options)?.min === 0
        ? knob.options.map((literal) => String(Number(literal) + 1))
        : knob.options;
    const widget = widgetFor(kind, shown, knob.id, part?.role);
    const index = indices[knob.id];
    const named = splitUnit(knob.label);
    const head = {
      id: knob.id,
      label: named.label,
      unit: named.unit,
      kind,
      widget,
      role: part?.role,
      output: part?.output,
      // A note knob's readout is the note's name (change 7: CHORUS's twelve roots are a select,
      // and "C#3" is what its word row would have said); every other integer knob shows its literal.
      readout:
        kind === "note"
          ? (wordFor("note", knob.options[index] ?? "") ??
            integerReadout(knob.options, index))
          : integerReadout(shown, index),
    };
    return {
      ...head,
      // The raw literals ride with the readout and only with it: present
      // exactly when every option is an integer, for the typed field's
      // mapping back to an index (view.ts `typedIndex` / `nearestRung`).
      literals: head.readout === undefined ? undefined : shown,
      // The lattice's 4,096 come from the shared cache; every other knob
      // resolves its own handful. See `colourViews`.
      values:
        widget === "colour" && isColourLattice(knob.options)
          ? colourViews(knob.options)
          : shown.map((_, at) =>
              valueView(kind, widget, shown, at, knob.id, part?.role),
            ),
      index,
      default: knob.default,
      // A Lua card's lattice colour knob (change 19): its own colours lead as the picker's quick
      // picks, and its index reaches the rails through each rung's cell.
      ...(knob.palette === undefined ? {} : { palette: knob.palette.length }),
      ...(widget === "colour" && isColourLattice(knob.options)
        ? latticeFields(knob.options)
        : {}),
    };
  });
}

/** Which events are over, or undefined when neither is. */
function eventsOver(cost: PadCost): OverBudgetView["events"] | undefined {
  const setup = cost.setup.free < 0;
  const timer = cost.timer.free < 0;
  if (setup && timer) return "both";
  if (setup) return "setup";
  if (timer) return "timer";
  return undefined;
}

/** The event the block speaks about when only one of them can be named. */
function worstEvent(events: OverBudgetView["events"]): "setup" | "timer" {
  return events === "timer" ? "timer" : "setup";
}

const eventWord = (event: "setup" | "timer"): EventWord =>
  event === "setup" ? "Setup" : "Timer";

const budgetWord = (events: OverBudgetView["events"]): BudgetEvents =>
  events === "both" ? "Setup and Timer" : eventWord(events);

/**
 * The entry, or a named throw. The shelf is the fallback since 12-10: `tpad` is on HANGAR's shelf but
 * not in the catalog (TRACKPAD replaced it as the card) and the tune probe and ladder.spec.ts still
 * mount it as the over-budget fixture, through `portedEntry`; an id on neither still throws, by name.
 */
function entryFor(id: string): CatalogEntry {
  const found = byId(id) ?? portedEntry(id);
  if (!found) throw new Error(`no catalog entry with the id "${id}"`);
  return found;
}

export async function buildTuner(options: TunerOptions): Promise<Tuner> {
  const entry = entryFor(options.entryId);

  // The page-init string, or the empty string meaning "none of its own". Read once here so `land()`
  // stays synchronous under the fixed microtask chain model.spec.ts and wire-pin.spec.ts await (12.1-08b).
  const system = options.systemSetup ?? "";
  // The fourth string, on the same terms (12.1-07).
  const systemTimer = options.systemTimer ?? "";
  // The fifth (13-17): no catalog entry has a utility body; the install store substitutes the firmware's page-next.
  const systemUtility = options.systemUtility ?? "";
  // The touch library, resolved once per tuner and ahead of the first measurement: read here so `land()`
  // stays synchronous on the preset route (12.1-08b). Dynamic, never static, as `renderLua` below.
  const { TOUCH_LIBRARY, TOUCH_LIBRARY_TIMER } = await import(
    "../catalog/library"
  );
  // An explicit `systemTimer` or `systemSetup` still wins: the install probe's textareas paste an arbitrary library.
  const landedSystem = system === "" ? TOUCH_LIBRARY : system;
  const landedSystemTimer =
    systemTimer === "" ? TOUCH_LIBRARY_TIMER : systemTimer;

  // The two routes, resolved once, through the stamp's own resolvers (`encodeFor` must encode against
  // exactly the knobs the rack shows, in the same order). A `state`-kind source exposes no knobs and
  // still gets both meters.
  const tuned: readonly PresetKnob[] = compilerKnobs(entry);
  const knobs: readonly KnobDescriptor[] = stampKnobs(entry);
  // Change 17: the entry's MIDI outputs, and each named knob's role in its block - resolved once.
  const outputs = resolveOutputs(entry);
  const outputRoles = new Map<string, { role: OutputRole; output: string }>();
  for (const output of outputs) {
    for (const [role, id] of Object.entries(output.knobs))
      outputRoles.set(id, { role: role as OutputRole, output: output.id });
  }

  const indices: Record<string, number> = {};
  for (const knob of knobs) {
    indices[knob.id] = positionOf(
      options.indices?.[knob.id],
      knob.options.length,
      knob.default,
    );
  }
  let brightness = brightnessOf(options.brightness);
  /** The landing's scaling, on both routes: identity at 255 (brightness.spec.ts test 4). */
  const sites = sitesFor(entry.id);
  const scaled = (lua: string): string => scaleLua(lua, brightness, sites);
  /** A PadSim at the tuner's brightness: the preview a preset shows. */
  const padSimAt = (state: PadState): SimEngine =>
    dimmed(new PadSim(state), brightness);
  /**
   * The compiled pair as it goes on the wire: a wrapped preset's outputs rewritten at the vector's
   * output knobs (change 17C, ported-midi.ts; the identity on every other preset), then its colours
   * scaled - what a preset lands and what its meters measure.
   */
  const scaledResult = <T extends { setupLua: string; timerLua: string }>(
    compiled: T,
    at: Readonly<Record<string, number>> = indices,
  ): T => {
    const result = presetWire(entry, compiled, at);
    return brightness === BRIGHTNESS_FULL
      ? result
      : {
          ...result,
          setupLua: scaled(result.setupLua),
          timerLua: scaled(result.timerLua),
        };
  };
  /** A wrapped preset (change 17C): its wire is the compiled pair through its outputs' rewrite. */
  const wrapped = isWrapped(entry);

  let destroyed = false;
  let pending: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let feed: MeterFeed = "measuring";
  let numbers = { setup: 0, timer: 0 };
  /** The last measurement that fitted, which is what the knob back-off restores. */
  let inBudget: { setup: number; timer: number } | undefined;
  /** The most recently moved knob since the last in-budget measurement. */
  let moved: { knob: PresetKnob; from: number } | undefined;
  /** A state the ladder resolved, held until the next knob moves; set only by TURN IT DOWN (TUNE-04 offers, never applies). */
  let resolved: PadState | undefined;
  let engine: SimEngine | undefined;
  /**
   * The engine most recently handed to the consumer. Ownership transfers at `onpreview`: the row holds
   * it and `SimHost` paints it, so `destroy()` never closes it; `swapEngine` closes the PREVIOUS engine
   * after the handover, so at most one live engine per tuner.
   */
  let published: SimEngine | undefined;
  /**
   * The share payload, recomputed eagerly: COPY LINK's click handler may contain no `await` before
   * `navigator.clipboard.writeText` (Safari expires the activation), and `encodeFor` never crosses the WASM boundary.
   */
  let payload: string | undefined;
  /**
   * The forecast's memo, keyed on the index vector; a vector's cost is pure, so a hit never goes stale.
   * At the cap the whole memo is dropped rather than evicted one entry at a time.
   */
  const forecasts = new Map<string, { setup: number; timer: number }>();
  const FORECAST_MEMO_MAX = 512;
  /** The debounce for a MISS; a hit does not use it (`forecast` below). */
  let forecastPending: ReturnType<typeof setTimeout> | undefined;
  /** What was last asked for, so a late answer to an old hover is dropped. */
  let forecastAsk: string | undefined;

  const stale = (mine: number) => destroyed || mine !== generation;

  function stateOf(at: Readonly<Record<string, number>>): PadState {
    // RESET ALL lands on the card AS PUBLISHED, shelf card and all - see
    // state.ts's resetAll for why the preset field is load-bearing.
    if (tuned.every((knob) => at[knob.id] === knob.default)) {
      return resetAll(entry);
    }
    let state = baseStateFor(entry);
    for (const knob of tuned) state = applyKnob(state, knob, at[knob.id]);
    return state;
  }

  const stateNow = (): PadState => resolved ?? stateOf(indices);

  /** One index vector, as a memo key. The knob order is the rack's. */
  const vectorKey = (at: Readonly<Record<string, number>>): string =>
    knobs.map((knob) => at[knob.id]).join(",");

  /**
   * The forecast's one measurement, and it is `cost()`, never `fit()`: one compile and one measurement,
   * then free from the memo, where `fit()` is N+1 minifier calls (model.spec.ts holds `fitState` to its
   * single call site inside `needsLadder`'s branch). Both routes measure exactly what `land()` measures
   * for the same vector, so a forecast and the landing that follows it cannot disagree.
   */
  async function costFor(
    at: Readonly<Record<string, number>>,
  ): Promise<{ setup: number; timer: number } | undefined> {
    const key = vectorKey(at);
    const hit = forecasts.get(key);
    if (hit) return hit;
    let measured: { setup: number; timer: number };
    if (entry.preview === "lua") {
      // Dynamic, never static. See the module comment.
      const { renderLua } = await import("../sim/lua-pad-sim");
      const lua = renderLua(entry, at);
      measured = {
        setup: lua.setup === "" ? 0 : await measureLua(scaled(lua.setup)),
        timer: lua.timer === "" ? 0 : await measureLua(scaled(lua.timer)),
      };
    } else {
      const cost = await costOf(
        scaledResult(await compileState(stateOf(at)), at),
        options.reserved,
      );
      measured = { setup: cost.setup.used, timer: cost.timer.used };
    }
    if (destroyed) return undefined;
    if (forecasts.size >= FORECAST_MEMO_MAX) forecasts.clear();
    forecasts.set(key, measured);
    return measured;
  }

  function clearForecast(): void {
    if (typeof forecastPending !== "undefined") clearTimeout(forecastPending);
    forecastPending = undefined;
    if (forecastAsk === undefined) return;
    forecastAsk = undefined;
    options.onforecast?.(undefined);
  }

  /** The candidate vector one choice would make, or undefined if it is not one. */
  function candidateOf(
    knobId: string,
    position: number,
  ): Readonly<Record<string, number>> | undefined {
    const knob = knobs.find((each) => each.id === knobId);
    if (!knob) return undefined;
    if (!Number.isInteger(position)) return undefined;
    if (position < 0 || position >= knob.options.length) return undefined;
    return { ...indices, [knobId]: position };
  }

  async function publishForecast(
    knobId: string,
    position: number,
    ask: string,
    candidate: Readonly<Record<string, number>>,
  ): Promise<void> {
    const now = await costFor(indices);
    const next = await costFor(candidate);
    // The hover moved on, the knobs moved, or the tuner is gone. A forecast
    // that lands after any of those is an answer to a question nobody is
    // still asking.
    if (destroyed || forecastAsk !== ask || !now || !next) return;
    options.onforecast?.({
      knobId,
      position,
      setup: next.setup,
      timer: next.timer,
      setupDelta: next.setup - now.setup,
      timerDelta: next.timer - now.timer,
    });
  }

  function emit(): void {
    if (destroyed) return;
    payload = encodeFor(entry, indices);
    options.onview({
      entryId: entry.id,
      knobs: knobViews(knobs, indices, outputRoles),
      setup: meterView("setup", numbers.setup, feed),
      timer: meterView("timer", numbers.timer, feed),
      brightness,
      rollable: entry.rollable !== false,
      // The knobs the preview cannot honour (change 8): held at `previewIndex` by createLuaPadSim,
      // named here so the inspector says so; empty everywhere the preview shows the chosen position.
      previewHeld: entry.knobs
        .filter(
          (knob) =>
            knob.previewIndex !== undefined &&
            indices[knob.id] !== knob.previewIndex,
        )
        .map((knob) => knob.id),
      outputs,
    });
  }

  function swapEngine(next: SimEngine): void {
    const previous = engine;
    engine = next;
    options.onpreview(next);
    published = next;
    // After the handover, never before: the consumer swaps synchronously inside
    // onpreview, so by this line nothing is painting the old one.
    if (previous !== next) closeEngine(previous);
  }

  /**
   * A landing publishes the numbers AND the strings they were measured from, from one call; the set is
   * a parameter, so no path can publish numbers without the bytes behind them (D-17).
   */
  function land(setup: number, timer: number, config: ConfigStrings): void {
    numbers = { setup, timer };
    feed = "settled";
    emit();
    options.onconfig?.(config);
  }

  function overView(
    events: OverBudgetView["events"],
    cost: PadCost,
    plan: FitPlan,
  ): OverBudgetView {
    const setupBy = -cost.setup.free;
    const timerBy = -cost.timer.free;
    const event = worstEvent(events);
    const word = eventWord(event);
    const by = event === "setup" ? setupBy : timerBy;
    const culprit = moved;
    const step = plan.steps[0];

    const line = culprit
      ? events === "both"
        ? overBudgetKnobBoth(culprit.knob.label, setupBy, timerBy)
        : overBudgetKnob(culprit.knob.label, word, by)
      : events === "both"
        ? overBudgetArrivedBoth(setupBy, timerBy)
        : overBudgetArrived(word, by);

    // The back-off in one order: the visitor's own knob back if there is one and a number to put it
    // back to, else the compiler's first step; nothing when fit() is blocked and no knob moved.
    const at = event === "setup" ? inBudget?.setup : inBudget?.timer;
    const saved = event === "setup" ? step?.saves.setup : step?.saves.timer;
    const backOff =
      culprit && typeof at === "number"
        ? backOffKnob(culprit.knob.label, word, at)
        : step
          ? backOffLadder(step.label, word, by + 908 - (saved ?? 0))
          : "";

    return {
      events,
      line,
      backOff,
      reason: tryOnBudgetReason(budgetWord(events)),
      live: liveOverBudget(word, by, culprit?.knob.label),
      apply(): void {
        if (destroyed) return;
        if (culprit && typeof at === "number") {
          set(culprit.knob.id, culprit.from);
          return;
        }
        if (!step) return;
        resolved = step.apply(stateNow());
        moved = undefined;
        feed = "stale";
        // The same rule as moveTo's: the strings stop being true here.
        options.onconfig?.(undefined);
        emit();
        swapEngine(padSimAt(resolved));
        schedule();
      },
    };
  }

  function report(cost: PadCost, plan: FitPlan): void {
    if (destroyed) return;
    const step = plan.steps[0];
    options.onladder(
      step
        ? {
            label: step.label,
            line: ladderLine(plan.steps.length, step.label),
            saves: { setup: step.saves.setup, timer: step.saves.timer },
          }
        : undefined,
    );
    const events = eventsOver(cost);
    options.onover(events ? overView(events, cost, plan) : undefined);
  }

  /**
   * What the compiler's ladder must hold back for: the caller's reserve, plus - on a wrapped preset
   * (change 17C) - what the outputs' rewrite adds to this state's compile, measured (the wire's cost
   * less the bare compile's). The ladder plans over the vendored compile, so the rewrite is a reserve
   * to it: its steps' numbers and its resolved state are then the wire's.
   */
  async function ladderReserve(
    state: PadState,
  ): Promise<PadReserved | undefined> {
    if (!wrapped) return options.reserved;
    const compiled = await compileState(state);
    const bare = await costOf(compiled);
    const wire = await costOf(presetWire(entry, compiled, indices));
    const base = options.reserved ?? { setup: 0, timer: 0 };
    return {
      setup: base.setup + wire.setup.used - bare.setup.used,
      timer: base.timer + wire.timer.used - bare.timer.used,
    };
  }

  /**
   * The ladder, and the ONE call site of fitState in the tuning model: the debounced measurement and
   * SURPRISE ME's exhausted roll both come through here. The guard is the last statement before the call.
   */
  async function ladderFor(
    state: PadState,
    measured: PadCost,
  ): Promise<FitPlan | undefined> {
    if (!needsLadder(measured)) return undefined;
    const reserved = await ladderReserve(state);
    return await fitState(state, {
      reserved,
      pinned: moved?.knob.sheet as PadSheet | undefined,
    });
  }

  async function measurePadsim(mine: number): Promise<void> {
    const state = stateNow();
    // The compile is already in hand: what costOf measured is what is
    // published, from the same result, never a second compile. Scaled to
    // the brightness first, so the numbers are the landed strings' own.
    const result = scaledResult(await compileState(state));
    const measured = await costOf(result, options.reserved);
    if (stale(mine)) return;
    // A preset lands the library's two halves since 12.1-08b, as the Lua route does: its state carries
    // `touchLibrary`, so the compiled handler calls K, G and N on the module.
    land(measured.setup.used, measured.timer.used, {
      systemTimer: landedSystemTimer,
      system: landedSystem,
      systemUtility,
      setup: result.setupLua,
      timer: result.timerLua,
    });
    const plan = await ladderFor(state, measured);
    if (stale(mine)) return;
    if (plan) {
      report(measured, plan);
      return;
    }
    inBudget = numbers;
    moved = undefined;
    options.onladder(undefined);
    options.onover(undefined);
  }

  async function measureLuaRoute(mine: number): Promise<void> {
    // Dynamic, never static. See the module comment.
    const { renderLua } = await import("../sim/lua-pad-sim");
    // A hand-authored entry's page init is the touch library (12-07) and its system timer the library's
    // second half (12.1-07): one library over two slots, 255/0 arming 255/6 with `self:tim()`.
    const rendered = renderLua(entry, indices);
    // The colours scaled to the brightness: the identity at 255.
    const lua = {
      setup: scaled(rendered.setup),
      timer: scaled(rendered.timer),
    };
    // An empty Timer is a TRUE measurement of zero, not a dead meter: MORPH
    // ships one, and 0 / 908 tells the visitor something real.
    const setup = lua.setup === "" ? 0 : await measureLua(lua.setup);
    const timer = lua.timer === "" ? 0 : await measureLua(lua.timer);
    if (stale(mine)) return;
    // renderLua produced exactly the wire text, scaled.
    land(setup, timer, {
      systemTimer: landedSystemTimer,
      system: landedSystem,
      systemUtility,
      setup: lua.setup,
      timer: lua.timer,
    });
  }

  async function run(rebuild: boolean): Promise<void> {
    const mine = ++generation;
    if (entry.preview === "lua") {
      if (rebuild) {
        const next = await createEngine(entry, indices, brightness);
        if (stale(mine)) {
          closeEngine(next);
          return;
        }
        swapEngine(next);
      }
      await measureLuaRoute(mine);
      // D-10: a Lua entry's whole knob cross-product was proven in budget at
      // build time. There is no runtime ladder and no partial state to trim, so
      // neither callback is reached at all rather than reached with nothing.
      return;
    }
    await measurePadsim(mine);
  }

  function schedule(rebuild = true): void {
    if (typeof pending !== "undefined") clearTimeout(pending);
    pending = setTimeout(() => {
      pending = undefined;
      void run(rebuild);
    }, COMPILE_DEBOUNCE_MS);
  }

  /** Everything a knob move does, once, for both routes. */
  function moveTo(next: Readonly<Record<string, number>>): void {
    for (const knob of knobs) indices[knob.id] = next[knob.id];
    resolved = undefined;
    // The forecast was "what would this cost INSTEAD of where you are", and
    // the visitor has just moved. Withdrawn on the same tick as the strings,
    // for the same reason: a delta measured against the previous vector is a
    // wrong number, not a stale one. The memo is kept - a vector's cost does
    // not change - so hovering back costs nothing.
    clearForecast();
    // Anything already in flight is now measuring a state nobody asked for.
    generation++;
    if (feed !== "measuring") feed = "stale";
    // The strings are withdrawn here, on the same tick as the feed goes stale and before the trailing
    // compile can land (07-RESEARCH Pitfall 5): the install store's `config` is undefined for the 120 ms
    // window, the primary control is disabled in the meters' measuring language, and the next defined
    // pair is the one land() publishes beside the new numbers. Unconditional on purpose.
    options.onconfig?.(undefined);
    emit();
    if (entry.preview === "padsim") {
      // The whole of D-05: a new picture on this tick, a new number later.
      swapEngine(padSimAt(stateNow()));
    }
    schedule();
  }

  /**
   * The brightness moves: every string goes stale on this tick (moveTo's rule), the forecast memo
   * is dropped (a vector's cost is pure at ONE brightness), a preset repaints through the dimmed
   * engine now, and the Lua route rebuilds its VM on the scaled bytes at the debounce.
   */
  function setBrightness(next: number): void {
    if (destroyed || !isBrightness(next) || next === brightness) return;
    brightness = next;
    forecasts.clear();
    clearForecast();
    generation++;
    if (feed !== "measuring") feed = "stale";
    options.onconfig?.(undefined);
    emit();
    if (entry.preview === "padsim") swapEngine(padSimAt(stateNow()));
    schedule();
  }

  function set(knobId: string, index: number): void {
    if (destroyed) return;
    const knob = knobs.find((each) => each.id === knobId);
    if (!knob) return;
    const next = positionOf(index, knob.options.length, indices[knobId]);
    if (next === indices[knobId]) return;
    const owner = tuned.find((each) => each.id === knobId);
    if (owner) moved = { knob: owner, from: indices[knobId] };
    moveTo({ ...indices, [knobId]: next });
  }

  emit();
  if (entry.preview === "lua") {
    swapEngine(await createEngine(entry, indices, brightness));
  } else {
    swapEngine(padSimAt(stateNow()));
  }
  // Not debounced: the first measurement has nothing to collapse.
  void run(false);

  return {
    knobs,
    get indices(): Readonly<Record<string, number>> {
      return { ...indices };
    },
    set,
    /**
     * The hover path: a hit answers on a microtask; a miss waits out COMPILE_DEBOUNCE_MS (TUNE-02's
     * shape, not a second number), so a re-hover gets the fill back with no delay.
     */
    forecast(knobId: string, position: number | undefined): void {
      if (destroyed) return;
      if (position === undefined) {
        clearForecast();
        return;
      }
      const candidate = candidateOf(knobId, position);
      if (!candidate) {
        clearForecast();
        return;
      }
      const ask = `${knobId}:${position}:${vectorKey(indices)}`;
      if (ask === forecastAsk) return;
      if (typeof forecastPending !== "undefined") clearTimeout(forecastPending);
      forecastPending = undefined;
      forecastAsk = ask;
      const known =
        forecasts.has(vectorKey(candidate)) &&
        forecasts.has(vectorKey(indices));
      if (known) {
        void publishForecast(knobId, position, ask, candidate);
        return;
      }
      forecastPending = setTimeout(() => {
        forecastPending = undefined;
        void publishForecast(knobId, position, ask, candidate);
      }, COMPILE_DEBOUNCE_MS);
    },
    reset(knobId: string): void {
      const knob = knobs.find((each) => each.id === knobId);
      if (knob) set(knobId, knob.default);
    },
    resetAll(): void {
      if (destroyed) return;
      const next: Record<string, number> = {};
      for (const knob of knobs) next[knob.id] = knob.default;
      moved = undefined;
      // Reset settings puts the brightness back with the knobs: one move, one recompile.
      if (brightness !== BRIGHTNESS_FULL) {
        brightness = BRIGHTNESS_FULL;
        forecasts.clear();
      }
      moveTo(next);
    },
    restore(next: Readonly<Record<string, number>>): void {
      if (destroyed) return;
      const positions: Record<string, number> = {};
      for (const knob of knobs) {
        positions[knob.id] = positionOf(
          next[knob.id],
          knob.options.length,
          knob.default,
        );
      }
      moved = undefined;
      moveTo(positions);
    },
    async surprise(
      held?: ReadonlySet<string>,
    ): Promise<Readonly<Record<string, number>> | undefined> {
      if (destroyed) return undefined;
      // The gate FIRST, through HANGAR's own surface, so the synchronous
      // predicate below cannot observe an uninitialised formatter.
      await padReady();
      if (destroyed) return undefined;
      // The vector Undo randomize restores: a COPY, taken after the gate so
      // it is the state the draw actually replaced, and before moveTo.
      const before: Readonly<Record<string, number>> = { ...indices };
      const reserved = options.reserved;
      // `held` is read and dropped: `payload` is encodeFor(entry, indices) and there is no third
      // argument for a lock to travel in - T1's ephemerality is structural.
      const drawn = surpriseIndices(
        knobs,
        indices,
        (candidate) =>
          // A Lua entry fits by construction (Phase 8 proved its whole knob
          // cross-product in budget), so its roll is one pass.
          entry.preview === "lua"
            ? true
            : fitsAfterGate(stateOf(candidate), reserved, (compiled) =>
                presetWire(entry, compiled, candidate),
              ),
        Math.random,
        held,
      );
      // surpriseIndices signals exhaustion by returning the previous indices
      // unchanged; the ladder fallback is this caller's job, because this is
      // the half that has fitState.
      const exhausted = knobs.every(
        (knob) => drawn[knob.id] === indices[knob.id],
      );
      // The one exhaustion that is not a compiler failure: with every rollable knob held the roll cannot
      // move anything and the ladder has nothing to resolve. The region disables Randomize in exactly
      // this state; the guard is here so a caller that does not cannot make a lock silently turn a knob down.
      const inScope = rollable(knobs);
      const allHeld =
        inScope.length === 0 ||
        (held !== undefined && inScope.every((knob) => held.has(knob.id)));
      moved = undefined;
      moveTo(drawn);
      if (!exhausted || allHeld || entry.preview === "lua") return before;
      if (knobs.length === 0) return before;
      // The UI spec's rule: Randomize has no failure state, so an exhausted
      // roll applies the ladder-resolved state rather than landing over budget.
      const state = stateNow();
      const measured = await costOf(
        presetWire(entry, await compileState(state), indices),
        reserved,
      );
      if (destroyed) return undefined;
      const plan = await ladderFor(state, measured);
      if (destroyed) return undefined;
      if (!plan?.resolved) return before;
      resolved = plan.resolved;
      emit();
      swapEngine(padSimAt(resolved));
      schedule();
      return before;
    },
    stamp(): string | undefined {
      // Already computed - see `payload` above. Undefined at the defaults,
      // because a URL with no fragment IS the base configuration.
      return payload;
    },
    get brightness(): number {
      return brightness;
    },
    setBrightness,
    destroy(): void {
      destroyed = true;
      if (typeof pending !== "undefined") clearTimeout(pending);
      pending = undefined;
      // The forecast's timer is the second one this module owns, so it is the
      // second one destroy() has to leave nothing behind of.
      if (typeof forecastPending !== "undefined") clearTimeout(forecastPending);
      forecastPending = undefined;
      forecastAsk = undefined;
      // Only an engine the consumer has never seen. See `published`.
      if (engine !== published) closeEngine(engine);
      engine = undefined;
    },
  };
}
