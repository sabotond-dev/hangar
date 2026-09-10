// The tuning model: descriptors, indices, the immediate preview, the debounced
// compile, the two meters, the fit-ladder line and the over-budget block.
//
// D-18: THIS MODULE IS REACHED ONLY THROUGH `await import("$lib/tune/model")`.
// It imports the vendored compiler and `$lib/pad`, and NOTHING under
// `src/lib/ui/` may name it in a static import - not even `import type`.
// `src/lib/config-shape.spec.ts` test 13 is what enforces that: it strips
// comments from every non-spec file under `src/lib/ui/` and fails on any
// `from "..."` specifier containing `vendor`, `intechstudio` or `lib/pad`,
// matching the SPECIFIER TEXT rather than the binding, so a type-only import
// fails it exactly as a value import would. The module a component may name
// instead is `src/lib/tune/view.ts`, which imports nothing at all and carries
// the types, the widget rule and the meter arithmetic.
//
// THE PADSIM PREVIEW IS BUILT HERE, from `../../vendor/botor/pad-sim`, and that
// is the one place this module reaches past `$lib/pad`. Two deliberate absences
// meet at this line and neither is a gap to route around:
//
//   - `src/lib/pad/index.ts` re-exports only the MEASURING surface, all of it
//     behind `padReady()`. It does not re-export `PadSim`, because `PadSim`
//     takes a `PadState` and never Lua and must never wait on 628 KB of WASM to
//     draw a frame.
//   - `createEngine` (`src/lib/sim/engine.ts:95-96`) deliberately IGNORES
//     compiler knobs. A padsim entry's knobs move a `PadState`, which is this
//     phase's job, so `createEngine` refuses to half-apply them.
//
// So the immediate-preview route constructs its own `PadSim` from the applied
// state. `src/lib/sim/engine.ts:42` already imports that exact specifier
// statically, so this is the house pattern rather than a new one, and it is NOT
// the Lua VM - `src/lib/sim/lazy.spec.ts` guards `wasmoon`, not `pad-sim`. It
// costs Phase 4's chunk guards nothing either: `model.ts` is never statically
// imported from `src/lib/ui/`, the UI reaches it through a dynamic import that
// gets its own chunk and is not preloaded, so `config-shape.spec.ts` tests 13
// and 14 stay green with this import in place.
//
// THE LUA WRAPPER IS IMPORTED DYNAMICALLY, for the reason `engine.ts` states in
// full: a static `from "../sim/lua-pad-sim"` would put the Lua VM's module
// graph - and with it the fingerprinted glue.wasm URL - into this module's
// chunk, for a route most visitors never take.
//
// THE ONE SYNCHRONOUS MEASUREMENT, and why it exists. `surpriseIndices` takes a
// SYNCHRONOUS `fits` predicate, because a bounded re-roll cannot be written
// against an async one without either duplicating the bound in two files or
// making the roll unbounded in time. `$lib/pad`'s surface is async by
// construction - every entry point awaits the FOUND-05 gate - so `surprise()`
// awaits `padReady()` FIRST, through that same surface, and only then calls the
// vendored `compile`/`fits` synchronously inside the predicate. The gate's
// invariant is untouched: nothing measures before the formatter is initialised.
// `fitsAfterGate` below is the only place in HANGAR that calls a vendored
// measuring function without an await in front of it, and its name is the
// precondition.
//
// NOTHING HERE GOES INTO A SVELTE RUNE. This module returns plain objects and
// plain engines. A component may put the VIEW in a rune because it is scalars
// and strings; the engine it receives goes straight to `SimHost` and never into
// `$state`.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  compile as vendorCompile,
  fits as vendorFits,
  type FitPlan,
  type PadCost,
  type PadReserved,
  type PadSheet,
  type PadState,
} from "../../vendor/botor/_pad";
import { PadSim } from "../../vendor/botor/pad-sim";
import { byId, type CatalogEntry } from "../catalog";
import { compileState, costOf, fitState, measureLua, padReady } from "../pad";
import { compilerKnobs, encodeFor, stampKnobs } from "../share/stamp";
import { createEngine, type SimEngine } from "../sim/engine";
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
import { applyKnob, baseStateFor, resetAll } from "./state";
import { surpriseIndices } from "./surprise";
import {
  integerReadout,
  isColourLattice,
  meterView,
  positionText,
  railSkin,
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
 * The recompile debounce.
 *
 * MEASURED, not guessed: `compile() + cost()` is 1.1-4.0 ms in node
 * (starfield 1.13, pinwheel 1.15, faders 1.73, radar 1.87, joystick 2.23,
 * dial 2.54, aurora 2.79, ninepads 2.81, tpad 3.99) and `cost()` crosses the
 * WASM boundary twice. A slider drag emits thirty changes a second; this
 * collapses one into one compile and is generous. The PREVIEW is not debounced
 * at all - `PadSim` takes a `PadState` and rebuilds in microseconds (D-05,
 * D-06).
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
 * What a choice WOULD cost, published before it is made (TUNE-02, T2).
 *
 * Both events, because the rack has two meters and each draws its own ghost,
 * and both deltas, because a signed number is the only form in which "what
 * would this cost" is answerable in one glance. The deltas are measured
 * against the SAME function that measured the forecast - never against the
 * published meter numbers - so a Lua entry's forecast is never a compiler
 * measurement minus a minifier one.
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
   * The roll. `held` names the knobs the visitor has locked (T1) and is the
   * caller's ephemeral state - the tuner never stores it, so it can never
   * reach `encodeFor` and the stamp is a function of the indices alone.
   */
  surprise(held?: ReadonlySet<string>): Promise<void>;
  /** Undefined at the defaults: a URL with no fragment IS the base configuration. */
  stamp(): string | undefined;
  destroy(): void;
};

/**
 * The exact bytes a write would put on the wire, beside the numbers that
 * measured them (07-CONTEXT D-17).
 *
 * D-10's pin, and why these are never compressed on the way out. `cost()`
 * budgets each event as `Math.max(measure(lua), lua.length) + reserved`, and
 * the uncompressed figure is the larger by exactly one character per action -
 * the space after each `]]` the minifier deletes. So with the shipped reserve
 * of 0 / 0, `setup.length === cost().setup.used` for every preset, both events,
 * zero mismatches (07-RESEARCH, the measurement that pins D-10;
 * src/lib/device/wire-pin.spec.ts holds it across every catalog entry). The
 * strings therefore go on the wire verbatim: the written length IS the meter,
 * and the module's own compressed-length check has one character of slack per
 * action. A Lua entry's rendered text is already a fixed point of the
 * compressor (lua-entries.sweep.spec.ts test 1), so both routes agree.
 */
/**
 * `system` IS NOT METERED AND DOES NOT MOVE WITH A KNOB (Phase 12, 12-03). It
 * is the string the page-init slot (element 255, event 0) is written with, and
 * it is published beside the pair so that the install store has one wire shape
 * for every entry: a preset TRY after a Lua TRY then leaves the module holding
 * what the screen shows, rather than a preset pair sitting on top of the
 * previous entry's library.
 *
 * SINCE 12-07 ITS VALUE DIFFERS BY ENTRY, and this is the type that carries the
 * difference. A hand-authored entry lands `TOUCH_LIBRARY`
 * (`src/lib/catalog/library.ts`), because from 12-08 on its Setup calls that
 * library by name and a module without it would raise on the first finger. A
 * preset lands whatever `systemSetup` said, which is the EMPTY STRING when the
 * caller named none - NOT the firmware default, because this module may not
 * know one: `src/lib/tune/ladder.spec.ts:275` refuses `lib/protocol` to every
 * file under `src/lib/tune/`, and a firmware default is a wire fact. The
 * substitution to `SYSTEM_DEFAULT_SETUP` happens in exactly one place on the
 * other side of that line, `install.svelte.ts`'s `#pageInit`, and 12-03's
 * install.spec.ts is where it is proved.
 *
 * It is NOT part of the 908 budget either: the two meters measure the touch
 * element's two events, which are what the visitor's knobs move.
 */
export type ConfigStrings = {
  readonly system: string;
  readonly setup: string;
  readonly timer: string;
};

export type TunerOptions = {
  entryId: string;
  indices?: Readonly<Record<string, number>>;
  /** Phase 7's install marker, and the only way a test or /dev/tune/ reaches over budget. */
  reserved?: PadReserved;
  onview(view: TuneView): void;
  onpreview(engine: SimEngine): void;
  onladder(ladder: LadderView | undefined): void;
  onover(over: OverBudgetView | undefined): void;
  /**
   * The compiled pair, emitted with every settled measurement, and UNDEFINED
   * the instant the feed goes stale - which is what makes "the debounce cannot
   * land a new compile between the click and the write" a structural property
   * rather than a race (07-RESEARCH Pitfall 5). Optional, so every existing
   * caller and every existing test is unchanged.
   */
  onconfig?(config: ConfigStrings | undefined): void;
  /**
   * THE PAGE-INIT STRING THIS ENTRY WANTS (element 255, event 0), published
   * verbatim on every landing and metered by nothing.
   *
   * ABSENT MEANS "this entry has no page init of its own", and the empty
   * string is what gets published - NOT the firmware default, because THIS
   * MODULE MAY NOT KNOW IT. `src/lib/tune/ladder.spec.ts:275` scans every file
   * under `src/lib/tune/`, comment-stripped, for `lib/protocol`,
   * `lib/transport`, `lib/device` and the transport write, and asserts the
   * offender list is empty - the structural half of "nothing in the tuning
   * model can reach a port". A firmware default is a wire fact and it lives
   * behind that line; `src/lib/device/install.svelte.ts`, which already
   * resolves the protocol module lazily inside an action, substitutes its own
   * `SYSTEM_DEFAULT_SETUP` for an empty string before any write, in ONE place.
   *
   * SINCE 12-07 THE LUA ROUTE NO LONGER NEEDS THIS OPTION and no longer
   * publishes the empty string: `measureLuaRoute` lands the touch library for
   * every hand-authored entry, so the substitution above stops firing for them.
   * The option stays, and it still WINS where it is given, because
   * `/dev/install/`'s third textarea is the site's only route for pasting an
   * arbitrary page init at a module and 12-03 built it to be exactly that.
   */
  systemSetup?: string;
  /**
   * The forecast, or `undefined` the moment it is withdrawn or invalidated.
   * Optional, so every existing caller and every existing test is unchanged.
   */
  onforecast?(forecast: ForecastView | undefined): void;
};

/**
 * The single decision point for whether the ladder runs at all.
 *
 * `fit()` compiles once per ladder step, so it is N+1 minifier calls and must
 * never run on a knob change. Per the phase's headline finding it is also never
 * true in practice - 16,645 reachable states, zero over 908 - which is exactly
 * why the branch has to be one named function with one call site rather than a
 * condition repeated wherever it felt convenient.
 */
export function needsLadder(cost: PadCost): boolean {
  return !cost.fits;
}

/**
 * The synchronous fit test, and the ONE place HANGAR calls a vendored measuring
 * function without an await in front of it.
 *
 * PRECONDITION: `padReady()` has already resolved. Every caller below awaits it
 * through `$lib/pad` first. See the module comment for why a synchronous
 * predicate is required at all.
 */
function fitsAfterGate(state: PadState, reserved: PadReserved | undefined) {
  return vendorFits(vendorCompile(state), reserved);
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
 * One option, resolved for display. TOTAL, in the same sense `widgetFor` is:
 * a word if the kind has one, a swatch name if it is a colour, the raw integer
 * if every option on the knob is one, and a position otherwise. Never a Lua
 * literal that a visitor would have to decode.
 */
function valueView(
  kind: KnobKindName,
  widget: KnobWidget,
  options: readonly string[],
  index: number,
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
  const word = wordFor(kind, literal);
  if (typeof word === "string") return { label: word };
  const integer = integerReadout(options, index);
  return { label: integer ?? positionText(index, count) };
}

/**
 * The 4,096 resolved colour views, built ONCE and shared.
 *
 * THE WINDOW IS GONE AND THIS IS WHAT REPLACES IT (plan 10-10). Between 10-08
 * and 10-10 a lattice colour knob was shown as a two-swatch WINDOW - where the
 * card ships and where the visitor is - because `Knob.svelte`'s swatch row
 * draws one element per option and 4,096 radio inputs was not a slow row but a
 * broken panel: measured on /dev/tune/, the row overflowed and intercepted the
 * pointer events of RESET ALL, SURPRISE ME and COPY LINK, and thirteen of the
 * twenty tuning e2e tests went red. `ColourPicker.svelte` draws forty-eight
 * detents instead of 4,096 options, so the window and `KnobView.positions` and
 * `SWATCH_ROW_MAX` all went with it.
 *
 * What did NOT go away is the cost of MATERIALISING 4,096 views, and that is
 * why this is a module-scope cache rather than a map inside `knobViews`. Every
 * colour-bearing preset offers the same 4,096 literals in the same order
 * (`knobs.preset.ts` builds them once from `colourAt`), so the resolved views
 * are the same list too - and resolving them per emit would run `swatchName`'s
 * HSL arithmetic 4,096 times on every knob turn, inside a debounce window
 * whose whole purpose is to keep a drag cheap.
 */
let latticeViews: readonly KnobValueView[] | undefined;

function colourViews(options: readonly string[]): readonly KnobValueView[] {
  latticeViews ??= Object.freeze(
    options.map((_, at) => valueView("colour", "colour", options, at)),
  );
  return latticeViews;
}

function knobViews(
  knobs: readonly KnobDescriptor[],
  indices: Readonly<Record<string, number>>,
): readonly KnobView[] {
  return knobs.map((knob) => {
    const widget = widgetFor(knob.kind, knob.options);
    const index = indices[knob.id];
    const head = {
      id: knob.id,
      label: knob.label,
      kind: knob.kind,
      widget,
      skin: widget === "rail" ? railSkin(knob.options.length) : undefined,
      readout: integerReadout(knob.options, index),
    };
    return {
      ...head,
      // The lattice's 4,096 come from the shared cache; every other knob
      // resolves its own handful. See `colourViews`.
      values:
        widget === "colour" && isColourLattice(knob.options)
          ? colourViews(knob.options)
          : knob.options.map((_, at) =>
              valueView(knob.kind, widget, knob.options, at),
            ),
      index,
      default: knob.default,
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

/** The entry, or a named throw. The closures below need a narrowed local. */
function entryFor(id: string): CatalogEntry {
  const found = byId(id);
  if (!found) throw new Error(`no catalog entry with the id "${id}"`);
  return found;
}

export async function buildTuner(options: TunerOptions): Promise<Tuner> {
  const entry = entryFor(options.entryId);

  // THE PAGE-INIT STRING THIS ENTRY WANTS, or the empty string meaning "none
  // of its own". Read once, here, so `land()` stays SYNCHRONOUS - putting a
  // real asynchronous boundary in the middle of a landing stops the preset
  // route landing at all under the fixed microtask hops model.spec.ts and
  // wire-pin.spec.ts wait on, which is measured rather than guessed.
  const system = options.systemSetup ?? "";

  // The two routes, resolved once, THROUGH THE STAMP'S OWN RESOLVERS. A
  // `state`-kind source is compiler driven and has no descriptor table of its
  // own, so it exposes no knobs and still gets both meters - a true answer
  // rather than an invented rack.
  //
  // These two calls used to be inline. They are the stamp module's now because
  // `encodeFor` has to encode against EXACTLY the knobs the rack shows, in the
  // same order: two copies of the rule agreeing today is not the same property
  // as one copy that cannot disagree.
  const tuned: readonly PresetKnob[] = compilerKnobs(entry);
  const knobs: readonly KnobDescriptor[] = stampKnobs(entry);

  const indices: Record<string, number> = {};
  for (const knob of knobs) {
    indices[knob.id] = positionOf(
      options.indices?.[knob.id],
      knob.options.length,
      knob.default,
    );
  }

  let destroyed = false;
  let pending: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let feed: MeterFeed = "measuring";
  let numbers = { setup: 0, timer: 0 };
  /** The last measurement that fitted, which is what the knob back-off restores. */
  let inBudget: { setup: number; timer: number } | undefined;
  /** The most recently moved knob since the last in-budget measurement. */
  let moved: { knob: PresetKnob; from: number } | undefined;
  /**
   * A state the ladder resolved, held until the next knob moves.
   *
   * TUNE-04 offers and never applies, so this is only ever set by the visitor
   * clicking TURN IT DOWN. Everything else derives the state from the indices,
   * which is the property that keeps the preview showing exactly what the knobs
   * describe.
   */
  let resolved: PadState | undefined;
  let engine: SimEngine | undefined;
  /**
   * The engine most recently handed to the consumer. OWNERSHIP TRANSFERS AT
   * `onpreview`: from that moment the row holds it in its session engines map
   * and `SimHost` is painting it, so `destroy()` closing it would blank a live
   * pad. On a Lua detail page whose row is one entry, that pad is the only one
   * there (05.1-CONTEXT D-18).
   *
   * `swapEngine` already closes the PREVIOUS engine after the handover, so
   * nothing leaks: at most one live engine per tuner, and it is the one the row
   * is using. The engine `destroy()` may still close is the other kind - one
   * built for a measurement that went stale before it was ever published.
   */
  let published: SimEngine | undefined;
  /**
   * The share payload, RECOMPUTED EAGERLY rather than on demand.
   *
   * That precomputation is what makes COPY LINK gesture-safe: Safari expires
   * the transient user activation across an `await`, so the click handler must
   * contain no `await` before `navigator.clipboard.writeText`. `encodeFor` is
   * pure string and state arithmetic - it never crosses the WASM boundary - so
   * recomputing it on every emit costs microseconds and removes a whole class
   * of "the copy silently did nothing on iOS" bug.
   */
  let payload: string | undefined;
  /**
   * THE FORECAST'S MEMO, keyed on the index vector.
   *
   * A vector's cost is a pure function of the vector, so a hit never goes
   * stale and never needs invalidating - which is what lets a re-hover publish
   * on the same tick rather than through the debounce. The cap exists because
   * a visitor sweeping a word row for a minute is otherwise an unbounded map;
   * at the cap the whole memo is dropped rather than evicted one entry at a
   * time, because an LRU here would be more code than the thing it protects.
   */
  const forecasts = new Map<string, { setup: number; timer: number }>();
  const FORECAST_MEMO_MAX = 512;
  /** The debounce for a MISS. A hit does not use it. See `askForecast`. */
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
   * THE FORECAST'S ONE MEASUREMENT, AND IT IS `cost()`, NEVER `fit()`.
   *
   * `fit()` compiles once per ladder step - N+1 minifier calls, roughly 4.4 ms
   * on a state that already fits - so forecasting the n options of a knob
   * through it would be n times that on a pointer path. `cost()` is one
   * compile and one measurement, 1.1-4.0 ms once and then free from the memo,
   * and it answers the only question the forecast asks: where would the two
   * numbers land. `model.spec.ts` holds `fitState` to its single call site
   * inside `needsLadder`'s branch, which is what stops this function quietly
   * acquiring a ladder later.
   *
   * Both routes measure exactly what `land()` measures for the same vector -
   * the compiler route through compileState + costOf, the Lua route through
   * renderLua + measureLua - so a forecast and the landing that follows it
   * cannot disagree.
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
        setup: lua.setup === "" ? 0 : await measureLua(lua.setup),
        timer: lua.timer === "" ? 0 : await measureLua(lua.timer),
      };
    } else {
      const cost = await costOf(
        await compileState(stateOf(at)),
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
      knobs: knobViews(knobs, indices),
      setup: meterView("setup", numbers.setup, feed),
      timer: meterView("timer", numbers.timer, feed),
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
   * A landing publishes the numbers AND the strings they were measured from,
   * in that order, from one call. The set is a parameter rather than a module
   * variable emit() could read, so no path can publish numbers without the
   * bytes behind them and no stale emit can republish an old set (D-17).
   *
   * `numbers` still carries TWO figures, and that is the point: `config.system`
   * is published on the same call and metered by nothing.
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

    // The back-off resolves in one order: put the visitor's own knob back if
    // there is a knob and a number to put it back to, else apply the compiler's
    // first step. When fit() is blocked and no knob moved there is genuinely
    // nothing to offer, and saying so with an empty control is honest where
    // inventing one would not be.
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
        swapEngine(new PadSim(resolved));
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
   * The ladder, and the ONE call site of fitState in the whole tuning model.
   *
   * Both callers - the debounced measurement and SURPRISE ME's exhausted roll -
   * come through here, because fit() compiles once per ladder step and a second
   * call site is a second N+1 minifier run nobody counted. The guard is the last
   * statement before the call for exactly that reason.
   */
  async function ladderFor(
    state: PadState,
    measured: PadCost,
  ): Promise<FitPlan | undefined> {
    if (!needsLadder(measured)) return undefined;
    return await fitState(state, {
      reserved: options.reserved,
      pinned: moved?.knob.sheet as PadSheet | undefined,
    });
  }

  async function measurePadsim(mine: number): Promise<void> {
    const state = stateNow();
    // The compile is already in hand: what costOf measured is what is
    // published, from the same result, never a second compile.
    const result = await compileState(state);
    const measured = await costOf(result, options.reserved);
    if (stale(mine)) return;
    land(measured.setup.used, measured.timer.used, {
      system,
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
    // THE PAGE INIT A HAND-AUTHORED ENTRY WANTS IS THE TOUCH LIBRARY (12-07),
    // and this is the landing where `system` first differs by entry. The preset
    // route below publishes `system` unchanged - see the note on
    // `TunerOptions.systemSetup` for why that is the empty string here and not
    // the firmware default, and where the substitution happens instead.
    //
    // Lazily imported for the same discipline as `renderLua` above, and
    // memoised by the module system, so the catalog's first paint carries none
    // of it.
    const { TOUCH_LIBRARY } = await import("../catalog/library");
    const lua = renderLua(entry, indices);
    // An empty Timer is a TRUE measurement of zero, not a dead meter: MORPH
    // ships one, and 0 / 908 tells the visitor something real.
    const setup = lua.setup === "" ? 0 : await measureLua(lua.setup);
    const timer = lua.timer === "" ? 0 : await measureLua(lua.timer);
    if (stale(mine)) return;
    // renderLua already produced exactly the wire text.
    land(setup, timer, {
      // An explicit `systemSetup` still wins: /dev/install/'s third textarea is
      // the site's only route for pasting an arbitrary page init at a module,
      // and 12-03 built it to be exactly that.
      system: system === "" ? TOUCH_LIBRARY : system,
      setup: lua.setup,
      timer: lua.timer,
    });
  }

  async function run(rebuild: boolean): Promise<void> {
    const mine = ++generation;
    if (entry.preview === "lua") {
      if (rebuild) {
        const next = await createEngine(entry, indices);
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
    // THE STRINGS ARE WITHDRAWN HERE, on the same tick as the feed goes stale
    // and before the trailing compile can land (07-RESEARCH Pitfall 5). A
    // visitor who drags a knob and clicks TRY ON DEVICE inside the 120 ms
    // window would otherwise write the previous strings under the current
    // meters. With this line the install store's `config` is undefined for
    // exactly those 120 ms, the primary control is disabled with the same
    // measuring language the meters already use, and the next defined pair is
    // the one land() publishes beside the new numbers. Unconditional on
    // purpose: while the feed is still "measuring" nothing has been published
    // yet, and undefined is already the truth.
    options.onconfig?.(undefined);
    emit();
    if (entry.preview === "padsim") {
      // The whole of D-05: a new picture on this tick, a new number later.
      swapEngine(new PadSim(stateNow()));
    }
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
    swapEngine(await createEngine(entry, indices));
  } else {
    swapEngine(new PadSim(stateNow()));
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
     * THE HOVER PATH. A hit answers on a microtask; a miss waits out the same
     * COMPILE_DEBOUNCE_MS a recompile waits, which is the debounce shape
     * TUNE-02 already uses rather than a second one with its own number.
     *
     * The asymmetry is deliberate and it is what keeps the ghost off the
     * pointer's heels: a visitor sweeping a word row schedules one compile per
     * 120 ms, and a visitor coming back to an option they have already hovered
     * gets the fill back with no delay at all.
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
      moveTo(next);
    },
    async surprise(held?: ReadonlySet<string>): Promise<void> {
      if (destroyed) return;
      // The gate FIRST, through HANGAR's own surface, so the synchronous
      // predicate below cannot observe an uninitialised formatter.
      await padReady();
      if (destroyed) return;
      const reserved = options.reserved;
      // `held` is READ AND DROPPED. It is never assigned to anything this
      // module keeps, which is what makes T1's ephemerality structural rather
      // than a promise: `payload` is computed by encodeFor(entry, indices) and
      // there is no third argument for a lock to travel in.
      const drawn = surpriseIndices(
        knobs,
        indices,
        (candidate) =>
          // A Lua entry fits by construction (Phase 8 proved its whole knob
          // cross-product in budget), so its roll is one pass.
          entry.preview === "lua"
            ? true
            : fitsAfterGate(stateOf(candidate), reserved),
        Math.random,
        held,
      );
      // surpriseIndices signals exhaustion by returning the previous indices
      // unchanged; the ladder fallback is this caller's job, because this is
      // the half that has fitState.
      const exhausted = knobs.every(
        (knob) => drawn[knob.id] === indices[knob.id],
      );
      // AND THE ONE EXHAUSTION THAT IS NOT A COMPILER FAILURE. With every knob
      // held the roll cannot move anything, so it returns the previous indices
      // for a reason that has nothing to do with 908 and the ladder has
      // nothing to resolve. The region disables SURPRISE ME in exactly this
      // state, so this guard is unreachable from the interface; it is here so
      // that a caller which does not disable the control cannot make a lock
      // silently turn a knob down.
      const allHeld =
        held !== undefined && knobs.every((knob) => held.has(knob.id));
      moved = undefined;
      moveTo(drawn);
      if (!exhausted || allHeld || entry.preview === "lua") return;
      if (knobs.length === 0) return;
      // The UI spec's rule: SURPRISE ME has no failure state, so an exhausted
      // roll applies the ladder-resolved state rather than landing over budget.
      const state = stateNow();
      const measured = await costOf(await compileState(state), reserved);
      if (destroyed) return;
      const plan = await ladderFor(state, measured);
      if (destroyed || !plan?.resolved) return;
      resolved = plan.resolved;
      emit();
      swapEngine(new PadSim(resolved));
      schedule();
    },
    stamp(): string | undefined {
      // Already computed - see `payload` above. Undefined at the defaults,
      // because a URL with no fragment IS the base configuration.
      return payload;
    },
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
